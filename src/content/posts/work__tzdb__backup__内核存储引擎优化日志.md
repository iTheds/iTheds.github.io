---
title: "内核存储引擎优化日志"
date: "2021-11-30"
subtitle: "内核存储引擎优化日志"
author: "Lonnie iTheds"
draft: false
section: "work"
sourcePath: "markdown/work/tzdb/backup/内核存储引擎优化日志.md"
slug: "work/tzdb/backup/内核存储引擎优化日志"
---
# 内核存储引擎优化日志

## 调研日志

[11.30]
经过前两个星期断续调研。
现可总结，首先要明确，主要的内容有那几块，然后我们从内核的那些层面开始编写。

ATS 树。
其实如果有一个静态代码分析工具就比较好。

主要内容模块：
内存池 buffer pool 
文件系统设计
页设计
内存索引设计

IO机制 异步IO - 可不用
日志 redo log 和 undo log  - 可不用
线程池 线程任务负责定期刷盘、释放 undo log,实现 checkpoint 技术

主要操作：
定位到数据页的方式：一般的，只要有地址就可以直接定位。
查询到指定数据：通过索引。假设条件是主键，那么通过索引主键，可以确定页面位置，然后取出页面，加锁之后进行修改。 
如何存储？
如何完整执行一条 update 语句

主要对象：
数据页
索引页

现有的影子页.


## 开发日志

