---
title: "Linux下配置服务器环境(lamp和 shadowsocks 、lnmp)"
published: 2018-08-11
description: "这是一篇比较高冷的文章，不用宣传"
tags:
  - "lamp"
  - "lnmp"
category: "服务器"
draft: false
author: "Lonnie iTheds"
---
# 服务器环境配置总概

介绍了大致的服务器环境配置，包括lamp、lnmp。万变不离其宗，环境变化仍然可以在此基础上扩展。

常见Linux操作系统
CentOS、Redhat、SuSE、Debian、veket、Ubunto、Fedora
CentOs来自于Red Hat Enterprise Linux依照开放源代码规定释出的源代码所编译而成
Debian与Ubuntu的软件并不一定完全兼容

企业版 Linux 附加软件包（以下简称 EPEL）是一个 Fedora 特别兴趣小组，用以创建、维护以及管理针对企业版 Linux 的一个高质量附加软件包集，面向的对象包括但不限于 红帽企业版 Linux (RHEL)、 CentOS、Scientific Linux (SL)、Oracle Linux (OL) 。

OpenSSL是一个开放源代码的软件库包，应用程序可以使用这个包来进行安全通信，避免窃听，同时确认另一端连接者的身份。这个包广泛被应用在互联网的网页服务器上

TURBO 基于SpringJdbc封装的ORM框架

rpm依赖库查找：
[较新版]http://rpmfind.net/linux/rpm2html/search.php?query=
[较少使用]https://pkgs.org/download/libcrypto.so.10
[包含旧版]http://rpm.pbone.net/

GNU是一个自由的操作系统，其内容软件完全以GPL方式发布。这个操作系统是GNU计划的主要目标，名称来自GNU's Not Unix!的递归缩写，因为GNU的设计类似Unix，但它不包含具著作权的Unix代码。GNU的创始人，理查德·马修·斯托曼，将GNU视为“达成社会目的技术方法”。
作为操作系统，GNU的发展仍未完成，其中最大的问题是具有完备功能的内核尚未被开发成功。GNU的内核，称为Hurd，是自由软件基金会发展的重点，但是其发展尚未成熟。在实际使用上，多半使用Linux内核、FreeBSD等替代方案，作为系统核心，其中主要的操作系统是Linux的发行版。Linux操作系统包涵了Linux内核与其他自由软件项目中的GNU组件和软件，可以被称为GNU/Linux（见GNU/Linux命名争议）。

## 服务器购买分析

轻量级应用服务器

云数据库RDS MySQL 版
RDS和ECS服务器的区别：
RDS是关系型数据库服务（Relational Database Service）的简称，是一种即开即用、稳定可靠、可弹性伸缩的在线数据库服务。具有多重安全防护措施和完善的性能监控体系，并提供专业的数据库备份、恢复及优化方案，使您能专注于应用开发和业务发展。
云服务器Elastic Compute Service（ECS）是阿里云提供的一种基础云计算服务。使用云服务器ECS就像使用水、电、煤气等资源一样便捷、高效。您无需提前采购硬件设备，而是根据业务需要，随时创建所需数量的云服务器ECS实例。在使用过程中，随着业务的扩展，您可以随时扩容磁盘、增加带宽。如果不再需要云服务器，也能随时释放资源，节省费用。

[隐蔽信息]: <> (
9785ca9c1edd4c938d7f77b69be3aa28
8.131.63.170
数据盘：0 GB
镜像类型：系统镜像
地域：华北2（北京）
系统镜像：CentOS 8.2
套餐配置：{&quot;title&quot;:&quot;145元/月&quot;,&quot;items&quot;:[{&quot;name&quot;:&quot;CPU&quot;,&quot;spec&quot;:&quot;1核&quot;},{&quot;name&quot;:&quot;内存&quot;,&quot;spec&quot;:&quot;2GB&quot;},{&quot;name&quot;:&quot;SSD&quot;,&quot;spec&quot;:&quot;40GB&quot;},{&quot;name&quot;:&quot;限峰值带宽&quot;,&quot;spec&quot;:&quot;5Mbps&quot;},{&quot;name&quot;:&quot;每月流量&quot;,&quot;spec&quot;:&quot;1000GB&quot;}]}
2021-01-20 21:27:17
2021-04-21 00:00:00
按月
)

cpu
内存

## Linux下配置lamp环境

首先要查看各个源文件，以及镜像是指向什么的。
安装顺序最好是httpd->mysql->php->phpmyadmin。phpmyadmin是前台，版本可变。
尽量使用dnf命令进行安装，dnf优势更大，尽量不要使用rpm，包之间的关系相对复杂。

### Recording

乘着等进度条，说一说感想吧，18年的文章，前后搭建了许多次服务器，问题都不慌不忙。
现在正21年的1月份，也是当好自律的年纪，久违的充实。
总是在强调差距，映射到对事务的处理来看就是，事务完成度阈值，有的人可能一点点就以为做了很多，好似可以换来放松的时光，但是有的人却知道前路漫漫，快乐好似就是学习和工作本身。要求放松，什么时候才是尽头，最后只有深渊在等着；能感觉到创造本身的快乐，我很开心。以人为镜，大概如此。

linux-centos7下配置环境包括shadowsocks、lamp和phpmyadmin。

本身版本：
Centos 7 x86_64 bbr
Linux host.localdomain 4.10.4-1.el7.elrepo.x86_64 #1 SMP Sat Mar 18 12:50:10 EDT 2017 x86_64 x86_64 x86_64 GNU/Linux
Apache版本：Server version: Apache/2.4.6 (CentOS)
php版本：PHP 5.5.38
mysql版本：5.7.21
phpmyadmin版本：4.0.10.20
此配套支持utf8mb4

本次版本：
Linux version 4.18.0-193.14.2.el8_2.x86_64 (mockbuild@kbuilder.bsys.centos.org) (gcc version 8.3.1 20191121 (Red Hat 8.3.1-5) (GCC)) x86_64 x86_64 x86_64 GNU/Linux
LSB Version:	:core-4.1-amd64:core-4.1-noarch
Distributor ID:	CentOS
Description:	CentOS Linux release 8.2.2004 (Core) 
Release:	8.2.2004
Codename:	Core
httpd-2.4.37-30.module_el8.3.0+561+97fdbbcc.x86_64
PHP 7.4.15 (cli) (built: Feb  2 2021 14:19:57) ( NTS )
Copyright (c) The PHP Group
Zend Engine v3.4.0, Copyright (c) Zend Technologies
    with Zend OPcache v7.4.15, Copyright (c), by Zend Technologies


### linux基本命令-命令库

下载wget，后台下载使用wget -b + url，可以在当前目录wget-log文件查看进度。

    yum install -y wget

安装可以上传rz和从vps上下载东西sz的命令：
    
    yum install -y lrzsz

查看版本信息

    cat /proc/version
    cat /etc/redhat-release
    uname -a
    lsb_release -a

rpm相关。关于rpm包相互依赖的问题可以同时安装。

    1.安装软件：执行rpm -ivh rpm包名，如：
    #rpm -ivh apache-1.3.6.i386.rpm
    2.升级软件：执行rpm -Uvh rpm包名。rpm -qa | grep XXXX(moudle name)

yum相关：
    
    yum install php55w-fpm

dnf -y install dnf-utils

ps aux | grep
kill [-s <信息名称或编号>][程序]　或　kill [-l <信息编号>] 
    1 (HUP)：重新加载进程。
    9 (KILL)：杀死一个进程。
    15 (TERM)：正常停止一个进程。


[隐蔽信息]: <> (
<### 搭建shadowsocks：
<```
wget --no-check-certificate -O shadowsocks-all.sh https://raw.githubusercontent.com/teddysun/shadowsocks_install/master/shadowsocks-all.sh
chmod +x shadowsocks-all.sh
./shadowsocks-all.sh 2>&1 | tee shadowsocks-all.log
<```
三步搭建完成，选择Shadowsocks-python，和加密方式aes-256-cfb，端口可以自己设置9999，记下。
)

### 搭建Apache：

apache是什么：
The Apache HTTP Server Project is an effort to develop and maintain an open-source HTTP server for modern operating systems including UNIX and Windows. The goal of this project is to provide a secure, efficient and extensible server that provides HTTP services in sync with the current HTTP standards.


首先检查是否已经搭建：

    rpm -qa httpd

有则删除rpm -e,然后直接安装：

    yum install httpd

设置开机自启：

    systemctl start httpd.service
    systemctl enable httpd.service

查看服务器状态。“enabled”表示httpd服务已设为开机启动，“active（running）”则表示httpd服务正在运行中。

    systemctl status httpd.service

### 安装mysql

[ii]: <> (Linda701#)

下载文件：
[Mysql](https://repo.mysql.com//mysql57-community-release-el7-11.noarch.rpm)
[mysql80](https://repo.mysql.com//mysql80-community-release-el8-1.noarch.rpm)
关于下载文件，可以上官网下载，因为需要注册一个账号才能下载。注意CentOS8.2 适配mysql57。如果是安装mysql80，那么将需要处理rpm包依赖问题。处理安装问题参见[安装php]旧版参考。

这里需要注意的是，mysql80-community-release-el8-1.noarch.rpm和mysql80-community-release-sl15-1.noarch.rpm，sl与el的区别。建议选择el。

将MySQL Yum Repository添加到系统的软件库列表（repositorylist）：

    yum localinstall mysql57-community-release-el7-11.noarch.rpm

检查是否添加成功：

    yum repolist enabled | grep mysql

安装：

    yum install mysql-community-server

>安装时报错
    All matches were filtered out by modular filtering for argument: mysql-community-server
    Error: Unable to find a match: mysql-community-server
解决办法：先执行 yum module disable mysql，然后再执行yum -y install mysql-community-server

设置开机自启：

    systemctl start mysqld
    systemctl enable mysqld

查看mysql状态：

    systemctl status mysqld

验证安全性并且修改密码：

    mysql_secure_installation

一开始的时候是无法修改的，“无论“你用什么密码，并且会有报错：
Access denied for user 'root'@'localhost' (using password: YES)
而且直接使用命令mysql也会出现这个命令。
这个时候我们查看日志文件，文件路径：var/log/mysqld.log：
vi var/log/mysqld.log
它的前几条是这样的：

```linux
2018-02-08T06:34:34.589634Z 0 [Warning] TIMESTAMP with implicit DEFAULT value is deprecated. Please use --explicit_defaults_for_timestamp server option (see documentation for more details).
2018-02-08T06:34:34.899941Z 0 [Warning] InnoDB: New log files created, LSN=45790
2018-02-08T06:34:34.954452Z 0 [Warning] InnoDB: Creating foreign key constraint system tables.
2018-02-08T06:34:35.014213Z 0 [Warning] No existing UUID has been found, so we assume that this is the first time that this server has been started. Generating a new UUID: 20d53a55-0c9a-11e8-95e9-aaaa000c817e.
2018-02-08T06:34:35.016110Z 0 [Warning] Gtid table is not ready to be used. Table 'mysql.gtid_executed' cannot be opened.
2018-02-08T06:34:35.016686Z 1 [Note] A temporary password is generated for root@localhost: f+=Myhg,o3_6
```

```
[Server] A temporary password is generated for root@localhost: dKA)MfrMT3+B
```

可以看到有一句，即此处的最后一句中有提到，一个临时的密码为root用户：f+=Myhg,o3_6
密码就是这个，有了这个之后就可以进行修改了，使用如上命令进行修改的时候，需要设置保密程度最高的密码，有大写小写的字母，特殊符号和数字~
到此，mysql安装完成。

顺便提一句资料：
/etc/my.cnf：这是MySQL的配置文件。
/var/lib/mysql：这是数据库实际存放目录。毫无疑问，不能删，并且，要注意，给予其所在分区足够的容量。
/var/log/mysqld.log：这是MySQL的错误日志文件。

### 搭建php：

使用dnf进行安装php74。

依旧是配置源文件，不再赘述。

epel存储库。常使用`rpm -qa | grep epel`进行查看是否安装完成。

    dnf -y install https://dl.fedoraproject.org/pub/epel/epel-release-latest-8.noarch.rpm

remi存储库。

    dnf install https://rpms.remirepo.net/enterprise/remi-release-8.rpm

添加EPEL和Remi存储库后，获取可用PHP模块流的列表，会有一个下载镜像文件的过程。

    dnf module list php

根据php流模块，启用对应php版本的流模块，这里我们安装的是php7.4的版本，所以启用remi-7.4版本的流。
    
    dnf module enable php:remi-7.4

安装PHP，此命令还安装许多其他软件包。
    
    dnf install php php-cli php-common php-mysql

使用`php -v`查看版本以确认是否安装成功。

其中，软件包说明见文末。

[参考链接](https://www.cnblogs.com/mayg/p/13932360.html)

---一下为旧版安装方式，只做记录，不做实用---

以yum的方式安装php55
检查是否已经存在：
yum list installed | grep php
有则删除
然后更改源。这个源因地制宜，可以使用阿里镜像，或者163镜像。

```linux
rpm -Uvh https://mirror.webtatic.com/yum/el7/epel-release.rpm
rpm -Uvh https://mirror.webtatic.com/yum/el7/webtatic-release.rpm
```

安装php：

```linux
yum install php55w.x86_64 php55w-cli.x86_64 php55w-common.x86_64 php55w-gd.x86_64 php55w-ldap.x86_64 php55w-mbstring.x86_64 php55w-mcrypt.x86_64 php55w-mysql.x86_64 php55w-pdo.x86_64

yum install php70w.x86_64 php70w-cli.x86_64 php70w-common.x86_64 php70w-gd.x86_64 php70w-ldap.x86_64 php70w-mbstring.x86_64 php70w-mcrypt.x86_64 php70w-mysql.x86_64 php70w-pdo.x86_64
```

出现报错：

    Repository epel is listed more than once in the configuration
    All matches were filtered out by modular filtering for argument: php70w.x86_64
    Error: Unable to find a match:  

根据第一句话删除了/etc/yum.repos.d/中的一些repo文件，并定向到阿里镜像。其实这个只是镜像重复，应该不是主要问题。还是镜像选择的问题。

    rm -rf CentOS-CR.repo CentOS-Debuginfo.repo CentOS-fasttrack.repo CentOS-Media.repo CentOS-Sources.repo CentOS-Vault.repo

    yum clean all
    yum makecache

之后报错：

```js
 Problem 1: conflicting requests
  - nothing provides libcrypto.so.10()(64bit) needed by php70w-7.0.33-1.w7.x86_64
  - nothing provides libssl.so.10()(64bit) needed by php70w-7.0.33-1.w7.x86_64
  - nothing provides libssl.so.10(libssl.so.10)(64bit) needed by php70w-7.0.33-1.w7.x86_64
  - nothing provides libcrypto.so.10(libcrypto.so.10)(64bit) needed by php70w-7.0.33-1.w7.x86_64
  - nothing provides libcrypto.so.10(OPENSSL_1.0.1_EC)(64bit) needed by php70w-7.0.33-1.w7.x86_64
  - nothing provides libcrypto.so.10(OPENSSL_1.0.2)(64bit) needed by php70w-7.0.33-1.w7.x86_64
、、、、、、
Problem 6: package php70w-pdo-7.0.33-1.w7.x86_64 requires php70w-common(x86-64) = 7.0.33-1.w7, but none of the providers can be installed
  - conflicting requests
  - nothing provides libcrypto.so.10()(64bit) needed by php70w-common-7.0.33-1.w7.x86_64
  - nothing provides libssl.so.10()(64bit) needed by php70w-common-7.0.33-1.w7.x86_64
```

libcrypto.so.10()(64bit)
libssl.so.10()(64bit)

openssl-libs-1.0.2k-21.el7_9 RPM for x86_64(http://vault.centos.org/7.9.2009/updates/Source/SPackages/openssl-1.0.2k-21.el7_9.src.rpm)

libpng15.so.15()(64bit)
libjpeg.so.62()(64bit)
libXpm.so.4()(64bit)

http://rpmfind.net/linux/centos/7.9.2009/os/x86_64/Packages/libpng-1.5.13-8.el7.x86_64.rpm
http://rpmfind.net/linux/centos/7.9.2009/os/x86_64/Packages/libjpeg-turbo-1.2.90-8.el7.x86_64.rpm
http://rpmfind.net/linux/centos/7.9.2009/os/x86_64/Packages/libXpm-3.5.12-1.el7.x86_64.rpm

已经安装关键字glibc:
glibc-2.28-101.el8.x86_64
glibc-common-2.28-101.el8.x86_64
glibc-headers-2.28-101.el8.x86_64
glibc-devel-2.28-101.el8.x86_64
glibc-langpack-zh-2.28-101.el8.x86_64
glibc-langpack-en-2.28-101.el8.x86_64

libnsl.so.1()(64bit)包一直缺失，猜测libnsl-2.28-145.el8.x86_64.rpm，但是需要glibc(x86-64)-2.28-145.el8，已有glibc-2.28-101.el8.x86_64。
猜测需要libnsl-2.28-101.el8.x86_64.rpm(ftp://ftp.pbone.net/mirror/vault.centos.org/8.2.2004/BaseOS/x86_64/kickstart/Packages/libnsl-2.28-101.el8.x86_64.rpm)。

libltdl.so.7()(64bit)
libmysqlclient.so.18()

http://rpmfind.net/linux/centos/7.9.2009/os/x86_64/Packages/libtool-ltdl-2.4.2-22.el7_3.x86_64.rpm
libmysqlclient18-5.5.25a-3.4.x86_64.rpm(ftp://ftp.pbone.net/mirror/ftp5.gwdg.de/pub/opensuse/repositories/home:/Tnokon/CentOS_7/x86_64/libmysqlclient18-5.5.25a-3.4.x86_64.rpm)

libmysqlclient.so.18(libmysqlclient_18)(64bit)
ftp://ftp.pbone.net/mirror/ftp5.gwdg.de/pub/opensuse/repositories/home:/ottokek/CentOS_CentOS-6/x86_64/libmysqlclient18-10.0.14-4.1.x86_64.rpm

mysql-community-common-8.0.23-1.el8.x86_64
mysql-community-server-8.0.23-1.el8.x86_64
mysql-community-client-plugins-8.0.23-1.el8.x86_64
mysql-community-client-8.0.23-1.el8.x86_64
mysql80-community-release-el8-1.noarch
mysql-community-libs-8.0.23-1.el8.x86_64

密钥问题，--force，影响未明，warning: libXpm-3.5.12-1.el7.x86_64.rpm: Header V3 RSA/SHA256 Signature, key ID f4a80eb5: NOKE

安装php FPM（fpm是php的一个脚本管理器）。安装php70时，直接使用`yum install php-fpm`即可
yum install php55w-fpm
设置开机自启：
systemctl enable php-fpm.service
检查是否安装完成：
php -v
有版本显示且没有报错则安装成功

但是打开节目面看到，`PHP 7.1.3+ is required.Currently installed version is: 7.0.33`。应该不是phpmyadmin(phpMyAdmin-5.0.4)的问题，是php与mysql的问题。不，就是phpmyadmin的问题，https://www.phpmyadmin.net/files/中有所说明，Current version compatible with PHP 7.1 and newer and MySQL 5.5 and newer.
So we could use the older version to compatible with php7.0.Choose the phpmyadmin4.9.7

https://files.phpmyadmin.net/phpMyAdmin/5.0.4/phpMyAdmin-5.0.4-all-languages.tar.gz
https://files.phpmyadmin.net/phpMyAdmin/4.9.7/phpMyAdmin-4.9.7-all-languages.tar.gz

注意:PHP 5 的使用者可以使用 MySQL extension，mysqli 和 PDO_MYSQL 。php 7移除了mysql extension，只剩下后面两种选择.

### 安装phpmyadmin：

在网站根目录下var/www/html/文件下安装：

```linux
wget https://files.phpmyadmin.net/phpMyAdmin/4.0.10.20/phpMyAdmin-4.0.10.20-all-languages.tar.gz
https://files.phpmyadmin.net/phpMyAdmin/5.0.4/phpMyAdmin-5.0.4-all-languages.tar.gz
```

然后解压：
tar -xvzf phpMyAdmin-4.0.10.20-all-languages.tar.gz
之后建议修改文件名：
mv phpMyAdmin-4.0.10.20-all-languages nametest

当然文件名不一定要phpmyadmin，所以这里这里使用nametest来代替。
之后进入这个namertest文件，然后打开libraries文件夹
将其中的config.default.php移到上一级文件夹中并修改文件名为config.inc.php，因为后面还要修改内容，不如将它下到桌面上：
sz config.default.php

先改名为config.inc.php，然后用sublime修改如下参数：

```linux
$cfg['PmaAbsoluteUri'] = 'http://yourip/nametest/';//yourip和nametest
$cfg['blowfish_secret'] = '103C2DD9C3C3F91F';//随便是什么，不为空就好，越复杂越好
```

然后将其上传到nametest文件夹下：
rz
选中文件上传即可。
最后重启Apache：
service httpd restart
就好了。

### 安装nodejs

首先要知道两个环境apache和nodejs两者的关系。
Node.js 是一个开源与跨平台的 JavaScript 运行时环境。
npm 的简单结构有助于 Node.js 生态系统的激增，现在 npm 仓库托管了超过 1,000,000 个可以自由使用的开源库包。
Apache支持的时HTTP，nodejs支持的是JavaScript。所以两个环境都可以安装。

    dnf module list nodejs
    dnf module install nodejs:<stream>
    dnf module install nodejs:14

### 问题后记：

说来重装了n遍之后得出的，但是事实上问题还是有的~

1. 当你键入mysql命令时，你会发现，仍然有报错：

ERROR 1045 (28000): Access denied for user 'root'@'localhost' (using password: NO)
键入需要密码的登入方式mysql -u root –p还是有报错。
但是有时候输入mysql -u root -p有是可以进去的~

不一定是密码问题，也有可能是权限问题，root用户的权限，
网络上的资料里大部分是绕过密码重置新密码之类的，而且还有一个叫做root用户的可以登入，还有一个是某个端可以登入，不能理解，所以推测是用户问题。

2. 安装shadowsocks时端口是随机的，8989端口很眼熟。

当我使用小飞机试图上谷歌的时候发现端口有一些问题，其中的服务器端口是需要那个随机端口的，所以还是不要随机了。<废话>

3. 听说在安装完Apache的时候要放行80端口：
firewall-cmd --zone=public --add-port=80/tcp --permanent
然后重启防火墙：
firewall-cmd --reload
然后检查是否放行：
firewall-cmd --list-all
但是我在使用第一个语句的时候，报错，防火墙ID有问题~
但是依旧能够使用~

4. 关于mysql密码，一开始的时候是最高保密程度~可以更改，在文件下，有待研究。
解决：首先应该登入mysql，建议使用mysql -u root -p语句输入密码登入，然后我们首先查看一下mysql当前的密码策略：
SHOW VARIABLES LIKE 'validate_password%';
显示如下：

```sql
+--------------------------------------+--------+
| Variable_name                        | Value  |
+--------------------------------------+--------+
| validate_password_check_user_name    | OFF    |
| validate_password_dictionary_file    |        |
| validate_password_length             | 8      |
| validate_password_mixed_case_count   | 1      |
| validate_password_number_count       | 1      |
| validate_password_policy             | MEDIUM |
| validate_password_special_char_count | 1      |
+--------------------------------------+--------+
7 rows in set (0.00 sec)
```

这里面的参数是这样的：
1).validate_password_dictionary_file 指定密码验证的文件路径;
2).validate_password_length  密码最小长度
3).validate_password_mixed_case_count  密码至少要包含的小写字母个数和大写字母个数;
4).validate_password_number_count  密码至少要包含的数字个数
5).validate_password_policy 密码强度检查等级，对应等级为：0/LOW、1/MEDIUM、2/STRONG,默认为1
6).validate_password_special_char_count密码至少要包含的特殊字符数
注意：
0/LOW：只检查长度;
1/MEDIUM：检查长度、数字、大小写、特殊字符;
2/STRONG：检查长度、数字、大小写、特殊字符字典文件。
然后我们来更改它的密码策略：
set global validate_password_special_char_count = 0;
set global validate_password_mixed_case_count = 0;
需要在另行修改，因为这些参数是全局的，所以要加上global。
然后就可以修改密码了：
set PASSWORD = PASSWORD(‘newpassword’);

5. 网站根目录问题：
编辑文件httpd.conf：

```linux
<IfModule mod_dav_fs.c>
    # Location of the WebDAV lock database.
    DAVLockDB /var/lib/dav/lockdb
</IfModule>

# ----------------------------------------------------

#自己加的

Alias /test/ "/var/www/test/"

# 设置相关目录属性

<Directory "/var/www/test/">
    Options Indexes FollowSymLinks
    AllowOverride None
    Order allow,deny
    Allow from all
</Directory>


#---------------------------------------------------
```

6. php模块说明：

```
php74：安装PHP 7.4的包
php74-php：用于创建动态web的PHP脚本语言网站
php74-build：基本的构建配置
php74-php-gd：用于PHP应用程序使用gd的模块图形库
php74-xhprof：一个用于PHP - Web接口的层次分析器
php74-zephir：用于创建扩展的Zephir语言PHP：
php74-php-ast：抽象语法树
php74-php-cli：用于PHP的命令行接口
php74-php-dba：一个用于PHP的数据库抽象层模块应用程序
php74-php-dbg：交互式PHP调试器
php74-php-ffi：外部函数接口
php74-php-fpm：PHP FastCGI进程管理器
......
```

参考资料：

1. [xx](http://www.centoscn.com/CentosServer/www/2015/0414/5183.html)
2. [Centos7下Yum更新安装PHP5.5,5.6,7.0](http://blog.csdn.net/ityang_/article/details/53980190)

---

## ubuntu上搭建lnmp环境：

关于nginx的搭建，体系思路没错：

### nginx中安装mysql：

sudo apt install mysql-server

### 安装nginx和php：

```linux
#添加nginx和php的ppa源
sudo apt-add-repository ppa:nginx/stable
sudo apt-add-repository ppa:ondrej/php
sudo apt update
```

### 安装：

sudo apt install nginx

安装PHPFastCGI管理器：
sudo apt install php7.0-fpm

修改配置文件：
sudo vim /etc/php/7.0/fpm/pool.d/www.conf
此文件修改内容：

```linux
#nginx 和fastcgi通信有2种方式，一种是TCP方式，还有种是UNIX Socket方式
#默认是socket方式
listen = /run/php/php7.0-fpm.sock
```

检查下配置文件是否有错误
sudo php-fpm7.0 -t

重启下 php7.0-fpm
sudo service php7.0-fpm restart

修改nginx配置文件
sudo vim /etc/nginx/sites-enabled/default
修改内容：
root /var/www;

```linux
# Add index.php to the list if you are using PHP
index index.php index.html index.htm index.nginx-debian.html;

        location ~ \.php$ {
                include snippets/fastcgi-php.conf;
        #
        #       # With php-fpm (or other unix sockets):
                fastcgi_pass unix:/run/php/php7.0-fpm.sock;
                fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        #       # With php-cgi (or other tcp sockets):
        #       fastcgi_pass 127.0.0.1:9000;
        }
```

检查配置文件命令是

    sudo nginx -t

重启下 nginx

    sudo service nginx restart

安装一些常用的扩展库

    sudo apt install php-mysql php-curl php-mcrypt php-gd php-memcached php-redis  #此方式安装会同时在多个版本下面分别安装
    sudo apt install php7.0  

问题：
1. 其中静态页面无法解析
