---
title: "Odbc Ipc Repeat Run Catalog Issue"
description: "project-tzdb-rebuild 文档整理稿（源：raw_snapshot/docs/odbc/odbc_ipc_repeat_run_catalog_issue.md）"
---

# ODBC IPC 重复执行导致 Catalog 恢复崩溃分析

## 现象

执行以下测试：

```bash
ctest -R cs_odbc_ipc_multi_client --output-on-failure
```

第一次通常可以通过，但在同一个数据库目录上第二次执行时，服务端会在恢复或后续访问阶段崩溃。

对应的 DB 接口测试：

```bash
ctest -R cs_ipc_multi_client --output-on-failure
```

在同一个全新目录上连续执行两次可以通过。

## 稳定复现方式

使用同一个全新临时目录和同一个 IPC 名称，连续执行两次 ODBC 包装脚本：

```bash
/bin/sh tests/cs_test/run_cs_odbc_ipc_multi_client_ctest.sh \
  cmake-build-debug/bin/tests/cs_test/cs_ipc_server \
  cmake-build-debug/bin/tests/cs_test/cs_odbc_ipc_multi_client \
  /tmp/odbc-repro tzdb_odbc_repro repro_db
```

第一次通过，第二次稳定失败。

而使用 DB 包装脚本：

```bash
/bin/sh tests/cs_test/run_cs_ipc_multi_client_ctest.sh \
  cmake-build-debug/bin/tests/cs_test/cs_ipc_server \
  cmake-build-debug/bin/tests/cs_test/cs_ipc_multi_client \
  /tmp/db-repro tzdb_db_repro repro_db
```

同样条件下两次都可通过。

## 崩溃点

服务端断言位于：

- `src/inc/kernel/catalog/catalog.h:390`

断言逻辑：

- `table_names_` 中存在该表
- `index_names_` 中却不存在对应表项

这说明磁盘恢复后的 catalog 元数据出现了不一致。

进一步定位时可以稳定观察到：

- `indexes_` 中仍然有 `ddl_same_name`
- `index_names_` 中却没有 `ddl_same_name` 对应表项

也就是说，问题不是索引对象根本没创建，而是某条后续 catalog 重建或清理路径把按表名维护的索引名字映射弄丢了。

## 对比结论

问题不是 IPC 连接重复创建本身，也不是单纯的句柄释放问题。  
更接近于：

- ODBC 测试路径在第一次执行时写出了“可立即使用，但重启恢复后不一致”的元数据状态
- 第二次启动服务端恢复数据库时触发 catalog 不变量断言

DB 测试路径之所以没有触发，是因为它的 DDL/DML 事务边界更保守。

## 已确认的关键差异

ODBC 测试 `tests/cs_test/cs_odbc_ipc_multi_client.cpp` 原始流程中，以下操作会落在同一个手动事务里：

- warmup: `CREATE TABLE` + `DELETE` + `INSERT` + `SELECT`
- setup: `DROP TABLE` + `CREATE TABLE` + `DELETE`

而 DB 测试会把这些步骤拆成多个独立提交。

这说明当前内核或恢复路径对“DDL 与后续 DML/SELECT 混在同一个手动事务中”不够健壮，ODBC 路径正好稳定触发了这个缺陷。

## 临时规避

已在测试中验证：如果把 ODBC 测试的 warmup/setup 改成与 DB 测试一致的提交边界，则在同一个全新目录上连续执行两次可以通过。

## ODBC 层保护

为了先挡住这类问题，ODBC 层增加了 DDL 保护：

- 识别 `CREATE` / `DROP` / `ALTER` / `TRUNCATE` / `REINDEX` / `VACUUM`
- 即使连接处于 `AUTOCOMMIT=OFF`
- 也会在执行 DDL 前先提交当前活跃事务
- 然后用独立事务执行 DDL 并立即提交

这不是最终根因修复，而是驱动层保护措施，用来避免 catalog 相关 DDL 落入长事务并再次触发恢复不一致。

## 内核根因

后续把问题缩到最小后，根因收敛为两个相互叠加的行为：

- 同一事务内先 `DROP TABLE ddl_same_name`
- 再 `CREATE TABLE ddl_same_name (...)`

旧实现中，`EnsureTableFresh(table_oid, table_name, txn)` 在缓存失效后会调用：

- `RebuildTableFromSystemTables(table_name, txn)`

这里是按“表名”去 `__pg_class` 里找目标行，而不是按当前调用方期望的 `table_oid` 去精确命中。  
因此当系统表中同时还能看到旧表行和新表行时，重建过程可能错误命中旧表 `oid=5`，把旧表重新装回内存 catalog。

随后提交阶段的 `FinalizePendingDrop` 又会按 `table_name` 清旧表 metadata。  
如果此时同名新表已经是 live mapping，就会出现：

- `indexes_` 里还保留了新表索引对象
- `index_names_[table_name]` 被旧表 finalize 路径擦掉或覆盖

这正对应了断言现场。

## 已完成修复

内核侧已补两层修复：

- `EnsureTableFresh` 重建时改为优先按期望 `table_oid` 精确重建，避免同名旧表被错误捞回
- `FinalizePendingDrop` 在发现同名新表已经替换 live mapping 时，只清理旧表自己的系统表和索引对象，不再动当前 live 的 `table_names_` / `index_names_`

这样可以同时解决：

- 同事务内同名 `DROP/CREATE` 导致的错误重建
- 提交阶段旧表 finalize 误伤新表索引映射

## 回归验证

已经验证以下场景：

- `tests/integration_test/recovery_test/ddl_same_name_recovery_test.cpp`
  - 现在已可正常通过，不再需要禁用
- `ctest -R cs_odbc_ipc_multi_client --output-on-failure`
  - 在同一工作树下可重复执行，不再出现第二次崩溃
- `ctest -R cs_ipc_multi_client --output-on-failure`
  - 仍保持通过

ODBC 层的 DDL 保护仍然保留，作为额外防护。

## 后续方向

### 1. 内核级最小复现

收缩出最小 SQL 序列，例如：

```sql
DROP TABLE IF EXISTS t;
CREATE TABLE t(id INT PRIMARY KEY);
DELETE FROM t;
INSERT INTO t VALUES (1);
SELECT id FROM t WHERE id = 1;
```

并精确验证：

- 是否必须放在同一个手动事务中才会触发
- 是否只有 `DROP/CREATE` 与后续 DML 混合时会触发
- 是否恢复阶段写坏了 `index_names_`

目前已补了一个回归测试用于覆盖该问题：

- `tests/integration_test/recovery_test/ddl_same_name_recovery_test.cpp`

该测试不经过 ODBC / IPC，只验证：

- 同一事务内 `DROP TABLE same_name`
- 随后 `CREATE TABLE same_name (...)`
- 关闭并重开数据库后是否仍能保持 `table_names_` / `index_names_` 一致

### 2. 内核级根因排查

重点查看：

- `Catalog::DropTable`
- `Catalog::CreateTable`
- `Catalog::FinalizePendingDrop`
- catalog 元数据持久化与恢复
- `index_names_` 和 `table_names_` 的重建路径
- DDL 与 checkpoint / WAL / recovery 的交互

当前一个高概率方向是：

- `DropTable(txn != nullptr)` 会把旧表放进 `pending_drops_`
- 若同一事务里又创建了同名新表，提交阶段仍按旧 `table_name` 去 finalize drop
- 这可能与新表的 `table_names_` / `index_names_` 发生覆盖或清理冲突

这个方向已经形成并验证了内核修复，因此当前策略是：

- 保留 ODBC 层保护，继续作为驱动侧防线
- 由内核侧保证同事务同名 `DROP/CREATE` 的 catalog/recovery 一致性

## 当前结论

当前最可靠的结论是：

- 问题首先由 ODBC 路径暴露
- 但根因在 TZDB 内核对“同事务同名 `DROP/CREATE`”的 catalog 重建与 finalize 逻辑
- ODBC 层保护和内核修复现在都已落地
