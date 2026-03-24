---
title: "Rust编程学习扎记"
date: "2021-4-27"
subtitle: "重开"
author: "Lonnie iTheds"
tags:
  - rust
categories:
  - 编程
draft: true
section: "drafts"
sourcePath: "markdown/_drafts/Rust编程学习扎记.md"
slug: "_drafts/Rust编程学习扎记"
---

# Rust编程学习扎记

## Tool properties

性能特性 - 据说可以达到与 C++ 相同,能胜任对性能要求特别高的服务,可运行于嵌入式设备,与其他语言进行继承.
特殊机制 - 生命周期,不必再考虑碎片化的内存.
语法特性 - Rust 总是给人一种,能够用少量代码完成巨量操作的感觉.

其他优势:
谈及其他优势,必然是 cargo 包管理器.
并且,rust 测试方式的嵌入保证了代码的健壮性.
rust 文档的嵌入使得使用者的学习成本正在慢慢减少.

## Package

开发工具理念，运行的时候，项目是以包的方式运行的。暂不研究--因为项目中没有代码。

# Language features

## Programming Thinking

## Grammer

实际上官方文档已经很好了。但是这里针对部分做课题，加深我自己的学习。

### match

Some 表示有值 , None 表示无值,例:
```rust
//方法 match
match val {
    Some(num) => println!("val is: {}", num),
    None => println!("val is None")
}

//方法 if let
if let Some(num) = val {
    println!("val is: {}", num);
} else {
    println!("val is None");
}
```

### 宏编程

### 闭包

### 重载

### trait

trait (特质)的使用可以理解为根据一个模板而衍生出该模板中的所有方法。

### BitOr

### 智能指针

指针 （pointer）是一个包含内存地址的变量的通用概念。
Rust 中最常见的指针是前面介绍的 引用（reference）。引用以 & 符号为标志并借用了他们所指向的值。
智能指针（smart pointers）是一类数据结构，他们的表现类似指针，但是也拥有额外的元数据和功能。

在 Rust 中，普通引用和智能指针的一个额外的区别是引用是一类只借用数据的指针；相反，在大部分情况下，智能指针 拥有 他们指向的数据。Rust现存的智能指针很多，这里会研究其中4种智能指针：
1. Box<T>，用于在堆上分配值
2. Rc<T>，(reference counter)一个引用计数类型，其数据可以有多个所有者。
3. Arc<T>，(atomic reference counter)可被多线程操作，但只能只读。
4. Mutex<T>，互斥指针，能保证修改的时候只有一个线程参与。
5. RefCell<T>,

[参考链接](https://www.cnblogs.com/Evsward/p/rust-one.html)

### 原语

### 生命周期

### 锁

读写锁和普通锁。

读写锁在多写少读的时候拥有比较好的性能比。

### 异步编程

### 无锁编程

不讨论，只作为了解其概念而已。

### 如何构建运行

mod 和 crate. 
rust 似乎没有 class 类的思想, 代替的是 mod.
利用 mod 我们可以在其中构建一个 struct ,该 struct 即是一个实体。

# 学习日志

[2023.3.6]
我迷惘了，如何重新学习 rust ？
是否可以通过例子来学习一门语言而不是通过文档的方式呢。
最快速的方法，通过构建一个仓库，然后一步步去里面填充例子。
没有办法再向以前一样快速学习了吗，不，应该是我的思维变得滞怠了。
不不，问题不在这里，如果是从头开始的话，那么这是有效的。现阶段，用课题的方式显然会更有效率。
分明就是记忆力的问题。没有记忆力，什么都做不了。
耐心一点，思维发散，精神集中。

[2023.3.16]
Option map 和普通 match 的区别
在测试的时候其实两者还是有差别的。match 中使用 return 针对的是整个函数的返回， 而 map 中使用则是单纯的该函数返回，是需要满足接受该 map 的容器结构的。
接下来是一段抽象描述：
在解开 Option 的时候，是无法使用非 match 的闭包用法进行强制返回 Err 的， 因为 Option 内并非是错误码来承接。
如果要在解开的同时使用错误码，那么只能是 Option 使用 ok_or_else 转换成 Result 。

# Manage

## 项目基本文件架构参照

```C++
    hello-rust //项目文件
    |- Cargo.toml
    |- src
        |- main.rs
```

Cargo.toml 为 Rust 的清单文件。其中包含了项目的元数据和依赖库:添加依赖库`ferris-says`。使用`cargo build`进行安装。

    [dependencies]
    ferris-says = "0.2"
src/main.rs 为编写应用代码的地方。

cargo new 会生成一个新的“Hello, world!”项目！我们可以进入新创建的目录中，执行下面的命令来运行此程序：

    cargo run
Cargo.lock文件里面详细记载了本地所用依赖库的精确版本。使用依赖库：

    use ferris_says::say;

## 环境配置

Rustup：Rust安装器和版本管理工具
安装 Rust 的主要方式是通过 Rustup 这一工具，它既是一个 Rust 安装器又是一个版本管理工具。
包管理工具Cargo。
验证方式：

    >rustc -V
    rustc 1.62.1 (e092d0b6b 2022-07-16)

    >cargo --version
    cargo 1.62.1 (a748cf5a3 2022-06-08)

## Rust 交叉编译

5.7-5.8
RUST是否可以导出类C++库文件，在国产操作系统上运行；RUST在国产操作系统中的移植兼容等问题。

应用条件
现状，使用环境和领域。
rust 交叉编译环境。
龙芯。arm

There said it can do such.

# VS Code development

## Recommended plugins

### Rust-ananlyzer

Base to support Rust development.

### Rust test lens

Must install! For test!

### Better TOML

Better TOML is vs code extension to support TOML file.

### crates

This is crates, an extension for crates.io dependencies. Aims helping developers to manage dependencies while using Cargo.toml.

### Tabnine

Automatic completion base on AI.
Also save the guys English pool.

But when I use chinese to write ,it be wrong code style.

# 附录

## 学习链接

[rust 模块组织结构](https://www.cnblogs.com/li-peng/p/13587910.html)

# Error

## rust-analyzer failed to load workspace: Failed to read Cargo metadata from Cargo.toml file

```rust
rust-analyzer failed to load workspace: Failed to read Cargo metadata from Cargo.toml file /home/ithedslonnie/Projects/workspace_work/RUST_tzdb_Workspace/tsdb/Cargo.toml, Some(Version { major: 1, minor: 67, patch: 0 }): Failed to run `"cargo" "metadata" "--format-version" "1" "--manifest-path" "/home/ithedslonnie/Projects/workspace_work/RUST_tzdb_Workspace/tsdb/Cargo.toml" "--filter-platform" "x86_64-unknown-linux-gnu"`: `cargo metadata` exited with an error: error: failed to load manifest for workspace member `/home/ithedslonnie/Projects/workspace_work/RUST_tzdb_Workspace/tsdb/os_base` Caused by: failed to parse manifest at `/home/ithedslonnie/Projects/workspace_work/RUST_tzdb_Workspace/tsdb/os_base/Cargo.toml` Caused by: failed to parse the `edition` key Caused by: this version of Cargo is older than the `2023` edition, and only supports `2015`, `2018`, and `2021` editions.
```

'That's a problem with the project you're opening. As you can see, cargo build fails by itself.'
run `cargo build` , see the error detailed.

My god, because I write the cargo.toml:

```toml
[package]
name = "os_base"
version = "0.1.0"
edition = "2023"
```

change the edition to 2021 , so it is ok.

## "proc-macro server's api version (3) is newer than rust-analyzer's (2)"

vscode 配置 rust-analyzer 路径

  "rust-analyzer.server.path": "~/.rustup/toolchains/nightly-x86_64-unknown-linux-gnu/bin/rust-analyzer"