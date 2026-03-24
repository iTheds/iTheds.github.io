---
title: "信息安全学习记"
date: "2018-11-12"
subtitle: "网络安全学习与CTF竞赛笔记"
author: "Lonnie iTheds"
tags:
  - 网安
  - CTF
  - AWD
  - Web安全
categories:
  - 网络安全
draft: false
section: "archives"
sourcePath: "markdown/archives/信息安全学习记.md"
slug: "archives/信息安全学习记"
---

# 信息安全学习记

11月17日就比赛了，但是题目还没有做，理论也没有看，我希望这次比赛带给我的不是荣誉，而是更加明白网络安全的学习是终身的，是恒持的，也更加明白什么是团队，什么是Panther。

## AWD和WAF

在此我想提一下的是DEFCON CHINA，黑客大会中国。Capture The Flag即起源于DEFCON。

### AWD(Attack With Defence)

AWD即使CTF攻防赛，大概来讲就是每人有一台服务器，需要做的就是别让别人拿到你的flag，在允许的范围内搭建WAF(Web Application Firewall)，之后通过各种种shell或者审计的方式拿到别人的flag。

有些专业名词你需要掌握：
- fd
- playload
- shell
- cms

题目漏洞大概在：
1. sqli居多
2. 文件包含
3. 各种rce
4. 文件上传

#### 比赛流程
首先备份，然后审计。

#### 常识
不是赛棍也是赛狗，常识还是要有的。不知为何大部分CTF博主都有自嘲的技能啊。

比赛开始前，最好先备份使用xftp或者命令`scp -r -P Port remote_username@remote_ip:remote_folder local_file`来dump一下源码，数据库也是可以的。

对于wordpress，wpscan是不可少的。

1. 主办方放了一个wp，然后每个队伍都有config备份文件以及phpmyadmin。这种情况下，最机智的方法，是靠你多年手速，迅速下载其他队伍备份文件，然后登陆phpmyadmin后，拿别的队伍的shell最机智的方法不是去利用phpmyadmin写shell，万一没权限不就白白耽误时间了。[转]

2. 同样是最新版的wp，也没有安装插件，但是主办方在一个比较深的目录里放了一个任意文件上传，绕过上传的方式也比较简单。[转]

流量审计也很重要。

#### 有用工具
- **D盾查杀**：专为IIS设计的一个主动防御软件
- **seay扫洞**：php审计
- **御剑扫描**：目前已经有[源](http://www.moonsec.com/post-753.html)

### WAF

[参考链接](https://github.com/wupco/weblogger)


## Bugku题集

### web

#### 文件包含

打开后代码：

```php
<?php
    include "flag.php";
    $a = @$_REQUEST['hello'];
    eval( "var_dump($a);");
    show_source(__FILE__);
?>
```

构造包含语句：

```url
?hello=1);show_source('flag.php');var_dump(
```

其中eval可以执行里面的相关命令，var_dump显示。当输入时，$a的值是`1);show_source('flag.php');var_dump(`，执行eval时显示flag.php中的文件内容，内含flag。

**原理**：涉及到远程文件包含漏洞。
[参考链接](https://www.2cto.com/article/201304/204158.html)

涉及到的危险函数：`include()`, `require()`, `include_once()`, `require_once()`，可以查看到服务器上的其他文件，甚至可以使用一些方法执行cmd命令。

#### 变量1

直接php文件如下:

```php
<?php  
error_reporting(0);
include "flag1.php";
highlight_file(__file__);
if(isset($_GET['args'])){
    $args = $_GET['args'];
    if(!preg_match("/^\w+$/",$args)){
        die("args error!");
    }
    eval("var_dump($$args);");
}
?>
```

在这里涉及到一个可变长变量的概念，就是代码中的`$$args`，和间接寻址方式类似，找变量名为$args这个变量内容的变量。

使用全局变量GLOBALS来解决，传递GLOBALS即可。其中，这个GLOBALS变量不同于超全局变量，是可以在任何地方使用的，用户也可以自己加带有键值的参数。

#### Web5

网页中有：

```
([][(![]+[])[+[]]+([![]]+[][[]])[+!+[]+[+[]]]+(![]+[])[!+[]+!+[]]+(!![]+[])[+[]]+(!![]+[])[!+[]+!+[]+!+[]]+(!![]+[])
```

其实很不想放这个东西，好长，所以上面的东西就是意思一下。。。
其实这个是JSfuck，使用六个字符就编写出来的程序。不需要另外的编译器或解释器来执行，无论浏览器或JavaScript引擎中的原生JavaScript解释器皆可直接运行。所以也可以在控制台上直接运行。

JSFuck可用于绕过恶意代码检测，且可以被用于跨站脚本攻击。因为缺乏原生JavaScript应有的特征，类似JSFuck的JavaScript混淆技术可帮助恶意代码绕过入侵防御系统或内容过滤器。

#### 头等舱

消息头Header里面没有信息，抓包之后发现flag在响应头里面。

很简单的题，但是如何将数据放在响应头里面还不太清楚。

#### 网站被黑

这题我想说的是使用御剑来扫描网址得到更多关于网站其他页面的信息，在此扫描到shell.php。

之后我们使用burp suit进行密码暴力破解，将拦截到的信息发送到inturder上，positions中选中变量，payloads中加入字典start attack。比较长度，判断信息差别。

强大的字典扫出密码为hack。

#### web4

学习javascrip新函数`unescape()`。其用 Unicode 字符 \u00xx 和 \uxxxx 替换这样的字符序列进行解码。使用`escape()`进行编码。

所以源码中被eval()执行的是：

```javascript
function checkSubmit(){
    var a=document.getElementById("password");
    if("undefined"!=typeof a){
        if("67d709b2b54aa2aa648cf6e87a7114f1"==a.value)
        return!0;
        alert("Error");
        a.focus();
        return!1
    }
}
document.getElementById("levelQuest").onsubmit=checkSubmit;
```

在输入框中输入`67d709b2b54aa2aa648cf6e87a7114f1`之后就得到了flag。但是这个代码没有看很懂，毕竟源码里面没有id为levelQuest和password的标签。

值得提醒的是，ECMAScript v3 已从标准中删除了 unescape() 函数，并反对使用它，因此应该用 decodeURI() 和 decodeURIComponent() 取而代之。

#### flag在index里面

学习php://filter协议。

- **php://** 是访问各个输入/输出流(I/O streams)
- **php://filter** 是一种元封装器，是一种设计用来允许过滤器程序在打开时成为流的封装协议
- **php://input** 是个可以访问请求的原始数据的只读流

该协议语法为：`php://filter:/<action>=<name>`。

对于一些典型的文件包含漏洞。我们可以通过构造含有漏洞的语句，查看想要看的代码：

```url
file=php://filter/convert.base64-encode/resource=index.php
```

再将得到的base64码解码即可。
所以在此输入，得到base64解码为：

```html
<html>
    <title>Bugku-ctf</title>
<?php
    error_reporting(0);
    if(!$_GET[file]){
        echo '<a href="./index.php?file=show.php">click me? no</a>';
    }
    $file=$_GET['file'];
    if(strstr($file,"../")||stristr($file, "tp")||stristr($file,"input")||stristr($file,"data")){
        echo "Oh no!";
        exit();
    }
    include($file);
//flag:flag{edulcni_elif_lacol_si_siht}
?>
</html>
```

flag就在里面。很棒的东西，但是还是具体不知道该怎么用。

**php://filter的参数列表**

| 参数 | 功能 |
|------|------|
| read | 读取 |
| write | 写入 |
| resource | 数据来源 |

其中附加参数值可为：

- **string.strip_tags**：将数据流中的所有html标签清除
- **string.toupper**：将数据流中的内容转换为大写
- **string.tolower**：将数据流中的内容转换为小写
- **convert.base64-encode**：将数据流中的内容转换为base64编码
- **convert.base64-decode**：与上面对应解码

大概的含义就是可以使用这个协议获取到指定url中的文件内容。
在php脚本中可以使用readfile()、file_put_contents()等函数与其相关。

[参考链接1](https://www.leavesongs.com/PENETRATION/php-filter-magic.html)
[参考链接2](https://blog.csdn.net/Ruhe_king/article/details/82502582)