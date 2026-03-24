---
title: "php进阶手册"
date: "2021-1-5"
subtitle: "php进阶手册"
author: "Lonnie iTheds"
categories:
  - 编程
draft: false
section: "archives"
sourcePath: "markdown/archives/php进阶手册.md"
slug: "archives/php进阶手册"
---

# php进阶手册

说点什么吧，目前是3月5日，拿到了一份offer。
是C++，既然如此，那么php就放一边了，工作既定，那则专攻C++，之后如果需要开发网页或者服务器部署，后端开发可能会自学Go语言。是时候和php说再见了。

## 要求

JD：

了解Windows、Unix、Linux等主流操作系统原理，熟练运用系统层支持应用开发

1、计算机、软件、通信等相关专业本科及以上学历；
2、热爱编程，基础扎实，熟悉掌握但不限于JAVA/C++/C/Python/JS/HTML/GO等编程语言中的一种或数种，有良好的编程习惯；
3、具备独立工作能力和解决问题的能力、善于沟通，乐于合作，热衷新技术，善于总结分享，喜欢动手实践；
4、对数据结构、算法有一定了解；
5、优选条件：
（1）熟悉TCP/IP协议及互联网常见应用和协议的原理；
（2）有IT应用软件、互联网软件、IOS/安卓等相关产品开发经验，不满足于课堂所学，在校期间积极参加校内外软件编程大赛或积极参于编程开源社区组织；
（3）熟悉JS/AS/AJAX/HTML5/CSS等前端开发技术。

zend engine引擎的出现使得php有了质的提高：
1、把边解释边运行的方式变为先进行预编译（compile），再执行（execute）的方式极大提高了php的运行效率。
2、使得执行效率大幅提高
3、由于实行功能分离，降低了模块间的耦合度，扩展性大大加强

## 基本语法

## php与AJAX

jQuary

```js
$(function(){
    $('#send').click(function(){
         $.ajax({
             type: "GET",
             url: "test.json",
             data: {username:$("#username").val(), content:$("#content").val()},
             dataType: "json",
             success: function(data){
                         $('#resText').empty();   //清空resText里面的所有内容
                         var html = ''; 
                         $.each(data, function(commentIndex, comment){
                               html += '<div class="comment"><h6>' + comment['username']
                                         + ':</h6><p class="para"' + comment['content']
                                         + '</p></div>';
                         });
                         $('#resText').html(html);
                      }
         });
    });
});
```

## 知识点

转自https://zhuanlan.zhihu.com/p/136007449

### $_SERVER['REQUSET_TIME']优于time()。

### 及时销毁变量
数组和对象在 PHP 中特别占内存的，这个由于 PHP 的底层的zend引擎引起的。一般来说，PHP数组的内存利用率只有 1/10, 也就是说，一个在C语言里面100M 内存的数组，在PHP里面就要1G。

特别是在PHP作为后台服务器的系统中，经常会出现内存耗费太大的问题。

### echo效率高于print

### 尽量静态化
如果一个方法能被静态，那就声明它为静态的，速度可提高1/4，甚至我测试的时候，这个提高了近三倍。

当然了，这个测试方法需要在十万级以上次执行，效果才明显。

其实静态方法和非静态方法的效率主要区别在内存：静态方法在程序开始时生成内存，实例方法（非静态方法）在程序运行中生成内存，所以静态方法可以直接调用，实例方法要先成生实例再调用，静态速度很快，但是多了会占内存。

任何语言都是对内存和磁盘的操作，至于是否面向对象，只是软件层的问题，底层都是一样的，只是实现方法不同。静态内存是连续的，因为是在程序开始时就生成了，而实例方法申请的是离散的空间，所以当然没有静态方法快。

静态方法始终调用同一块内存，其缺点就是不能自动进行销毁，而实例化可以销毁。

### 在include和require中使用绝对路径
如果包含相对路径，PHP会在include_path里面遍历查找文件。
用绝对路径就会避免此类问题，因此解析操作系统路径所需的时间会更少。

### 用内置函数替代正则表达式
能用PHP内部字符串操作函数的情况下，尽量用他们，不要用正则表达式， 因为其效率高于正则。

没得说，正则最耗性能。

有没有你漏掉的好用的函数？例如：strpbrk()、strncasecmp()、strpos()、strrpos()、stripos()、strripos()。

strtr() 函数用于转换指定字符，如果需要转换的全是单个字符的时候，用字符串而不是数组：

<?php
$addr = strtr($addr, "abcd", "efgh");       // good
$addr = strtr($addr, array('a' => 'e', ));  // bad
效率提升：10倍。
?>

### 用strtr作字符替换
str_replace字符替换比正则替换preg_replace快，但strtr比str_replace又快1/4。

另外，不要做无谓的替换，即使没有替换，str_replace也会为其参数分配内存。很慢！

解决办法：用 strpos 先查找(非常快)，看是否需要替换，如果需要，再替换。

效率：如果需要替换，效率几乎相等，差别在 0.1% 左右。如果不需要替换：用 strpos 快 200%。

### 数组元素加引号
$row['id']比$row[id]速度快7倍，建议养成数组键名加引号的习惯。

### 别在循环里用函数
例如：

for($x=0; $x < count($array); $x++) {
}
这种写法在每次循环的时候都会调用 count() 函数，效率大大降低，建议这样：

$len = count($array);
for($x=0; $x < $len; $x++) {
}
让函数在循环外面一次获得循环次数。

### 函数快于类方法
调用只有一个参数、并且函数体为空的函数，花费的时间等于7-8次$localvar++运算，而同一功能的类方法大约为15次$localvar++运算。

### 用单引号代替双引号会快一些
因为PHP会在双引号包围的字符串中搜寻变量，单引号则不会。

### echo字符串用逗号代替点连接符更快些
echo可以把逗号隔开的多个字符串当作“函数”参数传入，所以速度会更快。（说明：echo是一种语言结构，不是真正的函数，故把函数加上了双引号）。例如：

echo $str1, $str2;       // 速度快
echo $str1 . $str2;      // 速度稍慢

### 检查email有效性
使用checkdnsrr()通过域名存在性来确认email地址的有效性，这个内置函数能保证每一个的域名对应一个IP地址。

### 使用MySQLi或PDO
mysql_\*函数已经不被建议使用，建议使用增强型的mysqli_*系列函数或者直接使用PDO。

### 是否需要组件
在你想在彻底重做你的项目前，看看是否有现成的组件（在Packagist上）可用，通过composer安装。组件是别人已经造好的轮子，是个巨大的资源库，很多php开发者都知道。

### 屏蔽敏感信息
使用error_reporting()函数来预防潜在的敏感信息显示给用户。

理想的错误报告应该被完全禁用在php.ini文件里。可是如果你在用一个共享的虚拟主机，php.ini你不能修改，那么你最好添加error_reporting()函数，放在每个脚本文件的第一行(或用require_once()来加载)这能有效的保护敏感的SQL查询和路径在出错时不被显示;

### 压缩大的字符串
使用gzcompress()和gzuncompress()对容量大的字符串进行压缩/解压，再存进/取出数据库。这种内置的函数使用gzip算法，能压缩字符串90%。

### 完全理解魔术引用和SQL注入的危险。
Fully understand “magic quotes” and the dangers of SQL injection. I’m hoping that most developers reading this are already familiar with SQL injection. However, I list it here because it’s absolutely critical to understand. If you’ve never heard the term before, spend the entire rest of the day googling and reading.

### 某些地方使用isset代替strlen
当操作字符串并需要检验其长度是否满足某种要求时，你想当然地会使用strlen()函数。此函数执行起来相当快，因为它不做任何计算，只返回在zval结构（C的内置数据结构，用于存储PHP变量）中存储的已知字符串长度。但是，由于strlen()是函数，多多少少会有些慢，因为函数调用会经过诸多步骤，如字母小写化（译注：指函数名小写化，PHP不区分函数名大小写）、哈希查找，会跟随被调用的函数一起执行。在某些情况下，你可以使用isset()技巧加速执行你的代码。

例如：

if (strlen($foo) < 5) {
    echo "Foo is too short";
}

// 使用isset()
if (!isset($foo{5})) {
    echo "Foo is too short";
}

### 使用++$i递增
当执行变量$i的递增或递减时，$i++会比++$i慢一些。这种差异是PHP特有的，并不适用于其他语言，所以请不要修改你的C或Java代码并指望它们能立即变快，没用的。++$i更快是因为它只需要3条指令(opcodes)，$i++则需要4条指令。后置递增实际上会产生一个临时变量，这个临时变量随后被递增。而前置递增直接在原值上递增。这是最优化处理的一种，正如Zend的PHP优化器所作的那样。牢记这个优化处理不失为一个好主意，因为并不是所有的指令优化器都会做同样的优化处理，并且存在大量没有装配指令优化器的互联网服务提供商（ISPs）和服务器。

### 不要随便复制变量
有时候为了使 PHP 代码更加整洁，一些 PHP 新手（包括我）会把预定义好的变量复制到一个名字更简短的变量中，其实这样做的结果是增加了一倍的内存消耗，只会使程序更加慢。试想一下，在下面的例子中，如果用户恶意插入 512KB 字节的文字到文本输入框中，这样就会导致 1MB 的内存被消耗！

// 不好的实践
$description = $_POST['description'];
echo $description;

// 好的实践
 echo $_POST['description'];

### 使用选择分支语句
switch、case好于使用多个if、else if语句,并且代码更加容易阅读和维护。

### 用file_get_contents替代file、fopen、feof、fgets
在可以用file_get_contents()替代file()、fopen()、feof()、fgets()等系列方法的情况下，尽量用file_get_contents()，因为他的效率高得多！但是要注意,file_get_contents()在打开一个URL文件时候的PHP版本问题。

### 优化Select SQL语句
在可能的情况下尽量少的进行insert、update操作(在update上，我被恶批过)。

### 多维数组尽量不要循环嵌套赋值

### 循环用foreach效率更高
尽量用foreach代替while和for循环

### 对global变量，应该用完就unset()掉

### 并不是事必面向对象(OOP)
面向对象往往开销很大，每个方法和对象调用都会消耗很多内存。

### 耗时函数考虑用C扩展的方式实现
如果在代码中存在大量耗时的函数，你可以考虑用C扩展的方式实现它们

### mod_deflate压缩输出
打开apache的mod_deflate模块，可以提高网页的浏览速度。（提到过echo 大变量的问题）

55、数据库连接当使用完毕时应关掉，不要用长连接

## 问题索引

1.什么是缓存穿透？
2.什么是缓存击穿？
3.针对上述问题如何解决？
4.epoll与select有什么区别？
5.单机redis与集群redis？
6.为什么memcache只支持kv，而redis支持类型多？
7.redis数据过期策略是什么？
8.如何快速定位php程序运行慢的地方？
9.一个事务里面如果嵌套一个curl操作，会发生什么？
