---
title: "网络使用的公用接口 API"
description: "网络使用的公用接口 API"
---

﻿---
layout: post
title: ""
subtitle: ""
date: 2024-12-23
author: Lonnie iTheds
header-img: "img/hexo.jpg"
cdn: 'header-on'
tags:
    - net
---

<link rel="stylesheet" type="text/css" href="../auto-number-title.css" />

# 网络使用的公用接口 API

数据库依赖的网络通信接口，其使用的为基础 socket 接口，以及部分网络功能支持依赖。

其包含两个项目：
1. socket 接口支持；
2. 多路复用支持；

> tips: 目前版本中，多路复用为建议支持项，后续可能采用通信接口中 UDP 模式进行实现。

---

## socket 接口支持

以下接口为标准接口，需支持 SOCK_DGRAM 和 SOCK_STREAM，IPv4(AF_INET) 即可。

### 接口支持详情

| 接口/功能        | 描述                                                                | 使用实例                                                                                     | 需求支持 | <input >接口(其他)通信接口功能对标(⬜/✅) |
| ---------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------- | ----------------------------------------- |
| `socket`         | 创建套接字，支持 SOCK_DGRAM 和 SOCK_STREAM                          | `int sock = socket(AF_INET, SOCK_STREAM, 0);`                                                | 强       | <input type="checkbox">                   |
| `bind`           | 绑定地址和端口                                                      | `bind(sock, (struct sockaddr *)&addr, sizeof(addr));`                                        | 强       | <input type="checkbox">                   |
| `accept`         | 接受连接请求                                                        | `int client_fd = accept(server_fd, (struct sockaddr *)&client_addr, &addr_len);`             | 强       | <input type="checkbox">                   |
| `connect`        | 发起连接请求                                                        | `connect(sock, (struct sockaddr *)&server_addr, sizeof(server_addr));`                       | 强       | <input type="checkbox">                   |
| `listen`         | 监听连接                                                            | `listen(sock, backlog);`                                                                     | 强       | <input type="checkbox">                   |
| `recv`           | 接收数据                                                            | `recv(sock, buffer, sizeof(buffer), 0);`                                                     | 强       | <input type="checkbox">                   |
| `recvfrom`       | 接收数据（指定来源地址）                                            | `recvfrom(sock, buffer, sizeof(buffer), 0, (struct sockaddr *)&src_addr, &addr_len);`        | 强       | <input type="checkbox">                   |
| `send`           | 发送数据                                                            | `send(sock, buffer, sizeof(buffer), 0);`                                                     | 强       | <input type="checkbox">                   |
| `sendto`         | 发送数据（指定目标地址）                                            | `sendto(sock, buffer, sizeof(buffer), 0, (struct sockaddr *)&dest_addr, sizeof(dest_addr));` | 强       | <input type="checkbox">                   |
| `close`          | 关闭套接字                                                          | `close(sock);`                                                                               | 强       | <input type="checkbox">                   |
| `shutdown`       | 部分关闭连接                                                        | `shutdown(sock, SHUT_RDWR);`                                                                 | 弱       | <input type="checkbox">                   |
| `setsockopt`     | 设置套接字选项，例如：SO_REUSEADDR 允许快速重新绑定地址和端口       | `setsockopt(sock, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));`                             | 中       | <input type="checkbox">                   |
| `getpeername`    | 获取连接的对端地址和端口                                            | `getpeername(sock, (struct sockaddr *)&peer_addr, &addr_len);`                               | 弱       | <input type="checkbox">                   |
| `getsockname`    | 获取本地地址和端口                                                  | `getsockname(sock, (struct sockaddr *)&local_addr, &addr_len);`                              | 弱       | <input type="checkbox">                   |
| `inet_ntop` 系列 | 地址转换支持：`inet_pton`、`inet_ntop`、`inet_ntoa`、`inet_aton` 等 | `inet_pton(AF_INET, "127.0.0.1", &addr.sin_addr);`                                           | 弱       | <input type="checkbox">                   |
| `fcntl`          | 文件描述符控制，支持阻塞/非阻塞设置                                 | `fcntl(sock, F_SETFL, O_NONBLOCK);`                                                          | 强       | <input type="checkbox">                   |

---

### 错误处理支持

| 错误处理接口           | 描述                          | 使用实例                                       | 需求支持 | 功能对标            |
| ---------------------- | ----------------------------- | ---------------------------------------------- | -------- | ----------------------- |
| `errno`                | 错误码支持                    | `if (socket < 0) { perror("socket error"); }`  | 弱       | <input type="checkbox"> |
| `getifaddrs`           | 获取网络接口地址（UNIX）      | `getifaddrs(&ifaddr);`                         | 弱       | <input type="checkbox"> |
| `GetAdaptersAddresses` | 获取网络适配器地址（WINDOWS） | `GetAdaptersAddresses(AF_INET, 0, NULL, ...);` | 弱       | <input type="checkbox"> |
| `freeifaddrs`          | 释放网络接口地址（UNIX）      | `freeifaddrs(ifaddr);`                         | 弱       | <input type="checkbox"> |

---

## 多路复用支持

多路复用支持包括 `epoll` 和 `select`，以满足不同平台的需求。
只需要选择其中一个支持即可，其需求支持为中等。

### select 支持

#### POSIX 平台(UNIX/天脉)

| 接口/功能  | 描述                                 | 使用实例                                               | 需求支持 | 功能对标            |
| ---------- | ------------------------------------ | ------------------------------------------------------ | -------- | ----------------------- |
| `fd_set`   | 文件描述符集合操作                   | `FD_SET(fd, &set);`                                    | 中       | <input type="checkbox"> |
| `select`   | 等待文件描述符上的事件               | `select(max_fd + 1, &read_set, NULL, NULL, &timeout);` | 中       | <input type="checkbox"> |
| `FD_ZERO`  | 清空文件描述符集合                   | `FD_ZERO(&set);`                                       | 中       | <input type="checkbox"> |
| `FD_SET`   | 向文件描述符集合中添加描述符         | `FD_SET(fd, &set);`                                    | 中       | <input type="checkbox"> |
| `FD_ISSET` | 检查文件描述符集合中是否包含某描述符 | `if (FD_ISSET(fd, &set)) { ... }`                      | 中       | <input type="checkbox"> |

#### WINDOWS 平台

| 接口/功能                  | 描述             | 使用实例                                       |
| -------------------------- | ---------------- | ---------------------------------------------- |
| `WSAEVENT`                 | 定义事件对象     | `WSAEVENT hEvent = WSACreateEvent();`          |
| `WSAEventSelect`           | 配置事件通知机制 | `WSAEventSelect(sock, hEvent, FD_READ);`       |
| `WSAWaitForMultipleEvents` | 等待多个事件发生 | `WSAWaitForMultipleEvents(1, &hEvent, ...);`   |
| `WSAEnumNetworkEvents`     | 枚举网络事件     | `WSAEnumNetworkEvents(sock, hEvent, &events);` |

---
### epoll 支持 (Linux)

| 接口/功能       | 描述                          | 使用实例                                         |
| --------------- | ----------------------------- | ------------------------------------------------ |
| `epoll_create1` | 创建 epoll 实例               | `int epfd = epoll_create1(0);`                   |
| `epoll_ctl`     | 控制 epoll 实例中的文件描述符 | `epoll_ctl(epfd, EPOLL_CTL_ADD, fd, &event);`    |
| `epoll_wait`    | 等待事件发生                  | `epoll_wait(epfd, events, max_events, timeout);` |


以上为网络支持的详细接口整理。所有接口均为标准接口，需根据具体操作系统实现对应支持。