---
title: "Thinkphp学习札记"
date: "2018-7-25"
author: "Lonnie iTheds"
tags:
  - php
categories:
  - 项目管理
draft: true
section: "drafts"
sourcePath: "markdown/_drafts/Thinkphp.md"
slug: "_drafts/Thinkphp"
---

# Thinkphp学习札记(Thinkphp3.2.3)

##　理论框架MVC

MVC is Model View Controller

## Thinkphp文件结构

```Tree
Thinkphp
├─Application
│  ├─Common
│  │  ├─Common
│  │  └─Conf
│  ├─Home
│  │  ├─Common
│  │  ├─Conf
│  │  ├─Controller
│  │  ├─Model
│  │  └─View
│  └─Runtime
│      ├─Cache
│      │  └─Home
│      ├─Data
│      ├─Logs
│      │  ├─Common
│      │  └─Home
│      └─Temp
├─Public
└─ThinkPHP
    ├─Common
    ├─Conf
    ├─Lang
    ├─Library
    │  ├─Behavior
    │  ├─Org
    │  │  ├─Net
    │  │  └─Util
    │  ├─Think
    │  └─Vendor
    ├─Mode
    │  ├─Api
    │  ├─Lite
    │  └─Sae
    └─Tpl
```

## 概念解析

学习框架要明白的，是函数写在哪里，依靠什么链接数据库，我的前端界面又写在什么地方。
thinkphp，函数写在控制器中。数据放在配置里面，而不是放在单一的控制器。模型是连接数据库的利器要注意命名规则。前端界面自然是放在视图中。

> ### 模块

模块在Application文件夹下定义，文件结构可以参照HOME来定义。
模块中有控制器存在Controller文件夹下，通过特殊的命名规则TestController.class.php来定义，可以控制输出什么。
http://ip/thinkphp/home/index/test 此路由中输出的是home模块中名为index控制器中test的方法。

> ### 模型的使用

模型可以用于执行SQL语句。
可以使用M来实例化构造函数，但是只能构造Think\Model类，而D函数可以构造指定类型的模型，不存在则构造Think\Model。
其中sql语句可以使用thinkphp中的连贯操作来代替，预防sql注入，不做赘述，。
其中常用的有create可以用于创建对象，使用add插入。其中$_validate作为规则用于验证。$_auto用于create时自动处理对象，例如加密特殊化。

定义模型

```php
namespace Admin\Model;
use Think\Model;
class UserModel extends Model{
public $_validate = array(
    array('username','require','用户名不能为空'),
    array('password','require','密码不能为空'),
    array('username','','用户名已存在',0,'unique',1),
    array('password','6,20','密码长度必须在6-20之间',0,'length'),
    array('password','/^\w{6,20}$/ ','密码格式错误'),
    array('password','repassword','确认密码错误',0,'confirm',1),
    array('username','checkUsername','用户名非法',0,'callback')
);

public $_auto = array(
    array('password','md5',self::MODEL_BOTH,'function'),
    // array('created_at','time',self::MODEL_INSERT,'function'),
    // array('updated_at','time',self::MODEL_UPDATE,'function')
);
}
```

使用模型

```php
$user = new \Admin\Model\UserModel();
$data = $user->query('SELECT * from c5_user');
print_r($data);
```

> ### 视图(模块)的使用

文件定义在~\Application\Admin\View\User\test.html中，在控制器中使用display函数使用。
其中User为控制器名，test为方法名。

```php
$this->display('User:test');
```

视图是可以继承的，使用block标签。

## 实战操作

> ### 场景配置

灵活使用配置，实现多接口连接。*待完善*

> ### 内置函数

使用C函数输出配置 ~hinkPHP\Common\functions.php
使用U函数来输出URL
使用I函数过滤请求

> ### 扩展配置

自定义配置实用*待完善*

> ### 路由功能

首先在公共的配置文件下确认路由功能开启：
~\Application\Common\Conf\config.php

```phh
'URL_ROUTER_ON' => true
```

然后在模块home中定义路由规则:
~\Application\Home\Conf\config.php

```php
'URL_ROUTE_RULES' => array(
//正则路由此句未知含义
'/^posts\/(\d{4})\/(\d{2})\/(d{2})$/ ' => 'Index/index?year=1:&month=:2&day=1',
//规则路由
'posts/:year/:month/:day' => 'Index/index',
'posts/:id' => 'Index/index',
'posts/read/:id' => '/posts/:1',
),
//静态路由
'URL_MAP_RULES' => array(
'site/welcome' => 'Index/index?from=seo'
)
```

> ### 模块下的控制器

一个模块可以有很多的控制器，控制器可以控制输出的内容。
Test为控制器名的控制器：
~\Application\Home\Controller\TestController.class.php

```PHp
<?php
namespace Home\Controller;
use Think\Controller;
class TestController extends Controller {//一个名为Test的控制器
    public function index(){//方法名index
        echo "from:".$_GET['from']." <br>";//具体执行函数
    }
}
```

模型还可以建立视图模型，使用变量$viewFields来继承方法Think\Model/ViewModel。还有一个关联模型，但是考虑时间原因未有深入学习，不再赘述。

> ### 空控制器与空操作

定义_empty空操作，EmptyController.class.php空控制器

> ### 内置标签的使用

|标签名|作用|包含属性|
|:-:|:-:|:-:|
include|包含外部模板文件（闭合）|file
import|导入资源文件（闭合 包括js css load别名）|file,href,type,value,basepath
volist|循环数组数据输出|name,id,offset,length,key,mod
foreach|数组或对象遍历输出|name,item,key
for|For循环数据输出|name,from,to,before,step
switch|分支判断输出|name
case|分支判断输出（必须和switch配套使用）|value,break
default|默认情况输出（闭合 必须和switch配套使用）|无
compare|比较输出（包括eq neq lt gt egt elt heq nheq等别名）|name,value,type
range|范围判断输出（包括in notin between notbetween别名）|name,value,type
present|判断是否赋值|name
notpresent|判断是否尚未赋值|name
empty|判断数据是否为空|name
notempty|判断数据是否不为空|name
defined|判断常量是否定义|name
notdefined|判断常量是否未定义|name
define|常量定义（闭合）|name,value
assign|变量赋值（闭合）|name,value
if|条件判断输出|condition
elseif|条件判断输出（闭合 必须和if标签配套使用）|condition
else|条件不成立输出（闭合 可用于其他标签）|无
php|使用php代码|无

> ### 调试方

调试可以通过define('APP_DEBUG',true)来进行开启

> ### 缓存的使用

通过配置参数HTML_CACHE_ON来打开。
需要定义参数HTML_CACHE_ON。

```Php
'HTML_CACHE_ON'     =>    true, // 开启静态缓存
'HTML_CACHE_TIME'   =>    60,   // 全局静态缓存有效期（秒）
'HTML_FILE_SUFFIX'  =>    '.shtml', // 设置静态缓存文件后缀
'HTML_CACHE_RULES'  =>     array(  // 定义静态缓存规则
     // 定义格式1 数组方式
     '静态地址'    =>     array('静态规则', '有效期', '附加规则'), 
     // 定义格式2 字符串方式
     '静态地址'    =>     '静态规则',
)
```

## 实战演练

> ### 验证码的使用

完善中

> ### 图像处理

水印操作

> ### 自制博客

敬请期待(不用期待了，此处可以这样使用，但是博主是不会去实践的)

> ### 微信小程序使用thinkphp

敬请期待

## 技术疑答

> ### C函数的使用

此函数定义在~ThinkPHP\Common\functions.php中，是主要的输出函数，或者说配置输出函数

    C(自定义变量)

> ### 内含有tpl文件，打开之后是html和php嵌套的语言代码。