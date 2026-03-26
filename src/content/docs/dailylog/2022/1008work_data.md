---
title: "1008work_data"
description: "Life is fantastic, but I want to forget it"
---

# 1008work_data

Monday，Tuesday，Wednesday，Thursday，Friday，Saturday，Sunday

[10.8]
Saturday:
1. Study RUST all day.
2. interface with ZhiHang:
    Database Name:
    Attribute Name : NUM.17;
    Determine data type and length;
    Determine others attribute : like primary key , isn't non empyt.

    Since then:
    Compile mco files and generate special database package.
    Determine the process of inserts and queries.

    Finally:
    Test:store/dock the query statements into python syntax.

Sunday:
1. Handling meeting matters.

Monday:
1. Print files until 5:00PM.
   
Tuesday:
1. Organize the debian environment.

Wednesday:
1. [TZDB]Add version record.
2. Study RUST.

Thursday:
1. Organize the debian environment.

Friday:
1. Interface with RY and LJ:
   1. Determine base process test.
   2. Do a test for exprot the specified table.
   3. Test the char ',' in string tpye.
2. Study Rust by system.

[10.17]
Monday:
1. Test the char ',' in string type.
2. Study Rust.
   1. Cargo package and module
3. [TZDB] Log for record the time for exec sql.
   1. [ ] Done
5. [Ship] Test the error for AISData table why insert sql can't exec success.
   1. [X] Done . because sb. add a char ':' before keyword 'insert'.
6. [DocumentTask] Demand indicators.
   1. Simplify requirements according to the development task statement.
   2. Pay attention to the wording.
   3. Complete before Tuesday.
   4. [ ] Done

Tuesday:
1. [DocumentTask] Report about independence and controllability.
   1. Complete befor Wednesday.
   2. Task takes 2 hours.
   3. [X] Done
2. [Documentation]Receive fileds.
   1. [X] Done
   2. Took 1 and a half hours.

Wednesday:
1. [DocumentTask-submit] Demand indicators.
   1. [X] Done

Thursday:
1. [RUST]Study rust.
2. [DocumentRecevProcess]Task takes 1 and a half hours.
   1. [X] Done
4. [Ship]Deployment procedures to Ship 2.
   1. [X] Done

Friday:
1. [Morning]Study rust, painc and result.
2. [RAS][SQL]Update version.

[10.24]
Monday:
1. [Ship]Fix bug in LD test environment.
   1. [ ] Done - Delay
2. [TZDB]Primary key inserts are irregular be empty.
   1. [ ] Done - Delay
3. [TZDB]CSV export is truncated.
   1. [ ] Done - Delay
4. [TZDB]Adjust file structure.

Tuesday:
1. [TZDB]Adjust file structure.

Wednesday:
1. [TZDB]Adjust file structure.
   1. [X] Done
2. [TZDB]Interface renameFile development and test.
   1. [X] Done

Thursday:
1. [Drone]DB support
   1. [X] Done
2. [XiAn]Debug.
   1. [X] Done.Completed preliminary.
3. [Ship]System upload.

Friday:
1. Update the db version, and push to tzdb-win. 
   1. [X] Done

# Draf

Now ,what we could do.

### Licence

我们需要知道以下几点:
1. 开源许可是什么；
2. 我们所用的代码是不是已经在需要许可证的范围内；
   1. 我们使用的代码的许可证类型是什么；
   2. 是否需要许可证；

记录如下:
1. 开源许可是什么；
   1. GPL许可证规定，对源码的任何修改都必须开源，所以Android开源了，因为它修改了Kernel.MySQL是GPL许可证授权的，GPL许可证要求，你使用的MySQL只要被修改了并且分发软件就必须开放源代码，所以你说的第一个问题是不被允许的，即你可以销售但不能不开放源代码。第二个例子与第一个例子一样，因为Linux也是GPL协议。如果你想做可以闭源的并且商业化的，看上图，MIT BSD Apache这些宽松协议都是可以的。
   2. 而ASL许可证规定，可以随意使用源码，不必开源，所以建筑在Android之上的硬件驱动和应用程序，都可以保持封闭
   3. 参考网站:
      1. [Android，开源还是封闭？](http://www.ruanyifeng.com/blog/2010/02/open_android_or_not.html)
2. 我们所用的代码是不是已经在需要许可证的范围内；
        软件模块 ODBC 中使用了大量的重复的源码；
        其中主要体现在:
        1. [微软方面]使用了三个 windows 的头文件，其中只涉及到关键字的宏定义，而没有任何的实际实现代码。
           1. 该部分的使用主要是因为，ODBC 接口依赖于这三个文件，开发过程中使用了部分宏定义以方便开发。
           2. 故而为了在适配国产操作系统天脉和锐华时更加便利，直接将这三个头文件放于程序中，在天脉的编译开关开启时方启用。
           3. 但在基本版测试之后，支持服务端在国产系统上进行裁剪，去除客户端部分以缩小内容部分，故而实际上该部分在国产系统也未有完全使用。后续是弃用状态，不再编译开关内。
                # include <sql.h>       //含有SQL_()标准函数
                # include <sqlext.h>    //
                # include <odbcinst.h>  //含有关于安装程序DLL标准SQL_()函数
        2. [mysql-connect-odbc]ODBC 实现模块 ， DBODBC.cpp 和 DBODBCext.cpp 的开发中参考了 mysql-connect-odbc 的架构。
           1. ODBC 是统一的标准接口规范，标准的接口规范导致大部份的函数名称都是一样的，并且参数也是一样的，使用的是 sql.h 中的各种命名；
           2. 其中实现上也参照了 mysql-connect-odbc ，因为其中宏定义的对应参数回应差别比较小，故而用了大量 switch 的结构，该部分与 mysql 一致，只是各分支实现不一致。导致识别大部分为网络代码。
        但是做个总结，我们是否已经可以被认定为使用了别人的源码呢？实际上，确实参照了 mysql 的部分源码宏定义，但都是结构单一的、充当静态表作用的 switch 结构。
3. 如何界定是否使用了开源代码:
4. 我们使用的代码的许可证类型是什么；
   1. 接口规范是否需要授权？
   2. 
5. 是否需要许可证；


###

一个优秀的开源使用办法包括六个简单规则:
    在将开源代码整合到产品中之前，工程师必须获得开源审查委员会(OSRB)的许可。
    从第三方接收的软件必须经过审核，以识别其包含的所有开源代码，这样可以确保在产品发货之前许可证的义务得以履行。
    所有软件都必须经过审核和审查，包括所有的专有软件组件。
    产品必须在客户收货前履行开源许可证义务。
    即使开源组件是一样的，对于在一个产品中使用给定的开源组件的许可也不等于其他部署许可。
    任何变更的组件都必须经过审批流程。

[企业开源指南:开源代码的使用](https://blog.csdn.net/kaiyuanshe/article/details/99729461?utm_medium=distribute.pc_relevant.none-task-blog-2~default~baidujs_baidulandingword~default-0-99729461-blog-81083053.pc_relevant_aa&spm=1001.2101.3001.4242.1&utm_relevant_index=3)


用 mysql 当然没问题，只要你不修改 mysql 代码。
有些公司是需要自己修改 mysql 源代码实现一些自己特殊需求的。
而有些公司则是希望 mysql 出什么问题的时候能立即得到商业的技术支持。
这事儿不是一直有争议么 当然没改写 独立进程 一般不会有纠纷

但是有官网回答:

作者:fenghou
链接:https://www.zhihu.com/question/27698031/answer/37710828
来源:知乎
著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。

Linking [name of your program] statically or dynamically with
other modules is making a combined work based on [name of your
program].  Thus, the terms and conditions of the GNU General Public
License cover the whole combination.

If a library is released under the GPL
(not the LGPL), does that mean that any software which uses it
has to be under the GPL or a GPL-compatible license?
 (#IfLibraryIsGPL)

Yes, because the software as it is actually run includes the
library.

You have a GPL'ed program that I'd like
to link with my code to build a proprietary program.  Does the fact
that I link with your program mean I have to GPL my program?
(#LinkingWithGPL)
Not exactly.  It means you must release your program under a license
compatible with the GPL (more precisely, compatible with one or more GPL
versions accepted by all the rest of the code in the combination that you
link).  The combination itself is then available under those GPL
versions.What does it mean to say a license is
“compatible with the GPL?”
(#WhatDoesCompatMean)
It means that the other license and the GNU GPL are compatible; you can
combine code released under the other license with code released under the
GNU GPL in one larger program.All GNU GPL versions permit such combinations privately; they also
permit distribution of such combinations provided the combination is
released under the same GNU GPL version.  The other license is
compatible with the GPL if it permits


GPL的原文“the GNU General Public License is intended to guarantee your freedom to share and change all versions of a program保证你的共享和修改自由软件的自由”。可以理解为你使用开源软件并不受GPL约束，只有在你基于开源软件，修改开源软件的源码的时候才受 GPL约束。MySQL作为一个开源数据库，几乎所有的用户都只是通过自己的程序去操作这个数据库，不涉及到改动源码的问题，根本不用去考虑是否要遵循 GPL的问题。

[软件胎记](http://book.2cto.com/201208/2620.html)

# Consciousnes

## Consciousnes part 1

I am so tired. I must live outside alone.
Fine.

Get rid of the long-term disordered rest and get a good mental state.
But now is the critical moment.

I have suffered from other people's extreme values, so it makes sense that other people can suffer too.

## Consciousnes part 2

其实，不是的，当你也在这个平台，你用你的心态去看待这些事儿，去观察这些事，去拥抱你所想拥抱的，你会发现，其实别人的成就，你也同样可以达到，甚至做的更好。

## Consciousnes part 3

想要做什么样的人，无论什么时候都要立足与自身的发展之中。与君素断绝。
抛开不健康关系的影响，放下所谓的面子和欲望。
不让其他的固化空间影响你的发展，这才是少年之意。

## Consciousnes part 4

欲于天公势比高，我要素与断绝。

每次离开，都是为了遇见更好的自己。

拨开云晓看岳山，一片云层一片山，未赠他乡无穷日，倒去山河不见还。

是否正确还未见分晓，又何必售卖自我的曲解？安静。

至诚至静，清攘无淤。

## Consciousnes part 5

想到人的认可觉得开心
想到人，痛苦
想到分离前的状态，正确的选择？
想到我的做法，骄傲？幼稚？

我常在想，是否还有什么话没有说，是不是有什么地方没有说好，
她说她心里和我都是一样想的，好朋友。
所以我们都应该去乘风破浪不是吗。

# 立项论证报告

为高效实现遥感卫星样本自动生成数据的存储管理，同时为后续样本质量评估验证提供科学、高效的数据检索、记录功能，研究基于时序的海量动态生成样本管理方法，包括面向时序生成的样本分布式存储技术研究、面向样本特征的索引构建方法及样本快速检索方法研究，实现对遥感卫星自动生成样本集与样本质量管理。


主要的数据内容为 卫星信息智能处理的可见光遥感影像数据集。

### (一)研究目标

面向卫星信息智能处理技术应用需求，重点攻克高拟真度样本难生成、样本生成质量难评估等技术难题，研究面向成像条件多样性的可见光样本生成、面向目标特性及多样性的高拟真度样本生成、突破样本评估与效能验证技术、突破面向时序的海量动态生成样本管理技术，形成低样本量条件下数据集的快速增广及管理能力，支持航天智能解译算法效能的充分发挥。

### (二)研究内容	基于时序的海量动态生成样本管理方法研究(软件所，怡婧)

为高效实现遥感卫星样本自动生成数据的存储管理，同时为后续样本质量评估验证提供科学、高效的数据检索、记录功能，研究基于时序的海量动态生成样本管理方法，包括面向时序生成的样本分布式存储技术研究、面向样本特征的索引构建方法及样本快速检索方法研究，实现对遥感卫星自动生成样本集与样本质量管理。

(1)研究分析基于时序的海量动态生成样本集管理及样本质量管理需求，包括功能需求，以及可靠性、互操作性等综合性能需求。
(2)开展基于时序的海量动态生成样本管理方法关键技术论证分析，包括样本数据集及样本质量存储、样本生成模型存储、样本高效检索等内容。


### (三)技术途径(成稿) 海量动态生成样本分布式存储技术研究(加图4页，林涛)

帽子:要结合主题去存储，要存的数据包括但不限于:生成的可见光样本数据(图片)及其结构化参数数据、样本生成时间、质量评估数据、样本生成模型及其训练超参等状态数据。
帽子一般需要1个图和半页文字，后面其他具体细节参考涛思和之前的投标书。

## 想法

我们必须要知道原始数据的特点是什么，是否会经过处理？
如果无法知道，那么我们只能将数据特点和后续的技术要点进行分割。
基本确定是经过了特殊的处理。
生成的数据类型预计为:


## 资料

### 基于深度学习的环境遥感影像分割方法

环境遥感通
过搭载在轨道卫星以及无人机上的遥感拍摄设备对地表自然环境进行影像采集，
其主要影像数据类型包括可见光影像(Visible-spectral Imaging，VSI) [42] 、多光
谱遥感影像(Multi-spectral Imaging，MSI)
[43] 、合成孔径雷达遥感影像(Synthetic
Aperture Radar，SAR) [44] 等，进而实现对于河流、森林植被等地表自然对象的
监测 [45] 。图 1-2 展示了不同光谱波段的频率与波长信息，遥感影像主要对可见光
波段、以及近红外等多个不同波段进行影像采集。

图像处理是信息处理领域重要的研究方向之一 [55] 。早期的图像处理分析方法
主要针对可见光图像类型，以数字化方法将其转换为可被计算机处理的诸如灰度
图像 [56] 、RGB 图像 [57] 、HSV 图像等格式 [58] ，随后通过图像变换、图像编码、图
像分割等方法，实现包括图像增强、图像压缩、图像识别等具体功能 [59] 。
在环境遥感领域，可见光遥感影像因其所具有的 RGB 图像数据结构，因而
与传统影像采集设备所获取的图像数据结构较为一致，可采用常见的图像处理方
法进行直接处理，进而实现包括图像去雾等图像增强等操作。

多源异构数据是指在包含有来源多样、结构各异的数据集合，其存在于诸多
科学研究问题中 [150] 。


CBERS 系列卫星







