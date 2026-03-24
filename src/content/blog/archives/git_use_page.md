---
title: "git 及 github 使用手册"
date: "2021-1-5"
subtitle: "git 及 github 使用手册"
author: "Lonnie iTheds"
tags:
  - git
categories:
  - 项目管理
draft: false
section: "archives"
sourcePath: "markdown/archives/git_use_page.md"
slug: "archives/git_use_page"
---

# git 及 github 使用手册

Git使用C语言开发，分布式版本控制系统。

CVS及SVN都是集中式的版本控制系统。
SVN的全称是Subversion，即版本控制系统。它是最流行的一个开放源代码的版本控制系统。作为一个开源的版本控制系统，Subversion管理着随时间改变的数据。这些数据放置在一个中央资料档案库（Repository）中。这个档案库很像一个普通的文件服务器，不过它会记住每一次文件的变动。这样就可以把档案恢复到旧的版本，或是浏览文件的变动历史。Subversion是一个通用的系统，可用来管理任何类型的文件，其中包括程序源码。偶数编号的小数点版次（1.0、1.2等）被认为是稳定的版次。
CVS是一个C/S系统，是一个常用的代码版本控制软件。主要在开源软件管理中使用。与它相类似的代码版本控制软件有subversion。多个开发人员通过一个中心版本控制系统来记录文件版本，从而达到保证文件同步的目的。CVS版本控制系统是一种GNU软件包，主要用于在多人开发环境下的源码的维护。但是由于之前CVS编码的问题，大多数软件开发公司都使用SVN替代了CVS。

国内的Git托管服务——Gitee（gitee.com）
Git有很多图形界面工具，这里我们推荐SourceTree，它是由Atlassian开发的免费Git图形界面工具，可以操作任何Git库。

## 基本原理

git 是一种多人协同作业、软件库版本管理技术。

### 版本库

### 仓库

### branch & taget

### fork

## 基本使用操作

### initlization

    echo "# Project" >> README.md
    git init
    git add README.md
    git commit -m "first commit"
    git branch -M master
    git remote add origin https://github.com/iTheds/Project.git
    git push -u origin master

### Clone

克隆仓库
    
    git clone git@192.168.10.123:/ULis/testcase_oneforall

克隆指定分支仓库
    
    git clone -b ReWrite git@192.168.10.123:/iTheds/tzdb-win.git
    git clone -b ReWrite git@192.168.10.123:/root/tzdb-win.git

### Read resp infomation

    git status
    git add .
    git commit -m ""


### Add remote source

添加远程源：

    git remote add upstream git@192.168.3.116:/root/tzdb-win.git

提交到指定源

    git pull upstream ReWrite
    git push origin ReWrite

### Change remote source

    git remote set-url origin [new_remote_url]

    git remote set-url origin git@192.168.3.116:iTheds/tsdb.git
    git remote set-url upstream git@192.168.3.116:root/tsdb.git

### Reset

当删除了本地文件之后，但是远程又没有更新，此时使用git pull无法得到文件。
可以使用命令：

    git reset --hard origin/main

则会自行恢复文件，即使没有网络也可以。

历史指令记录：
    git reflog

### 分支管理commit

[???]: <> (未有详细学习)

1. 查看分支：git branch
2. 创建分支：git branch <name>
3. 切换分支：git checkout <name>或者git switch <name>
4. 创建+切换分支：git checkout -b <name>或者git switch -c <name>
5. 合并某分支到当前分支：git merge <name>
6. 删除分支：git branch -d <name>

### 标签管理tag

tag跟某个commit绑在一起。

    $ git branch
    $ git checkout master
    $ git tag v1.0

查看标签信息:

    git show <tagname>

进行说明：

    $ git tag -a v0.1 -m "version 0.1 released" 1094adb

删除标签：

    $ git tag -d v0.1

推送某个标签到远程

    $ git push origin v1.0

推送所有标签

    $ git push origin --tags

### 密钥存储(免密登入)

将本地的数据传送到GitHub.
本地Git仓库和GitHub仓库之间的传输是通过SSH加密的。

> 创建SSH key -- 免密登入

用户目录。生成.ssh目录，里面有id_rsa和id_rsa.pub，id_rsa是私钥，id_rsa.pub是公钥
    $ ssh-keygen -t rsa -C "youremail@example.com"

> 同步GitHub SSH key

GitHub:
“Account settings，“SSH Keys”页面：
“Add SSH Key”，任意Title，在Key文本框里粘贴id_rsa.pub文件的内容

> 测试

    ssh -T git@github.comls

> GitHub上创建仓库

GitHub:
Create a new repo.

### rebase


[](https://waynerv.com/posts/git-rebase-intro/#rebase-%E5%92%8C-merge-%E7%9A%84%E5%8C%BA%E5%88%AB)
[](https://liaoxuefeng.com/books/git/branch/rebase/index.html)

## 多样情况处理

### 更改 fork 的派生仓库后合并到主仓库

主仓库，fork 了一个派生仓库。

派生仓库修改，主仓库也修改，合并时执行命令如下：

```bash
    # git remote add upstream git@192.168.3.116:root/tzdb-win.git
    git remote add upstream git@192.168.3.248:root/tsdb.git
    git remote add upstream git@192.168.3.248:root/tzmultimodel.git
    git fetch upstream master
    git merge upstream/master
    git add .
    git commit -m"Fix bugs, by iTheds"
    git push origin master
```

本地默认有一个源，为 origin，remote add 一个名为 upstream 的源。

### fork 的仓库大变动，重新 fork 并分支备份

fork A 仓库，形成一个仓库 A_F, 保留 A_F 仓库内容形成分支，再从 A 上 fork 到 A_F 形成主分支。

1. 远程仓库中先进行分支备份，然后以下对主分支进行操作；
2. 使用 `git merge --abort` 取消 merge；
3. 回退到之前 merge 的版本；
4. 再进行 fetch

当然，我们也可以借鉴用远程仓库的代码直接覆盖本地的仓库的方式，使用`git pull upstream master --force`将原 fork 的仓库对本地进行强制覆盖，然后强制推送：
```bash
git merge --abort
git pull upstream master --force
git push --force origin master
```

> 远程仓库的代码直接覆盖本地的仓库的方式
> ```bash
> git fetch --all
> git reset --hard origin/master  #(master可以修改成其它要覆盖的分支)
> git pull
> ```

### 清理所有非 git 仓库所属文件

    git clean -n

是一次clean的演习, 告诉你哪些文件会被删除. 记住他不会真正的删除文件, 只是一个提醒

    git clean -f

删除当前目录下所有没有track过的文件. 他不会删除.gitignore文件里面指定的文件夹和文件, 不管这些文件有没有被track过

    git clean -f <path>

删除指定路径下的没有被track过的文件

    git clean -df

删除当前目录下没有被track过的文件和文件夹

    git clean -xf

删除当前目录下所有没有track过的文件. 不管他是否是.gitignore文件里面指定的文件夹和文件
git reset --hard 和 git clean -f 是一对好基友. 结合使用他们能让你的工作目录完全回退到最近一次commit的时候
git clean对于刚编译过的项目也非常有用. 如, 他能轻易删除掉编译后生成的.o和.exe等文件. 这个在打包要发布一个release的时候非常有用
下面的例子要删除所有工作目录下面的修改, 包括新添加的文件. 假设你已经提交了一些快照了, 而且做了一些新的开发

    git reset --hard

    git clean -df

### 拷贝本地仓库进行修改，两个都需要修改

首先 git push 其中一个，实验中是 push 的最后修改的那个。
应该是用的 fetch + merge。 
当然可以直接用 git pull，但是 pull 之后会直接合并。
在实验中，发现，本地应该先进行 add 和 commit ， 之后进行 fetch 和 merge 会导致其他版本的修改回退，也就是说，该方法只能存留其中一个版本。
搜索发现，可以通过新建立分支的方法来实现。本地分支，并且合并。但该操作未复现，暂不详解。

### 远程回退到上一个版本

如果你的错误提交已经推送到自己的远程分支了，那么就需要回滚远程分支了。
首先要回退本地分支：

用`git log`或者`git reflog`查看版本的记录，用版本号来恢复到指定的版本：
git reflog
git reset --hard Obfafd

紧接着强制推送到远程分支：

git push -f

如果无法推送，显示权限不足，那么可以查阅 setting 中 的 repository 的 Protected branches 中设置其为 Unprotected 即可。

## Others Attention

### AutoCRLF and SafeCRLF

1. AutoCRLF
    提交时转换为LF，检出时转换为CRLF
    git config --global core.autocrlf true
    提交时转换为LF，检出时不转换
    git config --global core.autocrlf input
    提交检出均不转换
    git config --global core.autocrlf false
2. SafeCRLF
    拒绝提交包含混合换行符的文件
    git config --global core.safecrlf true
    允许提交包含混合换行符的文件
    git config --global core.safecrlf false
    提交包含混合换行符的文件时给出警告

### ssh: connect to host github.com port 22: Connection timed out

Change the post to 433, add a config file in .ssh/config :

```bash
Host github.com
HostName ssh.github.com
User git
Port 443
PreferredAuthentications publickey
IdentityFile ~/.ssh/id_rsa
```

## Question

### 内存不够(no space left on device)

```bash
$ ithedslonnie@iTheds:~/Projects/workspace_work/RUST_tzdb_Workspace/tsdb$ git push
Failed to write to log, write /var/log/gitlab/gitlab-shell/gitlab-shell.log: no space left on device
Failed to write to log, write /var/log/gitlab/gitlab-shell/gitlab-shell.log: no space left on device
Enumerating objects: 202, done.
Counting objects: 100% (202/202), done.
Delta compression using up to 20 threads
Compressing objects: 100% (62/62), done.
Writing objects: 100% (71/71), 21.40 KiB | 10.70 MiB/s, done.
Total 71 (delta 54), reused 23 (delta 8), pack-reused 0
error: remote unpack failed: unable to create temporary object directory
To 192.168.10.123:iTheds/tsdb.git
 ! [remote rejected] master -> master (unpacker error)
error: failed to push some refs to '192.168.10.123:iTheds/tsdb.git'
```

### 解决Git报错:error: You have not concluded your merge (MERGE_HEAD exists).

如果是因为本地仓库 merge 的时候弹出一个文本编辑器输入 merge msg ， 那么是因为没有冲突的原因。直接 ^X 退出即可。

### 权限更改导致的 git 工作区所有代码变成修改状态

这是因为Git忽略文件权限或者拥有者改变导致的git状态变化。
默认Git会记录文件的权限信息，如果文件的权限信息被修改，在Git中改变文件会出现很多我们并不需要提交的文件。
执行：

```bash
git config core.filemode false   
git config --global core.filemode false #全局设置
```

或者直接修改代码仓库
.git 目录里的 config 文件的 filemode (在 [core] 段中)字段，将其改为 false。

## 附录

### 基本命令

1. 常用

```C++
git remote add origin git@github.com:yeszao/dofiler.git         # 配置远程git版本库

git pull origin master                                          # 下载代码及快速合并

git push origin master                                          # 上传代码及快速合并

git fetch origin                                                # 从远程库获取代码

git branch                                                      # 显示所有分支

git checkout master                                             # 切换到master分支

git checkout -b dev                                             # 创建并切换到dev分支

git commit -m "first version"                                   # 提交

git status                                                      # 查看状态

git log                                                         # 查看提交历史

 
git config --global core.editor vim                             # 设置默认编辑器为vim（git默认用nano）

git config core.ignorecase false                                # 设置大小写敏感

git config --global user.name "YOUR NAME"                       # 设置用户名

git config --global user.email "YOUR EMAIL ADDRESS"             # 设置邮箱
```

2. 别名 alias

```C++
git config --global alias.br="branch"                 # 创建/查看本地分支

git config --global alias.co="checkout"               # 切换分支

git config --global alias.cb="checkout -b"            # 创建并切换到新分支

git config --global alias.cm="commit -m"              # 提交

git config --global alias.st="status"                 # 查看状态

git config --global alias.pullm="pull origin master"  # 拉取分支

git config --global alias.pushm="push origin master"  # 提交分支

git config --global alias.log="git log --oneline --graph --decorate --color=always" # 单行、分颜色显示记录

git config --global alias.logg="git log --graph --all --format=format:'%C(bold blue)%h%C(reset) - %C(bold green)(%ar)%C(reset) %C(white)%s%C(reset) %C(bold white)— %an%C(reset)%C(bold yellow)%d%C(reset)' --abbrev-commit --date=relative" # 复杂显示
```

3. 创建版本库

```C++
git clone                  # 克隆远程版本库

git init                        # 初始化本地版本库
```

4. 修改和提交

```C++
git status                      # 查看状态

git diff                        # 查看变更内容

git add .                       # 跟踪所有改动过的文件

git add                   # 跟踪指定的文件

git mv               # 文件改名

git rm                    # 删除文件

git rm --cached           # 停止跟踪文件但不删除

git commit -m “commit message”  # 提交所有更新过的文件

git commit --amend              # 修改最后一次提交
```

5. 查看历史

```C++
git log                         # 查看提交历史

git log -p                # 查看指定文件的提交历史

git blame                 # 以列表方式查看指定文件的提交历史
```

6. 撤销

```C++
git reset --hard HEAD           # 撤消工作目录中所有未提交文件的修改内容
git reset --hard       # 撤销到某个特定版本
git checkout HEAD         # 撤消指定的未提交文件的修改内容
git checkout --           # 同上一个命令
git revert              # 撤消指定的提交分支与标签
```

7. 分支与标签

```C++
git branch                      # 显示所有本地分支
git checkout        # 切换到指定分支或标签
git branch          # 创建新分支
git branch -d           # 删除本地分支
git tag                         # 列出所有本地标签
git tag                # 基于最新提交创建标签
git tag -a "v1.0" -m "一些说明"  # -a指定标签名称，-m指定标签说明
git tag -d             # 删除标签
git checkout dev                # 合并特定的commit到dev分支上
git cherry-pick 62ecb3
```

8. 合并与衍合

```C++
git merge               # 合并指定分支到当前分支
git merge --abort               # 取消当前合并，重建合并前状态
git merge dev -Xtheirs          # 以合并dev分支到当前分支，有冲突则以dev分支为准
git rebase              # 衍合指定分支到当前分支
```

9. 远程操作

```C++
git remote -v                   # 查看远程版本库信息
git remote show         # 查看指定远程版本库信息
git remote add    # 添加远程版本库
git remote remove       # 删除指定的远程版本库
git fetch               # 从远程库获取代码
git pull       # 下载代码及快速合并
git push       # 上传代码及快速合并
git push : # 删除远程分支或标签
git push --tags                 # 上传所有标签
```

10. 打包

```C++
git archive --format=zip --output ../file.zip master    # 将master分支打包成file.zip文件，保存在上一级目录
git archive --format=zip --output ../v1.2.zip v1.2      # 打包v1.2标签的文件，保存在上一级目录v1.2.zip文件中
git archive --format=zip v1.2 > ../v1.2.zip             # 作用同上一条命令
```

11. 全局和局部配置

```C++
全局配置保存在：$Home/.gitconfig
本地仓库配置保存在：.git/config
```C++

12. 远程与本地合并

```C++
git init                              # 初始化本地代码仓
git add .                             # 添加本地代码
git commit -m "add local source"      # 提交本地代码
git pull origin master                # 下载远程代码
git merge master                      # 合并master分支
git push -u origin master             # 上传代码
```

### Study Recording

#### 创建版本库并添加文件，创建分支

仓库repository
初始化。建立一个新文件之后执行，然后文件下会生成一个.git文件。

    $ git init
    Initialized empty Git repository in /Users/michael/learngit/.git/

添加文件readme.txt。这个文件处于该目录下

    $ git add readme.txt

提交到仓库git commit。-m后面输入的是本次提交的说明，可以输入任意内容，1 file changed：1个文件被改动（我们新添加的readme.txt文件）；2 insertions：插入了两行内容（readme.txt有两行内容）

    $ git commit -m "wrote a readme file"
    [master (root-commit) eaadf4e] wrote a readme file
    1 file changed, 2 insertions(+)
    create mode 100644 readme.txt

命令重叠例子：

    $ git add file1.txt
    $ git add file2.txt file3.txt
    $ git commit -m "add 3 files."

查看状态。数据修改项。

     git status

查看difference，即查看修改情况

    git diff

查看历史记录，3次提交

    git log

版本回退/还原。HEAD^^表示上上版本，HEAD~100，其中HEAD^也可以写成commit id。

    $ git reset --hard HEAD^
    HEAD is now at e475afc add distributed

git add命令实际上就是把要提交的所有修改放到暂存区（Stage），然后，执行git commit就可以一次性把暂存区的所有修改提交到分支。

关于删除修改记录：
场景1：当你改乱了工作区某个文件的内容，想直接丢弃工作区的修改时，用命令git checkout -- file。
场景2：当你不但改乱了工作区某个文件的内容，还添加到了暂存区时，想丢弃修改，分两步，第一步用命令git reset HEAD <file>，就回到了场景1，第二步按场景1操作。

#### 远程仓库

将本地的数据传送到GitHub.
本地Git仓库和GitHub仓库之间的传输是通过SSH加密的。

> 创建SSH key -- 免密登入

用户目录。生成.ssh目录，里面有id_rsa和id_rsa.pub，id_rsa是私钥，id_rsa.pub是公钥
    $ ssh-keygen -t rsa -C "youremail@example.com"

> 同步GitHub SSH key

GitHub:
“Account settings，“SSH Keys”页面：
“Add SSH Key”，任意Title，在Key文本框里粘贴id_rsa.pub文件的内容

> GitHub上创建仓库

GitHub:
Create a new repo.

#### Push推送

本地。定位到地址。

    $ git remote add origin root@8.131.63.170:/home/hexo/markdown.git
    $ git config --global user.name "iTheds"
    $ git config --global user.email "lonnieitheds@gmail.com"

第一次推送并关联。

```C
$ git push -u origin master
Counting objects: 20, done.
Delta compression using up to 4 threads.
Compressing objects: 100% (15/15), done.
Writing objects: 100% (20/20), 1.64 KiB | 560.00 KiB/s, done.
Total 20 (delta 5), reused 0 (delta 0)
remote: Resolving deltas: 100% (5/5), done.
To github.com:michaelliao/learngit.git
 * [new branch]      master -> master
Branch 'master' set up to track remote branch 'master' from 'origin'.
```

由于远程库是空的，我们第一次推送master分支时，加上了-u参数，Git不但会把本地的master分支内容推送的远程新的master分支，还会把本地的master分支和远程的master分支关联起来，在以后的推送或者拉取时就可以简化命令。

之后使用命令`$ git push origin master`进行更新

但是如果remote repository中含有README.md文件那么需要执行`git pull --rebase origin master`合并代码。

> 从GitHub上克隆repository

Create with Initialize this repository with a README.

$ git clone git@github.com:michaelliao/gitskills.git
```git
Cloning into 'gitskills'...
remote: Counting objects: 3, done.
remote: Total 3 (delta 0), reused 0 (delta 0), pack-reused 3
Receiving objects: 100% (3/3), done.
```

#### 搭建Git服务器

>Step1 安装git

    $ sudo apt-get install git

>Step2 创建git用户

    $ sudo adduser git
    
>Step3 创建证书登录，SSH Key

收集所有需要登录的用户的公钥，*id_rsa.pub* -> */home/git/.ssh/authorized_keys*文件

>Step4 初始化Git仓库：

先选定一个目录作为Git仓库，假定是/srv/sample.git，在/srv目录下输入命令：
    $ sudo git init --bare sample.git
Git就会创建一个裸仓库，裸仓库没有工作区，因为服务器上的Git仓库纯粹是为了共享，所以不让用户直接登录到服务器上去改工作区，并且服务器上的Git仓库通常都以.git结尾。
然后，把owner改为git：

    $ sudo chown -R git:git sample.git

>Step5 克隆远程仓库：

通过git clone命令克隆远程仓库：

    $ git clone git@server:/srv/sample.git
    Cloning into 'sample'...
    warning: You appear to have cloned an empty repository.

>Step6 禁用shell登录：

出于安全考虑，第二步创建的git用户不允许登录shell，这可以通过编辑/etc/passwd文件完成。找到类似下面的一行：

    git:x:1001:1001:,,,:/home/git:/bin/bash

改为：

    git:x:1001:1001:,,,:/home/git:/usr/bin/git-shell

这样，git用户可以正常通过ssh使用git，但无法登录shell，因为我们为git用户指定的git-shell每次一登录就自动退出。

[???]: <> (存在问题，为什么要这么做)

#### Git将本地数据传输到私有服务器

基本的是，克隆远程仓库直接push。
git config --bool core.bare true

[???]:<> (有问题未解决)

>管理公钥

如果团队很小，把每个人的公钥收集起来放到服务器的/home/git/.ssh/authorized_keys文件里就是可行的。如果团队有几百号人，就没法这么玩了，这时，可以用Gitosis来管理公钥。

>管理权限

有很多不但视源代码如生命，而且视员工为窃贼的公司，会在版本控制系统里设置一套完善的权限控制，每个人是否有读写权限会精确到每个分支甚至每个目录下。因为Git是为Linux源代码托管而开发的，所以Git也继承了开源社区的精神，不支持权限控制。不过，因为Git支持钩子（hook），所以，可以在服务器端编写一系列脚本来控制提交等操作，达到权限控制的目的。Gitolite就是这个工具。

#### 只克隆远程仓库最新的一个版本

```bash
git clone --depth 1 https://github.com/dogescript/xxxxxxx.git
```

### Practical operation

#### 搭建Gitlab

Gitlab是依赖于Docker。

在windows下首先需要安装docker。
再安装 gitlab server 。
之后配置 gitlab runner 即可。

[参考教程](https://blog.csdn.net/zhaodengdeng1984/article/details/116987710)

#### 搭建Gogs

这个就比较简单了。

下载 NSSM 和 Gogs软件包。之后运行 E:\soft-exe\gogs\scripts\windows\install-as-service.bat 即可。

运行完成之前需要修改该bat文件中的路径，并且创建一个 Mysql 或其他支持的数据库用于 Gogs 进行存储相关内容。

运行成功之后在网页 127.0.0.1:3000 之后进行配置。

[参考文档](https://www.jianshu.com/p/a927877931da)

## Quote

[Git官网](http://git-scm.com/)
[廖雪峰Git教程](https://www.liaoxuefeng.com/wiki/896043488029600)
[Git官方文档](https://docs.github.com/cn/github)


# EOF