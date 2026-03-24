---
title: "Cmake和bison"
date: "2021-7-08"
subtitle: "命中无两"
author: "Lonnie iTheds"
tags:
  - work
  - cmake
categories:
  - tools
draft: false
section: "posts"
sourcePath: "markdown/_posts/Cmake和bison.md"
slug: "Cmake和bison"
---

# Cmake 和 bison

## cmake

工具化的东西，只需要知道它能做什么就可以了。

自动化链接，包含目录，进行分组，配置宏，执行脚本。

[参考教程](https://www.w3cschool.cn/doc_cmake_3_7/cmake_3_7-command-set.html?lang=en)

### cmake 和 def

linux 下也能使用 def 形如：

    add_library(raserver SHARED  ${TZDB_RAS_DIR_2} ${TZDB_RAS_DIR_1} tzdb-odbc.def)

## Q&A

#### 消除库的互相引用

```cmake
    target_link_libraries(mwkernel PUBLIC rust_lib -Wl,--start-group ${_ODBC} ${_KER} ${_CLU} ${_SQL} -Wl,--end-group parser pthread)
    # target_link_libraries(mwkernel PUBLIC rust_lib ${_ODBC} ${_KER} ${_CLU} ${_SQL} parser pthread)
```
