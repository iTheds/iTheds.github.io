---
title: "CnosDB元信息架构分析"
date: "2025-7-30"
subtitle: "CnosDB元信息架构分析"
author: "Lonnie iTheds"
categories:
  - 数据库技术
draft: true
section: "drafts"
sourcePath: "markdown/_drafts/cnosdb_meta.md"
slug: "_drafts/cnosdb_meta"
---

# CnosDB元信息架构分析


CnosDB采用了一个分层的元数据管理架构，主要围绕集群管理、租户管理和数据分布进行设计。

## 1. 元数据层次结构

CnosDB的元数据管理采用了三层结构：

1. **集群层 (Cluster)**：管理整个集群的节点、租户和用户
2. **租户层 (Tenant)**：每个租户管理自己的数据库、表、角色和成员
3. **数据库层 (Database)**：管理数据库的schema、表和时间分桶(buckets)

## 2. 核心组件

### 2.1 MetaClient

从`meta/src/model/meta_tenant.rs`可以看出，`MetaClient`是处理元数据操作的核心类，主要负责：

- 数据节点管理（添加、监控、状态报告）
- 用户管理（创建、修改、删除、权限查询）
- 租户管理（创建、修改、删除、资源限制）
- 元数据同步和监控

### 2.2 TenantMeta

`TenantMeta`是租户级别的元数据管理组件，负责：

- 管理租户内的数据库、表和时间分桶(buckets)
- 角色和权限管理
- 成员管理
- 数据路由（定位数据应该写入哪个复制集）

### 2.3 TenantMetaData

`TenantMetaData`是租户元数据的核心数据结构，包含：

- 数据库信息映射（`dbs: HashMap<String, DatabaseInfo>`）
- 角色定义（`roles: HashMap<String, CustomTenantRole<Oid>>`）
- 成员关系（`members: HashMap<String, TenantRoleIdentifier>`）
- 版本控制（`version: u64`）

## 3. 数据分布与路由

CnosDB采用了时间分桶(Bucket)和分片(Shard)的方式来组织数据：

1. **时间分桶(BucketInfo)**：
   - 按时间范围将数据分割成不同的桶
   - 每个桶包含多个分片组(shard_group)

2. **复制集(ReplicationSet)**：
   - 每个分片对应一个复制集
   - 复制集包含多个虚拟节点(vnodes)，分布在不同的物理节点上
   - 有一个leader节点负责写入

3. **虚拟节点(VnodeInfo)**：
   - 是数据存储的基本单位
   - 包含ID、所在物理节点ID和状态信息

## 4. 元数据同步机制

CnosDB使用一个基于版本的同步机制来保持元数据一致性：

1. **版本控制**：每个元数据更改都会增加版本号
2. **变更日志(EntryLog)**：记录元数据的变更
3. **监听机制**：通过`process_watch_log`方法处理元数据变更
4. **缓存更新**：本地缓存根据变更日志更新

## 5. 多租户资源隔离

CnosDB实现了严格的多租户资源隔离：

1. **资源限制**：
   - 通过`TenantObjectLimiterConfig`限制租户可使用的资源
   - 包括数据库数量、用户数量、分片数量等限制

2. **请求限制**：
   - 通过`RequestLimiterConfig`限制租户的请求频率
   - 区分不同类型的请求（查询、写入、数据传输）

3. **权限隔离**：
   - 基于角色的访问控制
   - 支持系统角色和自定义角色
   - 细粒度的数据库和表级权限

## 6. 元数据操作流程

以创建数据库为例，流程如下：

1. 客户端发起创建数据库请求
2. `TenantMeta.create_db`检查资源限制
3. 构造`WriteCommand::CreateDB`命令
4. 通过`MetaHttpClient`发送命令到元数据服务
5. 元数据服务处理命令并更新元数据
6. 返回更新后的`TenantMetaData`
7. 更新本地缓存

## 7. 节点管理与监控

CnosDB通过以下机制管理和监控集群节点：

1. **节点注册**：通过`add_data_node`方法注册数据节点
2. **节点指标报告**：通过`report_node_metrics`定期报告节点状态
3. **磁盘空间监控**：使用`get_disk_info`检查节点磁盘空间
4. **节点状态跟踪**：通过`NodeStatus`标记节点状态（健康、无磁盘空间等）

## 总结

CnosDB的元数据架构设计体现了分布式时序数据库的特点：

1. **多租户设计**：严格的资源和数据隔离
2. **时间分桶**：基于时间的数据分片策略
3. **高可用性**：通过复制集实现数据冗余
4. **灵活扩展**：支持动态添加节点和调整复制因子
5. **细粒度权限**：基于角色的访问控制系统

这种设计使CnosDB能够有效地管理大规模分布式时序数据，同时保证多租户环境下的资源隔离和数据安全。

# 概念附录

在这个时序数据库系统中，"桶"（Bucket）是一种数据分区机制，主要用于按时间范围对数据进行分片存储。我来详细解释一下：

### 桶（Bucket）的概念和作用

1. **时间分区**：桶代表一个特定时间范围内的数据集合，例如代码中的示例实现将一个桶设置为一天的时间范围（`bucket.end_time = ts + 3600 * 24`）。

2. **数据管理单元**：每个桶包含特定时间范围内的所有数据，并且有自己的ID和分片组（shard_group）。

3. **数据生命周期管理**：通过桶可以实现数据的过期和清理。系统会检查哪些桶已过期（`GetExpiredBuckets`方法），并可以删除这些桶来释放存储空间。

4. **预创建机制**：系统会提前创建即将需要的桶（`GetPreCreateBuckets`方法），确保写入操作时总有可用的桶。

### 桶的结构

从代码中可以看到，`BucketInfo`结构包含：

```cpp
struct BucketInfo {
  uint32_t id = 0;                     // 桶ID
  int64_t start_time = 0;              // 桶起始时间
  int64_t end_time = 0;                // 桶结束时间
  std::vector<ReplicationSet> shard_group; // 桶中的分片组
  
  // 根据哈希ID获取对应的复制集
  ReplicationSet VnodeFor(uint64_t id) const;
};
```

### 桶与复制集的关系

1. 每个桶包含多个复制集（ReplicationSet），这些复制集构成了桶的分片组（shard_group）。

2. 当需要写入数据时，系统会：
   - 根据时间戳找到对应的桶（或创建新桶）
   - 根据哈希ID确定使用哪个复制集（`bucket.VnodeFor(hash_id)`）
   - 将数据写入到该复制集的主节点

3. 复制集内部有多个虚拟节点（VnodeInfo），包括一个主节点和多个副本节点，确保数据的高可用性。

### 桶的生命周期管理

1. **创建**：通过`CreateBucket`方法创建新桶，为其分配ID、时间范围和复制集。

2. **预创建**：系统会定期检查并预先创建即将需要的桶，通过`GetPreCreateBuckets`方法实现。

3. **过期**：通过`GetExpiredBuckets`方法识别已过期的桶（时间范围早于数据库的过期时间）。

4. **删除**：通过`DeleteBucket`方法删除不再需要的桶。

总的来说，桶是这个时序数据库中按时间范围组织数据的基本单元，它通过复制集和虚拟节点实现了数据的分片存储和高可用性，同时支持数据的生命周期管理。