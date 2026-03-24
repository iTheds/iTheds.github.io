---
layout: post
title: "局域网内共享WLAN"
subtitle: ""
date: 2024-4-17
author: Lonnie iTheds
header-img: "hexo.jpg"
cdn: 'header-on'
categories:
    - 服务器
tags:
    - linux
---

<link rel="stylesheet" type="text/css" href="../../auto-number-title.css" />

# 局域网内共享WLAN

搭建完成局域网后，内部网络没有连接到互联网。
此时，有一个电脑能够通过 WLAN 使用 wifi 连接到互联网。
期望达到在维持现有的局域网 ip 网段的情况下，其他的设备也能够连接到互联网。

在设备上安装 claush, 并且开设代理，局域网内的其他设备通过配置代理的模式，能够进行 Http /Https 协议的代理。
此时，就能够满足大部分的需求。
但是，由于其他设备中包括许多 linux 设备，需要安装各式环境。在执行 `apt insttall` 时 ， 往往会执行失败，因为阿里镜像地址无法被识别。
通过 `ping www.baidu.com` 发现， 无法识别该域名。
一开始怀疑是 DNS 解析的问题， 因为 ping 使用的是 icmp 协议， 其无法解析 DNS ，于是，使用简易工具*NTBIND*在联网设备上搭建 DNS 服务器。
再次进行`ping`时，发现变成了网络不可达，使用`curl -v www.baidu.com`依然无效，无接收数据。说明即使能够使用 icmp 协议进行(UDP)解析，仍然无法解决在数据链路层的通信问题。

转而使用自建 VPN 的方式，在自身的局域网内使用。安装 *SoftEther* ，连接发现，仍然无法连接网络，因为使用 VPN 远程访问服务，所选择的网卡是以太网网卡。

于是进行网桥操作，但是桥接已连接的以太网，也无法达到相应效果。

转而使用网络共享，更改设备的 ip 为 192.168.137.0 网段， 成功。

