---
title: "0606work_data"
published: 2022-06-06
description: "燕过秋水"
tags:
  - "work"
category: "work"
draft: false
author: "Lonnie iTheds"
---
# 0606work_data

本月目标：(根据优先级排序)
1. [雷达项目]新研两个发送内容。
2. [雷达项目]和各方进行数据库的对接。
3. [ODBC开发]开发 bind 方式和 CLOB方式。
4. [雷达项目]适配 Linux 。
5. [十所]出具具体的 SQL 文件。

[6.6]
周一：
1. 出具正确的测试用例和 JAVA 测试用例并且通过。

周二：
1. 仍然测试，调试 bug。

周三：
1. 编写 8114 文档。

周四：
1. 出具送测代码。
    - [X] 完成。
2. 版本合并。
    - [X] 完成。
3. [十所对接]出具具体的 SQL 文件。
    - [X] 完成,出具了不包含 SQLTOOL 使用规则的文件。

周五：
1. 搭建单系统仿真环境，周末进行测试。
2. 解决数据库中 ODBC 层内存泄漏问题。
    - [X] 完成 : 初步完成，使其不存在大内存泄漏

[6.13]
周一：
1. [RAS] 修正 res 的服务端释放，保证其 cursor 也进行了释放。
2. [RAS] 修正 setbuf 的内存释放。
4. [linux适配]linux 适配。

周二：
1. [linux适配]调查Linux 中实现 odbc 体系方式。

周三：
1. [linux适配]发现无法查找数据，确定是编码问题

周四：
1. [linux适配]增加编码扩展，适配 linux。
2. 开发分发系统其他数据支持。

周五：
2. 部署声纳方数据库使用。
    - [x] 完成，初步完成
3. 测试用例做部分修改。
    主要是修改过程，为明天去测试做准备。
    首先是 python 和 JAVA 的过程。
    python 和 java 完成。
4. 8114 说明。
    - [x] 完成
1. 测试关于字符串中特殊符号的支持。
    1. char 问题
    2. 支持 的 字符串 特殊字符，需要反斜杠的字符
4. [SQL]表的映射。
5. nan 的输入问题。
7. linux row.uid 问题。

周六：
1. 出差测试

[6.21]
周一：
1. 出差测试

周二：
1. 出差测试

周三：
1. 开发航行信息整合上传。搭建基本的框架。

周四：
1. 开发航行信息整合上传。编写完成。

周五：
1. 开发航行信息整合上传。
    - [] 基本测试。目前问题是，通信协议的方式暂时只是使用的以末尾 '\0'为分割符。
2. 下午出差测试。

[6.27]
周一：
1. 多点耐心。重构一下代码。

周二：
1. 完善 QUERUE 和 通信组件内容。
    - [X] 完成，基本完成
2. [ODBC]解决多用户访问时的 bug 。
2. [ODBC]查询内存泄漏问题。
    - [x] 完成

周三：
4. 为船舶项目建立 git 仓库。
    - [X] 完成

周四：
2. 编写剩余的分发系统需求。
    - [x] 完成,完成，等待测试。
3. 对 buffer 进行中间段测试。
    - [ ] 完成，在 RecGH 仓库中进行了更新。
4. [测试]声纳数据量级异常问题。
    - [ ] 完成

周五：
1. 请假半天，感冒发热，头疼，但是下午未见好，睡觉睡了一天。下午吃了感冒药才好点，但是晚上仍然头晕，怀疑是发炎，吃了发炎药，睡了一晚上之后感觉差不多康复。

周六：
3. [JDBC]修改 int 类型支持显示。
    - [x] 完成，原因为 java 中高位 int 类型的补足方式为 1，而并非 0 .
4. [ODBC]支持 unsigned 类型。
    - [x] 完成, 保持最新的 RAS 处于 20220429 仓库。

create table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_table483create table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tablecreate table user_tableecreate table user_tablecr1000

('2022-06-30 10:32:26', '0001_20140213_002736_Yolla.all', 'target', '0.34', 1);
3天8个G
两秒发一条
一分钟 30 条
一小时 1800 条
一天 43200 条
三天 129600 条
一条 60 字节，包括头等估算为 80 字节。


3. [SQL]表映射问题
3. 生成 release 。
2. 优化网络组件.
    - [ ] 完成
2. [ODBC]修改服务关闭数据库方式为统一关闭.而断开连接时只 disconnected.
    - [ ] 完成
5. [ODBC]整理通信协议内容。
3. [ODBC]尝试使用线程池。

## 适配问题

现有问题：
1. 锐华上进程停止无法再次打开 ，经过测试最后一次 insert 的commit 无效。天脉上无问题。
2. 锐华上 远程访问服务 运行第二次的时候出现内存分配超出问题。





