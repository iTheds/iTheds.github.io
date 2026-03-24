---
title: "TIDB Reader"
date: "2025-2-17"
author: "Lonnie iTheds"
tags:
  - 数据库
categories:
  - 数据库
draft: true
section: "drafts"
sourcePath: "markdown/_drafts/TiDBReader.md"
slug: "_drafts/TiDBReader"
---

# TiDB

## 项目结构

| 目录                    | 作用说明                                                       |
| ----------------------- | -------------------------------------------------------------- |
| **`br/`**               | 提供备份与恢复（Backup & Restore）功能。                       |
| -- `cmd/`               | `br` 工具的命令行实现。                                        |
| -- `compatibility/`     | 提供与旧版 TiDB 兼容的功能。                                   |
| -- `docker/`            | 提供与 Docker 相关的配置文件，方便容器化使用。                 |
| -- `docs/`              | 相关文档，介绍如何使用 `br`。                                  |
| -- `images/`            | Docker 镜像相关文件。                                          |
| -- `metrics/`           | 备份与恢复的性能指标。                                         |
| **`pkg/`**              | TiDB 项目的核心库，包含很多与 TiDB 运行相关的核心组件。        |
| -- `autoid_service/`    | 自动ID生成服务。                                               |
| -- `bindinfo/`          | 绑定信息相关功能。                                             |
| -- `config/`            | 配置管理相关功能。                                             |
| -- `ddl/`               | 数据定义语言（DDL）相关功能。                                  |
| -- `distsql/`           | 分布式 SQL 执行相关功能。                                      |
| -- `executor/`          | SQL 执行器相关功能。                                           |
| -- `kv/`                | 键值存储相关功能。                                             |
| -- `planner/`           | 查询优化器相关功能。                                           |
| -- `store/`             | 存储引擎相关功能。                                             |
| -- `session/`           | 会话管理相关功能。                                             |
| -- `testkit/`           | 测试工具集。                                                   |
| -- `privilege/`         | 权限管理相关功能。                                             |
| -- `metrics/`           | 性能指标相关功能。                                             |
| **`build/`**            | 包含构建相关的文件和脚本，处理 TiDB 的构建过程。               |
| -- `image/`             | 与构建镜像相关的内容，可能包括 Dockerfile 等。                 |
| -- `linter/`            | 用于静态代码分析，检查代码风格和潜在错误的工具。               |
| -- `patches/`           | 存放构建过程中使用的补丁文件。                                 |
| **`cmd/`**              | 各种 TiDB 命令行工具的实现。                                   |
| -- `benchdb/`           | 用于数据库基准测试的工具。                                     |
| -- `benchkv/`           | 用于键值存储基准测试的工具。                                   |
| -- `benchraw/`          | 用于原始性能测试的工具。                                       |
| -- `ddltest/`           | 用于测试 DDL 功能的工具。                                      |
| -- `importer/`          | 用于数据导入的工具。                                           |
| -- `mirror/`            | 数据同步相关工具。                                             |
| -- `pluginpkg/`         | 插件包管理工具。                                               |
| -- `tidb--server/`      | TiDB 主服务的启动入口。                                        |
| **`docs/`**             | 存放 TiDB 的设计文档、使用手册等。                             |
| -- `design/`            | 存放 TiDB 的设计文档，介绍系统架构、重要的设计决策等。         |
| **`dumpling/`**         | TiDB 数据导出工具。                                            |
| -- `cli/`               | Dumpling 的命令行接口。                                        |
| -- `cmd/`               | Dumpling 工具的命令实现。                                      |
| -- `context/`           | Dumpling 中的上下文管理。                                      |
| -- `export/`            | 数据导出相关功能。                                             |
| -- `log/`               | 处理日志功能。                                                 |
| -- `tests/`             | 与数据导出相关的测试代码。                                     |
| **`lightning/`**        | TiDB 的数据导入工具，专门用于将大量数据从外部系统导入到 TiDB。 |
| -- `cmd/`               | TiDB Lightning 的命令行实现。                                  |
| -- `pkg/`               | Lightning 的核心实现逻辑。                                     |
| -- `tests/`             | 与数据导入相关的测试代码。                                     |
| -- `web/`               | Web UI 相关功能。                                              |
| **`tests/`**            | 存放 TiDB 的各类测试用例。                                     |
| -- `cncheckcert/`       | 集群证书检查测试。                                             |
| -- `globalkilltest/`    | 测试集群全局 kill 功能。                                       |
| -- `graceshutdown/`     | 测试优雅关闭功能。                                             |
| -- `integrationtest/`   | 集成测试代码。                                                 |
| -- `readonlytest/`      | 测试只读功能。                                                 |
| -- `realtikvtest/`      | 与 TiKV 交互的测试。                                           |
| **`tools/`**            | TiDB 中的一些工具集，可能用于开发、调试和维护 TiDB。           |
| -- `check/`             | 用于检查 TiDB 系统的健康状态。                                 |
| -- `dashboard--linter/` | 检查 TiDB 仪表盘相关的配置。                                   |
| -- `fake--oauth/`       | 用于模拟 OAuth 测试的工具。                                    |
| -- `gen--parquet/`      | 用于生成 Parquet 格式的数据。                                  |
| -- `patch--go/`         | 处理 Go 语言相关的补丁。                                       |
| -- `tazel/`             | 用于运行测试套件的工具。                                       |
