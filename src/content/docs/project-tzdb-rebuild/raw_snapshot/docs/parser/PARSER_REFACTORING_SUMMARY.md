---
title: "PostgreSQL Parser 改造总结"
description: "PostgreSQL Parser 改造总结"
---

# PostgreSQL Parser 改造总结

## 当前结论

`libpg_query` 已经从依赖 `thread_local`/线程态桥接的方案，收敛到**显式 `parser_state*` + 调用级状态**模型。

当前实现有几个关键点:

- `pg_parser_init/reset/parse/cleanup` 都显式接收 `parser_state*`
- `raw_parser(parser_state *state, const char *str)` 直接把 state 送进 parser 主链路
- scanner/grammar 通过 `yyextra.core_yy_extra.state` 访问本次 parse 的上下文
- `PostgresParser` 持有自己的 `state_`，`Parse()` 前 reset，`Tokenize()` 使用临时 state
- parser 运行时已经**不再依赖** `thread_local`、`current_parser_state`、`FORCE_MUTEX_PARSER`

这意味着 parser 状态现在绑定的是**一次调用 / 一个 parser 实例**，而不是线程。

## 当前实现结构

```text
PostgresParser::Parse(query)
  -> pg_parser_reset(state_)
  -> pg_parser_parse(state_, query, &result)
     -> raw_parser(state_, query)
        -> yyextra.core_yy_extra.state = state_
        -> scanner_init(...)
        -> base_yyparse(yyscanner)
```

对应代码位置:

- [pg_functions.hpp](/Users/xwg/dev/tzdb/tzdb-rebuild/src/inc/libpg_query/include/pg_functions.hpp)
- [pg_functions.cpp](/Users/xwg/dev/tzdb/tzdb-rebuild/src/binder/libpg_query/pg_functions.cpp)
- [src_backend_parser_parser.cpp](/Users/xwg/dev/tzdb/tzdb-rebuild/src/binder/libpg_query/src_backend_parser_parser.cpp)
- [scanner.hpp](/Users/xwg/dev/tzdb/tzdb-rebuild/src/inc/libpg_query/include/parser/scanner.hpp)
- [postgres_parser.hpp](/Users/xwg/dev/tzdb/tzdb-rebuild/src/inc/libpg_query/include/postgres_parser.hpp)
- [postgres_parser.cpp](/Users/xwg/dev/tzdb/tzdb-rebuild/src/binder/libpg_query/postgres_parser.cpp)

## 主要改动

### 1. `parser_state` 成为唯一解析状态容器

`parser_state` 当前承载:

- 错误码、错误位置、错误消息
- `preserve_identifier_case`
- parse 期间的分配器 / arena 元数据

相关实现:

- [pg_functions.cpp](/Users/xwg/dev/tzdb/tzdb-rebuild/src/binder/libpg_query/pg_functions.cpp#L16)

### 2. 内存和错误处理全部显式吃 `parser_state*`

以下 helper 已经改成显式状态版本:

- `palloc`
- `pstrdup`
- `palloc0fast`
- `repalloc`
- `psprintf`
- `errcode`
- `errmsg`
- `errposition`
- `ereport`

这一步把 parser 的 allocator/error state 从 TLS 完整挪到了调用级上下文。

### 3. scanner/grammar 通过 `yyextra` 取上下文

当前不是“外面传 state，里面再从 thread_local 取”，而是:

- `raw_parser()` 在进入 parser 前把 `state` 塞进 `yyextra`
- scanner 和 grammar helper 通过 `yyscanner -> yyextra -> state` 获取本次 parse 的状态

这也是为什么现在已经不需要 `current_parser_state` 这种中间工作指针。

### 4. `PostgresParser` 自己持有生命周期

`PostgresParser` 的模型现在是:

- 构造时创建 `state_`
- `Parse()` 前 reset
- 析构时 cleanup

这样 parse tree 的生命周期和 parser 实例绑定，而不是和线程绑定。

### 5. `Tokenize()` 使用独立临时 state

`Tokenize()` 不复用 `PostgresParser` 对象内的状态，而是创建临时 `parser_state`，结束后释放。

这让 tokenize 和 parse 都遵守同一个“调用级状态”模型。

## 已移除的旧设计

下面这些旧说法已经不再适用于当前代码:

- `current_parser_state`
- `thread_local current_parser_state`
- `static current_parser_state + mutex`
- `FORCE_MUTEX_PARSER`
- “标准平台走 THREAD_LOCAL，TMOS 走 MUTEX”
- “raw_parser(state, ...) 只是为了 API 一致性，实际还靠 thread local”

现在的 parser 没有平台分叉模式，Windows / Linux / macOS / TMOS 走的是同一套显式状态模型。

## 相关收尾清理

这次 parser 改造之后，还做了几项和 TLS 相关的收尾:

- 删除了 `libpg_query` 里的 `__thread` 兼容宏
  - [pg_definitions.hpp](/Users/xwg/dev/tzdb/tzdb-rebuild/src/inc/libpg_query/include/pg_definitions.hpp)
- 删除了仓库里不再使用的 `ThreadLocal` 包装类
  - [thread_local.h](/Users/xwg/dev/tzdb/tzdb-rebuild/src/inc/os/thread/thread_local.h)
- `Watermark` 改成事务显式持有 shard token，不再依赖线程态
  - [watermark.h](/Users/xwg/dev/tzdb/tzdb-rebuild/src/inc/transaction/mvcc/watermark.h)
  - [watermark.cpp](/Users/xwg/dev/tzdb/tzdb-rebuild/src/transaction/mvcc/watermark.cpp)

## Grammar Helper 说明

这次改造里，`grammar` 相关的 helper 逻辑目前仍然以生成文件为实际编译入口:

- [src_backend_parser_gram.cpp](/Users/xwg/dev/tzdb/tzdb-rebuild/src/binder/libpg_query/src_backend_parser_gram.cpp)
- [grammar.hpp](/Users/xwg/dev/tzdb/tzdb-rebuild/src/inc/libpg_query/grammar/grammar.hpp)

这里要特别注意一条约束:

- 不要把仅用于“源码补档”或“生成前草稿”的 `grammar.cpp` 放进 [src/inc/libpg_query/grammar](/Users/xwg/dev/tzdb/tzdb-rebuild/src/inc/libpg_query/grammar) 这类源码目录

原因是当前 `cmake` 构建不会编它，但 TMOS 侧还有独立的 `make` 构建链，后者如果按目录或通配扫描 `*.cpp`，就可能把这种辅助文件误编进去。

所以当前阶段的建议是:

- 真实参与构建的 grammar 逻辑仍以 [src_backend_parser_gram.cpp](/Users/xwg/dev/tzdb/tzdb-rebuild/src/binder/libpg_query/src_backend_parser_gram.cpp) 为准
- 需要保留的“生成前 helper 草稿”只放文档、脚本模板或补丁记录里，不放源码目录

## 验证方式

推荐的本地验证命令:

```bash
ninja -C /Users/xwg/dev/tzdb/tzdb-rebuild/cmake-build-debug unit_test

/Users/xwg/dev/tzdb/tzdb-rebuild/cmake-build-debug/bin/tests/unit_test/unit_test \
  --gtest_color=yes \
  --gtest_filter='ParserThreadSafety.*'
```

如果要回归相关清理项，还可以额外跑:

```bash
/Users/xwg/dev/tzdb/tzdb-rebuild/cmake-build-debug/bin/tests/unit_test/unit_test \
  --gtest_color=yes \
  --gtest_filter='MVCCReadOnlyTransactionTest.*:MVCCGarbageCollectionTest.*:RandomUtilsTest.*'
```

## 结果

当前可以认为:

- parser 运行时已经不依赖 TLS
- TMOS 不再需要 parser 专用 mutex fallback
- scanner / parser / helper 的状态归属已经是显式的
- 旧的文档里关于 `THREAD_LOCAL vs MUTEX` 的切换说明已经失效

## 后续建议

如果未来还要继续整理文档，建议统一按下面的口径描述:

- parser 是 **context/state-driven**
- 状态归属是 **parse call / parser instance**
- 并发安全来自 **无共享解析状态**，而不是来自 thread-local 隔离
