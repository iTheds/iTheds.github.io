---
title: "UNIX系统使用笔记"
date: "2022-9-28"
subtitle: "用上Debian整个人都感觉更专业了呢"
author: "Lonnie iTheds"
tags:
  - linux
categories:
  - 服务器
draft: true
section: "drafts"
sourcePath: "markdown/_drafts/UNIX系统使用笔记.md"
slug: "_drafts/UNIX系统使用笔记"
---

# Debian using record

## Download

Wget for download , and download the .deb is best, it can use `apt`  to install .
if is the tar.gz , may  it can extract to /opt/ file. 

Then hard is let system to know it .
We can add a .desktop file under /usr/share/applications, input:

```shell
[Desktop Entry]
Name=Ulipad
Comment=a Python IDE
Exec=/home/zhao/ulipad/UliPad.py
Icon=/home/zhao/ulipad/Ulipad.png
Terminal=false
Type=Application
Categories=Application;Development;
```

The clion is:

```shell
[Desktop Entry]
Name=jetbrains-clion
Comment=Clion
Exec=/opt/clion-2022.2.4/bin/clion.sh %F
Icon=/opt/clion-2022.2.4/bin/clion.svg
Terminal=false
StartupNotify=true
StartupWMClass=jetbrains-clion
Type=Application
Categories=Deveopment;IDE;
Keywords=Clion
```

And the pycharm is :

```shell
[Desktop Entry]
Name=jetbrains-pycharm
Comment=Pycharm
Exec=/opt/pycharm-2022.2.3/bin/pycharm.sh %F
Icon=/opt/pycharm-2022.2.3/bin/pycharm.svg
Terminal=false
StartupNotify=true
StartupWMClass=jetbrains-pycharm
Type=Application
Categories=Deveopment;IDE;
Keywords=Pycharm
```

## SSH to other computer

assum ip is 192.168.1.114, and set the file /home/remote-dir for global.
So windows could use 
    scp filename username@ip_address:/home/username
to send file.
For example,
    scp filename ithedslonnie@192.168.1.114:/home/remote-dir

But how To send file to windows ? this monent may be more complex.
First , close windows microsoft defender private network.
Okey, the fast way is , copy file from linux, windows dos:

```bash
    scp ithedslonnie@192.168.1.114:/home/remote-dir/filename D:/Desktop
```

just same as push file.
Buy the way , if the file is a dir , shuold add -r for send the file system.

## Time

Synchronize the time with the internet time.

```bash
    sudo apt-get install ntpdate

    sudo /usr/sbin/ntpdate -u cn.pool.ntp.org
```

## Install boost

```bash
    ./bootstrap.sh --prefix=/usr/local/
    sudo ./b2 install --with=all
```

## Install deb file

    sudo dpkg -i package_file.deb
    sudo apt-get -f install

## apt backage manage

install just use 'apt install [package_name]' .

check whether the package is installed, use
```bash
    apt-cache policy [package_name]
    apt -qq list [package_name]
    dpkg-query --list | grep -i [package_name] # '-i' is mean the frist result.
    dpkg -l | grep -i [package_name]
```

base info :

* pt-cache：可用于查询 APT 缓存或程序包的元数据。
* apt：是基于 Debian 的系统中的安装、下载、删除、搜索和管理包的强有力的工具。
* dpkg-query：一个查询 dpkg 数据库的工具。
* dpkg：基于 Debian 的系统的包管理工具。
* which：返回在终端中输入命令时执行的可执行文件的全路径。
* whereis：可用于搜索指定命令的二进制文件、源码文件和帮助文件。
* locate：比 find 命令快，因为其使用 updatedb 数据库搜索，而 find命令在实际系统中搜索。

about search we can use `apt-cache search` to search what is installed.

##  Find dir or file

this `d` means dir:

    sudo find . -type d -name [dir name]

find file:

    sudo find type f -name [file name]

    find /path/to/search/directory -type f -name "*key*"
    
    

## Search 

```bash
grep -r "keyword" ./
```

## 显卡不启动问题

```bash
find . -type f -name "NVIDIA-Linuxc*"

nvidia-smi

NVIDIA-SMI has failed because it couldn't communicate with the NVIDIA driver. Make sure that the latest NVIDIA driver is installed and running.

NVIDIA-Linux-x86_64-535.129.03.run

/var/log/nvidia-installer.log

sudo sh NVIDIA-Linux-x86_64-535.129.03.run --dkms

/etc/apt/sources.list

sudo nvidia-detect

sudo dkms install -m nvidia -v 535.129.03

sudo dkms install -m nvidia-current -v 470.141.03

使用nvcc -V检查驱动和cuda。

sudo lshw -C display 

glxinfo | grep "OpenGL renderer"

lspci -k | grep -A 2 -i vga

modprobe nvidia

xrandr

iptux
clamAV
```

## 修改了 /usr/bin 的权限导致无法使用 su sudo

修改了/usr/bin文件夹的权限为755， 无法使用 su 和 sudo 命令。


## Apt Source

we can change source by vim /etc/apt/sources.list

```bash
# Debian 10 buster

# 中科大源

deb http://mirrors.ustc.edu.cn/debian buster main contrib non-free
deb http://mirrors.ustc.edu.cn/debian buster-updates main contrib non-free
deb http://mirrors.ustc.edu.cn/debian buster-backports main contrib non-free
deb http://mirrors.ustc.edu.cn/debian-security/ buster/updates main contrib non-free

# deb-src http://mirrors.ustc.edu.cn/debian buster main contrib non-free
# deb-src http://mirrors.ustc.edu.cn/debian buster-updates main contrib non-free
# deb-src http://mirrors.ustc.edu.cn/debian buster-backports main contrib non-free
# deb-src http://mirrors.ustc.edu.cn/debian-security/ buster/updates main contrib non-free

# 官方源

# deb http://deb.debian.org/debian buster main contrib non-free
# deb http://deb.debian.org/debian buster-updates main contrib non-free
# deb http://deb.debian.org/debian-security/ buster/updates main contrib non-free

# deb-src http://deb.debian.org/debian buster main contrib non-free
# deb-src http://deb.debian.org/debian buster-updates main contrib non-free
# deb-src http://deb.debian.org/debian-security/ buster/updates main contrib non-free

# 网易源

# deb http://mirrors.163.com/debian/ buster main non-free contrib
# deb http://mirrors.163.com/debian/ buster-updates main non-free contrib
# deb http://mirrors.163.com/debian/ buster-backports main non-free contrib
# deb http://mirrors.163.com/debian-security/ buster/updates main non-free contrib

# deb-src http://mirrors.163.com/debian/ buster main non-free contrib
# deb-src http://mirrors.163.com/debian/ buster-updates main non-free contrib
# deb-src http://mirrors.163.com/debian/ buster-backports main non-free contrib
# deb-src http://mirrors.163.com/debian-security/ buster/updates main non-free contrib

# 阿里云

# deb http://mirrors.aliyun.com/debian/ buster main non-free contrib
# deb http://mirrors.aliyun.com/debian/ buster-updates main non-free contrib
# deb http://mirrors.aliyun.com/debian/ buster-backports main non-free contrib
# deb http://mirrors.aliyun.com/debian-security buster/updates main

# deb-src http://mirrors.aliyun.com/debian/ buster main non-free contrib
# deb-src http://mirrors.aliyun.com/debian/ buster-updates main non-free contrib
# deb-src http://mirrors.aliyun.com/debian/ buster-backports main non-free contrib
# deb-src http://mirrors.aliyun.com/debian-security buster/updates main
```

tips:
"non-free" 是一个在开源软件社区中用来描述软件许可的术语。在这个上下文中，"non-free" 表示该软件的许可证不符合自由软件定义（Free Software Foundation 制定的一组软件自由原则）。

具体而言：

    Free Software（自由软件）：指的是用户拥有运行、复制、分发、学习、修改软件的自由。这与软件的价格无关，而是强调用户对软件的控制权。自由软件的例子包括 GNU/Linux 操作系统和许多开源工具。

    non-free（非自由软件）：指的是用户在使用、修改或分发软件时受到一些限制，这可能包括专有软件的使用条件、不能查看源代码或不能自由修改和分发的限制。

在 Debian 等一些 Linux 发行版中，软件被分为不同的组，其中之一就是 "non-free"。这表示该软件并不符合自由软件的定义，但由于一些原因（例如专有驱动程序或受法律限制），它仍然包含在发行版中。

总体而言，"non-free" 表示一种与自由软件原则不完全一致的软件许可。

### Error:Source disabled

some times call:
```bash
The repository 'cdrom://[Official Debian GNU/Linux Live 11.5.0 gnome 2022-09-10T11:47] bullseye Release' does not have a Release file. 
```

This may the source address is enabled.
Just remove source.

### Error:about the key

After change the soiurce list, I want update apt , `apt-get update` , but echo the failed:

```bash
The following signatures couldn't be verified because the public key is not available: NO_PUBKEY 467B942D3A79BD29
```

Execute command `sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 467B942D3A79BD29`, and reboot , is okay.

### Error:libssl

I want to install libssl, but echo failed :

```bash
error while loading shared libraries: libssl.so.0.9.8: cannot open shared object file: No such file or directory
```

I check the libssl version. The following packages have been installed:

```bash
ii  libssl-dev:amd64                       1.1.1n-0+deb11u3                       amd64        Secure Sockets Layer toolkit - development files
ii  libssl1.1:amd64                        1.1.1n-0+deb11u3                       amd64        Secure Sockets Layer toolkit - shared libraries
```

May those packages confict.
Remove the dev :
    sudo apt autoremove libssl-dev

Then is ok.

# Fedora useing recode

## nvidia question

just reinstall it.

```shell
  331  startx
  332  nmcli connection show
  333  nmcli connection up Net\ Shard 
  334  ping www.baidu.com
  335  cd /var/log/
  337  rm -rf Xorg.0.log
  338  cat /etc/default/grub 
  339  grub2-mkconfig -o /boot/grub2/grub.cfg 
  340  sudo reboot
  341  nmcli connection up Net\ Shard 
  342  cd /var/log/
  344  startx
  348  cat Xorg.0.log | grep EE
  349  dmesg | grep niv
  350  dmesg | grep nvi
  351  dnf list installed \*nvidia\*
  352  dnf install akmod-nvidia
  354  dnf install cuda
  355  dnf install akmod-nvidia
  356  dnf install
  357  dnf update
  358  startx
  359  dnf install akmod-nvidia
  362  systemctl reboot 
  374  dnf update
  375  dnf remove $(rpm -qa | grep 6.9.5-100)
  379  dnf remove $(rpm -qa | grep nvidia)
  380  dnf list installed | grep nvi
  381  nvidia-smi
  382  neofetch
  383  dnf install kernel-headers kernel-devel
  384  dnf install akmods mokutil openssl dkms
  385  lshw -c video
  386  lspci | grep -i vga
  387  nvidia-smi
  388  dnf install nvidia
  389  dnf install cuda
  390  echo $XDG_SESSION_TYPE
  391  startx
  392  nvidia-smi
  393  dnf install nvidia-driver
  394  nvidia-smi
  401  dnf list installed| grep nvi
  402  dnf list installed| grep cuda
  404  dnf list installed| grep akm
  405  dnf install akmod-nvidia
  410  dnf remove $(rpm -qa | grep 3:555.58.02)
  411  dnf remove $(rpm -qa | grep akmods-nvidia)
  412  sudo dnf upgrade --refresh
  413  dnf remove $(rpm -qa | grep akmod-nvidia)
  414  dnf install akmod-nvidia
  415  sudo dnf clean all
  416  sudo dnf install akmod-nvidia
  417  lspci -k | grep -EA3 'VGA|3D'
  426  vim /etc/modprobe.d/blacklist-nouveau.conf
  427  sudo dracut --force
  428  sudo dnf install nvidia-kmod-common
  429  lspci -k | grep -EA3 'VGA|3D'
  430  sudo systemctl restart systemd-modules-load.service
  431  sudo dnf install akmod-nvidia
  432  dnf repolist
  445  sudo dnf config-manager --set-disabled cuda-fedora36-x86_64
  446  sudo dnf config-manager --set-disabled cuda-fedora37-x86_64
  447  dnf repolist
  448  sudo dnf install akmod-nvidia
  449  nvidia-smi
  450  lsmod | grep nvidia
  451  systemctl status akmods
  452  sudo akmods --force
  453  sudo systemctl restart systemd-modules-load.service
  454  dmesg | grep nvidia
  455  sudo dnf install nvidia-utils
  456  which nvidia-smi
  457  systemctl reboot
  458  history
```

for update ：

    sudo dnf install akmod-nvidia

not work show:

```shell
$ nvidia-smi
Sat Oct 19 12:39:37 2024       
+-----------------------------------------------------------------------------------------+
| NVIDIA-SMI 555.42.06              Driver Version: 560.35.03      CUDA Version: 12.6     |
|-----------------------------------------+------------------------+----------------------+
| GPU  Name                 Persistence-M | Bus-Id          Disp.A | Volatile Uncorr. ECC |
| Fan  Temp   Perf          Pwr:Usage/Cap |           Memory-Usage | GPU-Util  Compute M. |
|                                         |                        |               MIG M. |
|=========================================+========================+======================|
|   0  NVIDIA GeForce GTX 1660 ...    Off |   00000000:01:00.0  On |                  N/A |
| 27%   44C    P8             12W /  125W |      28MiB /   6144MiB |      0%      Default |
|                                         |                        |                  N/A |
+-----------------------------------------+------------------------+----------------------+
                                                                                         
+-----------------------------------------------------------------------------------------+
| Processes:                                                                              |
|  GPU   GI   CI        PID   Type   Process name                              GPU Memory |
|        ID   ID                                                               Usage      |
|=========================================================================================|
|  No running processes found                                                             |
+-----------------------------------------------------------------------------------------+
```

if it work, show:
```shell
ithedslonnie@fedora:~$ nvidia-smi
Tue Oct 22 14:50:37 2024       
+-----------------------------------------------------------------------------------------+
| NVIDIA-SMI 560.35.03              Driver Version: 560.35.03      CUDA Version: 12.6     |
|-----------------------------------------+------------------------+----------------------+
| GPU  Name                 Persistence-M | Bus-Id          Disp.A | Volatile Uncorr. ECC |
| Fan  Temp   Perf          Pwr:Usage/Cap |           Memory-Usage | GPU-Util  Compute M. |
|                                         |                        |               MIG M. |
|=========================================+========================+======================|
|   0  NVIDIA GeForce GTX 1660 ...    Off |   00000000:01:00.0  On |                  N/A |
| 28%   44C    P8             13W /  125W |     732MiB /   6144MiB |     17%      Default |
|                                         |                        |                  N/A |
+-----------------------------------------+------------------------+----------------------+
                                                                                         
+-----------------------------------------------------------------------------------------+
| Processes:                                                                              |
|  GPU   GI   CI        PID   Type   Process name                              GPU Memory |
|        ID   ID                                                               Usage      |
|=========================================================================================|
|    0   N/A  N/A      2705      G   /usr/libexec/Xorg                             285MiB |
|    0   N/A  N/A      3043      G   /usr/bin/gnome-shell                          129MiB |
|    0   N/A  N/A      5096      G   ...erProcess --variations-seed-version        143MiB |
|    0   N/A  N/A      5214      G   /usr/lib64/firefox/firefox                    157MiB |
|    0   N/A  N/A      7935      G   ...12.12/Tools/QtCreator/bin/qtcreator          2MiB |
+-----------------------------------------------------------------------------------------+
```

## kill a port for user

```shell
 1001  ss -tuanlp | grep 8223
 1002  sudo fuser -k 8223/tcp
 1003  ps -p 1855 -o pid,cmd
 1004  sudo kill -9 1855
```

## delete file

find /path/to/directory -type f | xargs rm -f

## package management

误删 /opt/ 下所有文件， `sudo rm -rf /opt/ * Postmen/` :

history:
```bash
ls
clion-2024.3.1.1     postman-linux-arm64.tar.gz
containerd           Qt5.12.12
drawio               sogoupinyin
google               todesk
idea-IU-241.17890.1  warpdotdev
kingsoft             wechat
nvidia               Xmind
```

```bash
sudo dnf clean all
sudo dnf check

sudo rpm -qa | grep wechat

sudo rpm -e wechat-4.0.1.11-1.x86_64

sudo rpm -e --noscripts wps-office-11.1.0.11720-1.x86_64
```     

