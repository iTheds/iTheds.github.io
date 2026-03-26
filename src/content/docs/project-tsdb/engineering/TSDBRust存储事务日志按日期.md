---
title: "TSDBRust存储事务日志按日期"
description: "WAL、SDB、事务与元数据存储的日期日志（保留原始表达）"
---

# TSDB Rust Storage Transaction Log By Date

> 说明：从 `tsdb_rust_technical_log_by_date_full.md` 按技术线拆分，按日期保留原始记录。

## [5.26] <a id="date-5-26"></a>

1. 阅读 transport ;

## [6.26] <a id="date-6-26"></a>

- [X] tqPushMsg
- [] tqStartStreamTasks - tqProcessSubmitReq
- [X] tqProcessTaskRunReq
<!-- tqStreamTasksScanWal -->

## [10.8] <a id="date-10-8"></a>

几个月未有记录，实际上，一直都没有时间进行开发，组内风气目前是，如果没有在写文档，那么就是很闲；我不明白，写文档确实是工作内容，但是开发却像是一个奢侈的东西，在做这件事的时候，好像是很闲的表现。很搞笑的是，就这样的进度，还要对标TDengine。

根据 mnode 最后的状态，编写其内容。
先确定整个流程，对其进行考察。

dm_open_nodes() 中， 匹配了 wrappers ， 并且进行 open ， 调用的是 node_open_fp, 其中，方法阵列的载入

GLOBAL_DNODE 中调用了 dm_init_dnode， 其中最接近的节点。

其中 build_wrappers() 中，载入了所有的节点，分配到 dnode 中，那么 dnode 所跟随的节点数量就进行了限制。
dnode.trans.msg_handles 中存储了大量的操作内容。

其中 MgmtWrapper 中存储的是以 VnodeMgmt 为先导的内容。
其存储的 vnode 为 VnodeMgmt 。在 dm_open_node 中 对 wrapper 进行了重新的声明和分配。

以下是 vnode 在 rust 中的内容体现：

VnodeMgmtPointer
    |____VnodeMgmt
            |____VnodeObjPointer
                    |____VnodeObj
                            |____VnodePointer
                                    |____Vnode

实际上就三个，我们先根据现有的内容对 Mnode 系列进行构建，然后根据 rust 进行调整其结构，最后运行。完成其既定功能。

vnode 的功能：
1. 功能：虚拟节点，拥有最基本的功能；
2. 系列接口：

mnode 功能：
1. 功能：管理节点；
2. 系列接口：

## [10.12] <a id="date-10-12"></a>

数据订阅过程：
定义 topic
基于一个已经存在的超级表、子表或普通表的查询条件，即一个 SELECT 语句(使用 SQL 对标签、表名、列、表达式等条件进行过滤，以及对数据进行标量函数与 UDF 计算（不包括数据聚合）)
消费者订阅 topic 后，可以实时获得最新的数据
多个消费者可以组成一个消费者组 (consumer group), 一个消费者组里的多个消费者共享消费进度。但不同消费者组中的消费者即使消费同一个 topic, 并不共享消费进度。
一个消费者可以订阅多个 topic。

依赖 TDengine 的消息队列提供了消息的 ACK 机制，在宕机、重启等复杂环境下确保 at least once 消费。

TDengine 会为 WAL (Write-Ahead-Log) 文件自动创建索引以支持快速随机访问。对于以 topic 形式创建的查询，TDengine 将对接 WAL 而不是 TSDB 作为其存储引擎。在消费时，TDengine 根据当前消
费进度从 WAL 直接读取数据，并使用统一的查询引擎实现过滤、变换等操作，将数据推送给消费者。

程序流程：
就分析而言，其有线程性质。

{int32_t (SRpcMsg *)} 0x555555618d15 <mndProcessCreateTopicReq>

数据订阅分为订阅表和订阅列，需要指定一个 sql 语句。(其实还有一个订阅 整个数据库的方式，但是 TDengine 中暂存了该方式，并未开发 ，3.0。)
在创建时，根据此，如果是订阅表，那么就将 SStbObj 放入到 SMqTopicObj；如果是订阅列，那么需要生成一个 SQueryPlan 序列化到 SMqTopicObj 中。
之后，开启事务，将 SMqTopicObj 的原生数据作为提交。

所以这一系列的函数都在 mndTopic.c 中。

## [10.19] <a id="date-10-19"></a>

关键词：
ntb
ctb ： 
stb ： 超级表
sdb ： 实现了一个保存表、流元信息的结构，在 mnode 中保存

## [11.09] <a id="date-11-09"></a>

订阅发布架子：
topic.rs - 400
WAL/mod.rs - 50
db.rs - 30
trans.rs - 50

tmsgdef.rs - 180

rps 内容：
dispatch.rs - 500
push.rs - 30

mnode 架子：
mmint.rs - 50

可投入使用的：

vnode 相关：
vnode_svr.rs - 390

worker相关：
vmworker.rs - 360

基础组件相关：
enumtype.rs - 50
queue.rs - 610
tzerror/mod.rs - 240
worker/mod.rs - 550
shmem/mod.rs - 270
sleep/mod.rs - 20

十分的搞笑，感觉没写多少代码。
这一年来就没有以开发为重心。
计算机行业是以实践为基础的。不实践，怎么能知道是怎么回事？不应该先想好，而应该先积累足够的实践内容。

整个架构还不是很了解。

首先分为多个 node ， vnode 、 mnode 、snode 等。每个节点的职能序列如何确定。
node 中， 比如 vnode ，其中是否还有 vnode_mgmt 是做何用处。

记不住，记不住。

## [11.22] <a id="date-11-22"></a>

问题的关键是,和存储以及 SQLengine 进行对接.

订阅发布最基本的模型。

重新梳理一下结构。

TDengine 中 SSdb 和 SDbObj ，

STDB 元数据存储引擎 ，对应到 rust - Meta.Tdb

## [11.29] <a id="date-11-29"></a>

之前通过事务，已经对整个体系明了了大半。

## [1.4] <a id="date-1-4"></a>

qStreamPrepareScan 确实是执行计划的内容， 但是我需要知道的是， 其产生了如何的效果。

看的差不多了，先开始设计。
tq 本质上是任务队列， 不是对什么存储的封装，具体是将算子进行流转和执行的过程。
在这个过程中， 主要部署了以下内容：
1. 算子的流向位置， 这部分主要依赖于 rpc 的信息管道， 里面有需要流转的地址；

其主要实现通过 vnode 中的 stq 实现， 将整个过程的直接对象分为三个 ： 执行、读取、推送。
所以，每个部分都包含了其他的模块，耦合度十分之高。
但是大体上，我们可以剥离开， 读取 主要和 wal 进行绑定， 执行绑定的是 执行算子， 推送所绑定的是 通讯的地址， 即 msg 发送到那个部分。
封装的目的是为了能够携带相关信息的目标位置。

在 TDengine 中， 具体是通过 STQ 实现。其持有 list<STqPushEntry> 和 list<STqHandle> , 
而一个 `STqHandle` 就是一个完整的结构。其持有 `STqPushHandle` , `STqExecHandle` , wal 伴生结构 <SWalReader,SWalRef> , 

但是问题是, 流转过程中, 如何传递, 传递到什么地方, 在什么粒度决定.
其执行是整个算子链都执行完成, 还是执行链中的部分算子可以传递到其他地方执行.

再看 tsdb , 按理来说, 如果要使用算子的方式, 那么不应该只是流式计算来使用, 普通的建表过程也应该使用算子的方式.
那么我们再来思考关于两者统一的问题.

## [1.12] <a id="date-1-12"></a>

wal 挂载还需要考虑。

## [1.23] <a id="date-1-23"></a>

测试 topic ，进行运行。


query_parser::Parser::parse_sql


let statement =
    query_parser::Parser::parse_sql(&sql).map_err(|e| anyhow::anyhow!("{e:?}"))?;

let mut catalog_req = CatalogReq::default();
statement.collect(self.get_current_database_name(), &mut catalog_req);

let meta_data = Catalog::default()
    .ctg_get_all_meta(&catalog_req, addr,self.get_current_database_id())
    .await?;
//println!("respose MetaData ={meta_data:?}");//lsd

let logic_plan = Translate::new(&meta_data,self.get_current_database_id(),self.get_current_database_name().clone())
    .sql_statement_to_plan(statement)
    .map_err(|e| anyhow::anyhow!("{e:?}"))?;

MetaData


        let res = CtgGetDbCfgRsp {
            num_of_vgroups: 0,
            num_of_stables: 0,
            buffer: 0,
            cache_size: 0,
            page_size: 0,
            pages: 0,
            days_per_file: 0,
            days_to_keep0: 0,
            days_to_keep1: 0,
            days_to_keep2: 0,
            min_rows: 0,
            max_rows: 0,
            wal_fsync_period: 0,
            wal_level: 0,
            precision: 0,
            compression: 0,
            replication: 0,
            strict: 0,
            cache_last: 0,
            nums_of_retensions: 0,
            schemaless: 0,
            sst_trigger: 0,
        };


TDMT_CMNGR_USE_DB


                        let use_db_rsp = CtgUseDbRsp {
                            db_name: usedb_req.db_name.clone(),
                            db_id: -1,
                            num_of_table: 0,
                            state_ts: 0,
                            err_code: 0,
                        };


一个 db 一个 node 。

CreateMetricPlan

## [1.29] <a id="date-1-29"></a>

sdb 这样的存储结构可以实现 iterator 。

我如何得知会数据会发向何处？？？

需要画的几张图：
1. 系统消息流转图， 创建一个 node 之后，整个系统是如何接收到信息，并且信息是通过何种方式确定其要输出的地点，然后根据此进行转发，什么节点拿到数据然后输出；
2. 系统详细构建的方式，
3. 其他模块的对外接口，已经公用方法组件，

项目规范方案：
1. 每个包有一个 config 的文件，专门存放既定的字符串和数字，可供修改的内容。



1. 实现其 node trait;
2. 优化锁粒度, 去除 point 层;


全部的特征体系都围绕消息体系进行处理.


首先要明确 svr 和 svrmgmt 的职能关系.
svrmgmt 管理的是当前物理节点的所有该类节点.


设计节点特性, 对节点的普适操作方法做出约定:
1. 初始化
2. 运行
3. 根据统一的 NoadeAction 定义本节点的消息流转方法
4. 

重整部分设施.

如果是 trait , 期望的是实现同一的操作流程;
如果是 enum(struct) 结构, 那么是功能定制化的过程.

## [2.26] <a id="date-2-26"></a>

事务日志
WHL

还有集群方面

用了个包.

## [3.6] <a id="date-3-6"></a>

事务日志\WHL, 还有集群方面, wal 可能用了一个公共库中的包.

## [3.15] <a id="date-3-15"></a>

接下来开发, 调研关于 wal 方面的内容.

## [5.24] <a id="date-5-24"></a>

重新再见 tsdb 。
为其开发 wal 内容。

WAL(Write Ahead Log)预写日志，是数据库系统中常见的一种手段，用于保证数据操作的原子性和持久性。

在计算机科学中，「预写式日志」（Write-ahead logging，缩写 WAL）是关系数据库系统中用于提供原子性和持久性（ACID 属性中的两个）的一系列技术。在使用 WAL 的系统中，所有的修改在提交之前都要先写入 log 文件中。
log 文件中通常包括 redo 和 undo 信息。这样做的目的可以通过一个例子来说明。假设一个程序在执行某些操作的过程中机器掉电了。在重新启动时，程序可能需要知道当时执行的操作是成功了还是部分成功或者是失败了。如果使用了 WAL，程序就可以检查 log 文件，并对突然掉电时计划执行的操作内容跟实际上执行的操作内容进行比较。在这个比较的基础上，程序就可以决定是撤销已做的操作还是继续完成已做的操作，或者是保持原样。
WAL 允许用 in-place 方式更新数据库。另一种用来实现原子更新的方法是 shadow paging，它并不是 in-place 方式。用 in-place 方式做更新的主要优点是减少索引和块列表的修改。ARIES 是 WAL 系列技术常用的算法。在文件系统中，WAL 通常称为 journaling。PostgreSQL 也是用 WAL 来提供 point-in-time 恢复和数据库复制特性。

## [6.6] <a id="date-6-6"></a>

1. 使用Java Native Interface (JNI)
2. 使用Java-Rust FFI库

关于 java 部分，采用的是统一的 odbc 接口。其中由中间件，对 tsdb 的 c 接口进行开发。odbc 调用 c 接口。 java 采用 JNI 方式调用中间件接口。

## [9.14] <a id="date-9-14"></a>

今天下午开始关于 tsdb 的内容。
对于其中的订阅发布进行测试。

重新复述其流程：
创建 topic 交由 cmngr 进行 保存到 p_sdb: Sdb 。
然后 cmngr 保存后传递给 psvr 进行 xx。
数据在插入时，将符合 topic 的数据保存在 wal ，然后由用户主动拉取数据。

但是此处似乎只有我用到了 Sdb。
SdbValueNum 中可知，其的本意是维护同类型元素。

最基本的是， 一个 topic 有一个名字和一个 sql 语句。
其能够挂载到 cmngr 中,并且创建物理计划。

## [10.5] <a id="date-10-5"></a>

ok 结束了。
但是还有以下的优化点：
1. 删除数据；
2. stq push 未生效；
3. wal ;
4. 条件查询未测试，疑似语法不支持。


清理程序脚本，启动脚本，清理数据库磁盘脚本。
清理程序脚本需要加上对父目录的约束。

## [10.25] <a id="date-10-25"></a>

1. 同表插入， tsdb , 第一个字段相同，出现 fetch meta 问题；
2. 事务提交失败， 错误码 301； select 之后，未提交事务，进行连接，连接阻塞；


1. 加一个长时间未响应自动响应失败。

1. open 的 rollback 去除；
