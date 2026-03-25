---
title: "TLSF"
description: "TLSF"
---

<link rel="stylesheet" type="text/css" href="../auto-number-title.css" />

# TLSF

## 使用方法

注意其 cmakelists 中提到了两个关键宏：

```cmake
target_compile_definitions(tlsf PUBLIC USE_SBRK=0)
target_compile_definitions(tlsf PUBLIC USE_MMAP=0)
```

在TLSF (Two-Level Segregated Fit)内存分配器中，`USE_MMAP`和`USE_SBRK`是两个预处理宏，用于控制TLSF获取系统内存的方式。这两个宏定义了TLSF在不同操作系统环境下获取内存池的底层机制。

### 影响范围

默认不开启该两个接口时：
1. 即使 `add_new_area` 多次， 那么这些内存也是碎片化的，无法分配一个需要多个类似空间的内存；
2. `tlsf_` 接口需要全局初始化内存，不允许直接分配 `tlsf_malloc` ， 否则会得到一个不可控的空间；

### 详细解释

#### USE_MMAP

`USE_MMAP`宏启用使用`mmap()`系统调用来获取内存。

- **功能**：通过内存映射获取虚拟内存页面
- **适用系统**：POSIX兼容系统(Linux, Unix, macOS等)
- **优势**：
    - 可以请求大块连续内存
    - 内存可以在不再需要时通过`munmap()`释放回操作系统
    - 支持内存保护机制

```c
#if USE_MMAP
/* 使用mmap()获取内存的代码 */
void* memory = mmap(NULL, size, PROT_READ | PROT_WRITE, MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
#endif
```

#### USE_SBRK

`USE_SBRK`宏启用使用`sbrk()`系统调用来获取内存。

- **功能**：通过增加程序数据段的大小来获取内存
- **适用系统**：传统Unix系统，某些嵌入式系统
- **特点**：
    - 较老的内存分配方法
    - 只能向上扩展堆
    - 通常不能将内存返回给操作系统(只增不减)

```c
#if USE_SBRK
/* 使用sbrk()获取内存的代码 */
void* memory = sbrk(size);
#endif
```

### 使用场景

这两个宏通常在条件编译中使用，根据目标平台选择适当的内存获取机制：

```c
#if USE_MMAP || USE_SBRK
/* 系统内存获取相关代码 */
#else
/* 自定义内存获取方法或错误处理 */
#endif
```

### 在嵌入式系统中的应用

在嵌入式系统中，TLSF是一个流行的内存分配器，因为它提供了确定性的O(1)时间复杂度分配和释放操作。

- **无操作系统环境**：通常两者都不使用，而是使用预定义的静态内存池
- **有操作系统的嵌入式系统**：可能使用`USE_MMAP`或自定义内存获取方法
- **资源受限系统**：可能使用简化版本的`USE_SBRK`或完全自定义内存管理

### 配置示例

在CMake中配置这些宏：

```cmake
# 在Linux/Unix系统上使用mmap
if(UNIX)
    target_compile_definitions(tlsf PUBLIC USE_MMAP=1)
endif()

# 在特定嵌入式平台使用sbrk
if(EMBEDDED_PLATFORM)
    target_compile_definitions(tlsf PUBLIC USE_SBRK=1)
endif()

# 使用自定义内存池
if(CUSTOM_MEMORY_POOL)
    target_compile_definitions(tlsf PUBLIC USE_MMAP=0 USE_SBRK=0)
endif()
```
