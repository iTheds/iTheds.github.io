---
title: "PCIe学习笔记"
published: 2022-10-05
description: "PCIe总线技术基础与应用"
tags:
  - "PCIe"
  - "计算机总线"
  - "硬件接口"
category: "计算机组成"
draft: false
author: "Lonnie iTheds"
---
# PCIe学习笔记

PCIe，很熟悉的名字，是现代计算机系统中广泛使用的高速总线标准。

## PCIe概念

PCIe(Peripheral Component Interconnect Express)是第三代I/O总线，是PCI总线的后继者。与传统PCI总线相比，PCIe采用了点对点串行连接方式，具有更高的带宽和更好的可扩展性。

PCIe可拓展性强，可以支持的设备有：
- 显卡
- 固态硬盘（PCIe接口形式）
- 无线网卡
- 有线网卡
- 声卡
- 视频采集卡
- PCIe转接M.2接口
- PCIe转接USB接口
- PCIe转接Type-C接口等

参考资料：[PCIe基础篇（一）、基础知识扫盲](https://www.cnblogs.com/luxinshuo/p/11951041.html)

## PCIe和PCI的区别

PCIe与传统PCI总线的主要区别：

1. **连接方式**：
   - PCI：采用并行总线架构，所有设备共享同一总线
   - PCIe：采用点对点串行连接，每个设备有专用通道

2. **带宽**：
   - PCIe带宽远高于PCI，且可通过增加通道(lane)数量进一步提升

3. **扩展性**：
   - PCIe支持热插拔
   - PCIe通过增加通道数可灵活配置不同性能需求的设备

4. **电气特性**：
   - PCIe使用差分信号传输，抗干扰能力更强

## PCIe通信过程

PCIe通信过程涉及多个层次的数据处理和传输：

### 发送端流程

1. 设备核或应用软件产生数据信息
2. PCI Express Core Logic Interface将数据格式转换为TL层可接受的格式
3. 事务层(TL)产生相应的数据包，并存储在缓冲buffer中
4. 数据链路层(Data Link Layer)为数据包添加额外信息，用于接收端进行数据正确性检查
5. 物理层将数据包编码，通过多条链路使用模拟信号进行传输

### 接收端流程

1. 物理层解码传输的数据，并将数据传输至数据链路层
2. 数据链路层进行数据包正确性检查，如无错误则传输至事务层
3. 事务层将数据包缓存，然后由PCI Express Core Logic Interface转换为设备核或软件能处理的数据

### TLP包的组装

TLP(Transaction Layer Packet)包在传输过程中会经历组装和拆解：

1. 数据从软件层或设备核传来后，事务层(TL)添加ECRC
2. 数据链路层(DLL)在前段添加序列号，在后面添加DLL层的CRC

参考资料：[使用Xilinx IP核进行PCIE开发学习笔记（一）简介篇](https://zhuanlan.zhihu.com/p/32786076)

## PCIe的接口形态

PCIe接口有多种物理形态，适用于不同场景：

* PCIe Add-in-Card(AIC)：标准PCIe扩展卡
* PCIe M.2：用于笔记本电脑和小型设备的紧凑型接口
* OAM等异形插槽：特定用途的非标准PCIe接口

参考资料：[PCIe的接口形态](https://zhuanlan.zhihu.com/p/368372274)

## 与TCP/IP的区别

PCIe和TCP/IP是两种不同层次的通信技术：

在远程连接方面，嵌入式数据库当前使用的是TCP/IP协议栈，使用标准ODBC、JDBC或自定义的C++接口进行远程交互连接。

数据库C/S架构通信使用TCP/IP协议栈，依赖于以太网，传输以太网数据。服务端和客户端的通信使用的是TCP协议，提供IP环境下的数据可靠传输，为端到端的可靠数据传输。其中，TCP/IP协议与低层的数据链路层和物理层无关，依赖的硬件设施可以是双绞线、同轴电缆、光纤，如果有相应的驱动程序负载到MCU，也可通过USB进行通信传输，故此，对传输介质有一定的约束。TCP/IP协议为传输层协议，其分布与依赖关系如图所示：

![OSI参考模型和TCP/IP分层模型](/image/OSIandTCPIP.png)
 
数据库程序架构中，通信协议使用socket通信技术，并且对其进行更为有效的专项定制封装，便于系统接口适配国产操作系统以及类Unix操作系统。同时，该架构也为更换通信协议提供了便利性。如果后续使用其他端到端的数据传递通信协议，只需要对数据库程序架构中封装的协议接口进行替换即可。

数据库远程访问服务所支持的ODBC、JDBC、pyOdbc符合标准的开放式互联协议。其底层使用的通信协议与自定义的C++接口一致，皆为TCP/IP协议。