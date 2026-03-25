---
title: "基于MIPS指令集的32位五级流水线CPU设计"
description: "那个人，我们组队吧"
---

# 基于MIPS指令集的32位五级流水线CPU设计

## 理论篇

> ### 概念理解

* 什么是MIPS？

* 什么是五位流水线？

* 32位是什么？

> ### 模块说明

| 模块型号  |                                     包含模块                                      | 模块功能                                             | 备注                           |
| --------- | :-------------------------------------------------------------------------------: | :--------------------------------------------------- | :----------------------------- |
| regfile   |                                        无                                         | 寄存器模块                                           | 初始值为0。                    |
| mux2x32   |                                        无                                         | 32位二选一                                           |                                |
| pipecu    |                                        无                                         | 控制单元，产生控制信号                               | 设计关键所在                   |
| Compare   |                                        无                                         | 比较电路，相等输出0                                  |                                |
| Pcinstmem |                                        无                                         | 指令存储寄存器                                       |                                |
| Pcpemem   |                                        无                                         | 数据存储寄存器                                       | 调用系统模块编出来的           |
| Pipemwreg |                                        无                                         | mem和wb阶段中间的信号寄存器，见图土黄色长条          |                                |
| Pipeemreg |                                        无                                         | exe和mem阶段中间的信号寄存器，见图土黄色长条         |                                |
| Pipedereg |                                        无                                         | id和exe阶段中间的信号寄存器，见图土黄色长条          |                                |
| Pipeir    |                                        无                                         | if和id阶段中间的信号寄存器，见图土黄色长条           |                                |
| Pipeif    |                            Cla32<br>Pcinstmem Mux4x32                             | If阶段，pc+4，取指令                                 |                                |
| Pipeid    |                Cla32 Compare Pipecu Mux2x32 Mux2x5 Mux4x32 Regfile                | 在id阶段，输出控制信号并将下一步运算需要的数据取好。 | 这里编写程序很繁琐连电路图快点 |
| Pipeexe   |                                   Cla32 Mux2x32                                   | Alu        Exe阶段，执行计算                         |                                |
| Alu       |                                        无                                         | 根据cu输出的ALUC信号进行计算                         |                                |
| Cla32     |                                        无                                         | 加减法器                                             | 一般只用来做加法了             |
| Dff32     |                                        无                                         | 不带使能的D触发器                                    |                                |
| Dffe32    |                                        无                                         | 带使能的D触发器                                      |                                |
| Mux2x5    |                                        无                                         | 5位二选一电路                                        |                                |
| Mux4x32   |                                        无                                         | 32位四选一电路                                       |                                |
| Pipecpu   | Dffe32 Pipeif Pipeir Pipeid Pipedereg Pipeexe Pipeemreg Pipemem Pipemwreg Mux2x32 | 最外层电路，综合了所有前面模块                       | 用电路图连接比较简单           |

> ### 指令

输入线路：

* clock
* memclock
* resetn

输出线路

|输出线路名 |线长|
|---|:-----:|:-:|
|ealu|    32|
|inst|    32|
|malu|    32|
|pc|      32|
|walu |   32|

> ### 参数说明

仿真时间1μs，


## 辨证篇

论文参见文件


## 实践篇

> ### 所有文件框架

alu.v
cla32.v
compare.v
cpu.v
dff32.v
dffe32.v
mux2x5.v
mux2x32.v
mux4x32.v
pcinstmem.v
pipecpu.v
pipecu.v
pipedereg.v
pipeemreg.v
pipeexe.v
pipeid.v
pipeif.v
pipeir.v
pipemem.v
pipemwreg.v
pipepc.v
regfile.v

> ### 功能

#### alu.v(运算器)

输入 a[31:0],b[31:0],aluc[3:0]

输出 result[31:0]

方程 result = aluc(a,b)

|功能 | aluc|说明|
|:-:|:-:|:-|
|ADD|4'bx000|加法|
|SUB|4'bx100|减法|
|AND|4'bx001|a&b|
|OR|4'bx101|a or b|
|XOR|4'bx010|a^b|
|SLL|4'b0011|b<<a,if b is binary ,that means b * 2^a|
|SRL|4'b0111|b>>a,b / 2^a|
|SRA|4'b1111|b>>>a,without the operation|
|LUI|4'bx110|b<<16|


#### cla32.v(加减法选择运算器)

输入 a[31:0],b[31:0],sub

输出 s[31:0]

方程 s = sub ? a - b : a + b

#### compare.v(判断是否相等)
输入 a[31:0],b[31:0]

输出 zero

方程 zero=(a==b)
#### cpu.v
输入 clock,resetn,inst,mem,pc,wmem,alu,data

输出 

方程 
#### dff32.v(双线路三态门)
输入 d[31:0],clk,clrn

输出 q[31:0]

方程

```CPU
while(negedge clrn or posedge clk)
    if(clrn == 0) q = 0;
    else q = d;
```

#### dffe32.v(附加线路双线路三态门)
输入 d[31:0],clk,clrn,e

输出 q[31:0]

方程 

```CPU
while(negedge clrn or posedge clk)
    if(clrn == 0 )
        q = 0 ;
    else if(e == 1) q = d;
```

#### mux2x5.v(5位两线选择输出)
输入 a0[4:0],a1[4:0],s

输出 y[4:0]

方程 y = s ? a1 : a0
#### mux2x32.v(32位两线选择输出)
输入 a0[31:0],a1[31:0],s

输出 y[31:0]

方程 y = s ? a1 : a0
#### mux4x32.v(32位4线选择输出)
输入 a0[31:0],a1[31:0],a2[31:0],a3[31:0],s[1:0]

输出 y[31:0]

方程 y = s(a0,a1,a2,a3)

|s|输出|
|:-:|:-:|
|2'b00| y = a0|
|2'b01| y = a1|
|2'b10| y = a2|
|2'b11| y = a3|
#### pcinstmem.v 重要的指令文件
输入 a[5:0]

输出 inst[31:0]
inst为寄存器
方程

|a|ram|功能|
|:-:|:-:|:--|
|6'b000000: inst <= ram[ 0];|ram[ 0]=32'h3c010000;|
|6'b000001: inst <= ram[ 1];|ram[ 1]=32'h34240050;|
|6'b000010: inst <= ram[ 2];|ram[ 2]=32'h0c00001b;|
|6'b000011: inst <= ram[ 3];|ram[ 3]=32'h20050004;|
|6'b000100: inst <= ram[ 4];|ram[ 4]=32'hac820000;|
|6'b000101: inst <= ram[ 5];|ram[ 5]=32'h8c890000;|
|6'b000110: inst <= ram[ 6];|ram[ 6]=32'h01244022;|
|6'b000111: inst <= ram[ 7];|ram[ 7]=32'h20050003;|
|6'b001000: inst <= ram[ 8];|ram[ 8]=32'h20a5ffff;|
|6'b001001: inst <= ram[ 9];|ram[ 9]=32'h34a8ffff;|
|6'b001010: inst <= ram[10];|ram[10]=32'h39085555;|
|6'b001011: inst <= ram[11];|ram[11]=32'h2009ffff;|
|6'b001100: inst <= ram[12];|ram[12]=32'h312affff;|
|6'b001101: inst <= ram[13];|ram[13]=32'h01493025;|
|6'b001110: inst <= ram[14];|ram[14]=32'h01494026;|
|6'b001111: inst <= ram[15];|ram[15]=32'h01463824;|
|6'b010000: inst <= ram[16];|ram[16]=32'h10a00003;|
|6'b010001: inst <= ram[17];|ram[17]=32'h00000000;|
|6'b010010: inst <= ram[18];|ram[18]=32'h08000008;|
|6'b010011: inst <= ram[19];|ram[19]=32'h00000000;|
|6'b010100: inst <= ram[20];|ram[20]=32'h2005ffff;|
|6'b010101: inst <= ram[21];|ram[21]=32'h000543c0;|
|6'b010110: inst <= ram[22];|ram[22]=32'h00084400;|
|6'b010111: inst <= ram[23];|ram[23]=32'h00084403;|
|6'b011000: inst <= ram[24];|ram[24]=32'h000843c2;|
|6'b011001: inst <= ram[25];|ram[25]=32'h08000019;|
|6'b011010: inst <= ram[26];|ram[26]=32'h00000000;|
|6'b011011: inst <= ram[27];|ram[27]=32'h00004020;|
|6'b011100: inst <= ram[28];|ram[28]=32'h8c890000;|
|6'b011101: inst <= ram[29];|ram[29]=32'h01094020;|
|6'b011110: inst <= ram[30];|ram[30]=32'h20a5ffff;|
|6'b011111: inst <= ram[31];|ram[31]=32'h14a0fffc;|
|6'b100000: inst <= ram[32];|ram[32]=32'h20840004;|
|6'b100001: inst <= ram[33];|ram[33]=32'h03e00008;|
|6'b100010: inst <= ram[34];|ram[34]=32'h00081000;|
|other|inst <= 32'b0;|

#### pipecpu.v
#### pipecu.v
#### pipedereg.v
#### pipeemreg.v
#### pipeexe.v
#### pipeid.v
#### pipeif.v
#### pipeir.v
输入 pc4[31:0],ins[31:0],wpcir,clock,resetn

输出 pcfour[31:0],inst[31:0]

方程

```verilog
always@(negedge resetn or posedge clock)
        begin
                if(resetn == 0) begin
                        pcfour<=0;
                        inst<=0;
                end else if(wpcir==1)begin
                        pcfour<=pc4;
                        inst<=ins;
                end
end
```

#### pipemem.v
输入 mwmem,malu[31:0],mb[31:0],clock,memclock

输出 mmo[31:0]

方程

```verilog
lpm_ram_dq ram (.data(mb),.address(malu[6:2]),
                                        .inclock(memclock),.outclock(memclock),.we(write_enable),.q(mmo));
        defparam ram.lpm_width = 32;
        defparam ram.lpm_widthad = 5;
        defparam ram.lpm_indata = "registered";
        defparam ram.lpm_outdata = "registered";
        defparam ram.lpm_file = "pcdatamem.mif";
        defparam ram.lpm_address_control = "registered";
```

#### pipemwreg.v
输入 mwreg,mm2reg,mmo[31:0],malu[31:0],mdesr[4:0],clock,resetn

输出 wwreg,wm2reg,wmo[31:0],walu[31:0],wdesr[4:0]

方程

```verilog
while(negedge resetn or posedge clock)
                if(resetn == 0) begin
                        wwreg<=0;
                        wm2reg<=0;
                        wdesr<=0;
                        wmo<=0;
                        walu<=0;
                end else begin
                        wwreg<=mwreg;
                        wm2reg<=mm2reg;
                        wdesr<=mdesr;
                        wmo<=mmo;
                        walu<=malu;
```

#### pipepc.v
输入
input [5:0] op,func;
input [4:0] rs,rt,mrn,ern;
input z,mm2reg,mwreg,em2reg,ewreg;
输出
output wreg,regrt,call,m2reg,shift,aluimm,sext,wmem,wpcir;
output [3:0] aluc;
output [1:0] pcsource,fwda,fwdb;
方程
此器件比较复杂，op和func大概为数据线，然后aluc为op和func处理后的结果。
所有的数据几乎都涉及到op和func。
#### regfile.v(选择输出更新数据)
输入 rna[4:0],rnb[4:0],wn[4:0],d[31:0],we,clk,clrn

输出 qa[31:0],qb[31:0]

方程
clk时钟信号，clokc内部线，clock = ~clk。
clrn为复位信号。clrn或者clk为下降沿时开始操作。
如果clrn == 0，开始清零操作。
如果不是，判断(wn != 0) && (we == 1)，register[wn] <= d。
其中rna和rnb是选择信号，选择将寄存器中的哪些数据赋值给qa、qb输出。
we控制是否要更新寄存器register中的数据，wn控制更新哪些数据。
rna和rnb及wn可以认为是地址。

```verilog
assign qa = (rna == 0)? 0 : register[rna]; // read
assign qb = (rnb == 0)? 0 : register[rnb]; // read
always @(posedge clock or negedge clrn) begin
if (clrn == 0) begin // reset
    integer i;
    for (i=1; i<32; i=i+1)
        register[i] <= 0;
    end else begin
if ((wn != 0) && (we == 1)) // write
    register[wn] <= d;
    end
end
```

> ### 跟线总结

主要器件pipecpu用到了以下线路：
input clock,memclock,resetn;
output [31:0] pc,inst,ealu,malu,walu;
wire [31:0] bpc,jpc,npc,pc4,ins,pcfour,inst,dimm,ea,eb,eimm;
wire [31:0] epcfour,mb,mmo,wmo,wrfdi,malu,walu,da,db,alua,alub;
wire [4:0] ddesr,edesr0,edesr,mdesr,wdesr;
wire [3:0] daluc,ealuc;
wire [1:0] pcsource;
wire wpcir,wregrt;
wire dwreg,dm2reg,dwmem,daluimm,dshift,djal;
wire ewreg,em2reg,ewmem,ealuimm,eshift,ejal;
wire mwreg,mm2reg,mwmem;
wire wwreg,wm2reg;

clock 用于控制大部分的上层器件。
resten 用于控制许多器件的复位。
memclock 只对pipemem mem_stage做控制。
在此仿真中clock一个周期50ns，而memclock为一个周期10ns，频率是clock的5倍

#### if取指令阶段 pipeif if_stage
pipeif if_stage (pcsource,pc,bpc,da,jpc,npc,pc4,ins)
输入pcsource,pc,bpc,da,jpc,npc,输出pc4,ins
此阶段为从ROM中取指令。执行器件是pipeif if_stage。
输入线有pcsource[1:0],pc[31:0],bpc[31:0],da[31:0],jpc[31:0]；输出线有npc[31:0],pc4[31:0],ins[31:0]。
从第一眼中可以看到pcsource为类似于控制信号，而其余的为数据或指令。
三个部件如下：
pcinstmem instmem (pc[7:2],ins);
cla32 pcplus4 (pc,32'h4,1'b0,pc4);
mux4x32 nextpc (pc4,bpc,da,jpc,pcsource,npc);
其中pcinstmem为指令存储器，有35条指令。其中`pc[7:2]`为指令存取的代码，5根线2^6=64，有32条指令。
然后再看cla32(加减法选择运算器)第三个参数决定是加还是减，1减0加，在这里执行加的操作，将pc和4(d)相加，得到内部线pc4。
mux4x32.v(32位4线选择输出)，由输入线pcsource决定输出那一根线，其十进制x代表第x个参数输出。

依靠pc[7:2]取相对应指令，输出为inst。pc4为加4后的pc，直接到if和id阶段的存储器内部。npc则送到dffe32 prog_cnt选择输出。

这个仿真中我们验证是否按照我们的要求取指令成功。仿真成功。

所以在这个阶段中，pcsource为控制信号选择输出pc4、bpc、da、jpc这四根线中的某一根到npc。
而pc，其中的[7:2]决定将数据的那一条指令放入寄存器中传输到ins。
而pc加4的原因~看后续中输出所发出的信号ins是什么意思。
此处有一种解释是，在单元编址中，单元如果是字节，指令是32位，那么久每次加4。不知正确与否。

#### if和id阶段的寄存器 pipeir inst_reg
输入为pc4[31:0],ins[31:0],wpcir,clock,resetn。输出为pcfour[31:0],inst[31:0]。
其中的clock和resetn来自系统输入线clock和resetn。
而pc4和ins来自于上一个器件if阶段器件pipeif if_stage的输出线路。
而wpcir来自于id阶段的输出wpcir。怀疑此为反馈线路。

当resetn为下降沿，或者说clock为上升沿时，开始进行判断，如果说resetn为下降沿，就将pcfour和inst清零。
如果resetn不为下降沿，那么再判断，如果wpcir为上升沿，就将pc4给pcfour、ins给inst输出这两个线路。
这样一来就好理解了。当id阶段要用到if阶段的数据时，发送信号wpcir给这个器件，然后将结果提取出来。

值得探讨的是，关于寄存器的问题。在这里，pcfour和inst两个为寄存器。在resetn下降沿时清零。wpcir为1时将输入输出。那么这样一来if阶段的数据并不是一直存储在这个寄存器的。当然这只是一个猜想。在if阶段查找，发现并没有寄存器存在。
那么这个寄存器是这么执行存储功能的呢？我们一般会设想，一个阶段if处理完数据后直接存在这里。这里为什么直接就使用？这就是为什么clock存在的理由吧。

#### id译码阶段pipeid id_stage
输入有
pcfour[31:0],inst[31:0],wrfdi[31:0],
ealu[31:0],malu[31:0],mmo[31:0],
wwreg,mm2reg,mwreg,em2reg,ewreg,
clock,resetn,
wdesr[4:0],mrn[4:0],ern[4:0],

输出有
bpc[31:0],jpc[31:0],
da[31:0],db[31:0],
pcsource[1:0],wpcir,
daluc[3:0],dimm[31:0],
ddesr[4:0],dwreg,dm2reg,dwmem,daluimm,dshift,djal,

其中pcfour和inst来自于if和id阶段的寄存器。其它大致来自于反馈线路和控制线路。
clock和resetn为系统输入。
wwreg可以回溯到各个中间寄存器部件，但是没有到if和id间的寄存器，并且它只受id译码阶段控制输出，所以未指令控制信号。不进入阶段寄存器中处理数据，却在中间寄存器中游走，所以可以大致判别为解决冲突的控制线路。
wdesr“在某种情况下”来自于上个周期的输出ddser。
wrfdi[31:0]来wb写回阶段。
mm2reg、mwreg来自exe和mem阶段的中间寄存器。也连接在mem和wb阶段的中间寄存器做为输入。
em2eg、ewreg则来自id和exe阶段的寄存器，也连接在exe和mem阶段的中间寄存器做为输入。
ealu和mmo直接旁路技术。

bpc为pcfour加上{`{16{dsext&inst[15]}`},inst[15:0]}<<2，其中的dsex来自器件pipecu。
jpc为{pcfour[31:28],inst[25:0],1'b0,1'b0}。
da、db为依靠pipecu中器件输出的fwda、fwdb四选一选择出的ra、data或者ealu,malu,mmo。
其中ra、data来自于regfile，代表读出地址为inst[25:21],inst[20:16]中wrfdi中的数据。
dimm为依靠dshift选择immediate,sa二选一。其中sa为{27'b0,inst[10:6]}。

内部线zero，用于器件compare vs (da,db,zero)，判断da和db是否相等，如果相等则为1.反之为0。
zero输入到pipecu中控制pcsource输出。pcsource[0] = z&i_beq | (~z&i_bne)  | i_j | i_jal ;

cla32 br_adr (pcfour,offset,1'b0,bpc)将pcfour和offest相加后输出到bpc。
mux2x32 lin (immediate,sa,dshift,dimm)根据dshift来将immediate或者sa输出到dimm，如果为1输出sa。
mux2x5  reg_wm (inst[15:11],inst[20:16],dregrt,ddesr)根据dregrt判断输出。为1输出inst[20:16]。源操作寄存器inst[15:11]和目的操作寄存器inst[20:16]。
mux4x32 fwa (ra,ealu,malu,mmo,fwda,da)
mux4x32 fwb (data,ealu,malu,mmo,fwdb,db)
后两者不必说

主要看
regfile rf (inst[25:21],inst[20:16],wrfdi,wdesr,wwreg,clock,resetn,ra,data)(选择输出更新数据)
依靠inst[25:21]和inst[20:16]来判断是输出哪些数据，将wrfdi中的数据更新到内部寄存器register[wdser]中，
ra=register[inst[25:21]],
data=register[inst[20:16]],
在clock和resetn为下降沿时有效，wwreg=1时，regisetn[wdser]=wrfid。
其为寄存器组。

器件
pipecu cu (
inst[31:26],inst[5:0],inst[25:21],inst[20:16],zero,
mm2reg,mwreg,mrn,em2reg,ewreg,ern,dwmem,dwreg,dregrt,dm2reg,daluc,dshift,daluimm,pcsource,djal,dsext,wpcir)这个器件主要的前四个参数都有inst提供。这里只有22个参数，而原器件有24个参数。

纵观整个器件inst显然是指令可能包括数据在内，完成整个译码过程。
其中inst[25:21]和inst[20:16]为控制信号，将wrfdi[31:0]中部分数据输出道ra和data。
inst[31:26]为操作码,inst[5:0]为数据控制信号，输出一组控制信号，主要信号为daluc[31:0]。
其中pcfour为程序计数器。

仿真未理解。

报错处理：
在Quartus II中Assignments->Assignment Editor，在Category栏选择logic options，到列表中To列下添加要设置的引脚接口，将Assignment Name设置为Virtual Pin，将Value设置为On，Enabled 设置为Yes， 如果需要设置的很多，可以通过在Pin Planner中将引脚复制过来。
打开 Pin Planner (快捷键: CTRL + Shift + N)

#### id和exe阶段的寄存器 pipedereg de_reg
pipedereg de_reg (
dwreg,dm2reg,dwmem,daluc,daluimm,da,db,dimm,ddesr,dshift,djal,pcfour,clock,resetn,
ewreg,em2reg,ewmem,ealuc,ealuimm,ea,eb,eimm,edesr0,eshift,ejal,epcfour
)
我们首先从pipedereg de_reg来看，一开始的时候至少是第一个周期，按照三个线路clock、resten、memclock仅7有的控制信号输入，很明显，第一个周期的所有输出为0。
一组控制信号的传递。
ewreg<=dwreg;
em2reg<=dm2reg;
ewmem<=dwmem;
ealuimm<=daluimm;
eshift<=dshift;
ejal<=djal;
ealuc<=daluc;
edesr0<=ddesr;
ea<=da;
eb<=db;
eimm<=dimm;
epcfour<=pcfour;
其中ewreg、em2reg、ewmen没有输出到exe阶段的pipeexe器件，而是输出到id阶段的pipeidd的ewreg、em2reg。

#### exe执行阶段 pipeexe exe_stage
pipeexe exe_stage (ealuc,ealuimm,ea,eb,eimm,eshift,edesr0,epcfour,ejal,edesr,ealu)
输入为ealuc[3:0],ealuimm,ea[31:0],eb[31:0],eimm[31:0],eshift,edesr0[4:0],epcfour[31:0],ejal,
输出为edesr[4:0],ealu[31:0]。

在此器件中，将epcfour加4。
依靠ealuimm选择输出eb(0)或者eimm到alub，依靠eshift选择输出ea(0)或者eimm到alua。
之后依靠ejal选择输出alue或者加4后的epcfour输出到ealu。
依靠ealuc选择操作方式对alua和alub进行相关操作后输出到ealu。
此处没有寄存器。

最后输出的alue不一定是当前看来的结果，有可能是“上一个结果”。
em2reg,w2reg,mm2reg疑似解决冲突问题，使用定向方法。
如果是“当前”的结果，应该是eb和ea经过ealuc执行之后的结果。

eimm立即数，四种操作指令之一。
ealuimm和eshift为立即数开启条件。当为1时开启立即数，计算变成了立即数相计算。

ejal无条件跳转，如果为1，则将epcfour加4后的数据输出到ealu进行寻址计算。

edesr = edesr0 | {5{ejal}`}`，，此数据为。

#### exe和mem阶段中间的信号寄存器 pipeemreg em_reg
pipeemreg em_reg (ewreg,em2reg,ewmem,ealu,eb,edesr,clock,resetn,mwreg,mm2reg,mwmem,malu,mb,mdesr)
输入线路ewreg,em2reg,ewmem,
ealu[31:0],eb[31:0],edesr[4:0],
clock,resetn.
输出线路mwreg,mm2reg,mwmem,malu[31:0],mb[31:0],mdesr[4:0]

其中的ewreg,em2reg,ewmem来自于id和exe阶段的寄存器 pipedereg de_reg，clock和resetn来自于系统输入。
eb也是来自于id和exe阶段的寄存器，和exe阶段的eb是一样的。ealu为“结果”。

内部几乎也没有修改任何数据，在posedge resetn and posedge clock时直接将数据输出：
mwreg<=ewreg;
mm2reg<=em2reg;
mwmem<=ewmem;
mdesr<=edesr;
mb<=eb;
malu<=ealu;

#### mem访存阶段 pipemem mem_stage
pipemem mem_stage (mwmem,malu,mb,clock,memclock,mmo)
输入为malu[31:0],mb[31:0],mwmem,clock,memclock
输出为mmo[31:0]

其中涉及到一个文件，pcdatamem.mif。
以及器件lpm_ram_dq，其为输入输出分开的参数化RAM。
defparam的作用是改变底层器件、重定义参数。

其中很重要的一个器件是lpm_ram_dq ram (.data(mb),.address(malu[6:2]),.inclock(memclock),.outclock(memclock),.we(write_enable),.q(mmo))
这个器件中inclock控制写操作，outclock控制读操作，we是写使能。q线为输出address中的数据；还可以将data中的数据写入address。
当outclock为1时，将address中数据输出到q。
当we为1、oinclock为1时，将data中数据写入address。

这样一来就功能明了了，地址就是malu[6:2]中，mb是数据线。
memclock即为读取控制。mmo可以读取地址中的数据。
mwmem，在此器件中似乎没有任何作用。恰好的，write_enable，没有被赋值。
在此将write_enable改成mwmem，作为写入控制线。
memclock是访存，连接inclock，而其中的clock则改为连接outclock。
所以这样clock为读控制；memclock为写控制，在写使能mwmen为1时有效。

其中很奇怪的是，mif文件，256个单元。每个单元为ASCII码，8根线，0~255。
而地址线5根，2^5=32，那么读取的时候应该是指向8个单元。
而数据线32根，无法容纳8X8=64根线的数据量。这里是不合理的。
但是我们不能忽略两个数据：
器件中声明:
defparam ram.lpm_width = 32;
defparam ram.lpm_widthad = 5;
mif文件声明：
WIDTH=8;
DEPTH=256;
资料中显示
LPM_WIDTH = 4(模块信号宽度为4位)
LPM_WIDTH=输出数据宽度
LPM_WIDTHAD=寻址的地址宽度
那么猜想5个单元为1条记录，输出在32位线上。
32x5=160个单元可用。

文件仿真不太彻底，但是总归读不出来了，但是没有写出来。

#### mem和wb阶段寄存器 pipemwreg mw_reg
pipemwreg mw_reg (mwreg,mm2reg,mmo,malu,mdesr,clock,resetn,wwreg,wm2reg,wmo,walu,wdesr)
输入mwreg,mm2reg,mmo,malu,mdesr,clock,resetn
输出wwreg,wm2reg,wmo,walu,wdesr

当negedge resetn or posedge clock时有
wwreg<=mwreg;
wm2reg<=mm2reg;
wdesr<=mdesr;
wmo<=mmo;
walu<=malu;

输入mwmen来自exe和mem阶段中间的信号寄存器的mdesr，也就是exe阶段的edesr = edesr0 | {5{ejal}`}`，这根线能跟到id阶段，无解。

#### wb回写阶段 mux2x32 wb_stage
mux2x32 wb_stage (walu,wmo,wm2reg,wrfdi)
32位2线选择，依靠wm2reg选择将walu或者wmo输出到wrfdi

em2reg,w2reg,mm2reg疑似解决冲突问题，使用定向方法。

> ### 布局总概
五个阶段：
if取指令阶段
id译码阶段
exe执行有效地址计算阶段
mem访存阶段
wb回写阶段

顶层器件：
#### pipeif if_stage If阶段，pc+4，取指令
pcinstmem instmem 指令存储寄存器，其中有35条指令
cla32 pcplus4 加减法器
mux4x32 nextpc 32位4线选择输出，是由当前输出，还是由上一条流水写回的数据。解决竞争问题。
#### pipeir inst_reg if和id阶段中间的信号寄存器
#### pipeid id_stage id阶段
cla32 br_adr
compare vs
pipecu cu 控制单元
mux2x32 lin
mux2x5  reg_wm
mux4x32 fwa
mux4x32 fwb
regfile rf
#### pipedereg de_reg id和exe阶段中间的信号寄存器
#### pipeexe exe_stage Exe阶段，执行计算
cla32 pcplus8 加减法器
mux2x32 alu_b
mux2x32 alu_a
mux2x32 link 解决竞争
alu al_unit 根据cu输出的ALUC信号进行计算
#### pipeemreg em_reg exe和mem阶段中间的信号寄存器
#### pipemem mem_stage mem阶段
lpm_ram_dq ram
#### pipemwreg mw_reg mem和wb阶段寄存器
#### mux2x32 wb_stage wb阶段
#### dffe32 prog_cnt 带使能的D触发器，选择输出

> ### 整体框架中输入线路的作用

表格，指令代码

> ### 文件代码

#### alu.v

```verilog
module alu(a,b,aluc,result);
input[3:0] aluc;
input[31:0] a, b;
output  [31:0] result;
//output z;
reg [31:0] result;
wire[31:0] ADD,SUB,AND,OR,XOR,SLL,SRL,SRA,LUI;
assign ADD=a+b;
assign SUB=a-b;
assign AND=a&b;
assign OR=a|b;
assign XOR = a^b;
assign SLL = b<<a;
assign SRL = b>>a;
assign SRA = b>>>a;
assign LUI = b<<16;

always @(aluc)
begin
        casex (aluc)
                4'bx000: result<=ADD;
                4'bx100: result<=SUB;
                4'bx001: result<=AND;
                4'bx101: result<=OR;
                4'bx010: result<= XOR;
                4'b0011: result<=SLL;
                4'b0111: result<=SRL;
                4'b1111: result<=SRA;
                4'bx110: result<=LUI;
                default:result<=32'b0;
        endcase
end 

endmodule 
```

#### cla32.v

```verilog
module cla32 (a,b,sub,s);
        input [31:0] a,b;
        input sub;
        output [31:0] s;
        assign s = sub ? a - b : a + b;
endmodule 
```

#### compare.v

```verilog
module compare (a,b,zero);//
        input [31:0] a,b;
        output zero;
        wire zero;
        assign zero=(a==b);
endmodule 
```

#### cpu.v

```verilog
module cpu (clock,resetn,inst,mem,pc,wmem,alu,data);
        input  [31:0] inst,mem;
        input                   clock,resetn;
        output [31:0] pc,alu,data;
        output        wmem;
        wire   [31:0] p4,bpc,npc,adr,ra,alua,alub,res,alu_mem;
        wire   [3:0]  aluc;
        wire   [4:0]  reg_dest,wn;
        wire   [1:0]  pcsource;
        wire          zero,wmem,wreg,regrt,m2reg,shift,aluimm,jal,sext;
        wire   [31:0] sa = {27'b0,inst[10:6]};
        wire          e = sext&inst[15];
        wire   [15:0] imm = {16{e}`}`;
        wire   [31:0] immediate = {imm,inst[15:0]};
        dff32 ip (npc,clock,resetn,pc);
        cla32 pcplus4 (pc,32'h4,1'b0,p4);
        wire [31:0] offset = immediate<<2;
        cla32 br_adr (p4,offset,1'b0,adr);
        wire   [31:0] jpc = {p4[31:28],inst[25:0],1'b0,1'b0};
        sccu cu (inst[31:26],inst[5:0],zero,wmem,wreg,regrt,m2reg,
                        aluc,shift,aluimm,pcsource,jal,sext);
        mux2x32 alu_b (data,immediate,aluimm,alub);
        mux2x32 alu_a (ra,sa,shift,alua);
        mux2x32 result (alu,mem,m2reg,alu_mem);
        mux2x32 link (alu_mem,p4,jal,res);
        mux2x5  reg_wm (inst[15:11],inst[20:16],regrt,reg_dest);
        assign  wn = reg_dest | {5{jal}`}`;
        mux4x32 nextpc (p4,adr,ra,jpc,pcsource,npc);
        regfile rf (inst[25:21],inst[20:16],res,wn,wreg,clock,resetn,ra,data);
        alu al_unit (alua,alub,aluc,alu);
endmodule
```

#### dff32.v

```verilog
module dff32 (d,clk,clrn,q);
        input [31:0] d;
        input                 clk,clrn;
        output [31:0] q;
        wire [31:0] d;
        reg [31:0] q;
        always@(negedge clrn or posedge clk)
        begin
                if (clrn == 0) begin
                        q<=0;
                end else begin
                        q<=d;
                end
        end
endmodule
```

#### dffe32.v

```verilog
module dffe32 (d,clk,clrn,e,q);
        input [31:0] d;
        input clk,clrn,e;
        output [31:0] q;
        reg [31:0] q;
        always @ (negedge clrn or posedge clk)
                if (clrn == 0) begin
                q <= 0;
                end else begin
                if (e == 1) q <= d;
        end
endmodule
```

#### mux2x5.v

```verilog
module mux2x5 (a0,a1,s,y);
        input [4:0] a0,a1; // a0,a1: 32-bit
        input s; // s: 1-bit
        output [4:0] y; // y: 32-bit
        wire [4:0] a0,a1;
        assign y = s ? a1 : a0; // like C
endmodule 
```

#### mux2x32.v

```verilog
module mux2x32 (a0,a1,s,y);
        input [31:0] a0,a1; // a0,a1: 32-bit
        input s; // s: 1-bit
        output [31:0] y; // y: 32-bit
        wire [31:0] a0,a1;
        assign y = s ? a1 : a0; // like C
endmodule 
```

#### mux4x32.v

```verilog
module mux4x32(a0,a1,a2,a3,s,y);
        input [31:0] a0,a1,a2,a3; // a0,a1: 32-bit
        input [1:0] s; // s: 1-bit
        output [31:0] y; // y: 32-bit
        wire [31:0] a0,a1,a2,a3;
        reg [31:0] y;
        always @(s)
        begin
                case(s)
                2'b00: y = a0;
                2'b01: y = a1;
                2'b10: y = a2;
                2'b11: y = a3;
                endcase
        end
endmodule 
```

#### pcinstmem.v

```verilog
module pcinstmem(a,inst);
        input [5:0] a;
        output [31:0] inst;
        reg [31:0] inst;
wire [31:0] ram[34:0];
//assign inst=ram[a];
assign ram[0]=32'h3c010000;  //addi r2 r1 + 2;
assign ram[1]=32'h34240050;  //addi r3 r1 + 2;
assign ram[2]=32'h0c00001b;  //add r4 r2 + r3;
assign ram[3]=32'h20050004;  //sub r13 r4-r2;
assign ram[4]=32'hac820000;  //lui  r9 1<<16;
assign ram[5]=32'h8c890000;  //andi r2& h0056
assign ram[6]=32'h01244022;  //beq r5 r7 -4;
assign ram[7]=32'h20050003;  //sw r2 r4 1;
assign ram[8]=32'h20a5ffff;  //lw r2 r8 1;
assign ram[9]=32'h34a8ffff;  // ori r11 r2|5500;
assign ram[10]=32'h39085555; // addi r12 r8+1;
assign ram[11]=32'h2009ffff; //jal 2
assign ram[12]=32'h312affff; //jr s4 
assign ram[13]=32'h01493025; //j 1
assign ram[14]=32'h01494026;
assign ram[15]=32'h01463824;   //beq r5 r7 -4;
assign ram[16]=32'h10a00003;
assign ram[17]=32'h00000000;
assign ram[18]=32'h08000008;
assign ram[19]=32'h00000000;
assign ram[20]=32'h2005ffff;
assign ram[21]=32'h000543c0;
assign ram[22]=32'h00084400;
assign ram[23]=32'h00084403;
assign ram[24]=32'h000843c2;
assign ram[25]=32'h08000019;
assign ram[26]=32'h00000000;
assign ram[27]=32'h00004020;
assign ram[28]=32'h8c890000;
assign ram[29]=32'h01094020;
assign ram[30]=32'h20a5ffff;
assign ram[31]=32'h14a0fffc;
assign ram[32]=32'h20840004;
assign ram[33]=32'h03e00008;
assign ram[34]=32'h00081000;
always@(a)                
        begin
        case(a)
        
                6'b000000: inst <= ram[0];
                6'b000001: inst <= ram[1];
                6'b000010: inst <= ram[2];
                6'b000011: inst <= ram[3];
                6'b000100: inst <= ram[4];
                6'b000101: inst <= ram[5];
                6'b000110: inst <= ram[6];
                6'b000111: inst <= ram[7];
                6'b001000: inst <= ram[8];
                6'b001001: inst <= ram[9];
                6'b001010: inst <= ram[10];
                6'b001011: inst <= ram[11];
                6'b001100: inst <= ram[12];
                6'b001101: inst <= ram[13];
                6'b001110: inst <= ram[14];
                6'b001111: inst <= ram[15];
                6'b010000: inst <= ram[16];
                6'b010001: inst <= ram[17];
                6'b010010: inst <= ram[18];
                6'b010011: inst <= ram[19];
                6'b010100: inst <= ram[20];
                6'b010101: inst <= ram[21];
                6'b010110: inst <= ram[22];
                6'b010111: inst <= ram[23];
                6'b011000: inst <= ram[24];
                6'b011001: inst <= ram[25];
                6'b011010: inst <= ram[26];
                6'b011011: inst <= ram[27];
                6'b011100: inst <= ram[28];
                6'b011101: inst <= ram[29];
                6'b011110: inst <= ram[30];
                6'b011111: inst <= ram[31];
                6'b100000: inst <= ram[32];
                6'b100001: inst <= ram[33];
                6'b100010: inst <= ram[34];
                default: inst <= 32'b0;
        endcase
        end
endmodule 
```

#### pipecpu.v

```verilog
module pipecpu (clock,memclock,resetn,pc,inst,ealu,malu,walu);
        input clock,memclock,resetn;
        output [31:0] pc,inst,ealu,malu,walu;
        wire [31:0] bpc,jpc,npc,pc4,ins,pcfour,inst,dimm,ea,eb,eimm;
        wire [31:0] epcfour,mb,mmo,wmo,wrfdi,malu,walu,da,db,alua,alub;
        wire [4:0] ddesr,edesr0,edesr,mdesr,wdesr;
        wire [3:0] daluc,ealuc;
        wire [1:0] pcsource;
        wire wpcir,wregrt;
        wire dwreg,dm2reg,dwmem,daluimm,dshift,djal;
        wire ewreg,em2reg,ewmem,ealuimm,eshift,ejal;
        wire mwreg,mm2reg,mwmem;
        wire wwreg,wm2reg;
        dffe32 prog_cnt (npc,clock,resetn,wpcir,pc);
        pipeif if_stage (pcsource,pc,bpc,da,jpc,npc,pc4,ins);
        pipeir inst_reg (pc4,ins,wpcir,clock,resetn,pcfour,inst);
        pipeid id_stage (mm2reg,mwreg,mdesr,em2reg,ewreg,edesr0,pcfour,inst,wdesr,wrfdi,wwreg,ealu,malu,mmo,clock,resetn,
                                        bpc,jpc,pcsource,wpcir,dwreg,dm2reg,dwmem,daluc,
                                        daluimm,da,db,dimm,ddesr,dshift,djal);
        pipedereg de_reg (dwreg,dm2reg,dwmem,daluc,daluimm,da,db,dimm,ddesr,
                                        dshift,djal,pcfour,clock,resetn,ewreg,em2reg,ewmem,
                                        ealuc,ealuimm,ea,eb,eimm,edesr0,eshift,ejal,epcfour);
        pipeexe exe_stage (ealuc,ealuimm,ea,eb,eimm,eshift,edesr0,epcfour,ejal,
                                        edesr,ealu);
        pipeemreg em_reg (ewreg,em2reg,ewmem,ealu,eb,edesr,clock,resetn,
                                        mwreg,mm2reg,mwmem,malu,mb,mdesr);
        pipemem mem_stage (mwmem,malu,mb,clock,memclock,mmo);
        pipemwreg mw_reg (mwreg,mm2reg,mmo,malu,mdesr,clock,resetn,
                                        wwreg,wm2reg,wmo,walu,wdesr);
        mux2x32 wb_stage (walu,wmo,wm2reg,wrfdi);
endmodule 
```

#### pipecu.v

```verilog
module pipecu (op, func,rs,rt,z,mm2reg,mwreg,mrn,em2reg,ewreg,ern, wmem, wreg, regrt, m2reg, aluc, shift,
                                aluimm, pcsource, call, sext,wpcir,fwda,fwdb);
        input [5:0] op,func;
        input [4:0] rs,rt,mrn,ern;
        input z,mm2reg,mwreg,em2reg,ewreg;
        output wreg,regrt,call,m2reg,shift,aluimm,sext,wmem,wpcir;
        output [3:0] aluc;
        output [1:0] pcsource,fwda,fwdb;
        reg [1:0] fwda,fwdb;
        wire i_rs,i_rt;
        wire r_type = ~|op;
        wire i_add = r_type & func[5] & ~func[4] & ~func[3] &
                                ~func[2] & ~func[1] & ~func[0];
        wire i_sub = r_type & func[5] & ~func[4] & ~func[3] &
                                ~func[2] & func[1] & ~func[0];
        wire i_and = r_type & func[5] & ~func[4] & ~func[3] &
                                func[2] & ~func[1] & ~func[0];
        wire i_or = r_type & func[5] & ~func[4] & ~func[3] &
                                func[2] & ~func[1] & func[0];
        wire i_xor = r_type & func[5] & ~func[4] & ~func[3] &
                                func[2] & func[1] & ~func[0];
        wire i_sll = r_type & ~func[5] & ~func[4] & ~func[3] &
                                ~func[2] & ~func[1] & ~func[0];
        wire i_srl = r_type & ~func[5] & ~func[4] & ~func[3] &
                                ~func[2] & func[1] & ~func[0];
        wire i_sra = r_type & ~func[5] & ~func[4] & ~func[3] &
                                ~func[2] & func[1] & func[0];
        wire i_jr = r_type & ~func[5] & ~func[4] & func[3] &
                                ~func[2] & ~func[1] & ~func[0];
        wire i_addi = ~op[5] & ~op[4] & op[3] & ~op[2] & ~op[1] & ~op[0];
        wire i_andi = ~op[5] & ~op[4] & op[3] & op[2] & ~op[1] & ~op[0];
        wire i_ori = ~op[5] & ~op[4] & op[3] & op[2] & ~op[1] & op[0];
        wire i_xori = ~op[5] & ~op[4] & op[3] & op[2] & op[1] & ~op[0];
        wire i_lw = op[5] & ~op[4] & ~op[3] & ~op[2] & op[1] & op[0];
        wire i_sw = op[5] & ~op[4] & op[3] & ~op[2] & op[1] & op[0];
        wire i_beq = ~op[5] & ~op[4] & ~op[3] & op[2] & ~op[1] & ~op[0];
        wire i_bne = ~op[5] & ~op[4] & ~op[3] & op[2] & ~op[1] & op[0];
        wire i_lui = ~op[5] & ~op[4] & op[3] & op[2] & op[1] & op[0];
        wire i_j = ~op[5] & ~op[4] & ~op[3] & ~op[2] & op[1] & ~op[0];
        wire i_jal = ~op[5] & ~op[4] & ~op[3] & ~op[2] & op[1] & op[0];
        always@*begin
        fwda = 2'b00; // default forward a: no hazards
        if (ewreg & (ern != 0) & (ern == rs) & ~em2reg) begin
                fwda = 2'b01; // select exe_alu
        end else begin
                if (mwreg & (mrn != 0) & (mrn == rs) & ~mm2reg) begin
                        fwda = 2'b10; // select mem_alu
                        end else begin
                if (mwreg & (mrn != 0) & (mrn == rs) & mm2reg) begin
                        fwda = 2'b11; // select mem_lw
                        end
                end
        end
        fwdb = 2'b00; // default forward b: no hazards
        if (ewreg & (ern != 0) & (ern == rt) & ~em2reg) begin
                fwdb = 2'b01; // select exe_alu
        end else begin
                if (mwreg & (mrn != 0) & (mrn == rt) & ~mm2reg) begin
                        fwdb = 2'b10; // select mem_alu
                end else begin
                if (mwreg & (mrn != 0) & (mrn == rt) & mm2reg) begin
                        fwdb = 2'b11; // select mem_lw
                        end
                end
        end
        end
        assign wpcir = ~(ewreg & em2reg & (ern != 0) &
                                        (i_rs & (ern == rs) | i_rt & (ern == rt)));
        assign i_rs = i_add | i_sub | i_and | i_or | i_xor |
                                        i_jr | i_addi | i_andi | i_ori | i_xori |
                                        i_lw | i_sw | i_beq | i_bne;
        assign i_rt = i_add | i_sub | i_and | i_or | i_xor |
                                        i_sll | i_srl | i_sra | i_sw | i_beq |
                                        i_bne;
        assign wreg = (i_add | i_sub | i_and | i_or | i_xor |
                                        i_sll | i_srl | i_sra | i_addi | i_andi |
                                        i_ori | i_xori | i_lw | i_lui | i_jal) &
                                        wpcir; // prevent from executing twice
        assign wmem = i_sw & wpcir; // prevent from executing twice
        assign sext = i_addi | i_andi | i_ori | 
                                        i_xori | i_lui | i_lw | i_sw |i_beq | i_bne;
        assign aluc[0] = i_and | i_or |i_sll |i_srl |i_sra |i_andi |i_ori;
        assign aluc[1] = i_xor | i_sll |i_srl |i_sra |i_xori |i_lui;
        assign aluc[2] = i_sub | i_or | i_srl |i_sra | i_ori 
                                        |i_beq | i_bne |i_lui;
        assign aluc[3] = i_sra ;
        assign pcsource[0] = z&i_beq | (~z&i_bne)  | i_j | i_jal ;
        assign pcsource[1] = i_jr | i_j | i_jal;
        assign regrt = i_lui | i_addi | i_andi | i_ori | i_xori  | i_lw | i_sw;
        assign aluimm = i_lui | i_addi | i_andi | i_ori | i_xori  | i_lw | i_sw;
        assign shift = i_sll | i_srl | i_sra;
        assign m2reg = i_lw;
        assign call = i_jal;
endmodule 
```

#### pipedereg.v

```verilog
module pipedereg (dwreg,dm2reg,dwmem,daluc,daluimm,da,db,dimm,ddesr,
                                dshift,djal,pcfour,clock,resetn,ewreg,em2reg,ewmem,
                                ealuc,ealuimm,ea,eb,eimm,edesr0,eshift,ejal,epcfour);
        input dwreg,dm2reg,dwmem,daluimm,dshift,djal;
        input [31:0] da,db, dimm,pcfour;
        input [3:0] daluc;
        input [4:0] ddesr;
        input clock,resetn;
        output ewreg,em2reg,ewmem,ealuimm,eshift,ejal;
        output [31:0] ea,eb, eimm,epcfour;
        output [3:0] ealuc;
        output [4:0] edesr0;
        reg ewreg,em2reg,ewmem,ealuimm,eshift,ejal;
        reg [31:0] ea,eb, eimm,epcfour;
        reg [3:0] ealuc;
        reg [4:0] edesr0;
        always@(negedge resetn or posedge clock)
        begin
                if(resetn == 0) begin
                        ewreg<=0;
                        em2reg<=0;
                        ewmem<=0;
                        ealuimm<=0;
                        eshift<=0;
                        ejal<=0;
                        ealuc<=0;
                        edesr0<=0;
                        ea<=0;
                        eb<=0;
                        eimm<=0;
                        epcfour<=0;
                end else begin
                        ewreg<=dwreg;
                        em2reg<=dm2reg;
                        ewmem<=dwmem;
                        ealuimm<=daluimm;
                        eshift<=dshift;
                        ejal<=djal;
                        ealuc<=daluc;
                        edesr0<=ddesr;
                        ea<=da;
                        eb<=db;
                        eimm<=dimm;
                        epcfour<=pcfour;
                end
        end
endmodule
```

#### pipeemreg.v

```verilog
module pipeemreg (ewreg,em2reg,ewmem,ealu,eb,edesr,clock,resetn,
                                        mwreg,mm2reg,mwmem,malu,mb,mdesr);
        input ewreg,em2reg,ewmem;
        input [31:0] ealu,eb;
        input [4:0] edesr;
        input clock,resetn;
        output mwreg,mm2reg,mwmem;
        output [31:0] malu,mb;
        output [4:0] mdesr;
        reg mwreg,mm2reg,mwmem;
        reg [31:0] malu,mb;
        reg [4:0] mdesr;
        always@(negedge resetn or posedge clock)
        begin
                if(resetn == 0) begin
                        mwreg<=0;
                        mm2reg<=0;
                        mwmem<=0;
                        mdesr<=0;
                        mb<=0;
                        malu<=0;
                end else begin
                        mwreg<=ewreg;
                        mm2reg<=em2reg;
                        mwmem<=ewmem;
                        mdesr<=edesr;
                        mb<=eb;
                        malu<=ealu;
                end
        end
endmodule
```

#### pipeexe.v

```verilog
module pipeexe (ealuc,ealuimm,ea,eb,eimm,eshift,edesr0,epcfour,ejal,
                                edesr,ealu);
        input [3:0] ealuc;
        input ealuimm,eshift,ejal;
        input [4:0] edesr0;
        input [31:0] ea,eb,eimm,epcfour;
        output [4:0] edesr;
        output [31:0] ealu;
        wire [31:0] alua,alub,p4,alue;
        wire [4:0] edesr0;
        cla32 pcplus8 (epcfour,32'h4,1'b0,p4);
        mux2x32 alu_b (eb,eimm,ealuimm,alub);
        mux2x32 alu_a (ea,eimm,eshift,alua);
        mux2x32 link (alue,p4,ejal,ealu);
        assign  edesr = edesr0 | {5{ejal}`}`;
        alu al_unit (alua,alub,ealuc,alue);
endmodule 
```

#### pipeid.v

```verilog
module pipeid(mm2reg,mwreg,mrn,em2reg,ewreg,ern,pcfour,inst,wdesr,wrfdi,wwreg,ealu,malu,mmo,clock,resetn,
                        bpc,jpc,pcsource,wpcir,dwreg,dm2reg,dwmem,daluc,
                        daluimm,da,db,dimm,ddesr,dshift,djal);
        input [31:0] pcfour,inst,wrfdi,ealu,malu,mmo;
        input wwreg,mm2reg,mwreg,em2reg,ewreg;
        input [4:0] wdesr,mrn,ern;
        input                   clock,resetn;
        output [31:0] bpc,jpc,da,db,dimm;
        output [1:0] pcsource;
        output [4:0] ddesr;
        output [3:0] daluc;
        output        wpcir,dwreg,dm2reg,dwmem,daluimm,dshift,djal;
        wire [4:0] ddest;
        wire [31:0] bpc,pcfour,da,db,ra,data,ealu,malu,mmo,inst;
        wire   [1:0]  pcsource,fwda,fwdb;
        wire          zero,dwmem,dwreg,dregrt,dm2reg,dshift,daluimm,djal,dsext,wpcir;
        wire   [31:0] sa = {27'b0,inst[10:6]};
        wire          e = dsext&inst[15];
        wire [3:0] daluc;
        wire   [15:0] imm = {16{e}`}`;
        wire   [31:0] immediate = {imm,inst[15:0]};
        wire [31:0] offset = immediate<<2;
        cla32 br_adr (pcfour,offset,1'b0,bpc);
        wire   [31:0] jpc = {pcfour[31:28],inst[25:0],1'b0,1'b0};
        compare vs (da,db,zero);
        pipecu cu (inst[31:26],inst[5:0],inst[25:21],inst[20:16],zero,mm2reg,mwreg,mrn,em2reg,ewreg,ern,
                        dwmem,dwreg,dregrt,dm2reg,daluc,dshift,daluimm,pcsource,djal,dsext,wpcir);
        mux2x32 lin (immediate,sa,dshift,dimm);
        mux2x5  reg_wm (inst[15:11],inst[20:16],dregrt,ddesr);
        mux4x32 fwa (ra,ealu,malu,mmo,fwda,da);
        mux4x32 fwb (data,ealu,malu,mmo,fwdb,db);
        regfile rf (inst[25:21],inst[20:16],wrfdi,wdesr,wwreg,clock,resetn,ra,data);
endmodule
        
```

#### pipeif.v

```verilog
module pipeif (pcsource,pc,bpc,da,jpc,npc,pc4,ins);
        input [1:0] pcsource;
        input [31:0] pc,bpc,da,jpc;
        output [31:0] npc,pc4,ins;
        pcinstmem instmem (pc[7:2],ins);
        cla32 pcplus4 (pc,32'h4,1'b0,pc4);
        mux4x32 nextpc (pc4,bpc,da,jpc,pcsource,npc);
endmodule 
```

#### pipeir.v

```verilog
module pipeir (pc4,ins,wpcir,clock,resetn,pcfour,inst);
        input [31:0] pc4,ins;
        input wpcir;
        input clock,resetn;
        output [31:0] pcfour,inst;
        reg [31:0] pcfour,inst;
        always@(negedge resetn or posedge clock)
        begin
                if(resetn == 0) begin
                        pcfour<=0;
                        inst<=0;
                end else if(wpcir==1)begin
                        pcfour<=pc4;
                        inst<=ins;
                end
        end
endmodule 
```

#### pipemem.v

```verilog
module pipemem (mwmem,malu,mb,clock,memclock,mmo);
        input [31:0] malu;
        input [31:0] mb;
        input mwmem,clock,memclock;
        output [31:0] mmo;
        wire write_enable;
        wire [31:0] mmo;
lpm_ram_dq ram (.data(mb),.address(malu[6:2]),
                                        .inclock(memclock),.outclock(memclock),.we(write_enable),.q(mmo));
        defparam ram.lpm_width = 32;
        defparam ram.lpm_widthad = 5;
        defparam ram.lpm_indata = "registered";
        defparam ram.lpm_outdata = "registered";
        defparam ram.lpm_file = "pcdatamem.mif";
        defparam ram.lpm_address_control = "registered";
endmodule 
```

#### pipemwreg.v

```verilog
module pipemwreg (mwreg,mm2reg,mmo,malu,mdesr,clock,resetn,
                                        wwreg,wm2reg,wmo,walu,wdesr);
        input mwreg,mm2reg;
        input [4:0] mdesr;
        input [31:0] mmo,malu;
        input clock,resetn;
        output wwreg,wm2reg;
        output [4:0] wdesr;
        output [31:0] wmo,walu;
        reg wwreg,wm2reg;
        reg [4:0] wdesr;
        reg [31:0] wmo,walu;
        always@(negedge resetn or posedge clock)
        begin
                if(resetn == 0) begin
                        wwreg<=0;
                        wm2reg<=0;
                        wdesr<=0;
                        wmo<=0;
                        walu<=0;
                end else begin
                        wwreg<=mwreg;
                        wm2reg<=mm2reg;
                        wdesr<=mdesr;
                        wmo<=mmo;
                        walu<=malu;
                end
        end
endmodule 
```

#### pipepc.v

```verilog

```

#### regfile.v

```verilog
module regfile (rna,rnb,d,wn,we,clk,clrn,qa,qb);
        input [4:0] rna,rnb,wn;
        input [31:0] d;
        input we,clk,clrn;
        output [31:0] qa,qb;
        wire clock = ~clk;
        reg [31:0] register [1:31]; // r1 - r31
        assign qa = (rna == 0)? 0 : register[rna]; // read
        assign qb = (rnb == 0)? 0 : register[rnb]; // read
        always @(posedge clock or negedge clrn) begin
                if (clrn == 0) begin // reset
                        integer i;
                        for (i=1; i<32; i=i+1)
                                register[i] <= 0;
                end else begin
                if ((wn != 0) && (we == 1)) // write
                        register[wn] <= d;
                end
        end
endmodule
```
