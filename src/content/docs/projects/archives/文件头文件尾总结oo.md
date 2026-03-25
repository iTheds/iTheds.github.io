---
title: "文件类型以及分析手册"
description: "文件类型以及分析手册"
---

# 文件类型以及分析手册

## 文件类型

### dmg文件

ios上的镜像文件。

### sketch

Sketch 是一款适用于所有设计师的矢量绘图应用。矢量绘图也是目前进行网页，图标以及界面设计的最好方式。但除了矢量编辑的功能之外，我们同样添加了一些基本的位图工具，比如模糊和色彩校正。

我们尽力让 Sketch 容易理解并上手简单，有经验的设计师花上几个小时便能将自己的设计技巧在Sketch中自如运用。对于绝大多数的数字产品设计，Sketch 都能替代 Adobe Photoshop，Illustrator 和 Fireworks。
.sketch的文件只能在苹果mac上支持的一种文件格式

windows下打开：Lunacy

http://www.sketchcn.com/sketch-chinese-user-manual.html

## 文件头与文件尾

|文件类型|文件头|文件尾|
|:-:|:-:|:-:|
JPEG (jpg) | 文件头：FFD8FF |文件尾：FF D9
PNG (png) |  文件头：89504E47| 文件尾：AE 42 60 82
GIF (gif) | 文件头：47494638 |文件尾：00 3B
ZIP Archive (zip) | 文件头：504B0304 |文件尾：50 4B
TIFF (tif) | 文件头：49492A00
Windows Bitmap (bmp) | 文件头：424D
CAD (dwg) | 文件头：41433130
Adobe Photoshop (psd) | 文件头：38425053
Rich Text Format (rtf) | 文件头：7B5C727466
XML (xml) | 文件头：3C3F786D6C 
HTML (html) | 文件头：68746D6C3E
Email [thorough only] (eml) | 文件头：44656C69766572792D646174653A
Outlook Express (dbx) | 文件头：CFAD12FEC5FD746F
Outlook (pst) | 文件头：2142444E
MS Word/Excel (xls.or.doc) | 文件头：D0CF11E0
MS Access (mdb) | 文件头：5374616E64617264204A
WordPerfect (wpd) | 文件头：FF575043
Adobe Acrobat (pdf) | 文件头：255044462D312E
Quicken (qdf) | 文件头：AC9EBD8F
Windows Password (pwl) | 文件头：E3828596
RAR Archive (rar) | 文件头：52617221
Wave (wav) | 文件头：57415645
AVI (avi) | 文件头：41564920
Real Audio (ram) | 文件头：2E7261FD
Real Media (rm) | 文件头：2E524D46
MPEG (mpg) | 文件头：000001BA
MPEG (mpg) | 文件头：000001B3
Quicktime (mov) | 文件头：6D6F6F76
Windows Media (asf) | 文件头：3026B2758E66CF11
MIDI (mid) | 文件头：4D546864

* 常见文件头：

```C#
JPEG  文件头：FF D8 FF E0 00 10 4A 46 49 46 
      文件尾：FF D9
PNG   文件头：89 50 4E 47 0D 0A 1A 0A 
      文件尾： 49 45 4E 44 AE 42 60 82
GIF   文件头： 47 49 46 38 39
bmp   文件头：42 4D E3 BF 22 00 00 00
rar   文件头：52 61 72 21
zip   文件头：50 4B 03 04 14 00 00 00 08 00
PDF   文件头： 25 50 44 46
```

关于png图片长宽的说明：

```C#
00 00 00 0D 说明IHDR头块长为13
49 48 44 52 IHDR标识
00 00 01 F4 图像的宽，500像素
00 00 01 A4 图像的高，420像素
CB D6 DF 8A 为循环冗余校验(CRC)
```

更改图片高度的隐写，直接在IHDR标识后找到对应的四位长宽进行修改就好。