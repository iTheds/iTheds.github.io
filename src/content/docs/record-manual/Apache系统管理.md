---
title: "Apache系统管理"
description: "Apache系统管理"
---

<link rel="stylesheet" type="text/css" href="../../auto-number-title.css" />

# Apache系统管理

Apache HTTP Server（简称Apache）是世界使用排名领先的Web服务器软件之一。它可以运行在几乎所有广泛使用的计算机平台上。

## 基本信息

- **配置文件路径**：`/etc/httpd/conf/httpd.conf`
- **网站根目录**：`/var/www/html/`
- **默认监听端口**：80

## 安装与启动

```bash
# 安装Apache服务器
yum install httpd -y

# 安装Apache手册（可选）
yum install httpd-manual -y

# 启动Apache服务
systemctl start httpd 

# 设置开机自启
systemctl enable httpd 
```

## 防火墙配置

```bash
# 查看防火墙信息
firewall-cmd --list-all

# 永久允许HTTP服务通过防火墙
firewall-cmd --permanent --add-service=http

# 重新加载防火墙配置
firewall-cmd --reload
```

## 网站目录结构

- `/var/www/html` - Apache的默认网站根目录
- `/var/www/html/index.html` - 默认首页文件

创建默认首页示例：
```bash
vim /var/www/html/index.html
```

## 查看服务状态

查看Apache默认端口监听情况：
```bash
netstat -antlupe | grep httpd
```

## 配置镜像源

镜像配置文件目录：`/etc/yum.repos.d/`

替换为国内镜像源（以阿里云为例）：
```bash
sed -i 's|^#baseurl=https://download.fedoraproject.org/pub|baseurl=https://mirrors.aliyun.com|' /etc/yum.repos.d/epel*
sed -i 's|^metalink|#metalink|' /etc/yum.repos.d/epel*
```

## 主要配置文件解析

Apache的主要配置参数说明：

```apache
# 服务器根目录
ServerRoot "/etc/httpd"

# 监听端口
Listen 80

# 包含模块配置
Include conf.modules.d/*.conf

# 运行用户和组
User apache
Group apache

# 根目录访问控制
<Directory />
    AllowOverride none
    Require all denied
</Directory>

# 网站根目录
DocumentRoot "/var/www/html"
```

## 虚拟主机配置

Apache支持基于名称和IP的虚拟主机配置，可以在一台服务器上托管多个网站。

基本虚拟主机配置示例：
```apache
<VirtualHost *:80>
    ServerName www.example.com
    DocumentRoot /var/www/example
    ErrorLog logs/example-error_log
    CustomLog logs/example-access_log combined
</VirtualHost>
```

## 常见问题

### 文件命名注意事项

在Windows系统上，文件名不能包含以下字符：`？\ * | " < > : /`，且不能使用URL编码。

例如：写C/C++相关文章时，如果命名为`C%2fC%2b%2b`，解析时将无法正常打开该文章。