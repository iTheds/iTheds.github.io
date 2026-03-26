---
title: "接口"
description: "接口"
---

# 接口

| 序号 | 接口名称 | 接口标识 | 接口简述 | 接口对应位置 |
|------|----------|----------|----------|--------------|
| 1 | 数据库打开 | DSS-JK-CUSTIN-1.1 | 创建或打开数据库实例 | [Database::Database(const char *path, const std::string &db_name, ...)](cci:1://file:///home/ithedslonnie/Projects/TZDB_PROJECT_WORK/backup/tzdb-rebuild/src/api_sql/cpp-api.cpp:31:0-75:1) |
| 2 | 数据库连接 | DSS-JK-CUSTIN-1.2 | 建立数据库连接，支持权限验证 | [Connection::Connection(Database &db, int32_t role_id)](cci:1://file:///home/ithedslonnie/Projects/TZDB_PROJECT_WORK/backup/tzdb-rebuild/src/api_sql/cpp-api.cpp:112:0-130:1) |
| 3 | 数据库断开连接 | DSS-JK-CUSTIN-1.3 | 断开连接，清理session资源 | [Connection::~Connection()](cci:1://file:///home/ithedslonnie/Projects/TZDB_PROJECT_WORK/backup/tzdb-rebuild/src/api_sql/cpp-api.cpp:173:0-177:1) |
| 4 | 数据库关闭 | DSS-JK-CUSTIN-1.4 | 关闭数据库，执行checkpoint | [Database::~Database()](cci:1://file:///home/ithedslonnie/Projects/TZDB_PROJECT_WORK/backup/tzdb-rebuild/src/api_sql/cpp-api.cpp:83:0-108:1) |
| 5 | 执行SQL语句 | DSS-JK-CUSTIN-1.5 | 同步执行SQL查询，返回结果集 | [Connection::Query(const std::string &sql)](cci:1://file:///home/ithedslonnie/Projects/TZDB_PROJECT_WORK/backup/tzdb-rebuild/src/api_sql/cpp-api.cpp:187:0-196:1) |
| 6 | 预处理SQL语句 | DSS-JK-CUSTIN-1.6 | 预编译SQL语句，支持参数化查询 | [Connection::Prepare(const std::string &sql)](cci:1://file:///home/ithedslonnie/Projects/TZDB_PROJECT_WORK/backup/tzdb-rebuild/src/api_sql/cpp-api.cpp:198:0-198:115) |
| 7 | 执行预处理语句 | DSS-JK-CUSTIN-1.7 | 绑定参数并执行预处理语句 | [PrepareHandle::Binder(std::vector<ColumnValue> &values)](cci:1://file:///home/ithedslonnie/Projects/TZDB_PROJECT_WORK/backup/tzdb-rebuild/src/api_sql/cpp-api.cpp:203:0-216:1) |
| 8 | 事务开始 | DSS-JK-CUSTIN-1.8 | 开始事务，支持多种事务类型 | [Connection::BeginTransaction(TransactionType trans_type)](cci:1://file:///home/ithedslonnie/Projects/TZDB_PROJECT_WORK/backup/tzdb-rebuild/src/api_sql/cpp-api.cpp:179:0-182:1) |
| 9 | 事务提交 | DSS-JK-CUSTIN-1.9 | 提交当前事务 | [Connection::CommitTransaction()](cci:1://file:///home/ithedslonnie/Projects/TZDB_PROJECT_WORK/backup/tzdb-rebuild/src/api_sql/cpp-api.cpp:184:0-184:77) |
| 10 | 事务回滚 | DSS-JK-CUSTIN-1.10 | 回滚当前事务 | [Connection::RollbackTransaction()](cci:1://file:///home/ithedslonnie/Projects/TZDB_PROJECT_WORK/backup/tzdb-rebuild/src/api_sql/cpp-api.cpp:185:0-185:81) |
| 11 | 获取结果集元数据信息 | DSS-JK-CUSTIN-1.11 | 获取列名和列数据类型 | [ResultBase::GetColName(int index)](cci:1://file:///home/ithedslonnie/Projects/TZDB_PROJECT_WORK/backup/tzdb-rebuild/src/api_sql/cpp-api.cpp:427:0-427:100)、[ResultBase::GetColType(int index)](cci:1://file:///home/ithedslonnie/Projects/TZDB_PROJECT_WORK/backup/tzdb-rebuild/src/api_sql/cpp-api.cpp:428:0-430:1) |
| 12 | 获取结果集行数 | DSS-JK-CUSTIN-1.12 | 返回结果集的总行数 | [ResultBase::GetDataLength()](cci:1://file:///home/ithedslonnie/Projects/TZDB_PROJECT_WORK/backup/tzdb-rebuild/src/api_sql/cpp-api.cpp:426:0-426:95) |
| 13 | 获取结果集列数 | DSS-JK-CUSTIN-1.13 | 返回结果集的列数 | [ResultBase::GetColumnCount()](cci:1://file:///home/ithedslonnie/Projects/TZDB_PROJECT_WORK/backup/tzdb-rebuild/src/api_sql/cpp-api.cpp:431:0-431:82) |
| 14 | 获取当前行数据 | DSS-JK-CUSTIN-1.14 | 获取当前行的列值 | [ResultBase::GetBoolValue()](cci:1://file:///home/ithedslonnie/Projects/TZDB_PROJECT_WORK/backup/tzdb-rebuild/src/api_sql/cpp-api.cpp:339:0-354:1)、[GetIntValue()](cci:1://file:///home/ithedslonnie/Projects/TZDB_PROJECT_WORK/backup/tzdb-rebuild/src/api_sql/cpp-api.cpp:368:0-372:1)、[GetStringValue()](cci:1://file:///home/ithedslonnie/Projects/TZDB_PROJECT_WORK/backup/tzdb-rebuild/src/api_sql/cpp-api.cpp:416:0-420:1)等 |
| 15 | 检查列是否为NULL | DSS-JK-CUSTIN-1.15 | 检查指定列是否为NULL值 | [ResultBase::IsNull(int index)](cci:1://file:///home/ithedslonnie/Projects/TZDB_PROJECT_WORK/backup/tzdb-rebuild/src/api_sql/cpp-api.cpp:422:0-422:83) |
| 16 | 移动到下一行 | DSS-JK-CUSTIN-1.16 | 向前移动到下一行 | [ResultBase::Next()](cci:1://file:///home/ithedslonnie/Projects/TZDB_PROJECT_WORK/backup/tzdb-rebuild/src/api_sql/cpp-api.cpp:489:0-498:1) |
| 17 | 创建布尔值参数 | DSS-JK-CUSTIN-1.17 | 创建布尔类型的参数值 | [ColumnValue::BOOLEAN(bool value)](cci:1://file:///home/ithedslonnie/Projects/TZDB_PROJECT_WORK/backup/tzdb-rebuild/src/api_sql/cpp-api.cpp:248:0-252:1) |
| 18 | 创建整数参数 | DSS-JK-CUSTIN-1.18 | 创建各种整数类型的参数值 | [ColumnValue::INTEGER(int32_t value)](cci:1://file:///home/ithedslonnie/Projects/TZDB_PROJECT_WORK/backup/tzdb-rebuild/src/api_sql/cpp-api.cpp:266:0-270:1)、[BIGINT(int64_t value)](cci:1://file:///home/ithedslonnie/Projects/TZDB_PROJECT_WORK/backup/tzdb-rebuild/src/api_sql/cpp-api.cpp:272:0-276:1)等 |
| 19 | 创建浮点数参数 | DSS-JK-CUSTIN-1.19 | 创建浮点数类型的参数值 | [ColumnValue::FLOAT(float value)](cci:1://file:///home/ithedslonnie/Projects/TZDB_PROJECT_WORK/backup/tzdb-rebuild/src/api_sql/cpp-api.cpp:308:0-312:1)、[DOUBLE(double value)](cci:1://file:///home/ithedslonnie/Projects/TZDB_PROJECT_WORK/backup/tzdb-rebuild/src/api_sql/cpp-api.cpp:314:0-318:1) |
| 20 | 创建字符串参数 | DSS-JK-CUSTIN-1.20 | 创建字符串类型的参数值 | [ColumnValue::VARINT(const string &data)](cci:1://file:///home/ithedslonnie/Projects/TZDB_PROJECT_WORK/backup/tzdb-rebuild/src/api_sql/cpp-api.cpp:320:0-324:1) |
| 21 | 创建时间戳参数 | DSS-JK-CUSTIN-1.21 | 创建时间戳类型的参数值 | [ColumnValue::TIMESTAMP(uint64_t value)](cci:1://file:///home/ithedslonnie/Projects/TZDB_PROJECT_WORK/backup/tzdb-rebuild/src/api_sql/cpp-api.cpp:278:0-282:1) |

# 接口测试

## 数据库打开 DSS-JK-CUSTIN-1.1

数据库打开：DSS-JK-CUSTIN-1.1

| 用例名称/标识 | 数据库打开：DSS-JK-CUSTIN-1.1 |
|-------------|---------------------------|
| 用例说明 | 测试数据库打开接口，能够创建或打开数据库实例，支持配置参数和管理员角色创建 |

| 步骤  | 前提和约束                                            | 输入                                                                                | 目的和动作 | 预期结果 | 评估准则 | 备注                        |
|-----|--------------------------------------------------|-----------------------------------------------------------------------------------|------------|----------|----------|---------------------------|
| 步骤1 | 操作系统支持文件系统操作<br>TZDB库已编译安装<br>有足够磁盘空间 | - 数据库路径(const char* path)<br>- 数据库名称(const char* db_name)<br>- 配置对象(DBConfig* config，可选)<br>- 管理员角色ID(int32_t admin_role_id，可选)<br>- 缓冲池优化(bool optimize_buffer_pool，可选)<br>- 实例ID(int instance_id，可选) | 验证Database构造函数能够创建或打开数据库实例，支持各种配置参数 | 数据库实例创建成功，无异常<br>db_指针有效<br>数据库文件正确创建或打开 | 数据库对象有效<br>db_成员非空<br>后续操作正常<br>配置文件生效 | 测试本地和分布式场景<br>覆盖新数据库和现有数据库 |
| 步骤2 | 检查数据库实例管理 | DBInstance单例检查                                                                     | 验证DBInstance正确管理数据库实例 | 实例正确注册和管理 | 数据库实例生命周期正确 | \                         |
| 步骤3 | 测试管理员角色创建 | admin_role_id参数大于0                                                                | 创建管理员角色并授予权限 | 角色创建成功，权限授予 | 角色存在于catalog中<br>权限检查通过 | \                         |
| 步骤4 | 验证数据库状态 | Database对象                                                                          | 检查数据库是否可用 | 数据库可用于连接 | SQL操作正常 | \                         |
| 步骤5 | 测试析构函数 | Database对象销毁                                                                     | 执行checkpoint和清理 | 资源清理成功，无内存泄漏 | checkpoint执行<br>内存无泄漏 | \                         |

### 步骤1 样本数据: DSS-JK-CUSTIN-1-1.doc
#### 成功样本：
| 输入项/预期结果 | 输入名称/预期结果 | S1 | S2 | S3 | S4 | S5  |“/”代表的输入	|备注 |
|----------------|------------------|-----|-----|-----|-----|-----|-|-|
| 输入项 | const char* path | "/tmp/test.db" | "/tmp/test.db" | "/tmp/test.db" | "/tmp/test.db" | "/tmp/test.db" | \ | \ | 
| | const char* db_name | "testdb" | "testdb" | "testdb" | "testdb" | "testdb" | \ | \ |
| | DBConfig* config | nullptr | nullptr | nullptr | nullptr | nullptr | \ | \ |
| | int32_t admin_role_id | 0 | 1 | 0 | 0 | 0 | \ | \ | 
| | bool optimize_buffer_pool | false | false | true | false | false | \ | \ |
| | int instance_id | 0 | 0 | 0 | 1 | 0 | \ | \ | 
| 预期结果 | Database对象 | 创建成功，db_有效 | 创建成功，管理员角色创建 | 创建成功，缓冲池优化 | 创建成功，实例ID=1 | 创建成功，文件存在 | \ | \ |
| | 数据库文件 | 创建或打开 | 创建或打开 | 创建或打开 | 创建或打开 | 创建或打开 | \ | \ | 
| 备注 | \ | 新数据库 | 管理员角色 | 缓冲池优化 | 多实例 | 现有数据库 | \ | \ | 

#### 失败样本：
| 输入项/预期结果 | 输入名称/预期结果 | F1 | F2 | F3 |- |- |“/”代表的输入	|备注|
|----------------|------------------|-----|-----|-----|-|-|-|-|
| 输入项 | const char* path | nullptr | "/invalid/path/test.db" | "/tmp/test.db" | \ | \ | \ | \ | \ |
| | const char* db_name | "testdb" | "testdb" | nullptr | \ | \ | \ | \ | \ |
| | DBConfig* config | nullptr | nullptr | nullptr | \ | \ | \ | \ | \ |
| | int32_t admin_role_id | 0 | 0 | 0 | \ | \ | \ | \ | \ |
| | bool optimize_buffer_pool | false | false | false | \ | \ | \ | \ | \ |
| | int instance_id | 0 | 0 | 0 | \ | \ | \ | \ | \ |
| 预期结果 | 异常类型 | std::runtime_error | std::runtime_error | std::runtime_error | \ | \ | \ | \ | \ |
| | 错误信息 | "Invalid path" | "Failed to open database" | "Invalid database name" | \ | \ | \ | \ | \ |
| | 错误码 | INVALID_PATH | DB_OPEN_FAILED | INVALID_NAME | \ | \ | \ | \ | \ |
| 备注 | \ | 空路径 | 无权限路径 | 空数据库名 | \ | \ | \ | \ | \ |

## 数据库连接 DSS-JK-CUSTIN-1.2

数据库连接：DSS-JK-CUSTIN-1.2

|用例名称/标识|	数据库连接：DSS-JK-CUSTIN-1.2|
|-------------|---------------------------|
|用例说明	|测试数据库连接接口，能够建立数据库连接并支持权限验证|

| 步骤  | 前提和约束                                            | 输入                                                                                | 目的和动作 | 预期结果 | 评估准则 | 备注                        |
|-----|--------------------------------------------------|-----------------------------------------------------------------------------------|------------|----------|----------|---------------------------|
| 步骤1 | 操作系统支持网络连接<br>数据库已正确创建<br>TZDB库已编译安装<br>权限验证机制正常 | - 数据库引用(Database& db)<br>- 角色ID(int32_t role_id，可选)                               | 验证Connection构造函数能够建立数据库连接，支持角色权限验证 | 连接成功创建，无异常<br>session对象有效<br>权限验证通过 | 连接对象创建成功<br>session指针非空<br>后续SQL操作正常<br>权限检查正确 | 测试本地和分布式场景<br>覆盖有权限和无权限情况 |
| 步骤2 | 使用Database构造函数创建数据库实例                            | Database(path, db_name, config, admin_role_id, optimize_buffer_pool, instance_id) | 调用Database构造函数 | 数据库实例创建成功，无异常 | 数据库对象有效 | \                         |
| 步骤3 | 使用Connection构造函数建立连接  ,传入参见样本数据: DSS-JK-CUSTIN-1-2.doc  | Connection(db, role_id)                                                | 传入数据库引用和角色ID | 连接创建成功，session建立 | session指针非空 | \                         |
| 步骤4 | 验证连接有效性                                          | Connection对象                                                                      | 检查session指针 | 连接对象有效，可以执行SQL | SQL执行正常 | \                         |
| 步骤5 | 测试权限验证                                           | role_id参数                                                                         | 验证权限检查逻辑 | 权限验证通过或抛出相应异常 | 权限检查正确 | \                         |
| 步骤6 | 清理连接资源                                           | Connection对象                                                                      | 断开连接，销毁对象 | 资源清理成功，无内存泄漏 | 无资源泄漏 | \ |

### 步骤3 样本数据: DSS-JK-CUSTIN-1-2.doc
#### 成功样本：
| 输入项/预期结果 | 输入名称/预期结果 | S1 | S2 |- |- |- |“/”代表的输入	|备注|
|----------------|------------------|-----|-----|- |- |- |- |- |
| 输入项 | Database& db | 有效Database对象 | 有效Database对象 | \ | \ | \ | \ | \ |
| | int32_t role_id | 1 (管理员角色) | -1 (无角色) | \ | \ | \ | \ | \ |
| 预期结果 | Connection对象 | 创建成功，session有效 | 创建成功，session有效 | \ | \ | \ | \ | \ |
| | 权限验证 | 通过 | 通过(无角色验证) | \ | \ | \ | \ | \ |
| 备注| \ | \ | \ | \ | \ | \ | \ | \ |

#### 失败样本：
| 输入项/预期结果 | 输入名称/预期结果 | F1 | F2                  |- |- |- |"／"代表的输入	|备注|
|----------------|------------------|-----|---------------------|-|- |- |- |-|
| 输入项 | Database& db | nullptr | 无效Database对象        | \ | \ | \ | \ | \ |
| | int32_t role_id | 1 | 999 (不存在角色)         | \ | \ | \ | \ | \ |
| 预期结果 | 异常类型 | std::runtime_error | std::runtime_error  | \ | \ | \ | \ | \ |
| | 错误信息 | "Invalid database" | "Permission denied" | \ | \ | \ | \ | \ |
| 备注| \ | \ | \                   | \ | \ | \ | \ | \ |



## 数据库断开连接 DSS-JK-CUSTIN-1.3

数据库断开连接：DSS-JK-CUSTIN-1.3

| 用例名称/标识 | 数据库断开连接：DSS-JK-CUSTIN-1.3 |
|-------------|---------------------------|
| 用例说明 | 测试数据库断开连接接口，能够断开连接，清理session资源 |

| 步骤  | 前提和约束                                            | 输入                                                                                | 目的和动作 | 预期结果 | 评估准则 | 备注                        |
|-----|--------------------------------------------------|-----------------------------------------------------------------------------------|------------|----------|----------|---------------------------|
| 步骤1 | Connection对象已创建，session有效                          | Connection对象                                                                      | 验证Connection构造函数创建的连接 | 连接对象有效，session存在 | session指针非空 | \                         |
| 步骤2 | 测试析构函数调用 | Connection对象销毁(超出作用域或delete)                                             | 调用~Connection() | session断开，资源清理 | DisconnectSession被调用<br>session_置空 | \                         |
| 步骤3 | 验证资源清理 | 检查DBInstance状态                                                                  | 确认session已从DBInstance移除 | session不再有效 | DBInstance中session不存在 | \                         |
| 步骤4 | 测试异常情况 | session_为空或无效                                                                  | 析构函数处理异常 | 无异常抛出，安全清理 | 析构函数不抛出异常 | \                         |

### 步骤2 样本数据: DSS-JK-CUSTIN-1-3.doc
#### 成功样本：
| 输入项/预期结果 | 输入名称/预期结果 | S1 | S2 |- |- |- |"／"代表的输入	|备注|
|----------------|------------------|-----|-----|-|-|-|-|-|
| 输入项 | Connection对象 | 有效Connection对象 | 有效Connection对象 | \ | \ | \ | \ | \ |
| 预期结果 | 析构行为 | session断开成功 | session断开成功 | \ | \ | \ | \ | \ |
| | 资源清理 | DBInstance更新 | DBInstance更新 | \ | \ | \ | \ | \ |
| 备注 | \ | 正常断开 | 正常断开 | \ | \ | \ | \ | \ |

#### 失败样本：
| 输入项/预期结果 | 输入名称/预期结果 | F1 |- |- |- |- |"／"代表的输入	|备注|
|----------------|------------------|-----|-|-|-|-|-|-|
| 输入项 | Connection对象 | session_为空的Connection | \ | \ | \ | \ | \ | \ |
| 预期结果 | 析构行为 | 无操作，安全返回 | \ | \ | \ | \ | \ | \ |
| | 异常抛出 | 不抛出异常 | \ | \ | \ | \ | \ | \ |
| 备注 | \ | session为空 | \ | \ | \ | \ | \ | \ |



## 数据库关闭 DSS-JK-CUSTIN-1.4

数据库关闭：DSS-JK-CUSTIN-1.4

| 用例名称/标识 | 数据库关闭：DSS-JK-CUSTIN-1.4 |
|-------------|---------------------------|
| 用例说明 | 测试数据库关闭接口，能够关闭数据库，执行checkpoint并清理资源 |

| 步骤  | 前提和约束                                            | 输入                                                                                | 目的和动作 | 预期结果 | 评估准则 | 备注                        |
|-----|--------------------------------------------------|-----------------------------------------------------------------------------------|------------|----------|----------|---------------------------|
| 步骤1 | Database对象已创建，owns_db_=true                         | Database对象                                                                       | 验证Database构造函数创建的数据库 | 数据库对象有效，db_指针非空 | db_成员有效 | \                         |
| 步骤2 | 测试析构函数调用 | Database对象销毁(超出作用域或delete)                                              | 调用~Database() | 执行checkpoint，清理内存表 | checkpoint成功<br>RemoveMemoryTable调用 | \                         |
| 步骤3 | 验证checkpoint执行 | 检查checkpoint结果                                                                  | 确认数据落盘 | 数据持久化成功 | checkpoint返回kSuccess | \                         |
| 步骤4 | 验证资源清理 | 检查内存表状态                                                                     | 确认内存表已清理 | 内存资源释放 | RemoveMemoryTable完成 | \                         |
| 步骤5 | 测试异常处理 | 模拟checkpoint失败                                                                  | 析构函数捕获异常 | 异常被捕获，程序继续 | 异常不影响析构完成 | \                         |

### 步骤2 样本数据: DSS-JK-CUSTIN-1-4.doc
#### 成功样本：
| 输入项/预期结果 | 输入名称/预期结果 | S1 | S2 | S3 |- |- |"／"代表的输入	|备注|
|----------------|------------------|-----|-----|-----|-|-|-|-|
| 输入项 | Database对象 | 有效Database对象 | 有效Database对象 | 有效Database对象 | \ | \ | \ | \ | 
| 预期结果 | 析构行为 | checkpoint成功，内存表清理 | checkpoint成功，内存表清理 | checkpoint失败但异常处理 | \ | \ | \ | \ | 
| | checkpoint结果 | kSuccess | kSuccess | 失败但捕获 | \ | \ | \ | \ | 
| | 内存表清理 | 成功 | 成功 | 成功 | \ | \ | \ | \ | 
| 备注 | \ | 正常关闭 | 正常关闭 | 异常处理 | \ | \ | \ | \ | 

#### 失败样本：
| 输入项/预期结果 | 输入名称/预期结果 | F1 |- |- |- |- |"／"代表的输入	|备注|
|----------------|------------------|-----|-|-|-|-|-|-|
| 输入项 | Database对象 | owns_db_=false的Database | \ | \ | \ | \ | \ | \ |
| 预期结果 | 析构行为 | 无checkpoint和清理操作 | \ | \ | \ | \ | \ | \ |
| | 资源状态 | 不改变 | \ | \ | \ | \ | \ | \ |
| 备注 | \ | 不拥有数据库所有权 | \ | \ | \ | \ | \ | \ |



## 执行SQL语句 DSS-JK-CUSTIN-1.5

执行SQL语句：DSS-JK-CUSTIN-1.5

| 用例名称/标识 | 执行SQL语句：DSS-JK-CUSTIN-1.5 |
|-------------|---------------------------|
| 用例说明 | 测试执行SQL语句接口，同步执行SQL查询，返回结果集 |

| 步骤  | 前提和约束                                            | 输入                                                                                | 目的和动作 | 预期结果 | 评估准则 | 备注                        |
|-----|--------------------------------------------------|-----------------------------------------------------------------------------------|------------|----------|----------|---------------------------|
| 步骤1 | 连接已建立，session有效                                 | Connection对象，SQL字符串                                                           | 验证Connection状态 | 连接有效，session非空 | session_ != nullptr | \                         |
| 步骤2 | 执行SELECT查询 | 有效的SELECT SQL语句                                                                | 调用Query方法 | 返回ResultBase指针 | 结果集有效，可遍历数据 | \                         |
| 步骤3 | 执行非查询语句 | INSERT/UPDATE/DELETE SQL语句                                                        | 调用Query方法 | 返回结果集(可能为空) | 执行成功，无异常 | \                         |
| 步骤4 | 验证结果集操作 | ResultBase对象                                                                      | 调用Next()、GetStringValue()等 | 正确获取数据 | 数据匹配预期 | \                         |
| 步骤5 | 测试异常情况 | 无效SQL语法、session为空                                                             | Query方法抛出异常 | 异常被正确抛出 | 错误信息准确 | \                         |

### 步骤2 样本数据: DSS-JK-CUSTIN-1-5.doc
#### 成功样本：
| 输入项/预期结果 | 输入名称/预期结果 | S1 | S2 | S3 | S4 |-  |"／"代表的输入	|备注|
|----------------|------------------|-----|-----|-----|-----|-|-|-|
| 输入项 | const std::string &sql | "SELECT 1" | "SELECT * FROM table" | "INSERT INTO table VALUES(1)" | "UPDATE table SET col=1" | \ | \ | \ | \ | \ |
| 预期结果 | ResultBase指针 | 有效结果集 | 有效结果集 | 执行成功 | 执行成功 | \ | \ | \ | \ | \ |
| | 执行结果 | 返回数据 | 返回数据 | 影响行数 | 影响行数 | \ | \ | \ | \ | \ |
| 备注 | \ | 简单查询 | 表查询 | 非查询语句 | 非查询语句 | \ | \ | \ | \ | \ |

#### 失败样本：
| 输入项/预期结果 | 输入名称/预期结果 | F1 | F2 |- |- |- |"／"代表的输入	|备注|
|----------------|------------------|-----|-----|-|-|-|-|-|
| 输入项 | const std::string &sql | "INVALID SQL" | "SELECT FROM nonexistent" | "" | \ | \ | \ | \ | \ |
| | Connection对象 | 有效连接 | 有效连接 | session为空 | \ | \ | \ | \ | \ |
| 预期结果 | 异常类型 | SQL语法错误 | 表不存在 | runtime_error | \ | \ | \ | \ | \ |
| | 错误信息 | "Syntax error" | "Table not found" | "Connection session is null" | \ | \ | \ | \ | \ |
| 备注 | \ | 语法错误 | 表不存在 | session为空 | \ | \ | \ | \ | \ |



## 预处理SQL语句 DSS-JK-CUSTIN-1.6

预处理SQL语句：DSS-JK-CUSTIN-1.6

| 用例名称/标识 | 预处理SQL语句：DSS-JK-CUSTIN-1.6 |
|-------------|---------------------------|
| 用例说明 | 测试预处理SQL语句接口，预编译SQL语句，支持参数化查询 |

| 步骤  | 前提和约束                                            | 输入                                                                                | 目的和动作 | 预期结果 | 评估准则 | 备注                        |
|-----|--------------------------------------------------|-----------------------------------------------------------------------------------|------------|----------|----------|---------------------------|
| 步骤1 | 连接已建立，session有效                                 | Connection对象，SQL字符串                                                           | 验证Connection状态 | 连接有效，session非空 | session_ != nullptr | \                         |
| 步骤2 | 预处理SELECT语句 | 带占位符的SELECT SQL                                                                | 调用Prepare方法 | 返回PrepareHandle指针 | 预处理成功，句柄有效 | \                         |
| 步骤3 | 预处理INSERT语句 | 带占位符的INSERT SQL                                                                | 调用Prepare方法 | 返回PrepareHandle指针 | 预处理成功 | \                         |
| 步骤4 | 预处理UPDATE语句 | 带占位符的UPDATE SQL                                                                | 调用Prepare方法 | 返回PrepareHandle指针 | 预处理成功 | \                         |
| 步骤5 | 测试异常情况 | 无效SQL语法                                                                          | Prepare方法抛出异常 | 异常被正确抛出 | 错误信息准确 | \                         |

### 步骤2 样本数据: DSS-JK-CUSTIN-1-6.doc
#### 成功样本：
| 输入项/预期结果 | 输入名称/预期结果 | S1 | S2 | S3 | S4 |- |"／"代表的输入	|备注|
|----------------|------------------|-----|-----|-----|-----|-|-|-|
| 输入项 | const std::string &sql | "SELECT * FROM table WHERE id = ?" | "INSERT INTO table VALUES(?, ?)" | "UPDATE table SET col = ? WHERE id = ?" | "DELETE FROM table WHERE id = ?" | \ | \ | \ | \ | \ |
| 预期结果 | PrepareHandle指针 | 有效句柄 | 有效句柄 | 有效句柄 | 有效句柄 | \ | \ | \ | \ | \ |
| | 预处理结果 | 编译成功 | 编译成功 | 编译成功 | 编译成功 | \ | \ | \ | \ | \ |
| 备注 | \ | SELECT预处理 | INSERT预处理 | UPDATE预处理 | DELETE预处理 | \ | \ | \ | \ | \ |

#### 失败样本：
| 输入项/预期结果 | 输入名称/预期结果 | F1 | F2 |- |- |- |"／"代表的输入	|备注|
|----------------|------------------|-----|-----|-|-|-|-|-|
| 输入项 | const std::string &sql | "INVALID SQL SYNTAX" | "SELECT FROM nonexistent WHERE ?" | \ | \ | \ | \ | \ |
| 预期结果 | 异常类型 | SQL语法错误 | 表不存在 | \ | \ | \ | \ | \ |
| | 错误信息 | "Syntax error in prepare" | "Table not found" | \ | \ | \ | \ | \ |
| 备注 | \ | 语法错误 | 表不存在 | \ | \ | \ | \ | \ |



## 执行预处理语句 DSS-JK-CUSTIN-1.7

执行预处理语句：DSS-JK-CUSTIN-1.7

| 用例名称/标识 | 执行预处理语句：DSS-JK-CUSTIN-1.7 |
|-------------|---------------------------|
| 用例说明 | 测试执行预处理语句接口，绑定参数并执行预处理语句 |

| 步骤  | 前提和约束                                            | 输入                                                                                | 目的和动作 | 预期结果 | 评估准则 | 备注                        |
|-----|--------------------------------------------------|-----------------------------------------------------------------------------------|------------|----------|----------|---------------------------|
| 步骤1 | PrepareHandle已创建                                   | PrepareHandle对象，参数向量                                                         | 验证句柄状态 | 句柄有效 | pre_指针非空 | \                         |
| 步骤2 | 绑定整数参数 | std::vector<ColumnValue>包含INTEGER值                                               | 调用Binder方法 | 执行成功，返回结果 | 参数绑定正确 | \                         |
| 步骤3 | 绑定字符串参数 | std::vector<ColumnValue>包含VARINT值                                                | 调用Binder方法 | 执行成功 | 参数类型匹配 | \                         |
| 步骤4 | 绑定混合参数 | 多种类型的ColumnValue                                                               | 调用Binder方法 | 执行成功 | 所有参数绑定 | \                         |
| 步骤5 | 测试异常情况 | 参数数量不匹配、类型不兼容                                                           | Binder方法抛出异常 | 异常被正确抛出 | 错误信息准确 | \                         |

### 步骤2 样本数据: DSS-JK-CUSTIN-1-7.doc
#### 成功样本：
| 输入项/预期结果 | 输入名称/预期结果 | S1 | S2 | S3 | S4 |- |"／"代表的输入	|备注|
|----------------|------------------|-----|-----|-----|-----|-|-|-|
| 输入项 | std::vector<ColumnValue> &values | {INTEGER(1)} | {VARINT("test")} | {INTEGER(1), VARINT("test")} | {FLOAT(1.5), TIMESTAMP(123456)} | \ | \ | \ |
| 预期结果 | ResultBase指针 | 有效结果 | 有效结果 | 有效结果 | 有效结果 | \ | \ | \ |
| | 执行结果 | 查询成功 | 查询成功 | 查询成功 | 查询成功 | \ | \ | \ |
| 备注 | \ | 单个整数参数 | 单个字符串参数 | 多个参数 | 多种类型参数 | \ | \ | \ |

#### 失败样本：
| 输入项/预期结果 | 输入名称/预期结果 | F1 | F2 | F3 |- |- |"／"代表的输入	|备注|
|----------------|------------------|-----|-----|-----|-|-|-|-|
| 输入项 | std::vector<ColumnValue> &values | 空向量(参数不足) | 类型不匹配 | 过多参数 | \ | \ | \ | \ |
| 预期结果 | 异常类型 | 参数数量错误 | 类型转换错误 | 参数数量错误 | \ | \ | \ | \ |
| | 错误信息 | "Parameter count mismatch" | "Type mismatch" | "Too many parameters" | \ | \ | \ | \ |
| 备注 | \ | 参数不足 | 类型错误 | 参数过多 | \ | \ | \ | \ |



## 事务开始 DSS-JK-CUSTIN-1.8

事务开始：DSS-JK-CUSTIN-1.8

| 用例名称/标识 | 事务开始：DSS-JK-CUSTIN-1.8 |
|-------------|---------------------------|
| 用例说明 | 测试事务开始接口，开始事务，支持多种事务类型 |

| 步骤  | 前提和约束                                            | 输入                                                                                | 目的和动作 | 预期结果 | 评估准则 | 备注                        |
|-----|--------------------------------------------------|-----------------------------------------------------------------------------------|------------|----------|----------|---------------------------|
| 步骤1 | 连接已建立，session有效                                 | Connection对象，TransactionType                                                    | 验证Connection状态 | 连接有效，session非空 | session_ != nullptr | \                         |
| 步骤2 | 开始READ_COMMITTED事务 | TransactionType::READ_COMMITTED                                                     | 调用BeginTransaction | 事务开始成功 | session事务状态改变 | \                         |
| 步骤3 | 开始READ_UNCOMMITTED事务 | TransactionType::READ_UNCOMMITTED                                                   | 调用BeginTransaction | 事务开始成功 | 事务隔离级别正确 | \                         |
| 步骤4 | 开始REPEATABLE_READ事务 | TransactionType::REPEATABLE_READ                                                    | 调用BeginTransaction | 事务开始成功 | 事务隔离级别正确 | \                         |
| 步骤5 | 测试异常情况 | 无效TransactionType                                                                 | BeginTransaction抛出异常 | 异常被正确抛出 | 错误信息准确 | \                         |

### 步骤2 样本数据: DSS-JK-CUSTIN-1-8.doc
#### 成功样本：
| 输入项/预期结果 | 输入名称/预期结果 | S1 | S2 | S3 | S4 |-|"／"代表的输入	|备注|
|----------------|------------------|-----|-----|-----|-----|-|-|-|
| 输入项 | TransactionType trans_type | READ_COMMITTED | READ_UNCOMMITTED | REPEATABLE_READ | SERIALIZABLE | \ | \ | \ |
| 预期结果 | 事务状态 | 事务开始 | 事务开始 | 事务开始 | 事务开始 | \ | \ | \ |
| | 隔离级别 | READ_COMMITTED | READ_UNCOMMITTED | REPEATABLE_READ | SERIALIZABLE | \ | \ | \ |
| 备注 | \ | 提交读 | 未提交读 | 可重复读 | 串行化 | \ | \ | \ |

#### 失败样本：
| 输入项/预期结果 | 输入名称/预期结果 | F1 |- |- |- |- |"／"代表的输入	|备注|
|----------------|------------------|-----|-|-|-|-|-|-|
| 输入项 | TransactionType trans_type | 无效值 | \ | \ | \ | \ | \ | \ |
| 预期结果 | 异常类型 | 无效事务类型 | \ | \ | \ | \ | \ | \ |
| | 错误信息 | "Invalid transaction type" | \ | \ | \ | \ | \ | \ |
| 备注 | \ | 无效事务类型 | \ | \ | \ | \ | \ | \ |



## 事务提交 DSS-JK-CUSTIN-1.9

事务提交：DSS-JK-CUSTIN-1.9

| 用例名称/标识 | 事务提交：DSS-JK-CUSTIN-1.9 |
|-------------|---------------------------|
| 用例说明 | 测试事务提交接口，提交当前事务 |

| 步骤  | 前提和约束                                            | 输入                                                                                | 目的和动作 | 预期结果 | 评估准则 | 备注                        |
|-----|--------------------------------------------------|-----------------------------------------------------------------------------------|------------|----------|----------|---------------------------|
| 步骤1 | 事务已开始，连接有效                                   | Connection对象                                                                     | 验证事务状态 | 事务处于活跃状态 | session有活跃事务 | \                         |
| 步骤2 | 提交事务 | 无输入参数                                                                          | 调用CommitTransaction | 事务提交成功 | 数据持久化 | \                         |
| 步骤3 | 验证提交结果 | 检查事务状态                                                                       | 确认事务已结束 | session事务状态清除 | 后续操作不在事务中 | \                         |
| 步骤4 | 测试异常情况 | 没有活跃事务                                                                       | CommitTransaction抛出异常 | 异常被正确抛出 | 错误信息准确 | \                         |

### 步骤2 样本数据: DSS-JK-CUSTIN-1-9.doc
#### 成功样本：
| 输入项/预期结果 | 输入名称/预期结果 | S1 |- |- |- |- |"／"代表的输入	|备注|
|----------------|------------------|-----|-|-|-|-|-|-|
| 输入项 | Connection对象 | 有活跃事务的连接 | \ | \ | \ | \ | \ | \ |
| 预期结果 | 事务状态 | 事务提交成功 | \ | \ | \ | \ | \ | \ |
| | 数据状态 | 数据持久化 | \ | \ | \ | \ | \ | \ |
| 备注 | \ | 正常提交 | \ | \ | \ | \ | \ | \ |

#### 失败样本：
| 输入项/预期结果 | 输入名称/预期结果 | F1 |- |- |- |- |"／"代表的输入	|备注|
|----------------|------------------|-----|-|-|-|-|-|-|
| 输入项 | Connection对象 | 无活跃事务的连接 | \ | \ | \ | \ | \ | \ |
| 预期结果 | 异常类型 | 无活跃事务 | \ | \ | \ | \ | \ | \ |
| | 错误信息 | "No active transaction" | \ | \ | \ | \ | \ | \ |
| 备注 | \ | 无事务可提交 | \ | \ | \ | \ | \ | \ |



## 事务回滚 DSS-JK-CUSTIN-1.10

事务回滚：DSS-JK-CUSTIN-1.10

| 用例名称/标识 | 事务回滚：DSS-JK-CUSTIN-1.10 |
|-------------|---------------------------|
| 用例说明 | 测试事务回滚接口，回滚当前事务 |

| 步骤  | 前提和约束                                            | 输入                                                                                | 目的和动作 | 预期结果 | 评估准则 | 备注                        |
|-----|--------------------------------------------------|-----------------------------------------------------------------------------------|------------|----------|----------|---------------------------|
| 步骤1 | 事务已开始，连接有效                                   | Connection对象                                                                     | 验证事务状态 | 事务处于活跃状态 | session有活跃事务 | \                         |
| 步骤2 | 回滚事务 | 无输入参数                                                                          | 调用RollbackTransaction | 事务回滚成功 | 数据变更撤销 | \                         |
| 步骤3 | 验证回滚结果 | 检查事务状态和数据                                                                  | 确认事务已结束，数据回滚 | session事务状态清除 | 数据恢复到事务开始前状态 | \                         |
| 步骤4 | 测试异常情况 | 没有活跃事务                                                                       | RollbackTransaction抛出异常 | 异常被正确抛出 | 错误信息准确 | \                         |

### 步骤2 样本数据: DSS-JK-CUSTIN-1-10.doc
#### 成功样本：
| 输入项/预期结果 | 输入名称/预期结果 | S1 |- |- |- |- |"／"代表的输入	|备注|
|----------------|------------------|-----|-|-|-|-|-|-|
| 输入项 | Connection对象 | 有活跃事务的连接 | \ | \ | \ | \ | \ | \ |
| 预期结果 | 事务状态 | 事务回滚成功 | \ | \ | \ | \ | \ | \ |
| | 数据状态 | 数据变更撤销 | \ | \ | \ | \ | \ | \ |
| 备注 | \ | 正常回滚 | \ | \ | \ | \ | \ | \ |

#### 失败样本：
| 输入项/预期结果 | 输入名称/预期结果 | F1 |- |- |- |- |"／"代表的输入	|备注|
|----------------|------------------|-----|-|-|-|-|-|-|
| 输入项 | Connection对象 | 无活跃事务的连接 | \ | \ | \ | \ | \ | \ |
| 预期结果 | 异常类型 | 无活跃事务 | \ | \ | \ | \ | \ | \ |
| | 错误信息 | "No active transaction" | \ | \ | \ | \ | \ | \ |
| 备注 | \ | 无事务可回滚 | \ | \ | \ | \ | \ | \ |



## 获取结果集元数据信息 DSS-JK-CUSTIN-1.11

获取结果集元数据信息：DSS-JK-CUSTIN-1.11

| 用例名称/标识 | 获取结果集元数据信息：DSS-JK-CUSTIN-1.11 |
|-------------|---------------------------|
| 用例说明 | 测试获取结果集元数据信息接口，获取列名和列数据类型 |

| 步骤  | 前提和约束                                            | 输入                                                                                | 目的和动作 | 预期结果 | 评估准则 | 备注                        |
|-----|--------------------------------------------------|-----------------------------------------------------------------------------------|------------|----------|----------|---------------------------|
| 步骤1 | ResultBase对象有效，schema存在                           | ResultBase对象，列索引                                                              | 验证结果集状态 | 结果集有效，schema非空 | schema_ != nullptr | \                         |
| 步骤2 | 获取列名 | int index (有效范围0到columnCount-1)                                                | 调用GetColName | 返回正确的列名字符串 | 列名匹配预期 | \                         |
| 步骤3 | 获取列类型 | int index (有效范围0到columnCount-1)                                                | 调用GetColType | 返回正确的LogicalTypeId | 类型ID匹配预期 | \                         |
| 步骤4 | 测试边界情况 | index = 0 和 index = columnCount-1                                                   | 获取首列和末列信息 | 正常返回 | 无异常 | \                         |
| 步骤5 | 测试异常情况 | 无效index (负数或超出范围)                                                           | GetColName/GetColType抛出异常 | 异常被正确抛出 | 错误信息准确 | \                         |

### 步骤2 样本数据: DSS-JK-CUSTIN-1-11.doc
#### 成功样本：
| 输入项/预期结果 | 输入名称/预期结果 | S1 | S2 | S3 | S4 |- |"／"代表的输入	|备注|
|----------------|------------------|-----|-----|-----|-----|-|-|-|
| 输入项 | int index | 0 | 1 | 0 | 1 | \ | \ | \ |
| | ResultBase对象 | 有2列的结果集 | 有2列的结果集 | 有3列的结果集 | 有3列的结果集 | \ | \ | \ |
| 预期结果 | GetColName返回值 | "id" | "name" | "id" | "name" | \ | \ | \ |
| | GetColType返回值 | INTEGER | VARINT | INTEGER | VARINT | \ | \ | \ |
| 备注 | \ | 第一列 | 第二列 | 第一列 | 第二列 | \ | \ | \ |

#### 失败样本：
| 输入项/预期结果 | 输入名称/预期结果 | F1 | F2 | F3 |- |- |"／"代表的输入	|备注|
|----------------|------------------|-----|-----|-----|-|-|-|-|
| 输入项 | int index | -1 | 10 | 2 | \ | \ | \ | \ |
| | ResultBase对象 | 有2列的结果集 | 有2列的结果集 | 有2列的结果集 | \ | \ | \ | \ |
| 预期结果 | 异常类型 | 索引越界 | 索引越界 | 索引越界 | \ | \ | \ | \ |
| | 错误信息 | "Index out of bounds" | "Index out of bounds" | "Index out of bounds" | \ | \ | \ | \ |
| 备注 | \ | 负索引 | 超出范围 | 等于列数 | \ | \ | \ | \ |



## 获取结果集行数 DSS-JK-CUSTIN-1.12

获取结果集行数：DSS-JK-CUSTIN-1.12

| 用例名称/标识 | 获取结果集行数：DSS-JK-CUSTIN-1.12 |
|-------------|---------------------------|
| 用例说明 | 测试获取结果集行数接口，返回结果集的总行数 |

| 步骤  | 前提和约束                                            | 输入                                                                                | 目的和动作 | 预期结果 | 评估准则 | 备注                        |
|-----|--------------------------------------------------|-----------------------------------------------------------------------------------|------------|----------|----------|---------------------------|
| 步骤1 | ResultBase对象有效                                   | ResultBase对象                                                                     | 验证结果集状态 | 结果集有效 | 对象非空 | \                         |
| 步骤2 | 获取行数 | 无输入参数                                                                          | 调用GetDataLength | 返回正确的行数 | 行数匹配实际数据 | \                         |
| 步骤3 | 测试空结果集 | 空结果集                                                                            | 调用GetDataLength | 返回0 | 空结果集行数为0 | \                         |
| 步骤4 | 测试有数据的集 | 包含多行的结果集                                                                   | 调用GetDataLength | 返回正确的行数 | 行数等于实际行数 | \                         |
| 步骤5 | 测试异常情况 | 结果集无效或未初始化                                                               | GetDataLength抛出异常 | 异常被正确抛出 | 错误信息准确 | \                         |

### 步骤2 样本数据: DSS-JK-CUSTIN-1-12.doc
#### 成功样本：
| 输入项/预期结果 | 输入名称/预期结果 | S1 | S2 | S3 |- |- |"／"代表的输入	|备注|
|----------------|------------------|-----|-----|-----|-|-|-|-|
| 输入项 | ResultBase对象 | 空结果集 | 1行结果集 | 5行结果集 | \ | \ | \ | \ |
| 预期结果 | GetDataLength返回值 | 0 | 1 | 5 | \ | \ | \ | \ | 
| 备注 | \ | 空结果 | 单行 | 多行 | \ | \ | \ | \ | 

#### 失败样本：
| 输入项/预期结果 | 输入名称/预期结果 | F1 |- |- |- |- |"／"代表的输入	|备注|
|----------------|------------------|-----|-|-|-|-|-|-|
| 输入项 | ResultBase对象 | nullptr | \ | \ | \ | \ | \ | \ |
| 预期结果 | 异常类型 | 空指针异常 | \ | \ | \ | \ | \ | \ |
| | 错误信息 | "Result is null" | \ | \ | \ | \ | \ | \ |
| 备注 | \ | 结果集为空 | \ | \ | \ | \ | \ | \ |

## 获取结果集列数 DSS-JK-CUSTIN-1.13

获取结果集列数：DSS-JK-CUSTIN-1.13

| 用例名称/标识 | 获取结果集列数：DSS-JK-CUSTIN-1.13 |
|-------------|---------------------------|
| 用例说明 | 测试获取结果集列数接口，返回结果集的列数 |

| 步骤  | 前提和约束                                            | 输入                                                                                | 目的和动作 | 预期结果 | 评估准则 | 备注                        |
|-----|--------------------------------------------------|-----------------------------------------------------------------------------------|------------|----------|----------|---------------------------|
| 步骤1 | ResultBase对象有效                                   | ResultBase对象                                                                     | 验证结果集状态 | 结果集有效 | 对象非空 | \                         |
| 步骤2 | 获取列数 | 无输入参数                                                                          | 调用GetColumnCount | 返回正确的列数 | 列数匹配schema | \                         |
| 步骤3 | 测试单列结果集 | 只有一列的结果集                                                                   | 调用GetColumnCount | 返回1 | 列数正确 | \                         |
| 步骤4 | 测试多列结果集 | 包含多列的结果集                                                                   | 调用GetColumnCount | 返回正确的列数 | 列数等于实际列数 | \                         |
| 步骤5 | 测试异常情况 | 结果集无效或schema为空                                                             | GetColumnCount抛出异常 | 异常被正确抛出 | 错误信息准确 | \                         |

### 步骤2 样本数据: DSS-JK-CUSTIN-1-13.doc
#### 成功样本：
| 输入项/预期结果 | 输入名称/预期结果 | S1 | S2 | S3 |- |- |"／"代表的输入	|备注|
|----------------|------------------|-----|-----|-----|-|-|-|-|
| 输入项 | ResultBase对象 | 1列结果集 | 2列结果集 | 5列结果集 | \ | \ | \ | \ |
| 预期结果 | GetColumnCount返回值 | 1 | 2 | 5 | \ | \ | \ | \ |
| 备注 | \ | 单列 | 双列 | 多列 | \ | \ | \ | \ |

#### 失败样本：
| 输入项/预期结果 | 输入名称/预期结果 | F1 |- |- |- |- |"／"代表的输入	|备注|
|----------------|------------------|-----|-|-|-|-|-|-|
| 输入项 | ResultBase对象 | nullptr | \ | \ | \ | \ | \ | \ |
| 预期结果 | 异常类型 | 空指针异常 | \ | \ | \ | \ | \ | \ |
| | 错误信息 | "Result is null" | \ | \ | \ | \ | \ | \ |
| 备注 | \ | 结果集为空 | \ | \ | \ | \ | \ | \ |

## 获取当前行数据 DSS-JK-CUSTIN-1.14

获取当前行数据：DSS-JK-CUSTIN-1.14

| 用例名称/标识 | 获取当前行数据：DSS-JK-CUSTIN-1.14 |
|-------------|---------------------------|
| 用例说明 | 测试获取当前行数据接口，获取当前行的列值，包括各种数据类型 |

| 步骤  | 前提和约束                                            | 输入                                                                                | 目的和动作 | 预期结果 | 评估准则 | 备注                        |
|-----|--------------------------------------------------|-----------------------------------------------------------------------------------|------------|----------|----------|---------------------------|
| 步骤1 | ResultBase对象有效，已定位到行                        | ResultBase对象，列索引                                                              | 验证结果集状态 | 结果集有效，已有当前行 | tuple_有效 | \                         |
| 步骤2 | 获取布尔值 | int index (BOOLEAN列)                                                                | 调用GetBoolValue | 返回正确的bool值 | 值匹配预期 | \                         |
| 步骤3 | 获取整数值 | int index (INTEGER列)                                                                | 调用GetIntValue | 返回正确的int32_t值 | 值匹配预期 | \                         |
| 步骤4 | 获取字符串值 | int index (VARINT列)                                                                 | 调用GetStringValue | 返回正确的string值 | 值匹配预期 | \                         |
| 步骤5 | 获取其他类型值 | int index (FLOAT/TIMESTAMP等列)                                                      | 调用相应Get方法 | 返回正确的值 | 值匹配预期 | \                         |
| 步骤6 | 测试异常情况 | 无效index或类型不匹配                                                               | GetXXXValue抛出异常 | 异常被正确抛出 | 错误信息准确 | \                         |

### 步骤2 样本数据: DSS-JK-CUSTIN-1-14.doc
#### 成功样本：
| 输入项/预期结果 | 输入名称/预期结果 | S1 | S2 | S3 | S4 | S5 |"／"代表的输入	|备注|
|----------------|------------------|-----|-----|-----|-----|-----|-|-|
| 输入项 | int index | 0 | 1 | 2 | 1 | 3 | \ | \ |
| | ResultBase对象 | 包含多种类型数据的行 | 包含多种类型数据的行 | 包含多种类型数据的行 | 包含多种类型数据的行 | 包含多种类型数据的行 | \ | \ |
| 预期结果 | GetBoolValue返回值 | true | - | - | - | - | \ | \ |
| | GetIntValue返回值 | - | 123 | - | - | - | \ | \ |
| | GetStringValue返回值 | - | - | "test" | - | - | \ | \ |
| | GetFloatValue返回值 | - | - | - | 3.14 | - | \ | \ |
| | GetTimestampValue返回值 | - | - | - | - | 1234567890 | \ | \ |
| 备注 | \ | 布尔值 | 整数值 | 字符串值 | 浮点值 | 时间戳值 | \ | \ |

#### 失败样本：
| 输入项/预期结果 | 输入名称/预期结果 | F1 | F2 | F3 |-|- |"／"代表的输入	|备注|
|----------------|------------------|-----|-----|-----|-|-|-|-|
| 输入项 | int index | -1 | 10 | 0 | \ | \ | \ |\ |
| | ResultBase对象 | 有效结果集 | 有效结果集 | 有效结果集 | \ | \ | \ |\ |
| 预期结果 | 异常类型 | 索引越界 | 索引越界 | 类型不匹配 | \ | \ | \ |\ |
| | 错误信息 | "Index out of bounds" | "Index out of bounds" | "Type mismatch" | \ | \ | \ |\ |
| 备注 | \ | 负索引 | 超出范围 | 获取布尔值但列是字符串 | \ | \ | \ |\ |


## 检查列是否为NULL DSS-JK-CUSTIN-1.15

检查列是否为NULL：DSS-JK-CUSTIN-1.15

| 用例名称/标识 | 检查列是否为NULL：DSS-JK-CUSTIN-1.15 |
|-------------|---------------------------|
| 用例说明 | 测试检查列是否为NULL接口，检查指定列是否为NULL值 |

| 步骤  | 前提和约束                                            | 输入                                                                                | 目的和动作 | 预期结果 | 评估准则 | 备注                        |
|-----|--------------------------------------------------|-----------------------------------------------------------------------------------|------------|----------|----------|---------------------------|
| 步骤1 | ResultBase对象有效，已定位到行                        | ResultBase对象，列索引                                                              | 验证结果集状态 | 结果集有效，已有当前行 | tuple_有效 | \                         |
| 步骤2 | 检查NULL值 | int index (有效范围)                                                                 | 调用IsNull | 返回true/false | NULL检查正确 | \                         |
| 步骤3 | 检查非NULL值 | int index (有值的列)                                                                | 调用IsNull | 返回false | 非NULL检查正确 | \                         |
| 步骤4 | 测试边界情况 | index = 0 和 columnCount-1                                                          | 检查首列和末列 | 正常返回 | 无异常 | \                         |
| 步骤5 | 测试异常情况 | 无效index                                                                          | IsNull抛出异常 | 异常被正确抛出 | 错误信息准确 | \                         |

### 步骤2 样本数据: DSS-JK-CUSTIN-1-15.doc
#### 成功样本：
| 输入项/预期结果 | 输入名称/预期结果 | S1 | S2 | S3 |-|-|"／"代表的输入	|备注|
|----------------|------------------|-----|-----|-----|-|-|-|-|
| 输入项 | int index | 0 | 1 | 2 | \ | \ | \ | \ |
| | ResultBase对象 | 包含NULL和非NULL值的行 | 包含NULL和非NULL值的行 | 包含NULL和非NULL值的行 | \ | \ | \ | \ |
| 预期结果 | IsNull返回值 | true | false | true | \ | \ | \ | \ |
| 备注 | \ | NULL值 | 非NULL值 | NULL值 | \ | \ | \ | \ |

#### 失败样本：
| 输入项/预期结果 | 输入名称/预期结果 | F1 | F2 |-|-|-|"／"代表的输入	|备注|
|----------------|------------------|-----|-----|-|-|-|-|-|
| 输入项 | int index | -1 | 10 | \ | \ | \ | \ |\ |
| | ResultBase对象 | 有效结果集 | 有效结果集 | \ | \ | \ | \ |\ |
| 预期结果 | 异常类型 | 索引越界 | 索引越界 | \ | \ | \ | \ |\ |
| | 错误信息 | "Index out of bounds" | "Index out of bounds" | \ | \ | \ | \ |\ |
| 备注 | \ | 负索引 | 超出范围 | \ | \ | \ | \ |\ |


## 移动到下一行 DSS-JK-CUSTIN-1.16

移动到下一行：DSS-JK-CUSTIN-1.16

| 用例名称/标识 | 移动到下一行：DSS-JK-CUSTIN-1.16 |
|-------------|---------------------------|
| 用例说明 | 测试移动到下一行接口，向前移动到下一行 |

| 步骤  | 前提和约束                                            | 输入                                                                                | 目的和动作 | 预期结果 | 评估准则 | 备注                        |
|-----|--------------------------------------------------|-----------------------------------------------------------------------------------|------------|----------|----------|---------------------------|
| 步骤1 | ResultBase对象有效，有多行数据                        | ResultBase对象                                                                     | 验证结果集状态 | 结果集有效，有数据 | GetDataLength() > 0 | \                         |
| 步骤2 | 移动到下一行 | 无输入参数                                                                         | 调用Next() | 返回true，移动成功 | 位置前进 | \                         |
| 步骤3 | 移动到最后一行 | 连续调用Next()                                                                     | 调用Next() | 返回true，最后一行 | 位置正确 | \                         |
| 步骤4 | 超出最后一行 | 再次调用Next()                                                                     | 调用Next() | 返回false | 遍历结束 | \                         |
| 步骤5 | 测试异常情况 | 结果集无效                                                                         | Next()抛出异常 | 异常被正确抛出 | 错误信息准确 | \                         |

### 步骤2 样本数据: DSS-JK-CUSTIN-1-16.doc
#### 成功样本：
| 输入项/预期结果 | 输入名称/预期结果 | S1 | S2 | S3 | S4 |-|"／"代表的输入	|备注|
|----------------|------------------|-----|-----|-----|-----|-|-|-|
| 输入项 | ResultBase对象 | 3行结果集 | 3行结果集 | 3行结果集 | 3行结果集 | \ | \ | \ | \ |
| 预期结果 | Next()返回值 | true | true | true | false | \ | \ | \ | \ |
| | 当前行位置 | 第2行 | 第3行 | 第3行 | 超出范围 | \ | \ | \ | \ |
| 备注 | \ | 第一行到第二行 | 第二行到第三行 | 第三行到第三行 | 第三行到超出 | \ | \ | \ | \ |

#### 失败样本：
| 输入项/预期结果 | 输入名称/预期结果 | F1 |-|-|-|-|"／"代表的输入	|备注|
|----------------|------------------|-----|-|-|-|-|-|-|
| 输入项 | ResultBase对象 | nullptr | \ | \ | \ | \ | \ | \ |
| 预期结果 | 异常类型 | 空指针异常 | \ | \ | \ | \ | \ | \ |
| | 错误信息 | "Result is null" | \ | \ | \ | \ | \ | \ |
| 备注 | \ | 结果集为空 | \ | \ | \ | \ | \ | \ |




## 创建布尔值参数 DSS-JK-CUSTIN-1.17

创建布尔值参数：DSS-JK-CUSTIN-1.17

| 用例名称/标识 | 创建布尔值参数：DSS-JK-CUSTIN-1.17 |
|-------------|---------------------------|
| 用例说明 | 测试创建布尔值参数接口，创建布尔类型的参数值 |

| 步骤  | 前提和约束                                            | 输入                                                                                | 目的和动作 | 预期结果 | 评估准则 | 备注                        |
|-----|--------------------------------------------------|-----------------------------------------------------------------------------------|------------|----------|----------|---------------------------|
| 步骤1 | TZDB库已正确初始化                                  | bool value                                                                          | 验证输入参数 | 参数有效 | value为true/false | \                         |
| 步骤2 | 创建true布尔值 | bool value = true                                                                   | 调用ColumnValue::BOOLEAN(true) | 返回ColumnValue对象 | 对象有效，包含true值 | \                         |
| 步骤3 | 创建false布尔值 | bool value = false                                                                  | 调用ColumnValue::BOOLEAN(false) | 返回ColumnValue对象 | 对象有效，包含false值 | \                         |
| 步骤4 | 测试边界情况 | 正常布尔值                                                                          | 创建参数 | 正常返回 | 无异常 | \                         |
| 步骤5 | 测试异常情况 | 无(布尔值无异常情况)                                                              | - | - | - | \                         |

### 步骤2 样本数据: DSS-JK-CUSTIN-1-17.doc
#### 成功样本：
| 输入项/预期结果 | 输入名称/预期结果 | S1 | S2 |-|-|-|"／"代表的输入	|备注|
|----------------|------------------|-----|-----|-|-|-|-|-|
| 输入项 | bool value | true | false | \ | \ | \ | \ | \ |
| 预期结果 | ColumnValue对象 | 有效对象，值为true | 有效对象，值为false | \ | \ | \ | \ | \ |
| 备注 | \ | true值 | false值 | \ | \ | \ | \ | \ |

#### 失败样本：
无失败样本


## 创建整数参数 DSS-JK-CUSTIN-1.18

创建整数参数：DSS-JK-CUSTIN-1.18

| 用例名称/标识 | 创建整数参数：DSS-JK-CUSTIN-1.18 |
|-------------|---------------------------|
| 用例说明 | 测试创建整数参数接口，创建各种整数类型的参数值 |

| 步骤  | 前提和约束                                            | 输入                                                                                | 目的和动作 | 预期结果 | 评估准则 | 备注                        |
|-----|--------------------------------------------------|-----------------------------------------------------------------------------------|------------|----------|----------|---------------------------|
| 步骤1 | TZDB库已正确初始化                                  | 整数值                                                                             | 验证输入参数 | 参数有效 | 值在类型范围内 | \                         |
| 步骤2 | 创建INTEGER值 | int32_t value                                                                      | 调用ColumnValue::INTEGER(value) | 返回ColumnValue对象 | 对象有效，包含指定值 | \                         |
| 步骤3 | 创建BIGINT值 | int64_t value                                                                      | 调用ColumnValue::BIGINT(value) | 返回ColumnValue对象 | 对象有效，包含指定值 | \                         |
| 步骤4 | 创建其他整数类型 | uint8_t/uint16_t/uint32_t/uint64_t值                                               | 调用相应方法 | 返回ColumnValue对象 | 对象有效，包含指定值 | \                         |
| 步骤5 | 测试边界情况 | 最大值、最小值                                                                     | 创建参数 | 正常返回 | 无异常 | \                         |
| 步骤6 | 测试异常情况 | 值超出类型范围                                                                     | 创建参数抛出异常 | 异常被正确抛出 | 错误信息准确 | \                         |

### 步骤2 样本数据: DSS-JK-CUSTIN-1-18.doc
#### 成功样本：
| 输入项/预期结果 | 输入名称/预期结果 | S1 | S2 | S3 | S4 | S5 |"／"代表的输入	|备注|
|----------------|------------------|-----|-----|-----|-----|-----|-|-|
| 输入项 | int32_t value | 123 | -456 | 0 | 2147483647 | -2147483648 | \ | \ | \ | \ |
| | int64_t value | 123456789 | -987654321 | 0 | 9223372036854775807 | -9223372036854775808 | \ | \ | \ | \ |
| 预期结果 | ColumnValue对象 | 有效INTEGER对象 | 有效INTEGER对象 | 有效INTEGER对象 | 有效INTEGER对象 | 有效INTEGER对象 | \ | \ | \ | \ |
| | | 有效BIGINT对象 | 有效BIGINT对象 | 有效BIGINT对象 | 有效BIGINT对象 | 有效BIGINT对象 | \ | \ | \ | \ |
| 备注 | \ | INTEGER正数 | INTEGER负数 | INTEGER零 | INTEGER最大值 | INTEGER最小值 | \ | \ | \ | \ |
| | | BIGINT正数 | BIGINT负数 | BIGINT零 | BIGINT最大值 | BIGINT最小值 | \ | \ | \ | \ |

#### 失败样本：
| 输入项/预期结果 | 输入名称/预期结果 | F1 |-|-|-|-|"／"代表的输入	|备注|
|----------------|------------------|-----|-|-|-|-|-|-|
| 输入项 | int32_t value | 超出int32_t范围 | \ | \ | \ | \ | \ | \ |
| 预期结果 | 异常类型 | 值超出范围 | \ | \ | \ | \ | \ | \ |
| | 错误信息 | "Value out of range" | \ | \ | \ | \ | \ | \ |
| 备注 | \ | int32_t溢出 | \ | \ | \ | \ | \ | \ |


## 创建浮点数参数 DSS-JK-CUSTIN-1.19

创建浮点数参数：DSS-JK-CUSTIN-1.19

| 用例名称/标识 | 创建浮点数参数：DSS-JK-CUSTIN-1.19 |
|-------------|---------------------------|
| 用例说明 | 测试创建浮点数参数接口，创建浮点数类型的参数值 |

| 步骤  | 前提和约束                                            | 输入                                                                                | 目的和动作 | 预期结果 | 评估准则 | 备注                        |
|-----|--------------------------------------------------|-----------------------------------------------------------------------------------|------------|----------|----------|---------------------------|
| 步骤1 | TZDB库已正确初始化                                  | 浮点数值                                                                           | 验证输入参数 | 参数有效 | 值不为NaN/Infinity | \                         |
| 步骤2 | 创建FLOAT值 | float value                                                                        | 调用ColumnValue::FLOAT(value) | 返回ColumnValue对象 | 对象有效，包含指定值 | \                         |
| 步骤3 | 创建DOUBLE值 | double value                                                                       | 调用ColumnValue::DOUBLE(value) | 返回ColumnValue对象 | 对象有效，包含指定值 | \                         |
| 步骤4 | 测试边界情况 | 最大值、最小值、零值                                                               | 创建参数 | 正常返回 | 无异常 | \                         |
| 步骤5 | 测试异常情况 | NaN或Infinity值                                                                   | 创建参数抛出异常 | 异常被正确抛出 | 错误信息准确 | \                         |

### 步骤2 样本数据: DSS-JK-CUSTIN-1-19.doc
#### 成功样本：
| 输入项/预期结果 | 输入名称/预期结果 | S1 | S2 | S3 | S4 | S5 |"／"代表的输入	|备注|
|----------------|------------------|-----|-----|-----|-----|-----|-|-|
| 输入项 | float value | 3.14f | -2.71f | 0.0f | 3.4028235e+38f | 1.17549435e-38f | \ | \ | \ | \ |
| | double value | 3.141592653589793 | -2.718281828459045 | 0.0 | 1.7976931348623157e+308 | 2.2250738585072014e-308 | \ | \ | \ | \ |
| 预期结果 | ColumnValue对象 | 有效FLOAT对象 | 有效FLOAT对象 | 有效FLOAT对象 | 有效FLOAT对象 | 有效FLOAT对象 | \ | \ | \ | \ |
| | | 有效DOUBLE对象 | 有效DOUBLE对象 | 有效DOUBLE对象 | 有效DOUBLE对象 | 有效DOUBLE对象 | \ | \ | \ | \ |
| 备注 | \ | FLOAT正数 | FLOAT负数 | FLOAT零 | FLOAT最大值 | FLOAT最小值 | \ | \ | \ | \ |
| | | DOUBLE正数 | DOUBLE负数 | DOUBLE零 | DOUBLE最大值 | DOUBLE最小值 | \ | \ | \ | \ |

#### 失败样本：
| 输入项/预期结果 | 输入名称/预期结果 | F1 | F2 |-|-|-|"／"代表的输入	| 备注 |
|----------------|------------------|-----|-----|-|-|-|-|----|
| 输入项 | float value | NaN | Infinity | \ | \ | \ | \ | \  |
| 预期结果 | 异常类型 | 无效浮点值 | 无效浮点值 | \ | \ | \ | \ | \  |
| | 错误信息 | "Invalid float value" | "Invalid float value" | \ | \ | \ | \ | \  |
| 备注 | \ | NaN值 | Infinity值 | \ | \ | \ | \ | \  |


## 创建字符串参数 DSS-JK-CUSTIN-1.20

创建字符串参数：DSS-JK-CUSTIN-1.20

| 用例名称/标识 | 创建字符串参数：DSS-JK-CUSTIN-1.20 |
|-------------|---------------------------|
| 用例说明 | 测试创建字符串参数接口，创建字符串类型的参数值 |

| 步骤  | 前提和约束                                            | 输入                                                                                | 目的和动作 | 预期结果 | 评估准则 | 备注                        |
|-----|--------------------------------------------------|-----------------------------------------------------------------------------------|------------|----------|----------|---------------------------|
| 步骤1 | TZDB库已正确初始化                                  | 字符串数据                                                                         | 验证输入参数 | 参数有效 | 字符串非空 | \                         |
| 步骤2 | 创建VARINT值 | const string &data                                                                  | 调用ColumnValue::VARINT(data) | 返回ColumnValue对象 | 对象有效，包含指定字符串 | \                         |
| 步骤3 | 创建BLOB值 | const string &data                                                                  | 调用ColumnValue::BLOB(data) | 返回ColumnValue对象 | 对象有效，包含指定数据 | \                         |
| 步骤4 | 测试边界情况 | 空字符串、长字符串                                                                 | 创建参数 | 正常返回 | 无异常 | \                         |
| 步骤5 | 测试异常情况 | 字符串包含无效字符                                                                 | 创建参数抛出异常 | 异常被正确抛出 | 错误信息准确 | \                         |

### 步骤2 样本数据: DSS-JK-CUSTIN-1-20.doc
#### 成功样本：
| 输入项/预期结果 | 输入名称/预期结果 | S1 | S2 | S3 | S4 |-|"／"代表的输入	|备注|
|----------------|------------------|-----|-----|-----|-----|-|-|-|
| 输入项 | const string &data | "hello" | "世界" | "" | "long string..." | \ | \ | \ | \ |
| 预期结果 | ColumnValue对象 | 有效VARINT对象 | 有效VARINT对象 | 有效VARINT对象 | 有效VARINT对象 | \ | \ | \ | \ |
| | | 有效BLOB对象 | 有效BLOB对象 | 有效BLOB对象 | 有效BLOB对象 | \ | \ | \ | \ |
| 备注 | \ | ASCII字符串 | Unicode字符串 | 空字符串 | 长字符串 | \ | \ | \ | \ |

#### 失败样本：
| 输入项/预期结果 | 输入名称/预期结果 | F1 |-|-|-|-|"／"代表的输入	|备注|
|----------------|------------------|-----|-|-|-|-|-|-|
| 输入项 | const string &data | nullptr | \ | \ | \ | \ | \ | \ |
| 预期结果 | 异常类型 | 空指针异常 | \ | \ | \ | \ | \ | \ |
| | 错误信息 | "String is null" | \ | \ | \ | \ | \ | \ |
| 备注 | \ | 字符串指针为空 | \ | \ | \ | \ | \ | \ |


## 创建时间戳参数 DSS-JK-CUSTIN-1.21

创建时间戳参数：DSS-JK-CUSTIN-1.21

| 用例名称/标识 | 创建时间戳参数：DSS-JK-CUSTIN-1.21 |
|-------------|---------------------------|
| 用例说明 | 测试创建时间戳参数接口，创建时间戳类型的参数值 |

| 步骤  | 前提和约束                                            | 输入                                                                                | 目的和动作 | 预期结果 | 评估准则 | 备注                        |
|-----|--------------------------------------------------|-----------------------------------------------------------------------------------|------------|----------|----------|---------------------------|
| 步骤1 | TZDB库已正确初始化                                  | 时间戳值                                                                           | 验证输入参数 | 参数有效 | 值大于0 | \                         |
| 步骤2 | 创建TIMESTAMP值 | uint64_t value                                                                     | 调用ColumnValue::TIMESTAMP(value) | 返回ColumnValue对象 | 对象有效，包含指定时间戳 | \                         |
| 步骤3 | 测试边界情况 | 最小值(0)、当前时间戳                                                            | 创建参数 | 正常返回 | 无异常 | \                         |
| 步骤4 | 测试异常情况 | 无效时间戳值                                                                      | 创建参数抛出异常 | 异常被正确抛出 | 错误信息准确 | \                         |

### 步骤2 样本数据: DSS-JK-CUSTIN-1-21.doc
#### 成功样本：
| 输入项/预期结果 | 输入名称/预期结果 | S1 | S2 | S3 |-|-|"／"代表的输入	|备注|
|----------------|------------------|-----|-----|-----|-|-|-|-|
| 输入项 | uint64_t value | 0 | 1234567890 | 1735689600 | \ | \ | \ | \ |
| 预期结果 | ColumnValue对象 | 有效TIMESTAMP对象 | 有效TIMESTAMP对象 | 有效TIMESTAMP对象 | \ | \ | \ | \ |
| 备注 | \ | 最小时间戳 | Unix时间戳 | 当前时间戳 | \ | \ | \ | \ |

#### 失败样本：
| 输入项/预期结果 | 输入名称/预期结果 | F1 |-|-|-|-|"／"代表的输入	|备注|
|----------------|------------------|-----|-|-|-|-|-|-|
| 输入项 | uint64_t value | 无效值 | \ | \ | \ | \ | \ | \ |
| 预期结果 | 异常类型 | 无效时间戳 | \ | \ | \ | \ | \ | \ |
| | 错误信息 | "Invalid timestamp" | \ | \ | \ | \ | \ | \ |
| 备注 | \ | 时间戳无效 | \ | \ | \ | \ | \ | \ |