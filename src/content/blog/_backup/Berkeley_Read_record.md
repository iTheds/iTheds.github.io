---
title: "Berkeley_Read_record"
date: "2022-11-3"
author: "Lonnie iTheds"
tags:
  - Berkeley
draft: true
section: "backup"
sourcePath: "markdown/_backup/Berkeley_Read_record.md"
slug: "_backup/Berkeley_Read_record"
---

# Berkeley Read record

Reading by Berkeley DB Release 18.1, library version 18.1.40: (May 29, 2020).

## Main Frame

### API

### Struct

## Suit for our project

# 源码阅读记录

本次源码阅读主要是阅读关于 hash 存储技术模块

1.数据存取子系统
数据存取（Access Methods）子系统为创建和访问数据库文件提供了多种支持。Berkeley DB提供了以下四种文件存储方法：
哈希文件、B树、定长记录（队列）和变长记录（基于记录号的简单存储方式），应用程序可以从中选择最适合的文件组织结构。
程序员创建表时可以使用任意一种结构，并且可以在同一个应用程序中对不同存储类型的文件进行混合操作。
在没有事务管理的情况下，该子系统中的模块可单独使用，为应用程序提供快速高效的数据存取服务。
数据存取子系统适用于不需事务只需快速格式文件访问的应用。

2.内存池管理子系统
内存池（Memory pool）子系统对Berkeley DB所使用的共享缓冲区进行有效的管理。它允许同时访问数据库的多个进程或者进程的多个线程共享一个高速缓存，负责将修改后的页写回文件和为新调入的页分配内存空间。    它也可以独立于Berkeley DB系统之外，单独被应用程序使用，为其自己的文件和页分配内存空间。内存池管理子系统适用于需要灵活的、面向页的、缓冲的共享文件访问的应用。

3.事务子系统
事务（Transaction）子系统为Berkeley DB提供事务管理功能。它允许把一组对数据库的修改看作一个原子单位，这组操作要么全做，要么全不做。在默认的情况下，系统将提供严格的ACID事务属性，但是应用程序可以选择不使用系统所作的隔离保证。该子系统使用两段锁技术和先写日志策略来保证数据库数据的正确性和一致性。    它也可以被应用程序单独使用来对其自身的数据更新进行事务保护。事务子系统适用于需要事务保证数据的修改的应用。

4.锁子系统
锁（Locking）子系统为Berkeley DB提供锁机制，为系统提供多用户读取和单用户修改同一对象的共享控制。数据存取子系统可利用该子系统获得对页或记录的读写权限；事务子系统利用锁机制来实现多个事务的并发控制。   该子系统也可被应用程序单独采用。锁子系统适用于一个灵活的、快速的、可设置的锁管理器。

5.日志子系统
日志（Logging）子系统采用的是先写日志的策略，用于支持事务子系统进行数据恢复，保证数据一致性。它不大可能被应用程序单独使用，只能作为事务子系统的调用模块。  

在这个模型中，应用程序直接调用的是数据存取子系统和事务管理子系统，这两个系统进而调用更下层的内存管理子系统、锁子系统和日志子系统。
由于几个子系统相对比较独立，所以应用程序在开始的时候可以指定哪些数据管理服务将被使用。可以全部使用，也可以只用其中的一部分。例如，如果一个应用程序需要支持多用户并发操作，但不需要进行事务管理，那它就可以只用锁子系统而不用事务。有些应用程序可能需要快速的、单用户、没有事务管理功能的B树存储结构，那么应用程序可以使锁子系统和事务子系统失效，这样就会减少开销。


## 源码阅读

阅读源码，目前只知道入口，并且关键字是 Accesss methods。

比较关键的信息：

4. __bam_new_file
Routed from __db_new_file.

Create a btree db file by initializing its meta page and root page. Called
during db open process and routed from __db_new_file when db is a btree db.
The db may be in memory or not. For inmem db, we create the page from cache
and mark it dirty (mark this in __memp_fget rather than after actually writing
to it otherwise the page may get evicted before we had a chance to mark it.);
For on-disk db files, we don't use cache for now, rather, we put the page in
private memory to init, and directly write the  pages into the db file using __fop_write.

when writing pages directly via __fop_writ/__fop_read, we should call the
internal common page in/out functions after got the page via __fop_read and
before writing the page via __fop_write. The __memp_fget/__memp_fput functions
call them too, as registered callbacks via __memp_pg. We have internal page in/out
callbacks for the 3 types of databases(btree, hash, queue), the internal page in/out functions mainly do
check summing and page header byte swap, so that database files created in
big-endian machines can be opened on little-endian machines, though the user
data are never swapped, so users need to make sure the bytes they get are correct.
There are AM specific work to do in internal page in/out functions, so we have
a __db_pgin/__db_pgout pair(placed in db/db_conv.c), in which they call AM specific pgin/out functions
like __bam_pgin/__bam_pgout (placed in btree/btree_conv.c, note the file name
convention). 

这里就表明了， 通过方法 __memp_fget/__memp_fput functions 也可以实现写入和读取。

但是这些都是阐述 Btree 的文档。
中文 Hash 的文档几乎没有。但是有分析其区别：

B+树
关键字有序存储，并且其结构能随数据的插入和删除进行动态调整。为了代码的简单，Berkeley DB没有实现对关键字的前缀码压缩。B+树支持对数据查询、插入、删除的常数级速度。关键字可以为任意的数据结构。
1、 当Key为复杂类型时。
2、 当Key有序时。

Hash
DB中实际使用的是扩展线性HASH算法（extended linear hashing），可以根据HASH表的增长进行适当的调整。关键字可以为任意的数据结构。
1、 当Key为复杂类型。
2、 当数据较大且key随机分布时。

[](https://blog.csdn.net/yanglu_dandan/article/details/38558661)

那我们只能从源码上来看了。通过 Btree 的分析可以旁引一些信息。

主要查看了以下官网doc ：
[](https://docs.oracle.com/cd/E17276_01/html/programmer_reference/am_misc_diskspace.html)

## Disk space requirements

If enough keys are deleted from a database that shrinking the underlying file is desirable, you should use the DB->compact() method to `reclaim disk space`. Alternatively, you can create a new database and copy the records from the old one into it. 

The formulas for the Hash access method are as follows: 
```s
useful-bytes-per-page = (page-size - page-overhead)

bytes-of-data = n-records *
(bytes-per-entry + page-overhead-for-two-entries)
        
n-pages-of-data = bytes-of-data / useful-bytes-per-page
        
total-bytes-on-disk = n-pages-of-data * page-size
```

先过一遍公式：
```
每页可用字节数 u_page_size = 页面大小 - 本页面额外开销

数据总字节 = 数据总条目n * ( 每个条目键值对的字节数 + 两个条目的额外开销 )

所需页面数 n = 数据总字节 / 每页可用字节数 u_page_size

磁盘上的总字节数 = 所需页面数 n * 页面大小
```

也就是说，hash 有单位-页面大小，每个条目有字节数规定。
数据的总字节数与有多少条记录有关是肯定的，而每个条目，除了自身条目的字节数，还需要额外的两个条目的页面开销？
其中数据字节的概念有些模糊

The `useful-bytes-per-page` is a measure of the bytes on each page that will actually hold the application data. It is computed as the total number of bytes on the page that are available to hold application data. If the application has explicitly set a page-fill factor, pages will not necessarily be kept full. For databases with a preset fill factor, see the calculation below. The page-overhead for Hash databases is 26 bytes and the page-overhead-for-two-entries is 6 bytes.

每页使用的字节数量是衡量字节在每个页面中实际消耗的应用数据。计算总共的字节数在页面上可用于持有的应用数据。如果应用程序明确设置了页面填充因子，则页面不一定会保持满。对于具有预设填充因子的数据库，请参见下面的计算。Hash数据库的页面开销是26字节，两个条目的页面开销为6字节。

As an example, using an 8K `page size`, there are 8166 bytes of useful space on each page:

8166 = (8192 - 26)

也就是说，一个页面的实际可用大小是需要减去页面的开销的。那么两个条目的页面开销为 6 字节又是什么意思呢？

The `total bytes-of-data` is an easy calculation: it is the number of key/data pairs plus the overhead required to store each pair on a page. In this case that's 6 bytes per pair. So, assuming 60,000,000 key/data pairs, each of which is 8 bytes long, there are 1320000000 bytes, or roughly 1.23GB of total data:

1320000000 = 60000000 * (16 + 6)

这句话表明，键值对之间，两个条目需要一个键值对的开销，也就是 6 字节，加上本身的键值对开销，key 和 value 分别是 8 个字节，所以得出以上计算。
Hash ：散列，通过关于键值(key)的函数，将数据映射到内存存储中一个位置来访问。这个过程叫做Hash，这个映射函数称做散列函数，存放记录的数组称做散列表(Hash Table),又叫哈希表。
但是 hash 作为表来说，应该能够消耗更少的内存，不对，那个地方是在 6 个字节里的，而不是键值对本身。

The total pages of data, `n-pages-of-data`, is the `bytes-of-data` divided by the `useful-bytes-per-page`. In this example, there are 161646 pages of data.

161646 = 1320000000 / 8166

页面只是存放数据的工具，每个页面有额外的维护性开销。
然后我们在使用的时候，根据数据和键值对，每 8 个字节 value 对应一个 8 字节的 key，并且算法需要使用 6 个字节的额外消耗。存放到页面的时候，根据页面大小，做除法，就能得到需要多少个页面。
这个还挺好理解，就是两个步骤相分开。

The `total bytes of disk` space for the database is `n-pages-of-data` multiplied by the page-size. In the example, the result is 1324204032 bytes, or roughly 1.23GB.

1324204032 = 161646 * 8192

这个就没什么了，计算的是总共需要的磁盘字节数量。

Now, let's assume that the application specified a fill factor explicitly. `The fill factor indicates the target number of items to place on a single page (a fill factor might reduce the utilization of each page, but it can be useful in avoiding splits and preventing buckets from becoming too large)`. Using our estimates above, each item is 22 bytes (16 + 6), and there are 8166 useful bytes on a page (8192 - 26). That means that, on average, you can fit 371 pairs per page.

371 = 8166 / 22

填充因子？(fill factor)，表明的是，条目总量放置在(place on)单个界面的位置。(一个填充因子也许会减少每个页面的应用(utilization)，的但是它可以被使用在 避免(avoiding)切割 和 防止(preventing)桶??过大)。在我们上述的估计中，每个条目是 16 + 6 个字节，页面为 8 k， 可用的为 8166 bytes。这意味着，按平均值，每个页面可用容纳 371 个键值对。

However, let's assume that the application designer knows that although most items are 8 bytes, they can sometimes be as large as 10, and it's very important to avoid overflowing buckets and splitting. Then, the application might specify a fill factor of 314.

314 = 8166 / 26

数据过大，所以指定填充因子为 314.

With a fill factor of 314, then the formula for computing database size is

n-pages-of-data = npairs / pairs-per-page

or 191082.

191082 = 60000000 / 314

At 191082 pages, the total database size would be 1565343744, or 1.46GB.

1565343744 = 191082 * 8192

There are a few additional caveats with respect to Hash databases. This discussion assumes that the hash function does a good job of evenly distributing keys among hash buckets. If the function does not do this, you may find your table growing significantly larger than you expected. Secondly, in order to provide support for Hash databases coexisting with other databases in a single file, pages within a Hash database are allocated in power-of-two chunks. That means that a Hash database with 65 buckets will take up as much space as a Hash database with 128 buckets; each time the Hash database grows beyond its current power-of-two number of buckets, it allocates space for the next power-of-two buckets. This space may be sparsely allocated in the file system, but the files will appear to be their full size. Finally, because of this need for contiguous allocation, overflow pages and duplicate pages can be allocated only at specific points in the file, and this too can lead to sparse hash tables. 

这是一些传统的警告(caveate)对于哈希数据的考虑。本讨论假设哈希函数在哈希桶之间均匀分配密钥方面做得很好。如果函数不这样做，您可能会发现您的表比预期的大得多。其次，为了支持在单个文件中与其他数据库共存(coexisting with)的哈希数据库，哈希数据库中的页面以两个块的形式分配(chunks)。这意味着具有65个桶的Hash数据库将占用与具有128个桶的哈希数据库相同的空间；每次Hash数据库增长超过其当前的两个桶数时，它都会为下一个桶数分配空间。这个空间可能在文件系统中被稀疏分配，但文件将显示为其完整大小。最后，由于需要连续分配，溢出页和重复页只能在文件中的特定点分配，这也会导致哈希表稀疏。

总共的 hash 算法大致上在文档上体现了。

## 结合源码

接下来结合其源代码看看。
可是源代码又从什么地方看起呢。这也是一个问题。
只能是找入口函数了。

又看了一眼 Hash access method specific configuration。 

Specifying a database hash

The database hash determines in which bucket a particular key will reside. The goal of hashing keys is to distribute keys equally across the database pages, therefore it is important that the hash function work well with the specified keys so that the resulting bucket usage is relatively uniform. A hash function that does not work well can effectively turn into a sequential list.

No hash performs equally well on all possible data sets. It is possible that applications may find that the default hash function performs poorly with a particular set of keys. The distribution resulting from the hash function can be checked using the db_stat utility. By comparing the number of hash buckets and the number of keys, one can decide if the entries are hashing in a well-distributed manner.

The hash function for the hash table can be specified by calling the DB->set_h_hash() method. If no hash function is specified, a default function will be used. Any application-specified hash function must take a reference to a DB object, a pointer to a byte string and its length, as arguments and return an unsigned, 32-bit hash value. 

DB->set_h_ffactor() 是设置 hash 的接口。

Hash table size

When setting up the hash database, knowing the expected number of elements that will be stored in the hash table is useful. This value can be used by the Hash access method implementation to more accurately construct the necessary number of buckets that the database will eventually require.

The anticipated number of elements in the hash table can be specified by calling the DB->set_h_nelem() method. If not specified, or set too low, hash tables will expand gracefully as keys are entered, although a slight performance degradation may be noticed. In order for the estimated number of elements to be a useful value to Berkeley DB, the DB->set_h_ffactor() method must also be called to set the page fill factor. 

调用DB->set_h_nelem（）方法指定哈希表中预期的元素数，调用DB->set_h_ffactor（）方法来设置页面填充因子。

所以我们主要还是从 open 函数看起。

但是 open 函数，也是眼花缭乱的。
cxx_db.cpp 中 Db::open， 里面有一个 open 函数，但是似乎只是一个指针，该成员位于 db.h 中 struct __db。 
记得对外的接口中有。

## 先看 set_h_ffactor

该函数也不好找，也有类似是个指针的，难道指针是个隐藏式的？或者确实是指针赋值控制使用那个内存分配函数，是 Btree 还是 Hash。 
db_cxx.h 中有 class _exported Db ， 成员：
    
    virtual int set_h_ffactor(u_int32_t);

查看 API 文档：

```C++
#include <db.h>

int
DB->set_h_hash(DB *db,
    u_int32_t (*h_hash_fcn)(DB *dbp, const void *bytes, 
    u_int32_t length));  
```

hash.h 中 struct hash_t 成员 h_ffactor

```C++
/* Hash internal structure. */
typedef struct hash_t {
	db_pgno_t meta_pgno;	/* Page number of the meta data page. */
	u_int32_t revision;	/* Revision of subdb metadata. */
	u_int32_t h_ffactor;	/* Fill factor. */
	u_int32_t h_nelem;	/* Number of elements. */
				/* Hash and compare functions. */
	u_int32_t (*h_hash) __P((DB *, const void *, u_int32_t));
	int (*h_compare) __P((DB *, const DBT *, const DBT *, size_t *));
} HASH;
```

hash_method.c Line_97 中有该方法与 API 中原型最为接近：
```C++
static int
__ham_set_h_ffactor(dbp, h_ffactor)
	DB *dbp;
	u_int32_t h_ffactor;
{
    ...
```

同文件下：__ham_db_create 中有关于该函数的设置：
```C++
	dbp->set_h_ffactor = __ham_set_h_ffactor;
```
说明该函数确实是作为实体指针传入的。

## 时间结束

总结，一天的时间，并没有看多少，一方面，自主看英文很开心，但是时间消耗比较大。
然后，重点不太清楚。
总结如下：
1. 源码开始应该清楚的是：
   1. 整体的方向架构，通过
   2. 函数栈，通过从上至下的一整个大体流程，不需要全面覆盖，但是要明确要看的分支的内容


