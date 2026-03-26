---
title: "网络池RPCTSN实现指南"
description: "project-tzdb-rebuild 文档整理稿（源：raw_snapshot/docs/distribution/NET_POOL_RPC_TSN_IMPLEMENTATION_GUIDE.md）"
---

# NetPoolRpcTsn 实现指南

## 概述

本文档说明如何使用 TS_Lib（TSN 网络接口）替换 NetPoolRpc 的底层网络实现。新的实现 `NetPoolRpcTsn` 保持与原有 `NetPoolRpc` 相同的公共 API，但底层使用 TS_Lib 进行通信。

## 文件结构

```
inc/distribution/network/
├── net_pool_rpc_tsn.h          # NetPoolRpcTsn 头文件（已创建）
└── ...

distribution/network/
├── net_pool_rpc_tsn.cpp        # NetPoolRpcTsn 实现（已创建）
└── ...
```

## 核心类设计

### NetPoolRpcTsn 类

继承自 `NetPool`，提供与 `NetPoolRpc` 相同的公共接口：

```cpp
class NetPoolRpcTsn : public NetPool {
 public:
  // 初始化
  void init() override;

  // 客户端 API
  std::unique_ptr<DataInfoFormat> callRpc(...);

  // 服务器 API
  void registerMethod(...);
  void registerServiceInstance(...);
  bool startRpcServer(...);

 private:
  // TS_Lib 通道管理
  CONNECTION_ID_TYPE findAndCreateDestChannel(...);
  int recvFromTsChannel(...);
  int sendToTsChannel(...);
};
```

## TS_Lib 接口集成

### 1. 通道创建

**当前占位符实现**：
```cpp
CONNECTION_ID_TYPE NetPoolRpcTsn::findAndCreateDestChannel(const char *ip, uint16_t port) {
  // 需要调用 TS_Lib 的通道创建函数
  // CONNECTION_ID_TYPE new_channel_id = CreateTsChannel(ip, port, UDP_TYPE_SEND);
}
```

**需要实现的 TS_Lib 调用**：
- 根据 TS_Lib.h 中的接口定义，调用相应的通道创建函数
- 使用 `UDP_TYPE_SEND` 创建发送通道
- 使用 `UDP_TYPE_RECV` 创建接收通道
- 返回 `CONNECTION_ID_TYPE` 作为通道标识

### 2. 数据发送

**当前占位符实现**：
```cpp
int NetPoolRpcTsn::sendToTsChannel(CONNECTION_ID_TYPE channel_id, const char *buffer, size_t buffer_len) {
  // 需要调用 TS_Lib 的发送函数
  // int send_len = TS_Send(channel_id, buffer, buffer_len);
}
```

**需要实现的 TS_Lib 调用**：
- 调用 TS_Lib 的发送函数，发送序列化后的 RPC 请求
- 返回实际发送的字节数
- 失败时返回 -1

### 3. 数据接收

**当前占位符实现**：
```cpp
int NetPoolRpcTsn::recvFromTsChannel(CONNECTION_ID_TYPE channel_id, char *buffer, size_t buffer_len) {
  // 需要调用 TS_Lib 的接收函数
  // int recv_len = TS_Recv(channel_id, buffer, buffer_len);
}
```

**需要实现的 TS_Lib 调用**：
- 调用 TS_Lib 的接收函数，接收 RPC 请求/响应
- 返回实际接收的字节数
- 失败时返回 -1

### 4. 服务器监听

**当前占位符实现**：
```cpp
bool NetPoolRpcTsn::startRpcServer(const char *ip, uint16_t port) {
  // 需要调用 TS_Lib 的监听通道创建函数
  // CONNECTION_ID_TYPE listen_id = CreateTsChannel(ip, port, UDP_TYPE_RECV);
}
```

**需要实现的 TS_Lib 调用**：
- 创建监听通道用于接收 RPC 请求
- 使用 `UDP_TYPE_RECV` 类型
- 保存监听通道 ID 供后续使用

## 实现步骤

### 第一步：分析 TS_Lib API

1. 查看 `inc/third_party/tsn/TS_Lib.h` 中的完整 API 定义
2. 确定以下函数的签名和使用方法：
   - 通道创建函数
   - 数据发送函数
   - 数据接收函数
   - 通道关闭函数
   - 错误处理函数

### 第二步：实现通道管理

1. 在 `recvFromTsChannel()` 中实现数据接收
2. 在 `sendToTsChannel()` 中实现数据发送
3. 在 `findAndCreateDestChannel()` 中实现通道创建

### 第三步：实现服务器功能

1. 在 `startRpcServer()` 中实现监听通道创建
2. 实现消息接收循环
3. 集成 RPC 请求处理

### 第四步：测试和验证

1. 编写单元测试
2. 验证 RPC 请求/响应流程
3. 测试并发场景
4. 性能测试

## 关键映射表

| 功能 | 原 NetPoolRpc | NetPoolRpcTsn |
|------|--------------|---------------|
| 连接创建 | TCP socket | TS_Lib 通道 |
| 数据发送 | netWrite() | sendToTsChannel() |
| 数据接收 | netRead() | recvFromTsChannel() |
| 连接管理 | ConnectMT | CONNECTION_ID_TYPE |
| 监听 | TCP listener | TS_Lib 接收通道 |

## 公共 API 兼容性

### 客户端 API

```cpp
// 发送 RPC 请求
std::unique_ptr<DataInfoFormat> callRpc(
    std::unique_ptr<DataInfoFormat> request,
    const char *ip,
    uint16_t port,
    int timeout_ms = 0
);
```

**使用示例**：
```cpp
NetPoolRpcTsn pool;
pool.init();

auto request = std::make_unique<DataInfoFormat>();
request->setServiceName("MyService");
request->setMethodName("MyMethod");

auto response = pool.callRpc(std::move(request), "127.0.0.1", 8080, 5000);
if (response) {
    // 处理响应
}
```

### 服务器 API

```cpp
// 注册方法处理函数
void registerMethod(
    const std::string &service_name,
    const std::string &method_name,
    const MethodHandler &handler
);

// 注册服务实例
void registerServiceInstance(
    const std::string &service_name,
    const ServiceHandlePtr &service
);

// 启动服务器
bool startRpcServer(const char *ip, uint16_t port);
```

**使用示例**：
```cpp
NetPoolRpcTsn pool;
pool.init();

// 注册方法
pool.registerMethod("MyService", "MyMethod", 
    [](const DataInfoFormat *req, ServerContext *ctx) {
        // 处理请求
        return std::make_unique<DataInfoFormat>();
    }
);

// 启动服务器
pool.startRpcServer("0.0.0.0", 8080);
```

## 继承的父类函数

NetPoolRpcTsn 继承自 NetPool，自动获得以下函数：

```cpp
// 连接管理
short createTcpConnect(const char *dest_ip, uint16_t dest_port, 
                       const char *local_ip = nullptr, uint16_t local_port = 0);
short createTcpListener(const char *ip, uint16_t port);
short createUdpLocalConnect(const char *ip, uint16_t port);

// 数据发送
int sendTcp(const char *buffer, size_t buffer_len, const char *ip, uint16_t port);
int sendUdp(const char *buffer, size_t buffer_len, const char *ip, uint16_t port);

// 数据接收
int recv(char *&buffer, size_t &buffer_len, size_t &buffer_max_len, size_t offset = 0);
```

**注意**：这些函数在 NetPoolRpcTsn 中可能不被使用，因为 RPC 通信完全通过 TS_Lib 进行。如果需要，可以在 NetPoolRpcTsn 中重写这些函数以支持 TS_Lib。

## 错误处理

### 通道创建失败

```cpp
CONNECTION_ID_TYPE channel_id = findAndCreateDestChannel(ip, port);
if (channel_id == -1) {
    LOG_ERROR("Failed to create channel to %s:%u", ip, port);
    return nullptr;
}
```

### 数据发送失败

```cpp
int send_ret = sendToTsChannel(channel_id, buffer, buffer_len);
if (send_ret <= 0) {
    LOG_ERROR("Failed to send data");
    return nullptr;
}
```

### 数据接收失败

```cpp
int recv_len = recvFromTsChannel(channel_id, buffer, buffer_len);
if (recv_len < 0) {
    LOG_ERROR("Failed to receive data");
    return -1;
}
```

## 线程安全

NetPoolRpcTsn 使用以下互斥锁保证线程安全：

- `service_handlers_mutex_`：保护服务处理函数和实例映射
- `channels_mutex_`：保护通道映射
- `pending_requests_mutex_`：保护等待响应的请求映射

## 性能考虑

1. **通道缓存**：使用 `dest_channels_` 缓存已创建的通道，避免重复创建
2. **异步处理**：使用线程池处理 RPC 请求，不阻塞接收线程
3. **内存管理**：使用 `unique_ptr` 和 `shared_ptr` 自动管理内存

## 集成步骤

### 1. 更新 CMakeLists.txt

```cmake
# 添加 TS_Lib 依赖
target_link_libraries(your_target ts_lib)

# 添加源文件
add_library(net_pool_rpc_tsn
    distribution/network/net_pool_rpc_tsn.cpp
)
```

### 2. 包含头文件

```cpp
#include "distribution/network/net_pool_rpc_tsn.h"
```

### 3. 使用 NetPoolRpcTsn

```cpp
// 替换 NetPoolRpc
// auto pool = std::make_unique<NetPoolRpc>();
auto pool = std::make_unique<NetPoolRpcTsn>();

pool->init();
pool->startRpcServer("0.0.0.0", 8080);
```

## 调试和日志

所有操作都有详细的日志输出：

```cpp
LOG_TRACE("[%s] Creating new channel to %s:%u", __FUNCTION__, ip, port);
LOG_INFO("[%s] Created new channel %d to %s", __FUNCTION__, new_channel_id, channel_key.c_str());
LOG_ERROR("[%s] Failed to create TS_Lib channel", __FUNCTION__);
```

使用 `LOG_TRACE` 级别可以跟踪所有操作。

## 已知限制

1. **占位符实现**：`recvFromTsChannel()` 和 `sendToTsChannel()` 当前为占位符，需要根据实际 TS_Lib API 实现
2. **通道创建**：`findAndCreateDestChannel()` 和 `startRpcServer()` 中的通道创建需要实现
3. **错误处理**：需要根据 TS_Lib 的错误码进行适当的错误处理

## 后续工作

1. 获取完整的 TS_Lib API 文档
2. 实现 `recvFromTsChannel()` 和 `sendToTsChannel()`
3. 实现通道创建和管理
4. 编写完整的单元测试
5. 性能测试和优化
6. 文档更新

## 参考资源

- `inc/third_party/tsn/TS_Lib.h` - TS_Lib 头文件
- `inc/distribution/network/net_pool_rpc.h` - 原 NetPoolRpc 实现
- `distribution/network/net_pool_rpc.cpp` - 原 NetPoolRpc 实现
- `inc/distribution/network/net_pool.h` - NetPool 基类
- `inc/distribution/network/net_pool_impl.h` - NetPool 基类
