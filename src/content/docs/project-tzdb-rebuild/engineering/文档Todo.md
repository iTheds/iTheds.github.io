---
title: "文档Todo"
description: "project-tzdb-rebuild 文档整理稿(源：raw_snapshot/docs/todo/todo.md)"
---

# TZDB TODO List

> 基于 2024-11-28 崩溃恢复测试开发的上下文

---

## ✅ 已完成

### PAGE_ALLOC WAL 记录

- [x] 添加 `LOGRECORDTYPE_PAGE_ALLOC` 枚举
- [x] 实现 `PageAllocRecord` 类(序列化/反序列化)
- [x] 在 `DiskEngine::InitTablePage` 中记录 WAL
- [x] 在 `RecoveryManager::ApplyRedoPageAlloc` 中处理 Redo
- [x] 更新 WAL 扫描器的记录类型验证(`wal_manager.cpp` 和 `recovery_manager.cpp`)

### Undo 幂等性修复

- [x] 修复 `UndoInsert` 的幂等性检查(使用元组删除状态而非 LSN 比较)

### 崩溃恢复测试

- [x] Test 1-12: 基础恢复测试
- [x] Test 13: UPDATE 未提交回滚
- [x] Test 14: DELETE 未提交回滚

### 临时修复清理

- [x] 移除 `TableHeap::EnsureLastRidInitialized` 中的临时页面创建逻辑

---

## 🔧 待优化

### 1. DiskTableIterator 页面缓存优化

**优先级**: 高  
**预期提升**: 全表扫描性能提升 100-2000x

**问题**:
当前迭代器每次 `operator++` 和 `GetTuple()` 都重新 fetch 页面，导致大量重复 I/O：

```cpp
// operator++ 中
auto page_guard = disk_engine_->FetchPageRead(rid_.GetPageId());  // 每次都 fetch

// GetTuple() 中
auto res = disk_engine_->Read(schema_, &rid_, ...);  // 又 fetch 一次
```

**影响**:
| 场景 | 当前开销 | 优化后 | 提升 |
|------|---------|--------|------|
| 遍历 1000 条记录(单页) | ~2000 次 page fetch | ~1 次 | **~2000x** |
| 遍历 10 页 × 100 条 | ~2000 次 page fetch | ~10 次 | **~200x** |
| 全表扫描 | O(2n) page fetch | O(pages) | **显著** |

**解决方案**:
缓存当前页面的 `ReadPageGuard`，只在跨页时才重新 fetch：

```cpp
class DiskTableIterator : public StorageTableIterator {
 private:
  ReadPageGuard current_page_guard_;  // 缓存当前页面
  const disk_storage::TablePage *current_page_ = nullptr;
  
  void EnsurePageLoaded() {
    if (current_page_ == nullptr || current_page_guard_.PageId() != rid_.GetPageId()) {
      current_page_guard_ = disk_engine_->FetchPageRead(rid_.GetPageId());
      current_page_ = current_page_guard_.As<disk_storage::TablePage>();
    }
  }
};
```

**受益场景**:

- 全表扫描 (`SELECT * FROM table`)
- 恢复阶段的 `RebuildIndexFromHeap`
- 大表遍历
- `COUNT(*)` 等聚合操作

---

### 2. UndoUpdate / UndoDelete 幂等性检查

**优先级**: 中  
**说明**: 当前 `UndoUpdate` 和 `UndoDelete` 仍使用 LSN 比较进行幂等性检查，可能存在与 `UndoInsert` 类似的问题。

**建议**:

- `UndoUpdate`: 检查当前值是否已经等于 `before_image`
- `UndoDelete`: 检查元组是否已经存在(未删除状态)

```cpp
// UndoUpdate 幂等性检查示例
if (current_value == before_image) {
  LOG_DEBUG("[UNDO] UPDATE skipped (already restored)");
  return kSuccess;
}

// UndoDelete 幂等性检查示例
if (!meta.is_deleted_) {
  LOG_DEBUG("[UNDO] DELETE skipped (already undeleted)");
  return kSuccess;
}
```

### 2. CLR 中间崩溃恢复测试

**优先级**: 低  
**说明**: 当前没有测试 Undo 阶段中间崩溃的场景(CLR 已写但 Undo 未完成)。

**建议**: 添加 Test 15 模拟此场景。

### 3. 压力测试

**优先级**: 低  
**说明**: 当前测试数据量较小，可以添加大数据量的压力测试。

**建议**:

- 插入 10000+ 条记录
- 多表并发操作
- 长事务恢复

---

## 📋 潜在问题

### 1. Executor DELETE Bug

**状态**: 已知问题，暂未修复  
**说明**: Test 9 和 Test 10 曾出现 DELETE 相关的计数错误，可能与 executor 层的 DELETE 实现有关。

**现象**:

- `Count error: expected 49, got 48`
- `Count error: expected 19, got 20`

**建议**: 排查 `DeleteExecutor` 的实现，特别是与索引扫描的交互。

### 2. WAL 记录类型验证硬编码

**状态**: 技术债务  
**说明**: 当前在多处硬编码了最大有效记录类型：

- `wal_manager.cpp:234`
- `recovery_manager.cpp:532`

**建议**: 添加一个 `LOGRECORDTYPE_MAX` 枚举值，或使用函数统一验证。

```cpp
// 建议的改进
enum class LogRecordType : uint8_t {
  // ... existing types ...
  LOGRECORDTYPE_PAGE_ALLOC = 12,
  LOGRECORDTYPE_MAX = 12,        // 添加这个
  LOGRECORDTYPE_INVALID = 255,
};

// 使用
if (rec->type_ >= LogRecordType::LOGRECORDTYPE_MAX) {
  // invalid
}
```

---

## 🚀 未来功能

### 1. 并发恢复

**说明**: 当前恢复是单线程的，可以考虑并行 Redo。

### 2. 增量 Checkpoint

**说明**: 当前 checkpoint 是全量的，可以考虑增量 checkpoint 减少 I/O。

### 3. WAL 压缩

**说明**: 长时间运行后 WAL 文件会很大，需要 WAL 截断/压缩机制。

### 4. 在线备份

**说明**: 支持在线热备份，利用 WAL 实现 PITR(Point-in-Time Recovery)。

---

## 📊 测试覆盖状态

| 类别       | 覆盖率          | 说明                     |
|----------|--------------|------------------------|
| WAL 记录类型 | 13/13 (100%) | 所有类型都有测试覆盖             |
| ARIES 阶段 | 3/3 (100%)   | Analysis/Redo/Undo 全覆盖 |
| DML 操作   | 3/3 (100%)   | INSERT/UPDATE/DELETE   |
| Redo 场景  | ✅            | 已提交事务的恢复               |
| Undo 场景  | ✅            | 未提交事务的回滚               |
| Overflow | ✅            | 大记录恢复                  |
| 索引恢复     | ✅            | B+ 树索引重建               |
| 多次崩溃     | ✅            | 连续崩溃恢复                 |

---

*最后更新: 2025-11-28*
