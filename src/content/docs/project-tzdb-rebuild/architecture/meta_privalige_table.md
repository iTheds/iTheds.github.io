---
title: "Meta Privalige Table"
description: "project-tzdb-rebuild 文档整理稿（源：raw_snapshot/docs/distribution/meta/meta_privalige_table.md）"
---

# TZDB 权限系统设计文档

## 1. 概述

TZDB 权限系统是一个基于角色的访问控制（RBAC）机制，通过系统表 `__pg_permission` 实现对数据库对象的访问控制。该系统允许管理员为不同角色分配对数据库、表和列的不同级别权限，从而实现细粒度的访问控制。

## 2. 权限表结构

权限信息存储在系统表 `__pg_permission` 中，该表在数据库初始化时自动创建。表结构如下：

| 列名 | 数据类型 | 描述 |
|------|---------|------|
| role_id | INTEGER | 角色标识符 |
| permission_type | INTEGER | 权限类型（位掩码） |
| object_type | INTEGER | 对象类型（0=数据库，1=表，2=列，3=系统） |
| object_id | INTEGER | 对象标识符（如表OID等） |

## 3. 权限类型

权限类型采用位掩码设计，允许组合多种权限：

| 权限类型 | 值 | 描述 |
|---------|-----|------|
| Select | 1 | 查询权限（DQL） |
| Insert | 2 | 插入权限（DML） |
| Update | 4 | 更新权限（DML） |
| Delete | 8 | 删除权限（DML） |
| Create | 16 | 创建权限（DDL） |
| Drop | 32 | 删除权限（DDL） |
| All | 63 | 所有权限（Select \| Insert \| Update \| Delete \| Create \| Drop） |

权限可以通过位运算组合，例如：`Select | Update = 5` 表示同时拥有查询和更新权限。

## 4. 对象类型

权限系统支持对不同类型对象的权限控制：

| 对象类型 | 值 | 描述 |
|---------|-----|------|
| Database | 0 | 数据库级别权限 |
| Table | 1 | 表级别权限 |
| Column | 2 | 列级别权限 |
| System | 3 | 系统级别权限 |

## 5. 权限检查机制

权限检查使用 `HasPermission` 辅助函数实现，该函数通过位运算检查用户是否拥有所需权限：

```cpp
inline bool HasPermission(int current_permissions, int required_permission) {
  return (current_permissions & required_permission) == required_permission;
}
```

例如，检查用户是否拥有 Select 和 Update 权限：
```cpp
bool can_select_and_update = HasPermission(user_permissions, 
    static_cast<int>(PermissionType::Select) | static_cast<int>(PermissionType::Update));
```

## 6. 系统初始化

权限表在数据库初始化过程中通过 `BootstrapSystemTablesIfNeeded` 函数创建。初始化时会创建一个占位行，确保权限表有一个有效的根页面：

```cpp
// 创建占位行以确保权限表有一个根页面
{
  const auto schema = bootstrap::PgPermissionSchema();
  TupleMeta deleted_row{0, true};
  std::vector<Value> vals;
  vals.emplace_back(Value::INTEGER(0));                                     // role_id
  vals.emplace_back(Value::INTEGER(static_cast<int32_t>(bootstrap::PermissionType::All)));  // permission_type
  vals.emplace_back(Value::INTEGER(static_cast<int32_t>(bootstrap::PermissionObjectType::Database)));  // object_type
  vals.emplace_back(Value::INTEGER(0));                                                // object_id
  Tuple tup(vals, &schema);
  (void)pg_permission_heap.InsertTuple(deleted_row, tup, nullptr, nullptr);
}
```

## 7. 权限加载

系统启动时，通过 `LoadCatalogFromSystemTables` 函数从持久化存储中加载权限信息到内存中：

```cpp
// 从TableHeap迭代器加载权限（如果权限表存在）
if (permission_root != INVALID_PAGE_ID) {
  const auto schema = bootstrap::PgPermissionSchema();
  TableHeap heap(storage, static_cast<table_id_t>(3), permission_root);
  for (auto it = heap.MakeIterator(); !it.IsEnd(); ++it) {
    auto pair = it.GetTuple();
    const TupleMeta &tm = pair.first;
    if (tm.is_deleted_) continue;
    const Tuple &tup = pair.second;
    auto role_id =
        tup.GetValue(&schema, static_cast<uint32_t>(bootstrap::PgPermissionCol::role_id)).GetValueUnsafe<int32_t>();
    auto permission_type = tup.GetValue(&schema, static_cast<uint32_t>(bootstrap::PgPermissionCol::permission_type))
                               .GetValueUnsafe<int32_t>();
    auto object_type = tup.GetValue(&schema, static_cast<uint32_t>(bootstrap::PgPermissionCol::object_type))
                           .GetValueUnsafe<int32_t>();
    auto object_id =
        tup.GetValue(&schema, static_cast<uint32_t>(bootstrap::PgPermissionCol::object_id)).GetValueUnsafe<int32_t>();

    LOG_DEBUG("[Bootstrap] Read __pg_permission: role_id=%d, permission_type=%d, object_type=%d, object_id=%d",
              role_id, permission_type, object_type, object_id);
  }
}
```

## 8. 权限使用示例

### 8.1 授予用户对表的查询权限

```cpp
// 授予角色ID为1的用户对表ID为10的查询权限
const auto schema = bootstrap::PgPermissionSchema();
TupleMeta meta_row{0, false};
std::vector<Value> vals;
vals.emplace_back(Value::INTEGER(1));  // role_id = 1
vals.emplace_back(Value::INTEGER(static_cast<int32_t>(bootstrap::PermissionType::Select)));  // 查询权限
vals.emplace_back(Value::INTEGER(static_cast<int32_t>(bootstrap::PermissionObjectType::Table)));  // 表对象
vals.emplace_back(Value::INTEGER(10));  // 表ID = 10
Tuple tup(vals, &schema);
pg_permission_heap.InsertTuple(meta_row, tup, nullptr, nullptr);
```

### 8.2 检查用户是否有权限执行操作

```cpp
// 检查角色ID为1的用户是否有权限对表ID为10执行查询操作
int user_role_id = 1;
int table_id = 10;
int required_permission = static_cast<int>(bootstrap::PermissionType::Select);

// 从权限表中查找相应权限记录
auto permission_record = FindPermissionRecord(user_role_id, 
    static_cast<int>(bootstrap::PermissionObjectType::Table), 
    table_id);

if (permission_record && 
    bootstrap::HasPermission(permission_record->permission_type, required_permission)) {
    // 用户有权限执行操作
    ExecuteQuery();
} else {
    // 拒绝访问
    ReportPermissionDenied();
}
```

## 9. 权限继承

权限系统支持层次继承。例如，如果用户对数据库有 ALL 权限，则自动对该数据库中的所有表拥有 ALL 权限，除非有明确的表级别权限覆盖。

## 10. 安全考虑

1. **权限检查时机**：在执行任何数据库操作前，应先进行权限检查。
2. **默认拒绝**：遵循"默认拒绝"原则，即除非明确授予权限，否则拒绝所有操作。
3. **系统表保护**：系统表（如 `__pg_permission`）应受到特殊保护，只有管理员角色可以修改。

## 11. 未来扩展

1. **角色表**：添加 `__pg_roles` 表存储角色信息，支持角色层次和继承。
2. **组权限**：支持将用户分组，并对组授予权限。
3. **行级安全**：实现行级安全策略，允许基于行内容控制访问。
4. **权限审计**：记录权限变更和权限检查失败的事件，用于安全审计。

## 12. 结论

TZDB 权限系统提供了灵活而强大的访问控制机制，通过基于角色的权限管理，实现了对数据库对象的细粒度保护。系统设计简洁而高效，支持位掩码权限组合，便于扩展和维护。
