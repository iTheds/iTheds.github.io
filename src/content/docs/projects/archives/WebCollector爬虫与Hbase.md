---
title: "WebCollector爬虫与Hbase"
description: "有些东西很美好，就像是你的眼睛一样，和朔月的光是一样的"
---

# 数据采集 （涛涛）

WebCollector是一个无须配置、便于二次开发的JAVA爬虫框架（内核），它提供精简的的API，只需少量代码即可实现一个功能强大的爬虫。WebCollector-Hadoop是WebCollector的Hadoop版本，支持分布式爬取。
WebCollector-Hadoop能够处理的量级高于单机版，具体数量取决于集群的规模。WebCollector采用一种粗略的广度遍历。
网络爬虫会在访问页面时，从页面中探索新的URL，继续爬取。WebCollector为探索新URL提供了两种机制，自动解析和手动解析
WebCollector是基于JAVA环境的爬虫框架，使用它需要用到java环境，Eclipse、 MySQL 数据库等组件。

> 在Windows下安装JDK

JDK是java的开发工具包，其中包括开发工具、源代码、JRE。JRE是Java 运行时环境，包含了Java 虚拟机、Java 基础类库，是运行 Java 程序所需要的软件环境。

首先我们在官网上下载[JDK](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html)，我们选择下载[jdk-8u171-windows-x64.exe](http://download.oracle.com/otn-pub/java/jdk/8u171-b11/512cd62ec5174c3487ac17c61aaa89e8/jdk-8u171-windows-x64.exe?AuthParam=1526800212_506f4c23e2ae0aaffc3639db4ae1421a)

之后双击打开安装包进行安装，开始安装界面如下：
点击下一步，用户可以更改缺省安装位置。现修改为E:\Java\jdk1.8.0_171\，下一步，选择目标文件位置，安装完成。

之后为了方便后续的操作，我们将java的环境添加到系统环境变量内。
我们打开文件安装的位置，即文件夹E:\Java\jdk1.8.0_171\下，然后进入\bin目录下，可以看到，其中有一个可执行文件为java.exe，将目标文件的绝对路径复制，本书安装的路径为E:\Java\jdk1.8.0_171\bin。

之后选择此电脑属性，高级系统设置，高级，环境变量，在系统变量中选择Path，编辑，然后新建，将刚刚所复制的目录粘贴到新建变量中。

之后我们可以打开DOS命令框，输入java来查看系统变量中已经成功加入了java变量。出现以下显示表明已经成功添加了java环境变量。

> 在Windows下安装Eclipse

首先在[Eclipse官网上](https://www.eclipse.org/downloads/)下载，下载好安装程序后双击打开，选择安装Eclipse IDE for JAVA EE Developers，之后选择安装路径安装即可。

> 将WebCollector项目导入Eclipse

在安装完成Eclipse之后，我们选择将WeCollector导入Eclipse中。

首先我们在[官网中](https://github.com/CrawlScript/WebCollector)下载源码，之后解压到我们Eclipse的workspace文件夹下，然后解压。

然后在 Eclipse 主界面中选择 “File→ Import• General• Existing Proects into WorkSpace”，在弹出的对话框中，通过“Browser”按 钮选择 WebCollector 文件夹，然后单击“确定”按钮后即可打开 WebCollector 项 目，如图12-8 所示。

然后打开Eclipse，在主界面中选择File→ Import• General• Existing Proects into WorkSpace，然后在弹出的窗口中选择Select root directory，Browse，选择我们的WebCollector项目文件夹即可。

之后我们需要加入一些依赖包来使得WebCollector可以运行，这些包可以在[MAVEN](https://search.maven.org/)和[mvnrepository](http://mvnrepository.com)这两个网站找到：

```JAVA
slf4j-log4j13-1.0.1-sources.jar
slf4j-api-1.8.0-beta2.jar
selenium-htmlunit-driver-2.52.0.jar
selenium-api-3.12.0.jar
gson-2.8.5.jar
je-5.0.73.jar
junit5-api-5.0.0-ALPHA.jar
junit-4.12.jar
hamcrest-core-1.3.jar
rhino-1.7.10.jar
spring-jdbc-5.0.6.RELEASE.jar
c3p0-0.9.5.2.jar
avro-tools-1.8.2.jar
okhttp-3.10.0.jar
org.apache.karaf.shell.console-2.4.1.jar
jsoup-1.11.3.jar
scalaz-effect_sjs0.6_2.13.0-M4-7.2.23.jar
mysql-connector-java-8.0.11.jar
```

> 在Windows下安装MySQL

当我们使用WebCollector收集到数据之后，我们可以将数据放入Mysql中，接下来我将介绍在Windows下安装MySql。

首先我们在[官网](https://dev.mysql.com/downloads/installer/)上下载mysql-installer-community-8.0.11.0.msi，之后我们双击打开安装程序。

安装程序直接界面如下，我们选择接受然后下一步，直接安装默认配置，下一步，执行，等待完成。
之后进入Group Replication界面，选择图下，下一步。
之后有三种方式可供选择：

```JAVA
Developer Compute(开发机器)：该选项代表典型个人用桌面工作站。假定机器上运行着多个桌面应用程序。将MySQL服务器配置成使用最少的系统资源
Server Compute(服务器)：该选项代表服务器，MySQL服务器可以同其它应用程序一起运行，例如FTP、email和web服务器。MySQL服务器配置成使用适当比例的系统资源。
Dedicated MySQL Server Compute(专用MySQL服务器)：该选项代表只运行MySQL服务的服务器。假定运行没有运行其它应用程序。MySQL服务器配置成使用所有可用系统资源。
```

这里我们选择Developer Compute，下一步，权限问题配置如下，
下一步，用户可以自定义一个密码，然后添加用户，现添加如下：
下一步，配置Mysql在windows上的服务，下一步，选择默认配置即可，下一步，执行。

然后我们也需要去配置相应的环境变量，其操作方式与配置JDK环境变量是一样的。安装完成后直接next。

之后我们可以在DOS命令框下使用mysql -uroot -p来连接数据库，输入密码后，键入命令show databases;结果如下说明Mysql可用。

之后我们建立一个专门用于存放抓取信息的数据裤。
打开mysql shell ，键入命令：

创建数据库指定字符集

    create database sp_db DEFAULT CHARACTER SET gbk COLLATE gbk_chinese_ci;

选择数据库

    use sp_db;

创建一个简单的表来存放抓取的信息

    create table spider(
        id int not null auto_increment,
        url varchar(255) default null,
        title varchar(255) default null,
        content varchar(255) default null,
        primary key (id)
    );

> 连接JDBC

WebCollector是通过JDBC来访问访问MySQL 数据库的，我们在此介绍连接JDBC方式。

在eclipse中我们使用驱动com.mysql.cj.jdbc.Driverl来连接MySQL数据库，此驱动需要mysql-connector-java-8.0.11.jar。

在执行类前导入一些包：

```JAVA
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
```

构造以下方法，将抓取的数据存入数据库中，在这里我们简单演示抓取url、title、content三个数据并且放入数据库中：

```JAVA
public static void doit(int id,String urldata,String title, String content){
        //声明Connection对象
        Connection con = null;
        //驱动程序名
        String driver = "com.mysql.cj.jdbc.Driver";
        //URL指向要访问的数据库名mydata
        String url = "jdbc:mysql://localhost:3306/sp_db?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=GMT";
        //MySQL配置时的用户名
        String user = "root";
        //MySQL配置时的密码
        String password = "********";
        //遍历查询结果集

        try {
            Class.forName(driver);
             //1.getConnection()方法，连接MySQL数据库\
             con = DriverManager.getConnection(url,user,password);
             if(!con.isClosed())
                 System.out.println("Succeeded connecting to the Database!");
             //2.创建statement类对象，用来执行SQL语句\
             Statement statement = con.createStatement();

            PreparedStatement psql;
            //预处理添加数据，其中有四个参数--“？”
            psql = con.prepareStatement("insert into spider (id,url,title,content) "+ "values(?,?,?,?)");
            psql.setInt(1, id);
            psql.setString(2, urldata);              //设置参数1，创建id
            psql.setString(3, title);      //设置参数2
            psql.setString(4, content);

            psql.executeUpdate();           //执行更新
            psql.close();
            con.close();

        } catch(ClassNotFoundException e) {
            //数据库驱动类异常处理
            System.out.println("Sorry,can`t find the Driver!");
            e.printStackTrace();
            } catch(SQLException e) {
            //数据库连接失败异常处理
            e.printStackTrace();  
            }catch (Exception e) {
            // TODO: handle exception
            e.printStackTrace();
        }finally{
            System.out.println("\n数据入库成功\n");
        }
    }
```

> 运行爬虫程序

在eclipse中打开AutoNewsCrawler.java文件或者ManualNewsCrawler.java文件，点击“Run”开始运行，运行结束后结果如图，我们使用命令`select * from spider`在mysql中查看如图所示：

## 在HBase集群上准备数据（涛涛）

WebCollector得以运行之后我们就可以将抓取的信息导入大数据Hadoop平台进行分析了。在此，我们将在WebCollector采集到的数据导入到Linux下的MySql中，然后将数据导入到HBase表里面。在实时应用中，我们可以直接在服务器端或者Linux的主机上进行安装配置。

> 将数据导入到MySQL

首先我们将数据库从windows中的mysql中导出：
我们在DOS命令窗口进入到mysql workbench文件夹C:\Program Files\MySQL\MySQL Workbench 8.0 CE中，执行命令`\mysqldump -u root -p sp_db >D:/sp_db.sql`，执行后会提示输入mysql密码，将root用户有控制权限的数据库sp_db导出到D:盘下保存为sp_db.sql文件。如图：

之后，我们将资源文件直接复制到CentOS上的用户文件夹itheds下。
然后我们首先在mysql中使用命令`create database sp_db`来创建一个存放数据库sp_db.sql的空数据库，值得说明的是，这个空数据库的名称不一定要和导入的数据库文件名称相同。

之后`use sp_db`来指示系统接下来的操作针对数据库sp_db。使用命令`soruce /home/itheds/sp_db.sql`将数据库文件导入到数据库sp_db中。我们使用`show tables`来查看sp_db中的表，发现多了一个表spider，说明导入成功。
一下是所有流程：

```sql
mysql> create database sp_db;
Query OK, 1 row affected (0.41 sec)

mysql> use sp_db
Database changed
mysql> show tables;
Empty set (0.00 sec)

mysql> source /home/itheds/sp_db.sql;
Query OK, 0 rows affected (0.00 sec)

Query OK, 0 rows affected (0.00 sec)

Query OK, 0 rows affected (0.00 sec)

Query OK, 0 rows affected (0.00 sec)

Query OK, 0 rows affected (0.00 sec)

Query OK, 0 rows affected (0.00 sec)

Query OK, 0 rows affected (0.00 sec)

Query OK, 0 rows affected (0.00 sec)

Query OK, 0 rows affected (0.00 sec)

Query OK, 0 rows affected (0.00 sec)

Query OK, 0 rows affected (0.01 sec)

Query OK, 0 rows affected (0.00 sec)

Query OK, 0 rows affected (0.00 sec)

Query OK, 0 rows affected (0.35 sec)

Query OK, 0 rows affected (0.00 sec)

Query OK, 0 rows affected (0.01 sec)

Query OK, 0 rows affected (0.00 sec)

Query OK, 8 rows affected (0.02 sec)
Records: 8  Duplicates: 0  Warnings: 0

Query OK, 0 rows affected (0.01 sec)

Query OK, 0 rows affected (0.00 sec)

Query OK, 0 rows affected (0.00 sec)

Query OK, 0 rows affected (0.00 sec)

Query OK, 0 rows affected (0.00 sec)

Query OK, 0 rows affected (0.00 sec)

Query OK, 0 rows affected (0.00 sec)

Query OK, 0 rows affected (0.01 sec)

Query OK, 0 rows affected (0.00 sec)

Query OK, 0 rows affected (0.00 sec)

mysql> show tables;
+-----------------+
| Tables_in_sp_db |
+-----------------+
| spider          |
+-----------------+
1 row in set (0.00 sec)

mysql>
```

> 将MySQL表中的数据导入到HBase表中

接下来我们就将linux中的数据导入到HBase表中。
导入数据有三种方法，利用SQL导入、使用Java API导入、使用import Tsv导入，我们在这里介绍利用SQL导入。

我们首先启动HBase集群，进入HBase Shell，输入命令 `create 'PINGJIA.SPIDER' , 'fl'`创建列族名为f1，名称为PINGJIA.SPIDER的列表。
之后，我们通过Sqoop来将Mysql中的数据导入到HBase的PINGJIA.SPIDER表中，我们进入Sqoop的安装目录 sqoop-1.4.6.bin_hadoop-2.G.4-alpha下的bin目录下，执行命令`sqoop import --connect jdbc:mysql://192.168.1.100:3306/sp_db -username root -P --table spider --hbase-table PINGJIA. SPIDER --columnfamily fl --hbase-row-key id --hbase-create-table -m 1`，利用驱动JDBC来将mysql中的数据库sp_db的表spider导入HBase中的表PINGJIA.SPIDER。

之后我们打开HBase中的PINGJIA.SPIDER表来查看是否已经将数据录入。
登入HBase Shell，执行命令count 'PINGJIA.SPIDER'，如果在最后显示的记录数量和我们spider表中的数量相同，则表明导入成功。