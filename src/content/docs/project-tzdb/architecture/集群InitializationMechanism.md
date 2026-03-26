---
title: "集群InitializationMechanism"
description: "TZDB 主从集群初始化流程、节点角色与同步模式分析"
---

# 数据库集群初始化实现分析

## 集群架构概述

系统采用主从(Master-Replica)架构：

1. 主节点(Master)：负责写操作与事务管理
2. 从节点(Replica)：负责数据同步与读操作

## 初始化主流程

核心入口函数：`edb_d_node_add(dict, node_type, sync_type, port)`。

## 步骤 1：初始化函数表

调用 `edb_d_node_func_init(node_type, sync_type)`，设置 `cluster_vtable`：

- 基础函数：`init/start/node_type/sync_mode`
- 元数据函数：`parse_meta_info/set_meta`
- 队列与节点创建：`set_queue/get_process_function/create_replica_node/create_master_node/add_database`
- 根据同步模式设置事务处理函数：
  - `Sync`：`trans_start_request` + `trans_commit_request`
  - `Async`(Master)：`trans_commit_request_async`

## 步骤 2：元数据初始化

- 创建 `edb_cluster_meta_t`。
- 可选设置本地回调端口(`set_local_callback`)。
- 同步模式下解析 DDL：`edb_cluster_meta_parse_ddl(dict, meta_h)`。

`edb_cluster_meta_t` 负责维护节点、数据库、表等集群元信息。

## 步骤 3：创建节点对象

根据元数据判断本地角色：

- `meta_h->is_master()` 为真：创建 Master 节点
- 否则：创建 Replica 节点

对应封装函数：

- `edb_d_node_create_master_node_wrapper(sync_type)`
- `edb_d_node_create_replica_node_wrapper(sync_type)`

## 步骤 4：创建消息处理线程

获取处理函数：`edb_d_worker_get_process_wrapper()`。

线程创建策略(文档记录)：

- 主节点：创建更多 `MsgProcessWorker<DataInfoFormat*>` 以处理多副本交互
- 从节点：创建基础处理线程

## 步骤 5：节点初始化并绑定元数据

- `edb_d_node_init_wrapper(node)`
- `edb_d_node_set_meta_handle(node, meta_h)`

完成后启动 worker 队列并注入节点：

- `worker->start((MsgFp)func)` 获取队列
- `node->set_queque(queue_)`
- `edb_d_node_start_wrapper(node)` 启动节点

## 节点类型

```cpp
enum EDBDNodeType
{
    EDBDNodeMaster = 0,
    EDBDNodeReplica,
};
```

## 数据同步模式

```cpp
enum EDBDataSynchronizationMode
{
    Sync = 0,
    Async
};
```

## 关键实现类

1. `CLNode`：节点基类
2. `MasterNode`：事务提交与日志分发
3. `ReplicaNode`：日志接收与应用

## 元数据管理范围

`edb_cluster_meta_t` 管理：

1. 节点信息(`edb_d_node_struct_t`)
2. 数据库信息(`edb_d_include_db_struct_t`)
3. 表信息(`edb_d_include_table_struct_t`)

## 消息处理机制

通过 `MsgProcessWorker + Queue<DataInfoFormat*>` 实现节点间协作：

1. 主节点向从节点发送事务日志
2. 从节点回传确认
3. 主节点按策略完成提交闭环

## 总结

TZDB 集群初始化链路可归纳为：

1. 函数表初始化
2. 元数据解析
3. 主从节点创建
4. Worker 与消息队列建立
5. 节点启动与对外服务

该机制在主从架构下支持同步/异步两种模式，为集群一致性和可扩展部署提供了基础实现框架。
