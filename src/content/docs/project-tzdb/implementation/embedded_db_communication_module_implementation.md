---
title: "Embedded DB Communication Module Implementation"
description: "raserver 通信模块的分层设计、核心组件、I/O 模型与适配性实现"
---

# raserver 嵌入式数据库通信模块设计与实现

## 引言

`raserver` 作为嵌入式数据库系统通信模块，负责客户端与数据库之间的网络通信、数据传输和协议解析，是服务化访问链路的核心组成。

## 设计目标

1. 跨平台兼容：支持 Linux、Windows 等系统。
2. 多协议支持：支持 TCP/UDP。
3. 高性能：高效处理并发连接和传输。
4. 可扩展性：便于扩展新协议和功能。
5. 可靠性：保证数据传输稳定与完整。
6. 安全性：提供基础安全机制。

## 通信模块架构

### 底层网络接口层

- 核心类：`netSocket`
- 职责：封装套接字创建、绑定、监听、收发、关闭等基础 API。

### 连接抽象层

- 核心类：`CONNECT`、`TcpConnect`、`UdpConnect`
- 职责：统一连接状态与读写行为，隔离 TCP/UDP 差异。

### 协议层

- 核心类：`ProtocolFormat`、`TcpProtocol`、`UdpProtocol`、`UdpSinglePackage`
- 职责：包格式定义、封包解包、压缩与协议级处理。

### 地址抽象层

- 核心类：`NetInfo`、`NetInfoHost`、`NetInfoVertex`
- 职责：统一地址表示，支持主机地址与拓扑节点抽象。

### 连接池管理层

- 核心类：`NetPool`
- 职责：连接复用、发送接收分发、任务调度。

## 核心组件

### `netSocket`

- 支持 TCP/UDP 初始化（`TCP_TYPE` / `UDP_TYPE`）。
- 提供 `init/bind/listen/accept/connect/read/write/close` 统一接口。
- 通过平台差异封装实现跨系统一致 API。

### `CONNECT`

- 定义连接类型：
  - `tcp_con`
  - `tcp_listen`
  - `udp_con`
  - `udp_broadcast`
  - `udp_multicast`
- 统一暴露 `init/accept/connect/netWrite/netRead/close`。

### `TcpConnect` 与 `UdpConnect`

- 继承 `CONNECT`，实现协议差异化读写流程。
- 对外维持一致调用模型，便于上层模块复用。

### `NetInfo`

- 提供地址输入、字符串化、地址比较等基础抽象能力。

### `NetPool`

- 支持目标地址注册、监听源注册、任务分发、发送接收。
- 在多连接场景下承担统一网络资源管理职责。

## 协议设计

### TCP 协议

- 负责包格式定义、封包与解析、压缩解压、错误检测与恢复。

### UDP 协议

- 由 `UdpProtocol`/`UdpSinglePackage` 负责。
- 支持分片与重组流程。
- 面向高实时链路场景提供轻量传输能力。

## 跨平台实现

通过条件编译统一平台实现差异，例如：

```cpp
#if defined(LINUX_x86) || defined(KYLIN)
#include <arpa/inet.h>
#include <netdb.h>
#include <net/if.h>
#include <sys/ioctl.h>
#include <ifaddrs.h>
#elif _WIN32
#include <WinSock2.h>
#include <iphlpapi.h>
#pragma comment(lib, "iphlpapi.lib")
#endif
```

## I/O 模型

支持多种模型并统一抽象：

- `IoEpoll`（Linux）
- `IoSelect`（通用）
- `IoWinSelect`（Windows）

## 网络质量监控与优化

通过 `NetQuality` 提供：

- 网络权重计算
- 权重映射
- 数据分发限制估算
- 网络质量展示

用于根据延迟、丢包等指标动态调优传输策略。

## 安全性设计（文档声明）

1. 传输加密
2. 客户端身份验证
3. 基于权限访问控制
4. 输入校验与过滤

## 性能优化策略

1. 连接池降低建连开销
2. 缓冲区降低传输抖动
3. 异步 I/O 提升并发能力
4. 数据压缩减少带宽占用
5. 任务队列优化调度

## 典型应用场景

1. 分布式数据库节点通信
2. 客户端-服务端访问链路
3. 多节点数据同步
4. 远程管理与监控

## 适配性设计：面向 `ts_comm_pubsub_api`

## 接口设计理念

`ts_comm_pubsub_api` 体现的关键思想：

- 发布-订阅模式（解耦发送者与接收者）
- 基于 `service_id` 的主题通信
- 回调驱动消息处理
- 同时支持单播与广播
- 面向 FACE 标准场景

## raserver 适配实现（`AcxeConnect`）

- 继承 `CONNECT`，保持通信模块抽象一致性。
- 完成协议转换：
  - 初始化映射到 `createWriter/createReader`
  - 写入映射到 `pub/sendData`
  - 回调 `netSocket_read_function` 转回内部可处理格式
- 连接状态管理：
  - `service_id_`、`connect_id_`、`dest_id_`
  - `is_pub_` 区分发布者/订阅者
  - `buffer_sem_`、`con_sem_` 保证并发安全
- 内存优化：
  - 接收缓冲：`buffer_`、`buffer_len_`
  - 发送缓冲：`send_buffer_`、`send_buffer_len_`
  - 协议封包：`ProtecolAcex package_`

## 适配收益

1. 无缝接入现有 Pub/Sub 架构
2. 扩展数据库通信模型（事件驱动）
3. 增强跨平台嵌入式兼容性
4. 在资源受限环境保持可控性能

## 适配后典型场景

1. 分布式数据同步
2. 事件驱动数据处理
3. 传感器数据流接入与落库
4. 高可用集群状态同步

## 小结

通信模块采用分层 + 抽象 + 协议适配的设计路径，能够在保持核心访问链路稳定的前提下，支持多协议、多平台与多通信架构集成，是 TZDB 服务化能力输出的关键基础设施。
