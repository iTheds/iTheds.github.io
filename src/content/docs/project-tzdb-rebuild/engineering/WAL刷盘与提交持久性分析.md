---
title: "WAL刷盘与提交持久性分析"
description: "project-tzdb-rebuild 文档整理稿(源:raw_snapshot/docs/wal/TZDB 断电重启崩溃分析.md)"
---

## 结论摘要

当前实现具备较清晰的 `Flush` / `Sync` 分层，但事务提交时的默认语义更接近“写入 WAL 文件并刷新到文件句柄”，而不是“每次 COMMIT 都 fsync 持久化”。

更具体地说:

- COMMIT 会保证 COMMIT 记录被写入 WAL 文件路径。
- 普通情况下 COMMIT 并不会触发真正的 `fsync/fdatasync`。
- 数据页也不会在 COMMIT 时被强制写出到磁盘。
- 真正的 `Sync()` 更多发生在 checkpoint、关库或某些特殊路径。

## 刷盘抽象

### 文件同步接口

项目通过统一接口封装文件同步语义:

```cpp
virtual void FileSync(FileHandle &handle) = 0;
```

Linux/macOS 路径最终会落到:

- `F_FULLFSYNC`
- `fdatasync`
- `fsync`

这说明底层同步能力本身是存在的，问题不在于没有同步接口，而在于哪些调用链真正走到了 `Sync()`。

### BufferedFileWriter 的语义

`BufferedFileWriter` 中:

```cpp
void BufferedFileWriter::Flush() {
  fs.Write(*handle, data.get(), offset);
}

void BufferedFileWriter::Sync() {
  Flush();
  handle->Sync();
}
```

因此:

- `Flush()` 表示把缓冲内容写到文件句柄路径
- `Sync()` 表示 `Flush()` 之后再进行文件级同步

## WAL 写入路径

### 常规日志写入

普通 DML 日志和大多数 COMMIT 日志都会进入 `WALManager::WriteLogRecord()`。

对于普通大小的 record，常见流程是:

1. 写入 WAL buffer
2. 调用 `FlushLogBuffer()`
3. 非 shutdown 场景下执行 `log_writer_->Flush()`

这意味着:

- 数据通常会写到文件句柄
- 但并不一定同步到介质

### 大 record 特例

如果单条 record 超过 WAL buffer 大小，会进入“大 record 直接写”分支。这条路径在 `force_flush=true` 时会更容易走 `Sync()`。

但 COMMIT record 通常很小，因此实际运行中几乎不依赖这条路径来获得 durability。

## COMMIT 语义

事务提交路径中的核心行为可以概括为:

1. `txn_manager_->Commit(txn)` 更新事务和 tuple 元数据
2. `wal_integration_->LogTransactionCommit(txn)` 追加 COMMIT WAL

当前实现下:

- `txn_manager_->Commit(txn)` 主要是内存和页内元数据更新
- 这一步不会强制刷脏页
- `LogTransactionCommit(txn)` 虽然使用 `force_flush=true`，但正常分支通常只会把 WAL flush 到文件，不会执行 `Sync()`

因此，当前 COMMIT 更像:

| 项目 | 当前语义 |
| --- | --- |
| COMMIT 记录写入 WAL | 是 |
| COMMIT 时 WAL `Flush()` | 是 |
| COMMIT 时 WAL `Sync()` | 通常否 |
| COMMIT 时 page 写盘 | 否 |
| COMMIT 时 page `Sync()` | 否 |

## DML 日志的同步行为

普通 DML 日志默认 `force_flush=false`，因此:

- 正常大小 record 只在 buffer 满或其他条件下 `Flush()`
- 大 record 分支在非 shutdown 情况下通常也只是 `Flush()`

换句话说，DML 记录无论大小，默认都不是“立即 durable”的。

## BufferPool 与 WAL 顺序

`BufferPoolDisk` 在刷脏页前已经有 `FlushUpTo(page_lsn)` 这样的顺序控制，这是正确方向。

但当前 `FlushUpTo()` 的语义仍偏弱:

- 它保证 WAL 至少被写到文件路径
- 但不严格等价于“WAL 已经 fsync 到介质”

因此现状更准确地说是:

- 已经做到了“WAL 先写文件，再写 page”
- 还没有做到“WAL 先 durable，再写 page”

## 对断电场景的影响

在突然断电时，当前语义可能导致:

- WAL 尾部只写到 OS cache，尚未 durable
- 数据页部分写出
- catalog、page chain 与 WAL 之间处于中间状态

如果恢复代码对这些中间状态缺少边界检查和尾部截断机制，就会在下一次打开时崩溃。

## 当前实现的优点与缺口

### 优点

- 具备统一的同步抽象
- 具备 WAL buffer 和 Flush/Sync 分层
- BufferPool 已有 `FlushUpTo(page_lsn)` 的顺序意识
- checkpoint 和 shutdown 路径会触发更强的同步

### 缺口

- COMMIT 默认不做 `Sync()`
- DML 默认不做 `Sync()`
- `FlushUpTo()` 不等价于 durable
- 文档层面容易把 `Flush()` 和 `Sync()` 混为一谈

## 结论

如果要精确描述当前实现，应该说:

> 当前系统实现了 WAL 的写前顺序控制和基于 buffer 的刷盘机制，但默认提交语义并不是“每次 COMMIT 都 fsync 落盘”，而是依赖 checkpoint、关库和恢复机制共同保证一致性。
