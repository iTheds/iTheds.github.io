---
title: "Service 使用策略说明"
description: "Service 使用策略说明"
---

# Service 使用策略说明

## 概览

本项目将数据库与会话操作拆分为可插拔的 Service，分为显式服务与自动服务两类:

- 显式服务(调用者明确选择)
  - `LocalDatabaseService` / `LocalSessionService`
  - `DistributedDatabaseService` / `DistributedSessionService`
  - `RpcDatabaseService` / `RpcSessionService`
- 自动服务(内部根据运行模式自动选择)
  - `DatabaseServiceAuto`

## RuntimeMode / DistributionMode 说明

- `RuntimeMode` 表示**是否需要对外提供 IPC/RPC 通道**:
  - `Embedded`:进程内调用为主，不需要 IPC 通道
  - `ClientServer`:有客户端/服务端边界，需要 IPC/RPC 通道
- `DistributionMode` 表示**数据执行模型**:
  - `Single`:单机本地执行
  - `Raft`:分布式一致性执行(Raft 状态机)
- 设置来源与映射关系:
  - `RunServer(...)` 会根据 `DataServerConfig` 设定模式
  - 约定映射:`ipc_enable=true` -> `RuntimeMode::ClientServer`
  - 约定映射:`is_cluster=true` -> `DistributionMode::Raft`，否则 `Single`
- 对服务选型的影响:
  - `RuntimeMode` 影响是否需要 `IpcServer`/RPC 通道
  - `DistributionMode` 决定 `Local*Service` 还是 `Distributed*Service`

## 使用策略

### 1) 嵌入式(Embedded)
- 单机(`DistributionMode::Single`):使用 `Local*Service`
- 分布式(`DistributionMode::Raft`):使用 `Distributed*Service`
- 推荐:嵌入式场景可以直接用 `DatabaseServiceAuto` 处理建库逻辑，减少调用方分支

### 2) 客户端/服务端(ClientServer)
- 客户端:
  - 直接使用 `Rpc*Service`(需要 `ClientConfig`)
  - 当前客户端默认走 `Connection(ClientConfig)` → `RpcSqlSession` 路径
- 服务端:
  - 使用 `Local*Service` 或 `Distributed*Service`，由 `DistributionMode` 决定

## 运行模式与调用路径

### 嵌入式 + 单机(Embedded + Single)
- 服务选型:`LocalDatabaseService` / `LocalSessionService`(或 `DatabaseServiceAuto`)
- 调用路径(简化):
  - `cpp-api.cpp` → `DatabaseServiceAuto` → `LocalDatabaseService`
  - `SqlServiceRouter`(若走 RPC/IPC)→ `LocalSessionService`
- 关键点:不依赖 `DataServer` / `ServerManager`

### 嵌入式 + Raft(Embedded + Raft)
- 服务选型:`DistributedDatabaseService` / `DistributedSessionService`
- 调用路径(简化):
  - `ServerManager` 启动 `DataServer`(分布式)
  - `SqlServiceRouter` → `DistributedSessionService` → `DataServer`(状态机执行本地逻辑)
- 关键点:服务端在同进程内，仍使用分布式服务以保持一致性

### CS + 单机(ClientServer + Single)
- 客户端服务选型:`Rpc*Service` 或 `Connection(ClientConfig)` → `RpcSqlSession`
- 服务端服务选型:`Local*Service`
- 调用路径(简化):
  - Client → `SqlRpcHandler` → `SqlServiceRouter` → `LocalSessionService`
- 关键点:IPC/RPC 仅在客户端与服务端之间

### CS + Raft(ClientServer + Raft)
- 客户端服务选型:`Rpc*Service` 或 `Connection(ClientConfig)` → `RpcSqlSession`
- 服务端服务选型:`Distributed*Service`
- 调用路径(简化):
  - Client → `SqlRpcHandler` → `SqlServiceRouter` → `DistributedSessionService` → `DataServer`
- 关键点:服务端 `ServerManager` 管理 `DataServer` 生命周期，客户端不直接接触分布式组件

## ServerManager / DataServer / IpcServer 关系说明

- `ServerManager`:服务端生命周期管理器，统一创建/销毁核心组件。
  - 必选持有 `DataServer`
  - 可选持有 `IpcServer`(由配置决定)
  - 对外提供 `GetDataServer()` 作为服务端数据面入口
- `DataServer`:服务端数据面核心执行体(本地或分布式)。
  - 承载 `CreateSession/Execute/Prepare/Binder` 等接口
  - `Raft` 模式下驱动状态机逻辑
- `IpcServer`:服务端 IPC 通道封装，仅负责通信，不包含业务逻辑。
  - 内部持有 `NetPoolRpc`
  - 不直接依赖 `DataServer`
- 依赖方向:`ServerManager` -> `DataServer`(必选)，`ServerManager` -> `IpcServer`(可选)

## IPC 启用规则与 RuntimeMode

- `ipc_enable=true` 才会创建 `IpcServer`
  - 触发点:`RunServer(...)` -> `ServerManager::Start(...)`
- 当前默认策略:
  - `ipc_enable=true` -> `RuntimeMode::ClientServer`
  - `ipc_enable=false` -> `RuntimeMode::Embedded`
- `RuntimeMode` 主要影响是否暴露 IPC/RPC 通道，本身不控制 `DataServer` 创建

## DataServer 与 RuntimeMode / DistributionMode

- `DataServer` 仅在服务端启动路径中创建:
  - `RunServer(...)` -> `ServerManager::Start(...)` -> 创建 `DataServer`
- `ipc_enable` 不影响 `DataServer` 创建，只影响 `IpcServer` 是否启用
- 纯嵌入式本地调用(未走 `RunServer`)不会创建 `DataServer`
- `RuntimeMode` 不是 `DataServer` 的开关，但通常:
  - `ClientServer` 依赖 `RunServer`，因此会创建 `DataServer`
  - `Embedded` 可只走本地路径不创建，也可显式调用 `RunServer` 创建(例如嵌入式 + Raft)
- `DistributionMode` 决定 `DataServer` 行为:
  - `Single`:本地执行，`DataServer` 主要用于统一接口
  - `Raft`:分布式执行，`DataServer` 驱动 Raft/状态机

## 典型启动流程(简化)

```text
RunServer(...)
  -> 创建 ServerManager
  -> ServerManager::Start(config)
       -> 创建 DataServer
       -> (ipc_enable) 创建 IpcServer
       -> (is_cluster) DataServer::Initialize(members)
  -> SqlRpcHandler 接收请求
  -> SqlServiceRouter 路由到 *Service
  -> *Service 调用 DataServer 或本地执行
```

## CreateDatabase 同步注册保证

- 本地路径:`DatabaseServiceAuto`/`LocalDatabaseService` 在 `DB::Open` 后立即 `AppendDb`，同步注册到 `DBInstance`
- 分布式路径:`DistributedDataServer::OpenDatabase` 使用 `Strict` 一致性提交，最终在 Raft 状态机里 `AppendDb`，提交返回后视为同步注册完成
- 因此 `Database::Database` 在 `CreateDatabase` 后检查不到 DB 属于异常情况，直接抛错是合理的

## 当前代码使用位置

### 已使用
- `DatabaseServiceAuto`
  - `src/api_sql/cpp-api.cpp:Database::Database`(构造时自动选择本地/分布式建库)
- `LocalSessionService` / `DistributedSessionService`
  - `src/server/sql_service_router.cpp` 通过 `MakeSessionService` 生成
  - `src/server/data_server.cpp`(Raft 状态机内部执行本地逻辑)
- `LocalDatabaseService` / `DistributedDatabaseService`
  - `src/server/sql_service_router.cpp` 通过 `MakeDatabaseService` 生成
- `RpcSessionService` / `RpcDatabaseService`
  - 仅在 `MakeSessionService/MakeDatabaseService` 传入 `ClientConfig` 时使用

- `SqlServiceRouter`
  - 服务端 SQL 请求路由器，承接 RPC/IPC 的 SQL 请求并转发到 `ISessionService/IDatabaseService`
  - 由 `SqlRpcHandler` 持有并调用(`src/server/sql_rpc_handlers.cpp`)
  - 根据 `DBInstance` 的 `RuntimeMode/DistributionMode` 选择 Local/Distributed 服务实现

### 未直接使用(当前路径未走到)
- `RpcSessionService` / `RpcDatabaseService`
  - 目前客户端默认使用 `Connection(ClientConfig)` → `RpcSqlSession`
  - 工厂路径未被客户端显式调用

## 备注

- `DatabaseServiceAuto` 仅用于“嵌入式/服务端”侧自动建库，不建议在客户端使用。
- 客户端若需显式 RPC 服务，可直接构造 `Rpc*Service` 或通过工厂传 `ClientConfig`。
- `SqlRpcHandler` 位于服务端 RPC 层，负责把 `sql.*` 请求映射到 `SqlServiceRouter` 处理。
- `SqlRpcHandler` 与各 Service 的关系:
  - `SqlRpcHandler` 只负责 RPC 收发与错误包装
  - 业务执行由 `SqlServiceRouter` 路由到对应 `*Service`
  - Service 不直接依赖 RPC 层
