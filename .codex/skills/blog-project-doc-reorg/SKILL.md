---
name: blog-project-doc-reorg
description: 规范化整理 blog 项目文档目录(保留原稿、英文目录、分类归档、链接修复)
version: 1.4.0
owner: iTheds
---

# blog-project-doc-reorg

用于整理 `src/content/docs/project-*` 目录。目标是提升可读性和一致性，同时严格保留历史内容。

## 必须遵守的规则

1. 允许拆分、重命名、重分类，但不允许丢失旧内容。
2. 每个项目的原始文件统一放在 `src/content/docs/project-xxx/raw_snapshot/`，该目录只读，禁止修改其中文件内容。
3. 目录命名尽量使用英文。
4. `itheds contribution` 统一使用中文命名(例如“iTheds 贡献”相关文件)，保持目录内可读性优先。
5. 一级结构统一为:
   - `overview`
   - `architecture`
   - `implementation`
   - `engineering`
6. 除 `raw_snapshot` 外，不保留 `backup/issues/worklogs/test_reports` 等存档型目录，统一整理到上述四类技术文档目录。
7. 新增文件命名统一使用中文(可保留必要缩写如 TSDB/TZDB/RPC/WAL)，尽量直观可读。
8. `raw_snapshot` 下可读文本(如 `.md`)要按内容整理到 `overview/architecture/implementation/engineering`(源文件保留不改)。
9. 无法直接归类为技术文档的材料，必须提炼为“技术结论/工程经验/问题复盘”后再落位。
10. 所有重组后入口链接必须可达(更新各级 `index.md` / `index.mdx`)。
11. 若 `raw_snapshot` 中存在重复内容(如 `issues/`、`worklogs/` 下副本)，只整理一次并在索引层去重。
12. 禁止为了满足索引而创建“占位空文档/文档入口页”；只保留有实际内容的整理稿，并同步删除无效索引项。
13. 对“技术日志类”原稿，优先按“日期 + 技术线”拆分为多份日志文档(例如 `*_log_*_by_date.md`)，而非写成抽象“主题概述”。
14. 技术日志拆分时尽量保留原始描述、代码片段与设计表达，不做过度摘要；可以删除明显非技术段落，但不得篡改技术结论。
15. 若总览日志已被完整拆分且不再承载独立信息，应从索引移除该总览入口，避免重复导航。
16. 除 `raw_snapshot` 外，不保留“按日期连续堆叠的大总日志”文档；应拆分为若干技术记录、问题排查记录、测试记录或工程记录，并删除原总日志。
17. 项目总览目录(`overview`)不放测试流水、出差记录、开发日志等过程性材料；此类内容应落在 `architecture/implementation/engineering` 中的对应文档。

## 推荐目录模板

```txt
project-xxx/
  index.mdx
  raw_snapshot/
  overview/
    index.md
    project_overview.md
    itheds_contribution.md
  architecture/
    index.md
  implementation/
    index.md
  engineering/
    index.md
```

## 执行流程(Checklist)

1. 盘点文件与目录(`rg --files` + `find`)。
2. 确认 `raw_snapshot/` 已存在且不做任何修改。
3. 创建统一英文目录骨架。
4. 迁移并重命名文档到目标分类(在 `raw_snapshot` 外创建整理稿，文件名统一英文)。
5. 对无法直接归类的资料先做技术提炼，再写入对应目录。
6. 修复所有内部相对链接。
7. 补齐各级 `index.md` 导航。
8. 可选保留映射清单(若项目偏好简洁目录可不单独保留)。
9. 最后核对:
   - 无内容丢失
   - 入口可导航
   - 命名一致
   - 无 `backup/issues/worklogs/test_reports` 等冗余目录(`raw_snapshot` 内除外)
   - `raw_snapshot/` 未改动
   - 无重复文档重复入库(同内容只保留一次整理稿)
   - 无“占位型”空文档(如仅写“后续补充/文档入口”)
   - 技术日志文件命名与内容一致(`log` 风格而非“topic 概述”)
   - 日志拆分后仍可按日期追溯关键技术决策

## 快速核对命令

```bash
find src/content/docs/project-xxx -maxdepth 3 -type d | sort
rg --files src/content/docs/project-xxx | sort
rg -n "\./overview|\./architecture|\./implementation|\./engineering|\./appendix" src/content/docs/project-xxx -g '*.md' -g '*.mdx'
```
