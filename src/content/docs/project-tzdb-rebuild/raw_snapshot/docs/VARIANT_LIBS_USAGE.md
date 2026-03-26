---
title: "TZDB 变体库使用指南"
description: "TZDB 变体库使用指南"
---

# TZDB 变体库使用指南

## 概述

TZDB 项目现在使用脚本生成变体库，而不是通过 CMake 直接生成。这样做的好处是:
- 减少 CMake 构建时间
- 更灵活的库组合方式
- 更清晰的依赖关系

提供了两种组合方案:
- **方案 1(推荐)**: 从静态库(`.a`)组合 - 更高效，文件更小
- **方案 2(备选)**: 从对象文件(`.o`)组合 - 更底层，完全控制

## RocksDB 可选引擎说明

当需要构建 RocksDB 存储后端时，必须显式打开:

```bash
cmake -S . -B build-rocks -DTZDB_ENABLE_ROCKSDB=ON
```

约束:
- 默认 `TZDB_ENABLE_ROCKSDB=ON`，如需关闭可显式传 `-DTZDB_ENABLE_ROCKSDB=OFF`。
- RocksDB 通过独立 vendor 构建产出静态库，不直接并入主工程。
- 固定产物路径(Linux/macOS):`${CMAKE_BINARY_DIR}/third_party/rocksdb/install/lib/librocksdb.a`。
- 固定产物路径(Windows):`${CMAKE_BINARY_DIR}/third_party/rocksdb/install/lib/rocksdb.lib`。
- Rocks 表使用 `kRocksStorage` + `TransactionDB`，不参与 ARIES redo/undo。

## 快速开始

### 方案 1:从静态库组合(推荐)⭐

#### 1. 构建项目(生成静态库)

```bash
cd /home/ithedslonnie/Projects/TZDB_PROJECT_WORK/tzdb-rebuild
mkdir -p cmake-build-release
cd cmake-build-release
cmake -DCMAKE_BUILD_TYPE=Release ..
make -j$(nproc)
cd ..
```

#### 2. 组合生成变体库

```bash
./scripts/combine_libs_from_static.sh ./cmake-build-release/lib ./libs
```

**优势**:
- ✅ 直接合并静态库，无需提取对象文件
- ✅ 生成的库文件更小(443MB vs 5.4GB)
- ✅ 无重复对象文件
- ✅ 执行速度更快

#### 3. 运行变体测试

```bash
cd cmake-build-release
cmake ..  # 重新配置以识别生成的库
make -j$(nproc)
ctest -R variant_test --verbose
```

---

### 方案 2:从对象文件组合(备选)

#### 1. 构建项目(生成对象文件)

```bash
cd /home/ithedslonnie/Projects/TZDB_PROJECT_WORK/tzdb-rebuild
mkdir -p cmake-build-release
cd cmake-build-release
cmake -DCMAKE_BUILD_TYPE=Release ..
make -j$(nproc)
cd ..
```

#### 2. 提取对象文件

```bash
./scripts/extract_object_files.sh ./cmake-build-release ./object_files
```

这会从构建目录中提取所有必要的 `.o` 文件到 `./object_files` 目录。

#### 3. 组合生成库文件

```bash
./scripts/combine_object_files.sh ./object_files ./libs
```

**说明**:
- 此方案会递归提取所有子目录中的对象文件
- 可能产生文件名冲突，脚本会自动添加前缀
- 生成的库文件较大，但提供了最底层的控制

#### 4. 运行变体测试

```bash
cd cmake-build-release
cmake ..  # 重新配置以识别生成的库
make -j$(nproc)
ctest -R variant_test --verbose
```

---

## 生成的库文件

两种方案都会生成以下库文件:
- `libtzdb_kernel_lite.a` - Level 0: 纯存储引擎变体(仅内存)
- `libtzdb_storage_disk_only.a` - Level 0b: 纯存储引擎变体(仅磁盘)
- `libtzdb_minimal.a` - Level 1: 最小功能集
- `libtzdb_memory.a` - Level 2: 纯内存功能集
- `libtzdb_dist.a` - Level 3: 分布式存储功能集
- `libtzdb_full.a` - Level 4: 全量功能集

## 一键执行脚本

### 方案 1(推荐)

```bash
#!/bin/bash
# 使用静态库组合方式

# 1. 构建项目
mkdir -p cmake-build-release
cd cmake-build-release
cmake -DCMAKE_BUILD_TYPE=Release ..
make -j$(nproc)
cd ..

# 2. 生成变体库(从静态库)
./scripts/combine_libs_from_static.sh ./cmake-build-release/lib ./libs

# 3. 重新配置并运行测试
cd cmake-build-release
cmake ..
make -j$(nproc)
ctest -R variant_test --verbose
```

### 方案 2(备选)

```bash
#!/bin/bash
# 使用对象文件组合方式

# 1. 构建项目
mkdir -p cmake-build-release
cd cmake-build-release
cmake -DCMAKE_BUILD_TYPE=Release ..
make -j$(nproc)
cd ..

# 2. 生成变体库(从对象文件)
./scripts/extract_object_files.sh ./cmake-build-release ./object_files
./scripts/combine_object_files.sh ./object_files ./libs

# 3. 重新配置并运行测试
cd cmake-build-release
cmake ..
make -j$(nproc)
ctest -R variant_test --verbose
```

## 库文件说明

### Level 0: libtzdb_kernel_lite.a
**用途**: 最小的存储引擎实现(仅内存)

**包含的 OBJECT 库**:
- tzdb_storage_mem_obj
- tzdb_storage_common_obj
- tzdb_os_sync_obj
- tzdb_os_file_obj
- tzdb_common_obj
- tzdb_kernel_lite_obj
- lz4_obj

### Level 0b: libtzdb_storage_disk_only.a
**用途**: 最小的存储引擎实现(仅磁盘)

**包含的 OBJECT 库**:
- tzdb_storage_disk_obj
- tzdb_storage_common_obj
- tzdb_storage_bustub_obj
- tzdb_os_sync_obj
- tzdb_os_file_obj
- tzdb_common_obj
- tzdb_kernel_lite_obj
- lz4_obj

### Level 1: libtzdb_minimal.a
**用途**: 极限端侧配置

**包含的 OBJECT 库**:
- tzdb_api_mco_obj
- tzdb_kernel_obj
- tzdb_transaction_obj
- tzdb_binlog_sql_obj
- tzdb_wal_obj
- tzdb_storage_obj
- tzdb_os_sync_obj
- tzdb_os_file_obj
- tzdb_common_obj
- lz4_obj

### Level 2: libtzdb_memory.a
**用途**: 端侧配置(内存存储 + SQL)

**包含的 OBJECT 库**:
- tzdb_api_sql_obj
- tzdb_api_mco_obj
- tzdb_query_obj
- tzdb_binder_obj
- tzdb_kernel_obj
- tzdb_transaction_obj
- tzdb_binlog_sql_obj
- tzdb_wal_obj
- tzdb_storage_obj
- tzdb_os_sync_obj
- tzdb_os_file_obj
- tzdb_os_io_model_obj
- tzdb_os_communicate_obj
- tzdb_common_obj
- lz4_obj

### Level 3: libtzdb_dist.a
**用途**: 分布式端侧配置

**包含的 OBJECT 库**:
- tzdb_server_obj
- tzdb_api_sql_obj
- tzdb_api_mco_obj
- tzdb_distribution_obj
- tzdb_query_obj
- tzdb_binder_obj
- tzdb_kernel_obj
- tzdb_transaction_obj
- tzdb_binlog_obj
- tzdb_wal_obj
- tzdb_storage_obj
- tzdb_os_sync_obj
- tzdb_os_file_obj
- tzdb_os_io_model_obj
- tzdb_os_communicate_obj
- tzdb_common_obj
- lz4_obj

### Level 4: libtzdb_full.a
**用途**: 服务器、桌面端配置(全量功能)

**包含的 OBJECT 库**:
- 与 Level 3 相同的所有库
- 注意:扩展模块需要单独处理

## 方案对比

| 特性 | 方案 1(静态库) | 方案 2(对象文件) |
|---|---|---|
| **执行速度** | 快(直接合并) | 慢(需要提取+复制) |
| **文件大小** | 小(443MB) | 大(5.4GB) |
| **对象文件数** | 少(297个) | 多(3256个，有重复) |
| **依赖** | CMake 生成的 `.a` | CMake 生成的 `.o` |
| **复杂度** | 简单(一步完成) | 复杂(两步:提取+组合) |
| **适用场景** | 推荐日常使用 | 需要精细控制时 |

**推荐使用方案 1**，除非你需要对对象文件进行精细控制。

## 常见问题

### Q: 为什么 variant_test 编译时提示找不到库？
A: 需要先运行脚本生成库文件，然后重新运行 `cmake ..` 让 CMake 识别这些库。

### Q: 如何验证库文件是否正确？
A: 使用以下命令:
```bash
# 查看库中包含的对象文件
ar t ./libs/libtzdb_full.a

# 查看库中的符号
nm ./libs/libtzdb_full.a | grep -E "^[0-9a-f]+ [TB] "

# 查看库文件大小
ls -lh ./libs/*.a
```

### Q: 修改了源代码后如何更新库？

**方案 1(推荐)**:
```bash
cd cmake-build-release && make -j$(nproc) && cd ..
./scripts/combine_libs_from_static.sh ./cmake-build-release/lib ./libs
```

**方案 2(备选)**:
```bash
cd cmake-build-release && make -j$(nproc) && cd ..
./scripts/extract_object_files.sh ./cmake-build-release ./object_files
./scripts/combine_object_files.sh ./object_files ./libs
```

### Q: 两种方案生成的库有什么区别？
A: 功能完全相同，都能正常链接和运行。主要区别:
- **方案 1**: 文件更小，无重复，速度更快
- **方案 2**: 文件较大，可能有重复对象文件(因为名称冲突加前缀)

### Q: 为什么方案 1 生成的库更小？
A: 方案 1 直接合并静态库，每个对象文件只出现一次。方案 2 从对象文件重新打包，可能因为文件名冲突而添加前缀导致重复。

### Q: 什么时候应该使用方案 2？
A: 当你需要:
- 精确控制哪些对象文件被包含
- 调试特定的对象文件问题
- 自定义对象文件的组合方式

## 注意事项

1. **构建顺序**: 必须先构建项目生成对象文件，再运行脚本
2. **路径一致性**: 确保脚本中的路径与实际构建目录一致
3. **清理**: 如果遇到问题，可以删除 `object_files` 和 `libs` 目录重新生成
4. **并发构建**: 使用 `-j$(nproc)` 可以加速构建过程

## 相关文档

- `OBJECT_FILES_GUIDE.md` - 对象文件提取和组合的详细指南
- `scripts/combine_libs_from_static.sh` - 从静态库组合变体库脚本(推荐)
- `scripts/extract_object_files.sh` - 对象文件提取脚本(备选方案)
- `scripts/combine_object_files.sh` - 从对象文件组合库脚本(备选方案)

## 技术细节

### 方案 1 实现原理

使用 `ar` 的 MRI(Multiple Response Input)脚本功能:

```bash
# 创建 MRI 脚本
CREATE libtzdb_dist.a
ADDLIB libtzdb_server.a
ADDLIB libtzdb_api_sql.a
ADDLIB libtzdb_common.a
...
SAVE
END

# 执行合并
ar -M < script.mri
```

**优势**:
- `ar` 原生支持，无需额外工具
- 自动去重，每个符号只保留一份
- 保持对象文件的原始结构

### 方案 2 实现原理

两步流程:

1. **提取阶段**:递归查找 `CMakeFiles/xxx_obj.dir/` 下的所有 `.o` 文件
2. **组合阶段**:使用 `ar rcs` 将对象文件打包成静态库

**注意**:
- 必须递归提取(不能使用 `-maxdepth 1`)
- 文件名冲突时自动添加库名前缀
- 可能产生重复的对象文件
