---
title: "TZDB DBeaver PostgreSQL 协议实现指南"
description: "TZDB DBeaver PostgreSQL 协议实现指南"
---

# TZDB DBeaver PostgreSQL 协议实现指南

## 实现现状

本指南最初用于指导 `pgserver` 从零实现。当前仓库内对应功能已经有可运行版本，因此阅读本文件时应区分：

- 已实现并验证的能力
- 仍作为后续兼容工作的规划项

### 已实现能力

- `pg_server` 可启动 PostgreSQL 协议监听
- `psql` 可使用明文模式完成连接与基本 CRUD
- 最小扩展协议链路已打通：`Parse`、`Bind`、`Execute`、`Describe`、`Flush`、`Sync`
- 协议回归测试和 `psql` smoke test 已纳入 `tests/pg_server_test`

### 当前建议

- 优先使用 `psql "host=127.0.0.1 port=5432 user=admin dbname=testdb sslmode=disable gssencmode=disable"`
- 建表联调时优先使用 `VARCHAR`，不要使用当前未支持的 `TEXT`
- 排查握手问题时，优先看 `PGProtocol`、`PGServer`、`PGSession` 的链路日志，而不是先改底层网络模型
- DBeaver 建表类型下拉的根因分析和修复原则，见 `docs/pgserver/dbeaver_create_table_type_list_issue.md`

### 测试入口

```bash
ctest --test-dir cmake-build-debug -R '^pg_server_test$' --output-on-failure
ctest --test-dir cmake-build-debug -R '^pg_server_psql_smoke$' --output-on-failure
```

## 概述

基于 TZDB DBeaver 集成分析报告，本实现指南提供了将 PostgreSQL 线协议适配以实现 DBeaver 与 TZDB 连接的详细说明。该实现专注于创建一个
PostgreSQL 协议兼容层，将 PostgreSQL 线协议消息转换为 TZDB 引擎操作。

## 架构

实现遵循分析报告中概述的架构：

```
DBeaver 客户端(PostgreSQL JDBC 驱动)
    ↓ PostgreSQL 线协议(TCP/IP 端口 5432)
TZDB PostgreSQL 协议适配器(新增)
    ↓ 消息处理层
TZDB 查询执行引擎(现有)
    ↓ SQL 解析 → 绑定 → 优化 → 执行
TZDB 存储引擎(现有)
    ↓ 内存存储 / 磁盘存储 / 混合存储
```

### 关键组件

1. **网络服务器**：监听端口 5432 的 TCP/IP 服务器
2. **协议解析器**：处理 PostgreSQL 消息解析和序列化
3. **消息处理器**：将协议消息转换为 TZDB 操作
4. **查询适配器**：与 TZDB 的 SQL 执行引擎对接
5. **会话管理器**：管理客户端连接和状态

## 实现阶段

### 第一阶段：核心协议基础(第1周)

#### 1.1 网络服务器设置

- 创建监听端口 5432 的 TCP 服务器
- 实现基本的连接接受
- 设置异步 I/O 处理以支持并发连接

#### 1.2 认证实现

- 解析 `StartupMessage`(客户端初始化)
- 实现认证握手
- 发送 `AuthenticationOk` 和 `ReadyForQuery` 响应

#### 1.3 基本查询处理

- 解析 `Query` 消息
- 实现简单的查询执行路径
- 返回基本结果集

#### 1.4 错误处理

- 实现 `ErrorResponse` 消息
- 添加从 TZDB 到 PostgreSQL 错误代码的映射

### 第二阶段：查询处理(第1-2周)

#### 2.1 结果集处理

- 实现 `RowDescription` 消息
- 实现 `DataRow` 消息用于数据传输
- 添加 `CommandComplete` 消息

#### 2.2 扩展查询支持

- 实现 `Parse` 消息用于预处理语句
- 实现 `Bind` 消息用于参数绑定
- 实现 `Execute` 消息用于语句执行

#### 2.3 事务管理

- 处理 `BEGIN`、`COMMIT`、`ROLLBACK` 命令
- 实现事务状态跟踪
- 发送适当的状态消息

### 第三阶段：高级功能(第2周)

#### 3.1 元数据查询

- 实现 `Describe` 消息用于表/列元数据
- 支持系统目录查询
- 添加类型信息映射

#### 3.2 连接管理

- 实现 `Terminate` 消息处理
- 添加连接池支持
- 实现会话清理

#### 3.3 协议扩展

- 支持额外的 PostgreSQL 协议功能
- 添加对 DBeaver 特定扩展的兼容性

## 详细实现步骤

### 步骤1：项目设置

在 `src/` 下创建新的目录结构：

```
src/
├── pgserver/
│   ├── CMakeLists.txt
│   ├── server.cpp
│   ├── protocol/
│   │   ├── message_parser.cpp
│   │   ├── message_serializer.cpp
│   │   └── message_types.h
│   ├── session/
│   │   ├── session_manager.cpp
│   │   └── session.cpp
│   └── query/
│       ├── query_adapter.cpp
│       └── result_formatter.cpp
```

### 步骤2：网络服务器实现

```cpp
// server.cpp - 基本 TCP 服务器
class PgServer {
public:
    void start(uint16_t port = 5432) {
        // 创建 TCP 接受器
        // 设置异步接受处理器
    }

    void handle_connection(tcp::socket socket) {
        // 创建新会话
        auto session = std::make_shared<PgSession>(std::move(socket));
        session->start();
    }
};
```

### 步骤3：消息解析

```cpp
// message_parser.cpp
class MessageParser {
public:
    std::unique_ptr<Message> parse(const std::vector<char>& buffer) {
        char message_type = buffer[0];
        uint32_t length = ntohl(*reinterpret_cast<const uint32_t*>(&buffer[1]));

        switch (message_type) {
            case 'Q': return parse_query(buffer);
            case 'P': return parse_parse(buffer);
            // ... 其他消息类型
        }
        return nullptr;
    }
};
```

### 步骤4：查询适配器集成

```cpp
// query_adapter.cpp
class QueryAdapter {
public:
    QueryResult execute_query(const std::string& sql, Session& session) {
        // 使用现有的 TZDB Connection API
        auto& tzdb_conn = session.get_tzdb_connection();

        // 解析并执行查询
        auto result = tzdb_conn.execute(sql);

        // 转换为 PostgreSQL 格式
        return format_result(result);
    }
};
```

### 步骤5：会话管理

```cpp
// session.cpp
class PgSession {
public:
    void start() {
        read_startup_message();
    }

    void read_startup_message() {
        // 读取并解析 StartupMessage
        // 发送 AuthenticationOk
        // 发送 ReadyForQuery
        read_next_message();
    }

    void handle_query(const QueryMessage& msg) {
        auto result = query_adapter_.execute_query(msg.sql, *this);

        // 发送 RowDescription
        send_row_description(result);

        // 发送 DataRow(s)
        for (const auto& row : result.rows) {
            send_data_row(row);
        }

        // 发送 CommandComplete
        send_command_complete(result);

        // 发送 ReadyForQuery
        send_ready_for_query();
    }
};
```

## 协议状态机设计

PostgreSQL 协议遵循严格的状态转移。实现必须维护每个连接的状态：

```
[初始化]
    ↓ StartupMessage
[认证中] ← 认证失败 → [错误] → [关闭]
    ↓ AuthenticationOk
[就绪] ← Sync 消息恢复
    ↓ Query/Parse
[查询中]
    ↓ RowDescription
[结果传输]
    ↓ DataRow/CommandComplete
[就绪]
    ↓ Terminate
[关闭]
```

### 状态转移规则

```cpp
enum class ProtocolState {
    STARTUP,           // 初始化状态
    AUTHENTICATING,    // 认证中
    READY,            // 就绪，等待命令
    QUERYING,         // 查询执行中
    RESULT_TRANSFER,  // 结果传输中
    ERROR_RECOVERY,   // 错误恢复中
    CLOSED            // 连接已关闭
};

// 状态转移表
struct StateTransition {
    ProtocolState current_state;
    MessageType message_type;
    ProtocolState next_state;
    bool is_valid;
};
```

## 完整消息类型定义

### P0 优先级消息(必须实现)

| 消息类型 | 方向 | 说明 | 处理方法 |
|---------|------|------|--------|
| StartupMessage | C→S | 连接初始化 | `handle_startup_message()` |
| AuthenticationOk | S→C | 认证成功 | `send_auth_ok()` |
| AuthenticationMD5Password | S→C | MD5 认证请求 | `send_auth_md5()` |
| AuthenticationSASL | S→C | SCRAM 认证请求 | `send_auth_sasl()` |
| Query | C→S | 简单查询 | `handle_query()` |
| RowDescription | S→C | 结果集列描述 | `send_row_description()` |
| DataRow | S→C | 数据行 | `send_data_row()` |
| CommandComplete | S→C | 命令完成 | `send_command_complete()` |
| ReadyForQuery | S→C | 准备接收新命令 | `send_ready_for_query()` |
| ErrorResponse | S→C | 错误响应 | `send_error_response()` |
| Terminate | C→S | 连接终止 | `handle_terminate()` |

### P1 优先级消息(扩展查询)

| 消息类型 | 方向 | 说明 | 处理方法 |
|---------|------|------|--------|
| Parse | C→S | 预处理语句解析 | `handle_parse()` |
| Bind | C→S | 参数绑定 | `handle_bind()` |
| Execute | C→S | 执行预处理语句 | `handle_execute()` |
| Describe | C→S | 获取元数据 | `handle_describe()` |
| Flush | C→S | 强制发送缓冲 | `handle_flush()` |
| Sync | C→S | 同步点(错误恢复) | `handle_sync()` |
| ParameterStatus | S→C | 参数状态通知 | `send_parameter_status()` |
| NoticeResponse | S→C | 警告通知 | `send_notice()` |

### P2 优先级消息(可选)

| 消息类型 | 方向 | 说明 |
|---------|------|------|
| CopyData | C→S/S→C | 数据导入导出 |
| CopyDone | C→S/S→C | 导入导出完成 |
| CopyFail | C→S | 导入导出失败 |
| FunctionCall | C→S | 函数调用 |

## 关键消息实现细节

### StartupMessage 处理

```cpp
struct StartupMessage {
    uint32_t protocol_version;  // 3.0 = 0x00030000
    std::map<std::string, std::string> parameters;
    // 必需参数：user, database
    // 可选参数：application_name, client_encoding, DateStyle 等
};

void handle_startup_message(const StartupMessage& msg) {
    // 1. 验证协议版本
    if (msg.protocol_version != 0x00030000) {
        send_error_response("FATAL", "unsupported protocol version");
        return;
    }
    
    // 2. 验证必需参数
    if (!msg.parameters.count("user")) {
        send_error_response("FATAL", "missing user parameter");
        return;
    }
    
    // 3. 创建 TZDB 会话
    auto session = create_tzdb_session(msg.parameters["user"], 
                                       msg.parameters.count("database") ? 
                                       msg.parameters["database"] : "postgres");
    
    // 4. 发送认证请求
    // 优先使用 SCRAM-SHA-256，降级到 MD5
    if (supports_scram()) {
        send_auth_sasl();
    } else {
        send_auth_md5();
    }
}
```

### Query 消息处理

```cpp
struct QueryMessage {
    std::string query_string;
};

void handle_query(const QueryMessage& msg) {
    try {
        // 1. 解析 SQL
        auto parsed = parse_sql(msg.query_string);
        
        // 2. 执行查询
        auto result = execute_query(parsed);
        
        // 3. 发送结果
        send_row_description(result);
        for (const auto& row : result.rows) {
            send_data_row(row);
        }
        send_command_complete(result);
        
    } catch (const std::exception& e) {
        send_error_response("ERROR", e.what());
    }
    
    // 4. 发送就绪状态
    send_ready_for_query();
}
```

### Parse/Bind/Execute 流程

```cpp
// 预处理语句缓存
std::map<std::string, PreparedStatement> prepared_statements_;

struct PreparedStatement {
    std::string statement_name;
    std::string query_string;
    std::vector<uint32_t> param_types;  // PostgreSQL OID
    ParsedQuery parsed_query;
};

void handle_parse(const ParseMessage& msg) {
    // 1. 解析 SQL 语句
    auto parsed = parse_sql(msg.query_string);
    
    // 2. 推断参数类型
    auto param_types = infer_param_types(parsed);
    
    // 3. 缓存预处理语句
    PreparedStatement stmt{
        msg.statement_name,
        msg.query_string,
        param_types,
        parsed
    };
    prepared_statements_[msg.statement_name] = stmt;
    
    // 4. 发送解析完成
    send_parse_complete();
}

void handle_bind(const BindMessage& msg) {
    // 1. 查找预处理语句
    auto it = prepared_statements_.find(msg.statement_name);
    if (it == prepared_statements_.end()) {
        send_error_response("ERROR", "prepared statement not found");
        return;
    }
    
    // 2. 绑定参数
    auto& stmt = it->second;
    std::vector<Value> bound_params;
    for (size_t i = 0; i < msg.param_values.size(); ++i) {
        bound_params.push_back(
            convert_to_tzdb_type(msg.param_values[i], stmt.param_types[i])
        );
    }
    
    // 3. 缓存绑定结果
    portal_cache_[msg.portal_name] = {stmt, bound_params};
    
    // 4. 发送绑定完成
    send_bind_complete();
}

void handle_execute(const ExecuteMessage& msg) {
    // 1. 查找门户(Portal)
    auto it = portal_cache_.find(msg.portal_name);
    if (it == portal_cache_.end()) {
        send_error_response("ERROR", "portal not found");
        return;
    }
    
    // 2. 执行查询
    auto& [stmt, params] = it->second;
    auto result = execute_prepared_query(stmt.parsed_query, params);
    
    // 3. 发送结果(支持行数限制)
    int rows_sent = 0;
    for (const auto& row : result.rows) {
        if (msg.max_rows > 0 && rows_sent >= msg.max_rows) break;
        send_data_row(row);
        rows_sent++;
    }
    
    // 4. 发送完成
    send_command_complete(result);
    send_ready_for_query();
}
```

### Flush 和 Sync 消息处理

```cpp
void handle_flush() {
    // 强制发送所有缓冲数据到客户端
    flush_output_buffer();
}

void handle_sync() {
    // 同步点：用于错误恢复
    // 1. 丢弃所有未完成的操作
    discard_pending_operations();
    
    // 2. 清空预处理语句缓存(可选)
    // prepared_statements_.clear();
    
    // 3. 重置状态机到 READY
    current_state_ = ProtocolState::READY;
    
    // 4. 发送就绪状态
    send_ready_for_query();
}
```

## 数据类型映射

PostgreSQL 和 TZDB 的数据类型需要完整映射。关键类型映射表：

```cpp
// PostgreSQL OID 定义(部分)
const uint32_t PG_OID_BOOL = 16;
const uint32_t PG_OID_INT2 = 21;
const uint32_t PG_OID_INT4 = 23;
const uint32_t PG_OID_INT8 = 20;
const uint32_t PG_OID_FLOAT4 = 700;
const uint32_t PG_OID_FLOAT8 = 701;
const uint32_t PG_OID_TEXT = 25;
const uint32_t PG_OID_VARCHAR = 1043;
const uint32_t PG_OID_TIMESTAMP = 1114;
const uint32_t PG_OID_TIMESTAMPTZ = 1184;
const uint32_t PG_OID_DATE = 1082;
const uint32_t PG_OID_TIME = 1083;
const uint32_t PG_OID_NUMERIC = 1700;
const uint32_t PG_OID_BYTEA = 17;
const uint32_t PG_OID_JSON = 114;
const uint32_t PG_OID_JSONB = 3802;

// 类型转换映射
struct TypeMapping {
    std::string tzdb_type;
    uint32_t pg_oid;
    std::string pg_type_name;
    std::function<std::string(const Value&)> to_text;
    std::function<Value(const std::string&)> from_text;
};

// 映射表初始化
std::map<std::string, TypeMapping> type_mappings = {
    {"int32", {
        "int32", PG_OID_INT4, "integer",
        [](const Value& v) { return std::to_string(v.as_int32()); },
        [](const std::string& s) { return Value(std::stoi(s)); }
    }},
    {"int64", {
        "int64", PG_OID_INT8, "bigint",
        [](const Value& v) { return std::to_string(v.as_int64()); },
        [](const std::string& s) { return Value(std::stoll(s)); }
    }},
    {"float64", {
        "float64", PG_OID_FLOAT8, "double precision",
        [](const Value& v) { return std::to_string(v.as_float64()); },
        [](const std::string& s) { return Value(std::stod(s)); }
    }},
    {"string", {
        "string", PG_OID_TEXT, "text",
        [](const Value& v) { return v.as_string(); },
        [](const std::string& s) { return Value(s); }
    }},
    {"timestamp", {
        "timestamp", PG_OID_TIMESTAMP, "timestamp without time zone",
        [](const Value& v) { return v.as_timestamp().to_string(); },
        [](const std::string& s) { return Value(Timestamp::parse(s)); }
    }},
    // ... 更多类型
};

// 转换函数
uint32_t get_pg_oid(const std::string& tzdb_type) {
    auto it = type_mappings.find(tzdb_type);
    if (it != type_mappings.end()) {
        return it->second.pg_oid;
    }
    return PG_OID_TEXT;  // 默认为 TEXT
}

std::string value_to_text(const Value& v, const std::string& tzdb_type) {
    auto it = type_mappings.find(tzdb_type);
    if (it != type_mappings.end()) {
        return it->second.to_text(v);
    }
    return v.to_string();
}

Value text_to_value(const std::string& text, const std::string& tzdb_type) {
    auto it = type_mappings.find(tzdb_type);
    if (it != type_mappings.end()) {
        return it->second.from_text(text);
    }
    return Value(text);
}
```

## 错误处理和恢复机制

### PostgreSQL 错误代码映射

```cpp
// SQLSTATE 代码定义
struct SQLState {
    std::string code;  // 5 字符代码，如 "42P01"
    std::string severity;  // ERROR, FATAL, PANIC
    std::string message;
};

// 错误代码映射表
std::map<std::string, std::string> error_code_mapping = {
    // 语法错误
    {"syntax_error", "42601"},
    {"invalid_name", "42602"},
    
    // 关系错误
    {"table_not_found", "42P01"},
    {"column_not_found", "42703"},
    {"index_not_found", "42P02"},
    
    // 数据错误
    {"invalid_text_representation", "22P02"},
    {"numeric_value_out_of_range", "22003"},
    {"division_by_zero", "22012"},
    
    // 完整性约束
    {"unique_violation", "23505"},
    {"foreign_key_violation", "23503"},
    {"not_null_violation", "23502"},
    
    // 事务错误
    {"transaction_rollback", "40000"},
    {"serialization_failure", "40001"},
    
    // 其他
    {"internal_error", "XX000"},
    {"feature_not_supported", "0A000"},
};

void send_error_response(const std::string& error_type, 
                        const std::string& message) {
    // 查找 SQLSTATE 代码
    std::string sqlstate = "XX000";  // 默认内部错误
    auto it = error_code_mapping.find(error_type);
    if (it != error_code_mapping.end()) {
        sqlstate = it->second;
    }
    
    // 构建错误响应消息
    std::vector<uint8_t> response;
    response.push_back('E');  // ErrorResponse 消息类型
    
    // 消息长度占位符
    uint32_t length_pos = response.size();
    response.resize(response.size() + 4);
    
    // 错误字段
    add_error_field(response, 'S', "ERROR");  // Severity
    add_error_field(response, 'C', sqlstate);  // SQLSTATE
    add_error_field(response, 'M', message);   // Message
    add_error_field(response, 'F', __FILE__);  // File
    add_error_field(response, 'L', std::to_string(__LINE__));  // Line
    add_error_field(response, 0);  // 终止符
    
    // 更新消息长度
    uint32_t length = response.size() - length_pos;
    std::memcpy(&response[length_pos], &length, sizeof(length));
    
    // 发送响应
    send_message(response);
}

void add_error_field(std::vector<uint8_t>& response, 
                    char field_type, 
                    const std::string& value) {
    response.push_back(field_type);
    response.insert(response.end(), value.begin(), value.end());
    response.push_back('\0');
}
```

### 错误恢复流程

```cpp
class ErrorRecoveryManager {
public:
    void handle_error(const std::exception& e) {
        // 1. 记录错误
        log_error(e.what());
        
        // 2. 发送错误响应
        send_error_response("internal_error", e.what());
        
        // 3. 进入错误恢复状态
        current_state_ = ProtocolState::ERROR_RECOVERY;
        
        // 4. 等待 Sync 消息
        // 客户端会发送 Sync 消息来恢复
    }
    
    void recover_from_error() {
        // 1. 丢弃所有未完成的操作
        discard_pending_operations();
        
        // 2. 回滚当前事务(如果有)
        if (in_transaction_) {
            rollback_transaction();
        }
        
        // 3. 清空预处理语句缓存(可选)
        // prepared_statements_.clear();
        
        // 4. 重置状态
        current_state_ = ProtocolState::READY;
    }
    
private:
    ProtocolState current_state_;
    bool in_transaction_;
    
    void discard_pending_operations() {
        // 清空待处理的操作队列
        pending_operations_.clear();
    }
    
    void rollback_transaction() {
        // 回滚 TZDB 事务
        current_session_->rollback();
    }
};
```

## 与 TZDB 引擎集成

### 连接管理

```cpp
class PgConnectionManager {
private:
    std::map<std::string, std::shared_ptr<TzdbSession>> sessions_;
    std::mutex sessions_mutex_;
    
public:
    std::shared_ptr<TzdbSession> create_session(const std::string& user,
                                                const std::string& database) {
        std::lock_guard<std::mutex> lock(sessions_mutex_);
        
        // 1. 验证用户和数据库
        if (!validate_user(user)) {
            throw std::runtime_error("invalid user");
        }
        
        if (!database_exists(database)) {
            throw std::runtime_error("database not found");
        }
        
        // 2. 创建 TZDB 会话
        auto session = std::make_shared<TzdbSession>();
        session->connect(user, database);
        
        // 3. 缓存会话
        std::string session_id = generate_session_id();
        sessions_[session_id] = session;
        
        return session;
    }
    
    void close_session(const std::string& session_id) {
        std::lock_guard<std::mutex> lock(sessions_mutex_);
        
        auto it = sessions_.find(session_id);
        if (it != sessions_.end()) {
            it->second->disconnect();
            sessions_.erase(it);
        }
    }
};
```

### SQL 执行

```cpp
class QueryExecutor {
public:
    QueryResult execute(const std::string& sql, 
                       std::shared_ptr<TzdbSession> session) {
        try {
            // 1. 解析 SQL
            auto parsed = parse_sql(sql);
            
            // 2. 验证权限
            if (!check_permissions(parsed, session->get_user())) {
                throw std::runtime_error("permission denied");
            }
            
            // 3. 执行查询
            auto tzdb_result = session->execute(parsed);
            
            // 4. 转换为 PostgreSQL 格式
            return convert_to_pg_format(tzdb_result);
            
        } catch (const std::exception& e) {
            throw std::runtime_error(std::string("query execution failed: ") + e.what());
        }
    }
    
private:
    QueryResult convert_to_pg_format(const TzdbResult& tzdb_result) {
        QueryResult pg_result;
        
        // 转换列信息
        for (const auto& col : tzdb_result.columns) {
            ColumnInfo pg_col;
            pg_col.name = col.name;
            pg_col.type_oid = get_pg_oid(col.type);
            pg_col.type_size = get_type_size(col.type);
            pg_col.type_modifier = -1;
            pg_result.columns.push_back(pg_col);
        }
        
        // 转换数据行
        for (const auto& row : tzdb_result.rows) {
            std::vector<std::string> pg_row;
            for (size_t i = 0; i < row.size(); ++i) {
                pg_row.push_back(value_to_text(row[i], 
                                              tzdb_result.columns[i].type));
            }
            pg_result.rows.push_back(pg_row);
        }
        
        pg_result.affected_rows = tzdb_result.affected_rows;
        pg_result.command_tag = tzdb_result.command_tag;
        
        return pg_result;
    }
};
```

### 事务支持

```cpp
class TransactionManager {
public:
    void begin_transaction(std::shared_ptr<TzdbSession> session,
                          const std::string& isolation_level = "READ COMMITTED") {
        // 映射 PostgreSQL 隔离级别到 TZDB
        std::string tzdb_level = map_isolation_level(isolation_level);
        session->begin_transaction(tzdb_level);
        in_transaction_ = true;
    }
    
    void commit_transaction(std::shared_ptr<TzdbSession> session) {
        session->commit();
        in_transaction_ = false;
    }
    
    void rollback_transaction(std::shared_ptr<TzdbSession> session) {
        session->rollback();
        in_transaction_ = false;
    }
    
    void savepoint(std::shared_ptr<TzdbSession> session,
                   const std::string& name) {
        // TZDB 需要支持 SAVEPOINT
        session->create_savepoint(name);
    }
    
    void rollback_to_savepoint(std::shared_ptr<TzdbSession> session,
                               const std::string& name) {
        session->rollback_to_savepoint(name);
    }
    
private:
    bool in_transaction_;
    
    std::string map_isolation_level(const std::string& pg_level) {
        // PostgreSQL 隔离级别 → TZDB 隔离级别
        if (pg_level == "READ UNCOMMITTED") return "READ_UNCOMMITTED";
        if (pg_level == "READ COMMITTED") return "READ_COMMITTED";
        if (pg_level == "REPEATABLE READ") return "REPEATABLE_READ";
        if (pg_level == "SERIALIZABLE") return "SERIALIZABLE";
        return "READ_COMMITTED";  // 默认
    }
};
```

## 元数据查询实现

DBeaver 连接后会查询系统表获取元数据。需要实现虚拟系统表或完整的 `pg_catalog` 映射。

### 关键系统表

```cpp
// 虚拟系统表定义
class SystemCatalog {
public:
    // pg_tables: 表信息
    QueryResult query_pg_tables(const std::string& schema = nullptr) {
        QueryResult result;
        result.columns = {
            {"tablename", "text"},
            {"schemaname", "text"},
            {"tableowner", "text"},
            {"tablespace", "text"},
            {"hasindexes", "bool"},
            {"hasrules", "bool"},
            {"hastriggers", "bool"},
            {"rowsecurity", "bool"}
        };
        
        // 从 TZDB 获取表列表
        auto tables = get_tzdb_tables(schema);
        for (const auto& table : tables) {
            result.rows.push_back({
                table.name,
                table.schema,
                table.owner,
                "",  // tablespace
                table.has_indexes ? "true" : "false",
                "false",
                table.has_triggers ? "true" : "false",
                "false"
            });
        }
        
        return result;
    }
    
    // pg_columns: 列信息
    QueryResult query_pg_columns(const std::string& table_name = nullptr) {
        QueryResult result;
        result.columns = {
            {"column_name", "text"},
            {"table_name", "text"},
            {"ordinal_position", "int4"},
            {"column_default", "text"},
            {"is_nullable", "text"},
            {"data_type", "text"},
            {"character_maximum_length", "int4"},
            {"numeric_precision", "int4"},
            {"numeric_scale", "int4"}
        };
        
        // 从 TZDB 获取列信息
        auto columns = get_tzdb_columns(table_name);
        for (const auto& col : columns) {
            result.rows.push_back({
                col.name,
                col.table_name,
                std::to_string(col.ordinal_position),
                col.default_value.empty() ? "" : col.default_value,
                col.is_nullable ? "YES" : "NO",
                col.data_type,
                col.char_max_length > 0 ? std::to_string(col.char_max_length) : "",
                col.numeric_precision > 0 ? std::to_string(col.numeric_precision) : "",
                col.numeric_scale > 0 ? std::to_string(col.numeric_scale) : ""
            });
        }
        
        return result;
    }
    
    // pg_indexes: 索引信息
    QueryResult query_pg_indexes(const std::string& table_name = nullptr) {
        QueryResult result;
        result.columns = {
            {"indexname", "text"},
            {"tablename", "text"},
            {"indexdef", "text"},
            {"schemaname", "text"}
        };
        
        auto indexes = get_tzdb_indexes(table_name);
        for (const auto& idx : indexes) {
            result.rows.push_back({
                idx.name,
                idx.table_name,
                idx.definition,
                idx.schema
            });
        }
        
        return result;
    }
    
    // pg_constraints: 约束信息
    QueryResult query_pg_constraints(const std::string& table_name = nullptr) {
        QueryResult result;
        result.columns = {
            {"constraint_name", "text"},
            {"table_name", "text"},
            {"constraint_type", "text"},
            {"column_name", "text"}
        };
        
        auto constraints = get_tzdb_constraints(table_name);
        for (const auto& con : constraints) {
            result.rows.push_back({
                con.name,
                con.table_name,
                con.type,  // PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK
                con.column_name
            });
        }
        
        return result;
    }
    
private:
    std::vector<TableInfo> get_tzdb_tables(const std::string& schema);
    std::vector<ColumnInfo> get_tzdb_columns(const std::string& table_name);
    std::vector<IndexInfo> get_tzdb_indexes(const std::string& table_name);
    std::vector<ConstraintInfo> get_tzdb_constraints(const std::string& table_name);
};

// 在 QueryExecutor 中集成系统表查询
QueryResult execute_system_query(const std::string& sql) {
    if (sql.find("pg_tables") != std::string::npos) {
        return catalog_.query_pg_tables();
    }
    if (sql.find("pg_columns") != std::string::npos) {
        return catalog_.query_pg_columns();
    }
    if (sql.find("pg_indexes") != std::string::npos) {
        return catalog_.query_pg_indexes();
    }
    if (sql.find("pg_constraints") != std::string::npos) {
        return catalog_.query_pg_constraints();
    }
    
    // 其他系统表...
    throw std::runtime_error("system table not supported");
}
```

## 连接池和资源管理

### 连接池实现

```cpp
class ConnectionPool {
private:
    struct PooledConnection {
        std::shared_ptr<PgSession> session;
        std::chrono::steady_clock::time_point last_used;
        bool in_use;
    };
    
    std::vector<PooledConnection> connections_;
    std::mutex pool_mutex_;
    std::condition_variable available_cv_;
    
    size_t max_connections_;
    std::chrono::seconds idle_timeout_;
    
public:
    ConnectionPool(size_t max_conn = 100, 
                   std::chrono::seconds timeout = std::chrono::seconds(300))
        : max_connections_(max_conn), idle_timeout_(timeout) {}
    
    std::shared_ptr<PgSession> acquire() {
        std::unique_lock<std::mutex> lock(pool_mutex_);
        
        // 等待可用连接
        available_cv_.wait(lock, [this] {
            return has_available_connection();
        });
        
        // 查找可用连接
        for (auto& pooled : connections_) {
            if (!pooled.in_use) {
                pooled.in_use = true;
                pooled.last_used = std::chrono::steady_clock::now();
                return pooled.session;
            }
        }
        
        // 创建新连接
        if (connections_.size() < max_connections_) {
            auto session = std::make_shared<PgSession>();
            connections_.push_back({session, std::chrono::steady_clock::now(), true});
            return session;
        }
        
        throw std::runtime_error("connection pool exhausted");
    }
    
    void release(std::shared_ptr<PgSession> session) {
        std::lock_guard<std::mutex> lock(pool_mutex_);
        
        for (auto& pooled : connections_) {
            if (pooled.session == session) {
                pooled.in_use = false;
                pooled.last_used = std::chrono::steady_clock::now();
                available_cv_.notify_one();
                return;
            }
        }
    }
    
    void cleanup_idle_connections() {
        std::lock_guard<std::mutex> lock(pool_mutex_);
        
        auto now = std::chrono::steady_clock::now();
        auto it = connections_.begin();
        
        while (it != connections_.end()) {
            auto idle_duration = now - it->last_used;
            if (!it->in_use && idle_duration > idle_timeout_) {
                it->session->close();
                it = connections_.erase(it);
            } else {
                ++it;
            }
        }
    }
    
    void shutdown() {
        std::lock_guard<std::mutex> lock(pool_mutex_);
        
        for (auto& pooled : connections_) {
            if (pooled.session) {
                pooled.session->close();
            }
        }
        connections_.clear();
    }
    
private:
    bool has_available_connection() const {
        // 检查是否有可用连接或可创建新连接
        for (const auto& pooled : connections_) {
            if (!pooled.in_use) return true;
        }
        return connections_.size() < max_connections_;
    }
};

// 连接池管理器
class PoolManager {
private:
    std::map<std::string, std::unique_ptr<ConnectionPool>> pools_;
    std::mutex pools_mutex_;
    
public:
    std::shared_ptr<PgSession> get_connection(const std::string& pool_key) {
        std::lock_guard<std::mutex> lock(pools_mutex_);
        
        auto it = pools_.find(pool_key);
        if (it == pools_.end()) {
            pools_[pool_key] = std::make_unique<ConnectionPool>();
        }
        
        return pools_[pool_key]->acquire();
    }
    
    void return_connection(const std::string& pool_key, 
                          std::shared_ptr<PgSession> session) {
        std::lock_guard<std::mutex> lock(pools_mutex_);
        
        auto it = pools_.find(pool_key);
        if (it != pools_.end()) {
            it->second->release(session);
        }
    }
    
    void cleanup_all() {
        std::lock_guard<std::mutex> lock(pools_mutex_);
        
        for (auto& [key, pool] : pools_) {
            pool->cleanup_idle_connections();
        }
    }
    
    void shutdown_all() {
        std::lock_guard<std::mutex> lock(pools_mutex_);
        
        for (auto& [key, pool] : pools_) {
            pool->shutdown();
        }
        pools_.clear();
    }
};
```

### 资源管理和超时处理

```cpp
class ResourceManager {
private:
    struct QueryContext {
        std::string query_id;
        std::chrono::steady_clock::time_point start_time;
        std::chrono::seconds timeout;
        bool cancelled;
    };
    
    std::map<std::string, QueryContext> active_queries_;
    std::mutex queries_mutex_;
    std::thread timeout_monitor_thread_;
    bool shutdown_requested_;
    
public:
    ResourceManager() : shutdown_requested_(false) {
        // 启动超时监控线程
        timeout_monitor_thread_ = std::thread(&ResourceManager::monitor_timeouts, this);
    }
    
    ~ResourceManager() {
        shutdown();
    }
    
    std::string start_query(const std::string& sql, 
                           std::chrono::seconds timeout = std::chrono::seconds(30)) {
        std::lock_guard<std::mutex> lock(queries_mutex_);
        
        std::string query_id = generate_query_id();
        active_queries_[query_id] = {
            query_id,
            std::chrono::steady_clock::now(),
            timeout,
            false
        };
        
        return query_id;
    }
    
    void end_query(const std::string& query_id) {
        std::lock_guard<std::mutex> lock(queries_mutex_);
        active_queries_.erase(query_id);
    }
    
    bool is_query_cancelled(const std::string& query_id) {
        std::lock_guard<std::mutex> lock(queries_mutex_);
        
        auto it = active_queries_.find(query_id);
        if (it != active_queries_.end()) {
            return it->second.cancelled;
        }
        return false;
    }
    
    void cancel_query(const std::string& query_id) {
        std::lock_guard<std::mutex> lock(queries_mutex_);
        
        auto it = active_queries_.find(query_id);
        if (it != active_queries_.end()) {
            it->second.cancelled = true;
        }
    }
    
    void shutdown() {
        shutdown_requested_ = true;
        if (timeout_monitor_thread_.joinable()) {
            timeout_monitor_thread_.join();
        }
    }
    
private:
    void monitor_timeouts() {
        while (!shutdown_requested_) {
            {
                std::lock_guard<std::mutex> lock(queries_mutex_);
                
                auto now = std::chrono::steady_clock::now();
                for (auto& [query_id, ctx] : active_queries_) {
                    auto elapsed = now - ctx.start_time;
                    if (elapsed > ctx.timeout) {
                        ctx.cancelled = true;
                        log_warning("Query timeout: " + query_id);
                    }
                }
            }
            
            std::this_thread::sleep_for(std::chrono::seconds(1));
        }
    }
    
    std::string generate_query_id() {
        static std::atomic<uint64_t> counter(0);
        return "query_" + std::to_string(counter++);
    }
};
```

## 测试策略

### 单元测试

```cpp
// 消息解析测试
TEST(MessageParserTest, ParseStartupMessage) {
    std::vector<uint8_t> buffer = {/* StartupMessage 字节 */};
    MessageParser parser;
    auto msg = parser.parse(buffer);
    ASSERT_NE(msg, nullptr);
    ASSERT_EQ(msg->type(), MessageType::STARTUP);
}

// 类型转换测试
TEST(TypeMappingTest, IntegerConversion) {
    Value v(42);
    std::string text = value_to_text(v, "int32");
    ASSERT_EQ(text, "42");
    
    Value v2 = text_to_value("42", "int32");
    ASSERT_EQ(v2.as_int32(), 42);
}

// 错误处理测试
TEST(ErrorHandlingTest, ErrorCodeMapping) {
    std::string sqlstate = error_code_mapping["table_not_found"];
    ASSERT_EQ(sqlstate, "42P01");
}

// 状态机测试
TEST(ProtocolStateMachineTest, StateTransition) {
    PgSession session;
    ASSERT_EQ(session.current_state(), ProtocolState::STARTUP);
    
    session.handle_startup_message({});
    ASSERT_EQ(session.current_state(), ProtocolState::AUTHENTICATING);
    
    session.send_auth_ok();
    ASSERT_EQ(session.current_state(), ProtocolState::READY);
}
```

### 集成测试

```cpp
// DBeaver 连接测试
TEST(IntegrationTest, DBeaver_Connection) {
    PgServer server;
    server.start(5432);
    
    // 使用 PostgreSQL 客户端连接
    PQconnectdb("host=localhost port=5432 user=postgres");
    
    // 验证连接成功
    ASSERT_TRUE(connection_established);
    
    server.stop();
}

// 查询执行测试
TEST(IntegrationTest, QueryExecution) {
    auto result = execute_query("SELECT * FROM test_table");
    ASSERT_EQ(result.rows.size(), expected_row_count);
    ASSERT_EQ(result.columns.size(), expected_column_count);
}

// 事务测试
TEST(IntegrationTest, TransactionManagement) {
    begin_transaction();
    execute_query("INSERT INTO test_table VALUES (1, 'test')");
    commit_transaction();
    
    auto result = execute_query("SELECT * FROM test_table WHERE id = 1");
    ASSERT_EQ(result.rows.size(), 1);
}

// 预处理语句测试
TEST(IntegrationTest, PreparedStatements) {
    parse_statement("SELECT * FROM test_table WHERE id = $1");
    bind_statement({Value(1)});
    auto result = execute_statement();
    ASSERT_EQ(result.rows.size(), 1);
}
```

### 性能测试

```cpp
// 吞吐量测试
TEST(PerformanceTest, Throughput) {
    auto start = std::chrono::high_resolution_clock::now();
    
    for (int i = 0; i < 10000; ++i) {
        execute_query("SELECT 1");
    }
    
    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
    
    double qps = 10000.0 / (duration.count() / 1000.0);
    ASSERT_GT(qps, 1000);  // 至少 1000 QPS
}

// 并发测试
TEST(PerformanceTest, Concurrency) {
    const int num_threads = 10;
    std::vector<std::thread> threads;
    
    for (int i = 0; i < num_threads; ++i) {
        threads.emplace_back([i]() {
            for (int j = 0; j < 100; ++j) {
                execute_query("SELECT " + std::to_string(i * 100 + j));
            }
        });
    }
    
    for (auto& t : threads) {
        t.join();
    }
    
    // 验证所有查询都成功执行
    ASSERT_EQ(successful_queries, num_threads * 100);
}

// 大结果集测试
TEST(PerformanceTest, LargeResultSet) {
    auto result = execute_query("SELECT * FROM large_table LIMIT 100000");
    
    auto start = std::chrono::high_resolution_clock::now();
    size_t total_size = 0;
    for (const auto& row : result.rows) {
        total_size += row.size();
    }
    auto end = std::chrono::high_resolution_clock::now();
    
    auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
    double throughput = total_size / (duration.count() / 1000.0) / (1024 * 1024);  // MB/s
    ASSERT_GT(throughput, 100);  // 至少 100 MB/s
}
```

### 兼容性测试

```cpp
// DBeaver 元数据查询测试
TEST(CompatibilityTest, DBeaver_Metadata) {
    // DBeaver 连接后会执行这些查询
    auto tables = execute_query("SELECT * FROM pg_tables");
    ASSERT_GT(tables.rows.size(), 0);
    
    auto columns = execute_query("SELECT * FROM pg_columns");
    ASSERT_GT(columns.rows.size(), 0);
    
    auto indexes = execute_query("SELECT * FROM pg_indexes");
    // 可能为空，但不应该出错
}

// psql 兼容性测试
TEST(CompatibilityTest, psql_Commands) {
    // 测试常见的 psql 命令
    auto result = execute_query("\\dt");  // 列出表
    ASSERT_TRUE(result.success);
    
    result = execute_query("\\d test_table");  // 描述表
    ASSERT_TRUE(result.success);
}
```

## 部署和配置

### 构建集成

添加到主 CMakeLists.txt：

```cmake
# 添加 pgserver 库
add_subdirectory(src/pgserver)

# 链接到主可执行文件
target_link_libraries(tzdb_server pgserver)

# 链接依赖
target_link_libraries(pgserver PRIVATE
    asio
    openssl
    pthread
)
```

### 配置文件示例

```yaml
# pgserver.conf
server:
  port: 5432
  host: 0.0.0.0
  max_connections: 100
  
connection:
  idle_timeout: 300  # 秒
  query_timeout: 30  # 秒
  
authentication:
  method: md5  # md5 或 scram-sha-256
  
logging:
  level: info  # debug, info, warn, error
  file: /var/log/tzdb/pgserver.log
  
performance:
  thread_pool_size: 16
  buffer_size: 65536
```

### 启动

```bash
# 基本启动
./tzdb_server --pg-port 5432 --db-path /path/to/database

# 使用配置文件
./tzdb_server --config pgserver.conf

# 调试模式
./tzdb_server --pg-port 5432 --log-level debug
```

## 错误处理和调试

### 错误响应格式

PostgreSQL 错误响应包含以下字段：

```cpp
// 错误字段类型
'S' = Severity (ERROR, FATAL, PANIC)
'C' = SQLSTATE Code (5 字符)
'M' = Message
'D' = Detail
'H' = Hint
'P' = Position
'F' = File
'L' = Line
'R' = Routine
```

### 日志记录

```cpp
// 启用详细日志
LOG_DEBUG("Received message: type=%c, length=%d", msg_type, msg_length);
LOG_DEBUG("Sending response: %s", response.to_string().c_str());

// 性能日志
LOG_INFO("Query executed: sql=%s, duration=%ldms, rows=%d", 
         sql.c_str(), duration_ms, row_count);

// 错误日志
LOG_ERROR("Query failed: sql=%s, error=%s, sqlstate=%s",
          sql.c_str(), error_msg.c_str(), sqlstate.c_str());
```

## 兼容性考虑

### PostgreSQL 版本兼容性

- **目标版本**：PostgreSQL 12+
- **协议版本**：3.0(自 PostgreSQL 7.4 起)
- **支持的功能**：
  - 简单查询(Query)
  - 扩展查询(Parse/Bind/Execute)
  - 预处理语句
  - 事务管理
  - 错误恢复

### DBeaver 特定功能

- **支持的 DBeaver 版本**：21.0+
- **必需功能**：
  - 元数据查询(pg_catalog)
  - 连接参数协商
  - 错误恢复(Sync 消息)
  - 预处理语句缓存

## 性能优化

### 连接池配置

```cpp
ConnectionPool pool(
    100,  // 最大连接数
    std::chrono::seconds(300)  // 空闲超时
);
```

### 查询缓存策略

```cpp
// 预处理语句缓存：每个连接 100 个
// 元数据缓存：5 分钟过期
// 结果集缓存：仅用于小结果集(< 1MB)
```

### 异步处理

- 使用 ASIO 库实现异步 I/O
- 线程池大小：CPU 核数 × 2-4
- 缓冲区大小：64KB

## 安全考虑

### 认证机制

```cpp
// 支持的认证方式
1. MD5 密码认证(向后兼容)
2. SCRAM-SHA-256 密码认证(推荐)
3. SSL 证书认证(可选)

// 密码存储
- 不存储明文密码
- 使用加盐哈希
- 支持密码过期策略
```

### 访问控制

```cpp
// 权限检查
- 表级权限：SELECT, INSERT, UPDATE, DELETE
- 列级权限：可选
- 行级权限：可选

// 审计日志
- 记录所有 DDL 操作
- 记录敏感数据访问
- 记录认证失败
```

## 监控和维护

### 关键指标

```cpp
// 连接指标
- 活跃连接数
- 连接等待时间
- 连接超时次数

// 查询指标
- 每秒查询数(QPS)
- 平均查询时间
- 慢查询数量

// 错误指标
- 错误率
- 常见错误类型
- 恢复成功率
```

### 健康检查

```cpp
// 定期检查
- 连接池状态
- 内存使用
- 磁盘空间
- 网络连接

// 告警阈值
- 连接数 > 90% 容量
- 平均查询时间 > 100ms
- 错误率 > 1%
```

---

## 实现总结

本指南提供了完整的 PostgreSQL 协议适配实现方案，包括：

### 核心组件
✅ 协议状态机(7 个状态)
✅ 完整消息处理(20+ 消息类型)
✅ 数据类型映射(15+ 类型)
✅ 错误处理和恢复机制
✅ 连接池和资源管理
✅ 元数据查询系统
✅ 事务管理支持

### 关键特性
✅ 支持简单查询和扩展查询
✅ 预处理语句缓存
✅ 参数化查询
✅ 事务隔离级别映射
✅ 错误代码映射(SQLSTATE)
✅ 连接超时和查询超时
✅ 并发连接管理

### 测试覆盖
✅ 单元测试(消息、类型、状态机)
✅ 集成测试(连接、查询、事务)
✅ 性能测试(吞吐量、并发、大结果集)
✅ 兼容性测试(DBeaver、psql)

### 部署就绪
✅ CMake 构建集成
✅ 配置文件支持
✅ 日志记录系统
✅ 监控和告警
✅ 安全认证机制
