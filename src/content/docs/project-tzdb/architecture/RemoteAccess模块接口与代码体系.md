---
title: "RemoteAccess模块接口与代码体系"
description: "整理 RemoteAccess 模块的接口映射、代码体系、管理对象与 API 草案"
---

## 接口关键字检索

### ODBC 接口映射

| 接口说明 | 标识 | API |
| --- | --- | --- |
| ODBC分配句柄接口 | `EDB-USER-INTF-OAHD` | `SQLAllocHandle` |
| ODBC主动连接接口 | `EDB-USER-INTF-OCON` | `SQLConnect` |
| ODBC获取信息接口 | `EDB-USER-INTF-OGIF` | `SQLGetInfo` |
| ODBC方法支持接口 | `EDB-USER-INTF-OGFU` | `SQLGetFunctions` |
| ODBC类型支持接口 | `EDB-USER-INTF-OGTY` | `SQLGetTypeInfo` |
| ODBC连接属性设置接口 | `EDB-USER-INTF-OSCO` | `SQLSetConnectAttr` |
| ODBC连接属性检索接口 | `EDB-USER-INTF-OGCO` | `SQLGetConnectAttr` |
| ODBC环境设置接口 | `EDB-USER-INTF-OSEN` | `SQLSetEnvAttr` |
| ODBC检索环境设置接口 | `EDB-USER-INTF-OGEN` | `SQLGetEnvAttr` |
| ODBC语句设置接口 | `EDB-USER-INTF-OSSM` | `SQLSetStmtAttr` |
| ODBC检索语句设置接口 | `EDB-USER-INTF-OGSM` | `SQLGetStmtAttr` |
| ODBC检索单个描述符字段接口 | `EDB-USER-INTF-OGDF` | `SQLGetDescField` |
| ODBC检索多个描述符字段接口 | `EDB-USER-INTF-OGDR` | `SQLGetDescRec` |
| ODBC复制描述符接口 | `EDB-USER-INTF-OCDE` | `SQLCopyDesc` |
| ODBC预执行SQL接口 | `EDB-USER-INTF-OPRE` | `SQLPrepare` |
| ODBC执行SQL语句接口 | `EDB-USER-INTF-OEXE` | `SQLExecute` |
| ODBC执行就绪SQL语句接口 | `EDB-USER-INTF-OEXD` | `SQLExecDirect` |
| ODBC检索SQL语句参数描述接口 | `EDB-USER-INTF-ODEP` | `SQLDescribeParam` |
| ODBC检索结果集接口 | `EDB-USER-INTF-OGDA` | `SQLGetData` |
| ODBC检索结果集行数接口 | `EDB-USER-INTF-ORCU` | `SQLRowCount` |
| ODBC检索结果集列属性接口 | `EDB-USER-INTF-OCOL` | `SQLColAttribute` |
| ODBC设置游标接口 | `EDB-USER-INTF-OPOS` | `SQLSetPos` |
| ODBC检索单个诊断信息接口 | `EDB-USER-INTF-OGDAF` | `SQLGetDiagField` |
| ODBC检索多个诊断信息接口 | `EDB-USER-INTF-OGDAR` | `SQLGetDiagRec` |
| ODBC语句句柄结束处理接口 | `EDB-USER-INTF-OFRSM` | `SQLFreeStmt` |
| ODBC关闭游标接口 | `EDB-USER-INTF-OCCU` | `SQLCloseCursor` |
| ODBC关闭连接接口 | `EDB-USER-INTF-ODCO` | `SQLDisconnect` |
| ODBC释放句柄接口 | `EDB-USER-INTF-OFRH` | `SQLFreeHandle` |

### 远程 C/C++ 接口映射

| 接口说明 | 标识 |
| --- | --- |
| 远程C/C++连接接口 | `EDB-USER-INTF-NCONT` |
| 远程C/C++预执行SQL语句接口 | `EDB-USER-INTF-PSQLE` |
| 远程C/C++执行SQL语句接口 | `EDB-USER-INTF-DSQLE` |
| 远程C/C++获取结果集接口 | `EDB-USER-INTF-GSRES` |
| 远程C/C++检索表权限接口 | `EDB-USER-INTF-GTABP` |
| 远程C/C++设置游标接口 | `EDB-USER-INTF-SETCU` |
| 远程C/C++检索结果集属性列接口 | `EDB-USER-INTF-GETCL` |
| 远程C/C++检索单个诊断信息接口 | `EDB-USER-INTF-GSDIA` |
| 远程C/C++检索多个诊断信息接口 | `EDB-USER-INTF-GMDIA` |
| 远程C/C++语句句柄结束处理接口 | `EDB-USER-INTF-FRSMT` |
| 远程C/C++关闭游标接口 | `EDB-USER-INTF-CLOCU` |
| 远程C/C++关闭连接接口 | `EDB-USER-INTF-CLOCO` |

### 远程 Java 接口映射

| 接口说明 | 标识 |
| --- | --- |
| 远程JAVA建立连接接口 | `EDB-USER-INTF-JNCONT` |
| 远程JAVA创建语句句柄接口 | `EDB-USER-INTF-JAHS` |
| 远程JAVA执行SQL语句接口 | `EDB-USER-INTF-JDSQL` |
| 远程JAVA获取结果集接口 | `EDB-USER-INTF-JGRES` |
| 远程JAVA获取结果集元数据接口 | `EDB-USER-INTF-JGEME` |
| 远程JAVA获取结果集元数据列数接口 | `EDB-USER-INTF-JGEMR` |
| 远程JAVA关闭语句句柄接口 | `EDB-USER-INTF-JCHS` |
| 远程JAVA关闭连接接口 | `EDB-USER-INTF-JCLS` |

### 远程 Python 接口映射

| 接口说明 | 标识 |
| --- | --- |
| 远程Python建立连接接口 | `EDB-USER-INTF-PNCONT` |
| 远程Python获取游标接口 | `EDB-USER-INTF-PGCUR` |
| 远程Python执行SQL语句接口 | `EDB-USER-INTF-PDSQL` |
| 远程Python循环访问获取结果集接口 | `EDB-USER-INTF-PFETC` |
| 远程Python提交事务接口 | `EDB-USER-INTF-PCOMIT` |
| 远程Python关闭连接接口 | `EDB-USER-INTF-PCLS` |

## 代码体系

### 旧版结构

原稿保留的旧版结构如下:

```text
config.h
ras_lib.h
global.cpp
  struct.cpp
    access_per.cpp
    log_api.cpp
    sql_api.cpp
  encrypt.cpp
    communicate.cpp
  connect_pool.cpp
    connect.cpp
  env.cpp
  stmt.cpp
DBODBC.cpp
  DBODBCext.cpp
    installer.cpp
    DBclient.cpp
    DBserver.cpp
    tzdb_driver.h
```

### 整理后的项目目录

```text
ras_keyword.h
ras_lib.h
global.cpp
  struct.cpp
    communicate.cpp
      connect.cpp
        connect_pool.h
    access_per.cpp
    log_api.cpp
    sql_api.cpp
server.cpp
libtzdb.cpp
  env.cpp
  stmt.cpp
  dbc.cpp
  desc.cpp
DBODBC.cpp
DBODBCext.cpp
tzdb_odbc_driver.h
tzdb-odbc.dll
tzdb-odbc-setup.dll
installer.cpp
```

## 管理对象清单

原稿列出了 RemoteAccess 侧希望管理的 12 类对象:

1. C++环境连接请求信息管理。
2. C++环境连接池信息管理。
3. C++事务逻辑信息管理。
4. C++日志文件信息管理。
5. C++数据库标识信息管理。
6. C++句柄信息管理。
7. C++结果集格式转换信息管理。
8. C++异常处理信息管理。
9. C++接口一致性信息管理。
10. C++用户身份验证信息管理。
11. C++联合接口与协议规则的管理。
12. C++连接驱动的管理。

## API 草案

原稿还保留了一组 ODBC 标准接口与扩展接口的草案实现骨架，包括:

- `SQLAllocHandle`
- `SQLBindCol`
- `SQLBindParameter`
- `SQLCancel`
- `SQLCloseCursor`
- `SQLConnect`
- `SQLDescribeCol`
- `SQLDisconnect`
- `SQLEndTran`
- `SQLExecDirect`
- `SQLExecute`
- `SQLFetch`
- `SQLGetData`
- `SQLGetInfo`
- `SQLPrepare`
- `SQLSetEnvAttr`
- `SQLTables`
- 以及 `SQLBrowseConnect`、`SQLBulkOperations`、`SQLDriverConnect` 等扩展接口

这部分在原文中以大量函数壳代码形式保留，作用更接近接口清单与占位骨架，而不是完整设计说明。
