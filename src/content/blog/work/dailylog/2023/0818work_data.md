---
title: "0818work_data"
date: "2023-08-18"
author: "Lonnie iTheds"
tags:
  - work
draft: false
section: "work"
sourcePath: "markdown/work/dailylog/2023/0818work_data.md"
slug: "work/dailylog/2023/0818work_data"
---
# 0818work_data

所有的记录都分散在各个项目系统文件中。
最近，5月份在进行开发 qworker 等调度组件。
6月在进行时序数据库开发工作。
7月时间比较分散，其中月末有两三周在写专利，并且开发安捷数据库内容。
8月初继续7月的一篇专利。

目前最主要的事情是对时序数据库进行攻艰。

目前的情况是，我个人的状态已经在十分之好的时期，而今年年底，8，9，10，11，12，1。
在这些有限的时间内。预先安排一系列的事情，只需要完成其半即可。


# Consciousness

[8.23]
首先，仍然需要阅读源码，但是对于源码分析，我还并不是有很多的门道。
我的目的是什么，如何通过阅读抽离出部分的技术要点，然后自己加以改进实现。
这里涉及到两个点：
1. 如何读
2. 如何写

并不追求逐字逐句阅读，但是必须要有一个大体的概念。在不断学习的过程中，这个度量将会越來越标准。

基于用户动作的分析过程，
基于编程过程，
基于框架

代码阅读中，真正关键的函数其实屈指可数。
如果是工程性很强的，那么大多都是能够细分到一定的扩展性质。

## Consciousness

[8.28]
每个人的编程风格都不一样。
虽然我一直主张将对象层级限定到指定范围内，把各个对象的次级、父级权限限定到一定范围内。
但是面对良莠不齐的编程规则，很多时候会先考虑其适用性，导致很多对象的分配存在争议。
而由于“编程风格”问题，甚至有一个对象中只有一个成员的现象这样显然不合理的做法。
再过于争辩已无意义，统一是困难的，也不是我这个位置能做的事。
既然如此，应当对自己所定义的内容进行负责，仍然保证自己所作业的东西在合理范围内，使用到其他人所定义的结构体或对象，按照其使用方式来使用，或者有必要，做出部分限定。
如此保证之后，将注意力放到更广阔的逻辑和思维上，更具体来说是规划上。

其实本质上是，我不知道我不懂什么。我只是在解决当下的问题，或者看到什么就是什么。

# 

学习方法论

工程能力
科研能力
写作、阅读、计算。
调配。
人事。

# other

1994年分税制改革
https://zh.wikipedia.org/wiki/1994%E5%B9%B4%E5%88%86%E7%A8%8E%E5%88%B6%E6%94%B9%E9%9D%A9



# 天脉接口统计

信号量

1. 位置
2. 接口
3. 示例

大部分是被锁使用。
DBMutex - DBCriticalSection
DBLocalSemaphore
DBSemaphore
DBCriticalSection


DBMutex：
session_desc

ACoreOs_process_stack_usage_get
ACoreOs_heap_info_show
ACoreOsMP_semaphore_create
ACoreOs_semaphore_obtain
ACoreOs_semaphore_release
ACoreOs_task_priority



