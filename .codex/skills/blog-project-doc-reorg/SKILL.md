---
name: blog-project-doc-reorg
description: 规范化整理 blog 项目文档目录（保留原稿、英文目录、分类归档、链接修复）
version: 1.0.0
owner: iTheds
---

# blog-project-doc-reorg

用于整理 `src/content/docs/project-*` 目录。目标是提升可读性和一致性，同时严格保留历史内容。

## 必须遵守的规则

1. 允许拆分、重命名、重分类，但不允许丢失旧内容。
2. 每个项目的原始文件统一放在 `src/content/docs/project-xxx/raw_snapshot/`，该目录只读，禁止修改其中文件内容。
3. 目录命名尽量使用英文。
4. `itheds contribution` 统一命名为 `itheds_contribution.md`。
5. 一级结构统一为：
   - `overview`
   - `architecture`
   - `implementation`
   - `engineering`
6. 除 `raw_snapshot` 外，不保留 `backup/issues/worklogs/test_reports` 等存档型目录，统一整理到上述四类技术文档目录。
7. 新增文件命名统一使用英文小写下划线风格（如 `cluster_metadata_design.md`）。
8. `raw_snapshot` 下可读文本（如 `.md`）要按内容整理到 `overview/architecture/implementation/engineering`（源文件保留不改）。
9. 无法直接归类为技术文档的材料，必须提炼为“技术结论/工程经验/问题复盘”后再落位。
10. 所有重组后入口链接必须可达（更新各级 `index.md` / `index.mdx`）。

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

## 执行流程（Checklist）

1. 盘点文件与目录（`rg --files` + `find`）。
2. 确认 `raw_snapshot/` 已存在且不做任何修改。
3. 创建统一英文目录骨架。
4. 迁移并重命名文档到目标分类（在 `raw_snapshot` 外创建整理稿，文件名统一英文）。
5. 对无法直接归类的资料先做技术提炼，再写入对应目录。
6. 修复所有内部相对链接。
7. 补齐各级 `index.md` 导航。
8. 可选保留映射清单（若项目偏好简洁目录可不单独保留）。
9. 最后核对：
   - 无内容丢失
   - 入口可导航
   - 命名一致
   - 无 `backup/issues/worklogs/test_reports` 等冗余目录（`raw_snapshot` 内除外）
   - `raw_snapshot/` 未改动

## 快速核对命令

```bash
find src/content/docs/project-xxx -maxdepth 3 -type d | sort
rg --files src/content/docs/project-xxx | sort
rg -n "\./overview|\./architecture|\./implementation|\./engineering|\./appendix" src/content/docs/project-xxx -g '*.md' -g '*.mdx'
```
