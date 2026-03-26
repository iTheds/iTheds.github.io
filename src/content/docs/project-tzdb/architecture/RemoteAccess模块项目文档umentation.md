---
title: "RemoteAccess模块项目文档umentation"
description: "远程访问模块项目文档整理"
---


# 远程访问模块项目文档

记录于7月9日，至此日，仅有ODBC与C++插件。
记录于8月18日，不需要体现工作量，应该重点将工作内容描述清楚。
记录于10月15日，目前已经编写完成基本功能。
记录于2022年1月10日，自从过第一个节点之后很少去了解这个项目了。目前需要进行完善。

## 一、需求分析(模块目标)

* 远程访问模块为目前DB的模块，负责远程通信。
* 对远程程序提供访问服务，可以适应C/C++，ODBC，JAVA(JDBC)，Python的远程访问。
* 符合ODBC访问标准。

* 符合嵌入式设备的高效代码
* 应该适应如下网络模型：
    1. 基本C/S架构通信，在局域网内的通信，在互联网上的通信。
    2. 嵌入式设备中本地网络的直接通过ODBC进行调用。

## 二、概要设计(参照文档)


> Omitted unresolved image: image (ODBC_Research\ODBC概要设计.png)


### 1. 程序形式

其中远程访问模块以服务的方式存在，常驻操作系统。

ODBC:
* ODBC驱动程序，dll库
* ODBC组件安装程序，exe程序
* ODBC组件设置程序，dll库

通过调用dll库，应用程序可以连接远程的、局域网内的数据库。
而dll库中内容应该存在基本的服务端server性质，在执行时以服务的形式存在。

 /*IN*/ mco_trans_h t
/*IN*/uint2 class_code
/*OUT*/ mco_class_stat_h  stat
 /*事务句柄*/
/*表序号*/
/*表信息句柄*/

//ret = SQLConnect(hdbc, (SQLWCHAR*)L"MYSQL_TEST_1_64", SQL_NTS, (SQLWCHAR*)L"itheds", SQL_NTS, (SQLWCHAR*)L"Test404#", SQL_NTS);
//ret = SQLConnect(hdbc, (SQLWCHAR*)L"SQL_Server", SQL_NTS, (SQLWCHAR*)L"sa", SQL_NTS, (SQLWCHAR*)L"1234567", SQL_NTS);

my JDBC Driver

jdbc:myapp://host:port/catalog

### 2. 基本功能
 
实现基本的功能并保证其健壮性。

最为主要的是远程连接管理和通信模块。
在确定基本功能作用的基础上，满足并封装成ODBC标准接口。

从系统环境出发衍生到功能对ODBC标准接口分类如下：

句柄相关操作：
SQLAllocHandle | 
SQLFreeHandle | 
SQLCancelHandle | 

首先是系统总体的体现，和环境句柄SQLHENV相关：
接口 | 备注| 参数规则 
|-:|:-:|:-:| 
SQLGetEnvAttr | 检索并返回环境属性的当前设置
SQLGetInfo | 返回有关与连接关联的驱动程序和数据源的一般信息
SQLSetEnvAttr | 设置管理环境指定的属性

#### 远程连接管理

管理连接。拟实现连接池。
需不需要连接池，是长连接还是短连接。
怎么样实现连接池的问题。
长连接和短链接概念是针对与TCP来说的。

关于连接池：连接池的概念在ODBC中也有涉及。"连接池由驱动程序管理器维护"，那么连接池是驱动还是驱动管理器完成的？
该部分表示在`驱动程序管理器中有对驱动程序和应用程序之间的连接管理连接池`，与需要实现的服`务端和客户端之间的连接池`并不重叠冲突。
所以连接池是需要实现在核心代码中的。以长连接的方式。
连接池是使用在server中的。因为一个server可以响应多个client的连接。

但是，还有一种情况，一个应用程序中是可以对一种数据库源建立多个连接的。
所以在驱动管理器或者驱动程序中，也会存在一个连接池，所以这部分连接池又怎么考虑呢？此部分暂时存疑[???]//TODO。

指代和大部分的连接句柄SQLHDBC有关。

接口 | 备注| 参数规则 
|-:|:-:|:-:| 
SQLConnect | 建立连接
SQLDriverConnect | 驱动连接
SQLDisconnect | 关闭连接句柄

SQLGetFunctions | 返回有关驱动程序是否支持特定 ODBC 函数的信息
SQLGetConnectAttr | 得到连接句柄的相关属性信息
SQLBrowseConnect | 枚举连接到数据源所需的属性和属性值的迭代方法
SQLSetConnectAttr | 设置管理连接方面的属性

#### SQL语句相关

进行对SQL语句的处理。
大部分与语句句柄SQLHSTMT有关。游标、光标、描述符。
需要提取出需要实现的参数结构。

接口 | 备注| 参数规则 
|-:|:-:|:-:|
SQLExecDirect | 直接执行可准备的语句
SQLPrepare | 准备执行语句
SQLExecute | 执行准备好的语句
SQLFetch | 提取下一行的结果集
SQLFetchScroll | 从结果集提取指定的数据行集
*SQLGetData | retrieves(检索)数据对单个列结果
*SQLMoreResults | 确定是否有更多可用的结果，跳过无关操作，移动到下一个结果集
SQLCancel | 取消对语句的处理
SQLFreeStmt | 停止与语句句柄的关联处理等

SQLNativeSql | 返回驱动程序修改的SQL字符串
SQLSetPos | 设置行集中的光标位置
SQLCloseCursor | 关闭已在语句上打开的游标并丢弃待办结果
SQLGetCursorName | 返回与指定语句关联的游标名称
SQLSetCursorName | 设置与指定语句关联的游标名称

信息相关：
接口 | 备注| 参数规则 
|-:|:-:|:-:| 
SQLDescribeParam | 与已准备的SQL语句关联的参数标记的描述
SQLDescribeCol | 返回结果集中指定一列的描述符
SQLNumParams | 返回SQL语句中的参数数目
*SQLParamData | 提供参数数据
SQLNumResultCols | 返回结果集中的列数
*SQLProcedureColumns | 返回输入和输出参数的列表
SQLRowCount | 返回受 `更新、 插入 或 删除` 语句`影响的行数`
*SQLSpecialColumns | 检索有关指定表中的列的唯一标识表中的行的一组最佳列；当事务更新行中的任何值时，自动更新的列
*SQLSetStmtAttr | 设置与语句相关的属性
SQLGetStmtAttr | 检索语句属性的当前设置
SQLGetTypeInfo | 检索有关数据源支持的数据类型的信息是否存在
*SQLStatistics | 检索`单个表和该表索引的关联信息`的统计，返回信息列表

SQLColumns | 返回指定表中的列名列表
SQLForeignKeys | 指定表中的外键列表
SQLPrimaryKeys | 返回构成表的主键列名称，以结果集形式
SQLTables | 返回存储在特定数据源中的表、目录或模式名称以及表类型的列表

SQLBulkOperations | 执行批量插入和批量bookmark操作

描述符相关：
SQLColAttribute | 返回结果集中列的描述符信息
SQLCopyDesc | 复制描述符
SQLSetDescField | 设置指定的描述符字段
SQLSetDescRec | 设置`影响了数据类型和缓冲区边界`的多个描述符集到列或者参数数据

权限：
SQLColumnPrivileges | 返回指定表的列和相关权限的列表
SQLTablePrivileges | 返回一个表列表以及与每个关联表的权限

缓冲区操作：
接口 | 备注| 参数规则 
|-:|:-:|:-:| 
SQLBindCol | 将应用程序数据缓冲区绑定到结果集中的列
*SQLBindParameter | 将缓冲区绑定到 SQL 语句中的参数标记

#### 通信协议设计

因为这一层是驱动程序和数据源之间的通信，所以协议设计是完全自主的。
使用TCP/IP协议，并且规定数据包的格式内容。
主要考虑以下几个方面：
1. 数据量大时的情况拆包组包方式。
2. 传输过程中确保多包情况下的稳定性问题。
3. 以上从包的丢失、延迟、程序中断等考虑。

在表现形式中，分为主动连接和监听部分。

#### 访问权限控制

这部分主要是询问内部数据源信息，以确定用户持有的token是否合法，进而确定是否有访问权限。
目前数据库中有实现的方法则应该对其进行封装引用即可。

#### 链路安全

方案一，SSL是对socket的一种使用方式，使链路不易被监听。
目前是SSL技术使用的openSSL其技术栈未明确。
方案二，使用自主的非对称加密方法进行加密。

SSL部分代码：
client:
```C++
#include <openssl/ssl.h>
#include <openssl/err.h>

meth = SSLv23_client_method();
ctx = SSL_CTX_new (meth);
ssl = SSL_new(ctx);
fd = socket();
connect();
SSL_set_fd(ssl,fd);
SSL_connect(ssl);
SSL_write(ssl,"Hello world",strlen("Hello World!"));
```

server:
```C++
meth = SSLv23_server_method();
ctx = SSL_CTX_new (meth);
ssl = SSL_new(ctx);
fd = socket();
bind();
listen();
accept();
SSL_set_fd(ssl,fd);
SSL_connect(ssl);
SSL_read (ssl, buf, sizeof(buf));
```

#### 异常处理

SQLGetDiagField | 返回包含错误、警告和状态信息的诊断数据结构的`记录字段`的当前值
SQLGetDiagRec | 返回包含错误、警告和状态信息的诊断记录的`多个字段`的当前值

表现为错误码。
分为两种方式：
* 返回码
* 诊断记录：每个ODBC API函数都能产生一系列的反应操作信息的诊断记录，这些诊断记录都放在相关联的ODBC句柄中，直到下一个使用同一个句柄的函数调用，该诊断记录一直存在。诊断记录的大小没有限制。

#### 事务系统

SQLEndTran | 请求对`与连接关联的所有语句上的所有活动操作`执行提交或回滚操作

事务隔离、并发控制，事务回滚。需要了解目前的事务系统的执行方式。

#### 日志文件

定义信息策略，将程序运行过程记录到软件日志文件。

### 3. 模块与组件

模块与组件应该致力于提高系统的可管理性，同时通过模块和组件的划分确定工作量。

远程访问模块分为以下组件进行开发：
1. 通信组件 - 拆包组包 - 监听 - 链路加密解密
2. 客户端连接管理组件 - 
3. 服务端连接管理组件 - 连接池 -
3. 日志记录组件
4. 指令转换组件

远程访问模块提供标准C++接口，在此基础上进行封装，形成ODBC标准API接口。

#### 各模块与各组件之间的通信

远程访问模块和微内核模块通过aeci接口进行通信。

组件间的高内聚是不可避免的，只是需要注意组件的复用性在保证效率的情况下应该尽可能大。

### 4. 代码分布

主要驱动程序有三部分代码：
* 公用代码
* 内部层代码
* SQL_()API实现

主要文件结构如下：19个.h，16个.cpp。
配置文件 config.h
技术栈调用文件 ras_lib.h
公用代码 global.cpp
    上层抽象类数据结构 struct.cpp
        访问控制接口[转换] access_per.cpp
        日志文件接口[转换] log_api.cpp
        数据库SQL标准接口[转换] sql_api.cpp
    链路加密文件 encrypt.cpp
        基本通信 communicate.cpp
    连接池 connect_pool.cpp
        连接管理连接句柄操作 connect.cpp
    环境句柄管理与操作 env.cpp
    语句句柄管理与操作 stmt.cpp
SQL_()标准接口 DBODBC.cpp
    SQL_()扩展接口 DBODBCext.cpp
        安装程序 installer.cpp
        客户端程序 DBclient.cpp
        服务端程序 DBserver.cpp
        总调用文件 tzdb_driver.h

#### 接口设计

接口设计主要围绕功能以及文件进行定义

底层C++接口：
    1. 初始化句柄
    2. 

公用函数接口:
    1. 内存分配函数，封装malloc()

#### 数据结构设计

需要明确调查出
* 协议数据的解析过程
* SQL语句在驱动中的执行过程以及数据变化
* 结果集的返回形式和在函数中的地址存在

拟定数据结构分为，核心数据结构，次级数据结构。(该称谓与符合级别无关)

核心数据结构：
    1. 环境句柄 EVN
    2. 数据库连接句柄 DBC
    3. 语句句柄 STMT
    4. 模块本身信息结构 TZDB

#### 接口设计

接口设计主要围绕功能进行定义

底层C++接口：
    1. 初始化句柄
    2. 

公用函数接口:
    1. 内存分配函数，封装malloc()

#### ODBC SQL_() 标准 API

48个标准接口
12个扩展接口
(见附录)

功能上大概可分为：
1. 句柄操作。
    SQLAllocHandle,SQLFreeHandle,SQLCancelHandle,
1. 与驱动版本信息或者环境信息相关的存取。
    SQLGetEnvAttr,
    SQLGetInfo,
    SQLSetEnvAttr,
7. 连接管理
    SQLConnect,SQLDriverConnect,SQLDisconnect,
    SQLGetConnectAttr,SQLBrowseConnect,SQLGetFunctions,SQLSetConnectAttr,
2. 与SQL查询语句有关的接口。
    SQLPrepare,SQLExecute,SQLExecDirect,
    SQLFetch,SQLFetchScroll,
    SQLGetData,SQLMoreResults,
    SQLCancel,SQLFreeStmt,

    SQLNativeSql,SQLSetPos,
    SQLCloseCursor,
    SQLGetCursorName<与指定语句的游标名称>,
    SQLSetCursorName,

    SQLDescribeParam,SQLDescribeCol,SQLNumParams,SQLParamData,SQLNumResultCols,SQLProcedureColumns,SQLRowCount,SQLSpecialColumns,SQLSetStmtAttr,
    SQLGetStmtAttr,SQLGetTypeInfo,SQLStatistics,
    
    SQLColumns,SQLForeignKeys,SQLPrimaryKeys,
    SQLTables,
    *SQLBulkOperations,
8. 描述符的操作
    SQLColAttribute,SQLCopyDesc,SQLSetDescField,SQLSetDescRec,
9. 权限相关
    SQLColumnPrivileges<SQLHSTMT>,SQLTablePrivileges<SQLHSTMT>,
3. 缓冲区。
    SQLBindCol,SQLBindParameter,
11. 错误处理
    SQLGetDiagField,SQLGetDiagRec,
10. 事务管理
    SQLEndTran,
12. 不清楚的API
    SQLPutData,
    SQLProcedures,

#### 初步实现 API

ODBC分配句柄接口
ODBC主动连接接口
ODBC获取信息接口
ODBC方法支持接口
ODBC类型支持接口
ODBC连接属性检索接口
ODBC环境设置接口
ODBC检索环境设置接口
ODBC语句设置接口
ODBC检索语句设置接口
ODBC检索单个描述符字段接口
ODBC检索多个描述符字段接口
ODBC复制描述符接口
ODBC预执行SQL接口
ODBC执行SQL语句接口
ODBC执行就绪SQL语句接口
ODBC检索SQL语句参数描述接口
ODBC检索结果集接口
ODBC检索结果行接口
ODBC检索结果集列属性接口
ODBC设置游标接口
ODBC检索单个诊断信息接口
ODBC检索多个诊断信息接口
ODBC检索表列名接口
ODBC检索外键接口
ODBC检索主键接口
ODBC语句句柄结束处理接口
ODBC关闭游标接口
ODBC关闭连接接口
ODBC释放句柄接口

#### 初步实现 C++ 接口

远程C/C++连接接口
远程C/C++预执行SQL语句接口
远程C/C++执行SQL语句接口
远程C/C++获取单个结果集接口
远程C/C++获取多个结果集接口
远程C/C++检索表权限接口
远程C/C++设置游标接口
远程C/C++检索结果集属性列接口
远程C/C++检索表列属性集接口
远程C/C++检索单个诊断信息接口
远程C/C++检索多个诊断信息接口
远程C/C++语句句柄结束处理接口
远程C/C++关闭游标接口
远程C/C++关闭连接接口

#### ODBC功能

数据源配置
驱动程序安装
描述符句柄处理
环境句柄处理

#### C++接口以及 Server 功能

网络通信单元
通信协议转换
链路加密单元
用户身份认证
用户权限认证
用户身份注册
SQL语句处理
结果集处理
错误信息处理
日志记录
远程可交互式SQL
环境信息管理
连接池管理
多线程任务执行
目标主机信息获取

#### installer安装程序exe

安装程序描述字符：
    
    TZDB ODBC 1.0 ANSI Driver\0Driver=tzdb-odbc.dll\0Setup=tzdb-odbc-setup.dll\0\0

其中安装的主要接口为 SQLInstallDriverExW() ,默认安装至目录 C:\Windows\system32\tzdb-odbc.dll ，但是实际上文件存放的位置应该是 C:\Windows\SysWOW64 ， 其中dll并不会在该接口执行时复制到系统目录中，暂时需要手动复制。

关于目录问题，system32中存放的是64位应用程序；syswow64中存放的是32位应用程序。syswow64中的32位应用程序运行时，其需要进行一个转向操作。

#### setup设置程序dll

主要接口为`ConfigDSNW`。

### 5. 资源策略

该部分书写于详细设计。

* 数据结构
* 句柄分配
* 缓冲区分配
* 线程机制
* 协议设计
* 指令规则

## 三、详细设计

项目分为如下几个部分：
1. AgilorE : 数据库项目实体。
2. tzdb-ras : 远程访问服务主要代码，ODBC部分以包的形式出现。
3. tzbd-odbc-installer : ODBC 标准安装程序。
4. tzdb-odbc-setup : OBDC 标准setup.dll。
5. tzdb-odbc-test : 远程访问服务主要测试代码。

其实到目前[10.18]项目的结构以及很明显：
基本信息
网络层
功能层
client层 : 提供给用户的接口，用于连接数据库。
server层 : 使得服务器以一个server的形式运行。
ODBC层 : 专门用于ODBC层次的结构调用。

项目目录：
配置文件 RASconfig.h
宏定义关键字表 RASKeyword.h
技术栈调用文件 RASLib.h
公用代码 global.cpp
上层抽象类及数据结构 RASClass.cpp
    网络通信组件 Communicate.cpp
    通信协议以及指令分析 ConProtocol.cpp
    连接池 ConPool.h
                访问控制接口[转换] AccessPer.cpp
                日志文件接口[转换] LogApi.cpp
C++接口函数(客户端) libtzdb.cpp
TZDB相关服务端主要函数 RAServer.cpp
    
    环境句柄管理与操作 env.cpp
    语句句柄管理与操作 stmt.cpp
    连接句柄管理与操作 dbc.cpp
    描述符句柄管理与操作 desc.cpp

    SQL_()标准接口 DBODBC.cpp
    SQL_()扩展接口 DBODBCext.cpp
    ODBC主要数据结构及方法 TzodbcDriver.h
驱动程序 tzdb-odbc.dll

配置驱动 tzdb-odbc-setup.dll
安装程序 OdbcInstaller.cpp

### 文件结构说明

#### C++接口函数(客户端) libtzdb.cpp

该文件定义三个基本的数据结构，连接句柄、语句句柄和环境句柄。
并且定义了C++标准接口函数。

#### TZDB相关服务端主要函数 RAServer.cpp

定义了环境句柄相关操作

### 基本原则

1. 宏定义应该满足可控的参数宏定义于config.h，其他宏则定义于声明函数或类的头文件中。
2. 用enum取代(一组相关的)常量。
3. 类的构造函数一般采用 explicit 修饰。
4. 禁止使用魔鬼数字。
5. 尽量用引用取代指针。

### 命名规则

1. 变量 使用下划线命名法。局部变量命名采用驼峰风格。

命名与局部变量类似，要在前边加上下划线。

函数参数用a作为前缀;
成员变量用m最为前缀;
循环变量和简单变量采用简单小写字符串即可。例如，int i;
指针变量用p打头，例如void* pBuffer;
全局变量用g_最为前缀。

常量命名以k_开头。

2. 类、结构体、枚举、类型定义（typedef） Pascal命名法:以多个相连的单词命名，每个单词首字母大写，不包含下划线。
具有继承关系的类，在命名上应能体现其关系。

T类表示简单数据类型，不对资源拥有控制权，在析构过程中没有释放资源动作。
C表示从CBase继承的类。该类不能从栈上定义变量，只能从堆上创建。
M表示接口类。
R是资源类，通常是系统固有类型。除了特殊情况，不应在开发代码中出现R类型。

3. 函数名 使用驼峰命名，采用动宾词组。
私有成员函数以双下划线__开头
保护成员函数以单下划线_开头

4. 文件名 使用大小写混合命名方式。一般形如 BaseFile.cpp。

5. 命名空间要求全部小写，命名基于项目名称和目录结构。

### 数据结构设计

在设计数据结构时，各个层次关系必须分离开来。

底层的基本代码。
上层是ODBC层。

#### SOCKET_T类

基本的通信TCP层类，负责传输层通信。
不进行内存管理。

1. 封装socket最基本操作，完成关于TCP层通信。
2. 使用外部可信缓冲区，类内不设有缓冲区地址。使用Connect类中缓冲区。

#### Connect类

通信层中的连接类。负责管理本地连接。

1. 使用SOCKET_T类进行通信。
2. 建立缓冲区，进行内存管理。
3. 
3. 进行数据加密操作。

关键是拆包组包谁来实现。
窗口范围控制，以及Keepalive参数。
该Keepalive参数似乎setsockopt()提供。

#### COnnectPool类

连接池类。

1. 存在server管理应用程序连接。足够复用到不可预见的client。
2. 存储一个通信连接类connect队列。
3. 和线程相关联。

#### DataSource 类

1. 标识一个数据源。
2. 存储一个用户-数据库连接中，用户的密码、用户名、ip地址、端口等。
3. 存储数据源的验证信息token。

#### dbrConnect TZDB主类\连接句柄

唯一标识一次连接的主类TZDB。

1. 该类唯一标识了一个连接。
2. 该类中存储关于用户的所有信息包括用户的密码、用户名、ip地址、端口等。

dbrConnect 与 DataSource之间的关系：
1. 两者互不包含。
2. 使用 DataSource 存储用户关键信息。
3. dbrConnect 一个类可以完成大部分在底层C++接口的工作内容。

主要四个类的功能性特征：
1. 这几个类是直接与内核进行紧耦合的。
2. C++ 接口是直接使用一个主类为参数的。C++接口内部仍然调用的是四个主类的成员函数。
3. SQL_() 标准接口尽量只调用 C++ 接口。

功能层次：
1. 四个主要类的成员函数。
2. C++ 接口。
3. SQL_() 标准接口函数。

Server接口的功能：

程序流程：
Client 这边用户只需要调用 ODBC 标准接口进行执行。
具体在 C++ 接口中，用户定义一个 dbrConnect ，(围绕)该类调用 C++ 接口执行相关语句。 dbrConnect 内部有网络层控件， 执行相关操作时， dbrConnect 将数据整合成数据结构。
方案一：C++ 接口将数据进行整合成数据结构， dbrConnect 类只处理数据结构，net 网络层将数据结构接收并且进行额外网络操作(加密、组包、链路安全等)，接收到数据，并且映射成相应的数据结构并对该数据结构进行内存分配，返回给 dbrConnect 类，dbrConnect 类根据该数据结构内容，执行相关功能性操作。
该方案：
1. dbrConnect 类只需要操作数据结构，而不需要操作 buffer。
2. 但是 net 网络层操作的数据结构不需要 数据->结构体， 但需要 buffer<->结构体。

采用该方案。

Server 围绕主要类 dbRAServer 进行。除去 dbRAServer 类所进行的基本网络层结构功能的启动。{应该注意可拆卸}。在启动后，程序先停留在网络层，网络层完成 buffer-> 结构体的操作之后，将结构体返回到 dbRAServer， dbRAServer 类直接与内部进行操作，依照多线程进行执行相关任务。
目前的方式是一个数据包对应一个解析函数。希望能够抽象出这个执行函数，并且把识别包类型和执行相关过程做一个指向性处理。
构建形如 {type, Func} 的列表。并且将 Func 进行实现。所以之后添加新的操作时，只需要在表内进行添加方法记录，并且实现指定方法即可。然后在客户端封装包的时候进行对应即可操作。

关键是使用哪一个连接进行，如果 dbRAServer 类中维护了多个连接，可以通过 socket 网络层进行确定，如果是新的连接则添加到监听队列中。

连接队列里面维护的是什么样的一个类？如果是维护的 dbrConnect 类，那么操作是否重复了？因为 dbrConnect 中存放的时网络层的信息、用户信息以及关联的描述符句柄和语句句柄。而 dbrConnect 中对应的操作都是发送的操作。

关键就在于需要执行很多的功能操作。这些操作之间的关系不确定导致了无法细化，导致无法明确将 server 中的功能集实现在 dbRAServer 上还是 dbrConnect 上。

传递结构体是有风险的，因为结构体的参数许多都是指针，计算长度的困难即使可以克服。

Client 中是没有必要将 dbrConnect 类的方法对标到 C++ 接口，只需要注意将关键操作进行添加到 dbrConnect 类成员方法即可。
之前的想法是 C++ 接口完全执行所有操作。上述观点希望让 dbrConnect 类成员函数接替。目前最好的方式是，在 C++ 接口中遵循完成基本操作流程的思路，将可复用代码抽离出，于内核高耦合的代码使用 dbrConnect 类成员函数实现。
Server 中使用对结构体识别的方式是没有问题的，因为这个过程是必须的，而将方法抽离出来进行定位的想法也没有错，目前看来是有利于进行多线程提升效率的。所以服务端需要做的事是将体系以类的方式存在。
Server 端有如下特点：任何功能操作必须是在接收和发送之间。
因此可以将功能类进行封装。

开发流程：(快速开发思路，问题不涉及运行不解决，问题涉及体系必须推进)
1. SOCKET_T 链路层：(该部分暂时不需要更改)
    进行 socket TCP/UDP 连接，暂时只支持 ipv4
    判断连接状态
2. RASNet 网络层：
    实现多种数据结构的解析
    发送指定长度包
    接收包，并确定长度，返回内存buffer
    解析包，将包映射到指定数据结构
    进行网络监听
3. dbrConnect 等四个主要类开发
4. dbRAServer 类开发
5. ODBC 接口开发

四个主类的标准原则：

Server类仍然有存在的必要性：
1. dbrENV 进行的功能是存储环境变量，在 ODBC 体系中不需要频繁操作 dbrENV ， 而是以 dbConnect 为主。
2. Server 类需要对内部进行管理，并且启动服务和多线程、I/O模型、网络层初始化等工作。

#### dbrENV 环境句柄

环境句柄ENV，标识一个应用程序，拥有一个DBC连接句柄列队，对连接句柄进行管理。
调用接口进行连接时在环境句柄中分配一个。

#### dbrSTMT 语句句柄

STMT语句句柄。该句柄封装了底层的语句句柄。

#### dbrDESC 描述符句柄

描述符句柄DESC，可以存储四类信息，描述语句句柄或者其他信息。

#### dbRAServer 服务主要类

### 通信组件

首先是单个对于socket基本操作的封装。由于后续连接池部分实现对于一个连接的维护。
所以对于socket的基本操作封装不需要写明目标主机的地址。

TCP是可靠的连接,协议里已经处理了丢包/误包重发的机制。

关于拆包和组包的函数：
1. 编写Demo测试粘包和拆包的情况是否是底层发生。
2. 设计协议，拆包和组包的情况。

Q&A:
1. 差错控制和流量控制是否需要实现？
似乎socket编程中已经实现。
2. 拆包组包模型的量级是多少？
我觉得应该将工作量细化，并且优先实现最小的模型部分。

在实现了对 socket 基本操作进行封装生成 netSocket 类之后，设计连接类 CONNECT 进行创建单个连接，与连接参数进行对接。

该 CONNECT 类中完成对于协议的解析，并且将数据发送出去。

之前提到一个组包和拆包的概念，因为socket编程中自己可以完成关于拆包和组包的操作，只需要在recv和send中给出具体的长度即可。
但是当发的包过长的时候，会有一个通知接受端长度的问题，然后进行接收。这部分的"组包"是需要自己实现的，这也是通信协议的一部分。

通信情况：
1. 最好的方式就是，recv 一直在进行，并且长度都为最大值。那么无论 send 方如何处理，只要 recv 够快，就可以保证每次读出的都是一个数据包。
2. 但是显然，如果 recv 不是一直进行的，或者说链路中存在者不对等传输的情况，那么粘包的情况是一定会出现的。
3. 还有一种就是数据丢失的问题，如果 send 数据一直在进行，而数据超出了 recv 的缓冲区，那么会发生什么样的情况？这部分丢失的数据又作何处理，该问题应该在通信协议层进行解决。

所以需要弄清楚的问题就是：
1. 链路断开和释放之间的各种情况问题。
    链路情况有三种: 断开(shutdown),释放(close),目标程序终止。
2. 链路重连等各种情况。
3. 以上两种情况对于残留数据的处理。
    为什么 recv 不能用于判断链路是否断开，原因就是在断开连接的情况下，链路层残留的数据仍然可以发送和接收。
    所以判断的方式要么是发送空数据包，要么就是调用 win 控件 errror 进行判断。
3. 粘包和数据缺失的问题。
    需要通过设计通信协议进行解决。
4. 阻塞模式。
    非必要选项。

关于 send 和 recv 的返回值问题:
1. send 返回值:
    如果发送的是空字符,那么返回 0 , 
    如果遇到连接断开,则返回 SOCKET_ERROR(-1)。
    如果是网络断开 ，也返回 -1。
    发送成功则返回发送的字节数。
2. recv 返回值：
    接收成功返回实际 copy 的字节数。
    如果连接断开(shutdown 或 close)，则返回 0；
    如果是目标进程结束，则返回 -1。

close() 和 shutdown()执行之后，socket 无法再进行使用，因为 close 之后，资源已经释放。如果需要反复使用一个 socket ，那么则无需重新释放。

[注意]close 的逻辑部分，当一方执行 close 的时候，连接并没有被释放，也就是没有完全关闭。因为 socket 连接存在一个描述符的概念。close 只是将此描述符 -1 ，如果非 0 ，那么并不会发送 FIN 包。只有为 0 时，才会发送。
那么目标程序终止，是否才是关键连接断开呢。

以上问题清楚之后。考虑实现需求。

#### netReadByKeyword(char*& buffer, int& len, char* keyword)函数读取算法：

该函数以 keyword 为分隔符，进行读取。该分隔符默认为无用数据。

维护一段缓冲区，长度为 tmp_buffer_len。

判断该缓冲区在存在数据的情况下是否存在分隔符。

初始读取一段长度 read_init_len 数据。
如果数据已经读取完毕，则阻塞。

判断单次读取数据中是否有分隔符 keyword。
如果有，则返回其第一个分隔符的第一个字符在目前读取数据的坐标。
如果没有，则继续读取。如果读取不会越界，每次多读取 incre_len 个数据长度。否则按剩余长度读取。
如果长度超出，则将缓冲区进行扩充长度，直到缓冲区到达最大值。如果缓冲区达到最大值仍然没有读取完成，认为该模型存在问题，丢弃指定长度数据，进行覆盖。并且记录单个数据包长度。直到读取完成。如果一直无法读取完成数据，则输出异常。

判断该分隔符之前是否有数据，有则输出。
没有则将继续读取。

痛苦如此持久，像蜗牛充满耐心地移动；快乐如此短暂，像兔子的尾巴掠过秋天的草原。

#### 后续实现


	//根据流量进行控制

	//链路安全

	//数据加密

	//数据解密

	//读取协议规则

	//根据协议进行封装


### 协议设计

通过通信组件，封装并完善了 socket 的一些应用规则，并且加入了自己的错误码识别，以及对连接状态的更直观的判断。保护了某些函数在执行中得到的是正确的使用。`为之后的系统适配接口做好准备`。确保了能够正确使用 socket 函数，并对应到本机功能中。

下一阶段则是为了更好的传输数据，解决粘包和包缺失的问题，设计相关通信协议。并且进行标识指令。

写入数据就是组包的过程。首先遵从连续发包的方式将包的参数进行规划和计算，之后放入数据。
如果是再上一层，则考虑将数据十分大的包进行拆解成若干个包。该部分优先级最低。

再上一层，考虑到发的包的内容。设计一个通信协议。

读取数据。首先读取一段内存，然后判断是否存在帧头和数据长度，之后读取数据并检验是否存在帧头。
如果读取的内存没有帧头，则丢弃(或者暂存)并且读取更多的长度，该增量模型一直增长。读取到之后进行判别。再进行读取内存。
读取的数据暂时存放在一段缓冲区中，不断存，不断识别。并且不断的对数据进行抛弃，直到识别到帧头。该缓冲区可以当成一个循环内存。
当识别到帧头的时候，再申请一块正确的内存进行存放。

buffer 的需求：
1. 该内存可以动态扩展，并且一旦扩展就不释放。
2. 可以查询到该内存的大小。并且进行搜寻多个连续的字符。
3. 可以生成一块完整的内存空间。按需进行数据转移。该指针下次使用时释放。
4. 

#### SOCKET I/O模型

### 线程池

线程池中互斥锁的必要性：
互斥锁的需要与否取决于是否存在临界资源或者是临界区。

dbMutex 结构体使用的是 InitializeCriticalSection 等接口。

[Mutex 和 Critical_Section 区别](https://blog.csdn.net/xdrt81y/article/details/17005235)

### 连接池部分

该部分定义连接池类。
连接池类维护基于 CONNECT 类的连接队列。管理并添加连接。
同时维护一个<多系统适配>的 I/O 模型，进行 socket 事件操作。

关于线程池是否由连接池进行维护，取决于 I/O 模型对线程分配的需求。

最后一个问题则是，线程池中执行哪些内容。
需要执行的内容：
1. I/O模型监听到事件时，执行 accept、close。
2. 

天脉可以使用 socket ， 天脉3 在运行过程中不能申请信号量。

### 指令规则

### Shell 主函数

该函数使用的关键接口允许被调用且重新拼凑。

### 访问权限控制

数据库 user_db
用户表  user_table：
| 属性 | 标识 | 字符类型 |
|:-:|:-:|:-:|
|用户名|    user    |   int(4) |
|密码|      auth    |   int(4) |
|token|     token   |   int(4) |

### 错误处理

是否需要将错误以链表的方式进行记录并且查阅？

### 日志记录组件

在使用一般的函数调用进行记录的基础上进行如下扩展：
1. 为防止写冲突(或者说写抢占，即出现内容缺失)的情况，设定一段缓冲区；
2. 扩展其格式；
3. 将错误码写入该组件。

### SQL基本函数封装

对aeci层接口进行封装，该部分封装为后续：
1. 增加支持多字节。
2. aeci层代码更迭。

aeci_xml_export
aeci_schedule_backup
aeci_mirror_init

### SQL基本函数执行

open 'database-name' ( 'database-file-name' ) ';'
select ('*') from <table-name> where <condition> ';'
update <table-name> set <field-name> '=' <expression> {',' <field-name> '=' <expression>} where <condition> ';'
create table <table-name> '('<field-name> <field-type> {',' <field-name> <field-type>}')' ';'
alter table <table-name> '('<field-name> <field-type> {',' <field-name> <field-type>}')' ';'
rename <table-name> '.' <old-field-name> 'to' <new-field-name> ';'
delete from <table-name>
drop table <table-name>
drop index <table-name> {'.' <field-name>} ';'
create index on <table-name> {'.' <field-name>} ';'
drop hash <table-name> {'.' <field-name>};
create hash on <table-name> {'.' <field-name>}field> ';'
insert into <table-name> values '(' <value>{',' <value>} ')' ';'
backup [compactify] 'file-name'
start server URL number-of-threads
stop server URL
start http server URL
stop http server
describe <table-name>
import 'xml-file-name'
export 'xml-file-name'
show
profile
commit
rollback
autocommit (on|off)

char* com1[] = {
    (char*)"open 'user_db';\n" ,
    (char*)"create table user_table (uid int4, pwd int4);\n",
    (char*)"insert into user_table values ( 8102 ,234542);\n",
    (char*)"insert into user_table values ( 8103 ,345465);\n",
    (char*)"select * from user_table;\n",
    (char*)"exit;\n",
};

首先一个问题就是，目前没有可以执行SQL语句的接口函数，所以:
1. 自己建立一个简单的识别操作，只通过识别主要的关键几个SQL语句的前几个字符，调用相关接口。在调用接口的过程中，返回的仍然是一串地址空间。
2. 使用SQLTOOL中的代码，达到执行SQL语句的目的，并且通过对缓冲区进行取数据，拿到结果集。

在此基础上有两步，第一个是执行SQL语句，第二个是返回结果集。一般的SQL语句只需要执行并且返回结果就可以，但是Select语句需要返回一个结果集。

第一个方法，自己建立简单的识别操作。执行对应的接口，并且得到反馈。复杂在第一步执行SQL语句上，需要识别短暂的过程。而且，目前的aeci层不支持SQL语句的解析， insert的时候只能以数据结构的方式进行插入。包括建立表格的时候也只能使用数据结构的方式进行建立。在这个前提下很难采取此类方法。select查询语句查询出的也是一段空间。
第二个方法，使用SQLTOOL。该类方法，可以直接使用SQL语句，并且反馈数据。执行select语句时，将会输出内容，该部分内容只能以缓冲区方式呈现。而且只有输入输出。

采用使用SQLTOOL的方式进行执行SQL语句。使用一个独立的线程，进行执行SQL语句。使用两个互斥锁，达到对线程执行的绝对控制权。但是关于这方面还有待验证。似乎在不同时间段进行执行有不同效果。


### setup dll

主要是依托于函数 ConfigDSNW 。 

希望能够在配置数据源时，弹出窗口[MFC]，写入目标 ip 地址和端口。
然后调用函数 SQLWritePrivateProfileString 将配置写入系统。

在 SQLConnect 时 ，调用函数 SQLGetPrivateProfileString  将配置读出。
完成整个体系内容。

MFC 这一块先行搁置，先实现基本内容。

### installer驱动安装程序

描述字段：
"MySQL ODBC 8.0 Unicode Driver"
"DRIVER=myodbc8w.dll;SETUP=myodbc8S.dll"
"DRIVER=MySQL ODBC 8.0 Unicode Driver;SERVER=localhost;DATABASE=test;UID=myid;PWD=mypwd"

### 生成 ODBC dll

主要需要注意的是应用程序的字符集和系统位是否一致。
当ODBC调用dll中的函数时，会先行执行 SQLGetFunctions 和 SQLGetInfo 函数确定是否有该信息。

存放在
C:\Windows\SysWOW64

### 应用程序调用机制

`在应用程序调用函数（SQLConnect、SQLDriverConnect或SQLBrowseConnect）连接到驱动程序之前，驱动程序管理器不会连接到驱动程序。在此之前，驱动程序管理器使用自己的句柄并管理连接信息。`

在驱动dll中重写了各种标准接口，并且Def定义并提供。
之后应用程序调用标准接口函数时，驱动管理程序将应用程序的调用方式传递给驱动dll，执行dll中的函数接口内容。

### 技术栈/内容依赖

MSVC 19.28.29910.0

```C++
# include <sql.h>       //含有SQL_()标准函数
# include <sqlext.h>    //
# include <odbcinst.h>  //含有关于安装程序DLL标准SQL_()函数
```

每个项目三个配置项：
C/C++ [附加包含目录]
链接器 常规 [附加库目录]
链接器 [输入]

AgilorE:
C/C++ [附加包含目录]
$(ProjectDir)inc\include\tzdbcom;$(ProjectDir)inc\include;inc;%(AdditionalIncludeDirectories)

tzdb-odbc:
C/C++ [附加包含目录]
$(ProjectDir)inc\tzdbras\;$(ProjectDir)inc\tzdbodbc\;$(ProjectDir)\..\tzdb-win\inc\include\tzdbcom\;$(ProjectDir)\..\tzdb-win\inc\include\;$(ProjectDir)\..\tzdb-win\inc\;$(ProjectDir)\..\tzdb-win\Debug\;%(AdditionalIncludeDirectories)

tzdbodbc-install:
C/C++ [附加包含目录]
$(ProjectDir)include\tzdbodbc_installer;$(ProjectDir)..\tzdb-odbc-setup\include\tzdb_odbc_setup\;
链接器 常规 [附加库目录]
$(SolutionDir)Debug\
链接器 [输入]
tzdb-odbc-setup.lib;ws2_32.lib;odbccp32.lib;Secur32.lib;legacy_stdio_definitions.lib;Dnsapi.lib;kernel32.lib;user32.lib;gdi32.lib;winspool.lib;shell32.lib;ole32.lib;oleaut32.lib;uuid.lib;comdlg32.lib;advapi32.lib

tzdb-odbc-setup
C/C++ [附加包含目录]
$(ProjectDir)include\tzdb_odbc_setup\;$(ProjectDir);
链接器 [输入]
ws2_32.lib;odbccp32.lib;Secur32.lib;legacy_stdio_definitions.lib;Dnsapi.lib;kernel32.lib;user32.lib;gdi32.lib;winspool.lib;shell32.lib;ole32.lib;oleaut32.lib;uuid.lib;comdlg32.lib;advapi32.lib

tzdbodbc-test
C/C++ [附加包含目录]
$(ProjectDir)\..\tzdb-win\inc\include\tzdbcom\;$(ProjectDir)\..\tzdb-win\inc\include\;$(ProjectDir)\..\tzdb-win\inc\;$(ProjectDir)\..\tzdb-win\Debug\;
$(ProjectDir)..\tzdbodbc-installer\include\tzdbodbc_installer;$(ProjectDir)..\tzdb-odbc-setup\include\tzdb_odbc_setup\;
$(ProjectDir)inc\tzdbtest\;
$(ProjectDir)..\tzdb-ras\inc\tzdbras\;$(ProjectDir)..\tzdb-ras\inc\tzdbodbc\;
%(AdditionalIncludeDirectories)
链接器 常规 [附加库目录]
$(ProjectDir)..\tzdb-win\Debug\;%(AdditionalLibraryDirectories)
链接器 [输入]
AgilorE.lib;tzdb-odbc-setup.lib;tzdb-odbc.lib;kernel32.lib;user32.lib;gdi32.lib;winspool.lib;comdlg32.lib;advapi32.lib;shell32.lib;ole32.lib;oleaut32.lib;uuid.lib;odbccp32.lib;ws2_32.lib

### ODBC SQL 函数

针对于关键的主要函数的研发。

1. SQLGetInfo ，估计是提供了系统的关键参数。
2. SQLGetFunctions , 该函数标明了驱动程序支持的方法接口。
3. SetConnectAttr ， SQLGetStmtAttr 之类的获取设置的函数。该部分表明了其参数配置。
4. SQLGetDiagField 和 SQLGetDiagRec。在执行 SQL 语句的过程中，数以千计地调用了这两个函数， 预计是接口未有支持的原因导致一直调用。

目前只到以上部分。先解决 JAVA 的有无问题。

### JDBC

比 ODBC 简单一些。

[参考网站](https://www.jianshu.com/p/43c865e3a286)
[参考网站](https://www.cnblogs.com/rongfengliang/p/13788390.html)

通过以上两个网站的学习，已经明确整个体系结构。
并且完成体系中的连接测试，可以连接上。

继承的类如下： Driver，Connection，DatabaseMetaData。
    有需要则可以再继承 ResultSet。

之后的开发只有一个要求，就是快速。

首先日志系统直接使用 log4j。
通信组件直接翻译式编写。
主类直接写便可。
而对于指令执行系统。如果不行则采用最原始的方式。因为在 C++ 中，我们可以使用指针函数对方法进行动态定义。预计在 JAVA 中只能使用多态进行。

还有一个点就是 网络组件的问题。似乎在 JDBC 的默认体系中，使用 http 会多一些。

只要 client 端的通信结构。使用 Socket 即可。

首先编写主类中的伪代码，再确定需要补足的部分。

在 Statement 中主要有三个执行 SQL 语句的方法：
1. executeUpdate 主要用于 删除、创建表、更新、插入数据。
2. executeQuery 用于查询
3. execute 普适的执行 SQL 语句方法

JAVA 对我这样的 C++ 使用者来说很不友好：
1. 操作受限。
2. 函数返回值有限
3. 随意的操作感觉效率很低。

SQLException 值得注意。

注意：
java 中的程序结构是加壳在生成数据之后的。

有没有一种这样的可能性， Java 的错误异常抛出等效于 C++ 中的返回值。

有一个启示，我们可以在 C++ 编程中使用类似的手段，不进行返回值作为错误码，而是以抛出异常的方式来进行错误分析。
在设计 C++ 接口时，我们将返回值和参数做有机的结合，而不将错误码归并到一起。

### Python ODBC

连接不上数据库，是因为，在 windows 系统下的 DSN 中，该驱动程序和系统的位数有关。
经过测试，在 pyodbc 中是可以连接上 ODBC 布置在 windows 上的驱动程序的。
所以 python 接口无需开发。但是面临的问题就是，需要扩展 ODBC 中的标准接口，以达到能够使用的程度，详见 ODBC SQL 函数 部分。

pyodbc 似乎绕过了驱动管理程序，从而不支持 SQLGetPrivateProfileString 函数。
python 测试用例返回错误：
    
    pyodbc.Error: ('HY000', 'The driver did not supply an error!')
是统一的特征报错，怀疑是未支持错误处理原因。

连接数据库成功之后， pyodbc 调用了三次如下函数：
[202203241005][INFO]SQLAllocHandle
[202203241005][INFO]SQLAllocStmt
[202203241005][INFO]SQLGetStmtAttr:10010
[202203241005][INFO]SQLGetStmtAttr:10011
[202203241005][INFO]SQLGetStmtAttr:10012
[202203241005][INFO]SQLGetStmtAttr:10013
[202203241005][INFO]SQLGetTypeInfo
[202203241005][INFO]SQLFetch
[202203241005][INFO]SQLFreeStmt
[202203241005][INFO]SQLFreeHandle

执行了 6 条 SQL 语句，发现 pyodbc 调用了 6 次以下方法进行基本实现：
[202203241005][INFO]SQLExecDirect
[202203241005][INFO]SQLRowCount
[202203241005][INFO]SQLNumResultCols
[202203241005][INFO]SQLFreeStmt

最后调用了：
[202203241005][INFO]SQLFreeHandle
[202203241005][INFO]SQLEndTran
[202203241005][INFO]SQLGetInfo
[202203241005][INFO]SQLDisconnect

提示 ：
    
    pyodbc.ProgrammingError: No results.  Previous SQL was not a query.

改 BUG 整改完毕。
没有进行查询是因为通过函数 SQLNumResultCols 判定是无结果集的。
改进之后调用函数 
[202203241452][INFO]SQLDescribeCol
[202203241452][INFO]SQLDescribeCol
[202203241452][INFO]SQLDescribeCol
[202203241005][INFO]SQLFreeStmt
[202203241452][INFO]SQLFreeHandle
[202203241452][INFO]SQLEndTran
[202203241452][INFO]SQLGetInfo
[202203241452][INFO]SQLDisconnect

三次调用 SQLDescribeCol 。
在此接口中使用伪数据方式进行测试验证，证明 python 为可行。

这里不使用正常数据是因为还未完全支持 MetaResult 。

## 四、开发流程记录

[8.09]
复盘调研结果，调研运行流程
[8.16]
远程访问服务，ODBC调研部分正式结束。
[8.18]
组内讨论方案可行性
[8.24]
installer Demo编写完成
setup Demo编写完成
[8.26]
通过应用程序调用驱动程序接口。系统流程Demo基本走通。
该Demo还欠缺驱动程序和数据库之间的流程联系。但这部分认为是可控的。
后续不知道从声明地方开始，其实可以参照《主体驱动文件系统.xmind》进行，从SQL标准接口的转换开始，然后对于该部分实现C++基本接口的server内容。再进行另一个不交叉的线路实现client中的调用内容。
client中的内容与数据结构被封装后可以形成ODBC SQL标准接口函数。
[9.03]
socket组件封装完成，创建socket类。
接下来就是确定，是否需要connect类作为连接句柄的中间类。
[9.09]
主体层次已经非常清楚。
[9.14]
可以说到目前，成品的形态和结构以及可以窥见。虽说细节不太清楚，但是都不算是前期问题。
但是今天看到Mysql源码，`libmysqld, the Embedded MySQL Server Library`，说明mysql是有一套专门用在嵌入式server的代码？
接下来的开发过程，可以边学习MySQL的接口内容，从而完善项目。
[9.15]
完成基本完全Demo。
[9.16]
搭建Git仓库进行版本管理，当代码成型时应当废除。
[9.25]
拟搭建server中的多线程模式，拟实现连接池方案，但是为了功能性上的先行完善，暂时搁置该策略。
[10.11]
之前已经完成了SQL语句执行问题，使用SQLTOOL进行语法解析。
下一步就是
1. 完成结果集的处理。
2. 进行编写其他的SQL标准接口功能。
3. 打磨关于socket的相关内容与协议。
4. server的多任务线程池与网络I/O模型。
[10.12]
完成关于关键技术在锐华上的移植。
[10.14]
不要着急，沉着并且提高效率。如果不急的话，一个程序工作内容两个小时就可以完成。
[10.15]
完成结果集的取操作。
[10.18]
完成基本功能代码在锐华上的适配。
[10.19]
关于代码中的四个主要句柄的问题。
目前server_info和环境句柄ENV感觉有所重复。
描述符句柄的用处可以更多，且包含了结果集数据结构的功能。
连接句柄和主类TZDB有一定的重复。
语句句柄C++接口也需要一个，并且和数据库源码之间仍有联系。
但是如果转换的话那么结构体之类的东西就需要有一定的变换。
比较好的方式是直接使用ODBC标准的内容数据结构。
将功能化相同的数据结构合并为一个数据结构，并且进行类型的转换。
今天将代码演示了一遍，目前ODBC的进度已经被判定为缓慢。
[10.24]
就不应该用 aeci 层接口，以后开发禁止使用陈旧没人维护的接口。

insert into user_table values ( 8103 ,345465);

### 问题记录

1. [0]SQLTOOL存在报错：当数据库建立之后，再打开时出现。怀疑是数据库未正常关闭。
2. [2]应用程序连接数据源，驱动程序定位到指定ip和port的过程目前是由程序确定的。但该过程应该是暂存到一个信息记录中进行读取，该部分需要考察和确定。
    在mysql中，配置数据源的时候需要指定 TCP/IP Server的IP和端口port。
3. [0]接口更新，以及为什么不用旧的接口。
4. [1]global中与时间相关函数的重写。
5. [4]ConProtocal中关于IO模型的相关函数重写。
6. [3]ConPool中线程池编写。
7. [0]itoa函数重写，AccessPer。
8. [1]AccessPer中使用的aeci层接口新版无法查询。
10. [2]添加主动注册信息的状态接口。
11. [0]tzdb_stmt_fetch中逻辑错误,判断tzdb->cursor == NULL时机不对.
12. [1]client端接收,当server端断开时存在问题.
13. [1]关于 SQLTOOL 线程在程序结束时的问题。

### 待优化问题

9. [1]server中用户认证token对比的代码分布。
11. [1]添加本地的表，存储ODBC体系中的数据源信息。

#### 已解决问题

9. [1]server中用户认证添加验证信息问题。

### 适配问题

windows， 天脉2， 天脉3， 锐华。

#### 锐华

1. socket的适配
2. ODBC标准文件宏进行兼容

修改项：
1. AeCI.cpp
注释大部分内容
2. AeCILocal.h
将函数void *initERR(MCO_RET i);定义改为声明，并且将其定义式存放在AeCILocal.cpp中

3. SQLTool.cpp SQLTool.h
拟更新dbDatabase::open函数中接口问题

4. 疑点：
	为什么不用新接口来着

5. 是否可以不用AecI层文件

##### Recording

ifconfig syn0 192.168.1.100

boot tftp://192.168.1.102/reworks.elf

SATA支持
控制台
强制链接库
shell
LWIP协议栈

883
1 extend call : 7883
in:330801 extend call : 7883

### 版本管理 - Git仓库

1. windows版本 gitlab，局域网内可以访问。
2. 只需要五个项目中的头文件与源码文件。
3. 收集常用的指令。
4. 建立两个分支。

管理员：
密码见[9.13]周报

地址域：
ip : 192.168.1.105
http://localhost:3000/iTheds/tzdb-ras.git
http://192.168.1.105:3000/iTheds/tzdb-ras.git

在代码基本成型时废除该Git仓库，并转接到主要Git仓库。

### 想法1

8.20 前开发基本模型Demo。windows驱动管理器可以识别并且使用部分功能。

通信模块开发。需要提前抓包或者查看mysql的 SQLExec() 过程。
远程连接管理模块。连接池。
SQL_API 开发。需要深入学习数据库知识和了解TZDB源码。
链路安全，问题。

### 想法2

[9.6]
还是需要多讨论各种层面的可行性。
该项目越是存在技术盲点，调研成本越是大，就越需要提供学习方式，供组内进行讨论其可行性。特别是项目中期。
如果对于一些事很纠结，遵循第一想法原则进行实现。

### 想法3

[10.18]
想把代码重新构建整理一下，包括命名和结构体以及之前的编码习惯的改变。
对于开发的方向需要更明确，以四个主要的类进行开发。
有些东西现有的数据库源码中就存在，但是这部分先不考虑。
其实时间还是很紧张。
因为关于环境句柄和语句句柄还是未实践的东西，因为它们目前并没有对功能性有太大影响，然后关于JDBC和Python-odbc两者还是不太清楚的，还需要学一下两者的语言。
包括日常对于数据库源码的学习也有待推进。
[10.20]
目前比较关键的是四个主类的功能分配。

### 开发模型

由于本模块有着扩展功能不明确但是需要符合官方标准的特点，所以采用增量模型的思想。
考虑快速原型模型(Rapid Prototype Model)。
先需求、后构建、再测试，重复此过程，直到在满足已知的模型的情况下确保交付无误。
开发期间满足以下要求：
1. 先实验整个路径过程，确认无误再开发；

## 五、测试

新建项目tzdbodbc-test进行测试。
在测试的过程中，将 tzdb-odbc 编译为lib库以方便调试。

这种方法可以看到实时调试的内存数据。

## 六、交付

## 七、维护

# 附录

## 接口关键字检索

ODBC分配句柄接口
EDB-USER-INTF-OAHD
SQLAllocHandle

ODBC主动连接接口
EDB-USER-INTF-OCON
SQLConnect

ODBC获取信息接口
EDB-USER-INTF-OGIF
SQLGetInfo

ODBC方法支持接口
EDB-USER-INTF-OGFU
SQLGetFunctions

ODBC类型支持接口
EDB-USER-INTF-OGTY
SQLGetTypeInfo

ODBC连接属性设置接口
EDB-USER-INTF-OSCO
SQLSetConnectAttr

ODBC连接属性检索接口
EDB-USER-INTF-OGCO
SQLGetConnectAttr

ODBC环境设置接口
EDB-USER-INTF-OSEN
SQLSetEnvAttr

ODBC检索环境设置接口
EDB-USER-INTF-OGEN
SQLGetEnvAttr

ODBC语句设置接口
EDB-USER-INTF-OSSM
SQLSetStmtAttr

ODBC检索语句设置接口
EDB-USER-INTF-OGSM
SQLGetStmtAttr

ODBC检索单个描述符字段接口
EDB-USER-INTF-OGDF
SQLGetDescField

ODBC检索多个描述符字段接口
EDB-USER-INTF-OGDR
SQLGetDescRec

ODBC复制描述符接口
EDB-USER-INTF-OCDE
SQLCopyDesc

ODBC预执行SQL接口
EDB-USER-INTF-OPRE
SQLPrepare

ODBC执行SQL语句接口
EDB-USER-INTF-OEXE
SQLExecute

ODBC执行就绪SQL语句接口
EDB-USER-INTF-OEXD
SQLExecDirect

ODBC检索SQL语句参数描述接口
EDB-USER-INTF-ODEP
SQLDescribeParam

ODBC检索结果集接口
EDB-USER-INTF-OGDA
SQLGetData

ODBC检索结果集行数接口
EDB-USER-INTF-ORCU
SQLRowCount

ODBC检索结果集列属性接口
EDB-USER-INTF-OCOL
SQLColAttribute

ODBC设置游标接口
EDB-USER-INTF-OPOS
SQLSetPos

ODBC检索单个诊断信息接口
EDB-USER-INTF-OGDAF
SQLGetDiagField

ODBC检索多个诊断信息接口
EDB-USER-INTF-OGDAR
SQLGetDiagRec

ODBC语句句柄结束处理接口
EDB-USER-INTF-OFRSM
SQLFreeStmt

ODBC关闭游标接口
EDB-USER-INTF-OCCU
SQLCloseCursor

ODBC关闭连接接口
EDB-USER-INTF-ODCO
SQLDisconnect

ODBC释放句柄接口
EDB-USER-INTF-OFRH
SQLFreeHandle

---------------------

远程C/C++连接接口
EDB-USER-INTF-NCONT

远程C/C++预执行SQL语句接口
EDB-USER-INTF-PSQLE

远程C/C++执行SQL语句接口
EDB-USER-INTF-DSQLE

远程C/C++获取结果集接口
EDB-USER-INTF-GSRES

远程C/C++检索表权限接口
EDB-USER-INTF-GTABP

远程C/C++设置游标接口
EDB-USER-INTF-SETCU

远程C/C++检索结果集属性列接口
EDB-USER-INTF-GETCL

远程C/C++检索单个诊断信息接口
EDB-USER-INTF-GSDIA

远程C/C++检索多个诊断信息接口
EDB-USER-INTF-GMDIA

远程C/C++语句句柄结束处理接口
EDB-USER-INTF-FRSMT

远程C/C++关闭游标接口
EDB-USER-INTF-CLOCU

远程C/C++关闭连接接口
EDB-USER-INTF-CLOCO

---------------------

远程JAVA建立连接接口
EDB-USER-INTF-JNCONT

远程JAVA创建语句句柄接口
EDB-USER-INTF-JAHS

远程JAVA执行SQL语句接口
EDB-USER-INTF-JDSQL

远程JAVA获取结果集接口
EDB-USER-INTF-JGRES

远程JAVA获取结果集元数据接口
EDB-USER-INTF-JGEME

远程JAVA获取结果集元数据列数接口
EDB-USER-INTF-JGEMR

远程JAVA关闭语句句柄接口
EDB-USER-INTF-JCHS

远程JAVA关闭连接接口
EDB-USER-INTF-JCLS

---------------------

远程Python建立连接接口
EDB-USER-INTF-PNCONT

远程Python获取游标接口
EDB-USER-INTF-PGCUR

远程Python执行SQL语句接口
EDB-USER-INTF-PDSQL

远程Python循环访问获取结果集接口
EDB-USER-INTF-PFETC

远程Python提交事务接口
EDB-USER-INTF-PCOMIT

远程Python关闭连接接口
EDB-USER-INTF-PCLS

## 代码体系[旧版]

主要文件结构如下：19个.h，16个.cpp。
配置文件 config.h
技术栈调用文件 ras_lib.h
公用代码 global.cpp
    上层抽象类数据结构 struct.cpp
        访问控制接口[转换] access_per.cpp
        日志文件接口[转换] log_api.cpp
        数据库SQL标准接口[转换] sql_api.cpp
    链路加密文件 encrypt.cpp
        基本通信 communicate.cpp
    连接池 connect_pool.cpp
        连接管理连接句柄操作 connect.cpp
    环境句柄管理与操作 env.cpp
    语句句柄管理与操作 stmt.cpp
SQL_()标准接口 DBODBC.cpp
    SQL_()扩展接口 DBODBCext.cpp
        安装程序 installer.cpp
        客户端程序 DBclient.cpp
        服务端程序 DBserver.cpp
        总调用文件 tzdb_driver.h

[10.18]
项目目录：
宏定义关键字表 ras_keyword.h
    技术栈调用文件 ras_lib.h
        公用代码 global.cpp
            上层抽象类及数据结构 struct.cpp
                网络通信组件 communicate.cpp
                    通信协议以及指令分析 connect.cpp
                        连接池 connect_pool.h
                访问控制接口[转换]access_per.cpp
                日志文件接口[转换] log_api.cpp
                数据库SQL标准接口[转换] sql_api.cpp //启用，该接口无意义
TZDB相关服务端主要函数 server.cpp
C++接口函数(客户端) libtzdb.cpp
    环境句柄管理与操作 env.cpp
    语句句柄管理与操作 stmt.cpp
    连接句柄管理与操作 dbc.cpp
    描述符句柄管理与操作 desc.cpp
    SQL_()标准接口 DBODBC.cpp
    SQL_()扩展接口 DBODBCext.cpp
        ODBC主要数据结构及方法 tzdb_odbc_driver.h
驱动程序 tzdb-odbc.dll

配置驱动 tzdb-odbc-setup.dll
安装程序 installer.cpp

## 关键信息格式

### 驱动描述符

## API接口实现

### API接口全集

| 函数名称                             |
|-------------------------------------|
| SQLAllocHandle                      |
| SQLConnect                          |
| SQLDriverConnect                    |
| SQLBrowseConnect                    |
| SQLDataSources SQLDrivers           |
| SQLGetInfo                          |
| SQLGetFunctions                     |
| SQLGetTypeInfo                      |
| SQLSetConnectAttr SQLGetConnectAttr |
| SQLSetEnvAttr                       |
| SQLGetEnvAttr                       |
| SQLSetStmtAttr                      |
| SQLGetStmtAttr                      |
| SQLGetDescField SQLGetDescRec       |
| SQLSetDescField                     |
| SQLSetDescRec                       |
| SQLCopyDesc                         |
| SQLPrepare                          |
| SQLBindParameter                    |
| SQLGetCursorName                    |
| SQLSetCursorName                    |
| SQLSetScrollOptions                 |
| SQLExecute SQLExecDirect            |
| SQLNativeSql                        |
| SQLDescribeParam                    |
| SQLNumParams                        |
| SQLParamData                        |
| SQLPutData                          |
| SQLRowCount SQLNumResultCols        |
| SQLDescribeCol                      |
| SQLColAttribute                     |
| SQLBindCol                          |
| SQLFetch                            |
| SQLFetchScroll                      |
| SQLGetData                          |
| SQLSetPos                           |
| SQLBulkOperations                   |
| SQLMoreResults                      |
| SQLGetDiagField                     |
| SQLGetDiagRec                       |
| SQLColumnPrivileges SQLColumns      |
| SQLForeignKeys                      |
| SQLPrimaryKeys                      |
| SQLProcedureColumns                 |
| SQLProcedures                       |
| SQLSpecialColumns                   |
| SQLStatistics                       |
| SQLTablePrivileges                  |
| SQLTables                           |
| SQLFreeStmt                         |
| SQLCloseCursor                      |
| SQLCancel                           |
| SQLCancelHandle                     |
| SQLEndTran                          |
| SQLDisconnect SQLFreeHandle         |

### SQL_() def

SQLAllocHandle
SQLBindCol
SQLBindParameter
SQLBrowseConnect
SQLBulkOperations
SQLCancel
SQLCancelHandle
SQLCloseCursor
SQLColAttribute
SQLColumnPrivileges
SQLColumns
SQLConnect
SQLCopyDesc
SQLDescribeCol
SQLDescribeParam
SQLDisconnect
SQLDriverConnect
SQLEndTran
SQLExecDirect
SQLExecute
SQLFetch
SQLFetchScroll
SQLFreeStmt
SQLFreeHandle
SQLForeignKeys
SQLGetConnectAttr
SQLGetCursorName
SQLGetDescField
SQLGetDescRec
SQLGetDiagField
SQLGetDiagRec
SQLGetData
SQLGetEnvAttr
SQLGetFunctions
SQLGetInfo
SQLGetStmtAttr
SQLGetTypeInfo
SQLMoreResults
SQLNativeSql
SQLNumParams
SQLNumResultCols
SQLParamData
SQLPrepare
SQLPrimaryKeys
SQLProcedureColumns
SQLProcedures
SQLPutData
SQLRowCount
SQLSetCursorName
SQLSetDescField
SQLSetDescRec
SQLSetEnvAttr
SQLSetConnectAttr
SQLSetPos
SQLSetStmtAttr
SQLSpecialColumns
SQLStatistics
SQLTables
SQLTablePrivileges

### SQL_()标准接口

```C++
/*
  @type    : ODBC 3.8
  @purpose : Mapped to SQLCancel if HandleType is
*/

SQLRETURN SQL_API SQLAllocHandle(SQLSMALLINT HandleType,
    SQLHANDLE   InputHandle,
    _Out_ SQLHANDLE* OutputHandlePtr)
{

}

/*
  @type    : ODBC 1.0 API
  @purpose : binds application data buffers to columns in the result set
*/

SQLRETURN  SQL_API SQLBindCol(SQLHSTMT StatementHandle,
    SQLUSMALLINT ColumnNumber, SQLSMALLINT TargetType,
    _Inout_updates_opt_(_Inexpressible_(BufferLength)) SQLPOINTER TargetValue,
    SQLLEN BufferLength, _Inout_opt_ SQLLEN* StrLen_or_Ind)
{

}

/*
  @type    : ODBC 2.0 API
  @purpose : binds a buffer to a parameter marker in an SQL statement.
*/

SQLRETURN SQL_API SQLBindParameter( SQLHSTMT        hstmt,
                                    SQLUSMALLINT    ipar,
                                    SQLSMALLINT     fParamType,
                                    SQLSMALLINT     fCType,
                                    SQLSMALLINT     fSqlType,
                                    SQLULEN         cbColDef,
                                    SQLSMALLINT     ibScale,
                                    SQLPOINTER      rgbValue,
                                    SQLLEN          cbValueMax,
                                    SQLLEN* pcbValue)
{

}

/**
  Cancel the query by opening another connection and using KILL when called
  from another thread while the query lock is being held. Otherwise, treat as
  SQLFreeStmt(hstmt, SQL_CLOSE).

  @param[in]  hstmt  Statement handle

  @return Standard ODBC result code
*/
SQLRETURN SQL_API SQLCancel(SQLHSTMT hstmt)
{

}

/*
  @type    : ODBC 3.8
  @purpose : Mapped to SQLCancel if HandleType is
*/
SQLRETURN SQL_API SQLCancelHandle(SQLSMALLINT  HandleType,
    SQLHANDLE    Handle)
{

}

/*
  @type    : ODBC 3.0 API
  @purpose : closes a cursor that has been opened on a statement
  and discards any pending results
*/

SQLRETURN SQL_API SQLCloseCursor(SQLHSTMT Handle)
{

}

SQLRETURN SQL_API
SQLColAttribute(SQLHSTMT hstmt, SQLUSMALLINT column,
    SQLUSMALLINT field, SQLPOINTER char_attr,
    SQLSMALLINT char_attr_max, SQLSMALLINT* char_attr_len,
#ifdef USE_SQLCOLATTRIBUTE_SQLLEN_PTR
    SQLLEN* num_attr
#else
    SQLPOINTER num_attr
#endif
)
{

}

SQLRETURN SQL_API
SQLColumns(SQLHSTMT hstmt, SQLCHAR* catalog, SQLSMALLINT catalog_len,
    SQLCHAR* schema, SQLSMALLINT schema_len,
    SQLCHAR* table, SQLSMALLINT table_len,
    SQLCHAR* column, SQLSMALLINT column_len)
{

}

#ifdef Drive_MANAGEMENT_
// Only implemented in the ODBC Driver Manager
SQLRETURN SQL_API SQLCompleteAsync(SQLSMALLINT    HandleType,
    SQLHANDLE      Handle,
    _Out_ RETCODE* AsyncRetCodePtr){}

SQLRETURN  SQL_API SQLDataSources(SQLHENV EnvironmentHandle,
    SQLUSMALLINT Direction, _Out_writes_opt_(BufferLength1) SQLCHAR* ServerName,
    SQLSMALLINT BufferLength1, _Out_opt_ SQLSMALLINT* NameLength1Ptr,
    _Out_writes_opt_(BufferLength2) SQLCHAR* Description, SQLSMALLINT BufferLength2,
    _Out_opt_ SQLSMALLINT* NameLength2Ptr){}

SQLRETURN SQLDrivers(
    SQLHENV         EnvironmentHandle,
    SQLUSMALLINT    Direction,
    SQLCHAR* DriverDescription,
    SQLSMALLINT     BufferLength1,
    SQLSMALLINT* DescriptionLengthPtr,
    SQLCHAR* DriverAttributes,
    SQLSMALLINT     BufferLength2,
    SQLSMALLINT* AttributesLengthPtr){}
#endif // Drive_MANAGEMENT_

SQLRETURN SQL_API
SQLConnect(SQLHDBC hdbc, SQLCHAR* dsn, SQLSMALLINT dsn_len_in,
    SQLCHAR* user, SQLSMALLINT user_len_in,
    SQLCHAR* auth, SQLSMALLINT auth_len_in)
{

}

SQLRETURN SQL_API
SQLCopyDesc(SQLHDESC SourceDescHandle, SQLHDESC TargetDescHandle)
{

}

SQLRETURN SQL_API
SQLDescribeCol(SQLHSTMT hstmt, SQLUSMALLINT column,
    SQLCHAR* name, SQLSMALLINT name_max, SQLSMALLINT* name_len,
    SQLSMALLINT* type, SQLULEN* size, SQLSMALLINT* scale,
    SQLSMALLINT* nullable)
{

}

/**
  Disconnect a connection.

  @param[in]  hdbc   Connection handle

  @return  Standard ODBC return codes

  @since ODBC 1.0
  @since ISO SQL 92
*/
SQLRETURN SQL_API SQLDisconnect(SQLHDBC hdbc)
{

}

/**
  Commit or roll back the transactions associated with a particular
  database connection, or all connections in an environment.

  @param[in] HandleType      Type of @a Handle, @c SQL_HANDLE_ENV or
                             @c SQL_HANDLE_DBC
  @param[in] Handle          Handle to database connection or environment
  @param[in] CompletionType  How to complete the transactions,
                             @c SQL_COMMIT or @c SQL_ROLLBACK

  @since ODBC 3.0
  @since ISO SQL 92
*/
SQLRETURN SQL_API
SQLEndTran(SQLSMALLINT HandleType,
    SQLHANDLE   Handle,
    SQLSMALLINT CompletionType)
{

}

SQLRETURN SQL_API
SQLExecDirect(SQLHSTMT hstmt, SQLCHAR* str, SQLINTEGER str_len)
{

}

/*
  @type    : ODBC 1.0 API
  @purpose : executes a prepared statement, using the current values
  of the parameter marker variables if any parameter markers
  exist in the statement
*/

SQLRETURN SQL_API SQLExecute(SQLHSTMT hstmt)
{

}

/*
  @type    : ODBC 1.0 API
  @purpose : fetches the next rowset of data from the result set and
  returns data for all bound columns
*/

SQLRETURN SQL_API SQLFetch(SQLHSTMT StatementHandle)
{

}

/*
  @type    : ODBC 3.0 API
  @purpose : fetches the specified rowset of data from the result set and
  returns data for all bound columns. Rowsets can be specified
  at an absolute or relative position
*/

SQLRETURN SQL_API SQLFetchScroll(SQLHSTMT      StatementHandle,
    SQLSMALLINT   FetchOrientation,
    SQLLEN        FetchOffset)
{

}

/*
  @type    : ODBC 3.0 API
  @purpose : frees resources associated with a specific environment,
       connection, statement, or descriptor handle
*/

SQLRETURN SQL_API SQLFreeHandle(SQLSMALLINT HandleType,
    SQLHANDLE   Handle)
{

}

/*
  @type    : ODBC 1.0 API
  @purpose : stops processing associated with a specific statement,
       closes any open cursors associated with the statement,
       discards pending results, or, optionally, frees all
       resources associated with the statement handle
*/

SQLRETURN SQL_API SQLFreeStmt(SQLHSTMT hstmt, SQLUSMALLINT fOption)
{

}

SQLRETURN SQL_API
SQLGetConnectAttr(SQLHDBC hdbc, SQLINTEGER attribute, SQLPOINTER value,
    SQLINTEGER value_max, SQLINTEGER* value_len)
{

}

SQLRETURN SQL_API
SQLGetCursorName(SQLHSTMT hstmt, SQLCHAR* cursor, SQLSMALLINT cursor_max,
    SQLSMALLINT* cursor_len)
{

}

/*
  @type    : ODBC 1.0 API
  @purpose : retrieves data for a single column in the result set. It can
  be called multiple times to retrieve variable-length data
  in parts
*/

SQLRETURN SQL_API SQLGetData(SQLHSTMT      StatementHandle,
    SQLUSMALLINT  ColumnNumber,
    SQLSMALLINT   TargetType,
    SQLPOINTER    TargetValuePtr,
    SQLLEN        BufferLength,
    SQLLEN* StrLen_or_IndPtr)
{

}

SQLRETURN SQL_API
SQLGetDescField(SQLHDESC hdesc, SQLSMALLINT record, SQLSMALLINT field,
    SQLPOINTER value, SQLINTEGER value_max, SQLINTEGER* value_len)
{

}


SQLRETURN SQL_API
SQLGetDescRec(SQLHDESC hdesc, SQLSMALLINT record, SQLCHAR* name,
    SQLSMALLINT name_max, SQLSMALLINT* name_len, SQLSMALLINT* type,
    SQLSMALLINT* subtype, SQLLEN* length, SQLSMALLINT* precision,
    SQLSMALLINT* scale, SQLSMALLINT* nullable)
{

}

SQLRETURN SQL_API
SQLGetDiagField(SQLSMALLINT handle_type, SQLHANDLE handle,
    SQLSMALLINT record, SQLSMALLINT field,
    SQLPOINTER info, SQLSMALLINT info_max,
    SQLSMALLINT* info_len)
{

}

SQLRETURN SQL_API
SQLGetDiagRec(SQLSMALLINT handle_type, SQLHANDLE handle,
    SQLSMALLINT record, SQLCHAR* sqlstate,
    SQLINTEGER* native_error, SQLCHAR* message,
    SQLSMALLINT message_max, SQLSMALLINT* message_len)
{

}

/*
  @type    : ODBC 3.0 API
  @purpose : returns the environment attributes
*/

SQLRETURN  SQL_API SQLGetEnvAttr(SQLHENV EnvironmentHandle,
    SQLINTEGER Attribute, _Out_writes_(_Inexpressible_(BufferLength)) SQLPOINTER Value,
    SQLINTEGER BufferLength, _Out_opt_ SQLINTEGER* StringLength)
{

}

/**
Get information on which functions are supported by the driver.

@param[in]  hdbc      Handle of database connection
@param[in]  fFunction Function to check, @c SQL_API_ODBC3_ALL_FUNCTIONS,
or @c SQL_API_ALL_FUNCTIONS
@param[out] pfExists  Pointer to either one @c SQLUSMALLINT or an array
of SQLUSMALLINT for returning results

@since ODBC 1.0
@since ISO SQL 92
*/
SQLRETURN SQL_API SQLGetFunctions(SQLHDBC hdbc,
    SQLUSMALLINT fFunction,
    SQLUSMALLINT * pfExists)
{

}

/*
  @type    : ODBC 1.0 API
  @purpose : returns general information about the driver and 
  data source associated with a connection
  @since ISO SQL 92
*/


SQLRETURN SQL_API
SQLGetInfo(SQLHDBC hdbc, SQLUSMALLINT type, SQLPOINTER value,
    SQLSMALLINT value_max, SQLSMALLINT* value_len)
{

}

SQLRETURN SQL_API
SQLGetStmtAttr(SQLHSTMT hstmt, SQLINTEGER attribute, SQLPOINTER value,
    SQLINTEGER value_max, SQLINTEGER* value_len)
{

}

SQLRETURN SQL_API
SQLGetTypeInfo(SQLHSTMT hstmt, SQLSMALLINT type)
{

}

/*
  @type    : ODBC 1.0 API
  @purpose : returns the number of columns in a result set
*/

SQLRETURN SQL_API SQLNumResultCols(SQLHSTMT  hstmt, SQLSMALLINT* pccol)
{

}

/*
  @type    : ODBC 1.0 API
  @purpose : is used in conjunction with SQLPutData to supply parameter
  data at statement execution time
*/

SQLRETURN SQL_API SQLParamData(SQLHSTMT hstmt, SQLPOINTER* prbgValue)
{

}

SQLRETURN SQL_API
SQLPrepare(SQLHSTMT hstmt, SQLCHAR* str, SQLINTEGER str_len)
{

}

SQLRETURN SQL_API
SQLPrimaryKeys(SQLHSTMT hstmt,
    SQLCHAR* catalog, SQLSMALLINT catalog_len,
    SQLCHAR* schema, SQLSMALLINT schema_len,
    SQLCHAR* table, SQLSMALLINT table_len)
{

}

/*
  @type    : ODBC 1.0 API
  @purpose : allows an application to send data for a parameter or column to
  the driver at statement execution time. This function can be used
  to send character or binary data values in parts to a column with
  a character, binary, or data source specific data type.
*/

SQLRETURN SQL_API SQLPutData(SQLHSTMT      hstmt,
    SQLPOINTER    rgbValue,
    SQLLEN        cbValue)
{

}

/*
  @type    : ODBC 1.0 API
  @purpose : returns the number of rows affected by an UPDATE, INSERT,
  or DELETE statement;an SQL_ADD, SQL_UPDATE_BY_BOOKMARK,
  or SQL_DELETE_BY_BOOKMARK operation in SQLBulkOperations;
  or an SQL_UPDATE or SQL_DELETE operation in SQLSetPos
*/

SQLRETURN SQL_API SQLRowCount(SQLHSTMT hstmt,
    SQLLEN* pcrow)
{

}

SQLRETURN SQL_API
SQLSetCursorName(SQLHSTMT hstmt, SQLCHAR* name, SQLSMALLINT name_len)
{

}

SQLRETURN SQL_API
SQLSetDescField(SQLHDESC hdesc, SQLSMALLINT record, SQLSMALLINT field,
    SQLPOINTER value, SQLINTEGER value_len)
{

}

SQLRETURN SQL_API
SQLSetDescRec(SQLHDESC hdesc, SQLSMALLINT record, SQLSMALLINT type,
    SQLSMALLINT subtype, SQLLEN length, SQLSMALLINT precision,
    SQLSMALLINT scale, SQLPOINTER data_ptr,
    SQLLEN* octet_length_ptr, SQLLEN* indicator_ptr)
{

}

/*
  @type    : ODBC 3.0 API
  @purpose : sets the environment attributes
*/

SQLRETURN SQL_API
SQLSetEnvAttr(SQLHENV    henv,
    SQLINTEGER Attribute,
    SQLPOINTER ValuePtr,
    SQLINTEGER StringLength )
{

}

SQLRETURN SQL_API
SQLSetStmtAttr(SQLHSTMT hstmt, SQLINTEGER attribute,
    SQLPOINTER value, SQLINTEGER value_len)
{

}

SQLRETURN SQL_API
SQLSpecialColumns(SQLHSTMT hstmt, SQLUSMALLINT type,
    SQLCHAR* catalog, SQLSMALLINT catalog_len,
    SQLCHAR* schema, SQLSMALLINT schema_len,
    SQLCHAR* table, SQLSMALLINT table_len,
    SQLUSMALLINT scope, SQLUSMALLINT nullable)
{

}

SQLRETURN SQL_API
SQLStatistics(SQLHSTMT hstmt,
    SQLCHAR* catalog, SQLSMALLINT catalog_len,
    SQLCHAR* schema, SQLSMALLINT schema_len,
    SQLCHAR* table, SQLSMALLINT table_len,
    SQLUSMALLINT unique, SQLUSMALLINT accuracy)
{

}

SQLRETURN SQL_API
SQLTablePrivileges(SQLHSTMT hstmt,
    SQLCHAR* catalog, SQLSMALLINT catalog_len,
    SQLCHAR* schema, SQLSMALLINT schema_len,
    SQLCHAR* table, SQLSMALLINT table_len)
{

}

SQLRETURN SQL_API
SQLTables(SQLHSTMT hstmt,
    SQLCHAR* catalog, SQLSMALLINT catalog_len,
    SQLCHAR* schema, SQLSMALLINT schema_len,
    SQLCHAR* table, SQLSMALLINT table_len,
    SQLCHAR* type, SQLSMALLINT type_len)
{

}
```

### SQL_()扩展接口

```C++
/**
  Discover and enumerate the attributes and attribute values required to
  connect.

  @return Always returns @c SQL_ERROR, because the driver does not support this.

  @since ODBC 1.0
*/
SQLRETURN SQL_API
SQLBrowseConnect(SQLHDBC hdbc, SQLCHAR* in, SQLSMALLINT in_len,
    SQLCHAR* out, SQLSMALLINT out_max, SQLSMALLINT* out_len)
{

}

/*
  @type    : ODBC 1.0 API
  @purpose : performs bulk insertions and bulk bookmark operations,
  including update, delete, and fetch by bookmark
*/

SQLRETURN SQL_API SQLBulkOperations(SQLHSTMT  Handle, SQLSMALLINT Operation)
{

}

SQLRETURN SQL_API
SQLColumnPrivileges(SQLHSTMT hstmt,
    SQLCHAR* catalog, SQLSMALLINT catalog_len,
    SQLCHAR* schema, SQLSMALLINT schema_len,
    SQLCHAR* table, SQLSMALLINT table_len,
    SQLCHAR* column, SQLSMALLINT column_len)
{

}

/*
  @type    : ODBC 1.0 API
  @purpose : returns the description of a parameter marker associated
  with a prepared SQL statement
*/

SQLRETURN SQL_API SQLDescribeParam(
    SQLHSTMT           hstmt,
    SQLUSMALLINT       ipar,
    _Out_opt_
    SQLSMALLINT* pfSqlType,
    _Out_opt_
    SQLULEN* pcbParamDef,
    _Out_opt_
    SQLSMALLINT* pibScale,
    _Out_opt_
    SQLSMALLINT* pfNullable)
{

}

SQLRETURN SQL_API
SQLDriverConnect(SQLHDBC hdbc, SQLHWND hwnd, SQLCHAR* in, SQLSMALLINT in_len,
    SQLCHAR* out, SQLSMALLINT out_max, SQLSMALLINT* out_len,
    SQLUSMALLINT completion)
{

}

SQLRETURN SQL_API
SQLForeignKeys(SQLHSTMT hstmt,
    SQLCHAR* pk_catalog, SQLSMALLINT pk_catalog_len,
    SQLCHAR* pk_schema, SQLSMALLINT pk_schema_len,
    SQLCHAR* pk_table, SQLSMALLINT pk_table_len,
    SQLCHAR* fk_catalog, SQLSMALLINT fk_catalog_len,
    SQLCHAR* fk_schema, SQLSMALLINT fk_schema_len,
    SQLCHAR* fk_table, SQLSMALLINT fk_table_len)
{

}

/*
  @type    : ODBC 1.0 API
  @purpose : determines whether more results are available on a statement
  containing SELECT, UPDATE, INSERT, or DELETE statements and,
  if so, initializes processing for those results
*/

SQLRETURN SQL_API SQLMoreResults(SQLHSTMT hStmt)
{

}

SQLRETURN SQL_API
SQLNativeSql(SQLHDBC hdbc, SQLCHAR* in, SQLINTEGER in_len,
    SQLCHAR* out, SQLINTEGER out_max, SQLINTEGER* out_len)
{

}

/*
  @type    : ODBC 1.0 API
  @purpose : returns the number of parameter markers.
*/

SQLRETURN SQL_API SQLNumParams(SQLHSTMT hstmt, SQLSMALLINT* pcpar)
{

}

SQLRETURN SQL_API
SQLProcedureColumns(SQLHSTMT hstmt,
    SQLCHAR* catalog, SQLSMALLINT catalog_len,
    SQLCHAR* schema, SQLSMALLINT schema_len,
    SQLCHAR* proc, SQLSMALLINT proc_len,
    SQLCHAR* column, SQLSMALLINT column_len)
{

}

SQLRETURN SQL_API
SQLProcedures(SQLHSTMT hstmt,
    SQLCHAR* catalog, SQLSMALLINT catalog_len,
    SQLCHAR* schema, SQLSMALLINT schema_len,
    SQLCHAR* proc, SQLSMALLINT proc_len)
{

}

/*
  @type    : ODBC 1.0 API
  @purpose : sets the cursor position in a rowset and allows an application
  to refresh data in the rowset or to update or delete data in
  the result set
*/

SQLRETURN SQL_API SQLSetPos(SQLHSTMT hstmt, SQLSETPOSIROW irow,
    SQLUSMALLINT fOption, SQLUSMALLINT fLock)
{

}
```

## Python 接口

Note, pyodbc contains C++ extensions so you will need a suitable C++ compiler on your computer to install pyodbc, for all operating systems. 

It implements the DB API 2.0 specification but is packed with even more Pythonic convenience.

## Recording

1）C++环境连接请求信息管理：提供嵌入式数据库对C++环境协议连接请求信息的管理功能，包括对用户身份认证信息、用户连接信息句柄、用户指令信息、指令关联信息、客户端套接字、客户端地址数据、客户端接口信息、客户端监听等信息的管理；
2）C++环境连接池信息管理：提供嵌入式数据库对C++环境连接池信息的管理功能，包括对连接池队列、传输连接句柄、连接池信息、连接目标信息、连接池缓冲区信息、服务端套接字、服务端地址、服务端接口信息、服务端监听的管理；
3）C++事务逻辑信息管理：提供嵌入式数据库对C++事务逻辑信息的管理功能，包括对事务操作句柄、事务队列维护信息、事务关联信息、事务隔离级别的管理；
4）C++日志文件信息管理：提供嵌入式数据库对C++日志文件信息的管理功能，包括对远程日志文件信息、日志文件偏移量、远程日志数据更新信息的管理；
5）C++数据库标识信息管理：提供嵌入式数据库对C++数据库标识信息的管理功能，包括对数据库版本数据、数据库功能数据、数据库状态数据、数据库接口数据、数据库缓冲区句柄的管理；
6）C++句柄信息管理：提供嵌入式数据库对C++句柄信息的管理功能，包括对传输缓冲区句柄、驱动连接缓冲区句柄、日志文件缓冲区句柄、绑定偏移量的管理；
7）C++结果集格式转换信息管理：提供嵌入式数据库对C++结果集格式转换信息的管理功能，包括对结果集数据、结果集格式规则数据、结果集目标地址数据、结果集关联数据等信息的管理；
8）C++异常处理信息管理：提供嵌入式数据库对C++异常处理信息的管理功能，包括对异常信息数据、异常结构信息数据、异常处理数据、异常权限关联数据的管理。
9）C++接口一致性信息管理：提供嵌入式数据库对C++接口一致性信息的管理功能，包括对适配接口信息、接口规则信息、C++规则数据、C++版本数据、C++接口数据、接口一致性级别信息的管理。
10）C++用户身份验证信息的管理：提供嵌入式数据库对C++用户身份验证信息的管理功能，包括对远程用户名称数据、远程用户名口令数据、远程用户权限信息、远程用户关联信息的管理。
11）C++联合接口与协议规则的管理：提供嵌入式数据库对C++联合接口与协议规则的管理功能，包括对SQL版本信息、SQL规则数据、用户目标环境信息、功能支持信息、SQL解析定位信息、SQL一致性级别信息、类型指示器信息的管理。
12）C++连接驱动的管理：提供嵌入式数据库对C++连接驱动的管理功能，包括对    驱动版本信息、驱动运行状态信息、驱动内存信息、驱动连接句柄、驱动连接队列、驱动指令数据、驱动事务队列、驱动线程信息、驱动一致性级别的管理。

## 代码存留


    //if (inet_addr("0.0.0.0") == INADDR_ANY)
    //    printf("0.0.0.0 is equal\n");//right

    //return create_user_db();


# EOF
