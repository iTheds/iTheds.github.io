---
title: "JAVA 桥接模式"
description: "JAVA 桥接模式"
---

# JAVA 桥接模式

桥梁模式是对象的结构模式。又称为柄体(Handle and Body)模式或接口(Interface)模式。桥梁模式的用意是“将抽象化(Abstraction)与实现化(Implementation)脱耦，使得二者可以独立地变化”。

桥接模式与`开-闭”原则以及组合/聚合复用原则`都是 JAVA 的基本设计思想。

桥梁模式的用意是“将抽象化(Abstraction)与实现化(Implementation)脱耦，使得二者可以独立地变化”。

## JDBC 桥接模式

JAVA 采用 ODBC 标准进行连接，有两种方式：JDBC-ODBC桥 和 JDBC 直连。

JDBC 直连不必说，是需要实现 JDBC 系列的接口。
JDBC-ODBC 的方式，似乎是用一个公有的 jar 驱动包，访问不同数据库的 odbc 服务。因此，数据库只需要支持 odbc 即可。

[MySQL_ODBC_DSN]
Description = mysql_dsn_1
Driver      = ODBC for MySQL 5
Server      = 192.168.3.113
Database    = test
User        = root
Password    = root
Port        = 3306

## 结论

桥的方法基本是告吹了。
因为：
1. 不支持。大部分的数据库已经能够支持 jdbc， 作为之前用于适配的 jdbc-odbc 桥模式，已经逐渐退出，导致现在市面上很难找到第三方适用与 jdk 1.8 以上版本的 jdbc-odbc 桥模式，资料也比较少；
2. 结构复杂。关于网上的重构 1.7 版本的 jdbc-odbc 驱动 `sun.jdbc.odbc.JdbcOdbcDriver`， 都出自于文章[参考](http://bigfatball.blogspot.com/2016/03/how-to-enable-jdbc-odbc-bridge-for-jdk-8.html)， 其所描述的过程，如下所示，容易操作，但是面对新的版本需要更多的操作，且不知道后续是否可控；
3. 效能考虑。当然是不如原生的，JNI也会优于此，万一后续考虑效能，桥模式，完全依赖其内部结构的处理。

>  [参考](http://bigfatball.blogspot.com/2016/03/how-to-enable-jdbc-odbc-bridge-for-jdk-8.html) :
> 
> Are you stuck with JRE 7 or older forever? Not necessarily. Follow the step below, you can enable JDBC-ODBC bridge in JDK 8.
> 
> 1. Download a JDK 7 or JRE 7.
> 2. Goto JRE\lib folder and find the rt.jar
> 3. Unzip it (if you have WinRAR installed) or you can rename it to rt.zip and unzip it.
> 4. Copy sun\jdbc and sun\security\action folders out, keep the folder structure. i.e., you should have the folder structure like below:
>      Sun --> Security --> Action --> JDBC
> 
> 5. Open a CMD window. Go to the parent folder of Sun folder. Run the command:
>      jar -cvf jdbc.jar sun
> 
> 6. The above command will create a file named jdbc.jar
> 7. Copy JDBC.jar to your JDK8 or JRE8 lib folder
> 8. Copy   jdbcodbc.dll from JRE\bin  of your JRE 7 installation to JRE\bin of your JRE 8 installation.
> 9. Restart your JVM.
>
> main reply:
>
> UnknownMay 6, 2016 at 12:17 PM
> 
> Thanks for your help, I was able to create my excel file successfully. Few > clarification I want to make.
> 
> 1) First make sure if your going for 64 bit environment choose Java JRE 7 or  SDK 7 64 bit version.
> 2) Once you have Separated the files in c:\sun folder run the command from c:\jar -cvf jdbc.jar sun.
> 3) Once your jdbc.jar is created in my case I had to put it in C:\Program Files\Java\jdk1.8.0_60\jre\lib\ext folder, instructions said to put it in lib which gave me the error class not found
> 
> Class.forName("sun.jdbc.odbc.JdbcOdbcDriver");
> String connUrl = "jdbc:odbc:DRIVER={Microsoft Excel Driver (*.xls, *.xlsx, *.xlsm, *.xlsb)};DBQ="+Filename+".xls;DriverID=22;readonly=false"; // good 64 bit
> conn=DriverManager.getConnection(connUrl,"","");
> 
> Thanks again you saved me tons of time and re coding.

## 后续1

但是后来又找到了一篇，更为详细， [参考2](https://blog.csdn.net/vdora/article/details/119870738)。

提到要下载 jdbcodbc.dll， 但系统似乎对 linux 有所限制。

