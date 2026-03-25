---
title: "TZDB ODBC 连接字符串参数"
description: "TZDB ODBC 连接字符串参数"
---

# TZDB ODBC 连接字符串参数

## 本地连接参数
- `DSN`: 数据源名称
- `DATABASE`: 数据库名称
- `UID`: 用户名
- `PWD`: 密码

示例:
DSN=TZDB;DATABASE=mydb;UID=admin;PWD=password

## 分布式连接参数
- `DISTRIBUTED`: 设置为TRUE启用分布式模式
- `ROLE`: 节点角色，可选值: MASTER, REPLICA
- `SYNC_MODE`: 同步模式，可选值: SYNC, ASYNC
- `MASTER_IP`: 主节点IP地址
- `MASTER_PORT`: 主节点端口
- `SLAVE_IP`: 从节点IP地址 (仅从节点需要)
- `SLAVE_PORT`: 从节点端口 (仅从节点需要)

### 主节点连接示例:
DSN=TZDB;DATABASE=mydb;UID=admin;PWD=password;DISTRIBUTED=TRUE;ROLE=MASTER;SYNC_MODE=SYNC;MASTER_IP=192.168.1.100;MASTER_PORT=7030

### 从节点连接示例:
DSN=TZDB;DATABASE=mydb;UID=admin;PWD=password;DISTRIBUTED=TRUE;ROLE=REPLICA;SYNC_MODE=SYNC;MASTER_IP=192.168.1.100;MASTER_PORT=7030;SLAVE_IP=192.168.1.101;SLAVE_PORT=7031
