---
title: "Overflow 机制优化设计文档"
description: "Overflow 机制优化设计文档"
---

# Overflow 机制优化设计文档

## 1. 背景

### 1.1 问题描述

当前系统中 `Write` 和 `WriteRaw` 使用不同的 overflow 触发条件：

| 方法 | 触发条件 | 问题 |
|------|---------|------|
| `WriteRaw` | `len > max_payload_empty_page` (~8100B) | ✅ 合理 |
| `Write` | `len > FIXED_OVERFLOW_INLINE_PREFIX` (64B) | ❌ 过于激进 |

### 1.2 影响

`Write` 的 64 字节阈值导致几乎所有记录都触发 overflow，造成：

- **存储效率低**：大量额外页面分配用于存储 overflow 数据
- **读取性能差**：读取时需要额外 IO 读取 overflow 链
- **内存压力大**：缓冲池需要缓存更多页面
- **写入开销高**：每次写入都需要分配 overflow 页面

### 1.3 现状

```
WriteRaw: 记录 > ~8100B 才触发 overflow  → 合理
Write:    记录 > 64B 就触发 overflow    → 不合理
```

## 2. 设计目标

1. **统一 overflow 触发条件**：`Write` 和 `WriteRaw` 使用相同的判断逻辑
2. **提升存储效率**：减少不必要的 overflow 页面分配
3. **提升读取性能**：减少 overflow 链读取
4. **保持向后兼容**：已有数据的读取不受影响
5. **保留扩展能力**：未来可支持列存优化（按列拆分到 overflow）

## 3. 方案设计

### 3.1 新的 Overflow 触发条件

将 `Write` 的 overflow 判断从固定 64 字节阈值改为基于页面可用空间：

```cpp
// 旧逻辑（Write）
const bool needs_overflow = NeedsOverflow(tuple.GetLength());
// NeedsOverflow: return len > FIXED_OVERFLOW_INLINE_PREFIX;  // 64 字节

// 新逻辑（与 WriteRaw 一致）
const uint32_t max_payload_empty_page = page_size 
    - static_cast<uint32_t>(TablePageHeader::HEADER_FIXED_SIZE)
    - static_cast<uint32_t>(TablePageHeader::TUPLE_INFO_SIZE);
const bool needs_overflow = (tuple.GetLength() > max_payload_empty_page);
```

### 3.2 Inline Prefix 大小

当触发 overflow 时，inline prefix 仍使用 `FIXED_OVERFLOW_INLINE_PREFIX` (64B)：

- 保证 overflow 页链的数据对齐
- 保持读取逻辑简单
- 便于快速访问记录的前缀数据（如主键）

### 3.3 修改范围

| 文件 | 函数 | 修改内容 |
|------|------|---------|
| `storage/disk/disk_engine.cpp` | `Write()` | overflow 判断条件 |
| `storage/disk/disk_engine.cpp` | `Update()` | overflow 判断条件 |
| `storage/disk/disk_engine.cpp` | `NeedsOverflow()` | 删除或标记废弃 |
| `storage/disk/disk_engine.cpp` | `BuildInlinePrefix()` | 可能需要调整 |
| `storage/disk/disk_engine.cpp` | `BuildOverflowTail()` | 可能需要调整 |

### 3.4 读取兼容性

`ReadRaw` 和 `Read` 通过检测 `OverflowPtr` 的 magic 标志来判断是否有 overflow：

```cpp
if (ptr->flags_ == OVERFLOW_PTR_MAGIC) {
  // 有 overflow，读取 overflow 链
}
```

**不依赖写入时的阈值**，因此：
- 旧数据（64B 阈值写入）可正常读取 ✅
- 新数据（页面大小阈值写入）可正常读取 ✅

### 3.5 WAL 兼容性

WAL 记录中包含 `PhysicalLayout`，其中 `has_overflow_` 标志由写入时的实际行为决定：

- Redo 时根据 `has_overflow_` 恢复 overflow 链
- 不依赖阈值判断，只依赖实际记录的布局

## 4. 详细设计

### 4.1 Write() 修改

```cpp
Rid DiskEngine::Write(const Schema *schema, const Tuple &tuple, const TupleMeta &meta, 
                      Rid &last_row_id, Transaction *txn) {
  // ... 前置逻辑 ...
  
  const uint32_t page_size = buffer_pool_->GetPageSize();
  const uint32_t max_payload_empty_page = page_size 
      - static_cast<uint32_t>(TablePageHeader::HEADER_FIXED_SIZE)
      - static_cast<uint32_t>(TablePageHeader::TUPLE_INFO_SIZE);

  // 新的 overflow 判断：只有超过页面可用空间才触发
  const bool needs_overflow = (tuple.GetLength() > max_payload_empty_page);

  if (needs_overflow) {
    // overflow 逻辑保持不变
    auto inline_prefix = BuildInlinePrefix(schema, tuple);
    auto overflow_tail = BuildOverflowTail(schema, tuple);
    // ...
  } else {
    // inline 逻辑保持不变
    slot_id = InsertInline(tp, schema, tuple.GetData(), tuple.GetLength(), meta);
  }
  // ...
}
```

### 4.2 Update() 修改

```cpp
TZDB_RET DiskEngine::Update(const Schema *schema, Rid *rid, const Tuple &tuple, 
                            const TupleMeta &tuple_meta, Transaction *txn) {
  // ... 前置逻辑 ...
  
  const uint32_t page_size = bp->GetPageSize();
  const uint32_t max_payload_empty_page = page_size 
      - static_cast<uint32_t>(TablePageHeader::HEADER_FIXED_SIZE)
      - static_cast<uint32_t>(TablePageHeader::TUPLE_INFO_SIZE);

  // 新的 overflow 判断
  const bool new_is_hybrid = (tuple.GetLength() > max_payload_empty_page);
  
  // ... 后续逻辑保持不变 ...
}
```

## 5. 测试计划

### 5.1 功能测试

| 测试项 | 描述 | 预期结果 |
|-------|------|---------|
| 小记录写入 | 写入 100B 记录 | 不触发 overflow |
| 中等记录写入 | 写入 2000B 记录 | 不触发 overflow |
| 大记录写入 | 写入 5000B 记录 | 触发 overflow |
| 边界测试 | 写入 ~3900B 记录 | 边界行为正确 |
| 混合读写 | 新旧数据混合 | 都能正确读取 |

### 5.2 兼容性测试

| 测试项 | 描述 | 预期结果 |
|-------|------|---------|
| 旧数据读取 | 读取 64B 阈值写入的数据 | 正常读取 |
| WAL Redo | 恢复包含 overflow 的记录 | 正常恢复 |
| WAL Undo | 回滚包含 overflow 的记录 | 正常回滚 |

### 5.3 性能测试

| 测试项 | 指标 | 对比 |
|-------|------|------|
| 写入吞吐量 | records/sec | 优化前 vs 优化后 |
| 读取延迟 | μs/record | 优化前 vs 优化后 |
| 页面使用量 | pages/1000records | 优化前 vs 优化后 |

## 6. 风险评估

### 6.1 低风险

- **读取兼容性**：通过 magic 标志判断，不依赖阈值
- **WAL 兼容性**：通过 PhysicalLayout 记录实际布局

### 6.2 中风险

- **已有数据迁移**：旧数据仍使用 overflow，新数据不使用
  - 缓解：不影响正确性，只是存储效率不同

### 6.3 高风险 ⚠️

#### 6.3.1 WAL 记录与 GetPhysicalLayout 不在同一锁内

**问题描述**：

当前 WAL 记录流程：

```cpp
// 1. 获取页面锁，执行写入
auto page_guard = FetchPageWrite(page_id);
// ... 写入数据 ...

// 2. 释放页面锁
page_guard.Drop();

// 3. 获取 PhysicalLayout（此时页面可能已被其他事务修改！）
PhysicalLayout layout = GetPhysicalLayout(rid);

// 4. 写入 WAL
wal_manager->WriteLogRecord(..., layout);
```

**风险**：

- 步骤 2 和步骤 3 之间存在窗口期
- 其他事务可能修改同一页面，导致 `GetPhysicalLayout` 获取到错误的布局
- Redo 时使用错误的 `tuple_offset_` 和 `tuple_length_` 会导致数据损坏

**影响范围**：

- `Write()` 中的 WAL 记录
- `Update()` 中的 WAL 记录
- `Delete()` 中的 WAL 记录

**解决方案**：

```cpp
// 方案 A：在持有页面锁时获取 layout 并写入 WAL
auto page_guard = FetchPageWrite(page_id);
// ... 写入数据 ...
PhysicalLayout layout = GetPhysicalLayoutWithGuard(page_guard, rid);
lsn_t lsn = wal_manager->WriteLogRecord(..., layout);
page_guard.SetLSN(lsn);
page_guard.Drop();

// 方案 B：在写入时直接记录 layout 信息，避免二次查询
// 写入时已知 tuple_offset_ 和 tuple_length_，直接传递给 WAL
```

#### 6.3.2 SetNextPageRecord 的 MarkPageLSN 在锁外执行

**问题描述**：

`EnsureSpaceOrAdvance()` 中的调用顺序：

```cpp
tp->header.next_page_id = next_page_id;  // 1. 在锁内修改页面
pg.MarkDirty();
pg.Drop();                                // 2. 释放锁 ⚠️

if (wal_integration_ != nullptr) {
  wal_integration_->LogSetNextPage(txn, old_page_id, next_page_id);  // 3. 锁外记录 WAL
}
```

`LogSetNextPage` 内部会调用：

```cpp
MarkPageLSN(prev_page_id, lsn);  // 需要重新获取页面锁来更新 LSN
OnPageModified(prev_page_id, lsn);
```

**风险**：

- 页面锁已释放，其他事务可能正在修改该页面
- `MarkPageLSN` 时页面状态可能已改变
- LSN 可能被其他事务覆盖，破坏 WAL-before-data 原则

**对比 PageAllocRecord（正确实现）**：

```cpp
auto guard = buffer_pool_->NewPageGuarded(&page_id);  // 持有锁
page->InitPage();
if (wal_integration_ != nullptr) {
  lsn_t lsn = wal_manager->WriteLogRecord(record, false);
  page->SetLSN(lsn);  // ✅ 在锁内设置 LSN
}
// guard 析构时释放锁
```

**解决方案**：

```cpp
// 方案：在释放锁之前记录 WAL 并设置 LSN
tp->header.next_page_id = next_page_id;
pg.MarkDirty();

// 在锁内记录 WAL
if (wal_integration_ != nullptr) {
  lsn_t lsn = wal_integration_->LogSetNextPage(txn, old_page_id, next_page_id);
  tp->SetLSN(lsn);  // 在锁内设置 LSN
}

pg.Drop();  // 释放锁
```

#### 6.3.3 页面级 WAL 缺少事务概念

**问题描述**：

当前部分页面操作的 WAL 记录没有关联事务：

```cpp
// 示例：SetNextPage 可能没有 txn
if (wal_integration_ != nullptr) {
  wal_integration_->LogSetNextPage(nullptr, old_page_id, next_page_id);  // txn = nullptr
}
```

**风险**：

- 无法进行事务级别的回滚
- 崩溃恢复时无法判断操作是否属于已提交事务
- 可能导致页面链不一致

**评估**：

页面链操作（`SetNextPage`）属于**物理结构变更**，不是逻辑数据变更：
- 不需要事务级回滚（页面链只会向前扩展）
- Redo 时无条件重放即可
- 属于 Physiological Logging 的范畴

**结论**：`txn = nullptr` 对于 `SetNextPageRecord` 是**可接受的**，但需要确保 LSN 正确设置。

### 6.4 需要验证

- **ZoneMap 逻辑**：确认是否依赖 overflow 布局
- **索引逻辑**：确认是否依赖 inline prefix

## 7. WAL 记录类型全面审计

### 7.1 审计结果

| 记录类型 | 调用位置 | 页面锁状态 | 问题 |
|---------|---------|-----------|------|
| **BEGIN** | `LogTransactionBegin` | 无页面操作 | ✅ 无问题 |
| **COMMIT** | `LogTransactionCommit` | 无页面操作 | ✅ 无问题 |
| **ABORT** | `LogTransactionAbort` | 无页面操作 | ✅ 无问题 |
| **INSERT** | `OnInsert` → `LogInsert` | ⚠️ **锁已释放** | ❌ 有问题 |
| **UPDATE** | `OnUpdate` → `LogUpdate` | ⚠️ **锁已释放** | ❌ 有问题 |
| **DELETE** | `OnDelete` → `LogDelete` | ⚠️ **锁已释放** | ❌ 有问题 |
| **CHECKPOINT** | `CreateCheckpoint` | 无页面操作 | ✅ 无问题 |
| **CLR** | Recovery 阶段 | 持有锁 | ✅ 无问题 |
| **INDEX_INSERT** | `LogIndexInsert` | 无页面操作 | ✅ 无问题 |
| **INDEX_DELETE** | `LogIndexDelete` | 无页面操作 | ✅ 无问题 |
| **SET_NEXT_PAGE** | `EnsureSpaceOrAdvance` | ⚠️ **锁已释放** | ❌ 有问题 |
| **META_UPDATE** | `CreateCheckpoint` | 无页面操作 | ✅ 无问题 |
| **PAGE_ALLOC** | `InitTablePage` | ✅ 持有锁 | ✅ 无问题 |

### 7.2 INSERT/UPDATE/DELETE 问题分析

**调用链**：

```text
execute_common.cpp::InsertTuple
  → table_heap->InsertTuple
    → storage_->Write(...)  // 页面锁在这里获取并释放
  → txn->OnInsert(...)      // ⚠️ 此时页面锁已释放！
    → WALTxnObserver::OnInsert
      → wal_->LogInsert
        → GetPhysicalLayout(rid)  // ❌ 锁外获取 layout
```

**问题**：
- `storage_->Write()` 返回后页面锁已释放
- `OnInsert` 回调在锁外执行
- `GetPhysicalLayout` 获取的 layout 可能已被其他事务修改

### 7.3 解决方案

**方案 A：在 Storage 层记录 WAL（推荐）**

将 WAL 记录移到 `DiskEngine::Write()` 内部，在持有页面锁时完成：

```cpp
Rid DiskEngine::Write(...) {
  auto page_guard = FetchPageWrite(page_id);
  // ... 写入数据 ...
  
  // 在锁内获取 layout 并记录 WAL
  PhysicalLayout layout = GetPhysicalLayoutInLock(page_guard, slot_id);
  if (wal_integration_) {
    lsn_t lsn = wal_integration_->LogInsertWithLayout(txn, table_id, rid, data, layout);
    page_guard.SetLSN(lsn);
  }
  
  page_guard.Drop();  // 释放锁
  return rid;
}
```

**方案 B：传递 Layout 参数**

`Write()` 返回时同时返回 layout，避免二次查询：

```cpp
struct WriteResult {
  Rid rid;
  PhysicalLayout layout;
};

WriteResult DiskEngine::Write(...) {
  // ... 写入数据 ...
  return {rid, layout};  // layout 在锁内获取
}
```

## 8. 待解决问题清单

| 问题 | 优先级 | 状态 | 负责人 |
|------|--------|------|--------|
| INSERT/UPDATE/DELETE 的 GetPhysicalLayout 在锁外 | P0 | ⏳ 待修复 | |
| SetNextPageRecord 的 MarkPageLSN 在锁外执行 | P0 | ⏳ 待修复 | |
| 页面级 WAL 缺少事务概念 | P2 | ✅ 已评估 | 可接受 |
| ZoneMap 依赖验证 | P2 | ⏳ 待验证 | |
| 索引依赖验证 | P2 | ⏳ 待验证 | |

## 7. 参考

- `WriteRaw` 实现：`storage/disk/disk_engine.cpp:407`
- `Write` 实现：`storage/disk/disk_engine.cpp:524`
- `OverflowPtr` 定义：`storage/common/page/overflow_page.h`
- 测试用例：`tests/unit_test/storage/disk/disk_engine_overflow_test.cpp`
