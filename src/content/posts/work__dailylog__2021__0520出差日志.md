---
title: "0520work_data"
date: "2021-5-20"
subtitle: "0520work_data"
author: "Lonnie iTheds"
tags:
  - work
draft: false
section: "work"
sourcePath: "markdown/work/dailylog/2021/0520出差日志.md"
slug: "work/dailylog/2021/0520出差日志"
---
# 0520出差日志

## 每日日志

20周四：
1. 到达三亚，下午使用笔记本初测
21周五：
1. 测试，并且收集数据。讨论后续需要的测试点。
2. 服务器装入机柜。开始运行并收集数据。
22周六：
1. 收集数据完毕。
2. 晚上7点飞机。飞机延误。改签电话打不通，退票重订次日晚6点。
23周日：
1. 飞机延误至晚8点，起飞，次日1点迫降到太原，安排住宿，2:30到。
2. 次日，订高铁8点到11点，到北京西。12点到达。

## 数据 Recording

本机IP : 192.168.1.154
接受数据 : 1.254 
vlw和vbw数据在同一端口，转发，但只保存vlw。

GPS : 4001
AIS : 4005
HDT : 4006

VLW : 4003

UDP目前不测

## Recording

数据过滤。
串口动态。
服务器防火设置

sendto 在5分钟左右 ，间歇性返回0.

gps数据也存在多种数据，需要过滤，考虑返回值问题解决，data->table不在接受指针。

## 测试

传输
压力测试。
