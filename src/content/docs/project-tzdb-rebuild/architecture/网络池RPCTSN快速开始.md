---
title: "网络池RPCTSN快速开始"
description: "project-tzdb-rebuild 文档整理稿(源：raw_snapshot/docs/distribution/NET_POOL_RPC_TSN_QUICK_START.md)"
---

# NetPoolRpcTsn 快速开始指南

## 概述

本指南帮助开发者快速完成 NetPoolRpcTsn 的 TS_Lib 接口实现。

## 文件位置

```
项目根目录/
├── inc/distribution/network/
│   └── net_pool_rpc_tsn.h              # 头文件(已创建)
├── distribution/network/
│   └── net_pool_rpc_tsn.cpp            # 实现文件(已创建)
└── docs/distribution/
    ├── NET_POOL_RPC_TSN_IMPLEMENTATION_GUIDE.md
    ├── NET_POOL_RPC_COMPARISON.md
    ├── NET_POOL_RPC_TSN_INTEGRATION_CHECKLIST.md
    └── NET_POOL_RPC_TSN_QUICK_START.md  # 本文件
```

## 第一步：理解 TS_Lib 接口

### 查看 TS_Lib 头文件

```bash
cat inc/third_party/tsn/TS_Lib.h | head -200
```

### 关键类型定义

```cpp
// 连接 ID 类型
typedef unsigned int CONNECTION_ID_TYPE;

// 消息大小类型
typedef unsigned int MESSAGE_SIZE_TYPE;

// 消息模式
typedef enum {
    PUB_SUB,      // 发布/订阅
    CLIENT,       // 客户端
    SERVER        // 服务器
} MESSAGING_PATTERN_TYPE;

// UDP 类型
#define UDP_TYPE_RECV  0xA5A5A5A5  // 接收
#define UDP_TYPE_SEND  0x7E7E7E7E  // 发送

// 通道数量限制
#define MAX_TSS_NUM    1000        // 最大 TSS 通道数
#define MAX_TRANS_NUM  100         // 最大传输连接数
```

### 关键函数(需要在 TS_Lib 文档中查找)

```cpp
// 创建通道
CONNECTION_ID_TYPE CreateTsChannel(
    const char *ip,
    uint16_t port,
    uint32_t type  // UDP_TYPE_SEND 或 UDP_TYPE_RECV
);

// 发送数据
int TS_Send(
    CONNECTION_ID_TYPE channel_id,
    const char *buffer,
    size_t buffer_len
);

// 接收数据
int TS_Recv(
    CONNECTION_ID_TYPE channel_id,
    char *buffer,
    size_t buffer_len
);

// 关闭通道
int CloseTs Channel(CONNECTION_ID_TYPE channel_id);
```

## 第二步：实现 TS_Lib 接口调用

### 2.1 实现 `sendToTsChannel()`

**位置**：`distribution/network/net_pool_rpc_tsn.cpp` 第 ~430 行

**当前代码**：

```cpp
int NetPoolRpcTsn::sendToTsChannel(CONNECTION_ID_TYPE channel_id, const char *buffer, size_t buffer_len) {
  if (channel_id == -1 || !buffer || buffer_len == 0) {
    LOG_ERROR("[%s] Invalid parameters", __FUNCTION__);
    return -1;
  }

  LOG_TRACE("[%s] Sending to TS_Lib channel %d, size=%zu", __FUNCTION__, channel_id, buffer_len);

  // 占位符实现
  int send_len = -1;  // 实际应该发送到TS_Lib

  if (send_len < 0) {
    LOG_ERROR("[%s] Failed to send to TS_Lib channel %d", __FUNCTION__, channel_id);
    return -1;
  }

  return send_len;
}
```

**需要替换的代码**：

```cpp
// 占位符实现
int send_len = -1;  // 实际应该发送到TS_Lib
```

**替换为**：

```cpp
// 调用 TS_Lib 发送函数
int send_len = TS_Send(channel_id, buffer, buffer_len);
```

### 2.2 实现 `recvFromTsChannel()`

**位置**：`distribution/network/net_pool_rpc_tsn.cpp` 第 ~410 行

**当前代码**：

```cpp
int NetPoolRpcTsn::recvFromTsChannel(CONNECTION_ID_TYPE channel_id, char *buffer, size_t buffer_len) {
  if (channel_id == -1 || !buffer || buffer_len == 0) {
    LOG_ERROR("[%s] Invalid parameters", __FUNCTION__);
    return -1;
  }

  LOG_TRACE("[%s] Receiving from TS_Lib channel %d", __FUNCTION__, channel_id);

  // 占位符实现
  int recv_len = -1;  // 实际应该从TS_Lib接收

  if (recv_len < 0) {
    LOG_ERROR("[%s] Failed to receive from TS_Lib channel %d", __FUNCTION__, channel_id);
    return -1;
  }

  return recv_len;
}
```

**需要替换的代码**：

```cpp
// 占位符实现
int recv_len = -1;  // 实际应该从TS_Lib接收
```

**替换为**：

```cpp
// 调用 TS_Lib 接收函数
int recv_len = TS_Recv(channel_id, buffer, buffer_len);
```

### 2.3 实现 `findAndCreateDestChannel()`

**位置**：`distribution/network/net_pool_rpc_tsn.cpp` 第 ~65 行

**当前代码**：

```cpp
CONNECTION_ID_TYPE NetPoolRpcTsn::findAndCreateDestChannel(const char *ip, uint16_t port) {
  // ... 检查缓存 ...

  LOG_TRACE("[%s] Creating new channel to %s:%u", __FUNCTION__, ip, port);

  // 创建新的TS_Lib通道
  CONNECTION_ID_TYPE new_channel_id = -1;

  // 这里应该调用TS_Lib的通道创建函数
  // 示例：new_channel_id = CreateTsChannel(ip, port, UDP_TYPE_SEND);

  if (new_channel_id == -1) {
    LOG_ERROR("[%s] Failed to create TS_Lib channel to %s:%u", __FUNCTION__, ip, port);
    return -1;
  }

  // ... 保存通道信息 ...
}
```

**需要替换的代码**：

```cpp
// 这里应该调用TS_Lib的通道创建函数
// 示例：new_channel_id = CreateTsChannel(ip, port, UDP_TYPE_SEND);
```

**替换为**：

```cpp
// 调用 TS_Lib 创建发送通道
new_channel_id = CreateTsChannel(ip, port, UDP_TYPE_SEND);
```

### 2.4 实现 `startRpcServer()`

**位置**：`distribution/network/net_pool_rpc_tsn.cpp` 第 ~210 行

**当前代码**：

```cpp
bool NetPoolRpcTsn::startRpcServer(const char *ip, uint16_t port) {
  // ... 参数检查 ...

  // 创建TS_Lib监听通道
  CONNECTION_ID_TYPE listen_id = -1;

  // 这里应该调用TS_Lib的通道创建函数
  // 示例：listen_id = CreateTsChannel(ip, port, UDP_TYPE_RECV);

  if (listen_id == -1) {
    LOG_ERROR("[%s] Failed to create TS_Lib listen channel on %s:%u", __FUNCTION__, ip, port);
    return false;
  }

  // ... 保存监听通道 ...
}
```

**需要替换的代码**：

```cpp
// 这里应该调用TS_Lib的通道创建函数
// 示例：listen_id = CreateTsChannel(ip, port, UDP_TYPE_RECV);
```

**替换为**：

```cpp
// 调用 TS_Lib 创建接收通道
listen_id = CreateTsChannel(ip, port, UDP_TYPE_RECV);
```

## 第三步：添加 TS_Lib 头文件包含

**位置**：`distribution/network/net_pool_rpc_tsn.cpp` 第 1-20 行

**检查是否已包含**：

```cpp
#include "third_party/tsn/TS_Lib.h"
```

如果没有，添加到包含列表中。

## 第四步：编译和测试

### 编译

```bash
cd /home/ithedslonnie/Projects/TZDB_PROJECT_WORK/tzdb-rebuild
mkdir -p build
cd build
cmake ..
make
```

### 检查编译错误

```bash
# 查看编译输出
make 2>&1 | grep -i "error"

# 查看链接错误
make 2>&1 | grep -i "undefined reference"
```

### 运行测试

```bash
# 如果有现有的网络测试
./tests/distribution/net_pool_test

# 或运行所有测试
ctest
```

## 第五步：验证实现

### 检查清单

- [ ] 所有占位符已替换
- [ ] 编译无错误
- [ ] 编译无警告
- [ ] 链接成功
- [ ] 基本功能测试通过

### 验证代码

```bash
# 检查是否还有占位符
grep -n "占位符\|placeholder\|TODO\|FIXME" distribution/network/net_pool_rpc_tsn.cpp

# 检查是否有未实现的函数
grep -n "return -1;  // 实际应该" distribution/network/net_pool_rpc_tsn.cpp
```

## 常见问题

### Q1: TS_Lib 函数找不到

**症状**：编译时出现 `undefined reference to 'CreateTsChannel'`

**解决方案**：

1. 检查 TS_Lib 头文件是否正确包含
2. 检查 CMakeLists.txt 中是否链接了 TS_Lib 库
3. 检查 TS_Lib 库文件是否存在

### Q2: 通道创建失败

**症状**：运行时 `findAndCreateDestChannel()` 返回 -1

**解决方案**：

1. 检查 IP 和端口是否正确
2. 检查 TS_Lib 是否正确初始化
3. 检查 TS_Lib 错误码含义

### Q3: 数据发送失败

**症状**：`sendToTsChannel()` 返回 -1

**解决方案**：

1. 检查通道 ID 是否有效
2. 检查缓冲区是否有效
3. 检查网络连接是否正常

### Q4: 内存泄漏

**症状**：长时间运行后内存不断增长

**解决方案**：

1. 检查通道是否正确关闭
2. 检查缓冲区是否正确释放
3. 使用 Valgrind 检测内存泄漏

## 调试技巧

### 启用详细日志

```cpp
// 在 net_pool_rpc_tsn.cpp 顶部添加
#define LOG_LEVEL LOG_TRACE

// 或在编译时指定
cmake -DCMAKE_BUILD_TYPE=Debug ..
```

### 添加断点

```cpp
// 在关键位置添加
LOG_INFO("[%s] Channel ID: %d", __FUNCTION__, channel_id);
LOG_INFO("[%s] Send length: %d", __FUNCTION__, send_len);
```

### 使用 GDB 调试

```bash
# 编译调试版本
cmake -DCMAKE_BUILD_TYPE=Debug ..
make

# 运行 GDB
gdb ./your_program
(gdb) break net_pool_rpc_tsn.cpp:100
(gdb) run
(gdb) print channel_id
```

## 性能优化建议

### 1. 通道缓存

已实现，通过 `dest_channels_` 缓存通道，避免重复创建。

### 2. 批量发送

```cpp
// 可以考虑实现批量发送
std::vector<std::unique_ptr<DataInfoFormat>> batch;
for (auto &req : batch) {
    sendToTsChannel(channel_id, ...);
}
```

### 3. 异步接收

```cpp
// 创建专门的接收线程
std::thread recv_thread([this]() {
    while (server_started_) {
        char buffer[4096];
        int len = recvFromTsChannel(listen_channel_id_, buffer, sizeof(buffer));
        if (len > 0) {
            // 处理接收到的数据
        }
    }
});
```

## 下一步

1. **完成 TS_Lib 接口实现**
    - 替换所有占位符
    - 编译和测试

2. **编写单元测试**
    - 测试通道创建
    - 测试数据发送/接收
    - 测试错误处理

3. **编写集成测试**
    - 测试客户端-服务器通信
    - 测试并发场景
    - 测试长连接

4. **性能测试**
    - 测试吞吐量
    - 测试延迟
    - 对比 NetPoolRpc

5. **代码审查和发布**
    - 代码审查
    - 文档更新
    - 版本发布

## 参考资源

- **头文件**：`inc/distribution/network/net_pool_rpc_tsn.h`
- **实现**：`distribution/network/net_pool_rpc_tsn.cpp`
- **TS_Lib 头文件**：`inc/third_party/tsn/TS_Lib.h`
- **原 NetPoolRpc**：`inc/distribution/network/net_pool_rpc.h`
- **实现指南**：`docs/distribution/NET_POOL_RPC_TSN_IMPLEMENTATION_GUIDE.md`
- **对比文档**：`docs/distribution/NET_POOL_RPC_COMPARISON.md`

## 联系方式

如有问题，请参考：

- 实现指南：`NET_POOL_RPC_TSN_IMPLEMENTATION_GUIDE.md`
- 对比文档：`NET_POOL_RPC_COMPARISON.md`
- 集成清单：`NET_POOL_RPC_TSN_INTEGRATION_CHECKLIST.md`

---

**最后更新**：2024-10-30
**版本**：1.0
