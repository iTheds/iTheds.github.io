---
title: "Nodejs学习笔记"
date: "2021-2-6"
subtitle: "Nodejs学习笔记"
author: "Lonnie iTheds"
tags:
  - hexo
  - git
categories:
  - 服务器
draft: true
section: "backup"
sourcePath: "markdown/_backup/Nodejs学习笔记.md"
slug: "_backup/Nodejs学习笔记"
---

# Nodejs学习笔记

首先要知道两个环境apache和nodejs两者的关系。
Node.js 是一个开源与跨平台的 JavaScript 运行时环境。
npm 的简单结构有助于 Node.js 生态系统的激增，现在 npm 仓库托管了超过 1,000,000 个可以自由使用的开源库包。
Apache支持的时HTTP，nodejs支持的是JavaScript。所以两个环境都可以安装。

    dnf module list nodejs
    dnf module install nodejs:<stream>
    dnf module install nodejs:14

## 命令

NPM是随同NodeJS一起安装的包管理工具

$ npm -v

升级

npm install npm -g

查看已安装的模块

    npm  ls

## 映射