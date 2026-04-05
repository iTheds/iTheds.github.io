---
layout: post
title: "VS C++ 开发使用笔记"
subtitle: "VS C++开发使用笔记"
date: 2021-1-2
author: Lonnie iTheds
header-img: "img/hexo.jpg"
cdn: 'header-on'
categories:
  - tools
tags:
description: "VS C++ 开发使用笔记"
---

<link rel="stylesheet" type="text/css" href="../../auto-number-title.css" />

# VS C++开发使用笔记

## 编码问题

高级选项保存

## 创建空项目

一定要有使用C++的桌面开发组件。
空项目是指未有任何文件与配置的空项目文件。

我们知道，一般的C++程序运行，都是经过.cpp文件，编译，运行。

## 创建基本的C++项目

创建控制台项目。或者创建空项目

## 在现有项目中创建子项目

选定解决方案 -->  添加 --> 新建项目

## 编译库 生成lib文件

## 提供运行环境

MSVC是编译器，和gcc一样。
SDK是开发者工具包。

Redistributable库，。Visual C++ Redistributable Package 安装运行使用 Visual Studio 2015 生成的 C++ 应用程序所需的运行时组件。

https://www.microsoft.com/zh-cn/download/details.aspx?id=53840

# VScode Debuge

暂时没有系统性文章收纳该内容。
记录一下使用 VScode Debug 的三种方式 Expression\Hit Count\Log message。
目前只使用在了 C++ 上。

首先最基本的，在 VScode 中开启调试模式，配置完成文件 `.vscode/launch.json` 之后。形如：
```json
{
    // Use IntelliSense to learn about possible attributes.
    // Hover to view descriptions of existing attributes.
    // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            // "type": "lldb",
            "type": "cppdbg",
            "request": "launch",
            "name": "Debug",
            "program": "${workspaceFolder}/build/build/bin/taosd",
            // "args": ["-c" ,"${workspaceFolder}/build/build/bin/taos.cfg"],
            "cwd": "${workspaceFolder}",
        }
    ]
}
```

在代码中打入断点，可以右键 `add conditional breakpoint` 新建条件断点或者`edit breakpoint`编辑现有断点。

## Expression

该方法可以键入表达式，使用当前可 watch 的变量进行自由组成，是自由度最高的表达式，当该表达式为真时，触发该断点。
形如：
```C++
fp != mndProcessHeartBeatReq
```

## Hit Count

该方式将对该断点产生一个计数，每次经过该处则 count + 1，当计数 count 满足键入的条件时，则触发。
形如：
```C++
10 // 每 10 次触发一次断点
> 10 // 10次之后每次都会触发
```

## Log message

日志记录。可以通过表达式，输出调试信息到 `Debug Console`。
表达式使用`{val}`格式，其中 val 为可被 watch 的变量。
形如:
```C++
FItem:-tWWorker-{qinfo.fp}
```

该日志设定后，将不会在此处进行断点。

# 其他 Debug 方式

还有一个插件 `Debug Visualizer`， 似乎可以监视变量的变化，甚至通过自定义编程达到更高级的 Debuge 方式。甚至是将链表具象化体现出来。



# EOF

