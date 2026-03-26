---
title: "RemoteAccess模块Research记录"
description: "远程访问模块技术调研记录"
---


# 远程访问模块项目调研文档

## 一、项目目标

### 产品需求：

1. 供用户调用的`远程访问工具`，在开放了网络的情况下远程访问数据库。
2. 符合ODBC的标准接口。
3. 支持多种语言python、C++、java的调度接口。

### 远程接口：

* C/C++
* Python
* JAVA - JDBC
* ODBC

### 调研方向：

1. 整体架构，理论级层面探讨。
2. 模块方式，表现为功能点，大体方案。
3. 细节方式，表现为具体实现，可实行的方案。

### 调研过程
1. 对于Microsoft官方ODBC文档进行学习
2. 搭建环境进行连接：
    * 使用microsoft官方odbc32.lib对sql server进行连接
        对mysql进行连接
    * 使用mysql_connect_odbc远程连接mysql
    * sqlite源码启动与查看
    * Berkeley DB查看

## 二、ODBC调研

### 定义

1. ODBC定义
    * ODBC是一个接口，是标准。接口的表现方式为函数或者类，是一个标准。
    * 基于`调用级别接口 (CLI) 规范从开放组，ISO/IEC `用于数据库 Api，并使用结构化查询语言 (SQL) 作为其数据库访问语言。
    * ODBC 旨在实现最大互操作性 ，即单个应用程序使用相同的源代码访问不同数据库管理系统 (dbms)的能力。
    * ODBC 旨在公开数据库功能，而不是对其进行补充。(所以缺少的库编写时必须分开)
2. 驱动程序的理解
    驱动程序是软件程序。驱动程序是介于操作系统和硬件之间的部分。操作系统具有普遍性的特点，几乎所有人使用的操作系统都是屈指可数的。计算机本身的硬件功能可以通过添加硬件设备来完成，而操作系统无法直接调度硬件。所以衍生出驱动程序以提供软件接口，使得操作系统可以调度硬件设备。例如显示器驱动、声卡驱动。
3. ODBC定位
    ODBC即是驱动，提供调用数据库的接口。

### 架构

ODBC的架构：

1. 应用程序：
    指客户端使用的程序。可以接触到的是驱动程序。
2. 驱动程序管理器
    负责响应应用程序连接，管理应用程序和驱动程序之间的通信，例如连接和断开。
    通过驱动程序管理器，解决了所有应用程序通用的一些问题。 其中包括根据数据源名称确定要加载的驱动程序、加载和卸载驱动程序以及在驱动程序中调用函数。
    *大多数情况下，驱动程序管理器只是将函数调用从应用程序传递到正确的驱动程序。*
    驱动程序管理器的最终主要角色是加载和卸载驱动程序。 应用程序仅加载并卸载驱动程序管理器。
    表现级为动态连接库(DLL)。
3. 驱动程序
    ①连接到数据源和从数据源断开连接。
    ②开始事务。
    ③向数据源提交要执行的 SQL 语句。 驱动程序必须将 ODBC SQL 修改为特定于 DBMS 的 SQL;这通常仅限于将 ODBC 定义的转义子句替换为 DBMS 特定的 SQL。
    ④将数据发送到数据源和从数据源中检索数据，包括转换应用程序指定的数据类型。
    ⑤返回错误处理。并检查。
    有两种，基于文件的和基于DBMS。区别在于是否通过单独的`数据库引擎`访问物理数据。
4. 数据源
    数据源也有两种情况，是否提供数据库引擎，内容不再赘述。


> Omitted unresolved image: 程序架构图 (\ODBC_Research\程序架构图.png)


### 功能点

基本功能点：
1. 响应连接请求。
2. 对与应用程序连接进行管理，维持连接并 且管理，连接池模块。
3. 事务逻辑。如何安全执行一个元操作。
7. 适应C++/JDBC/Python/ODBC。类似于壳。

额外功能点：
1. 联合接口与协议规则，考虑对数据源的接口方式。规定程序内部各个接口协议。转换SQL语句使其符合DBMS的SQL语句。感知ODBC连接。
6. 身份验证。建立用户数据库，存储用户名密码和权限管理。
11. 结果集格式转换

软件资源功能点：
1. 连接驱动，对驱动程序进行管理、维护以及升级。
13. 服务器代理
14. 中间件

必要非主要功能点：
1. 日志文件
10. 资源管理
12. [异常处理](https://dev.mysql.com/doc/connector-odbc/en/connector-odbc-reference-errorcodes.html)

内部数据功能点：
1. 数据库内部信息

### 参数标准

ODBC 符合以下规范和标准，它们处理 (CLI) 的调用级别接口。(ODBC功能是每种标准的超集。)
* 开放式组 CAE 规范 "数据管理： SQL 调用级接口 (CLI) "
* ISO/IEC 9075-3:1995 (E) (SQL/CLI 的调用级别接口)

### 驱动管理器调用过程

按理来说在驱动dll中重写了各种标准接口，并且Def定义并提供。
之后应用程序调用标准接口函数时，驱动管理程序将应用程序的调用方式传递给驱动dll，执行dll中的函数接口内容。

但是目前并没有执行相关的函数。

重新审查ODBC SQL函数调用过程。驱动管理器如何判断调用哪个驱动程序？

关键就在于，应用程序并没有传递相关的信息。

`在应用程序调用函数(SQLConnect、SQLDriverConnect或SQLBrowseConnect)连接到驱动程序之前，驱动程序管理器不会连接到驱动程序。在此之前，驱动程序管理器使用自己的句柄并管理连接信息。`

ERROR [IM014] [Microsoft][ODBC 驱动程序管理器] 在指定的 DSN 中，驱动程序和应用程序之间的体系结构不匹配

该错误产生是因为应用程序和dll支持的操作系统不一致，32位和64位。

Connection Failed[Microsoft][ODBC 驱动程序管理器] 驱动程序的 SQLAllocHandle on SQL_HANDLE_ENV 失败


## 三、Mysql调研

Mysql提供了基于各种语言和ODBC的链接方式。使得使用不同的语言可以通过调用提供的文件包，进而进行对数据库的连接。

### 环境参考资源

1. 微软官方ODBC的odbc.lib库。
2. MYSQL ODBC源码。
3. MYSQL源代码。

### Mysql ODBC代码调用结构

最上层为SQL_()函数，其中调用的是MYSQL_()函数，再次之调用的是mysql_()函数。
其中mysql_()函数为mysql源码中的函数。用到的数据结构多是自主定义的。
而SQL_()层和MYSQL_()层用到的数据结构则多是调用的微软官方ODBC数据结构。

其中宽字节的区别定义发生在SQL_()层，额外定义了SQL_W()函数，该函数中直接调用了MYSQL_()函数。

所以这条线的调用层次如下：

    SQLconnect()
    MySQLConnect()
    mysql_real_connect()

调用的.h如下：
```C++
# include <sql.h>
# include <sqlext.h>
# include <odbcinst.h>
```

该部分主要调研两条线， SQLConnect() 函数的调用过程和 SQLExecDirect() 。

SQLConnect()确实在最后进行了Socket的连接。

但是 SQLExecDirect() 只发现了重新连接，函数定义中断了。
这部分如果可以截取到包信息，或许可以分析其中是否含有语句。根据网上参考资料包，里面是有执行的语句的。

### ODBC通信方式

Mysql依照特定的指令方式，使用可识别的通信协议，进行传输指令等信息。客户端以主动连接的方式进行，而服务端以服务程序的方式对指定端口进行监听。

### Windows下的标准模型

其中mysql的驱动程序文件为myodbc8a.dll和myodbc8w.dll，两种编码格式。

安装程序 DLL 会在注册表中维护有关每个已安装 [ODBC 组件的信息](https://docs.microsoft.com/zh-cn/sql/odbc/reference/install/registry-entries-for-odbc-components?view=sql-server-ver15)。 在运行 Microsoft Windows NT 和 Microsoft Windows 95/98 的计算机上，此信息存储在注册表中以下项下的子项中：

```C++
HKEY_LOCAL_MACHINE\SOFTWARE\ODBC\Odbcinst.ini
```


> Omitted unresolved image: windowsODBC标准模型 (\ODBC_Research\windowsODBC标准模型.png)


## 四、其他接口方式

### C++连接方式

### python连接方式

pyodbc

### java连接方式

jdbc

## 五、开发准备工作

### 与现有成品的磨合情况

## 六、问题与思考索引

[8.19]
1. SQL语句相关的操作主要完成了什么样的操作呢？
该部分主要是对句柄进行操作，使得环境中的调度合理化。但是现有的AgilorE代码中含有语句句柄和连接句柄，这两部分如果分开完成是否会冗余取决于语句句柄和连接句柄中的解决形式。
如果有密切的关联，可以通过封装进一步完成调度。
主要时需要处理现有代码和将做的代码之间的联系。
2. 句柄满足什么样的操作

[before 8.19]
1. 数据库是怎么样被识别的。简单来说就是如何知道是我的数据库，而不是mysql或者sql server的身份。这一点也是不适用官方odbc.lib的原因。
这个问题其实并不存在。因为依照标准模型其实是不需要识别的。
驱动程序和数据源的通信过程依赖的是通信协议，其中并不需要去区分是什么类型的数据库。
2. 通信方式是什么样的。两条线，连接过程，sql指令的传输过程。

3. 是否存在官方的最底层ODBC，可供封装？

4. 连接池是否为必要的？发生在什么地方？似乎是在驱动管理程序部分。

1. 需要做的是什么？
如果从响应角度出发，那么直接做一个单端的东西就可以了，也就是远程访问服务模块。响应。但是难点是解析ODBC。
该问题转移为：客户端与服务端分布。
2. 基于第一个问题，需不需要去编写一个ODBC？
或者说，远程服务模块是否包含驱动程序。或者只是一个响应官方ODBC的东西。
问题是：
    1). ODBC的运行模式是什么？M1中使用ODBC，M2中还需要ODBC吗？
    2). 其他的数据库中会有吗？
    根据mysql-connect-odbc来看，是两端都有驱动程序的。
    3). 如果别人是用的官方的ODBC，那么又何以得知server上是我们的数据库呢。
问题解答：需要重新实现内部的API，使用官方(通指微软)ODBC接口和数据结构头文件。
3. 是否存在官方的底层ODBC实现，我们只需要在外部进行加壳？
官方有一套实现的方法，但是mysql是自主实现的。符合官方的ODBC接口，使用其提供的头文件数据结构。
1. [驱动程序]。首先ODBC可以连接到sql server，也可以连接到Mysql。既然是开源共用，那么ODBC驱动程序如果需要将SQL转换成DBMS可识别的。那么它何以转换？
该问题产生是对于ODBC驱动程序的角色定位不清楚。ODBC作为应用程序接口并不能完全连接到数据源，需要调用数据源提供或认可的ODBC驱动程序，通过驱动程序连接到数据源。
2. [驱动程序]。此系统是一个双端还是单端的？单端的。在引入数据库引擎这个概念之后，可知，数据源本身是可以包含数据库引擎的。
所以程序的流程是，引用程序调用驱动程序管理器，驱动程序管理器一般情况下直接调度驱动程序，驱动程序接收到指令之后，转换成可识别的格式，提交给数据源，数据源执行指令，返回数据或者修改内部数据。
服务端可以是只充当数据源，客户端含有应用程序和驱动程序。依次执行此步骤。
在实际的环境中，远程服务器只充当数据源，个人电脑中装有ODBC驱动API，在使用C/C++时，调用该API进而向远程数据库发送请求。

## Recording1

ODBC 组件(驱动程序)包括驱动程序管理器、驱动程序、转换器、安装程序 DLL、游标库和所有相关文件。

 the following are defined to be ODBC components:

* Core components. The Driver Manager, cursor library, installer DLL, and any other related files make up the core components and must be installed and removed as a group.
* Drivers. Each driver is a separate component.
* Translators. Each translator is a separate component.

Mysql下载的代码其实只有接口，程序运行时导入了lib库。
怀疑其中仍有源码。

方向：
1. 是否存在官方的最底层ODBC，可供封装。
2. 查看SQLite的实现过程。

如果ojdbc.jar是开源的，那只要读一下源码，不就知道oracle开放接口的协议细节了吗。这是不必要的，而且也是不安全的
而MySQL当然也是类似的道理，但是MySQL自身都是开源的，所以驱动也没有道理不开源吧
从这个模式我想到，对于C/S架构的应用，其实server-api也就是这么回事：把怎么连接server、提供什么服务封装好，提供给客户端开发者
一般server-api都有2个部分：
1、公开的部分，规范一点的还配有详细的文档，让客户端开发者来调用
2、私有的部分，是用来处理底层细节的，如建立连接，处理协议等等，这部分不是提供给客户端开发者调用的，但是又必须包含在server-api里

安装程序 DLL 会在注册表中维护有关每个已安装 ODBC 组件的信息。 在运行 Microsoft Windows NT 和 Microsoft Windows 95/98 的计算机上，此信息存储在注册表中以下项下的子项中：
HKEY_LOCAL_MACHINE\SOFTWARE\ODBC\Odbcinst.ini

整体逻辑推测：
1. 由ODBC安装程序在计算机windows 或者 Linux 上ODBC.ini进行注册，之后将dll文件放到指定文件夹，之后程序中使用时调用即可。
    odbc32.lib
    odbccp32.lib
2. 使用的是一套关于调用。

# 附录

## API

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

## 依赖库

大致上需要支持TCP/IP协议

```C++
//micosoft odbc
#include<iostream>
#include<string>
#include<windows.h>
#include<sql.h>
#include<sqlext.h>
#include<sqltypes.h>

//mysql odbc
#include <stdio.h>
#include <Windows.h>
#include <stdlib.h>
#include <winsock.h>
#include <string.h>

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <sys/types.h>
#ifdef _WIN32
#ifdef WIN32_LEAN_AND_MEAN
#include <winsock2.h>
#endif

#include <stdbool.h>

#include <io.h> /* access(), chmod() */
#if !defined(_WIN32)
#include <sys/socket.h>
#include <unistd.h>//不需要使用
#endif
#include <errno.h>
#include <limits.h>
#include <sys/types.h>  // Needed for mode_t, so IWYU pragma: keep.

#include <stdarg.h>
```

数据结构

```C++
typedef struct sockaddr_in {

#if(_WIN32_WINNT < 0x0600)
    short   sin_family;
#else //(_WIN32_WINNT < 0x0600)
    ADDRESS_FAMILY sin_family;
#endif //(_WIN32_WINNT < 0x0600)

    USHORT sin_port;
    IN_ADDR sin_addr;
    CHAR sin_zero[8];
} SOCKADDR_IN, *PSOCKADDR_IN;
```

```C++
//创建一个套接字
SOCKET
WSAAPI
socket(
    _In_ int af,
    _In_ int type,
    _In_ int protocol
    );

//绑定端口
int
WSAAPI
bind(
    _In_ SOCKET s,
    _In_reads_bytes_(namelen) const struct sockaddr FAR * name,
    _In_ int namelen
    );

//关闭套接字
int
WSAAPI
closesocket(
    _In_ SOCKET s
    );

//设置端口监听
int
WSAAPI
listen(
    _In_ SOCKET s,
    _In_ int backlog
    );

//等待连接请求
SOCKET
WSAAPI
accept(
    _In_ SOCKET s,
    _Out_writes_bytes_opt_(*addrlen) struct sockaddr FAR * addr,
    _Inout_opt_ int FAR * addrlen
    );

```

## API 详细功能


| 任务                   | 函数名称    | 度             | 用途        |
|----------------------|-------------------------------------|---------------|-------------------------------------------------------|
| 连接到数据源               | SQLAllocHandle                      | ISO 92        | 获取环境、连接、语句或描述符句柄。         |
|                      | SQLConnect                          | ISO 92        | 按数据源名称、用户 ID 和密码连接到特定驱动程序。                            |
|                      | SQLDriverConnect                    | ODBC          | 按连接字符串连接到特定驱动程序，或按驱动程序管理器和驱动程序为用户显示连接对话框的请求连接到特定驱动程序。 |
|                      | SQLBrowseConnect                    | ODBC          | 返回连接属性和有效属性值的连续级别。 为每个连接属性指定了值后，将连接到数据源。              |
| 获取有关驱动程序和数据源的信息      | SQLDataSources SQLDrivers           | ISO 92 ODBC   | 返回可用数据源的列表。 返回已安装的驱动程序及其属性的列表。                        |
|                      | SQLGetInfo                          | ISO 92        | 返回有关特定驱动程序和数据源的信息。        |
|                      | SQLGetFunctions                     | ISO 92        | 返回支持的驱动程序函数。 |
|                      | SQLGetTypeInfo                      | ISO 92        | 返回有关支持的数据类型的信息。 |
| 设置和检索驱动程序属性          | SQLSetConnectAttr SQLGetConnectAttr | ISO 92 ISO 92 | 设置连接属性。 返回连接属性的值。         |
|                      | SQLSetEnvAttr                       | ISO 92        | 设置环境特性。   |
|                      | SQLGetEnvAttr                       | ISO 92        | 返回环境属性的值。 |
|                      | SQLSetStmtAttr                      | ISO 92        | 设置语句特性。   |
|                      | SQLGetStmtAttr                      | ISO 92        | 返回语句特性的值。 |
| 设置和检索描述符字段           | SQLGetDescField SQLGetDescRec       | ISO 92 ISO 92 | 返回单个描述符字段的值。 返回多个描述符字段的值。 |
|                      | SQLSetDescField                     | ISO 92        | 设置单个描述符字段。   |
|                      | SQLSetDescRec                       | ISO 92        | 设置多个描述符字段。   |
|                      | SQLCopyDesc                         | ISO 92        | 将描述符信息从一个描述符句柄复制到另一个描述符句柄。                            |
| 准备 SQL 请求         | SQLPrepare                          | ISO 92        | 准备 SQL 语句以供以后执行。          |
|                      | SQLBindParameter                    | ODBC          | 为 SQL 语句中的参数赋值。 |
|                      | SQLGetCursorName                    | ISO 92        | 返回与语句句柄关联的游标名称。 |
|                      | SQLSetCursorName                    | ISO 92        | 指定游标名称。   |
|                      | SQLSetScrollOptions                 | ODBC          | 设置控制游标行为的选项。 |
| 提交请求                 | SQLExecute SQLExecDirect            | ISO 92 ISO 92 | 执行已准备的语句。 执行语句。 |
|                      | SQLNativeSql                        | ODBC          | 返回由驱动程序转换的 SQL 语句的文本。     |
|                      | SQLDescribeParam                    | ODBC          | 返回语句中特定参数的说明。   |
|                      | SQLNumParams                        | ISO 92        | 返回语句中的参数个数。  |
|                      | SQLParamData                        | ISO 92        | 与 SQLPutData 结合使用，以在执行时提供参数数据。  (用于长数据值。 )            |
|                      | SQLPutData                          | ISO 92        | 发送参数的部分或全部数据值。  (用于长数据值。 )                            |
| 检索结果和有关结果的信息         | SQLRowCount SQLNumResultCols        | ISO 92 ISO 92 | 返回受 insert、update 或 delete 请求影响的行数。 返回结果集中的列数。        |
|                      | SQLDescribeCol                      | ISO 92        | 描述结果集中的列。 |
|                      | SQLColAttribute                     | ISO 92        | 描述结果集中的列的属性。 |
|                      | SQLBindCol                          | ISO 92        | 为结果列分配存储并指定数据类型。          |
|                      | SQLFetch                            | ISO 92        | 返回多个结果行。|
|                      | SQLFetchScroll                      | ISO 92        | 返回滚动的结果行。 |
|                      | SQLGetData                          | ISO 92        | 返回结果集的一行中的一个或多个列。  (用于长数据值。 )                         |
|                      | SQLSetPos                           | ODBC          | 将游标定位在已提取的数据块中，并允许应用程序刷新行集中的数据或更新或删除结果集中的数据。          |
|                      | SQLBulkOperations                   | ODBC          | 执行批量插入和批量书签操作，包括更新、删除和按书签提取。                          |
|                      | SQLMoreResults                      | ODBC          | 确定是否有更多结果集可用，如果是这样，则初始化下一个结果集的处理。                     |
|                      | SQLGetDiagField                     | ISO 92        | 返回 (诊断数据结构) 的单个字段的其他诊断信息。 |
|                      | SQLGetDiagRec                       | ISO 92        | 返回 (诊断数据结构) 的多个字段的其他诊断信息。 |
| (目录函数获取有关数据源的系统表的信息) | SQLColumnPrivileges SQLColumns      | ODBC 打开组      | 返回一个或多个表的列和相关权限的列表。 返回指定表中的列名列表。                      |
|                      | SQLForeignKeys                      | ODBC          | 如果指定的表存在，则返回构成外键的列名的列表。   |
|                      | SQLPrimaryKeys                      | ODBC          | 返回构成表的主键的列名列表。  |
|                      | SQLProcedureColumns                 | ODBC          | 返回输入和输出参数的列表，以及构成指定过程的结果集的列。                          |
|                      | SQLProcedures                       | ODBC          | 返回存储在特定数据源中的过程名称的列表。      |
|                      | SQLSpecialColumns                   | 打开组           | 返回有关在指定表中唯一标识行的一组最佳列的信息，或在某一事务更新行中的任何值时自动更新的列。        |
|                      | SQLStatistics                       | ISO 92        | 返回有关单个表的统计信息以及与该表关联的索引列表。 |
|                      | SQLTablePrivileges                  | ODBC          | 返回表的列表和与每个表关联的特权。         |
|                      | SQLTables                           | 打开组           | 返回存储在特定数据源中的表名称的列表。 |
| 终止语句                 | SQLFreeStmt                         | ISO 92        | 结束语句处理、放弃挂起的结果，还可以释放与语句句柄关联的所有资源。                     |
|                      | SQLCloseCursor                      | ISO 92        | 关闭已在语句句柄上打开的游标。 |
|                      | SQLCancel                           | ISO 92        | 取消对语句的处理。 |
|                      | SQLCancelHandle                     | ODBC          | 取消对语句或连接的处理。 |
|                      | SQLEndTran                          | ISO 92        | 提交或回滚事务。  |
| 终止连接              | SQLDisconnect SQLFreeHandle         | ISO 92 ISO 92 | 关闭连接。 释放环境、连接、语句或描述符句柄。   |

## 功能审计FPA

n  内部逻辑文件ILF ：系统内部维护的文件，如系统创建和更新的文件。
n  外部接口文件EIF ：被目标系统应用，但由外部系统维护的文件。

n  外部输入EI ：指处理来自系统外的文件的处理元。它的基本目的是维护一个或多个ILF，或者改变系统的行为。
n  外部输出 EO ：指把文件发送到系统外的处理元。他的基本目的是给用户提供处理的结果。EO包含至少一个逻辑处理运算过程。
n  外部查询 EQ ：EQ也是指把文件发送到系统外的处理元。它的基本目的是为用户获取指定的信息。EQ部包含逻辑处理运算过程。

[???]: <> (
ILF
EI
EI
EI
EQ
EO
ELF
EI
EI
EI
EQ
EO
)

1. 响应连接请求。
    用户身份认证
    用户连接信息句柄
    用户指令信息
    指令关联信息

    客户端套接字
    客户端地址数据
    客户端接口信息
    客户端监听

2. 对与应用程序连接进行管理，维持连接并且管理，连接池模块。
    连接池队列
    传输连接句柄

    连接池信息
    连接目标信息
    连接池缓冲区

    服务端套接字
    服务端地址
    服务端接口
    服务端监听

3. 事务逻辑。如何安全执行一个元操作。
    事务操作句柄
    事务队列
    事务关联

    事务隔离级别

4. 联合接口与协议规则，考虑对数据源的接口方式。规定程序内部各个接口协议。转换SQL语句使其符合DBMS的SQL语句。感知ODBC连接。
    SQL版本信息
    SQL规则数据
    用户目标环境信息
    功能支持信息

    SQL定位
    SQL一致性级别
    类型指示器

5. 连接驱动，对驱动程序进行管理、维护以及升级。
    驱动版本信息
    驱动运行状态信息
    驱动内存信息
    驱动连接句柄
    驱动连接队列
    驱动指令数据

    驱动事务队列
    驱动线程信息
    驱动一致性级别

6. 身份验证。建立用户数据库，存储用户名密码和权限管理。
    远程用户名称数据
    远程用户名口令数据

    远程用户权限信息
    远程用户关联信息

8. 适应C++/JDBC/Python/ODBC。类似于壳。
    适配接口信息
    接口规则信息
    C++规则数据
    Java规则数据
    Python规则数据
    ODBC规则数据

    C++版本数据
    Java版本数据
    Python版本数据
    ODBC版本数据

    C++接口数据
    Java接口数据
    Python接口数据
    ODBC接口数据

    接口一致性级别

9. 日志文件
    远程日志文件
    日志文件偏移量
    远程日志更新数据

7. 数据库内部信息。
    数据库版本数据
    数据库功能数据
    数据库状态数据
    数据库接口数据

    数据库缓冲区句柄

7. 资源管理。
    传输缓冲区句柄
    驱动连接缓冲区句柄
    日志文件缓冲区句柄

    绑定偏移量

10. 结果集格式转换
    结果集数据
    结果集格式规则数据
    结果集目标地址数据
    结果集关联数据

11. 异常处理
    异常信息数据
    异常结构信息数据
    异常处理数据
    异常权限关联数据

# EOF
