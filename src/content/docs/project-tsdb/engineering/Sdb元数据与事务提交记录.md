---
title: "Sdb元数据与事务提交记录"
description: "围绕 Sdb、topic 对象、node trait 与事务提交链路的技术记录"
---

## 时间线索

- 2023-10-12
- 2023-11-09
- 2023-11-22
- 2023-11-29
- 2024-01-23
- 2024-01-29
- 2024-09-14
- 2024-10-25

## 原始记录摘录

### [10.12]

数据订阅分为订阅表和订阅列，需要指定一个 sql 语句。（其实还有一个订阅整个数据库的方式，但是 TDengine 中暂存了该方式，并未开发。）
在创建时，根据此，如果是订阅表，那么就将 `SStbObj` 放入到 `SMqTopicObj`；如果是订阅列，那么需要生成一个 `SQueryPlan` 序列化到
`SMqTopicObj` 中。
之后，开启事务，将 `SMqTopicObj` 的原生数据作为提交。

所以这一系列的函数都在 `mndTopic.c` 中。

### [11.09]

订阅发布架子：

- `topic.rs - 400`
- `WAL/mod.rs - 50`
- `db.rs - 30`
- `trans.rs - 50`

基础组件相关：

- `enumtype.rs - 50`
- `queue.rs - 610`
- `tzerror/mod.rs - 240`
- `worker/mod.rs - 550`
- `shmem/mod.rs - 270`
- `sleep/mod.rs - 20`

### [11.22]

问题的关键是，和存储以及 `SQLengine` 进行对接。

订阅发布最基本的模型。

重新梳理一下结构。

TDengine 中 `SSdb` 和 `SDbObj`，

STDB 元数据存储引擎，对应到 rust - `Meta.Tdb`

### [11.29]

之前通过事务，已经对整个体系明了了大半。

### [1.23]

测试 topic，进行运行。

```rust
let statement =
query_parser::Parser::parse_sql(&sql).map_err(|e| anyhow::anyhow!("{e:?}"))?;

let mut catalog_req = CatalogReq::default();
statement.collect(self.get_current_database_name(), &mut catalog_req);

let meta_data = Catalog::default()
.ctg_get_all_meta(&catalog_req, addr,self.get_current_database_id())
.await?;

let logic_plan = Translate::new(&meta_data,self.get_current_database_id(),self.get_current_database_name().clone())
.sql_statement_to_plan(statement)
.map_err(|e| anyhow::anyhow!("{e:?}"))?;
```

一个 db 一个 node。

### [1.29]

`sdb` 这样的存储结构可以实现 `iterator`。

项目规范方案：

1. 每个包有一个 `config` 的文件，专门存放既定的字符串和数字，可供修改的内容。
2. 实现其 `node trait`；
3. 优化锁粒度，去除 `point` 层；

全部的特征体系都围绕消息体系进行处理。

首先要明确 `svr` 和 `svrmgmt` 的职能关系。
`svrmgmt` 管理的是当前物理节点的所有该类节点。

设计节点特性，对节点的普适操作方法做出约定：

1. 初始化
2. 运行
3. 根据统一的 `NodeAction` 定义本节点的消息流转方法

### [9.14]

最基本的是，一个 topic 有一个名字和一个 sql 语句。
其能够挂载到 `cmngr` 中，并且创建物理计划。

### [10.25]

1. 同表插入，tsdb，第一个字段相同，出现 fetch meta 问题；
2. 事务提交失败，错误码 `301`；`select` 之后，未提交事务，进行连接，连接阻塞；
3. 加一个长时间未响应自动响应失败。

## 记录结论

这组记录回答的是“对象如何进入系统并最终提交”：

1. `topic` 不只是一个名字，它还可能绑定 `sql` 和序列化后的执行计划；
2. `Sdb` 既承担对象存放，也和消息体系、节点组织、catalog / metadata 获取配合；
3. `node trait`、`svrmgmt`、配置项这些看起来像框架层的东西，实际上直接影响事务和对象提交流程；
4. 后续故障里出现的 `fetch meta`、事务阻塞、错误码 `301` 都说明这条链路必须闭合。
