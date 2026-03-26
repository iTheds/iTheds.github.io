---
title: "工作者QsetWorkerpool执行模型"
description: "worker、qset、workerpool 的消息处理与并发模型设计"
---

# Worker Qset Workerpool Execution Model

## 核心执行链

原文将执行模型归纳为三类函数：

1. 消息流转函数（如 `vmworker.rs` 中节点消息入口）
2. worker 调度处理函数（批次请求处理）
3. 主执行函数（最终业务处理）

该模型对应“接入 -> 路由 -> 执行”的分层闭环。

## 关键结构关系

- `QworkerPool` 管理 `qset + worker`
- `worker` 持有线程上下文并消费队列
- `qset` 管理多个 queue 及其生命周期

## 主要设计冲突（来自原记录）

1. 锁粒度：类整体锁 vs 字段/局部锁
2. 阻塞机制：信号量 vs channel vs select
3. 关闭语义：如何优雅结束 `recv` 阻塞
4. 多生产者/多消费者扩展：`recv` 不可 clone 带来的约束
5. Rust 所有权模型与 C++ 设计习惯冲突

## 提炼后的约束

- 共享数据与可变数据分离，避免“全对象粗粒度锁”。
- `queue` 结构变更应由统一管理者（如 `qset`）执行。
- 明确关闭协议（如发送终止消息/统一回收 send 端）。
- 同时监听多 queue 需要多路复用机制（如 `select`）。
