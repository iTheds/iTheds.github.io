---
title: "Linux命令总集与系统"
date: "2021-2-3"
subtitle: "Linux系统管理常用命令速查手册"
author: "Lonnie iTheds"
tags:
  - linux
categories:
  - 服务器
draft: false
section: "posts"
sourcePath: "markdown/_posts/Linux命令总集与系统.md"
slug: "Linux命令总集与系统"
---

# Linux命令总集与系统

## 基础工具安装

下载工具wget，后台下载使用wget -b + url，可以在当前目录wget-log文件查看进度。
```bash
yum install -y wget
```

安装可以上传rz和从vps上下载东西sz的命令：
```bash
yum install -y lrzsz
```

## 系统信息查看

查看版本信息：
```bash
cat /proc/version
cat /etc/redhat-release
uname -a
lsb_release -a
```

## 文件操作

### 文件查看与编辑
```bash
cat /path/to/file    # 查看文件内容
```

### 文件查找
```bash
locate filename      # 快速查找文件
```
有时候出现问题：`locate: can not stat () `/var/lib/mlocate/mlocate.db`: No such file or directory`，执行：
```bash
yum install mlocate
```

### 目录结构查看
```bash
tree                 # 以树形结构显示目录
```

## 服务管理

### 传统方式
```bash
service httpd restart
```

### systemd方式
```bash
systemctl start httpd.service     # 启动服务
systemctl enable httpd.service    # 设置开机启动
systemctl status httpd.service    # 查看服务状态
systemctl status mysqld           # 查看MySQL服务状态
```

## 进程管理

### 进程查看与终止
```bash
ps aux | grep process_name        # 查找特定进程
```

### kill命令
```bash
kill [-s <信息名称或编号>][进程ID]  # 或 kill [-l <信息编号>]
```
常用信号：
- 1 (HUP)：重新加载进程
- 9 (KILL)：强制杀死进程
- 15 (TERM)：正常停止进程

## 包管理

### RPM包管理

```bash
rpm -q package_name              # 查询一个包是否被安装
rpm -qa                          # 列出所有已安装的rpm包
rpm -ivh package.rpm             # 安装软件包
rpm -Uvh package.rpm             # 升级软件包
rpm -e package_name              # 卸载软件包
rpm -qpi package.rpm             # 查询软件包的详细信息
rpm -qf /path/to/file            # 查询某个文件属于哪个rpm包
rpm -qpl package.rpm             # 查询软件包会向系统写入哪些文件
rpm -qa | grep name              # 查看某个包是否被安装
```

常用参数说明：
- q = query（查询）
- p = package（包）
- i = info（信息）
- l = list（列表）
- f = file（文件）
- c = conf（配置）

### YUM包管理

```bash
yum install package_name         # 安装软件包
yum search keyword               # 使用YUM查找软件包
yum list                         # 列出所有可安装的软件包
yum list updates                 # 列出所有可更新的软件包
yum list installed               # 列出所有已安装的软件包
yum list extras                  # 列出所有已安装但不在Yum Repository内的软件包
yum info package_name            # 使用YUM获取软件包信息
yum info updates                 # 列出所有可更新的软件包信息
yum info installed               # 列出所有已安装的软件包信息
yum info extras                  # 列出所有已安装但不在Yum Repository内的软件包信息
yum provides file_name           # 列出软件包提供哪些文件
yum repolist enabled | grep mysql # 查看启用的MySQL相关仓库
```

### DNF包管理

[DNF](https://blog.csdn.net/u010105234/article/details/50481461/)是新一代的RPM软件包管理器。它首先出现在Fedora 18这个发行版中，而后来取代了YUM，正式成为Fedora 22的包管理器。

```bash
dnf -y install dnf-utils          # 安装DNF工具集
```

启用PHP 7.4的Remi模块并进行安装：
```bash
dnf module enable php:7.4
dnf install php
```

## 网络管理

### 端口与进程查看
```bash
ss -tnlp | grep ":22"            # 查看22端口的监听情况
netstat -ano | grep 3060          # 查看3060端口的连接情况
```

## 文件系统

### 文件统计
```bash
ls -lR | grep "^-" | wc -l        # 统计当前目录及子目录下的文件数量
```