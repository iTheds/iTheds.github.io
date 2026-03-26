---
title: "Rocksdb集成"
description: "project-tzdb-rebuild 文档整理稿（源：raw_snapshot/docs/storage/ROCKSDB_INTEGRATION.md）"
---

# RocksDB Integration (Optional Engine)

## Build Switch

- CMake option: `TZDB_ENABLE_ROCKSDB`
- Default: `ON` (disable with `-DTZDB_ENABLE_ROCKSDB=OFF`)
- Enable:

```bash
cmake -S . -B build-rocks -DTZDB_ENABLE_ROCKSDB=ON
cmake --build build-rocks -j
```

Windows (Visual Studio generator):

```powershell
cmake -S . -B build-rocks -G "Visual Studio 17 2022" -A x64 -DTZDB_ENABLE_ROCKSDB=ON
cmake --build build-rocks --target rocksdb_vendor_install --config Release --parallel
cmake --build build-rocks --config Release --parallel
ctest --test-dir build-rocks -C Release --output-on-failure
```

## Vendor Build Contract

- Source path: `src/third_party/rocksdb`
- Build mode: independent `ExternalProject` build
- Static output (Linux/macOS): `${CMAKE_BINARY_DIR}/third_party/rocksdb/install/lib/librocksdb.a`
- Static output (Windows): `${CMAKE_BINARY_DIR}/third_party/rocksdb/install/lib/rocksdb.lib`
- Imported target: `tzdb::rocksdb_vendor`

## Runtime Semantics

- Storage type: `kRocksStorage`
- Engine implementation: `rocksdb::TransactionDB`
- Transaction scope: one TZDB txn maps to one RocksDB txn
- Cross-engine write in one txn (`kDiskStorage` + `kRocksStorage`) is rejected with `kUnsupported`
- Rocks tables do not use TZDB ARIES redo/undo (ARIES is disk-only)

## Catalog Persistence and Restart

- `__pg_class.storage_type` persists `kRocksStorage` for rocks tables.
- `__pg_class.relroot_page` for rocks tables uses a fixed sentinel (`-1`).
- On catalog load, runtime selects storage instance by `storage_type` from `storage_map_`.
- For rocks tables, loader ignores `relroot_page` sentinel and rebuilds `TableHeap` on rocks storage.

## Current Limits

- No secondary index on rocks tables.
- `PRIMARY KEY` auto-index path is unsupported on rocks tables.
- SQL syntax is unchanged; create rocks table via C++ API `CreateTable(..., kRocksStorage)`.
