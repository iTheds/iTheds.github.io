---
title: "索引Factory设计"
description: "project-tzdb-rebuild 文档整理稿（源：raw_snapshot/docs/arch/index_factory_design.md）"
---

# 索引工厂模式设计文档

## 概述

本文档描述了在 TZDB 中引入索引工厂模式的设计和实现。

## 问题分析

### 原有设计的问题

1. **硬编码的索引创建逻辑**：在 `Catalog::CreateIndex` 方法中，索引的创建逻辑通过 `if-else` 语句硬编码
2. **模板参数复杂**：每次创建索引都需要指定 `KeyType`、`ValueType`、`KeyComparator` 等模板参数
3. **扩展性差**：添加新的索引类型需要修改 `Catalog` 类的代码
4. **代码重复**：不同类型的索引创建逻辑可能重复
5. **维护困难**：索引创建逻辑分散在多个地方

### 解决方案

引入工厂模式来解决上述问题：

- **封装变化**：将索引创建逻辑封装在工厂类中
- **简化接口**：提供统一的索引创建接口
- **易于扩展**：新增索引类型只需添加新的工厂类
- **降低耦合**：`Catalog` 类不再直接依赖具体的索引实现

## 设计架构

### 类图

```
┌─────────────────┐     
│   IndexFactory  │   
│   (Interface)   │    
└─────────────────┘     
         │                        
         │                      
    ┌────┴────┐                   
    │         │                 
┌─────────┐ ┌─────────┐         
│HashTable│ │BPlusTree│         
│Factory  │ │Factory  │          
└─────────┘ └─────────┘      
```

### 核心组件

1. **IndexFactory**：索引工厂接口
    - 定义创建索引的通用接口
    - 支持不同类型的索引创建

2. **HashTableIndexFactory**：哈希表索引工厂
    - 负责创建哈希表类型的索引
    - 根据键大小自动选择合适的模板参数

3. **BPlusTreeIndexFactory**：B+树索引工厂
    - 负责创建B+树类型的索引
    - 根据键大小自动选择合适的模板参数

4. **IndexFactories**：索引工厂集合
    - 管理所有索引工厂实例
    - 提供统一的索引创建接口
    - 支持获取特定类型的工厂

## 使用方式

### 基本用法

```cpp
// 创建哈希表索引
auto index_info = catalog->CreateIndex(
    txn, "idx_name", "table_name", schema, key_schema, 
    key_attrs, key_size, false, IndexType::HashTableIndex);

// 创建B+树索引
auto index_info = catalog->CreateIndex(
    txn, "idx_name", "table_name", schema, key_schema, 
    key_attrs, key_size, false, IndexType::BPlusTreeIndex);
```

### 扩展新的索引类型

```cpp
// 1. 创建新的索引工厂
class NewIndexFactory : public IndexFactory {
public:
    std::unique_ptr<Index> CreateIndex(...) override {
        // 实现新索引的创建逻辑
    }
};

// 2. 添加新的索引类型
enum class IndexType { 
    BPlusTreeIndex, 
    HashTableIndex, 
    NewIndexType  // 新增
};

// 3. 在 IndexFactories 构造函数中注册工厂
IndexFactories::IndexFactories() {
    factories_[IndexType::HashTableIndex] = std::make_unique<HashTableIndexFactory>();
    factories_[IndexType::BPlusTreeIndex] = std::make_unique<BPlusTreeIndexFactory>();
    factories_[IndexType::NewIndexType] = std::make_unique<NewIndexFactory>();  // 新增
}
```

## 优势

1. **简化接口**：不再需要指定复杂的模板参数
2. **易于扩展**：新增索引类型只需添加工厂类
3. **降低耦合**：`Catalog` 类与具体索引实现解耦
4. **统一管理**：所有索引创建逻辑集中管理
5. **类型安全**：编译时类型检查
6. **性能优化**：根据键大小自动选择最优的模板参数

## 实现细节

### 模板参数选择

工厂根据键大小自动选择合适的模板参数：

- `key_size <= 4`: `GenericKey<4>`
- `key_size <= 8`: `GenericKey<8>`
- `key_size <= 16`: `GenericKey<16>`
- `key_size <= 32`: `GenericKey<32>`
- `key_size > 32`: `GenericKey<64>`

### 错误处理

- 如果指定的索引类型未注册，返回 `nullptr`
- 如果创建失败，`Catalog::CreateIndex` 返回 `NULL_INDEX_INFO`

### 线程安全

- `IndexFactories` 在 `Catalog` 中使用静态实例，线程安全
- 工厂在构造时初始化，避免运行时竞争

## 迁移指南

### 从旧接口迁移

旧接口：

```cpp
template <class KeyType, class ValueType, class KeyComparator>
auto CreateIndex(..., HashFunction<KeyType> hash_function, ...) -> IndexInfo*;
```

新接口：

```cpp
auto CreateIndex(..., bool is_primary_key = false, 
                IndexType index_type = IndexType::HashTableIndex, ...) -> IndexInfo*;
```

### 兼容性

- 保持向后兼容，旧接口仍然可用
- 新代码建议使用工厂模式接口
- 逐步迁移现有代码

## 总结

索引工厂模式的引入显著改善了 TZDB 的索引创建机制：

1. **提高了代码的可维护性**
2. **简化了索引创建的使用方式**
3. **增强了系统的扩展性**
4. **降低了模块间的耦合度**

这个设计为 TZDB 的未来发展奠定了良好的基础，使得添加新的索引类型变得更加简单和高效。 
