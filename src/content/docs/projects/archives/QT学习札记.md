---
title: "QT学习札记"
description: "QT学习札记"
---

# QT学习札记

## 环境部署

### Linux 布置 QT 环境

首先找到安装包，进行安装。

[下载地址](https://download.qt.io/official_releases/qt/5.12/5.12.0/)

QT 环境分为 MinGW 和 MSVC，在选择安装组件时都可以选择安装。
之后配置编译环境，其中 MSVC 并未使用成功，所以改成使用 MinGW。
选择安装 5.12 64bit。 

目前无法使用 64 位的 MSVC. 在编译的时候出现 qmake 崩溃. 每个版本的 qmake 是存在的。
分析原因:
1. qmake 调用的库不同。调用的环境不正确。 
2. pro 内部书写不正确。
3. 执行命令 [正在启动 "D:\Qt\Qt5.12.12\5.12.12\msvc2017_64\bin\qmake.exe" F:\project\QT\ODBC_TEST\ODBC_TEST.pro -spec win32-msvc "CONFIG+=debug" "CONFIG+=qml_debug"] 中使用的仍旧是 win32 位。

解决方法：
之前在使用 5.12.0 的时候并没有提示任何错误信息，只知道 qmake 崩溃。
使用 5.12.12 时，显示 retrieve MSVC 相关失败， 似乎是缺少 System32/cmd.exe 。
我的电脑之前由于未知原因造成没有，于是将 SYSWO64 下的 cmd.exe 复制。于是成功编译。

### Fedora and other linux platforms install


## 问题收录

1. a.exec() 调用后才能显示界面
    事件循环开始。
2. 信号与槽的调用报错：
    Signal and slot arguments are not compatible.
    QObject::connect(DelStuBtn,&QPushButton::clicked ,ais_lab, &QLabel::setText);
3. MSVC 无法使用的问题。
    安装 5.12 64bit

## 关键技术

### 信号与槽

### 改变控件的数据

## 系统学习

### 程序布局

### 控件

### 信号与槽

主要是将一个控件和相关操作(动作)进行关联。

## 生成在任意环境中运行的包

windeployqt Gobang.exe

## 调试

单步调试。