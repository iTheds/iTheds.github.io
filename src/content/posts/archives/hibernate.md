---
title: "Hibernate JDBC工具"
published: 2024-06-18
description: "生命短暂，韶光易逝"
tags:
  - "ODBC"
  - "java"
category: "tools"
draft: false
author: "Lonnie iTheds"
---
# Hibernate JDBC工具

使用 Hibernate 6.5.5 连接 TzDB。

## Hibernate 情况

Hibernate 是由 Gavin King 于 2001 年创建的开放源代码的对象关系框架。它强大且高效的构建具有关系对象持久性和查询服务的 Java 应用程序。
Hibernate 将 Java 类映射到数据库表中，从 Java 数据类型中映射到 SQL 数据类型中，并把开发人员从 95% 的公共数据持续性编程工作中解放出来。
Hibernate 是传统 Java 对象和数据库服务器之间的桥梁，用来处理基于 O/R 映射机制和模式的那些对象。

简而言之， Hibernate 是一款以结构化数据库表操作的辅助性框架。
一般情况，用户操作数据库都是采用 SQL 语句的方式。但是 Hibernate 支持用 xml 方式对表结构进行定义，然后依照其提供的 API 对表进行操作，包括建立表、插入、删除等，但是就目前版本而言无法建立数据库。

在内部依赖上，Hibernate 基于 JDBC 接口进行创作。通过主动生成 SQL 语句来完成操作数据库的功能，在这一层其实现了包括但不限于(调研限制)批处理、连接池等。

[官方连接 6.5](https://hibernate.org/orm/releases/6.5/#get-it)

对于用户来说，其只需要完成以下前序动作即可开始使用：
1. 将目标数据库(e.g Mysql)启动，并且以 JDBC 方式进行连接；
2. 配置 hibernate ;
3. 设计 xml 格式的表。

对于数据库开发者来说，其需要完成以下步骤才能让用户使用自己的数据库 + hibernate 模式：
1. 开发实现基本的 JDBC 接口的驱动程序；
2. 开发 hibernate 内部的支持 `org.hibernate.dialect.Dialect`；

但针对第二条中的 `org.hibernate.dialect.Dialect`， 这其实是一个 Hibernate 官方为众多主流数据库开发的定向内容，其能够根据各个数据库 SQL 语句上的语法差异和优化策略构建适用的 SQL 语句。
所以，主流数据库一般不会和 SQL92 标准差别太大，其实可以直接使用。本文中直接使用 Mysql 的 Dialect 。

> 此处对数据库的支持包括(HSQL Database Engine,DB2/NT,MySQL,PostgreSQL,FrontBase,Oracle,Microsoft SQL Server Database,Sybase SQL Server,Informix Dynamic Server)

## 环境初步测试

在 5.x 版本， 其还有直接提供 jar 包的方式。但是此处采用 maven 来进行构建项目。

> maven 是一个 java 工程的管理方案。采用 pom.xml 进行配置，解决 java 环境的包依赖、版本管理等。其具有特定的文件结构。

maven 中添加 Hibernate 主要部件和 mysql 驱动的依赖：
```xml
<dependency>
    <groupId>org.hibernate</groupId>
    <artifactId>hibernate-core</artifactId>
    <version>6.5.2.Final</version>
</dependency>
<dependency>
    <groupId>org.hibernate</groupId>
    <artifactId>hibernate-jpamodelgen</artifactId>
    <version>6.6.0.CR1</version>
</dependency>
<dependency>
    <groupId>org.hibernate.orm</groupId>
    <artifactId>hibernate-spatial</artifactId>
    <version>6.5.2.Final</version>
</dependency>

<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>8.0.31</version>
</dependency>
```

之后根据 [w3c上的教程](https://www.w3cschool.cn/hibernate/86go1ie3.html)搭建项目即可。

可以看到， `/src/main/resources/hibernate.cfg.xml` 和 `/src/main/resources/Employee.hbm.xml`是主要的配置项目。

* `/src/main/resources/hibernate.cfg.xml` 中配置了数据库 JDBC 的基本参数和 hibernate 的一些处理方法：
```xml

<hibernate-configuration>
    <session-factory>
        <property name="hibernate.dialect">
            org.hibernate.dialect.MySQLDialect
        </property>
        <property name="hibernate.connection.driver_class">
            tzdb.jdbc.TzdbDriver
        </property>

        <!-- Assume test is the database name -->
        <property name="hibernate.connection.url">
            jdbc:tzdb://127.0.0.1:7030/db=dbTest
        </property>
        <property name="hibernate.connection.username">
            itheds
        </property>
        <property name="hibernate.connection.password">
            1234567
        </property>
        <property name="hibernate.hbm2ddl.auto">
            update
        </property>
        <property name="hibernate.jdbc.batch_size">0</property>

        <!-- List of XML mapping files -->
        <mapping resource="Employee.hbm.xml"/>
    </session-factory>
</hibernate-configuration>
```

* `/src/main/resources/Employee.hbm.xml` 主配置了单个表:
```xml
<hibernate-mapping>
    <class name="Employee" table="EMPLOYEE">
        <meta attribute="class-description">
            This class contains the employee detail.
        </meta>
        <id name="id" type="int" column="id">
            <generator class="native"/>
        </id>
        <property name="firstName" column="first_name" type="string"/>
        <property name="lastName" column="last_name" type="string"/>
        <property name="salary" column="salary" type="int"/>
    </class>
</hibernate-mapping>
```

写完代码后即可开始运行。但是需要一个数据库实体，Hibernate 能够自动建立表但是无法自动建立库。所以使用 JDBC 接口建立数据库:
```java

    public static void createDatabase(String dbName) {
        String url = "jdbc:tzdb://127.0.0.1:7030/db=dbTest"; // Adjust URL as per your driver
        String username = "itheds";
        String password = "1234567";

        try (Connection conn = DriverManager.getConnection(url, username, password);
             Statement stmt = conn.createStatement()) {
//            String sql = "CREATE DATABASE IF NOT EXISTS " + dbName;// mysql
            String sql = "OPEN '" + dbName + "'";
            stmt.executeUpdate(sql);
            System.out.println("Database created successfully...");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
```

先对 mysql 进行测试，没有任何问题。

## 连接 TZDB

老生常谈的操作，先换成 tzdb 驱动程序，并且进行驱动测试，成功。
开始配置，并且执行。

发现其有许多的额外接口依赖：
```java
public ResultSet getTables();
public ResultSet getColumns()  --> a temp deal function - add a class CustomResultSet implements ResultSet;
public Statement getStatement();
```

这些接口虽然目前没有功能，但是还是可以支持，属于小体量的新研任务。

但是在使用测试接口平替之后再运行发现其需要接口：
```java
public PreparedStatement prepareStatement()
```

该接口属于预执行功能模块。

### 无法避开的功能接口

如果预执行接口可以避开，使得 Hibernate 能够组织单个语句那么再好不过。
推论方案：

其似乎可以通过采用原生接口 `Query query = session.createNativeQuery(sql);`进行绕过。
    但是这样一来， Hibernate 框架的意义似乎就不是很大。


## 现有问题即解决方案

# 调研日志

[6.17]
hibernate.dialect ， 其作用为生成 sql 语句。


方法四：自定义 Hibernate Dialect（不推荐）

理论上，你可以通过创建自定义的 Hibernate Dialect 来修改 SQL 生成逻辑，避免使用预执行语句。但这也是一种极端方法，且不推荐使用：

```java
public class CustomDialect extends org.hibernate.dialect.Dialect {
    // Override methods to customize SQL generation
}
```
