---
title: "raserver 工程设计与项目意义"
description: "raserver 工程设计与项目意义"
---

# raserver 工程设计与项目意义

## 1. 项目定位

`raserver` 是 TZDB 的远程访问服务核心，承担“数据库能力网络化”的职责：  
把本地数据库执行能力封装为可远程调用的服务接口，并提供统一的连接管理、协议封包、SQL执行、结果回传与客户端 SDK 适配。

在工程结构上，它既是：

- 服务端网络执行引擎（`ServerMain` / 连接线程）
- 协议编解码中枢（`DataInfoFormat` 系列）
- 客户端 API 实现层（`libtzdb`）

## 2. 总体架构

工程可分为四层：

1. 网络与 I/O 层  
`network/*` + `IoModel/*` + `NetPool*`  
负责 TCP/UDP 连接、监听、事件分发、收发与连接生命周期管理。

2. 协议与序列化层  
`ProtocolFormat*` + `RASClass*` + `SqlResult*` + `ResultAll*`  
负责传输协议（包头/压缩/分包）与指令结构体（SQL执行、元数据、监控、导入导出等）编解码。

3. 执行与会话层  
`RAShandle*` + `RAServer.cpp`  
负责连接会话、数据库句柄、事务控制、SQL执行路径、结果集游标与元信息刷新策略。

4. 对外接口层  
`libtzdb.*` + `inc/rascom/libtzdb.h`  
对外提供 C/C++ 客户端调用接口（connect/open/execute/fetch/getdata/meta/monitor/import/export/backup/cluster）。

## 3. 核心设计

### 3.1 指令对象化协议

`stringToStruct()` 根据包类型创建对应的 `DataInfoFormat` 子类（如 `PackSQLExDrite`、`GenerallyCode`、`OpenConfig`、`SqlResult`、`DbMeta`）。  
每个指令对象统一提供：

- `structToString()`：结构到字节流
- `stringToStruct()`：字节流到结构
- `pFunction()`（服务端）：执行业务
- `resultBuffer()`：结果回包
- `recode()`（客户端）：结果落地到本地句柄

这个设计把“协议解析 + 业务执行 + 回包格式”绑定在同一对象，扩展新命令时改动边界清晰。

### 3.2 连接与线程模型

服务端启动后：

1. `ServerMain` 初始化 `dbrENV` 与监听 socket
2. 每个新连接创建 `dbrConnect` 和独立处理线程（`connectFunction`）
3. 线程循环：收包 -> 解析 -> 执行 -> 回包

并行模式是“连接级线程隔离”，便于会话独立、问题定位和故障隔离。

### 3.3 I/O 与连接池抽象

`NetPool` 与 `IOMode` 把平台相关 I/O（epoll/select 等）与业务解耦：

- `IO_HANDLE` 统一事件句柄接口
- `IOMultiModel` 管理监听与通信句柄
- `NetPoolImpl` 提供上层可用的 `create/send/recv` API

同时 `ProtocolFormatPool` 提供协议对象复用，降低频繁分配开销。

### 3.4 协议可靠性设计

`TcpProtocol` / `UdpProtocol` 支持：

- 包头校验与序列号
- 压缩/解压缩
- UDP 分包与重组

这使网络传输层具备可扩展与可观测基础，不仅能传 SQL 文本，也能承载大块数据（导入导出、备份等）。

### 3.5 客户端 SDK 一体化

`libtzdb.cpp` 提供类 SQLite 风格调用：

- 连接：`tzdb_connect` / `tzdb_open`
- 执行：`tzdb_execute_direct` / `tzdb_execute_callback`
- 取数：`tzdb_stmt_fetch` / `tzdb_stmt_getdata`
- 管理：`tzdb_get_meta` / `tzdb_get_monitor` / `tzdb_commit` / `tzdb_rollback`
- 数据交换：`import/export/backup/cluster`

应用方可在不关心底层协议细节的情况下完成远程数据库访问。

## 4. 典型请求链路

以 `tzdb_execute_direct` 为例：

1. 客户端将 SQL 封装为 `PackSQLExDrite`
2. `SendAndRecvStruct` 发送到服务端并阻塞等待
3. 服务端 `connectFunction -> packageExecute`
4. `stringToStruct` 还原对象并调用 `pFunction`
5. 执行 SQL / 事务逻辑，构建 `SqlResult` 或 `GenerallyCode`
6. `resultBuffer` 回包
7. 客户端 `recode` 把结果写回本地 `dbrSTMT` 上下文

这条链路形成了“远程执行但本地句柄体验”的一致调用语义。

## 5. 项目意义

`raserver` 的核心意义在于把 TZDB 从“嵌入式引擎能力”提升为“可服务化能力”：

- 统一访问入口：不同语言和进程都可通过同一协议接入
- 能力可扩展：SQL、元信息、监控、导入导出、备份、集群操作纳入同一框架
- 工程可复用：网络层、协议层、执行层分层清晰，适合持续演进
- 平台化基础：为 ODBC 驱动、工具链、运维系统提供稳定后端

对整体产品而言，`raserver` 是连接数据库内核与外部生态（驱动、工具、业务系统）的关键桥梁。

## 6. 现阶段改进方向

从代码状态看，建议继续加强：

- 生命周期与内存安全：局部仍有手动内存管理复杂路径
- 错误码/异常语义统一：网络、解析、执行失败返回体系可进一步标准化
- 连接模型优化：在高并发下可评估线程池化连接处理策略
- 可观测性建设：指标上报、慢查询、链路追踪与结构化日志
- 协议版本治理：为客户端兼容升级提供明确版本协商机制

总体上，`raserver` 已具备完整的服务化骨架和工程分层，是 TZDB 面向外部系统集成的基础设施组件。

