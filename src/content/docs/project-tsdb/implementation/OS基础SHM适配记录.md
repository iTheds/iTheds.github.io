---
title: "OS基础SHM适配记录"
description: "os_base 共享内存设计与跨平台适配记录"
---

# OS Base SHM Adaptation Notes

## 背景

原始开发首先落在 `os_base` 层的 SHM（共享内存）能力，目标是形成可复用的跨平台抽象接口。

## 关键接口

- `ftok`
- `shmget`
- `shmat`
- `shmdt`
- `shmctl`

## 适配边界

- Unix 与 Windows 的共享内存机制不同，不能直接按同一系统调用模型处理。
- Unix 侧讨论基于 `libc`/`nix` 的路径。
- Windows 侧对应 `CreateFileMapping/MapViewOfFile` 语义。

## 设计结论

1. 统一对外接口，平台细节下沉到适配层。
2. 不强依赖 C++ 现有实现，优先 Rust 本地实现与封装。
3. 先保证可用与可测，再逐步完善错误归一与代码复用。

## 阶段产出（原日志）

- `base_sleep` 与 `base_shm` 完成初步开发与测试。
- 对依赖库（`nix`/`winapi` 等）做过边界评估与替代讨论。
