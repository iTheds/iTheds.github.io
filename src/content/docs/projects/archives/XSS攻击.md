---
title: "XSS攻击札记"
description: "XSS攻击札记"
---

# XSS攻击

#### XSS攻击运行机制

存储型：经过后端，经过数据库

反射型xss：经过后端，不经过数据库

dom-xss：不经过后端,DOM—based XSS漏洞是基于文档对象模型Document Objeet Model,DOM)的一种漏洞,dom - xss是通过url传入参数去控制触发的。

#### XSS攻击实际操作方式

一般来说有输出的地方就有可能存在xss攻击漏洞。在注入的时候应该注意的是编码过滤的问题。

注入地点：输入框，网站原址playload，js脚本注入。

#### XSS攻击工具

#### XSS攻击防御方法

参考链接：

* [XSS跨站脚本攻击](https://blog.csdn.net/u011781521/article/details/53894399)

* [编码过滤例子](https://blog.csdn.net/wy_97/article/details/77755098)
