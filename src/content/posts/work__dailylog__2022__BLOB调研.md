---
title: "BLOB调研"
date: "2022-5-7"
subtitle: "BLOB调研"
author: "Lonnie iTheds"
tags:
  - work
draft: false
section: "work"
sourcePath: "markdown/work/dailylog/2022/BLOB调研.md"
slug: "work/dailylog/2022/BLOB调研"
---
# BLOB调研

一、目前数据库支持 BLOB 方式
Moc 接口使用时，将设置 BLOB 类型，将数据设置为字符串进行存储。
SQL 语句使用时对 BLOB 数据识别为字符串进行存储。
二、CLOB 与 BLOB 区别
BLOB和CLOB都是大字段类型，BLOB是按二进制来存储的，而CLOB是可以直接存储文字的。其实两个是可以互换的的，或者可以直接用LOB字段代替这两个。但是为了更好的管理ORACLE数据库，通常像图片、文件、音乐等信息就用BLOB字段来存储，先将文件转为二进制再存储进去。而像文章或者是较长的文字，就用CLOB存储，这样对以后的查询更新存储等操作都提供很大的方便。

三、BLOB 使用方式

1. JAVA 中的使用方式

```JAVA
PreparedStatement stmt = con.prepareStatement("insert into student(name,image) values(?,?)");			
stmt.setString(1,"April");
stmt.setBlob(2, new FileInputStream("D:\\work\\April.png"));
stmt.executeUpdate();
```

Mysql 中 使用 Blob，有长度限制。

2. C++ 中的使用方式

```C++
std::stringbuf buf(blob, std::ios_base::in);
std::istream stream(&buf);
pstmt->setBlob(2, &stream);
```

3. ODBC 中的使用方式

```C++
```
