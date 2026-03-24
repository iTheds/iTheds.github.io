---
title: "Linux下数据库管理与建库"
date: "2021-2-3"
subtitle: "这是一篇比较高冷的文章，不用宣传"
author: "Lonnie iTheds"
tags:
  - mysql
  - SQL
categories:
  - 服务器
draft: true
section: "drafts"
sourcePath: "markdown/_drafts/Linux下数据库管理与建库.md"
slug: "_drafts/Linux下数据库管理与建库"
---

# Linux下数据库管理与建库

搭建好mysql后的操作与相关问题，关于搭建参见LAMP搭建文章。

## 登入mysql

mysql [-u username] [-h host] [-p password] [dbname]

[密码]:<> (mysql -u root -pLinda710#)

## 查看数据库

show databases;

## SQL命令

SQL命令篇参照<SQL语句札记>

## 兼容phpmyadmin

>报错：

mysqli_real_connect(): Headers and client library minor version mismatch. Headers:50560 Library:100014
mysqli_real_connect(): (HY000/2002): Can't connect to local MySQL server through socket '/var/run/mysql/mysql.sock' (2 &quot;No such file or directory&quot;)

版本问题，解决方法：

yum remove php-mysql
yum install php-mysqlnd

>报错：

mysqli_real_connect(): The server requested authentication method unknown to the client [caching_sha2_password]
mysqli_real_connect(): (HY000/2054): The server requested authentication method unknown to the client

解决方案：
方案1：无效

use mysql；
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Linda710#'; 
FLUSH PRIVILEGES;

方案2：
修改/etc/my.cnf,`default_authentication_plugin= mysql_native_password`。

>乱码问题：

全屏都是。但是基本的操作界面可以看到。(很有意思的是，以下的这段经过hexo解析时，进行了报错，直到标注了了代码块才停止。)

```
{# Console toolbar #} {% include 'console/toolbar.twig' with { 'parent_div_classes': 'collapsed', 'content_array': [ {0: 'switch_button console_switch', 1: 'Console'|trans, 'image': image}, ['button clear', 'Clear'|trans], ['button history', 'History'|trans], ['button options', 'Options'|trans], cfg_bookmark is defined ? ['button bookmarks', 'Bookmarks'|trans] : null, ['button debug hide', 'Debug SQL'|trans] ] } only %} {# Console messages #} {# Drak the console with other cards over it #} {# Debug SQL card #} {% include 'console/toolbar.twig' with { 'parent_div_classes': '', 'content_array': [ ['button order order_asc', 'ascending'|trans], ['button order order_desc', 'descending'|trans], ['text', 'Order:'|trans], ['switch_button', 'Debug SQL'|trans], ['button order_by sort_count', 'Count'|trans], ['button order_by sort_exec', 'Execution order'|trans], ['button order_by sort_time', 'Time taken'|trans], ['text', 'Order by:'|trans], ['button group_queries', 'Group queries'|trans], ['button ungroup_queries', 'Ungroup queries'|trans] ] } only %}
Some error occurred while getting SQL debug info.
{% if cfg_bookmark %} {% include 'console/toolbar.twig' with { 'parent_div_classes': '', 'content_array': [ ['switch_button', 'Bookmarks'|trans], ['button refresh', 'Refresh'|trans], ['button add', 'Add'|trans] ] } only %}
{{ bookmark_content|raw }}
{% include 'console/toolbar.twig' with { 'parent_div_classes': '', 'content_array': [ ['switch_button', 'Add bookmark'|trans] ] } only %}
{% trans 'Label' %}: 
{% trans 'Target database' %}: 
{% trans 'Share this bookmark' %} {% trans 'OK' %}
```

报错：A fatal JavaScript error has occurred. Would you like to send an error report?，怀疑是js问题。

一开始是进入了`http://8.131.63.170/phpMyAdmin/8.131.63.170/phpMyAdmin/index.php`。
那么很明显，Apache也有问题。
不对，解析方式，是php的问题。之前经过多次的rpm手动倒包，可能之间出现了问题。
显示出了php的代码，说明是解析出错。
尝试升级php。

```
<?php
/* vim: set expandtab sw=4 ts=4 sts=4: */
/**
 * Logout script
 *
 * @package PhpMyAdmin
 */

use PhpMyAdmin\Core;

require_once 'libraries/common.inc.php';

if ($_SERVER['REQUEST_METHOD'] != 'POST' || $token_mismatch) {
    Core::sendHeaderLocation('./index.php');
} else {
    $auth_plugin->logOut();
}
```

## 关键目录

## 权限管理

## 内核

1. i386 适用于intel和AMD所有32位的cpu.以及via采用X86架构的32的cpu.intel平台包括8086,80286,80386,80486,奔腾系列(1.2.3.4)、赛扬系列,Pentium D系列以及centrino P-M,core duo 等.
2. X86_64 适用于intel的Core 2 Duo, Centrino Core 2 Duo, and Xeon 和AMD Athlon64/x2, Sempron64/x2, Duron64等采用X86架构的64位cpu.
3. I686 只是i386的一个子集,支持的cpu从Pentium 2 (686)开始,之前的型号不支持.
