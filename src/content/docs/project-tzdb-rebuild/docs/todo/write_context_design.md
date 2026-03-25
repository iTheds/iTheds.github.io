---
title: "WriteContext 接口改造设计文档"
description: "WriteContext 接口改造设计文档"
---

# WriteContext 接口改造设计文档

## 1. 背景

### 1.1 问题描述

当前 WAL 记录流程存在并发安全问题：

```text
execute_common::InsertTuple
  → table_heap->InsertTuple
    → storage_->Write(...)      // 页面锁在这里获取并释放
  → txn->OnInsert(...)          // ⚠️ 此时页面锁已释放！
    → WALTxnObserver::OnInsert
      → wal_->LogInsert
        → GetPhysicalLayout(rid)  // ❌ 锁外获取 layout，可能被其他事务修改
```

### 1.2 核心问题

1. **GetPhysicalLayout 在锁外调用**：页面锁释放后，其他事务可能修改页面，导致获取的 layout 不一致
2. **WAL 记录在锁外**：违反 ARIES 的 WAL-before-data 原则
3. **LSN 设置在锁外**：`MarkPageLSN` 在锁外调用，可能被覆盖

### 1.3 现有架构的问题

- `StorageInterface::Write()` 接口参数有限，无法传递足够的上下文
- 观察者模式（`WALTxnObserver`）导致 WAL 记录与存储操作分离
- 每次需要新参数都要修改接口签名，影响所有实现类

## 2. 设计目标

1. **在锁内完成 WAL 记录**：确保 layout 获取和 WAL 写入都在页面锁保护下
2. **引入 WriteContext**：封装写入上下文，避免频繁修改接口
3. **向后兼容**：老代码不需要改动
4. **可扩展**：未来新增参数只需修改 Context 结构

## 3. 方案设计

### 3.1 WriteContext 结构

```cpp
// inc/storage/write_context.h

#pragma once

#include "common/types.h"

namespace tzdb {

class Transaction;
class WALIntegration;

/**
 * WriteContext - 存储引擎写入操作的上下文
 * 
 * 封装写入操作所需的事务、WAL、表信息等上下文，
 * 避免频繁修改 StorageInterface 接口签名。
 */
struct WriteContext {
  // ===== 核心字段 =====
  Transaction *txn = nullptr;           // 事务上下文（用于 WAL 事务关联）
  table_oid_t table_id = 0;             // 表 ID（用于 WAL 记录）
  
  // ===== 可选字段 =====
  // WALIntegration *wal = nullptr;     // 外部 WAL（DiskEngine 自己有，通常不需要）
  // bool skip_wal = false;             // 跳过 WAL（批量导入场景）
  // bool skip_lock = false;            // 跳过锁（单线程场景）
  
  // ===== 构造函数 =====
  WriteContext() = default;
  
  WriteContext(Transaction *t, table_oid_t tid) 
      : txn(t), table_id(tid) {}
  
  // 便捷判断
  bool HasTransaction() const { return txn != nullptr; }
  bool HasTableId() const { return table_id != 0; }
};

}  // namespace tzdb
```

### 3.2 StorageInterface 接口变化

```cpp
// inc/storage/storage_interface.h

class StorageInterface {
 public:
  // ===== 新接口（推荐使用）=====
  
  // Write with context
  virtual Rid Write(const Schema *schema, const Tuple &tuple, const TupleMeta &meta,
                    Rid &last_row_id, const WriteContext &ctx);
  
  // Update with context
  virtual RetCode Update(const Schema *schema, Rid *rid, const Tuple &tuple,
                         const TupleMeta &meta, const WriteContext &ctx);
  
  // Delete with context  
  virtual RetCode Delete(Rid *rid, const WriteContext &ctx);
  
  // ===== 兼容接口（保留，内部调用新接口）=====
  
  // 旧的 Write 接口，调用新接口
  virtual Rid Write(const Schema *schema, const Tuple &tuple, const TupleMeta &meta,
                    Rid &last_row_id, Transaction *txn) {
    return Write(schema, tuple, meta, last_row_id, WriteContext(txn, 0));
  }
  
  // WriteRaw 保持不变（底层接口，不需要 WAL）
  virtual Rid WriteRaw(const void *record, size_t len, const TupleMeta &meta,
                       Rid &last_row_id, Transaction *txn = nullptr);
};
```

### 3.3 DiskEngine 实现变化

```cpp
// storage/disk/disk_engine.cpp

Rid DiskEngine::Write(const Schema *schema, const Tuple &tuple, const TupleMeta &meta,
                      Rid &last_row_id, const WriteContext &ctx) {
  // ... 页面分配逻辑 ...
  
  auto page_guard = FetchPageWrite(last_row_id.GetPageId());
  auto *tp = page_guard.AsMut<TablePage>();
  
  // ... 写入数据 ...
  Option<uint16_t> slot_id = InsertInline(tp, schema, tuple.GetData(), tuple.GetLength(), meta);
  
  // ===== 在锁内记录 WAL =====
  if (wal_integration_ && ctx.HasTransaction() && ctx.HasTableId()) {
    // 在锁内获取 layout
    PhysicalLayout layout;
    layout.tuple_offset_ = std::get<0>(tp->header.tuple_info_[slot_id.value()]);
    layout.tuple_length_ = std::get<1>(tp->header.tuple_info_[slot_id.value()]);
    layout.page_entry_num_ = tp->header.entry_num;
    
    // 检查 overflow
    if (has_overflow) {
      layout.has_overflow_ = true;
      layout.overflow_head_ = overflow_head;
      layout.overflow_length_ = overflow_length;
      layout.overflow_pages_ = CollectOverflowPages(overflow_head);
    }
    
    // 记录 WAL 并设置 LSN
    Rid rid(ctx.table_id, last_row_id.GetPageId(), slot_id.value());
    lsn_t lsn = wal_integration_->LogInsertWithLayout(ctx.txn, ctx.table_id, rid, tuple, layout);
    tp->SetLSN(lsn);
  }
  
  page_guard.Drop();  // 释放锁
  
  last_row_id.data.s.slot_num_ = slot_id.value();
  return {last_row_id.GetTableId(), last_row_id.GetPageId(), last_row_id.GetSlotNum()};
}
```

### 3.4 WALIntegration 变化

```cpp
// storage/wal/wal_integration.h

class WALIntegration {
 public:
  // 新接口：直接传入 layout，不再内部调用 GetPhysicalLayout
  lsn_t LogInsertWithLayout(Transaction *txn, table_oid_t table_id, const Rid &rid,
                            const Tuple &tuple, const PhysicalLayout &layout);
  
  lsn_t LogUpdateWithLayout(Transaction *txn, table_oid_t table_id, const Rid &rid,
                            const Tuple &before_image, const Tuple &after_image,
                            const PhysicalLayout &layout);
  
  lsn_t LogDeleteWithLayout(Transaction *txn, table_oid_t table_id, const Rid &rid,
                            const Tuple &before_image, const PhysicalLayout &layout);
  
  // 旧接口保留，但标记为 deprecated
  [[deprecated("Use LogInsertWithLayout instead")]]
  lsn_t LogInsert(Transaction *txn, table_oid_t table_id, const Rid &rid, const Tuple &tuple);
};
```

### 3.5 移除 WALTxnObserver

**变更**：完全移除 `WALTxnObserver`，简化架构。

**理由**：

- DiskStorage 在 `Write()` 内部直接记录 WAL，不需要观察者
- MemoryStorage 不需要 WAL
- 观察者模式增加了不必要的复杂性和间接调用

**删除的代码**：

- `kernel/db.cpp` 中的 `WALTxnObserver` 类
- `Transaction` 中对 `OnInsert/OnUpdate/OnDelete` 的调用（WAL 相关部分）

### 3.6 TableHeap 调用变化

```cpp
// kernel/table_heap.cpp

auto TableHeap::InsertTuple(const TupleMeta &meta, const Tuple &tuple, 
                            LockManager *lock_mgr, Transaction *txn) -> Option<Rid> {
  tzdb::lock_guard<TZMutex> guard(latch_);
  EnsureLastRidInitialized();
  
  // 使用 WriteContext 传递上下文
  WriteContext ctx(txn, table_id_);
  Rid rid = storage_->Write(schema_.get(), tuple, meta, last_rid_, ctx);
  
  return rid;
}
```

## 4. 调用流程对比

### 4.1 旧流程（有问题）

```text
execute_common::InsertTuple
  → TableHeap::InsertTuple
    → storage_->Write(txn)
      → 写入数据
      → 释放锁                    // ⚠️ 锁已释放
    → return rid
  → txn->OnInsert(rid)            // ⚠️ 锁外
    → WALTxnObserver::OnInsert
      → wal_->LogInsert
        → GetPhysicalLayout(rid)  // ❌ 锁外获取，不安全
        → 记录 WAL
        → MarkPageLSN             // ❌ 锁外设置，不安全
```

### 4.2 新流程（安全）

```text
execute_common::InsertTuple
  → TableHeap::InsertTuple
    → storage_->Write(ctx)
      → 写入数据
      → 在锁内获取 layout         // ✅ 锁内
      → wal_->LogInsertWithLayout // ✅ 锁内
      → page.SetLSN(lsn)          // ✅ 锁内
      → 释放锁
    → return rid
  → txn->OnInsert(rid)
    → WALTxnObserver::OnInsert
      → (DiskStorage 跳过，已记录) // ✅ 不重复
```

## 5. 兼容性考虑

### 5.1 向后兼容

| 场景 | 处理方式 |
|------|---------|
| 旧代码调用 `Write(txn)` | 自动转换为 `Write(WriteContext(txn, 0))`，table_id=0 时不记录 WAL |
| 测试代码调用 `WriteRaw` | 保持不变，不涉及 WAL |
| MemoryStorage | 不写 WAL（内存表无需持久化） |
| DiskStorage | 在 `Write()` 内部锁内记录 WAL |

### 5.2 迁移策略

1. **Phase 1**：添加 `WriteContext` 和新接口，保留旧接口
2. **Phase 2**：修改 `TableHeap` 等调用方使用新接口
3. **Phase 3**：修改 `WALTxnObserver` 跳过 DiskStorage
4. **Phase 4**：标记旧接口为 deprecated
5. **Phase 5**（可选）：移除旧接口

## 6. 测试计划

### 6.1 单元测试

- [ ] `WriteContext` 构造和字段访问
- [ ] `DiskEngine::Write` 使用 `WriteContext`
- [ ] WAL 记录在锁内完成（通过 mock 验证）
- [ ] LSN 正确设置

### 6.2 集成测试

- [ ] 完整的 INSERT/UPDATE/DELETE 流程
- [ ] 崩溃恢复测试
- [ ] 并发写入测试

### 6.3 回归测试

- [ ] 现有 `disk_engine` 测试全部通过
- [ ] 现有 WAL 测试全部通过

## 7. 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 接口变更影响范围大 | 中 | 保留旧接口，渐进迁移 |
| WAL 记录逻辑变化 | 高 | 充分测试，保持语义一致 |
| 性能影响 | 低 | layout 获取本来就在锁内 |

## 8. 附录

### 8.1 相关文件

- `inc/storage/write_context.h`（新建）
- `inc/storage/storage_interface.h`（修改）
- `storage/disk/disk_engine.cpp`（修改）
- `storage/disk/disk_engine.h`（修改）
- `storage/wal/wal_integration.h`（修改）
- `storage/wal/wal_integration.cpp`（修改）
- `kernel/table_heap.cpp`（修改）
- `kernel/db.cpp`（修改 WALTxnObserver）

### 8.2 参考

- ARIES 论文：WAL-before-data 原则
- 现有 `SetNextPageRecord` 修复：已在锁内记录 WAL
