---
title: "大数据涉猎"
published: 2018-07-15
description: "大数据涉猎"
tags:
  - "Hadoop"
  - "免密登入"
category: "大数据"
draft: false
author: "Lonnie iTheds"
---
# 大数据涉猎

在本文中主要目的是搭建HBase系统，关于大数据的理论知识稍有涉猎，不成一家。
文章中对照教程搭建平台数据全权记录。
主要有四个方面，HDFS、Hive、ZooKeeper和HBase。
在大数据中我们使用Linux内核的CentOS系统，采用Mysql数据库。

> ## 概述

在此说明一写理论的摘要。

> ### 理论集成

HDFS ( Hadoop 分布式文件系统〉源自于 Google 的 GFS 论文， 发表于 2003 年 10 月， HDFS 是 GFS 的实现版。 HDFS 是 Hadoop 体系中数据存储管理的基础，它是一个高 度容错的系统，能检测和应对硬件故障，在低成本的通用硬件上运行。 HDFS 简化了文件 的一致性模型，通过流式数据访问，提供高吞吐量应用程序数据访问功能，适合带有大型数据集的应用程序。 HDFS 提供一次写入多次读取的机制，数据以块的形式，同时分布存 储在集群的不同物理机器上。
MapReduce C分布式计算框架）源自于 Google 的 MapReduce 论文，发表于 2004 年 12 月， Hadoop MapReduce 是 Google MapReduce 克隆版。 MapReduce 是一种分布式计算 模型，用以进行海量数据的计算。它屏蔽了分布式计算框架细节，将计算抽象成 Map 和 Reduce 两部分，其中 Map 对数据集上的独立元素进行指定的操作，生成键－值对形式中间 结果。 Reduce 则对中间结果中相同“键”的所有“值”进行规约，以得到最终结果。 MapReduce 非常适合在大量计算机组成的分布式并行环境里进行数据处理。 HBase C分布式列存数据库）源自 Google 的 BigTable 论文，发表于 2006 年 11 月， HBase 是 Google BigTable 的实现。 HBase 是一个建立在 HDFS 之上，面向结构化数据的 可伸缩、 高可靠、高性能、分布式和面向列的动态模式数据库。 HBase 采用了 BigTable 的数据模型，即增强的稀疏排序映射表（KeyNalue）， 其中，键由行关键字、列关键字和 时间戳构成。 HBase 提供了对大规模数据的随机、实时读写访问，同时， HBase 中保存的 数据可以使用 MapReduce 来处理，它将数据存储和并行计算完美地结合在一起。 ZooKeeper （分布式协作服务）源自 Google 的 Chubby 论文，发表于 2006 年 11 月， Zoo Keeper 是 Chubby 实现版。 ZooKeeper 的主要目标是解决分布式环境下的数据管理问 题 ，如 统一命名、状态同 步、集群管理、配置同步等。 Hadoop 的 许多组件依赖于 Zoo Keeper，它运行在计算机集群上面，用于管理 Hadoop 操作。
Hive （数据仓库）由 Facebook 开源， 最初用于解决海宜结构化的日志数据统计问 题。 Hive 定义了一种类似 SQL 的查询语言 CHQL)， 将 SQL 转化为 MapReduce 任务在 Hadoop 上执行，通常用于离线分析。 HQL 用于运行存储在 Hadoop 上的查询语旬， Hive 使不熟悉 MapReduce 开发人员也能编写数据查询语旬，然后这些语句被翻译为 Hadoop 上 面的 MapReduce 任务。
Pig (ad-hoc 脚本）由 yahoo 开源， 其设计动机是提供一种基于 MapReduce 的 ad-hoc （计算在 query 时发生〉数据分析工具。 Pig 定义了一种数据流语言--Pig Latin，它是 Map Reduce 编程的复杂性的抽象， Pig 平台包括运行环境和用于分析 Hadoop 数据集的脚 本语言（Pig Latin）。其编译器将 Pig Latin 翻译成 MapReduce 程序序列，将脚本转换为 Map Reduce 任务在 Hadoop 上执行， 通常用于进行离线分析。
Sqoop （数据 ETL/同步工具）是 SQL-to-Hadoop 的缩写 ， 主要用于传统数据库和 Hadoop 之前传输数据。数据的导入和导出本质上是 MapReduce 程序，充分利用了 MR 的
第 2 章 Hadoop 大数据关键技术 《 23
并行化和容错性。 Sqoop 利用数据库技术描述数据架构，用于在关系数据库、数据仓库和 Hadoop 之间转移数据。
Flume （日志收集工具）是 Cloudera 开源的日志收集系统，具有分布式、 高可靠、高 容错、易于定制和扩展的特点。它将数据从产生、传输、处理并最终写入目标的路径的过 程抽象为数据流，在具体的数据流中，数据源支持在 Flume 中定制数据发送方，从而支 持收集各种不同协议数据。同时， Flume 数据流提供对日志数据进行简单处理的能力，如 过滤、格式转换等。此外， Flume 还具有能够将日志写往各种数据目标（可定制）的能 力。总的来说， Flume 是一个可扩展、适合复杂环境的海量日志收集系统，当然也可以用 于收集其他类型数据
Mahout （数据挖掘算法库〉起源于 2008 年，最初是 Apache Lucent 的子项目，它在 极短的时间内取得了长足的发展，现在是 Apache 的顶级项目 。 Mahout 的主要目标是创建 一些可扩展的机器学习领域经典算法的实现，旨在帮助开发人员更加方便、快捷地创建智 能应用程序。 Mahout 现在己经包含了聚类、分类、推荐引擎（协同过滤）和频繁集挖掘 等广泛使用的数据挖掘方法。除了算法， Mahout 还包含数据的输入／输出工具、与其他存 储系统（如数据库、 MongoDB 或 Cassandra） 集成的数据挖掘支持架构。
YARN （分布式资源管理器）是下 一 代 MapReduce ，即 MRv2 ，是在第 一 代 Map Reduce 基础上演变而来的，主要是为了解决原始 Hadoop 扩展性较差，不支持多计算 框架而提出的。 YARN 是下一代 Hadoop 计算平台，是一个通用的运行时框架，用户可以 编写自己的计算框架，在该运行环境中运行。
Mesos （分布式资源管理器）是一个诞生于 UC Berkeley 的研究项目，现已成为 Apache 项目，当前有一些公司使用 Mesos 管理集群资源，如 Twitter。与 Y成N 类似， Mesos 是一个资源统一管理和调度的平台，同样支持诸如 扎眼、 steaming 等多种运算框架。
Tachyon （意为超光速粒子〉是以内存为中心的分布式文件系统，拥有高性能和容错 能力 ，能够为集群框架（如 Spark、 MapReduce ）提供可靠的 内存级速度的文件共享服 务。 Tachyon 诞生于 UC Berkeley 的 AMPLab。
Spark （内存 DAG 计算模型）是一个 Apache 项目，被标榜为“快如闪电的集群计 算”，它拥有一个繁荣的开源社区，并且是目前最活跃的 Apache 项目 。最早 Spark 是 UC Berkeley AMP Lab 所开源的类 Hadoop MapReduce 的通用并行计算框架， Spark 提供了一 个更快、更通用的数据处理平台。和 Hadoop 相比， Spark 可以让你的程序在内存中运行 时速度提升 100 倍，或者在磁盘上运行时速度提升 10 倍。
24 >> Hadoop 大数据实战权威指南
Spark GraphX 最先是伯克利 AMP Lab 的一个分布式图计算框架项目 ， 目前整合在 Spark 运行框架中，为其提供 BSP 大规模并行图计算能力。
Spark MLlib 是一个机器学习库， 它提供了各种各样的算法，这些算法用来在集群上 针对分类、 回归、 聚类、协同过滤等。
Kafka 是 Linkedin 于 2010 年 12 月开源的消息系统，主要用于处理活跃的流式数据。 活跃的流式数据在 Web 网站应用中非常常见， 这些数据包括网站的 PY (Page View）， 用 户访问了什么 内容，搜索了什么内容等。这些数据通常以日志的形式记录下来，然后每隔 一段时间进行一次统计处理。
Apache Phoenix 是 HBase 的 SQL 驱动 CHBase SQL 接口）， Phoenix 使得 HBase 支持 通过 JDBC 的方式进行访问， 并将你的 SQL 查询转换成 HBase 的扫描和相应的动作。
Apache Arnbari 是安装部署配置管理工具， 其作用就是创建、管理、监视 Hadoop 的 集群， 是为 了让 Hadoop 以及相关的大数据软件更容易使用的一个 Web 工具

> ## Mysql数据库

用户：hadoopcsu，密码Hive_%,CSUdjhuangl68168
数据库hive_168用于Hive。
测试数据库test_db

> ## 主机集群

需要三台主机，master，slave0，slave1。
通过修改etc/sysconfig/network中的hostname，以及在root下确认修改hostname master之后，再修改etc/hostname添加master，修改成功。

ifconfig查看网段信息。只要是在同一网段上的虚拟机就是可以互相ping的。

[a]:<> (获取ip：cat /etc/resolv.conf,这个方法获取的ip，存在疑点，两个虚拟机中的是一样的)

网段信息：
master：192.168.52.129
slave0：192.168.52.131
slave1：192.168.52.130

[^_^]:<> (ifcfg-eth0 ifcfg-ens33 ifcfg-lo,虽然不知道这三者的区别，并且，eth0网关的具体作用，更改网卡https://blog.csdn.net/u013252047/article/details/77947594?locationNum=3&fps=1，配置完网卡为ifcfg-eth0之后文件上传正常了，但是免密登入无效了)

使用ping ip可以查看是否有回复信息。使用ssh ip可以登入。

关闭防火墙：
systemctl status firewalld.service
systemctl stop firewalld.service
systemctl disable firewalld.service

设置免密登入。
ssh-keygen -t rsa
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
scp ~/.ssh/authorized_keys itheds@slave0：~/
scp ~/.ssh/authorized_keys itheds@192.168.52.130：~/

ssh ip以登入

> ## HDFS(Hadoop Distributed File System)

得到安装包hadoop-2.6.0.tar.gz。
解压到home/itheds/hadoop-2.6.0。

配置环境变量~/hadoop-2.6.0/etc/hadoop/hadoop-env.sh
修改java环境变量export JAVA_HOME=/usr/bin/java/jdk1.7.0_67/
/usr/bin/java/jdk1.7.0_67/

配置Yarn环境~/hadoop-2.6.0/etc/hadoop/yarn-env.sh(接下来的所有配置都在此主文件夹中)
修改java环境变量export JAVA_HOME=/usr/bin/java/jdk1.7.0_67/

配置核心组件core-site.xml

```core-site.xml
<property>
    <name>fs.defaultFS</name>
    <value>hdfs://master:9000</value>
</property>
<property>
    <name>hadoop.tmp.dir</name>
    <value>/home/itheds/hadoopdata</value>
</property>
```

配置文件系统hdfs-site.xml

```hdfs-site.xml
<property>
    <name >dfs.replication</name>
    <value>1</value>
</property>
```

配置yarn-site.xml

```yarn-site.xml
<property>
    <name>yarn.nodemanager.aux-services</name>
    <value>mapreduce_shuffle</value>
</property>
<property>
    <name>yarn.resourcemanager.address</name>
    <value>master:18040</value>
</property>
<property>
    <name >yarn.resourcemanager.scheduler.address</name>
    <value>master:18030</value>
</property>
<property>
    <name>yarn.reourcemanager.resource-tracker.address</name>
    <value>master:18025</value>
</property>
<property>
    <name >yarn.resourcemanager.admin.address</name>
    <value>master:18141</value>
</property>
<property>
    <name>yarn.resourcemanager.webapp.address</name>
    <value>master:18088</value>
</property>
```

配置 MapReduce 计算框架文件
改名cp mapred-site.xml.template mapred-site.xml
编辑 mapred-site.xml

```mapred-site.xml
<property>
    <name>mapreduce.framework.name</name>
    <value>yarn</value>
</property>
```

配置Master的slaves文件
此处存疑，如果是ip的话另改，原有的localhost删去。

```slaves
slave0
slavel
```

复制上述配置完成的hadoop到其他节点，
scp -r /home/itheds/hadoop-2.6.0 itheds@192.168.52.131: /home/itheds/
网段信息：
master：192.168.52.129
slave0：192.168.52.131
slave1：192.168.52.130

> ### 启动

配置/home/itheds/.bash_profile，加入文件尾
执行source ~/.bash_profile生效

```.bash_profile
# User specific environment and startup programs
PATH=$PATH:$HOME/.local/bin:$HOME/bin
export PATH

export JAVA_HOME=/usr/bin/java/jdk1.7.0_67/
export PATH=$JAVA_HOME/bin:$PATH

#以下是新添加入代码：
#HADOOP
export HADOOP_HOME=/home/itheds/hadoop-2.6.0/
export PATH=$HADOOP_HOME/bin:$HADOOP_HOME/sbin:$PATH
#你体会过＝和=的区别吗。卡一天~
```

创建 Hadoop 数据目录
mkdir /home/itheds/hadoopdata
与core-site.xml中的/home/itheds/hadoopdata一致。

格式化文件系统(此仅仅需要在master上进行)
hdfs namenode -format

[>>任务节点]: <> (hadoop未完全启动完成，slave0上hadoop未传送成功。slave1未进行任何配置，除了得到了网络断点。)

[Error]: <> (如果出现 Exception/Error 信 息，则表示格式化出现问题。如果遇到格式化失败的问题，可以先删除 dfs.name.dir 参数 指定的目录，确保该目录不存在，然后实施格式化。 Hadoop 这样做的目的是防止错误地 将己存在的集群格式化了。)

`启动`:在~/hadoop-2.6.0/下执行sbin/start-all.sh启动集群。

关闭 stop-all.sh。start-dfs.sh 和 start-yam.sh亦可

在master的~/hadoop-2.6.0/下执行jps可以看到有四个进程SecondaryNameNode、ResourceManager、 Jps和NameNode
在slave下执行jps看到三个进程NodeManager、 Jps 和 DataNode.

> ### 检测

http://master:50070/

检测Yarn情况：http://master:18088

> ## Hive

Hive 是基于 HDFS 和 MapReduce 架构的数据仓库，提供类似 SQL 的 Hive QL 语言操 作结构化数据 ， 其基本原理是将 HQL 语言 自动转换成 MapReduce 任务，从而完成对 Hadoop 集群中存储的海量数据进行查询和分析。

> ## ZooKeeper

> ## HBase(Hadoop Base)

HBase 即 Hadoop Database， 是一个高可靠、 高性能、面向列、可伸缩的分布式存储 系统，利用 HBase 技术可在廉价 PC Server 上搭建起大规模结构化存储集群。