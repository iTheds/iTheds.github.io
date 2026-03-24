---
title: "hexo 札记"
published: 2018-05-10
description: "生命短暂，韶光易逝"
tags:
  - "hexo"
category: "tools"
draft: false
author: "Lonnie iTheds"
---
# hexo 札记

hexo是一种基于git的实现自动部署的技术。

搭建博客比较好的有hexo和[wordpress](https://cn.wordpress.org/support/article/overview-of-wordpress/)，wordpress是基于php和mysql的免费开源内容管理系统(CMS)。Hexo 使用 Markdown（或其他渲染引擎）解析文章，在几秒内，即可利用靓丽的主题生成静态网页。

# hexo 环境搭建以及运行

hexo 搭建博客本质是是依靠于javascript的一种自动部署构建技术。
hexo 基于 git，搭建博客过程就是，hexo将内部资源source和主题模板themes结合后生成public静态网站文件，这个静态网站依赖 JavaScript 。
依赖 JavaScript ，那么就需要有浏览器外的 JavaScript 运行器 nodejs 。
生成了 public 之后即用 git 技术推送到远程服务端。
之后只要编辑 source 文件，就可以一键推送到远程服务端。

技术依赖:
* git 技术 - 仓库管理,版本更迭,使用 github 进行远程仓库管理
* nodjs - 负责 javascript 静态网站解析和动态网站运行
* npm - 包管理器

:::info
hexo 凭借 github 静态服务，进行个人网站的搭建。
主要思路是本地一个git库，远程一个git库，两者进行联通。远程库可以是GitHub上的，也可以是个人服务器上的私库。
需要注意的是，hexo本地与服务端的git库有区别，git库为解析之后的界面，而不是git中的网站文件。
捋一下，我希望windows作为本地，hexo 到站点(git 服务器)，或者到 GitHub 上也可以。
:::

[hexo 官方文档](https://hexo.io/zh-cn/docs/)

## hexo搭建

### 环境安装

不再赘述, 使用 npm 包安装 hexo 插件:

    sudo npm install -g hexo-cli

如果在已经初始化完成的 hexo 目录下， 应该使用 'npm install'， 至此，你应该知道其使用的是何等技术了，因为其本质是一个 nodejs 的项目。

### 初始化仓库

初始化一个 hexo 白库，本质操作是从 github 上克隆目标库 https://github.com/hexojs/hexo-starter.git .

    hexo init

预览:

    hexo s 

在当前目录下安装 git 支持:

```bash
npm install hexo-deployer-git --save
npm install hexo-server
```

### 指定远程仓库

指定同步路径 - 编辑 _config.yml 文件，修改部署 deploy 信息，修改如下：

```git
deploy:
  type: git
  message: update
  repo: root@ip:hexo.git
  branch: master
```

如果是链接到GitHub那么 repo: https://github.com/abc/abc.github.io.git。
repo: root@8.131.63.170:/home/hexo/hexo.git

repo: 
  github: git@github.com:iTheds/iTheds.github.io.git

部署多个仓库托管:

```bash
deploy:
- type: git
  repo:
- type: heroku
  repo:
```
 
### 远程服务器建立关联仓库： 

上述介绍了如何搭建本地的 hexo 仓库，而关于 服务器的搭建取决于服务器的用法，可以直接本地推送到 GitHub；也可以用远程服务器。
在此介绍后者，下文为在 vps 中建立git仓库，并且进行配置。
环境布置不再赘述,免密登入是必须的,不然无法登入到 git .

创建 git 仓库：

  git init --bare hexo.git

建立一个仓库内容转移的缓存目录：

  mkdir -p /home/tmp/hexo_tmp

然后处理 hexo.git 提交的事件，自动更新内容到 hexo网站目录。在 git 用户下执行：

  vim hexo.git/hooks/post-receive

编辑 post-receive 文件：

```git
#!/bin/bash -l
GIT_REPO=/home/hexo/hexo.git
TMP_GIT_CLONE=/home/tmp/hexo_tmp
PUBLIC_HEXO=/var/www/html/hexo
rm -rf ${TMP_GIT_CLONE}
git clone $GIT_REPO $TMP_GIT_CLONE
rm -rf ${PUBLIC_HEXO}/*
cp -rf ${TMP_GIT_CLONE}/* ${PUBLIC_HEXO}
```

权限：

  chmod +x hexo.git/hooks/post-receive

推送不上，不知道为什么。
objects 文件有改变。但是并没有看到任何项目的影子。
按理来说，hexo可以推送到GitHub，所以应该可以推送到私服务器，但是并不成功。
但是我们知道远端服务器的git库是我们自己创建的，并不需要搭建hexo，所以如果我们可以在本地以git的方式上传文件，那我们也可以将source文件传到服务器。
[???]:<> (有问题未解决)
record 2023.2.25 - 问题不再处理,解决方向可能是 - 服务器没有打开相应访问权限.
服务器仓库映射到apache目录 - 暂不书写

### 上传三部曲

```bash
hexo clean
hexo generate
hexo server # 查看网页本地预览，localhost:4000
hexo deploy
```

也可以使用hexo g -d

# hexo 技术分析

先看文件目录:
```bash
_config.landscape.yml #
_config.yml           # 配置信息
db.json               # hexo - git 支持
package-lock.json     # 应用程序信息
ackage.json
public                # 生成的 hexo 网页界面
source                # 存放用户资源文件夹
node_modules
scaffolds             # 模板文件夹 - 存放文章
themes                # 主题文件夹
```

## 布局（Layout）

Hexo 有三种默认布局：post、page 和 draft。在创建这三种不同类型的文件时，它们将会被保存到不同的路径；而您自定义的其他布局和 post 相同，都将储存到 source/_posts 文件夹。

布局	路径
post	source/_posts
page	source
draft	source/_drafts

# 特殊情景

## 插件

思维导图的使用

    npm install hexo-simple-mindmap

## 旧库使用(保存 hexo 环境到 git)

hexo 应该是在本地生成了一个库,然后进行了上传到 github .
那么如果我只有远程的 github 仓库,如何复现呢.
所以这就产生了一个很尴尬的问题,缺少 hexo 的配置文件等,无法通过远程仓库的静态内容复现,最简单的方式是丢弃重新整理一个仓库.
我们可以采用多分支的方式,将 hexo 的关键信息进行保存,然后在其他的地方直接复现.

其有关联的内容为:
```yml    
_config.yml
package.json
scaffolds/
source/
themes/
```

克隆之后安装:

```bash
npm install
npm install hexo-deployer-git --save
npm install hexo-generator-feed --save
npm install hexo-generator-sitemap --save
```

一般的, hexo 初始化的仓库应该有一个 .github 文件作为仓库管理.
这个时候我们将目标远程仓库的 .git 文件拷贝到同目录下是无影响的.
添加到目标仓库之后,即可.

## 分支冲突

github 上原来使用的是 main 分支,传了一个 master 分支并且设置为 default . 但是发现仍然还是 main 分支作为 web.
在 repository settings 中选择 pages 即可进行分支修改.

## 文档管理

因为我们在日常书写的时候,不太希望携带所有的 hexo 库, 只希望携带文本.
翻翻官方文档 , [资源文件夹](https://hexo.io/zh-cn/docs/asset-folders.html)

source 是存放资源的,而 _posts 下面可以新建立文件夹,来达到这个目的.
然后就是图片管理,和隐藏文件夹.

然后更改文件夹 source 为 markdown 来实现该效果.以此作为文件管理.

### 图片管理

同时兼容 markdown 书写和 hexo 部署的方法.

可以在其中建立 images 文件夹专门存放图片.
_config.yml 中 `post_asset_folder`可以打开资源文件管理功能.
"当资源文件管理功能打开后，Hexo将会在你每一次通过 `hexo new [layout] <title> `命令创建新文章时自动创建一个文件夹。这个资源文件夹将会有与这个文章文件一样的名字。将所有与你的文章有关的资源放在这个关联文件夹中之后，你可以通过相对路径来引用它们，这样你就得到了一个更简单而且方便得多的工作流。"

但是如果不使用该方法,即不需要相对路径.
那么在 source/images 文件夹下存储图片.
也可以在 source/_posts/* 下的 md 文件中以 `![](/image/*)` 的形式进行图片的访问.

### 隐藏文件

官方文档中,配置文件中参数`Include / Exclude file(s)`,可以配置 `ignore`,即可.

```yml
ignore:
  # 忽略任何一个名叫 'foo' 的文件夹
  - "**/foo"
  # 只忽略 'themes/' 下的 'foo' 文件夹
  - "**/themes/*/foo"
  # 对 'themes/' 目录下的每个文件夹中忽略名叫 'foo' 的子文件夹
  - "**/themes/**/foo"
```

### 草稿本

直接将文件放到 `source/_draft` 中即可.
如果要发布, 使用命令 :
```bash
$ hexo publish [layout] <title>
```
此处的 layout 即是布局.布局中包括了 `draft` 布局.

### 禁止渲染某些文件

对于一些验证性文件,不希望被渲染.
`_config.yml` 中有提供一个配置项skip_render, 官网说明如下：

  skip_render：跳过指定文件的渲染，您可使用glob表达式来匹配路径。

配置可以是指定文件,指定路径与该路径下子文件的方式为:
```yml    
skip_render: test/**
```

多个文件:
```yml    
skip_render: ['*.html', demo/**, test/*]
```

# 修改主题

1. 在themes文件夹下，git bush，输入命令

```bash
git clone https://github.com/Ben02/hexo-theme-Anatole //主题链接
git clone https://github.com/iissnan/hexo-theme-next themes/next
```

2. 修改博客目录_config.yml中的theme属性，将其设置为主题文件夹名称。

```bash
theme: hexo-theme-Anatole
```

3. 在主题更新之前，一定要备份好主目录下的_config.yml文件，尤其是到后面修改了很多配置之后。在`themes/hexo-theme-Anatole`目录下执行：

```bash
git pull origin master
```

## 几款比较好的推荐

官方主题似乎有两个网站可以招到,有一个中文的已经很久了.另一个国外的似乎经常有新,[寻找主题可以到这里](https://hexo.bootcss.com/themes/)。


1. 几款比较有竞争力的主题：

* https://shoka.lostyu.me/
* https://github.com/amehime/hexo-theme-shoka.git


* 第二备选，很简洁 - https://blog.oniuo.com/
* 简洁，分层 - https://www.fooying.com/
* 高图片，标签 - https://haojen.github.io/Claudia-theme-blog/
* 界面简洁。有分层 - https://github.com/Molunerfinn/hexo-theme-melody
* 简洁。无分层。高图片 - https://fech.in/
* 文字可选 - https://sariay.github.io/

2. [2023.2.24] record , 诸如以下,都是很好的选择:

* https://fi3ework.github.io/archer-demo/
* https://dogzi.fun/
* https://xpoet.cn/


## [主题shoka](https://shoka.lostyu.me/)

git repository :
  
    git clone https://github.com/amehime/hexo-theme-shoka.git

需要安装插件:
```bash
  hexo-renderer-multi-markdown-it
  hexo-autoprefixer

  hexo-algoliasearch
  hexo-symbols-count-time
  hexo-feed
```

1. 隐藏文字，基于`markdown-it-spoiler` 和` markdown-it-attrs`

使用`!x!`!x!的形式进行隐藏涂黑。

### 配置文件记录

在deploy后添加如下：

```javascript
deploy:
  type:


# edit for Theme.shoka
autoprefixer:
  exclude:
    - '*.min.css'

markdown:
  render: # 渲染器设置
    html: false # 过滤 HTML 标签
    xhtmlOut: true # 使用 '/' 来闭合单标签 （比如 <br />）。
    breaks: true # 转换段落里的 '\n' 到 <br>。
    linkify: true # 将类似 URL 的文本自动转换为链接。
    typographer:
    quotes: '“”‘’'
  plugins: # markdown-it插件设置
    - plugin:
        name: markdown-it-toc-and-anchor
        enable: true
        options: # 文章目录以及锚点应用的class名称，shoka主题必须设置成这样
          tocClassName: 'toc'
          anchorClassName: 'anchor'
    - plugin:
        name: markdown-it-multimd-table
        enable: true
        options:
          multiline: true
          rowspan: true
          headerless: true
    - plugin:
        name: ./markdown-it-furigana
        enable: true
        options:
          fallbackParens: "()"
    - plugin:
        name: ./markdown-it-spoiler
        enable: true
        options:
          title: "你知道得太多了"

minify:
  html:
    enable: true
    stamp: false
    exclude:
      - '**/json.ejs'
      - '**/atom.ejs'
      - '**/rss.ejs'
  css:
    enable: true
    stamp: false
    exclude:
      - '**/*.min.css'
  js:
    enable: true
    stamp: false
    mangle:
      toplevel: true
    output:
    compress:
    exclude:
      - '**/*.min.js'

# algolia:
#   appId:
#   apiKey:
#   adminApiKey:
#   chunkSize: 5000
#   indexName:
#   fields:
#     - title #必须配置
#     - path #必须配置
#     - categories #推荐配置
#     - content:strip:truncate,0,4000
#     - gallery
#     - photos
#     - tags

feed:
    limit: 20
    order_by: "-date"
    tag_dir: false
    category_dir: false
    rss:
        enable: true
        template: "themes/shoka/layout/_alternate/rss.ejs"
        output: "rss.xml"
    atom:
        enable: true
        template: "themes/shoka/layout/_alternate/atom.ejs"
        output: "atom.xml"
    jsonFeed:
        enable: true
        template: "themes/shoka/layout/_alternate/json.ejs"
        output: "feed.json"
```

# Error

## `hexo d` no response

每次`hexo d`之后都是正常输出，但是并没有更新， github 的相应库内也没有任何文件。
难道是写法问题。关键是没有任何报错。
写法问题，正常输出是什么。
先在自己的本地上建立git库，尝试推送。
或者直接将其推送到私库中。
推送到私库也是如此，应该是有根本性的问题。
输出内容可能是没有任何的反应。
按理来说，应该会有显示`INFO Deploy done:git`才对。
管理员身份运行也没有用。
找到了。https://github.com/hexojs/hexo/issues/4634
```bash
    npm un hexo-deployer-git
    npm i hexojs/hexo-deployer-git
```
附属信息是先把原来的 hexo-deployer-git 插件卸载了，然后直接从 master 分支安装。
在执行上述命令时，我是直接`hexo init`之后执行的，关于hexojs文件未存在博客目录中。

## `sudo` limits of authority

I execute the command `ssh-keygen -t ras -c "@.com"`, and `sudo git clone`,
```bash
ithedslonnie@iTheds:/home/hexo$ sudo git clone git@github.com:iTheds/iTheds.git
Cloning into 'iTheds'...
git@github.com: Permission denied (publickey).
fatal: Could not read from remote repository.

Please make sure you have the correct access rights
and the repository exists.
```

Check by `ssh git@github.com`:

```bash
ithedslonnie@iTheds:/home/hexo$ ssh git@github.com
PTY allocation request failed on channel 0
Hi iTheds! You've successfully authenticated, but GitHub does not provide shell access.
Connection to github.com closed.
```

Finally, the [link](https://stackoverflow.com/questions/65524600/youve-successfully-authenticated-but-github-does-not-provide-shell-access-af) solute this question. 

As the user bk2204 said : 

```
You're seeing problems because you're using sudo.

When you use an SSH key, that comes from your user's home directory, and when you use an SSH agent, that comes from the environment. When you use sudo, you change the current user, so the keys come from root's home directory, and sudo, by default, clears the environment for security reasons. Therefore, there is no possible way to get access to your keys, and your operation fails.

Unless you have a compelling reason, you should avoid sudo here because it's not needed. If you're sure you need it and you're certain that there's nothing in your PATH or the rest of the environment that might be a security risk, you can try to use sudo -E, which will avoid clearing the environment and therefore let your SSH agent work with your clone.
```

## 解决网站子目录问题

本地配置文件_config.yml：

```bash
## If your site is put in a subdirectory, set url as 'http://yoursite.com/child' and root as '/child/'
url: http://65.49.230.206/hexo
root: /hexo/
```
