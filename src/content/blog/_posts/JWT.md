---
title: "JWT(JSON Web Token)验证方式"
date: "2018-5-1"
author: "Lonnie iTheds"
categories:
  - web
draft: false
section: "posts"
sourcePath: "markdown/_posts/JWT.md"
slug: "JWT"
---

# JWT(JSON Web Token)验证方式

## JWT构成

> ### header

JWT的头部含有两个信息：

1. *声明类型，例如JWT*
2. *声明加密的算法，这里使用HMAC SHA256*

```javascript
{
  'typ': 'JWT',
  'alg': 'HS256'
}
```

然后将头部进行base64加密（该加密是可以对称解密的),构成了第一部分

```C++
eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9
```

> ### playload

标准中注册的声明 (建议但不强制使用) ：

* iss: jwt签发者
* sub: jwt所面向的用户
* aud: 接收jwt的一方
* exp: jwt的过期时间，这个过期时间必须要大于签发时间
* nbf: 定义在什么时间之前，该jwt都是不可用的.
* iat: jwt的签发时间
* jti: jwt的唯一身份标识，主要用来作为一次性token,从而回避重放攻击。

> 如何获取

声明又分为：

公共的声明 ：
公共的声明可以添加任何的信息，一般添加用户的相关信息或其他业务需要的必要信息.但不建议添加敏感信息，因为该部分在客户端可解密.

私有的声明 ：
私有声明是提供者和消费者所共同定义的声明，一般不建议存放敏感信息，因为base64是对称解密的，意味着该部分信息可以归类为明文信息。

定义一个payload:

```javascript
{
  "sub": "1234567890",
  "name": "John Doe",
  "admin": true
}
```

然后将其进行base64加密，得到Jwt的第二部分。

```txt
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9
```

> ### signature

jwt的第三部分是一个签证信息，这个签证信息由三部分组成：

* header (base64后的)
* payload (base64后的)
* secret

将这三个部分通过header中声明的加密方式进行加密就得到了最终的JWT标识：

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ
```

参考链接：

* [JWT是什么](https://www.jianshu.com/p/576dbf44b2ae)