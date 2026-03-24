---
title: "PyCharm-python开发"
date: "2018-7-25"
author: "Lonnie iTheds"
tags:
  - python
categories:
  - 编程
draft: true
section: "backup"
sourcePath: "markdown/_backup/PyCharm-python开发oo.md"
slug: "_backup/PyCharm-python开发oo"
---

# PyCharm-python开发

## python 基本语法


## python 编译成 exe 文件

常用可选项及说明：

-F：打包后只生成单个exe格式文件；
-D：默认选项，创建一个目录，包含exe文件以及大量依赖文件；
-c：默认选项，使用控制台(就是类似cmd的黑框)；
-w：不使用控制台；
-p：添加搜索路径，让其找到对应的库；
-i：改变生成程序的icon图标。
比如，我把上个博客中写的python文件打包成exe文件，

pyinstaller -F testcase_EDB_JK_PT.py


