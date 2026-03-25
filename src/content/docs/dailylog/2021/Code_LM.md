---
title: "Code_LM"
description: "Code_LM"
---

# Code_LM

任务线路：
[9.8]
完成拆包、组包基本函数。
[9.15]
反馈，该任务并没有基本完成。
经过组内讨论，废除该方法，因为socket底层已经实现了组包和拆包的过程。为调研问题。

## 熟悉 aeci 层接口使用方式[9.16]

1. 创建数据库的整个流程。
2. 了解TCP的基本操作。

```C++
#define USER_TABLE_NAME	"pokTable"
#define USER_DB_NAME	"pokAuthDb"
#define USER_FILE_NAME	"F:\\log\\pok.aed"

//数据库模型
static aeci_field_descriptor user_table_descriptor[] =
{
	{aeci_int4, 0, "uid"},
	{aeci_int4, 0, "auth"},
	{aeci_int4, 0, "token"},
};
typedef struct USER_Table
{
	aeci_int4_t uid;
	aeci_int4_t auth;
	aeci_int4_t token;
};

//创建用于权限认证数据库的函数
int create_user_db() {
    int rc = 0;
    int session = 0;
    aeci_oid_t oid1 = NULL;
    
    //建库建表
    session = aeci_create(USER_DB_NAME, USER_FILE_NAME,
        0, 0x04, 4 * 1024 * 1024, 4 * 1024 * 1024, 512 * 1024, 0);

    if (session < 0)
        printf("Creating database failed!\n");

    printf("Creating database!\n");
    rc = aeci_create_table(session, USER_TABLE_NAME, 
        sizeof(user_table_descriptor) / sizeof(aeci_field_descriptor), user_table_descriptor);
    if (rc >= 0)
        printf("Create table successful.\n");
    else
        printf("Create table failed with db code.\n");

    //拟定数据
    USER_Table user_test_table;
    user_test_table.uid = 567;
    user_test_table.auth = 631725;
    user_test_table.token = 907823;

    //插入数据
    rc = aeci_insert_struct(session, USER_TABLE_NAME, &user_test_table, &oid1);
    aeci_commit(session);

    //查询验证
    int statement = 0;
    char query_sql[64] = "select * from ";
    strcat(query_sql, USER_TABLE_NAME);
    USER_Table tmp;
    statement = aeci_prepare_query(session, query_sql);//预查询
    rc = aeci_execute_query(statement, aeci_view_only, &tmp);
    while (aeci_get_next(statement) == rc_ok)//组查询
    {
        printf(" uid : %d \n auth : %d \n token : %d \n", tmp.uid, tmp.auth, tmp.token);
    }

    aeci_close(session);
    return 1;
}
```

## [9.17]


# 附录(后续移除)

Code文件为代号文件。

敏感内容不做直接书写。
决定性词汇无关联书写。
主要内容根据程度书写。
