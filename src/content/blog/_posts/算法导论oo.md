---
title: "算法导论"
date: "2018-6-18"
subtitle: "这篇文章请君留步"
author: "Lonnie iTheds"
tags:
  - 算法
  - JAVA
  - C/C++
categories:
  - 算法
draft: false
section: "posts"
sourcePath: "markdown/_posts/算法导论oo.md"
slug: "算法导论oo"
---

# 算法导论

## 理论方式

算法是一种计算方式，而其合理性的与否则需要我们单独的论证。

> ### 子集树和排列树 两种问题解空间树的常用类型

> ### 显示图 显示图的穷举搜索有两种方式，深度优先和广度优先。用邻接表存储具有n个顶点和e条边的显示图，图的搜索算法的时间复杂度为o(n+e)

## 算法思想

> ### 二分查找法 算法的时间复杂度是O(log2n)

> ### 递归算法

关键在于找出，`边界条件`和`递归方程`。

> ### 动态规划

自底向上求解

基本要素:

- 最优子结构  当问题的最优解包含了其子问题的最优解时，称该问题具有最优子结构性质。问题的最优子结构性质提供了该问题可用动态规划算法求解的重要线索。在动态规划算法中，利用问题的最优子结构性质，以自底向上的方式递归地从子问题的最优解逐步构造出整个问题的最优解。
- 重叠子问题  可用动态规划算法求解的问题应具备的另一个基本要素是子问题的重叠性质。在用递归算法自顶向下求解问题时，每次产生的子问题并不总是新问题，有些子问题被反复计算多次。动态规划算法正是利用了这种子问题的重叠性质，对每一个子问题只解一次，而后将`其解保存在一个表格中`，当再次需要此子问题时，只要简单地用`常数时间`查看一下结果。通常，不同的子问题个数随问题的大小呈多项式增长。因此，用动态规划算法通常只需要多项式时间，从而获得较高的解题效率。

重叠子问题则表明动态规划不需要满足被分解成的小问题彼此独立。


> ###  分治算法

子问题不能重复
子问题可以合并
原问题和子问题使用相同方法求解

> ###  贪心算法

- `概念`

顾名思义，贪心算法总是作出在当前看来最好的选择。也就是说贪心算法并不从整体最优考虑，它所作出的选择只是在某种意义上的局部最优选择。当然，希望贪心算法得到的最终结果也是整体最优的。虽然贪心算法不能对所有问题都得到整体最优解，但对许多问题它能产生整体最优解。如单源最短路经问题，最小生成树问题等。在一些情况下，即使贪心算法不能得到整体最优解，其最终结果却是最优解的很好近似。

贪心算法中最重要的核心就在于证明在一种当前情况下最好的选择对于总体来说是最好的选择。
一般会设计一个递归算法来实现贪心策略。然后将递归算法转换为迭代算法。

- `基本要素`

1. `贪心选择性质`    所谓贪心选择性质是指所求问题的整体最优解可以通过一系列局部最优的选择，即贪心选择来达到。这是贪心算法可行的第一个基本要素，也是贪心算法与动态规划算法的主要区别。

动态规划算法通常以自底向上的方式解各子问题，而贪心算法则通常以自顶向下的方式进行，以迭代的方式作出相继的贪心选择，每作一次贪心选择就将所求问题简化为规模更小的子问题。

对于一个具体问题，要确定它是否具有贪心选择性质，必须证明每一步所作的贪心选择最终导致问题的整体最优解。

2. `最优子结构性质`    当一个问题的最优解包含其子问题的最优解时，称此问题具有最优子结构性质。问题的最优子结构性质是该问题可用动态规划算法或贪心算法求解的关键特征。

- `基本思路`

从问题的某一个初始解出发逐步逼近给定的目标，以尽可能快的地求得更好的解。当达到算法中的某一步不能再继续前进时，算法停止。

该算法存在问题：

1. 不能保证求得的最后解是最佳的；

2. 不能用来求最大或最小解问题；

3. 只能求满足某些约束条件的可行解的范围。

实现该算法的过程：

从问题的某一初始解出发；

while 能朝给定总目标前进一步 do

　　 求出可行解的一个解元素；

由所有解元素组合成问题的一个可行解；

[参考网站](https://blog.csdn.net/effective_coder/article/details/8736718)

> ###  分支限界法

搜索方式：
广度优先
最小消耗有限

> ###  舍伍德算法

这是一种随机化算法

---

> ### 辨析

- 回溯法和分支限界法

相同点：二者都是一种在问题的解空间树T上搜索问题解的算法。
不同点：1.在一般情况下，分支限界法与回溯法的求解目标不同。
回溯法的求解目标是找出T中满足约束条件的所有解，而分支限界法的求解目标则是找出满足约束条件的一个解，或是在满足约束条件的解中找出使某一目标函数值达到极大或极小的解，即在某种意义下的最优解。
2.回溯法与分支-限界法对解空间的搜索方式不同，回溯法通常采用尝试深度优先搜索，而分支限界法则通常采用广度优先搜索。
3.对节点存储的常用数据结构以及节点存储特性也各不相同，除由搜索方式决定的不同的存储结构外，分支限界法通常需要存储一些额外的信息以利于进一步地展开搜索。


## 具体问题

> ### 哈弗曼编码(Huffman编码)

用于压缩数据，使用贪心算法来解决。主要是使用Full二叉树来求解出最优的编码方案。最优方案是变长编码。
如何证明其有贪心选择性，是使用此算法的关键所在。
首先比较的是变长编码和定长编码的优劣，使频率最高的长度最小自然是最好的方法。

> ### 最小生成树(Minimum-spanning-tree)

使用贪心算法求解

> ### 最长公共子序列问题(Longest-common-subsequence problem)

使用动态规划来解决，主要构造了一个表格。

> ### 最优二叉搜索树(Optimal binary search)

使用动态规划来解决问题。

> ### 0-1背包问题

0-1背包可以用两种方法解决

- 贪心算法

时间复杂度：

- 动态规划

动态规划法求解0/1背包问题的时间复杂度为：n*C，即是O(n)。

- 回溯法求解

时间复杂度为O(n2^n)

- 分支限界

时间复杂度为O(2^n)

>  ### 最小生成树，Prime算法和Kruskal算法区别程序演示

```JAVA
/**
     * 求图最小生成树的PRIM算法
     * 基本思想：假设N=(V,{E})是联通网，TE是N上的最想生成树中的变得集合。算法从U={u0}(u0属于V)，
     * TE={}开始，重复执行下述操作：在所有的u属于U，v属于V-U的边（u，v）属于E中找到一条代价最小
     * 的边（u0，v0）并入集合TE，同事v0并入U，直至U=V为止。此时TE中必有n-1条边，则T=(V,{TE})
     * 为N的最小生成树。
     * @param  graph  图
     * @param start 开始节点
     * @param n     图中节点数
*/
```

> ### 最大团问题

分支限界，活结点表的组织形式使用最大堆

> ### 旅行售货员问题

- 分支限界，活结点表的组织形式使用最小堆

回溯法 ，时间复杂度为O(n!)

> ### 随机生成10000个1-10000内的随机整数，分别使用冒泡法，选择法，插入排序方法排序，并且输出每种算法的运行时间

sort_compare.java
```JAVA
//已经调试
//随机生成10000个1-10000内的随机整数，分别使用冒泡法，选择法，插入排序方法排序，并且输出每种算法的运行时间

public class sort_compare {
    final static int N = 10000; 
    final static int M = 1000;

    //生成随机数组，长度为N
    public static int[] getRand() {
        int [] tmpList = new int[N];
        for(int i =0;i<N;i++) {
            tmpList[i] = (int)(Math.random()*N+1);
        }
        return tmpList;
    }
    
    //冒泡法排序 从大到小 
    public static int[] bubbleSort(int [] target ) {
        int i =0 ,k =0;
        int tmp =0;
        for(i=0;i<N-1;i++)
            for(k=i+1;k<N;k++)
                if(target[k]>target[i]){
                    tmp=target[k];
                    target[k]=target[i];
                    target[i]=tmp;
                }
        return target;
    }
    
    //选择法排序 从大到小 
    public static int[] selectSort(int [] target){
        int i,k,j;
        for(i=0;i<N-1;i++){//注意控制范围 
          for(k=i+1,j=i;k<N;k++)
            if(target[k]>target[j]) j=k;
              if(j!=i){
                  target[j]=target[j]+target[i];
                  target[i]=target[j]-target[i];
                  target[j]=target[j]-target[i];
              }
         }
        return target;
    }
    //插入法排序 从大到小
    public static int [] insertSort(int a[]){
        for (int j = 1; j <N; j++){
            int key = a[j]; //待排序第一个元素
            int i = j - 1;  //代表已经排过序的元素最后一个索引数
            while (i >= 0 && key > a[i]){
                a[i + 1] = a[i];
                i--;
            }
            a[i + 1] = key;
        }
        return a;
    }
    //检查方输出函数 
    public static void print_f(int var[]){
        for(int i =0;i<=N-1;i++){
            System.out.print(var[i]+" ");
            if((i+1)%10 ==0) System.out.println();
            if(i == N-1) System.out.print("end\n");
        }
    }

    //实验方使用的从小到大的排序 
    public static int[] Reverse(int a[]){
        for (int j = 1; j <N; j++){
            int key = a[j]; //待排序第一个元素
            int i = j - 1;  //代表已经排过序的元素最后一个索引数
            while (i >= 0 && key < a[i]){
                a[i + 1] = a[i];
                i--;
            }
            a[i + 1] = key;
        }
        return a;
    }
    
    //重组随机数组，长度为N 
    public static int[] makeRand(int s[]){
        
        for(int i=0;i<=N-1;i++){
            s[i] = (int)(Math.random()*N+1);
        }
        return s;
    }
    
    //实验方模拟产生含大量重复元素的数组 
    public static int[] repeatIn(int var[]){
        for(int i=0;i<=N-1;i++){
            var[i] = (int)(Math.random()*M+1);
        }
        return var;
    }
    
    //实验方模拟 产生接近于排列完全的数组 
    public static int[] closeTo(int var[]){
        insertSort(var);
        for(int i=0;i<=M;i=i+10){
            var[i] = (int)(Math.random()*N+1);
        }
        return var;
    }
    
    //时间计算函数 
    public static double getTimetoSort(int pf,int []var){
            double time=0;
            
            long startTime=System.nanoTime();   //获取开始时间
            
//            beVary(pf,var);
            onSorting(pf,var);
            
            long endTime=System.nanoTime(); //获取结束时间 
            time=(double)(endTime-startTime)/(10e9);//计算程序执行时间单位为s
//            print_f(var);

            return time;
    }
    
    //预处理变化函数
    public static void beVary(int pf,int []var) {
        switch(pf) {
            case 0 :makeRand(var);break;
            case 1 :closeTo(var);break;
            case 2 :Reverse(var);break;
            case 3 :repeatIn(var);break;
        }
    }
    
    //排序方法选择函数
    public static void onSorting(int pf,int []var) {
        switch(pf){
            case 0 :bubbleSort(var);break;
            case 1 :selectSort(var);break;
            case 2 :insertSort(var);break;
        }
    }
    
    //主函数
    public static void main(String[] args) {
        int []var = new int[N];
        double [][]time=new double[4][3];
        var = getRand();
        int pt=0;
        int pf=0;
        
        for(int i=0;i<4;i++){
            switch(i){
                case 0 : pt=0;break;
                case 1 : pt=1;break;
                case 2 : pt=2;break;
                case 3 : pt=3;break;
            } 
            for(int j =0;j<3;j++){
                switch(j){
                    case 0 :pf = 0;break;
                    case 1 :pf = 1;break;
                    case 2 :pf = 2;break;
                }
                beVary(pt,var);
                time[i][j]=getTimetoSort(pf,var);
            }
        }
        
//        time = getTimetoSort(var);

        for(int i=0;i<4;i++){
            switch(i){
                case 0 : System.out.print("\n\t第一种情况：数组完全随机：\n\t");break; 
                case 1 : System.out.print("\n\t第二种情况：接近排序完成：\n\t");break; 
                case 2 : System.out.print("\n\t第三种情况：数组倒序排列：\n\t");break; 
                case 3 : System.out.print("\n\t第四种情况：相似元素居多：\n\t");break; 
            } 
            for(int j =0;j<3;j++){
                    switch(j){
                    case 0 :System.out.print("\t冒泡法排序时间： ");break;
                    case 1 :System.out.print("\t\t选择法排序时间： ");break;
                    case 2 :System.out.print("\t\t插入法排序时间： ");break;
                }
                    System.out.print(time[i][j]+"\n");
            }
        }
        System.out.print("\n说明：此排序为从大到小排序，随机生成10000个1-10000内的随机数，时间单位为s，仅用于三个排序方法对比使用，具体时间由于函数调用于配置问题有差异。完全代码由iTheds书写");
    }
}

```

> ### 整数划分问题

将正整数n表示成一系列正整数之和：n= + ...+  ，其中  ,k≥1。正整数n的这种表示称为正整数n的划分。求正整数n的不同划分的个数。例如正整数6有如下11种不同的划分：

6；
5+1；
4+2，4+1+1；
3+3，3+2+1，3+1+1+1；
2+2+2，2+2+1+1，2+1+1+1+1；
1+1+1+1+1+1。

使用递归算法实现

Integer_division.java
```JAVA
//已经经过调试，该程序不做保留数据，只负责输出正确集，作者iTheds
/*
 将正整数n表示成一系列正整数之和：n= + ...+  ，其中  ,k≥1
正整数n的这种表示称为正整数n的划分。求正整数n的不同划分的个数。例如正整数6有如下11种不同的划分：
6；
5+1；
4+2，4+1+1；
3+3，3+2+1，3+1+1+1；
2+2+2，2+2+1+1，2+1+1+1+1；
1+1+1+1+1+1。
使用递归算法实现
*/
import java.util.Scanner;

public class Integer_division {
    
    public static int target =0 ;
    //主要执行函数

    public static void divid(int tmp,int x, String s) {
//        System.out.println(s);//调试方
        if(tmp == 0) {
            System.out.println(s);
            return ;
        }
        for(int i = x ; i > 0 ; i --) {
            if(tmp - i == 0) divid( tmp - i ,i,s +         String.valueOf(i));
            else divid( tmp - i,i>(tmp - i)?(tmp -1):i,s + String.valueOf(i)+ "+");
        }
    }

    public static void main(String [] args) {
        Scanner input = new Scanner(System.in);
        target = input.nextInt();
        divid(target,target,"");
        input.close();
        return ;
    }
}

```

> ### Strassen矩阵乘法

使用分治算法实现

[参考链接](http://blog.sina.com.cn/s/blog_7e9a88f70100zj2h.html)

```JAVA

```

>  ### 八皇后问题

使用回溯算法实现

```JAVA

```

> ### 走迷宫问题

有一个m\*n格的迷宫（表示有m行、n列），其中有可走的也有不可走的，如果用1表示可以走，0表示不可以走，文件读入这m*n个数据和起始点、结束点（起始点和结束点都是用两个数据来描述的，分别表示这个点的行号和列号）。编程找出所有可行的道路，要求所走的路中没有重复的点，走时只能是上下左右四个方向（搜索顺寻：左上右下）。如果一条路都不可行，则输出相应信息（用-1表示无路）。

使用回溯法实现

[参考链接](https://blog.csdn.net/u013474436/article/details/47977867)

```JAVA
```

---

## 问题代码C/C++实现

> ### 随机生成10000个1-10000内的随机整数，分别使用冒泡法，选择法，插入排序方法排序，并且输出每种算法的运行时间

```C++
//仅为模板，由于一开始时发现一些逻辑错误重写，未经调试运行
#include<iostream>
#include<time.h>
#include<windows.h>   
using namespace std;
#define N 10000
#define M 1000
//typedef double(int[])* PF;

//生成随机数组，长度为N
int*  getRand(){
//    int i;
//    srand((unsigned)time(NULL));
    srand(5);
//    int s[10000];
    int *s= new int[N];

    for(int i=0;i<=N-1;i++){
        s[i] = rand()%N+1;
    }
    return s;
}
//冒泡法排序 从大到小 
void bubbleSort(int a[]){int i,k;
    for(i=0;i<N-1;i++)
        for(k=i+1;k<N;k++)
         if(a[k]>a[i]){a[k]=a[k]+a[i];
                       a[i]=a[k]-a[i];
                       a[k]=a[k]-a[i];}
}
//选择法排序 从大到小 
void selectSort(int a[]){int i,k,j;
    for(i=0;i<N-1;i++){//注意控制范围 
      for(k=i+1,j=i;k<N;k++)
        if(a[k]>a[j]) j=k;
      if(j!=i){a[j]=a[j]+a[i];
               a[i]=a[j]-a[i];
               a[j]=a[j]-a[i];}}
}
//插入法排序 从大到小
void insertSort(int a[]){
    for (int j = 1; j <N; j++){
        int key = a[j]; //待排序第一个元素
        int i = j - 1;  //代表已经排过序的元素最后一个索引数
        while (i >= 0 && key > a[i]){
            a[i + 1] = a[i];
            i--;
        }
        a[i + 1] = key;
    }
}
//检查方输出函数 
int print_f(int var[]){
    for(int i =0;i<=N-1;i++){
        cout<<var[i]<<" ";
        if((i+1)%10 ==0) cout<<"\n";
        if(i == N-1) cout<<"end"<<endl;
    }
}

//实验方使用的从小到大的排序 
void Reverse(int a[]){
    for (int j = 1; j <N; j++){
        int key = a[j]; //待排序第一个元素
        int i = j - 1;  //代表已经排过序的元素最后一个索引数
        while (i >= 0 && key < a[i]){
            a[i + 1] = a[i];
            i--;
        }
        a[i + 1] = key;
    }
}
//重组随机数组，长度为N 
void  makeRand(int s[]){
    
    for(int i=0;i<=N-1;i++){
        s[i] = rand()%N+1;
    }
//    return s;
}
//实验方模拟产生含大量重复元素的数组 
void repeatIn(int var[]){
    for(int i=0;i<=N-1;i++){
        var[i] = rand()%M+1;
    }
}
//实验方模拟 产生接近于排列完全的数组 
void closeTo(int var[]){
    insertSort(var);
    for(int i=0;i<=M;i=i+10){
        var[i] = rand()%N+1;
    }
}

//时间计算函数 
double getTimetoSort(void (*pf)(int[]),int var[]){
        double time=0; 
//      double counts=0;  
        LARGE_INTEGER nFreq;  
        LARGE_INTEGER nBeginTime;  
        LARGE_INTEGER nEndTime;  
        QueryPerformanceFrequency(&nFreq);  
        
//        bubbleSort(var);
        
        QueryPerformanceCounter(&nBeginTime);//开始计时  
        (*pf)(var);
           QueryPerformanceCounter(&nEndTime);//停止计时  
        time=(double)(nEndTime.QuadPart-nBeginTime.QuadPart)/(double)nFreq.QuadPart;//计算程序执行时间单位为s  
//        print_f(var);

        return time;
}

int main(){
    int *var;
    double time[4][3];
    var = getRand();
//    cout<<var[N]<<endl;
    void (*pf)(int[]);
    void (*pt)(int[]);
    
    for(int i=0;i<4;i++){
        switch(i){
            case 0 : pt=makeRand;break;
            case 1 : pt=closeTo;break;
            case 2 : pt=Reverse;break;
            case 3 : pt=repeatIn;break;
        } 
        for(int j =0;j<3;j++){
            switch(j){
                case 0 :pf = bubbleSort;break;
                case 1 :pf = selectSort;break;
                case 2 :pf = insertSort;break;
            }
            pt(var);
            time[i][j]=getTimetoSort(pf,var);
        }
    }
    
//    time = getTimetoSort(var);

    for(int i=0;i<4;i++){
        switch(i){
            case 0 : cout<<"\n\t第一种情况：数组完全随机：\n\t";    break; 
            case 1 : cout<<"\n\t第二种情况：接近排序完成：\n\t";    break; 
            case 2 : cout<<"\n\t第三种情况：数组倒序排列：\n\t";    break; 
            case 3 : cout<<"\n\t第四种情况：相似元素居多：\n\t";    break; 
        } 
        for(int j =0;j<3;j++){
            switch(j){
                case 0 :cout<<"\t冒泡法排序时间： ";    break;
                case 1 :cout<<"\t\t选择法排序时间： ";    break;
                case 2 :cout<<"\t\t插入法排序时间： ";    break;
            }
            cout<<time[i][j]<<endl;
        }
    }
    cout<<"\n说明：此排序为从大到小排序，随机生成10000个1-10000内的随机数，时间单位为s"<<endl; 
    
    
}
```
---

以下代码含金量比较低，仅用于自我参考，读者不必深究

---

> ### Strassen矩阵乘法

```C++
#include<stdio.h>
#include<iostream>
using namespace std;
//Strassen矩阵乘法，时间复杂度O(n^log_2_7) 
int **Strassen(int a[2][2],int b[2][2]){
    int **c=new int*[2];
    c[0]=new int[2];
    c[1]=new int[2];
    int m[7];
    m[0]=a[0][0]*(b[0][1]-b[1][1]);
    m[1]=(a[0][0]+a[0][1])*b[1][1];
    m[2]=(a[1][0]+a[1][1])*b[0][0];
    m[3]=a[1][1]*(b[1][0]-b[0][0]);
    m[4]=(a[0][0]+a[1][1])*(b[0][0]+b[1][1]);
    m[5]=(a[0][1]-a[1][1])*(b[1][0]+b[1][1]);
    m[6]=(a[0][0]-a[1][0])*(b[0][0]+b[0][1]);
    
    c[0][0]=m[4]+m[3]-m[1]+m[5];
    c[0][1]=m[0]+m[1];
    c[1][0]=m[2]+m[3];
    c[1][1]=m[4]+m[0]-m[2]-m[6];
    return c;
}

int main(){
    int a[2][2];
    int b[2][2];
    cout<<"Please input matrix a:"<<endl;
    for(int i=0;i<2;i++){
        for(int j=0;j<2;j++){
            cin>>a[i][j];
        }
    }
    cout<<"Please input matrix b:"<<endl;    
    for(int i=0;i<2;i++){
        for(int j=0;j<2;j++){
            cin>>b[i][j];
        }
    }
    
    cout<<"Output matrix a:"<<endl;    
    for(int i=0;i<2;i++){
        for(int j=0;j<2;j++){
            cout<<a[i][j]<<" ";
        }
        cout<<endl;
    }
    cout<<"Output matrix b:"<<endl;
    for(int i=0;i<2;i++){
        for(int j=0;j<2;j++){
            cout<<b[i][j]<<" ";
        }
        cout<<endl;
    }
    
    int **c = Strassen(a,b);
    cout<<"Output matrix c:"<<endl;
    for(int i=0;i<2;i++){
        for(int j=0;j<2;j++){
            cout<<c[i][j]<<" ";
        }
        cout<<endl;
    }
}
```

> ### 八皇后问题

代码来自网络，如有侵权，请联系作者。

```C++
// queen.cpp: 定义控制台应用程序的入口点。
//

#include "stdafx.h"

using namespace std;
static int gEightQueen[8] = { 0 }, gCount = 0;
void print()//输出每一种情况下棋盘中皇后的摆放情况
{
    for (int i = 0; i < 8; i++)
    {
        int inner;
        for (inner = 0; inner < gEightQueen[i]; inner++)
            cout << "0";
        cout << "#";
        for (inner = gEightQueen[i] + 1; inner < 8; inner++)
            cout << "0";
        cout << endl;
    }
    cout << "==========================\n";
}
int check_pos_valid(int loop, int value)//检查是否存在有多个皇后在同一行/列/对角线的情况
{
    int index;
    int data;
    for (index = 0; index < loop; index++)
    {
        data = gEightQueen[index];
        if (value == data)
            return 0;
        if ((index + data) == (loop + value))
            return 0;
        if ((index - data) == (loop - value))
            return 0;
    }
    return 1;
}
void eight_queen(int index)
{
    int loop;
    for (loop = 0; loop < 8; loop++)
    {
        if (check_pos_valid(index, loop))
        {
            gEightQueen[index] = loop;
            if (7 == index)
            {
                gCount++, print();
                gEightQueen[index] = 0;
                return;
            }
            eight_queen(index + 1);
            gEightQueen[index] = 0;
        }
    }
}
int main(int argc, char*argv[])
{
    eight_queen(0);
    cout << "total=" << gCount << endl;
    system("pause");
    return 0;
}
```