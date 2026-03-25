---
title: "索引工厂模式使用指南"
description: "索引工厂模式使用指南"
---

# 索引工厂模式使用指南

## 快速开始

### 基本用法

使用索引工厂模式创建索引非常简单，不再需要指定复杂的模板参数：

```cpp
#include "kernel/index/index_factory.h"
#include "kernel/catalog/catalog.h"

// 创建索引
auto index_info = catalog->CreateIndex(
    txn,                    // 事务
    "idx_name",            // 索引名称
    "table_name",          // 表名
    schema,                // 表模式
    key_schema,            // 键模式
    key_attrs,             // 键属性
    key_size,              // 键大小
    false,                 // 是否为主键
    IndexType::HashTableIndex  // 索引类型
);
```

### 支持的索引类型

目前支持以下索引类型：

- `IndexType::HashTableIndex` - 哈希表索引
- `IndexType::BPlusTreeIndex` - B+树索引

### 自动类型选择

工厂会根据键大小自动选择合适的模板参数：

| 键大小     | 使用的模板参数          |
|---------|------------------|
| ≤ 4 字节  | `GenericKey<4>`  |
| ≤ 8 字节  | `GenericKey<8>`  |
| ≤ 16 字节 | `GenericKey<16>` |
| ≤ 32 字节 | `GenericKey<32>` |
| > 32 字节 | `GenericKey<64>` |

## 高级用法

### 直接使用工厂

如果需要更精细的控制，可以直接使用具体的工厂类：

```cpp
// 使用哈希表工厂
HashTableIndexFactory hash_factory;
auto hash_index = hash_factory.CreateIndex(
    std::move(metadata), storage, key_schema, key_attrs, key_size, false);

// 使用B+树工厂
BPlusTreeIndexFactory btree_factory;
auto btree_index = btree_factory.CreateIndex(
    std::move(metadata), storage, key_schema, key_attrs, key_size, false);
```

### 使用工厂集合

工厂集合提供了统一的接口来管理所有索引工厂：

```cpp
IndexFactories factories;

// 创建索引
auto index = factories.CreateIndex(
    IndexType::HashTableIndex,
    std::move(metadata),
    storage,
    key_schema,
    key_attrs,
    key_size,
    is_primary_key
);
```

## 扩展新的索引类型

### 步骤1: 创建新的索引工厂

```cpp
class MyIndexFactory : public IndexFactory {
public:
    std::unique_ptr<Index> CreateIndex(
        std::unique_ptr<IndexMetadata> metadata,
        StorageInterface *storage,
        const Schema &key_schema,
        const std::vector<uint32_t> &key_attrs,
        size_t key_size,
        bool is_primary_key) override {
        
        // 实现新索引的创建逻辑
        return std::make_unique<MyIndex>(std::move(metadata), storage);
    }
};
```

### 步骤2: 添加新的索引类型

```cpp
// 在 catalog.h 中添加新的枚举值
enum class IndexType { 
    BPlusTreeIndex, 
    HashTableIndex, 
    MyIndexType  // 新增
};
```

### 步骤3: 注册新的工厂

```cpp
// 在 IndexFactories 构造函数中注册
IndexFactories::IndexFactories() {
    factories_[IndexType::HashTableIndex] = std::make_unique<HashTableIndexFactory>();
    factories_[IndexType::BPlusTreeIndex] = std::make_unique<BPlusTreeIndexFactory>();
    factories_[IndexType::MyIndexType] = std::make_unique<MyIndexFactory>();  // 新增
}
```

### 步骤4: 使用新的索引类型

```cpp
auto index_info = catalog->CreateIndex(
    txn, "idx_name", "table_name", schema, key_schema, 
    key_attrs, key_size, false, IndexType::MyIndexType);
```

## 错误处理

### 检查索引创建是否成功

```cpp
auto index_info = catalog->CreateIndex(...);
if (index_info == Catalog::NULL_INDEX_INFO) {
    // 索引创建失败
    std::cerr << "Failed to create index" << std::endl;
    return;
}
```

### 检查工厂创建是否成功

```cpp
auto index = manager.CreateIndex(...);
if (!index) {
    // 工厂创建失败
    std::cerr << "Failed to create index via factory" << std::endl;
    return;
}
```

## 性能考虑

### 工厂初始化

工厂在构造时自动初始化，避免运行时开销：

```cpp
// 在 Catalog 中使用静态实例
static IndexFactories factories;  // 静态实例，避免重复创建
```

### 内存管理

- 工厂创建的索引使用 `std::unique_ptr` 管理内存
- 索引元数据在创建时转移所有权
- 避免内存泄漏和重复释放

## 最佳实践

### 1. 选择合适的索引类型

- **哈希表索引**：适合等值查询，不支持范围查询
- **B+树索引**：适合范围查询，支持排序

### 2. 键大小优化

- 尽量使用较小的键大小以提高性能
- 避免使用过大的键大小（> 64 字节）

### 3. 主键索引

- 主键索引通常使用 B+树类型
- 确保主键的唯一性约束

### 4. 错误处理

- 始终检查索引创建是否成功
- 提供有意义的错误信息

## 示例代码

完整的示例代码请参考 `examples/index_factory_example.cpp`。

## 测试

运行单元测试：

```bash
# 编译测试
make test

# 运行索引工厂测试
./test/index_factory_test
```

## 迁移指南

### 从旧接口迁移

旧接口：

```cpp
template <class KeyType, class ValueType, class KeyComparator>
auto CreateIndex(..., HashFunction<KeyType> hash_function, ...) -> IndexInfo*;
```

新接口：

```cpp
auto CreateIndex(..., bool is_primary_key = false, 
                IndexType index_type = IndexType::HashTableIndex, ...) -> IndexInfo*;
```

### 兼容性

- 保持向后兼容
- 旧接口仍然可用
- 建议逐步迁移到新接口

## 总结

索引工厂模式提供了：

1. **简化的接口** - 不再需要复杂的模板参数
2. **统一的创建方式** - 所有索引类型使用相同的接口
3. **易于扩展** - 添加新索引类型非常简单
4. **类型安全** - 编译时类型检查
5. **性能优化** - 自动选择最优的模板参数

这个设计大大简化了索引的创建和使用，提高了代码的可维护性和扩展性。 