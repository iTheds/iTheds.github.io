---
title: "TZDB Rust Project"
published: 2022-10-15
description: "TZDB Rust Project"
tags:
  - "rust"
category: "work"
draft: false
author: "Lonnie iTheds"
---
# TZDB Rust Project

本文主要记录关于 TZDB 时序数据库开发内容。包括但不限于对于基础技术的调研工作、对于现有模块的开发工作、成员 iTheds 的开发历程。

项目启始：
本次的项目目标，开发时序数据库系统单机版原型系统。
时序数据库系统，准确来说是分布式集群的数据库系统。

系统结构方面是实现多个主机对多个客户端系统进行响应并且存储具有时序特征数据。

# Compontence

## 项目理论结构

![](/image/%E6%80%BB%E4%BD%93%E8%BD%AF%E4%BB%B6%E6%88%90%E5%93%81%E5%8C%85%E5%9B%BE.png)

## 项目大方向拆解

![](/image/%E6%A8%A1%E5%9D%97%E6%8B%86%E8%A7%A3.png)

### 数据库系统要点任务

这个图不全面，不是任何的构成，不足以作为执行方案，但可以算是一个卖点方案。
![](/image/数据库服务器.png)


## API 组件基本

![](/image/%E7%AE%97%E6%B3%95%E5%B7%A5%E5%85%B7.png)

### 基本公共组件要点

![](/image/%E6%95%B0%E6%8D%AE%E5%BA%93%E5%9F%BA%E6%9C%AC%E5%8D%8F%E8%AE%AE%E8%A7%84%E5%88%99.png)

### 数据库核心功能

![](/image/%E6%95%B0%E6%8D%AE%E5%BA%93%E6%A0%B8%E5%BF%83%E5%8A%9F%E8%83%BD.png)

# 基本框架

catalog 概念：

TbCache 表缓存

Column

DFField

DFSchema

QSchema

SessionContext

SessionState

SessionContextProvider

LogicalPlanSignature

Parser

# 详细设计

一般来说，我们将工程内容抽象为
1. 基本结构类工具 - 这部分是适应后续编程便捷度的、基于现有编程语言的开发工具。比如说， 如果是 C 语言，那么我们应该对其应当补充出一些基本类型的实现，如果可以应当补充一些便于面向对象的开发方式，以容纳更大的体系；如果是 C++ ，那么我们可以实现一些我们之后会使用到的库，如果有对生命周期做约束的；而 rust 中，可以实现一些公共的内容，比如压缩方法、十分泛用的链表等，而不是去想着代替标准库，比如 string 和 thread ，这样的内容是否要代替应该结合语言特性决定，C++ 在 unix 和 windows 上 thread 有区别，那么可以抽离出这样的 thread 对象，通信层面也可以抽离出对象来决定是使用 TCP/IP 或者是 UDP ，但是 rust unix 和 windows 中两者一样，根本没有必要抽离出这种基本组件。同时如果可以，那么也应该加上宏编程等内容。
2. 算法工具 - 基本的逻辑性工具，针对某种可以进行泛化算法进行实现，比如说 红黑树、跳表、或者其他研究性算法等。

> 接下来应当是整个系统进行对象化和模块化的内容，而数据库，最大的概念上分为客户端和服务端。在分布式数据库中，存在的是节点的概念，客户端是一个伪节点，用于访问，服务端分为 dnode,vnode,mnode,qnode，这些节点占用部分资源进行不同的功能操作，是横向观测结果。而纵向分层还需要进行持续性质的探讨，以更深入软件工程。

## 基本结构类工具

### shm

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
[1 进程间的通信](https://blog.csdn.net/qq_40602000/article/details/101267933#%E4%B8%89%E3%80%81%E8%BF%9B%E7%A8%8B%E4%B9%8B%E9%97%B4%E7%9A%84%E9%80%9A%E4%BF%A1%20%C2%A0-%3E%20%E6%B6%88%E6%81%AF%E9%98%9F%E5%88%97)
[2 共享内存 --- shm](https://blog.csdn.net/aLingYun/article/details/100528283)

### 红黑树

接下来看红黑树：
在基本的每个节点中都会有一个 `enum{red, black}`。并且红黑树是键值对的形式，存储了左右节点指针。
高度计算仍然是 log(n) 。

红黑树是从 2-3-4 树衍生而来的。
2-3-4 树， 是阶数为 4 的 B 树。其中， 2、3、4 表示的是单个节点所表示的指针数量，其表示可以分割的元素范围。
2节点将其标志为黑色节点， 3节点表示为 左倾红节点或者右倾红节点， 4节点则被转化为一个黑色父节点带着左右两个红色节点。
简化一下基本模型，我们来讨论 2-3 树， 左如果将`左倾红黑树`中的红色节点顺时针方向旋转45°使其与黑父平行，然后再将它们看作一个整体，这不就是一颗2-3树吗？
    -- 左倾红黑树， 即 左边的是红色的节点， 优先插入左边子节点。 

![2-3-4 树和转换方式]()

红黑树插入的时候一定会把待插入节点涂成红色， 因为红色节点的意义是`与父节点进行关联`，形成概念模型 2-3 树中的 3 节点或者临时 4 节点。 

红黑树在插入后需要再次调整，实际上很多的树都是需要这样的， 而红黑树是因为存在概念模型中的临时 4 节点， 反应在红黑树中是双红的情况。
如果插入节点是个 2 节点， 那么正好对应红黑树中的黑色父节点。在黑色父节点下面增加一个红色子节点， 确实不会违背红黑树的任何规则。
    -- 在红黑树中， 插入 2 节点的时候，增加一个红色子节点， 并不会破坏规则；
    -- 在 2-3 树中，向一个 2 节点插入， 即将该 2 节点变成一个 3 节点。

再看删除，如果是 2-3 树， 删除的时候，如果是 3 节点，直接将该节点移除即可，不会改变 2-3 树性质， 即不会引起高度的变化；
如果是 2 节点，则会使得 2 节点失去自己唯一的元素， 引发自身删除， 使得该路径高度发生变化， 树变得不平衡。
解决方法： 
1. 删除该节点，再平衡；
2. 假借其他节点组成一个 3 节点或者临时 4 节点，使得其不可能出现在 2 节点中。
    第二种方法， 在搜索整个节点路径中， 如果当前节点是 2 节点，那么就从它的兄弟节点或者父节点借一个元素， 使得其成为 3 节点或者 临时 4 节点。 

那么，如果该节点是非根节点， 那么当前的父节点一定是一个非 2 节点。 (搜索中已经判断了父节点并非 2 节点)。
那么，该节点必然可以借到节点，组成非 2 节点。

所以再看红黑树基本定义：
1. 所有节点有红色和黑色之分；
2. 根节点为黑色；
3. 所有叶子节点为黑色 - 叶子节点其实都是空链接；
4. 任意节点到叶子节点经过的黑色节点数目相同 - 在 2-3 树中， 红色节点必然是和黑色节点绑定的， 所以，只有黑色节点才会贡献高度，在 2- 3树中任意节点到空链接距离相同， 在红黑i树中则是黑色完美平衡 - 距离包括本身和目标节点；
5. 不会有连续的红色节点 - 2-3 树中没有 4 节点， 2-3-4 树中虽然有 4 节点， 但是要求在红黑树中体现为 黑色节点带两个红色子节点， 并非连续。

大多数二叉排序树 BST 的操作(查找、删除、最大值、最小值、插入等)都是 O(h) 的时间复杂度， h 为树的高度。
如果排序树倾斜，那么时间复杂度将达到 O(n) ， 即退化成链表。所以关键就在于如何平衡，如何更简单的进行平衡，保持高度为 log(n) 。 

平衡二叉树(AVL)，和红黑树都可以保持高度。但是平衡二叉树在涉及到频繁的进行插入和删除时， 需要大量旋转操作。红黑树拥有更好的性能。

红黑树中，黑色节点的高为其到叶子节点所经过的黑色节点数量 - 1 ， 红色节点的高与父节点一致。
引理：一棵有 n 个内部结点的红黑树的高度 `h <= 2lg(n+1)`。

红黑树应用：
1. 大多数自平衡BST(self-balancing BST) 库函数都是用红黑树实现的，比如C++中的map 和 set （或者 Java 中的 TreeSet 和 TreeMap）。
2. 红黑树也用于实现 Linux 操作系统的 CPU 调度。完全公平调度（Completely Fair Scheduler）使用的就是红黑树。

在数据库中，红黑树可以用于作为一种索引。

[参考](https://zhuanlan.zhihu.com/p/143585797)

调整平衡， 取决于当前节点的左右节点是什么颜色，当前的节点 leaf 是 red 节点，或者是初次给定的黑色节点 - 注意，这里是顺序执行以下判断，而非 if-else：
1. 如果右子节点是红色， 且左子节点为黑色或者不存在，则执行左旋操作； - 左倾红黑树操作？
2. 如果左子节点是红色， 且左子节点的左子节点不为空且为红色，则执行右旋操作；
3. 如果左子节点为红色， 且其右子节点为红色， 那么将左右子节点颜色置为黑色，本节点 leaf 置为红色；

设想一个场景， 建立一个新的红黑树。先插入一个元素 key = 12 ， 那么， 这个节点是什么颜色的？
插入的时候它是红色的， 没有左右子节点，是根节点所以染成黑色；
然后在这个红色节点的基础上，插入 key = 1 ， 这个时候， 1<12， 所以，在节点左边插入这个节点， 
返回到 key = 12 这个节点上， 进行判断， 不满足上述三个操作条件，不进行变换或染色；
接下来，插入 key = 2 , 找到的 key = 1 这个节点，插入到其右子节点， 然后先以 key = 1 这个节点进行左旋， 
此时 leaf 变为了 key = 2 这个节点，该节点，只有左子节点 key = 1 ，为红色，不必做任何操作，
回到 key = 12 这个节点，不满足第一个条件，
满足第二个条件，执行右旋， 现在根节点是 key = 2 的节点，好，现在颜色仍然是左节点是红色， 右节点是黑色， key = 2 节点为红色；
只剩下第三个条件可以判断 - 满足第三个条件，执行染色。得到了一颗高为 2 的树， 左右节点为黑色，key = 2 的节点因为是根节点而被染成黑色。

所以通过上述分析可知大概作用：
1. 红色节点类似于表现一种权值事物， 如果该节点有兄弟节点也具有'Red'权值，那么权值就可以向上反馈；
2. 'Red'权值单独存在的时候不会破坏权值，但是如果有一个相同方向的链式，相邻的节点都有'Red' 权值，那么，就视为破坏了整体的平衡，
所以要执行左旋或者右旋操作；
3. 左倾红黑树，相当于在第二条中，确定了唯一的方向，使得`相同`方向条件变为`固定单一`的方向。至少简化了红黑树的编程操作，和判断条件。

当然仅靠经验行事还不足以抽象成理论， 在这部分的操作中，可以映射到 2-3 树的操作： - 以下都是基于左倾红黑树
1. 左倾红黑树中，每个红色节点都是作为左子节点而存在的，与父节点绑定在一起，就形成了 2-3 树；
2. 有红色节点的分支一定是非完全的；

## 算法工具

基本工具类型，作为算法工具，是可独立的。分为以下分支：
1. 缓冲池
   1. ID池
   2. 内存池
   3. 页缓存
   4. Cache
   5. Buffer
   6. 资源引用

2. 运行相关：
   1. 工作者模式

### qlist

### 工作者 - worker

工作者是执行对象。

## 主体策略

有三个系列函数：
一个是 vmworker.rs 中的， 消息流转函数， 其初始化在 NodeMsgFpWrapper 中。
一个是 类似 vm_propose_write_message 的， 处理一系列请求的函数， 由 worker 线程直接调用。
一个为主系列函数，专门处理并执行实际的操作。例如同文件中的 vnodeProcessWriteMsg 。

所以，首先响应， 然后流转到相关的执行者， 由指定的 worker 执行， 调用工作函数，处理一个或一批次函数，最后调用主系列函数进行执行。


### 磁盘引擎

### SQL引擎

### 数据订阅

功能简述：
数据订阅主要用于增量数据的实时获取。

功能划分：

模块划分：
1. 消费者
2. 

开发拆解：

### 流式计算

### shell

其以函数 ctx.rs 中的 sql 为具体执行方式。
调用 tonic 所生成的函数， 对应到 server.rs/../lib.rs 文件 中的同名函数。

### RPC

RPC 与我们所理解的一致。该问题是因为流式计算对 RPC 有所依赖。需要抽象出 RPC 的接口，进行发送。
RPC 是立足于网络协议的、与框架层进行交互的部分。

IPC：(Inter Process Communication)跨进程通信
RPC: (Reomote Procedure Call) 远程过程调用

构成：
1. 协议设计
2. 序列化与反序列化约定

RPC 需要解决的内容为底层通信过程。
对于 Rust 来说，我们可以采用 Volo/tonic 进行开发。
需要注意的是，将 Volo 定义为可以拆解的结构。方便后续进行开发， 保持其低耦合度。

#### tonic

在 server 的同名函数中，先接到 tonic 的结构体， 然后转换成 SQL 引擎结构体 MsgReq ， 然后携带其他信息，转换成 RpcMsg, 里面含有 channel， 使得其运行完成后，能够返回结构。
最后交由 dm_process_node_message 进行运行。

#### Volo 该方案已弃用

其是基于 rust 中的泛型关联类型(GAT)进行设计的。
该工程的使用是以来 IDL 的，类似生成代码的类型。其有自身的一套通讯机制。但是不清楚是否可以嵌套到 select 这样应对多种链接的情况。

[RPC框架的IDL与IDL-less](https://zhuanlan.zhihu.com/p/397060740)

IDL，Interface description language，即接口描述语言。
Volo-Thrift 是一个 RPC 框架，既然是 RPC，底层就需要两大功能：

    Serialization 序列化
    Transport 传输

IDL 全称是 Interface Definition Language，接口定义语言。

关于内部架构原理可以参考此文:
[字节跳动开源的 Volo 框架简介](https://juejin.cn/post/7217644586868031548)

在处理循环以来的时候进行 delay 处理。

所以我们要验证的时候，必须进行以下的测验：
1. 针对 Option 属性的处理方式；
2. 针对 Arc Mutex 的处理方式；

当然，如果其无法处理，可以使用手动序列化的场景进行。
缓解超大型 IDL 生成的代码带来的编译压力。

## Test 

### 基本测试格式

测试分为四个部分：
1. function_test ： 功能级测试
2. concurrency_paraller_test ： 并发与并行测试
3. struct_definition ： 结构化定义测试
4. feasibility_test ： AIP 验证，可行性测试

模板如下：
```rust

/// 功能级测试
mod function_test {
}
/// 并发与并行测试
mod concurrency_paraller_test {
}
/// 结构化定义测试
mod struct_definition {
}
/// AIP 验证，可行性测试
mod feasibility_test {
}
```

### shell 测试数据存留

```sql
create database testDemo;
create table testTable(ts timestamp, id int);
insert into testTable values(now, 1);
insert into testTable values(now, 2);
select * from testTable;
select * from ins_table;
show tables;
```

```sql
create topic topic_1 as select * from testTable;
```

# Development Log

[2022.10.14]
In fact , I konw nothing about rust.
So, I need to provide an environment for testing.

[2023.2.8]
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

[2.20]
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

[3.15]
flink 方向去看关于流计算的内容。不用太担心关于内容的构建。

[3.20]
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

[5.25]

```C++
{ 
    (*(queue**)&((*(q))[0])) = (&item->qmsg);
    (*(queue**)&((*(q))[1])) = (*(queue**)&((*(&item->qmsg))[1]));
    ((*(queue**)&((*((*(queue**)&((*(q))[1]))))[0]))) = (q); 
    (*(queue**)&((*(&item->qmsg))[1])) = (q); 
}
```

[5.26]
1. 阅读 transport ;

[5.29]
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

[6.19]
目前，如何定位到节点句柄是一个问题。
如果是线程之间的通信，那么获取的方式可以是嵌入到 RpcMsg 中。
但是如果没有该内容的定义，获取节点的方法是如何的呢。这一点目前阶段不需要探明，先将 topic 进行开发完善，到达可以运行之后探究。

[6.25]
接下来的工作日程是,继续开发 mnode.

Stay Focused:
1. 启动效应
2. 无干扰的休息
3. 主动工作
4. 固定日程

[6.26]
- [X] tqPushMsg
- [] tqStartStreamTasks - tqProcessSubmitReq
- [X] tqProcessTaskRunReq
<!-- tqStreamTasksScanWal -->

[10.8]
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


[10.12]
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

[10.16]
TDengine 中，整体逻辑如下：

单个线程逻辑如下：
tQWorkerThreadFp - 工作者模式劫持
mmProcessRpcMsg - rpc 分析
mndProcessRpcMsg - rpc 分析 - 关键方法执行

之后的关键方法有很多种类.

[10.18]
ExecutionPlan

logical_plan 内容 - createLogicPlan

SPlanContext 不需要，删除

qExtractResultSchema

[10.19]
关键词：
ntb
ctb ： 
stb ： 超级表
sdb ： 实现了一个保存表、流元信息的结构，在 mnode 中保存

[11.09]
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

[11.10]
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

[11.13]
确定层次结构。
问题是目前的所有内容都建立在 vnode 上。如果之后有涉及到 mnode 的开发，移植不便。
改变功能结构为不同 node 的挂载参数。

TODO：
1. mndAcquireDb 中 DB 结构未存放，未对接；

其他可优化：
2. mndCreateTopic 中暂未有 user name 关键字，应对客户端请求包做统一要求保存请求源的用户信息，才能够构建该字段；

[11.14]
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

[12.6]
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

[12.26]
最近两天又开始弄关于 select 的复用问题.
但是由于其引用无法解决, 转向寻求 tokio 中的 select 进行解决, 但其作为 select! 在使用有限内容的时候可以很好解决, 但是需要监听的 channel 一旦多其来后, 就无法进行监听.

在使用 crossbeam_channel 的说实在, 这一块, 比较无解, 其使用场景, 就确定了 需要 recv 的生命周期必须比 select 更长,  那么就无法限定在一个结构体内部同时存储这两者.
两个结构体比较鸡肋, 应用场景会被局限, 最简单的应该只有是用一个全局变量, 来存储 recv , 然后 select.recv(recv) , 通过此法来确定.

尝试使用 tokio 中的 recv ,其是一个 future .

[12.27]
目前的方向是:
1. 仍然使用 crossbeam_channel 的 select , 尝试解决其引用问题, 但是此法, 如果不能够将 recv 的生命周期控制控制在有限范围内, 那么将会对整体代码产生较大的污染.
2. 使用 tokio 中的 select!, 编写新的 VecRecv 为 future , 但是此法的效率依赖于内部实现的并发效能;
3. 使用 future 进行实现.

又是周三, 今天做了什么事情呢, 尝试了 select ,但是没有成功, 开发元数据, 但是拖了很久时间, 不知道时间去那里了, 看了会订阅发布, 其中涉及到其他算子的使用, 没有耐心看完, 下午去了质量处.

[12.28]
今日专心设计, 保证文档质量.

qset 和 worker 在设计之初, 没有考虑到多线程的并发问题.
其中 qset 的 read all item 和 add item 之间无法进行并发.
这块可以进行改进.

[12.29]
select 之间。

[2024.1.2]
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

[1.4]
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

[1.5]
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
服务端接受到的请求时, 便已经生成了一个 subkey, 该请求通过 `mndBuildSubChangeReq` 进行创建, 最根本是 reblance 函数中 SMqRebOutputObj 的 key 相同, 由 topic 和 cgroup 共同组成.
在订阅过程中, 如果是新的订阅(指的是针对 cgroup 和 topic 之间的关系), 那么生成一个 `STqHandle` , 
根据不同的订阅类型进行不同的操作:
1. column , 创建算子, 并且将执行算子放入到 `STqExecHandle` 中 ; 在这个过程中, 通过 `STQ` 的上层 vnode 的 meta 作为入参生成一个 `SReadHandle` , 也一并用于生成执行算子的入参;
   1. 但是, 执行算子中的读取组件, 使用是 从该算子链 中拿出(type = QUERY_NODE_PHYSICAL_PLAN_STREAM_SCAN) `SStreamScanInfo`, 从其中取出 `STqReader` , 放入到 `STqExecHandle` 中.
2. db ,  如果是订阅的数据库, 那么 wal 挂载 ,  然后, 打开 `tqOpenReader` `STqReader` 放到 `STqExecHandle` 中 , 之后, `buildSnapContext` `SSnapContext` 创建一个上下文, 该上下文中包含了 meta 等其他状态信息 , 
   1. 然后, 也生成了一个执行算子,该算子的生成 , 入参只有 `SReadHandle` ,
3. table , 表的大致流程与库一样 ,

构建完成 `STqHandle` 之后, 存放到 STQ 中的 list<STqHandle> 中.

但是推送的过程如何构建呢, 
查看 TDengine 代码发现,  `STqHandle` 中的 `STqPushHandle` 并没有被使用到, 在 push 中, 直接使用的是 `tqPushMsg` , 
其直接使用 `STQ` 中的 list<STqPushEntry>, 对其进行迭代, 然后执行 task , 并且将数据放入到 `SMqDataRsp` 中, 然后调用 `tqPushDataRsp` 发送 `STqPushEntry` 中的数据. 
之后删除这些 STqPushEntry , 是否代表者其只是一次性的???
tqProcessSubmitReq 在 tqPushMsg 中调用，而且该函数只在 vnodeProcessWriteMsg 作为写入后的统一回应， 表明该接口是在写入后对数据的一种提交。
而其遍历的是 STqPushEntry ， 表明其将数据放入了推送部分。

但是看其创建的地方, 在 `tqProcessPollReq` 中,  这其实是一个消费函数, 
其在消费时, 先获取到创建完成的 STqHandle  ,然后 校验和调整 offset 消费位点, 
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
    2. 通过切换输入源,  ExecutionPlan:: , e.g stream<518> , tq<390> transfrom , 具体用法可参照 push_down_projection<414>replace_cols_by_name ,
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


[1.9]
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
然后由 mnode 定时器 `mndThreadFp` 触发 `mndProcessRebalanceReq(TDMT_MND_TMQ_DO_REBALANCE)` 由 `mnode` 处理，在此过程中生成 `(SMqSubscribeObj)mndCreateSub`， 并且调用 mndPersistRebResult - > mndPersistSubChangeVgReq 事务转消息 `tqProcessSubscribeReq(TDMT_VND_TMQ_SUBSCRIBE)` ， 渲染出任务队列的组件。供消费使用。

现阶段先不实现 rebalance ， 在 cmngrProcessSubscribeReq 中直接记录， 然后送达到 vnode 进行部署。

Epset 是指的 ？？？

[1.12]
wal 挂载还需要考虑。

[1.15]
推送有两种模式， 单独推送和统一推送。
在本系统中采取单独推送的方式。

这三个组件之间的关系是， 如果是：执行模块需要推送和读入模块作为初始化。算子运行时，从读取模块读入定量数据，送达推送模块， 然后推送模块在 `tqPushMsg` 中推送。这是统一推送。
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

[1.17]
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
2. 创建 subscribe; cmngrProcessSubscribeReq(TDMT_MND_TMQ_SUBSCRIBE CMSubscribeReq) tqProcessSubscribeReq(TDMT_VND_TMQ_SUBSCRIBE MqRebVgReq)
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

[1.23]
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


[1.29]
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

[2.4]
MgmtWrapper 是否需要保留.
这个结构的存在已经有点违反了面向对象的结构.
因为其的功能只有一个, 就是作为一个 wrapper 包装存在.
但是其没有功能分层的必要性.
但是如果作为存储该节点所有方法的结构还是有可取之处.

太多内容固化了, 都生锈了.

[2.5]
MgmtWrapper 如果有管理方法, 那么还是要将其内部的内容取出, 然后做操作, 
现在存放的是指针, 那么就按照实体为指针来操作, 
指针类型[temp]只持有用于获取其内部数据的操作.

所以现在的情况就是:
1. 实体/实体指针
2. 实体管理类/实体管理类指针
3. wrapper

[2.26]
事务日志
WHL

还有集群方面

用了个包.

[2.27]
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

[2.29]
合并完成.

[3.6]
事务日志\WHL, 还有集群方面, wal 可能用了一个公共库中的包.

[3.15]
接下来开发, 调研关于 wal 方面的内容.

[3.18]
不用管其他人开发的是什么样子的, 自己开发的工具只隶属并服务自己的开发进度, 目前的团队现状决定.
而且, 也不用考虑别人开发的怎么样, 没必要为其他人完善. 将自己负责的功能开发完善即可.
目前比较重要的是, 将能看懂的看懂. 然后加以完善即可.

[5.24]
重新再见 tsdb 。
为其开发 wal 内容。

WAL(Write Ahead Log)预写日志，是数据库系统中常见的一种手段，用于保证数据操作的原子性和持久性。

在计算机科学中，「预写式日志」（Write-ahead logging，缩写 WAL）是关系数据库系统中用于提供原子性和持久性（ACID 属性中的两个）的一系列技术。在使用 WAL 的系统中，所有的修改在提交之前都要先写入 log 文件中。
log 文件中通常包括 redo 和 undo 信息。这样做的目的可以通过一个例子来说明。假设一个程序在执行某些操作的过程中机器掉电了。在重新启动时，程序可能需要知道当时执行的操作是成功了还是部分成功或者是失败了。如果使用了 WAL，程序就可以检查 log 文件，并对突然掉电时计划执行的操作内容跟实际上执行的操作内容进行比较。在这个比较的基础上，程序就可以决定是撤销已做的操作还是继续完成已做的操作，或者是保持原样。
WAL 允许用 in-place 方式更新数据库。另一种用来实现原子更新的方法是 shadow paging，它并不是 in-place 方式。用 in-place 方式做更新的主要优点是减少索引和块列表的修改。ARIES 是 WAL 系列技术常用的算法。在文件系统中，WAL 通常称为 journaling。PostgreSQL 也是用 WAL 来提供 point-in-time 恢复和数据库复制特性。

[6.6]
1. 使用Java Native Interface (JNI)
2. 使用Java-Rust FFI库

关于 java 部分，采用的是统一的 odbc 接口。其中由中间件，对 tsdb 的 c 接口进行开发。odbc 调用 c 接口。 java 采用 JNI 方式调用中间件接口。

[9.14]
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

[10.1]
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

[2023.12.4]
天天说咱不如人，两件事的体量都不一样。谁都没有经验，还不是在边学习的过程。并且，今年一堆杂事。我看是在浪费我时间。
还有一个姓赵的，凭啥一件事就说我粗心，写错了一次，我认，但是就事论事而已，别给我最好，我不接受你的定义，也别给我那些杂事！
一群傻逼。有要求你可以提出来，没必要说我们做完就说不好，没干好活，那是我们自己的责任，但是如何验收，这是你的事，不能说我们给个定义，第一次就说不行，一说不行就和别人比。

好困, 好懒, 又太多不确定的事, 想到如今的经济情况, 想到曾经的人, 想到山风啊, 明月啊, 什么时候能再相见