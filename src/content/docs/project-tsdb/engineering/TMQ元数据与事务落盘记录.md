---
title: "TMQ元数据与事务落盘记录"
description: "围绕 TMQ 的 sdb、row、trans 与对象落盘方式的技术记录"
---

## 时间线索

- 2023-11-14
- 2023-11-24

## 原始记录摘录

### [11.14]

流计算和订阅发布基于的接口系列是 `ssdb`，其 mnode 都基于数据结构 `SSdb` 中的函数方法，通过查验，包括 `insert`、`update`、`delete`
等五种类型。都是在 mnode 进行管理，但是其内部没有实际值。只有后续的几个是实际管理并且有效的。

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

例如 `vnodeProcessFetchMsg` 中的

```c++
case TDMT_VND_TMQ_CONSUME:
    return tqProcessPollReq(pVnode->pTq, pMsg);
```

挂载位置，并且保存那些信息。
Sdb 和 Row 层次两者必须要开发出。

[规则]req 和 msg 一律不使用 Arc 和 Mutex.

### [11.24]

目前需要一个 demo。
我们对于其还有部分疑问：

1. 消费者和消费组的关系；是否是通过 `vgId` 实现的；
2. 消费数据的过程，其消费的过程，tq 的部分参数；
3. 事务部分的内容，其就包含了最基础的过程；

目前查看了事务，对其结构有进一步的了解：

1. 首先，所有的结构都有一系列的方法，如下所示。其中，`SSdbTable` 为 `Sdb` 所携带的一系列方法，在事务执行时，调用这些方法。

```c++
int32_t mndInitTopic(SMnode *pMnode) {
SSdbTable table = {
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

2. 在事务执行时，主要是 `mndTransExecute` 函数中的 `TRN_STAGE_COMMIT_ACTION` 选项，执行 `mndTransPerformCommitActionStage`，
   最主要的是 `mndTransExecSingleAction` 执行，其内部有三种：
   1. `TRANS_ACTION_NULL = 0`，不执行，只做执行的标记，
   2. `TRANS_ACTION_MSG = 1`，将此 `STransAction` 作为 msg 发送到此 `STransAction` 的 `epSet` 所标志的位置；
   3. `TRANS_ACTION_RAW = 2`，调用的是 `sdbWriteWithoutFree`，对应多个操作如下：

```c++
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

所以，在执行的过程中，是有可能通过事务的执行，将 `STransAction` 中的 `pRaw` 写入到 `pSdb` 中的。这部分是一个事务。
但是，对于 `SMqTopicObj`，其 `insert` 函数是没有任何的东西的。
但是，对于该函数 `sdbWriteWithoutFree`，`sdbInsertRow` 中
`taosHashPut(hash, pRow->pObj, keySize, &pRow, sizeof(void *))`
已经将信息记录到了 `pSdb` 中。

## 记录结论

这一组记录回答的是“topic / subscribe / consumer 到底怎么落盘”：

1. mnode 通过 `SSdbTable` 和事务动作承接 topic 等对象；
2. 事务并不只是消息转发，也会把 `pRaw` 写入 `pSdb`；
3. `insertFp` 看起来空实现，不代表对象没有真正进入 sdb；
4. 这一层如果不先理清，后面的 subscribe / consume 开发会一直悬空。
