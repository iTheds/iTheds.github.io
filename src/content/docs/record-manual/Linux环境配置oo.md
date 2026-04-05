---
layout: post
title: "Linux 环境配置"
subtitle: "纪念性水文"
date: 2018-5-15
author: Lonnie iTheds
header-img: "hexo.jpg"
cdn: 'header-on'
categories:
  - 服务器
tags:
  - Linux
description: "Linux 环境配置"
---

<link rel="stylesheet" type="text/css" href="../../auto-number-title.css" />

# 配置Linux环境

## 安装VMware12虚拟机

下载地址：`https://my.vmware.com/cn/web/vmware/info/slug/desktop_end_user_computing/vmware_workstation_pro/14_0`。
密钥序列5A02H-AU243-TZJ49-GTC7K-3C61N。
首先在官网上下载VMware Workstation 12，然后进行安装。安装过程中可以改变安装目录，也可以选择是否生成桌面快捷方式、是否固定到“开始”屏幕。之后输入产品永久密钥。

## 部署CentOS 64位操作系统

在本书中选择部署Linux(CentOS7)虚拟机系统。
首先在[CentOS官网](https://www.centos.org/download/)上下载Centos7的镜像文件。以下针对各个版本的ISO镜像文件，进行一一说明：

CentOS-7.0-x86_64-DVD-1503-01.iso           标准安装版，一般下载这个就可以了（推荐）
CentOS-7.0-x86_64-NetInstall-1503-01.iso    网络安装镜像（从网络安装或者救援系统）
CentOS-7.0-x86_64-Everything-1503-01.iso    对完整版安装盘的软件进行补充，集成所有软件。（包含centos7的一套完整的软件包，可以用来安装系统或者填充本地镜像）
CentOS-7.0-x86_64-GnomeLive-1503-01.iso     GNOME桌面版
CentOS-7.0-x86_64-KdeLive-1503-01.iso       KDE桌面版
CentOS-7.0-x86_64-livecd-1503-01.iso        光盘上运行的系统，类拟于winpe
CentOS-7.0-x86_64-minimal-1503-01.iso       精简版，自带的软件最少

下载镜像后进入VMware进行配置。
本书下载的是CentOS-7-x86_64-DVD-1804.iso。

开始配置：

打开VMware虚拟机，如图所示，创建新的虚拟机，选择自定义安装，
下一步，选择workstation 12.0，
下一步，选择下载的镜像文件，选择稍后安装操作系统，
下一步，选择linux，CentOS 64位，下一步，命名，选择虚拟机安放位置。下一步，选择处理器配置，
下一步，选择内存配置,
下一步，选择使用网络地址转换，
下一步，SCSI控制器选择LSI Logic，
下一步，选择虚拟磁盘类型SCSI，
下一步，选择创建新虚拟磁盘，
下一步，选择最大磁盘大小40GB，将虚拟磁盘，存储为单个文件。
下一步，在指定文件中创建一个磁盘文件。下
一步，选择自定义硬件配置，新CD/DVD中使用IOS镜像文件，在相应文件夹中选择iso文件，完成。

打开虚拟机，首先显示的界面如下，选择install CentOS 7，之后回车确认安装。等待安装完成后，显示可视化界面如下：

选择安装中文界面，之后配置软件选择安装GNOME桌面。
之后挂载文件目录到磁盘上:选择安装位置,勾选本地标准磁盘，选择我要配置分区，点击完成，之后选择自动创建它们，使用默认配置，选择完成，接受更改.之后配置root用户和密码。
开始安装。
重启后完成剩余配置，首先接受许可。之后，完成配置,即可进入linux的可视化界面。

## 配置网络

首先打开虚拟机，进入终端，输入ifconfig，显示如下图所示：
此即表明，虚拟机网络并未配置成功。
打开配置中的网络，将有线网络打开，即可以有线的方式将虚拟机连接本机上的网络，之后在终端中再次输入ifconfig查看状态，如图所示，表明连接成功，之后就可以使用网络了。

系统将master的IP配置为192.168.52.128,不同的虚拟机所选择的IP为随机IP，此外，系统还自动配置了网关，子网掩码等。

## Linux终端

linux系统在诞生之初就被设计成一个单主机-多终端模式的多用户系统。
各个终端与终端服务器相连，各个主机也与终端服务器相连。当终端启动时，终端服务器询问用户要登录哪个主机，用户指定主机后，再输入用户名和密码登录相应的主机。这种拓扑结构很像今天的家庭网络，终端服务器相当于路由器。

linux的终端即是用户直接与计算机系统交互的平台，如图：
只需要按右键打开终端(terminal)即可。linux的终端与windows上的DOS命令相似。

常用终端命令：

```txt
打开目录：cd
查看文件：cat
编辑文件：vi
查看当前目录文件：ls
在当前目录下创建目录：mkdir
在当前目录下创建文件：touch
为文件赋予权限：chmod
为用户赋予权限：chown
编译：gcc
```

只要你所登入的是root用户，在linux的终端上可以直接对linux系统进行操作。linux的命令集方便而又简洁，在控制权限、处理文件、调整网络等各个方面都有着极大的优点。

## Fedora install Fcitx

Use gnome ,this install fcitx should install extensions, and install [`Input Method Panel`](https://extensions.gnome.org/extension/261/kimpanel/),it is a KDE's kimpanel protocol for Gnome-Shell.

Then, install fcitx, just as most website do.

Then ,use `im-chooser` to change input. it is imsettings.

But you know, last content much English gammer error, because I can't use the input, and my old input is disable.

然后呢，重启系统。再次使用命令`im-chooser`进行启动。
不过默认的 pingyin 似乎更加难用。

这是使用 imsettings 的配置方法，如果是使用 alternatives 应该使用以下命令：
```bash
sudo alternatives --config xinputrc
```

然后安装搜狗，

```bash
sudo dpkg -i sogoupinyin_4.2.1.145_amd64.deb
```

或者：

```bash
sudo alien -r sogoupinyin_4.2.1.145_amd64.deb generated
sudo rpm -ivh sogoupinyin-4.2.1.145-2.x86_64.rpm
```

其包就是 am64, 这就是 x86 框架， 如果是 arm 框架 ，则是 arm 。

can't use sogou , use `fcitx-diagnose | grep sogou` , see :

```bash
            fcitx-sogoupinyin
            fcitx-sogoupinyinhdm
            fcitx-sogoupinyinhxm
    **Cannot find file `fcitx-sogoupinyinhxm.so` of addon `fcitx-sogoupinyinhxm`.**
    **Cannot find file `fcitx-sogoupinyinhdm.so` of addon `fcitx-sogoupinyinhdm`.**
    **Cannot find file `fcitx-sogoupinyin.so` of addon `fcitx-sogoupinyin`.**
        sogoupinyin
```

但是：
```bash
$ sudo find /usr -name fcitx-sogoupinyin.so
/usr/lib/x86_64-linux-gnu/fcitx/fcitx-sogoupinyin.so
```

所以呢，搞了半天，没有弄好，于是乎：
```bash
dnf list installed | grep fcitx | awk '{print $1}' | xargs sudo dnf remove -y
```

主要原因是什么，不清楚，可能是需要 `kcm-fcitx`。

## 查看默认输入法

```bash
echo $GTK_IM_MODULE
echo $QT_IM_MODULE
echo $XMODIFIERS 
```

Fedora 默认输入法为 ibus 。
ibus 本身就是适用于 Gnome 框架的。


