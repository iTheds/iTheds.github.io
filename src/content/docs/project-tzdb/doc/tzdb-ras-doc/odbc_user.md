---
title: "odbc 使用方法"
description: "odbc 使用方法"
---

﻿---
layout: post
title: "ODBC USE PAGE"
subtitle: ""
date: 2024-12-23
author: Lonnie iTheds
header-img: "img/hexo.jpg"
cdn: 'header-on'
tags:
    - net
---

<link rel="stylesheet" type="text/css" href="../auto-number-title.css" />

# odbc 使用方法

1. 基本概念；
2. windows 下使用；
3. unix 环境准备与配置；

## unxi 环境准备与配置

sudo apt install unixodbc unixodbc-dev

odbcinst -j

sudo nano /etc/odbcinst.ini

```bash
[MySQL]
Description=ODBC for MySQL
Driver=/usr/lib/x86_64-linux-gnu/odbc/libmyodbc.so
Setup=/usr/lib/x86_64-linux-gnu/odbc/libodbcmyS.so
FileUsage=1

[TZMDB ODBC 1.0 ANSI Driver]
Driver=/usr/lib/tzmodbc/libtzmdb-odbc.so
SETUP=
UsageCount=1

[TZDB ODBC 1.0 ANSI Driver]
Driver=/usr/lib/tzodbc/libtzdb-odbc-local.so
SETUP=
UsageCount=1
```

sudo nano /etc/odbc.ini

```bash
[MySQL_DSN]
Description=MySQL ODBC Data Source
Driver=MySQL
Server=localhost
Database=your_database
User=your_username
Password=your_password
Port=3306
Option=3

[tzmdb_test_1]
Description  = tzmdb
Driver = TZMDB ODBC 1.0 ANSI Driver
Host = 127.0.0.1 
Port = 7030
CHARSET  = UTF8

[tzdb_test_1]
Description  = tzdb
Driver = TZDB ODBC 1.0 ANSI Driver
Host = 127.0.0.1
Port = 7030
CHARSET  = UTF8
User = root
Password = root
Database = tz_test_db
```

测试 ODBC 连接

使用 isql 工具测试 ODBC 数据源连接是否成功。

sudo apt install unixodbc-bin

isql MySQL_DSN your_username your_password

## support

| 接口名称 | 实现状态 | 功能描述 |
|---------|---------|---------|
| SQLDriverConnect | 完整实现 | 使用连接字符串建立数据库连接，解析DSN、HOST、PORT等参数 |
| SQLGetFunctions | 完整实现 | 返回驱动程序支持的函数信息 |
| SQLGetInfo | 完整实现 | 获取驱动程序和数据源的详细信息 |
| SQLGetStmtAttr | 完整实现 | 获取语句属性，如游标可滚动性、行描述符等 |
| SQLGetData | 完整实现 | 获取结果集中单列数据 |
| SQLNumResultCols | 完整实现 | 返回结果集中的列数 |
| SQLRowCount | 完整实现 | 返回受影响的行数或结果集中的行数 |
| SQLSetConnectAttr | 完整实现 | 设置连接属性，如自动提交模式 |
| SQLConnect | 完整实现 | 建立数据库连接 |
| SQLAllocEnv | 完整实现 | 分配环境句柄 |
| SQLAllocConnect | 完整实现 | 分配连接句柄 |
| SQLAllocStmt | 完整实现 | 分配语句句柄 |
| SQLAllocHandle | 完整实现 | 分配各种类型的句柄 |
| SQLAllocDesc | 完整实现 | 分配描述符句柄 |
| SQLDescribeCol | 完整实现 | 返回结果集列的描述信息 |
| SQLDisconnect | 完整实现 | 断开数据库连接 |
| SQLEndTran | 完整实现 | 提交或回滚事务 |
| SQLExecDirect | 完整实现 | 直接执行SQL语句 |
| SQLFetch | 完整实现 | 获取下一行数据 |

| 接口名称 | 实现状态 | 功能描述 |
|---------|---------|---------|
| SQLAllocEnv | 完整实现 | 分配环境句柄 |
| SQLAllocConnect | 完整实现 | 分配连接句柄 |
| SQLAllocStmt | 完整实现 | 分配语句句柄 |
| SQLAllocDesc | 完整实现 | 分配描述符句柄 |
| SQLAllocHandle | 完整实现 | 分配各种类型的句柄 |
| SQLBindCol | 仅日志记录 | 将应用程序数据缓冲区绑定到结果集中的列 |
| SQLBindParameter | 仅日志记录 | 将缓冲区绑定到SQL语句中的参数标记 |
| SQLCancel | 仅日志记录 | 取消查询 |
| SQLCancelHandle | 仅日志记录 | 取消操作 |
| SQLCloseCursor | 仅日志记录 | 关闭语句上打开的游标 |
| SQLColAttribute | 仅日志记录 | 返回结果集列的属性 |
| SQLColumns | 仅日志记录 | 返回表的列信息 |
| SQLConnect | 完整实现 | 建立数据库连接 |
| SQLCopyDesc | 仅日志记录 | 复制描述符 |
| SQLDescribeCol | 完整实现 | 返回结果集列的描述信息 |
| SQLDisconnect | 完整实现 | 断开数据库连接 |
| SQLEndTran | 完整实现 | 提交或回滚事务 |
| SQLExecDirect | 完整实现 | 执行SQL语句 |
| SQLExecute | 仅日志记录 | 执行预处理语句 |
| SQLFetch | 完整实现 | 获取下一行数据 |
| SQLFetchScroll | 部分实现 | 获取指定位置的数据行 |
| SQLFreeHandle | 仅日志记录 | 释放句柄资源 |
| SQLFreeStmt | 仅日志记录 | 释放语句资源 |
| SQLGetConnectAttr | 仅日志记录 | 获取连接属性 |
| SQLGetCursorName | 仅日志记录 | 获取游标名称 |
| SQLGetData | 完整实现 | 获取单列数据 |
| SQLGetDescField | 仅日志记录 | 获取描述符字段 |
| SQLGetDescRec | 仅日志记录 | 获取描述符记录 |
| SQLGetDiagField | 仅日志记录 | 获取诊断字段 |
| SQLGetDiagRec | 仅日志记录 | 获取诊断记录 |
| SQLGetEnvAttr | 仅日志记录 | 获取环境属性 |
| SQLGetFunctions | 完整实现 | 获取驱动程序支持的函数信息 |
| SQLGetInfo | 完整实现 | 获取驱动程序和数据源信息 |
| SQLGetStmtAttr | 完整实现 | 获取语句属性 |
| SQLGetTypeInfo | 仅日志记录 | 获取数据类型信息 |
| SQLNumResultCols | 完整实现 | 返回结果集中的列数 |
| SQLParamData | 仅日志记录 | 用于参数数据的处理 |
| SQLPrepare | 仅日志记录 | 准备SQL语句 |
| SQLPrimaryKeys | 仅日志记录 | 获取主键信息 |
| SQLPutData | 仅日志记录 | 在执行时发送参数数据 |
| SQLRowCount | 完整实现 | 返回受影响的行数 |
| SQLSetConnectAttr | 完整实现 | 设置连接属性 |
| SQLSetCursorName | 仅日志记录 | 设置游标名称 |
| SQLSetDescField | 仅日志记录 | 设置描述符字段 |
| SQLSetDescRec | 仅日志记录 | 设置描述符记录 |
| SQLSetEnvAttr | 仅日志记录 | 设置环境属性 |
| SQLSetStmtAttr | 仅日志记录 | 设置语句属性 |
| SQLSpecialColumns | 仅日志记录 | 获取特殊列信息 |
| SQLStatistics | 仅日志记录 | 获取统计信息 |
| SQLTablePrivileges | 仅日志记录 | 获取表权限信息 |
| SQLTables | 仅日志记录 | 获取表信息 |
