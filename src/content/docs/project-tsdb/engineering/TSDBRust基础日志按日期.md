---
title: "TSDBRust基础日志按日期"
description: "共享内存、跨平台、基础数据结构与底层抽象的日期日志(保留原始表达)"
---

# TSDB Rust Foundation Log By Date

> 说明：从 `tsdb_rust_technical_log_by_date_full.md` 按技术线拆分，按日期保留原始记录。

## [2022.10.14] <a id="date-2022-10-14"></a>

In fact , I konw nothing about rust.
So, I need to provide an environment for testing.

## [2023.2.8] <a id="date-2023-2-8"></a>

开始开发 rust 。

初次开发的是 os_base 层次的 shm 。
共享内存。
C++ 中已经有一套。我们根据此接口进行实现即可。
首先要明确 rust 和 C++ 之间的关系。
调用 C++ 的是不合理的，但是 shm 共享库里面有，那么我们可以直接调用，封装之后，今天下午如果无事，那么应该编写完成，包括测试代码。晚上再弄一会
C++ 线程池。
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

## [2.10] <a id="date-2-10"></a>

共享内存设计接口,两个方面.

1. 按照文件路径进行获取共享内存类.
2. 按照 id_str 获取共享内存类.

额外设计类获取 str_id 的方法.

base_sleep and base_shm develope done by iTheds.test over

## [2.13] <a id="date-2-13"></a>

问题可大了.
shmem_master 引用了大量的 nix 库中内容.
nix 库实际调用的接口还是系统 libc 的接口.
嵌套层数太多.
但是得到了一些有用的信息:

1. libc::shm_open

所以,其实很多的接口并不能完全脱耦合.

## [2.14] <a id="date-2-14"></a>

完全抽离,成本必定很难估量。
但是边界在什么地方，也需要清楚。
适配 windows ， windows 这个包是可以使用的。但是 win-sys 包可以取代。
适配 unix ，使用到 nix 包。很合理吧？？？:)

之后如何处理？
直接封装一个标准口即可？
我们还是希望知道 libc 的接口是否 linux 和 windows 都可以使用

## [2.15] <a id="date-2-15"></a>

重新梳理一下:
首先，接口并不难，难的是如何适配。
之前所述的 ftok/shmget/shmat/shmdt/shmctl 系列接口，都是 unix 下的。
而在 windows 下实现共享内存是用的 CreateFileMapping/MapViewOfFile 类似的文件映射方式。
这个概念之前就被混淆了。理所当然认为是两个系统都用的该类型接口。
然后就是依赖问题。

windows 和 winapi / nix ，这几类库是否应该被使用。
首先， winapi 是个人封装的精简接口。可以抽离。
但是 nix 引用比较多。

## [2.17] <a id="date-2-17"></a>

终于抽离代码完成。
最后进行加工，将 Result 归整， error 使用归整，可复用的代码归整。

## [2.20] <a id="date-2-20"></a>

ok， 初步抽离完成。其实还有文档、测试可以补充，还可以归整一下代码。
但是按照目前的进度，优先完成周五先分配的任务。
红黑树，跳表，错误码。
只有两周时间，要自己做那肯定是不可能的。这周先把红黑树和跳表解决。网络上有现成的东西。可以先全部搬过来。然后再了解其具体使用。
作为工具性，错误码会更可被人使用，它的优先级应该更高。但是我还需要熟悉 rust 语法，且配合多一点的使用场景。

跳表：
其概念大概懂了，就是在原有的链表结构中，按一定规则抽离出部分元素，使得其时间复杂度从 O(n) 降次到 O(logn)。
但是按照何种规则，会取得何种收益。这是需要考虑的。
先有一个代码实现，看项目 skiplist-master .

The `rng.gen()` method is able to generate arrays (up to 32 elements) and tuples (up to 12 elements), so long as all
element types can be generated. When using `rustc` ≥ 1.51, enable the `min_const_gen` feature to support arrays larger
than 32 elements. For arrays of integers, especially for those with small element types (< 64 bit), it will likely be
faster to instead use [`Rng::fill`].

只要可以生成所有元素类型，“rng.gen()”方法就可以生成数组(最多32个元素)和元组(最多12个元素)
。当使用“rustc”≥1.51时，启用“min_const_gen”功能以支持大于32个元素的数组。对于整数数组，尤其是那些元素类型较小(小于64位)
的数组，使用[`Rng:：fill`]可能会更快。

该仓库有一个级别分类.
直接抄袭.抄袭完成.抄袭下一个 redblackBST.
抄袭完成.

最后一个错误码...

## [2.22] <a id="date-2-22"></a>

准备上午弄完错误码,下午抽时间写一下大船脚本进行测试.
然后看看线程池这周能不能推进.

## [2.28] <a id="date-2-28"></a>

hexo 已经弄好了,之后可以在多个设备之间进行编写. csp 不那么快,但是可以先刷题.
先看 rust .
现在需要对 redblackRST 和 skiplist 进行验证.
那么从 TDengine 源码入手,结合数据库场景.来观察是否相同.
首先验证跳表.先看懂其策略模型是如何布置的.
看的太慢了。

## [3.6] <a id="date-3-6"></a>

快速进入结束阶段时期。
针对使用做出一套基本介绍。
今天重新统筹了关于数据库错误码的内容。想要实现一些用法。
看了关于跳表更深入的东西，但是发现，整个内容都很难平衡。无法得知更深入的东西。想要画一些图和表来表示更显而易见的理论。
还有红黑树。但是总感觉无法深入，没有着力点。

大致了解了红黑树。但是好焦虑啊，我要开课题，要学习。

## [3.8] <a id="date-3-8"></a>

才发现拷贝的仓库代码中没有删除节点的操作。
这不就是正好给我实践一下。
使用 RBTree 查了一下，发现了另一个仓库。
但是我如何得知，我可以使用它呢。
我甚至都不知道红黑树可以用来做什么。又如何去做。我不了解 TDengine ， 我不认可只是去拷贝它们。我想要更准确的架构，想要更明确的行动指南。
可是我没有办法，我现在还无法独挡一面。世界上那么多好玩的东西，那么多无法节制的东西，但是如果我连我自己都无法控制，那么，又如何控制自己的未来呢。
我要写，要学，要安静，我必定，可以养成好的习惯，必定可以超脱于此，必定可以突破自己的瓶颈。

## [3.9] <a id="date-3-9"></a>

仓库， rbtree ，提供给了我最基本的设计操作和框架。
在设计红黑树的时候，仍然使用了 std::ptr 这样在 rust 不被建议的用法，但是却更加靠近底层，有更高的执行效率。
对于单个节点，一方面是节点实体 RBTreeNode, 一方面是该节点的指针 NodePtr，所有方法围绕指针进行。
而许多基本方法，则用继承进行实现，诸如拷贝、drop 等。
该程序的浏览，为之后的程序设计奠定了基本的流程开发。
至此，开(chao)发(xi)完毕。
接下来补足文档或者接着测试都可。
时常看看最原始的设计笔记，阅读 TDengine 源码，这两件事最好每天都有一个进展。
