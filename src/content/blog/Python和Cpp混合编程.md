---
title: "Python和Cpp混合编程"
date: "2022-8-18"
author: "Lonnie iTheds"
tags:
  - python
categories:
  - 编程
draft: false
section: "posts"
sourcePath: "markdown/_posts/Python和Cpp混合编程.md"
slug: "Python和Cpp混合编程"
---

# Python和Cpp混合编程

python 使用 C++ 库时，需要进行混合编程方可调用 C++ 的库。

## 原理

python 提供库 ctypes ，允许在 python 程序中定义 C++/C 的数据类型，并且以此为参数，传递到 C++ 的动态库对外方法接口中。

优势：
1. 能基本满足覆盖包括：数组、结构体、指针、数据结构的基本类型。

劣势：
1. dll 调试困难；
2. ctypes 上手较为复杂。加大了开发难度。

## Developer Process Reference

1. Design Database, generate mco file.
2. According the mco file generate .c and .h file.
3. Add auxiliary .cpp and design key auxiliary interfaces.
4. Compile and extract SO file.
5. 

## 编译为 so 文件

将需要使用的 C++ 库编译为 so 文件，并且将接口对外开放，使用关键字 extern 进行声明:
```C++
extern "C" {
}
```
或者使用 def 文件进行定义。

## 前序引用库

```python
import ctypes
# or `from ctypes import *

# load os file ,this file include all interfence which recorded in the header file.
ll = ctypes.cdll.LoadLibrary
tzdb = ll("./libLinux_test.so")
```

## 数据结构使用

需要在 python 构造与 C++ 同等结构体/类，作为实参传递。
如果只是指针，可以使用 void 指针。

```python
class Department(ctypes.Structure):
    _fields_ = [
        ('EDB_Hf',ctypes.c_ulonglong*7)
    ]
dep1 = Department()
rc = tzdb.Department_new(t, ctypes.byref(dep1))
```

## 形参为指针

C++ 接口形参为指针，则使用`ctypes.byref`进行输入。

```Python
rc = tzdb.edb_db_connect(db_name, ctypes.byref(db))
assert rc ==0
```

## 数组使用

基本原理为，python 声明数组模板 a_impl ，根据此定义实体变量 ia_value，通过 a 内容获取指针。

```python
ia_value = (ctypes.c_char*16)()
a = ctypes.pointer(ia_value)
```

## char* 和 char[] 的使用

该部分特性比较特殊，因为涉及到 utf-8 的存储，对于 C++ 类型的两种数据类型，可以使用 python 中 bytes 进行实现，并且参数是可取的。

```python
db_name = bytes("refTestDB","utf8")

a = bytes(15)
```

## 问题记录

### 开发困难

如果遇到开发方面难以使用C++ 语法进行支持的部分，可以考虑在 C++ 中编写新的对外接口，供 python 进行调用，以简化 python 开发内容。

