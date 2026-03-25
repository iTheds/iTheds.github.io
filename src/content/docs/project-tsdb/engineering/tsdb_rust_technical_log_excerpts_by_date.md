---
title: "TSDB Rust Technical Log Excerpts By Date"
description: "从开发日志抽取的关键技术记录（按日期）"
---

# TSDB Rust Technical Log Excerpts By Date

> 说明：该文档从完整开发日志中抽取“有明确技术动作和设计表达”的日期段，保留原始措辞与函数/结构命名，便于后续继续扩写。

## [2023.2.8 - 2.17] 共享内存适配日志

开始开发 rust 。

初次开发的是 os_base 层次的 shm 。
共享内存。
C++ 中已经有一套。我们根据此接口进行实现即可。
首先要明确 rust 和 C++ 之间的关系。
调用 C++ 的是不合理的，但是 shm 共享库里面有，那么我们可以直接调用，封装之后，今天下午如果无事，那么应该编写完成，包括测试代码。晚上再弄一会 C++ 线程池。
shm ipc 也需要实现。

那个不是共享库的，那个是个人开发者开发的开源的代码。但是开源的。
只能自己写了。顺便参考参考，完善一下。

目前有两个比较好的项目，首选其中适配贴近 C++ 的项目。

确定应该实现以下函数：
ftok
shmget
shmat
shmdt
shmctl

参考:
[1](https://blog.csdn.net/qq_40602000/article/details/101267933#%E4%B8%89%E3%80%81%E8%BF%9B%E7%A8%8B%E4%B9%8B%E9%97%B4%E7%9A%84%E9%80%9A%E4%BF%A1%20%C2%A0-%3E%20%E6%B6%88%E6%81%AF%E9%98%9F%E5%88%97)
[2](https://blog.csdn.net/aLingYun/article/details/100528283)

项目 shm-master ：
比较难懂其中的部分语法。而且都是调用的 C++ 的接口.

项目 rust_shm_ipc-master :
比较有参考意义.
但是它考虑了 unix 和 windows 两个系统的适配.

[2.09]
今日两个都弄完,如果没有完成,只能先看开源的了.

依赖文件进行映射出唯一的id,是否需要将内存实体放入到内存?
应该不是

理论基本完毕,目下只需要再看一遍语法,用此语言的思想进行实现.而不是用 C 的思想.

该语言,希望忽略变量的使用,将其分为可变和不变两种变量.
所有权是一个很根本的东西,几乎动摇了编程的思想.不过这个只能是日常注意和学习.

关于开源的项目,我们使用的边界又在那里呢?
适配层次.

[2.10]
共享内存设计接口,两个方面.
1. 按照文件路径进行获取共享内存类.
2. 按照 id_str 获取共享内存类.

额外设计类获取 str_id 的方法.

base_sleep and base_shm develope done by iTheds.test over

[2.13]
问题可大了.
shmem_master 引用了大量的 nix 库中内容.
nix 库实际调用的接口还是系统 libc 的接口.
嵌套层数太多.
但是得到了一些有用的信息:
1. libc::shm_open

所以,其实很多的接口并不能完全脱耦合.

[2.14]
完全抽离,成本必定很难估量。
但是边界在什么地方，也需要清楚。
适配 windows ， windows 这个包是可以使用的。但是 win-sys 包可以取代。
适配 unix ，使用到 nix 包。很合理吧？？？:)

之后如何处理？
直接封装一个标准口即可？
我们还是希望知道 libc 的接口是否 linux 和 windows 都可以使用

[2.15]
重新梳理一下:
首先，接口并不难，难的是如何适配。
之前所述的 ftok/shmget/shmat/shmdt/shmctl 系列接口，都是 unix 下的。
而在 windows 下实现共享内存是用的 CreateFileMapping/MapViewOfFile 类似的文件映射方式。
这个概念之前就被混淆了。理所当然认为是两个系统都用的该类型接口。
然后就是依赖问题。

windows 和 winapi / nix ，这几类库是否应该被使用。
首先， winapi 是个人封装的精简接口。可以抽离。
但是 nix 引用比较多。

[2.17]
终于抽离代码完成。
最后进行加工，将 Result 归整， error 使用归整，可复用的代码归整。


## [2023.2.20 - 3.9] 红黑树/跳表/错误码日志

ok， 初步抽离完成。其实还有文档、测试可以补充，还可以归整一下代码。
但是按照目前的进度，优先完成周五先分配的任务。
红黑树，跳表，错误码。
只有两周时间，要自己做那肯定是不可能的。这周先把红黑树和跳表解决。网络上有现成的东西。可以先全部搬过来。然后再了解其具体使用。
作为工具性，错误码会更可被人使用，它的优先级应该更高。但是我还需要熟悉 rust 语法，且配合多一点的使用场景。

跳表：
其概念大概懂了，就是在原有的链表结构中，按一定规则抽离出部分元素，使得其时间复杂度从 O(n) 降次到 O(logn)。
但是按照何种规则，会取得何种收益。这是需要考虑的。
先有一个代码实现，看项目 skiplist-master .

The `rng.gen()` method is able to generate arrays (up to 32 elements) and tuples (up to 12 elements), so long as all element types can be generated. When using `rustc` ≥ 1.51, enable the `min_const_gen` feature to support arrays larger than 32 elements. For arrays of integers, especially for those with small element types (< 64 bit), it will likely be faster to instead use [`Rng::fill`].

只要可以生成所有元素类型，“rng.gen（）”方法就可以生成数组（最多32个元素）和元组（最多12个元素）。当使用“rustc”≥1.51时，启用“min_const_gen”功能以支持大于32个元素的数组。对于整数数组，尤其是那些元素类型较小（小于64位）的数组，使用[`Rng:：fill`]可能会更快。

该仓库有一个级别分类.
直接抄袭.抄袭完成.抄袭下一个 redblackBST. 
抄袭完成.

最后一个错误码...

[2.22]
准备上午弄完错误码,下午抽时间写一下大船脚本进行测试.
然后看看线程池这周能不能推进.

[2.23]
全线推进完成.接下来就是仔细完善,并且学习 rust 代码.
其实我也有点想把线程池弄好.然后网站也弄好.多写几篇文章.

[2.28]
hexo 已经弄好了,之后可以在多个设备之间进行编写. csp 不那么快,但是可以先刷题.
先看 rust .
现在需要对 redblackRST 和 skiplist 进行验证.
那么从 TDengine 源码入手,结合数据库场景.来观察是否相同.
首先验证跳表.先看懂其策略模型是如何布置的.
看的太慢了。

[3.6]
快速进入结束阶段时期。
针对使用做出一套基本介绍。
今天重新统筹了关于数据库错误码的内容。想要实现一些用法。
看了关于跳表更深入的东西，但是发现，整个内容都很难平衡。无法得知更深入的东西。想要画一些图和表来表示更显而易见的理论。
还有红黑树。但是总感觉无法深入，没有着力点。

大致了解了红黑树。但是好焦虑啊，我要开课题，要学习。

[3.8]
才发现拷贝的仓库代码中没有删除节点的操作。
这不就是正好给我实践一下。
使用 RBTree 查了一下，发现了另一个仓库。
但是我如何得知，我可以使用它呢。
我甚至都不知道红黑树可以用来做什么。又如何去做。我不了解 TDengine ， 我不认可只是去拷贝它们。我想要更准确的架构，想要更明确的行动指南。
可是我没有办法，我现在还无法独挡一面。世界上那么多好玩的东西，那么多无法节制的东西，但是如果我连我自己都无法控制，那么，又如何控制自己的未来呢。
我要写，要学，要安静，我必定，可以养成好的习惯，必定可以超脱于此，必定可以突破自己的瓶颈。

[3.9]
仓库， rbtree ，提供给了我最基本的设计操作和框架。
在设计红黑树的时候，仍然使用了 std::ptr 这样在 rust 不被建议的用法，但是却更加靠近底层，有更高的执行效率。
对于单个节点，一方面是节点实体 RBTreeNode, 一方面是该节点的指针 NodePtr，所有方法围绕指针进行。
而许多基本方法，则用继承进行实现，诸如拷贝、drop 等。
该程序的浏览，为之后的程序设计奠定了基本的流程开发。
至此，开(chao)发(xi)完毕。
接下来补足文档或者接着测试都可。
时常看看最原始的设计笔记，阅读 TDengine 源码，这两件事最好每天都有一个进展。


## [2023.3.20 - 5.22] worker / qset / queue 并发日志

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

[3.23]
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

[3.24]
经过一天的拼凑，大致上已经编写完成。但是还没有测试，也不具备测试的条件。
接下来的工作就是调查数据库流式计算应该如何处理。
现在是两条路子，一个是对 TDengine 调研并且编写尽可能准确的文档，不需要太宽泛；
一个是对流式计算做出调研。

[3.27]
流式计算在数据库中的使用。
在时序数据的处理中，经常要对原始数据进行清洗、预处理，再使用时序数据库进行长久的储存。在传统的时序数据解决方案中，常常需要部署 Kafka、Flink 等流处理系统。而流处理系统的复杂性，带来了高昂的开发与运维成本。

[4.3]
开始设计工作。

[4.10]
仍然在排查算子的运作方式。
总体框架大概是，每个节点线程对应一个工作者。
调试方法和推断过程很重要。调试如果是为了了解系统大致架构，那么不需要仔细查看，但是也必须知晓关键函数所在，才能够尽量减少断点。

[4.14]
基本分析已经做了将近三周的工作。在该三周中，我们对流式计算进行了概念级的了解。对 TDengine 中算子的分布情况、服务端各虚拟节点的作用、流式计算具体操作流程以及函数调用关系做出了分析。
接下来，就涉及到具体实施步骤，对项目搭建原始模型，详细到接口层面。之后再进行内容实施。

[4.19]
一个月了。
一直在观察，阅读源码。但是呢，我获取的信息，我不知道大家的信息是那里来的，有没有明确的证明，但是我的信息，大部分只能靠猜测。
像是流式计算中执行 sql 语句的三个方法和策略。我深入分析了其中算子的生成过程。发现这个算子的生成方式还是很贴近现实的。
但是，策略呢？到目前为止，TDengine 的策略没有见到多少。这个过程让我十分之失望。
我应该如何落实具体的操作内容？真正可以拆解的架构图在那里？关键节点在那里？整个模块的逻辑是空洞的。
我们对底层一无所知。我不是要问责谁。但是我真的需要怀疑一下这件事的前景。
一件事情，是水还是硬核。

我不能够再依靠经验去判断，我应该有更良好的体系和指导思想，在实践中调整。
人活在世界上，可以劳其形，尽其心，但是不能损其神，开发自己的思考和肉体是人最基本的需求。我要开始刷题了。
现有逻辑再有代码，必须工程化。

[4.20]
今天想把 worker 进行优化一下。
明天搭建一个流式计算的基本实验性 Demo 。

[4.24]
进行 worker 和 queue 的细化。

[5.4]
正在开发， 但是流式计算和其他模块关联比较大。
目前的主线是去构造类。但是任务下发后执行是比较盲目的。
抄袭 TDengine 的东西，也应该有循序渐进的过程。
我的想法是能不能做个小 Demo ，然后根据这个 Demo 进行扩展。
当然，任务和时间也很重要。如果只有一天，你会怎么做？真是个奇怪的角度。

[5.5]
1. git 仓库建立一个；
2. RPC 调研以及方案；

[5.8]
今日将 worker 进行优化，顺便测试一下 volo 。 

[5.9]
仔细抽离一下关于 worker 的内容。
首先，QworkerPool 同时维护了 qset 和 worker， worker 维护了线程相关的句柄和信息。
分配的线程，需要的是 qset 的指针，用于在其中取出数据进行执行。
唯一需要确定的是 qinfo 中需要什么内容。其中涉及到对应的上级 queue 指针。但是具体使用的时候只是将 queue 的长度进行 -1， 以控制变量。
所以其完全没有必要存储这个 queue 。

之后考虑的就是阻塞的方式。需要用何种方式进行阻塞。充当信号量的用法。
是不是要用 unsafe 的方式。或者重新编写一个新的。tokie 中的也可以。但是发现 tokio 中的 sem 是非公开组件。那么目前确实缺少平替。

接下来就是对 worker 进行编程。
拟定一个测试模型。

[5.10]
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

[5.15]
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

[5.22]
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


## [2023.5.29 - 6.9] RPC 与节点消息流日志

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

[5.30]
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

[6.6]芒种
今日进行数据对接。

rustup override set nightly

关键在于，每个层级都不一致。
很难去统一去协调。但是应该有一个约定，达成如此的境地。为什么，我们不能够按照原有的意愿进行下去。

rustup default stable/nightly/beta

rustup default stable

rustup override set stable

[6.9]
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


## [2023.11.09] TMQ 架子与代码量盘点日志

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


## [2023.11.10] TMQ 三段函数链与开发路线日志

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


## [2023.11.14 - 12.4] mnode/事务/订阅流程日志

流计算和订阅发布基于的接口系列是 ssdb ，其 mnode 都基于数据结构 SSdb 中的函数方法，通过查验， 包括 insert、 update、 delete 等五种类型。都是在 mnode 进行管理， 但是其内部没有实际值。只有后续的几个是实际管理并且有效的。
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

[11.17]
[Info]<a id="send_func">信息流转的方法有以下几种情况:</a>
1. 客户端和服务端的通信,为远程通讯,使用 rpc, tonik 远程接口实现;
2. 同一个 dnode 中, 不同节点的通信, 例如 vnode 和 mnode 之间的通信;该部分可能是使用 更上级的消息队列 queue 实现,也可能是 rpc , 暂时存疑;
3. 同一个 dnode 中,相同的节点之间的通信, 例如 vnode-queur 和 vnode-write 之间的通信;此部分是由 消息队列实现, 例如 `tmsgPutToQueue(&pMnode->msgCb, WRITE_QUEUE, &rpcMsg);`;

问题是,一个 sdb ,辅助为 sdbraw , 另一个为 trans 的部分,无法展开架构.

[11.20]
接下来开发什么.

ast -> rpc , rpc -> ast, 用户使用的是 ast 中的, 但目前暂时使用 rpc 中的.
对于服务端应该从 rpc 转换成 ast.

rust 拥有比 C 更加精简的架构体系, 使用 enum 时,最好是知道其结构内容,并且嵌入,而非仅仅用作一个普通的 enum. 

[优化]如果所有的响应函数都能够串联到一个结构中,将会十分方便,可以通过 enum 来实现.

[11.22]
问题的关键是,和存储以及 SQLengine 进行对接.

订阅发布最基本的模型。

重新梳理一下结构。

TDengine 中 SSdb 和 SDbObj ，

STDB 元数据存储引擎 ，对应到 rust - Meta.Tdb

[11.24]
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
2. 在事务执行时，主要是 mndTransExecute 函数中的 TRN_STAGE_COMMIT_ACTION 选项， 执行 mndTransPerformCommitActionStage ， 最主要的是 mndTransExecSingleAction 执行， 其内部有三种：
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
    但是，对于该函数(sdbWriteWithoutFree)， sdbInsertRow 中 `taosHashPut(hash, pRow->pObj, keySize, &pRow, sizeof(void *))`已经将信息记录到了 pSdb 中。


[11.29]
Cmngr - Mnode
PsvrMgmtPointer - VnodeMgmtPointer
SubMetricmodelName
Metricmodel - Stb
cmngr
CMNGR
PSVR

剩下需要改名的地方：

vgroup

[11.29]
之前通过事务，已经对整个体系明了了大半。


[11.30]
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

[12.1]
今天开发消费内容，尽可能下午与 SQL 引擎对接。

STqOffsetStore 可能是消费位点提交。

其中，日志和消费位点有一个配合，需要共同开发的部分。

从主消费函数中衍生出整个流程 ， tqProcessPollReq 。
消费过程：
提出其消费者 id  时间和消费位点，找到 Tq handle 。
stq 是维护在 vnode 中的， tq handle 很可能是为单个可操作的内容， 其内部含有 wal ， 应该是为订阅发布所设计的。

这些都是单个节点的消费过程。


[优化]很多地方都有对不同的订阅结构(表、数据库、列)而分的 union ， 这部分应当使用同意的协定。

[12.4]
再回归一下tdegnine 数据订阅发布过程：
首先， mnode 的工作者接收 create topic 请求包， 生成相对的执行树(或执行计划)， 并且将 topic 记录到 sdb 。
~~然后发送到 vnode ， vnode 对 topic 和 执行树进行记录。该部分在 TDengine 中应该是生成了 task 进行存储。~~在创建完成订阅之后，流任务才被创建，并且发送到 vnode 。

创建消费者的过程，该部分仍然比较模糊，其并没有创建 consumer 的过程，需要调试一下。不过，在本项目中，创建 consumer 时，可以在 mnode 中进行，并且发送到 vnode 中的 stq 存储。
流中有一个 mndScheduleStream ， 此为一个方向。

订阅过程，根据客户端订阅函数 tmq_subscribe 发现其构造了一个请求结构， SMsgSendInfo ，
其中， TDMT_MND_TMQ_SUBSCRIBE ， SMqSubscribeCbParam，
由 `mndSetMsgHandle(pMnode, TDMT_MND_TMQ_SUBSCRIBE, mndProcessSubscribeReq);` 指定函数 mndProcessSubscribeReq 进行处理，此处才是进行订阅的过程。然后更新指定的消费者。
所以订阅就是更新消费者的过程。

而根据 `mndSetMsgHandle(pMnode, TDMT_VND_TMQ_SUBSCRIBE_RSP, mndTransProcessRsp);`， 表明~~我又在处理审批工作，然后忘记想到什么地方了，然后代码也没写，此刻只想发呆，就这么回事~~订阅的过程，实际就是执行该事务的过程。~~然后没写几句就又开始弄审批工作啦，实在是太坤乐啦~~

但是其实际生效是在 mndProcessRebalanceReq 中。

SMqSubscribeObj 和 SMqTopicObj 有同 cgroup 下的 key 。
代表了 <topic, subscribe , consumer> 的关系。
创建订阅 subscribe 之后， 存储到 mnode sdb 中。

均衡操作 mndProcessRebalanceReq 调用， 这是一个应答 TDMT_MND_TMQ_DO_REBALANCE 的响应结构。
调用 mndSchedInitSubEp， 将 topic 中的 qplan 取出其子计划， 放到 SMqSubscribeObj->unassignedVgs 中的 qmsg，之后通过 mndDoRebalance ，发给相关的 vnode 。

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


## [2023.12.6 - 12.18] 订阅发布最小可运行链路日志

根据之前分析的 tdengine 数据订阅发布过程，构建本数据库的订阅发布最简单的过程：
创建 topic ：使用 sql 语句进行创建，mnode 的工作者接收 create topic 请求包， 生成一个相对的执行树(或执行计划)，存储到 topic odj 中， 并且将 topic obj 记录到 sdb 。

创建消费者：使用客户端接口创建， mnode 接收到 创建消费者请求包， 存储到 sdb 中。

创建订阅 subscribe ： 使用客户端接口创建， mnode 接受到 订阅 CMSubscribeReq 请求包，更新消费者结构体，将生成的 subsrcibe obj, 存储到 sdb 中，
将 topic 中的 执行计划 plan 一并发送到 vnode ，分配 STqPushEntry、STqHandle、SAlterCheckInfo、STqOffsetStore，
1. pPushEntry->subKey 与 handle 有 hash 关系。STqPushEntry 中有 SMqDataRsp ，用于存储并管理结果集。
2. STqOffsetStore 管理消费位点；
```C++
SHashObj* pPushMgr;    // consumerId -> STqPushEntry
SHashObj* pHandle;     // subKey -> STqHandle
SHashObj* pCheckInfo;  // topic -> SAlterCheckInfo
STqOffsetStore* pOffsetStore;
```

消费时：根据 req 中的 key ，找到 handle ， 确定消费位点， 进行校验，之后取出消费位点的数据，使用执行树进行执行，输出结果集到指定的 pPushMgr 中。
然后将结果集返回，之后提交消费位点。

[12.7]
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


[12.10]
之后的开发只有三个部分:
1. 创建订阅
2. vnode 的操作方法, 其主要是
   1. 接收到 subscribe 之后的部署操作 psvr_process_deploy_subscribe_task
3. 消费的流程

`TD_DEF_MSG_TYPE(TDMT_VND_TMQ_SUBSCRIBE, "vnode-tmq-subscribe", SMqRebVgReq, SMqRebVgRsp)`，
忽略了一个订阅的过程 tqProcessSubscribeReq ， 在此处， 订阅的时候创建了算子 qCreateQueueExecTaskInfo ， 

[12.18]
流中是 STaskExec ，而 tq 中是 STqExecHandle 。

```C++
typedef struct {
  char* qmsg;
  // followings are not applicable to encoder and decoder
  void* executor; // qTaskInfo_t
} STaskExec;

typedef struct {
  int8_t subType;

  STqReader*  pExecReader;
  qTaskInfo_t task;
  union {
    STqExecCol execCol;
    STqExecTb  execTb;
    STqExecDb  execDb;
  };
  int32_t numOfCols;  // number of out pout column, temporarily used
} STqExecHandle;
```

之后就是构建 task ，然后将 task 进行执行。
完成这项之后，订阅发布即可执行。

之后完成 tq 相关接口。但是其中还有部分关键。


## [2024.1.2] STqHandle / WAL / Reader 结构日志

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


## [2024.10.1 - 10.30] topic/consumer/subscribe/consume 联调日志

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
2. 创建 subscribe; cmngrProcessSubscribeReq(TDMT_MND_TMQ_SUBSCRIBE CMSubscribeReq) tqProcessSubscribeReq(TDMT_VND_TMQ_SUBSCRIBE MqRebVgReq)
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
create database test1;
use test1;
create table table1 (ts timestamp, u1 int , u2  int);

use test1;

create topic topic1 AS select * from table1 WHERE u1 > 25;
create topic topic1 AS select * from table1;
create consumer constest1;
create subscribe constest1 TOPICS (topic1);

INSERT INTO table1 (ts, u1, u2) VALUES (NOW, 10, 30);
INSERT INTO table1 (ts, u1, u2) VALUES (NOW, 20, 40);
INSERT INTO table1 (ts, u1, u2) VALUES (NOW, 15, 35);
INSERT INTO table1 (ts, u1, u2) VALUES (NOW, 25, 45);
INSERT INTO table1 (ts, u1, u2) VALUES (NOW, 30, 50);
INSERT INTO table1 (ts, u1, u2) VALUES (NOW, 40, 60);
INSERT INTO table1 (ts, u1, u2) VALUES (NOW, 50, 70);
INSERT INTO table1 (ts, u1, u2) VALUES (NOW, 60, 80);

consume poll constest1;

use test1;
consume poll constest1;

select * from table1;

create topic topic1 AS select * from table1;
```

[10.5]
ok 结束了。
但是还有以下的优化点：
1. 删除数据；
2. stq push 未生效；
3. wal ;
4. 条件查询未测试，疑似语法不支持。


清理程序脚本，启动脚本，清理数据库磁盘脚本。
清理程序脚本需要加上对父目录的约束。

[10.17]


[10.17]
1. 调用 delete 在 tsdb client 中崩溃；
2. 建议 tzdb bool 类型 'true' 改成 true;

sudo apt-get install libqt5sql5-odbc unixodbc-dev

ERROR:Compiler error at position 19: Unknown table rules_

1. [x]数据问题；
2. [x]java bug;
3. []qt 数据;
4. 异常测试；
5. [x]长字符串；
6. [X]测试多插入表；

valgrind --leak-check=full --track-origins=yes .

Valgrind 是一个非常强大的内存调试和性能分析工具，它能够检测多种内存和线程相关的问题。Valgrind 有多种不同的报告形式来帮助开发者找到并修复代码中的错误，以下是几种常见的 Valgrind 报告形式：
1. 内存泄漏（Memory Leak）报告

内存泄漏发生在程序未能正确释放分配的内存时。Valgrind 会检测出未释放的内存，并按其不同类型报告泄漏。

    definitely lost：程序丢失了对这部分内存的所有引用，无法再释放。确实是泄漏。
    indirectly lost：内存块本身没有丢失，但它是由其他丢失的内存块引用的，实际上也算是泄漏。
    possibly lost：程序分配的内存没有丢失，但指向该内存的指针可能不在程序的范围内或无法访问，可能是泄漏。
    still reachable：分配的内存仍然可达，程序结束时没有释放，但不一定是问题。通常是全局变量导致的。

[10.23]
1. 多表 java 崩溃；
2. 内存问题

[10.25]
1. 同表插入， tsdb , 第一个字段相同，出现 fetch meta 问题；
2. 事务提交失败， 错误码 301； select 之后，未提交事务，进行连接，连接阻塞；


1. 加一个长时间未响应自动响应失败。

1. open 的 rollback 去除；

[10.29]
~~第二次同步的时候， master 发送数据没有到 leave .~~
其实是从的没有关闭，导致的阻塞。还是 select 模型的问题。
io 模型必须加上一个关闭 fd 。
其实 io 模型已经关闭了。只是在从2 在等待主节点回消息，但是主节点其对从2 的主动连接未断开。

[10.30]
1. 客户端 QT 其默认会给 7030 发送消息，即使连接的是 3062.
2. 

客户端处理 REPLICA_DATA_SYNC_REQUEST 的过程，可能有问题，导致未同步。

后续问题：
1. 还是有 socket reset;
2. 同步的时候，比较慢，调整 io 所有 socket hd 为 非阻塞之后解决。 -- 但是还未知其原因；

有时间 jdbc 也测试一下。

日志可以采用 journalctl .




































# Consciousness

