---
title: "VB学习手记"
description: "VB学习手记"
---

# VB学习手记

> ## 入门篇

前期我们可以使用ADO控件来连接VB工程和数据库，在入门篇里可以对VB语法有大概了解

> ### 1.ADO直接操作控件

```VB
Adodc1.Recordset.MoveNext
Adodc1.Recordset.MoveFirst
Adodc1.Recordset.MovePrevious
Adodc1.Recordset.MoveLast
```

在这类中我们可以使用如下方法来让一个标签失效。

```VB
If Adodc1.Recordset.EOF = True Then
   Command2.Enabled = False
End If
```

>2.删除操作，在这块讲解中，我们还是利用ADO部件

    Adodc1.Recordset.MoveNext
    Adodc1.Recordset.Delete
>3.添加操作和删除操作一样，

```VB
  Adodc1.Recordset.AddNew
  Adodc1.Recordset.Fields("sno") = Trim(Text4.Text)
  Adodc1.Recordset.Fields("sname") = Trim(Text5.Text)
  Adodc1.Recordset.Fields("ssex") = Trim(Text1.Text)
  Adodc1.Recordset.Fields("sage") = CInt(Trim(Text2.Text))
  Adodc1.Recordset.Fields("sdept") = Trim(Text3.Text)
```

其中，Trim函数用于将内容里面头和尾的空格删除
CInt函数的作用是四舍五入后取整

添加后应该使用`Adodc1.Recordset.Update`来更新记录

>4.利用ADODB对象来连接数据库

连接方式：

```VB
Set conn = New ADODB.Connection
 conn.ConnectionString = "Provider=SQLOLEDB.1;Integrated Security=SSPI;Persist Security Info=False;Initial Catalog=xsglxt;Data Source=LONNIE\SQLEXPRESS"
 conn.Open
 ```

构造sql语句：

```VB
Dim strSQl As String
 strSQl = "select * from userd where userid='" & Trim$(Text1.Text) & "' and psw='" & Trim$(Text2.Text) & "' "
 ```

执行sql语句

```VB
Dim str As New ADODB.Recordset
Set str = New ADODB.Recordset
str.CursorLocation = adUseClient
str.Open strSQl, conn, adOpenStatic, adLockReadOnly
```

其中，我们使用Dim定义一些变量，`conn.ConnectionString`其中的字符串我们可以参考ADO部件中的生存的String连接方式。
其`adLockReadOnly`表示只读，还可以设置诸如`adLockPessimistic`和`adLockOptimistic`这样的其他属性值，使得我们可以更改连接后的数据库。
其中str接受了其中的返回值。返回类型为一个表

还有一种直接模拟ADO控件来连接数据库并且以DataGrid方式返回的方法：

```VB
Set adoCon = New ADODB.Connection
adoCon.Open constr//连接数据库字符串

Set adoRst = New ADODB.Recordset
adoRst.ActiveConnection = adoCon
adoRst.CursorLocation = adUseClient
adoRst.CursorType = adOpenDynamic
adoRst.LockType = adLockOptimistic
adoRst.Source = "Student"
adoRst.Open , , , , adCmdTable

```

>5.窗口操作

* 打开窗口：

```VB
窗口名.show
```

* 关闭窗口：

```VB
Unload Me //Me代指所有的现在窗体
```

* 判断当前是什么窗体

```VB
```

>6.获取控件信息

获取TextBox：

```VB
Dim tmp As String
tmp = Trim$(Text1.Text)
```

获取ComboBox：

[example without test](http://www.myexception.cn/vb-dotnet/54538.html)

[example without test](http://www.myexception.cn/vb-dotnet/54538.html)

```VB

```

> 7.vb中获取DataGrid选中行的值

```VB
Text2.Text = DataGrid1.Columns("proname").CellText(DataGrid1.Bookmark)
Text3.Text = DataGrid1.Columns("college").CellText(DataGrid1.Bookmark)
Text4.Text = DataGrid1.Columns("sname").CellText(DataGrid1.Bookmark)
```

> 8.调试

```VB
MsgBox ComboBox
```

> 9.数组

```VB
Dim tmp()
tmp = Array("pronum", "proname", "teacher", "sname", "sphone", "college", "suggestion", "funds", "starttime", "endtime")

For Each X In tmp
    If IsNull(str.Fields(X).Value) Then
       Controls(X).Text = X
    Else
        Controls(X).Text = str.Fields(X).Value
    End If
Next
```

>选择疑问

```VB

Private Sub Command_Del_Click()

Dim res As Integer
res = MsgBox("确定删除该条记录？", vbExclamation + vbYesNo + vbDefaultButton2)
If res = vbYes Then
    adoRst.Delete
    adoRst.MoveNext
    If adoRst.EOF = True Then
       adoRst.MoveLast
    End If
End If
If a <> 1 And a <> 4 Then
Call Display
End If
End Sub
```

## 进阶篇

在实际工程中，我们不免要用到高度灵活性的操作方式，通过ADO控件的操作方式已经不能满足在VB的各个作用域上、以及代码构造优化上的灵活性。

在进阶篇中，我们介绍在基本的代码基础上来实现各种操作，包括直接使用验证字符串连接数据库并获得操作数据库的权限，在各个函数框架中灵活调用函数、并且规定函数执行顺序，动态生成标签来达到页面的高度可扩展性。当然对于数据的基本验证和甄别也应有所涉猎。在这些趋于完善之后，我们考虑VB工程的稳定性与安全性。

>1.使用字符串连接数据库

```VB
 Set con = New ADODB.Connection
 con.ConnectionString = constr
 con.Open

Dim tmp As String
tmp = Trim$(Text1.Text)

'连接数据库
  
 Dim strSQL As String
 strSQL = "Select * from Student join  SC on Student.Sno = SC.Sno  join Course on  Sc.Cno = Course.Cno where Sname LIKE '" & tmp & "' or Cname LIKE '" & tmp & "' or SC.Cno LIKE '" & Trim$(Text1.Text) & "'  or Sdept LIKE '" & tmp & "' or SC.Sno Like '" & tmp & "' or Sage LIKE '" & tmp & "'  "


 '连接数据库中表的select语句


Dim str As New ADODB.Recordset
Set str = New ADODB.Recordset
str.CursorLocation = adUseClient
str.Open strSQL, con, adOpenStatic, adLockReadOnly

str.MoveLast

 Text1.Text = str.Fields("Cno").Value
 Text2.Text = str.Source
---
Set DataGrid.DataSource = str
DataGrid.Refresh
```

>2.构造全局变量并在窗口加载时赋值

* 定义在窗体中使用的全局变量

```VB
Public con As ADODB.Connection
Public constr As String
---
Private Sub Form_Load()
constr = "Provider=SQLOLEDB.1;Integrated Security=SSPI;Persist Security Info=False;Initial Catalog=ProMS;Data Source=LONNIE\SQLEXPRESS"
End Sub
```

>3.动态生成标签

```VB
Public Class Form1
    '窗体的load事件，中加载控件。(当然你可以在任意地方加载)
    Private Sub Form1_Load(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles MyBase.Load
        My_Control_label() '生成label1标签控件函数
    End Sub

    '生成label1标签控件函数
    '将标签控件添加到窗体中，然后定义标签的text属性、位置、颜色、字体等属性。并添加Click事件处理函数
    Private Sub My_Control_label()
        Dim label1 As New Label '定义一个标签控件对象
        Me.Controls.Add(label1) '添加到窗体控件集中，你也可以添加到其他控件集中，
        '如(Panel1.Controls.Add(label1))就是添加到panel1控件中
        With label1
            .Text = "新建标签"
            .Location = New Point(10, 20) '定义控件位置，默认的是（0，0）
            .AutoSize = True
            .ForeColor = Color.Red
            .Font = New Font("楷体", 20) '定义字体
        End With
        AddHandler label1.Click, AddressOf label_Click '添加click事件
    End Sub
    '标签的click事件，点击该标签后，释放该控件资源
    Private Sub label_Click(ByVal sender As System.Object, ByVal e As System.EventArgs)
        Dim label1 As Label = CType(sender, Label) '获取当前操作的控件对象，只有这样才能对该控件进行操作
        Me.Controls.Remove(label1) '将控件移除
        label1.Dispose() '释放控件资源
    End Sub
End Class
```

> ComboBox与数据库数据相复用

使用ComboBox控件加载数据库中的数据

```VB
Public con As ADODB.Connection
Public constr As String

Private Function Selectsql(SQL As String) As ADODB.Recordset       '返回ADODB.Recordset对象
   Dim ConnStr As String
    Dim Conn As ADODB.Connection
    Dim rs As ADODB.Recordset
    Set rs = New ADODB.Recordset
    Set Conn = New ADODB.Connection
     
    'On Error GoTo MyErr:
    ConnStr = constr
    Conn.Open ConnStr
    rs.CursorLocation = adUseClient
    rs.Open Trim$(SQL), Conn, adOpenDynamic, adLockOptimistic
    Set Selectsql = rs
    'Exit Function
'MyErr:
    'Set rs = Nothing
    'Set Conn = Nothing '释放相关的系统资源
    'MsgBox Err.Description, vbInformation, "系统提示" '显示出错信息
End Function
Private Sub Form_Load()
constr = "Provider=SQLOLEDB.1;Integrated Security=SSPI;Persist Security Info=False;Initial Catalog=ProMS;Data Source=LONNIE\SQLEXPRESS"
 
    Dim SQL As String
    Dim rs As ADODB.Recordset
    Dim X As Long
    On Error GoTo Err_box
    SQL = " select * from college"
    Set rs = Selectsql(SQL)
    
    If rs.RecordCount > 0 Then
        rs.MoveFirst
        For X = 1 To rs.RecordCount
            Combo1_Sdept.AddItem rs.Fields("name").Value
            rs.MoveNext
        Next X
        Combo1_Sdept.ListIndex = 0
    End If
    rs.Close
    Exit Sub
Err_box:

End Sub
```
> 函数和方法

sub和function方法区别：

> 窗体中互相传值

下面展示将数据从窗口1传递到窗口2

```VB
'窗口1代码
Private Sub Command2_Click()

窗口1.stdnum = "Test"
窗口1.Show
Unload Me
End Sub

'窗口二代码

Public stdnum As String'主要通过此变量来传值

Private Sub Form_Load()
'MsgBox stdnum'测试是否传递成功
End Sub
```

此处代码顺序很重要，如果先.Show后赋值，如：

```VB
窗口1.Show
窗口1.stdnum = "Test"
```

会发现，窗口1中的stdnum并没有被立马改变，在From_Load中无法使用，此处必须尤为重要的注意。小记一失误，程序在编写中时，我希望实现一次性修改链接sql server字符串，所以在所有的窗口中不断传值，但是没有考虑到顺序问题，在展示程序的时候频繁出现连接错误，ODBC啊，以此谨记工程之严谨性！！！

> VB实现窗口Tab键顺序

设定各控件的Tab键的顺序可以通过设置控件的TabIndex大小来设定，
第一个tab键到的地方应该设置成最小的值。

> 打印

[^_^]:<> (感谢小伙伴的杰出贡献，项目的完成离不开她的努力，谢谢雪丢丢同学！！！)

朋友的帮助，是我最大的幸运(没错，我就是个划水的~~\飘过)

Public Function prnt(X As Variant, Y As Variant, fnt As Variant, txt0 As Variant)
Printer.CurrentX = X
Printer.CurrentY = Y
Printer.FontSize = fnt
Printer.Print txt0
End Function

```VB
     Dim fnt As Single
    Dim pp As Integer
    pp = 0 '设置开始页码0
    Dim stry, strx, strx1, stry1, linw, page1, p As Integer

    Static a(8) As Integer '定义打印的列数
    ss$ = "审批表" '定义表头
    kan = 0
    DataGrid1.Row = 1


        a(i) = 2000 ' 定义每列宽
        kan = 9000 '计算表格总宽度
    

    page1 = 15  '定义每页行数
    strx = 200
    strx1 = 200 '定义X方向起始位置
    stry = 1400
    stry1 = 1400 '定义Y方向起始位置
    linw = 240 '定义行宽
    fnt = 14 '定义字体大小

    Printer.FontName = "宋体" '定义字体
    dd = prnt(4000, 700, 18, ss$) '打印标题
    Printer.Line (strx - 50, stry - 30)-(strx + kan - 10, stry - 30)


    ' 打印学号，姓名...
    Dim attr As Variant
    attr = Array("项目编号", "项目名称", "所属学院", "负责人", "指导老师", "联系电话", "项目经费", "开始时间", "结束时间", "审批意见")
    For i = 0 To 2
        DataGrid1.Col = i
        strx = strx1

        Printer.Line (strx1 - 50, stry - 50)-(strx1 - 50, stry + 400)  '
        tmp = prnt(strx1, stry, fnt, attr(i)) '打印属性
        Printer.Line (strx, stry - 30)-(strx + kan - 10, stry - 30)

        p = p + 1
       'For X = 0 To 4
           'DataGrid1.Row = X
            tmp = prnt(strx + 1500, stry, fnt, DataGrid1.Text) '打印内容
            Printer.Line (strx + 1500, stry - 50)-(strx + 1500, stry + 400) '打印竖线
            'Printer.Line (strx - 50, stry - 30)-(strx + kan - 10, stry - 30) '打印行线
            strx = strx + a(i)
       ' Next
        stry = stry + 400
        Printer.Line (strx - 7500, stry - 30)-(strx + kan - 10, stry - 30)
    Next
    
    i = 3
      For m = 0 To 2
        strx = strx1
    For j = 0 To 1

        DataGrid1.Col = i
        i = i + 1

        Printer.Line (strx - 50, stry - 50)-(strx - 50, stry + 400)  '打印竖线
        tmp = prnt(strx, stry, fnt, attr(i)) '
        strx = strx + 1500
        tmp = prnt(strx, stry, fnt, DataGrid1.Text)  '打印表格内容
       ' strx = strx + 3000
        Printer.Line (strx, stry - 50)-(strx, stry + 400)   '打印竖线
        strx = strx + 3000
    Next
    stry = stry + 400
    Printer.Line (strx1, stry - 30)-(strx + kan - 10, stry - 30)  '打印行线
    Next

    strx = strx1

    stry = stry + 600
    Printer.Line (strx1 - 50, stry - 30)-(strx + kan - 10, stry - 30) '打印横线
    tmp = prnt(strx1, stry, fnt, attr(i)) '打印属性
    Printer.Line (strx1, stry - 30)-(strx1, stry + 2000) '打印左竖线
    'Printer.Line (strx - 50, stry - 30)-(strx - 50, stry + 2000)
    
    Printer.EndDoc  '打印结束
```

```VB
Dim fnt As Single
    Dim pp As Integer
    pp = 0 '设置开始页码0
    Dim stry, strx, strx1, stry1, linw, page1, p As Integer
    Static a(8) As Integer '定义打印的列数
    ss$ = "项目信息统计表" '定义表头
    kan = 0
    DataGrid1.Row = 1
    For i = 0 To 6
    a(i) = 1500 ' 定义每列宽
    kan = kan + a(i) '计算表格总宽度
    Next
    page1 = 15  '定义每页行数
    strx = 200
    strx1 = 200 '定义X方向起始位置
    stry = 1400
    stry1 = 1400 '定义Y方向起始位置
    linw = 240 '定义行宽
    fnt = 8 '定义字体大小
    Printer.FontName = "宋体" '定义字体
    dd = prnt(4000, 700, 18, ss$) '打印标题
    Printer.Line (strx - 50, stry - 30)-(strx + kan - 10, stry - 30)
    For j = 0 To 5
     'gridrow为所要打印的行数
     DataGrid1.Row = j
     strx = strx1
     Printer.Line (strx - 50, stry - 30)-(strx + kan - 10, stry - 30)
     p = p + 1
     For i = 0 To 4
      DataGrid1.Col = i
      dd = prnt(strx, stry, fnt, DataGrid1.Text)
      strx = strx + a(i)
     Next
    If p > page1 Then 'next page
     p = 0
     strx = strx1
     Printer.Line (strx - 50, stry + linw)-(strx + kan - 10, stry + linw)
     stry = stry1
     For n = 0 To 8
     Printer.Line (strx - 30, stry - 30)-(strx - 30, stry + (page1 + 2) * linw)
     strx = strx + a(n)
     Next
     Printer.Line (strx - 30, stry - 30)-(strx - 30, stry + (page1 + 2) * linw)
     pp = pp + 1
     foot$ = "第 " + CStr(pp) + " 页"
     dd = prnt(strx - 30 - 1000, stry + (page1 + 2) * linw + 100, 10, foot$) '打印页脚码
     Printer.NewPage 'next page
     dd = prnt(4000, 700, 18, ss$) '打印标题
     strx = strx1
     stry = stry1
     Printer.Line (strx - 50, stry - 30)-(strx + kan - 10, stry - 30) '打印第一行
    Else
     stry = stry + linw
    End If
    Next
     st = stry
    If p < page1 Then '在最后页剩余划空行
    For o = p To page1 + 1
     strx = strx1
     Printer.Line (strx - 50, stry - 30)-(strx + kan - 10, stry - 30)
     stry = stry + linw
    Next
    End If
    stry = stry1
    strx = strx1
    stry = stry1 'line col
    For n = 0 To 8
      Printer.Line (strx - 30, stry - 30)-(strx - 30, stry + (page1 + 2) * linw)
      strx = strx + a(n)
    Next
    Printer.Line (strx - 30, stry - 30)-(strx - 30, stry + (page1 + 2) * linw)
     pp = pp + 1
     foot$ = "第 " + CStr(pp) + " 页"
     dd = prnt(strx - 30 - 1000, stry + (page1 + 2) * linw + 100, 10, foot$) '打印页脚码
     Printer.EndDoc  '打印结束
 ```

> VB打开文件

打开txt文件

```VB
'txt为路径 ，App.Path为系统exe文件路径
Private Sub read(txt As String)

    Dim strSj As String
    Dim s As String
    Open App.Path & "\file\" & txt For Input As #1
        Do Until EOF(1)
            Line Input #1, s
            strSj = strSj & s & vbCrLf
        Loop
    Close #1
    Text = strSj
    '设置Text的属性MultiLine为True

End Sub
```

> ### DateTimePicker控件

```VB
Dim Ddate As Date
If DTPicker1.Enabled = True Then
    Ddate = DTPicker1.Value
End If

Ddate = #6/7/2018# '月/日/年

DTPicker1.Value = Now
```

---

动态变化
验证
多表连接
统计数据生成图表
自主按需求建表
前端设计之from自适应大小
VB中的身份验证
VB实现打印
VB连接各种数据库管理器
DataGrid1.ApproxCount


项目编号", "负责人", "名称", "学科", "项目类别", "开始时间", "结束时间", "状态标识", "审批人"