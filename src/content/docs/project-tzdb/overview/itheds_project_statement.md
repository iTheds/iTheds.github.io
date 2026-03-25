---
title: "iTheds Project Statement"
description: "iTheds 在 TZDB 项目中的职责范围与工程价值说明"
---

# iTheds Project Statement

在 TZDB 项目中，iTheds 主要负责远程访问能力、实时数据分发链路和 ODBC 驱动体系建设，目标是把内核能力稳定输出到外部系统。

核心职责包括：

- 设计与维护 `raserver` 请求处理主链路
- 推进 `NetPool` / `ProtocolFormat` / `IOMode` 的可复用演进
- 参与 `RecGH` 的发布订阅处理链路建设
- 推进 `tzdb-odbc*` 的接口、诊断与安装交付能力

工程价值体现在：

- 打通“网络接入 -> 协议处理 -> SQL 执行 -> 结果返回 -> 外部接入”闭环
- 降低应用接入成本，提升问题定位效率
- 增强系统在跨平台和多协议场景下的稳定性
