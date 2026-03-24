---
layout: post
title: "JS进阶"
subtitle: ""
date: 2017-7-25
author: Lonnie iTheds
header-img: "hexo.jpg"
cdn: 'header-on'
categories:
	- 编程
tags:
    - JS
---

<link rel="stylesheet" type="text/css" href="../../auto-number-title.css" />

# JS进阶

旧文件为JS杂烩(2017-7-25)，2021年1月5日重写为js进阶。

## Javascript思想

## JS的基本语法

## JS实战操作

### 回车键事件

```html
 <!-- .html -->
<p>密&emsp;码：&emsp;<input type="password" id="password" onkeyup="upperCase(window.event)" style="width:30%;height:20px;"></p>
```

```javascript
// .js
function upperCase(x) {
    // console.log(x);
    var code = x.charCode || x.keyCode;  //取出按键信息中的按键代码(大部分浏览器通过keyCode属性获取按键代码，但少部分浏览器使用的却是charCode)
    // console.log(code);
    if (code == 13) {
        //此处编写用户敲回车后的代码
        message();
    }
```

### 实现跳转

```javascript
//实现跳转
var i = 5;
function Time(str){//str为一个元素的id，将跳转提示显示到该元素内
    // var str1s="#"+str1;
    var divNode = document.getElementById(str);
    var liNode = document.createElement("p");
    liNode.id = "p_2";
    liNode.style = "font-size:60%;";
    divNode.insertBefore(liNode, divNode.children[1]);
    var intervalid = setInterval("toTime('p_2')",1000);
}
function toTime(str){
    var liNode = document.getElementById(str);
    var string = "将在 "+ i + " 秒后进入页面";
    // string = "将在 "+ i +" 秒后进入页面";
    console.log(string);
    liNode.innerHTML = string ;
    i--;
    if(i==0){
        window.location.href='home.php';
        clearInterval(liNode);
    }
}
```

### 低耦合js函数，多重定向实现

```html
<button onclick="message(1,$('#username').val(),$('#password').val(),$('#IDcard').val())"><b>注册</b></button>
```

```javascript
function message(){
if(arguments[0]==1){
        flag +=userpass();
        console.log("flag is "+flag);
        if(flag != 8){
            alert("填写信息有误");
            flag=0;
            return;
        }
    }else{
        console.log("flag is "+flag);
        if(flag != 6){
            alert("填写信息有误");
            flag=0;
            return;
        }
    }
}
```

### 图片保存为base64，命名时间戳

```javascript
$("#file").change(function(e){
    var file = e.target.files[0];
    // console.log(file);
    // console.log("file accurate type is "+file.type);//输出为image/jpeg，如果选择jpeg图片
    var type = file.type.split('/')[0];
    // console.log("file type is "+type);
    if(type!= "image"){
        alert("请上传图片");
        return ;
    }
    // console.log("file.size is " +file.size) ;
    var size = Math.floor(file.size /1024 /1024);
    // console.log("file.size of math is " +size) ;
    if(size>8){
        alert("图片大小不得超过8M");
        return;
    }

    var reader = new FileReader();
    console.log(reader);
    reader.readAsDataURL(file);
    // console.log(reader);
    reader.onloadstart  = function(){
        console.log('start');
    };
    reader.onprogress = function(){
        console.log("onprogress");
    };
    reader.onabort = function(){
        console.log("onabort");
    };
    reader.onerror = function(){
        console.log("onerror");
    };
    reader.onload = function(){
        console.log("onload");
    };
    reader.onloadend = function (e) {
        var dataURL = reader.result;

        $("#img_1").attr("src",dataURL);

        name =    (new Date()).valueOf();//毫秒级时间戳
        console.log(name);
        // return 0;
        //  var para = [
        //     ['name',name],
        //     ['url',dataURL]
        // ];
        var para = {
            name:name,
            url:dataURL
        };
        temp(para);
    }
});
```

### 创建键值数组并且获取键值

```javascript
var str = {
  // username:$('#username').val(),
  // password:$('#password').val(),
  name:$('#name').val(),
  sex:$('#sex').val(),
  img:para['name'],
  Ethnic:$('#Ethnic').val(),
  political:$('#political').val(),
  birthday:$('#year').val()+"-"+$('#month').val()+"-"+$('#day').val(),
}
```

```php
$keyval = array_keys($date);
```

### 伪造SESSION

[防报错占位符]

### ajax传值处理文件时报错`illegal invocation`

需要加上：
`processData:false,//重点`
来避开AJAX机制对于传递的值的更改排序。

```javascript
$.ajax({
        url: 'php/register.php',
        type:'POST',
        data:{"date":str,"para":para},
        processData:false,//重点
        dataType: 'JSON',
        contentType:"application/x-www-form-urlencoded",
        success:function(data){
            console.log(data);
            if(data == 2){
            alert("注册成功！马上进入登录界面");
            window.location.href='sign.php';
            }
            else {
                alert("未知错误，请重新注册");
            }
        }
    })
```

### js两种定义数组的比较：

第一种键值数组的定义方式：

```javascript
var para = {
            name:name,
            url:dataURL
        };
```

结果：

```javascript
{name: "1525485624872", url: "data:image/jpeg;base64,/9j/4U/+RXhpZgAATU0AKgAAAAg…Mhuw4JrzC81W4sL5Ba7ZUibcN3RgR09cCtFqhQxCirM//2Q=="}
name:"1525485624872"
url:"data:image/jpeg;base64,/9j/4U/+RXhpZgAATU0AKgAAAAg…Mhuw4JrzC81W4sL5Ba7ZUibcN3RgR09cCtFqhQxCirM//2Q=="
__proto__:Object
```

而第二种二维数组定义标志的方式：

```javascript
var str = [
['username',$('#username').val()],
['password',$('#password').val()],
];
```

结果：

```javascript
(41) [Array(2), Array(2)]
0:Array(2)
    0:"name"
    1:"4234"
    length:2
    __proto__:Array(0)
1:Array(2)
    0:"sex"
    1:"1"
    length:2
    __proto__:Array(0)
length:41
__proto__:Array(0)
```

对于这两种数组定义方式在AJAX中的传值，使用第二种二维数组的传递方式是完全没有问题的。
经过测试，第一种键值的方式也是可行的：

```javascript
Array
(
    [date] => Array
        (
            [name] => 12341
            [sex] => 1
            [img] => 1525612350373
            [Ethnic] => 35
            [political] => 群众
            [birthday] => 1222-2-2
            [post] =>
            [college] =>
            [department] => 2434324
            [education] => 本科
            [phone] => 234665
            [address] =>
            [e_mail] =>
            [degree] => 学士
            [height] =>
            [weight] =>
            [health] => 0
            [marriage] =>
            [employer] =>
            [job_title] =>
            [job] =>
            [grade] =>
            [undergraduate_time] => <->
            [undergraduate_school] =>
            [undergraduate_degree] =>
            [master_time] => <->
            [master_school] =>
            [master_degree] =>
            [doctor_time] => <->
            [doctor_school] =>
            [doctor_degree] =>
            [family] =>
            [awards] =>
            [job_certificate] =>
            [grassroots_service] =>
        )

    [para] => Array
        (
            [name] => 1525612350373
            [url] => data:image/jpeg;base64,9j/4AAQS/oEklLGj//Z
        )

)
```

但是两种数组定义是不能够交叉使用的，这也就是为什么会有上个问题中ajax传值处理文件时报错`illegal invocation`了。
需要注意的是，对于第一种二维数组的方式，可以使用`str.push(['username',value ]);`来在数组中加入元素.

#### php以键名获取键值的方法

array_keys($array) //返回所有键名以数组的形式
array_values($array) //返回所有键值
$result=array_reverse($input);       //将数组颠倒，不保留键名
$result_keyed=array_reverse($input,true);    //将数组颠倒，保留键名
array_keys($array,"blue");       //返回值为blue的键名

通常用来以键名获取键值。