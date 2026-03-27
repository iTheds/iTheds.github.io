---
title: "SQL支持现状与扩展建议"
description: "project-tzdb-rebuild 文档整理稿(源:raw_snapshot/docs/sql/sql_support_advance.md)"
---

## SQL支持内容

1. SELECT id, name FROM test_prepared WHERE id = $1
2. export to csv:
```sql
string csv_file = string(test_db_path) + "/migration_test.csv";
auto r1 = c.Query("COPY migration_test TO '" + csv_file + "' (HEADER, DELIMITER ',');");
```

## SQL支持建议

1. timestamp；
2. DROP TABLE IF EXISTS test_odbc；
3. DROP TABLE test_odbc；

## SQL不支持但当前非必要的内容

1. 预查询功能中，主键绑定不支持，虽然可以运行成功，但是里面{return  false}语句选不中索引查询了，走的全表查询;

```c++
// 主键绑定不支持
TEST(query, DISABLED_query_insert_varchar_prepare) {
Database db(test_db_path, "test");
Connection c(db);
c.BeginTransaction(TransactionType::TRANS_TYPE_READ_WRITE);
c.Query(
"CREATE TABLE IF NOT EXISTS test_prepared (\n"
"    id INT PRIMARY KEY,\n"
"    name VARCHAR(128)\n"
")");
auto prepare = c.Prepare("INSERT INTO test_prepared (id, name) VALUES ($1, $2)");
prepare->Binder(ColumnValue::INTEGER(42), ColumnValue::VARINT("Test String"));
auto prepare2 = c.Prepare("SELECT id, name FROM test_prepared WHERE id = $1");
auto q = prepare2->Binder(ColumnValue::INTEGER(42));
while (q->Next()) {
printf("row = %s\n", q->ToString().c_str());
}
c.CommitTransaction();
}
```

# 支持情况

数据库具体支持情况:
支持:COUNT(计数) LIKE GROUPBY(分组)ORDER(排序)
暂不支持: INTERSERT(交叉) IN AND OR  UNION(合并)
