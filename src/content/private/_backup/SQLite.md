---
layout: post
title: "SQLite"
subtitle: "SQLite"
date: 2021-5-25
author: Lonnie iTheds
header-img: "img/hexo.jpg"
cdn: 'header-on'
categories:
	- 数据库
tags:
	-- ODBC
---

<link rel="stylesheet" type="text/css" href="../../auto-number-title.css" />

# SQLite

目前已经找到SQLite源代码。

发现其中ODBC连接是调用了Microsoft的头文件 odbcinst.h ，里面调用了 sql.h 和 sqltypes.h 头文件。

重写了其中ODBC的大部分函数，但是仍使用数据结构。

其中连接过程为
SQLConnect
drvconnect
SQLGetPrivateProfileString(buf, "timeout", "100000",
			       busy, sizeof (busy), ODBC_INI);
dbopen

最后的dbopen中动态连接了库pa.dll，系统库等

HANDLE h = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ,FALSE, GetCurrentProcessId());

## 数据结构

## API接口

## API函数详细

密码加密的过程。
```C++
static char *
uc_to_utf(SQLWCHAR *str, int len)
{
    int i;
    char *cp, *ret = NULL;

    if (!str) {
	return ret;
    }
    if (len == SQL_NTS) {
	len = uc_strlen(str);
    } else {
	len = len / sizeof (SQLWCHAR);
    }
    cp = xmalloc(len * 6 + 1);
    if (!cp) {
	return ret;
    }
    ret = cp;
    for (i = 0; i < len; i++) {
	unsigned long c = str[i];

	if (sizeof (SQLWCHAR) == 2 * sizeof (char)) {
	    c &= 0xffff;
	}
	if (c < 0x80) {
	    *cp++ = c;
	} else if (c < 0x800) {
	    *cp++ = 0xc0 | ((c >> 6) & 0x1f);
	    *cp++ = 0x80 | (c & 0x3f);
	} else if (c < 0x10000) {
	    if (sizeof (SQLWCHAR) == 2 * sizeof (char) &&
		c >= 0xd800 && c <= 0xdbff && i + 1 < len) {
		unsigned long c2 = str[i + 1] & 0xffff;

		if (c2 >= 0xdc00 && c2 <= 0xdfff) {
		    c = (((c & 0x3ff) << 10) | (c2 & 0x3ff)) + 0x10000;
		    *cp++ = 0xf0 | ((c >> 18) & 0x07);
		    *cp++ = 0x80 | ((c >> 12) & 0x3f);
		    *cp++ = 0x80 | ((c >> 6) & 0x3f);
		    *cp++ = 0x80 | (c & 0x3f);
		    ++i;
		    continue;
		}
	    }
	    *cp++ = 0xe0 | ((c >> 12) & 0x0f);
	    *cp++ = 0x80 | ((c >> 6) & 0x3f);
	    *cp++ = 0x80 | (c & 0x3f);
	} else if (c <= 0x10ffff) {
	    *cp++ = 0xf0 | ((c >> 18) & 0x07);
	    *cp++ = 0x80 | ((c >> 12) & 0x3f);
	    *cp++ = 0x80 | ((c >> 6) & 0x3f);
	    *cp++ = 0x80 | (c & 0x3f);
	}
    }
    *cp = '\0';
    return ret;
}
```

连接字符串
```C++
count = snprintf(buf, sizeof (buf),
			 "%s%s%s%s%s%sDatabase=%s;StepAPI=%s;"
			 "SyncPragma=%s;NoTXN=%s;Timeout=%s;"
			 "ShortNames=%s;LongNames=%s;"
			 "NoCreat=%s;NoWCHAR=%s;"
			 "FKSupport=%s;JournalMode=%s;OEMCP=%s;LoadExt=%s;"
			 "BigInt=%s;JDConv=%s;PWD=%s",
			 dsn_0 ? "DSN=" : "",
			 dsn_0 ? dsn : "",
			 dsn_0 ? ";" : "",
			 drv_0 ? "Driver=" : "",
			 drv_0 ? driver : "",
			 drv_0 ? ";" : "",
			 dbname ? dbname : "",
			 setupdlg->attr[KEY_STEPAPI].attr,
			 setupdlg->attr[KEY_SYNCP].attr,
			 setupdlg->attr[KEY_NOTXN].attr,
			 setupdlg->attr[KEY_BUSY].attr,
			 setupdlg->attr[KEY_SHORTNAM].attr,
			 setupdlg->attr[KEY_LONGNAM].attr,
			 setupdlg->attr[KEY_NOCREAT].attr,
			 setupdlg->attr[KEY_NOWCHAR].attr,
			 setupdlg->attr[KEY_FKSUPPORT].attr,
			 setupdlg->attr[KEY_JMODE].attr,
			 setupdlg->attr[KEY_OEMCP].attr,
			 setupdlg->attr[KEY_LOADEXT].attr,
			 setupdlg->attr[KEY_BIGINT].attr,
			 setupdlg->attr[KEY_JDCONV].attr,
			 setupdlg->attr[KEY_PASSWD].attr);
```

## ODBC连接方式

"HY000" : "S1000"分别是信息返回。

SQLConnect
drvconnect
SQLGetPrivateProfileString(buf, "timeout", "100000",
			       busy, sizeof (busy), ODBC_INI);
dbopen

SQLDriverConnectW
drvdriverconnect
dbopen



