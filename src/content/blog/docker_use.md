---
title: "Docker Used Node"
date: "2023-3-10"
author: "Lonnie iTheds"
tags:
  - docker
categories:
  - 服务器
draft: false
section: "posts"
sourcePath: "markdown/_posts/docker_use.md"
slug: "docker_use"
---

# Docker Used Node

## Theory

```
+-----+-----+-----+-----+
                             |App A|App B|App C|App D|
+-----+-----+-----+-----+    +-----+-----+-----+-----+
|App A|App B|App C|App D|    |Guest|Guest|Guest|Guest|
+-----+-----+-----+-----+    | OS0 | OS1 | OS2 | OS3 |
|Guest|Guest|Guest|Guest|    +-----+-----+-----+-----+
| OS0 | OS1 | OS2 | OS3 |    |        Hypervisor     |
+-----+-----+-----+-----+    +-----------------------+
|        Hypervisor     |    |         Host OS       |
+-----------------------+    +-----------------------+
|        Hardware       |    |        Hardware       |
+-----------------------+    +-----------------------+
          Type I                       Type II
```

```

+-----+-----+-----+-----+                                   +-----+-----+-----+-----+
|App A|App B|App C|App D|     +-----+-----+-----+-----+     |App A|App B|App C|App D|
+-----+-----+-----+-----+     |App A|App B|App C|App D|     +-----+-----+-----+-----+
|+---------------------+|     +-----+-----+-----+-----+     |Guest|Guest|Guest|Guest|
||   Runtime Library   ||     |Lib A|Lib B|Lib C|Lib D|     | OS0 | OS1 | OS2 | OS3 |
|+---------------------+|     +-----+-----+-----+-----+     +-----+-----+-----+-----+
||       Kernel        ||     |    Container Engine   |     |        Hypervisor     |
|+---------------------+|     +-----------------------+     +-----------------------+
|   Operating System    |     |         Host OS       |     |         Host OS       |
+-----------------------+     +-----------------------+     +-----------------------+
|       Hardware        |     |        Hardware       |     |        Hardware       |
+-----------------------+     +-----------------------+     +-----------------------+
    Physical Machine                  Container                 Type II Hypervisor
```

## Install docker

Debian System。

install：
    
    curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun

rely on:
```bash
sudo apt-get install \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg2 \
    software-properties-common
```

    sudo apt-get install docker-ce docker-ce-cli containerd.io

get key :

    curl -fsSL https://mirrors.ustc.edu.cn/docker-ce/linux/debian/gpg | sudo apt-key add -

test for key (just list , also `apt-key list`):

    sudo apt-key fingerprint 0EBFCD88

may `0EBFCD88` stand for the public key about docker ?


check the docker server status :

    systemctl status docker

## Base command

### build a docker image

`sudo docker build -t mock_server .`

### run and stop

run just read command :
`sudo docker run --rm tzdb_image [command]`

stop :
docker stop [name]

### save image and

docker save -o your_image.tar your_image

docker load -i /path/to/destination/your_image.tar

### about shell and command in image

into bash:

`sudo docker exec -it [run_name] bash`
`sudo docker exec -i -t [run_name] /bin/bash`

if not run , run some command:

docker run --rm [image_name] [command]

### show and delete

show all running docker image:

`sudo docker ps -a`

remove docker:

`docker rmi -f [REPOSITORY/IMAEG ID]`

delete all tag is `<none>` image :

`sudo docker image prune -f`

use system to clear all not used image :

`sudo docker system prune -a -f`

### change docker image repository

```shell
vim /etc/docker/daemon.json

{
  "registry-mirrors": ["https://registry.dockermirror.com"]
}

{
  "registry-mirrors": ["https://docker.kejilion.pro"]
}
```

## [example] for multi-device, about network

show ip :

docker inspect [run_name]

create a network

<!-- docker network create tz_network -->
docker network create --subnet=172.18.0.0/16 tz_network

conf device1 network, it can be interview by 0.0.0.0 :

sudo docker run --name mocker_network_runner -it --network tz_network --ip 172.18.0.10 -p 7080:7080 mock_server

sudo docker run --name mocker_network_local_runner -it --network bridge -p 7080:7080 -v /Users/lonnieitheds/project/TZDB_WORKSPACE/mock_server:/app mock_server

update , for new:
docker build -t mock_server_image .
sudo docker run --name mocker_network_local_runner -it --network bridge -p 7080:7080 -v /Users/lonnieitheds/project/TZDB_WORKSPACE/mock_server:/app mock_server_image

conf device2 network:
sudo docker run -it --name tzdb_runner --network tz_network -p 5900:5900 tzdb_image
sudo docker run -it --name tzdb_runner --network tz_network -p 7030:7030 -e DISPLAY=$DISPLAY -v /tmp/.X11-unix:/tmp/.X11-unix tzdb_image

## create a dev server

docker run -it --name tzdb_dev_runner -d -p 2222:22 tzdb_image

ssh developer@localhost -p 2222

用户名：developer
密码：developer

chown -R developer:developer /app
chown -R developer:developer /usr/lib64
ssh://developer@localhost:2222/usr/lib64/qt5/bin

ssh://developer@localhost:2222/usr/bin/cmake

sshfs developer@localhost:/ ~/docker-mount/ -p 2222

docker exec -it 8fc02771524d chmod -R 755 /app/tools/

:-1: error: Cannot read /__qtc_devices__/docker/tzdb_dev.latest//__qtc_devices__/docker/tzdb_dev.latest/linux-g++/qmake.conf: No such file or directory

qt mkspec

--user root --volume /tmp/.X11-unix:/tmp/.X11-unix:rw --env XAUTHORITY=/root/.Xauthority --volume ~/.Xauthority:/root/.Xauthority:rw

--user root --volume /tmp/.X11-unix:/tmp/.X11-unix:rw --env XAUTHORITY=/root/.Xauthority --volume ~/.Xauthority:/root/.Xauthority

xhost si:localuser:root

xauth list

docker run --name tzdb_dev_runner -e DISPLAY=host.docker.internal:0 tzdb_dev

docker run --network bridge --name tzdb_dev_runner -e DISPLAY=host.docker.internal:0 -v ~/.Xauthority:/root/.Xauthority tzdb_dev

bridge is working.

-v /Library/Fonts:/usr/share/fonts

## [example] for QT5 project

The dest complete may not has openGL, but it docker is work (docker version 18.09.0 build 62eb848).

Build docker image :

`sudo docker build -t tzdb_image .`

run directly :

`sudo docker run -it -p 7030:7030 -e LD_LIBRARY_PATH=/app/tools/bin tzdb_image ./DistributedNet`

use DISPLAY, give chmod to docker:

```shell
xhost +local:docker

xhost +
```

then it work, but it rely on x11 :

```shell
sudo docker run -it -p 7030:7030   -e DISPLAY=$DISPLAY   -e LD_LIBRARY_PATH=/app/tools/bin   -v /tmp/.X11-unix:/tmp/.X11-unix   tzdb_image ../tools/bin/DistributedNet
```

use eglfs:

```shell
sudo docker run -it -p 7030:7030  -e XDG_RUNTIME_DIR=$XDG_RUNTIME_DIR -e QT_QPA_PLATFORM=eglfs   -e LD_LIBRARY_PATH=/app/tools/bin   -v /tmp/.X11-unix:/tmp/.X11-unix tzdb_image ../tools/bin/DistributedNet
```

but:

```shell
Could not open DRM device /dev/dri/card2 (No such file or directory)
Could not open DRM device
```

use offscreen :

```shell
sudo docker run -it -p 7030:7030 -e QT_QPA_PLATFORM=offscreen -e XDG_RUNTIME_DIR=$XDG_RUNTIME_DIR -e LIBGL_ALWAYS_SOFTWARE=1 -e LD_LIBRARY_PATH=/app/tools/bin -v /tmp/.X11-unix:/tmp/.X11-unix tzdb_image ../tools/bin/DistributedNet
```

but , it is a warning, but still work in shell:

```shell
This plugin does not support propagateSizeHints()
```

Ok， now, we should get more information about such:
| **渲染模式**               | **是否显示界面** | **依赖项**                       | **描述**                                                                                                             | **适用情况**                                                                                                       |
| -------------------------- | ---------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **`offscreen`**            | 否               | 无图形显示，依赖 Qt 内部渲染     | `offscreen` 模式用于无显示设备的后台渲染，不会显示 GUI 界面，适用于生成图像、打印内容等。                            | 用于没有图形显示环境的情况，如后台渲染或图像生成，但不能显示界面。                                                 |
| **`eglfs`**                | 是               | EGL，OpenGL ES                   | `eglfs` 插件可以在没有 X11 的情况下显示界面，依赖 EGL 和 OpenGL ES 渲染，适合嵌入式设备或硬件加速环境。              | 适用于没有 X11 环境的设备，支持硬件或软件 OpenGL ES 渲染的机器，但需要有 EGL 和 OpenGL 支持。                      |
| **`xcb`**                  | 是               | X11（需要显示管理器）            | `xcb` 插件依赖于 X11 来管理显示和渲染，通常用于桌面环境或有 X11 的机器上。                                           | 适用于支持 X11 环境的机器，提供标准的图形显示和窗口管理。                                                          |
| **`没有 OpenGL 或 EGL`**   | 否               | 无 OpenGL 或 EGL                 | 如果系统没有 OpenGL 或 EGL，无论是硬件加速还是软件渲染，Qt 无法渲染 GUI 界面。                                       | 目标机器没有 OpenGL 或 EGL 的支持时，Qt GUI 无法工作，无法显示界面。                                               |
| **`LLVMpipe`（软件渲染）** | 否（无物理显示） | Mesa（OpenGL 软件渲染）          | **LLVMpipe** 是一个基于 CPU 的 OpenGL 实现，使用 **Mesa** 软件渲染。没有 GPU 加速时，使用软件渲染。                  | 在没有 GPU 的情况下，通过软件渲染生成 OpenGL 输出，但依赖于 Mesa 和 OpenGL。仍需要某种形式的图形库支持（如 EGL）。 |
| **替代方案**               | 否               | 无图形界面，基于命令行或图像输出 | 如果没有图形显示支持，可以考虑将应用转为命令行界面（CLI）或使用 `offscreen` 渲染将输出保存为图像文件，而不显示界面。 | 没有图形显示支持的情况下，适用于命令行应用或生成图像输出的场景。                                                   |

so , if we has x11, we can use xcb; other situation , we has openGL , we can use eglfs, but neither both ,there may be no solution .

But, we had anther solution, use VNC to display QT.

install :
```dockerfile
# 安装 VNC 服务器和 X11 环境
RUN dnf -y install xorg-x11-server-Xvfb x11vnc

# 安装 OpenGL 和 Qt 所需的库（已安装）
RUN dnf -y install mesa-dri-drivers mesa-libGLU-devel

# 配置 Xvfb 和 VNC 服务器
RUN mkdir -p /root/.vnc && x11vnc -storepasswd 1234 /root/.vnc/passwd

CMD ["bash", "-c", "Xvfb :0 -screen 0 1280x1024x24 & x11vnc -display :0 -forever -passwd 1234 -rfbwait 3000 -rfbport 5900 & ./DistributedNet"]
```

run :

```shell
sudo docker run -it -p 7030:7030 -e LD_LIBRARY_PATH=/app/tools/bin tzdb_image
```

last:

sudo docker run -it -p 7030:7030 --name tzdb_display_runner --privileged -v /usr/share/fonts:/usr/share/fonts:ro -e DISPLAY=$DISPLAY -e LD_LIBRARY_PATH=/app/tools/bin   -v /tmp/.X11-unix:/tmp/.X11-unix tzdb_display_v3_image ./DistributedNet

## [example] about Install nginx for docker

search the server what we can use :

    sudo docker search nginx

pull the miror :

    sudo docker pull nginx:latest

check for :

    sudo docker images

> the run command composition for those parameters:
>
> |命令                                                 |描述                              |
> |-----------------------------------------------------|---------------------------------|
> |–name nginx	                                        |启动容器的名字                     |
> |-d	                                                |后台运行
> |-p 9002:80	                                        |将容器的 9002(后面那个) 端口映射到主机的 80(前面那个) 端口
> |-v /home/nginx/conf/nginx.conf:/etc/nginx/nginx.conf	|挂载 `nginx.conf` > 配置文件
> |-v /home/nginx/conf/conf.d:/etc/nginx/conf.d	        |挂载nginx配置文件
> |-v /home/nginx/log:/var/log/nginx	                |挂载nginx日志文件
> |-v /home/nginx/html:/usr/share/nginx/html	        |挂载nginx内容
> |nginx:latest	                                        |本地运行的版本
> |\	                                                |shell 命令换行
> 
> 
> eg :
> ```
> sudo docker run --name nginx-test -p 8080:80 -d nginx
> 
> sudo docker run \
>     -p 9002:80 \
>     --name nginx-hexo \
>     -v /home/nginx/conf/nginx.conf:/etc/nginx/nginx.conf \
>     -v /home/nginx/conf/conf.d:/etc/nginx/conf.d \
>     -v /home/nginx/log:/var/log/nginx \
>     -v /home/nginx/html:/usr/share/nginx/html \
>     -d nginx:latest
> ```

the important is hang the file for server , so run :

```bash
    sudo docker run \
    -p 8080:80 \
    --name nginx \
    -v /home/nginx/conf/nginx.conf:/etc/nginx/nginx.conf \
    -v /home/nginx/conf/conf.d:/etc/nginx/conf.d \
    -v /home/nginx/log:/var/log/nginx \
    -v /home/nginx/html:/usr/share/nginx/html \
    -d nginx:latest
```

delete the image :

    sudo docker rmi nginx

delete the container :

    sudo docker rm nginx-hexo

in Debian, the dir is not in /etc/nginx/ but instead of `./var/lib/docker/overlay2/2605878440cebc8eca4dd4fbf7dfec9af36e4f1746c7efa70b4c9f9e93dedc45/diff/usr/lib/nginx`, so I want use that to run :

    sudo docker run --name nginx-hexo -p 8080:80 -d nginx

But , when I run this command, the new directory is build, in

```bash
./var/lib/docker/overlay2/d437b5ec23dd0b03901831cb74ce246a3cd7c2d2450aa6761f4e0dd49ec344b4/diff/etc/nginx
```

we must be a way to set the new directory path. 
Stop it by `sudo docker stop nginx-hex`, the new directory is removed.

check the information :

    sudo docker inspect --format="{{.Mounts}}" nginx-hexo

No information is worthy.
Just use the normal way to run nginx-hexo.

After completing the above contents, we use `sudo docker exec -i -t nginx-hexo /bin/bash` into the bash of container.

    sudo docker exec -i -t nginx-hexo /bin/bash

# Q&A

QStandardPaths: XDG_RUNTIME_DIR not set, defaulting to '/tmp/runtime-root'
This plugin does not support propagateSizeHints()


sudo docker run -it -p 7030:7030 -e QT_QPA_PLATFORM=offscreen -e LIBGL_ALWAYS_SOFTWARE=1 -e LD_LIBRARY_PATH=/app/tools/bin -v /tmp/.X11-unix:/tmp/.X11-unix tzdb_image ../tools/bin/DistributedNet


