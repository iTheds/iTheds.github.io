---
title: "打印机问题及使用方法"
date: "2018-8-29"
author: "Lonnie iTheds"
categories:
  - tools
draft: false
section: "archives"
sourcePath: "markdown/archives/打印机使用手册oo.md"
slug: "archives/打印机使用手册oo"
---

# 打印机问题及使用方法

本文针对于HP LaserJet1020打印机做出详细解答，其他类型打印机可在此基础上扩展使用。

## 使用技巧

一些常规技巧

> ### 驱动下载

在网站https://support.hp.com/cn-zh/drivers/selfservice/HP-LaserJet-1000-Printer-series/439423/model/439428上下载驱动安装即可使用HP打印机。

> ### 双面打印方法

选择双面打印，之后出纸，顺序反调，背面朝上入纸即可。

## 系统性问题

在接入打印机的时候最好关闭杀毒软件，并且停止运行管家之类的软件。

> ### 常规未识别

在网站https://support.hp.com/cn-zh/drivers/selfservice/HP-LaserJet-1000-Printer-series/439423/model/439428上下载驱动实时程序诊断工具运行即可。

> ### 还有就是什么来着~

对于什么线程问题、USB串行问题的话未经过实验测试，可以考虑重启，拔掉其他USB诸如鼠标之类

## 非技术性问题

纸张塞住问题在此不做讨论

> ### 墨不均匀问题

墨如果是局部不清晰，可以考虑将墨盒拿出摇一摇在放入，注意不要摇的太狠，不然手会变黑(记得照镜子看看脸)。
上述用于纵向局部不清晰，如果无规则不清晰或者是摇一摇不生效，可以考虑换墨盒。

### Recode

[10.19]
办公室的垃圾打印机。
有两个打印机器， 一个是 M227fdw ；另一个是 ， 无所谓，先不用这个。

M227fdw：
首先检查驱动程序是否安装。
直接上[官网](https://support.hp.com/cn-zh/drivers/closure/hp-laserjet-pro-mfp-m227-series/model/9365386?sku=G3Q75A)
下载一个 Hp easy start 。然后打开其助手软件，发现其 ip 为 192.168.3.55 。 其实这个 ip 在打印机上也能看到。

千万不要下载什么打印机助手，简直就是垃圾。

非常离谱，我的 linux 可以打印，但是 windows 无法打印。

英文太差，duplex 明明就是双面打印， linux 怎么都大不了，不知道是不是有其他信息。

用另一台 M329 , 其网络查看后发现是 192.168.50.55 .
但是不知道这是不是有线网络。
电脑配置无线 DataSong 之后， 使用 .30. 网域， 网关 192.168.30.254 之后。

hp easy start 是个好东西。
M329 的驱动经过了重装之后，就好用了。应该是之前装的驱动有问题， hp easy start 重装的是可行的。
