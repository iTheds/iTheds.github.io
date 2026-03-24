---
title: "RHEL系统笔记"
date: "2018-9-2"
subtitle: "在电脑中安装和使用RHEL(Redhat Enterprise Linux)"
author: "Lonnie iTheds"
categories:
  - 服务器
draft: false
section: "archives"
sourcePath: "markdown/archives/RHEL双系统笔记oo.md"
slug: "archives/RHEL双系统笔记oo"
---

# RHEL系统笔记

本文主要介绍关于在电脑中安装和使用RHEL(Redhat Enterprise Linux)。

## 安装过程

[^_^]:<> (账号：iTheds，密码：rand)

我们需要下载一个iso镜像文件并且刻录在有7G左右内存的U盘里，之后更改boot选择U盘启动进行安装即可。
具体安装过程如下：

> ### 分区

首先我们要在电脑中拿出一块空闲的存储空间来给REHL。通过此电脑右键管理，进入管理界面，选择磁盘管理，选择一个空闲内存比较多的磁盘，右键“压缩卷”，之后我们可以手动输入需要的空间，x*(2^10)即使x个G，一般的双系统中的linux分配大小在20个G以上即足够，在此选择30个G以备不时只需。之后压缩即可。在此值得一说的是，不需要对刚刚压缩出来的空闲内存进行新建卷，新建卷之后内存为独立在使用的内存无法安装系统。

> ### 下载

需要注意两点：
1.REHL是需要登入之后才能进行下载的，所以需要注册一个redhat账号。
2.RHEL是需要经过订阅之后才能使用的，不然yum不能使用并且只有30天的试用期。订阅其实就是一个购买注册码的过程，当然，如果加入了[redhat红帽开发者计划](https://developers.redhat.com/products/rhel/overview/)可以免费使用RHEL的最新版。

直接下载可进入[下载链接](https://access.redhat.com/downloads)[https://access.redhat.com/downloads](https://access.redhat.com/downloads)下载镜像。
这里的镜像下载需要注意的是最好直接下载dvd.iso文件，里面有整个镜像大概4.3G；其中的boot.iso文件只有500MB左右，也可以进行刻录安装，但是安装的时候还是需要网络另行下载系统文件的。

[hello]:<> (下载地址：
https://access.cdn.redhat.com/content/origin/files/sha256/d0/d0dd6ae5e001fb050dafefdfd871e7e648b147fb2d35f0e106e0b34a0163e8f5/rhel-server-7.5-x86_64-dvd.iso?_auth_=1535808656_874fa341464c515d3787a971794efcb9#fndtn-windows)

[^_^]:<> (for boot:https://access.cdn.redhat.com/content/origin/files/sha256/64/64f6ba615825e39da5def5178bd50149c506d603cfcf49f1a6d91495342b5bcf/rhel-server-7.5-x86_64-boot.iso?_auth_=1535872729_1f0eb35b06e3f18e1e8c31b44a0391a6#fndtn-windows)

> ### 刻录

我们先准备好一个在7G以上的U盘，刻录过程会清空所有U盘文件，注意备份。
之后我们需要一个叫做[UltralSO](https://cn.ultraiso.net/xiazai.html)的软件，需要付费但是可以免费试用，不影响正常的日常使用。下载后找到上阙下载的iso文件，右键选择使用RltralSO打开，点击启动，写入硬盘文件，选择准备好的U盘，勾选刻录校验，之后就可以进行刻录了。

U盘有两种文件格式NTFS和FAT32，我们可以在手动格式化的时候选择格式化成哪一种。推荐使用NTFS，比较稳定。

> ### 更改boot选项

所有都准备就绪后我们关机再启动，启动过程中按下F2键进入boot界面，更改启动项为U盘启动即可。

关于按键，F2或者F12或者F10(或者Fn+F2，依电脑厂商而定)，关于这个，如果不行的话多尝试几次，可以一直按着这些键~(嗯~我就是这么做的~)。需要注意关闭快速启动。

关于如何更改为U盘启动，在boot界面，将第一个优先启动按-/+来进行修改，形如你U盘名字的便是。

> ### 安装

安装教程可见[https://linux.cn/article-8067-1.html](https://linux.cn/article-8067-1.html)。
特别值得注意的是，在软件选择(software selection)中，不要选择最小化，记得选择“带GUI的服务器”，勾选最基本的KDE的插件，以及一些常规的需要安装的插件，不然的话你会发现安装了一个没有图像界面的linux。