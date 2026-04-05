---
layout: post
title: "C/C++ String 函数"
subtitle: "C/C++ String函数"
sticky: true
date: 2021-1-2
author: Lonnie iTheds
header-img: "img/hexo.jpg"
cdn: 'header-on'
categories:
  - 编程
tags:
  - C/C++
description: "C/C++ String 函数"
---

<link rel="stylesheet" type="text/css" href="../../auto-number-title.css" />

# C/C++ String函数

## 1.strcpy函数

原型：strcpy(str1,str2);

功能：将字符串str2复制到字符串str1中，并覆盖str1原始字符串，可以用来为字符串变量赋值

返回：str1

注意：1)字符串str2会覆盖str1中的全部字符，2)字符串str2的长度不能超过str1

```C++
char str1[] = "We are csdn!";
char str2[] = "Hello!";
strcpy_s(str1, str2); //str = Hello!
```

## 2.strncpy函数

原型：strncpy(str1,str2,n);

功能：将字符串str2中的前n个字符复制到字符串str1的前n个字符中

返回：str1

注意：1)不会清除str1中全部字符串，只会改变前n个字符串，2)n不能大于字符串str1、str2的长度

3)但是如果使用strncpy_s便会清除str1中的全部字符串

strncpy：
```C++
char str1[] = "We are csdn!";
char str2[] = "Hello!";
strncpy(str1, str2, 3);
printf("str1 = %s\n", str1);  //str1 = Helare csdn!
```

strncpy_s：
```C++
char str1[] = "We are csdn!";
char str2[] = "Hello!";
strncpy_s(str1, str2, 3);
printf("str1 = %s\n", str1);  //str1 = Hel
```

## 3.strcat函数
原型：strcat(str1,str2);

功能：将字符串str2添加到字符串str1的尾部，也就是拼接两个字符串

原型2：strncat(str1,str2,n);

功能2：将字符串str2的前n个字符添加到字符串str1的尾部

返回：str1

注意：拼接之后的长度不能超过字符串数组str1的长度
```C++
char str1[20] = "We are csdn!";
char str2[] = "Hello!";
strcat_s(str1, str2);
printf("str1 = %s\n", str1);  //str1 = We are csdn!Hello!
```

## 4.strlen函数
原型：strlen(str1);

功能：计算字符串str1的长度

返回：一个int值

注意：字符串的长度不包括字符'\0'
```C++
char str1[20] = "We are csdn!";
int size = strlen(str1);
printf("%d\n", size);  //size = 12
```

## 5.strcmp函数
原型：strcmp(str1,str2);

功能：比较两个字符串，如果两个字符串相等，则返回0；若str1大于str2(对于大于的理解，是指从两个字符串的第一个字符开始比较，若两个字符相同，则继续比较，若发现两个字符不相等，且str1中该字符的ASCII码大于str2中的，则表示str1大于str2)，返回一个正数(这个正数不一定是1)；若str1小于str2，返回一个负数(不一定是-1)；若字符串str1的长度大于str2，且str2的字符与str1前面的字符相同，则也相对于str1大于str2处理

原型2：strncmp(str1,str2,n);

功能2：比较两个字符串的前n个字符

原型3：stricmp(str1,str2); (在Windows中使用stricmp，在Linux中使用strcasecmp)

功能3：忽略两个字符串中的大小写比较字符串，也就是对大小写不敏感

注意：如果在VS2017中直接使用stricmp会提示错误,原因和处理办法见：stricmp错误，即用_stricmp代替.

返回：0或一个正数或一个负数
```C++
char str1[] = "Wearecsdn!";
char str2[] = "Wearecsdn!";
char str3[] = "Wearea!";
char str4[] = "Wearef!";
char str5[] = "Weare";
char str6[] = "weAreCsdn!";
 
int cmp1 = strcmp(str1, str2);        //cmp1=0
int cmp2 = strcmp(str1, str3);        //cmp2=1
int cmp3 = strcmp(str1, str4);        //cmp3=-1
int cmp4 = strcmp(str1, str5);        //cmp4=1
 
int cmp5 = strncmp(str1, str2, 5);    //cmp5=0
int cmp6 = strncmp(str1, str3, 5);    //cmp6=0
int cmp7 = strncmp(str1, str4, 5);    //cmp7=0
int cmp8 = strncmp(str1, str5, 5);    //cmp8=0
 
int cmp9 = _stricmp(str1, str6);      //cmp9=0
```

## 6.strchr函数

原型：strchr(str,c);

功能：在str字符串中查找首次出现字符c的位置(从字符串的首地址开始查找)

原型2：strrchr(str,c);

功能2：在字符串str中从后向前开始查找字符c首次出现的位置

原型3：strstr(str1,str2);

功能3：在字符串str1中查找字符串str2的位置，若找到，则返回str2第一个字符在str1中的位置的指针，若没找到，返回NULL

返回：字符c的位置的指针，若没有查找到字符c，则返回空指针NULL
```C++
char str1[] = "Wearecsdn!";
char ch = 'e';
char str2[] = "are";
 
char* ret1;
char* ret2;
char* ret3;
 
ret1 = strchr(str1, ch);      //ret1 = earecsdn!
ret2 = strrchr(str1, ch);     //ret2 = ecsdn!
ret3 = strstr(str1, str2);    //ret3 = arecsdn!
 
int r1 = ret1 - str1;         //r1 = 1
int r2 = ret2 - str1;         //r2 = 4
int r3 = ret3 - str1;         //r3 = 2
 
printf("%s\n%s\n%s\n", ret1, ret2, ret3);
printf("%d\n%d\n%d\n", r1, r2, r3);
```

## 7.strpbrk函数

原型：strpbrk(str1,str2);

功能：依次检验字符串 str1 中的字符，当被检验字符在字符串 str2 中也包含时，则停止检验，并返回该字符位置

返回：第一个两个字符串中都包含的字符在str1中的位置的指针

```C++
char str1[] = "We12are34csdn!";
char str2[] = "32";
 
char* ret1;
 
ret1 = strpbrk(str1, str2);   //*ret1 = 2
 
int r1 = ret1 - str1;         //r1 = 3
 
printf("%c\n", *ret1);
printf("%d\n", r1);
```

## 8.strspn函数

原型：strspn(str1,str2);

功能：检索字符串str1中第一个不在字符串str2中出现的字符下标

返回：返回 str1 中第一个不在字符串 str2 中出现的字符下标，一个int整数值
```C++
char str1[] = "We12are34csdn!";
char str2[] = "We32are1";
 
int len;
 
len = strspn(str1, str2);  //len = 8
printf("%d\n", len);
```

## 9.strcspn函数

原型：strcspn(str1,str2);

功能：检索字符串str1开头连续有几个字符都不含字符串str2中的字符

返回：返回 str1 开头连续都不含字符串 str2 中字符的字符数，一个int整数值

```C++

char str1[] = "We12are34csdn!";
char str2[] = "32";
 
int len;
 
len = strcspn(str1, str2);    //len = 3
printf("%d\n", len);
```
:::info
strpbrk、strcspn、strspn三个函数的区别：strpbrk是在字符串str1中查找第一个在字符串str2中也包含的字符的位置，返回该字符在str1中的位置指针，而strcspn返回的是该字符在str1中的偏移位置，strspn是在str1中查找第一个在str2不包含的字符的位置，返回该字符在str1中的偏移位置
:::

## 10. strtok()

描述
C 库函数 char *strtok(char *str, const char *delim) 分解字符串 str 为一组字符串，delim 为分隔符。

声明
下面是 strtok() 函数的声明。

char *strtok(char *str, const char *delim)
参数
str -- 要被分解成一组小字符串的字符串。
delim -- 包含分隔符的 C 字符串。
返回值
该函数返回被分解的第一个子字符串，如果没有可检索的字符串，则返回一个空指针。

strtok()用来将字符串分割成一个个片段。参数s指向欲分割的字符串，参数delim则为分割字符串中包含的所有字符。当strtok()在参数s的字符串中发现参数delim中包含的分割字符时,则会将该字符改为\0 字符。在第一次调用时，strtok()必需给予参数s字符串，往后的调用则将参数s设置成NULL。每次调用成功则返回指向被分割出片段的指针。

```C++
#include <string.h>
#include <stdio.h>
 
int main () {
   char str[80] = "This is - www.runoob.com - website";
   const char s[2] = "-";
   char *token;
   
   /* 获取第一个子字符串 */
   token = strtok(str, s);
   
   /* 继续获取其他的子字符串 */
   while( token != NULL ) {
      printf( "%s\n", token );
    
      token = strtok(NULL, s);
   }
   
   return(0);
}
```

## 11. mem函数

string.h中还提供以下几种常用字符串操作函数：

1)void *memchr(const void *str, int c, size_t n) 在参数 str 所指向的字符串的前 n 个字节中搜索第一次出现字符 c(一个无符号字符)的位置，相似于strchr函数

2)int memcmp(const void *str1, const void *str2, size_t n)) 把存储区 str1 和存储区 str2 的前 n 个字节进行比较，相似于strncmp函数

3)void *memcpy(void *str1, const void *str2, size_t n) 从存储区 str2 复制 n 个字符到存储区 str1，相似于strncpy函数

4)void *memmove(void *str1, const void *str2, size_t n) 从 str2 复制 n 个字符到 str1，但是在重叠内存块这方面，memmove() 是比 memcpy() 更安全的方法。如果目标区域和源区域有重叠的话，memmove() 能够保证源串在被覆盖之前将重叠区域的字节拷贝到目标区域中，复制后源区域的内容会被更改。如果目标区域与源区域没有重叠，则和 memcpy() 函数功能相同

5)void *memset(void *str, int c, size_t n) 复制字符 c(一个无符号字符)到参数 str 所指向的字符串的前 n 个字符

## 转载自[https://blog.csdn.net/qq_33757398/article/details/81212618]
