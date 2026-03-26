---
title: "TZDB Rust Project"
description: "TZDB Rust Project"
---

# TZDB Rust Project

本模块, 是为扩展嵌入式数据的分布式功能而新设定的工程, 以可卸载模块的方式存在.

# 开发日志

[12.28]
进行了初期的设计.

元数据模块的详细设计:
怎么存， 如何取， 如何用的问题。

首先是如何使用:
我们在 单数据库 表-单副本 的情况下， 通常有以下场景:
1. 根据表名称， 取得目标地址，用于发送信息；
2. 根据目标地址， 获取目标地址持有哪些表[]；

在 单数据库 表-多副本(副本一致)情况下:
1. 根据表名称， 取得所有目标地址[]，用于发送信息；
2. 根据目标地址， 获取目标地址持有哪些表[]；

在 单数据库 表-多副本(副本分区)情况下:
1. 根据表名称和分区信息， 取得所有目标地址[]，用于发送信息；
2. 根据目标地址， 获取目标地址持有哪些表[]及其分区情况；

根据上述分析, 显然, 每次多个分割的方式, 那么, 接口的查找规则就需要多一条, 我们可以按照最大的方式设计, 但是却无法保证其可扩展性.
在之后的设计中, 最好是使用数据库的方式, 在本地建立一个数据库, 配合 ddl 的配置文件, 对指定数据进行检索, 
如果是依据此法, 那么, 我们所设计的内容, 就完全作为一个数据缓冲来使用.

而如果是多数据库, 那么就在加一个属性作为筛选. 

如何取:
如何让使用者对取出的多个目标进行 fetch , 关键是应用场景， 毕竟索引是有限的。
那我们根据表的名称来建立索引， 但问题是， 如果是多库情况下， 那么表名是可能重复的， 这也没有关系， 那么就以 库名:表名 作为索引。

查出来的是否为唯一的数据，如果不为唯一的数据如何处理？
查出来的数据应该是可能有多个， 但是有可能只有一个， 元数据是否需要负载对与数据的策略处理， 这个是另说的， 也是可以负载部分调配策略的。
对于查询到了多个数据， 那么可以使用 cursor 和 fetch 两者相配合的方式。
但是 fetch 一旦对外， 那么就必须要管理起来， 在适当的时候进行关闭和销毁。

那么在查询的库表信息又如何使用？
主键是什么？

首先在分布式系统中， 我们可以如何使用元数据。
元数据在整个集群中承担数据通路的作用。当前节点通过元数据管理， 从而得知自身的信息情况， 包括自身的网络，自身的库表信息和其他公用信息，
而其中， 自身的网络信息作为决策支点， 围绕自身节点， 确定数据库在多个分布式节点中的部署顺序， 并且确定其库表结构， 将决策信息(分区信息、公用信息)存储到元信息管理中。
在此过程中， 元数据管理的使用， 始终是围绕自身节点来作为判断的。
比如， 判断自身有那些库表， 根据既定或均衡策略， 确定单个表的副本数量， 分布到各个节点中。这个过程可以是遍历所有可用节点来完成。

而在使用到其他节点的库表元信息时， 比如执行查询， 本地分区没有范围内数据， 那么需要检索目标分区数据所在的节点位置， 跟目标节点建立连接， 并且执行查询任务。
或者在备份目标数据时， 定位目标数据表的位置， 进行发送信息等。
总之， 通过 库名:表名 的格式进行检索， 根据功能需求，每需要一个功能参数， 就多一个查询条件。

那么问题就拆解到查询条件和返回的结果参数中。

查询条件的确定，关键在于其他维度的扩展， 比如后续加上分区信息， 分区有各个 id ， 需要搜索指定 分区 id 的节点的网络信息。
此时， 只能通过函数再加上一个入参信息， 这样未免有些不合理。- 但是目前 ddl 就是以这种方式对外提供接口的。

返回的结果， 直接使用返回原生结构体的方式， 让上层拿到结果之后， 自行调用。

[12.29]
索引问题:
如果是用 库名:表名 的格式作为关键字， 那么如何构建索引。
首先， 多字段索引可能无法支持， 但是可以使用拼接字符串的方式构建 map 。
但存储的时候， 并非是一个 key 对应一个 node ， 有可能出现， 一个 node 对应多个 key 的问题， 因为一个节点中可能存储不止一个表。
如果是表进行了分区， 那么 key 需要加入 分区的 id 重新作为索引。

索引的结构关系， 如何操作。
增加和删除， map 是最稳定的， 但是其并不能完全满足扩展特性。
目前， 可以采用建立额外索引的方式， 维护一个 `map<index_struct, *node>` 的方式。

[1.9]
增加一些接口, 通过节点 id 查询到其网络信息.
mco 对接完毕.

[1.10]
每次有一种搜索需求,就建立一个索引, 很鸡肋.

构想:
建立多个 set , 一层为一个 set , 存储相同的结构 .
node set
db set
table set

每个下层的 set 都存储上层 set 的指针.

//
存储结构和索引结构分离

存储上, 
meta manager{
    node set,
}
node {
    db set,
}
db{
    table set,
}

但是问题是有的是一个部署结构 , 
这样会导致结构很臃肿.

不如这样:
db{
    table set,
}

响应请求, 
实际上进入的是单个库、包括该库的部署信息;

node 中存储什么?

meta manager{
    node list,
    db set, // 存储结构
}
db{
    table set,
}

CurrentWarn
test1
test2

master:[CurrentWarn,test1,test2]:192.168.1.101:7777;
replica:[CurrentWarn,test1]:192.168.1.102:7778;
replica:[CurrentWarn,test1,test2]:192.168.1.103:7779;
replica:[CurrentWarn,test1,test2]:192.168.1.104:7780;
replica:[CurrentWarn,test1]:192.168.1.105:7781;


[1.19]
以部署信息为标准。
添加时，添加一条部署信息，先检验/增加存储信息，然后添加部署信息，最后添加索引信息。
删除时，先删除索引信息，删除部署信息，再删除存储信息。
查询时，通过索引信息进行查询。
针对查询所有库表所部署的节点，直接顺序检索。

[1.23]
发现一个 bug， 查询指定节点的表信息时，需要一个验证，验证该表中含有此 node 。

[2.21]
目前要开始写测试用例, 预计是这两天, 周五的时候, 能够把诸多的测试用例功能先开发出来, 搭建出最基本的测试用例.

既然已经分成多个粒度, level 1 中的情景就是最基本的模型.

首先, 我们抽出了部分的应用场景, 
然后取其最宽泛的应用场景, 来进行异常测试, 
其实到这里就已经差不多了, 但是为什么还会有 Level 3 , Level 3 主要是...

我的设想是, 能够在本地进行, 然后为什么现有的测试用例可以本地, 在没有配置 mco 的情况下, 

然后其他的测试用例是否要单独使用 mco, 其实没有必要, 可以只用一个 mco , 
但是 mco 是输入, 在某些测试用例中需要使用.

目前使用的是 tzdbGenerator 生成的测试用例, 并且其只有单个节点, 而且一个机器必须只能跑单个节点, 除非使用虚拟机等其他手段, 更改信号量为随机, 使得其可以在单个主机上测试多个节点的效果, 此为后续[优化]项.

tzdbGenerator 的作用是根据在 toml 文件中自定的表格式, 将其生成 mco 文件, 并且生成其 act 集.

[2.22]
根本问题在于如何做多节点的测试, 搭建完整的环境.

查询部分应该至少用条数来检验其结果,

每个主机通过本身的节点 ip 来判断其执行的功能. 

能够通过文件路径来创建数据库. SetCurrentDirectory 设置当前的工作路径.

check master 时是通过是否为本地 ip 来实现的. 

setlocal 和 whomi 接口实现.

[2.26]
测试:
主节点在父进程, 从节点在子进程, 会出现信号量阻塞.

今天做什么, 我也不知道, 没有安排.
在三月份, 我将会开发完成关于订阅发布的内容, 并且在此期间尽可能多的补充专业知识, 包括基础的和扩展的.
在整个集群的分布中, 我们期望的是对整个产品的优化方案, 还有我所负责的模块的直接设计和实现. 
之后再是个人对其中软件系统的改进.

先做哪个, 感觉哪个都想做, 先做时序数据库.测试的话, 用半天左右, 下午搭建环境.

[2.29]
测试组件正在编写, 但是异常测试如何行动?其可扩展方面就是 act 所对应的方法, 而 act 所能够容纳的参数还是比较重要的.
异常测试可以采用, 在异常测试中, 有两种输入方式, 一个是缺少相关的包, 一个是元数据方面.
元数据方面, 可以通过采用不同的 mco 文件, 进行不同情况的输入.

如果是缺少相关的数据包, 最简单的是通过工具对数据包进行拦截, 或者在某个动作之后, 制造该目标节点不在场的情况, 以测试其相应内容.

按理来说应该使用回调函数, 将内容添加进去.

网络层, 可以完成.

[3.6]
测试用例编写， 应当采用更合理的方式和方法。
tzcase.h 中的函数实现更加多样化， 产生一个基于该文件的测试用例。
tzdbgenerator 中，生成的 .h 和 .c 文件进行分离, 更利于分割.

其应该生成的是什么, 兼顾可扩展方向,使其针对 一个 toml 生成一个测试用例, 并且携带 tzcase.h 为主要头文件的代码.

可以先针对现有内容, 进行优化, 最后反馈到 tzdbgenerator 中.

文件结构的部署:

cluster 下设定多个 mode, 由 generator 生成, 一个标准的 util 试点库, 后续可以提升为可复用的进程组件,

vector 中存储的元素居然指针无法修改, 这两者或许存储的不是同一个东西, 其进行了内存的拷贝.

多线程的测试方法, 调试起来十分费劲, 因为无法进行精确的 debug .

exception

session 没有找到.  edb 指针的问题, 应该是引用并没有符合.


Parent process: Forked child process PID::43789
Parent process: Forked child process PID::43790
Parent process: Forked child process PID::43791
 [pass] Open Database.
 [pass] Open Database.
 [pass] Open Database.
 [pass] ADD Node.
 [pass] ADD Node.
 [pass] ADD Node.
[sem]wait for /test.sem.dJrJb7
[sem]single for /test.sem.dJrJb7
[sem]wait for /test.sem.d77F13
[sem]wait for /test.sem.B6EYte
 [pass] Connect Database.
[sem]single for /test.sem.d77F13
[sem]wait for /test.sem.JZroNR
 [pass] Connect Database.
[sem]single for /test.sem.B6EYte
[sem]wait for /test.sem.AQpHmx
 [pass] Connect Database.
[sem]single for /test.sem.AQpHmx
[sem]wait for /test.sem.CsGH0S
log....
log....
log....
log....

commit success
 [pass] Insert Data.
 [pass] Search Database.
[sem]single for /test.sem.CsGH0S
[sem]wait for /test.sem.ImLwv3
 [pass] Search Database.
[sem]single for /test.sem.JZroNR
[sem]wait for /test.sem.blGHJY
log....

commit success


能不能来一个这样的 log :
```bash
---------------------- test name ----------------------------------
| test1      | test2      | test3      | info   |
| ---------- | ---------- | ---------- | ------ |
| act1[code] |            |            | [info] |
|            | act2[code] |            |        |
| act3       |            |            |        |
|            |            | act4[code] |        |
|            | act5       |            |        |
|            | act6       |            |        |
```

多对象调试 log .
```C++
node_max_num
name[]
level
base_vchar
code
info

for(name){
    print
}

log_base_info_max_len
p = '|'
fomt_base = "%s|"
placeholder = '\t';

void log_mulit_class(info, code, base_vchar, level){

for(int i = 0; i < node_max_num:i ++){
    print(p);
    if(level == i){
        int curr_len = log_base_info_max_len - sizeof(info) - sizeof(code);
        print(info);
        print(code);
        for(int j = 0; j < (curr_len + 4)/4; j ++){
            print(placeholder);
        }
    }else{
        for(int j = 0; j < (log_base_info_max_len + 4)/4; j ++){
            print(placeholder);
        }
    }
    print(p);
}
printf("%s\n", base_vchar);

}
```

简单版本:
```C++
char * fomt_all = create(node_max_num); // "|%s|%s|%s|%s|%s|%s|%s|\n";
printf(fomt_all, );

```


|                       |OPEN0          |                       |Open Database.
|OPEN0          |                       |                       |Open Database.
|                       |                       |OPEN0          |Open Database.


\033[32mpass\033[0m

\033[35m%s\033[0m


```bash
|[replic_1]      |[master]        |[replic_2]      |
|                |[Forked]:0      |                |74814
|[Forked]:0      |                |                |74814
|                |                |[Forked]:0      |74814
|[OPEN]:0        |                |                |Open Database.
|                |                |[OPEN]:0        |Open Database.
|                |[OPEN]:0        |                |Open Database.
|                |                |[AddNode]:0     |
|[AddNode]:0     |                |                |
|                |                |[SEM_SINGLE]:0  |/test.sem.yAympg
|                |[AddNode]:0     |                |
|[SEM_WAIT]:0    |                |                |/test.sem.e7dJhS
|                |[SEM_WAIT]:0    |                |/test.sem.yAympg
|                |                |[SEM_WAIT]:0    |/test.sem.exAl7d
|                |[CONNECT]:0     |                |
|                |[SEM_SINGLE]:0  |                |/test.sem.e7dJhS
|                |[SEM_WAIT]:0    |                |/test.sem.pPOoxV
|[CONNECT]:0     |                |                |
|[SEM_SINGLE]:0  |                |                |/test.sem.exAl7d
|[SEM_WAIT]:0    |                |                |/test.sem.1HXtru
|                |                |[CONNECT]:0     |
|                |                |[SEM_SINGLE]:0  |/test.sem.pPOoxV
|                |                |[SEM_WAIT]:0    |/test.sem.6i8sTi
log....
log....
log....
log....

commit success
|                |[INSERT]:0      |                |
|                |[SEARCH]:0      |                |
|                |[SEM_SINGLE]:0  |                |/test.sem.6i8sTi
|                |[SEM_WAIT]:0    |                |/test.sem.IB17Nk
|                |                |[SEARCH]:0      |
|                |                |[SEM_SINGLE]:0  |/test.sem.1HXtru
|                |                |[SEM_WAIT]:0    |/test.sem.L7lJ9o
log....

commit success
```

发现了吗, 这种基本的错误, 想象中是多个节点都会一起阻塞等待, 但是实际上只有一个节点会等待另一个节点.
所以, 除非动作添加的顺序是能够闭环的, 否则 , 运行并不是和想象的一样, 如果要达到这样的效果, 应该给现有的所有队列都建立此种 wait.

不不, 不是必要的, 因为只要构成一个闭环就可以的话, 之前的逻辑就可以.

最后发现顺序不一致其实只是 log 的输出与 level 相关, 而 head 的输出以 vector 的顺序有关, 造成显示不正确.


```bash
|[replic_1]      |[master]        |[replic_2]      |
|[Forked]:0      |                |                |84954
|                |[Forked]:0      |                |84954
|                |                |[Forked]:0      |84954
|                |[OPEN]:0        |                |Open Database.
|                |                |[OPEN]:0        |Open Database.
|[OPEN]:0        |                |                |Open Database.
|[AddNode]:0     |                |                |
|                |[AddNode]:0     |                |
|                |                |[AddNode]:0     |
|[SEM_WAIT]:0    |                |                |/test.sem.LQx91g
|                |[SEM_WAIT]:0    |                |/test.sem.rGud5v
|                |                |[SEM_SINGLE]:0  |/test.sem.LQx91g
|                |                |[SEM_WAIT]:0    |/test.sem.8OQS00
|[CONNECT]:0     |                |                |
|[SEM_SINGLE]:0  |                |                |/test.sem.rGud5v
|[SEM_WAIT]:0    |                |                |/test.sem.SXnsb7
|                |[CONNECT]:0     |                |
|                |[SEM_SINGLE]:0  |                |/test.sem.8OQS00
|                |[SEM_WAIT]:0    |                |/test.sem.sPjs8o
|                |                |[CONNECT]:0     |
|                |                |[SEM_SINGLE]:0  |/test.sem.SXnsb7
|                |                |[SEM_WAIT]:0    |/test.sem.5ltk5q
log....
log....
log....
log....

commit success
|[INSERT]:0      |                |                |
|[SEARCH]:0      |                |                |
|[SEM_SINGLE]:0  |                |                |/test.sem.5ltk5q
|[SEM_WAIT]:0    |                |                |/test.sem.ZLw5Vy
|                |                |[SEARCH]:0      |
|                |                |[SEM_SINGLE]:0  |/test.sem.sPjs8o
|                |                |[SEM_WAIT]:0    |/test.sem.3GJmqu
log....

commit success
```

[3.16]
做一个测试机公共组件.所有文件都放到该文件下.
在必要的时候可以嵌入到其他的组件中使用.但其实并没有说考虑到那么远的地方.

model 存放到指定的地方, .h 和 .cpp 都放在一起.

[4.26]
要改成连接复用，则需要使用到 select 模型解决多路复用的问题，但是如何实现多路复用。
是否能够在天脉上使用 select 接口。天脉上是有一个 select 接口的。
如果不用 select 接口如何实现。

select 天脉能够支持。

IO 模型全量测试。

[4.30]
在 node 节点上添加对现有连接的维护操作。
将 msg 类和发送句柄进行剥离。

[5.7]
| system | WIN32 | LINUX_x86 | ACORE_OS |
| :----- | :---: | :-------: | :------: |
| select |   V   |     V     |    V     |
| epoll  |   X   |     V     |    X     |

基本测试完毕。
之后:
1. 日志优化，将多级日志支持到日志系统；
2. 系统适配，考虑在天脉上进行试验 select 模型；
3. 更多的测试结构；

[5.20]
编写一个 UDP 协议的替换法则。
这个应该如何实现。最快的是，直接用协议替换，也不用监听了，监听直接监听 UDP 即可。
两种方法:
1. 在上层直接实现；
2. 在 IO mode 中嵌套实现，这个还需要一个协议规则。

[5.25]
进行测试，并且将 cluster 中的内容进行替换。

面向 CLNode/MasterNode/ReplicaNode 进行修改。

遇到个问题，无法将数据发送出来，因为每次我们读取数据都是读取 8196 bit， 超过 8196 的时候，只读取部分，就导致忽视了帧尾，造成无法识别。
所以，修改 connect 每次都读出尽可能大的数据量。

udp 中，如果发送的包数据比较多，那么可能 CONNECT 中的 qbuffer len 不够。
发送的包太大也会报错。
104016

所以，需要对 udp 进行分包处理。

总之:
1. udp 分包；
2. connect 调试加上 get_error ;
3. debug 日志整理；
4. udp 的重传机制

