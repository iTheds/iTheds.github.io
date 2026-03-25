---
title: "TZDB PostgreSQL 协议服务器实现方案"
description: "TZDB PostgreSQL 协议服务器实现方案"
---

# TZDB PostgreSQL 协议服务器实现方案

## 当前状态

截至 2026-03-03，`pgserver` 已经不再只是设计草案，当前代码库内已有可运行实现，入口为 `pg_server`。

当前已经验证通过的能力：

- `psql` 可连接 `127.0.0.1:5432`
- 启动握手支持 `StartupMessage`、`SSLRequest`、`GSSENCRequest`
- 支持简单查询协议 `Query`
- 支持扩展查询协议的最小闭环：`Parse`、`Bind`、`Execute`、`Describe`、`Flush`、`Sync`
- 支持基础 CRUD：`CREATE TABLE`、`INSERT`、`SELECT`、`UPDATE`、`DELETE`、`DROP TABLE`
- 支持事务控制的基本路径：`BEGIN`、`COMMIT`、`ROLLBACK`
- 已加入单元测试和 `psql` smoke test，并接入 CI

当前明确限制：

- 当前数据库类型系统不支持 `TEXT`，联通测试统一使用 `VARCHAR`
- prepared statement 参数替换能力仍然有限，优先保证无参扩展协议和简单查询路径
- 元数据兼容仍以 `psql` 和基础客户端为主，完整 DBeaver 生态兼容还需继续补齐

## 快速验证

启动服务：

```bash
./cmake-build-debug/bin/pg_server
```

推荐连接方式：

```bash
psql "host=127.0.0.1 port=5432 user=admin dbname=testdb sslmode=disable gssencmode=disable"
```

测试布局：

- 单元测试：`tests/pg_server_test/pg_protocol_test.cpp`
- 联通脚本：`tests/pg_server_test/pgserver_psql_smoke.sh`
- CTest 名称：`pg_server_test`、`pg_server_psql_smoke`

## 概述

本文档描述了为 TZDB 数据库实现 PostgreSQL 协议兼容层的完整方案，使得 DBeaver 等标准 PostgreSQL 客户端工具能够直接连接和管理 TZDB 数据库。

## 目标

- ✅ 支持 DBeaver 通过 PostgreSQL JDBC 驱动连接 TZDB
- ✅ 提供完整的 SQL 查询、数据编辑、事务管理功能
- ✅ 支持元数据查询（表、列、索引等）
- ✅ 保持与现有 TZDB 架构的兼容性
- ✅ 支持多客户端并发连接

## 架构设计

### 整体架构

```
DBeaver 客户端 (PostgreSQL JDBC)
    ↓ TCP/IP (端口 5432)
PostgreSQL 线协议
    ↓
PGServer (新建模块)
    ├── TCP 监听器
    ├── 消息解析器
    ├── 认证处理器
    └── 查询处理器
    ↓
TZDB 查询引擎 (现有)
    ├── SQL 解析
    ├── 查询优化
    └── 执行引擎
    ↓
TZDB 存储引擎 (现有)
```

### 核心组件

#### 1. PGServer 主服务器

**职责：**
- 管理 TCP 监听和客户端连接
- 协调各个子组件
- 生命周期管理

**接口：**
```cpp
class PGServer {
public:
  PGServer(tzdb::DB* db, int port = 5432);
  
  bool Initialize();
  void Start();
  void Shutdown();
  bool IsRunning() const;
  
private:
  tzdb::DB* db_;
  int port_;
  std::unique_ptr<NetPoolRpc> net_pool_;
  std::atomic<bool> running_;
};
```

#### 2. PG 消息处理器

**职责：**
- 解析 PostgreSQL 二进制消息格式
- 构造 PostgreSQL 响应消息
- 消息路由和分发

**消息包装器：**
```cpp
class PGMessageWrapper : public DataInfoFormat {
public:
  PGMessageWrapper(char msg_type, const std::vector<char>& data);
  
  char message_type_;              // 'Q', 'P', 'B', 'E' 等
  std::vector<char> message_data_; // 原始 PG 二进制数据
};

class PGResponseWrapper : public DataInfoFormat {
public:
  PGResponseWrapper(uint64_t request_id, const std::vector<char>& data);
  
  std::vector<char> response_data_; // PG 响应二进制数据
};
```

#### 3. 查询执行桥接

**职责：**
- 将 PG 查询转换为 TZDB 查询
- 将 TZDB 结果转换为 PG 格式
- 管理查询会话和事务

**实现方式：**
```cpp
class PGQueryBridge {
public:
  PGQueryBridge(tzdb::DB* db);
  
  // 执行简单查询
  PGResult ExecuteQuery(const std::string& sql);
  
  // 执行预处理语句
  PGResult ExecutePrepared(const std::string& stmt_name, 
                          const std::vector<PGValue>& params);
  
  // 事务控制
  void BeginTransaction();
  void CommitTransaction();
  void RollbackTransaction();
  
private:
  std::unique_ptr<Connection> session_;
};
```

## PostgreSQL 协议消息

### P0 优先级（核心必需）

#### 连接建立
- **StartupMessage**：客户端初始化连接
  - 格式：长度(4字节) + 协议版本(4字节) + 参数键值对
  - 参数：user, database, application_name 等
  
- **AuthenticationOk**：认证成功响应
  - 格式：'R' + 长度(4字节) + 认证类型(4字节，0表示成功)
  
- **ReadyForQuery**：准备接收查询
  - 格式：'Z' + 长度(4字节) + 事务状态(1字节)
  - 状态：'I'(空闲), 'T'(事务中), 'E'(错误)

#### 查询处理
- **Query**：SQL 查询请求
  - 格式：'Q' + 长度(4字节) + SQL字符串(以\0结尾)
  
- **RowDescription**：结果集列描述
  - 格式：'T' + 长度 + 列数(2字节) + [列信息...]
  - 列信息：列名 + 表OID + 列号 + 类型OID + 类型大小 + 类型修饰符 + 格式码
  
- **DataRow**：数据行
  - 格式：'D' + 长度 + 列数(2字节) + [列值...]
  - 列值：长度(4字节) + 数据
  
- **CommandComplete**：命令完成
  - 格式：'C' + 长度 + 命令标签字符串
  - 标签：SELECT n, INSERT oid n, UPDATE n, DELETE n 等

#### 错误处理
- **ErrorResponse**：错误响应
  - 格式：'E' + 长度 + [字段...]
  - 字段：类型码(1字节) + 值字符串 + \0
  - 类型：'S'(严重性), 'C'(错误码), 'M'(消息), 'D'(详情)等

### P1 优先级（扩展功能）

#### 预处理语句
- **Parse**：解析预处理语句
- **Bind**：绑定参数
- **Execute**：执行预处理语句
- **Describe**：描述语句或portal
- **Close**：关闭语句或portal

#### 事务管理
- **Sync**：同步点
- **Flush**：刷新缓冲

#### 连接管理
- **Terminate**：终止连接
- **ParameterStatus**：参数状态通知

## 实现步骤

### Phase 1：基础框架（3-4天）

**目标：** 建立 TCP 服务器和基本消息处理

1. **创建目录结构**
   ```
   src/pgserver/
   ├── CMakeLists.txt
   ├── pg_server.cpp
   ├── pg_server.h
   ├── pg_protocol.cpp
   ├── pg_protocol.h
   ├── pg_messages.cpp
   └── pg_messages.h
   ```

2. **实现 TCP 监听器**
   - 复用 TZDB 的 NetPoolRpc 基础设施
   - 监听 5432 端口
   - 接受客户端连接

3. **实现基本消息解析**
   - 解析消息头部（类型 + 长度）
   - 读取消息体
   - 消息路由框架

4. **实现连接握手**
   - 处理 StartupMessage
   - 发送 AuthenticationOk
   - 发送 ReadyForQuery

**验证：** 使用 psql 或 DBeaver 能够成功建立连接

### Phase 2：查询处理（4-5天）

**目标：** 支持基本 SQL 查询

1. **实现 Query 消息处理**
   - 解析 Query 消息
   - 调用 TZDB 查询引擎
   - 获取查询结果

2. **实现结果集转换**
   - 构造 RowDescription 消息
   - 构造 DataRow 消息
   - 发送 CommandComplete 消息

3. **实现数据类型映射**
   - TZDB 类型 → PostgreSQL OID
   - 数据格式转换（文本格式）

4. **实现错误处理**
   - 捕获 TZDB 异常
   - 构造 ErrorResponse 消息
   - 错误码映射

**验证：** 在 DBeaver 中执行 SELECT 查询并查看结果

### Phase 3：事务和元数据（3-4天）

**目标：** 支持事务管理和元数据查询

1. **实现事务控制**
   - 处理 BEGIN/COMMIT/ROLLBACK
   - 维护事务状态
   - 在 ReadyForQuery 中返回正确状态

2. **实现元数据查询**
   - 映射 pg_catalog 系统表
   - 实现 pg_tables, pg_columns 等视图
   - 支持 DBeaver 的元数据查询

3. **实现预处理语句（基础）**
   - Parse 消息处理
   - Bind 消息处理
   - Execute 消息处理

**验证：** 在 DBeaver 中执行事务和查看表结构

### Phase 4：测试和优化（2-3天）

**目标：** 确保稳定性和性能

1. **功能测试**
   - 各种 SQL 语句测试
   - 并发连接测试
   - 错误场景测试

2. **性能优化**
   - 连接池管理
   - 消息缓冲优化
   - 内存管理优化

3. **兼容性测试**
   - DBeaver 完整功能测试
   - psql 命令行测试
   - 其他 PostgreSQL 客户端测试

## 集成到 Database 类

### 配置结构

```cpp
struct DBConfig {
  // ... 现有配置 ...
  
  // PG 服务器配置
  bool enable_pg_server = false;      // 是否启用 PG 服务器
  int pg_port = 5432;                 // 监听端口
  int pg_max_connections = 100;       // 最大连接数
  int pg_timeout_seconds = 30;        // 连接超时
};
```

### Database 类修改

```cpp
class Database {
public:
  Database(const char *path, const char *db_name, 
           DBConfig *config = nullptr, 
           int32_t admin_role_id = 0,
           bool optimize_buffer_pool = false, 
           int instance_id = 0);
  
  // PG 服务器控制
  bool StartPGServer(int port = 5432);
  void StopPGServer();
  bool IsPGServerRunning() const;
  
private:
  std::unique_ptr<PGServer> pg_server_;
};
```

### 自动启动实现

```cpp
Database::Database(const char *path, const char *db_name, 
                   DBConfig *config, ...) {
  // ... 现有初始化代码 ...
  
  // 自动启动 PG 服务器
  if (config && config->enable_pg_server) {
    try {
      if (StartPGServer(config->pg_port)) {
        LOG_INFO("PG Server started on port %d", config->pg_port);
      } else {
        LOG_WARN("Failed to start PG Server");
      }
    } catch (const std::exception& e) {
      LOG_ERROR("PG Server startup error: %s", e.what());
    }
  }
}
```

## 使用示例

### 示例 1：自动启动（推荐）

```cpp
#include "tzdb.hpp"

int main() {
  // 配置启用 PG 服务器
  DBConfig config;
  config.enable_pg_server = true;
  config.pg_port = 5432;
  config.pg_max_connections = 100;
  
  // 创建数据库，PG 服务器自动启动
  Database db("/data/mydb", "mydb", &config);
  
  // 现在可以使用 DBeaver 连接：
  // Host: localhost
  // Port: 5432
  // Database: mydb
  
  // 应用逻辑...
  
  return 0;
}
```

### 示例 2：手动控制

```cpp
#include "tzdb.hpp"

int main() {
  // 创建数据库（不自动启动 PG 服务器）
  Database db("/data/mydb", "mydb");
  
  // 手动启动 PG 服务器
  if (db.StartPGServer(5432)) {
    std::cout << "PG Server is running" << std::endl;
  }
  
  // 应用逻辑...
  
  // 手动停止
  db.StopPGServer();
  
  return 0;
}
```

### 示例 3：分布式场景

```cpp
#include "tzdb.hpp"

int main() {
  DBConfig config;
  config.enable_pg_server = true;
  config.pg_port = 5432;  // 节点1使用5432
  
  // 每个分布式节点都可以启动自己的 PG 服务器
  Database db("/data/node1", "cluster_db", &config);
  
  // 客户端可以连接任意节点
  // Node1: localhost:5432
  // Node2: node2:5432
  // Node3: node3:5432
  
  return 0;
}
```

## 数据类型映射

### TZDB → PostgreSQL OID 映射表

| TZDB 类型 | PostgreSQL 类型 | OID | 说明 |
|----------|----------------|-----|------|
| INT32 | INTEGER | 23 | 4字节整数 |
| INT64 | BIGINT | 20 | 8字节整数 |
| FLOAT | REAL | 700 | 4字节浮点 |
| DOUBLE | DOUBLE PRECISION | 701 | 8字节浮点 |
| STRING | VARCHAR | 1043 | 变长字符串 |
| BOOL | BOOLEAN | 16 | 布尔值 |
| TIMESTAMP | TIMESTAMP | 1114 | 时间戳 |
| BLOB | BYTEA | 17 | 二进制数据 |

## 错误码映射

### TZDB → PostgreSQL SQLSTATE 映射

| TZDB 错误 | PostgreSQL SQLSTATE | 说明 |
|----------|-------------------|------|
| SQL_SYNTAX_ERROR | 42601 | SQL语法错误 |
| TABLE_NOT_FOUND | 42P01 | 表不存在 |
| COLUMN_NOT_FOUND | 42703 | 列不存在 |
| DUPLICATE_KEY | 23505 | 唯一约束冲突 |
| TRANSACTION_ABORT | 25P02 | 事务中止 |
| CONNECTION_FAILURE | 08006 | 连接失败 |

## 性能考虑

### 连接管理
- 支持连接池（最大连接数限制）
- 连接超时自动清理
- 空闲连接检测

### 消息处理
- 消息缓冲区复用
- 批量发送优化
- 零拷贝数据传输

### 查询优化
- 预处理语句缓存
- 查询计划缓存
- 结果集流式传输

## 测试计划

### 单元测试
- 消息解析测试
- 数据类型转换测试
- 错误处理测试

### 集成测试
- DBeaver 连接测试
- psql 命令行测试
- 并发连接测试
- 事务隔离测试

### 性能测试
- 查询响应时间
- 并发连接数
- 大结果集处理
- 内存使用情况

## 风险和缓解

### 主要风险

1. **协议复杂性**
   - 风险：PostgreSQL 协议细节众多
   - 缓解：分阶段实现，先支持核心功能

2. **元数据兼容性**
   - 风险：DBeaver 依赖 pg_catalog 系统表
   - 缓解：实现虚拟系统表映射

3. **性能问题**
   - 风险：消息转换开销
   - 缓解：优化消息处理，使用缓冲和池化

4. **并发安全**
   - 风险：多客户端并发访问
   - 缓解：使用 TZDB 现有的并发控制机制

## 时间估算

| 阶段 | 工作内容 | 预计时间 |
|-----|---------|---------|
| Phase 1 | 基础框架 | 3-4天 |
| Phase 2 | 查询处理 | 4-5天 |
| Phase 3 | 事务和元数据 | 3-4天 |
| Phase 4 | 测试和优化 | 2-3天 |
| **总计** | | **2-3周** |

## 成功标准

- ✅ DBeaver 能够成功连接 TZDB
- ✅ 支持完整的 CRUD 操作
- ✅ 支持事务管理（BEGIN/COMMIT/ROLLBACK）
- ✅ 支持元数据浏览（表、列、索引）
- ✅ 查询响应时间 < 100ms（简单查询）
- ✅ 支持至少 100 个并发连接
- ✅ 兼容 psql、pgAdmin 等标准工具

## 参考资料

- [PostgreSQL 官方协议文档](https://www.postgresql.org/docs/current/protocol.html)
- [PostgreSQL 消息格式](https://www.postgresql.org/docs/current/protocol-message-formats.html)
- [PostgreSQL 错误码](https://www.postgresql.org/docs/current/errcodes-appendix.html)
- [DBeaver 文档](https://dbeaver.io/docs/)

## 附录

### A. 目录结构

```
tzdb-rebuild/
├── src/
│   ├── pgserver/              # PG 服务器模块（新建）
│   │   ├── CMakeLists.txt
│   │   ├── pg_server.cpp
│   │   ├── pg_server.h
│   │   ├── pg_protocol.cpp
│   │   ├── pg_protocol.h
│   │   ├── pg_messages.cpp
│   │   ├── pg_messages.h
│   │   ├── pg_query_bridge.cpp
│   │   └── pg_query_bridge.h
│   └── ...
├── docs/
│   └── pgserver/
│       ├── pgserver_implementation_plan.md  # 本文档
│       ├── dbeaver_postgresql_protocol_implementation_guide.md
│       └── dbeaver_postgresql_protocol_executive_summary.md
└── tests/
    └── pgserver_test/         # PG 服务器测试（新建）
        ├── CMakeLists.txt
        ├── pg_protocol_test.cpp
        └── pg_integration_test.cpp
```

### B. 编译配置

```cmake
# src/pgserver/CMakeLists.txt
cmake_minimum_required(VERSION 3.15)

# PG Server 库
add_library(pgserver STATIC
  pg_server.cpp
  pg_protocol.cpp
  pg_messages.cpp
  pg_query_bridge.cpp
)

target_include_directories(pgserver PUBLIC
  ${PROJECT_SOURCE_DIR}/src/inc
  ${PROJECT_SOURCE_DIR}/src/include
)

target_link_libraries(pgserver
  tzdb_core
  net_pool_rpc
)
```

---

**文档版本：** 1.0  
**创建日期：** 2025-12-24  
**作者：** TZDB 开发团队  
**状态：** 待实现
