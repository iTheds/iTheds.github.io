---
title: "TMQ消息流转与节点挂载记录"
description: "围绕 TMQ 在 worker、mnode、vnode 之间的消息流转与节点挂载的技术记录"
---

## 时间线索

- 2023-11-10
- 2023-11-13

## 原始记录摘录

### [11.10]

TMQ: Timing Message Queue

TSDB中：
昨天调试发现有三个系列函数：
一个是 `vmworker.rs` 中的，消息流转函数，其初始化在 `NodeMsgFpWrapper` 中。
一个是类似 `vm_propose_write_message` 的，处理一系列请求的函数，由 worker 线程直接调用。
一个为主系列函数，专门处理并执行实际的操作。例如同文件中的 `vnodeProcessWriteMsg`。

所以，首先响应，然后流转到相关的执行者，由指定的 worker 执行，调用工作函数，处理一个或一批次函数，最后调用主系列函数进行执行。

开发路线：

1. 确定 topic 挂载位置；
2. 确定关键函数支持；投放到三个系列函数中；
   1. `TDMT_MND_TMQ_CREATE_TOPIC`
   2. `TDMT_MND_TMQ_DROP_TOPIC`
   3. `TDMT_MND_TMQ_CONSUMER_LOST`
   4. `TDMT_MND_TMQ_CONSUMER_RECOVER`
   5. `TDMT_VND_TMQ_CONSUME`
   6. `TDMT_VND_TMQ_SUBSCRIBE`
   7. `TDMT_VND_TMQ_DELETE_SUB`
   8. `TDMT_VND_TMQ_COMMIT_OFFSET`
3. 与底层接口交互；
4. 客户端能够响应；

[概念]添加方法也有不同的概念。
一个是 node 携带的 msgFp 响应系列函数。
一个是 vmworker 中直接写入到 worker 中的函数，例如 `mmStartWorker` 中的 `mmProcessRpcMsg`，由 worker 中的 thread 直接调用。
一个是介于以上二者之间的，例如 `mndProcessRpcMsg`，能够对多个或者几个工作流做出响应。

数据结构的布置，TDengine 的架构中，采用了以下的数据结构分布：
先取出 `SMnodeMgmt`，然后取出 `SMnode`，在执行第一种函数时，锁定 node 如果必要。

所以根据此，开发路线为以下：

1. 开发关键的系列函数；
   1. topic 系列函数，及其衍生函数；
   2. consumer 系列函数，及其衍生函数；至此，认为已经能够做出 Demo 进行运行。
   3. tq 部分函数，及其衍生函数；
2. 挂载并且运行。

### [11.13]

确定层次结构。
问题是目前的所有内容都建立在 vnode 上。如果之后有涉及到 mnode 的开发，移植不便。
改变功能结构为不同 node 的挂载参数。

TODO：

1. `mndAcquireDb` 中 DB 结构未存放，未对接；

其他可优化：

1. `mndCreateTopic` 中暂未有 `user name` 关键字，应对客户端请求包做统一要求保存请求源的用户信息，才能够构建该字段。

## 记录结论

这一阶段的重点不是消费逻辑本身，而是把 TMQ 放到整个节点分工里：

1. 消息先响应，再流转到 worker，再进入真正执行函数；
2. 功能不能只挂在 vnode 上，否则后续 mnode 迁移会非常被动；
3. topic、consumer、consume、commit offset 等动作都需要提前分配清楚挂载位置。
