---
layout: post
title: "RT-Thread"
subtitle: "就像是种一朵花，哪一朵不再于好不好看，第一个想法很关键"
date: 2021-6-4
author: Lonnie iTheds
header-img: "img/hexo.jpg"
cdn: 'header-on'
categories:
  - 服务器
tags:
  - RTthread
description: "RT-Thread"
---

<link rel="stylesheet" type="text/css" href="../../auto-number-title.css" />

# RTthread

主要方面：
	内存分配
	信号量
	多线程
	如何使用

RT-Thread 就是 RTOS（Real-time operating system，实时操作系统）。

RT-Thread 内核的第一个版本是熊谱翔先生在 2006 年年初发布的 0.1 版本。因为 RTOS 中的任务更类似于通用操作系统中的线程，并且这个系统支持基于优先级的抢占式任务调度算法，调度器的时间复杂度是 O(1)，所以把它命名为 RT-Thread，即实时线程。

随着 MCU 硬件性能的提升、外设的增加以及软件功能需求的增加，越来越多项目采用 RTOS 的开发方式。一方面裸机开发方式的软件框架不清晰，对后续扩展功能极其不利；另一方面，由于软件复杂性的增加，裸机开发对工程师的要求越来越严苛，过多使用中断等因素，都会增加系统的不可靠性。

针对资源受限的微控制器（MCU）系统，可通过方便易用的工具，裁剪出仅需要 3KB Flash、1.2KB RAM 内存资源的 NANO 版本

RT-Thread 最大支持 256 级优先级（0~255），数值越小优先级越高。可以根据实际情况选择 8 或 32 级，对于 ARM Cortex-M 系列，通常采用 32 级优先级。

调度器是操作系统的核心，其主要功能就是实现线程的切换。RT-Thread 通过管理就绪列表，当需要调度时可以直接找出就绪列表中优先级最高的线程，然后执行该线程，时间复杂度为 O(1)。

RT-Thread 内核采用面向对象的设计思想进行设计，系统级的基础设施都是内核对象，比如线程、信号量、互斥量、事件、邮箱、消息队列、定时器、内存池、设备驱动等等。然后通过内核对象管理系统来访问/管理所有内核对象，例如当您创建一个对象时，内核对象管理系统就会将这个对象放到一个叫对象容器的地方。

## 架构

它具体包括以下部分:

* 内核层：RT-Thread 内核，是 RT-Thread 的核心部分，包括了内核系统中对象的实现，例如多线程及其调度、信号量、邮箱、消息队列、内存管理、定时器等；libcpu/BSP（芯片移植相关文件 / 板级支持包）与硬件密切相关，由外设驱动和 CPU 移植构成。
* 组件与服务层：组件是基于 RT-Thread 内核之上的上层软件，例如虚拟文件系统、FinSH 命令行界面、网络框架、设备框架等。采用模块化设计，做到组件内部高内聚，组件之间低耦合。
* RT-Thread 软件包：运行于 RT-Thread 物联网操作系统平台上，面向不同应用领域的通用软件组件，由描述信息、源代码或库文件组成。RT-Thread 提供了开放的软件包平台，这里存放了官方提供或开发者提供的软件包，该平台为开发者提供了众多可重用软件包的选择，这也是 RT-Thread 生态的重要组成部分。软件包生态对于一个操作系统的选择至关重要，因为这些软件包具有很强的可重用性，模块化程度很高，极大的方便应用开发者在最短时间内，打造出自己想要的系统。RT-Thread 已经支持的软件包数量已经达到 60+，如下举例：
* 物联网相关的软件包：Paho MQTT、WebClient、mongoose、WebTerminal 等等。
* 脚本语言相关的软件包：目前支持 JerryScript、MicroPython。
* 多媒体相关的软件包：Openmv、mupdf。
* 工具类软件包：CmBacktrace、EasyFlash、EasyLogger、SystemView。
* 系统相关的软件包：RTGUI、Persimmon UI、lwext4、partition、SQLite 等等。
* 外设库与驱动类软件包：RealTek RTL8710BN SDK。
* 其他。

## 环境搭建

开发板

## 内存分配

一般 MCU 包含的存储空间有：片内 Flash 与片内 RAM，RAM 相当于内存，Flash 相当于硬盘。编译器会将一个程序分类为好几个部分，分别存储在 MCU 不同的存储区。

Keil 工程在编译完之后，会有相应的程序所占用的空间提示信息，如下所示：

```C
linking...
Program Size: Code=48008 RO-data=5660 RW-data=604 ZI-data=2124
After Build - User command \#1: fromelf --bin.\\build\\rtthread-stm32.axf--output rtthread.bin
".\\build\\rtthread-stm32.axf" - 0 Error(s), 0 Warning(s).
Build Time Elapsed: 00:00:07
```

上面提到的 Program Size 包含以下几个部分：

1）Code：代码段，存放程序的代码部分；

2）RO-data：只读数据段，存放程序中定义的常量；

3）RW-data：读写数据段，存放初始化为非 0 值的全局变量；

4）ZI-data：0 数据段，存放未初始化的全局变量及初始化为 0 的变量；

编译完工程会生成一个. map 的文件，该文件说明了各个函数占用的尺寸和地址，在文件的最后几行也说明了上面几个字段的关系：

```C++
Total RO Size (Code + RO Data) 53668 ( 52.41kB)
Total RW Size (RW Data + ZI Data) 2728 ( 2.66kB)
Total ROM Size (Code + RO Data + RW Data) 53780 ( 52.52kB)
```

1）RO Size 包含了 Code 及 RO-data，表示程序占用 Flash 空间的大小；

2）RW Size 包含了 RW-data 及 ZI-data，表示运行时占用的 RAM 的大小；

3）ROM Size 包含了 Code、RO-data 以及 RW-data，表示烧写程序所占用的 Flash 空间的大小；

程序运行之前，需要有文件实体被烧录到 STM32 的 Flash 中，一般是 bin 或者 hex 文件，该被烧录文件称为可执行映像文件。如下图左边部分所示，是可执行映像文件烧录到 STM32 后的内存分布，它包含 RO 段和 RW 段两个部分：其中 RO 段中保存了 Code、RO-data 的数据，RW 段保存了 RW-data 的数据，由于 ZI-data 都是 0，所以未包含在映像文件中。

:::info
ROW和RAM：RAM 、ROM都是数据存储器。 RAM 是随机存取存储器，它的特点是易挥发性，即掉电失忆。 ROM 通常指固化存储器（一次写入，反复读取），它的特点与RAM 相反。 举个例子来说也就是，如果突然停电或者没有保存就关闭了文件，那么ROM可以随机保存之前没有储存的文件但是RAM会使之前没有保存的文件消失。
ZI-data是（Zero Initialize） 没有初始化的可读写变量的大小
:::

STM32 在上电启动之后默认从 Flash 启动，启动之后会将 RW 段中的 RW-data（初始化的全局变量）搬运到 RAM 中，但不会搬运 RO 段，即 CPU 的执行代码从 Flash 中读取，另外根据编译器给出的 ZI 地址和大小分配出 ZI 段，并将这块 RAM 区域清零。


## 信号量

RT-Thread 采用信号量、互斥量与事件集实现线程间同步。线程通过对信号量、互斥量的获取与释放进行同步；互斥量采用优先级继承的方式解决了实时系统常见的优先级翻转问题。线程同步机制支持线程按优先级等待或按先进先出方式获取信号量或互斥量。线程通过对事件的发送与接收进行同步；事件集支持多事件的 “或触发” 和“与触发”，适合于线程等待多个事件的情况。

每个信号量对象都有一个信号量值和一个线程等待队列，信号量的值对应了信号量对象的实例数目、资源数目，假如信号量值为 5，则表示共有 5 个信号量实例（资源）可以被使用，当信号量实例数目为零时，再申请该信号量的线程就会被挂起在该信号量的等待队列上，等待可用的信号量实例（资源）。

运用在多种场合中。形成锁、同步、资源计数等关系，也能方便的用于线程与线程、中断与线程间的同步中

在 RT-Thread 中，信号量控制块是操作系统用于管理信号量的一个数据结构，由结构体 struct rt_semaphore 表示。另外一种 C 表达方式 rt_sem_t，表示的是信号量的句柄，在 C 语言中的实现是指向信号量控制块的指针。信号量控制块结构的详细定义如下：

```C++
struct rt_semaphore
{
   struct rt_ipc_object parent;  /* 继承自 ipc_object 类 */
   rt_uint16_t value;              /* 信号量的值 */
};
/* rt_sem_t 是指向 semaphore 结构体的指针类型 */
typedef struct rt_semaphore* rt_sem_t;
```

rt_semaphore 对象从 rt_ipc_object 中派生，由 IPC 容器所管理，信号量的最大值是 65535。

创建：

	rt_sem_t rt_sem_create(const char *name,
							rt_uint32_t value,
							rt_uint8_t flag);

当调用这个函数时，系统将先从对象管理器中分配一个 semaphore 对象，并初始化这个对象，然后初始化父类 IPC 对象以及与 semaphore 相关的部分。

:::info
ipc （进程间通信）
:::

删除信号量使用下面的函数接口：

	rt_err_t rt_sem_delete(rt_sem_t sem);

初始化和脱离信号量
对于静态信号量对象，它的内存空间在编译时期就被编译器分配出来，放在读写数据段或未初始化数据段上，此时使用信号量就不再需要使用 rt_sem_create 接口来创建它，而只需在使用前对它进行初始化即可。初始化信号量对象可使用下面的函数接口：

	rt_err_t rt_sem_init(rt_sem_t       sem,
						const char     *name,
						rt_uint32_t    value,
						rt_uint8_t     flag)

脱离信号量就是让信号量对象从内核对象管理器中脱离，适用于静态初始化的信号量。脱离信号量使用下面的函数接口：

	rt_err_t rt_sem_detach(rt_sem_t sem);

线程通过获取信号量来获得信号量资源实例，当信号量值大于零时，线程将获得信号量，并且相应的信号量值会减 1，获取信号量使用下面的函数接口：

	rt_err_t rt_sem_take (rt_sem_t sem, rt_int32_t time);

## 多线程

RT-Thread，全称是 Real Time-Thread，顾名思义，它是一个嵌入式实时多线程操作系统，基本属性之一是支持多任务，允许多个任务同时运行并不意味着处理器在同一时刻真地执行了多个任务。事实上，一个处理器核心在某一时刻只能运行一个任务，由于每次对一个任务的执行时间很短、任务与任务之间通过任务调度器进行非常快速地切换（调度器根据优先级决定此刻该执行的任务），给人造成多个任务在一个时刻同时运行的错觉。在 RT-Thread 系统中，任务通过线程实现的，RT-Thread 中的线程调度器也就是以上提到的任务调度器。

线程是 RT-Thread 操作系统中最小的调度单位，线程调度算法是基于优先级的全抢占式多线程调度算法，即在系统中除了中断处理函数、调度器上锁部分的代码和禁止中断的代码是不可抢占的之外，系统的其他部分都是可以抢占的，包括线程调度器自身。支持 256 个线程优先级（也可通过配置文件更改为最大支持 32 个或 8 个线程优先级，针对 STM32 默认配置是 32 个线程优先级），0 优先级代表最高优先级，最低优先级留给空闲线程使用；同时它也支持创建多个具有相同优先级的线程，相同优先级的线程间采用时间片的轮转调度算法进行调度，使每个线程运行相应时间；另外调度器在寻找那些处于就绪状态的具有最高优先级的线程时，所经历的时间是恒定的，系统也不限制线程数量的多少，线程数目只和硬件平台的具体内存相关。

## FinSH 控制台

FinSH 是 RT-Thread 最早的组件之一，提供了一套类似于 Linux Shell 的操作接口，您可以通过 串口/以太网/USB 等方式与 PC 机进行通信，通过命令行查看系统信息或用于调试。

