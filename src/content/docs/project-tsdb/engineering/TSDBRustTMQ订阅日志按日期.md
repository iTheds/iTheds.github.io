---
title: "TSDBRustTMQ订阅日志按日期"
description: "topic/consumer/subscribe/consume 与 TMQ 流程的日期日志(保留原始表达)"
---

# TSDB Rust TMQ Subscription Log By Date

> 说明:从 `tsdb_rust_technical_log_by_date_full.md` 按技术线拆分，按日期保留原始记录。

## [11.10] <a id="date-11-10"></a>

TMQ: Timing Message Queue

TSDB中：
昨天调试发现有三个系列函数：
一个是 vmworker.rs 中的， 消息流转函数， 其初始化在 NodeMsgFpWrapper 中。
一个是 类似 vm_propose_write_message 的， 处理一系列请求的函数， 由 worker 线程直接调用。
一个为主系列函数，专门处理并执行实际的操作。例如同文件中的 vnodeProcessWriteMsg 。

所以，首先响应， 然后流转到相关的执行者， 由指定的 worker 执行， 调用工作函数，处理一个或一批次函数，最后调用主系列函数进行执行。

开发路线：

1. 确定 topic 挂载位置；
2. 确定关键函数支持；投放到三个系列函数中；
    1. TDMT_MND_TMQ_CREATE_TOPIC
    2. TDMT_MND_TMQ_DROP_TOPIC
    3. TDMT_MND_TMQ_CONSUMER_LOST
    4. TDMT_MND_TMQ_CONSUMER_RECOVER
    5. TDMT_VND_TMQ_CONSUME
    6. TDMT_VND_TMQ_SUBSCRIBE
    7. TDMT_VND_TMQ_DELETE_SUB
    8. TDMT_VND_TMQ_COMMIT_OFFSET
3. 与底层接口交互；
4. 客户端能够响应；

事务是回调函数还是其他的呢？

[概念]添加方法也有不同的概念。
一个是 node 携带的 msgFp 响应系列函数。
一个是 vmworker 中直接写入到 worker 中的函数， 列如 mmStartWorker 中的 mmProcessRpcMsg。由 wokrer 中的 thread 直接调用。
一个是介于以上二者之间的，例如 mndProcessRpcMsg 。能够对多个或者几个工作流做出响应。

数据结构的布置， TDengine 的架构中， 采用了以下的数据结构分布：
先取出， SMnodeMgmt， 然后取出 SMnode， 在执行第一种函数时，锁定 node 如果必要。

所以根据此，开发路线为以下：

1. 开发关键的系列函数；
    1. topic 系列函数，及其衍生函数；
    2. consumer 系列函数，及其衍生函数；至此，认为已经能够做出 Demo 进行运行。
    3. tq 部分函数，及其衍生函数；
2. 挂载并且运行。

在开发 mnode 的时候，我将会新建立一套更加完善和规范的体系结构。

需不需要先开发一套架子呢。先不必要。

## [11.13] <a id="date-11-13"></a>

确定层次结构。
问题是目前的所有内容都建立在 vnode 上。如果之后有涉及到 mnode 的开发，移植不便。
改变功能结构为不同 node 的挂载参数。

TODO：

1. mndAcquireDb 中 DB 结构未存放，未对接；

其他可优化：

2. mndCreateTopic 中暂未有 user name 关键字，应对客户端请求包做统一要求保存请求源的用户信息，才能够构建该字段；

## [11.14] <a id="date-11-14"></a>

流计算和订阅发布基于的接口系列是 ssdb ，其 mnode 都基于数据结构 SSdb 中的函数方法，通过查验， 包括 insert、 update、 delete
等五种类型。都是在 mnode 进行管理， 但是其内部没有实际值。只有后续的几个是实际管理并且有效的。

```c++
SSdbTable table = {
    .sdbType = SDB_STB,
    .keyType = SDB_KEY_BINARY,
    .encodeFp = (SdbEncodeFp)mndStbActionEncode,
    .decodeFp = (SdbDecodeFp)mndStbActionDecode,
    .insertFp = (SdbInsertFp)mndStbActionInsert,
    .updateFp = (SdbUpdateFp)mndStbActionUpdate,
    .deleteFp = (SdbDeleteFp)mndStbActionDelete,
}
```

这是事务的一套方法。
那么对于子表等的插入是否也是基于此的？有待考证。

并且其是否在 vnode 上有同样一套内容，此也有待考证。
vnode 中是否调用的是 tq 中的内容。

例如 vnodeProcessFetchMsg 中的

```C++
case TDMT_VND_TMQ_CONSUME:
    return tqProcessPollReq(pVnode->pTq, pMsg);
```

挂载位置，并且保存那些信息。
Sdb 和 Row 层次两者必须要开发出。

但是今天时间不够调试，先编写 consumer 。
创建 consumer 只能通过客户端操作，所以，该部分先不表现。
主要是目前的一系列操作，需要使用统一格式。如果找不到，那么就重新开一个。

[规则]req 和 msg 一律不使用 Arc 和 Mutex.

## [11.24] <a id="date-11-24"></a>

目前需要一个 demo 。
我们对于其还有部分疑问：

1. 消费者和消费组的关系；是否是通过 vgId 实现的；
2. 消费数据的过程，其消费的过程，tq 的部分参数；
3. 事务部分的内容，其就包含了最基础的过程；

然后我们需要知道的框架如下：

Topic ：

Consumer：

Subscribe：

SdbUpdateFp updateFp = (SSdb*)pSdb->updateFps[type];

目前查看了事务，对其结构有进一步的了解：

1. 首先，所有的结构都有一系列的方法， 如下所示。其中， SSdbTable 为 Sdb 所携带的一系列方法， 在事务执行时，调用这些方法。
    ```C++
    int32_t mndInitTopic(SMnode *pMnode) {
    SSdbTable table = {// 
        .sdbType = SDB_TOPIC,
        .keyType = SDB_KEY_BINARY,
        .encodeFp = (SdbEncodeFp)mndTopicActionEncode,
        .decodeFp = (SdbDecodeFp)mndTopicActionDecode,
        .insertFp = (SdbInsertFp)mndTopicActionInsert,
        .updateFp = (SdbUpdateFp)mndTopicActionUpdate,
        .deleteFp = (SdbDeleteFp)mndTopicActionDelete,
    };

    mndSetMsgHandle(pMnode, TDMT_MND_TMQ_CREATE_TOPIC, mndProcessCreateTopicReq);
    mndSetMsgHandle(pMnode, TDMT_MND_TMQ_DROP_TOPIC, mndProcessDropTopicReq);
    mndSetMsgHandle(pMnode, TDMT_VND_TMQ_ADD_CHECKINFO_RSP, mndTransProcessRsp);
    mndSetMsgHandle(pMnode, TDMT_VND_TMQ_DEL_CHECKINFO_RSP, mndTransProcessRsp);

    mndAddShowRetrieveHandle(pMnode, TSDB_MGMT_TABLE_TOPICS, mndRetrieveTopic);
    mndAddShowFreeIterHandle(pMnode, TSDB_MGMT_TABLE_TOPICS, mndCancelGetNextTopic);

    return sdbSetTable(pMnode->pSdb, table);
    }
    ```
2. 在事务执行时，主要是 mndTransExecute 函数中的 TRN_STAGE_COMMIT_ACTION 选项， 执行 mndTransPerformCommitActionStage ，
   最主要的是 mndTransExecSingleAction 执行， 其内部有三种：
    1. TRANS_ACTION_NULL = 0, 不执行，只做执行的标记，
    2. TRANS_ACTION_MSG = 1, 将此 StransAction 作为 msg 发送到此 StransAction 的 epSet 所标志的位置；
    3. TRANS_ACTION_RAW = 2, 调用的是 sdbWriteWithoutFree ，对应多个操作如下：
         ```C++
         switch (pRaw->status) {
         case SDB_STATUS_CREATING:
             code = sdbInsertRow(pSdb, hash, pRaw, pRow, keySize);
             break;
         case SDB_STATUS_READY:
         case SDB_STATUS_DROPPING:
             code = sdbUpdateRow(pSdb, hash, pRaw, pRow, keySize);
             break;
         case SDB_STATUS_DROPPED:
             code = sdbDeleteRow(pSdb, hash, pRaw, pRow, keySize);
             break;
         }
         ```
   所以，在执行的过程中，是有可能通过事务的执行，将 STransAction 中的 pRaw 写入到 pSdb 中的。这部分是一个事务。
   但是，对于 SMqTopicObj ，其 insert 函数是没有任何的东西的。
   但是，对于该函数(sdbWriteWithoutFree)， sdbInsertRow 中 `taosHashPut(hash, pRow->pObj, keySize, &pRow, sizeof(void *))`
   已经将信息记录到了 pSdb 中。

## [12.1] <a id="date-12-1"></a>

今天开发消费内容，尽可能下午与 SQL 引擎对接。

STqOffsetStore 可能是消费位点提交。

其中，日志和消费位点有一个配合，需要共同开发的部分。

从主消费函数中衍生出整个流程 ， tqProcessPollReq 。
消费过程：
提出其消费者 id 时间和消费位点，找到 Tq handle 。
stq 是维护在 vnode 中的， tq handle 很可能是为单个可操作的内容， 其内部含有 wal ， 应该是为订阅发布所设计的。

这些都是单个节点的消费过程。

[优化]很多地方都有对不同的订阅结构(表、数据库、列)而分的 union ， 这部分应当使用同意的协定。

## [12.4] <a id="date-12-4"></a>

再回归一下tdegnine 数据订阅发布过程：
首先， mnode 的工作者接收 create topic 请求包， 生成相对的执行树(或执行计划)， 并且将 topic 记录到 sdb 。
~~然后发送到 vnode ， vnode 对 topic 和 执行树进行记录。该部分在 TDengine 中应该是生成了 task 进行存储。~~
在创建完成订阅之后，流任务才被创建，并且发送到 vnode 。

创建消费者的过程，该部分仍然比较模糊，其并没有创建 consumer 的过程，需要调试一下。不过，在本项目中，创建 consumer 时，可以在
mnode 中进行，并且发送到 vnode 中的 stq 存储。
流中有一个 mndScheduleStream ， 此为一个方向。

订阅过程，根据客户端订阅函数 tmq_subscribe 发现其构造了一个请求结构， SMsgSendInfo ，
其中， TDMT_MND_TMQ_SUBSCRIBE ， SMqSubscribeCbParam，
由 `mndSetMsgHandle(pMnode, TDMT_MND_TMQ_SUBSCRIBE, mndProcessSubscribeReq);` 指定函数 mndProcessSubscribeReq
进行处理，此处才是进行订阅的过程。然后更新指定的消费者。
所以订阅就是更新消费者的过程。

而根据 `mndSetMsgHandle(pMnode, TDMT_VND_TMQ_SUBSCRIBE_RSP, mndTransProcessRsp);`， 表明~~
我又在处理审批工作，然后忘记想到什么地方了，然后代码也没写，此刻只想发呆，就这么回事~~订阅的过程，实际就是执行该事务的过程。~~
然后没写几句就又开始弄审批工作啦，实在是太坤乐啦~~

但是其实际生效是在 mndProcessRebalanceReq 中。

SMqSubscribeObj 和 SMqTopicObj 有同 cgroup 下的 key 。
代表了 <topic, subscribe , consumer> 的关系。
创建订阅 subscribe 之后， 存储到 mnode sdb 中。

均衡操作 mndProcessRebalanceReq 调用， 这是一个应答 TDMT_MND_TMQ_DO_REBALANCE 的响应结构。
调用 mndSchedInitSubEp， 将 topic 中的 qplan 取出其子计划， 放到 SMqSubscribeObj->unassignedVgs 中的 qmsg，之后通过
mndDoRebalance ，发给相关的 vnode 。

//

在消费时， 根据 req 中的 key ，找到 handle ， 确定消费位点， 进行校验，之后取出消费位点的数据， ~~通过 task 执行~~，通过
然后将结果集返回，之后提交消费位点。

SMqDataRsp 应该是一个能适用于多线程，暂时存储结果集的结构。
STqPushEntry 是一个用于推数据的结构，存储应答消息体。其存储在 stq 中。

也就是说，在消费时，
如果是列订阅，
如果消费位点是 log 模式，创建一个 STqPushEntry， 添加到 stq->pPushMgr 中，之后结束消费过程。
如果不是 log 模式，发送，然后结束消费过程。其作为 TMQ_MSG_TYPE__POLL_RSP。
然后结束消费过程。
如果不是列订阅，
如果消费位点不是 TMQ_OFFSET__LOG log 模式， 那么，扫描位点数据，如果有数据，则发送，没有则设置消费位点，结束消费过程。
如果消费位点是 log 模式，那么，通过 tqFetchLog 扫描日志，获取数据后 tqSendTaosxRsp， 然后提交。

> 其模式有：
> TMQ_OFFSET__RESET_NONE = -3,
> TMQ_OFFSET__RESET_EARLIEAST = -2,
> TMQ_OFFSET__RESET_LATEST = -1,
> TMQ_OFFSET__LOG = 1,
> TMQ_OFFSET__SNAPSHOT_DATA = 2,
> TMQ_OFFSET__SNAPSHOT_META = 3,

[info]df scheame 是语义分析中产生的。
q schema 是公用的。

## [12.6] <a id="date-12-6"></a>

根据之前分析的 tdengine 数据订阅发布过程，构建本数据库的订阅发布最简单的过程：
创建 topic ：使用 sql 语句进行创建，mnode 的工作者接收 create topic 请求包， 生成一个相对的执行树(或执行计划)，存储到 topic
odj 中， 并且将 topic obj 记录到 sdb 。

创建消费者：使用客户端接口创建， mnode 接收到 创建消费者请求包， 存储到 sdb 中。

创建订阅 subscribe ： 使用客户端接口创建， mnode 接受到 订阅 CMSubscribeReq 请求包，更新消费者结构体，将生成的 subsrcibe
obj, 存储到 sdb 中，
将 topic 中的 执行计划 plan 一并发送到 vnode ，分配 STqPushEntry、STqHandle、SAlterCheckInfo、STqOffsetStore，

1. pPushEntry->subKey 与 handle 有 hash 关系。STqPushEntry 中有 SMqDataRsp ，用于存储并管理结果集。
2. STqOffsetStore 管理消费位点；

```C++
SHashObj* pPushMgr;    // consumerId -> STqPushEntry
SHashObj* pHandle;     // subKey -> STqHandle
SHashObj* pCheckInfo;  // topic -> SAlterCheckInfo
STqOffsetStore* pOffsetStore;
```

消费时：根据 req 中的 key ，找到 handle ， 确定消费位点， 进行校验，之后取出消费位点的数据，使用执行树进行执行，输出结果集到指定的
pPushMgr 中。
然后将结果集返回，之后提交消费位点。

## [12.7] <a id="date-12-7"></a>

本周就剩下两天了，又是天天有流程工作。

接下来可能就是说，需要将之前的接口进行完善，然后开发一部分新的接口。
选一个比较实际的事项进行完成。

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
2. wal ：
    1. [ ] 写入 wal
    2. [ ] 读出指定位置的 wal
    3. [ ] 批量读出
3. sdb 系列函数怎么写
4. trans 部分怎么处理

消费过程，依赖的东西太多。

Tdengine 中 sdb 所存储的 <key,value> ， value 存储的是指针， key 则是 obj ，但 obj 可以 decode 为 原数据。

rpc 中传递什么，传递的有两种，动作包和元数据包，元数据包附带动作，那么就形成了一个动作包。

## [12.10] <a id="date-12-10"></a>

之后的开发只有三个部分:

1. 创建订阅
2. vnode 的操作方法, 其主要是
    1. 接收到 subscribe 之后的部署操作 psvr_process_deploy_subscribe_task
3. 消费的流程

`TD_DEF_MSG_TYPE(TDMT_VND_TMQ_SUBSCRIBE, "vnode-tmq-subscribe", SMqRebVgReq, SMqRebVgRsp)`，
忽略了一个订阅的过程 tqProcessSubscribeReq ， 在此处， 订阅的时候创建了算子 qCreateQueueExecTaskInfo ，

## [2024.1.2] <a id="date-2024-1-2"></a>

新的一年。

可以边进行设计。

tqProcessSubscribeReq 。

关于 STqHandle ， 其实我不想光是抄写 stqreader 等相关组件。

然后关于 exec 组件， 如何调用 sql 引擎的接口， 需要那些接口也比较关键。

STqHandle 中有 SWalReader， 其是 wal 。

SWalCkHead 为读取出的内容， 其有 SWalCont， SWalCont 有 body ， body 为读取出的内容。

wal 中读出的 SWalCkHead 可能其 type 是 TDMT_VND_SUBMIT ， 这说明了什么？？？

Vnode 中有一个 SWal ， 每次需要读取时， 先根据此生成一个 STqReader。
STqReader 中有一个 SWalReader ， 其内部存储了一个 SWalCkHead，

在 STqReader 中有一个 SSubmitMsgIter ， 该结构体的作用？？？

tq 即任务队列。
在任务队列中需要实现那些内容？？

## [1.5] <a id="date-1-5"></a>

目前得到的都是大概的内容.

执行模块, 需要那些参数传递, 又如何执行,
推送模块, 怎么确定目的地,
读取模块, 如何从 wal 中获得数据, 获得的是日志中的数据, 还是数据库存入的缓存, 即得到的格式是怎么样的, wal 是否已经挂载在数据库中了.

TDengine 中没有找到关于将 执行算子传递的内容, 而且这部分, 只需要对接即可.
我需要知道执行引擎中的内容:

1. 执行模块主要的系列方法,
2. 如何构建一个执行树, 或者说可以用于执行 sql 语句的内容, 或者说能够根据 sql 生成的功能组件,
3. 需要保留那些结构, 是否可复用,
4. 如何获取结果,

执行后的结果是否为直接发送出去.

然后我们再看, 结合数据订阅中的 消费者\主题 topic \ 订阅 .
通过 act 订阅, 建立消费者和 topic 之间的联系. 主要通过渲染 `STqHandle` 完成.
一个 `STqHandle` 与一个 订阅 相关联.

但是 TDengine 中的订阅过程 `tqProcessSubscribeReq` , consumer 和 订阅似乎并没有产生联系的过程 .
服务端接受到的请求时, 便已经生成了一个 subkey, 该请求通过 `mndBuildSubChangeReq` 进行创建, 最根本是 reblance 函数中
SMqRebOutputObj 的 key 相同, 由 topic 和 cgroup 共同组成.
在订阅过程中, 如果是新的订阅(指的是针对 cgroup 和 topic 之间的关系), 那么生成一个 `STqHandle` ,
根据不同的订阅类型进行不同的操作:

1. column , 创建算子, 并且将执行算子放入到 `STqExecHandle` 中 ; 在这个过程中, 通过 `STQ` 的上层 vnode 的 meta 作为入参生成一个
   `SReadHandle` , 也一并用于生成执行算子的入参;
    1. 但是, 执行算子中的读取组件, 使用是 从该算子链 中拿出(type = QUERY_NODE_PHYSICAL_PLAN_STREAM_SCAN)
       `SStreamScanInfo`, 从其中取出 `STqReader` , 放入到 `STqExecHandle` 中.
2. db , 如果是订阅的数据库, 那么 wal 挂载 , 然后, 打开 `tqOpenReader` `STqReader` 放到 `STqExecHandle` 中 , 之后,
   `buildSnapContext` `SSnapContext` 创建一个上下文, 该上下文中包含了 meta 等其他状态信息 ,
    1. 然后, 也生成了一个执行算子,该算子的生成 , 入参只有 `SReadHandle` ,
3. table , 表的大致流程与库一样 ,

构建完成 `STqHandle` 之后, 存放到 STQ 中的 list<STqHandle> 中.

但是推送的过程如何构建呢,
查看 TDengine 代码发现,  `STqHandle` 中的 `STqPushHandle` 并没有被使用到, 在 push 中, 直接使用的是 `tqPushMsg` ,
其直接使用 `STQ` 中的 list<STqPushEntry>, 对其进行迭代, 然后执行 task , 并且将数据放入到 `SMqDataRsp` 中, 然后调用
`tqPushDataRsp` 发送 `STqPushEntry` 中的数据.
之后删除这些 STqPushEntry , 是否代表者其只是一次性的???
tqProcessSubmitReq 在 tqPushMsg 中调用，而且该函数只在 vnodeProcessWriteMsg 作为写入后的统一回应， 表明该接口是在写入后对数据的一种提交。
而其遍历的是 STqPushEntry ， 表明其将数据放入了推送部分。

但是看其创建的地方, 在 `tqProcessPollReq` 中, 这其实是一个消费函数,
其在消费时, 先获取到创建完成的 STqHandle ,然后 校验和调整 offset 消费位点,
如果是列订阅, 那么执行 tqScanData , 这个接口内调用了算子进行了计算.
发送时, 如果没有 STqPushEntry 则进行创建.

ok , 那么之后就简单了.
我们根据 TDengine 的内容来设计我们自己的 任务队列 , 结合 rust 语言特性.

任务队列 仍然由挂载在 psvr 的 STQ 负责, 其持有一个 TqHandle , 来专门负责具有同等模型的任务.
TqHandle 分为 推送\执行\读取 三部分.

Exec 中, 应当持有 执行部分内容:
我需要知道执行引擎中的内容:

1. ~~执行模块主要的系列方法~~
2. 如何构建一个执行树, 或者说可以用于执行 sql 语句的内容, 或者说能够根据 sql 生成的功能组件 ,
    1. 客户端根据 sql 语句创建语法树, 进行语义分析, 逻辑优化, 生成的*执行计划*发送给服务端, 拿到之后就可以运行;
    2. 通过切换输入源, ExecutionPlan:: , e.g stream<518> , tq<390> transfrom , 具体用法可参照 push_down_projection<414>
       replace_cols_by_name ,
    3. 传递逻辑计划, StatementPlan ,
    4. 执行计划, create_physical_plan , 传入的逻辑计划通过方法 create_physical_plan 生成执行计划 ,
    5. 其他-创建算子， e.g stream <320>
3. 需要保留那些结构, 是否可复用,
4. 如何获取结果,
    1. 结果集, `RecordBatch`

推送部分:

1. 保留通信信道,

读取部分:

1. 支持通过 wal 读取,
2. 支持通过 Queue 构建队列来进行读取.

## [1.9] <a id="date-1-9"></a>

具体构建如下:
任务队列与订阅发布:
任务队列负责将 sql 引擎的算子进行推送和管理, 面向的是整个分布式架构, 支持节点到节点之间\主机到主机之间的传递,
订阅发布以消费组为单位, 每次创建消费者的时候, 将建立一个消费组, 允许消费者加入消费组, 进而共享消费进度.
消费组和订阅构建关系.
在创建订阅的时候, 渲染出 exec 执行模块, 在订阅过程中 ,完成 读取算子 和 推送算子 的构建 , 消费时, 执行算子即可.

TDengine 中执行的过程都是固定的， 是否表明执行算子其实是固定的某些呢。

```rust
// 通过 handle ，取出算子

// 取出相应的数据内容， 进行计算，放入结果集中

todo!();
// SMqDataRsp
// tqScanData

// 位点提交

// tqSendDataRsp
```

目前， 概念设计已经完成， 开始写代码。

关键是有三种处理方式.
主要是执行.

主要流程:

1. 创建 topic ; cmngrCreateTopic(CMCreateTopicReq)
2. 创建 consumer; cmngrProcessCreateC哦nsumerReq
3. 创建 subscribe; cmngrProcessSubscribeReq(TDMT_MND_TMQ_SUBSCRIBE) tqProcessSubscribeReq(TDMT_VND_TMQ_SUBSCRIBE)
4. 插入数据的挂载;
5. 消费函数; tq_process_consume_req

TDengine 中， 订阅消息 `TDMT_MND_TMQ_SUBSCRIBE` 先由 mnode 进行处理， 只针对消费者进行操作。
然后由 mnode 定时器 `mndThreadFp` 触发 `mndProcessRebalanceReq(TDMT_MND_TMQ_DO_REBALANCE)` 由 `mnode` 处理，在此过程中生成
`(SMqSubscribeObj)mndCreateSub`， 并且调用 mndPersistRebResult - > mndPersistSubChangeVgReq 事务转消息
`tqProcessSubscribeReq(TDMT_VND_TMQ_SUBSCRIBE)` ， 渲染出任务队列的组件。供消费使用。

现阶段先不实现 rebalance ， 在 cmngrProcessSubscribeReq 中直接记录， 然后送达到 vnode 进行部署。

Epset 是指的 ？？？

## [1.15] <a id="date-1-15"></a>

推送有两种模式， 单独推送和统一推送。
在本系统中采取单独推送的方式。

这三个组件之间的关系是， 如果是：执行模块需要推送和读入模块作为初始化。算子运行时，从读取模块读入定量数据，送达推送模块，
然后推送模块在 `tqPushMsg` 中推送。这是统一推送。
单独推送可以是运算完成后直接推送。

根据算子替换来说，可能需要更换一个输入源。
需要自定义输入源来实现。

1. inset 中， 使用的是 push_msg
2. 输入算子的执行结果是，生成一个结构， 能够通过 poll_next 取出数据
3. 拿到输出的过程

订阅发布有两种模式：

1. 使用 wal ；
2. 使用 stream task 的同等 queue

读取和写入是相对的, 读取的内容执行后得到输出.

推送组件也可以是一个算子, 执行完成时, 直接使用推送组件进行推送, 但这样的话就是即时推送的模式.
但是只要控制执行的过程, 即调用消费的时候才将数据推送.

输出结构是什么.

rpc_create_topic 进行数据输出 , 使用结构 RpcSenderRsp 进行 send ,该结构可以 clone .

构建算子，其中的输出是 RecordBatch。

get_result() 中有其返回的结果用法。如果是使用该方法，那么就不需要更换输出。

新功能增加：

1. proto 文件中定义 msg 和接口， grpc 下执行 `cargo build`。
2. 在 grpc_define 中编写该接口。

之后是渲染

编写完成了。
之后就是测试和优化了。然后补全一下文档

## [1.17] <a id="date-1-17"></a>

目前主要是如何将插入的内容给放入到 queue 中。
感觉上 TDengine 中并没有将 stq->meta 作为订阅发布的需求结构。
也并没有使用到 stream task。

再看 wal 的方向是否可行。 之前探究过 wal 的 read 倒是比较全面， 但是 write 中， `walWrite` 接口将其完全去除，也没有影响。
也就是没有找到 wal 的写入挂载地区。

那我可以通过一个暂时的策略来完成这件事。明两天的时候完善文档和编写分布式数据库。
后续再优化这个地方。

客户端新增支持：

1. 创建 consumer; cmngrProcessCreateConsumerReq(CreateConsumer)
    1. CREATE CONSUMER consumer_name;
2. 创建 subscribe; cmngrProcessSubscribeReq(TDMT_MND_TMQ_SUBSCRIBE CMSubscribeReq) tqProcessSubscribeReq(
   TDMT_VND_TMQ_SUBSCRIBE MqRebVgReq)
    1. create SUBSCRIBE consumer_name TOPICS (topic_name1, topic_name2);
3. 消费函数; tq_process_consume_req(SMqPollReq)
    1. CONSUME POLL;

流程：

1. 确定各个的 msg；
2. 开发这些的同 `rpc_create_topic` 系列方法；
3. 确定其语句；

process_query_msg(

String::from_utf8(cgroup.clone()

本数据库有一些原则：

1. 所有的动作，都通过请求包和回应包来进行，是面向请求包的，请求包也代表了维护的元数据；需要考量的是，对于客户端过来的结构，客户端方面是否能够获取到相关的数据内容；

功能流程：

1. 定义功能；
2. 设计 msg ；
3. 确定 sql 语句语法；
4. 开发接口；
5. 或者上述流程反之；

consume all process, start test, by iTheds

## [10.1] <a id="date-10-1"></a>

生成 topic 保存到 cmngr 的 sdb。

订阅过程:
TDMT_PSVR_TMQ_SUBSCRIBE:MqRebVgReq - cmngrProcessSubscribeReq
订阅的过程必然是消费者创建,其对某个 topic 进行订阅.
然后该消费者能够通过接口进行消费。
确定 topic 之后， 形成订阅， 将 订阅插入到 p_sdb 。
将订阅发送到 psvr 中， 进行部署。

客户端新增支持：

1. 创建 consumer; cmngrProcessCreateConsumerReq(CreateConsumer)
    1. CREATE CONSUMER consumer_name;
2. 创建 subscribe; cmngrProcessSubscribeReq(TDMT_MND_TMQ_SUBSCRIBE CMSubscribeReq) tqProcessSubscribeReq(
   TDMT_VND_TMQ_SUBSCRIBE MqRebVgReq)
    1. create SUBSCRIBE consumer_name TOPICS (topic_name1, topic_name2);
3. 消费函数; tq_process_consume_req(SMqPollReq)
    1. CONSUME POLL;

只能通过自己的理解然后实现一个简单的了。
首先三大函数，先对服务端进行支持。
创建 topic ，将其保存到 cmngr sdb 中。传递给 psvr 。
创建消费者， cmngrProcessCreateConsumerReq,
订阅 subscribe ， cmngrProcessSubscribeReq ,

客户端维护什么很重要吗。
客户端发送一个 topic 的 name ，就能够把结果集拿到不就行了吗。不需要消费者，不需要订阅。
就两个东西，创建 topic ， 消费数据(tq_process_consume_req)。

消费的时候就取出 tq, 采用 tq 的执行模块 exec_handle 进行执行。
那么 tq 是什么时候创建的。 STqHandle 就是订阅发布的执行者。 StreamQueue 中读取数据。
消费者有还是必要的。

所以接下来针对以下操作进行完善：

```
TDMT_CREATE_TOPIC = 13,

TDMT_PSVR_TMQ_COMMIT_OFFSET = 25,    // 提交消费位点
TDMT_PSVR_TMQ_SUBSCRIBE = 26,        // 订阅操作
TDMT_PSVR_TMQ_DELETE_SUB = 27,       // 删除订阅
TDMT_PSVR_TMQ_CONSUME = 28,          // 消费数据

TDMT_CMNGR_TMQ_SUBSCRIBE = 39,
```

还有创建 consumer(cmngrProcessCreateConsumerReq)。

1. 开发 TDMT_CMNGR_TMQ_CREATE_CONSUMER ， 根据 TDMT_CREATE_TOPIC
2. TDMT_CMNGR_TMQ_SUBSCRIBE ,
3. 更换 consumer 主键为 consumer_name;
4. new_queue 补充实现;
5. build_subscribe 补充实现;
6. 实现 TDMT_PSVR_TMQ_CONSUME。

以上都是流程。
之后是关于算子布置的的：

DmlPlan
TDMT_PSVR_SUBMIT
tq_subscribe_record - 参照 process_submit_req

没有查到数据，队列未输入数据。或者说，两个队列不一样。
那么就是部署的时候的问题。queue 都没有初始化。
算子链执行到一半的时候，就进行返回了。

测试语句：

```sql
create
database test1;
use
test1;
create table table1
(
    ts timestamp,
    u1 int,
    u2 int
);

use
test1;

create
topic topic1 AS
select *
from table1
WHERE u1 > 25;
create
topic topic1 AS
select *
from table1;
create
consumer constest1;
create
subscribe constest1 TOPICS (topic1);

INSERT INTO table1 (ts, u1, u2)
VALUES (NOW, 10, 30);
INSERT INTO table1 (ts, u1, u2)
VALUES (NOW, 20, 40);
INSERT INTO table1 (ts, u1, u2)
VALUES (NOW, 15, 35);
INSERT INTO table1 (ts, u1, u2)
VALUES (NOW, 25, 45);
INSERT INTO table1 (ts, u1, u2)
VALUES (NOW, 30, 50);
INSERT INTO table1 (ts, u1, u2)
VALUES (NOW, 40, 60);
INSERT INTO table1 (ts, u1, u2)
VALUES (NOW, 50, 70);
INSERT INTO table1 (ts, u1, u2)
VALUES (NOW, 60, 80);

consume
poll constest1;

use
test1;
consume
poll constest1;

select *
from table1;

create
topic topic1 AS
select *
from table1;
```
