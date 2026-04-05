---
layout: post
title: "Java JNI 开发"
subtitle: "从原理到实践的ODBC接口封装"
date: 2024-7-30
author: Lonnie iTheds
header-img: "hexo.jpg"
cdn: 'header-on'
categories:
  - 编程
tags:
  - JNI
  - ODBC
  - Java
description: "Java JNI 开发"
---

<link rel="stylesheet" type="text/css" href="../../auto-number-title.css" />

# JAVA JNI开发

## 前言

JNI (Java Native Interface) 是Java平台的一个重要特性，它允许Java代码与其他语言（如C、C++）编写的代码进行交互。本文将详细介绍如何使用JNI封装ODBC接口，实现Java程序对数据库的访问。

## 开发流程概述

完整的开发流程包括以下几个步骤：

1. 编译ODBC接口库：使用多模项目编译出ODBC动态库
2. 设计JNI接口层：创建中间层接口，连接Java与ODBC
3. 实现JNI调用：在Java程序中调用本地方法
4. 测试与调优：确保接口正常工作并优化性能

## JNI使用教程

### 基本流程

使用JNI开发ODBC接口的基本流程如下：

1. 前提条件：拥有ODBC库（如odbc.dll或libodbc.so）
2. 创建JNI包装库：
   - 引入头文件`#include <jni.h>`
   - 按照接口规范（`Java_<全限定类名>_<方法名>`）定义接口
   - 编译生成新的库文件（如odbc-jni.dll或libodbc-jni.so）
3. Java程序中加载本地库并调用方法
4. 部署和测试

### 动态库生成命令

使用GCC编译生成动态库的命令示例：

```shell
# 生成动态库命令
gcc -I"$JDK_HOME/include" -I"$JDK_HOME/include/linux" -shared -o ./lib/lib$FILE_NAME.so -fPIC ./jni/$FILE_NAME.c
```

## JNI接口设计

为了封装ODBC接口，需要设计一系列JNI接口。下表列出了主要接口及其对应的ODBC函数：

| JNI 接口 | 对应的 ODBC 接口 |
| -------- | ---------------- |
| `JNIEXPORT jlong JNICALL Java_tzmdb_odbcjni_Odbc_allocHandle(JNIEnv *, jobject, jlong)` | `SQLAllocHandle` |
| `JNIEXPORT jint JNICALL Java_tzmdb_odbcjni_Odbc_connect(JNIEnv *, jobject, jlong, jstring, jstring, jstring)` | `SQLConnect` |
| `JNIEXPORT jint JNICALL Java_tzmdb_odbcjni_Odbc_describeCol(JNIEnv *, jobject, jlong, jint, jstring, jint)` | `SQLDescribeCol` |
| `JNIEXPORT jint JNICALL Java_tzmdb_odbcjni_Odbc_closeConnection(JNIEnv *, jobject, jlong)` | `SQLDisconnect` |
| `JNIEXPORT jint JNICALL Java_tzmdb_odbcjni_Odbc_query(JNIEnv *, jobject, jlong, jstring)` | `SQLExecDirect` |
| `JNIEXPORT jint JNICALL Java_tzmdb_odbcjni_Odbc_fetch(JNIEnv *, jobject, jlong)` | `SQLFetch` |
| `JNIEXPORT jint JNICALL Java_tzmdb_odbcjni_Odbc_getData(JNIEnv *, jobject, jlong, jint, jint, jobject)` | `SQLGetData` |
| `JNIEXPORT jint JNICALL Java_tzmdb_odbcjni_Odbc_resultCols(JNIEnv *, jobject, jlong)` | `SQLNumResultCols` |
| `JNIEXPORT jint JNICALL Java_tzmdb_odbcjni_Odbc_resultRowCount(JNIEnv *, jobject, jlong)` | `SQLRowCount` |

## 常见问题及解决方案

### 1. 库文件加载错误

#### 问题描述

在运行Java程序时可能会遇到以下错误：

```bash
Exception in thread "main" java.lang.UnsatisfiedLinkError: no tzmdb_odbcjni_Odbc in java.library.path
	at java.lang.ClassLoader.loadLibrary(ClassLoader.java:1860)
	at java.lang.Runtime.loadLibrary0(Runtime.java:843)
	at java.lang.System.loadLibrary(System.java:1136)
	at tzmdb.odbcjni.Odbc.<clinit>(Odbc.java:14)
	at main.java.AppTest.main(AppTest.java:13)
```

#### 解决方法

1. 设置JVM参数指定库文件路径：
   ```bash
   -Djava.library.path=/path/to/your/library
   ```

2. 理解库文件命名规则：
   - 在Linux系统中，`System.loadLibrary("name")`实际寻找的是`libname.so`
   - 在Windows系统中，寻找的是`name.dll`

3. 通过调试ClassLoader源码，可以看到库文件加载的具体流程：

```java
// ClassLoader.java 库文件查找逻辑
for (int i = 0 ; i < sys_paths.length ; i++) {
    File libfile = new File(sys_paths[i], System.mapLibraryName(name));
    if (loadLibrary0(fromClass, libfile)) {
        return;
    }
    libfile = ClassLoaderHelper.mapAlternativeName(libfile);
    if (libfile != null && loadLibrary0(fromClass, libfile)) {
        return;
    }
}
// 查找用户路径
if (loader != null) {
    for (int i = 0 ; i < usr_paths.length ; i++) {
        File libfile = new File(usr_paths[i], System.mapLibraryName(name));
        if (loadLibrary0(fromClass, libfile)) {
            return;
        }
        libfile = ClassLoaderHelper.mapAlternativeName(libfile);
        if (libfile != null && loadLibrary0(fromClass, libfile)) {
            return;
        }
    }
}
// 加载失败
throw new UnsatisfiedLinkError("no " + name + " in java.library.path");
```

### 2. ODBC接口调用问题

#### 问题描述

在开发过程中，发现`SQLGetData`函数始终返回-1（SQL_ERROR），这表明JNI调用的接口可能与预期不符。

#### 分析与解决

通过分析，发现以下可能的原因：

1. JNI与ODBC动态库之间缺少正确的链接关系
2. ODBC驱动管理器使用函数指针数组调用函数，而非直接调用
3. 前序函数可能返回了错误状态，导致后续调用失败

对啊，我既然都用JNI了，为什么不自己设计接口，而要让ODBC驱动管理程序来使用我开发的ODBC接口？

思路转变重新设计接口架构，直接通过JNI调用底层数据库接口，绕过ODBC驱动管理器，从而解决了问题。

## JNI实现示例

以下是`getData`方法的JNI实现示例，展示了如何处理不同数据类型：

```c
JNICALL Java_tzmdb_odbcjni_Odbc_getData(JNIEnv *env, jobject obj, jlong hStmt, jint colNum, jint cType, jobject jData)
{
    SQLLEN indicator;
    SQLRETURN ret;

    // 定义缓冲区大小和类型
    const int bufferSize = 1024;
    SQLCHAR buffer[bufferSize];

    if (cType == SQL_WVARCHAR)
    {
        cType = SQL_C_CHAR;
    }

    // 调用SQLGetData
    ret = SQLGetData((SQLHSTMT)hStmt, (SQLUSMALLINT)colNum, (SQLSMALLINT)cType, buffer, sizeof(buffer), &indicator);

    printf("[%s]:[ret:%d]:[ctype:%d]:[data:%s]\n", __FUNCTION__, ret, cType, buffer);

    if (ret == SQL_SUCCESS || ret == SQL_SUCCESS_WITH_INFO)
    {
        jclass dataClass = env->GetObjectClass(jData);
        jmethodID setMethod;
        jmethodID appendMethod;

        // 根据不同数据类型处理结果
        switch (cType)
        {
        case SQL_CHAR:
        case SQL_VARCHAR:
            // 处理字符串类型
            setMethod = env->GetMethodID(dataClass, "setLength", "(I)V");
            appendMethod = env->GetMethodID(dataClass, "append", "(Ljava/lang/String;)Ljava/lang/StringBuilder;");
            if (setMethod && appendMethod)
            {
                env->CallVoidMethod(jData, setMethod, 0); // 清空现有内容
                jstring jStr = env->NewStringUTF((char *)buffer);
                env->CallObjectMethod(jData, appendMethod, jStr);
                env->DeleteLocalRef(jStr);
            }
            break;
            
        // 其他数据类型处理...（代码已省略）
        
        default:
            // 处理未知类型或错误
            return SQL_ERROR;
        }
    }

    return (jint)ret;
}
```

## 开发日志

### 2024-08-20

ODBC开发过程中，对Java的JDBC进行测试时发现SQLGetData一直返回-1。分析表明JNI调用的SQLGetData可能并非ODBC提供的接口。

推论：JNI和TZODBC动态库之间没有正确的链接关系。ODBC测试程序调用库时连接不上，而JNI可以连接但无法使用SQLGetData。

### 2024-08-29

发现ODBC内部使用函数指针方式访问函数，因此ODBC函数实现中不应直接调用ODBC函数，而应另起名称。

最终决定：既然已经使用JNI，为何不直接设计自己的接口，而非通过ODBC驱动管理程序？这一思路转变为后续开发指明了方向。

## 配置示例

### ODBC配置示例

```ini
[TZMDB ODBC 1.0 ANSI Driver]
Driver=/usr/lib/tzmodbc/libtzmdb-odbc.so
SETUP=
UsageCount=1

[tzmdb_test_1]
Description  = tzmdb
Driver = TZMDB ODBC 1.0 ANSI Driver
Server = 127.0.0.1
Port = 7030
CHARSET  = UTF8
```

## 结语

通过JNI技术，成功地将ODBC接口封装为Java可用的形式。虽然过程中遇到了一些挑战，但通过深入理解JNI和ODBC的工作原理，最终找到了合适的解决方案。这种封装方式为Java应用程序提供了高效访问数据库的能力，同时保持了底层接口的灵活性。
```
