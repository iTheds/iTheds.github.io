---
title: "Uoe协议适配"
description: "project-tzdb-rebuild 文档整理稿(源:raw_snapshot/docs/third_party/uoe.md)"
---

<link rel="stylesheet" type="text/css" href="../auto-number-title.css" />

# UOE 测试文档

## 目录

- [环境配置](#环境配置)
- [编译与构建](#编译与构建)
- [测试执行](#测试执行)
- [测试记录](#测试记录)
- [性能测试结果](#性能测试结果)
- [UOE 接口特殊用法](#uoe-接口特殊用法)
- [配置备份](#配置备份)

---

## 环境配置

### 系统信息

- **操作系统**: openEuler release 22.03 (LTS-SP3)
- **编译器**: gcc (GCC) 10.3.1

### 主机 IP 配置

| 主机  | TSN IP   | 管理 IP        | 系统                                     |
|-----|----------|--------------|----------------------------------------|
| 天脉  | 1.0.0.5  | 10.5.226.228 | 天脉os                                   |
| 主机1 | 10.1.0.6 | 10.5.226.210 | 欧拉                                     |
| 主机2 | 10.1.0.7 | 10.5.226.44  | 欧拉                                     |
| 主机3 | 10.1.0.8 | 10.5.226.46  | RK3588 硬件 基于 Buildroot 定制的嵌入式 Linux 系统 |

**注意**: 测试 IP 地址可通过 CMake 配置:

```bash
cmake -B build -DLOCAL_NET_IP=10.1.0.7
```

### 可用端口

- 5000
- 20000
- 60000+ (用于测试)

### 天脉链接配置

- IP: 10.5.226.228
- 配置: 10.5.226.228:1118:2:1000:10000

---

## 编译与构建

### UOE 库文件

| 文件名              | 大小        | 目标主机         | 更新日期       |
|------------------|-----------|--------------|------------|
| libuoeliba_DPU.a | 17,714 字节 | 10.5.226.210 | 2025/09/08 |
| libuoeliba_IPU.a | 17,714 字节 | 10.5.226.44  | 2025/10/18 |
| libuoeliba_MMU.a | 17,810 字节 | 10.5.226.46  | 2025/09/22 | 

rockchip

### UOE 驱动加载

```bash
insmod /home/HwHiAiUser/CMP_TEST/libs/uoedev.ko
```

---

## 测试执行

### 测试路径

```bash
/home/tzdb/tzdb-rebuild/tests/third_party_test/uoe/
```

### 测试脚本

```bash
# UOE 基础测试
../tests/third_party_test/uoe/run_uoe_test.sh 10.1.0.7 60000 100 0 120
```

### 单元测试命令

#### UOE 连接测试

- [x] **双向通信测试**
  ```bash
  ./bin/tests/unit_test/unit_test --gtest_filter="UoeConnectTest.BidirectionalCommunication"
  ```

- [x] **所有 UOE 连接测试**
  ```bash
  ./bin/tests/unit_test/unit_test --gtest_filter="UoeConnectTest.*"
  ```

- [x] **UOE IO 模型测试**
  ```bash
  ./bin/tests/unit_test/unit_test --gtest_filter="UoeIOModelTest.*"
  ```

#### RPC 测试

- [x] **并发 RPC 测试**
  ```bash
  ./bin/tests/unit_test/unit_test --gtest_filter="NetPoolRpcTest.ConcurrentRpcTest"
  ```

### 编译特定目标

```bash
make -j80 unit_test
make net_pool_rpc_test
make uoe_io_model_test
```

### 远程连接

```bash
ssh root@10.5.226.44
```

---

## 测试记录

### 测试场景总览

| 测试场景                   | 状态     | 说明        |
|------------------------|--------|-----------|
| UOE Linux 本地单机         | ✅ 通过   | 基础功能验证    |
| UOE Linux 本地分布式        | ✅ 通过   | 2-3 节点分布式 |
| UOE Linux 多主机分布式       | ✅ 通过   | 跨主机分布式    |
| UOE 天脉本地               | ✅ 通过   | 天脉 OS 集成  |
| 1 天脉 + 1 欧拉            | ❌ 失败   | 跨平台数据同步问题 |
| 1 RT3588 + 1 欧拉        | 🔄 测试中 | -         |
| 1 天脉 + 2 欧拉 + 1 RT3588 | 🔄 测试中 | -         |

### 测试详情

#### UOE Linux 本地单机测试

**状态**: ✅ 通过

启动后，部分节点可能有发送失败超时的情况，但都稳定运行。

#### UOE Linux 本地分布式测试

**状态**: ✅ 通过

分布式服务启动后有些发送失败超时情况，但趋于稳定。

**性能指标**:

- 数据吞吐量: 2.4-3.8 MB/s (100-200 行数据)
- 吞吐量测试: 97 req/s, 平均延迟 10254 μs/req

**测试结果示例**:

```
[TEST] Data Throughput: FAILED - 0.976562MB in 394ms (2.478585 MB/s), 100 rows, 10 threads
[TEST] SQL Prepared: FAILED - Inserted 1 rows via prepared statement
[TEST] Data Throughput: FAILED - 0.976562MB in 410ms (2.381860 MB/s), 200 rows, 10 threads
[TEST] Data Throughput: FAILED - 4.882812MB in 1302ms (3.750240 MB/s), 50 rows, 5 threads
NetPoolRpc Throughput [通过] 0.00ms - 20 requests in 205ms | Throughput: 97 req/s | Latency: 10254us/req
```

#### UOE Linux 多主机分布式测试

**状态**: ✅ 通过

**性能指标**:

- 数据吞吐量: 3.6-3.7 MB/s (44-50 行数据)

**测试结果示例**:

```
[TEST] Data Throughput: FAILED - 4.882812MB in 1328ms (3.676817 MB/s), 44 rows, 5 threads
```

#### UOE 天脉本地测试

**状态**: ✅ 通过

**性能指标**:

- 数据吞吐量: 15.4 MB/s (50 行数据)
- 吞吐量测试: 31 req/s, 平均延迟 31508 μs/req

**测试结果示例**:

```
[通过] Data Throughput - 4.882813MB in 317ms (15.403194 MB/s), 50 rows, 5 threads
NetPoolRpc Throughput [通过] 0.00ms - 20 requests in 630ms | Throughput: 31 req/s | Latency: 31508us/req
```

#### 测试 1: 1 天脉 + 1 欧拉

**状态**: ❌ 失败

**问题描述**: 能够选主，但建立表后数据不对。

**关键错误日志**:

```bash
1970-01-01 09:19:25 [udp_protocol.cpp:292:processReceivedPacket] ERROR - Package size mismatch: header says 524391, actual data size is 102
1970-01-01 09:19:25 [udp_protocol.cpp:198:getPayload] ERROR - Cannot get payload, not all packages received: 0/0
1970-01-01 09:19:25 [uoe_connect.cpp:352:netRead] ERROR - Failed to get payload data
```

```bash
2000-01-01 00:04:57 [net_pool_rpc_uoe.cpp:369:callRpc] ERROR - All 19 attempts to call RPC to 10.1.0.7:58080 failed (RTT: 20ms, timeout multiplier: 2.5, request 946685096509636764)
2000-01-01 00:04:57 [client_functions.hpp:198:call_rpc] ERROR - RPC error in method_name:DataServerTypeConfig.append_entries case : RPC call failed: no response received
2000-01-01 00:04:57 [raft_node.hpp:665:AsyncSendHeartbeatToNode] WARN  - leader 2 failed to send heartbeat to node 1 case CallRpcFailed
[RAFT-ELECTION] *** ELECTION WON! Node 2 won election with 3/2 votes (majority: 2) ***
[RAFT-ELECTION] *** ELECTION WON! Node 2 won election with 4/2 votes (majority: 2) ***
2000-01-01 00:04:59 [net_pool_rpc_uoe.cpp:344:callRpc] WARN  - Attempt 1/19: UOE Request timed out after 50 ms (RTT-based), package(1564043376397819928), request 946685099707597021
2000-01-01 00:04:59 [net_pool_rpc.cpp:381:putElemBuffer] WARN  - Received response for unknown request ID: 4773464703488
2000-01-01 00:04:59 [binary_deserializer.cpp:39:OnObjectEnd] ERROR - [BinaryDeserializer::OnObjectEnd] Expected terminator (65535), but found field_id=255, nesting_level=1
2000-01-01 00:04:59 [binary_deserializer.cpp:40:OnObjectEnd] ERROR - [BinaryDeserializer::OnObjectEnd] This usually means a LogRecord was serialized without Begin/End
2000-01-01 00:04:59 [net_pool_rpc.cpp:364:putElemBuffer] ERROR - Deserialization error: Failed to deserialize: expected end of object, but found field id: 255
```

**下一步**: 先测试以太网方案。

#### 测试 2: 1 RT3588 + 1 欧拉

**状态**: 🔄 测试中

#### 测试 3: 1 天脉 + 2 欧拉 + 1 RT3588

**状态**: 🔄 测试中

#### 测试 4: 以太网参照测试 (1 天脉 + 2 欧拉 + 1 RT3588)

**状态**: ✅ 通过 (基础功能)

**问题**: 数据插入时可能出现超时错误，一旦出现错误很难恢复。

**根本原因分析**:

- callRpc 中发送数据后的等待机制存在问题
- 数据丢失需要修复，需要直接有效的方式
- 重传和包校验可缓解问题，但关键是效率
- 考虑添加 CRC 校验

### 工作日志

#### [12.3] UOE RPC 集成与并发问题

**工作内容**:

- UOE 测试 RPC 集成，大数据量测试无法通过，与协议相关，已修改完成
- 运行 project 613 测试

**发现问题**:

- 变量读取与写入并发情况，导致网络判断链接数量异常
- 建议使用读写锁解决

**隐患**:

- 未测试 UOE 接口与其他网卡之间的通用性
- 原 UDP 阻塞式 IO 模型可绑定到 INADDR_ANY，接收多个局域网数据
- UOE 不一定支持，导致数据库节点只能部署在局域网内

#### [12.4] UOE 跨机器通信问题

**问题**:

- 两个机器之间无法成功接收数据
- UOE sender/receiver 测试正常，但产生丢包

**测试命令**:

```bash
./bin/tools/uoe_receiver 10.1.0.7 60001 50 0 60
insmod /home/HwHiAiUser/CMP_TEST/libs/uoedev.ko
```

**根本原因**:

- 单机可连接，但跨节点无法接收数据
- 疑似库不对称，无法同时使用同一可执行文件
- RPC Shell 能通信，但其他节点不行

**解决方案**:

- 以 DPU 主机为主，IPU 建立新仓库，设置新库
- 在 DPU 编译，然后移动到 IPU 执行

#### [12.5] UOE 连接句柄问题

**发现**:

- Call 时如果没有发送句柄，默认创建绑定到发送端 IP 的连接

**代码位置**:

```cpp
const ConnectMT *NetPoolRpcUoe::findAndCreateUoeDestHandle(const char *ip, uint16_t port) {
  uint16_t port_add = 0;
  int16_t ret = createUoeConnect(ip, port_add, ip, port_add);
  if (ret != 0) {
    LOG_ERROR("Failed to create UOE connection to %s:%u", ip, port_add);
    return nullptr;
  }
}
```

**进展**:

- Linux 分布式测试通过
- 开始加上天脉进行集成测试
- 解决天脉上 UOE socket 的转换问题

#### [12.6] 天脉异常处理

**问题**: 异常未被接住

**命令**: `run "c1", "uoeApp6", "10.1.0.5", "8989"`

#### [12.8] 丢包与重传机制

**问题**:

- UOE 发送出现丢包问题
- 需要重新测试 2 节点分布式

**改进**:

- 新编写 RPC 部分重发功能，未完整测试
- 天脉异常接收有问题
- RPC 需要测试未进行数据接收时的生效性

#### [12.9] 异常捕获与编译问题

**发现**:

- SO 中异常无法捕获，ELF 中异常可正常捕获

**解决**:

- [x] 天脉 OS 异常无法捕获 → 改成静态库
- [x] RT3588 交叉编译 → 成功
- [x] 改善丢包问题

**问题**: 延迟发送后，数据仍在重传，但 channel recv 已超时

#### [12.10] 丢包测试与 CRC 校验

**工作内容**:

- 为 UOE 进行丢包等测试
- 添加重传和校验机制

**关键问题**:

- 重传数量控制在 3，但等待时间过多无意义
- 应以链路期望回应时间做控制

**重复发送问题**:

- 虽然超时，但数据已发送到对面
- 包号唯一标志一个数据包 (@protocol_format.h#L86)
- 接收到数据包时 (@net_pool_rpc.cpp#L329)
- 是否可保存上下文，针对数据回应而非重复执行？
- handleRpcRequest (@net_pool_rpc.cpp#L379) 是否可判断已处理过的数据包？

**跨机器问题**:

- 单机两节点正常，跨机器两节点必出错
- 重传已加，接收数据回应校验已加
- 实在不行需写网络测试验证同时发送表现

**数据验证测试** (10.1.0.6 ↔ 10.1.0.7, 50 次, 1024B):

1. 210→44: 46/50 ✓
2. 210→44: 47/50 ✓
3. 210→44: 47/50 ✓
4. 44→210: 50/50 ✓
5. 44→210: 50/50 ✓
6. 44→210: 50/50 ✓
7. 210→44: 1/50 ✗ (包后移一个位置)

**待办**:

- [ ] 测试发送停顿和接收轮询时间对数据正确性的影响
- [ ] 测试数据量对数据正确性的影响
- [ ] 分析吞吐量测试逻辑，应对不正确数据

**RT3588 配置**:

```bash
ifconfig lo up
ifconfig lo 127.0.0.1
```

#### [12.11] 序列化数据接收问题

**症状**:

```bash
1970-01-01 08:30:11 [net_pool_rpc.cpp:364:putElemBuffer] ERROR - Deserialization error: DataInfoRegistry::Create: No creator found for raft.DataServerTypeConfig.append_enpries
1970-01-01 08:30:16 [net_pool_rpc.cpp:364:putElemBuffer] ERROR - Deserialization error: Failed to deserialize: field id mismatch, expected: 4, got: 57280
1970-01-01 08:30:22 [udp_protocol.cpp:292:processReceivedPacket] ERROR - Package size mismatch: header says 1048673, actual data size is 99
1970-01-01 08:31:08 [binary_deserializer.cpp:38:OnObjectEnd] ERROR - [BinaryDeserializer::OnObjectEnd] Expected terminator (65535), but found field_id=65279, nesting_level=2
```

**分析**:

- 数据测试本身没问题
- 找不到 `raft.DataServerTypeConfig.append_enpries` (@raft_runtime.hpp#L481)
- 发送变单线程后应无丢包，重传校验能兜底
- 数据频繁序列化失败，可能数据接收不对

**单设备 2 节点测试** (主机 44):

1. 无任何错误 ✓
2. 错误: Service not found: raft (接收早于注册)
3. 错误: table already exist (非通信问题)

**结论**: 数据发送和接收有问题

#### [12.12] CRC32 校验与延迟问题

**改进**:

- 加上 CRC32 判断误包，采用查表法
- CRC32 + 重传机制确保数据准确性

**新问题**:

- 为什么有延迟收到的情况？
- 是否与线程有关？
- 发送端已发送 response，接收端收到时间却很久以后
- 加上重传等机制后，测试用例无法通过

**结论**: 可能某部分起步慢

#### [12.13] 动态转换与三节点问题

**问题修复**:

- 节点异常在 210 主机上，通过 gdb 调试发现 dynamic_cast 问题
- 使用 `bt full` 解决

**三节点问题**:

- 一个节点断电，另两个无法查询数据(超时问题)
- Call RPC 变同步后，同一时刻只能一个数据发送
- 网络重传机制导致重复 call RPC，部分请求无法执行
- Call RPC 不出现 send error，导致认为链路存在

**解决方案**:

1. 针对心跳选举，设定特定值，降低访问频率
2. 针对重传机制进行修改

#### [12.14] TCP/UDP 性能测试

**TCP Socket 性能测试**:

| 数据大小 | 平均 RTT (ms) | 最小 RTT (ms) | 最大 RTT (ms) | P99 RTT (ms) | 吞吐量 (MB/s) |
|------|-------------|-------------|-------------|--------------|------------|
| 16B  | 0.106       | 0.066       | 0.927       | 0.180        | 0.289      |
| 32B  | 0.163       | 0.041       | 7.872       | 0.809        | 0.375      |
| 64B  | 0.069       | 0.041       | 0.317       | 0.196        | 1.766      |
| 128B | 0.071       | 0.044       | 0.417       | 0.133        | 3.433      |
| 256B | 0.053       | 0.034       | 0.344       | 0.136        | 9.225      |
| 512B | 0.039       | 0.034       | 0.283       | 0.063        | 25.090     |
| 1KB  | 0.053       | 0.037       | 0.281       | 0.281        | 36.775     |
| 2KB  | 0.045       | 0.036       | 0.240       | 0.240        | 86.840     |
| 4KB  | 0.065       | 0.039       | 0.344       | 0.344        | 120.348    |
| 8KB  | 0.064       | 0.041       | 0.330       | 0.330        | 242.383    |
| 16KB | 0.065       | 0.042       | 0.363       | 0.363        | 483.806    |
| 32KB | 0.058       | 0.049       | 0.288       | 0.288        | 1073.846   |
| 64KB | 0.085       | 0.067       | 0.246       | 0.246        | 1468.481   |

**UDP 标准测试**:

| 数据大小 | 平均 RTT (ms) | 最小 RTT (ms) | 最大 RTT (ms) | P99 RTT (ms) | 成功率  | 吞吐量 (MB/s) |
|------|-------------|-------------|-------------|--------------|------|------------|
| 16B  | 0.204       | 0.098       | 0.452       | 0.303        | 100% | 0.149      |
| 32B  | 0.254       | 0.145       | 0.447       | 0.391        | 100% | 0.241      |
| 64B  | 0.237       | 0.098       | 0.406       | 0.393        | 100% | 0.516      |
| 128B | 0.226       | 0.092       | 0.749       | 0.395        | 100% | 1.081      |
| 256B | 0.155       | 0.087       | 0.280       | 0.267        | 100% | 3.157      |
| 512B | 0.147       | 0.058       | 1.630       | 0.574        | 100% | 6.643      |
| 1KB  | 0.083       | 0.053       | 0.185       | 0.185        | 100% | 23.491     |
| 1KB  | 0.080       | 0.053       | 0.143       | 0.143        | 100% | 33.326     |

**TCP Connect 性能测试**:

| 数据大小 | 平均 RTT (ms) | 最小 RTT (ms) | 最大 RTT (ms) | P99 RTT (ms) | 吞吐量 (MB/s) |
|------|-------------|-------------|-------------|--------------|------------|
| 16B  | 0.222       | 0.118       | 0.818       | 0.442        | 0.138      |
| 64B  | 0.146       | 0.062       | 1.601       | 0.727        | 0.833      |
| 256B | 0.091       | 0.061       | 0.222       | 0.175        | 5.368      |
| 1KB  | 0.091       | 0.067       | 0.171       | 0.154        | 21.405     |
| 4KB  | 0.093       | 0.076       | 0.269       | 0.190        | 83.652     |
| 16KB | 0.103       | 0.081       | 0.215       | 0.215        | 302.037    |

**UDP Connect 性能测试**:

| 数据大小 | 平均 RTT (ms) | 最小 RTT (ms) | 最大 RTT (ms) | P99 RTT (ms) | 吞吐量 (MB/s) |
|------|-------------|-------------|-------------|--------------|------------|
| 16B  | 0.502       | 0.273       | 1.363       | 1.214        | 0.061      |
| 64B  | 0.501       | 0.246       | 2.828       | 1.057        | 0.244      |
| 256B | 0.521       | 0.320       | 0.825       | 0.698        | 0.937      |
| 1KB  | 0.493       | 0.342       | 0.675       | 0.675        | 3.962      |
| 4KB  | 0.632       | 0.385       | 1.500       | 1.500        | 12.364     |
| 16KB | 1.975       | 0.820       | 20.495      | 20.495       | 15.823     |

**错误日志**:

```
2025-12-14 17:29:17 [tcp_connect.cpp:387:tzdb::TcpConnect::netRead] ERROR - [tzdb::TcpConnect::netRead] Read error [GetNetErrno():108]
2025-12-14 17:29:22 [udp_connect.cpp:285:tzdb::UdpConnect::netRead] ERROR - [tzdb::UdpConnect::netRead] Receive error [GetNetErrno():128]
```

**计算说明**:

- 吞吐量 = (数据大小 × 2) / 往返时间
- P99 = 99% 请求能在该时间内完成，衡量性能稳定性
- UDP 成功率 = 成功收到响应的数据包百分比
- UDP 使用小于 MTU 的数据包大小，避免 IP 层分片

**优化**: 进行部分优化

#### [12.15] 稳定性测试与 RAFT 优化

**工作内容**:

- 稳定后测试三次
- 修改 RAFT 中心跳和选举的重传次数
- 基本趋于稳定运行

---

## 性能测试结果

### NetPoolRpc 并发性能测试

**测试场景**: NetPoolRpcConcurrencyTest, RpcConcurrentPerformanceTest

**256B 数据测试**:

| 数据大小 | 线程数 | 总调用数 | 成功数  | 成功率  | 耗时 (ms) | 吞吐量 (req/s) | 平均延迟 (ms) |
|------|-----|------|------|------|---------|-------------|-----------|
| 256B | 2   | 1000 | 1000 | 100% | 10129   | 98.73       | 20.19     |
| 256B | 4   | 1000 | 1000 | 100% | 10126   | 98.76       | 40.38     |
| 256B | 8   | 1000 | 1000 | 100% | 10126   | 98.76       | 80.66     |
| 256B | 16  | 992  | 992  | 100% | 10027   | 98.93       | 160.45    |

**1KB 数据测试**:

| 数据大小 | 线程数 | 总调用数 | 成功数  | 成功率  | 耗时 (ms) | 吞吐量 (req/s) | 平均延迟 (ms) |
|------|-----|------|------|------|---------|-------------|-----------|
| 1KB  | 2   | 1000 | 1000 | 100% | 10107   | 98.94       | 20.20     |
| 1KB  | 4   | 1000 | 1000 | 100% | 10111   | 98.90       | 40.38     |
| 1KB  | 8   | 1000 | 1000 | 100% | 10109   | 98.92       | 80.59     |
| 1KB  | 16  | 992  | 992  | 100% | 10049   | 98.72       | 160.85    |

**4KB 数据测试**:

| 数据大小 | 线程数 | 总调用数 | 成功数  | 成功率  | 耗时 (ms) | 吞吐量 (req/s) | 平均延迟 (ms) |
|------|-----|------|------|------|---------|-------------|-----------|
| 4KB  | 2   | 1000 | 1000 | 100% | 10275   | 97.32       | 20.53     |
| 4KB  | 4   | 1000 | 1000 | 100% | 10116   | 98.85       | 40.40     |
| 4KB  | 8   | 1000 | 1000 | 100% | 10116   | 98.85       | 80.63     |
| 4KB  | 16  | 992  | 992  | 100% | 10053   | 98.68       | 160.89    |

**性能指标说明**:

- 吞吐量 = 成功调用次数 / 总耗时，单位为调用/秒
- 平均延迟 = 从发送请求到接收响应的平均时间，单位为毫秒
- 成功率 = 成功完成的 RPC 调用与总调用次数的比率

---

## 交叉编译备份命令

windows 下命令行执行:

```bash
clear
cmake -DCMAKE_TOOLCHAIN_FILE=../aarch64-linux-gnu.toolchain.cmake .. -G "Unix Makefiles"
make -j80 rpc_shell
cmake -DCMAKE_TOOLCHAIN_FILE=../aarch64-linux-gnu.toolchain.cmake -DCMAKE_BUILD_TYPE=Release .. -G "Unix Makefiles""
make -j80 interactive_test
```

如果遇到环境问题，可以采用显示指定:

```bash
cmake -DCMAKE_TOOLCHAIN_FILE=../aarch64-linux-gnu.toolchain.cmake \
      -DCMAKE_C_COMPILER="D:/project/gcc_6_3_1_mingw32_aarch64_linux_gnu/bin/aarch64-linux-gnu-gcc.exe" \
      -DCMAKE_CXX_COMPILER="D:/project/gcc_6_3_1_mingw32_aarch64_linux_gnu/bin/aarch64-linux-gnu-g++.exe" \
      .. -G "Unix Makefiles"
```

支持使用 linaro 进行交叉编译，手动设置方式:

```bash
# 在当前 shell 设置工具链根
AARCH64_TOOLCHAIN_ROOT=/d/project/gcc-linaro-7.5.0-2019.12-i686-mingw32_aarch64-linux-gnu \
cmake -DCMAKE_TOOLCHAIN_FILE=../aarch64-linux-gnu.toolchain.cmake .. -G "Unix Makefiles"
```

## UOE 接口特殊用法

> ⚠️ **重要**: UOE 接口与标准 socket 接口存在以下差异

### 1. 缓冲区大小限制

- `uoeRecvfrom` 的缓冲区**必须**是 **65536 字节**
- 不能使用其他大小，否则可能导致接收失败

### 2. 端口字节序

- `uoeRecvfrom` 返回的 `sin_port` 字段**不是**标准的网络字节序
- 而是**直接的主机字节序**值
- 无需调用 `ntohs()` 转换

### 3. 必须进行 bind 才能接收回信

可以 bind 0。

### 代码示例

```cpp
char buffer[65536];  // 必须是 65536
struct sockaddr_in addr;
socklen_t addr_len = sizeof(addr);

// 接收数据
ssize_t n = uoeRecvfrom(fd, buffer, 65536, 0, 
                        (struct sockaddr*)&addr, &addr_len);

// 端口已经是主机字节序，直接使用
uint16_t port = addr.sin_port;  // 不需要 ntohs()
```

---

## 配置备份

### Eclipse/IDE 包含路径配置

#### 配置方案 1 (完整版)

```
$(CONFIG_PATH)
"${workspace_loc:/TZRDBdyn/src/include/tzdbcom}"
"${workspace_loc:/TZRDBdyn/src/inc}"
"${workspace_loc:/TZRDBdyn/src/include}"
$(PROJECT_PATH)
$(PROJECT_PATH)/src
$(PLATFORM)/target/common/include
$(PLATFORM)/target/acoreosmp/include/posix
$(PLATFORM)/target/common/include/drv
$(PLATFORM)/target/common/include/rtl
$(PLATFORM)/target/common/include/rtl/sys
$(PLATFORM)/target/common/include/os
$(PLATFORM)/target/common/include/inet
$(PLATFORM)/target/common/include/inet/sys
$(PLATFORM)/target/common/include/arch
$(PLATFORM)/target/acoreosmp/include
$(PLATFORM)/target/acoreosmp/include/ekernel
$(PLATFORM)/target/common/include/kernel
$(PLATFORM)/target/acoreosmp/include/os
$(PLATFORM)/target/acoreosmp/include/rtp
$(PLATFORM)/target/acoreosmp/include/gjb
$(PLATFORM)/target/acoreosmp/include/vxworks
$(PLATFORM)/target/acoreosmp/usrsrc/project/app/rtpcpp
```

#### 配置方案 2 (精简版)

```
$(CONFIG_PATH)
$(PROJECT_PATH)
$(PROJECT_PATH)/src
$(PLATFORM)/target/common/include
$(PLATFORM)/target/common/include/os
$(PLATFORM)/target/common/include/drv
$(PLATFORM)/target/common/include/rtl
$(PLATFORM)/target/common/include/rtl/sys
$(PLATFORM)/target/common/include/inet
$(PLATFORM)/target/common/include/arch
$(PLATFORM)/target/acoreosmp/include
$(PLATFORM)/target/acoreosmp/include/ekernel
$(PLATFORM)/target/common/include/kernel
$(PLATFORM)/target/acoreosmp/include/os
$(PLATFORM)/target/acoreosmp/include/rtp
$(PLATFORM)/target/acoreosmp/include/gjb
$(PLATFORM)/target/acoreosmp/include/posix
$(PLATFORM)/target/acoreosmp/include/vxworks
$(PLATFORM)/target/acoreosmp/usrsrc/project/app/rtpcpp
```

#### 宏定义

LOCAL_NET_IP="10.1.0.5"
CPU=ARMV8A
UOE_ENABLE=1
ACOREMCOS_MCORE
ACOREMCOS_64BIT
BOARD=$(CONFIG_BOARD)
ACOREOS_CPP

