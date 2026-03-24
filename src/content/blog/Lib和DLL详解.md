---
title: "Lib和DLL详解"
date: "2021-8-25"
subtitle: "Windows库文件的使用与区别"
author: "Lonnie iTheds"
tags:
  - C/C++
draft: false
section: "posts"
sourcePath: "markdown/_posts/Lib和DLL详解.md"
slug: "Lib和DLL详解"
---

# Lib和DLL详解

## 基本概念

lib是静态库。
dll是动态库。
这两类库是两种链接方式，一般提供给exe可执行文件进行调用，使得代码可复用。

lib静态库，编译器在链接阶段将lib库中的函数等以内部嵌入的方式拷贝到exe文件中。生成exe文件之后，可以不再需要该lib文件。

dll动态库，编译器再链接阶段将记录下dll库中的共享对象以及其他少量的登记信息，生成exe文件之后通过记录的信息调用dll库中的函数或者变量等。exe文件的执行将依赖被调用的dll文件。dll文件可以通过版本迭代进行更新，但是接口和信需要与之前版本一致。

这两种链接库内部都含有函数的实现方式。

在整个C++程序生成过程(源代码[.c]-->预处理[.i]-->编译-->优化-->汇编[.s / .o]-->链接-->可执行文件)中，该处理发生在链接阶段。

## 编译过程

## DLL外部引用

如果函数需要提供给外部，则需要加上`extern "C" _declspec(dllimport)`声明：
```C++
extern "C" _declspec(dllimport) int example_function(){
}
```

如果不如此定义，可以使用def模块文件进行声明。其最简单的用法如下，
其中 LIBRARY 关键字声明dll文件，EXPORTS 声明对外开放的函数：
```C++
LIBRARY tzdb-odbc-setup.DLL
EXPORTS
ConfigDSNW
Driver_Prompt
;
```

### 通过GetProcAddress()进行调用

链接该dll的程序通过函数`GetProcAddress()`进行调用。

```C++
HINSTANCE hDllInst;
hDllInst = LoadLibrary(L"example.dll"); //调用DLL
typedef int(*PLUSFUNC)(int a, int b); //同形参函数指针
PLUSFUNC plus_str = (PLUSFUNC)GetProcAddress(hDllInst, "add"); //GetProcAddress获取名为add的函数地址
plus_str(1, 2);//调用add函数
```

### 使用_declspec(dllimport)进行调用

该方法不需要引入头文件，只需要dll文件和lib文件即可。

```C++
_declspec(dllimport) int add(int a, int b);

add(5, 3);//直接通过函数名进行调用
```

## DLL入口函数

一个dll文件中存在一个入口函数DllMain，其定义为：

```C++
BOOL APIENTRY DllMain(HANDLE hModule, WORD ul_reason_for_call, LPVOID lpReserved)
```

该函数如果用户不重写，编译器将自动生成返回TRUE的空函数。
其发生在四种情况下进行调用，参数`ul_reason_for_call`指明了被调用的原因:

- DLL卸载
  ```C++
  #define DLL_PROCESS_DETACH   0
  ```
  
- DLL加载
  ```C++
  #define DLL_PROCESS_ATTACH   1
  ```
  
- 单个线程启动
  ```C++
  #define DLL_THREAD_ATTACH    2
  ```
  
- 单个线程终止
  ```C++
  #define DLL_THREAD_DETACH    3
  ```

如果线程调用了ExitThread来结束线程（线程函数返回时，系统也会自动调用ExitThread），系统查看当前映射到进程空间中的所有DLL文件映像，并用DLL_THREAD_DETACH来调用DllMain函数，通知所有的DLL去执行线程级的清理工作。

注意：如果线程的结束是因为系统中的一个线程调用了TerminateThread()，系统就不会用值DLL_THREAD_DETACH来调用所有DLL的DllMain函数。

## 无法解析的外部符号

发生在`链接`过程。

无法解析的外部符号LNK2019:
```C++
#pragma comment(lib,"ws2_32.lib")
```

表示链接wpcap.lib这个库。和在工程设置里写上链入wpcap.lib的效果一样（两种方式等价，或说一个隐式一个显式调用），不过这种方法写的程序别人在使用你的代码的时候就不用再设置工程settings了。告诉连接器连接的时候要找ws2_32.lib，这样你就不用在linker的lib设置里指定这个lib了。

## 常用的库

常用的库有：
- ws2_32.lib
- odbc32.lib
- odbccp32.lib
- legacy_stdio_definitions.lib
- Nafxcwd.lib
- Secur32.lib
- Dnsapi.lib
- kernel32.lib
- user32.lib
- gdi32.lib
- winspool.lib
- shell32.lib
- ole32.lib
- oleaut32.lib
- uuid.lib
- comdlg32.lib
- advapi32.lib

## 常见库组合示例
