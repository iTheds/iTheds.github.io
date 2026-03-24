---
title: "0719work_data"
date: "2021-7-19"
subtitle: "0719work_data"
author: "Lonnie iTheds"
tags:
  - work
draft: false
section: "work"
sourcePath: "markdown/work/dailylog/2021/0719work_data.md"
slug: "work/dailylog/2021/0719work_data"
---
# 0719work_data

## 每日日志

周一：
1. 答辩PPT对稿
2. 搭建基于tzdb-win的ODBC编程环境。

周二：
1. 核对所需要编写的API接口，以及对API的功能归类。

周三：
1. 进行内部内容提取，学习句柄流向。
2. 学习标准ODBC 接口，初步确定需要完成的接口。
3. 学习ODBC 句柄、数据结构、缓冲区等。

周四：
1. 船舶项目为配合取数据而进行测试，取存比率=36w/720w。
2. 学习数据库源码接口。发现可优化：
    * aeci_field_descriptor初始化可多样性，

            aeci_field_descriptor(type= NULL,flags = NULL ,...);
    
    * 旧版aeci接口可以进行使用

            #if !defined(USE_EDB_API)||defined(AECI_API)

周五：
1. 船舶项目取数据测试，抽取完成。尽量上午完成。
    完成，下午3点完成并生成文档。
2. 下午，对ODBC API进行功能分类，并且确定数据结构以及数据流向。其中未定义的数据结构在方案中拟使用mysql_connect_ODBC 数据结构。

