---
title: "ODBC编程"
published: 2021-05-06
description: "ODBC编程"
tags:
  - "C/C++"
  - "ODBC"
category: "数据库"
draft: false
author: "Lonnie iTheds"
---
# ODBC编程

计算机中注册表ODBC位置：
计算机\HKEY_LOCAL_MACHINE\SOFTWARE\ODBC\ODBCINST.INI\ODBC Drivers

计算机\HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\ODBC\ODBCINST.INI\

## 句柄

句柄是用于标识特定项的不透明、32位的值;在 ODBC 中，此项可以是环境、连接、语句或描述符。当应用程序调用 `SQLAllocHandle`时，驱动程序管理器或驱动程序将创建指定类型的新项，并将其句柄返回到应用程序。稍后，应用程序使用该句柄在调用 ODBC 函数时标识该项。驱动程序管理器和驱动程序使用该句柄来查找有关项的信息。

<sqltypes.h>文件中定义了多个句柄：

```C++
/* generic data structures */
#if (ODBCVER >= 0x0300)
#if defined(WIN32) || defined(_WIN64)
typedef void*					SQLHANDLE;
#else
typedef SQLINTEGER              SQLHANDLE;
#endif	/* defined(WIN32) || defined(_WIN64) */
typedef SQLHANDLE               SQLHENV;//环境句柄
typedef SQLHANDLE               SQLHDBC;//连接句柄
typedef SQLHANDLE               SQLHSTMT;//语句句柄
typedef SQLHANDLE               SQLHDESC;//描述符句柄
```

### 环境句柄(Environment Handles)

环境是用于访问数据的全局上下文;与环境相关联的任何信息都是全局性的，例如：
* 环境状态
* 当前环境级别诊断
* 当前在环境中分配的连接的句柄
* 每个环境属性的当前设置
在 (驱动程序管理器或驱动程序) 实现 ODBC 的一段代码中，环境句柄标识了包含此信息的结构。
在 ODBC 应用程序中不经常使用环境句柄。 它们始终用于对 SQLDataSources 和 SQLDrivers 的调用，有时用于调用 SQLAllocHandle、 SQLEndTran、 SQLFreeHandle、 SQLGetDiagField和 SQLGetDiagRec。
实现 ODBC (驱动程序管理器或驱动程序) 的每个代码段都包含一个或多个环境句柄。 例如，驱动程序管理器为连接到它的每个应用程序维护单独的环境句柄。 环境句柄通过 SQLAllocHandle 分配，并与 SQLFreeHandle 一起释放。

### 连接句柄

连接包含驱动程序和数据源。 连接句柄标识每个连接。 连接句柄不仅定义要使用的驱动程序，而且还定义了要与该驱动程序一起使用的数据源。 在 (驱动程序管理器或驱动程序) 实现 ODBC 的代码段中，连接句柄标识包含连接信息的结构，如下所示：
* 连接的状态
* 当前连接级别诊断
* 连接上当前分配的语句和描述符的句柄
* 每个连接属性的当前设置
如果驱动程序支持多个连接，ODBC 不会阻止这些连接。 因此，在特定 ODBC 环境中，多个连接句柄可能指向各种驱动程序和数据源、同一驱动程序和不同的数据源，甚至是与同一驱动程序和数据源的多个连接。 某些驱动程序会限制它们支持的活动连接数; SQLGetInfo 中的 SQL_MAX_DRIVER_CONNECTIONS 选项指定特定驱动程序支持的活动连接数。
连接句柄主要用于连接到数据源 (SQLConnect、 SQLDriverConnect或 SQLBrowseConnect) 、断开与数据源的连接 (SQLDisconnect) 、获取有关驱动程序和数据源的信息 (SQLGetInfo) 、检索诊断 (SQLGetDiagField 和 SQLGetDiagRec) ，以及 (SQLEndTran) 执行事务。 在设置和获取 (SQLSetConnectAttr 和) SQLGetConnectAttr 的连接属性时，以及在获取 SQL 语句 (SQLNativeSql) 的本机格式时，它们也使用它们。
连接句柄通过 SQLAllocHandle 分配，并与 SQLFreeHandle一起释放。

### 语句句柄

语句句柄似乎是解析其中语句和语义的。在编写驱动程序和驱动管理程序这部分应该是不需要包含对sql语句的解析。

语句最容易被视为一种 SQL 语句，例如SELECT * FROM Employee。 但是，语句不只是 SQL 语句，而是包含与该 SQL 语句相关联的所有信息，如语句所创建的所有结果集和执行语句时使用的参数。 语句甚至不需要具有应用程序定义的 SQL 语句。 例如，在语句上执行目录函数（如 SQLTables ）时，它会执行返回表名列表的预定义 SQL 语句。
每个语句由语句句柄标识。 语句与单个连接相关联，并且该连接上可能有多个语句。 某些驱动程序会限制它们支持的活动语句的数量; SQLGetInfo 中的 SQL_MAX_CONCURRENT_ACTIVITIES 选项指定驱动程序在单个连接上支持的活动语句的数量。 如果语句具有挂起的结果，则将其定义为 活动状态 ，其中的结果是结果集或受 INSERT、 UPDATE或 DELETE 语句影响的行数，或者正在通过多次调用 SQLPutData发送数据。
在 (驱动程序管理器或驱动程序) 实现 ODBC 的一段代码内，语句句柄标识包含语句信息的结构，如：
* 语句的状态
* 当前语句级别诊断
* 绑定到语句的参数和结果集列的应用程序变量的地址
* 每个语句特性的当前设置
语句句柄用于大多数 ODBC 函数。 特别要注意的是，在函数中使用它们来绑定参数和结果集列 (SQLBindParameter 和 SQLBindCol) 、prepare 和 execute 语句 (SQLPrepare、 SQLExecute和 SQLExecDirect) 、检索元 数据 (SQLColAttribute 和 SQLDescribeCol) 、提取结果 (SQLFetch) 并检索诊断 (SQLGetDiagField 和 SQLGetDiagRec) 。 它们还在目录函数中使用， (SQLColumns、 SQLTables等) 以及许多其他函数。
语句句柄通过 SQLAllocHandle 分配，并与 SQLFreeHandle一起释放。

### 描述符句柄

描述符是描述 SQL 语句或结果集的列的元数据的集合，如应用程序或驱动程序所示 (也称为实现) 。 因此，描述符可以填充四个角色中的任意一个：

应用程序参数描述符 (APD) 。 包含有关绑定到 SQL 语句中的参数的应用程序缓冲区的信息，如其地址、长度和 C 数据类型。

实现参数描述符 (IPD) 。 包含 SQL 语句中参数的相关信息，例如 sql 语句的 SQL 数据类型、长度和为 null 性。

应用程序行描述符 (ARD) 。 包含有关绑定到结果集中的列的应用程序缓冲区的信息，如其地址、长度和 C 数据类型。

实现行描述符 (IRD) 。 包含有关结果集中的列的信息，如其 SQL 数据类型、长度和为 null 性。

四个描述符 (一个填充每个角色) 在分配语句时自动分配。 这些 描述符称为自动分配的描述符 ，始终与该语句相关联。 应用程序还可以分配带有 SQLAllocHandle的描述符。 这称为 显式分配的描述符。 它们在连接上进行分配，并可与该连接上的一个或多个语句相关联，以满足这些语句上的 APD 或 ARD 的角色。

ODBC 中的大多数操作都可以在不显式使用应用程序的情况下执行。 但是，描述符为某些操作提供了方便的快捷方式。 例如，假设某个应用程序要从两个不同的缓冲区集中插入数据。 若要使用第一组缓冲区，请重复调用 SQLBindParameter 将其绑定到 INSERT 语句中的参数，然后执行该语句。 若要使用第二组缓冲区，请重复此过程。 此外，它还可以设置到一个描述符中第一组缓冲区的绑定，以及另一个描述符中的第二组缓冲区。 若要在绑定集之间切换，应用程序只需调用 SQLSetStmtAttr ，并将正确的说明符与作为 APD 的语句相关联。

### 状态转换

ODBC 定义每个环境、每个连接和每个语句的离散 状态 。 例如，环境具有三种可能的状态：未分配的 (，未分配任何环境) 、分配的 (，其中分配了环境但未分配任何连接) ，以及在其中分配环境和一个或多个连接的连接 () 。 连接有七种可能的状态;语句具有13个可能的状态。

当应用程序调用某个函数或函数并将句柄传递给该项时，由其句柄标识的特定项从一个状态移到另一个状态。 此类移动称为 状态转换。

从应用程序的角度来看，状态转换通常是非常简单的：法律状态转换倾向于在编写良好的应用程序的流时使用。 状态转换对于驱动程序管理器和驱动程序更复杂，因为它们必须跟踪环境、每个连接和每个语句的状态。 此工作的大部分工作由驱动程序管理器执行;驱动程序必须完成的大部分工作都是通过包含挂起结果的语句来完成的。

## 缓冲区

缓冲区是用于在`应用程序和驱动程序`之间传递数据的任何应用程序内存片段。 例如，应用程序缓冲区可以与SQLBindCol的结果集列关联或绑定到结果集列。 提取每个行后，将为这些缓冲区中的每一列返回数据。 输入缓冲区 用于将数据从应用程序传递到驱动程序; 输出缓冲区 用于将数据从驱动程序返回到应用程序。

延迟的缓冲区
分配和释放缓冲区

## 数据类型

在<sqltypes.h>中，typedef了大部分的数据结构：
```C++
/* API declaration data types */
typedef unsigned char   SQLCHAR;
#if (ODBCVER >= 0x0300)
typedef signed char     SQLSCHAR;
typedef unsigned char   SQLDATE;
typedef unsigned char   SQLDECIMAL;
typedef double          SQLDOUBLE;
typedef double          SQLFLOAT;
#endif
typedef long            SQLINTEGER;
typedef unsigned long   SQLUINTEGER;

#ifdef _WIN64
typedef INT64           SQLLEN;
typedef UINT64          SQLULEN;
typedef UINT64          SQLSETPOSIROW;
#else
#define SQLLEN          SQLINTEGER
#define SQLULEN         SQLUINTEGER
#define SQLSETPOSIROW   SQLUSMALLINT
#endif

//For Backward compatibility
#ifdef WIN32
typedef SQLULEN			SQLROWCOUNT;
typedef SQLULEN			SQLROWSETSIZE;
typedef SQLULEN			SQLTRANSID;
typedef SQLLEN			SQLROWOFFSET;
#endif

#if (ODBCVER >= 0x0300)
typedef unsigned char   SQLNUMERIC;
#endif
typedef void *          SQLPOINTER;
#if (ODBCVER >= 0x0300)
typedef float           SQLREAL;
#endif
typedef short           SQLSMALLINT;
typedef unsigned short  SQLUSMALLINT;
#if (ODBCVER >= 0x0300)
typedef unsigned char   SQLTIME;
typedef unsigned char   SQLTIMESTAMP;
typedef unsigned char   SQLVARCHAR;
#endif

/* SQL portable types for C */
typedef unsigned char           UCHAR;
typedef signed char             SCHAR;
typedef SCHAR                   SQLSCHAR;
typedef long int                SDWORD;
typedef short int               SWORD;
typedef unsigned long int       UDWORD;
typedef unsigned short int      UWORD;
#ifndef _WIN64
typedef UDWORD                  SQLUINTEGER;
#endif

typedef signed long             SLONG;
typedef signed short            SSHORT;
typedef unsigned long           ULONG;
typedef unsigned short          USHORT;
typedef double                  SDOUBLE;
typedef double            		LDOUBLE;
typedef float                   SFLOAT;
```

## 一致性级别

There are three ODBC interface conformance levels: Core, Level 1, and Level 2.

一致性级别并不总是完全划分为支持特定的 ODBC 函数列表，而是指定支持的功能。
所有 ODBC 驱动程序必须至少表现出核心级别的接口一致性。核心级别的功能是大多数一般可互操作应用程序所需的功能。

### 接口一致性级别

### SQL一致性级别

## 环境、连接和语句属性

## 表和视图

## 数据流向

# 数据结构

# 函数解析

其中这些函数是需要满足接口一致性级别的，暂未归类。
拟定先进行功能归类再进行接口一致性级别分析。

共59个SQL_()接口

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
    

## SQL_()接口

### SQLAllocHandle

分配一个`环境、连接、语句或描述符``句柄`。

引入的版本： ODBC 3.0 标准符合性： ISO 92

#### 语法

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
```

*HandleType*
SQLSMALLINT 是short类型， 标识分配的句柄类型，必须是以下类型：
* SQL_HANDLE_DBC              -连接句柄标识
* SQL_HANDLE_DESC             -描述符句柄标识
* SQL_HANDLE_ENV              -环境句柄标识
* SQL_HANDLE_STMT             -语句句柄标识
* SQL_HANDLE_DBC_INFO_TOKEN   -仅由驱动程序管理器和驱动程序

```C++  头文件sql.h
/* handle type identifiers */
#if (ODBCVER >= 0x0300)
#define SQL_HANDLE_ENV              1
#define SQL_HANDLE_DBC              2
#define SQL_HANDLE_STMT             3
#define SQL_HANDLE_DESC             4
#endif
```

*inputhandle*
送在其上下文中要分配新句柄的输入句柄。 如果 SQL_HANDLE_ENV HandleType ，则 SQL_NULL_HANDLE。 如果 SQL_HANDLE_DBC HandleType ，则它必须是环境句柄，如果 SQL_HANDLE_STMT 或 SQL_HANDLE_DESC，则它必须是连接句柄。
 
#### 功能

返回SQL_SUCCESS、SQL_SUCCESS_WITH_INFO、SQL_INVALID_HANDLE 或 SQL_ERROR。

当分配非环境句柄的句柄时，如果 SQLAllocHandle 返回 SQL_ERROR，则它会根据 HandleType 的值将 OutputHandlePtr 设置为 SQL_NULL_HDBC、SQL_NULL_HSTMT 或 SQL_NULL_HDESC，除非输出参数为 NULL 指针。 然后，应用程序可以从与 inputhandle 参数中的句柄关联的诊断数据结构获取其他信息。

### SQLBindCol

引入的版本： ODBC 1.0 标准符合性： ISO 92
SQLBindCol 将应用程序数据缓冲区绑定到结果集中的列。

#### 语法

```C++
/*
  @type    : ODBC 1.0 API
  @purpose : binds application data buffers to columns in the result set
*/
SQLRETURN  SQL_API SQLBindCol(  
    SQLHSTMT StatementHandle,
    SQLUSMALLINT ColumnNumber, 
    SQLSMALLINT TargetType,
    _Inout_updates_opt_(_Inexpressible_(BufferLength)) SQLPOINTER TargetValue,
    SQLLEN BufferLength, 
    _Inout_opt_ SQLLEN* StrLen_or_Ind)
{

}
```

#### 功能

### SQLBindParameter 

引入的版本： ODBC 2.0 标准符合性： ODBC
SQLBindParameter 将缓冲区绑定到 SQL 语句中的参数标记。 SQLBindParameter 支持绑定到 unicode C 数据类型，即使基础驱动程序不支持 unicode 数据。

#### 语法

```C++
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
```

#### 功能

### SQLBrowseConnect

引入的版本： ODBC 1.0 标准符合性： ODBC

SQLBrowseConnect支持发现和枚举连接到数据源所需的属性和属性值的迭代方法。每次调用SQLBrowseConnect 都会返回连续级别的属性和属性值。当所有级别都被枚举后，到数据源的连接就完成了，并且SQLBrowseConnect会返回一个完整的连接字符串。SQL_SUCCESS 或 SQL_SUCCESS_WITH_INFO 的返回码表示已指定所有连接信息并且应用程序现在已连接到数据源。

connection-string ::= attribute[;] | attribute ; connection-string;
attribute ::= attribute-keyword=attribute-value | DRIVER=[{]attribute-value[}]
attribute-keyword ::= DSN | UID | PWD | driver-defined-attribute-keyword
attribute-value ::= character-string
driver-defined-attribute-keyword ::= identifier

#### 语法
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
```
#### 功能

### SQLBulkOperations

引入的版本：ODBC 3.0 标准符合性：ODBC

SQLBulkOperations 执行批量插入和批量书签操作，包括按书签更新、删除和提取。

#### 语法

```C++
/*
  @type    : ODBC 1.0 API
  @purpose : performs bulk insertions and bulk bookmark operations,
  including update, delete, and fetch by bookmark
*/
SQLRETURN SQL_API SQLBulkOperations(SQLHSTMT  Handle, SQLSMALLINT Operation)
{

}
```

### SQLCancel

引入的版本： ODBC 1.0 标准符合性： ISO 92

SQLCancel 取消对语句的处理。
若要取消对某个连接或语句的处理，请使用 SQLCancelHandle 函数。

#### 语法

```C++
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
```
### SQLCancelHandle

引入的版本： ODBC 3.8 标准符合性：无

SQLCancelHandle 取消对连接或语句的处理。 当 SQL_HANDLE_STMT 时， 驱动程序管理器会将对 SQLCancelHandle 的调用映射到对 SQLCancel 的调用。

如果某个驱动程序不存在，则在 handle 参数中对 SQLCancelHandle 的连接调用的对 SQLSTATE 的调用将返回 SQL_ERROR，其为 IM001，消息 "driver 不支持此函数" "。通过使用语句句柄对 SQLCancelHandle 的调用将被映射到驱动程序管理器调用 SQLCancel ，如果驱动程序实现 SQLCancel，则可以 对其进行 处理。 应用程序可以使用 SQLGetFunctions 来确定驱动程序是否支持 SQLCancelHandle。

#### 语法

```C++
/*
  @type    : ODBC 3.8
  @purpose : Mapped to SQLCancel if HandleType is
*/
SQLRETURN SQL_API SQLCancelHandle(
    SQLSMALLINT  HandleType,
    SQLHANDLE    Handle)
{

}
```

### SQLCloseCursor
引入的版本： ODBC 3.0 标准符合性： ISO 92

SQLCloseCursor 关闭已在语句上打开的游标，并放弃挂起的结果。

#### 语法

```C++
/*
  @type    : ODBC 3.0 API
  @purpose : closes a cursor that has been opened on a statement
  and discards any pending results
*/
SQLRETURN SQL_API SQLCloseCursor(SQLHSTMT Handle)
{

}
```

### SQLColAttribute

引入的版本： ODBC 3.0 标准符合性： ISO 92

SQLColAttribute 返回结果集中列的描述符信息。 说明符信息以字符串、描述符相关值或整数值的形式返回。

#### 语法

```C++
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
```

### SQLColumnPrivileges

引入的版本： ODBC 1.0 标准符合性： ODBC

SQLColumnPrivileges 返回指定表的列和`相关权限`的列表。 驱动程序在指定的 StatementHandle 上以结果集的形式返回该信息。

#### 语法

```C++
SQLRETURN SQL_API
SQLColumnPrivileges(SQLHSTMT hstmt,
    SQLCHAR* catalog, SQLSMALLINT catalog_len,
    SQLCHAR* schema, SQLSMALLINT schema_len,
    SQLCHAR* table, SQLSMALLINT table_len,
    SQLCHAR* column, SQLSMALLINT column_len)
{

}
```

### SQLColumns

引入的版本： ODBC 1.0 标准符合性：打开组

SQLColumns 返回指定表中的列名列表。 驱动程序将此信息作为结果集返回到指定的 StatementHandle。

#### 语法

```C++
SQLRETURN SQL_API
SQLColumns(SQLHSTMT hstmt, 
    SQLCHAR* catalog, SQLSMALLINT catalog_len,
    SQLCHAR* schema, SQLSMALLINT schema_len,
    SQLCHAR* table, SQLSMALLINT table_len,
    SQLCHAR* column, SQLSMALLINT column_len)
{

}
```

### SQLConnect

引入的版本： ODBC 1.0 标准符合性： ISO 92

SQLConnect 建立与驱动程序和数据源的连接。 连接句柄引用有关与数据源的连接的所有信息的存储，包括状态、事务状态和错误信息。

#### 语法

```C++
SQLRETURN SQL_API
SQLConnect(SQLHDBC hdbc, 
    SQLCHAR* dsn, SQLSMALLINT dsn_len_in,
    SQLCHAR* user, SQLSMALLINT user_len_in,
    SQLCHAR* auth, SQLSMALLINT auth_len_in)
{

}
```

### SQLCopyDesc

引入的版本：ODBC 3.0 标准符合性：ISO 92

SQLCopyDesc 将描述符信息从一个描述符句柄复制到另一个描述符句柄。

#### 语法

```C++
SQLRETURN SQL_API
SQLCopyDesc(SQLHDESC SourceDescHandle, SQLHDESC TargetDescHandle)
{

}
```

### SQLDescribeCol

引入的版本： ODBC 1.0 标准符合性： ISO 92

对于结果集中的一列， SQLDescribeCol 将返回结果描述符-列名称、类型、列大小、十进制数字和为 null 性。 此信息还可用于 IRD 的字段。

#### 语法

```C++
SQLRETURN SQL_API
SQLDescribeCol(SQLHSTMT hstmt, SQLUSMALLINT column,
    SQLCHAR* name, SQLSMALLINT name_max, SQLSMALLINT* name_len,
    SQLSMALLINT* type, SQLULEN* size, SQLSMALLINT* scale,
    SQLSMALLINT* nullable)
{

}
```

### SQLDescribeParam

引入的版本：ODBC 1.0 标准符合性：ODBC

SQLDescribeParam 返回与已准备的 SQL 语句关联的参数标记的说明。 此信息在 IPD 的字段中也可用。

#### 语法

```C++
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
```

### SQLDisconnect

引入的版本： ODBC 1.0 标准符合性： ISO 92

SQLDisconnect 关闭与特定连接句柄关联的连接。

#### 语法

```C++
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
```

### SQLDriverConnect

引入的版本： ODBC 1.0 标准符合性： ODBC

SQLDriverConnect 是 SQLConnect 的一种替代方法。 它支持的数据源所需的连接信息超过 SQLConnect、对话框中的三个参数，用于提示`用户输入所有连接信息，以及在系统信息中未定义的数据源`。 有关详细信息，请参阅  SQLDriverConnect 连接。

#### 语法

```C++
SQLRETURN SQL_API
SQLDriverConnect(
    SQLHDBC hdbc, SQLHWND hwnd, 
    SQLCHAR* in, SQLSMALLINT in_len,
    SQLCHAR* out, SQLSMALLINT out_max, SQLSMALLINT* out_len,
    SQLUSMALLINT completion)
{

}
```

### SQLEndTran

引入的版本：ODBC 3.0 标准符合性：ISO 92

SQLEndTran 针对与连接关联的所有语句的所有活动操作请求`提交或回滚操作`。 SQLEndTran 还可以请求对与环境关联的所有连接执行提交或回滚操作。

#### 语法

```C++
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
```

### SQLExecDirect

引入的版本： ODBC 1.0 标准符合性： ISO 92

SQLExecDirect执行`可准备`语句，如果语句中存在任何参数，则使用参数标记变量的当前值。
SQLExecDirect是提交一次性执行的 SQL 语句的最快方式。

#### 语法

```C++
SQLRETURN SQL_API
SQLExecDirect(SQLHSTMT hstmt, SQLCHAR* str, SQLINTEGER str_len)
{

}
```

### SQLExecute
引入的版本： ODBC 1.0 标准符合性： ISO 92

SQLExecute执行`准备好`的语句，如果语句中存在任何参数标记，则使用参数标记变量的当前值。

#### 语法

```C++
/*
  @type    : ODBC 1.0 API
  @purpose : executes a prepared statement, using the current values
  of the parameter marker variables if any parameter markers
  exist in the statement
*/
SQLRETURN SQL_API SQLExecute(SQLHSTMT hstmt)
{

}
```

### SQLFetch

引入的版本：ODBC 1.0 标准符合性：ISO 92

SQLFetch 从结果集`提取下一行数据集`，并返回所有绑定列的数据。

结果集存放地点。

#### 语法

```C++
/*
  @type    : ODBC 1.0 API
  @purpose : fetches the next rowset of data from the result set and
  returns data for all bound columns
*/
SQLRETURN SQL_API SQLFetch(SQLHSTMT StatementHandle)
{

}
```

### SQLFetchScroll

引入的版本：ODBC 3.0 标准符合性：ISO 92

SQLFetchScroll 从结果集提取指定的数据行集，并返回所有绑定列的数据。 行集可以在绝对或相对位置指定，也可通过书签指定。

使用 ODBC 2.x 驱动程序时，驱动程序管理器将此函数映射到 SQLExtendedFetch。 有关详细信息，请参阅 映射替换函数，实现应用程序的向后兼容性。

#### 语法

```C++
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
```

### SQLForeignKeys

引入的版本： ODBC 1.0 标准符合性： ODBC

SQLForeignKeys 可以返回：
* 指定表中的外键列表， (指定表中的列，这些列引用其他表中的主键) 。
* 引用指定表中的主键的其他表中的外键的列表。

驱动程序将每个列表作为指定语句的结果集返回。

#### 语法

```C++
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
```

### SQLFreeHandle

引入的版本：ODBC 3.0 标准符合性：ISO 92

SQLFreeHandle `释放`与特定环境、连接、语句或描述符句柄关联的资源。

#### 语法

```C++
/*
  @type    : ODBC 3.0 API
  @purpose : frees resources associated with a specific environment,
       connection, statement, or descriptor handle
*/
SQLRETURN SQL_API SQLFreeHandle(SQLSMALLINT HandleType,
    SQLHANDLE   Handle)
{

}
```

### SQLFreeStmt

引入的版本： ODBC 1.0 标准符合性： ISO 92

SQLFreeStmt 停止与特定语句关联的处理、关闭与该语句关联的任何打开的游标、放弃挂起的结果，或者，还可以释放与该语句句柄关联的所有资源。

#### 语法

```C++
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
```

### SQLGetConnectAttr

引入的版本： ODBC 3.0 标准符合性： ISO 92

SQLGetConnectAttr 返回`连接属性的当前设置`。

#### 语法

```C++
SQLRETURN SQL_API
SQLGetConnectAttr(SQLHDBC hdbc, SQLINTEGER attribute, SQLPOINTER value,
    SQLINTEGER value_max, SQLINTEGER* value_len)
{

}
```

### SQLGetCursorName

引入的版本： ODBC 1.0 标准符合性： ISO 92

SQLGetCursorName 返回与指定语句相关联的`游标`名称。

#### 语法

```C++
SQLRETURN SQL_API
SQLGetCursorName(SQLHSTMT hstmt, SQLCHAR* cursor, SQLSMALLINT cursor_max,
    SQLSMALLINT* cursor_len)
{

}
```

### SQLGetData

引入的版本： ODBC 1.0 标准符合性： ISO 92

SQLGetData 检索结果集中单个列的数据，或在 SQLParamData 返回 SQL_PARAM_DATA_AVAILABLE 之后为单个参数检索数据。 可以多次调用此方法，以便在部分中检索可变长度数据。

#### 语法

```C++
/*
  @type    : ODBC 1.0 API
  @purpose : retrieves data for a single column in the result set. It can
  be called multiple times to retrieve variable-length data
  in parts
*/
SQLRETURN SQL_API SQLGetData(
    SQLHSTMT      StatementHandle,
    SQLUSMALLINT  ColumnNumber,
    SQLSMALLINT   TargetType,
    SQLPOINTER    TargetValuePtr,
    SQLLEN        BufferLength,
    SQLLEN* StrLen_or_IndPtr)
{

}
```

### SQLGetDescField

引入的版本： ODBC 3.0 标准符合性： ISO 92

SQLGetDescField 返回`描述符`记录的`单个字段的当前设置或值`。

#### 语法

```C++
SQLRETURN SQL_API
SQLGetDescField(SQLHDESC hdesc, SQLSMALLINT record, SQLSMALLINT field,
    SQLPOINTER value, SQLINTEGER value_max, SQLINTEGER* value_len)
{

}
```

### SQLGetDescRec

引入的版本： ODBC 3.0 标准符合性： ISO 92

SQLGetDescRec 返回`描述符记录`的多个字段的当前设置或值。 返回的字段描述列或参数数据的名称、数据类型和存储。

#### 语法

```C++
SQLRETURN SQL_API
SQLGetDescRec(SQLHDESC hdesc, SQLSMALLINT record, SQLCHAR* name,
    SQLSMALLINT name_max, SQLSMALLINT* name_len, SQLSMALLINT* type,
    SQLSMALLINT* subtype, SQLLEN* length, SQLSMALLINT* precision,
    SQLSMALLINT* scale, SQLSMALLINT* nullable)
{

}
```

### SQLGetDiagField

引入的版本： ODBC 3.0 标准符合性： ISO 92

SQLGetDiagField 返回`诊断数据结构`的记录字段的`当前值`， (与包含错误、警告和状态信息的指定句柄) 相关联。

#### 语法

```C++
SQLRETURN SQL_API
SQLGetDiagField(SQLSMALLINT handle_type, SQLHANDLE handle,
    SQLSMALLINT record, SQLSMALLINT field,
    SQLPOINTER info, SQLSMALLINT info_max,
    SQLSMALLINT* info_len)
{

}
```

### SQLGetDiagRec

引入的版本： ODBC 3.0 标准符合性： ISO 92

SQLGetDiagRec 返回包含`错误、警告和状态信息的诊断记录`的多个字段的当前值。 不同于 SQLGetDiagField，后者每次调用返回一个诊断字段， SQLGetDiagRec 将返回诊断记录的几个常用字段，包括 SQLSTATE、本机错误代码和诊断消息文本。

#### 语法

```C++
SQLRETURN SQL_API
SQLGetDiagRec(SQLSMALLINT handle_type, SQLHANDLE handle,
    SQLSMALLINT record, SQLCHAR* sqlstate,
    SQLINTEGER* native_error, SQLCHAR* message,
    SQLSMALLINT message_max, SQLSMALLINT* message_len)
{

}
```

### SQLGetEnvAttr

引入的版本： ODBC 3.0 标准符合性： ISO 92

SQLGetEnvAttr 检索并返回环境属性的当前设置。

#### 语法

```C++
/*
  @type    : ODBC 3.0 API
  @purpose : returns the environment attributes
*/
SQLRETURN  SQL_API SQLGetEnvAttr(SQLHENV EnvironmentHandle,
    SQLINTEGER Attribute, _Out_writes_(_Inexpressible_(BufferLength)) SQLPOINTER Value,
    SQLINTEGER BufferLength, _Out_opt_ SQLINTEGER* StringLength)
{

}
```

### SQLGetFunctions

引入的版本： ODBC 1.0 标准符合性： ISO 92

SQLGetFunctions 返回有关驱动程序是否支持特定 ODBC 函数的信息。此函数在驱动程序管理器中实现;它还可以在驱动程序中实现。 如果驱动程序实现 SQLGetFunctions，则驱动程序管理器将调用驱动程序中的函数。 否则，它将执行函数本身。

#### 语法

```C++
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
```

### SQLGetInfo

引入的版本： ODBC 1.0 标准符合性： ISO 92

SQLGetInfo 返回有关驱动程序的`常规信息`以及与`连接关联的数据源`。

#### 语法

```C++
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
```

### SQLGetStmtAttr

引入的版本： ODBC 3.0 标准符合性： ISO 92

SQLGetStmtAttr 返回语句特性的当前设置。

#### 语法

```C++
SQLRETURN SQL_API
SQLGetStmtAttr(SQLHSTMT hstmt, SQLINTEGER attribute, SQLPOINTER value,
    SQLINTEGER value_max, SQLINTEGER* value_len)
{

}
```

### SQLGetTypeInfo

引入的版本： ODBC 1.0 标准符合性： ISO 92

SQLGetTypeInfo 返回有关数据源支持的`数据类型`的信息。 驱动程序以 SQL 结果集的形式返回该信息。 数据类型旨在 (DDL) 语句中使用数据定义语言。

#### 语法

```C++
SQLRETURN SQL_API
SQLGetTypeInfo(SQLHSTMT hstmt, SQLSMALLINT type)
{

}
```

### SQLMoreResults

引入的版本： ODBC 1.0 标准符合性： ODBC

SQLMoreResults 确定是否在包含 SELECT、 UPDATE、 INSERT 或 DELETE 语句的语句上提供更多结果，如果是，则对这些结果初始化处理。

`SELECT语句返回结果集。UPDATE、INSERT和DELETE语句返回受影响行的计数`。如果这些语句中的任何一个被批处理、与参数数组一起提交（按参数递增的顺序编号，按照它们在批处理中出现的顺序），或者在过程中，它们可以返回多个结果集或行计数。

执行批处理后，应用程序定位在第一个结果集上。应用程序可以在第一个或任何后续结果集上调用SQLBindCol、SQLBulkOperations、SQLFetch、SQLGetData、SQLFetchScroll、SQLSetPos和所有元数据函数，就像只有一个结果集一样。处理完第一个结果集后，应用程序将调用`SQLMoreResults`移动到`下一个结果集`。如果另一个结果集或计数可用，则SQLMoreResults返回 SQL_SUCCESS 并初始化结果集或计数以进行额外处理。如果任何行计数生成语句出现在结果集生成语句之间，则可以通过调用SQLMoreResults来跳过它们。在为UPDATE、INSERT或DELETE语句调用SQLMoreResults 之后，应用程序可以调用SQLRowCount。

#### 语法

```C++
/*
  @type    : ODBC 1.0 API
  @purpose : determines whether more results are available on a statement
  containing SELECT, UPDATE, INSERT, or DELETE statements and,
  if so, initializes processing for those results
*/
SQLRETURN SQL_API SQLMoreResults(SQLHSTMT hStmt)
{

}
```

### SQLNativeSql

引入的版本： ODBC 1.0 标准符合性： ODBC

SQLNativeSql 返回`驱动程序修改的 SQL 字符串`。 SQLNativeSql 不执行 SQL 语句。

#### 语法

```C++
SQLRETURN SQL_API
SQLNativeSql(SQLHDBC hdbc, SQLCHAR* in, 
    SQLINTEGER in_len, SQLCHAR* out, 
    SQLINTEGER out_max, SQLINTEGER* out_len)
{

}
```

### SQLNumParams

引入的版本： ODBC 1.0 标准符合性： ISO 92

SQLNumParams 返回 SQL 语句中`参数的数目`。

#### 语法

```C++
/*
  @type    : ODBC 1.0 API
  @purpose : returns the number of parameter markers.
*/
SQLRETURN SQL_API SQLNumParams(SQLHSTMT hstmt, SQLSMALLINT* pcpar)
{

}
```

### SQLNumResultCols

引入的版本： ODBC 1.0 标准符合性： ISO 92

SQLNumResultCols 返回`结果集中的列数`。

#### 语法

```C++
/*
  @type    : ODBC 1.0 API
  @purpose : returns the number of columns in a result set
*/
SQLRETURN SQL_API SQLNumResultCols(SQLHSTMT  hstmt, SQLSMALLINT* pccol)
{

}
```

### SQLParamData

引入的版本： ODBC 1.0 标准符合性： ISO 92

SQLParamData 与 SQLPutData 一起用于在语句执行时提供参数数据，使用 SQLGetData 检索流出的输出参数数据。

可以调用SQLParamData来提供执行时数据的两种用途：将在调用SQLExecute或SQLExecDirect 时使用的参数数据，或在通过调用SQLBulkOperations更新或添加行时使用的列数据或通过调用SQLSetPos更新。在执行时，SQLParamData向应用程序返回驱动程序需要哪些数据的指示符。

#### 语法

```C++
/*
  @type    : ODBC 1.0 API
  @purpose : is used in conjunction with SQLPutData to supply parameter
  data at statement execution time
*/
SQLRETURN SQL_API SQLParamData(
    SQLHSTMT hstmt, SQLPOINTER* prbgValue)
{

}
```

### SQLPrepare

引入的版本： ODBC 1.0 标准符合性： ISO 92

SQLPrepare `准备`要执行的 SQL 字符串。

#### 语法

```C++
SQLRETURN SQL_API
SQLPrepare(SQLHSTMT hstmt, SQLCHAR* str, SQLINTEGER str_len)
{

}
```

### SQLPrimaryKeys

引入的版本： ODBC 1.0 标准符合性： ODBC

SQLPrimaryKeys 返回`构成表的主键的列名称`。 驱动程序将以结果集的形式返回该信息。 此函数不支持通过单个调用返回多个表中的主键。

#### 语法

```C++
SQLRETURN SQL_API
SQLPrimaryKeys(SQLHSTMT hstmt,
    SQLCHAR* catalog, SQLSMALLINT catalog_len,
    SQLCHAR* schema, SQLSMALLINT schema_len,
    SQLCHAR* table, SQLSMALLINT table_len)
{

}
```

### SQLProcedureColumns

引入的版本： ODBC 1.0 标准符合性： ODBC

SQLProcedureColumns 返回`输入和输出参数的列表`，以及构成指定过程的`结果集的列`。 驱动程序将该信息作为指定语句的结果集返回。

#### 语法

```C++
SQLRETURN SQL_API
SQLProcedureColumns(SQLHSTMT hstmt,
    SQLCHAR* catalog, SQLSMALLINT catalog_len,
    SQLCHAR* schema, SQLSMALLINT schema_len,
    SQLCHAR* proc, SQLSMALLINT proc_len,
    SQLCHAR* column, SQLSMALLINT column_len)
{

}
```

### SQLProcedures

引入的版本： ODBC 1.0 标准符合性： ODBC

SQLProcedures 返回`存储在特定数据源中的过程名称的列表`。 过程 是一种通用术语，用于描述可执行对象 或可使用输入和输出参数调用的命名实体。 有关过程的详细信息，请参阅 过程。

SQLProcedures 列出请求范围内的所有过程。

#### 语法

```C++
SQLRETURN SQL_API
SQLProcedures(SQLHSTMT hstmt,
    SQLCHAR* catalog, SQLSMALLINT catalog_len,
    SQLCHAR* schema, SQLSMALLINT schema_len,
    SQLCHAR* proc, SQLSMALLINT proc_len)
{

}
```

### SQLPutData

引入的版本： ODBC 1.0 标准符合性： ISO 92

SQLPutData 允许应用程序在语句执行时向驱动程序发送参数或列的数据。 此函数可用于将部分的字符或二进制数据值发送到具有字符、二进制或数据源特定数据类型的列 (例如，SQL_LONGVARBINARY 或 SQL_LONGVARCHAR 类型) 的参数。 SQLPutData 支持绑定到 unicode C 数据类型，即使基础驱动程序不支持 unicode 数据。

#### 语法

```C++
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
```

### SQLRowCount

引入的版本： ODBC 1.0 标准符合性： ISO 92

SQLRowCount 返回受 `更新、 插入 或 删除` 语句`影响的行数`; SQLBulkOperations 中的 SQL_ADD、SQL_UPDATE_BY_BOOKMARK 或 SQL_DELETE_BY_BOOKMARK 操作;或 SQLSetPos 中的 SQL_UPDATE 或 SQL_DELETE 操作。

#### 语法

```C++
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
```

### SQLSetConnectAttr

引入的版本： ODBC 3.0 标准符合性： ISO 92

SQLSetConnectAttr 设置控制连接各个方面的属性。

#### 语法

```C++
SQLRETURN SQL_API
SQLSetConnectAttr(SQLHDBC hdbc, SQLINTEGER attribute,
                  SQLPOINTER value, SQLINTEGER value_len)
{

}
```

### SQLSetCursorName

引入的版本： ODBC 1.0 标准符合性： ISO 92

SQLSetCursorName 将游标名称与活动语句相关联。 如果应用程序不调用 SQLSetCursorName，则驱动程序将根据需要为 SQL 语句处理生成游标名称。

#### 语法

```C++
SQLRETURN SQL_API
SQLSetCursorName(SQLHSTMT hstmt, SQLCHAR* name, SQLSMALLINT name_len)
{

}
```

### SQLSetDescField

引入的版本： ODBC 3.0 标准符合性： ISO 92

SQLSetDescField 设置`描述符记录的单个字段的值`。

#### 语法

```C++
SQLRETURN SQL_API
SQLSetDescField(SQLHDESC hdesc, SQLSMALLINT record, SQLSMALLINT field,
    SQLPOINTER value, SQLINTEGER value_len)
{

}
```

### SQLSetDescRec

引入的版本： ODBC 3.0 标准符合性： ISO 92

SQLSetDescRec 函数将`设置多个描述符字段`，这些字段会影响绑定到列或参数数据的数据类型和缓冲区。

#### 语法

```C++
SQLRETURN SQL_API
SQLSetDescRec(SQLHDESC hdesc, SQLSMALLINT record, SQLSMALLINT type,
    SQLSMALLINT subtype, SQLLEN length, SQLSMALLINT precision,
    SQLSMALLINT scale, SQLPOINTER data_ptr,
    SQLLEN* octet_length_ptr, SQLLEN* indicator_ptr)
{

}
```

### SQLSetEnvAttr

引入的版本： ODBC 3.0 标准符合性： ISO 92

SQLSetEnvAttr 设置控制环境各个方面的特性。

#### 语法

```C++
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
```

### SQLSetPos

引入的版本： ODBC 1.0 标准符合性： ODBC

SQLSetPos 设置行集中的光标位置，并允许应用程序刷新行集中的数据，或更新或删除结果集中的数据。

#### 语法

```C++
/*
  @type    : ODBC 1.0 API
  @purpose : sets the cursor position in a rowset and allows an application
  to refresh data in the rowset or to update or delete data in
  the result set
*/
SQLRETURN SQL_API SQLSetP os(SQLHSTMT hstmt, SQLSETPOSIROW irow,
    SQLUSMALLINT fOption, SQLUSMALLINT fLock)
{

}
```

### SQLSetStmtAttr

引入的版本： ODBC 3.0 标准符合性： ISO 92

SQLSetStmtAttr 设置与语句相关的属性

#### 语法

```C++
SQLRETURN SQL_API
SQLSetStmtAttr(SQLHSTMT hstmt, SQLINTEGER attribute,
    SQLPOINTER value, SQLINTEGER value_len)
{

}
```

### SQLSpecialColumns

引入的版本： ODBC 1.0 标准符合性：打开组

SQLSpecialColumns 检索有关指定表中的列的下列信息：
* 唯一标识表中的行的一组最佳列。
* 当事务更新行中的任何值时，自动更新的列。

#### 语法

```C++
SQLRETURN SQL_API
SQLSpecialColumns(SQLHSTMT hstmt, SQLUSMALLINT type,
    SQLCHAR* catalog, SQLSMALLINT catalog_len,
    SQLCHAR* schema, SQLSMALLINT schema_len,
    SQLCHAR* table, SQLSMALLINT table_len,
    SQLUSMALLINT scope, SQLUSMALLINT nullable)
{

}
```

### SQLStatistics

引入的版本： ODBC 1.0 标准符合性： ISO 92

SQLStatistics 检索与表相关联的单个表和索引的统计信息列表。 驱动程序将以结果集的形式返回该信息。

#### 语法

```C++
SQLRETURN SQL_API
SQLStatistics(SQLHSTMT hstmt,
    SQLCHAR* catalog, SQLSMALLINT catalog_len,
    SQLCHAR* schema, SQLSMALLINT schema_len,
    SQLCHAR* table, SQLSMALLINT table_len,
    SQLUSMALLINT unique, SQLUSMALLINT accuracy)
{

}
```

### SQLTablePrivileges

引入的版本： ODBC 1.0 标准符合性： ODBC

SQLTablePrivileges 返回表列表和与每个表关联的特权。 驱动程序将该信息作为指定语句的结果集返回。

#### 语法

```C++
SQLRETURN SQL_API
SQLTablePrivileges(SQLHSTMT hstmt,
    SQLCHAR* catalog, SQLSMALLINT catalog_len,
    SQLCHAR* schema, SQLSMALLINT schema_len,
    SQLCHAR* table, SQLSMALLINT table_len)
{

}
```

### SQLTables

引入的版本： ODBC 1.0 标准符合性：Open Group

SQLTables 返回存储在特定数据源中的表、目录或架构名称以及表类型的列表。 驱动程序将以结果集的形式返回该信息。

#### 语法

```C++
SQLRETURN SQL_API
SQLTables(SQLHSTMT hstmt,
    SQLCHAR* catalog, SQLSMALLINT catalog_len,
    SQLCHAR* schema, SQLSMALLINT schema_len,
    SQLCHAR* table, SQLSMALLINT table_len,
    SQLCHAR* type, SQLSMALLINT type_len)
{

}
```

# 思考

## 想法Part1

不应该局限于整个体系，要形成自己的想法，然后进行实现。
ODBC的协议，这些协议代表的是什么，规定的是什么？网上资料几乎不可能告诉我。
目前的处境是，看似好像有一个逻辑，但是要依靠一个小白自下而上的调研整理出一个解决方案几乎不可能。
或者说难以形成一个真正可以实行的方案。无非就是：
响应连接，内部格式转换，进行事务处理，提交。
设置缓冲区，连接池。管理连接。

更细节的东西目前不能解决刚需，更笼统的体系又没有什么作用，都是在讲述流程。要从这里规整为方案不太实际。即使有也不是我想的那样得出一个具体的流程模板。

所以目下直接开始进行Demo实现，哪怕是进行黑盒反向测试。
如果鄙人经验丰富，那可能可以从大体上进行规划，甚至还可以通过模块化的思想将工作一分为多。

根本的目标是进行远程通信，响应其他的ODBC的连接。换一种思路。

所以接下来的工作是，
1. 实现一个Demo， 使用其访问sql server，并进行增删改查的基本操作。
2. 从这个Demo中得知Microsoft的执行方式，从而逆推ODBC功能。

## 想法Part2

我觉得，现在需要知道的是更底层的通信问题。
比如ODBC如何响应一个请求连接。这个地方也是Socket编程？
或者更底层的程序间的通信。甚至是请求连接的过程。

## 想法Part3

[210728]
不知道下一步进行什么。其实已经可以开始接口设计了。但是感觉对于诸多细节仍然不太清楚。

# 附录

## 标准说明

当使用 odbc 1.x 标头文件编译和链接 odbc 1.x 库， 以及通过 Odbc 1.x 驱动程序管理器获得对驱动程序的访问权限时，写入到开放组和 ISO CLI 规范的应用程序将使用 odbc 1.x 驱动程序或符合标准的驱动程序。
当使用 odbc 1.x 标头文件编译和链接 odbc 1.x库时，以及当应用程序通过 odbc 1.X 驱动程序管理器获得对驱动程序的访问权限时，写入到开放组和 ISO CLI 规范的驱动程序将使用 odbc 1.x应用程序或符合标准的应用程序。

## 代码存留1_用例

```C++
SQLHSTMT      hstmtOrder, hstmtLine; // Statement handles.  
SQLUINTEGER   OrderID;  
SQLINTEGER    OrderIDInd = 0;  
SQLRETURN     rc;  
  
// Prepare the statement that retrieves line number information.  
SQLPrepare(hstmtLine, "SELECT * FROM Lines WHERE OrderID = ?", SQL_NTS);  
  
// Bind OrderID to the parameter in the preceding statement.  
SQLBindParameter(hstmtLine, 1, SQL_PARAM_INPUT, SQL_C_ULONG, SQL_INTEGER, 5, 0,  
               &OrderID, 0, &OrderIDInd);  
  
// Bind the result sets for the Order table and the Lines table. Bind  
// OrderID to the OrderID column in the Orders table. When each row is  
// fetched, OrderID will contain the current order ID, which will then be  
// passed as a parameter to the statement tofetch line number  
// information. Code not shown.  
  
// Create a result set of sales orders.  
SQLExecDirect(hstmtOrder, "SELECT * FROM Orders", SQL_NTS);  
  
// Fetch and display the sales order data. Code to check if rc equals  
// SQL_ERROR or SQL_SUCCESS_WITH_INFO not shown.  
while ((rc = SQLFetch(hstmtOrder)) != SQL_NO_DATA) {  
   // Display the sales order data. Code not shown.  
  
   // Create a result set of line numbers for the current sales order.  
   SQLExecute(hstmtLine);  
  
   // Fetch and display the sales order line number data. Code to check  
   // if rc equals SQL_ERROR or SQL_SUCCESS_WITH_INFO not shown.  
   while ((rc = SQLFetch(hstmtLine)) != SQL_NO_DATA) {  
      // Display the sales order line number data. Code not shown.  
   }  
  
   // Close the sales order line number result set.  
   SQLCloseCursor(hstmtLine);  
}  
  
// Close the sales order result set.  
SQLCloseCursor(hstmtOrder);
```

# Recording


## 基本 ODBC 应用程序步骤[GO](https://docs.microsoft.com/zh-cn/sql/odbc/reference/develop-app/basic-odbc-application-steps?view=sql-server-ver15)

本部分包含以下主题。
* 步骤 1：连接数据源
* 步骤 2：初始化应用程序
* 步骤 3：生成并执行 SQL 语句
* 步骤 4a：提取结果
* 步骤 4b：提取行计数
* 步骤 5：提交事务
* 步骤 6：从数据源断开连接

### 步骤 1：连接数据源

connect:
SQLAllocHandle(ENV)
SQLSetEnvAttr
SQLAllocHandle(DBC)
SQLConnect
SQLSetConnectAttr

连接到数据源的第一步是加载驱动程序管理器，并通过 SQLAllocHandle分配环境句柄。

### 步骤 2：初始化应用程序

此时，通常使用 SQLGetInfo 来发现驱动程序的功能。

### 步骤 3：生成并执行 SQL 语句

第三步是生成和执行 SQL 语句，如下图所示。 用于执行此步骤的方法可能会有很大差异。 该应用程序可能会提示用户输入 SQL 语句，根据用户输入生成 SQL 语句，或者使用硬编码的 SQL 语句。

### 步骤 4a：提取结果

如果在 "步骤3：生成并执行 SQL 语句" 中执行的语句是 SELECT 语句或目录函数，则该应用程序首先调用 SQLNumResultCols 以确定结果集中的列数。 如果应用程序已知道结果集列的数目，则不需要执行此步骤，例如，当 SQL 语句在垂直或自定义应用程序中硬编码时。
接下来，应用程序通过 SQLDescribeCol检索每个结果集列的名称、数据类型、精度和小数位数。 同样，对于已知道此信息的应用程序（如垂直和自定义应用程序），这并不是必需的。 应用程序将此信息传递给 SQLBindCol，这会将应用程序变量绑定到结果集中的列。
现在，应用程序会调用 SQLFetch 来检索第一行数据，并将该行中的数据置于与 SQLBindCol绑定的变量中。 如果行中有任何长数据，则它会调用 SQLGetData 来检索该数据。 应用程序继续调用 SQLFetch 和 SQLGetData 以检索其他数据。 完成数据提取后，它将调用 SQLCloseCursor 以关闭游标。

### 步骤 4b：提取行计数

如果在步骤3中执行的语句是 UPDATE、 DELETE或 INSERT 语句，则应用程序将使用 SQLRowCount检索受影响行的计数。

### 步骤 5：提交事务

第五步是调用 SQLEndTran 来提交或回滚事务。 仅当应用程序将事务提交模式设置为手动提交时，应用程序才会执行此步骤;如果事务提交模式为自动提交（这是默认值），则执行语句时，将自动提交事务。 有关详细信息，请参阅事务。
若要在新事务中执行语句，应用程序会返回到步骤3。 若要断开与数据源的连接，应用程序将继续执行步骤6。

### 步骤 6：从数据源断开连接

最后一步是断开与数据源的连接，如下图所示。 首先，应用程序通过调用 SQLFreeHandle释放所有语句句柄。 有关详细信息，请参阅 释放语句句柄。

## 驱动程序管理器连接池

使用连接池，应用程序可以使用连接池的连接，无需在每次使用时重新建立连接。 创建连接并将其放置到池中后，应用程序可以重新使用该连接，而无需执行完整的连接过程。


# EOF


