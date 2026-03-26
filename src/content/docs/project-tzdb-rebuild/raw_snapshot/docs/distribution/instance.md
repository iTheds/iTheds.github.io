---
title: "instance"
description: "instance"
---

## 2.2.6 会话管理

会话管理是TZDB数据库系统的核心架构组件，它构建了用户与数据库系统之间的交互桥梁。通过会话管理，系统能够维护多用户并发访问环境下的数据一致性和事务隔离性，同时为上层应用提供统一、简洁的接口。会话管理系统采用分层设计，包括数据库实例管理、会话管理器、SQL上下文管理和接口上下文管理四个主要模块，这种设计既保证了系统的高内聚低耦合，又提供了良好的扩展性和可维护性。

### 2.2.6.1 数据库实例管理

数据库实例管理模块是整个会话管理系统的基础，负责维护系统中所有数据库实例的生命周期，并为上层会话提供数据库访问服务。该模块采用单例模式设计，确保在整个系统中只存在一个数据库实例管理器，避免资源冲突和状态不一致问题。

#### 设计意义与内容

数据库实例管理的核心在于提供一个中心化的机制来管理所有数据库实例，这对于支持多数据库、多用户并发访问至关重要。在分布式环境中，它还需要协调本地和远程数据库操作，确保数据一致性和可用性。通过统一的实例管理，系统能够实现资源的高效分配和回收，避免资源泄漏和性能瓶颈。

数据库实例管理器维护了一个从数据库名称到数据库实例的映射表，支持快速查找和访问特定数据库。为了保证线程安全，它使用互斥锁保护关键数据结构的访问。此外，它还集成了数据服务器组件，支持分布式数据库操作，为集群环境提供基础设施支持。

在实现上，数据库实例管理器负责数据库的创建、打开、关闭和删除等操作，同时提供数据库查询和会话创建服务。它通过封装底层存储引擎和事务管理器，为上层会话提供统一的数据库操作接口，简化了应用开发和系统维护。

#### 关键结构

`DBInstance`类是数据库实例管理的核心，它采用单例模式设计，通过`GetInstance()`方法提供全局访问点。在实际操作中，应用程序首先获取数据库实例管理器的引用，然后通过它来创建或获取数据库实例和会话。

```cpp
class DBInstance {
 public:
  static DBInstance &GetInstance();
  EDB_RET AppendDb(std::unique_ptr<tzdb::DB> db);
  Session *GetSession(int session_id);
  Session *CreateSession(const std::string &db_name);
  Session *CreateRemoteSession(const std::string &db_name);
  EDB_RET DisconnectSession(int session_id);
  tzdb::DB *GetDatabaseByName(const std::string &db_name);
  void RunServer(const ServerConfig& config);
  DataServer* GetDataServer() const;

 private:
  DBInstance() = default;
  static DBInstance instance_;
  tzdb::TZMutex db_mutex_;
  std::unordered_map<std::string, std::unique_ptr<tzdb::DB>> dbs_map_;
  std::unordered_map<int, std::shared_ptr<Session>> sessions_map_;
  std::atomic<int> session_id_{0};
  std::unique_ptr<DataServer> data_server_;
};
```

在使用时，开发者通常会执行以下操作:首先通过`GetInstance()`获取单例实例，然后使用`AppendDb()`添加数据库实例，接着通过`CreateSession()`创建会话，最后使用会话执行数据库操作。对于分布式环境，可以使用`RunServer()`启动数据服务器，并通过`CreateRemoteSession()`创建远程会话。当会话不再需要时，可以通过`DisconnectSession()`断开连接，释放资源。

### 2.2.6.2 会话管理器

会话管理器是数据库实例管理的重要组成部分，负责创建、维护和销毁用户会话。每个会话代表一个用户与数据库的连接，封装了事务管理、SQL执行和MCO操作的上下文，为用户提供一致的数据库操作体验。

#### 设计意义与内容

会话管理是实现多用户并发访问数据库的关键机制。在数据库系统中，会话充当了用户与数据库之间的中介，它维护用户的连接状态、事务上下文和查询环境，确保用户操作的原子性、一致性、隔离性和持久性(ACID特性)。会话管理器通过分配唯一的会话ID，跟踪和管理系统中的所有活跃会话，支持会话的创建、查找和销毁操作。

TZDB系统设计了两种类型的会话:本地会话(Session)和远程会话(RemoteSession)。本地会话直接与本地数据库实例交互，适用于单机环境；远程会话则通过网络协议与远程数据库实例交互，支持分布式环境下的数据库操作。这种设计使系统能够无缝地支持从单机到分布式的扩展，提高了系统的可扩展性和灵活性。

会话管理器维护了会话ID到会话实例的映射表，支持快速查找和访问特定会话。每个会话都关联了一个数据库实例、一个事务上下文、一个SQL执行上下文和一个MCO操作上下文，这些上下文共同构成了用户操作的执行环境。会话管理器负责协调这些上下文的创建和销毁，确保资源的正确分配和回收。

在实现上，会话管理器采用了面向对象的设计，通过继承和多态实现了不同类型会话的统一管理。本地会话和远程会话共享相同的接口，但内部实现不同，这使得应用程序可以透明地使用不同类型的会话，而不需要关心底层的实现细节。

#### 关键结构

`Session`类是会话管理的基础，它提供了事务管理和SQL执行的核心功能。在实际应用中，开发者通过会话对象执行SQL语句、管理事务和获取查询结果。`RemoteSession`类继承自`Session`，专门用于处理分布式环境下的远程数据库操作。

```cpp
class Session {
 public:
  Session(int id, tzdb::DB *db);
  virtual ~Session() = default;
  virtual void BeginTransaction();
  virtual void CommitTransaction() const;
  virtual auto Execute(const std::string &sql) -> void;
  auto Prepare(const std::string &sql) -> void;
  auto Binder(std::vector<tzdb::Value> &&params) -> void;
  virtual bool HasResult() const;
  virtual std::unique_ptr<ResultBase> GetResult(Connection&) const;
  
  // Getter methods
  int GetSessionId() const;
  tzdb::DB *GetDb() const;
  tzdb::Transaction *GetTrans() const;
  void SetTrans(tzdb::Transaction *trans);
  const tzdb::Catalog *GetCatalog() const;
  tzdb::TransactionParams &GetTransParamsRef();
  McoContext &GetMcoContextRef();
  query::SqlContext &GetSqlContextRef();

 private:
  int id_;
  tzdb::DB *db_;
  tzdb::Catalog *catalog_;
  tzdb::TransactionParams trans_params_;
  tzdb::Transaction *trans_;
  query::SqlContext query_context_;
  McoContext mco_context_;
};

class RemoteSession : public Session {
 public:
  RemoteSession(int id, tzdb::DB *db);
  void BeginTransaction() override;
  void CommitTransaction() const override;
  auto Execute(const std::string &sql) -> void override;
  bool HasResult() const override;
  std::unique_ptr<ResultBase> GetResult(Connection&) const override;
  ~RemoteSession() override = default;
 private:
  std::unique_ptr<RemoteResult> result_;
};
```

使用会话进行数据库操作通常遵循以下模式:首先通过`DBInstance::CreateSession()`获取会话对象，然后调用`BeginTransaction()`开始事务，接着使用`Execute()`执行SQL语句，最后调用`CommitTransaction()`提交事务。如果需要获取查询结果，可以使用`HasResult()`检查是否有结果，然后通过`GetResult()`获取结果集。对于需要参数绑定的预编译SQL语句，可以先调用`Prepare()`准备语句，然后使用`Binder()`绑定参数，最后执行语句。这种模式既简化了应用程序的开发，又提高了SQL执行的效率和安全性。

### 2.2.6.3 SQL上下文管理

SQL上下文管理通过`query::SqlContext`类实现，负责SQL语句的解析、绑定、优化和执行，是会话与查询执行引擎之间的桥梁，为SQL操作提供了统一的执行环境。

#### 设计意义与内容

SQL上下文管理是实现SQL语言处理的核心组件，它将用户提交的SQL语句转换为可执行的查询计划，并协调查询执行过程。在数据库系统中，SQL上下文充当了SQL语句与底层存储引擎之间的中介，它封装了SQL处理的复杂性，为用户提供简单、一致的接口。

SQL上下文管理的主要功能包括SQL语句的解析、语义分析、查询优化和执行。它首先将SQL文本解析为语法树，然后进行语义分析和类型检查，确保SQL语句的正确性。接着，它通过查询优化器生成高效的执行计划，最后协调执行引擎执行查询计划并收集结果。

TZDB系统的SQL上下文管理支持多种SQL操作，包括查询(SELECT)、插入(INSERT)、更新(UPDATE)、删除(DELETE)、创建表(CREATE TABLE)和创建索引(CREATE INDEX)等。它还支持预编译SQL语句和参数绑定，提高了SQL执行的效率和安全性。

SQL上下文管理与事务管理紧密集成，确保SQL操作在事务上下文中执行，支持事务的ACID特性。它还提供了多种结果输出格式，包括文本、HTML和批处理模式，满足不同场景下的需求。

在实现上，SQL上下文管理采用了模块化设计，将SQL处理分为多个阶段，每个阶段由专门的组件负责。这种设计使系统能够灵活地支持不同类型的SQL操作和优化策略，提高了系统的可扩展性和可维护性。

#### 关键结构

`SqlContext`类是SQL上下文管理的核心，它提供了SQL语句执行和结果处理的完整功能。`ResultWriter`类则负责格式化和输出查询结果，支持多种输出格式。在实际应用中，这些类通常由会话对象内部使用，开发者很少直接操作它们。

```cpp
namespace query {
class SqlContext {
 public:
  explicit SqlContext(tzdb::TransactionManager *txn_manager, tzdb::Transaction *txn, tzdb::Catalog *catalog);
  ~SqlContext() = default;
  
  auto Execute(const std::string &sql, ResultWriter &writer) -> void;
  auto Prepare(const std::string &sql, ResultWriter &writer) -> void;
  auto Binder(std::vector<tzdb::Value> &&params) -> void;
  auto Next(tzdb::Tuple *tuple) -> bool;
  auto ExecuteSql(const std::string &sql, ResultWriter &writer, std::shared_ptr<CheckOptions> check_options = nullptr) -> bool;
  auto GetSchema() -> const tzdb::Schema &;
  auto ExecuteSqlTxn(const std::string &sql, ResultWriter &writer, std::shared_ptr<CheckOptions> check_options = nullptr) -> bool;
  auto HasResult() const -> bool;
  void SetTransaction(tzdb::Transaction *txn);

 private:
  // Helper methods for different SQL statements
  void ExecuteCreateStatement(const CreateStatement &stmt, ResultWriter &writer);
  void ExecuteIndexStatement(const IndexStatement &stmt, ResultWriter &writer);
  void ExecuteExplainStatement(const ExplainStatement &stmt, ResultWriter &writer);
  void ExecuteVariableShowStatement(const VariableShowStatement &stmt, ResultWriter &writer);
  void ExecuteVariableSetStatement(const VariableSetStatement &stmt, ResultWriter &writer);
  void HandlePlanStatement(const BoundStatement &stmt, ResultWriter &writer);
  void ExecuteInsertStatement(const InsertStatement &stmt, ResultWriter &writer);
  void ExecuteUpdateStatement(const UpdateStatement &stmt, ResultWriter &writer);
  void ExecuteDeleteStatement(const DeleteStatement &stmt, ResultWriter &writer);
  void ExecuteSelectStatement(const SelectStatement &stmt, ResultWriter &writer);
  void ExecuteCopyStatement(const CsvExportStatement &stmt, ResultWriter &writer);
  
  // Member variables
  tzdb::TransactionManager *txn_manager_;
  tzdb::Transaction *txn_;
  tzdb::Catalog *catalog_;
  std::map<size_t, tzdb::Value *> params_;
  bool has_result_{};
  std::unique_ptr<ExecutorContext> executor_context_;
  std::unique_ptr<AbstractExecutor> executor_;
  AbstractPlanNodeRef plan_;
};

// Result writer classes
class ResultWriter {
 public:
  ResultWriter() = default;
  virtual ~ResultWriter() = default;
  virtual void WriteCell(const tzdb::Value &cell) = 0;
  virtual void WriteHeaderCell(const tzdb::Column &cell) = 0;
  virtual void BeginHeader() = 0;
  virtual void EndHeader() = 0;
  virtual void BeginRow() = 0;
  virtual void EndRow() = 0;
  virtual void BeginTable(bool simplified_output) = 0;
  virtual void EndTable() = 0;
  virtual void OneCell(const tzdb::Column& column, const tzdb::Value &cell);
  bool simplified_output_{false};
};
} // namespace query
```

SQL上下文的使用通常由会话对象封装，但了解其工作原理有助于开发高效的数据库应用。当会话执行SQL语句时，它会创建一个`ResultWriter`对象来收集结果，然后调用SQL上下文的`Execute()`方法执行SQL语句。SQL上下文会解析SQL语句，生成执行计划，并通过执行引擎执行计划。执行过程中，结果会通过`ResultWriter`对象收集和格式化，最后返回给应用程序。

对于需要高性能的应用，可以使用预编译和参数绑定功能。首先调用`Prepare()`方法预编译SQL语句，然后多次调用`Binder()`方法绑定不同的参数，最后执行语句。这种方式避免了重复解析和优化相同的SQL语句，提高了执行效率，同时也防止了SQL注入攻击，提高了安全性。

### 2.2.6.4 接口上下文管理

接口上下文管理通过`McoContext`类实现，为MCO(Memory-Centric Operation)接口提供执行环境，是会话与底层存储引擎之间的桥梁，支持高效的内存中心化操作。

#### 设计意义与内容

接口上下文管理是TZDB系统支持多种接口的关键组件，它为MCO接口提供了统一的执行环境，使应用程序能够通过不同的接口访问数据库，满足不同场景下的需求。MCO接口是一种面向内存的操作接口，它将数据库操作抽象为内存对象的操作，提供了比SQL更底层、更灵活的数据访问方式。

MCO上下文管理的主要功能包括记录管理、游标管理和结构化数据支持。记录管理负责数据记录的访问和修改，支持插入、更新和删除操作；游标管理提供了多种游标实现，支持不同的数据访问模式，包括顺序扫描、索引查找和范围查询；结构化数据支持则使系统能够处理复杂的数据类型，如结构体和数组。

TZDB系统的MCO上下文管理支持多种游标类型，包括列表游标(ListCursor)、索引游标(IndexCursor)、遍历索引游标(TraverIndexCursor)、哈希索引游标(HashIndexCursor)和B+树索引游标(BtreeIndexCursor)。这些游标提供了不同的数据访问方式，满足不同场景下的需求。列表游标支持顺序扫描表中的所有数据；索引游标支持基于索引的快速查找；遍历索引游标支持遍历索引中的所有数据；哈希索引游标支持基于哈希索引的精确查找；B+树索引游标支持基于B+树索引的范围查询，包括等于、大于、小于等多种比较操作。

MCO上下文管理与事务管理紧密集成，确保MCO操作在事务上下文中执行，支持事务的ACID特性。它还提供了与数据库目录的集成，使MCO操作能够访问表和索引的元数据信息。

在实现上，MCO上下文管理采用了面向对象的设计，通过继承和多态实现了不同类型游标的统一管理。这种设计使系统能够灵活地支持不同类型的数据访问模式，提高了系统的可扩展性和可维护性。

#### 关键结构

`McoContext`类是MCO接口上下文管理的核心，它提供了记录和游标操作的基础功能。`McoRecord`类表示一条数据记录，支持字段级别的访问和修改。`Cursor`类是所有游标类型的基类，定义了游标操作的通用接口。

```cpp
class McoContext {
 public:
  explicit McoContext(Session &session);
  tzdb::Transaction *GetTrans() const;
  const tzdb::Catalog *GetCatalog() const;
  const tzdb::TableInfo *getTableInfo(int class_code) const;
  const tzdb::TableInfo *getTableInfo(const std::string& table_name) const;
  const tzdb::IndexInfo *getIndexInfo(int index_code) const;
  void BeginTransaction() const;
  void CommitTransaction() const;
  void RollbackTransaction() const;

 public:
  std::unique_ptr<McoRecord> mco_record_;
  std::unique_ptr<Cursor> cursor_;
 private:
  Session &session_;
};

class McoRecord : public McoFieldValues {
 public:
  explicit McoRecord(const tzdb::TableInfo &table_info);
  explicit McoRecord(const tzdb::TableInfo &table_info, tzdb::Rid rid, std::vector<tzdb::Value>&& record);
  ~McoRecord() override = default;
  
  void ConstructZeroRecord();
  void ResetRecord();
  bool IsInsertState() const;
  bool IsSelectState() const;
  bool IsUpdateState() const;
  
  tzdb::Value &GetValue(int index) override;
  const tzdb::LogicalType &GetType(int index) override;
  size_t GetSize() override;
  void SetModify() override;
  bool& GetModifyRef() override;

 public:
  const tzdb::TableInfo &table_info_;
  tzdb::Rid rid_;
  bool modify_;
  std::vector<tzdb::Value> record_;
 private:
  std::vector<tzdb::Value> init_record;
};

class Cursor {
 public:
  explicit Cursor(tzdb::Transaction *trans);
  virtual ~Cursor() = default;
  virtual tzdb::Rid GetRid() = 0;
  virtual std::vector<tzdb::Value> GetRecord() = 0;
  virtual bool HasRecord() = 0;
  
  tzdb::Transaction *trans_;
};
```

MCO接口的使用通常涉及以下步骤:首先通过会话对象获取MCO上下文，然后使用上下文创建记录和游标对象，接着通过游标查询数据或通过记录对象插入、更新、删除数据。

例如，要使用MCO接口查询数据，可以先获取表信息，然后创建适当的游标(如列表游标或索引游标)，接着遍历游标获取数据记录。对于每条记录，可以通过`McoRecord`对象访问其字段值。要插入新记录，可以创建一个新的`McoRecord`对象，设置其字段值，然后将其插入到表中。要更新记录，可以先查询到记录，修改其字段值，然后提交更改。

MCO接口特别适合需要高性能、细粒度控制的应用场景，如实时数据处理、复杂查询和批量操作。它提供了比SQL更直接、更灵活的数据访问方式，但也需要开发者对数据库内部结构有更深入的了解。
