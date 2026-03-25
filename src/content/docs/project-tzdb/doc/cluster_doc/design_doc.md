---
title: "design_doc"
description: "design_doc"
---

﻿# TZDBD 设计文档
## 实现细节
### 集群元信息管理
集群结构定义是在`.mco`文件中进行定义的.  
**example1**   
```C++
master:[tb1,tb2,tb3]:192.168.1.101:7777;
replica:[tb1,tb2]:192.168.1.102:7778;
replica:[tb1,tb2,tb3]:192.168.1.103:7779;
replica:[tb1,tb2,tb3]:192.168.1.104:7780;
replica:[tb1,tb2,tb3]:192.168.1.105:7781;
```
#### 集群元信息处理  
首先, 在`mcowrap.h`定义如下2个结构体:  
```C
typedef struct edb_cluster_table_t {
    uint2  table_index; //表偏移 class_inf结构中的偏移
} edb_cluster_table_t; 
typedef struct edb_cluster_node_t {
    uint1  node_type;; // 0.master/1.replica
    uint1  node_id; // 节点id，master节点默认设置为0, 副本节点由1开始递增.
    uint1  cluster_table_count;   //cluster_tables大小
    edb_cluster_table_t* cluster_tables; //表信息
    char* ip; // 节点ip地址
    uint1 port; // 节点监听端口号.
}edb_cluster_node_t;
```
在`mcowrap.h`中的`edb_dictionary_t_`的结构中添加如下字段：  
```C++
typedef struct edb_dictionary_t_ {
    ...
    uint2 n_desc_cluster; /// 节点数量.
    edb_cluster_node_t* v_desc_cluster;//节点信息
    ...
}edb_dictionary_t, * edb_dict_h;
```
将`example1`中定义的`.mco`文件使用`DDL`工具解析生成`.h`和`.c`文件, 其中,在`.c`文件中的`dbNamexxx_get_dictionary`将有如下定义:  
```C
{
    static  edb_cluster_table_t v_cluster_table_info[14] = {
        {1},{2},{3},
        {1},{2},
        {1},{2},{3},
        {1},{2},{3},
        {1},{2},{3},
    };
    static  edb_cluster_node_t v_cluster_node_info[5]={
        {0,0,3,(v_cluster_table_info+0),"192.168.1.101",7777},
        {1,1,2,(v_cluster_table_info+3),"192.168.1.102",7778},
        {1,2,3,(v_cluster_table_info+5),"192.168.1.103",7779},
        {1,3,3,(v_cluster_table_info+8),"192.168.1.104",7780},
        {1,4,3,(v_cluster_table_info+11),"192.168.1.105",7781},
    };
    dict.v_desc_cluster = v_cluster_node_info;
    dict.n_desc_cluster = 5;
};
```
#### 集群元信息解析
集群元数据信息解析需要将`DDL`工具生成的`.c`文件中的信息解析出来，例如可以在`AeCILocal.h`中添加一个函数，用于解析集群元数据信息：  
```C++
class dbAeCI 
{
    ...
public:
    int parseClusterMetaInfo(edb_dictionary_h dict);
    ...
};
```
这个函数的输入是一个`edb_dictionary_h`类型的参数，用于从中解析出集群元信息.
#### 集群元信息存储
对于集群元信息的存储，一种实现方式是创建一个普通表，将这些元信息进行存储，例如，可以设计如下结构的表：  
tz_d_cluster_meta_info
| node_name(string) | id(int) | tables(array) | ip(string) | port(uint16) |  
|---|---|---|---|---|  
| "master" | 0 | arr_ptr(1,2) | "192.168.1.101" | 7777 |  
| "replica" | 1 | arr_ptr(1,2,3) | "192.168.1.102" | 7778 |  
| "replica" | 2 | arr_ptr(1,2,3) | "192.168.1.103" | 7779 |  
| "replica" | 3 | arr_ptr(1,2,3) | "192.168.1.104" | 7780 |  
| "replica" | 4 | arr_ptr(1,2,3) | "192.168.1.105" | 7781 |  
对于这个表的创建，可在`Database.h`的`dbPredefinedIds`枚举中预留出`OID`， 如下：  
```C++
enum dbPredefinedIds {
	DB_INVALID = 0,     ///< 无效ID
	DB_METATABLE_ID,    ///< 元表信息ID
#ifndef DEP_FUNC_MEM
    DB_FIRSTUSER_ID,
#endif
    DB_CLUSTER_METATABLE_ID, /// 集群元信息表ID
	};
```
#### 集群元信息查询
由于使用一张`普通表`存储集群元信息，所以集群元信息的查询可直接获取指定名称的表(Database.cpp::9167)
```C++
DBTableDescriptor* dbDatabase::findTableByName(char const* name)
```
当获取到这个表后，可以新建一个`DBAnyCursor`的对象，然后直接调用`select`进行查询.

### 事务  
#### 事务开启  
由于整个集群的同步需要进行节点之间的通信， 首先需要将节点实例化到某处，例如，可以将节点作为`DBCompiler.h`中`DBDatabaseThreadContext`类的成员，这样这个对象将可以通过事务指针进行访问，如：  
```C++
class DBDatabaseThreadContext : public db2List {
public:
    Node* node;
}
```
##### 用户调用从节点
当用户调用一个从节点开启事务时，首先调用`edb_trans_start`接口，开启事务，同时，需要调用`节点`提供的接口，将事务请求发送到主节点，主节点根据事务类型，判断从节点本次是否可以开启事务.可以在`Database.cpp`的`beginTransactionEx`函数中直接调用`节点`提供的接口,如：  
```C++
if (node->type() == EDBDNodeReplica)
    /// 会在此阻塞.
    ((ReplicaNode*)node)->request_trans_start();
```

##### 用户调用主节点  
当用户调用一个主节点开启事务时，无需发送事务开启请求.
#### 写事务日志
写事务日志直接继承内核中的`DBFileTransactionLogger`，如：  
```C++
class TransLogWriter : public DBFileTransactionLogger {
    ...
    void write();
};
```
然后在每次事务提交时（例如在`dbDatabase::beforeCommitProc`函数中）调用`write`函数即可，写的内容是`DBFileTransactionLogger`中的一个成员`buf_`.
#### 事务提交  
##### 用户调用从节点
当用户调用从节点接口进行事务提交时，首先将自身事务进行提交，然后将事务日志发送到主节点，调用发送事务日志（请求提交事务）如下：  
```C++
if (node->type() == EDBDNodeReplica) {
    int rc = ((ReplicaNode*)node)->request_trans_commit();
    if (rc != EDB_OK) {
        return rc;
    }
}
```
最后判断返回，如果提交失败，需要返回给用户.
##### 用户调用主节点
当用户调用主节点接口进行事务提交时，同样先将自身事务进行提交，然后将事务日志同步到其他副本节点，调用发送事务日志接口如下：  
```C++
if (node->type() == EDBNodeMaster) {
    int rc = ((MasterNode*)node)->send_translog_to_other_replica();
    if (rc != EDB_OK) {
        return rc;
    }
}
```
若`rc`不是`EDB_OK`，则直接返回给用户，用户需要调用`强制回滚`.
### 节点设计  
#### 节点抽象类设计
#### 主节点设计
#### 从节点设计  

### 网络传输
## 模块接口
