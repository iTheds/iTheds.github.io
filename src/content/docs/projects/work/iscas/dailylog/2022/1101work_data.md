---
title: "1101work_data"
description: "纸上得来终觉浅，绝知此事要躬行"
---

# 1101work_data

[10.31]
Monday:
1. Update the recGH, Adjust the project frame, finally , we said to suit UNIX .
   1. [X] Done

Tuesday:
1. Replace the ship test enviroment.
   1. [X] Done
2. [RecGH]Fix bugs。
   1. [X] Done
3. [SHIP]Add visual ICON.
   1. [X] Done
4. [RAS]Determine the app level, merge the distribution system, and establish a new TZDB-SERVER-APP。

Wednesday:
1. [DocumentTask]Writing about the background and technology of distributed technology.

Thursday:
1. [DocumentTask]Writing about the background and technology of distributed technology.
   1. [X] Done
2. [RAS] rollback sqlengine version in TZDB-RAS , because the fix be remove when merage.
   1. The most import is how to mergae next time.Sure to fork the new branch.
   2. [ ] Done

Friday:
1. Read the source code and discuss the storage scheme.

[11.07]
Monday:
1. I want implement B+-tree algorithm.
2. Updata version for tzdb-win.
   1. [X] Done
3. Investigation the difference between Mysql InnoDB and MyISAM.

Tuesday:
1. Reading Mysql MyISAM source code.

Wednesday:
1. Reading Mysql MyISAM source code.

Thursday:
1. Reading Mysql MyISAM source code.
2. Test for XiAn TM.

Friday:
1. Reading Mysql MyISAM source code.
2. Test for XiAn TM.

[11.14]
Monday:
1. [SHIP]DLL can't find.
2. [SENSOR]Change table and support.
   1. [X] Done
4. Learn about the storage engine.

Tuesday:
1. Read the source code and discuss the storage scheme.
   1. About freelist.
   2. About new page.
2. [TZDB]Fix Memory leak for TZDB v0.1.0.0
   1. divide the question.
   2. [X] Done

Wednesday:
1. [SENSOR]Change table and support.
   1. Change the association table to used two table.
2. [SHIP]Fix bug , for sonar. 
   1. Fix bug , the rename file path.
3. Update version , for tzdb branch dev and v0.1.0.0.

Thursday:
1. [DocumentTask]About project initiation , about Distributed storage.

Friday:
1. [DocumentTask]About project initiation , about Distributed storage.
   1. [X] Done

[11.21]
Monday:
1. [PrintTask]Take 3 hours.

Tuesday:
1. [TZDB-DEV]Change camek, update version.
2. [TZDB]Suit all file format.

Wenesday:
1. [TZDB] setup file group.
2. [TZDB] tzsql include file error .

Thursday:
1. [Metting]for a metting , all day.

Friday:
1. [TZDB]setup file group.
   1. [X] Done

[11.28]
Monday:
1. [RAS]Fromat a test system.
2. [TZDB-Linux]fix a question. I don't know what I do.

Tuesday:
1. [TEST]Build test framework.
2. [DocumentTask]Change source file to a new project.

Wenesday:
1. [DocumentTask_Booa]Boat Project need write about some document.
2. [Storage_engine]

## 

Then what should I do?
for a test?or storage engine?
or rust?
What is the importance?

About Ras, I want code the thread pool , and return error code, and for non-blocking socket.
Just do it.

But I want writting the rust.

This years is just eight weeks , I could use two weeks coding RAS.

Fidget

# Consciousnes

## Consciousnes 1

Just do it. 
We may never admit one's fault, because us have't do our best.

eiak-vfhc-sxph-umlz

## Consciousnes 2

Everyday I thinking what I should do.


# 分管工作

主要负责协同研发数据库相关项目，研发嵌入式数据库远程访问技术，包括内部服务架构搭建、网络并发访问开发、通信协议、适配ODBC技术等。
在所内海上XX项目中，负责对接关于船载数据库项目的使用，针对主体系统使用组内数据库系统时，进行联调联试、收集相关需求、改良产品等。

## 个人总结

在2022年度，主要完成以下工作：
1. 完成对于远程访问服务的研发，使得当前嵌入式数据库具备远程访问功能，实时响应客户端访问，并且支持多连接并发访问，并且能够使用ODBC标准接口、PyODBC、JDBC接口进行访问；
2. 完成5月份对数据库的测试工作，并且对远程访问服务进行改良，满足项目指标；
3. 完成对于海上XX项目在7月份三亚联调联试工作，并且在之后9月份的航次中，完成实地航次试验；
在2022年度，完成以下的学习目标：
1. 在初期研发远程访问服务时，对项目的构建、开发，以及对编程思想和项目相结合有一定程度了解，针对面向对象和过程的开发方式有所深入；
2. 在7月份联调联试期间，开始了解算法和其他机制，尝试独立研发连接池、等待通知机制等，为以后独立研究更高效的机制奠定基础；
3. 对项目健壮性的保障方式进行了学习，系统的健壮性不应该通过其他外部机制来维护，而应该通过本身的代码质量决定，促使形成开发-测试-文档一体的程序开发理念；并且对项目的健壮性在系统架构设计中的体现，应该是多层次的、精简的，所以促使尽可能保证程序数据和逻辑的分离；
4. 在9月份出海航次期间，学习并思考了关于项目对接时的想法，项目对接本质上是流程性和效率性的，所以应该积极主动，文档为辅；
不足：
1. 在11月参与调研存储引擎模块时，由于对内核代码不甚了解，导致许多调研的内容无法判断是否能够落地，应当树立经常自主学习的习惯，并且戒骄戒躁；
2. 在7月份联调联试期间，许多问题解决的较为缓慢，很多地方因为系统模块一开始并没有设计十分合理，导致一个问题频繁暴露，维护成本大，只能重新构建代码系统，然后着手解决，虽然每次重构代码都会使得代码质量显著提升，但在代码量多的时候显得维护成本大，应当设计出更加多层次的、精简体系的代码；
