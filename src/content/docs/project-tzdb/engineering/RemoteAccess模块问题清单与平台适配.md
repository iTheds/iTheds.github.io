---
title: "RemoteAccess模块问题清单与平台适配"
description: "汇总 RemoteAccess 模块已知问题、待补齐项与锐华适配要点"
---

## 已知问题

1. `[0]` `SQLTOOL` 存在报错:当数据库建立之后再次打开时出现，怀疑数据库未正常关闭。
2. `[2]` 应用程序连接数据源时，驱动程序定位指定 `ip` 和 `port` 的过程目前由程序硬编码决定；更合理的方式是放入信息记录中读取。MySQL 配置数据源时也需要明确 `TCP/IP Server` 的 IP 和端口。
3. `[0]` 接口更新路径仍不清晰，也需要重新说明为什么不再使用旧接口。
4. `[1]` `global` 中与时间相关的函数需要重写。
5. `[4]` `ConProtocal` 中关于 I/O 模型的相关函数需要重写。
6. `[3]` `ConPool` 中线程池仍需编写完成。
7. `[0]` `AccessPer` 中的 `itoa` 需要重写。
8. `[1]` `AccessPer` 使用的 `aeci` 层接口在新版下无法查询。
9. `[2]` 需要补充主动注册信息的状态接口。
10. `[0]` `tzdb_stmt_fetch` 中逻辑错误，`tzdb->cursor == NULL` 的判断时机不对。
11. `[1]` 客户端接收端在服务端断开时处理存在问题。
12. `[1]` `SQLTOOL` 线程在程序结束时的退出处理仍有问题。

## 待补齐项

1. `[1]` `server` 中用户认证 `token` 对比代码的分布还需要进一步整理。
2. `[1]` 需要增加本地表，用于存储 ODBC 体系中的数据源信息。

## 已解决项

1. `[1]` `server` 中用户认证添加验证信息的问题已经解决。

## 平台适配

当前适配范围包括:

- Windows
- 天脉 2
- 天脉 3
- 锐华

### 锐华适配要点

当前明确的适配内容有:

1. `socket` 适配。
2. ODBC 标准头文件中的宏兼容。

对应修改项:

1. `AeCI.cpp`
   注释大部分内容。
2. `AeCILocal.h`
   将 `void *initERR(MCO_RET i);` 从定义改为声明，并把定义放到 `AeCILocal.cpp` 中。
3. `SQLTool.cpp` / `SQLTool.h`
   计划更新 `dbDatabase::open` 的接口问题。
4. 尚有疑点:
   为什么此前没有使用新接口。
5. 仍需判断:
   是否可以完全不依赖 `AeCI` 层文件。

### 平台备忘

```text
ifconfig syn0 192.168.1.100
boot tftp://192.168.1.102/reworks.elf

SATA支持
控制台
强制链接库
shell
LWIP协议栈

883
1 extend call : 7883
in:330801 extend call : 7883
```
