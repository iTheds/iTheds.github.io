---
title: "0705work_data"
description: "0705work_data"
---

# 0705work_data

## 每日日志

周一:
1. 船舶项目数据丢失问题解决。
2. 船舶项目对配置文件读取优化。
3. 重新预热ODBC。

周二:
1. 调研ODBC，过程分析。

周三:
1. 调研ODBC通信分析。
2. 搭建mysql源码环境。

周四:
1. 船舶项目数据审计。
1. 调研ODBC开发者数据差异。
3. ODBC开发需要实现的基本路线。

周五:
1. 调研ODBC。

### 工作内容

1. ODBC方案提出为本周首要任务。

1. 修复读取配置文件中出现的问题，疑似有遗留问题。
2. 修复数据丢失问题.
    - [x] 完成
1. UDP数据分析。分析一下UDP数据的过程和数据的准确性。
4. 整理一份报告给司组长
    - [x] 完成

### ODBC Q&A

目前看来有两个可用资源， 一个是mysql-connector-odbc-master代表的ODBC源码， 一个是mysql源码。两个之中都有连接的过程存在。

可以推测到:mysql有一套自己的连接方式，命名为mysql_，之后为了满足ODBC或者其他连接的需要封装了一套MYSQL_函数，之后为了定向满足ODBC标准，封装了SOL_函数。

知道了这一点之后，我们可以做这么几件事:
1. 定向跟几条线路，分析连接过程。
2. 逐步分析文件API函数的实现过程。

优先解决以下的问题:
1. 开发者数据库差异是怎么样识别的。简单来说就是如何知道是我的数据库，而不是mysql或者sql server的身份。
2. 通信方式是什么样的。两条线，连接过程，sql指令的传输过程。

还需要知道以下:
1. 底层的协议。
2. 服务端的细节设计。比如中间件、数据库代理。表象为监听端口的服务。

### Recoding

Druid-数据库连接池

AST

怎么说呢，感觉船舶项目中还需要在细看一下数据的具体内容，优化一下关于UDP的处理方式。
ODBC感觉还有一层，需要再详细的查看一下。

这样叭，边想者这件事？拆分数据结构是优化，但是校验数据是很关键的。
等一个时机？
先深入了解ODBC？上午看船舶项目，下午调研ODBC。

软件实施方案
船舶数据库中间层用户手册
船舶数据库中间层使用手册
天智海域态势感知系统-数据库-测试问题报告6.11

= 比 < >优先级低

[41]0000!AIVDM,1,1,,A,D03tD3iitNfp00N000,4*34

[50]0055!AIVDO,1,1,,,16:5R=1000Wm2I>:KEc6q2<n0000,0*0C

[197]0001!AIVDM,1,1,,A,H6<D2Oi4TtpL@4qUD0000000000,2*0A
0002!AIVDM,1,1,,B,D03tCeR4<Nfp00N000,4*48
0003!AIVDM,1,1,,B,16:b`MwP00Wl`w@:MsLf4?vL2@8e,0*2C
0004!AIVDM,1,1,,A,36:G`mUP00Wm:tJ:KkfuugvJ0000,0*

## 代码存留

### mysql source

```C++
#include "mysql.h"

//#include <mysql.h>

#include <stdio.h>
#include <Windows.h>
#include <stdlib.h>
#include <winsock.h>
#include <string.h>

//#pragma comment (lib, "libmysql.lib")

int main() {
	//int yon;
	char yon[1];
	int YesOrNo = 1;
	MYSQL mysqlConnect;  //数据源指针
	MYSQL_RES* res;  //查询结果集
	MYSQL_FIELD* field;  //包含字段信息的结构指针
	MYSQL_ROW nextRow;  //存放查询sql语句字符串数组
	int ret;  //执行sql语句后返回是否成功查询
	int i, j;

	mysql_init(&mysqlConnect);//分配对象 p4302
	if (!(mysql_real_connect(&mysqlConnect, "116.62.65.53", "user_test1", "Test123456+", "test_db1", 3306, NULL, 0))) {
		printf("Failed to access to the database...Error: %s\n", mysql_error(&mysqlConnect));
	}
	if (!mysql_set_character_set(&mysqlConnect, "gbk"))
	{
		printf("New client character set: %s\n",mysql_character_set_name(&mysqlConnect));
	}

	//printf("Connect success!\n");

	getchar();

	return 1;

	while (YesOrNo == 1)
	{
		YesOrNo = 3;  //令他不等于1就好
		printf("Now you can input the keyword to find anything what you hope to see.\n");
		char keyword[100];
		scanf("%s", keyword);   //要查询的信息关键词
		printf("\n");
		char toSelectFrom[250] = "SELECT * FROM core_courses WHERE ";  //where后保留空格好直接连接关键词
		char toLike[] = " LIKE '%";  //等号前后保留空格
		char rightPercent[] = "%'";
		char or_1 [] = " OR ";
		char number[] = "course_number";
		char name[] = "course_name";
		char credit[] = "credit";
		char period[] = "period";
		char term[] = "term";
		char type_1[] = "course_type_1";
		char type_2[] = "course_type_2";

		//下面开始字符串拼接
		char thePerfectSqlLanguage[254];

		strcat(toSelectFrom, number);  /*SELECT * FROM core_courses WHERE course_number*/
		strcat(toSelectFrom, toLike);  /*SELECT * FROM core_courses WHERE course_number = */
		strcat(toSelectFrom, keyword);  /*SELECT * FROM core_courses WHERE course_number = keyword*/
		strcat(toSelectFrom, rightPercent);

		strcat(toSelectFrom, or_1);  /*SELECT * FROM core_courses WHERE course_number = keyword OR */

		strcat(toSelectFrom, name);
		strcat(toSelectFrom, toLike);
		strcat(toSelectFrom, keyword);
		strcat(toSelectFrom, rightPercent);

		strcat(toSelectFrom, or_1);

		strcat(toSelectFrom, credit);
		strcat(toSelectFrom, toLike);
		strcat(toSelectFrom, keyword);
		strcat(toSelectFrom, rightPercent);

		strcat(toSelectFrom, or_1);

		strcat(toSelectFrom, period);
		strcat(toSelectFrom, toLike);
		strcat(toSelectFrom, keyword);
		strcat(toSelectFrom, rightPercent);

		strcat(toSelectFrom, or_1);

		strcat(toSelectFrom, term);
		strcat(toSelectFrom, toLike);
		strcat(toSelectFrom, keyword);
		strcat(toSelectFrom, rightPercent);

		strcat(toSelectFrom, or_1);

		strcat(toSelectFrom, type_1);
		strcat(toSelectFrom, toLike);
		strcat(toSelectFrom, keyword);
		strcat(toSelectFrom, rightPercent);

		strcat(toSelectFrom, or_1);

		strcat(toSelectFrom, type_1);
		strcat(toSelectFrom, toLike);
		strcat(toSelectFrom, keyword);
		strcat(toSelectFrom, rightPercent);
		//下面把完整的SQL查询语句 复制 给 thePerfectSqlLanguage
		strcpy(thePerfectSqlLanguage, toSelectFrom);

		printf("SQL : %s\n", thePerfectSqlLanguage);

		ret = mysql_query(&mysqlConnect, thePerfectSqlLanguage);  //执行
		if (ret != 0) {
			printf("Query failed...Error: %s\n", mysql_error(&mysqlConnect));
			//mysql_close(&mysqlConnect); //关闭连接
			//continue; //退出系统
			/*考虑加个模糊查询*/
		}
		res = mysql_store_result(&mysqlConnect);
		if (res) {
			int fieldCount = mysql_field_count(&mysqlConnect);
			if (fieldCount > 0) {
				int column = mysql_num_fields(res);
				int row = mysql_num_rows(res);
				for (i = 0; field = mysql_fetch_field(res); i++) {
					//获得属性名 
					printf("%25s", field->name);
					printf(" |");
				}
				printf("\n");
				//按行输出结果
				/*for (i = 1; i < row + 1; i++) {
					rowList = mysql_fetch_row(res);  //4273
					for (j = 0; j < column; j++) {
						printf("%10s", rowList[j]);
					}
					printf("\n");
				}*/
				while (nextRow = mysql_fetch_row(res)) {
					for (j = 0; j < column; j++) {
						printf("%25s", nextRow[j]);
						printf(" |");
					}
					printf("\n");
				}
			}
			else {
				printf("No resullt. This is the result of a character splitting query... \n");
			}
		}
		else {
			printf("mysql_store_result...Error: %s\n", mysql_error(&mysqlConnect));
		}

		printf("\n\nIf you still hope to access the database, please input '1' (Stay) or '0' (Exit).\n");

		/*scanf("%d", &yon);
		while (yon != 0 && yon != 1) {
			printf("Warning: You have input the number out of my expection! Please enter '1'(Continue to access the database) or '0'(Exit now) now.\n");
			scanf("%d", &yon);
		}
		if (yon == 1) {
			YesOrNo = yon;
		}
		else if(yon==0) {
			exit(1);
		}*/

		/*之所以不采用上面这种写法是应为当输入非数字类型时会出错*/

		printf("\n\n");
		scanf("%s", yon);  /*如果这里采用getchar那么在回车的一瞬间弹出warning*/
		while (yon[0] != '0' && yon[0] != '1') {
			printf("Warning: You have input the number out of my expection! Please enter '1'(Continue to access the database) or '0'(Exit now) now.\n");
			scanf("%s", yon);
		}
		if (yon[0] == '1') {
			YesOrNo = 1;
		}
		else if (yon[0] == '0') {
			exit(1);
		}
	}
	return 0;
}

```

### mysql_odbc

```C++

#include "mysql.h"

//#include <mysql.h>

#include <stdio.h>
#include <Windows.h>
#include <stdlib.h>
#include <winsock.h>
#include <string.h>

//#pragma comment (lib, "libmysql.lib")

int main() {
	//int yon;
	char yon[1];
	int YesOrNo = 1;
	MYSQL mysqlConnect;  //数据源指针
	MYSQL_RES* res;  //查询结果集
	MYSQL_FIELD* field;  //包含字段信息的结构指针
	MYSQL_ROW nextRow;  //存放查询sql语句字符串数组
	int ret;  //执行sql语句后返回是否成功查询
	int i, j;

	mysql_init(&mysqlConnect);//分配对象 p4302
	if (!(mysql_real_connect(&mysqlConnect, "116.62.65.53", "user_test1", "Test123456+", "test_db1", 3306, NULL, 0))) {
		printf("Failed to access to the database...Error: %s\n", mysql_error(&mysqlConnect));
	}
	if (!mysql_set_character_set(&mysqlConnect, "gbk"))
	{
		printf("New client character set: %s\n",mysql_character_set_name(&mysqlConnect));
	}

	//printf("Connect success!\n");

	getchar();

	return 1;

	while (YesOrNo == 1)
	{
		YesOrNo = 3;  //令他不等于1就好
		printf("Now you can input the keyword to find anything what you hope to see.\n");
		char keyword[100];
		scanf("%s", keyword);   //要查询的信息关键词
		printf("\n");
		char toSelectFrom[250] = "SELECT * FROM core_courses WHERE ";  //where后保留空格好直接连接关键词
		char toLike[] = " LIKE '%";  //等号前后保留空格
		char rightPercent[] = "%'";
		char or_1 [] = " OR ";
		char number[] = "course_number";
		char name[] = "course_name";
		char credit[] = "credit";
		char period[] = "period";
		char term[] = "term";
		char type_1[] = "course_type_1";
		char type_2[] = "course_type_2";

		//下面开始字符串拼接
		char thePerfectSqlLanguage[254];

		strcat(toSelectFrom, number);  /*SELECT * FROM core_courses WHERE course_number*/
		strcat(toSelectFrom, toLike);  /*SELECT * FROM core_courses WHERE course_number = */
		strcat(toSelectFrom, keyword);  /*SELECT * FROM core_courses WHERE course_number = keyword*/
		strcat(toSelectFrom, rightPercent);

		strcat(toSelectFrom, or_1);  /*SELECT * FROM core_courses WHERE course_number = keyword OR */

		strcat(toSelectFrom, name);
		strcat(toSelectFrom, toLike);
		strcat(toSelectFrom, keyword);
		strcat(toSelectFrom, rightPercent);

		strcat(toSelectFrom, or_1);

		strcat(toSelectFrom, credit);
		strcat(toSelectFrom, toLike);
		strcat(toSelectFrom, keyword);
		strcat(toSelectFrom, rightPercent);

		strcat(toSelectFrom, or_1);

		strcat(toSelectFrom, period);
		strcat(toSelectFrom, toLike);
		strcat(toSelectFrom, keyword);
		strcat(toSelectFrom, rightPercent);

		strcat(toSelectFrom, or_1);

		strcat(toSelectFrom, term);
		strcat(toSelectFrom, toLike);
		strcat(toSelectFrom, keyword);
		strcat(toSelectFrom, rightPercent);

		strcat(toSelectFrom, or_1);

		strcat(toSelectFrom, type_1);
		strcat(toSelectFrom, toLike);
		strcat(toSelectFrom, keyword);
		strcat(toSelectFrom, rightPercent);

		strcat(toSelectFrom, or_1);

		strcat(toSelectFrom, type_1);
		strcat(toSelectFrom, toLike);
		strcat(toSelectFrom, keyword);
		strcat(toSelectFrom, rightPercent);
		//下面把完整的SQL查询语句 复制 给 thePerfectSqlLanguage
		strcpy(thePerfectSqlLanguage, toSelectFrom);

		printf("SQL : %s\n", thePerfectSqlLanguage);

		ret = mysql_query(&mysqlConnect, thePerfectSqlLanguage);  //执行
		if (ret != 0) {
			printf("Query failed...Error: %s\n", mysql_error(&mysqlConnect));
			//mysql_close(&mysqlConnect); //关闭连接
			//continue; //退出系统
			/*考虑加个模糊查询*/
		}
		res = mysql_store_result(&mysqlConnect);
		if (res) {
			int fieldCount = mysql_field_count(&mysqlConnect);
			if (fieldCount > 0) {
				int column = mysql_num_fields(res);
				int row = mysql_num_rows(res);
				for (i = 0; field = mysql_fetch_field(res); i++) {
					//获得属性名 
					printf("%25s", field->name);
					printf(" |");
				}
				printf("\n");
				//按行输出结果
				/*for (i = 1; i < row + 1; i++) {
					rowList = mysql_fetch_row(res);  //4273
					for (j = 0; j < column; j++) {
						printf("%10s", rowList[j]);
					}
					printf("\n");
				}*/
				while (nextRow = mysql_fetch_row(res)) {
					for (j = 0; j < column; j++) {
						printf("%25s", nextRow[j]);
						printf(" |");
					}
					printf("\n");
				}
			}
			else {
				printf("No resullt. This is the result of a character splitting query... \n");
			}
		}
		else {
			printf("mysql_store_result...Error: %s\n", mysql_error(&mysqlConnect));
		}

		printf("\n\nIf you still hope to access the database, please input '1' (Stay) or '0' (Exit).\n");

		/*scanf("%d", &yon);
		while (yon != 0 && yon != 1) {
			printf("Warning: You have input the number out of my expection! Please enter '1'(Continue to access the database) or '0'(Exit now) now.\n");
			scanf("%d", &yon);
		}
		if (yon == 1) {
			YesOrNo = yon;
		}
		else if(yon==0) {
			exit(1);
		}*/

		/*之所以不采用上面这种写法是应为当输入非数字类型时会出错*/

		printf("\n\n");
		scanf("%s", yon);  /*如果这里采用getchar那么在回车的一瞬间弹出warning*/
		while (yon[0] != '0' && yon[0] != '1') {
			printf("Warning: You have input the number out of my expection! Please enter '1'(Continue to access the database) or '0'(Exit now) now.\n");
			scanf("%s", yon);
		}
		if (yon[0] == '1') {
			YesOrNo = 1;
		}
		else if (yon[0] == '0') {
			exit(1);
		}
	}
	return 0;
}
```

# EOF