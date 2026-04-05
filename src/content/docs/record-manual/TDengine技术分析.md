---
layout: post
title: "TDengine 技术分析"
subtitle: "呦呦鹿鸣，食野之苹"
date: 2022-8-10
author: Lonnie iTheds
header-img: "hexo.jpg"
cdn: 'header-on'
categories:
  - 数据库
tags:
  -
description: "TDengine 技术分析"
---

<link rel="stylesheet" type="text/css" href="../../auto-number-title.css" />

# TDengine技术分析

TDengine 完整的软件包包括服务端（taosd）、用于与第三方系统对接并提供 RESTful 接口的 taosAdapter、应用驱动（taosc）、命令行程序 (CLI，taos) 和一些工具软件。

[2023.8.7]
重新开始写该文档。必须建立足够优异的文档策略，辅助理解。
一部分是概念性的内容，一部分是关于代码的分析。

概念性的东西介绍工程的全貌以及技术关键点。代码分析以知晓整个工程的结构和细节。
采用 框架-结构 的方式，用 UML 图来辅助理解。top-down 和 bottom-up 两个粒度方向。
结合时间因素，那么，对于较大的工程，应该用尽可能少的 UML 来进行示意。

# 关键技术

## 集群管理

## 高效写入

## 流式计算

流数据是指在时间分布和数量上无限的一系列动态数据集合体，数据的价值随着时间的流逝而降低，因此必须实时计算给出秒级响应。流式计算，顾名思义，就是对数据流进行处理，是实时计算。批量计算则统一收集数据，存储到数据库中，然后对数据进行批量处理的数据计算方式。

在日常生活中，我们通常会先把数据存储在一张表中，然后再进行加工、分析，这里就涉及到一个时效性的问题。如果我们处理以年、月为单位的级别的数据，那么多数据的实时性要求并不高；但如果我们处理的是以天、小时，甚至分钟为单位的数据，那么对数据的时效性要求就比较高。在第二种场景下，如果我们仍旧采用传统的数据处理方式，统一收集数据，存储到数据库中，之后在进行分析，就可能无法满足时效性的要求。

TDengine 的流式计算能够支持分布在多个 vnode 中的超级表聚合；还能够处理乱序数据的写入：它提供了 watermark 机制以度量容忍数据乱序的程度，并提供了 ignore expired 配置项以决定乱序数据的处理策略——丢弃或者重新计算。

单机每秒百万记录,毫秒级延迟。
全新的范式和全新的解决方案。

全新的流处理引擎是什么？

## 流的定义 - 基本操作

基本语式：
```SQL
CREATE STREAM [IF NOT EXISTS] stream_name [stream_options] INTO stb_name AS subquery
stream_options: {
 TRIGGER    [AT_ONCE | WINDOW_CLOSE | MAX_DELAY time]
 WATERMARK   time
 IGNORE EXPIRED [0 | 1]
}
```

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

> 该测试用力为 智能电表数据示例 ：
> 每一条记录都有设备 ID、时间戳、采集的物理量（如上表中的 current、voltage 和 phase）以及每个设备相关的静态标签（location 和 groupid）。每个设备是受外界的触发，或按照设定的周期采集数据。采集的数据点是时序的，是一个数据流。
> 超级表是指某一特定类型的数据采集点的集合。同一类型的数据采集点，其表的结构是完全一样的，但每个表（数据采集点）的静态属性（标签）是不一样的。描述一个超级表（某一特定类型的数据采集点的集合），除需要定义采集量的表结构之外，还需要定义其标签的 Schema，标签的数据类型可以是整数、浮点数、字符串、JSON，标签可以有多个，可以事后增加、删除或修改。如果整个系统有 N 个不同类型的数据采集点，就需要建立 N 个超级表。
>
> 该表即是一个超级表。因为其是通过标签进行聚合的。

### 基本原理

1. 事件驱动

超级表聚合是分布式聚合。
Source DB -> Target DB
语法树会分为 Pipeline ， 分发到各节点进行计算。

2. 增量计算

3. 乱序数据处理

一般指的是时间混乱。
Watermark 为乱序容忍的上界.
WINDOWS_CLOSE 

### 流式计算的触发模式

在创建流时，可以通过 TRIGGER 指令指定流式计算的触发模式。
对于非窗口计算，流式计算的触发是实时的；对于窗口计算，目前提供 3 种触发模式，默认为 AT_ONCE：
1. AT_ONCE：写入立即触发
2. WINDOW_CLOSE：窗口关闭时触发（窗口关闭由事件时间决定，可配合 watermark 使用）
3. MAX_DELAY time：若窗口关闭，则触发计算。若窗口未关闭，且未关闭时长超过 max delay 指定的时间，则触发计算。

由于窗口关闭是由事件时间决定的，如事件流中断、或持续延迟，则事件时间无法更新，可能导致无法得到最新的计算结果。

因此，流式计算提供了以事件时间结合处理时间计算的 MAX_DELAY 触发模式。

MAX_DELAY 模式在窗口关闭时会立即触发计算。此外，当数据写入后，计算触发的时间超过 max delay 指定的时间，则立即触发计算

SOURCE : 流的原表；
SINK : 流的目的表(自动创建的超级表)；
PARTITION : 每个 partition 对应的表中的一个子表.

流的存在情况:
1. 数据 -> clean 数据 -> agg 聚合数据 <- APP 主动进行查询，流存在于 TDenging 中。
2. 主动进行数据订阅，通过消息队列主动以流的形式推送给应用。

### 流式计算的窗口关闭

流式计算以事件时间（插入记录中的时间戳主键）为基准计算窗口关闭，而非以 TDengine 服务器的时间，以事件时间为基准，可以避免客户端与服务器时间不一致带来的问题，能够解决乱序数据写入等等问题。流式计算还提供了 watermark 来定义容忍的乱序程度。

在创建流时，可以在 stream_option 中指定 watermark，它定义了数据乱序的容忍上界。

流式计算通过 watermark 来度量对乱序数据的容忍程度，watermark 默认为 0。

T = 最新事件时间 - watermark

每次写入的数据都会以上述公式更新窗口关闭时间，并将窗口结束时间 < T 的所有打开的窗口关闭，若触发模式为 WINDOW_CLOSE 或 MAX_DELAY，则推送窗口聚合结果。

![流式计算的窗口关闭](./image/%E6%B5%81%E5%BC%8F%E8%AE%A1%E7%AE%97%E7%9A%84%E7%AA%97%E5%8F%A3%E5%85%B3%E9%97%AD.webp)

图中，纵轴表示不同时刻，对于不同时刻，我们画出其对应的 TDengine 收到的数据，即为横轴。

横轴上的数据点表示已经收到的数据，其中蓝色的点表示事件时间(即数据中的时间戳主键)最后的数据，该数据点减去定义的 watermark 时间，得到乱序容忍的上界 T。

所有结束时间小于 T 的窗口都将被关闭（图中以灰色方框标记）。

T2 时刻，乱序数据（黄色的点）到达 TDengine，由于有 watermark 的存在，这些数据进入的窗口并未被关闭，因此可以被正确处理。

T3 时刻，最新事件到达，T 向后推移超过了第二个窗口关闭的时间，该窗口被关闭，乱序数据被正确处理。

在 window_close 或 max_delay 模式下，窗口关闭直接影响推送结果。在 at_once 模式下，窗口关闭只与内存占用有关。

### 源码与架构

尽可能找到一下相关内容：
1. 算子 partition 的实体和操作体现；
2. 模式切换操作；
3. WAL 在流计算中的定位；

taosd 刚开始启动，初始化 vnode-stream 时，调用 `streamInit` 。
vnode-apply 以 WWroker 形式调用`streamDataSubmitNew`/`streamTaskInput`/`streamSubmitRefClone`。

open-node :
```C++
streamMetaBegin
streamMetaOpen
tqOpen
vnodeOpen
vmOpenVnodeInThread

tDecodeSStreamTask
streamLoadTasks
tqOpen
vnodeOpen
vmOpenVnodeInThread

streamQueueOpen - input 和 output queue 各一个
tqExpandTask
streamLoadTasks
tqOpen
vnodeOpen
vmOpenVnodeInThread
```

vnode-apply:
```C++
taosAllocateQitem
streamSubmitRefClone
streamTaskInput
tqProcessSubmitReq
tqPushMsg
vnodeProcessWriteMsg
vnodeApplyWriteMsg
tWWorkerThreadFp
```

vnode-stream:
```C++
streamMetaAcquireTask
tqProcessTaskRunReq
vnodeProcessFetchMsg
0x5555555d57aa <vmProcessStreamQueue>
tAutoQWorkerThreadFp

streamExecForAll
streamTryExec
streamProcessRunReq
tqProcessTaskRunReq
vnodeProcessFetchMs
0x5555555d57aa <vmProcessStreamQueue>
tAutoQWorkerThreadFp
```

vnode-commit:
```C++
streamMetaCommit
tqCommit
vnodeCommitImpl
vnodeCommitTask
loop
```

vnode-write:
```C++
streamDataSubmitRefInc
streamSubmitRefClone
streamTaskInput
tqProcessSubmitReq
tqPushMsg
vnodeProcessWriteMsg
vnodeHandleWriteMsg
vnodeProposeMsg
0x55555567090e <vnodeProposeWriteMsg>
tWWorkerThreadFp
```

mnode 中有大量 `tEncodeStreamEpInfo` 和 `tEncodeSStreamTask` 操作，这部分是序列化和反序列化的内容。

vnode-mgmt:
该节点主线程函数常调用方法`vmProcessMgmtQueue`中有三种方法分流：
```C++
    case TDMT_DND_CREATE_VNODE:
      code = vmProcessCreateVnodeReq(pMgmt, pMsg);
      break;
    case TDMT_DND_DROP_VNODE:
      code = vmProcessDropVnodeReq(pMgmt, pMsg);
      break;
    case TDMT_VND_ALTER_REPLICA:
      code = vmProcessAlterVnodeReq(pMgmt, pMsg);
```
此处执行的是 `vmProcessDropVnodeReq`，即丢弃表

#### 创建流

在执行创建表语句并且插入语句时，没有明显使用流接口的特征。
但是在对现有表创建流规则
`create stream current_stream into current_stream_output_stb as 
select _wstart as start, _wend as wend, max(current) as max_current 
from meters where voltage <= 220 interval (5s);`
的时候，有如下现象：

tmr-taskQ:
```C++
taosWriteQitem
mmPutMsgToWorker
mmPutMsgToQueue
tmsgPutToQueue
mndSyncEqMsg
syncNodeEqPingTimer
processExpiredTimer
taosProcessSchedQueue
```

mnode-write:
```C++
taosMemoryCalloc
tNewSStreamTask
mndAddShuffleSinkTasksToStream
mndScheduleStream
mndProcessCreateStreamReq -- 关键创建流接口
mndProcessRpcMsg
mmProcessRpcMsg
tQWorkerThreadFp
```

vnode-write:
```C++
tDecodeSStreamTask
tqProcessTaskDeployReq
vnodeProcessWriteMsg
vnodeHandleWriteMsg
vnodeProposeMsg
vnodeProposeWriteMsg
tWWorkerThreadFp
```

算子分布过程：
```C++
qCreateExecTask
qCreateStreamExecTaskInfo
0x5555556d43c1 <tqExpandTask>
tqProcessTaskDeployReq
vnodeProcessWriteMsg
vnodeHandleWriteMsg
vnodeProposeMsg
vnodeProposeWriteMsg
tWWorkerThreadFp
```

注意，此处有一点，`mnode-write`先进行创建流，然后也对流进行了任务抽取，并且编码(此处比较模糊仅供参考，需后续验证)。
然后，`vnode-write`对流做了一些部署()`tqProcessTaskDeployReq`)处理，之后由 `mnode-write`调用 `tFreeSStreamTask`释放当前的流任务。
大致上，mnode-write 节点创建流后，开始对流的计算方式进行部署，部署规模可能取决于流计算规则，但可以确定的是，大部分都是部署在 vnode-write 中的。`vnode-write`将规则进行部署落实，之后通知 `mnode-write`已经结束相关任务。

`vnode-write` 部署时兼备不同的算子，流到来的时候在多个部署了不同算子的节点中传递。

详细过程以及关键函数如下：

![](/record-manual/image/TDengine_operator_create.drawio.svg)

#### 插入数据

执行 `insert into d1001 values("2018-10-03 14:38:05.000", 10.30000, 219, 0.31000);` 时，关键栈有如下顺序：

vnode-write:
```C++
streamDataSubmitNew
tqProcessSubmitReq
tqPushMsg
vnodeProcessWriteMsg
vnodeHandleWriteMsg
vnodeProposeMsg
vnodeProposeWriteMsg
tWWorkerThreadFp
```

vnode-stream:
```C++
streamMetaAcquireTask
tqProcessTaskRunReq
vnodeProcessFetchMsg
vmProcessQueryQueue
tAutoQWorkerThreadFp
```

vnode-stream:
```C++
streamDispatch
streamProcessDispatchRsp
tqProcessStreamTaskCheckReq
vnodeProcessFetchMsg
vmProcessStreamQueue
tAutoQWorkerThreadFp
```

算子的生成方式，详细过程以及关键函数如下：

![](/record-manual/image/TDengine_stream_insert.drawio.svg)

#### 查询流中数据

执行`select ts, meter_location, active_power, reactive_power from power_stream_output_stb;`。
该部分还涉及到聚合运算。但其实也是执行算子的过程。

vnode-query:
```C++
createExchangeOperatorInfo/createProjectOperatorInfo
createOperatorTree
createExecTaskInfoImpl
qCreateExecTask
qwProcessQuery
qWorkerProcessQueryMsg
vnodeProcessQueryMsg
vmProcessQueryQueue
tQWorkerThreadFp
```

```C++
dsCreateDataSinker
qCreateExecTask
qwProcessQuery
qWorkerProcessQueryMsg
vnodeProcessQueryMsg
vmProcessQueryQueue
tQWorkerThreadFp
```

```C++
qExecTaskOpt
qwExecTask
qwProcessQuery
qWorkerProcessQueryMsg
vnodeProcessQueryMsg
vmProcessQueryQueue
tQWorkerThreadFp
```

执行的时候, getNextFn：
```C++
doTableScan
doProjectOperation
```

vnode-fetch 之后， vnode-query getNextFn :
```C++
loadRemoteData - doLoadRemoteDataImpl
```

似乎执行了 createOpertorTree ，但是不知道是否是生成了一个 tree. 

vnode-fetch:
```C++
qwGetQueryResFromSink
qwProcessFetch
qWorkerProcessFetchMsg
vnodeProcessFetchMsg
vmProcessFetchQueue
tWWorkerThreadFp
```

vnode-fetch:
```C++
qWorkerProcessDropMsg
vnodeProcessFetchMsg
vmProcessFetchQueue
tWWorkerThreadFp
```

vnode-fetch TDMT_SCH_DROP_TASK 多余 task。

如果是第一次运算，那么服务端没有缓存，会执行如下栈。猜测这里是获取表的元数据信息。

mnode-read:
```C++
mndProcessBatchMetaMsg
mndProcessRpcMsg
mmProcessRpcMsg
tQWorkerThreadFp
```

形成如下分析图：

![](/record-manual/image/TDengine_stream_select.drawio.svg)

但是，流经过算子的过程是在什么时候进行的呢，这还未观测到。按照原定猜测，或者说我们自己的程序 Demo 逻辑应该是，创建流的时候，将流计算需要的算子部署到 vnode-write ...... ， 人傻了，流计算应该是 insert 的时候经过。查询的时候不需要经过，这部分只是生成 sql 操作而已。

### 流式计算架构

所以我们可以总结一下整个场景中，流式计算技术的要点：
窗口的体现方式在那里？watermark
事件驱动、增量计算、乱序数据处理又体现在那里？
触发方式又是如何的？

算子树生成的时候有 `createStreamFinalIntervalOperatorInfo` 生成窗口计算的的算子。依据`adjustWatermark`得知 watermark 会根据 interval (5s) 进行调整。
每次插入数据的时候，会通过时间进行判断，由 `updateInfoIsUpdated` 完成窗口演算。
增量计算是体现在算子上的。此处并没有仔细研究。但可以知道算子具体方法是存放在 function 文件中的。
时间时间作为基准方法来解决乱序数据。

其模块交互图如下：

![](/record-manual/image/TDengine_stream_framework.drawio.svg)

### 

细节有，算子的定义，流的定义。
任务分配，任务拆解方式。

需要明确的过程：
流的具体处理过程
流计算与订阅分发
流计算与存储引擎
流计算与查询引擎

算子的运行过程
节点与任务
线程之间的通信方式，每个节点所持有的资源，qunue 是否每个节点都有一个？

job 和 task : job 应该是初步拆分的词法解析内容， mnode 将词法解析内容转换成可计算的 task 集合。

新开始的 taosd 线程负责的是 udfd, 数据接受？？

SRpcMsg 无疑是消息体。
但是哪些是 job ，哪些是 task ，哪些又是流的主体，这些结构内部又包含什么？

写入的时候，vnode-write 先将数据写入，然后 wal ，最后经过流转发到 vnode-stream, 其进行执行算子，如果需要则广播到子节点。
其中被广播 dispatch 的是？？ 

有两张表，一个源表一个目的表。

至此已经可以尝试总结一下。
画出一些图片，然后边开始完善一下 worker。

### 参考资料

1. 流处理框架对比

![流处理框架对比](./image/%E6%B5%81%E5%A4%84%E7%90%86%E6%A1%86%E6%9E%B6%E5%AF%B9%E6%AF%94.png)

2. [全面解析流处理框架 Flink，以及和 Python 的结合](https://www.cnblogs.com/traditional/p/11511685.html)

## 心跳机制

trans-svr-work 常写入心跳包。
交由 mnode-read 执行 {int32_t (SRpcMsg *)} 0x5555555ef50e <mndProcessHeartBeatReq> 。 
mnode-sync 执行 TDMT_SYNC_TIMEOUT 所指代方法 syncNodeOnTimeout ， 一般为调试时时间超出。

## 数据订阅

## 运维诊断

主要涉及 RPC 诊断。

## 传输方式

涉及到 REST API。

对于数据量不到 15K 的数据包，采取 UDP 的方式进行传输，超过 15K 的，或者是查询类的操作，自动采取 TCP 的方式进行传输。

## RPC

TDengine 中使用的是 libuv 。

uv_async_init

uv_async_send

## 数据订阅

数据订阅的基本概念是,客户端创建一个订阅,服务端对其进行响应，将符合的数据存放到某个地点，符合条件的数据流入系统后，系统将其暂存。客户端需要时则可在直接获取。

主要对用户函数是 ：
```C++
tmq_subscribe
```

其他辅助函数群为：
```C++
tqProcessPollReq

tqProcessSubscribeReq
```

## 第三方主要技术工具

### Kafka 

### libuv

例子：

```C++
#include <iostream>
#include <uv.h>
#include <stdio.h>
#include <unistd.h>

uv_loop_t *loop;
uv_async_t async;

double percentage;

void print(uv_async_t *handle)// 目标回调函数，只能支持该类型传参
{
    printf("thread id: %ld, value is %ld\n", uv_thread_self(), (long)handle->data);//获取线程，输出数据
}

void run(uv_work_t *req)
{
    long count = (long)req->data;
    for (int index = 0; index < count; index++)
    {
        printf("run thread id: %ld, index: %d\n", uv_thread_self(), index);
        async.data = (void *)(long)index;
        uv_async_send(&async);
        sleep(1);
    }
}

void after(uv_work_t *req, int status)
{
    printf("done, thread id: %ld\n", uv_thread_self());
    uv_close((uv_handle_t *)&async, NULL);
}

int main()
{
    printf("main thread id: %ld\n", uv_thread_self());
    loop = uv_default_loop();

    uv_work_t req;
    int size = 5;
    req.data = (void *)(long)size;

    uv_async_init(loop, &async, print);
    uv_queue_work(loop, &req, run, after);

    return uv_run(loop, UV_RUN_DEFAULT);
}
```

uv_async_t 作为一个句柄，可以通过 uv_async_send(uv_async_t) 进行？？？
uv_async_t->data 是该句柄中存有的数据。
基本原理

# 安装与部署

# 源码阅读

根目录：
* contrib : 一些引用的外部内容
* include : 对外头文件
* source : 内部头文件和源文件
* packaging : 
* tools : 
* utils : tsim

source 目录：
* os : 系统适配层次
* util : 基本组件
* common : 
* dnode ：
* libs : 
* client : 

## 核心点抽取

### 启动过程

首先看服务端的启动过程。
1. 部署节点方式的代码体现？这是实现负载均衡的第一步，对节点进行部署。那么我们可以通过反馈函数进行查询。

其中`tQWorkerAllocQueue`栈如下：
```C++
main
dmInit
dmInitDnode - 此中作为函数指针存放 vmGetMgmtFunc
vmGetMgmtFunc
vmInit
vmStartWorker
vmProcessMgmtQueue
vmProcessCreateVnodeReq
vmOpenVnode
vmAllocQueue
tQWorkerAllocQueue
```

暂未找到，疑似使用的是配置项。

2. 服务启动

dmMain.c 中 函数  `int main(int argc, char const *argv[])` 启动。
使用的是 6030 端口。

### 全局变量



## stream 流相关





## API

### Queue 和 Qset 

qset , queue set ,即队列集合。

SQueueInfo 中存储了 worker 的所有基本信息。

该源码中，涉及到以下几种概念：
1. STaosQnode : 单个节点，存有上级队列 Queue 和下个节点 Qnode 指针。以 `char item[]` 作为数据存放点。
2. STaosQueue : 毫无疑问，这里面存储了 Qnode ，并且含有一个锁和一个信号量，
3. STaosQset : 存储的是多个 Queue ， 作为 STaosQueue 的集合，拥有一个特定的锁和信号量。存储了 STaosQueue 的头节点和当前节点位置。
4. STaosQall : 队列全集， 存放的是 STaosQnode 头和当前位置指针。用于将 StaoSet 或者 STaosQueue 转换为最基本的以 STaosQnode 组成的链表形态。

其中基本方法群有：
1. 打开
2. 关闭
3. 设置参数
4. 写入 item : 在 `taosWriteQitem` (STaosQset 和 STaosQueue 系列) 中如果写入成功，会进行`tsem_post(&queue->qset->sem)`，为该信号量 +1 ，标志资源数目。
5. 读出 item : 在 `taosReadQitemFromQset` (STaosQset 和 STaosQueue 系列) 中会使用 `tsem_wait(&qset->sem);` 等待该信号量有值。

有意思的是， `taosReadAllQitems` 函数将 STaosQueue 转换成 STaosQall 。实际上， STaosQall 系列也没有单个写入和读出， 应该只是作为 set 和 queue 的中间内容。

到此，所有的 set 和 queue 的实现机制已经讨论完毕。
在应用场景上还需要结合 worker 来看。

### 工作者 worker

worker 实体有：
1. SQWorker : 基本的 worker ，没有涉及到 STaosQall 和 STaosQset 
2. SWWorker : 含有 STaosQall 和 STaosQset 的 worker ，专门为 SWWorkerPool 定制

似乎是表示有三种池模式，本质上是应对不同任务结构：
1. SQWorkerPool 系列
   1. 这里运用到的就是 SQWorker 。
   2. 含有 STaosQset 
2. SAutoQWorkerPool 系列
   1. 所用到的是 SArray 作为 worker。- 实际上该处还是使用的 SQworker
   2. 含有 STaosQset 
3. SWWorkerPool
   1. 采用新的 SWWorker 作为 worker。其中含有 STaosQset
   2. 没有 STaosQset 。 

三种模式的区别在于其调度的策略有所区别。

三种池模式都有以下方法：
1. QWorkerInit : 
2. QWorkerCleanup : 
3. QWorkerAllocQueue : 
4. QWorkerFreeQueue : 

两种额外的 worker：
1. SSingleWorker
   1. 配合配置类 SSingleWorkerCfg 
   2. 使用在 SQWorkerPool 
2. SMultiWorker
   1. 配合配置类 SMultiWorkerCfg 
   2. 使用在 SWWorkerPool 

这两个 worker 都有以下方法：
1. WorkerInit
2. WorkerCleanup

在内部中有接口，这些接口分别表示的是 worker 线程中的主要执行内容：
1. tQWorkerThreadFp : 
   1. 直接从 qset 中检索任务并且执行任务
2. tAutoQWorkerThreadFp
   1. 直接从 qset 中检索任务并且执行任务
3. tWWorkerThreadFp
   1. 用方法 taosReadAllQitemsFromQset 从 worker->qset 里检索，并且执行

该方法都是只检索一个，并且执行一个。都是在对应的 QWorkerAllocQueue 中使用到，作为线程的方法被使用。

总结：
[2023.3.15]
目前是一个粗略的观看。
(也不知道它是一种调度策略还是一种方式，工作者？并没有理论概念支撑)，三种方式，对应着各种不同的结构。
在进行执行的时候其实差别并不大。
下一步主要就是深入了解关于应用场景，通过应用场景看着三种的差别。

在使用上，三种模式的 WorkerPool 都是在 vmlnt 中有使用。
1. SQWorkerPool : vmInt.h / vmWorker.c
2. SAutoQWorkerPool : vmInt.h / vmWorker.c
3. SWWorkerPool : vmInt.h / vmWorker.c

几个类的引用处：
1. QWorkerInit :  qworker 和 vmWorker.c / mndQuery.c / vnodeQuery.c / schTask.c 中都有涉及。
2. QWorkerCleanup : vmWorker.c
3. QWorkerAllocQueue : vmWorker.c
4. QWorkerFreeQueue : vmWorker.c

先直接翻译一版本。

### 底层交互

```C++
static int32_t dmInitSystem() {
  taosIgnSIGPIPE();
  taosBlockSIGPIPE();
  taosResolveCRC();
  return 0;
}
```

#### taosResolveCRC

SSE 4.2 计算机指令集

Intel首次在45nm Penryn处理器中新增了英特尔SSE4指令集，这是自最初SSE指令集架构ISA推出以来添加的最大指令集，其中包含了47条多媒体处理指令，进一步扩展了英特尔64指令集架构。之前45nm Penryn处理器的指令集版本为SSE4.1，此次Nehalem处理器在SSE4.1指令集的基础上又加入了几条新的指令，称之为SSE4.2。

SSE4.2指令集新增的部分主要包括STTNI(STring & Text New Instructions)和ATA(Application Targeted Accelerators)两个部分。以往每一次的SSE指令集更新都主要体现于多媒体指令集方面，不过此次的SSE4.2指令集却是加速对XML文本的字符串操作、存储校验等。
更具体地说，SSE4.2 加入七个新指令：CRC32、PCMPESTRI、PCMPESTRM、PCMPISTRI、PCMPISTRM、PCMPGTQ 与 POPCNT。
英特尔表示，采用SSE 4.2指令集后，XML的解析速度最高是原来的3.8倍，而指令周期节省可以达到2.7倍。此外，在ATA领域，SSE 4.2指令集对于大规模数据集中处理和提高通信效率都会发挥应有的作用，这些对于企业IT应用显然是有帮助的。当然，SSE 4.2指令集只有在软件对其支持后才会产生效果，相信Nehalem-EP上市，相关的优化与升级届时就会出现。

smmintrain.h 中系列函数例如 `_mm_crc32_u8`。

CRC（Cyclic Redundancy Check）循环冗余校验码，使用 SSE 4.2 支持的指令集合 CRC32 。

#### taosBlockSIGPIPE

```C++
void taosBlockSIGPIPE() {
#ifdef WINDOWS
  // assert(0);
#else
  sigset_t signal_mask;
  sigemptyset(&signal_mask);//将信号集初始化为空
  sigaddset(&signal_mask, SIGPIPE);//把信号 SIGPIPE 添加到信号集 signal_mask 中
  int32_t rc = pthread_sigmask(SIG_BLOCK, &signal_mask, NULL);
  if (rc != 0) {
    // printf("failed to block SIGPIPE");
  }
#endif
}
```

信号集

在 PCB（Printed Circuit Board印制电路板 中有两个非常重要的信号集。一个称为 `阻塞信号集`， 一个称为 `未决信号集`。
这两个信号集都是内核使用`位图机制`来实现的。但操作系统不充许我们直接对其操作，而需自定义另外一个集合，借助信号操作函数来对 PCB 中这两个信号集进行修改。

自定义信号集函数

为了方便对多个信号进行处理，一个用户进程常常需要对多个信号做出处理，在Linux系统中引入了信号集。
信号集是一个能表示多个信号的数据类型。

```C++
#include<signal.h>

int sigemptyset(sigset_t *set);                 // 清空集合
int sigfillset(sigset_t *set);                  // 将所有信号加入集合
int sigaddset(sigset_t *set,int signo);         // 将 signo 信号加入集合
int sigdelset(sigset_t *set,int signo);         // 从 set 集合中移除 signo 信号
int sigismember(const sigset_t *set,int signo); // 判断信号是否存在

// 除 sigismember 外，其余函数中的 set 均为传出参数
```

访问调用线程的信号掩码, 请使用 pthread_sigmask(3C) 更改或检查调用线程的信号掩码。 
[pthread_sigmask](https://docs.oracle.com/cd/E19253-01/819-7051/tlib-31261/index.html)

#### taosIgnSIGPIPE

Linux信号概述
信号是由用户、系统或者进程发送给目标进程的信息，以通知目标进程某个状态的改变或系统异常。

Linux信号可由如下条件产生:
对于前台进程，用户可以通过输人特殊的终端字符来给它发送信号。比如输入Ctrl+C 通常会给进系统异常。
比如浮点异常和非法内存段访问。
系统状态变化。比如 alarm定时器到期将引起SIGALRM信号。
运行kill命令或调用kill函数。

> 信号处理方式

接受信号就要处理信号

```C++
#include<signal.h>
typedef void (*_sighandler_t)(int);

#include<bits/signum.h>
#define SIG_DFL ((_sighandler_t) 0);
#define SIG_ING ((_sighandler_t) 1);
```

信号处理函数只带有一个整型参数，该参数用来指示信号类型。信号处理函数应该是可重入的，否则很容易引发一些竞态条件。所以在信号处理函数中严禁调用一些不安全的函数。
SIG_IGN表示忽略目标信号，SIG_DFL表示使用信号的默认处理方式。信号的默认处理方式有如下几种:结束进程（Term)、忽略信号(Ign)、结束进程并生成核心转储文件( Core)、暂停进程( Stop)，以及继续进程(Cont)。

> 中断系统的调用

如果程序在执行处于阻塞状态的系统调用时接收到信号，并且我们为该信号设置了信号处理函数，则默认情况下系统调用将被中断，并且errno被设置为EINTR。我们可以使用sigaction函数（见后文）为信号设置SA_RESTART标志以自动重启被该信号中断的系统调用。
对于默认行为是暂停进程的信号（比如 SIGSTOP、SIGTTIN)，如果我们没有为它们设置信号处理函数，则它们也可以中断某些系统调用（比如 connect、epoll_wait)。POSIX没有规定这种行为，这是Linux独有的。

[function illustration](https://www.gnu.org/software/libc/manual/html_node/Basic-Signal-Handling.html)

关于信号的使用建议参照文章进行学习 -- [Linux异步信号处理函数引发的死锁及解决方法](https://developer.aliyun.com/article/57570)

# 学习日志

[2022.8.10]
首先，通过 TDengine 的初步学习发现，该数据库的明显特征就是在处理时序数据时的分布式集群。
时序数据库，也就是带有时间参数的数据，特点是内容庞大。我觉得作为数据处理，它的明显的地方在于，SQL 语句执行的时候是允许按窗口切分聚合，完成了聚合的运算。而时序数据库对于其他的数据库来说，主要体现在处理的数据量大小上。
在存储上，利用时间递增、维度重复、指标平滑变化的特性，合理选择编码压缩算法，提高数据压缩比；通过预降精度，对历史数据做聚合，节省存储空间。

:::info
从写入负载来分析，时序数据库的场景有大量数据的实时写入，而非单行数据的写入与修改。由于时序数据库的写入负载通常很高，如每秒几百万甚至几千万条数据，所以时序数据库的存储引擎往往是基于对大量写入更加友好的LSM Tree(Log Structured Merge Tree)，而非对主键点查询、主键范围查询以及单行修改与更新更友好的B+树。开发高效的时序数据库存储引擎，需要扎实的操作系统、数据库系统、分布式系统、体系结构、数据结构与算法等计算机基础
:::

[2023.4.4]
代码在 vscode 上太难调试了。线程一多，没有办法进行单线程调试。

[2023.4.11]
原该文章为 TDengine 学习笔记，修改为 TDengine 技术分析。

[2023.4.14]
集中精神，足够了解。
后续要更加深入，必须了解的子分析是：
1. sqlengine 拆解出的 job 到 task 传到服务端后，task 如何匹配到算子 -- 即这三者之间的关系要明确；
2. 实现流计算的必须要素要明确 -- 即流计算与普通计算的差异在那里，我们目前的分析了解到，算子不仅作为流计算的计算规则，也作为普通表的计算，那么这两种区别如何，流计算中的低延时是如何实现的，细化到接口，或者说，那一部分的代偿是我们的主要探讨点。之后反馈，在新的项目 Demo 中，又那一部分代偿是关键的？

[2023.7.24]
CREATE DATABASE power KEEP 365 DURATION 10 BUFFER 16 WAL_LEVEL 1;

USE power;

CREATE STABLE mters (ts timestamp, current float, voltage int, phase float) TAGS (location binary(64), groupId int);

TDengine 客户端程序从其他数据源不断读入数据，在示例程序中采用生成模拟数据的方式来模拟读取数据源。
单个连接向 TDengine 写入的速度无法与读数据的速度相匹配，因此客户端程序启动多个线程，每个线程都建立了与 TDengine 的服务端，每个线程都有一个独占的固定大小的消息队列。
客户端程序将接收到的数据根据所属的表名(或子表名)HASH到不同的线程，即写入该线程所对应的消息队列，以此确保属于某个表(或子表)的数据一定会被一个固定的线程处理。
各个子线程在将所关联的消息队列中的数据读空后或者读取数据量达到一个预定的阈值后将该批数据写入 TDengine ， 并继续处理后面接收到的数据。



