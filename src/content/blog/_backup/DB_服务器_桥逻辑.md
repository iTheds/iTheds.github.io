---
title: "DB 服务器 桥逻辑"
date: "2021-5-28"
subtitle: "DB 服务器 桥逻辑"
author: "Lonnie iTheds"
categories:
  - 服务器
draft: true
section: "backup"
sourcePath: "markdown/_backup/DB_服务器_桥逻辑.md"
slug: "_backup/DB_服务器_桥逻辑"
---

# DB 服务器 桥逻辑

本篇主要验证逻辑特点。
Sql server在本地时，结构是：
    应用程序- 驱动程序管理器- 驱动程序- 数据源

但是ODBC，或者说远程连接模块，是否是双端的呢。
远程服务器上安装了mysql， 需不需要安装ODBC驱动程序？
本地需要安装驱动程序吗？

更底层的逻辑结构，面对开源的数据库SQLite时呢？面对PostgreSQL时呢？

## mysql

三个组件。
另外两个没什么好说的，大致是表示版本的mysql80社区版，工具集。第三个就是connectors，估计是一些连接工具。先尝试不安装它。

```C++
mysql-connectors-community/x86_64 MySQL Connectors Community                 128
mysql-tools-community/x86_64      MySQL Tools Community                       61
mysql80-community/x86_64          MySQL 8.0 Community Server                 153
```

安装的时候安装的是mysql-server，似乎以及包含了此类模块。
mysql-connectors-community MySQL Connectors Community


## SQLserver

使用sql server。
安装的时候没什么好说的，最好是基本的安装方式，自定义的化需要考虑是否能安装实例。如果没有安装实例，那么网上资料甚少。

安装成功实例之后C:\Program Files\Microsoft SQL Server\MSSQL15.MSSQLSERVER该文件将存在。

MSSQLSERVER
Server=localhost;Database=master;Trusted_Connection=True;

管理员
DESKTOP-63HDDK1\Lenovo
日志
C:\Program Files\Microsoft SQL Server\150\Setup Bootstrap\Log\20210512_155415

[在VS中用C语言连接sql server](https://blog.csdn.net/warrior_1/article/details/106517949)

## 服务器

## mysql
