---
title: "NetPoolRpc vs NetPoolRpcTsn 对比"
description: "NetPoolRpc vs NetPoolRpcTsn 对比"
---

# NetPoolRpc vs NetPoolRpcTsn 对比

## 概述

本文档对比原有的 `NetPoolRpc`（基于 TCP/UDP）和新的 `NetPoolRpcTsn`（基于 TS_Lib TSN 网络）的实现差异。

## 架构对比

### NetPoolRpc（原实现）

```
┌─────────────────────────────────────────┐
│         RPC 应用层                      │
│  (callRpc, registerMethod, etc.)        │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      NetPoolRpc 中间层                  │
│  (请求/响应管理、序列化)                │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      NetPool 网络层                  │
│  (TCP/UDP 连接管理)                     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      操作系统网络栈                      │
│  (TCP/UDP Socket)                       │
└─────────────────────────────────────────┘
```

### NetPoolRpcTsn（新实现）

```
┌─────────────────────────────────────────┐
│         RPC 应用层                      │
│  (callRpc, registerMethod, etc.)        │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      NetPoolRpcTsn 中间层               │
│  (请求/响应管理、序列化)                │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      TS_Lib 接口层                      │
│  (TSN 通道管理)                         │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      TSN 网络栈                         │
│  (时间敏感网络)                         │
└─────────────────────────────────────────┘
```

## 详细对比

### 1. 连接管理

#### NetPoolRpc

```cpp
// 基于 TCP Socket
const ConnectMT *con_mt = findTcpDestHandle(ip, port);
if (!con_mt) {
    createTcpConnect(ip, port);
}

// ConnectMT 包含：
// - std::shared_ptr<CONNECT> con_
// - ProtocolFormatPool *protocol_pool_ptr_
// - TZMutex con_mutex_
```

**特点**：
- 使用 `ConnectMT` 对象管理连接
- 每个连接有独立的协议池
- 支持多种协议类型

#### NetPoolRpcTsn

```cpp
// 基于 TS_Lib 通道
CONNECTION_ID_TYPE channel_id = findAndCreateDestChannel(ip, port);

// 通道管理：
// - dest_channels_: (ip:port) -> CONNECTION_ID_TYPE
// - channel_addresses_: CONNECTION_ID_TYPE -> (ip:port)
```

**特点**：
- 使用 `CONNECTION_ID_TYPE` 标识通道
- 简化的通道映射
- 直接使用 TS_Lib 接口

### 2. 数据发送

#### NetPoolRpc

```cpp
// 使用 netWrite 发送
const CONNECT::errorCode ret = con_mt->con_->netWrite(
    reinterpret_cast<const char *>(stream.GetData()),
    stream.GetPosition(),
    protocol_mt->getProtocolPrt(),
    dest_addr.get()
);
```

**流程**：
1. 获取连接对象
2. 获取协议对象
3. 调用 `netWrite()` 发送数据
4. 检查返回的错误码

#### NetPoolRpcTsn

```cpp
// 使用 TS_Lib 发送
int send_ret = sendToTsChannel(
    channel_id,
    reinterpret_cast<const char *>(stream.GetData()),
    stream.GetPosition()
);
```

**流程**：
1. 获取通道 ID
2. 调用 `sendToTsChannel()` 发送数据
3. 检查返回的字节数

### 3. 数据接收

#### NetPoolRpc

```cpp
// 通过 IO 模型回调接收
static short io_recv_callback(IO_HANDLE *, void *arg);

// 接收到数据后：
ProtocolContext *protocol_mt = con_mt->protocol_pool_ptr_->getProtocol();
// 数据存储在 ProtocolFormat 对象中
```

**特点**：
- 异步回调模式
- 使用 IO 模型（epoll/select/kqueue）
- 协议对象池管理

#### NetPoolRpcTsn

```cpp
// 通过 TS_Lib 接收
int recv_len = recvFromTsChannel(channel_id, buffer, buffer_len);

// 接收到数据后：
// 直接反序列化为 DataInfoFormat
```

**特点**：
- 同步接收模式（可扩展为异步）
- 直接使用 TS_Lib 接口
- 简化的数据处理流程

### 4. 请求/响应管理

#### NetPoolRpc

```cpp
// 等待响应
struct PendingRequest {
    std::unique_ptr<DataInfoFormat> response;
    bool completed = false;
    TZSemaphore sem;
};

std::map<uint64_t, std::unique_ptr<PendingRequest>> pending_requests_;

// 等待
if (timeout_ms > 0) {
    timeout = !pending->sem.time_wait(timeout_ms);
} else {
    pending->sem.wait();
}
```

**相同点**：
- 使用信号量同步
- 支持超时等待
- 请求 ID 映射

#### NetPoolRpcTsn

```cpp
// 完全相同的实现
struct PendingRequest {
    std::unique_ptr<DataInfoFormat> response;
    bool completed = false;
    TZSemaphore sem;
};

std::map<uint64_t, std::unique_ptr<PendingRequest>> pending_requests_;
```

### 5. 服务器启动

#### NetPoolRpc

```cpp
// 创建 TCP 监听器
short ret = createTcpListener(ip, port);
if (ret != 0) {
    LOG_ERROR("Failed to create TCP listener");
    return false;
}
```

**流程**：
1. 创建 TCP socket
2. 绑定地址和端口
3. 监听连接
4. 接受连接并处理

#### NetPoolRpcTsn

```cpp
// 创建 TS_Lib 监听通道
CONNECTION_ID_TYPE listen_id = CreateTsChannel(ip, port, UDP_TYPE_RECV);
if (listen_id == -1) {
    LOG_ERROR("Failed to create TS_Lib listen channel");
    return false;
}
```

**流程**：
1. 调用 TS_Lib 创建接收通道
2. 保存监听通道 ID
3. 接收 RPC 请求

### 6. 线程模型

#### NetPoolRpc

```
┌─────────────────────────────────────────┐
│      IO 模型线程                        │
│  (epoll/select/kqueue)                  │
│  - 监听连接                             │
│  - 接收数据                             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      线程池                             │
│  - 处理 RPC 请求                        │
│  - 执行服务方法                         │
└─────────────────────────────────────────┘
```

#### NetPoolRpcTsn

```
┌─────────────────────────────────────────┐
│      TS_Lib 接收线程                    │
│  - 监听 TS_Lib 通道                     │
│  - 接收数据                             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      线程池                             │
│  - 处理 RPC 请求                        │
│  - 执行服务方法                         │
└─────────────────────────────────────────┘
```

## 公共 API 兼容性

### 完全兼容的 API

| API | NetPoolRpc | NetPoolRpcTsn |
|-----|-----------|---------------|
| `callRpc()` | ✓ | ✓ |
| `registerMethod()` | ✓ | ✓ |
| `registerServiceInstance()` | ✓ | ✓ |
| `startRpcServer()` | ✓ | ✓ |
| `init()` | ✓ | ✓ |

### 继承的 API（可能不使用）

| API | NetPoolRpc | NetPoolRpcTsn | 说明 |
|-----|-----------|---------------|------|
| `createTcpConnect()` | ✓ | ✓ | 继承自 NetPool，RPC 不使用 |
| `createTcpListener()` | ✓ | ✓ | 继承自 NetPool，RPC 不使用 |
| `sendTcp()` | ✓ | ✓ | 继承自 NetPool，RPC 不使用 |
| `recv()` | ✓ | ✓ | 继承自 NetPool，RPC 不使用 |

## 性能对比

### NetPoolRpc

**优点**：
- 成熟稳定的 TCP/UDP 实现
- 支持多种协议
- 灵活的 IO 模型选择

**缺点**：
- 网络延迟较高
- 不保证时间确定性
- 不适合实时应用

### NetPoolRpcTsn

**优点**：
- 低延迟、确定性网络
- 时间敏感网络支持
- 适合实时应用

**缺点**：
- 依赖 TS_Lib 实现
- 需要 TSN 网络硬件支持
- 学习曲线陡峭

## 迁移指南

### 步骤 1：替换类

```cpp
// 原代码
auto pool = std::make_unique<NetPoolRpc>();

// 新代码
auto pool = std::make_unique<NetPoolRpcTsn>();
```

### 步骤 2：验证 API 调用

由于公共 API 完全兼容，无需修改应用代码。

### 步骤 3：测试

1. 单元测试
2. 集成测试
3. 性能测试
4. 压力测试

## 代码示例对比

### 客户端代码

#### NetPoolRpc

```cpp
NetPoolRpc pool;
pool.init();

auto request = std::make_unique<DataInfoFormat>();
request->setServiceName("UserService");
request->setMethodName("GetUser");

auto response = pool.callRpc(std::move(request), "192.168.1.100", 8080, 5000);
if (response) {
    // 处理响应
}
```

#### NetPoolRpcTsn

```cpp
NetPoolRpcTsn pool;
pool.init();

auto request = std::make_unique<DataInfoFormat>();
request->setServiceName("UserService");
request->setMethodName("GetUser");

auto response = pool.callRpc(std::move(request), "192.168.1.100", 8080, 5000);
if (response) {
    // 处理响应
}
```

**完全相同！**

### 服务器代码

#### NetPoolRpc

```cpp
NetPoolRpc pool;
pool.init();

pool.registerMethod("UserService", "GetUser",
    [](const DataInfoFormat *req, ServerContext *ctx) {
        auto resp = std::make_unique<DataInfoFormat>();
        // 处理请求
        return resp;
    }
);

pool.startRpcServer("0.0.0.0", 8080);
```

#### NetPoolRpcTsn

```cpp
NetPoolRpcTsn pool;
pool.init();

pool.registerMethod("UserService", "GetUser",
    [](const DataInfoFormat *req, ServerContext *ctx) {
        auto resp = std::make_unique<DataInfoFormat>();
        // 处理请求
        return resp;
    }
);

pool.startRpcServer("0.0.0.0", 8080);
```

**完全相同！**

## 总结

| 方面 | NetPoolRpc | NetPoolRpcTsn |
|------|-----------|---------------|
| 网络层 | TCP/UDP | TS_Lib TSN |
| 延迟 | 中等 | 低 |
| 确定性 | 否 | 是 |
| 复杂度 | 中等 | 中等 |
| API 兼容性 | - | 100% |
| 迁移难度 | - | 极低 |
| 适用场景 | 通用 | 实时应用 |

## 结论

NetPoolRpcTsn 提供了与 NetPoolRpc 完全兼容的 API，同时利用 TS_Lib 提供的低延迟、确定性网络能力。迁移只需要改变一行代码，无需修改应用逻辑。
