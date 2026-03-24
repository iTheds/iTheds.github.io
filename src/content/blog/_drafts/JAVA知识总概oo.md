---
title: "JAVA知识总概"
date: "2018-6-14"
subtitle: "当年傻傻的我们透着鲜为人知的机智"
author: "Lonnie iTheds"
tags:
  - JAVA
categories:
  - 编程
draft: true
section: "drafts"
sourcePath: "markdown/_drafts/JAVA知识总概oo.md"
slug: "_drafts/JAVA知识总概oo"
---

# JAVA知识总概

### 方法返回字符串

```JAVA
//生成随机数组，长度为N
public static int[] getRand() {
    int [] tmpList = new int[N];
    for(int i =0;i<N;i++) {
        tmpList[i] = (int)(Math.random()*10000+1);
    }
    return tmpList;
}
```

### 计算程序运行时间

```JAVA
//毫秒级别
long startTime = System.currentTimeMillis();    //获取开始时间

doSomething();    //测试的代码段

long endTime = System.currentTimeMillis();    //获取结束时间

System.out.println("程序运行时间：" + (endTime - startTime) + "ms");    //输出程序运行时间

---

//纳秒级别
long startTime=System.nanoTime();   //获取开始时间  

doSomeThing(); //测试的代码段  

long endTime=System.nanoTime(); //获取结束时间  

System.out.println("程序运行时间： "+(endTime-startTime)+"ns"); 
```

### java把函数作为参数传递

没有找到具体方式，瞟了一眼，估计可以使用类的tools来判断方法名达到执行指定函数的方法。

还有一种是定义一个用户可调的变化函数，配合switch执行指定函数。

### java中`main(String args[])`

如果没有这个参数的话，是无法运行的哦。

## 知识收集

### String和byte[]间的转换

# 日志

# backup

## 环境搭建

https://www.oracle.com/java/technologies/javase-downloads.html

之前开发是使用eclipse。

JAVA_HOME: C:\Program Files\Java\jdk-16

CLASSPATH
    .;%JAVA_HOME%\lib;%JAVA_HOME%\lib\dt.jar;%JAVA_HOME%\lib\tools.jar

编辑Path 
    %JAVA_HOME%\bin
    %JAVA_HOME%\jre\bin

### 定义常变量

 这个是我个人的一个误区，C与C++中都有这一概念，但是JAVA中没有这一概念。

 Java三大变量分别是类变量（静态变量）、实例变量和局部变量（本地变量）。

 如果想定义`"常变量"`，可以考虑关键字*final*。

 ```JAVA
final static int N = 10000;
 ```

定义的地方决定了作用域。
