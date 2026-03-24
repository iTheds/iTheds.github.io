---
title: "python 远程访问服务 ODBC 标准接口"
published: 2022-03-02
description: "python 远程访问服务 ODBC 标准接口"
tags:
  - "work"
category: "work"
draft: false
author: "Lonnie iTheds"
---
# python 远程访问服务 ODBC 标准接口

本次只需要实现 client 客户端操作。

## 已经实现的 C++ 接口

1. 连接数据库。本质是建立 TCP 通信连接。
2. 传输 SQL 语句数据。以特定协议格式封装数据并发送到服务端，等待接收信息并返回。
3. 获取数据。判断结果集数据是否存在。
4. 取出当前结果集中的行集中某一列的数据。
5. 关闭连接。关闭 TCP 连接。

## python ODBC 接口实现

拟过程：
1. 确定技术点：是否使用 pyodbc 进行实现。
2. 搭建空代码框架，并且等效于连接 mysql 代码的 pyodbc。
3. 构建 python 通信组件。
4. 解释接收的数据包。(目前 C++ 使用的是四个主类进行存放数据)。本质是使用结果集，将数据进行存放。

## 打包成 exe

pyinstaller -F Select_Data.py

目录下生成 dist 内有 exe。

## 总览性文档

基本内容已经完成。

## 参考文档

[Microsoft ODBC](https://docs.microsoft.com/zh-cn/sql/odbc/reference/syntax/sqlallocconnect-function?view=sql-server-ver15)


## 安装 pyodbc

odbcinst -j

sudo apt install unixodbc
pip install pyodbc

## 问题笔记

### 出现 SQLGetPrivateProfileString 无法识别

该问题是目标库没有连接到 odbcinst 导致。
只需要在环境中添加该库。
或者提供的驱动程序连接该库即可。
一般来说多出现在 linux 上。

