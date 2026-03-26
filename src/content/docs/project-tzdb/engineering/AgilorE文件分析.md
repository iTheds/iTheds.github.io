---
title: "AgiloreFile分析"
description: "AgilorE 文件结构、接口与内存机制分析"
---


# AgilorE文件初步分析

嵌入式内存关系型数据库

## 项目分析

AgilorE体现为lib库文件。
主要编辑的是AeClLocal.cpp。
eXtremeWrap文件中是所有的测试用例，用于测试上层进行调用的效率。

## 项目结构

### 文件分析

主要文件:

AeCI.h : 
    AeCIResultCode:错误码， rc开头。
    AeCIVarType:数据类型描述，加上_t为该数据结构。
    aeci_()接口函数。
    AeCIFieldFlags: 索引类型选择。
    aeci_struct_descriptor:被`数据表`数据结构使用。
    aeci_index_descriptor: 索引结构。
    aeci_field_descriptor: `数据表`数据结构。
    aeci_field_layout: 
    aeci_table_descriptor:
    AeCIErrorClass:错误处理，错误码，ec开头。
    aeci_database_monitor:数据监视结构指针。调用方法通过结构指针返回如下值:
        n_readers: 共享锁数量
        n_writers: 互斥锁数量
        n_blocked_reader: 等待共享锁的线程数n_blocked_writers: 等待互斥锁的线程数
        n_users: 使用数据库的进程数database_size: 数据库大小
    
AeCILocal.h : 
    *session_desc：
    *statement_desc：
    *sql_scanner：
    fixed_size_object_allocator：被descriptor_table所继承。
    descriptor_table：
    DBList：数据库链表。含有dbDatabase数据库类。
    dbAeCI：主要操作类。在功能上形成特有的作用域。
AeCILocal.cpp : 

AgilorE.h :
	包含若干DB_头文件()。
    似乎是主要头文件。

AeCIProto.h : 
    协议头文件，`定义了`关于包的函数。以及指令等。
    AeCICommands：基本命令，执行SQL查询操作。aeci_cmd_开头。
    fd2aeci_type_mapping: 定义了一些数据类型的int数组。

BaseFile.h : 
    dbFile: 文件操作类，包含主要文件操作，用于写入磁盘。在功能上形成特有的作用域。

Database.h : 
    *dbMonitor:
    dbL2List:双线链表。简易。
    dbVisitedObject: 已访问对象。
    dbDatabase：数据库类，包含基本对于数据库的操作等。内涵OpenParameters等数据结构。在功能上形成特有的作用域。
    dbSearchContext：搜索上下文。

DatatypeExtend.h:
    扩展的数据类型。

BaseSocket.h :
    socket_t: 抽象类，以虚函数的方式定义了socket的基本操作。

W32Sock.h : 
    *win_socket: 继承socket_t，
    win_socket_library: 负责socket中的WSA版本定义。
    *local_win_socket: 继承socket_t，

W32Sync.h :
    dbMutex: 定义了互斥锁，基于CRITICAL_SECTION，利用windows系统临界区封装数据库互斥锁。

BaseSync.h :
    Intertask synchonization primitives.
    *dbSystem:
    *dbCriticalSection:
    dbSmallBuffer: 定义了一段缓冲区的类，和基本的操作。
    *dbThreadPool: 
    *dbPooledThread:

DBBTree.h:
    数据库主要文件，体现了数据库整体结构。
    dbBtreeNode : B树节点类，包含B树节点的结构，节点中记录的插入、删除、搜索和更新等。
    dbBtree : B树类，包含B树的结构，树记录的插入、删除、搜索和更新等。

### WSync.h

dbMutex : 利用 windows 系统临界区封装的数据库互斥锁.

### BaseSync.h

该文件中由以下的结构体：

dbSystem : 实际上是 GetTickCount() 获取系统经过的 毫秒数.

dbCriticalSection : 封装的 dbMutex ,将锁的开关使用构造函数和析构函数体现.

### DBHashtab.cpp

我觉得应该建立 test 来查看其功能。

$(SolutionDir)inc\include\tzdbcom;$(SolutionDir)inc\include;inc;%(AdditionalIncludeDirectories)

### w32sock

结构体 ：

socket_t(BaseSOcket.h)
local_win_socket(W32Sock.h)
	class local_win_socket : public socket_t
win_socket(W32Sock.h)
	class win_socket : public socket_t

Struct base on socket_t, others all inherit from it.

### 其他

---
> #include文件夹begin

mco.h :
    声明mco_()接口。其定义在AeCILocal.cpp中。

> #include文件夹end
---
---
> #sql语句执行文件begin

DBCompiler.h:
    条件表达式编译器。
    dbvmCodes
    dbStrLiteral
    dbExprNodeAllocator
    dbExprNode
    dbExprNodeSegment
    dbBinding
    dbOrderByNode
    dbFollowByNode
    dbDatabaseThreadContext : public dbL2List
    dbInheritedAttribute
    dbStringValue

DBQuery.h :
    dbQueryElement : 查询元素。

> #sql语句执行文件end
---

UserAuthorization.cpp：
    用户权限管理，其中用户名存在xml文件中。

wwwapi.cpp:
    web应用cpp。未有细看。

xml.cpp:
    xml的相关导入导出，未有细看。

## 内存分布

总的逻辑情况。

### oid

oid 唯一标识一条数据或者一个页面。
oid 存的其实是一个地址偏移量和掩码所做运算的值。

数据库中分配了一个连续的内存空间存储数据，因为该部分内存的管理是以 16 字节对齐的，所以其数据的地址 32 位最后的最后 8 个字节都是一个固定的值 0。
所以，oid 中可以存储地址，来找到需要的数据内容，最后的 8 个字节可以存储唯一标识数据类型的"掩码"，通过该掩码得知其数据类型。
故此，oid 存储的内容可以明确了。

## 接口函数分析

dbAeCI：一个namespace。

创建数据库：/*men缓存区，128 total size，一般的，缓存区men的大小是包含数据库大小和xml文件等的大小的*/

    rc = mco_db_open(dbname, treedb_get_dictionary(), mem, 128, (uint2)0);//依托于db name(const char * dbname = "SimpleDb";)
连接数据库：关联已经创建的数据库dbname和db。

    rc = mco_db_connect(dbname, &db);//db连接到dbname。??所以整个系统是根据关键词来进行分配数据库的吗

事务

	rc = mco_trans_start(db, MCO_READ_ONLY, MCO_TRANS_FOREGROUND, &t);//开启一个事务指定到t，事务权限根据第二参数确定。
	rc = mco_trans_commit(t);//提交事务
	mco_trans_rollback(t);//事务回滚
查询

	rc = CurrentWarnDB_CurrentWarn_search(t, &csr, MCO_LT, 50000, 0);//MCO_LT小于
游标位置

	rc = CurrentWarnDB_CurrentWarn_index_cursor(t, &csr);
游标启示位置

	rc = mco_cursor_first(t, &csr);
单条数据删除操作

	CurrentWarnDB_delete(&rec);
	CurrentWarnDB_from_cursor() 
数据删除所有：

	classname_delete_all(t);
获取字段到参数warningCode

	CurrentWarnDB_warningcode_put(&rec, warningCode);
Record_index1_pattern_search：

	Record_index1_search(t, &csr, MCO_GT, 0, 5, 4.1, "Record H", 64);//
```C+_+
MCO_RET  Record_index1_pattern_search( 
	mco_trans_h t, 
	mco_cursor_h c, 
	/*INOUT*/ void *allocated_pattern, 
	mco_size_t memsize , 
	uint4 uint4Value_key_, 
	int4 int4Value_key_, 
	float floatValue_key_, 
	const char *stringValue_key_, 
	uint2 sizeof_stringValue_key_ )
{ mco_external_field_t a_ [5];
  mco_external_field_h pa_ = a_;
  pa_->field_type = 3; pa_->v.u4 = uint4Value_key_; pa_++; 
  pa_->field_type = 6; pa_->v.i4 = int4Value_key_; pa_++; 
  pa_->field_type = 10; pa_->v.flt = floatValue_key_; pa_++; 
  pa_->field_type = 8; pa_->v.ptr_size = sizeof_stringValue_key_; pa_->ptr = stringValue_key_; 
  (pa_+1)->field_type=0;
  return mco_pattern_search(t, c, allocated_pattern, memsize, a_);
}
```

Record_index2_search:

```C++
MCO_RET Record_index2_search( 
	mco_trans_h t, 
	/*INOUT*/ mco_cursor_h c, 
	MCO_OPCODE op_, 
	int4 int4Value_key_, 
	float floatValue_key_, 
	const char *stringValue_key_, 
	uint2 sizeof_stringValue_key_, 
	uint4 uint4Value_key_ )
{ mco_external_field_t a_ [4];
  mco_external_field_h pa_ = a_;
  pa_->field_type = 6; pa_->v.i4 = int4Value_key_; pa_++; 
  pa_->field_type = 10; pa_->v.flt = floatValue_key_; pa_++; 
  pa_->field_type = 8; pa_->v.ptr_size = sizeof_stringValue_key_; pa_->ptr = stringValue_key_; pa_++; 
  pa_->field_type = 3; pa_->v.u4 = uint4Value_key_; 

  return mco_w_tree_find(t,c,op_,a_);
}
```

### 内存分析

删除的时候疑似未有删除内容。

首先，如果内存是一样的，先执行不同变量的插入操作，再执行后续。
验证：
Updata_test();
与：
insert_test();
Updata_test();
结果，insert之后的更新是有数据的。同理执行删除操作亦是如此。
所以内存是共用的。不过也有可能因为机制问题而改变。

### 多线程

定义了线程池类 dbThreadPool ，每个线程单位抽象成类 dbPooledThread 。
1. 每个线程通过两个信号量保证线程的执行顺序可以在主线程和任务线程之间切换。
2. `dbPooledThread* create(dbThread::thread_proc_t f, void* arg)` : 创建一个线程或使用空任务队列中的线程，并打开 startSem 开始执行该任务，执行完之后释放 readySem 。
3. `void join(dbPooledThread* thr)` : 通过 readySem 等待至该线程类执行完毕，如果完毕，则将该线程的 startSem 关闭，使得任务线程进入等待状态， 并将该空的任务线程添加到空任务线程队列 freeThreads 中。

### 开启事务


        //dbAeCI::instance.transStart(session, DB_READ_ONLY, DB_TRANS_FOREGROUND, &temp);


        db_session_->db->beginTransaction(dbDatabase::DB_SHARED_LOCK);

## 数据表的构建

一般地，我们使用 mco 文件生成相应表的接口。

`declare database CurrentWarnDB;`语句决定了数据库名称。

提前声明 enum 和相关的结构体。

`list;`表示生成 list cursor 接口，用于如果没有索引进行全表查询的几口。。
	tree<Warn_Level>warn_index;
表示生成变量 Warn_Level 的 B 树索引，名称为 warn_index。
	tree<warningcode, warn_history_counter>CurrentWarn;
表示生成有多个变量的索引列。

tree 表示的是 B 树索引。KDtree 表示生成 KD 树索引。

## 数据结构

主要是两个句柄。会话句柄和语句句柄。
会话句柄可以封装成连接句柄。

MCO_RET： 状态标志符。
MCO_RET_E_：一个枚举表，存储各种状态。
MCO_S_OK: 何时改变，改变多少。

```C++
mco_db_h db; //数据库连接
mco_cursor_t csr; //游标
mco_trans_h t; //事务
MCO_RET rc = MCO_S_OK; //状态标志
```

Record:
```C++
#define int1      signed<1>
#define int2      signed<2>
#define int4      signed<4>
#define uint8   unsigned<8>
#define uint4   unsigned<4>
#define uint2   unsigned<2>
#define uint1   unsigned<1>

declare database treedb;

class Record
{
   uint4 uint4Value;
    int4 int4Value;
   float floatValue;
   string stringValue;
   tree<uint4Value,int4Value,floatValue,stringValue>index1;
   tree<int4Value,floatValue,stringValue,uint4Value>index2;
   tree<floatValue,stringValue,uint4Value,int4Value>index3;
   tree<stringValue,uint4Value,int4Value,floatValue>index4;
};
```

## 技术栈

使用的依赖项.

STL库可以使用。
可以使用多线程。

## 测试用例

Record 依赖于tree.h文件，内部是下一层的测试文件。
告警，飞行

[CursorTest] 用文件导入导出来测试游标，倒出文件只用了wringCode.
[multiIndex_mix] 测试函数`Record_index1_search(t, &csr, MCO_GT, 1, 5, 4.1, "Record H", 64);`和`Record_index2_search(t, &csr, MCO_GT, 1, 5, 4.1, "Record H", 64);`等。
[multiIndex_nostruct] Record相关
[multiIndex_nostruct_desc] 降序测试，Record
[multiIndex_struct]
[multiIndex_struct_desc]
[multiIndex_unique]
[Multithread6] PFLText_SolutionText100_write_handle飞行测试
[mutilindex] 告警 查询测试
[MutliThreads] 多线程 Record
[MutliThreads2] 多线程 Record
[MutliThreads3_Transtion] 多线程 Record
[MutliThreads4] 多线程 告警
[MutliThreads5] 多线程 告警
[oid_test] treedb_oid 类测试
[performanceTest] 告警 基本的用例
[singletable]
[singletable_struct]
[singletable_structs] 最基本的用例
[structArrayTest]
[struct_xml_test]
[testMutliThreads]
[xml_test]

## 问题记录

### 文件路径问题 mco 层

没有办法去设定数据库存储的绝对路径。因为 open 中 checkName 会过滤 // 和 : 字符，并且在 dbDatabase.open 中将 dbName 设置为大部分的事件、线程、信号量资源的名称，这些名称对于含有上述字符串的变量将会申请相应资源失败。

CreateMutex(AGILORE_SECURITY_ATTRIBUTES, true, name);

在这种情况下，数据库名称已经作为一种广义的资源描述字符，不允许有非法字符串。

而 aeci 层将数据库名称和路径名称分离，所以可以实现。

如果需要更改需要对数据库更了解。

## 修改内容记录 by iTheds

[10.18]
修改SQLTOOL部分，添加功能宏定义。
其中锐华天脉需要添加SQLTool类中的额外内存 memAddr，以适应接口 dbDataBase::open()。


## 代码留存

	int record = 5000;
    
    int data_space = 8 * 1024 * 1024

### 插入操作

	/*为xx而进行的生成数据(插入数据动作)*/
	//rc = mco_trans_start(db, MCO_READ_WRITE, MCO_TRANS_FOREGROUND, &t);
	//for (i = 0; i < record && MCO_S_OK == rc; i++)
	//{
	//	rc = CurrentWarnDB_new(/*t*/t, &rec); //缓冲区分配

	//	if (MCO_S_OK == rc) {

	//		/*整型数据插入*/
	//		CurrentWarnDB_warningcode_put(&rec, tempint);
	//		CurrentWarnDB_IntWarnCode_put(&rec, tempint + 1);
	//		CurrentWarnDB_Warn_Level_put(&rec, tempint + 2);

	//		CurrentWarnDB_date_calendartime_write_handle(&rec, &dch);
	//		DATE_CALENDARTIME_year_put(&dch, 2020);
	//		DATE_CALENDARTIME_month_put(&dch, (tempint % 12) + 1);
	//		DATE_CALENDARTIME_day_put(&dch, (tempint % 31) + 1);

	//		CurrentWarnDB_time_calendartime_write_handle(&rec, &tch);
	//		TIME_CALENDARTIME_date_time_put(&tch, (int8)tempint + 1);

	//		CurrentWarnDB_acknowledgeMark_put(&rec, tempint % 255 + 1);
	//		CurrentWarnDB_confirmMark_put(&rec, tempint % 255 + 2);
	//		CurrentWarnDB_exist_notexist_put(&rec, tempint % 255 + 3);
	//		CurrentWarnDB_PFL_send_flag_put(&rec, tempint % 255 + 4);
	//		CurrentWarnDB_exist_counter_put(&rec, tempint % 1024 + 1);
	//		CurrentWarnDB_notexist_counter_put(&rec, tempint % 1024 + 2);
	//		CurrentWarnDB_statechange_put(&rec, STATE_CHANGE_TYPE(tempint % 3));
	//		CurrentWarnDB_pfl_statechange_put(&rec, STATE_CHANGE_TYPE((tempint + 1) % 3));
	//		CurrentWarnDB_ms_icaws_flag_put(&rec, tempint % 255 + 5);
	//		CurrentWarnDB_from_vms_flag_put(&rec, ICAWS_FROM_VMS_TYPE(tempint % 4));
	//		CurrentWarnDB_icaws_continue_time_counter_put(&rec, tempint % 255 + 6);
	//		CurrentWarnDB_duration_time_put(&rec, (int8)tempint + 2);
	//		CurrentWarnDB_warn_history_counter_put(&rec, (uint2)tempint + 3);
	//		tempint++;
	//		//printf("任务1插入%d条数据\n ", tempint);

	//	}
	//}

###  时间计算

```C++
class stop_watch
{
public:
	stop_watch()
		: elapsed_(0)
	{
		QueryPerformanceFrequency(&freq_);
	}
	~stop_watch() {}
public:
	void start()
	{
		QueryPerformanceCounter(&begin_time_);
	}
	void stop()
	{
		LARGE_INTEGER end_time;
		QueryPerformanceCounter(&end_time);
		elapsed_ += (end_time.QuadPart - begin_time_.QuadPart) * 1000000 / freq_.QuadPart;
	}
	void restart()
	{
		elapsed_ = 0;
		start();
	}
	//微秒
	double elapsed()
	{
		return static_cast<double>(elapsed_);
	}
	//毫秒
	double elapsed_ms()
	{
		return elapsed_ / 1000.0;
	}
	//秒
	double elapsed_second()
	{
		return elapsed_ / 1000000.0;
	}

private:
	LARGE_INTEGER freq_;
	LARGE_INTEGER begin_time_;
	long long elapsed_;
};
```
