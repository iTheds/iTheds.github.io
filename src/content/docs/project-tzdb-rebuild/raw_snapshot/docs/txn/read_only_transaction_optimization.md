---
title: "只读事务优化设计文档"
description: "只读事务优化设计文档"
---

# 只读事务优化设计文档

## 1. 问题背景

### 1.1 现状分析

当前 MVCC 事务管理器存在以下锁竞争问题：

```
┌─────────────────────────────────────────────────────────────────┐
│                    当前锁使用情况                                 │
├─────────────────────────────────────────────────────────────────┤
│  锁名称              │ 类型      │ 使用场景                      │
├─────────────────────────────────────────────────────────────────┤
│  txn_map_mutex_      │ TZMutex   │ Begin/Commit/Abort/GetTxn    │
│  version_info_mutex_ │ TZMutex   │ GetVersionLink/UpdateVersion │
│  commit_mutex_       │ TZMutex   │ Commit/Abort                 │
└─────────────────────────────────────────────────────────────────┘
```

**问题**：所有事务(包括只读事务)都需要竞争这些互斥锁，导致：
- 多个只读事务无法并发执行
- 只读事务的 Commit 需要获取 `commit_mutex_`，造成不必要的等待

### 1.2 性能瓶颈

测试场景(`sql_throughput.cpp`)：
- 20 个线程并发执行只读查询
- 每个线程使用 `TRANS_TYPE_READ_ONLY` 事务
- 当前实现：所有线程串行竞争锁

## 2. 设计目标

1. **只读事务并发**：多个只读事务可以并发读取，不互相阻塞
2. **只读事务快速提交**：只读事务 Commit 不需要获取写锁
3. **写事务正确性**：写事务仍然保持串行化提交
4. **RAII 锁管理**：所有锁操作必须使用 RAII 模式，避免锁泄漏

## 3. 技术方案

### 3.1 读写锁替换互斥锁

将关键的互斥锁改为读写锁(`shared_mutex`)：

| 锁 | 改动 | 读操作 | 写操作 |
|---|---|---|---|
| `txn_map_mutex_` | `TZMutex` → `shared_mutex` | `lock_shared()` | `lock()` |
| `version_info_mutex_` | `TZMutex` → `shared_mutex` | `lock_shared()` | `lock()` |

### 3.2 操作分类

#### 读操作(使用共享锁)
- `GetVersionLink()` - 读取版本链
- `GetUndoLogOptional()` - 读取 undo log
- `GetTransaction()` - 获取事务对象
- `ListActiveTxnIds()` - 列出活动事务

#### 写操作(使用独占锁)
- `Begin()` - 创建新事务(修改 txn_map_)
- `Commit()` 写事务 - 更新 tuple 元数据
- `Abort()` - 回滚事务
- `UpdateVersionLink()` - 更新版本链
- `GarbageCollection()` - 垃圾回收

### 3.3 只读事务快速路径

```cpp
auto MVCCTransactionManager::Commit(Transaction *txn_ref) -> bool {
    auto txn = static_cast<MVCCTransaction *>(txn_ref);
    
    // 只读事务快速路径
    if (txn->GetTransactionType() == TransactionType::TRANS_TYPE_READ_ONLY) {
        // 不需要获取任何锁
        txn->commit_ts_ = last_commit_ts_.load();
        txn->state_ = TransactionState::COMMITTED;
        running_txns_.RemoveTxn(txn->read_ts_);
        return true;
    }
    
    // 写事务正常路径...
}
```

### 3.4 RAII 锁包装器

使用已有的 `shared_lock` 模板类(定义在 `tz_mutex.h`)：

```cpp
// 读锁 RAII
template <class MutexType>
class shared_lock {
 public:
  explicit shared_lock(MutexType &mutex) : mutex_(mutex), locked_(true) { 
    mutex_.lock_shared(); 
  }
  ~shared_lock() {
    if (locked_) {
      mutex_.unlock_shared();
    }
  }
  // ...
};

// 写锁 RAII(使用现有的 lock_guard)
template <class MutexType>
class lock_guard {
 public:
  explicit lock_guard(MutexType &mutex) : mutex_(mutex) { mutex_.lock(); }
  ~lock_guard() { mutex_.unlock(); }
  // ...
};
```

## 4. 实现细节

### 4.1 文件修改清单

| 文件 | 修改内容 |
|------|----------|
| `transaction_manager_interface.h` | `txn_map_mutex_` 改为 `shared_mutex` |
| `transaction_manager.h` | `version_info_mutex_` 改为 `shared_mutex` |
| `transaction_manager.cpp` | 优化 Begin/Commit/Abort，使用 RAII |
| `transaction_manager_impl.cpp` | 优化 GetVersionLink 等，使用 RAII |

### 4.2 锁使用规范

**必须使用 RAII**：
```cpp
// ✅ 正确：使用 RAII
{
    shared_lock<shared_mutex> lck(txn_map_mutex_);
    // 读操作...
} // 自动释放

// ❌ 错误：手动 lock/unlock
txn_map_mutex_.lock_shared();
// 读操作...
txn_map_mutex_.unlock_shared();  // 可能因异常而泄漏
```

### 4.3 并发安全分析

```
┌─────────────────────────────────────────────────────────────────┐
│                    并发场景分析                                   │
├─────────────────────────────────────────────────────────────────┤
│  场景                        │ 锁类型    │ 是否阻塞              │
├─────────────────────────────────────────────────────────────────┤
│  只读事务 A 读 + 只读事务 B 读 │ 共享+共享 │ 不阻塞(并发)        │
│  只读事务 A 读 + 写事务 B 写   │ 共享+独占 │ 阻塞(等待读完成)    │
│  写事务 A 写 + 写事务 B 写     │ 独占+独占 │ 阻塞(串行)          │
│  只读事务 Commit              │ 无锁      │ 不阻塞                │
│  写事务 Commit                │ 独占      │ 阻塞其他写            │
└─────────────────────────────────────────────────────────────────┘
```

## 5. 实现进度

### 5.1 已完成

- [x] 设计文档编写
- [x] `txn_map_mutex_` 改为 `shared_mutex`
- [x] `version_info_mutex_` 改为 `shared_mutex`
- [x] 只读事务 Commit 快速路径
- [x] 读操作使用共享锁
- [x] 写操作使用独占锁

### 5.2 已完成

- [x] **RAII 锁重构**：所有锁操作已改为 RAII 模式
  - `transaction_manager.cpp`: Begin/Commit/Abort/GC/GetTransaction ✓
  - `transaction_manager_impl.cpp`: UpdateVersionLink/GetVersionLink/GetUndoLogOptional ✓
  - `transaction_manager_interface.h`: ListActiveTxnIds ✓

### 5.3 待完成

- [ ] 单元测试
- [ ] 性能测试对比
- [ ] 代码审查

## 6. 进一步优化方向

### 6.1 ✅ Watermark 并发安全问题(已修复)

**问题**：`Watermark` 类的 `AddTxn/RemoveTxn/UpdateCommitTs` 没有内部锁保护。

**解决方案**：已给 `Watermark` 类添加内部 `TZMutex` 锁保护所有操作。

### 6.2 主流数据库只读事务优化参考

#### PostgreSQL 方案
- **Snapshot Isolation (SI)**：读操作不阻塞写，写操作不阻塞读
- **Read View**：每个事务获取一个快照视图，通过 `xmin/xmax` 判断可见性
- **无锁读取**：读操作只需检查 tuple 的事务状态，不需要获取锁
- **Commit Log (clog)**：使用共享内存存储事务状态，快速查询

#### MySQL InnoDB 方案
- **不分配事务 ID**：只读事务不分配 `TRX_ID`，减少内部数据结构开销
- **不进入事务列表**：AC-NL-RO (Auto-Commit, Non-Locking, Read-Only) 事务不进入 `SHOW ENGINE INNODB STATUS`
- **延迟升级**：事务开始时假设为只读，直到执行写操作才升级为读写事务
- **Read View 优化**：只读事务共享 Read View，减少创建开销

#### SQLite WAL 模式方案
- **End Mark**：每个读事务记录 WAL 的结束位置，读取时只看该位置之前的数据
- **无锁并发读**：多个读事务可以并发执行，互不阻塞
- **单写多读**：只有一个写事务，但不阻塞读事务
- **WAL-Index**：使用共享内存索引加速页面查找

### 6.3 可借鉴的优化策略

#### 策略 1：只读事务不分配事务 ID(参考 MySQL)

```cpp
auto MVCCTransactionManager::Begin(...) -> Transaction * {
  bool is_read_only = (params.type == TRANS_TYPE_READ_ONLY);
  
  if (is_read_only) {
    // 只读事务：不分配事务 ID，不插入 txn_map_
    auto txn = make_uniq<MVCCTransaction>(INVALID_TXN_ID, this, params, isolation_level);
    txn->read_ts_ = last_commit_ts_.load();
    running_txns_.AddTxn(txn->read_ts_);
    return txn.release();  // 调用方负责释放
  }
  
  // 写事务：正常流程
  lock_guard<shared_mutex> lck(txn_map_mutex_);
  // ...
}
```

**优点**：
- 减少 `txn_map_` 竞争
- 减少 GC 压力
- 只读事务 Begin/Commit 完全无锁

**缺点**：
- 需要修改事务生命周期管理
- 调用方需要负责释放只读事务对象

#### 策略 2：延迟事务 ID 分配(参考 MySQL)

```cpp
auto MVCCTransactionManager::Begin(...) -> Transaction * {
  // 所有事务开始时都假设为只读
  auto txn = make_uniq<MVCCTransaction>(INVALID_TXN_ID, this, params, isolation_level);
  txn->read_ts_ = last_commit_ts_.load();
  running_txns_.AddTxn(txn->read_ts_);
  
  // 延迟分配事务 ID，直到第一次写操作
  return txn.release();
}

// 在第一次写操作时调用
void MVCCTransactionManager::UpgradeToWriteTxn(Transaction *txn) {
  lock_guard<shared_mutex> lck(txn_map_mutex_);
  auto txn_id = next_txn_id_.fetch_add(1);
  txn->txn_id_ = txn_id;
  txn_map_.emplace(txn_id, std::shared_ptr<Transaction>(txn));
}
```

#### 策略 3：Commit 锁范围优化

```cpp
auto MVCCTransactionManager::Commit(Transaction *txn_ref) -> bool {
  // ...
  
  // 1. 先在锁外收集 commit_ts
  auto commit_ts = last_commit_ts_.fetch_add(1) + 1;
  txn->commit_ts_ = commit_ts;
  
  // 2. 更新 tuple 元数据(无需持有 txn_map_mutex_)
  for (const auto &table : txn->write_set_) {
    // tuple 有自己的锁保护
    // ...
  }
  
  // 3. 只在更新事务状态时持锁
  {
    lock_guard<shared_mutex> lck(txn_map_mutex_);
    txn->state_ = TransactionState::COMMITTED;
  }
  
  running_txns_.UpdateCommitTs(commit_ts);
  running_txns_.RemoveTxn(txn->read_ts_);
  return true;
}
```

### 6.4 优化优先级建议

| 优先级 | 优化项 | 复杂度 | 收益 | 状态 |
|--------|--------|--------|------|------|
| P0 | Watermark 并发安全 | 低 | 正确性 | ✅ 已完成 |
| P1 | Commit 锁范围优化 | 中 | 高 | ✅ 已完成 |
| P2 | 只读事务不入 txn_map_ | 高 | 高 | ❌ 不适合当前架构 |
| P3 | 延迟事务 ID 分配 | 高 | 中 | ❌ 不适合当前架构 |

### 6.5 架构选择说明

经过分析，当前代码更适合 **PostgreSQL 风格**的优化方案，原因：

1. **undo log 访问依赖 txn_map_**：`transaction.cpp` 中 Update 操作需要通过 `txn_id` 查找其他事务的 undo log
2. **改动范围小**：只需要改锁类型，不需要重构事务生命周期
3. **风险低**：不会引入新的并发问题

MySQL 方案(只读事务不入 txn_map_)虽然理论上更优，但需要大幅重构，不适合当前代码结构。

## 7. PostgreSQL MVCC 深入分析

### 7.1 PostgreSQL 核心机制

| 概念 | PostgreSQL | 当前实现 |
|------|------------|----------|
| **版本标识** | `xmin/xmax`(创建/删除事务ID) | `TupleMeta.ts_` + undo log |
| **快照** | `snapshot.xmin/xmax/xip` | `read_ts_` |
| **可见性判断** | 基于 xmin/xmax + 事务状态 | 基于 ts + undo log 遍历 |
| **旧版本存储** | 表内(dead tuple) | undo log(类似 MySQL) |
| **清理机制** | VACUUM | GarbageCollection |

### 7.2 PostgreSQL 快照结构

```
Snapshot {
    xmin: 最早活跃事务 ID(事件地平线)
    xmax: 下一个可用事务 ID
    xip:  活跃事务 ID 列表
}
```

**可见性规则**：
1. `xmin` 事务已提交 且 在快照创建前提交
2. `xmax` 为空 或 `xmax` 事务未提交 或 在快照创建后提交

### 7.3 当前实现 vs PostgreSQL

| 方面 | PostgreSQL | 当前实现 | 差距 |
|------|------------|----------|------|
| 快照获取 | 无锁(读共享内存) | 无锁(原子读 `last_commit_ts_`) | ✅ 相当 |
| 可见性判断 | O(1) 查 clog | O(n) 遍历 undo log | ⚠️ 可优化 |
| 事务状态查询 | clog(共享内存) | `txn_map_` 查询 | ⚠️ 可优化 |
| 活跃事务跟踪 | ProcArray | `Watermark` | ✅ 相当 |

### 7.4 进一步优化方向

#### P4: 事务状态缓存(Commit Log)

PostgreSQL 使用 **clog**(commit log)缓存事务状态，避免每次都查询事务对象。

```cpp
// 当前：每次都要查 txn_map_
auto txn = txn_map_.find(txn_id);
auto state = txn->GetTransactionState();

// 优化：使用 clog 缓存
// clog 是一个紧凑的位图，每个事务只需 2 bit
enum TxnStatus { IN_PROGRESS = 0, COMMITTED = 1, ABORTED = 2 };
class CommitLog {
    std::atomic<uint8_t> status_[MAX_TXN_ID / 4];  // 2 bit per txn
    
    TxnStatus GetStatus(txn_id_t txn_id) {
        // 无锁读取
        return (status_[txn_id / 4] >> ((txn_id % 4) * 2)) & 0x3;
    }
};
```

**收益**：可见性判断从 O(n) 降到 O(1)

#### P5: Hint Bits 优化

PostgreSQL 在 tuple 上缓存可见性结果(hint bits)，避免重复计算。

```cpp
struct TupleMeta {
    timestamp_t ts_;
    bool is_deleted_;
    // 新增 hint bits
    bool xmin_committed_ : 1;  // xmin 事务已提交
    bool xmax_committed_ : 1;  // xmax 事务已提交
};
```

**收益**：热点数据的可见性判断变成 O(1)

### 7.5 优化优先级更新

| 优先级 | 优化项 | 复杂度 | 收益 | 状态 |
|--------|--------|--------|------|------|
| P0 | Watermark 并发安全 | 低 | 正确性 | ✅ 已完成 |
| P1 | Commit 锁范围优化 | 中 | 高 | ✅ 已完成 |
| P1.5 | Begin 锁范围优化 | 低 | 中 | ✅ 已完成 |
| P4 | Commit Log(事务状态缓存) | 高 | 高 | 📋 待评估 |
| P5 | Hint Bits | 中 | 中 | 📋 待评估 |

## 8. 参考

- `src/inc/common/rwlatch.h` - 读写锁实现
- `src/inc/os/sync/tz_mutex.h` - 锁 RAII 包装器
- `src/inc/transaction/mvcc/watermark.h` - Watermark 实现
- `src/transaction/mvcc/execute_common.cpp` - 可见性判断实现
- `tests/performance_test/sql_performance_test/sql_throughput.cpp` - 性能测试
- [PostgreSQL MVCC Internals](https://postgrespro.com/blog/pgsql/5967899) - PG 快照机制
- [PostgreSQL Concurrency](https://www.interdb.jp/pg/pgsql05.html) - PG 并发控制
