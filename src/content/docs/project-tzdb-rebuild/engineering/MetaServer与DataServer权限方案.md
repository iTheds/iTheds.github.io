---
title: "权限表开发，meta server 与 data server"
description: "TZDB重构技术日志拆分稿，日期：2025-09-02"
---

## 时间锚点

- 日期：2025-09-02

权限和 data server 联系:
最好是，master 开启的时候能够有一个权限的注册。直接一步到位。
实际上，权限表压根没有必要称为系统表。

