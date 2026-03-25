---
title: "C/C++问题收录与知识积累"
description: "C++问题收录与知识积累"
---

# C/C++问题收录与知识积累

每天晚上必须复盘代码数据，每周进行课题学习。

## 知识积累

### 可重入函数和不可重入函数

什么是不可重入函数？

* 可重入函数主要用于多任务环境中，一个可重入的函数简单来说就是可以被中断的函数，也就是说，可以在这个函数执行的任何时刻中断它，转入 OS 调度下去执行另外一段代码，而返回控制时不会出现什么错误;
* 而不可重入的函数由于使用了一些系统资源，比如全局变量区，中断向量表等，所以它如果被中断的话，可能会出现问题，这类函数是不能运行在多任务环境下的。

满足下列条件的函数多数是不可重入的：
    函数体内使用了静态（static）的数据结构；函数体内调用了 malloc() 或者 free() 函数；函数体内调用了标准 I/O 函数;

为什么中断处理函数不能直接调用不可重入函数？

在多任务系统下，中断可能在任务执行的任何时间发生；如果一个函数的执行期间被中断后，到重新恢复到断点进行执行的过程中，函数所依赖的环境没有发生改变，那么这个函数就是可重入的，否则就不可重入。
在中断前后不都要保存和恢复上下文吗，怎么会出现函数所依赖的环境发生改变了呢？ 我们知道中断时确实保存一些上下文，但是仅限于返回地址，cpu 寄存器等之类的少量上下文，而函数内部使用的诸如全局或静态变量，buffer 等并不在保护之列，所以如果这些值在函数被中断期间发生了改变，那么当函数回到断点继续执行时，其结果就不可预料了。
在中断处理函数中调用有互斥锁保护的全局变量，如果恰好该变量正在被另一个线程调用，会导致中断处理函数不能及时返回，导致中断丢失等严重问题。
并且在多线程环境中使用，在没有加锁的情况下，对同一段内存块进行并发读写，就会造成 segmentfault/coredump 之类的问题。
总而言之，中断处理函数做的事情越简单越好。

如何写出可重入的函数？

在函数体内不访问那些全局变量；
如果必须访问全局变量，记住利用互斥信号量来保护全局变量。或者调用该函数前关中断，调用后再开中断；
不使用静态局部变量；
坚持只使用缺省态（auto）局部变量；
在和硬件发生交互的时候，切记关闭硬件中断。完成交互记得打开中断，在有些系列上，这叫做“进入/退出核心”或者用 OS_ENTER_KERNAL/OS_EXIT_KERNAL 来描述；
不能调用任何不可重入的函数；
谨慎使用堆栈。最好先在使用前先 OS_ENTER_KERNAL；

[Read](https://zhuanlan.zhihu.com/p/280711576)

### 虚继承

A;
B vritual A;
C vritual A, public B;

当 B 数据赋值到 C 指针时，数据将发生错误。
但是如果不是虚继承则不出现该情况。

### 指针引用的多态

父类和派生类：

```C++
class CONNECT {
public:
	void set(CONNECT*&){}
};
class VioConnect :public CONNECT {};


void test_main() {

	//
	VioConnect v1;	
	VioConnect* new1 = NULL;
	// v1.set(new1);//error

	//解决方法1
	VioConnect v3;
	CONNECT* new2 = NULL;
	v3.set(new2);

	//解决方法2
	VioConnect*& b1 = new VioConnect();
	CONNECT* const& a1 = b1;

	//根本原因
	CONNECT* new_connect_h = new VioConnect();
	//VioConnect* v2 = new CONNECT();// error
}
```

解决方法总结,改写函数 CONNECT::set:
```C++
class CONNECT {
public:
	void set(CONNECT* const &){}
};
class VioConnect :public CONNECT {};
```

### 外部变量和静态变量


### String hash Code 选取 31 的理由

* hash 算法中选取 31 是因为其是一个特殊的质数,可以降低哈希算法的冲突率
* 31、37、41 这三个不大不小的质数，表现都不错，冲突数都低于7个
* 质数 101 和 199 表现的也很不错，冲突率很低,但是容易溢出，认为他们不是哈希算法的优选乘子

```C++
static unsigned stringHashFunction(void const* ptr, size_t size)
{
    unsigned h;
    byte* key = (byte*)ptr;
    int keylen = (int)size;
    for (h = 0; --keylen >= 0; h = h*31 + *key++);
    return h;
}
```

名著 《Effective Java》第 42 页就有对 hashCode 为什么采用 31 做了说明：

之所以使用 31， 是因为他是一个奇素数。如果乘数是偶数，并且乘法溢出的话，信息就会丢失，因为与2相乘等价于移位运算（低位补0）。使用素数的好处并不很明显，但是习惯上使用素数来计算散列结果。 31 有个很好的性能，即用移位和减法来代替乘法，可以得到更好的性能： 31 * i == (i << 5）- i， 现代的 VM 可以自动完成这种优化。这个公式可以很简单的推导出来。

所谓素数：质数又称素数，指在一个大于1的自然数中，除了1和此整数自身外，没法被其他自然数整除的数。

素数在使用的时候有一个作用就是，如果我用一个数字来乘以这个素数，那么最终的出来的结果只能被素数本身和被乘数还有1来整除！如：我们选择素数3来做系数，那么3*n只能被3和n或者1来整除，我们可以很容易的通过3n来计算出这个n来。这应该也是一个原因！

HashMap在存储数据计算hash地址的时候，我们希望尽量减少有同样的hash地址，所谓“Hash冲突”。如果使用相同hash地址的数据过多，那么这些数据所组成的hash链就更长，从而降低了查询效率！所以在选择系数的时候要选择尽量长的系数并且让乘法尽量不要溢出的系数，因为如果计算出来的hash地址越大，所

谓的“冲突”就越少，查找起来效率也会提高。

31可以由31 * i ==  (i << 5) - i来表示，现在很多虚拟机里面都有做相关优化，使用31的原因可能是为了更好的分配hash地址，并且31只占用5bits！在java乘法中如果数字相乘过大会导致溢出的问题，从而导致数据的丢失，而31则是素数（质数）而且不是很长的数字，最终它被选择为相乘的系数的原因。

可以看到，使用 31 最主要的还是为了性能。

[科普：为什么 String hashCode 方法选择数字31作为乘子](https://segmentfault.com/a/1190000010799123)
[hashCode 为什么乘以 31？深入理解 hashCode 和 hash 算法](https://blog.csdn.net/mxw2552261/article/details/91349677)

### 字节对齐

首先要知道字长模型。
这 3 个 64 位模型（LP64、LLP64 和 ILP64）之间的区别在于非浮点数据类型。当一个或多个 C 数据类型的宽度从一种模型变换成另外一种模型时，应用程序可能会受到很多方面的影响。这些影响主要可以分为两类：
1. 数据对象的大小。编译器按照自然边界对数据类型进行对齐；换而言之，32 位的数据类型在 64 位系统上要按照 32 位边界进行对齐，而 64 位的数据类型在 64 位系统上则要按照 64 位边界进行对齐。这意味着诸如结构或联合之类的数据对象的大小在 32 位和 64 位系统上是不同的。
2. 基本数据类型的大小。通常关于基本数据类型之间关系的假设在 64 位数据模型上都已经无效了。依赖于这些关系的应用程序在 64 位平台上编译也会失败。例如，sizeof (int) = sizeof (long) = sizeof (pointer) 的假设对于 ILP32 数据模型有效，但是对于其他数据模型就无效了。
总之，编译器要按照自然边界对数据类型进行对齐，这意味着编译器会进行 “填充”，从而强制进行这种方式的对齐，就像是在 C 结构和联合中所做的一样。结构或联合的成员是根据最宽的成员进行对齐的。

```C++
#pragma pack(push)
#pragma pack(8)
struct ProtecolNet1
{

};
#pragma pack(pop)
```

### 字长模型

Data Type|ILP32|LP32|ILP64|LP64|LLP64
|:-:|:-:|:-:|:-:|:-:|:-:|
宏定义|  _  |  _  |  _  |__LP64__|__LLP64__
平台|Win32 API / Unix 和 Unix 类的系统 （Linux，Mac OS X）|Win16 API| |Unix 和 Unix 类的系统 （Linux，Mac OS X)|Win64 API
char|8|8|8|8|8
short|16|16|16|16|16
int|32|32|64|32|32
long|32|32|64|64|32
long long|64|64|64|64|64
pointer|32|32|64|64|64

在这张表中，LP64，ILP64，LLP64是64位平台上的字长模型，ILP32和LP32是32位平台上的字长模型。
LP64意思是long和pointer是64位，
ILP64指int，long，pointer是64位，
LLP64指long long和pointer是64-bit的。
ILP32指int，long和pointer是32位的，
LP32指long和pointer是32位的。

### out_of_range

### new 和 malloc 区别

首先，new分配的是一个结构体或者类，而 malloc 分配的是一个动态分配内存。所以 new 更清楚边界问题，更安全一些。

new 从 自由存储区(free store)上进行动态分配内存，
malloc 从 堆(heap)上进行动态分配内存。

[参考连接](https://blog.csdn.net/linux_ever/article/details/50533149)

### Binary-safe

Binary-safe is a computer programming term mainly used in connection with string manipulating functions. A binary-safe function is essentially one that treats its input as a raw stream of data without any specific format. It should thus work with all 256 possible values that a character can take (assuming 8-bit characters).

### 不同头文件之间的类的引用

首先，两个头文件之间相互引用如果没有使用到各自定义的类是合法的。
但如果想要使用各自的类，那么无需互相引用，只需在被引用头文件中声明类，并且在该头文件的类中只允许使用指针。

例如：
```C++  A.h
class B;

class A{
    B* b1;
}
```

```C++  B.h
#include "A.h"

class B{}
```


### 链接器工具错误 LNK2005

如果在标头文件中的类声明外部定义成员函数，也可能发生此错误：

```C++
// LNK2005_member_outside.h
class Sample {
public:
    int sample_function(int);
};
int Sample::sample_function(int k) { return 42 * (k % 167); }  // LNK2005
```

若要解决此问题，请将成员函数定义移动到类中。 类声明内定义的成员函数是隐式内联的。

```C++
// LNK2005_member_inline.h
class Sample {
public:
    int sample_function(int k) { return 42 * (k % 167); }
};
```

### 函数返回值

首先是关于类内数据的获取方式，直接通过类获取和通过get函数进行返回之间的区别。

* 返回值：返回任意类型的数据类型，会将返回数据做一个拷贝（副本）赋值给变量；由于需要拷贝，所以对于复杂对象这种方式效率比较低（调用对象的拷贝构造函数、析构函数）；例如：int test(){}或者 Point test(){}
* 返回指针：返回一个指针，也叫指针类型的函数，在返回时只拷贝地址，对于对象不会调用拷贝构造函数和析构函数；例如：int *test(){} 或者 Point *test(){}
* 返回引用：返回一个引用，也叫引用类型的函数，在返回时只拷贝地址，对于对象不会调用拷贝构造函数和析构函数；例如：int &test(){}或者 Point &test(){}

### 不定参数写法

1. 如果所有类型相同，则直接使用指针进行数据承载。
2. 使用标准库<stdarg.h>， 使用va_list进行承载。
3. 使用Boost::format直接格式化字符串。

### C++类的六个默认成员函数

构造函数
析构函数
拷贝构造函数
赋值运算符重载
const
&及const &重载

```C++
class A
{
public:
    A();//构造函数
    A(const A& a);//拷贝构造函数
    ~A();//析构函数
    A& operator=(const A& a);//赋值运算符重载
    A* operator &();//取地址运算符重载
    const A* operator &() const;//const修饰的取地址运算符重载
};
```

### 关于Lib和DLL

详细见文《Lib和DLL详解》

### extern "C"

extern "C"的主要作用就是为了能够正确实现C++代码调用其他C语言代码。`加上extern "C"后，会指示编译器这部分代码按C语言的进行编译，而不是C++的`。

由于C++支持函数重载，因此编译器编译函数的过程中会将函数的参数类型也加到编译后的代码中，而不仅仅是函数名；而C语言并不支持函数重载，因此编译C语言代码的函数时不会带上函数的参数类型，一般只包括函数名。

### C extern用法

extern int a;
说明了a的存储空间是在程序的其他地方分配的，在文件中其他位置或者其他文件中寻找a这个变量

用法
一个c文件需要调用另一个c文件里的变量或者函数，而不能从.h文件中调用变量。
extern int a = 5与int a = 5意义是一样的，都是定义。而extern int a;是声明。但会产生一条警告。
对于函数而言，和引用变量是一样的，如果需要调用其他.c文件中的函数，在文件中的函数声明前加extern即可，不加extern而直接声明函数也可以，因为声明全局函数默认前面带有extern。
如果不想让其他.c文件引用本文件中的变量，加上static即可。

使用extern关键字来声明变量为外部变量。

### 字符集

在VS中项目[配置属性] - [高级] - [字符集]中可以配置属性。
有两种常用的分别是宽字符集(Unicode)和多字节字符(ANSI)集。

#### 多字节字符集

[ASCII字符集]，使用7bits来表示一个字符，可表示128个字符。之后，使用8bits表示一个字符，可以表示256个字符，主要在原来的7 bits字符集的基础上加入了一些特殊符号。
[ANSI字符集] 各个国家在ASCII基础上制定的扩展性新编码，这些从ANSI标准派生的字符集被习惯的统称为ANSI字符集，正式的名称是`MBCS(Multi-Byte Chactacter System，即多字节字符系统)`。
这些派生字符集的特点是以ASCII 127 bits为基础，兼容ASCII 127，他们使用大于128的编码作为一个 Leading Byte ，紧跟在 Leading Byte 后的第二(甚至第三)个字符与 Leading Byte一起作为实际的编码。这样的字符集有很多，我们常见的GB-2312就是其中之一。

#### 宽字节字符

Unicode的学名 是"Universal Multiple-Octet Coded Character Set"，简称为UCS。UCS可以看作是"Unicode Character Set"的缩写。UCS只是规定如何编码，并没有规定如何传输、保存这个编码。UTF是“UCS Transformation Format”的缩写。

[Unicode字符集]有多种编码形式，它固定使用16 bits(两个字节、一个字)来表示一个字符，共可以表示65536个字符。将世界上几乎所有语言的常用字符收录其中，方便了信息交流。`标准的Unicode称为UTF-16`。后来为了双字节的Unicode能够在现存的处理单字节的系统上正确传输，出现了`UTF-8`(注意UTF-8是编码，它属于Unicode字符集)，使用类似MBCS的方式对Unicode进行编码。UTF-8以字节为编码单元，没有字节序的问题。UTF-16以两个字节为编码单元。

UTF-16包括三种：UTF-16，UTF-16BE(Big Endian)，UTF-16LE(Little Endian)，UTF-16 需要通过在文件开头以名为 BOM(Byte Order Mark) 的字符来表明文件是 Big Endian 还是 Little Endian。Unicode 规范中推荐的标记字节顺序的方法是 BOM(Byte Order Mark) 。在UCS编码中有一个叫做"ZERO WIDTH NO-BREAK SPACE"的字符，它的编码是FEFF。而FFFE在UCS中是不存在的字符，所以不应该出现在实际传输中。UCS规范建议我们在传输字节流前，先传输字符"ZERO WIDTH NO-BREAK SPACE"。这样如果接收者收到FEFF，就表明这个字节流是Big-Endian的；如果收到FFFE，就表明这个字节流是Little-Endian的。因此字符"ZERO WIDTH NO-BREAK SPACE"又被称作BOM。

UTF-8不需要BOM来表明字节顺序，但可以用BOM来表明编码方式。字符"ZERO WIDTH NO-BREAK SPACE"的UTF-8编码是EF BB BF(读者可以用我们前面介绍的编码方法验证一下)。所以如果接收者收到以EF BB BF开头的字节流，就知道这是UTF-8编码了。

Windows就是使用BOM来标记文本文件的编码方式的。

L是用来标志一个字符(串)为宽字符(串)，当你在VS2005以上版本的IDE工作时，可以选择工作于这两种不同的编码方式下，而在Unicode方式下，则要对字符(串)常量前添加L来告诉编译器它是宽字符。MS为我们定义了好几个相关的宏：_T(定义于tchar.h)、_TEXT(同样定义于tchar.h)。

对于为什么使用Unicode？(以下引自《windows核心编程》)
开发应用程序的时候，强烈建议你使用Unicode字符和字符串，理由如下：
* Unicode使程序的本地化变得更容易；
* 使用Unicode，只需发布一个二进制(.exe或DLL)文件，即可支持所有语言；
* Unicode代码执行速度更快，占用内存更少，提升了应用程序的效率。自从Windows2K开始，Win的系统内核开始完全支持并完全应用Unicode编写，所有ANSI字符在进入底层前，都会被相应的API转换成Unicode。所以，如果你一开始就使用Unicode，则可以减少转换的用时和RAM开销。
* 使用Unicode，应用程序能轻松调用所有不反对使用(nondeprecated)的Windows函数，因为一些Windows函数提供了只能处理Unicode字符和字符串的版本；
* 使用Unicode，代码很容易与COM集成(后者要求使用Unicode字符和字符串)；
* 使用Unicode，代码很容易与.NET Framework集成(后者要要求使用Unicode字符和字符串)；
* 使用Unicode，能保证代码能够轻松操纵你自己的资源(其中的字符串总是Unicode的)；
* 世界上大多数程序用的字符集都是Unicode，Unicode有利于程序国际化和标准化；

BOM头：
BOM是用来判断文本文件是哪一种Unicode编码的标记，其本身是一个Unicode字符（"\uFEFF"），位于文本文件头部。

虽然BOM字符起到了标记文件编码的作用但是他并不属于文件的内容部分，所以会产生一些问题：
1. 在某些使用场景下就会有问题。例如我们把几个JS文件合并成一个文件后，如果文件中间含有BOM字符，就会导致浏览器JS语法错误。
2. PHP就不能识别bom头，PHP并不会忽略BOM，所以在读取、包含或者引用这些文件时，会把BOM作为该文件开头正文的一部分。根据嵌入式语言的特点，这串字符将被直接执行（显示）出来。由此造成即使页面的 top padding 设置为0，也无法让整个网页紧贴浏览器顶部，因为在html一开头有这3个字符

### 长连接和短连接

在HTTP/1.0中默认使用短连接。也就是说，客户端和服务器每进行一次HTTP操作，就建立一次连接，任务结束就中断连接。当客户端浏览器访问的某个HTML或其他类型的Web页中包含有其他的Web资源(如JavaScript文件、图像文件、CSS文件等)，每遇到这样一个Web资源，浏览器就会重新建立一个HTTP会话。

而从HTTP/1.1起，默认使用长连接，用以保持连接特性。使用长连接的HTTP协议，会在响应头加入这行代码：

    Connection:keep-alive

在使用长连接的情况下，当一个网页打开完成后，客户端和服务器之间用于传输HTTP数据的TCP连接不会关闭，客户端再次访问这个服务器时，会继续使用这一条已经建立的连接。Keep-Alive不会永久保持连接，它有一个保持时间，可以在不同的服务器软件(如Apache)中设定这个时间。实现长连接需要客户端和服务端都支持长连接。

HTTP协议的长连接和短连接，实质上是TCP协议的长连接和短连接。

### `#pragma pack()`用法

`#pragma pack` 的主要作用就是改变编译器的内存对齐方式，这个指令在网络报文的处理中有着重要的作用，`#pragma pack(n)`是他最基本的用法，其作用是改变编译器的对齐方式， 不使用这条指令的情况下，编译器默认采取`#pragma pack(8)`也就是8字节的默认对齐方式，n值可以取(1, 2, 4, 8, 16) 中任意一值。

单纯使用#pragma pack(push)会将当前的对齐字节数压入栈顶，并设置这个值为新的对齐字节数， 就是说不会改变这个值。
而使用#pragma pack(push, n) 会将当前的对齐字节数压入栈顶，并设置n为新的对齐字节数。
再就是这个#pragma pack(push, identifier [, n])会在上面的操作基础上为这个对齐字节数附上一个标识符， 这里注意这个标识符只能以($、_、字母)开始， 标识符中可以有($、_、字母、数字)，并且标识符不能是关键字(push， pop可以作为标识符)。这个标识符的作用我会在pop中详细介绍。

同样单纯使用#pragma pack(pop)会弹出栈顶对齐字节数，并设置其为新的内存对齐字节数。
使用#pragma pack(pop, n)情况就不同了， 他会弹出栈顶并直接丢弃，设置n为其新的内存对齐字节数。

#pragma pack(pop, identifier [, n])较为复杂，编译器执行这条执行时会从栈顶向下顺序查找匹配的identifier，找到identifier相同的这个数之后将从栈顶到identifier，包括找到identifier全部pop弹出， 若没有找到则不进行任何操作。

[参考连接](https://www.jianshu.com/p/d994731f658d)

### #和##运算符

#: 构串操作符
`#`只能修饰带参数的宏的形参，它将实参的字符序列(而不是实参代表的值)转换成字符串常量，允许拼接。

```C++
//构串操作符
#define STRING(x) #x
#define TEST_O_1(x) #x"bc"
#define TEXT(x) "class"#x"Info"

int abc = 100;
cout << STRING(abc) << endl << TEXT(abc) << endl << STRING("abc") 
    << endl << TEST_O_1(aajsivnoiuqhoer)//支持此类定义
    << endl;
```

##: 合并操作符
`##`将出现在其左右的字符序列合并成一个新的标识符。
注意：
使用合并操作符##时，自身的标识符必须预先有定义，否则编译器会报“标识符未定义”的编译错误。
字符序列合并成新的标识符不是字符串。
该标识符体现为变量名。

```C++
//合并操作符
#define DATA_VALUE(name) REV_##name
#define MERGE(x,y,z) x##y##z

int REV_AIS = 2766;
int REV_GPS = 2598;
char AIS_rev[25] = "20210730";
cout << DATA_VALUE(AIS)
    << endl << DATA_VALUE(GPS)
    << endl << MERGE(AIS, _, rev)
    << endl;
```

### calloc()函数

分配内存空间并初始化

头文件：#include <stdlib.h>

calloc() 函数用来动态地分配内存空间并初始化为 0，其原型为：
    void* calloc (size_t num, size_t size);

calloc() 在内存中动态地分配 num 个长度为 size 的连续空间，并将每一个字节都初始化为 0。所以它的结果是分配了 num*size 个字节长度的内存空间，并且每个字节的值都是0。


### 适应多个参数的结构体/类初始化

主要是通过默认参数实现。

```C++
aeci_struct_descriptor(
    char const* struct_name_ = NULL,
    char const* refTableName_ = NULL,
    aeci_struct_descriptor* structField_ = NULL,
    char const* structArrayTypeName_ = NULL
)
{
    struct_name = struct_name_;
    refTableName = refTableName_;
    structField = structField_;
    structArrayTypeName = structArrayTypeName_;
}
```

### fd_set 

select()机制中提供 fd_set 的数据结构，实际上是一个 long 类型的数组，每一个数组元素都能与一打开的文件句柄(不管是socket句柄，还是其他文件或命名管道或设备句柄)建立联系，建立联系的工作由程序员完成，当调用select()时，由内核根据IO状态修改fd_set的内容，由此来通知执行了select()的进程哪一socket或文件发生了可读或可写事件.

	#include<winsock.h>

### 函数fcntl

fcntl系统调用可以用来对已打开的文件描述符进行各种控制操作以改变已打开文件的的各种属性

### __stdcall，__cdecl，__pascal，__fastcall的区别

_cdecl
__cdecl 是 C Declaration  的缩写，表示 C 语言默认的函数调用方法：所有参数从右到左依次入栈，这些参数由调用者清除，称为手动清栈。被调用函数不会要求调用者传递多少参数，调用者传递过多或者过少的参数，甚至完全不同的参数都不会产生编译阶段的错误。

__stdcall
__stdcall 是 Standard Call 的缩写，是 C++ 的标准调用方式：所有参数从右到左依次入栈，如果是调用类成员的话，最后一个入栈的是 this 指针。这些堆栈中的参数由被调用的函数在返回后清除，使用的指令是 retnX，X 表示参数占用的字节数，CPU 在 ret 之后自动弹出 X 个字节的堆栈空间，称为自动清栈。函数在编译的时候就必须确定参数个数，并且调用者必须严格的控制参数的生成，不能多，不能少，否则返回后会出错。

__pascal
__pascal 是 Pascal 语言（Delphi）的函数调用方式，也可以在 C/C++ 中使用，参数压栈顺序与前两者相反。返回时的清栈方式与 __stdcall 相同。

__fastcall
__fastcall 是编译器指定的快速调用方式。由于大多数的函数参数个数很少，使用堆栈传递比较费时。因此 __fastcall 通常规定将前两个（或若干个）参数由寄存器传递，其余参数还是通过堆栈传递。不同编译器编译的程序规定的寄存器不同，返回方式和 __stdcall 相当。

__thiscall
__thiscall 是为了解决类成员调用中 this 指针传递而规定的。__thiscall 要求把 this 指针放在特定寄存器中，该寄存器由编译器决定。VC 使用 ecx，Borland 的 C++ 编译器使用 eax。返回方式和 __stdcall 相当。

### ExitThread TerminateProcess ExitProcess

TerminateProcess()是异步执行的，在调用返回后并不能确定被终止进程是否已经真的退出，如果调用TerminateProcess()的进程对此细节关心，可以通过WaitForSingleObject()来等待进程的真正结束。

Windows下return，exit和ExitProcess的区别和分析
采用return来结束进程可以正确的析构全局和局部对象。而采用exit()来结束进程时全局对象可以正确析构，但局部对象没有正确析构。采用ExitProcess(0)结束时全局和局部对象都没有正确析构。

在Windows下，return 0 的实际执行过程是： 

1. 先析构main函数内的局部对象。
2. 返回至调用main的函数。
3. 调用exit函数，由exit函数调用doexit函数，在doexit函数中完成对全局对象的析构。
4. 最后调用ExitProcess结束进程。

所以，ExitProcess不负责任何对象的析构，exit只负责析构全局对象，return 0可以析构局部对象并调用exit，因此能析构全部对象。

### 非阻塞输入

### enum的遍历和toString

```C++
	enum shell_command {
		com_beg = 0,
		show,
		restart,
		com_end
	};
	enum shell_command i;
	for (i = com_beg; i <= com_end; i = (shell_command)(i+1) ) {
		printf("%d " , i);
	}
	return 1; 
```

### 文件读写

在文件中间进行读写。覆盖和追加。

### 管道Pipe

```C++
BOOL WINAPI CreatePipe(
  _Out_     PHANDLE hReadPipe,
  _Out_     PHANDLE hWritePipe,
  _In_opt_  LPSECURITY_ATTRIBUTES lpPipeAttributes,
  _In_      DWORD nSize
);
```

用于父进程与子进程间的通信时，主要使用继承的方式。
子进程通过设置，bInheritHandles为TRUE。并且CreatePipe设置SECURITY_ATTRIBUTES saAttr.bInheritHandle = TRUE; ，实现一整套继承体系。

WriteFile 和ReadFile 用于此类的读和写。

::: info
bInheritHandles
如果此参数为 TRUE，则调用进程中的每个可继承句柄都由新进程继承。如果参数为 FALSE，则不继承句柄。请注意，继承的句柄与原始句柄具有相同的值和访问权限。有关可继承句柄的其他讨论，请参阅备注。
终端服务：  您不能跨会话继承句柄。此外，如果此参数为 TRUE，则您必须在与调用方相同的会话中创建进程。
:::

### 线程与进程问题

查看另一篇文档<线程与进程管理>

### 函数char*参数改变指针内容

函数使用`char * &p`或者`char **p`的方式实现。直接传递指针，指针也是作为形参传递的，使用malloc并不会改变指针指向。

```C++
int shell_1(char * &p) {

	char* q = (char*)malloc(sizeof(char)*25);
	q = "12341251261";

	cout << "shell_1 : " << p << " , " << &p << endl;

	return 1;
}
```

### 异常处理

C语言中的异常处理，setjmp()函数与longjmp()函数。

C++中的异常处理，try catch。
但是无法处理使用空指针，除数为零的情况。

C++中可以处理的异常：
异常名称|说  明
|:-:|:-|
logic_error|逻辑错误。
runtime_error|运行时错误。
bad_alloc|使用 new 或 new[ ] 分配内存失败时抛出的异常。
bad_typeid|使用 typeid 操作一个 NULL 指针，而且该指针是带有虚函数的类，这时抛出 bad_typeid 异常。
bad_cast|使用 dynamic_cast 转换失败时抛出的异常。
ios_base::failure|io 过程中出现的异常。
bad_exception|这是个特殊的异常，如果函数的异常列表里声明了 bad_exception 异常，当函数内部抛出了异常列表中没有的异常时，如果调用的 unexpected() 函数中抛出了异常，不论什么类型，都会被替换为 bad_exception 类型。
 
 logic_error 的派生类： 
异常名称|说  明
|:-:|:-|
length_error|试图生成一个超出该类型最大长度的对象时抛出该异常，例如 vector 的 resize 操作。
domain_error|参数的值域错误，主要用在数学函数中，例如使用一个负值调用只能操作非负数的函数。
out_of_range|超出有效范围。
invalid_argument|参数不合适。在标准库中，当利用string对象构造 bitset 时，而 string 中的字符不是 0 或1 的时候，抛出该异常。
runtime_error 的派生类： 
异常名称|说  明
|:-:|:-|
range_error|计算结果超出了有意义的值域范围。
overflow_error|算术计算上溢。
underflow_error|算术计算下溢。

### LPCTSTR

L表示long指针 这是为了兼容Windows 3.1等16位操作系统遗留下来的，在win32中以及其他的32位操作系统中， long指针和near指针及far修饰符都是为了兼容的作用。没有实际意义。
P表示这是一个指针
C表示是一个常量
T表示在Win32环境中， 有一个_T宏
STR表示这个变量是一个字符串

### 远程执行windows server中的程序

使用工具psexec，需要开启ipc\$和admin\$。未试验成功。
其中注意PIN与password的区别。

### char 和 unsigned char 

int 和unsigned int 好理解，一个是有符号位，一个是没有符号位，两者能表示的数据范围都是一样的。
同理，ASCII码中，有效位数是[0, 127]，最高位可用于作为奇偶校验。双字节标识中文时，使用了负数范围。
一般情况下，使用正数 [0, 127]， unsigned和signed没有什么区别，但是在转换为int的时候，如果是signed ， 那么因为补码负数将会在高位补1，进行扩展。
但是如果时unsigned，即使时负数，也不会进行扩展，仍然补0。

### 关于使用char 转成int型

#### 1. 异或法，范围与int型同

最初的想法是直接通过位移的方式进行低位换算，存到char中；接收之后转换同理。
1. strcat，会将'\0'的数直接代替。出现位数遗失，即截断， char型不完整。
	解决方式，使用异或^，并且从1开始。解决该问题。这样就可以减少0的次数。
2. 异或之后，反转的时候一直出现错误，想来可能是补码和原码的问题。一直纠结。也看不到二进制数。
	最后才想到使用`十六进制`输出来查看。
	查看之后才发现，异或的时候数据类型已经进行了改变。取出的是1字节，但是已经转换成int， 所以前三个字节也进行了异或？
	该方法计数，从127，之后就是-128，7f到7e，
3. 重新梳理一下，我想要找到什么：第一，buffer[i]从开头开始，发生了什么变化；第二，buffer[i]转换后变成了什么。一律使用hex查看。发现，buffer[i]变化的过程接收到的是ffffff80的80，到7e的7e。都是没有经过异或的。所以有时候高位是1，但是有时候高位却是在补0。
3. 其实这就是原码的问题，原码整数不变，但是x的复数是$2^{n}-x$。所以才会有高位补1的情况。唯一方法是进行高位取0。先和0x80000ff相与，去除高位。
最后再和下一位buffer[i++]相或。最后得到的整体数据与0xffffffff进行异或。取出数据。
4. 仍然存在截断问题。只是截断的频率变低。
5. 直接使用memcpy,空间直接拷贝,不用担心截断问题.

```C++
//异或代码
int buffer_fetch(char* buffer) {
	int count = 0;
	for (int i = 0;i < 4;i++) {
		cout <<dec << (int)(buffer[i]) << endl;
		cout <<hex << (int)(buffer[i]) << endl;
		cout <<dec << (int)(buffer[i] ^ 0xff) << endl;
		cout <<hex << (int)(buffer[i] ^ 0xff) << endl;
		count += (buffer[i] ^ 0xffffffff) << (i * 8);
		cout <<dec << (int)((buffer[i] ^ 0xff) << (i * 8)) << endl;
		cout <<hex << (int)((buffer[i] ^ 0xff) << (i * 8)) << endl;
		cout << endl;
	}

	cout << "count | " << count << endl;
	return 1;
}

int main() {
	char buffer[4] = { 0 };

	int count = 1;

	for (int i = 0;i < 4;i++) {
		buffer[i] = count >> (i * 8) ^ 0xFF;
		cout << "Count | " <<hex << (count >> (i * 8) ^ 0xFF) <<dec << endl;
		cout << "Count | " << (count >> (i * 8)) << endl;
	}

	cout << "buffer | " << buffer << endl;
	cout << "++++++++++++++++++++++++++++++++++++++++++++++" << endl;
	buffer_fetch(buffer);
}
```

#### 2. memcpy进行空间复制

```C++
//编码，不会出现截断，可以发送'\0'字符串。
	char tmp[40] = { 0 };
	memcpy(tmp, &count, 4);
	memcpy(&tmp[4], "$--VHW,2.2,T,3.endl\0" , 20);
//完全没有问题，但是怀疑sendto函数是否可以符合
	memcpy(&count, buffer, 4);
	cout << count << endl;
	for (int i = 0;i < 20;i++) { 
		cout << i << " : " << buffer[i] << endl;
	}
```

这三种方法毫无疑问,memcpy是最直接效率最高的。异或的方法可以做为加密的遗留。ASCII码存储没什么参考性，要扩展上限需要通过标识符切割获取更大的数据。

#### 3. 存储ASCII码，范围9999

逐步设置代码：

```C++
//编码，因为幂运算pow函数对math.h的依赖，自编程需要额外函数，故直接转换。
	data[3] = count % 10 + 48;
	data[2] = count/10 % 10 + 48;
	data[1] = count/100 % 10 + 48;
	data[0] = count/1000 % 10 + 48;
//解码，直接使用atoi函数。
	char* tmp = (char*)malloc(sizeof(int));
	count = atoi(strncpy( tmp, buffer, 4));
```

### 三目运算符

有些地方需要三目运算符 `:` 的两边具有相同的返回值.
比如:
```C++
(0 != mode) ? generateString(dest + current_len, rand_len) : NULL;
```

其中, generateString 返回值为 void, 那么该处将报错, 如果采用逗号分割符进行返回最后一个语句, 则有如下写法:

```C++
(0 != mode) ? (generateString(dest + current_len, rand_len), NULL) : NULL;
```

### C++ cout利用控制符dec、hex和oct，分别输出十进制、十六进制和八进制显示整数

### strcat()

该函数查找到第一个为'\0'的字符，并且从该字符开始将参数二复制到该字符串中。

### int64

### c++中的c_str()用法

c_str()函数返回一个指向正规C字符串的指针, 内容与本string串相同.
这是为了与c语言兼容，在c语言中没有string类型，故必须通过string类对象的成员函数c_str()把string 对象转换成c中的字符串样式。
返回之后最好使用strcpy，因为string对象会被析构。

### atof()

atof()是C 语言标准库中的一个字符串处理函数，功能是把字符串转换成浮点数，所使用的头文件为<stdlib.h>。该函数名是 “ascii to floating point numbers” 的缩写。语法格式为：
	double atof(const char *nptr);

### itoa()

	char* itoa(int value,char*string,int radix);//value: 要转换的整数，string: 转换后的字符串,radix: 转换进制数，如2,8,10,16 进制等。

### 获取指针所指向的地址中的空间大小

aeci_field_descriptor： 结构体
ais_descriptor：结构体变量
descriptor：aeci_field_descriptor*

	int tmp = sizeof(ais_descriptor);//1100
	int tmp2 = sizeof(aeci_field_descriptor);//440
	des_size = sizeof((*descriptor));//440

无论指针在什么地方指向结构体变量，测量出来的值仍然是该结构体的长度。如果结构体中带有指针并且赋值，那么实际的长度会大于结构体的“表面”大小。

其中sizeof是编译阶段完成的。

### 迭代器 iterator

两种方式
set:

```C++
#include <bits/stdc++.h>
using namespace std;
int main()
{
	set <int> s;
	s.insert(5);
	s.insert(7);
	set<int>::iterator it;
	for(it = s.begin(); it != s.end(); it++)
		cout << *it << endl;
	cout << "容器中第一个元素是：" << *s.begin() << endl;
	cout << "容器中最后一个元素是：" << *(--s.end()) << endl;
}
```

vector:

```C++
#include <bits/stdc++.h>
using namespace std;
int main()
{
	vector <int> v;
	v.push_back(5);
	v.push_back(7);
	vector<int>::iterator it;
	for(it = v.begin(); it != v.end(); it++)
		cout << *it << endl;
	cout << "容器中第一个元素是：" << *v.begin() << endl;
	cout << "容器中最后一个元素是：" << *(--v.end()) << endl;
}
```

[摘自](https://blog.csdn.net/gjs935219/article/details/81609746)

### assert()函数

作用是如果它的条件返回错误，则终止程序执行

	#include <assert.h>
	void assert( int expression );

assert的作用是先计算表达式 expression ，如果其值为假(即为0)，那么它先向stderr打印一条出错信息，然后通过调用 abort 来终止程序运行。

### ispunct()


	int ispunct(int c) 
检查所传的字符是否是标点符号字符。标点符号字符可以是非字母数字(正如 isalnum 中的一样)的任意图形字符(正如 isgraph 中的一样)

C 标准库的 ctype.h 头文件提供了一些函数，可用于测试和映射字符。
这些函数接受 int 作为参数，它的值必须是 EOF 或表示为一个无符号字符。
如果参数 c 满足描述的条件，则这些函数返回非零(true)。如果参数 c 不满足描述的条件，则这些函数返回零。

### assign()

C++ string assign()赋值常用方法

函数assign()常用在给string类变量赋值.

常用方法有:
1. 直接用另一个字符串赋值.
如str2.assign(str1);即用str1给str2赋值.
2. 用另一个字符串的一个子串赋值
如str3.assign(str1, 2, 3);
3. 用一个字符串的前一段子串赋值;
如str4.assign("World", 5);
4. 用几个相同的字符,赋值.
如str5.assign(10, 'c');

###  string c_str()和data()

const char* c_str ( ) const;
Get C string equivalent
Generates a null-terminated sequence of characters (c-string) with the same content as the string object and returns it as a pointer to an array of characters.
A terminating null character is automatically appended.

const char* data() const;
Get string data
Returns a pointer to an array of characters with the same content as the string.
Notice that no terminating null character is appended (see member c_str for such a functionality).

第一点：c_str()字符串后有'\0'，而data()没有。
第二点： data 能解决 string 串中 包含 '\0' 情况的问题。结合size 方法就能随意访问返回的数据了.  注意他返回的是array 数组.

### menset()

    void *memset(void *s, int ch, size_t n)

函数说明：将s中前n个字节 (typedef unsigned int size_t )用 ch 替换并返回 s 。
经典的置空函数。其中s可以是char* ，也可以是数组，可以是字符串。

### __stdcall

__stdcall是函数调用约定的一种，函数调用约定主要约束了两件事：
1.参数传递顺序
2.调用堆栈由谁(调用函数或被调用函数)清理
常见的函数调用约定：stdcall cdecl fastcall thiscall naked call
__stdcall表示
1.参数从右向左压入堆栈
2.函数被调用者修改堆栈
3.函数名(在编译器这个层次)自动加前导的下划线，后面紧跟一个@符号，其后紧跟着参数的尺寸
在win32应用程序里,宏APIENTRY，WINAPI，都表示_stdcall，非常常见。

### 不固定函数参数`int test(void* x,...)`

```C++
#include 〈stdarg.h〉\\头文件
int demo( char, ... );
void main( void )
{   
　　demo("DEMO", "This", "is", "a", "demo!", "");
}
/*ANSI标准形式的声明方式，括号内的省略号表示可选参数*/
int demo( char msg, ... )
{       
　　/*定义保存函数参数的结构*/   
　　va_list argp;   
　　int argno = 0;   
　　char para; 　　   /*argp指向传入的第一个可选参数，msg是最后一个确定的参数*/   
　　va_start( argp, msg );   
　　while (1)       
　　{        
　　　　para = va_arg( argp, char);
　　　　if ( strcmp( para, "") == 0 )               
    　　　　break;
　　　　printf("Parameter #%d is: %s\n", argno, para);           
　　　　argno++;
　　}
　　va_end( argp ); /*将argp置为NULL*/
　　return 0;
}
```

### C/C++中near和far的区别

 near关键字创建一个指向可寻址内存低端部分的目标指针。这些指针占用内存的单一字节，并且他们能够指向的内存单元被限制到256个位置，通常是在 0x0000~0x00ff范围中。

      int near * ptr；

      far关键字创建一个能够指向内存中任何数据的指针：

      char far * ptr；

  near   (近)指针：16位段内偏移地址    

  far(远)指针：16位段地址＋16位段内偏移地址    

  huge(巨)指针：32位规格化的具有唯一性的内存地址  

### 时间获取

三种时间计算方法

#### gettimeofday | 微秒(1e-6 s)量级

Linux下的方法。

头文件：#include <sys/time.h>    #include <unistd.h>
定义函数：int gettimeofday (struct timeval * tv, struct timezone * tz);
函数说明：gettimeofday()会把目前的时间有tv 所指的结构返回，当地时区的信息则放到tz 所指的结构中。

timeval 结构定义为：

    struct timeval{
        long tv_sec;  //秒
        long tv_usec;  //微秒
    };

timezone 结构定义为：

    struct timezone
    {
        int tz_minuteswest;  //和Greenwich 时间差了多少分钟
        int tz_dsttime;  //日光节约时间的状态
    };

上述两个结构都定义在/usr/include/sys/time.h. tz_dsttime 所代表的状态如下

    DST_NONE  //不使用
    DST_USA  //美国
    DST_AUST  //澳洲
    DST_WET  //西欧
    DST_MET  //中欧
    DST_EET  //东欧
    DST_CAN  //加拿大
    DST_GB  //大不列颠
    DST_RUM  //罗马尼亚
    DST_TUR  //土耳其
    DST_AUSTALT  //澳洲(1986 年以后)

```C++
#include <sys/time.h>
#include <unistd.h>
main(){
    struct timeval tv;
    struct timezone tz;
    gettimeofday (&tv, &tz);
    printf("tv_sec; %d\n", tv.tv_sec);
    printf("tv_usec; %d\n", tv.tv_usec);
    printf("tz_minuteswest; %d\n", tz.tz_minuteswest);
    printf("tz_dsttime, %d\n", tz.tz_dsttime);
}
```

#### GetTickCount() | 毫秒

DWORD GetTickCount();

依赖文件少。
检索自系统启动以来经过的毫秒数，最多 49.7 天。
GetTickCount64()函数可以获取更多时间的毫秒数。

#### timeb类 | 毫秒ms

需要头文件timeb.h。

原型:

```C++
    struct timeb
    {
        time_t         time;//秒
        unsigned short millitm;//毫秒
        short          timezone;
        short          dstflag;
    };
```

该类中内容使用一次后则自动销毁。

```C++
struct timeb tp;
ftime(&tp);//一次性销毁
```

#### 基于性能计数器计算 QueryPerformanceCounter() | 微秒us

Retrieves the current value of the performance counter.which is a high resolution (<1us) time stamp that can be used for time-interval measurements.

原型：

```C++
BOOL QueryPerformanceCounter(
  LARGE_INTEGER *lpPerformanceCount
);
```

其中LARGE_INTEGER为int64。相当于获取操作系统一个最小单位的时间计数。

转为int64方法为：
	__int64 diff = x.QuadPart;


其中配合QueryPerformanceFrequency()得到频率进行计时，可以精确到us。

```C++
#include <windows.h>
class stop_watch
{
public:
	stop_watch()
		: elapsed_(0)
	{
		QueryPerformanceFrequency(&freq_);
	}
	~stop_watch() {}
public:
	void start()
	{
		QueryPerformanceCounter(&begin_time_);
	}
	void stop()
	{
		LARGE_INTEGER end_time;
		QueryPerformanceCounter(&end_time);
		elapsed_ += (end_time.QuadPart - begin_time_.QuadPart) * 1000000 / freq_.QuadPart;
	}
	void restart()
	{
		elapsed_ = 0;
		start();
	}
	//微秒
	double elapsed()
	{
		return static_cast<double>(elapsed_);
	}
	//毫秒
	double elapsed_ms()
	{
		return elapsed_ / 1000.0;
	}
	//秒
	double elapsed_second()
	{
		return elapsed_ / 1000000.0;
	}

private:
	LARGE_INTEGER freq_;
	LARGE_INTEGER begin_time_;
	long long elapsed_;
};
```

#### time_t 得到格式化的时间 | 毫秒

```C++
#include <time.h>

time_t rawtime;
struct tm *info;
char buffer[80];

time( &rawtime );

info = localtime( &rawtime );

strftime(buffer, 80, "%Y-%m-%d %H:%M:%S", info);
```

```C++
time_t star_time;
time_t end_time;

star_time = clock();
Sleep(2000);
end_time = clock();
printf("%f\n", double(end_time - star_time) / CLOCKS_PER_SEC); //秒
```

#### timeval | 微秒

```C++
#include<winsock.h>

/*
 * Structure used in select() call, taken from the BSD file sys/time.h.
 */
struct timeval {
        long    tv_sec;         /* seconds */
        long    tv_usec;        /* and microseconds */
};
```

### "->" 和 "." 的区别

a.b: a为结构体或者类，里面有名为b的参数
a->b：a为指针，指向一个内部的数据。

### Subordinates 是什么

### dynamic_cast和static_cast

当我们从派生类向基类转换时，不管用传统的c语言还是c++转换方式都可以百分百转换成功。但是可怕是*向下转换类型*，也就是我们从基类向派生类转换，当我们采用传统的C语言和c++转换时，就会出现意想不到的情况，因为*转换后派生类自己的方法和属性*丢失了，*一旦我们去调用派生类的方法和属性*那就糟糕了，这就是对类继承关系和内存分配理解不清晰导致的。好在c++增加了static_cast和dynamic_cast运用于继承关系类间的强制转化。

static_cast< new_type >(expression)
dynamic_cast< new_type >(expression)
备注：new_type为目标数据类型，expression为原始数据类型变量或者表达式。

static_cast相当于传统的C语言里的强制转换，该运算符把expression转换为new_type类型，用来强迫隐式转换如non-const对象转为const对象，编译时检查，用于非多态的转换，可以转换指针及其他，但没有*运行时类型检查来保证转换的安全性*。它主要有如下几种用法：
①用于类层次结构中基类(父类)和派生类(子类)之间指针或引用的转换。
进行上行转换(把派生类的指针或引用转换成基类表示)是安全的；
进行下行转换(把基类指针或引用转换成派生类表示)时，由于没有动态类型检查，所以是不安全的。
②用于基本数据类型之间的转换，如把int转换成char，把int转换成enum。
③把空指针转换成目标类型的空指针。
④把任何类型的表达式转换成void类型。
注意：static_cast不能转换掉expression的const、volatile、或者__unaligned属性

dynamic_cast< type* >(e)
　type必须是一个类类型且必须是一个有效的指针
dynamic_cast< type& >(e)
type必须是一个类类型且必须是一个左值
dynamic_cast< type&& >(e)
type必须是一个类类型且必须是一个右值

e的类型必须符合以下三个条件中的任何一个：
1、e的类型是目标类型type的公有派生类
2、e的类型是目标type的共有基类
3、e的类型就是目标type的类型。

如果一条dynamic_cast语句的转换目标是指针类型并且失败了，则结果为0。如果转换目标是引用类型并且失败了，则dynamic_cast运算符将抛出一个std::bad_cast异常(该异常定义在typeinfo标准库头文件中)。e也可以是一个空指针，结果是所需类型的空指针。

dynamic_cast主要用于类层次间的上行转换和下行转换，还可以用于类之间的交叉转换(cross cast)。

在类层次间进行上行转换时，dynamic_cast和static_cast的效果是一样的；在进行下行转换时，dynamic_cast具有类型检查的功能，比static_cast更安全。dynamic_cast是唯一无法由旧式语法执行的动作，也是唯一可能耗费重大运行成本的转型动作。

(1)指针类型
举例，Base为包含至少一个虚函数的基类，Derived是Base的共有派生类，如果有一个指向Base的指针bp，我们可以在运行时将它转换成指向Derived的指针，代码如下：

    if(Derived *dp = dynamic_cast<Derived *>(bp)){
    //使用dp指向的Derived对象  
    }
    else{
    //使用bp指向的Base对象  
    }
值得注意的是，在上述代码中，if语句中定义了dp，这样做的好处是可以在一个操作中同时完成类型转换和条件检查两项任务。
(2)引用类型
因为不存在所谓空引用，所以引用类型的dynamic_cast转换与指针类型不同，在引用转换失败时，会抛出std::bad_cast异常，该异常定义在头文件typeinfo中。

### nullptr和NULL

NULL是一个宏定义，在c和c++中的定义不同，c中NULL为(void*)0,而c++中NULL为整数0；所以在c++中int *p=NULL; 实际表示将指针P的值赋为0，而c++中当一个指针的值为0时，认为指针为空指针。

nullptr是一个字面值常量，类型为std::nullptr_t,空指针常数可以转换为任意类型的指针类型。
在c++中(void \*)不能转化为任意类型的指针，即 int \*p=(void*)是错误的，但int *p=nullptr是正确的，原因
对于函数重载：若c++中 (void *)支持任意类型转换，函数重载时将出现问题下列代码中fun(NULL)将不能判断调用哪个函数

```C++
void fun(int i){cout<<"1";};
void fun(char *p){cout<<"2";};
int main()
{
    fun(NULL);  //输出1，c++中NULL为整数0
    fun(nullptr);//输出2，nullptr 为空指针常量。是指针类型
}
```

## 问题索引

### cc1: error: /usr/local/include/x86_64-linux-gnu: Permission denied

```bash
chmod 755 文件名或文件夹名
```

### HEAP CORRUPTION DETECTED: after Normal block (#1375) at 0x0000000000853200. CRT detected that the application wrote to memory after end of heap buffer.



### CRT detected that the application wrote to memory after end of heap buffer.

如果修改了分配内存以外的内存，在free()的时候就会产生这个错误。
例如访问越界等。

### debug assertion failed expression:stream.valid()

文件不存在

### error C4996	'fopen': This function or variable may be unsafe. Consider using fopen_s instead. To disable deprecation, use _CRT_SECURE_NO_WARNINGS. See online help for details.

项目 --> XX属性 --> C++  ---> 预处理器 --> 在预处理器定义添加“_CRT_SECURE_NO_WARNINGS”

### C++ 类型的值不能用于初始化 类型的实体

报错代码如下：
char* image_window = "Source Image";
char* result_window = "Result window";
查了查资料，可能的原因是在VS2017版本中使用这种char*的表达方式会造成程序崩溃，所以VS2017对其进行了控件管理。
解决方案：
1、先将字符使用字符数组进行存储，再使用指针
char image[] = "Source Image";
char result1[] = "Result window";
char* image_window = image;
char* result_window = result1;
2、在前面加上const
const char* image_window = "Source Image";
const char* result_window = "Result window";
3、右键project -> 属性 -> C/C++ -> 语言 -> 符合模式：否

### MTD

C/C++ -> 代码生成 -> 运行库(多线程MTD)

### 包问题

65535：两个字节最大值。

配置依赖包：属性 -> C/C++ -> 常规 -> 附加包含目录：
    $(SolutionDir)eXtremeWrap\examples\example;$(SolutionDir)eXtremeWrap;$(SolutionDir)inc;$(SolutionDir)eXtremeWrap\include;$(SolutionDir)eXtremeWrap\extremeDBAPI;$(SolutionDir)eXtremeWrap\examples\example\testcases;%(AdditionalIncludeDirectories)

### 链接问题

链接库 -> 常规 -> 附加目录
       -> 输入 -> 附加依赖项

### 非常量引用的初始值必须是左值

是引用的问题
引用（reference）为对象起了另外一个名字，引用类型引用（refers to）另外一种类型。通过在变量名前添加“&”符号来定义。引用具体的使用方法请参考《C++的引用与重载函数》。

### 帧不在模块中您可以在反汇编窗口_栈和帧指针使用方法

清理&重新编译项目

### dll文件和lib文件

DLL(Dynamic Link Library)文件，中文叫动态库文件，是程序在运行时所需要调用的库，那么静态库lib文件就是在程序编译时所需要调用的库。

一般的有三个文件,lib、dll、pdb文件，lib文件指定路径就好。而dll文件需要位于exe文件路径中。

这里面到底有什么，为什么总是需要调用？#pragma comment(lib,"ws2_32.lib")

.lib是一种文件名后缀，代表的是静态数据连接库，在windows操作系统中起到链接程序和函数(或子过程)的作用，相当于Linux中的.a或.o、.so文件。

### STL库函数返回值问题

返回一个char*，那么这个空间能保留的时间有多久呢。
如果用一个char*去接收，而这个char\*没有malloc或者初始化一个const char\*，那么我们存储的就是一个地址。
而char*，被返回，无论函数中是如何定义的，malloc或者初始化，或者数组，都是有一个空间。
在某条件下，空间会被释放。
疑似使用引用次数？或者智能指针？

### winsock.h和winsock2.h重定义问题

1.查找winsock.h winsock2.h windows.h调用的地方
2.确保windows.h包含的地方同时包含winsock2.h(先包含winsock2.h)
3.将包含winsock.h的地方修改为包含winsock2.h

### 关于变量重复定义

一个变量
int x;
传递到函数以指针的方式
void tmp(int *x);
tmp(&x);
*x = i;即可改变参数。

但是如果在函数中重复定义：
    x = (int*)malloc(sizeof(int));
    *x = i;
则无法获得其值，将是乱码。

### 0xC0000374: 堆已损坏

一般是由malloc(size)引起的。反复调用函数太多次，内存中存在溢出或者size动态不明确导致。

### 异常0xcccccccc、0xcdcdcdcd与指针初始化问题

程序在调试时，可能会报"写入位置0xcccccccc 时发生访问冲突"，或者“写入位置0xcdcdcdcd 时发生访问冲突”，这些问题可能是由于使用了未初始化的指针引起的。
候编译发现存在没有初始化的指针，因此就会对该内存赋值0xcdcdcdcd或者0xcccccccc，体现在程序中就是“屯屯屯屯……”和“烫烫烫烫……"，另外，如果是将指针设为空指针，即为指针赋值NULL，出现错误时是0x00000000

debug时VS为了更快得帮程序员检测出内存问题,因此对初始化后的内存和释放后的内存做了一些处理,有:
0xcdcdcdcd - Created but not initialised (malloc了,但是没初始化比如说刷成0,没调用构造函数)
0xdddddddd - Deleted (你调用了已经delete的内存...)
0xfeeefeee - Freed memory set by NT's heap manager
0xcccccccc - Uninitialized locals in VC6 when you compile w/ /GZ0xabababab - Memory following a block allocated by LocalAlloc()

一个单独的指针，char *p，未经过初始化时，其是0xcccccccc，是无法读取内存的，也不能进行比较(p == NULL)。但是如果是一个结构体中的指针，虽然也是0xcccccccc，但可以进行比较，此处疑似是已经对其进行了初始化。
所以在使用指针时，最好进行初始化char *p = NULL;方便后续进行判断，释放指针内存后也应该进行置空(NULL)，防止其访问内存片段。

### 无法解析的外部符号发生在哪一个时期

发生在`链接`过程。

无法解析的外部符号LNK2019:
#pragma comment(lib,"ws2_32.lib")

表示链接wpcap.lib这个库。和在工程设置里写上链入wpcap.lib的效果一样（两种方式等价，或说一个隐式一个显式调用），不过这种方法写的 程序别人在使用你的代码的时候就不用再设置工程settings了。告诉连接器连接的时候要找ws2_32.lib，这样你就不用在linker的lib设置里指定这个lib了。

常用的库有：
ws2_32.lib
odbc32.lib
odbccp32.lib
Secur32.lib
legacy_stdio_definitions.lib
Dnsapi.lib
kernel32.lib
user32.lib
gdi32.lib
winspool.lib
shell32.lib
ole32.lib
oleaut32.lib
uuid.lib
comdlg32.lib
advapi32.lib

### -92559631349317830736831783200707727132248687965119994463780864.000000 

输出的时候类型不对。比如flot类型，使用%d输出。

### 网络包错误 具体是两者发生的冲突

了解：WIN32_LEAN_AND_MEAN 含义以及用法

宏编译 预处理头 ，经常可以在stdafx.h文件中出现宏定义#define WIN32_LEAN_AND_MEAN，

具体含义就是当项目中包含#include<windows.h>时去除一些头文件的包含。一个重要的演示

例子就是 winsock2.h和windows.h之间有关于_WINSOCKAPI_的重复定义，如果定义了上面的宏编译

就会避免出现重定义，不同的链接的错误

如果在一个项目中出现winsock重复定义的问题，可以按照如下操作：

项目属性》C/C++》预处理器 WIN32_LEAN_AND_MEAN
