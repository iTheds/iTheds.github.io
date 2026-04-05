---
title: "TSDBRust测试策略与SQL用例"
description: "测试分层模板与 SQL 用例记录"
---

## 测试分层模板

原文定义四类测试:

1. `function_test`:功能级测试
2. `concurrency_paraller_test`:并发与并行测试
3. `struct_definition`:结构定义测试
4. `feasibility_test`:可行性验证测试

模板:

```rust
mod function_test {}
mod concurrency_paraller_test {}
mod struct_definition {}
mod feasibility_test {}
```

## SQL 留存用例

```sql
create database testDemo;
create table testTable(ts timestamp, id int);
insert into testTable values(now, 1);
insert into testTable values(now, 2);
select * from testTable;
select * from ins_table;
show tables;
```

```sql
create topic topic_1 as select * from testTable;
```

## 测试策略补充

- 功能验证应与并发验证分离，避免混淆问题归因。
- 对 worker/RPC/topic 相关链路应补充最小回归样例。
- 对“阻塞退出、队列关闭、消息顺序”建立专项测试。
