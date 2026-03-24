---
title: "AgilorE修改日志"
date: "2021-7-26"
subtitle: "AgilorE修改日志"
author: "Lonnie iTheds"
tags:
  - work
draft: false
section: "work"
sourcePath: "markdown/work/dailylog/2021/AgilorE修改日志.md"
slug: "work/dailylog/2021/AgilorE修改日志"
---
# AgilorE修改日志

[0726]
1. 添加文件, README.h
3. [AeCI.h]修改aeci_struct_descriptor，使得其在进行置空初始化的同时，支持带有参数的初始化，构造函数如下:
    ```C++
    aeci_struct_descriptor(
        char const* struct_name_ = NULL,
        char const* refTableName_ = NULL,
        aeci_struct_descriptor* structField_ = NULL,
        char const* structArrayTypeName_ = NULL
    )
    {
        struct_name = struct_name_;
        refTableName = refTableName_;
        structField = structField_;
        structArrayTypeName = structArrayTypeName_;
    }
    ```
4. [AeCI.h]修改 aeci_field_descriptor ，使得其在进行置空初始化的同时，支持带有参数的初始化，构造函数如下:
    ```C++
    aeci_field_descriptor(AeCIVarType  type_ = aeci_exunknown, int flags_ = NULL,
        char const* name_ = NULL,
        char const* refTableName_ = NULL,
        char const* inverseRefFieldName_ = NULL, aeci_index_descriptor* indexInfo_ = NULL,
        aeci_struct_descriptor* struct_descriptor_ = NULL, char const* structArrayTypeName_ = NULL)
    {
        type = type_;
        flags = flags_;
        name = name_;
        refTableName = refTableName_;
        inverseRefFieldName = inverseRefFieldName_;
        struct_descriptor = struct_descriptor_;
        indexInfo = indexInfo_;
        structArrayTypeName = structArrayTypeName_;
    }
    ```

