---
title: "test_sql"
description: "test_sql"
---

1. 创建 consumer; cmngrProcessCreateCunsumerReq(CreateConsumer)
   1. CREATE CONSUMER consumer_name;
2. 创建 subscribe; cmngrProcessSubscribeReq(TDMT_MND_TMQ_SUBSCRIBE CMSubscribeReq) tqProcessSubscribeReq(TDMT_VND_TMQ_SUBSCRIBE MqRebVgReq)
   1. SUBSCRIBE consumer_name TOPICS (topic_name1, topic_name2);
3. 消费函数; tq_process_consume_req(SMqPollReq)
   1. CONSUME POLL;

主要流程:
1. 创建 topic ; cmngrCreateTopic(CMCreateTopicReq)
2. 创建 consumer; cmngrProcessCreateCunsumerReq
3. 创建 subscribe; cmngrProcessSubscribeReq(TDMT_MND_TMQ_SUBSCRIBE) tqProcessSubscribeReq(TDMT_VND_TMQ_SUBSCRIBE) 
4. 插入数据的挂载; 
5. 消费函数; tq_process_consume_req



```sql
create database testDemo;
create metric testTable(ts timestamp, id int);
insert into testTable values(now, 1);
insert into testTable values(now, 2);
select * from testTable;
show metrics;
```

-- select * from ins_table;

```sql
create topic topic_1 as select * from testTable;

```