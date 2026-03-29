---
title: "blob pages"
description: "TZDB重构技术日志拆分稿，日期：2025-09-03"
---

## 时间锚点

- 日期：2025-09-03

本质是溢出页的开发。

KV 数据库 RocksDB
向量检索库 hnswlib

WriteOverflowStringsToDisk
OverflowStringWriter

UncompressedStringSegmentState
UncompressedStringStorage
StringAppendBase - StringAppend

```
static idx_t StringAppendBase(BufferHandle &handle, ColumnSegment &segment, SegmentStatistics &stats,
	                              UnifiedVectorFormat &data, idx_t offset, idx_t count);
```

ColumnSegment::Append
ColumnData::AppendData
RowGroup::Append
RowGroupCollection::Append
PhysicalInsert::Sink

UnifiedVectorFormat

ColumnData :某一列在一个行范围(RowGroup）内的“列存管理器”(拥有 SegmentTree、负责扫描/追加/更新/统计）。
ColumnSegment :物理上一段连续行范围的压缩存储单元（含数据块指针与统计信息）。
ColumnAppendState :一次“持续追加会话”的临时状态对象，握住当前可写 segment 及其游标与增量统计，帮助 ColumnData 高效多次
Append。

ValidityColumnData
StandardColumnData
ListColumnData

Table (逻辑表)
└── DataTable / RowGroup 集合
└── RowGroup (覆盖一批连续行，如 ~100K 或更多)
└── ColumnData (该 RowGroup 内某一列)
├── SegmentTree (按起始行号组织)
│ └── ColumnSegment(0)
│ └── ColumnSegment(1)
│ └── ...
├── 版本链(UpdateInfo)  (可选:处理 UPDATE/DELETE)
└── 子 ColumnData (如果是 LIST/STRUCT 等嵌套类型)

### UncompressedStringStorage

UncompressedStringStorage 是DuckDB中用于处理未压缩字符串数据存储的核心类。它提供了一系列静态方法，用于在列段（column
segments）中存储、读取和管理未压缩的字符串数据。

核心功能
UncompressedStringStorage主要处理以下几个方面:

字符串数据的存储和检索:提供方法将字符串数据写入存储块，并在需要时从存储块中读取字符串
溢出字符串的处理:处理无法放入主数据块的大型字符串（溢出字符串）
字典管理:维护字符串字典，优化存储空间使用
段初始化和扫描:提供初始化段和扫描段的方法

### ColumnData

这些都是 ColumnData 的具体派生实现（面向不同逻辑类型或辅助“伪列”），负责一个 RowGroup 中某一列（或子列/辅助位图）的数据管理。

| 类名                         | 面向的数据逻辑类型                                                         | 作用核心                             |
|----------------------------|-------------------------------------------------------------------|----------------------------------|
| StandardColumnData         | 标准标量（INT、BIGINT、DOUBLE、DATE、TIMESTAMP、BOOLEAN、UUID 等固定/可直接段压缩的类型） | 普通数值/标量列的段管理                     |
| StringColumnData（或相关字符串实现） | VARCHAR                                                           | 处理变长字符串（字典/FSST/内联等策略）           |
| ListColumnData             | LIST<T>                                                           | 管理 ListEntry 数组 + 子元素列           |
| StructColumnData           | STRUCT{...}                                                       | 聚合多个子 ColumnData（字段）并统一 validity |
| MapColumnData              | MAP<K,V>（内部 LIST<STRUCT<key,val>>）的语法层包装                          | 转成底层 LIST/STRUCT 组合              |
| UnionColumnData（若存在版本中）    | UNION                                                             | 管理 tag 列 + 子 variant 数据          |
| ValidityColumnData         | “有效性位图”伪列（null mask）                                              | 把 null 信息单独抽象为一个列状数据（位图段）        |

注:不同 DuckDB 版本中命名或是否单独成类会有细微变动，但概念保持一致:根据逻辑类型提供特化数据/附属结构管理。

```
Table
 └── DataTable
      └── RowGroup (row range e.g. 0..N)
           ├── ColumnData (col0: INT) -> StandardColumnData
           ├── ColumnData (col1: VARCHAR) -> StringColumnData
           ├── ColumnData (col2: LIST<INT>)
           │       ↳ ListColumnData
           │            - entries segments (ListEntry[])
           │            - child ColumnData -> StandardColumnData (INT)
           └── ColumnData (col3: STRUCT { a INT, b LIST<VARCHAR> })
                   ↳ StructColumnData
                        - child[0] StandardColumnData (a)
                        - child[1] ListColumnData (b)
                              - entries segments
                              - child (VARCHAR) -> StringColumnData
                        - (optional) ValidityColumnData (STRUCT null mask)
```

### tzdb 存储引擎

class Page{} : GetData to return actual data for write.
BasicPageGuard imposes constraints on page.

其参考的 busTub ， 而 busTub 是没有溢出页的:

```markdown
3. 为什么官方教学实现避免 overflow page
   教学简化:减少学生在并发 / 恢复 / GC 上的心智负担。
   通过“可扩展哈希（extendible hashing）”本身已经能避免传统 static hash 需要 overflow 链的问题。
   B+ Tree 分裂 + 合并（redistribute/merge）即可维持平衡，无需外溢链。
   Heap Page 实验聚焦 slotted page 结构本身，不讨论大对象（LOB/BLOB）外部存储。
4. 什么时候“溢出页”是合理需求
   你可能需要自己加 overflow page 的典型动机:

哈希桶分裂代价太高或想减少目录膨胀:用溢出页链补足极少数热点桶。
想支持比 4KB（默认页大小）更大的长文本 / 二进制字段（类似 PostgreSQL TOAST）。
B+ Tree 叶子上某个 key 拥有巨量重复值（需要 posting list 溢出）。
想做分段式存储:主页存稀疏索引，溢出页存稠密值。
```

| 页类型                           | 作用        | 关键内容                                        |
|:------------------------------|:----------|:--------------------------------------------|
| ExtendibleHTableHeaderPage    | 顶层元数据（入口） | 目录页数量、各目录页 page_id、（可选）魔数等                  |
| ExtendibleHTableDirectoryPage | 具体的目录切片   | 若干个 bucket 指针数组项；包含 global depth（或一部分）及辅助信息 |
| ExtendibleHTableBucketPage    | 实际键值存放    | (key, value) 对；当前计数；局部深度 local depth        |

在 BusTub 的 buffer pool 里，所有这些都是“Page”，页是统一的最小 I/O / 缓存单位。但每种 Page 有不同的解释布局:

| Page 类型示例                     | 属于哪种索引          | 内容                        |
|:------------------------------|:----------------|:--------------------------|
| ExtendibleHTableHeaderPage    | Extendible Hash | 目录页 id 列表                 |
| ExtendibleHTableDirectoryPage | Extendible Hash | bucket 指针数组 + 深度信息        |
| ExtendibleHTableBucketPage    | Extendible Hash | (key,value or key,RID) 存储 |
| BPlusTreeInternalPage         | B+ Tree         | 分割键 + 子页号                 |
| BPlusTreeLeafPage             | B+ Tree         | (key,RID) 有序数组 + 叶子链指针    |

因此:
“哈希桶”对应 ExtendibleHTableBucketPage（数据终端）
BPlusTreeInternalPage 是另一棵树结构里的中间导航页
它们功能、逻辑语义不同，不在一个结构中“并列”

如果你要“再加一种索引”，怎么做？
假设你要实现一个简单的 Bitmap Index（针对低基数字段）:
定义页面类型:
BitmapHeaderPage:列出所有位图分段页 id
BitmapSegmentPage:位数组（存某值的出现位置 bitset）
在 Catalog 中注册:index_type = BITMAP
写 Index 类接口（Insert / ScanEqual / ScanAnySet）
Buffer Pool 一视同仁，只是解析方式不同
WAL / 恢复（如果你已完成日志实验）为 Insert 设置日志格式

同理，如果是 LSM-Tree（更大工程）:
内存:MemTable（跳表，不用磁盘页）
刷盘:SSTable Pages（自定义格式:Index Block, Data Block, Meta Block）
你就会再引入一套新的“页族”

### 具体实现

具体开发内容:

1. 开发溢出页工具，参考 xxx ；
2. 嵌入逻辑策略，总共有两个最基本的策略组:
    1. 位于 Rid DiskEngine::WriteForTable 中；

# 性能测试

## 序列化基准测试

string 对象的序列化:

```bash
===== 单个对象序列化性能测试 =====

数据大小: 4.000 KB (迭代次数: 50)
原始数据大小: 4076 字节
序列化后的数据大小: 4077 字节
序列化压缩比: 1.00
Memcpy 平均时间: 0.10 us (40792.63 MB/s)
序列化 平均时间: 3.18 us (1280.53 MB/s)
反序列化 平均时间: 7.63 us (534.53 MB/s)
完整周期 平均时间: 9.28 us (219.68 MB/s)
序列化开销 (vs Memcpy): 31.86x
反序列化开销 (vs Memcpy): 76.33x
完整周期开销 (vs Memcpy): 92.87x
Memcpy 每字节时间: 0.025 ns/byte
序列化 每字节时间: 0.781 ns/byte
反序列化 每字节时间: 1.871 ns/byte

数据大小: 64.000 KB (迭代次数: 50)
原始数据大小: 65516 字节
序列化后的数据大小: 65518 字节
序列化压缩比: 1.00
Memcpy 平均时间: 1.88 us (34769.04 MB/s)
序列化 平均时间: 35.08 us (1867.55 MB/s)
反序列化 平均时间: 69.01 us (949.37 MB/s)
完整周期 平均时间: 98.36 us (333.06 MB/s)
序列化开销 (vs Memcpy): 18.62x
反序列化开销 (vs Memcpy): 36.62x
完整周期开销 (vs Memcpy): 52.20x
Memcpy 每字节时间: 0.029 ns/byte
序列化 每字节时间: 0.535 ns/byte
反序列化 每字节时间: 1.053 ns/byte

数据大小: 512.000 KB (迭代次数: 50)
原始数据大小: 524268 字节
序列化后的数据大小: 524270 字节
序列化压缩比: 1.00
Memcpy 平均时间: 33.84 us (15491.64 MB/s)
序列化 平均时间: 219.22 us (2391.55 MB/s)
反序列化 平均时间: 421.49 us (1243.86 MB/s)
完整周期 平均时间: 887.98 us (295.20 MB/s)
序列化开销 (vs Memcpy): 6.48x
反序列化开销 (vs Memcpy): 12.45x
完整周期开销 (vs Memcpy): 26.24x
Memcpy 每字节时间: 0.065 ns/byte
序列化 每字节时间: 0.418 ns/byte
反序列化 每字节时间: 0.804 ns/byte
```

vector 序列化:

```bash
===== 序列化与协议性能对比测试 =====

数据大小: 4.000 KB
原始数据大小: 4096 字节
序列化后的数据大小: 4102 字节
序列化压缩比: 1.00
Memcpy 平均时间: 0.09 us (43380.64 MB/s)
序列化 平均时间: 154.21 us (26.56 MB/s)
反序列化 平均时间: 178.13 us (22.99 MB/s)
完整周期 平均时间: 311.18 us (6.58 MB/s)
序列化开销 (vs Memcpy): 1633.26x
反序列化开销 (vs Memcpy): 1886.60x
完整周期开销 (vs Memcpy): 3295.74x

数据大小: 64.00 KB
原始数据大小: 65536 字节
序列化后的数据大小: 65543 字节
序列化压缩比: 1.00
Memcpy 平均时间: 2.74 us (23934.15 MB/s)
序列化 平均时间: 2621.54 us (25.00 MB/s)
反序列化 平均时间: 2475.22 us (26.48 MB/s)
完整周期 平均时间: 4464.55 us (7.34 MB/s)
序列化开销 (vs Memcpy): 957.40x
反序列化开销 (vs Memcpy): 903.97x
完整周期开销 (vs Memcpy): 1630.48x

数据大小: 512.00 KB
原始数据大小: 524288 字节
序列化后的数据大小: 524295 字节
序列化压缩比: 1.00
Memcpy 平均时间: 21.49 us (24391.82 MB/s)
序列化 平均时间: 15846.59 us (33.09 MB/s)
反序列化 平均时间: 19594.91 us (26.76 MB/s)
完整周期 平均时间: 39011.29 us (6.72 MB/s)
序列化开销 (vs Memcpy): 737.24x
反序列化开销 (vs Memcpy): 911.63x
完整周期开销 (vs Memcpy): 1814.95x
```

优化后的 vector 表现:

```bash
===== 序列化与协议性能对比测试 =====

数据大小: 4.000 KB
原始数据大小: 4096 字节
序列化后的数据大小: 4104 字节
序列化压缩比: 1.00
Memcpy 平均时间: 0.09 us (46715.33 MB/s)
序列化 平均时间: 1.08 us (3802.45 MB/s)
反序列化 平均时间: 1.99 us (2058.25 MB/s)
完整周期 平均时间: 4.07 us (502.60 MB/s)
序列化开销 (vs Memcpy): 12.29x
反序列化开销 (vs Memcpy): 22.70x
完整周期开销 (vs Memcpy): 46.47x

数据大小: 64.00 KB
原始数据大小: 65536 字节
序列化后的数据大小: 65546 字节
序列化压缩比: 1.00
Memcpy 平均时间: 1.81 us (36178.55 MB/s)
序列化 平均时间: 36.14 us (1813.44 MB/s)
反序列化 平均时间: 43.34 us (1512.05 MB/s)
完整周期 平均时间: 49.79 us (658.11 MB/s)
序列化开销 (vs Memcpy): 19.95x
反序列化开销 (vs Memcpy): 23.93x
完整周期开销 (vs Memcpy): 27.49x

数据大小: 512.00 KB
原始数据大小: 524288 字节
序列化后的数据大小: 524298 字节
序列化压缩比: 1.00
Memcpy 平均时间: 21.50 us (24379.93 MB/s)
序列化 平均时间: 206.50 us (2538.96 MB/s)
反序列化 平均时间: 221.35 us (2368.55 MB/s)
完整周期 平均时间: 398.64 us (657.60 MB/s)
序列化开销 (vs Memcpy): 9.60x
反序列化开销 (vs Memcpy): 10.29x
完整周期开销 (vs Memcpy): 18.54x
```

## 对比 string 和 vector

```bash
🏗️ Testing Construction Performance (SSO Optimization)...

📊 Short String Construction Performance Results:
   std::string:      24.66 ns/op
   std::vector<char>: 423.96 ns/op
   Performance ratio: 17.19x (string is 1619.4% faster) ✅
   SSO Status: Active ✅
   String capacity: 15 bytes

🔗 Testing Concatenation Performance...

📊 String Concatenation Performance Results:
   std::string:      3748.64 ns/op
   std::vector<char>: 18156.98 ns/op
   Performance ratio: 4.84x (string is 384.4% faster) ✅

🔍 Testing Search Performance...

📊 Substring Search Performance Results:
   std::string:      18.91 ns/op
   std::vector<char>: 369.56 ns/op
   Performance ratio: 19.54x (string is 1854.4% faster) ✅

✂️ Testing Substring Extraction Performance...

📊 Substring Extraction Performance Results:
   std::string:      24.84 ns/op
   std::vector<char>: 407.31 ns/op
   Performance ratio: 16.40x (string is 1539.7% faster) ✅

💾 Analyzing Memory Usage...
   Short String (5 chars):
     std::string size: 32 bytes
     std::string capacity: 15 chars
     std::vector<char> size: 24 bytes
     std::vector<char> capacity: 5 chars
   Long String (63 chars):
     std::string capacity: 63 chars
     std::vector<char> capacity: 63 chars
   SSO Optimization: Active ✅

🎯 Running Comprehensive Performance Test...

📊 Comprehensive Operations Performance Results:
   std::string:      429.68 ns/op
   std::vector<char>: 3286.21 ns/op
   Performance ratio: 7.65x (string is 664.8% faster) ✅
Process finished with exit code 0
```

