---
layout: post
title: "编译原理之语法分析程序"
subtitle: "其实，想做的事情还很多，有各位在我很幸运"
date: 2018-5-23
author: Lonnie iTheds
header-img: "hexo.jpg"
cdn: 'header-on'
categories:
    - 编译原理
tags:
    - 编译原理
    - C/C++
---

<link rel="stylesheet" type="text/css" href="../../auto-number-title.css" />

# 编译原理之语法分析程序

## 原理

算符优先文法是建立在算符文法的基础上的。
算符文法是指，文法中没有两个非终结符相邻的情况出现的，也称OG(Operator Grammar)文法。
不含ε规则的算符文法中任意两个终结符号对于·>、<·、=·三种关系中只有一种成立，就是算符优先文法，也称为OPG(Operation Priority Grammar)文法。

首先确定每个 _非终结符_ 的`FIRSTVT`集和`LASTVT`集。

然后得出含有所有非终结符关系的 `表达式文法优先关系表`，其中含有$，没有关系的可以使用ERROR(空格)标识。

识别最左素短语。
短语：对于一个合法的句型，上一步的非终结符推导而来的一个‘结构’即为短语。
最左短语是句柄
素短语：包含一个终结符，不含有其他素短语。

识别方法是满足以下条件的最左素短语：
不管非终结符，终结符满足
`开头结符`·>`开头终结符前一个终结符(可以不在最左素短语中)`，`中间终结符`=·`中间终结符`，`次结尾`<·`结尾终结符`
。
值得注意的是`$·任意终结符·$`,其在上述描述中。即在判断时需要加上`$`这个终结符。不然，最后一个符号就无法规约。

最左素短语中的终结符号具有相同的优先级关系。

> 代码实现

```C
i+E*(T)
i+E*(T)i
```

## 知识点攻破

---

* C++中定义二维数组指针

```C
    int rowsNum = 4;  
    int colsNum = 5;  

    float** a = new float*[rowsNum];  
    for(int i = 0; i < rowsNum; i++)  
    {  
        a[i] = new float[colsNum];  
        a[i] = test[i];
    }
```

[参考链接](https://blog.csdn.net/u013250416/article/details/78906875)

```C

```

* C中获取指针数组长度

```C
int example[20];
int ArrLength;
ArrLength = sizeof(example) / sizeof(int);
```

当其中的变量为指针时，sizeof函数并不能奏效，如果是(char*)，那么长度则为4。

此时应该使用strlen()函数来表达。

```C
那么sizeof的作用是什么？

返回一个对象或者类型所占的内存字节数。

我们会对sizeof()中的数据或者指针做运算吗？基本不会。

例如sizeof(1+2.0),直接检测到其中类型是double,即是sizeof(double) = 8。

如果是指针，sizeof只会检测到是指针的类型，指针都是占用4个字节的空间（32位机）。

char *p = "sadasdasd";

sizeof(p):4

sizeof(*p):1//指向一个char类型的

除非使用strlen()，仅对字符串有效，直到'\0'为止了。

要是非要使用sizeof来得到指向内容的大小，就得使用数组名才行，

如char a[10];

sizeof(a):10  //检测到a是一个数组的类型。
```

* C中提取指定长度指针数组

从头开始截取的strncat和strncpy

C语言拼接字符串 -- 使用strcat()函数。
经过测试怀疑：
如果两个参数都是char*，并且第一个参数char*被malloc赋值，那么后面的char\*将绕过第一个参数的内存区，直接添加到'尾部'。
后续测试结果表明第二个参数会直接将数据加载到第一个参数'\0'的位置。
并在尾部加上'\0'。

[C语言 strcat()函数和strncat()函数](https://blog.csdn.net/Feynman1999/article/details/53331056)

* C语言中定义指针变量，局部变量。

在作用域结束后就被释放，而malloc free却不同，定义了之后如果不释放，直到程序结束才会被释放。至于它的作用域是否为全局变量还有待测试。

* 取消勾选“SDL检查”

项目选项，C++ ，常规

针对于许多函数包括栈溢出问题函数的避免使用

[详情说明](https://technet.microsoft.com/zh-cn/library/w6w3kbaf(v=vs.120).aspx)

* C语言中定义二维指针数组：

```C
char (*table)[7];

char tabletest[7][7] = {
{'0','+','*','i','(',')','$'},
{'+','>','<','<','<','>','>'},
{'*','>','>','<','<','>','>'},
{'i','>','>','0','0','>','>'},
{'(','<','<','<','<','=','0'},
{')','>','>','0','0','>','>'},
{'$','<','<','<','<','0','='},
};

table = tabletest;

```

奇怪的是，tabletest[8][7]是正确的，而tabletest[7][8]却错误了。
测试得：

    table[0] : 0+*i()$+><<<>>*>><<>>i>>00>>(<<<<=0)>>00>>$<<<<0=

其中表明，所有的table[i][j]和tabletest[i][j]是一一对应的。
可以多‘列’，但是不能多‘行’。

还有一种方法：

```C
char **table = new char*[7];

for (int i = 0; i < 7; i++) {
    table[i] = tabletest[i];
    printf("%s\n",table[i]);
}
```

如果这样的话，table[0][i]这一列，数据都没有了。或者是无法读取。amazing

* C语言for循环

这个知识点证明了失败~

    for(1;2;3)

如果2失败了，那么3还会来吗？

会的。加油吧。
即使是判断错误，还是有最后一次机会的。
所以

```C
    for(int i =0 ; i<3; if(i ==3 ){i--;}else {i++;})
        doit();
```

好吧，开个玩笑，其实是不会的。

## 代码实现

---

代码文本框架

* 头文件

stdafx.h
ananlysis.h

* 主函数cpp文件

Syntactic analysis

```C
//stdafx.h
// stdafx.h : 标准系统包含文件的包含文件，
// 或是经常使用但不常更改的
// 特定于项目的包含文件
//

#pragma once

#include "targetver.h"

#include <stdio.h>
#include <tchar.h>



// TODO: 在此处引用程序需要的其他头文件

//ananlysis.h
#pragma once

#include<string.h>
#include<stdlib.h>

/*语法定义：
E-> E+T|T
T-> T*F|F
F-> (E)|i
*/
/*
error 0
=· =
<· <
·> >
*/
char *s;
char *Tsymbol;
char * NTsymbol;
char(*table)[7];
char tabletest[7][7] = {
{ '0','+','*','i','(',')','$' },
{ '+','>','<','<','<','>','>' },
{ '*','>','>','<','<','>','>' },
{ 'i','>','>','0','0','>','>' },
{ '(','<','<','<','<','=','0' },
{ ')','>','>','0','0','>','>' },
{ '$','<','<','<','<','0','=' },
};

//测试方植入代码，定义语法
void Initialization() {
    Tsymbol= (char *)"+*i()$";
    NTsymbol = (char *)"ETF";
    table = tabletest;
}

//初始处理输入串
char * CutInit(char * target) {
    char * tmp = (char*)malloc(sizeof(char) * strlen(target));
    int n = strlen(target);
    int  i=0;
    tmp[i] = '$';
    for (i = 0; i < n; i++) {
        tmp[i + 1] = target[i];
    }
    tmp[i] = '$';
    tmp[i + 1] = '\0';
    return tmp;
}

//根据语法构造优先关系表
int Priority_relationship() {
    return 0;
}

//判断是否为终结符
bool isTsymbol(const char x) {
    int i;
    int tmp = strlen(Tsymbol);
    for (i = 0; (i< tmp) && (x != Tsymbol[i]); i++);
    if (i != tmp) return true;
    else return false;
}

//判断是否为非终结符
bool isNTsymbol(const char x) {
    int i;
    int tmp = strlen(NTsymbol);
    //printf("strlen(NTsymbol) : %d \n",tmp);
    for (i = 0; (i< tmp) && (x != NTsymbol[i]); i++);
    //printf("i : %d \n",i);
    if (i != tmp) return true;
    else return false;
}

//判断合法性，提取终结符串
char *Tsymbols(char * target) {
    char *tmp = (char*)malloc(sizeof(char) * strlen(target));
    int j = 0;
    for (int i = 0; i< strlen(target) ; i++) {
        if (!isNTsymbol(target[i])) {
            //printf("Add2fortest : target[%d] : %c \n",i,target[i]);
            if (isTsymbol(target[i])) {
                //printf("Add1: target[%d]: %c \n", i, target[i]);
                tmp[j] = target[i];
                j++;
            }
            else {
                return (char*)"0\0";
            }
        }
    }
    if (j == 0) {
        tmp[j] = '0';
        tmp[j+1] = '\0';
    }
    else {
        tmp[j+1] = '\0';
    }
    //printf("strlen(tmp): %d \n",strlen(tmp));
    //printf("tmp : %s \n",tmp);
    if (strlen(tmp) == 0) return (char*)'0';
    return  tmp;
}

//获取两个终结符间的关系
char getRelation(char a, char b) {
    int x, y;
    int n = strlen(Tsymbol) + 2;
    //printf("length : %d \na : %c \nb : %c \n", n, a, b);
    //printf("table : %s \n",table[1]);
    //printf("length : %d\ntable[][] : %c \n",n,table[0][0]);
    for (x = 1; x < n; x++)
        if (table[x][0] == a) break;
    for (y = 1; y < n; y++) {
        //printf("for y table[0][y%d] : %c\n", y, table[0][y]);
        if (table[0][y] == b) break;
    }
    //printf("done: table[%d][%d] : %c \n", x,y,table[x][y]);
    return table[x][y];
}

//截取指定长度字符串
char * CopyS(char *target,int be,int end) {
    char * tmp = (char*)malloc(sizeof(char) * strlen(target));
    int n = strlen(target);
    int j=0    ;
    for (int i = 0; i < n; i++) {
        tmp[j] = target[i];
        j++;
        if (i == be) i = end;
    }
    tmp[j] = '\0';
    printf("CopyS test target : %s [%d,%d] tmp : %s \n",target,be,end,tmp);
    return tmp;
}

//获取最左素短语，处理后返回
char * getLPP(char * target) {
    char * tmp= (char*)"";
    int isHad= -1;
    int n = strlen(target);
    bool j=false;
    //printf("strlen(target) : %d \n",n);
    for (int i = 0; i < n-1 ; i++) {
        char race= getRelation(target[i], target[i + 1]);
        printf("NO.%d %c %c %c \n",i,target[i], race,target[i+1]);
        switch (race)
        {
        case '=' :
            break;
        case '>' :
            if (isHad == -1 ) break;
            tmp = CopyS(target, isHad,i);
            //printf("GetLPP test3 tmp : %s \n",tmp);
            j = true;
            break;
        case '<' :
            isHad = i;
            break;
        case '0' :
            break;
        default:
            break;
        }
    }
    if (!j) return target;
    else return tmp;
}

//执行分析总函数
bool ananlysis(char* target) {
    //printf("tes1: %s \n",target);
    s = CutInit(Tsymbols(target));
    int n = strlen(s);
    printf("s: %s \nlength : %d \n", s,n);
    for (int i=0;i<n;i++)
    {
        if (s[0] == '$' && s[1] == '$') return true;
        s = getLPP(s);
        printf("test%d s : %s \n",i,s);
    }
    return false;
}

//Syntactic analysis.cpp

// Syntactic analysis.cpp: 定义控制台应用程序的入口点。
//

#include "stdafx.h"
#include"ananlysis.h"


//输出二维数组 sizeof(table[0]) / sizeof(char)
void print_Array(char **table) {
    //for (int i = 0,j; i < (sizeof(table[0]) / sizeof(char)); i++) {
        for (int j = 0; j < 7; j++) {
            printf("%s \n", table[j]);
        }
        printf("\n --");
    //}
}

int main()
{
    Initialization();
    //printf("语法支持：\n");
    //print_Array(table);
    printf("请输入语句：\n");
    char *run = (char*)malloc(sizeof(char) * 100);
    scanf("%s",run);
    //printf("%s\n", run);
    bool isOK = false;
    isOK = ananlysis(run);
    if (isOK == true) {
        printf("语法正确 \n");
    }
    else {
        printf("语法错误 \n");
    }
    system("pause");
    return 0;
}

```