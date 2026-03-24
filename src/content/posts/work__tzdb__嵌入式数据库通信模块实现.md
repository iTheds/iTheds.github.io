---
title: "嵌入式数据库通信模块设计"
date: "2025-3-28"
author: "Lonnie iTheds"
tags:
  - unix
draft: false
section: "work"
sourcePath: "markdown/work/tzdb/嵌入式数据库通信模块实现.md"
slug: "work/tzdb/嵌入式数据库通信模块实现"
---
# raserver嵌入式数据库通信模块设计与实现

## 1. 引言

嵌入式数据库是一种轻量级、高性能的数据库系统，通常直接集成到应用程序中，无需独立的数据库服务器进程。raserver作为一种嵌入式数据库系统，其通信模块是整个系统的核心组件，负责处理客户端与数据库之间的网络通信、数据传输以及协议解析。本文将详细介绍raserver嵌入式数据库通信模块的设计理念和实现细节。

## 2. 通信模块设计目标

raserver通信模块的设计目标包括：

1. **跨平台兼容性**：支持Linux、Windows等多种操作系统
2. **多协议支持**：同时支持TCP和UDP通信协议
3. **高性能**：高效处理并发连接和数据传输
4. **可扩展性**：易于扩展新的通信协议和功能
5. **可靠性**：确保数据传输的稳定性和完整性
6. **安全性**：提供必要的安全机制保护数据传输

## 3. 通信模块架构

raserver通信模块采用了分层设计，主要包括以下几个层次：

### 3.1 底层网络接口层

底层网络接口层封装了操作系统提供的网络API，提供了跨平台的网络通信能力。该层主要由`netSocket`类实现，负责处理最基本的套接字操作，如创建套接字、绑定地址、监听连接、发送和接收数据等。

### 3.2 连接抽象层

连接抽象层由`CONNECT`基类及其派生类组成，提供了对不同类型连接的抽象。主要包括：

- `CONNECT`：基础连接抽象类，定义了连接的基本操作和状态
- `TcpConnect`：TCP连接实现类
- `UdpConnect`：UDP连接实现类

### 3.3 协议层

协议层负责处理通信协议的封装和解析，主要由`ProtocolFormat`类及其派生类实现：

- `ProtecolNet`：协议基类
- `TcpProtocol`：TCP协议实现
- `UdpProtocol`：UDP协议实现
- `UdpSinglePackage`：UDP单包实现

### 3.4 网络地址抽象层

网络地址抽象层由`NetInfo`类及其派生类组成，提供了对网络地址的抽象：

- `NetInfo`：网络地址基类
- `NetInfoHost`：主机地址实现
- `NetInfoVertex`：网络顶点实现，用于网络拓扑构建

### 3.5 连接池管理层

连接池管理层由`NetPool`类实现，负责管理网络连接池，提高连接复用效率。

## 4. 核心组件实现

### 4.1 基础Socket封装（netSocket类）

`netSocket`类是通信模块的基础，封装了底层套接字操作，提供了跨平台的网络通信能力：

```cpp
class netSocket
{
public:
    enum tcp_or_upd_type
    {
        TCP_TYPE = 1,
        UDP_TYPE = 0,
    };

    // 初始化socket
    int init(bool tcp_udp_type = TCP_TYPE, int ip_protocol = AF_INET);
    
    // 绑定地址和端口
    int sockBind(void);
    
    // 设置监听
    short setListen(int hang_list_max_size = 5);
    
    // 接受连接
    int sockAccept(netSocket *&out_socket_tg);
    
    // 连接到服务器
    short sockConnect(const tzchar *ip = TZNULL, int port = -1);
    
    // 发送数据
    int write(const tzchar *buffer, int len = 1024, sockaddr_in *addrSet = TZNULL);
    
    // 接收数据
    int read(tzchar *buffer, int len = 1600);
    
    // 关闭连接
    int close();
};
```

该类支持TCP和UDP两种通信方式，并针对不同操作系统提供了相应的实现。

### 4.2 连接抽象（CONNECT类）

`CONNECT`类是连接的抽象基类，定义了连接的基本操作和状态：

```cpp
class CONNECT : public IO_HANDLE, public RASEdge
{
public:
    enum conType
    {
        none_con = 0x00,
        tcp_con = 0x01,    // tcp normal con
        tcp_listen = 0x02, // tcp listen
        udp_con = 0x04,    // udp normal con
        udp_broadcast = 0x08, // udp broadcast
        udp_multicast = 0x10, // udp multicast
    };
    
    // 初始化连接
    virtual errorCode init(conType tcp_udp_type = tcp_con, const NetInfo *local_addr = NULL, modeType mode_in = modeType::block, int ip_protocol = AF_INET);
    
    // 接受连接
    virtual errorCode accept(CONNECT *&new_connect, NetInfo *from_addr = NULL);
    
    // 连接到目标主机
    virtual errorCode connect(const NetInfo *dest_addr);
    
    // 发送数据
    virtual errorCode netWrite(const tzchar *buffer, int len, const NetInfo *addr = TZNULL) const;
    
    // 接收数据
    virtual errorCode netRead(tzchar *&buffer, int buffer_max_len, int &len, NetInfo **addr = NULL);
    
    // 关闭连接
    virtual errorCode close(void);
};
```

`CONNECT`类支持多种连接类型，包括TCP连接、TCP监听、UDP连接、UDP广播和UDP组播。

### 4.3 TCP连接实现（TcpConnect类）

`TcpConnect`类继承自`CONNECT`类，实现了TCP连接的具体功能：

```cpp
class TcpConnect : public CONNECT
{
public:
    // 接收TCP数据包
    virtual errorCode netReadPackage(ProtocolFormat *&elem, NetInfo **addr = NULL);
    
    // 接受连接
    virtual errorCode accept(CONNECT *&new_connect, NetInfo *from_addr = NULL);
    
    // 连接到服务器
    virtual errorCode connect(const NetInfo *dest_addr);
    
    // 初始化连接
    virtual errorCode init(conType tcp_udp_type, NetInfo *local_addr, modeType mode_in, int ip_protocol);
    
    // 发送数据
    virtual errorCode netWrite(const tzchar *buffer, int len, const NetInfo *addr = TZNULL) const;
    
    // 接收数据
    virtual errorCode netRead(tzchar *&buffer, int buffer_max_len, int &len, NetInfo **addr = NULL);
};
```

### 4.4 UDP连接实现（UdpConnect类）

`UdpConnect`类继承自`CONNECT`类，实现了UDP连接的具体功能：

```cpp
class UdpConnect : public CONNECT
{
public:
    // 接收UDP数据包
    virtual errorCode netReadPackage(ProtocolFormat *&elem, NetInfo **addr = NULL);
    
    // 接受连接
    virtual errorCode accept(CONNECT *&new_connect, NetInfo *from_addr = NULL);
    
    // 连接到服务器
    virtual errorCode connect(const NetInfo *dest_addr);
    
    // 初始化连接
    virtual errorCode init(conType tcp_udp_type, NetInfo *local_addr, modeType mode_in, int ip_protocol);
    
    // 发送数据
    virtual errorCode netWrite(const tzchar *buffer, int len, const NetInfo *addr = TZNULL) const;
    
    // 接收数据
    virtual errorCode netRead(tzchar *&buffer, int buffer_max_len, int &len, NetInfo **addr = NULL);
};
```

### 4.5 网络地址抽象（NetInfo类）

`NetInfo`类是网络地址的抽象基类，提供了对网络地址的封装：

```cpp
class NetInfo
{
public:
    // 设置地址和端口
    virtual void setInput(int port, const char *ip) = 0;
    
    // 获取地址信息
    virtual std::string info_str() const = 0;
    
    // 比较两个地址是否相等
    virtual bool operator==(const NetInfo &other) const = 0;
};
```

### 4.6 网络池管理（NetPool类）

`NetPool`类负责管理网络连接池，提高连接复用效率：

```cpp
class NetPool
{
public:
    // 初始化网络池
    bool init();
    
    // 添加目标地址
    bool addDest(NetInfo *dest, CONNECT::conType type, const NetQuality *net_quality);
    
    // 添加监听源
    bool addListenSource(NetInfo *local, CONNECT::conType type);
    
    // 分发任务
    bool distributeTask(MMTask *task, NetInfo *dest, CONNECT::conType type);
    
    // 发送数据
    bool send(const char *buffer, int buffer_len, const NetInfo *dest, CONNECT::conType type);
    
    // 接收数据
    bool recv(char *&buffer, int &buffer_len, int &buffer_max_len);
};
```

## 5. 通信协议设计

raserver通信模块支持TCP和UDP两种传输协议，并在此基础上实现了自定义的应用层协议。

### 5.1 TCP协议

TCP协议实现由`TcpProtocol`类负责，主要包括以下功能：

- 数据包格式定义
- 数据包封装和解析
- 数据压缩和解压缩
- 错误检测和恢复

### 5.2 UDP协议

UDP协议实现由`UdpProtocol`和`UdpSinglePackage`类负责，主要包括以下功能：

- 数据包格式定义
- 数据包封装和解析
- 数据分片和重组
- 丢包检测和重传

## 6. 跨平台实现

raserver通信模块支持多种操作系统，包括Linux、Windows等。通过条件编译和平台抽象，实现了跨平台的网络通信能力：

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

针对不同平台，通信模块提供了统一的API接口，屏蔽了底层实现细节。

## 7. IO模型设计

raserver通信模块支持多种IO模型，包括阻塞IO、非阻塞IO和IO多路复用等。通过`IOMode`类及其派生类，实现了不同IO模型的封装：

- `IoEpoll`：Linux平台下的epoll模型
- `IoSelect`：通用的select模型
- `IoWinSelect`：Windows平台下的select模型

## 8. 网络质量监控与优化

raserver通信模块通过`NetQuality`类实现了网络质量监控与优化：

```cpp
class NetQuality
{
public:
    // 计算网络权重
    double calculateNetworkWeight() const;
    
    // 映射权重到指定范围
    double mapWeightToRange(double minValue, double maxValue) const;
    
    // 计算数据分发限制
    static long long calculateDataDistributionLimit(const NetQuality &net_quality, long long time_ms);
    
    // 显示网络质量信息
    void display() const;
};
```

通过监控网络延迟、丢包率等指标，动态调整数据传输策略，提高通信效率和可靠性。

## 9. 安全性设计

raserver通信模块在设计上考虑了安全性因素，主要包括：

1. **数据加密**：支持传输数据加密，保护敏感信息
2. **身份验证**：提供客户端身份验证机制
3. **访问控制**：实现基于权限的访问控制
4. **防止注入攻击**：对输入数据进行严格验证和过滤

## 10. 性能优化

为了提高通信模块的性能，raserver实现了多项优化措施：

1. **连接池**：通过连接池管理连接，减少连接建立和销毁的开销
2. **数据缓冲**：使用缓冲区优化数据传输
3. **异步IO**：支持异步IO操作，提高并发处理能力
4. **数据压缩**：对传输数据进行压缩，减少网络带宽占用
5. **任务队列**：使用优先级任务队列，合理调度网络任务

## 11. 实际应用场景

raserver通信模块在以下场景中发挥着重要作用：

1. **分布式数据库**：支持分布式数据库节点之间的通信
2. **客户端-服务器通信**：处理客户端与数据库服务器之间的通信
3. **数据同步**：实现多节点之间的数据同步
4. **远程管理**：支持远程管理和监控数据库系统

## 12. 总结与展望

raserver嵌入式数据库通信模块采用了分层设计和面向对象的编程思想，实现了高效、可靠、安全的网络通信功能。通过跨平台设计、多协议支持和性能优化，满足了不同应用场景的需求。

未来的发展方向包括：

1. **进一步优化性能**：减少内存占用，提高并发处理能力
2. **增强安全机制**：实现更完善的加密和认证机制
3. **支持更多协议**：增加对WebSocket、HTTP等协议的支持
4. **云原生支持**：适应云计算和容器化环境的需求
5. **智能网络调优**：引入机器学习算法，实现自适应网络参数调整

通过持续的改进和创新，raserver通信模块将为嵌入式数据库系统提供更加强大和灵活的网络通信能力，满足未来复杂应用场景的需求。

## 参考文献

1. raserver源代码文档
2. 《计算机网络：自顶向下方法》
3. 《TCP/IP详解》
4. 《UNIX网络编程》
5. 《设计模式：可复用面向对象软件的基础》

# raserver嵌入式数据库通信模块的适配性设计

## 1. ts_comm_pubsub_api接口设计理念分析

通过分析`ts_comm_pubsub_api.h`文件，我们可以看到这是一个基于发布-订阅(Pub/Sub)模式的通信接口，专为嵌入式环境设计。该接口的核心设计理念包括：

### 1.1 发布-订阅模式

该接口采用发布-订阅模式，这是一种消息传递范式，其中消息的发送者（发布者）不会将消息直接发送给特定的接收者（订阅者）。相反，发布者将消息分类，订阅者表达对一个或多个类别的兴趣，只接收感兴趣的消息。这种模式实现了发布者和订阅者之间的松耦合，非常适合分布式系统和嵌入式环境。

### 1.2 基于主题的通信

接口使用`service_id`作为主题标识符，允许发布者和订阅者围绕特定主题进行通信。这种基于主题的通信方式使得系统能够更好地组织和管理消息流，提高通信效率。

### 1.3 回调函数机制

接口使用回调函数机制处理接收到的消息，这是一种事件驱动的设计模式，非常适合嵌入式系统的异步通信需求。当消息到达时，系统会自动调用预先注册的回调函数，无需持续轮询检查新消息。

### 1.4 支持单播和广播

接口同时支持单播（通过`sendData`函数）和广播（通过`pub`函数）两种通信方式，满足不同场景的需求：
- 单播：点对点通信，适用于特定目标的消息传递
- 广播：一对多通信，适用于需要通知多个订阅者的场景

### 1.5 面向FACE标准

接口设计遵循FACE（Future Airborne Capability Environment）标准，这是一个用于航空电子设备的开放标准，旨在提高软件可重用性和互操作性。这表明该接口设计考虑了高可靠性和安全性要求。

## 2. raserver数据库通信模块的适配性

raserver嵌入式数据库通过`AcxeConnect`类实现了对`ts_comm_pubsub_api`接口的适配，展现了其通信模块的高度适配性：

### 2.1 模块化设计

`AcxeConnect`类继承自基础连接类`CONNECT`，保持了raserver通信模块的模块化设计理念。这种设计使得raserver能够轻松适配不同的通信协议，而无需修改核心功能。

### 2.2 协议转换能力

`AcxeConnect`类实现了raserver内部通信协议与ts_comm_pubsub_api接口之间的转换，主要通过以下方式：

- 封装了`createWriter`和`createReader`函数的调用，将raserver的连接初始化过程映射到发布-订阅模式
- 实现了`netWrite`和`netRead`方法，将raserver的数据传输操作转换为`pub`和`sendData`函数调用
- 通过`netSocket_read_function`回调函数处理接收到的消息，并将其转换为raserver内部可处理的格式

### 2.3 连接管理适配

`AcxeConnect`类管理了与ts_comm_pubsub_api相关的连接状态：

- 使用`service_id_`、`connect_id_`和`dest_id_`成员变量存储发布-订阅模式所需的标识符
- 通过`is_pub_`标志区分发布者和订阅者角色
- 使用信号量（`buffer_sem_`和`con_sem_`）实现线程安全的缓冲区访问和连接管理

### 2.4 内存管理优化

`AcxeConnect`类实现了高效的内存管理策略：

- 使用`buffer_`和`buffer_len_`管理接收缓冲区
- 使用`send_buffer_`和`send_buffer_len_`管理发送缓冲区
- 通过`ProtecolAcex`类（`package_`成员变量）实现协议级别的数据封装和解析

## 3. 适配性设计的优势

raserver通信模块对ts_comm_pubsub_api的适配展现了以下优势：

### 3.1 无缝集成

raserver能够无缝集成到使用ts_comm_pubsub_api的系统中，使得数据库服务可以作为发布者或订阅者参与到现有的通信架构中，无需修改现有系统。

### 3.2 功能扩展

通过适配ts_comm_pubsub_api，raserver获得了发布-订阅模式的能力，扩展了其通信功能，使其能够更好地支持分布式数据库场景。

### 3.3 跨平台兼容

ts_comm_pubsub_api接口设计考虑了跨平台兼容性，raserver通过适配该接口，增强了其在不同嵌入式平台上的兼容性。

### 3.4 性能优化

适配层考虑了嵌入式环境的资源限制，通过高效的内存管理和异步通信机制，确保了通信性能不会成为系统瓶颈。

## 4. 实际应用场景

raserver通过适配ts_comm_pubsub_api，能够支持以下典型应用场景：

### 4.1 分布式数据同步

多个嵌入式设备上的raserver实例可以通过发布-订阅机制实现数据同步，一个节点的数据变更可以发布为主题，其他节点订阅该主题并更新本地数据。

### 4.2 事件驱动的数据处理

raserver可以订阅系统中的各种事件主题，当特定事件发生时，自动触发相应的数据处理逻辑，实现事件驱动的数据管理。

### 4.3 数据流处理

在传感器数据采集系统中，raserver可以订阅传感器数据主题，实时接收并存储数据，同时可以发布处理后的数据供其他组件使用。

### 4.4 高可用性集群

多个raserver实例可以组成高可用性集群，通过发布-订阅机制实现主备切换和状态同步，确保系统的连续可用性。

## 5. 结论

raserver嵌入式数据库通信模块通过`AcxeConnect`类对ts_comm_pubsub_api接口的适配，展示了其优秀的适配性设计。这种设计使raserver能够灵活地集成到各种通信架构中，满足不同嵌入式系统的需求。

通过分析ts_comm_pubsub_api接口的设计理念和raserver的适配实现，我们可以看到：

1. 发布-订阅模式是嵌入式分布式系统中高效通信的关键范式
2. 模块化和抽象设计是实现高适配性的基础
3. 良好的接口适配能够扩展系统功能，提高系统集成能力
4. 考虑资源限制和性能优化是嵌入式系统设计的核心原则

# 数据库集群初始化实现分析

通过阅读集群相关的源代码，我可以为您详细阐述其集群初始化的实现机制。

## 集群架构概述

该数据库系统采用主从（Master-Replica）架构的集群设计，主要包含以下角色：

1. **主节点（Master Node）**：负责处理写操作和事务管理
2. **从节点（Replica Node）**：负责数据同步和读操作

## 集群初始化流程

集群初始化主要通过`edb_d_node_add`函数实现，该函数在`cluster.cpp`中定义。初始化流程如下：

### 1. 初始化函数表（Function Table）

首先调用`edb_d_node_func_init`函数初始化集群功能函数表（vtable）：

```cpp
EDB_RET edb_d_node_add(edb_dictionary_h dict, int node_type, int sync_type, uint2 port)
{
    // 初始化函数表
    edb_d_node_func_init(node_type, sync_type);
    // ...
}
```

`edb_d_node_func_init`函数根据节点类型和同步类型设置不同的函数指针：

```cpp
void edb_d_node_func_init(int node_type, int sync_type)
{
    // 设置基本函数
    cluster_vtable.init = edb_d_func_init_wrapper;
    cluster_vtable.start = edb_d_func_start;
    cluster_vtable.node_type = edb_d_func_type;
    cluster_vtable.sync_mode = edb_d_func_mode;
    
    // 设置元数据相关函数
    cluster_vtable.parse_meta_info = edb_d_func_parse_meta_info;
    cluster_vtable.set_meta = edb_d_func_set_meta;
    
    // 设置队列和节点创建函数
    cluster_vtable.set_queue = edb_d_func_set_queue;
    cluster_vtable.get_process_function = getProcessFunction;
    cluster_vtable.create_replica_node = create_replica_node;
    cluster_vtable.create_master_node = create_master_node;
    cluster_vtable.add_database = edb_d_func_add_database;

    // 根据同步类型设置不同的事务处理函数
    switch (sync_type)
    {
        case Sync:
            cluster_vtable.trans_start_request = edb_d_func_trans_start_request;
            cluster_vtable.trans_commit_request = edb_d_func_trans_commit_request;
            break;
        case Async:
            if (node_type == EDBDNodeType::EDBDNodeMaster)
            {
                cluster_vtable.trans_start_request = edb_d_func_trans_start_request;
                cluster_vtable.trans_commit_request = edb_d_func_trans_commit_request_async;
            }
    }
}
```

### 2. 元数据初始化

接下来，创建元数据对象并解析配置信息：

```cpp
edb_cluster_meta_t* meta_h = new edb_cluster_meta_t();
if (port > 0)
{
    printf("set_local_callback:%d\n", port);
    meta_h->set_local_callback(callback_port_local);
    meta_h->set_lcoal_callback_arg((void*)&port);
}

if (sync_type == Sync)
{
    edb_cluster_meta_parse_ddl(dict, meta_h);
}
```

元数据对象`edb_cluster_meta_t`负责管理集群节点信息、数据库信息和表信息。通过`edb_cluster_meta_parse_ddl`函数解析DDL（数据定义语言）配置，获取集群拓扑结构。

### 3. 创建节点对象

根据节点类型创建相应的节点对象：

```cpp
// 初始化节点
if (!dbAeCI::instance.node_)
{
    /// 根据DDL信息创建节点
    if (meta_h->is_master())
    {
        dbAeCI::instance.node_ = edb_d_node_create_master_node_wrapper(sync_type);
    }
    else
    {
        dbAeCI::instance.node_ = edb_d_node_create_replica_node_wrapper(sync_type);
    }
}
```

节点类型的判断通过`meta_h->is_master()`函数完成，该函数检查本地节点是否为主节点。

### 4. 创建消息处理线程

为节点创建消息处理线程：

```cpp
void* func = (void*)edb_d_worker_get_process_wrapper();
if (func)
{
    // 对于从节点需要2个Worker来处理消息，但是对于主节点可能需要n + 1个（n为从节点数量）
    if (CLNode::whoami(dict) == EDBDNodeMaster)
    {
        dbAeCI::instance.worker_[0] = new MsgProcessWorker<DataInfoFormat*>((char*)"", 0, dbAeCI::instance.node_);
        dbAeCI::instance.worker_[1] = new MsgProcessWorker<DataInfoFormat*>((char*)"", 0, dbAeCI::instance.node_);
    }
    else
        dbAeCI::instance.worker_[0] = new MsgProcessWorker<DataInfoFormat*>((char*)"", 0, dbAeCI::instance.node_);
    dbAeCI::instance.worker_[1] = new MsgProcessWorker<DataInfoFormat*>((char*)"", 0, dbAeCI::instance.node_);
}
```

这里根据节点类型创建不同数量的工作线程。主节点需要更多的工作线程来处理从节点的请求。

### 5. 初始化和启动节点

初始化节点并设置元数据：

```cpp
if (dbAeCI::instance.node_)
{
    // 初始化节点
    edb_d_node_init_wrapper(dbAeCI::instance.node_);
    // 解析元信息到节点
    edb_d_node_set_meta_handle(dbAeCI::instance.node_, meta_h);
}
```

启动消息处理线程和节点：

```cpp
if (func)
{
    Queue<DataInfoFormat *>* a = dbAeCI::instance.worker_[0]->start((MsgFp)func);
    Queue<DataInfoFormat *>* b = dbAeCI::instance.worker_[1]->start((MsgFp)func);
    Queue<DataInfoFormat *> *queue_[2] = {a, b};
    dbAeCI::instance.node_->set_queque(queue_);
}
edb_d_node_start_wrapper(dbAeCI::instance.node_);
```

## 集群节点类型

系统定义了两种节点类型：

```cpp
enum EDBDNodeType
{
    EDBDNodeMaster = 0, // 主节点，处理写操作和事务
    EDBDNodeReplica,    // 副本节点，用于数据同步和读操作
};
```

## 数据同步模式

系统支持两种数据同步模式：

```cpp
enum EDBDataSynchronizationMode
{
    Sync = 0,  // 同步模式
    Async      // 异步模式
};
```

## 节点实现类

集群实现了两个主要的节点类：

1. **MasterNode**：主节点实现，负责处理事务提交和分发事务日志
2. **ReplicaNode**：从节点实现，负责接收和应用事务日志

这两个类都继承自基类`CLNode`，实现了不同的事务处理逻辑。

## 元数据管理

集群使用`edb_cluster_meta_t`类管理元数据，包括：

1. 节点信息（`edb_d_node_struct_t`）
2. 数据库信息（`edb_d_include_db_struct_t`）
3. 表信息（`edb_d_include_table_struct_t`）

元数据通过DDL解析获取，并在节点间同步。

## 消息处理机制

集群使用工作线程（`MsgProcessWorker`）和消息队列（`Queue<DataInfoFormat*>`）处理节点间通信：

1. 主节点发送事务日志到从节点
2. 从节点发送确认消息到主节点
3. 主节点等待所有从节点确认后完成事务

## 总结

该数据库集群的初始化过程主要包括：

1. 初始化函数表
2. 解析元数据
3. 创建节点对象（主节点或从节点）
4. 创建消息处理线程
5. 初始化和启动节点

集群采用主从架构，支持同步和异步两种数据同步模式，通过消息队列和工作线程实现节点间通信，保证数据一致性。