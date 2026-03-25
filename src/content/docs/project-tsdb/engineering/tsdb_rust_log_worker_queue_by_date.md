---
title: "TSDB Rust Worker Queue Log By Date"
description: "worker、qset、queue、并发与消息分发的日期日志（保留原始表达）"
---

# TSDB Rust Worker Queue Log By Date

> 说明：从 `tsdb_rust_technical_log_by_date_full.md` 按技术线拆分，按日期保留原始记录。

## [2.09] <a id="date-2-09"></a>

今日两个都弄完,如果没有完成,只能先看开源的了.

依赖文件进行映射出唯一的id,是否需要将内存实体放入到内存?
应该不是

理论基本完毕,目下只需要再看一遍语法,用此语言的思想进行实现.而不是用 C 的思想.

该语言,希望忽略变量的使用,将其分为可变和不变两种变量.
所有权是一个很根本的东西,几乎动摇了编程的思想.不过这个只能是日常注意和学习.

关于开源的项目,我们使用的边界又在那里呢?
适配层次.

## [2.23] <a id="date-2-23"></a>

全线推进完成.接下来就是仔细完善,并且学习 rust 代码.
其实我也有点想把线程池弄好.然后网站也弄好.多写几篇文章.

## [3.15] <a id="date-3-15"></a>

flink 方向去看关于流计算的内容。不用太担心关于内容的构建。

## [3.20] <a id="date-3-20"></a>

这日子，我是过不下去了。
没有方向，什么也没有。感觉已经在团队边缘，有效交流几乎已经没有了。自己琢磨方向，需要的时间简直就是指数上升。
很强烈的脱离感。支撑下去的只有职业道德。
现在直接编写 worker 。
在 Qset 的组件内， 实现了 Qset/Queue/Qall/Node 三种基本格式，其中额外实现了 MutexQset/MuteQueue 两种结构，并且方法与相对基本格式同等，是再次封装。
那么对于 worker 结构，我们可以获得一些关于锁的启示。
锁必须是要包含各个类型的。那么我们在构建的时候，如果要在本层次实现线程安全，或者说，提供给使用者是一个线程安全的结构，那么可以围绕该类型做一个接口。
一部分是标准接口，一部分是在标准接口之上的线程安全接口。但是这样就会造成部分冗余，直接让上层做线程安全不久可以了吗。
不设计到指针引用，如果是单一对象持有，在 Rust 中不设计为指针，如果是多对象引用，才需要指针型结构；如果是后续线程安全所涉及，应该由上层进行组织其为指针。

1. 484 ， MutexQset 的 close_qset , 传递参数是否需要统一和调用方式；
2. qinfo.queue 需要调用 update_item_size ， 该成员无访问权限， 是否可以将此接口改成 QueueInfo 的接口；
3. qinfo 中的 fp 应该也含有 FITmes ,建议设计为 enum 类型；

## [3.23] <a id="date-3-23"></a>

工期拖延。没开发完成。
因为这个架构里面，如果完全套用 C++ 的思想，对于 rust 来说是不安全的。
我必须重新梳理一下架构内容。
三个对象， worker, qset, workerpool.

我是否需要在 workerpool 上实现 Mutex ？它在锁定的时候保护了那些变量，又会以那些变量作为需要修改的信息。
首先，它所锁定的，并不是全部的内容，而是部分内容，在 C 结构中
那么，在 rust 中直接套一个锁，这样是不对的。
这个矛盾主要来源于， 我锁定了之后，还需要将其内部的部分变量借用给其他线程。多线程中毫无疑问，这些要借用的变量应该是 Arc 。
但是借用之外，需要改变的内容，不应该存在里面。
所以，Rust 中对于需要借用和不需要借用的变量应该做出明确的规定。
如果不是使用 usafe 的手段，以上是正确的论证。

然后考虑，workerpool 中，如果套一层是为了上层使用该类在多个线程的时候保证安全，其实是不必要的，或者说，这个操作应该交由上层实现。
而在 C 中，本曾实现了锁，进行锁定，想要的是保护该类中指定的部分变量，而非整个类。很简单，没有类生来就是要在多个线程中单独执行的。

我们使用 `Arc<Mutex<()>>` 来实现多线程中的可修改读写，代价是作为锁而存在。但还是有问题，是否表明，struct 中的 struct 还是只能用部分锁来使用呢，只是没有拷贝而已。

## [3.27] <a id="date-3-27"></a>

流式计算在数据库中的使用。
在时序数据的处理中，经常要对原始数据进行清洗、预处理，再使用时序数据库进行长久的储存。在传统的时序数据解决方案中，常常需要部署 Kafka、Flink 等流处理系统。而流处理系统的复杂性，带来了高昂的开发与运维成本。

## [4.3] <a id="date-4-3"></a>

开始设计工作。

## [4.20] <a id="date-4-20"></a>

今天想把 worker 进行优化一下。
明天搭建一个流式计算的基本实验性 Demo 。

## [4.24] <a id="date-4-24"></a>

进行 worker 和 queue 的细化。

## [5.4] <a id="date-5-4"></a>

正在开发， 但是流式计算和其他模块关联比较大。
目前的主线是去构造类。但是任务下发后执行是比较盲目的。
抄袭 TDengine 的东西，也应该有循序渐进的过程。
我的想法是能不能做个小 Demo ，然后根据这个 Demo 进行扩展。
当然，任务和时间也很重要。如果只有一天，你会怎么做？真是个奇怪的角度。

## [5.5] <a id="date-5-5"></a>

1. git 仓库建立一个；
2. RPC 调研以及方案；

## [5.8] <a id="date-5-8"></a>

今日将 worker 进行优化，顺便测试一下 volo 。

## [5.9] <a id="date-5-9"></a>

仔细抽离一下关于 worker 的内容。
首先，QworkerPool 同时维护了 qset 和 worker， worker 维护了线程相关的句柄和信息。
分配的线程，需要的是 qset 的指针，用于在其中取出数据进行执行。
唯一需要确定的是 qinfo 中需要什么内容。其中涉及到对应的上级 queue 指针。但是具体使用的时候只是将 queue 的长度进行 -1， 以控制变量。
所以其完全没有必要存储这个 queue 。

之后考虑的就是阻塞的方式。需要用何种方式进行阻塞。充当信号量的用法。
是不是要用 unsafe 的方式。或者重新编写一个新的。tokie 中的也可以。但是发现 tokio 中的 sem 是非公开组件。那么目前确实缺少平替。

接下来就是对 worker 进行编程。
拟定一个测试模型。

## [5.10] <a id="date-5-10"></a>

发现一个结构问题。信号量，wati 的时候是等待，给出 post 的时候 wait 才会结束。
但是对于单一信号量，其 wait 和 post 的时候必须会要该变其值， lib 库中为 *mut。
这样一来，必须是 Arc<Mutex<Sem>> 的形式，但是必须解锁才能用。这样 sem 的方案就无效了。

如果要实现阻塞，另一个方式就是使用 channel 。
基本，理念还是希望可以塑造多通道的、多消费者的模型结构。
让 queue 持有一个 send。但是这样以来，就变成了单个通道的。如果未来要改版，那么至少应该可以加上同等的另一个通道，或者建立一个新的 queue 来在上层补足。
接下来就是要解决在 worker 的可实践性。
问题是，worker 以何种方式持有本内容。因为 send 必须要全部的克隆体被释放才可以完全关闭，结束 recv 的阻塞。单个线程持有 send 肯定是不合理的。
要关闭，只能是所有 send 线程结束才行。进行统一关闭。
qset 中存储了 Arc<Mutex<Queue>>，标志其只能以锁的方式打开或者关闭。
但是没有一个线程，可以控制当下所有的 recv 。或者只能是 recv 主动变成非阻塞形式。
或者说，由 send 进行确定，发送指定内容后取消 recv 。
那么这样一来，就需要界定，queue 中发送的数据类型是什么，是否只能是 node ？如果想要多方面进行扩展，则需要传递带有 err 的目标信息值。但是无法传递元组信息，最多只能传递 enum。
突然觉得，是否可以存储嵌套中的类型呢，传递 node<enum>，这个方法默认是可行的。
所以我们标志一个节点为坏信息节点，让这个坏信息节点对 recv 进行取消阻塞。
还有一点，我们默认，该消费者模型中，生产者可以有很多个，但是只能有一个消费者。不过模型后期应当具有扩展为多消费者的功能。不对， recv 没有 clone 的变体。如果要多消费者，只能是采用 Arc<Mutx<recv>> 的形式。
所以，qset 是只能够读取而不能够写入的，如果要写入，必须要持有 queue 的句柄。
搞半天好像 qnode 结构体没有什么用处。
是否加上锁的依据是实体是否可以不需要锁并且满足多并发。

使用无锁的 queue ，那么还有一个问题就是，需要修改该数据结构的时候采用何种方法。
必须有人持有原对象，其他使用的人所持有的都是其克隆。
所以设计 qset ，直接存储原有内容而非 Arc ，其他线程存储 Arc<Queue>。

所以，所有对 queue 的改变，应当交由 qset 进行。

整体流程如下：
1. workerPool 负责分配 queue, 在其管理的 qset 中生成一个特定方法 fp 和特定节点 node 的 queue， 并且返回该 queue 的克隆，可用于写入数据；
2. 应用持有 queue_clone ，通过此写入数据进行发送；
3. workers 常监听通道中是否有消息，如果有，则读出 item 进行执行。

但是问题是，在 worker 监听的时候，一个 worker 对应的是共有的 qset， 此时，quest 中有多个 queue 需要同时被监听。
此时如何解决并发问题？
1. 还是有多个消费者；
2. 需要同时监听多个 recv.

这些方法可以采用 crossbeam_channel、select 进行实现。

## [5.15] <a id="date-5-15"></a>

1. 文档，本周需要；
2. 标准库 select；
3. libuv 在 TDengine ，具体是 tar-v 线程的使用，和平替方法；
4. tokio 的异步使用；

基本测试完成。经过长期的迟到，终于我被组织发现了。先定个小目标，做到不迟到吧。
采用第三方库已经是必然的了。

仔细思考一下生命周期的作用。
首先生命周期按理来说是每个引用都需要标注的，但是只有在某些无法被判断的情况下才需要表明。
而生命周期的目的，则是判断多个变量之间的依赖关系是否完整的情况。
在结构体中，如果涉及到引用那么则需要声明生命周期。

而在本案例中。
在本案例中 queue 根本就是直接进入到本方法内部的，所以其生存周期也是应该同等。
生命周期的概念中，结构体和成员的生命周期是不同的。

这里指定了结果引用的生存期应该等于传入引用的生存时间。唯一可能的方法（不安全代码除外）是，生成的引用以某种方式从传入引用派生，例如，它引用了传入引用指向的对象内部的某个字段： 

fn add<'a>(node: &'a mut Node, data: &'static str) -> &'a Node {
fn add<'a>(node: &'a mut Node, data: &'static str) -> &'a Node

struct X {
    a: u32,
    b: u32,
}

fn borrow_a<'a>(x: &'a mut X) -> &'a mut u32 {
    &mut x.a
}

两种方法：
1. 变成 Arc 
2. 在分配的时候就直接添加到 select

变成 Arc 之后则解决。但是这样一来，就无法关闭。

## [5.22] <a id="date-5-22"></a>

采用的是 result 还是 option ,要观察两者是为了解决什么样的问题。

还是上周的问题。仔细复盘一下。
首先，select 引用了 recv 这个句柄。
所以，select < recv 生命周期。
而 qset 持有 select ， queue 持有 recv ， qset 持有 queue。除了 qset 对 select 是等效持有，也就是 qset > select 之外，其他两个都不确定。
所以，要得出 recv > select ，在这个关系链里面是无法直接得出的。
那么我们要实验：
1. 新定义 A 持有 qset 和 recv， 是否可行；
2. 新定义模型 B 持有 select 和 recv ，是否可行。
这就是目前的存档，先留着，之后再补足。

引用的生命周期比结构体本身更长。

Higher-Rank Trait Bounds

还能优化的地方：
1. queue clone 的时候数据指针;
2. test_queue_thread 使用无锁化;
3. qall 的测试;

还是有问题，首先，qset 是否需要锁，如果一直被锁，那么多个 worker 相当于只有一个在使用。
我们想一下， TDengine 中也是同等的流程。
所以赚取的实际上是执行方法的时间，每次只是在读取的时候会进行锁。
但是还有一个问题，读取的时候，如果是阻塞的方式，那么则无法进行写入 queue 。

我不想代码里面全是 Option<Arc<Mutex<T>>> 。

## [5.25] <a id="date-5-25"></a>

```C++
{ 
    (*(queue**)&((*(q))[0])) = (&item->qmsg);
    (*(queue**)&((*(q))[1])) = (*(queue**)&((*(&item->qmsg))[1]));
    ((*(queue**)&((*((*(queue**)&((*(q))[1]))))[0]))) = (q); 
    (*(queue**)&((*(&item->qmsg))[1])) = (q); 
}
```

## [5.29] <a id="date-5-29"></a>

首先在 libuv 的 transSendRespones 中，可以确定的是，有两个关键点：
1. uv_async_t* asyncs;
2. uv_loop_t* loop;
标志这，有一个 uv_loop_t 在一直运行，有一个 uv_async_t 供后续调用的时候，将在 uv_loop_t 中的方法进行回调。
那么对于用户来说，有前期挂载，装载，调用三步骤。
为什么我感觉 STransMsg(SRpcMsg) 中的内容没有用上。
直接看它装载了什么方法。vmSendRsp 应该是属于回调函数。

说起来，最近事情特别多。晚上的时间也需要用来学习。瞬间觉得就变得有些疲惫了。就连交际也因为自身身体素质问题，变得更加难以琢磨。但是人生呢，就是这样。我只是个普通人。越是忙，就越是机遇，便越是专注。可是我终究是难以享受这些吗。那便是要一个力量，打破这个循环，常规方式是舍得，但本我对循环的破解方式，便是用一个更加强的力。专注并且享受，感受思考过程，清晰身体状态。

关于架构，第一个是节点工作可拆卸。
我这部分作为整体架构的主要节点。必须明确每个节点的工作任务。

## [5.30] <a id="date-5-30"></a>

职能无法明确。
我就是不想妥协一些方法，这些方法往往比较鸡肋。但是要真的设计起来，又需要成本。
只能说先暂时采用，后续版本迭代的时候进行修正。

start to init the dnode and run
start to create dnode
no method to call
no method to call
hello vm init function
ready to start workers
start to vm_open_vnode
no method to call
no method to call

按理来说，如果使用了 volo 架构，那么应该是来了一个包，直接执行在函数里面，结束后便返回。
但是目前的情况是采用了 worker 操作。
那么仍然是为 rpcmsg 封装一个 resopne 的操作。

```rust
worker.thread = Some(Builder::new().name(&self.name).spawn(move || {
    Self::thread_fp(qset_clone);
}).unwrap());
```

```C++
int32_t i = 0;
*(val) = 0;
for (;;) {
    if ((((pCoder)->size - (pCoder)->pos) < (1))) 
        return -1; 
    uint32_t tval = ((pCoder)->data + (pCoder)->pos)[0]; 
    if (tval < (((uint8_t)1) << 7)) {
         *(val) |= (tval << (7 * i)); 
         ((pCoder)->pos += (1)); 
         break; 
    } else {
        *(val) |= (((tval) & ((((uint8_t)1) << 7) - 1)) << (7 * i)); 
        i++; 
        ((pCoder)->pos += (1)); 
    } 
} return 0;
 ```

## [6.6] <a id="date-6-6"></a>

今日进行数据对接。

rustup override set nightly

关键在于，每个层级都不一致。
很难去统一去协调。但是应该有一个约定，达成如此的境地。为什么，我们不能够按照原有的意愿进行下去。

rustup default stable/nightly/beta

rustup default stable

rustup override set stable

## [6.9] <a id="date-6-9"></a>

工程性的东西，想做什么最重要。

```rust
// pub struct ColumnDefinition{
//   pub name: String,
//   pub data_type: DataType,
//   pub comment:Option<String>,
// }

// pub struct CreateTableRpcReq{
//   pub msg_type: u32,
//   pub sql: String,
//   pub name: String,
//   pub num_of_columns: u32,
//   pub columns: Option<Vec<ColumnDef>>,
//   pub num_of_tags: u32, 
//   pub tags : Option<Vec<ColumnDef>>,
// } // todo
```

create database testDemo;

create table testTable(id bool, name bool);

EDndNodeType


        fps[NodeAction::VnodeQuery.get_index()] = Some(vm_put_msg_to_query_queue);
        fps[NodeAction::VondeWrite.get_index()] = Some(vm_put_msg_to_write_queue);
        fps[NodeAction::TDMT_DND_CREATE_VNODE.get_index()] = Some(vm_put_msg_to_mgmt_queue);
        fps[NodeAction::TDMT_VND_CREATE_TABLE.get_index()] = Some(vm_put_msg_to_write_queue);

tqProcessPollReq

tqProcessSubscribeReq

## [6.19] <a id="date-6-19"></a>

目前，如何定位到节点句柄是一个问题。
如果是线程之间的通信，那么获取的方式可以是嵌入到 RpcMsg 中。
但是如果没有该内容的定义，获取节点的方法是如何的呢。这一点目前阶段不需要探明，先将 topic 进行开发完善，到达可以运行之后探究。

## [6.25] <a id="date-6-25"></a>

接下来的工作日程是,继续开发 mnode.

Stay Focused:
1. 启动效应
2. 无干扰的休息
3. 主动工作
4. 固定日程

## [10.16] <a id="date-10-16"></a>

TDengine 中，整体逻辑如下：

单个线程逻辑如下：
tQWorkerThreadFp - 工作者模式劫持
mmProcessRpcMsg - rpc 分析
mndProcessRpcMsg - rpc 分析 - 关键方法执行

之后的关键方法有很多种类.

## [11.17] <a id="date-11-17"></a>

[Info]<a id="send_func">信息流转的方法有以下几种情况:</a>
1. 客户端和服务端的通信,为远程通讯,使用 rpc, tonik 远程接口实现;
2. 同一个 dnode 中, 不同节点的通信, 例如 vnode 和 mnode 之间的通信;该部分可能是使用 更上级的消息队列 queue 实现,也可能是 rpc , 暂时存疑;
3. 同一个 dnode 中,相同的节点之间的通信, 例如 vnode-queur 和 vnode-write 之间的通信;此部分是由 消息队列实现, 例如 `tmsgPutToQueue(&pMnode->msgCb, WRITE_QUEUE, &rpcMsg);`;

问题是,一个 sdb ,辅助为 sdbraw , 另一个为 trans 的部分,无法展开架构.

## [11.20] <a id="date-11-20"></a>

接下来开发什么.

ast -> rpc , rpc -> ast, 用户使用的是 ast 中的, 但目前暂时使用 rpc 中的.
对于服务端应该从 rpc 转换成 ast.

rust 拥有比 C 更加精简的架构体系, 使用 enum 时,最好是知道其结构内容,并且嵌入,而非仅仅用作一个普通的 enum. 

[优化]如果所有的响应函数都能够串联到一个结构中,将会十分方便,可以通过 enum 来实现.

## [11.29] <a id="date-11-29"></a>

Cmngr - Mnode
PsvrMgmtPointer - VnodeMgmtPointer
SubMetricmodelName
Metricmodel - Stb
cmngr
CMNGR
PSVR

剩下需要改名的地方：

vgroup

## [11.30] <a id="date-11-30"></a>

在创建数据库时， 由 `psvr_m_add_vgroup_id_and_name` 插入到 vnode 的 map 里面，但是并没有插入到 mnode 中。

在事务的 mndTransCommit 中，有 mndTransSync -> mndSyncPropose , 其中 syncPropose -> syncNodePropose 。

之前提到有，
[Info](#send_func)信息流转的方法有以下几种情况:
1. 客户端和服务端的通信,为远程通讯,使用 rpc, tonik 远程接口实现;
2. 同一个 dnode 中, 不同节点的通信, 例如 vnode 和 mnode 之间的通信;该部分可能是使用 更上级的消息队列 queue 实现,也可能是 rpc , 暂时存疑;
3. 同一个 dnode 中,相同的节点之间的通信, 例如 vnode-queur 和 vnode-write 之间的通信;此部分是由 消息队列实现, 例如 `tmsgPutToQueue(&pMnode->msgCb, WRITE_QUEUE, &rpcMsg);`;

[优化]将每种类型和 node action 进行优化，进行层次分类。

```C++
TransPort::handle_req()
```

## [12.26] <a id="date-12-26"></a>

最近两天又开始弄关于 select 的复用问题.
但是由于其引用无法解决, 转向寻求 tokio 中的 select 进行解决, 但其作为 select! 在使用有限内容的时候可以很好解决, 但是需要监听的 channel 一旦多其来后, 就无法进行监听.

在使用 crossbeam_channel 的说实在, 这一块, 比较无解, 其使用场景, 就确定了 需要 recv 的生命周期必须比 select 更长,  那么就无法限定在一个结构体内部同时存储这两者.
两个结构体比较鸡肋, 应用场景会被局限, 最简单的应该只有是用一个全局变量, 来存储 recv , 然后 select.recv(recv) , 通过此法来确定.

尝试使用 tokio 中的 recv ,其是一个 future .

## [12.27] <a id="date-12-27"></a>

目前的方向是:
1. 仍然使用 crossbeam_channel 的 select , 尝试解决其引用问题, 但是此法, 如果不能够将 recv 的生命周期控制控制在有限范围内, 那么将会对整体代码产生较大的污染.
2. 使用 tokio 中的 select!, 编写新的 VecRecv 为 future , 但是此法的效率依赖于内部实现的并发效能;
3. 使用 future 进行实现.

又是周三, 今天做了什么事情呢, 尝试了 select ,但是没有成功, 开发元数据, 但是拖了很久时间, 不知道时间去那里了, 看了会订阅发布, 其中涉及到其他算子的使用, 没有耐心看完, 下午去了质量处.

## [12.28] <a id="date-12-28"></a>

今日专心设计, 保证文档质量.

qset 和 worker 在设计之初, 没有考虑到多线程的并发问题.
其中 qset 的 read all item 和 add item 之间无法进行并发.
这块可以进行改进.

## [12.29] <a id="date-12-29"></a>

select 之间。

## [2.4] <a id="date-2-4"></a>

MgmtWrapper 是否需要保留.
这个结构的存在已经有点违反了面向对象的结构.
因为其的功能只有一个, 就是作为一个 wrapper 包装存在.
但是其没有功能分层的必要性.
但是如果作为存储该节点所有方法的结构还是有可取之处.

太多内容固化了, 都生锈了.

## [2.5] <a id="date-2-5"></a>

MgmtWrapper 如果有管理方法, 那么还是要将其内部的内容取出, 然后做操作, 
现在存放的是指针, 那么就按照实体为指针来操作, 
指针类型[temp]只持有用于获取其内部数据的操作.

所以现在的情况就是:
1. 实体/实体指针
2. 实体管理类/实体管理类指针
3. wrapper

## [2.27] <a id="date-2-27"></a>

155
这次仓库改动比较大, 如何.
我的改动应该并不是特别多, 主要集中在对模块的归整上, 所以删除和合并的内容可以手动完成, 并且会有报错或重定义提示.

SDbCfg
MetricModelObj
Msvr
ServerEngineType
SvrMgmtMod

CmngrMgmt -> CmngrEngine
Msvr -> MsvrEngine

pdata -> PDATA 

cmngr_m_get_mgmt_func
cmngr_m_init


提早做出该产品的明确定义笔记, 不然总是忘记.
将产品描述清楚.
四大坑

```rust
pub fn cmngr_m_put_msg_to_write_queue(p_mgmt: &MgmtPointer, mut msg: RpcMsg) {
    let p_cmngr_mgmt = match p_mgmt {
        MgmtPointer::CmngrMgmtPointer(v) => v,
        _ => unreachable!(),
    };
    let cmngr_mgmt = p_cmngr_mgmt.lock().unwrap();


pub fn cmngr_m_put_msg_to_read_queue(p_mgmt: &MgmtPointer, mut msg: RpcMsg) {
    let p_cmngr_mgmt = match p_mgmt {
        MgmtPointer::CmngrMgmtPointer(v) => v,
        _ => unreachable!(),
    };
    let cmngr_mgmt = p_cmngr_mgmt.lock().unwrap();


// 整个系列都应该修改

pub fn psvr_m_put_msg_to_sync_ctrl_queue(p_mgmt: &MgmtPointer, mut pmsg: RpcMsg) {
    let p_psvr = match p_mgmt {
        MgmtPointer::PsvrMgmtPointer(v) => v,
        _ => unreachable!(),
    };
    let p_mgmt = p_psvr.lock().unwrap();
    psvr_m_put_msg_to_queue(&p_mgmt, pmsg, EQueueType::SyncCtrlQueue);
}



enum_for_index! {
/// 系统节点类型
#[derive(Debug, PartialOrd, Eq, Ord, Hash, Copy)]
    pub enum ServerEngineType : usize {
        MSVR = 0,
        CMNGR = 1,
        PSVR = 2,
        QNODE = 3,//csvr??
        SNODE = 4,//csvr??
    }
}
```

mod function_list

## [2.29] <a id="date-2-29"></a>

合并完成.

## [3.18] <a id="date-3-18"></a>

不用管其他人开发的是什么样子的, 自己开发的工具只隶属并服务自己的开发进度, 目前的团队现状决定.
而且, 也不用考虑别人开发的怎么样, 没必要为其他人完善. 将自己负责的功能开发完善即可.
目前比较重要的是, 将能看懂的看懂. 然后加以完善即可.
