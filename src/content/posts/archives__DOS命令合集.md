---
title: "DOS命令合集"
date: "2018-5-8"
subtitle: "这是一篇水文纪念品"
author: "Lonnie iTheds"
tags:
  - windows
categories:
  - 服务器
draft: false
section: "archives"
sourcePath: "markdown/archives/DOS命令合集.md"
slug: "archives/DOS命令合集"
---

# DOS命令合集

## DOS命令扫描指定端口并查看端口号

### 使用命令`netstat  -aon|findstr  "80"`

此命令可以查看80端口的占用情况

```dos
C:\>netstat  -aon|findstr  "80
  TCP   0.0.0.0:80      0.0.0.0:0   LISTENING       4
  TCP   0.0.0.0:1080    0.0.0.0:0   LISTENING       11056
  TCP   127.0.0.1:1080  127.0.0.1:55771 ESTABLISHED     11056
  ```

其中可以得知占用80端口的任务PID号为4

### 根据PID号找出具体任务`tasklist|findstr "4"`

```DOS
C:\>tasklist|findstr "4"
System             4 Services                   0         24 K
smss.exe         412 Services                   0        468 K
```

可以看到其服务为System。

参考链接：

* [phpstudy更改端口](http://www.soujiqiao.com/phpym/394.html)