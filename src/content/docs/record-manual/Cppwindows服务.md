---
layout: post
title: "C/C++ Windows 服务"
subtitle: "C/C++windows服务"
date: 2021-5-18
author: Lonnie iTheds
header-img: "img/hexo.jpg"
cdn: 'header-on'
categories:
  - 服务器
tags:
  - C++
description: "C/C++ Windows 服务"
---

<link rel="stylesheet" type="text/css" href="../../auto-number-title.css" />

# C/C++ windows服务

希望能够通过一个后台的服务来管理一个程序。

需要知道的是，程序的运行方式，是内部分配一个线程进行运行，还是整体程序都是服务的方式。

## 理论基础

### 服务控制管理器 (SCM)

服务控制管理器 (SCM) 维护安装的服务和驱动程序服务的数据库，并提供统一的安全方法来控制它们。 数据库包括有关如何启动每个服务或驱动程序服务的信息。 它还使系统管理员能够自定义每个服务的安全要求，从而控制对服务的访问。

服务控制管理器 (SCM) 在系统启动时启动。 这是 (RPC) 服务器的远程过程调用，因此服务配置和服务控制程序可以操作远程计算机上的服务。

SCM 维护注册表中已安装服务的数据库。 数据库由用于添加、修改或配置服务的 SCM 和程序使用。 下面是此数据库的注册表项： HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services。
此项包含每个已安装的服务和驱动程序服务的子项。 子项的名称是服务的名称，当服务由服务配置程序安装时，由 CreateService 函数指定。

当服务启动时，SCM 执行以下步骤：
* 检索存储在数据库中的帐户信息。
* 登录服务帐户。
* 加载用户配置文件。
* 创建处于挂起状态的服务。
* 将登录令牌分配给进程。
* 允许执行进程。

于每个服务项都是从已安装服务的数据库中读取的，因此 SCM 将为该服务创建一个服务记录。 服务记录包括：
* 服务名称
* 开始类型 (自动启动或请求开始)
* 服务状态 (参阅 SERVICE_STATUS 结构)
* 类型
* 当前状态
* 可接受控制代码
* 退出代码
* 等待提示
* 指向依赖项列表的指针

### 服务程序

一个服务程序包含一个或多个服务的可执行代码。使用SERVICE_WIN32_OWN_PROCESS类型创建的服务程序仅包含一项服务的代码。使用SERVICE_WIN32_SHARE_PROCESS类型创建的服务程序包含多个服务的代码，从而使它们可以共享代码。可以执行此操作的服务程序示例是通用服务主机进程 Svchost.exe ，该进程承载内部Windows服务。请注意， Svchost.exe 保留供操作系统使用，而不应由非Windows服务使用。相反，开发人员应实施自己的服务托管程序。

服务通常被编写为`控制台应用程序`。控制台应用程序的入口点是其主要功能。的主要功能从接收参数的ImagePath从该服务的注册表键值。有关更多信息，请参见`CreateService`函数的"备注"部分。

当SCM启动服务程序时，它将等待它调用`StartServiceCtrlDispatcher`函数。使用以下准则。
* 类型为`SERVICE_WIN32_OWN_PROCESS`的服务应立即从其主线程调用`StartServiceCtrlDispatcher`。您可以在服务启动后执行任何初始化，如Service `ServiceMain` Function中所述。
* 如果服务类型为`SERVICE_WIN32_SHARE_PROCESS`并且程序中所有服务都有通用的初始化，则只要花费少于30秒，就可以在调用`StartServiceCtrlDispatcher`之前在主线程中执行初始化。否则，您必须创建另一个线程来执行公共初始化，而主线程调用`StartServiceCtrlDispatcher`。服务启动后，您仍应执行任何特定于服务的初始化。

该StartServiceCtrlDispatcher函数采用一个SERVICE_TABLE_ENTRY为包含在所述过程的每个服务结构。每个结构都指定服务名称和服务的入口点。

### 服务配置程序

程序员和系统管理员使用服务配置程序来修改或查询已安装服务的数据库。 还可以使用注册表函数访问数据库。 但是，只应使用 SCM 配置函数，这可确保正确安装和配置服务。

SCM 配置函数需要 SCManager 对象的句柄或服务对象的句柄。 若要获取这些句柄，服务配置程序必须：
使用 OpenSCManager 函数可获取指定计算机上 SCM 数据库的句柄。
使用 OpenService 或 CreateService 函数获取服务对象的句柄。

配置程序使用 CreateService 函数在 SCM 数据库中安装新服务。
配置程序使用 DeleteService 函数从数据库中删除已安装的服务。 

Windows SDK 包含命令行实用程序Sc.exe，可用于查询或修改已安装服务的数据库。 它的命令对应于SCM提供的函数。

### 服务控制程序

服务控制程序用于与服务控制管理器(SCM)通信，以控制已安装的服务。控制程序可以启动、停止、暂停、恢复服务，或者向服务发送自定义控制代码。控制程序使用ControlService函数向服务发送控制代码，使用StartService函数启动服务。

## 结构体系

Windows服务程序有着固定的模式，它一般由四个部分组成：main(), ServiceMain(), ServiceHandler(), MyWork()。

- `main()`: 程序入口点，负责调用StartServiceCtrlDispatcher启动服务调度
- `ServiceMain()`: 服务的主函数，由SCM调用，负责初始化服务并注册控制处理函数
- `ServiceHandler()`: 服务控制处理函数，处理来自SCM的控制请求
- `MyWork()`: 服务的实际工作函数，通常在单独的线程中运行

## 调试程序

程序在编写完成之后，如果是直接执行exe一定会报错 cord : 1603(如果程序是作为控制台应用程序而不是服务运行)。之后通过Sc命令申请作为服务而启动，成功可以运行到下一步。

```cmd
SC create Test3server binPath=F:\project\RecAIS_GPS_HDT1.0v\Release\RecAIS_GPS_HDT.exe start=auto

sc delete Test1server   
```

必须从服务控制管理器的上下文中而不是 Visual Studio 中运行服务。 因此，调试服务不像调试其他 Visual Studio 应用程序类型一样简单。 要调试服务，必须启动该服务，然后将调试器附加到该服务正在其中运行的进程中。 然后你可以使用所有 Visual Studio 的标准调试功能来调试你的应用程序。
[参考调试程序 Micosoft 官方文档](https://docs.microsoft.com/zh-cn/dotnet/framework/windows-services/how-to-debug-windows-service-applications)

## 数据结构

Windows服务程序中常用的数据结构包括：

```cpp
SERVICE_STATUS ServiceStatus;        // 描述服务当前状态
SERVICE_STATUS_HANDLE hStatus;       // 服务状态句柄
SERVICE_TABLE_ENTRY ServiceTable[2]; // 服务表项数组，定义服务入口点
```

## 函数储备

### StartServiceCtrlDispatcher()

```cpp
BOOL StartServiceCtrlDispatcher(
  CONST SERVICE_TABLE_ENTRY *lpServiceTable
);
```

该函数连接服务控制管理器到服务的控制调度程序。这个函数必须在服务程序的主线程中调用。它接收一个SERVICE_TABLE_ENTRY结构数组作为参数，每个结构包含一个服务名称和对应的ServiceMain函数地址。

**参数**：
- `lpServiceTable`: 指向SERVICE_TABLE_ENTRY结构数组的指针，数组的最后一项必须包含NULL值。

**返回值**：
- 如果函数成功，返回值为非零值。
- 如果函数失败，返回值为零。可以通过调用GetLastError获取详细错误信息。

**使用示例**：
```cpp
SERVICE_TABLE_ENTRY ServiceTable[] = 
{
    {SERVICE_NAME, (LPSERVICE_MAIN_FUNCTION)ServiceMain},
    {NULL, NULL}
};

if (!StartServiceCtrlDispatcher(ServiceTable)) 
{
    // 处理错误
}
```

### RegisterServiceCtrlHandler()

```cpp
SERVICE_STATUS_HANDLE RegisterServiceCtrlHandler(
  LPCTSTR               lpServiceName,
  LPHANDLER_FUNCTION    lpHandlerProc
);
```

该函数注册一个函数来处理服务控制请求。通常在ServiceMain函数中调用。

**参数**：
- `lpServiceName`: 要注册的服务名称。
- `lpHandlerProc`: 指向服务控制处理函数的指针。

**返回值**：
- 如果函数成功，返回值为服务状态句柄。
- 如果函数失败，返回值为0。

**使用示例**：
```cpp
hStatus = RegisterServiceCtrlHandler(
    SERVICE_NAME,
    ServiceCtrlHandler);
    
if (hStatus == 0) 
{
    // 处理错误
    return;
}
```

### RegisterServiceCtrlHandlerEx()

```cpp
SERVICE_STATUS_HANDLE RegisterServiceCtrlHandlerEx(
  LPCTSTR                  lpServiceName,
  LPHANDLER_FUNCTION_EX    lpHandlerProc,
  LPVOID                   lpContext
);
```

这是RegisterServiceCtrlHandler的扩展版本，允许传递上下文参数，并支持更多的控制代码。

**参数**：
- `lpServiceName`: 要注册的服务名称。
- `lpHandlerProc`: 指向服务控制处理函数的指针。
- `lpContext`: 要传递给处理函数的用户定义的上下文数据。

### SetServiceStatus()

```cpp
BOOL SetServiceStatus(
  SERVICE_STATUS_HANDLE   hServiceStatus,
  LPSERVICE_STATUS        lpServiceStatus
);
```

该函数更新服务控制管理器的服务状态记录。服务必须在其状态发生变化时调用此函数。

**参数**：
- `hServiceStatus`: 服务状态句柄，由RegisterServiceCtrlHandler返回。
- `lpServiceStatus`: 指向SERVICE_STATUS结构的指针，包含最新的服务状态信息。

**返回值**：
- 如果函数成功，返回值为非零值。
- 如果函数失败，返回值为零。

**使用示例**：
```cpp
ServiceStatus.dwServiceType = SERVICE_WIN32_OWN_PROCESS;
ServiceStatus.dwCurrentState = SERVICE_START_PENDING;
ServiceStatus.dwControlsAccepted = SERVICE_ACCEPT_STOP | SERVICE_ACCEPT_SHUTDOWN;
ServiceStatus.dwWin32ExitCode = 0;
ServiceStatus.dwServiceSpecificExitCode = 0;
ServiceStatus.dwCheckPoint = 0;
ServiceStatus.dwWaitHint = 0;

SetServiceStatus(hStatus, &ServiceStatus);
```

### OpenSCManager()

```cpp
SC_HANDLE OpenSCManager(
  LPCTSTR lpMachineName,
  LPCTSTR lpDatabaseName,
  DWORD   dwDesiredAccess
);
```

打开服务控制管理器数据库的连接。

**参数**：
- `lpMachineName`: 目标计算机名称，NULL表示本地计算机。
- `lpDatabaseName`: 服务控制管理器数据库名称，通常为"ServicesActive"。
- `dwDesiredAccess`: 请求的访问权限。

### CreateService()

```cpp
SC_HANDLE CreateService(
  SC_HANDLE hSCManager,
  LPCTSTR   lpServiceName,
  LPCTSTR   lpDisplayName,
  DWORD     dwDesiredAccess,
  DWORD     dwServiceType,
  DWORD     dwStartType,
  DWORD     dwErrorControl,
  LPCTSTR   lpBinaryPathName,
  LPCTSTR   lpLoadOrderGroup,
  LPDWORD   lpdwTagId,
  LPCTSTR   lpDependencies,
  LPCTSTR   lpServiceStartName,
  LPCTSTR   lpPassword
);
```

创建一个服务对象并将其添加到指定的服务控制管理器数据库中。

### OpenService()

```cpp
SC_HANDLE OpenService(
  SC_HANDLE hSCManager,
  LPCTSTR   lpServiceName,
  DWORD     dwDesiredAccess
);
```

打开一个已存在的服务。

### StartService()

```cpp
BOOL StartService(
  SC_HANDLE            hService,
  DWORD                dwNumServiceArgs,
  LPCTSTR              *lpServiceArgVectors
);
```

启动一个服务。

### ControlService()

```cpp
BOOL ControlService(
  SC_HANDLE           hService,
  DWORD               dwControl,
  LPSERVICE_STATUS    lpServiceStatus
);
```

向指定的服务发送控制代码。

### DeleteService()

```cpp
BOOL DeleteService(
  SC_HANDLE   hService
);
```

从SCM数据库中标记指定的服务以便删除。

### CloseServiceHandle()

```cpp
BOOL CloseServiceHandle(
  SC_HANDLE   hSCObject
);
```

关闭服务控制管理器或服务的句柄。

## 服务程序示例

下面是一个简单的Windows服务程序框架：

```cpp
#include <windows.h>
#include <tchar.h>
#include <stdio.h>

#define SERVICE_NAME _T("MyService")

SERVICE_STATUS ServiceStatus;
SERVICE_STATUS_HANDLE hStatus;

void WINAPI ServiceMain(DWORD argc, LPTSTR *argv);
void WINAPI ServiceCtrlHandler(DWORD);
void ServiceReportStatus(DWORD dwCurrentState, DWORD dwWin32ExitCode, DWORD dwWaitHint);
void DoWork();

int _tmain(int argc, TCHAR *argv[])
{
    SERVICE_TABLE_ENTRY ServiceTable[] = 
    {
        {SERVICE_NAME, (LPSERVICE_MAIN_FUNCTION)ServiceMain},
        {NULL, NULL}
    };

    if (!StartServiceCtrlDispatcher(ServiceTable))
    {
        // 如果不是作为服务启动，可以在这里添加调试代码
        return GetLastError();
    }

    return 0;
}

void WINAPI ServiceMain(DWORD argc, LPTSTR *argv)
{
    // 注册服务控制处理函数
    hStatus = RegisterServiceCtrlHandler(SERVICE_NAME, ServiceCtrlHandler);
    if (hStatus == 0)
    {
        return;
    }

    // 初始化服务状态
    ServiceStatus.dwServiceType = SERVICE_WIN32_OWN_PROCESS;
    ServiceStatus.dwCurrentState = SERVICE_START_PENDING;
    ServiceStatus.dwControlsAccepted = SERVICE_ACCEPT_STOP | SERVICE_ACCEPT_SHUTDOWN;
    ServiceStatus.dwWin32ExitCode = 0;
    ServiceStatus.dwServiceSpecificExitCode = 0;
    ServiceStatus.dwCheckPoint = 0;
    ServiceStatus.dwWaitHint = 0;

    // 报告服务状态为启动中
    ServiceReportStatus(SERVICE_START_PENDING, NO_ERROR, 3000);

    // 执行服务初始化
    BOOL bResult = TRUE;
    
    // TODO: 在此处执行服务初始化

    // 如果初始化成功，报告服务状态为运行中
    if (bResult)
    {
        ServiceReportStatus(SERVICE_RUNNING, NO_ERROR, 0);
        
        // 执行服务主要工作
        DoWork();
    }
    else
    {
        ServiceReportStatus(SERVICE_STOPPED, GetLastError(), 0);
    }
}

void WINAPI ServiceCtrlHandler(DWORD dwControl)
{
    switch (dwControl)
    {
    case SERVICE_CONTROL_STOP:
    case SERVICE_CONTROL_SHUTDOWN:
        ServiceReportStatus(SERVICE_STOP_PENDING, NO_ERROR, 0);
        
        // TODO: 在此处执行清理工作
        
        ServiceReportStatus(SERVICE_STOPPED, NO_ERROR, 0);
        break;
    case SERVICE_CONTROL_PAUSE:
        ServiceReportStatus(SERVICE_PAUSED, NO_ERROR, 0);
        break;
    case SERVICE_CONTROL_CONTINUE:
        ServiceReportStatus(SERVICE_RUNNING, NO_ERROR, 0);
        break;
    case SERVICE_CONTROL_INTERROGATE:
        // 只需返回当前状态
        break;
    default:
        break;
    }
}

void ServiceReportStatus(DWORD dwCurrentState, DWORD dwWin32ExitCode, DWORD dwWaitHint)
{
    static DWORD dwCheckPoint = 1;

    ServiceStatus.dwCurrentState = dwCurrentState;
    ServiceStatus.dwWin32ExitCode = dwWin32ExitCode;
    ServiceStatus.dwWaitHint = dwWaitHint;

    if (dwCurrentState == SERVICE_START_PENDING)
    {
        ServiceStatus.dwControlsAccepted = 0;
    }
    else
    {
        ServiceStatus.dwControlsAccepted = SERVICE_ACCEPT_STOP | SERVICE_ACCEPT_SHUTDOWN;
    }

    if ((dwCurrentState == SERVICE_RUNNING) || (dwCurrentState == SERVICE_STOPPED))
    {
        ServiceStatus.dwCheckPoint = 0;
    }
    else
    {
        ServiceStatus.dwCheckPoint = dwCheckPoint++;
    }

    SetServiceStatus(hStatus, &ServiceStatus);
}

void DoWork()
{
    // 这里是服务的主要工作逻辑
    // 通常会创建一个工作线程来执行实际工作
    
    // 示例：简单的无限循环，等待服务停止信号
    while (ServiceStatus.dwCurrentState == SERVICE_RUNNING)
    {
        // TODO: 执行服务工作
        Sleep(1000);  // 避免CPU占用过高
    }
}
```

这个示例展示了一个基本的Windows服务框架，包含了服务的基本生命周期管理。
