---
title: "STqHandle与任务队列设计记录"
description: "围绕 STqHandle、wal 读取、执行算子与推送组件的任务队列设计记录"
---

## 时间线索

- 2024-01-02
- 2024-01-05
- 2024-01-09
- 2024-01-15

## 原始记录摘录

### [2024.1.2]

`tqProcessSubscribeReq`。

关于 `STqHandle`，其实我不想光是抄写 `stqreader` 等相关组件。

然后关于 exec 组件，如何调用 sql 引擎的接口，需要那些接口也比较关键。

`STqHandle` 中有 `SWalReader`，其是 wal。

`SWalCkHead` 为读取出的内容，其有 `SWalCont`，`SWalCont` 有 `body`，`body` 为读取出的内容。

wal 中读出的 `SWalCkHead` 可能其 `type` 是 `TDMT_VND_SUBMIT`，这说明了什么？？？

Vnode 中有一个 `SWal`，每次需要读取时，先根据此生成一个 `STqReader`。
`STqReader` 中有一个 `SWalReader`，其内部存储了一个 `SWalCkHead`。

在 `STqReader` 中有一个 `SSubmitMsgIter`，该结构体的作用？？？

### [1.5]

目前得到的都是大概的内容。

执行模块，需要那些参数传递，又如何执行，
推送模块，怎么确定目的地，
读取模块，如何从 wal 中获得数据，获得的是日志中的数据，还是数据库存入的缓存，即得到的格式是怎么样的，wal 是否已经挂载在数据库中了。

通过 act 订阅，建立消费者和 topic 之间的联系。主要通过渲染 `STqHandle` 完成。
一个 `STqHandle` 与一个订阅相关联。

在订阅过程中，如果是新的订阅（指的是针对 `cgroup` 和 `topic` 之间的关系），那么生成一个 `STqHandle`，
根据不同的订阅类型进行不同的操作：

1. column，创建算子，并且将执行算子放入到 `STqExecHandle` 中；在这个过程中，通过 `STQ` 的上层 vnode 的 meta 作为入参生成一个
   `SReadHandle`，也一并用于生成执行算子的入参；
2. db，如果是订阅的数据库，那么 wal 挂载，然后打开 `tqOpenReader`，`STqReader` 放到 `STqExecHandle` 中，之后，
   `buildSnapContext`、`SSnapContext` 创建一个上下文，该上下文中包含了 meta 等其他状态信息；
3. table，表的大致流程与库一样。

构建完成 `STqHandle` 之后，存放到 `STQ` 中的 `list<STqHandle>` 中。

但是推送的过程如何构建呢，
查看 TDengine 代码发现，`STqHandle` 中的 `STqPushHandle` 并没有被使用到，在 push 中，直接使用的是 `tqPushMsg`，
其直接使用 `STQ` 中的 `list<STqPushEntry>`，对其进行迭代，然后执行 task，并且将数据放入到 `SMqDataRsp` 中，然后调用
`tqPushDataRsp` 发送 `STqPushEntry` 中的数据。

但是看其创建的地方，在 `tqProcessPollReq` 中，这其实是一个消费函数，
其在消费时，先获取到创建完成的 `STqHandle`，然后校验和调整 offset 消费位点，
如果是列订阅，那么执行 `tqScanData`，这个接口内调用了算子进行了计算。
发送时，如果没有 `STqPushEntry` 则进行创建。

### [1.9]

任务队列与订阅发布：
任务队列负责将 sql 引擎的算子进行推送和管理，面向的是整个分布式架构，支持节点到节点之间、主机到主机之间的传递，
订阅发布以消费组为单位，每次创建消费者的时候，将建立一个消费组，允许消费者加入消费组，进而共享消费进度。
消费组和订阅构建关系。
在创建订阅的时候，渲染出 exec 执行模块，在订阅过程中，完成读取算子和推送算子的构建，消费时，执行算子即可。

现阶段先不实现 rebalance，在 `cmngrProcessSubscribeReq` 中直接记录，然后送达到 vnode 进行部署。

### [1.15]

推送有两种模式，单独推送和统一推送。
在本系统中采取单独推送的方式。

这三个组件之间的关系是，如果是：执行模块需要推送和读入模块作为初始化。算子运行时，从读取模块读入定量数据，送达推送模块，
然后推送模块在 `tqPushMsg` 中推送。这是统一推送。
单独推送可以是运算完成后直接推送。

订阅发布有两种模式：

1. 使用 wal；
2. 使用 stream task 的同等 queue。

读取和写入是相对的，读取的内容执行后得到输出。

推送组件也可以是一个算子，执行完成时，直接使用推送组件进行推送，但这样的话就是即时推送的模式。
但是只要控制执行的过程，即调用消费的时候才将数据推送。

构建算子，其中的输出是 `RecordBatch`。

## 记录结论

这组记录把 `STqHandle` 的职责逐步收敛清楚了：

1. 一个 `STqHandle` 对应一个订阅；
2. handle 里至少要闭合读取、执行、推送三段；
3. 读取侧既可能来自 wal，也可能来自 queue；
4. 执行侧最终产出 `RecordBatch`；
5. 推送侧既可以统一推送，也可以单独推送，而当前实现倾向单独推送。
