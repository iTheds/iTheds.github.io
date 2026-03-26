---
title: "PGNamespace/PGDescription查询说明"
description: "project-tzdb-rebuild 文档整理稿（源：raw_snapshot/docs/pgserver/pg_namespace_pg_description_query_explanation.md）"
---

# PG 元数据查询结果说明

## 查询一：`pg_namespace` / `pg_description`

### 问题 SQL

```sql
SELECT n.oid,n.*,d.description
FROM pg_catalog.pg_namespace n
LEFT OUTER JOIN pg_catalog.pg_description d
  ON d.objoid=n.oid AND d.objsubid=0 AND d.classoid='pg_namespace'::regclass
ORDER BY nspname;
```

你提供的会话中，实际输入展示为：

```sql
SELECT n.oid,n.,d.description ...
```

这里 `n.` 缺少 `*`，语义上已经不是上面的标准写法。

### 这条 SQL 在 PostgreSQL 里的语义

- `n.oid`：输出 schema 的 OID。
- `n.*`：展开 `pg_namespace` 的全部列（`oid/nspname/nspowner/nspacl`）。
- `LEFT JOIN pg_description d`：尝试关联 schema 的对象注释。
- `d.objsubid=0`：只取对象级注释（非列级注释）。
- `d.classoid='pg_namespace'::regclass`：只取“对象类型=pg_namespace”的注释记录。

### 当前项目中的实现方式

`pgserver` 对元数据查询采用“规则匹配 + 合成结果”的方式，而不是完整 PostgreSQL catalog 执行器。

- 归一化逻辑见 `NormalizeMetadataQuery`：`src/pgserver/pg_protocol.cpp:34`。
- 若识别到“`pg_namespace` + `pg_description` + `'pg_namespace'::regclass`”组合，走专门分支：
  - 识别函数：`src/pgserver/pg_protocol.cpp:494` 中 `IsPgNamespaceDescriptionQuery`
  - 描述列分支：`src/pgserver/pg_protocol.cpp:1170`
  - 执行返回分支：`src/pgserver/pg_protocol.cpp:2445`
- 若未命中上述条件，但 SQL 里出现 `pg_description`，会落到通用分支：
  - 描述列分支：`src/pgserver/pg_protocol.cpp:1639`
  - 执行返回分支：`src/pgserver/pg_protocol.cpp:2938`

### 为什么会出现 `objoid | classoid | objsubid | description` 且只有 3 行

这是通用 `pg_description` 分支的返回格式，不是 `pg_namespace` 专用分支格式。

通用分支会为每个用户表生成：

- 1 行表级描述（`objsubid=0`）
- 每列 1 行列级描述（`objsubid=1..N`）

因此，当数据库中只有 1 张 2 列表时，就会出现 3 行（`0/1/2`），和你看到的输出一致。相关构造逻辑见 `src/pgserver/pg_protocol.cpp:2947` 与 `src/pgserver/pg_protocol.cpp:2949`。

### 结论：这是否正常

- 对“当前 TZDB pg 协议适配实现”来说：这是正常现象（命中回退分支后的预期输出）。
- 对“标准 PostgreSQL 语义”来说：这不是预期结果，说明 SQL 没有被识别为 `pg_namespace` 专用查询（最常见是 SQL 写错，例如 `n.`）。

### 建议

- 优先使用 smoke 脚本里的标准写法（见 `tests/pg_server_test/dbeaver_metadata_smoke.sh:116`）。
- 如果只是查 schema 信息，尽量改成显式列，减少客户端差异带来的影响：

```sql
SELECT n.oid, n.nspname, n.nspowner, n.nspacl, d.description
FROM pg_catalog.pg_namespace n
LEFT JOIN pg_catalog.pg_description d
  ON d.objoid=n.oid AND d.objsubid=0 AND d.classoid='pg_namespace'::regclass
ORDER BY n.nspname;
```

## 查询二：`pg_settings.standard_conforming_strings`

### 问题 SQL

```sql
select * from pg_catalog.pg_settings where name='standard_conforming_strings';
```

### 结果含义

返回 `setting = on` 的含义是：

- 普通字符串字面量 `'...'` 中，反斜杠 `\` 按普通字符处理，不再作为转义起始符。
- 如果要使用反斜杠转义（例如 `\n`、`\t`），应使用 `E'...'`（escape string literal）。

示例：

```sql
SELECT 'a\nb';   -- 在 standard_conforming_strings=on 时，结果是字符 a \ n b
SELECT E'a\nb';  -- 结果是两行：a 换行 b
```

### 输出列说明

- `name=standard_conforming_strings`：参数名。
- `setting=on`：当前值。
- `category=Compatibility Options`：兼容性参数分组。
- `short_desc`：语义描述（反斜杠按字面处理）。
- `vartype=bool`：布尔参数。
- `source=default`：当前值来自默认设置，而不是本会话动态修改。
- `enumvals={on,off}`：可选值集合。

### 在当前 TZDB pgserver 的实现

这项在当前实现里是协议兼容层返回的固定值：

- `pg_settings` 合成行里写死为 `on`：`src/pgserver/pg_protocol.cpp:3023`
- `current_setting('standard_conforming_strings')` 固定返回 `on`：`src/pgserver/pg_protocol.cpp:2644`
- 连接握手时发送 `ParameterStatus(standard_conforming_strings=on)`：`src/pgserver/pg_protocol.cpp:4357`

另外，当前 `SET` 语句在执行层主要是“返回成功以兼容客户端”，不真正持久化会话变量（见 `src/query/query_ddl.cpp:71`），因此这里应理解为兼容值，而非完整可配置参数系统。

## 查询三：`string_agg(...) from pg_catalog.pg_get_keywords()`

### 问题 SQL（示例）

```sql
select string_agg(word, ',')
from pg_catalog.pg_get_keywords()
where word <> ALL ('{...很长关键词列表...}'::text[]);
```

### 结果含义

你看到：

```text
 string_agg
------------

(1 row)
```

表示聚合结果是“空白值”。在 `psql` 默认显示下，空字符串 `''` 和 `NULL` 都可能看起来是空白。

### 在当前 TZDB pgserver 的实现

当前实现对这类 SQL 走了专门兼容分支，固定返回一列 `string_agg`，并写入空字符串：

- 描述列分支：`src/pgserver/pg_protocol.cpp:1347`
- 执行返回分支：`src/pgserver/pg_protocol.cpp:3039`
- 返回值构造：`result.rows.push_back({""});`（空字符串）

因此在当前项目里，这个空白结果是预期行为。

### 这个结果“对吗”

- 对“当前 TZDB pg 协议适配实现”来说：是对的（兼容分支固定行为）。
- 对“严格 PostgreSQL 语义”来说：不完全等价。标准 PostgreSQL 会基于 `pg_get_keywords()` 的真实数据计算 `string_agg`，而不是固定空字符串。

如果需要更接近 PostgreSQL，可把该分支优化为：

1. 先生成关键词集合（至少覆盖客户端常用关键词）。
2. 执行 `where word <> ALL (...)` 过滤。
3. 对过滤后结果执行真实 `string_agg`。
4. 当过滤后无行时返回 `NULL`（而不是 `''`）。

## 查询四：`SELECT * FROM pg_catalog.pg_enum WHERE 1<>1 LIMIT 1`

### 问题 SQL

```sql
SELECT * FROM pg_catalog.pg_enum WHERE 1<>1 LIMIT 1;
```

### 结果含义

你看到：

```text
 oid | enumtypid | enumlabel | enumsortorder
-----+-----------+-----------+---------------
(0 rows)
```

这是“只返回列结构、不返回数据”的典型结果。

- `WHERE 1<>1` 是恒假条件，任何数据集都会被过滤为 0 行。
- `LIMIT 1` 在 0 行场景下没有额外影响。

### 在当前 TZDB pgserver 的实现

`pg_enum` 兼容分支目前只定义列，不生成任何行：

- 描述列分支：`src/pgserver/pg_protocol.cpp:1672`
- 执行返回分支：`src/pgserver/pg_protocol.cpp:3062`

因此即使不加 `WHERE 1<>1`，当前实现通常也会返回 0 行。

### 这个结果“对吗”

- 对“这条具体 SQL（`WHERE 1<>1`）”来说：对，是正确结果。
- 对“当前 TZDB 兼容实现”来说：也对，预期就是 0 行。
- 对“完整 PostgreSQL 行为”来说：这条 SQL 依然应是 0 行；但若去掉 `WHERE 1<>1`，PostgreSQL 在存在 enum 类型时会返回数据，而当前实现仍可能是空集。

## 查询五：`SELECT reltype FROM pg_catalog.pg_class WHERE 1<>1 LIMIT 1`

### 问题 SQL

```sql
SELECT reltype FROM pg_catalog.pg_class WHERE 1<>1 LIMIT 1;
```

### 标准 PostgreSQL 语义

- `reltype` 是 `pg_class` 中“该关系对应的行类型 OID”（通常对应 `pg_type` 里某个复合类型）。
- `WHERE 1<>1` 恒假，所以标准 PostgreSQL 结果应是：只返回 1 列（`reltype`），且 0 行。

### 你当前看到的输出说明了什么

你实际拿到的是：

```text
 oid |  relname   | relnamespace | relkind | relhasindex | reltuples | relpages | relpersistence
-----+------------+--------------+---------+-------------+-----------+----------+---------------
   5 | test_table |         2200 | r       | f           |         0 |        0 | p
(1 row)
```

这说明当前 `pgserver` 命中了 `pg_class` 的通用兼容分支，该分支直接返回固定列集合与合成数据，未按这条 SQL 的投影/过滤条件精确执行（即没有按 `reltype` 投影，也没有执行 `WHERE 1<>1` 过滤）。

相关实现：

- `pg_class` 描述列定义：`src/pgserver/pg_protocol.cpp:1564`
- `pg_class` 执行返回分支：`src/pgserver/pg_protocol.cpp:3505`

该问题已在当前代码中修复：针对这类探测 SQL 增加了专门识别分支，返回 `reltype` 单列且 0 行。

### 你看到的每列含义

- `oid=5`：该关系对象在 `pg_class` 中的对象 OID（当前兼容层里这是合成值）。
- `relname=test_table`：关系名（表名/索引名等），这里是表 `test_table`。
- `relnamespace=2200`：schema OID，`2200` 对应 `public`。
- `relkind=r`：关系类型，`r` 代表普通表（`i` 通常代表索引）。
- `relhasindex=f`：是否有索引。`f` 表示当前兼容层判定该表没有索引。
- `reltuples=0`：统计估算的行数（兼容层返回值，当前为 0）。
- `relpages=0`：统计估算的数据页数（兼容层返回值，当前为 0）。
- `relpersistence=p`：持久化类型，`p` 代表 permanent（持久表）。

### 这个结果“对吗”

- 你贴出来的那组“8 列 + 1 行”结果：对标准 PostgreSQL 语义不对。
- 修复后，预期结果应为：`reltype` 单列，`0 rows`。

## 查询六：`pg_catalog.pg_type` 宽表元数据查询

### 问题 SQL（典型形态）

```sql
SELECT t.oid,t.*,c.relkind,format_type(nullif(t.typbasetype, 0), t.typtypmod) as base_type_name,d.description
FROM pg_catalog.pg_type t
LEFT OUTER JOIN pg_catalog.pg_type et ON et.oid=t.typelem
LEFT OUTER JOIN pg_catalog.pg_class c ON c.oid=t.typrelid
LEFT OUTER JOIN pg_catalog.pg_description d ON t.oid=d.objoid
WHERE t.typname IS NOT NULL
  AND (c.relkind IS NULL OR c.relkind = 'c')
  AND (et.typcategory IS NULL OR et.typcategory <> 'C');
```

### 这条查询是做什么的

这是客户端（例如 DBeaver/驱动）常用的“类型字典探测 SQL”，用于一次性拉取类型系统元数据（类型名、OID、数组 OID、长度、分类、基础类型名等），以便做：

- 列类型展示
- 参数类型推断
- schema 浏览时的类型映射

### 你这次结果说明了什么

- 返回 16 行，对应当前实现内置支持的 16 个基础类型（`bool/char/name/int2/int4/int8/oid/float4/float8/date/time/varchar/text/bytea/timestamp/numeric`）。
- 返回列很多，是因为当前实现走了“宽列”版本（`AppendWidePgTypeColumns`），会输出接近 PostgreSQL `pg_type` 的完整字段集合，再附加 `relkind`、`base_type_name`、`description`。

相关实现：

- 内置类型集合：`src/pgserver/pg_protocol.cpp:90`
- 宽列定义：`src/pgserver/pg_protocol.cpp:238`
- 单行构造：`src/pgserver/pg_protocol.cpp:279`
- 查询匹配（Describe）：`src/pgserver/pg_protocol.cpp:1190`
- 查询匹配（Execute）：`src/pgserver/pg_protocol.cpp:2479`

### 这个结果“对吗”

- 对“当前 TZDB pg 协议兼容实现”来说：对，结果是预期的。
- 对“标准 PostgreSQL 严格语义”来说：若 SQL 真的是你贴的 `t.oid,t.,...`（`t.` 缺少 `*`），那应是语法错误；当前实现因为采用规则匹配，仍返回了类型元数据结果。

因此可解读为：你拿到的是“兼容层的预期元数据输出”，但 SQL 语法校验并非完全等价 PostgreSQL。

## 近期修复记录（`pg_class` 元数据分支）

针对如下查询形态：

```sql
SELECT c.oid,c.*,d.description,
       pg_catalog.pg_get_expr(c.relpartbound, c.oid) AS partition_expr,
       pg_catalog.pg_get_partkeydef(c.oid) AS partition_key
FROM pg_catalog.pg_class c ...
```

已做两项修复：

1. 支持按 `c.relnamespace` 过滤（包含扩展协议参数替换后的字面值）。
2. 修正该分支中 `relam/relfilenode` 的明显错位映射（不再将表 OID误填到 `relam`）。

说明：该分支仍属于兼容层合成结果，不等于完整 PostgreSQL catalog 执行器。

## 查询七：DBeaver/JDBC 连接日志时序（2026-03-09）

### 你这段日志里实际发生了什么

按时间序列可分为 6 类动作：

1. 连接后基础上下文探测：
   - `SELECT current_schema(),session_user`
   - `SHOW search_path`
2. schema 与注释探测：
   - `SELECT n.oid,n.*,d.description FROM pg_namespace ... pg_description ...`
3. 会话参数与关键字探测：
   - `select * from pg_settings where name=$1`（绑定值 `standard_conforming_strings`）
   - `select string_agg(word, ',') from pg_get_keywords() ...`
4. 仅拉取列结构的探针：
   - `SELECT * FROM pg_enum WHERE 1<>1 LIMIT 1`
   - `SELECT reltype FROM pg_class WHERE 1<>1 LIMIT 1`
5. 类型系统/表元数据探测：
   - `SELECT t.oid,t.*,c.relkind,... FROM pg_type ...`
   - `SELECT c.oid,c.*,d.description,... FROM pg_class ... WHERE c.relnamespace=$1 ...`
   - `SELECT e.oid, ... FROM pg_type ... WHERE t.oid = $1`
6. 角色/表空间/继承/列定义等补充探测：
   - `pg_roles`、`pg_tablespace`、`pg_inherits`、`pg_attribute` 等查询。

这正是 DBeaver + pgjdbc 连接后典型的“元数据预取”行为，不是用户手工 SQL。

### Parse/Describe/Metadata trace 三种日志的关系

- `Extended Parse SQL`：服务端看到的“预编译 SQL 模板”，参数位置是 `$1`。
- `Extended Portal Describe SQL`：已绑定参数值后的 SQL 展示（例如 `'2200'`、`'1043'`）。
- `Metadata trace SQL`：执行阶段在 `ExecuteQuery` 打印的 SQL（当前实现里一般也是绑定后文本）。

所以你看到同一条语句出现 2~3 次是正常的扩展协议生命周期，不是重复执行 bug。

### `1259` 是什么，是否正确

`1259` 是系统表 `pg_class` 的 OID（即 `'pg_class'::regclass = 1259`）。  
在这类条件里：

```sql
d.classoid='pg_class'::regclass
```

`classoid=1259` 是正确结果。

### 这次日志是否“整体正确”

结论：整体正确，且符合当前兼容层预期。

- `SHOW search_path -> public`：正确（默认 schema）。
- `standard_conforming_strings -> on`：正确（兼容层固定值）。
- `pg_enum WHERE 1<>1 LIMIT 1 -> 0 rows`：正确（探测列结构）。
- `WHERE t.oid='1043'` 的元素类型查询返回 0 行：正确（`varchar` 不是数组类型）。
- 同一 SQL 出现 Parse/Describe/Execute 三阶段：正确（扩展协议特性）。

## 自动化复现脚本（新增）

新增脚本：

- `tests/pg_server_test/pgjdbc_dbeaver_trace_smoke.sh`
- `tests/pg_server_test/PgJdbcDBeaverTraceProbe.java`

用途：

1. 启动本地 `pg_server`。
2. 用 pgjdbc 执行与 DBeaver 同形态的元数据查询（含参数绑定）。
3. 校验结果集是否符合兼容预期。
4. 校验服务端日志是否出现关键 `Extended Parse SQL` 片段。

运行示例：

```bash
tests/pg_server_test/pgjdbc_dbeaver_trace_smoke.sh cmake-build-release
```

本次运行结果：

- 输出：`PgJDBC DBeaver-trace smoke test passed`
- 探针输出：`ALL_CHECKS_PASSED`
- 说明当前日志链路与关键结果均通过。

## 查询八：`pg_type.typelem` 元素类型探测

### 问题 SQL

```sql
SELECT e.oid,
       n.nspname = ANY(current_schemas(true)),
       n.nspname,
       e.typname
FROM pg_catalog.pg_type t
JOIN pg_catalog.pg_type e ON t.typelem = e.oid
JOIN pg_catalog.pg_namespace n ON t.typnamespace = n.oid
WHERE t.oid = '1043';
```

### 逐段含义

1. `FROM pg_type t`：把 `t` 当成“待检查的类型”。
2. `JOIN pg_type e ON t.typelem = e.oid`：若 `t` 是数组类型，则 `typelem` 指向元素类型 OID，通过 `e` 取元素类型信息。
3. `JOIN pg_namespace n ON t.typnamespace = n.oid`：取待检查类型 `t` 所在 schema 名。
4. `n.nspname = ANY(current_schemas(true))`：判断该 schema 是否在当前 schema 搜索路径里。
5. `WHERE t.oid='1043'`：指定待检查类型是 OID 1043（`varchar`）。

### 返回列解释

- `e.oid`：元素类型 OID（只有数组类型才有）。
- `?column?`：布尔表达式 `n.nspname = ANY(...)` 的结果。因为表达式没有 `AS` 别名，列名显示成 `?column?`（PostgreSQL 常见行为）。
- `nspname`：`t` 的 schema 名（例如 `pg_catalog`）。
- `typname`：元素类型名（来自 `e.typname`）。

### 为什么 `t.oid='1043'` 返回 `(0 rows)`

- `1043` 是 `varchar`，它本身不是数组类型。
- 非数组类型通常 `typelem = 0`，无法匹配 `e.oid`，内连接后无行。
- 因此 `0 rows` 是正确结果。

### 什么时候会返回 1 行

如果把条件改成数组类型 OID（例如 `1015`，即 `varchar[]`）：

```sql
WHERE t.oid = '1015'
```

通常会返回元素类型 `varchar` 的一行数据。

### 在当前 TZDB pgserver 兼容层中的表现

- 对 `t.oid='1043'`：返回 0 行（正确）。
- 对 `t.oid='1015'`：返回 1 行，元素类型为 `varchar`。

对应实现入口见：`src/pgserver/pg_protocol.cpp` 中 `t.typelem = e.oid` 匹配分支。

## 查询九：DBeaver 新建表时 Data Type 只显示 `varchar`

### 这是否正确

不正确。  
正常情况下，DBeaver 新建表列类型下拉框应至少出现 `boolean/smallint/integer/bigint/real/double precision/varchar/text/date/time/timestamp/numeric/bytea` 等一组基础类型。

### 典型原因（本项目已出现）

`pg_type` 类型查询里，`typnamespace` 过滤解析过于严格，未覆盖：

- `t.typnamespace = 2200`（带空格）
- `t.typnamespace='2200'`（带引号）
- `typnamespace=2200`（不带别名前缀）

导致服务端在某些查询下没有正确按 schema 过滤，客户端再叠加可见性规则后，最终下拉框可能只剩 `varchar`。

### 已修复点

已将 `QueryRequestsTypeNamespace` 调整为与 `relnamespace` 同级的“通用数字解析”逻辑，支持空格/引号/无引号形式。  
修复文件：`src/pgserver/pg_protocol.cpp`。

### 回归验证

已执行：

```bash
tests/pg_server_test/pgjdbc_dbeaver_trace_smoke.sh cmake-build-release
```

结果：`PgJDBC DBeaver-trace smoke test passed`。

### 二次排查（Create Table 仍只见 `varchar`）

后续日志出现了 DBeaver 的这条类型详情查询：

```sql
SELECT t.oid,t.*,c.relkind,format_type(nullif(t.typbasetype, 0), t.typtypmod) as base_type_name
FROM pg_catalog.pg_type t
LEFT OUTER JOIN pg_class c ON c.oid=t.typrelid
LEFT OUTER JOIN pg_catalog.pg_description d ON t.oid=d.objoid
WHERE t.oid=$1;
```

这条 SQL **没有**选择 `d.description`。  
但 DBeaver 在该元数据路径里仍会尝试读取 `description` 列，如果不存在会触发：

- `Can't get column 'description': The column name description was not found in this ResultSet`
- 进而导致 Create Table 对话框 Data Type 下拉加载失败（常见表现是只剩 `varchar`）。

已修复为（兼容优先策略）：

- 对 `from pg_catalog.pg_type t` 且包含 `format_type(nullif(t.typbasetype, 0), t.typtypmod) as base_type_name` 的分支，
  无论 SQL 是否显式选择 `d.description`，都返回 `description` 列（空字符串）。
- Describe 与 Execute 两个分支保持一致，避免列结构不一致导致客户端异常。

并已把该变体加入 `PgJdbcDBeaverTraceProbe` 回归校验。

### 三次排查（系统类型被过滤时仅剩 `varchar`）

针对 DBeaver 类型下拉场景，进一步补充了“宽 `pg_type` 列表”的返回策略：

- 对 `SELECT t.oid,t.*,c.relkind,format_type(...), d.description FROM pg_catalog.pg_type ...` 这类列表查询，
  在无 `OID`/`namespace` 过滤时，同时返回 `pg_catalog` 基础类型 + `public` 别名类型。

这样即使客户端按 schema 可见性做过滤，也能看到 `public` 下的
`boolean/smallint/integer/bigint/real/double precision/character varying/text/date/time/timestamp/numeric/bytea`。

本地复核结果：该宽查询当前返回 `29 rows`（不再只有 `varchar`）。

### 仍只显示 `varchar` 时的判定顺序

1. 先断言服务端是否已生效（核心 SQL）：

```sql
SELECT t.oid,t.typname,t.typnamespace
FROM pg_catalog.pg_type t
LEFT OUTER JOIN pg_catalog.pg_type et ON et.oid=t.typelem
LEFT OUTER JOIN pg_catalog.pg_class c ON c.oid=t.typrelid
LEFT OUTER JOIN pg_catalog.pg_description d ON t.oid=d.objoid
WHERE t.typname IS NOT NULL
  AND (c.relkind IS NULL OR c.relkind = 'c')
  AND (et.typcategory IS NULL OR et.typcategory <> 'C')
ORDER BY t.typnamespace,t.typname;
```

应看到两组 namespace：
- `11`（`pg_catalog`）基础类型
- `2200`（`public`）别名类型

2. 若 SQL 结果正确但 UI 仍异常，优先判断为 DBeaver 本地元数据缓存未刷新。
建议执行：
- 断开连接并重新连接该数据源
- 右键连接执行 `Invalidate/Reconnect`
- 关闭并重开 Create Table 向导

### DBeaver debug 日志中已定位到的兼容细节

在 `~/.local/share/DBeaverData/workspace6/.metadata/dbeaver-debug*.log` 中可见：

- `Can't get column 'objid': Bad value for type long :`

对应 SQL 是列元数据查询（`... dep.objid`）。  
根因是兼容层把 `objid`（数值列）在“无依赖”场景返回成了空串 `''`，JDBC 解析 long 时会报错。

已修复为：

- `objid` 无值时返回 `"0"`（可解析的数值），避免 DBeaver 元数据加载链路被污染。

修复文件：`src/pgserver/pg_protocol.cpp`（`pg_attribute` 元数据分支）。

### DBeaver debug 日志中新增兼容细节（`rolvaliduntil`）

日志还可能出现：

- `Can't get column 'rolvaliduntil': Bad value for type timestamp/date/time:`

对应查询：

```sql
SELECT a.oid,a.*,pd.description
FROM pg_catalog.pg_roles a
LEFT JOIN pg_catalog.pg_shdescription pd ON a.oid = pd.objoid
ORDER BY a.rolname;
```

根因是兼容层此前给 `rolvaliduntil` 返回了空字符串 `''`，而 JDBC 会按时间戳读取该列。  
空字符串不是合法时间值，导致解析失败，进而可能影响 DBeaver 的后续元数据加载链路（包括类型下拉缓存刷新）。

已修复为：

- `rolvaliduntil` 返回合法时间文本 `1970-01-01 00:00:00+00`（可被 JDBC `getTimestamp` 解析）。

修复文件：`src/pgserver/pg_protocol.cpp`（`pg_roles` 元数据分支）。

并新增回归验证：

- `tests/pg_server_test/PgJdbcDBeaverTraceProbe.java` 增加 `checkRolesQuery`，显式校验 `rs.getTimestamp("rolvaliduntil")` 可读。

### DBeaver 列“混表”问题（`newtable` 与 `test_table` 列混在一起）

现象：在 DBeaver 查看某个表列时，返回结果里混入了其他表的列。  
根因：`pg_attribute` 兼容分支之前没有严格按 `WHERE c.oid=$1` / `WHERE attrelid=...` 过滤，导致遍历所有表并全部返回。

已修复：

- 新增 `QueryRequestsClassOid`，解析并应用 `c.oid=...` 过滤；
- 新增 `QueryRequestsAttributeRelid`，解析并应用 `attrelid=...` 过滤；
- 两个 `pg_attribute` 返回分支都按目标表 OID 过滤后再组装行。

修复文件：`src/pgserver/pg_protocol.cpp`（`pg_attribute` 元数据相关分支）。

回归增强：

- `tests/pg_server_test/PgJdbcDBeaverTraceProbe.java` 夹具中新增 `newtable`；
- `checkAttributeMetadataQuery` 现在断言只返回 `test_table` 的 2 列，防止再次“混表”。

### 为什么 `template0/template2` 里也看到同样的表

根因是此前 `pg_server` 的连接会话只共享一个启动时传入的 `Database` 对象，  
`StartupMessage` 里的 `database=...` 仅记录到 `database_name_`，没有真正切换底层 DB 句柄。

因此在客户端（DBeaver）切换到其他数据库节点时，会看到同一套表元数据，表现为“多个数据库内容同步”。

已修复：

- `PGSession::HandleStartupMessage` 在鉴权前按连接请求的 `dbname` 绑定会话级数据库；
- 若目标 DB 不在内存注册表，但在 `db_path` 下存在同名 `.db` 文件，会先执行 `OpenDatabase` 再绑定；
- `template0` 按 PostgreSQL 语义拒绝连接（`3D000`）。

修复文件：`src/pgserver/pg_protocol.cpp`、`src/inc/pgserver/pg_protocol.h`。

回归增强：

- `PgJdbcDBeaverTraceProbe` 新增 `checkCrossDatabaseIsolation`：
  - 创建 `pg_isolation_db`
  - 新连接到该库验证 `current_database()`
  - 断言 `test_table` 不会跨库可见
  - 在隔离库建表 `iso_only`，并断言主库不可见。

### `SHOW TABLES` 只返回一行的问题

现象：库里有多张表时，`show tables;` 只显示一行。  
原因：此前这条命令走通用执行路径，结果迭代只消费到了首行场景。

已修复：

- 在 PG 兼容层为 `show tables` 增加显式合成返回，按当前库的 catalog 全量输出：
  - `oid`
  - `name`
  - `cols`

修复文件：`src/pgserver/pg_protocol.cpp`。

回归增强：

- `PgJdbcDBeaverTraceProbe` 新增 `checkShowTables`，断言 `show tables` 至少包含 `test_table` 与 `newtable`。

## 查询十：`SELECT count(*) FROM pg_catalog.pg_type ...`

### 语义

这是“类型集合计数”查询，预期返回 **1 列 1 行**（标量计数）。

### 本项目新增兼容点

此前 `from pg_type` 的通用匹配分支过宽，可能把 `count(*)` 误当成普通明细查询返回多列。  
已新增专门分支：

- `Describe`：返回单列 `count`（`int8`）
- `Execute`：返回一行计数值

修复位置：`src/pgserver/pg_protocol.cpp`。

## 查询十一：DBeaver Data 页显示 `n.a3/tt.a` 的原因

### 现象

- DBeaver `Properties` 页里列名是 `a3/a4`、`a/b`（看起来正确）。
- 但 `Data` 页列头显示 `n.a3`、`n.a4`、`tt.a`、`tt.b`。

### 为什么会这样

- `Properties` 读取的是 catalog 元数据（例如 `pg_attribute.attname`），天然是基础列名。
- `Data` 读取的是查询结果集 `RowDescription` 的列标签（`column label`）。
- PostgreSQL 对这类查询（如 `SELECT tt.a FROM test_table tt`、`SELECT tt.* ...`）默认返回未限定标签（`a`），不是 `tt.a`。

### 本项目中的根因

`planner` 里 `PlanColumnRef` 之前把 `expr.ToString()`（即 `alias.column`）直接作为输出列名，  
因此结果集标签被写成了 `tt.a` / `n.a3`。

- 根因位置：`src/query/planner/plan_expression.cpp`

### 已修复

- 内部列定位仍使用完整限定名（保证解析/执行正确）。
- 对外输出标签改为 `BoundColumnRef` 的最后一段（仅列名）。

修复后行为：

- `SELECT tt.a, tt.b FROM test_table tt` -> 列标签 `a`,`b`
- `SELECT n.* FROM newtable n` -> 列标签 `a3`,`a4`（按真实列名）

### 回归验证

新增 JDBC 回归断言：

- 文件：`tests/pg_server_test/PgJdbcDBeaverTraceProbe.java`
- 断言 `SELECT tt.id, tt.name FROM test_table tt` 的 `ResultSetMetaData#getColumnLabel` 为 `id/name`。
