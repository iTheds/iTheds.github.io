---
title: "文档RPC"
description: "project-tzdb-rebuild 文档整理稿（源：raw_snapshot/docs/distribution/rpc/rpc.md）"
---

<link rel="stylesheet" type="text/css" href="../../auto-number-title.css" />

# 类 RPC 框架

## RPC 框架架构图

```
┌─────────────────┐    ┌─────────────────┐
│   Client App    │    │   Server App    │
├─────────────────┤    ├─────────────────┤
│  Client Stub    │    │ Server Skeleton │
├─────────────────┤    ├─────────────────┤
│  Serialization  │    │  Serialization  │
├─────────────────┤    ├─────────────────┤
│   Protocol      │    │   Protocol      │
├─────────────────┤    ├─────────────────┤
│   Transport     │    │   Transport     │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────── Network ─────┘
```

## 核心组成部分

通常 rpc 由以下部分组成，但是目前数据库支持部分操作，以实现其轻量化的类 rpc 功能。

# RPC 框架组件表格

| 支持情况 | 组件名称                         | 作用                                                  | 备注           |
| -------- | -------------------------------- | ----------------------------------------------------- | -------------- |
| ○        | **接口定义层 (IDL)**             | 定义服务接口和数据结构，支持跨语言服务定义            | 有限支持       |
| ✓       | **序列化/反序列化层**            | 将对象转换为字节流进行网络传输，支持跨语言数据交换    |                |
| ✓       | **传输层**                       | 负责网络通信，处理连接管理，支持多种传输协议          |                |
| ✓       | **协议层**                       | 定义 RPC 调用的消息格式，处理请求/响应匹配            |                |
| ○        | **服务注册与发现**               | 管理服务实例，支持负载均衡，处理服务健康检查          | 基于配置的发现 |
| ○        | **负载均衡**                     | 分发请求到多个服务实例，提高系统可用性和性能          |                |
| ✓       | **错误处理**                     | 统一错误码定义，异常传播机制，超时和重试处理          |                |
| ✓       | **客户端存根 (Client Stub)**     | 提供本地方法调用接口，隐藏网络通信细节                |                |
| ✓       | **服务端骨架 (Server Skeleton)** | 接收和解析 RPC 请求，调用实际的业务方法，返回执行结果 |                |
| ✗       | **代码生成器**                   | 根据 IDL 生成客户端和服务端代码，减少手工编码工作     |                |

---

**符号说明：**
- ✓ = 已支持
- ✗ = 不计划支持  
- ○ = 有限支持/计划支持

### **接口定义层 (IDL - Interface Definition Language)**

#### 作用

- 定义服务接口和数据结构
- 支持跨语言服务定义
- 生成客户端和服务端代码

#### 示例

```protobuf
// user.proto (Protocol Buffers)
syntax = "proto3";

service UserService {
    rpc GetUser(GetUserRequest) returns (UserResponse);
    rpc CreateUser(CreateUserRequest) returns (UserResponse);
    rpc ListUsers(ListUsersRequest) returns (stream UserResponse);
}

message GetUserRequest {
    int32 user_id = 1;
}

message UserResponse {
    int32 id = 1;
    string name = 2;
    string email = 3;
    int64 created_at = 4;
}
```

```thrift
// user.thrift (Apache Thrift)
struct User {
    1: i32 id,
    2: string name,
    3: string email,
    4: i64 created_at
}

service UserService {
    User getUser(1: i32 userId),
    User createUser(1: string name, 2: string email),
    list<User> listUsers()
}
```

### **序列化/反序列化层**

#### 作用

- 将对象转换为字节流进行网络传输
- 支持跨语言数据交换
- 优化传输效率

#### 常见序列化格式对比

| 格式                   | 特点           | 优势     | 劣势        |
|----------------------|--------------|--------|-----------|
| **Protocol Buffers** | 二进制，强类型      | 高效，跨语言 | 需要 schema |
| **MessagePack**      | 二进制，动态       | 紧凑，快速  | 调试困难      |
| **JSON**             | 文本，人类可读      | 易调试，通用 | 体积大，慢     |
| **Avro**             | 二进制，schema演化 | 版本兼容   | 复杂        |

#### 实现示例

```c
// Protocol Buffers 序列化
typedef struct {
    void* (*serialize)(const void* obj, size_t* len);
    void* (*deserialize)(const void* data, size_t len);
    void (*free_data)(void* data);
} serializer_t;

// JSON 序列化实现
void* json_serialize(const void* obj, size_t* len) {
    // 将对象转换为 JSON 字符串
    cJSON* json = cJSON_CreateObject();
    // ... 填充 JSON 对象
    char* json_string = cJSON_Print(json);
    *len = strlen(json_string);
    cJSON_Delete(json);
    return json_string;
}
```

### **传输层**

#### 作用

- 负责网络通信
- 处理连接管理
- 支持多种传输协议

#### 传输协议选择

```c
// 传输层抽象接口
typedef struct {
    int (*connect)(const char* address);
    int (*send)(int conn, const void* data, size_t len);
    int (*recv)(int conn, void* buffer, size_t* len);
    void (*close)(int conn);
} transport_t;

// TCP 传输实现
transport_t tcp_transport = {
    .connect = tcp_connect,
    .send = tcp_send,
    .recv = tcp_recv,
    .close = tcp_close
};

// HTTP 传输实现
transport_t http_transport = {
    .connect = http_connect,
    .send = http_post,
    .recv = http_recv,
    .close = http_close
};
```

#### 支持的传输方式

- **TCP**: 高性能，长连接
- **HTTP/HTTPS**: 防火墙友好，RESTful
- **UDP**: 低延迟，适合实时应用
- **WebSocket**: 浏览器兼容，双向通信
- **Unix Socket**: 本地高性能通信

### **协议层**

#### 作用

- 定义 RPC 调用的消息格式
- 处理请求/响应匹配
- 管理调用状态

#### 协议消息格式

```c
// RPC 协议消息结构
typedef struct {
    uint32_t magic;           // 魔数，用于协议识别
    uint32_t version;         // 协议版本
    uint32_t message_type;    // 消息类型：REQUEST/RESPONSE/ERROR
    uint32_t request_id;      // 请求ID，用于匹配请求响应
    uint32_t method_id;       // 方法ID或方法名哈希
    uint32_t payload_len;     // 负载长度
    uint8_t  payload[];       // 序列化后的参数或返回值
} rpc_message_t;

// 消息类型定义
#define RPC_REQUEST   1
#define RPC_RESPONSE  2
#define RPC_ERROR     3
#define RPC_HEARTBEAT 4
```

#### 协议处理

```c
// 协议编码
int rpc_encode_request(uint32_t request_id, uint32_t method_id, 
                      const void* params, size_t params_len,
                      void** message, size_t* message_len) {
    rpc_message_t* msg = malloc(sizeof(rpc_message_t) + params_len);
    msg->magic = htonl(RPC_MAGIC);
    msg->version = htonl(RPC_VERSION);
    msg->message_type = htonl(RPC_REQUEST);
    msg->request_id = htonl(request_id);
    msg->method_id = htonl(method_id);
    msg->payload_len = htonl(params_len);
    memcpy(msg->payload, params, params_len);
    
    *message = msg;
    *message_len = sizeof(rpc_message_t) + params_len;
    return 0;
}
```

### **服务注册与发现**

#### 作用

- 管理服务实例
- 支持负载均衡
- 处理服务健康检查

#### 实现方式

```c
// 服务注册接口
typedef struct {
    char service_name[64];
    char address[128];
    int port;
    int weight;           // 负载均衡权重
    time_t last_heartbeat; // 最后心跳时间
} service_instance_t;

typedef struct {
    int (*register_service)(const service_instance_t* instance);
    int (*discover_service)(const char* service_name, 
                           service_instance_t** instances, int* count);
    int (*unregister_service)(const char* service_name, const char* address);
    int (*health_check)(const char* service_name);
} registry_t;

// 基于文件的简单注册中心
registry_t file_registry = {
    .register_service = file_register_service,
    .discover_service = file_discover_service,
    .unregister_service = file_unregister_service,
    .health_check = file_health_check
};
```

#### 常见注册中心

- **Consul**: 功能完整，支持健康检查
- **etcd**: 高可用，强一致性
- **Zookeeper**: 成熟稳定
- **Nacos**: 阿里开源，功能丰富

### **负载均衡**

#### 作用

- 分发请求到多个服务实例
- 提高系统可用性和性能

#### 负载均衡算法

```c
// 负载均衡策略
typedef enum {
    LB_ROUND_ROBIN,    // 轮询
    LB_RANDOM,         // 随机
    LB_WEIGHTED,       // 加权
    LB_LEAST_CONN,     // 最少连接
    LB_CONSISTENT_HASH // 一致性哈希
} lb_strategy_t;

typedef struct {
    service_instance_t* (*select)(service_instance_t* instances, 
                                 int count, const void* key);
} load_balancer_t;

// 轮询负载均衡实现
service_instance_t* round_robin_select(service_instance_t* instances, 
                                      int count, const void* key) {
    static int current = 0;
    int index = __sync_fetch_and_add(&current, 1) % count;
    return &instances[index];
}
```

### **客户端存根 (Client Stub)**

#### 作用

- 提供本地方法调用接口
- 隐藏网络通信细节
- 处理序列化和网络传输

#### 客户端实现

```c
// 客户端存根结构
typedef struct {
    transport_t* transport;
    serializer_t* serializer;
    load_balancer_t* lb;
    retry_config_t retry_config;
    int connection;
} rpc_client_t;

// 生成的客户端方法
int UserService_GetUser(rpc_client_t* client, int user_id, User** result) {
    // 1. 序列化参数
    GetUserRequest req = {.user_id = user_id};
    size_t req_len;
    void* req_data = client->serializer->serialize(&req, &req_len);
    
    // 2. 编码 RPC 消息
    void* message;
    size_t message_len;
    uint32_t request_id = generate_request_id();
    rpc_encode_request(request_id, METHOD_GET_USER, req_data, req_len, 
                      &message, &message_len);
    
    // 3. 发送请求
    int ret = client->transport->send(client->connection, message, message_len);
    if (ret < 0) return RPC_ERROR_NETWORK;
    
    // 4. 接收响应
    void* response;
    size_t response_len;
    ret = client->transport->recv(client->connection, &response, &response_len);
    if (ret < 0) return RPC_ERROR_NETWORK;
    
    // 5. 解码响应
    rpc_message_t* resp_msg = (rpc_message_t*)response;
    if (ntohl(resp_msg->message_type) == RPC_ERROR) {
        return ntohl(resp_msg->method_id); // 错误码
    }
    
    // 6. 反序列化结果
    *result = client->serializer->deserialize(resp_msg->payload, 
                                            ntohl(resp_msg->payload_len));
    
    free(req_data);
    free(message);
    free(response);
    return RPC_OK;
}
```

### **服务端骨架 (Server Skeleton)**

### 作用

- 接收和解析 RPC 请求
- 调用实际的业务方法
- 返回执行结果

#### 服务端实现

```c
// 方法处理器
typedef int (*method_handler_t)(const void* params, size_t params_len,
                               void** result, size_t* result_len);

// 方法注册表
typedef struct {
    uint32_t method_id;
    method_handler_t handler;
    char method_name[64];
} method_entry_t;

// 服务端结构
typedef struct {
    transport_t* transport;
    serializer_t* serializer;
    method_entry_t* methods;
    int method_count;
    int listen_socket;
} rpc_server_t;

// 请求处理循环
void rpc_server_run(rpc_server_t* server) {
    while (1) {
        // 接收请求
        void* message;
        size_t message_len;
        int client_conn = accept(server->listen_socket, NULL, NULL);
        server->transport->recv(client_conn, &message, &message_len);
        
        // 解析请求
        rpc_message_t* req = (rpc_message_t*)message;
        uint32_t method_id = ntohl(req->method_id);
        uint32_t request_id = ntohl(req->request_id);
        
        // 查找方法处理器
        method_handler_t handler = find_method_handler(server, method_id);
        if (!handler) {
            send_error_response(client_conn, request_id, RPC_ERROR_METHOD_NOT_FOUND);
            continue;
        }
        
        // 调用业务方法
        void* result;
        size_t result_len;
        int ret = handler(req->payload, ntohl(req->payload_len), 
                         &result, &result_len);
        
        // 发送响应
        if (ret == RPC_OK) {
            send_success_response(client_conn, request_id, result, result_len);
        } else {
            send_error_response(client_conn, request_id, ret);
        }
        
        close(client_conn);
        free(message);
        free(result);
    }
}
```

### **代码生成器**

#### 作用

- 根据 IDL 生成客户端和服务端代码
- 减少手工编码工作
- 保证接口一致性

#### 代码生成示例

```bash
# Protocol Buffers 代码生成
protoc --c_out=. user.proto

# 生成的文件结构
user.pb.h          # 数据结构定义
user.pb.c          # 序列化实现
user_service.h     # 服务接口
user_client.h      # 客户端存根
user_server.h      # 服务端骨架
```

## 开源的部分框架

## **C/C++ RPC框架协议对比表**

| 框架 | 传输协议 | 序列化格式 | 端口类型 | 协议特点 | 性能等级 | 跨语言支持 | 学习难度 |
|------|----------|------------|----------|----------|----------|------------|----------|
| **gRPC** | HTTP/2 | Protocol Buffers | 标准HTTP端口 | 多路复用、流式、标准化 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 中等 |
| **Apache Thrift** | TCP | Binary/Compact/JSON | 自定义端口 | 多协议、灵活传输层 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 简单 |
| **brpc (百度)** | TCP/HTTP | Protocol Buffers | 自定义端口 | 多协议兼容、高性能 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 中等 |
| **Tars (腾讯)** | TCP | Tars Binary | 自定义端口 | 企业级、服务治理 | ⭐⭐⭐⭐ | ⭐⭐⭐ | 复杂 |
| **rpclib** | TCP | MessagePack | 自定义端口 | 轻量级、头文件库 | ⭐⭐⭐ | ⭐⭐ | 简单 |
| **rest_rpc** | HTTP/1.1 | JSON | 标准HTTP端口 | RESTful、易调试 | ⭐⭐ | ⭐⭐⭐ | 简单 |
| **Cap'n Proto** | 可插拔 | Cap'n Proto | 灵活 | 零拷贝、极致性能 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 复杂 |
| **Arrow Flight** | HTTP/2 | Apache Arrow | 标准HTTP端口 | 大数据优化、列式存储 | ⭐⭐⭐⭐ | ⭐⭐⭐ | 复杂 |

## **协议层级详细对比表**

| 框架 | 应用层协议 | 会话层 | 传输层 | 序列化开销 | 网络开销 | 内存占用 |
|------|------------|--------|--------|------------|----------|----------|
| **gRPC** | gRPC/HTTP/2 | HTTP/2 Session | TCP | 低 | 中等 | 中等 |
| **Thrift** | Thrift Protocol | 自定义 | TCP | 极低 | 低 | 低 |
| **brpc** | 多种协议 | 连接池 | TCP | 低 | 极低 | 低 |
| **Tars** | Tars Protocol | Tars Session | TCP | 低 | 低 | 中等 |
| **rpclib** | 自定义 | 简单 | TCP | 中等 | 中等 | 低 |
| **rest_rpc** | HTTP | HTTP Session | TCP | 高 | 高 | 中等 |
| **Cap'n Proto** | Cap'n Proto | 可定制 | 可插拔 | 零开销 | 极低 | 极低 |

## **使用场景推荐表**

| 使用场景 | 推荐框架 | 原因 | 协议优势 |
|----------|----------|------|----------|
| **微服务架构** | gRPC | HTTP/2标准、服务网格支持 | 标准化、可观测性好 |
| **高并发服务** | brpc | 极致性能优化 | 自定义协议、连接复用 |
| **跨语言调用** | gRPC/Thrift | 多语言生态完善 | 标准IDL、代码生成 |
| **内网高性能** | brpc/Cap'n Proto | 减少协议开销 | 二进制协议、零拷贝 |
| **快速原型** | rpclib/rest_rpc | 简单易用 | 轻量级、快速集成 |
| **大数据传输** | Arrow Flight | 列式数据优化 | 专用数据格式 |
| **企业级应用** | Tars/Thrift | 完整生态、运维支持 | 成熟稳定、监控完善 |
| **嵌入式系统** | Cap'n Proto/Thrift | 资源占用少 | 紧凑编码、低开销 |

## **协议兼容性对比表**

| 框架 | 防火墙友好 | NAT穿透 | 负载均衡 | 服务发现 | 监控支持 | 调试工具 |
|------|------------|---------|----------|----------|----------|----------|
| **gRPC** | ✅ HTTP端口 | ✅ | ✅ 多种LB | ✅ 多种SD | ✅ 丰富 | ✅ 完善 |
| **Thrift** | ❌ 自定义端口 | ❌ | ✅ 连接池 | ⚠️ 需自建 | ⚠️ 基础 | ✅ 良好 |
| **brpc** | ❌ 自定义端口 | ❌ | ✅ 内置 | ✅ 内置 | ✅ 丰富 | ✅ 专业 |
| **Tars** | ❌ 自定义端口 | ❌ | ✅ 完整 | ✅ 注册中心 | ✅ 企业级 | ✅ 完整 |
| **rpclib** | ❌ 自定义端口 | ❌ | ❌ | ❌ | ❌ | ⚠️ 基础 |
| **rest_rpc** | ✅ HTTP端口 | ✅ | ✅ HTTP LB | ⚠️ 需自建 | ⚠️ HTTP监控 | ✅ HTTP工具 |
| **Cap'n Proto** | 取决于传输层 | 取决于传输层 | ⚠️ 需自建 | ❌ | ❌ | ⚠️ 有限 |

## **性能基准对比表**

| 框架 | QPS (万/秒) | 延迟 (微秒) | 内存使用 | CPU使用 | 连接数支持 |
|------|-------------|-------------|----------|---------|------------|
| **brpc** | 50-100 | 100-500 | 低 | 低 | 10万+ |
| **Cap'n Proto** | 80-150 | 50-200 | 极低 | 极低 | 取决于传输 |
| **gRPC** | 30-60 | 200-800 | 中等 | 中等 | 5万+ |
| **Thrift** | 40-80 | 150-600 | 低 | 低 | 8万+ |
| **Tars** | 35-70 | 200-700 | 中等 | 中等 | 6万+ |
| **rpclib** | 10-30 | 500-2000 | 低 | 中等 | 1万+ |
| **rest_rpc** | 5-15 | 1000-5000 | 中等 | 高 | 5000+ |

**注释**：
- ⭐ 表示性能/支持程度（5星最高）
- ✅ 表示支持良好
- ⚠️ 表示部分支持或需要额外工作
- ❌ 表示不支持或支持较差
- 性能数据为典型场景下的参考值，实际性能取决于具体应用
