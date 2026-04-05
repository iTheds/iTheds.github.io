---
title: "TMQ订阅部署与消费位点记录"
description: "围绕 subscribe、rebalance、poll 与 offset 提交的技术记录"
---

## 时间线索

- 2023-12-01
- 2023-12-04
- 2023-12-06
- 2023-12-07
- 2023-12-10

## 原始记录摘录

### [12.1]

今天开发消费内容，尽可能下午与 SQL 引擎对接。

`STqOffsetStore` 可能是消费位点提交。

其中，日志和消费位点有一个配合，需要共同开发的部分。

从主消费函数中衍生出整个流程，`tqProcessPollReq`。
消费过程：
提出其消费者 id 时间和消费位点，找到 `Tq handle`。
`stq` 是维护在 vnode 中的，`tq handle` 很可能是为单个可操作的内容，其内部含有 wal，应该是为订阅发布所设计的。

[优化]很多地方都有对不同的订阅结构（表、数据库、列）而分的 union，这部分应当使用统一的协定。

### [12.4]

再回归一下 tdengine 数据订阅发布过程：
首先，mnode 的工作者接收 `create topic` 请求包，生成相对的执行树（或执行计划），并且将 topic 记录到 sdb。
在创建完成订阅之后，流任务才被创建，并且发送到 vnode。

订阅过程，根据客户端订阅函数 `tmq_subscribe` 发现其构造了一个请求结构 `SMsgSendInfo`，
其中，`TDMT_MND_TMQ_SUBSCRIBE`，`SMqSubscribeCbParam`，
由 `mndSetMsgHandle(pMnode, TDMT_MND_TMQ_SUBSCRIBE, mndProcessSubscribeReq);`
指定函数 `mndProcessSubscribeReq` 进行处理，此处才是进行订阅的过程。然后更新指定的消费者。
所以订阅就是更新消费者的过程。

但是其实际生效是在 `mndProcessRebalanceReq` 中。

`SMqSubscribeObj` 和 `SMqTopicObj` 有同 `cgroup` 下的 key。
代表了 `<topic, subscribe, consumer>` 的关系。
创建订阅 `subscribe` 之后，存储到 mnode sdb 中。

均衡操作 `mndProcessRebalanceReq` 调用，这是一个应答 `TDMT_MND_TMQ_DO_REBALANCE` 的响应结构。
调用 `mndSchedInitSubEp`，将 topic 中的 qplan 取出其子计划，放到 `SMqSubscribeObj->unassignedVgs` 中的 `qmsg`，之后通过
`mndDoRebalance`，发给相关的 vnode。

在消费时，根据 req 中的 key，找到 handle，确定消费位点，进行校验，之后取出消费位点的数据，然后将结果集返回，之后提交消费位点。

`SMqDataRsp` 应该是一个能适用于多线程，暂时存储结果集的结构。
`STqPushEntry` 是一个用于推数据的结构，存储应答消息体。其存储在 stq 中。

也就是说，在消费时，
如果是列订阅，
如果消费位点是 log 模式，创建一个 `STqPushEntry`，添加到 `stq->pPushMgr` 中，之后结束消费过程。
如果不是 log 模式，发送，然后结束消费过程。其作为 `TMQ_MSG_TYPE__POLL_RSP`。

如果不是列订阅，
如果消费位点不是 `TMQ_OFFSET__LOG` 模式，那么扫描位点数据，如果有数据，则发送，没有则设置消费位点，结束消费过程。
如果消费位点是 log 模式，那么通过 `tqFetchLog` 扫描日志，获取数据后 `tqSendTaosxRsp`，然后提交。

### [12.6]

根据之前分析的 tdengine 数据订阅发布过程，构建本数据库的订阅发布最简单的过程：

创建 `topic`：使用 sql 语句进行创建，mnode 的工作者接收 `create topic` 请求包，生成一个相对的执行树（或执行计划），存储到
`topic obj` 中，并且将 `topic obj` 记录到 sdb。

创建消费者：使用客户端接口创建，mnode 接收到创建消费者请求包，存储到 sdb 中。

创建订阅 `subscribe`：使用客户端接口创建，mnode 接受到订阅 `CMSubscribeReq` 请求包，更新消费者结构体，将生成的 `subscribe`
obj 存储到 sdb 中，
将 topic 中的执行计划 `plan` 一并发送到 vnode，分配 `STqPushEntry`、`STqHandle`、`SAlterCheckInfo`、`STqOffsetStore`，

1. `pPushEntry->subKey` 与 handle 有 hash 关系。`STqPushEntry` 中有 `SMqDataRsp`，用于存储并管理结果集。
2. `STqOffsetStore` 管理消费位点；

```c++
SHashObj* pPushMgr;    // consumerId -> STqPushEntry
SHashObj* pHandle;     // subKey -> STqHandle
SHashObj* pCheckInfo;  // topic -> SAlterCheckInfo
STqOffsetStore* pOffsetStore;
```

消费时：根据 req 中的 key，找到 handle，确定消费位点，进行校验，之后取出消费位点的数据，使用执行树进行执行，输出结果集到指定的
`pPushMgr` 中。然后将结果集返回，之后提交消费位点。

### [12.7]

还是四部分：

1. topic
   1. [X] 创建 topic
2. consumer
   1. [X] 创建 consumer
3. subscribe
   1. [ ] 订阅过程
4. consume
   1. [ ] 消费过程

需要的支撑：

1. sql 引擎：
   1. [ ] 生成执行树
   2. [ ] 执行树执行
   3. [ ] 结果集保存
2. wal：
   1. [ ] 写入 wal
   2. [ ] 读出指定位置的 wal
   3. [ ] 批量读出
3. sdb 系列函数怎么写
4. trans 部分怎么处理

消费过程，依赖的东西太多。

### [12.10]

之后的开发只有三个部分:

1. 创建订阅
2. vnode 的操作方法，其主要是
   1. 接收到 subscribe 之后的部署操作 `psvr_process_deploy_subscribe_task`
3. 消费的流程

`TD_DEF_MSG_TYPE(TDMT_VND_TMQ_SUBSCRIBE, "vnode-tmq-subscribe", SMqRebVgReq, SMqRebVgRsp)`，
忽略了一个订阅的过程 `tqProcessSubscribeReq`，在此处，订阅的时候创建了算子 `qCreateQueueExecTaskInfo`。

## 记录结论

这一阶段已经把订阅线闭合到可实现的程度：

1. mnode 负责 topic / subscribe / consumer 的对象更新与 rebalance；
2. vnode 负责部署 `STqHandle`、`STqPushEntry`、`STqOffsetStore`；
3. consume 入口是 `tqProcessPollReq`，真正依赖 wal、执行树、结果集与 offset 管理协同；
4. 未完成项主要不在单点接口，而在 sql 引擎、wal、sdb、trans 四类支撑能力。
