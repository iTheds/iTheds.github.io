---
layout: post
title: "MySQL 源码与 ODBC 源码分析"
subtitle: "Mysql源码以及Mysql ODBC源码分析"
date: 2021-6-17
author: Lonnie iTheds
header-img: "img/hexo.jpg"
cdn: 'header-on'
categories:
  - 数据库
tags:
  - work
description: "MySQL 源码与 ODBC 源码分析"
---

<link rel="stylesheet" type="text/css" href="../../auto-number-title.css" />

# Mysql源码以及Mysql ODBC源码分析

环境资源：
1. 微软官方ODBC的odbc.lib库。
2. MYSQL ODBC源码。
3. MYSQL源代码。

## Mysql 源码

mysql-server根目录下:
1.client mysql命令行客户端工具
2.dbug 调试工具
3.Docs 一些说明文档
4.include 基本的头文件
5.libmysql 创建嵌入式系统的mysql客户端程序API
6.libmysqld mysql服务器的核心级API文件(8.0没了?)
7.mysql-test mysql的测试工具箱
8.mysys 操作系统API的大部分封装函数和各种辅助函数
9.regex 处理正则表达式的库
10.scripts 一些基于shell脚本的工具
11.sql 主要源代码
12.sql-bench 一些性能测试工具(8.0没了)
13.ssl一些ssl的工具和定义(8.0改为mysys_ssl) 
14.storage 插件式存储引起的代码
15.strings 各种字符串处理函数
16.support-files 各种辅助文件
17.vio 网络层和套接层的代码
18.zlib 数据压缩工具(8.0移到了utilities)

代码的主要功能如下：
boost:这个版本是自带Boost的库相关文件的，放在此处，如果是其它的版本就没有这个文件夹
client:客户端相关的软件和工具代码
cmake:CMAKE相关的脚本命令文件
components:组件工具
Docs:文档文件夹
doxyen_resources:doxyen工具相关资源
extra:引入的一些其它包，如网络消息谁的SSL包以及一些小工具。
include:源码用的相关的头文件放置的文件夹，但不包括存储引擎的头文件。
libbinlogevents:解析Binlog的lib服务，5.7后提供。
libbinlogstandalone:脱机配置CMAKE
libmysql:可嵌入式的客户端API
libservices:动态服务插件管理
man:帮助文档
mysql-test:服务端mysqlid的测试工具。
mysys:MySql自己实现的数据结构和一些基本算法。如数组和链表等。
packaging:打包相关
plugin:插件管理文件夹，包括一些动态加入的插件。
router:集群路由
scripts:系统工具运行的脚本。
share:共享信息，err和字符集
source_downloads:
sql:服务端的主要代码，包括main函数。
sql-common:服务端和客户端通用的一些代码。
storage:存储引擎相关文件。
strings:字符串库
support-files:.conf的示例文件和相关工具。
testclients:客户框架测试。
unittest:单元测试，这个搞程序的都知道。
utilities:公用的一些文件，有ZLIB等
vio:虚拟网络IO处理系统，不同平台或不同协议的网络通信API的二次封装。

查看mysql源码。https://cdn.mysql.com//Downloads/MySQL-8.0/mysql-8.0.25.zip

sql-common/net_serv.cc文件中有关net socket。所有的包有统一的格式，并通过函数 my_net_write()@sql-common/net_serv.cc 写入 buffer 等待发送.

对于 mysql 客户端，源码保存在 client/mysql.cc 文件中
```C++
main()
 |-sql_connect()
 | |-sql_real_connect()
 |   |-mysql_init()                             # 调用MySQL初始化
 |   |-mysql_options()                          # 设置链接选项
 |   |-mysql_real_connect()                     # sql-common/client.c
 |     |-connect_sync_or_async()                # 通过该函数尝试链接
 |     | |-my_connect()                         # 实际通过该函数建立链接
 |     |-cli_safe_read()                        # 等待第一个handshake包
 |     |-run_plugin_auth()                      # 通过插件实现认证
 |
 |-put_info()                                   # 打印客户端的欢迎信息
 |-read_and_execute()                           # 开始等待输入、执行SQL
 ```

MYSQL *STDCALL mysql_real_connect()函数实现在sql-common/client.cc文件中。

```C++
    ctx.state_function = csm_begin_connect;
    do {
        status = ctx.state_function(&ctx);
    } while (status != STATE_MACHINE_FAILED && status != STATE_MACHINE_DONE);
```

通过一个函数调用。其中state_function为csm_function类型。
执行函数 csm_begin_connect 。
该函数亦定义在client.cc文件中。
该函数中执行了socket()和bind();

再看mysql_send_query()函数：
```C++
int STDCALL mysql_send_query(MYSQL *mysql, const char *query, ulong length);

mysql_prepare_com_query_parameters()
mysql_reconnect()
mysql_int_serialize_param_data()

MYSQL_EXTENSION_PTR(mysql)
mysql_extension_bind_free(ext)
```

include\mysql\psi\mysql_socket.h文件中存在send()函数，该文件虽然是h头文件，但是内部仍然有函数的定义。

---

mysql入口在mysqld.cc中的mysqld_main()函数中。network_init初始化网络环节

[参考文章-从MySQL源码看其网络IO模型](https://cloud.tencent.com/developer/article/1453935)

## Mysql ODBC

..\lib\Debug\myodbc-util.lib;
odbc32.lib;
odbccp32.lib;
..\lib\Debug\mysql_sys.lib;
..\lib\Debug\mysql_strings.lib;
comctl32.lib;
legacy_stdio_definitions.lib;
kernel32.lib;
user32.lib;
gdi32.lib;
winspool.lib;
shell32.lib;
ole32.lib;
oleaut32.lib;
uuid.lib;
comdlg32.lib;
advapi32.lib

再看ODBC源码。

MYSQL_ODBC.h文件仍然引用了windows函数：
```C++
# include <sql.h>       //含有SQL_()标准函数
# include <sqlext.h>    //Browse_等扩展函数
# include <odbcinst.h>  //含有关于安装程序DLL标准SQL_()函数
```

三个头文件中的声明分别实现在odbc32.lib和odbccp32.lib中。
其中前两个文件函数定义存在odbc32.lib，而最后一个文件存在odbccp32.lib文件中。
`mysql-connect-odbc中只继承了odbccp32.lib文件`。

而通过文档得知Microsoft官方文档中有以下几类的函数API:
1. ODBC函数
2. 设置DLL函数
3. 安装程序DLL函数
4. 转换DLL函数
5. ODBC服务提供程序接口

其中设置DLL函数和安装程序DLL函数并未在connect-odbc源码中定义或声明，而其定义在<odbcinst.h>中。
所以实现主要是实现ODBC函数内容。并且可不引用odbc32.lib动态库。

在MYODBC_ODBC.h中，引用了该三个文件，并重新定义了其中两个文件的函数。

### mysql-odbc调用过程

其中driver文件夹中声明大部分的API函数， 以 MySQLConnect 的方式命名，定义函数文件各不相同。
其中文件ansi.cc 中定义了SQLconnect()等函数，其中调用了connect.cc的MySQLConnect()函数。

sqlucode.h 文件中包含双字节解码，unicode.cc文件中定义了SQLConnectW()等函数，并没有调用SQLconnect()函数，而是调用了MySQLConnect()函数。

而再MySQLConnect()函数中调用了mysql_real_connect()函数。

所以这条线的调用层次如下：

    SQLconnect()
    MySQLConnect()
    mysql_real_connect()

这样看来，可以推测到：mysql有一套自己的连接方式，命名为mysql_，之后为了满足ODBC或者其他连接的需要封装了一套MYSQL_函数，之后为了定向满足ODBC标准，封装了SOL_函数。

知道了这一点之后，我们可以做这么几件事：
1. 定向跟几条线路，分析连接过程。
2. 逐步分析文件API函数的实现过程。

优先解决以下的问题：
1. 数据库是怎么样被识别的。简单来说就是如何知道是我的数据库，而不是mysql或者sql server的身份。这一点也是不适用官方odbc.lib的原因。
2. 通信方式是什么样的。两条线，连接过程，sql指令的传输过程。

### 驱动文件

总共有三个驱动文件：
myodbc8a.dll    -ANSI字符驱动
myodbc8w.dll    -宽字节字符驱动
myodbc8S.dll    -setup设置

## Mysql 源码文件分析

着重阅读sql-common和client文件。

## Mysql 源码 server服务

mysqld_main为入口点， network_init 为网络初始化。

在 namespace socket 中，
SocketServiceBase作为一个抽象类，被SocketService继承并重写。
定义了函数socket()和socketpair()，
socketpair()函数中分配了socket，设置listen并且accept。
connect_pair()调用socketpair函数。

### 直接执行的函数层次

目前接触到的层次仍然是 mysql 需要通信的层面，mysql 是否有一层可以直接执行sql语句的层次呢？
在这个层次上面，调用它的必然是传输之后的server程序层次。

libmysql:可嵌入式的客户端API。
sql:服务端的主要代码，包括main函数。

### SQL 引擎

该入口为 sql_yacc.h。
MySQL使用bison作为其解析SQL语句的语法分析器.

## ODBC 文件详细分析

### connect.cc

MySQLConnect():
```C++
ds= ds_new();//初始化DataSource并且设置端口
ds_set_strnattr(...);//设置各种数值
ds_lookup(ds);
rc= dbc->connect(ds);
```
DBC::connect(DataSource *dsrc):
```C++
mysql_real_connect();//其中仍调用了该函数
```

### ansi.cc

SQLconnect():
  主要是调用了 MySQLConnect()函数，其他更多的是对于字符的转换和解码。

## ODBC与mysql C 通信方式

其中过程为mysql ODBC源码中文件driver，充当连接驱动，其中是需要有源码的。

mysql源码中存在一个client文件，尚且不知道是在数据库的一端或者是提供给客户端的。
sql-common提供连接net的服务。

---

主要通过抓包查看通信方式。

1. 网上获取mysql抓包。其中有两种协议TCP和Mysql协议。TCP协议主要用于发送数据信息。Mysql包进行确认和发送执行语句，其中可以直接看到执行的sql语句。其中加密操作主要存在于连接过程中有一个加盐(Salt)的过程。
2. 搭建环境，抓取ODBC传递包。其中只有TCP协议。传输的是加密数据。复盘，数据段为[TCP segment of a reassembled PDU]，如果从头开始抓包，那么还是和#3中抓mysql_connect_c情况一样，使用TLS协议，只不过因为是从中间开始抓包所以wireshark无法识别出是完整的TLS协议。
3. 搭建环境，抓取mysql_connect_c的包。其中有TCP协议和TLSv1.3协议。TCP协议用于确认和发送数据信息，而TLS协议则是发送双端的数据信息。该数据信息中全部为加密数据，即使传递的数据是一样的，内容也不相同。
4. 复盘。网上获取mysql抓包，其中也有使用TSL协议进行传输的。基本可以确定是传输了SQL语句。

总结：
在ODBC传递的过程中传递了sql语句。

## 数据库识别过程

## ODBC 资源 数据结构分析

首先是分析函数SQLConnect ， 对数据结构DBC和 DataSource 进行切入。

其中msyql-connect_odbc中定义的句柄都是以void*存在的(ODBC3.0)。

在头文件instller.h中定义了数据结构Driver，DataSource 
和 SQLTypeMap 。
* DataSource : 连接管理，含有用户名密码，ip地址，ssl相关；
* Driver : 驱动相关，含有name、lib、setup_lib三个元素，lib疑似为lib库。

在头文件 driver.h 中定义了 DBC ，ENV ，STMT_OPTIONS ， DESC ， DESCREC ， tempBuf ， desc_field ， STMT 。
* STMT : 语句相关。

在mysql.h中，定义了一套msyql的数据结构， MYSQL ， MYSQL_RES ， MYSQL_STMT

主要资源DBC：

```C++
/* Connection handler */

struct DBC
{
  ENV           *env;
  MYSQL         *mysql;
  std::list<STMT*> stmt_list;
  std::list<DESC*> desc_list; // Explicit descriptors
  STMT_OPTIONS  stmt_options;
  MYERROR       error;
  FILE          *query_log = nullptr;
  char          st_error_prefix[255] = { 0 };
  std::string   database;
  SQLUINTEGER   login_timeout = 0;
  time_t        last_query_time = 0;
  int           txn_isolation = 0;
  uint          port = 0;
  uint          cursor_count = 0;
  ulong         net_buffer_len = 0;
  uint          commit_flag = 0;
  bool          has_query_attrs = false;
  std::recursive_mutex lock;

  bool          unicode = false;            /* Whether SQL*ConnectW was used */
  CHARSET_INFO  *ansi_charset_info = nullptr, /* 'ANSI' charset (SQL_C_CHAR) */
                *cxn_charset_info = nullptr;  /* Connection charset ('ANSI' or utf-8) */
  MY_SYNTAX_MARKERS *syntax = nullptr;
  DataSource    *ds = nullptr;                /* data source used to connect (parsed or stored) */
  SQLULEN       sql_select_limit = -1;/* value of the sql_select_limit currently set for a session
                                       (SQLULEN)(-1) if wasn't set */
  int           need_to_wakeup = 0;      /* Connection have been put to the pool */

  DBC(ENV *p_env);
  void free_explicit_descriptors();
  void free_connection_stmts();
  void add_desc(DESC* desc);
  void remove_desc(DESC *desc);
  SQLRETURN set_error(char *state, const char *message, uint errcode);
  SQLRETURN connect(DataSource *ds);

  inline bool transactions_supported()
  { return mysql->server_capabilities & CLIENT_TRANSACTIONS; }

  inline bool autocommit_is_on()
  { return mysql->server_status & SERVER_STATUS_AUTOCOMMIT; }

  void close();
  ~DBC();

};
```
# 附录


## ODBC API

符合标准的SQL函数是最上层。
下层是my_SQL层次。
次之myodbc_层

| 函数名称                             | 实现过程   |
|-------------------------------------|------------|
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


# EOF



