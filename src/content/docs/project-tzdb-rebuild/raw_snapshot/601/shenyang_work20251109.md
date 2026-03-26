---
title: "shenyang_work20251109"
description: "shenyang_work20251109"
---

# 部分软件信息

## 注册中心数据模型

### 数据库连接配置
```
odbc_driver = "DSN=TZDB;DATABASE=center;DBPATH=../;STORAGE_ENGINE=kMemoryStorage"
#odbc_driver = "Driver={Devart ODBC Driver for SQLite};Database=:memory:"
```
---

### 表 1
| 列名   | 字段类型       | 主键属性 |
|--------|----------------|----------|
| col_1  | TINYINT        | true     |
| col_2  | TINYINT        | true     |
| col_3  | TINYINT        | true     |
| col_4  | SMALLINT       | true     |
| col_5  | TINYINT        | true     |
| col_6  | INT            | false    |
| col_7  | VARCHAR(50)    | false    |
| col_8  | VARCHAR(50)    | false    |
| col_9  | INT            | true     |
| col_10 | VARCHAR(50)    | true     |
| col_11 | TINYINT        | false    |
| col_12 | INT            | false    |
| col_13 | INT            | false    |
| col_14 | INT            | false    |
| col_15 | INT            | false    |
| col_16 | INT            | false    |
| col_17 | INT            | false    |
| col_18 | INT            | false    |
| col_19 | INT            | false    |
| col_20 | INT            | false    |
| col_21 | INT            | false    |
| col_22 | INT            | false    |
| col_23 | INT            | false    |
| col_24 | VARCHAR(50)    | false    |

---

### 表 2
| 列名   | 字段类型       | 主键属性 |
|--------|----------------|----------|
| col_1  | VARCHAR(50)    | true     |
| col_2  | TINYINT        | true     |
| col_3  | SMALLINT       | true     |
| col_4  | TINYINT        | true     |
| col_5  | INT            | true     |
| col_6  | VARCHAR(50)    | false    |
| col_7  | VARCHAR(50)    | false    |
| col_8  | INT            | true     |
| col_9  | TINYINT        | true     |
| col_10 | SMALLINT       | true     |
| col_11 | TINYINT        | true     |
| col_12 | INT            | false    |
| col_13 | VARCHAR(50)    | false    |
| col_14 | VARCHAR(50)    | false    |
| col_15 | INT            | true     |

---

### 表 3
| 列名   | 字段类型       | 主键属性 |
|--------|----------------|----------|
| col_1  | TINYINT        | true     |
| col_2  | VARCHAR(50)    | true     |
| col_3  | SMALLINT       | true     |
| col_4  | TINYINT        | false    |
| col_5  | VARBINARY      | false    |

---

### 表 4
| 列名   | 字段类型       | 主键属性 |
|--------|----------------|----------|
| col_1  | TINYINT        | true     |
| col_2  | SMALLINT       | true     |
| col_3  | TINYINT        | true     |
| col_4  | VARCHAR(50)    | true     |
| col_5  | VARCHAR(50)    | true     |
| col_6  | TINYINT        | true     |
| col_7  | TINYINT        | false    |
| col_8  | TINYINT        | false    |
| col_9  | TINYINT        | false    |

---

### 表 5
| 列名   | 字段类型       | 主键属性 |
|--------|----------------|----------|
| col_1  | SMALLINT       | true     |
| col_2  | VARCHAR(50)    | true     |
| col_3  | VARCHAR(50)    | true     |
| col_4  | TINYINT        | true     |
| col_5  | VARBINARY      | false    |

---

### 表 6
| 列名   | 字段类型       | 主键属性 |
|--------|----------------|----------|
| col_1  | SMALLINT       | true     |
| col_2  | SMALLINT       | true     |
| col_3  | SMALLINT       | true     |

## 配置中心数据模型

根据原始代码中的空格分组(空行分隔表示不同表)，抽象为以下多表结构，列名用`col_1`至`col_N`表示，保留数据类型和主键标识：


### 表 1
| 列名   | 数据类型          | 主键标识(1=是/0=否) |
|--------|-------------------|-----------------------|
| col_1  | TINYINT           | 1                     |
| col_2  | TINYINT           | 1                     |
| col_3  | INT               | 1                     |
| col_4  | VARCHAR           | 0                     |
| col_5  | VARCHAR           | 0                     |
| col_6  | INT               | 0                     |
| col_7  | INT               | 0                     |
| col_8  | TINYINT           | 0                     |
| col_9  | TINYINT           | 0                     |
| col_10 | TINYINT           | 0                     |


### 表 2
| 列名   | 数据类型          | 主键标识(1=是/0=否) |
|--------|-------------------|-----------------------|
| col_1  | TINYINT           | 1                     |
| col_2  | TINYINT           | 1                     |
| col_3  | INT               | 1                     |
| col_4  | VARCHAR           | 1                     |
| col_5  | VARCHAR           | 0                     |


### 表 3
| 列名   | 数据类型          | 主键标识(1=是/0=否) |
|--------|-------------------|-----------------------|
| col_1  | VARCHAR           | 1                     |
| col_2  | VARBINARY         | 0                     |
| col_3  | INT               | 0                     |

# 工作日志

## [11.12]

数据服务器：数据存储与同步执行载体

元信息服务器：分布式服务配置与管理中枢


# [11.14]

@odbc_api_ext.cpp#L40 该接口有个问题，其错误是交给全局的DiagnosticManager来管理的@odbc_api_ext.cpp#L56-58 ，但是这种方法有问题，既然我可以通过句柄来获取错误，那么为什么错误不存储在句柄之中，毕竟odbc现在是四个句柄的内容。试着修改，每个句柄能够最多存储10条错误异常

2025-11-15 09:51:46 [execute_common.cpp:245:InsertTuple] ERROR - [InsertTuple] _txn_manager type: N4tzdb22MVCCTransactionManagerE, _txn type: N4tzdb15MVCCTransactionE
2025-11-15 09:52:01 [execute_common.cpp:247:InsertTuple] ERROR - [InsertTuple] _txn_manager address: 0x610000000440, _txn address: 0x60d000009420
2025-11-15 09:52:13 [execute_common.cpp:253:InsertTuple] ERROR - [InsertTuple] dynamic_cast failed: _txn_manager is not MVCCTransactionManager
2025-11-15 09:52:14 [execute_common.cpp:255:InsertTuple] ERROR - [InsertTuple] Expected: N4tzdb22MVCCTransactionManagerE, Got: N4tzdb22MVCCTransactionManagerE


odbc 的事务是很关键的内容，但是此处却对事务的开启和关闭无法进行完整的约束。应该建立合理的事务上下文，限制语句句柄中的session只有一个事务在开启着。并且在执行某些方法前需要判断是否有事务，如果有需要提交，而没有需要开启；但有的方法，执行前需要判断是否已经存在事务，有则成功，无则失败；有的方法，执行完成后需要提交事务，但大部分方法应该是不需要提交事务的。


有这么几种情况：
1. 直接执行接口ExecDirect：
   1. 如果是 query 那么需要重新开启事务，即有则提交，并且重新开启事务；
   2. 非 query， 那么允许不重新开启事务以进行批量查询等操作，但必须要确保有事务；
   3. 不提交事务；
2. 预执行接口Prepare：
   1. 无论是否query，都重新开启事务；
   2. 不提交事务；
3. Execute接口：
   1. 不提交事务；

LoadCatalogFromSystemTables

# [11.16]

我有一个分布式测试用例，tests/distribute_test/follower1_test/follower1_main.cpp，tests/distribute_test/follower2_test/follower2_main.cpp， tests/distribute_test/leader_test/leader_main.cpp.
我希望能够编写一个gtest风格的测试用例，通过多进程来测试其正确性。

# [11.17]

uoe 只能在 linux 中编译。
那么我需要一个宿主机器进行编译，然后发给甲方项目库，使得其可以进行验证，那么最好的是，交付物删除所有代码。只保留每次的结果。

关键是 uoe 的启用方式。

OK，接下来很关键也很简单，修改distribution/network/net_pool_rpc.cpp文件，通过宏来控制该文件是否生效。新写一个文件，来专门使用 uoe 的io 模型和uoe的连接，关闭宏的时候仍然是现有net_pool_rpc.cpp，但开启宏后就使用新文件的实现，来切换网络


