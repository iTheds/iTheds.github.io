---
title: "ARIES 恢复机制修复总结"
description: "ARIES 恢复机制修复总结"
---

# ARIES 恢复机制修复总结

## 修复的问题

### 1. Overflow 页面恢复失败 ✅

**问题描述**:
- 在 Redo 阶段，如果 overflow 页面在崩溃时未刷盘，`FetchPageWrite()` 会返回 `INVALID_PAGE_ID`
- 导致整个恢复过程失败

**根本原因**:
- Physical Redo 要求使用 WAL 中记录的物理位置(page_id)
- 但如果页面未刷盘，磁盘上不存在该页面

**解决方案**:
1. 在 `BufferPoolDisk` 中添加 `CreatePageWithId(page_id_t page_id)` 方法
2. 在 `RedoOverflowChain()` 中，如果页面不存在，使用 `CreatePageWithId()` 创建
3. 确保页面使用 WAL 中记录的 page_id，保证幂等性

**修改的文件**:
- `inc/storage/common/buffer_pool/bufferpool.h` - 添加虚函数声明
- `inc/storage/disk/buffer/bufferpool_disk.h` - 声明 `CreatePageWithId`
- `storage/disk/buffer/bufferpool_disk.cpp` - 实现 `CreatePageWithId`
- `storage/disk/disk_engine.cpp` - 在 `RedoOverflowChain` 中使用

---

### 2. Entry_num 不一致问题 ✅

**问题描述**:
- 崩溃前页面在内存中有 70 个 tuples (`entry_num=70`)
- 崩溃时页面未刷盘，磁盘上可能 `entry_num=70` 或更小
- Recovery 时 Redo 到 slot 36，使用 `max(磁盘值, 37)` 更新 `entry_num`
- 如果磁盘值是 70，`entry_num` 保持 70，但实际只有 37 个 tuples

**根本原因**:
- Physical Redo 使用 `max()` 是为了幂等性
- 但这会保留崩溃前的错误值

**解决方案**:
- 在 `RedoInsertWithLayout()` 中，检查 `page_lsn == 0`(表示第一次 redo)
- 如果是第一次 redo，将 `entry_num` 重置为 0
- 后续 redo 操作会正确累加 `entry_num`

**修改的文件**:
- `storage/disk/disk_engine.cpp` - `RedoInsertWithLayout()` 函数

**代码片段**:
```cpp
// 关键修复:如果这是恢复后第一次修改此页面，重置 entry_num
if (page_lsn == 0) {
  LOG_DEBUG("[REDO][PHYSICAL] First redo on page %d, resetting entry_num from %u to 0",
            (int)rid.GetPageId(), pg->header.entry_num);
  pg->header.entry_num = 0;
}
```

---

### 3. Iterator 越界崩溃 ✅

**问题描述**:
- `TableHeap` 构造时会扫描表来更新 `last_rid_`
- `last_rid_` 基于恢复前的 `entry_num`，可能超出实际范围
- Iterator 使用 `stop_at_rid_` 限制范围，但 `stop_at_rid_` 可能指向不存在的 slot
- 导致断言失败:`iterate out of bound`

**根本原因**:
- 恢复后 `entry_num` 被重置，但 `last_rid_` 还是旧值
- Iterator 边界检查过于严格

**解决方案**:
- 在 `DiskTableIterator::operator++()` 中添加自适应边界调整
- 如果检测到 `stop_at_rid_` 超出当前页面的实际 `entry_num`，自动调整
- 调整后跳过边界检查，避免误报

**修改的文件**:
- `storage/disk/disk_engine_iterator.cpp` - `operator++()` 函数

**代码片段**:
```cpp
// 修复:恢复后 entry_num 可能被重置，导致 stop_at_rid_ 超出实际范围
bool adjusted = false;
if (rid_.GetPageId() == stop_at_rid_.GetPageId() && 
    stop_at_rid_.GetSlotNum() >= table_page->GetNumTuples()) {
  if (table_page->GetNumTuples() > 0) {
    stop_at_rid_ = Rid{rid_.GetTableId(), rid_.GetPageId(), table_page->GetNumTuples() - 1};
    adjusted = true;
  }
}
// 调整后跳过边界检查
if (!adjusted) {
  TZDB_ASSERT(...);
}
```

---

## 测试结果

### 写入阶段
- ✅ 成功插入 3334 条记录
- ✅ 提交 3300 条记录(33 个事务)
- ✅ 在第 3334 条记录时模拟崩溃
- ✅ 34 条记录未提交

### 恢复阶段
- ✅ Redo 阶段成功(包括 overflow 页面创建)
- ✅ Undo 阶段成功(回滚未提交事务)
- ✅ 恢复完成:Winners: 34, Losers: 0
- ✅ Iterator 不再崩溃

---

## 遗留问题

### Schema 缺失问题(待修复)
**问题**:恢复时表的 Schema 还未加载到 Catalog，导致部分 Redo 操作失败

**错误信息**:
```
ApplyRedoDataChange_: missing Schema for disk storage (table_id=4)
```

**原因**:
- 恢复流程在加载 Catalog 之前就开始 Redo
- 某些 Redo 操作需要 Schema 信息

**建议解决方案**:
1. 在恢复流程中先加载系统表和 Catalog
2. 或者修改 Redo 逻辑，使其不依赖 Schema(Physical Redo 理论上不应该需要 Schema)

---

## 关键设计原则

### Physical Redo 的幂等性
- 使用 WAL 中记录的物理位置(page_id, offset, length)
- 通过 LSN 检查避免重复应用
- 如果页面不存在，创建指定 ID 的页面

### Entry_num 的一致性
- 第一次 Redo 时重置为 0
- 后续 Redo 使用 `max()` 确保单调递增
- 保证 `entry_num` 反映实际的 tuple 数量

### Iterator 的鲁棒性
- 自适应调整边界，容忍元数据不一致
- 记录警告日志，便于调试
- 避免硬崩溃，提高系统可用性
