---
title: "TSDB Work Data Log"
description: "TSDB 工作数据与日志记录"
---

# TDengine SQL语句

## 流相关

测试建立一张新表：
```SQL
DROP DATABASE IF EXISTS power;
CREATE DATABASE power;
USE power;

CREATE STABLE meters (ts timestamp, current float, voltage int, phase float) TAGS (location binary(64), groupId int);

CREATE TABLE d1001 USING meters TAGS ("California.SanFrancisco", 2);
CREATE TABLE d1002 USING meters TAGS ("California.SanFrancisco", 3);
CREATE TABLE d1003 USING meters TAGS ("California.LosAngeles", 2);
CREATE TABLE d1004 USING meters TAGS ("California.LosAngeles", 3);
```

创建流：
```SQL
create stream current_stream into current_stream_output_stb as 
select _wstart as start, _wend as wend, max(current) as max_current 
from meters where voltage <= 220 interval (5s);
```

```SQL
create stream power_stream into power_stream_output_stb as 
select ts, concat_ws(".", location, tbname) as meter_location, current*voltage*cos(phase) as active_power, current*voltage*sin(phase) as reactive_power from meters partition by tbname;
```

在流中写入数据:
```SQL
insert into d1001 values("2018-10-03 14:38:05.000", 10.30000, 219, 0.31000);
insert into d1001 values("2018-10-03 14:38:15.000", 12.60000, 218, 0.33000);
insert into d1001 values("2018-10-03 14:38:16.800", 12.30000, 221, 0.31000);
insert into d1002 values("2018-10-03 14:38:16.650", 10.30000, 218, 0.25000);
insert into d1003 values("2018-10-03 14:38:05.500", 11.80000, 221, 0.28000);
insert into d1003 values("2018-10-03 14:38:16.600", 13.40000, 223, 0.29000);
insert into d1004 values("2018-10-03 14:38:05.000", 10.80000, 223, 0.29000);
insert into d1004 values("2018-10-03 14:38:06.500", 11.50000, 221, 0.35000);
```

查询流：
```SQL
select ts, meter_location, active_power, reactive_power from power_stream_output_stb;
```

## 订阅发布相关

```SQL
DROP DATABASE IF EXISTS tmqdb;
CREATE DATABASE tmqdb WAL_RETENTION_PERIOD 3600;
CREATE TABLE tmqdb.stb (ts TIMESTAMP, c1 INT, c2 FLOAT, c3 VARCHAR(16)) TAGS(t1 INT, t3 VARCHAR(16));
CREATE TABLE tmqdb.ctb0 USING tmqdb.stb TAGS(0, "subtable0");
CREATE TABLE tmqdb.ctb1 USING tmqdb.stb TAGS(1, "subtable1");

INSERT INTO tmqdb.ctb0 VALUES(now, 0, 0, 'a0')(now+1s, 0, 0, 'a00');
INSERT INTO tmqdb.ctb1 VALUES(now, 1, 1, 'a1')(now+1s, 11, 11, 'a11');
```

```SQL
CREATE TOPIC topic_name AS SELECT ts, c1, c2, c3 FROM tmqdb.stb WHERE c1 > 1;

CREATE TOPIC topic_name as subquery

CREATE TOPIC topic_name AS STABLE stb_name

CREATE TOPIC topic_name AS DATABASE db_name;

SHOW TOPICS;

SHOW CONSUMERS;

SHOW SUBSCRIPTIONS;

```

### 订阅过程

DROP DATABASE IF EXISTS tmqdb;
CREATE DATABASE tmqdb WAL_RETENTION_PERIOD 3600;
CREATE TABLE tmqdb.stb (ts TIMESTAMP, c1 INT, c2 FLOAT, c3 VARCHAR(16)) TAGS(t1 INT, t3 VARCHAR(16));
CREATE TABLE tmqdb.ctb0 USING tmqdb.stb TAGS(0, "subtable0");
CREATE TABLE tmqdb.ctb1 USING tmqdb.stb TAGS(1, "subtable1");       
INSERT INTO tmqdb.ctb0 VALUES(now, 0, 0, 'a0')(now+1s, 0, 0, 'a00');
INSERT INTO tmqdb.ctb0 VALUES(now, 2, 0, 'a0')(now+1s, 0, 0, 'a00');
INSERT INTO tmqdb.ctb1 VALUES(now, 2, 1, 'a1')(now+1s, 11, 11, 'a11');

DROP TOPIC topic_name;

DROP TOPIC topicname;

topicname

CREATE TOPIC topic_name AS SELECT ts, c1, c2, c3 FROM tmqdb.stb WHERE c1 > 1;

DROP CONSUMER GROUP cgrpName ON topicname;

