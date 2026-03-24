---
title: "Mysql_Read_record"
date: "2022-11-7"
author: "Lonnie iTheds"
tags:
  - Mysql
categories:
  - 数据库
draft: false
section: "posts"
sourcePath: "markdown/_posts/Mysql_Read_record.md"
slug: "_posts/Mysql_Read_record"
---

# Mysql Read record

The first priorities is the difference and the theory of between InnoDB and Myisam.

## Theory of InnoDB

### 内存

1. 缓冲池：数据页，索引页，插入缓冲，自适应哈希索引，锁信息，数据字典信息。
2. LRU(Latest Recent Used)算法。 
   1. midpoint 位置, innodb_old_blocks_pct
   2. innodb_old_blocks_time
3. 重做日志缓冲 redo log, undo log
4. 额外的内存池

### Checkpoint 

缓冲技术

### FreeList

本质上是空闲页管理。
源码中 plugin/innodb_memcached/innodb_memcache/cache-src 中有系列函数提到过内存管理的 freelist.

### Source code stack


## Theory of MYISAM

### File format

每个myisam在磁盘上存储成3个文件，文件名和表名相同，但扩展名为：
.frm(存储表结构定义)
.MYD(MYData ,存储数据)
.MYI(MYIndex , 索引数据)

 对于每一个以Myisam做数据引擎的表，在<%data_dir%>/<database>目录下会有如下几个文件来保存其相关信息：

    .frm文件。 这个文件是跨引擎的，描述了该表的元信息，其中最重要的是表定义和表的数据库引擎。
    .MYD文件。这是我们要看的重点文件，包含了数据库record信息，就是数据库中的每个行。
    .MYI文件。索引文件，用来加速查找。

myisam表支持三种不同的存储格式：
静态表（长度固定）;
动态表；
压缩表。
静态表是默认的存储格式。静态表中的字段都是非变长字段，这样每个记录都是固定长度的，这种存储方式的优点是存储非常迅速，容易缓存，出现故障容易恢复；缺点是占用空间通常比动态表多。

### Application scenario

由MyISAM的特性，我们就可以简单的列举MyISAM引擎适用场景了。
1、不需要事务支持的场景。
2、读取操作比较多，写入和修改操作比较少的场景。
3、数据并发量较低的场景。
4、硬件条件比较差的场景。
5、在配置数据库读写分离场景下，MySQL从库可以使用MyISAM索引。

### Source code stack

创建.frm文件的代码在 mysql_create_frm() 里.--并没有找到该方法。估计是版本太久或者其他的。



而对于MYD中的每个record， 可以 是fixed，dynamic以及packed三种类型之一。fixed表示record的大小是固定的，没有VARCHAR, blob之类的。dynamic则刚好相反，有变长数据类型。packed类型是通过 myisampack 处理过的record。[参见](http://dev.mysql.com/doc/refman/5.1/en/myisam-table-formats.html) 。
需要注意的是record类型是针对表的设置，而不是对每个column的设置。 

myisampack 有一个同名文件。

record处理接口
record的类型是表级别的设置，所以在一个表被打开的时候， myisam 会检查元数据的选项，看该表的record是什么类型，然后设置对应的处理函 数，具体处理在storage/myisam/mi_open.c的 `mi_setup_functions` 中。

其中是 C 语言中常用的类似多态的方法，利用函数指针，适应多种情况。

Fixed类型
顾名思义，fixed类型的表中的所有字段都是定长的，不能出现TEXT, VARCHAR之类的东东。这种严格限制带来的好处就是更快更直接的数据record操作，想想也知道，每个数据都是定长的，在文件操作的时候多方便啊。
看看一个数据的函数 `_mi_write_static_record` ，它在 mi_statrec.c 中，所有对于fixed record的操作的实现都定义在这个文件中。

[参考链接](https://blog.csdn.net/zhangjay/article/details/6714113)

my_alloc.cpp 中有方法 AllocBlock 和 Alloc。这两个函数都是对需求内存进行计算，然后返回一个现有地址是以变量 m_current_free_start 为开始的的。
所以内存分配应该是事先分配好了若干个，然后需要的时候取值。
但是这些方法没有对内存中的数据进行校验。

• Perform large allocations with my_malloc( ) , and free the allocated blocks with
my_free( ) as soon as possible.
• Do not free pointers allocated with sql_alloc( ) . The memory pool will be freed
at once with a call to free_root( ) at the end of the query.

没有仔细阅读 free ， 但是里面是有把 memory pool size 加大的。

#### THD 

确实有此类。

Each client connection is handled by a thread. Each thread has a descriptor object.

原来这种方式其实并非不正确。

MySQL has a number of system threads, such as the replication slave threads and delayed insert threads.

但是这样看来效率有点低，速度也并没有 delayed insert threads 快。

#### Shared Aspects of Architecture

build_table_filename 接口，未找到实现。

The table and database name are now encoded in build_table_filename( ) in sql/sql_table.cc. Code reads and parses the files using openfrm( ) from sql/table.cc, and writes to them using create_frm( ) from the same source file.

open_binary_frm 位于 table.cc 中。该函数内容很多。到此，应该就开始是 MyISAM 的重点了。

Regardless of the storage engine, the server reads the table definition from the .frm file, and stores it in what is called a table cache. This way, the next time the table needs to be accessed, the server does not have to reread and reparse the .frm file, but rather can use the cached information.

.frm 文件作为表的信息文件，一旦读取会放在缓存之中。

##### MyISAM Architecture

MyISAM stores its data on a local disk. In addition to the .frm file common to all storage engines, it uses two additional files: a datafile (.MYD), and an index file (.MYI).

Index file

![A](/image/Figure10-1.StructureOfIndex(.MYI)fileinMyISAM.png)

MyISAM Key Types

MyISAM supports three types of keys: regular B-tree, full-text (which uses a B-tree),and spatial (which uses an R-tree).

B-tree keys

Those interested in more detail should refer to mi_key.c, mi_search.c,mi_write.c, and mi_delete.c in the storage/myisam directory.

A MyISAM B-tree consists of leaf and nonleaf nodes, or pages. By default, each page is 1,024 bytes. It can be changed by testing the `myisam_block_size` variable. You can distinguish a nonleaf node from a leaf node by looking at the highest bit of the first byte of the page. It will be set for a nonleaf node.

Both leaf and nonleaf nodes contain key values and pointers to the record positions in the datafile. Nonleaf nodes additionally contain pointers to child nodes. Key values in a node may be compressed by replacing a common prefix with a referencing pointer.

mi_write.cc 中含有关于页面均衡的接口。也是一个突破口。


## Difference

区别：

1. InnoDB支持事务， MyISAM 不支持，对于InnoDB每一条SQL语言都默认封装成事务，自动提交，这样会影响速度，所以最好把多条SQL语言放在begin和commit之间，组成一个事务； 
2. InnoDB支持外键，而MyISAM不支持。对一个包含外键的InnoDB表转为MYISAM会失败； 
3. InnoDB是聚集索引，使用B+Tree作为索引结构，数据文件是和（主键）索引绑在一起的（表数据文件本身就是按B+Tree组织的一个索引结构），必须要有主键，通过主键索引效率很高。但是辅助索引需要两次查询，先查询到主键，然后再通过主键查询到数据。因此，主键不应该过大，因为主键太大，其他索引也都会很大。
   
    MyISAM是非聚集索引，也是使用B+Tree作为索引结构，索引和数据文件是分离的，索引保存的是数据文件的指针。主键索引和辅助索引是独立的。
    也就是说：InnoDB的B+树主键索引的叶子节点就是数据文件，辅助索引的叶子节点是主键的值；而MyISAM的B+树主键索引和辅助索引的叶子节点都是数据文件的地址指针。

4. InnoDB不保存表的具体行数，执行select count(*) from table时需要全表扫描。而 MyISAM 用一个变量保存了整个表的行数，执行上述语句时只需要读出该变量即可，速度很快（注意不能加有任何WHERE条件）
   
    那么为什么InnoDB没有了这个变量呢？
    因为InnoDB的事务特性，在同一时刻表中的行数对于不同的事务而言是不一样的，因此count统计会计算对于当前事务而言可以统计到的行数，而不是将总行数储存起来方便快速查询。InnoDB会尝试遍历一个尽可能小的索引除非优化器提示使用别的索引。如果二级索引不存在，InnoDB还会尝试去遍历其他聚簇索引。
    如果索引并没有完全处于InnoDB维护的缓冲区（Buffer Pool）中，count操作会比较费时。可以建立一个记录总行数的表并让你的程序在INSERT/DELETE时更新对应的数据。和上面提到的问题一样，如果此时存在多个事务的话这种方案也不太好用。如果得到大致的行数值已经足够满足需求可以尝试SHOW TABLE STATUS

5. Innodb不支持全文索引，而MyISAM支持全文索引，在涉及全文索引领域的查询效率上MyISAM速度更快高；PS：5.7以后的InnoDB支持全文索引了
6. MyISAM表格可以被压缩后进行查询操作
7. InnoDB支持表、行(默认)级锁，而MyISAM支持表级锁
    InnoDB的行锁是实现在索引上的，而不是锁在物理行记录上。潜台词是，如果访问没有命中索引，也无法使用行锁，将要退化为表锁。

8. InnoDB表必须有唯一索引（如主键）（用户没有指定的话会自己找/生产一个隐藏列Row_id来充当默认主键），而 Myisam 可以没有
9. Innodb存储文件有 frm、ibd，而Myisam是frm、MYD、MYI

    Innodb：frm是表定义文件，ibd是数据文件
    Myisam：frm是表定义文件，myd是数据文件，myi是索引文件

InnoDB为什么推荐使用自增ID作为主键？
    答：自增ID可以保证每次插入时B+索引是从右边扩展的，可以避免B+树和频繁合并和分裂（对比使用UUID）。如果使用字符串主键和随机主键，会使得数据随机插入，效率比较差。

innodb引擎的4大特性
    插入缓冲（insert buffer),二次写(double write),自适应哈希索引(ahi),预读(read ahead)

[参考链接](https://blog.csdn.net/qq_35642036/article/details/82820178)



