---
title: "SQL语句札记"
date: "2018-6-11"
subtitle: "如果你也曾单枪匹马"
author: "Lonnie iTheds"
tags:
  - SQL
  - 训练
categories:
  - 编程
draft: false
section: "archives"
sourcePath: "markdown/archives/SQL语句札记oo.md"
slug: "archives/SQL语句札记oo"
---

# SQL语句札记

## SQL语句

```SQL
Select *  from project ,student where project.principal = student.stdnum

select a.* from (select t.*,rownum rn from emp t order by sal desc) a where rn<10

Select * from Student join  SC on Student.Sno = SC.Sno  join Course on  Sc.Cno = Course.Cno where Sname LIKE '%" & tmp & "%' or Cname LIKE '%" & tmp & "%' or SC.Cno LIKE '%" & tmp & "%'  or Sdept LIKE '%" & tmp & "%' or SC.Sno Like '%" & tmp & "%' or Sage LIKE '" & tmp & "'

Select *  from project join student on project.principal = student.stdnum
where pronum like '%" & key & "%' or principal like '%" & key & "%'
or proname like '%" & key & "%' or subject like '%" & key & "%'
or prosort like '%" & key & "%' or reviewer like '%" & key & "%'
or college like '%" & key & "%' or sEmile like '%" & key & "%'
or sphone  like '%" & key & "%' or sname like '%" & key & "%'
```

SQL语句中含有特殊字符

如下SQL语句就不能正确运行：
select 'Alibaba&Taobao' from dual；
处理方法：
用Oracle的字符串处理函数chr处理。chr（38）表示 &符号
如：select chr(38) from dual;
结果：&

其他不能处理的特殊符合，也用类似的方式处理。如果不知道该特殊符号的ascii值，可以调用ascii函数处理，
如：select ascii('&') from dual;
结果：38

但是对于特殊字符 * 的判断却没有找到合适的方法。

而且上述方式只能用于Oracle。

```SQL
Dim sqldata(2) As String
sqldata(1) = "pronum as 项目编号 , sname as 负责人,proname as 项目名称, college.name as 学院 , starttime as 开始时间, status.name as 项目状态"
sqldata(2) = "project join student on project.stdnum = student.stdnum join college on college.college = student.college join status on status.isDone = project.isDone"

Dim strSQL As String
strSQL = "Select " & sqldata(1) & "  from " & sqldata(2) & ""

'MsgBox str.Fields("开始时间").Value

```

SQL Server DATEDIFF() 函数

```VB
DATEDIFF(datepart,startdate,enddate)


datepart    缩写
年    yy, yyyy
季度    qq, q
月    mm, m
年中的日    dy, y
日    dd, d
周    wk, ww
星期    dw, w
小时    hh
分钟    mi, n
秒    ss, s
毫秒    ms
微妙    mcs
纳秒    ns

SELECT DATEDIFF(day,'2008-12-29','2008-12-30') AS DiffDate
```

清屏 clear

查看所有用户

查看MYSQL数据库中所有用户
mysql> SELECT DISTINCT CONCAT('User: ''',user,'''@''',host,''';') AS query FROM mysql.user;
查看数据库中具体某个用户的权限
mysql> show grants for 'cactiuser'@'%';

### 数据库用户权限控制

#### 创建空权限用户

    CREATE USER 'username'@'host' IDENTIFIED BY 'password';

username：你将创建的用户名
host：指定该用户在哪个主机上可以登陆，如果是本地用户可用localhost，如果想让该用户可以从任意远程主机登陆，可以使用通配符%
password：该用户的登陆密码，密码可以为空，如果为空则该用户可以不需要密码登陆服务器

#### 授权

    GRANT privileges ON databasename.tablename TO 'username'@'host'

说明:
privileges：用户的操作权限，如SELECT，INSERT，UPDATE等，如果要授予所的权限则使用ALL
databasename：数据库名
tablename：表名，如果要授予该用户对所有数据库和表的相应操作权限则可用*表示，如*.*

如果是旧版的mysql57，那么需要重新书写密码：
    
    GRANT ALL PRIVILEGES ON *.* TO 'user_test'@'%' IDENTIFIED by 'Test123456+'

#### 设置与更改用户密码

命令:
SET PASSWORD FOR 'username'@'host' = PASSWORD('newpassword');
如果是当前登陆用户用:

SET PASSWORD = PASSWORD("newpassword");

#### 撤销用户权限

命令:
REVOKE privilege ON databasename.tablename FROM 'username'@'host';
说明:
privilege, databasename, tablename：同授权部分

#### 删除用户

命令:
DROP USER 'username'@'host';

```sql
mysql> create user 'public'@'%' identified by'Test404#';
Query OK, 0 rows affected (0.00 sec)

mysql> show grants for 'public'@'%';
+------------------------------------+
| Grants for public@%                |
+------------------------------------+
| GRANT USAGE ON *.* TO 'public'@'%' |
+------------------------------------+
1 row in set (0.00 sec)

mysql> Grant all on car_rental.* to 'public'@'%';
Query OK, 0 rows affected (0.00 sec)

mysql> show grants for 'public';
+--------------------------------------------------------+
| Grants for public@%                                    |
+--------------------------------------------------------+
| GRANT USAGE ON *.* TO 'public'@'%'                     |
| GRANT ALL PRIVILEGES ON `car_rental`.* TO 'public'@'%' |
+--------------------------------------------------------+
2 rows in set (0.00 sec)

mysql> use car_rental;
Database changed
mysql> show tables;
Empty set (0.00 sec)

create table car_model
(
carid char(2) primary key,
model varchar(15),
loads int,
cube varchar(15),
volume int
);

create table member(
username varchar(15) primary key,
password varchar(15),
rname varchar(15),
idcard varchar(19)
);

create table list(
orderid varchar(15) primary key,
status char(2),
username varchar(2),
ordertime datetime,
start varchar(15),
end varchar(15),
driverid char(4),
funds int
);

create table driver(
driverid char(4) primary key,
dname varchar(15),
carid char(2),
license varchar(20),
allfunds int,
alipay varchar(25),
wechar varchar(25)
);
```

#### 那些年改密码的神操作

忘记了密码，看来只有操作一下了。
首先修改文件my.cnf跳过权限验证，然后进入mysql，查看数据库，更改mysql.user中root的密码authentication_string，就可以了。
但是，密码是加密后的，一般使用函数password()加密，如果这个函数不幸不能用，那么可以刷新权限flush privileges，创建用户，直接update密码。

主要语句

```sql
[root@master etc]# vim my.cnf
skip-grant-tables
-- update user set authentication_string = password('Hellotest404@') where User='root';
flush privileges;
create user 'test2'@'*' IDENTIFIED by 'Htest404@';
mysql> update user set authentication_string = '$A$075$gia zv?I{38z*m<VJgCGXaLiYBqoLDgEdQT6o4QHu0QmKoi4w/XqUqL2y/' where User='root';
GRANT all on *.* to 'test2'@'*';
```

[皮这一下很开心]: <> ($A$005$gia zv?I{38z*m<VJgCGXaLiYBqoLDgEd9QT6o4QHu0QmKoi4w/XqUqL2y/,Hilove328@)

```sql
[root@master etc]# service mysqld stop
-- Redirecting to /bin/systemctl start mysqld.service
[root@master etc]# cd etc
[root@master etc]# vim my.cnf

// 加入一行 skip-grant-tables 跳过权限验证
[root@master etc]# service mysqld start
-- Redirecting to /bin/systemctl start mysqld.service
[root@master etc]# service mysqld status
[root@master etc]# mysql
-- Welcome to the MySQL monitor.  Commands end with ; or \g.
-- Your MySQL connection id is 7
-- Server version: 8.0.11 MySQL Community Server - GPL
mysql> use mysql
-- Database changed
mysql> show tables;
mysql> select password from user;
-- ERROR 1054 (42S22): Unknown column 'password' in 'field list'
mysql> select * from user where User = 'root';
-- 字段| Host| User | Select_priv | Insert_priv | Update_priv | Delete_priv | Create_priv | Drop_priv | Reload_priv | Shutdown_priv | Process_priv | File_priv | Grant_priv | References_priv | Index_priv | Alter_priv | Show_db_priv | Super_priv | Create_tmp_table_priv | Lock_tables_priv | Execute_priv | Repl_slave_priv | Repl_client_priv | Create_view_priv | Show_view_priv | Create_routine_priv | Alter_routine_priv | Create_user_priv | Event_priv | Trigger_priv | Create_tablespace_priv | ssl_type | ssl_cipher | x509_issuer | x509_subject | max_questions | max_updates | max_connections | max_user_connections | plugin| authentication_string | password_expired |password_last_changed | password_lifetime | account_locked | Create_role_priv | Drop_role_priv | Password_reuse_history | Password_reuse_time |
mysql> update user set password=password('123456') where user='root';
-- ERROR 1064 (42000): You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '('123456') where user='root'' at line 1

// N+1次失败后发现不是password，而是authentication_string
mysql> update user set authentication_string = password('Hellotest404@') where User='root';
-- ERROR 1064 (42000): You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '('Hellotest404@') where User='root'' at line 1

//n+1次失败后确认过不能用，password函数的问题？？
mysql> select authentication_string from user where User='root';
-- +------------------------------------------------------------------------+
-- | authentication_string                                                  |
-- +------------------------------------------------------------------------+
-- | $A$005$ez=xb_+Rq?C~IvBAPOVfzYxSobvc1I7Q2PbKXy47MqNwByeIJqWsKL/B |
-- +------------------------------------------------------------------------+
-- 1 row in set (0.00 sec)

// 开始你的表演
mysql> create user 'test'@'*' IDENTIFIED by 'test404';
ERROR 1290 (HY000): The MySQL server is running with the --skip-grant-tables option so it cannot execute this statement
mysql> flush privileges;
-- Query OK, 0 rows affected (0.02 sec)
mysql> create user 'test2'@'*' IDENTIFIED by 'Htest404@';
-- Query OK, 0 rows affected (0.03 sec)
mysql> select user, authentication_string  from user where User = 'test2';
-- +-------+------------------------------------------------------------------------+
-- | user  | authentication_string                                                  |
-- +-------+------------------------------------------------------------------------+
-- | test2 | $A$005$gia zv?I{38z*m<VJgCGXaLiYBqoLDgEd9QT6o4QHu0QmKoi4w/XqUqL2y/ |
-- +-------+------------------------------------------------------------------------+
-- 1 row in set (0.00 sec)

mysql> update user set authentication_string = '$A$005$gia zv?I{38z*m<VJgCGXaLiYBqoLDgEd9QT6o4QHu0QmKoi4w/XqUqL2y/' where User='root';
-- Query OK, 1 row affected (0.19 sec)
-- Rows matched: 1  Changed: 1  Warnings: 0
mysql> select user, authentication_string  from user where User='root';
-- +------+--------------------------------------------------------------------+
-- | user | authentication_string                                              |
-- +------+--------------------------------------------------------------------+
-- | root | $A$005$gia zv?I{38z*m<VJgCGXaLiYBqoLDgEd9QT6o4QHu0QmKoi4w/XqUqL2y/ |
-- +------+--------------------------------------------------------------------+
-- 1 row in set (0.00 sec)
//以防万一
mysql> GRANT all on *.* to 'test2'@'*';
-- Query OK, 0 rows affected (0.11 sec)
```