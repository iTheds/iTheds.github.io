---
title: "IO Multiplexing And UDP Protocol Refactor"
description: "select 适配、连接复用与 UDP 分包重传改造"
---

# IO Multiplexing And UDP Protocol Refactor

## IO 模型路线

目标是实现连接复用与多路处理，记录中明确了 select 的平台支持范围：

- WIN32: select 支持，epoll 不支持
- LINUX_x86: select/epoll 均支持
- ACORE_OS: select 支持，epoll 不支持

结论：优先基于 select 打通跨平台路径。

## 节点通信改造点

- 在节点层维护已建立连接
- 将消息对象与发送句柄解耦
- 全量验证 IO 模型与连接复用链路

## UDP 改造问题与结论

问题：

- 固定读取长度导致大包帧尾丢失
- qbuffer 长度不足导致大包发送失败

改造方向：

1. UDP 分包
2. CONNECT 调试增强（`get_error`）
3. debug 日志整理
4. UDP 重传机制
