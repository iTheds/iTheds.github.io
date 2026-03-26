---
title: "TSDBRust集成与调试日志按日期"
description: "联调、故障、客户端与集群同步问题的日期日志(保留原始表达)"
---

# TSDB Rust Integration And Debug Log By Date

> 说明:从 `tsdb_rust_technical_log_by_date_full.md` 按技术线拆分，按日期保留原始记录。

## [3.24] <a id="date-3-24"></a>

经过一天的拼凑，大致上已经编写完成。但是还没有测试，也不具备测试的条件。
接下来的工作就是调查数据库流式计算应该如何处理。
现在是两条路子，一个是对 TDengine 调研并且编写尽可能准确的文档，不需要太宽泛；
一个是对流式计算做出调研。

## [12.18] <a id="date-12-18"></a>

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

## [10.17] <a id="date-10-17"></a>

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

Valgrind 是一个非常强大的内存调试和性能分析工具，它能够检测多种内存和线程相关的问题。Valgrind 有多种不同的报告形式来帮助开发者找到并修复代码中的错误，以下是几种常见的 Valgrind 报告形式:
1. 内存泄漏(Memory Leak)报告

内存泄漏发生在程序未能正确释放分配的内存时。Valgrind 会检测出未释放的内存，并按其不同类型报告泄漏。

    definitely lost:程序丢失了对这部分内存的所有引用，无法再释放。确实是泄漏。
    indirectly lost:内存块本身没有丢失，但它是由其他丢失的内存块引用的，实际上也算是泄漏。
    possibly lost:程序分配的内存没有丢失，但指向该内存的指针可能不在程序的范围内或无法访问，可能是泄漏。
    still reachable:分配的内存仍然可达，程序结束时没有释放，但不一定是问题。通常是全局变量导致的。

## [10.23] <a id="date-10-23"></a>

1. 多表 java 崩溃；
2. 内存问题

## [10.29] <a id="date-10-29"></a>

~~第二次同步的时候， master 发送数据没有到 leave .~~
其实是从的没有关闭，导致的阻塞。还是 select 模型的问题。
io 模型必须加上一个关闭 fd 。
其实 io 模型已经关闭了。只是在从2 在等待主节点回消息，但是主节点其对从2 的主动连接未断开。

## [10.30] <a id="date-10-30"></a>

1. 客户端 QT 其默认会给 7030 发送消息，即使连接的是 3062.
2. 

客户端处理 REPLICA_DATA_SYNC_REQUEST 的过程，可能有问题，导致未同步。

后续问题:
1. 还是有 socket reset;
2. 同步的时候，比较慢，调整 io 所有 socket hd 为 非阻塞之后解决。 -- 但是还未知其原因；

有时间 jdbc 也测试一下。

日志可以采用 journalctl .
