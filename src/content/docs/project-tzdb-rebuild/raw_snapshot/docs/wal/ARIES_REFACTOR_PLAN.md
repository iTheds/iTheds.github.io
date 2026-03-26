---
title: "ARIES Physical Redo 改造方案"
description: "ARIES Physical Redo 改造方案"
---

# ARIES Physical Redo 改造方案

## 目标
将当前的 Physiological Redo 改造为严格的 Physical Redo，实现完全幂等的恢复机制。

---

## 问题分析

### 当前实现的问题

1. **WAL 日志不完整**
   - 只记录了 `(table_id, rid, data)`
   - 缺少物理布局信息:`tuple_offset`, `overflow_page_id`
   
2. **Redo 时执行非幂等操作**
   - `VacuumPage()` - 改变页面布局
   - `AllocateOverflowChainAndWrite()` - 每次分配不同的页面
   
3. **依赖 Page LSN 检查**
   - 在大多数情况下有效
   - 但在页面回滚、替换等边缘情况下可能失效

---

## 改造方案

### 阶段 1:扩展 WAL 日志格式

#### 1.1 新增物理布局信息结构

```cpp
// inc/storage/wal/log_record.h

/**
 * @brief 物理布局信息:记录元组在页面中的物理存储方式
 */
struct PhysicalLayout {
    // 主页面信息
    uint16_t tuple_offset;      // 元组在主页面中的偏移
    uint16_t tuple_length;      // 元组在主页面中的长度
    
    // Overflow 信息
    bool has_overflow;          // 是否有 overflow 页面
    page_id_t overflow_head;    // overflow 链的头页面 ID
    uint32_t overflow_length;   // overflow 数据总长度
    
    // Overflow 链的详细信息(用于完整恢复)
    std::vector<page_id_t> overflow_pages;  // overflow 链中的所有页面 ID
    
    void Serialize(Serializer &serializer) const {
        serializer.WriteProperty(1, "tuple_offset", tuple_offset);
        serializer.WriteProperty(2, "tuple_length", tuple_length);
        serializer.WriteProperty(3, "has_overflow", has_overflow);
        serializer.WriteProperty(4, "overflow_head", overflow_head);
        serializer.WriteProperty(5, "overflow_length", overflow_length);
        serializer.WriteProperty(6, "overflow_pages", overflow_pages);
    }
    
    static PhysicalLayout Deserialize(Deserializer &deserializer) {
        PhysicalLayout layout;
        deserializer.ReadProperty(1, "tuple_offset", layout.tuple_offset);
        deserializer.ReadProperty(2, "tuple_length", layout.tuple_length);
        deserializer.ReadProperty(3, "has_overflow", layout.has_overflow);
        deserializer.ReadProperty(4, "overflow_head", layout.overflow_head);
        deserializer.ReadProperty(5, "overflow_length", layout.overflow_length);
        deserializer.ReadProperty(6, "overflow_pages", layout.overflow_pages);
        return layout;
    }
};
```

#### 1.2 修改 InsertRecord

```cpp
class InsertRecord : public LogRecord {
 public:
  InsertRecord() : LogRecord(LogRecordType::LOGRECORDTYPE_INSERT){};
  InsertRecord(uint32_t table_id, const Rid &rid, std::string data, 
               VersionLinkImage version_link = {},
               PhysicalLayout layout = {});  // 🔑 新增
  
  void Serialize(Serializer &serializer) const override;
  static std::unique_ptr<LogRecord> Deserialize(Deserializer &deserializer);

  // Getter methods
  uint32_t GetTableId() const { return table_id_; }
  const Rid &GetRid() const { return rid_; }
  const std::string &GetData() const { return data_; }
  const VersionLinkImage &GetVersionLink() const { return version_link_; }
  const PhysicalLayout &GetLayout() const { return layout_; }  // 🔑 新增

 private:
  uint32_t table_id_;
  Rid rid_;
  std::string data_;
  VersionLinkImage version_link_;
  PhysicalLayout layout_;  // 🔑 新增物理布局信息
};
```

#### 1.3 修改 UpdateRecord 和 DeleteRecord

```cpp
class UpdateRecord : public LogRecord {
 private:
  uint32_t table_id_;
  Rid rid_;
  std::string old_data_;
  std::string new_data_;
  VersionLinkImage version_link_;
  PhysicalLayout old_layout_;  // 🔑 旧数据的物理布局
  PhysicalLayout new_layout_;  // 🔑 新数据的物理布局
};

class DeleteRecord : public LogRecord {
 private:
  uint32_t table_id_;
  Rid rid_;
  std::string data_;
  VersionLinkImage version_link_;
  PhysicalLayout layout_;  // 🔑 被删除数据的物理布局
};
```

---

### 阶段 2:修改正常执行路径(记录物理信息)

#### 2.1 修改 DiskEngine::Insert

```cpp
// storage/disk/disk_engine.cpp

Rid DiskEngine::Insert(const Schema *schema, const Tuple &tuple, 
                       const TupleMeta &meta, Transaction *txn) {
    // ... 现有的插入逻辑 ...
    
    // 🔑 记录物理布局信息
    PhysicalLayout layout;
    layout.tuple_offset = tuple_off;  // 从 PageAddItem 返回
    layout.tuple_length = stored_length;
    
    // 如果有 overflow
    if (has_overflow) {
        layout.has_overflow = true;
        layout.overflow_head = overflow_head_page_id;
        layout.overflow_length = overflow_total_length;
        
        // 🔑 记录 overflow 链中的所有页面 ID
        layout.overflow_pages = CollectOverflowPages(overflow_head_page_id);
    } else {
        layout.has_overflow = false;
        layout.overflow_head = INVALID_PAGE_ID;
        layout.overflow_length = 0;
    }
    
    // 🔑 写 WAL 时包含物理布局信息
    if (txn != nullptr && wal_manager_ != nullptr) {
        InsertRecord log_rec(table_id, result_rid, 
                            std::string(tuple.GetData(), tuple.GetLength()),
                            version_link, layout);  // 传入 layout
        wal_manager_->WriteLogRecord(log_rec, false);
    }
    
    return result_rid;
}
```

#### 2.2 新增辅助函数:收集 Overflow 页面 ID

```cpp
// storage/disk/disk_engine.cpp

std::vector<page_id_t> DiskEngine::CollectOverflowPages(page_id_t head) {
    std::vector<page_id_t> pages;
    page_id_t current = head;
    
    while (current != INVALID_PAGE_ID) {
        pages.push_back(current);
        
        auto guard = FetchPageRead(current);
        if (guard.PageId() == INVALID_PAGE_ID) {
            break;
        }
        
        auto *page = guard.As<OverflowPage>();
        current = page->header_.next_overflow_page_id_;
    }
    
    return pages;
}
```

---

### 阶段 3:重写 Redo 逻辑(Physical Redo)

#### 3.1 新的 RedoInsert 实现

```cpp
// storage/disk/disk_engine.cpp

TZDB_RET DiskEngine::RedoInsert(const Schema *schema, const Rid &rid, 
                                const Tuple &tuple, timestamp_t commit_ts,
                                lsn_t lsn, const PhysicalLayout &layout) {
    try {
        auto page_guard = FetchPageWrite(rid.GetPageId());
        if (page_guard.PageId() == INVALID_PAGE_ID) {
            return kError;
        }
        auto *pg = page_guard.AsMut<TablePage>();
        
        // 🔑 幂等性检查
        lsn_t page_lsn = page_guard.GetLSN();
        if (page_lsn >= lsn) {
            LOG_DEBUG("[REDO][DISK] INSERT skipped (idempotent): page=%d slot=%u page_lsn=%d >= rec_lsn=%d",
                      (int)rid.GetPageId(), (unsigned)rid.GetSlotNum(), (int)page_lsn, (int)lsn);
            return kSuccess;
        }
        
        TupleMeta meta;
        meta.ts_ = commit_ts;
        meta.is_deleted_ = false;
        
        // 🔑 如果有 overflow，先恢复 overflow 页面
        if (layout.has_overflow) {
            TZDB_RET rc = RedoOverflowChain(layout, tuple.GetData(), tuple.GetLength(), lsn);
            if (rc != kSuccess) {
                LOG_ERROR("[REDO][DISK] Failed to redo overflow chain");
                return rc;
            }
        }
        
        // 🔑 在主页面的指定物理位置写入数据(不做 vacuum，不重新分配)
        const uint32_t page_size = buffer_pool_->GetPageSize();
        
        // 直接在指定 offset 写入
        if (layout.tuple_offset + layout.tuple_length > page_size) {
            LOG_ERROR("[REDO][DISK] Invalid tuple offset/length");
            return kError;
        }
        
        // 准备要写入的数据
        std::vector<char> page_data;
        if (layout.has_overflow) {
            // 如果有 overflow，主页面存储的是 inline_prefix + OverflowPtr
            // 从 tuple 数据中提取 inline prefix
            size_t inline_prefix_size = layout.tuple_length - sizeof(OverflowPtr);
            page_data.resize(layout.tuple_length);
            
            // 拷贝 inline prefix
            memcpy(page_data.data(), tuple.GetData(), inline_prefix_size);
            
            // 构造 OverflowPtr
            OverflowPtr ptr{layout.overflow_head, layout.overflow_length, OVERFLOW_PTR_MAGIC};
            memcpy(page_data.data() + inline_prefix_size, &ptr, sizeof(OverflowPtr));
        } else {
            // 没有 overflow，直接使用完整数据
            page_data.assign(tuple.GetData(), tuple.GetData() + layout.tuple_length);
        }
        
        // 🔑 直接写入指定位置(Physical Write)
        char *page_start = reinterpret_cast<char *>(pg);
        memcpy(page_start + layout.tuple_offset, page_data.data(), layout.tuple_length);
        
        // 更新 slot 信息
        auto slot = static_cast<uint16_t>(rid.GetSlotNum());
        pg->header.tuple_info_[slot] = std::make_tuple(layout.tuple_offset, layout.tuple_length, meta);
        
        // 更新 entry_num
        uint32_t new_entry_num = std::max<uint32_t>(pg->header.entry_num, slot + 1);
        pg->header.entry_num = new_entry_num;
        
        // 🔑 更新 page LSN
        pg->SetLSN(lsn);
        
        LOG_DEBUG("[REDO][DISK] INSERT applied: page=%d slot=%u offset=%u length=%u has_overflow=%d",
                  (int)rid.GetPageId(), (unsigned)slot, layout.tuple_offset, layout.tuple_length, layout.has_overflow);
        
        return kSuccess;
    } catch (...) {
        return kError;
    }
}
```

#### 3.2 新增:Redo Overflow Chain

```cpp
// storage/disk/disk_engine.cpp

TZDB_RET DiskEngine::RedoOverflowChain(const PhysicalLayout &layout, 
                                       const char *full_data, uint32_t full_length,
                                       lsn_t lsn) {
    if (!layout.has_overflow || layout.overflow_pages.empty()) {
        return kSuccess;
    }
    
    const uint32_t page_size = buffer_pool_->GetPageSize();
    const uint32_t max_payload = page_size - sizeof(OverflowPageHeader);
    
    // 计算 inline prefix 大小
    size_t inline_prefix_size = full_length - layout.overflow_length;
    const char *overflow_data = full_data + inline_prefix_size;
    
    uint32_t remaining = layout.overflow_length;
    uint32_t offset = 0;
    
    // 🔑 使用日志中记录的页面 ID，不重新分配
    for (size_t i = 0; i < layout.overflow_pages.size(); ++i) {
        page_id_t pid = layout.overflow_pages[i];
        
        // 获取或创建 overflow 页面
        auto guard = FetchPageWrite(pid);
        if (guard.PageId() == INVALID_PAGE_ID) {
            // 页面不存在，需要创建(这种情况应该很少见)
            guard = NewPageGuarded(&pid).UpgradeWrite();
            if (pid != layout.overflow_pages[i]) {
                LOG_ERROR("[REDO] Overflow page ID mismatch: expected=%d got=%d",
                          (int)layout.overflow_pages[i], (int)pid);
                return kError;
            }
        }
        
        auto *page = guard.AsMut<OverflowPage>();
        
        // 🔑 幂等性检查
        if (page->GetLSN() >= lsn) {
            LOG_DEBUG("[REDO] Overflow page %d already applied", (int)pid);
            continue;
        }
        
        // 计算这个页面应该存储的数据量
        uint32_t seg = remaining > max_payload ? max_payload : remaining;
        
        // 设置 header
        page->header_.generic_.lsn = lsn;
        page->header_.type_ = PageType::kOverflowPage;
        page->header_.fragment_offset_ = offset;
        page->header_.fragment_length_ = seg;
        page->header_.prev_overflow_page_id_ = (i > 0) ? layout.overflow_pages[i-1] : INVALID_PAGE_ID;
        page->header_.next_overflow_page_id_ = (i < layout.overflow_pages.size()-1) ? layout.overflow_pages[i+1] : INVALID_PAGE_ID;
        
        // 🔑 写入数据(Physical Write)
        memcpy(page->Payload(), overflow_data + offset, seg);
        
        guard.MarkDirty();
        
        offset += seg;
        remaining -= seg;
    }
    
    if (remaining != 0) {
        LOG_ERROR("[REDO] Overflow data size mismatch: remaining=%u", remaining);
        return kError;
    }
    
    return kSuccess;
}
```

#### 3.3 修改 RecoveryManager::ApplyRedoDataChange

```cpp
// storage/wal/recovery_manager.cpp

TZDB_RET RecoveryManager::ApplyRedoDataChange(PhysicalOp op, const PhysicalParams &p) {
    StorageInterface *storage = storage_engine_;
    if (storage == nullptr) {
        return kError;
    }
    
    // ... schema 解析逻辑 ...
    
    switch (op) {
        case PhysicalOp::kInsert: {
            Tuple t;
            t.GetMutData() = p.after_image_;
            
            // 🔑 调用新的 RedoInsert，传入 PhysicalLayout
            ret = storage->RedoInsert(schema_ptr, p.rid_, t, p.ts_, p.rec_lsn_, p.layout_);
            break;
        }
        case PhysicalOp::kUpdate: {
            Tuple t;
            t.GetMutData() = p.after_image_;
            
            // 🔑 调用新的 RedoUpdate，传入 PhysicalLayout
            ret = storage->RedoUpdate(schema_ptr, p.rid_, t, p.ts_, p.rec_lsn_, p.layout_);
            break;
        }
        case PhysicalOp::kDelete: {
            // 🔑 调用新的 RedoDelete，传入 PhysicalLayout
            ret = storage->RedoDelete(p.rid_, p.ts_, p.rec_lsn_, p.layout_);
            break;
        }
    }
    
    // ... 后续逻辑 ...
}
```

---

### 阶段 4:修改 Update 和 Delete

#### 4.1 RedoUpdate

```cpp
TZDB_RET DiskEngine::RedoUpdate(const Schema *schema, const Rid &rid, 
                                const Tuple &tuple, timestamp_t commit_ts,
                                lsn_t lsn, const PhysicalLayout &new_layout) {
    // 类似 RedoInsert，但需要处理旧数据的清理
    
    // 1. 幂等性检查
    // 2. 如果有新的 overflow，恢复 overflow 链
    // 3. 在指定位置写入新数据
    // 4. 更新 slot 信息
    // 5. 更新 page LSN
}
```

#### 4.2 RedoDelete

```cpp
TZDB_RET DiskEngine::RedoDelete(const Rid &rid, timestamp_t commit_ts,
                                lsn_t lsn, const PhysicalLayout &layout) {
    // 1. 幂等性检查
    // 2. 标记删除(不物理删除)
    // 3. 更新 page LSN
}
```

---

## 实施步骤

### Step 1: 扩展数据结构(不破坏现有功能)
- [ ] 添加 `PhysicalLayout` 结构
- [ ] 修改 `InsertRecord/UpdateRecord/DeleteRecord`，添加 `layout_` 字段
- [ ] 修改序列化/反序列化逻辑
- [ ] **保持向后兼容**:如果 `layout_` 为空，使用旧逻辑

### Step 2: 修改正常执行路径
- [ ] 修改 `DiskEngine::Insert`，记录 `PhysicalLayout`
- [ ] 修改 `DiskEngine::Update`，记录 `PhysicalLayout`
- [ ] 修改 `DiskEngine::Delete`，记录 `PhysicalLayout`
- [ ] 添加 `CollectOverflowPages()` 辅助函数

### Step 3: 实现新的 Redo 逻辑
- [ ] 实现 `RedoOverflowChain()`
- [ ] 重写 `RedoInsert()`，使用 Physical Redo
- [ ] 重写 `RedoUpdate()`，使用 Physical Redo
- [ ] 重写 `RedoDelete()`，使用 Physical Redo

### Step 4: 测试
- [ ] 单元测试:验证 `PhysicalLayout` 序列化
- [ ] 集成测试:验证正常插入/更新/删除
- [ ] 恢复测试:验证 Redo 的幂等性
- [ ] 压力测试:验证 Overflow 场景

### Step 5: 清理旧代码
- [ ] 移除 Redo 中的 `VacuumPage()` 调用
- [ ] 移除 Redo 中的 `AllocateOverflowChainAndWrite()` 调用
- [ ] 移除向后兼容代码

---

## 优势

1. **严格幂等**:Redo 操作可以安全地重复执行
2. **符合 ARIES 标准**:Physical Redo + Logical Undo
3. **性能提升**:Redo 变成简单的字节拷贝，速度更快
4. **可并行恢复**:不同页面的 Redo 可以并行执行

## 劣势

1. **WAL 日志变大**:需要记录 `PhysicalLayout` 信息
2. **实现复杂度**:需要修改多个模块
3. **迁移成本**:需要处理旧格式日志的兼容性

---

## 预估工作量

- **Step 1**: 2-3 小时
- **Step 2**: 3-4 小时
- **Step 3**: 4-5 小时
- **Step 4**: 3-4 小时
- **Step 5**: 1-2 小时

**总计**: 13-18 小时

---

## 备注

1. **向后兼容性**:在 Step 1-3 期间，保持对旧格式日志的支持
2. **渐进式迁移**:可以先实现 Insert，再实现 Update/Delete
3. **测试驱动**:每个 Step 完成后都要通过测试再继续
