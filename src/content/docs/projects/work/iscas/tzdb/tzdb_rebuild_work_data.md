---
title: "tzdb rebuild work data"
description: "tzdb rebuild work data"
---

# tzdb 重构日志

## [8.13]协议优化

优化目标:

合理的性能比例
对于一个优化良好的 TCP 协议实现，与纯 memcpy 相比的性能比例应该在：

无压缩模式：约 2-5 倍慢于 memcpy

主要开销来自协议头处理和内存管理
小数据包可能接近 2 倍，大数据包可能接近 5 倍
有压缩模式：约 5-20 倍慢于 memcpy

压缩算法的复杂度决定了性能差距
对于 LZ4 等快速压缩算法，可能是 5-10 倍
对于 ZLIB 等压缩率更高的算法，可能是 10-20 倍

优化前:

```bash
===== 端到端通信性能测试 =====

数据大小: 4 KB
TCP 端到端平均时间: 19.2 us
UDP 端到端平均时间: 36 us
端到端性能比率 (UDP/TCP): 1.875

数据大小: 64 KB
TCP 端到端平均时间: 232.6 us
UDP 端到端平均时间: 307 us
端到端性能比率 (UDP/TCP): 1.31986

数据大小: 512 KB
TCP 端到端平均时间: 1664.4 us
UDP 端到端平均时间: 2203.2 us
端到端性能比率 (UDP/TCP): 1.32372
```

```bash
===== 端到端通信性能测试 =====

数据大小: 4 KB
TCP 端到端平均时间: 20.26 us
UDP 端到端平均时间: 43.2 us
端到端性能比率 (UDP/TCP): 2.13228

数据大小: 64 KB
TCP 端到端平均时间: 287.5 us
UDP 端到端平均时间: 467.66 us
端到端性能比率 (UDP/TCP): 1.62664

数据大小: 512 KB
TCP 端到端平均时间: 1640.38 us
UDP 端到端平均时间: 1788.9 us
端到端性能比率 (UDP/TCP): 1.09054
```

这个是一个协议设计,其致力于使用C++11进行编写高性能高效的协议,通过pack 来进行打包,并且readsize对外提供数据读取功能,最后通过和getpayload来分析内容.你现在只需要关注tcp协议,试着分析其是否合理,对于哪些地方有优化空间。

tcp 协议优化后:

```bash
===== 端到端通信性能测试 =====

数据大小: 4 KB
TCP 端到端平均时间: 22.18 us
UDP 端到端平均时间: 39.76 us
端到端性能比率 (UDP/TCP): 1.79261

数据大小: 64 KB
TCP 端到端平均时间: 204.74 us
UDP 端到端平均时间: 285.16 us
端到端性能比率 (UDP/TCP): 1.39279

数据大小: 512 KB
TCP 端到端平均时间: 1421.96 us
UDP 端到端平均时间: 1716.86 us
端到端性能比率 (UDP/TCP): 1.20739
```

```bash
===== 详细性能测试结果 =====

数据大小: 1 KB
TCP 平均打包时间: 5.58 us (标准差: 3.68288 us)
UDP 平均打包时间: 2.22 us (标准差: 2.88645 us)
TCP 生成缓冲区数量: 2
UDP 生成缓冲区数量: 1
性能比率 (UDP/TCP): 0.397849

数据大小: 16 KB
TCP 平均打包时间: 22.82 us (标准差: 22.4532 us)
UDP 平均打包时间: 18.78 us (标准差: 4.52234 us)
TCP 生成缓冲区数量: 2
UDP 生成缓冲区数量: 1
性能比率 (UDP/TCP): 0.822962

数据大小: 64 KB
TCP 平均打包时间: 66.06 us (标准差: 25.2804 us)
UDP 平均打包时间: 66 us (标准差: 23.033 us)
TCP 生成缓冲区数量: 2
UDP 生成缓冲区数量: 2
性能比率 (UDP/TCP): 0.999092

数据大小: 256 KB
TCP 平均打包时间: 233.44 us (标准差: 49.1415 us)
UDP 平均打包时间: 225.08 us (标准差: 50.6106 us)
TCP 生成缓冲区数量: 2
UDP 生成缓冲区数量: 5
性能比率 (UDP/TCP): 0.964188
```

```bash
===== Memcpy性能基准测试 =====

数据大小: 4 KB
Memcpy 平均时间: 0.02 us
TCP 端到端平均时间: 18.48 us (vs Memcpy: 924x)
UDP 端到端平均时间: 32.84 us (vs Memcpy: 1642x)
吞吐量比较:
  Memcpy: 204800 MB/s
  TCP: 221.645 MB/s
  UDP: 124.726 MB/s

数据大小: 64 KB
Memcpy 平均时间: 1.3 us
TCP 端到端平均时间: 217.32 us (vs Memcpy: 167.169x)
UDP 端到端平均时间: 300.28 us (vs Memcpy: 230.985x)
吞吐量比较:
  Memcpy: 50412.3 MB/s
  TCP: 301.565 MB/s
  UDP: 218.25 MB/s

数据大小: 512 KB
Memcpy 平均时间: 22.48 us
TCP 端到端平均时间: 1446.54 us (vs Memcpy: 64.3479x)
UDP 端到端平均时间: 1862.96 us (vs Memcpy: 82.8719x)
吞吐量比较:
  Memcpy: 23322.4 MB/s
  TCP: 362.443 MB/s
  UDP: 281.427 MB/s
Process finished with exit code 0
```

零拷贝:

```bash
===== Memcpy性能基准测试 =====

数据大小: 4 KB
Memcpy 平均时间: 0 us
TCP 端到端平均时间: 20 us (vs Memcpy: infx)
UDP 端到端平均时间: 39.66 us (vs Memcpy: infx)
吞吐量比较:
  Memcpy: inf MB/s
  TCP: 204.8 MB/s
  UDP: 103.278 MB/s

数据大小: 64 KB
Memcpy 平均时间: 1.3 us
TCP 端到端平均时间: 244.54 us (vs Memcpy: 188.108x)
UDP 端到端平均时间: 325.76 us (vs Memcpy: 250.585x)
吞吐量比较:
  Memcpy: 50412.3 MB/s
  TCP: 267.997 MB/s
  UDP: 201.179 MB/s

数据大小: 512 KB
Memcpy 平均时间: 21.62 us
TCP 端到端平均时间: 1455.02 us (vs Memcpy: 67.2997x)
UDP 端到端平均时间: 1780.14 us (vs Memcpy: 82.3377x)
吞吐量比较:
  Memcpy: 24250.1 MB/s
  TCP: 360.33 MB/s
  UDP: 294.521 MB/s
Process finished with exit code 0

```

对 TCP 协议的部分进行优化：
1. ProtocolBuffer 类内持有的内容变为 vector<char>;
2. 类内成员 char *compress_buffer_; 改变为 vector<char>;

```bash
===== Memcpy性能基准测试 =====

数据大小: 4 KB
Memcpy 平均时间: 0 us
TCP 端到端平均时间: 10.02 us (vs Memcpy: infx)
UDP 端到端平均时间: 52.4 us (vs Memcpy: infx)
吞吐量比较:
  Memcpy: inf MB/s
  TCP: 408.782 MB/s
  UDP: 78.1679 MB/s

数据大小: 64 KB
Memcpy 平均时间: 1.06 us
TCP 端到端平均时间: 151.14 us (vs Memcpy: 142.585x)
UDP 端到端平均时间: 181.58 us (vs Memcpy: 171.302x)
吞吐量比较:
  Memcpy: 61826.4 MB/s
  TCP: 433.611 MB/s
  UDP: 360.921 MB/s

数据大小: 512 KB
Memcpy 平均时间: 23.72 us
TCP 端到端平均时间: 1956.76 us (vs Memcpy: 82.4941x)
UDP 端到端平均时间: 1918.26 us (vs Memcpy: 80.871x)
吞吐量比较:
  Memcpy: 22103.2 MB/s
  TCP: 267.937 MB/s
  UDP: 273.314 MB/s
```

优化了 4KB 的数据效能，但增加了大数据 64KB 消耗，可能原因为内存反复分配；

## [8.14]

序列化固然是好的，但是其也确实应该作为先有部分内存，然后进行读入数据。
关于分段序列化，暂时没有找到内存空间 append 类似函数，无法增加内存，也就无法通过现有序列化工具进行分段读取序列化。

系统表，权限表


MemoryStream


## [8.18] 测试 TcpConnect 接口， 发现消耗巨大 -- Nagle 和 延迟算法

rpc 优化之前：

RPC call statistics for data size 10 bytes (iterations=20):
  Average: 78165.6 microseconds (78.1656 ms)
  Min: 3411 microseconds (3.411 ms)
  Max: 83062 microseconds (83.062 ms)
  Total: 1563313 microseconds (1563.31 ms)
RPC call statistics for data size 1000 bytes (iterations=20):
  Average: 82499.5 microseconds (82.4995 ms)
  Min: 81454 microseconds (81.454 ms)
  Max: 84175 microseconds (84.175 ms)
  Total: 1649990 microseconds (1649.99 ms)
RPC call statistics for data size 10000 bytes (iterations=20):
  Average: 83355.1 microseconds (83.3551 ms)
  Min: 81489 microseconds (81.489 ms)
  Max: 85000 microseconds (85 ms)
  Total: 1667103 microseconds (1667.1 ms)

首先测试协议层：
```bash
===== TCP协议 打包性能测试 =====
数据大小平均时间(us)  最小值(us)  最大值(us)  标准差(us)吞吐量(MB/s)      包数量
----------------------------------------------------------------------------------------------------
       64B          13.76           7.00          36.00           6.81           4.44              2
      256B          10.46           4.00          36.00           5.48          23.34              2
       1KB          11.58           5.00          53.00           7.21          84.33              2
       4KB          21.45          10.00          68.00          12.14         182.11              2
      16KB          53.34          36.00         293.00          28.66         292.93              2
      64KB         143.59         114.00         312.00          37.49         435.27              2
     256KB         494.35         423.00         903.00         107.65         505.71              2
       1MB        2018.46        1651.00        4133.00         503.12         495.43              2

===== UDP协议 打包性能测试 =====
数据大小平均时间(us)  最小值(us)  最大值(us)  标准差(us)吞吐量(MB/s)      包数量
----------------------------------------------------------------------------------------------------
       64B          26.93          25.00          46.00           2.31           2.27              1
      256B          91.67          62.00        2430.00         235.24           2.66              1
       1KB          67.67          63.00         129.00           7.55          14.43              1
       4KB          81.55          64.00        1385.00         131.42          47.90              1
      16KB          95.23          70.00        1467.00         138.46         164.08              1
      64KB         181.62         149.00        1601.00         145.41         344.13              2
     256KB         463.38         401.00        1740.00         188.33         539.51              5
       1MB         962.72         792.00        1644.00         227.62        1038.72             17

===== TCP协议 端到端性能测试 =====
数据大小平均时间(us)  最小值(us)  最大值(us)  标准差(us)吞吐量(MB/s)      包数量
----------------------------------------------------------------------------------------------------
       64B          10.69           8.00         130.00          12.54           5.71              2
      256B          11.72           9.00          46.00           6.11          20.83              2
       1KB          12.50          10.00          53.00           5.72          78.12              2
       4KB          23.75          15.00          66.00           9.74         164.47              2
      16KB          70.03          39.00         807.00          77.05         223.12              2
      64KB         176.72         152.00         810.00          87.22         353.67              2
     256KB         934.13         889.00        1079.00          30.69         267.63              2
       1MB        4169.68        3624.00        6859.00         640.58         239.83              2

===== UDP协议 端到端性能测试 =====
数据大小平均时间(us)  最小值(us)  最大值(us)  标准差(us)吞吐量(MB/s)      包数量
----------------------------------------------------------------------------------------------------
       64B         130.17          83.00        1823.00         218.35           0.47              1
      256B         106.16          82.00        1772.00         167.97           2.30              1
       1KB         122.06          83.00        1509.00         192.89           8.00              1
       4KB         109.52          88.00        1413.00         131.88          35.67              1
      16KB         178.88         112.00        1565.00         198.28          87.35              1
      64KB         283.66         193.00         944.00         140.43         220.33              2
     256KB         912.67         851.00        1592.00          98.44         273.92              5
       1MB        3808.53        3376.00        4820.00         428.90         262.57             17
```
如果能改成标准序列化确实会更快：
```bash
数据大小     Memcpy(us)  序列化(us) 反序列化(us) 完整周期(us) 序列化开销 反序列化开销
----------------------------------------------------------------------------------------------------
       64B           0.00           0.10           3.02           3.45            infx            infx
      256B           0.00           0.21           4.49           4.64            infx            infx
       1KB           0.00           1.88           3.83           6.56            infx            infx
       4KB           0.00          17.79           5.37          10.43            infx            infx
      16KB           0.75          10.54          13.47          24.44          14.05x          17.96x
      64KB           1.35          31.37          33.99          59.89          23.24x          25.18x
     256KB           8.03         105.34         101.85         209.61          13.12x          12.68x
       1MB          35.70         371.96         364.01         795.51          10.42x          10.20x
```
详细测试：
```
=== TCP Connect Performance Test ===
      Size   Avg RTT (ms)   Min RTT (ms)   Max RTT (ms)   P99 RTT (ms)   Throughput (MB/s)
------------------------------------------------------------------------------------------
2025-08-18 15:30:06 [tcp_connect.cpp:255:netWrite] INFO  - [PERF_WRITE] Total: 0.070 ms, Reset: 0.000 ms (0.0%), Pack: 0.011 ms (15.7%), Send: 0.056 ms (80.0%)
2025-08-18 15:30:06 [tcp_connect.cpp:413:netRead] INFO  - [PERF_READ] Total: 100.196 ms, Loop: 100.188 ms (100.0%), ReadSize: 0.003 ms (0.0%), Recv: 100.176 ms (100.0%), Process: 0.006 ms (0.0%), Addr: 0.000 ms (0.0%), Loops: 3
2025-08-18 15:30:06 [tcp_connect.cpp:255:netWrite] INFO  - [PERF_WRITE] Total: 0.035 ms, Reset: 0.000 ms (0.0%), Pack: 0.012 ms (34.3%), Send: 0.021 ms (60.0%)
2025-08-18 15:30:06 [tcp_connect.cpp:413:netRead] INFO  - [PERF_READ] Total: 0.119 ms, Loop: 0.112 ms (94.1%), ReadSize: 0.004 ms (3.4%), Recv: 0.105 ms (88.2%), Process: 0.004 ms (3.4%), Addr: 0.000 ms (0.0%), Loops: 3
2025-08-18 15:30:06 [tcp_connect.cpp:255:netWrite] INFO  - [PERF_WRITE] Total: 0.019 ms, Reset: 0.000 ms (0.0%), Pack: 0.006 ms (31.6%), Send: 0.012 ms (63.2%)
2025-08-18 15:30:06 [tcp_connect.cpp:413:netRead] INFO  - [PERF_READ] Total: 41.805 ms, Loop: 41.793 ms (100.0%), ReadSize: 0.006 ms (0.0%), Recv: 41.781 ms (99.9%), Process: 0.007 ms (0.0%), Addr: 0.000 ms (0.0%), Loops: 3
2025-08-18 15:30:06 [tcp_connect.cpp:255:netWrite] INFO  - [PERF_WRITE] Total: 0.038 ms, Reset: 0.000 ms (0.0%), Pack: 0.015 ms (39.5%), Send: 0.018 ms (47.4%)
2025-08-18 15:30:06 [tcp_connect.cpp:413:netRead] INFO  - [PERF_READ] Total: 82.652 ms, Loop: 82.643 ms (100.0%), ReadSize: 0.008 ms (0.0%), Recv: 82.627 ms (100.0%), Process: 0.007 ms (0.0%), Addr: 0.000 ms (0.0%), Loops: 3
       16B         41.485          0.232         82.739         82.739               0.001
```
禁用 Nagle 算法：
```
=== TCP Connect Performance Test ===
      Size   Avg RTT (ms)   Min RTT (ms)   Max RTT (ms)   P99 RTT (ms)   Throughput (MB/s)
------------------------------------------------------------------------------------------
2025-08-18 15:30:33 [tcp_connect.cpp:255:netWrite] INFO  - [PERF_WRITE] Total: 0.100 ms, Reset: 0.000 ms (0.0%), Pack: 0.015 ms (15.0%), Send: 0.081 ms (81.0%)
2025-08-18 15:30:33 [tcp_connect.cpp:413:netRead] INFO  - [PERF_READ] Total: 100.154 ms, Loop: 100.141 ms (100.0%), ReadSize: 0.004 ms (0.0%), Recv: 100.127 ms (100.0%), Process: 0.008 ms (0.0%), Addr: 0.000 ms (0.0%), Loops: 3
2025-08-18 15:30:33 [tcp_connect.cpp:255:netWrite] INFO  - [PERF_WRITE] Total: 0.040 ms, Reset: 0.000 ms (0.0%), Pack: 0.014 ms (35.0%), Send: 0.025 ms (62.5%)
2025-08-18 15:30:33 [tcp_connect.cpp:413:netRead] INFO  - [PERF_READ] Total: 0.060 ms, Loop: 0.052 ms (86.7%), ReadSize: 0.004 ms (6.7%), Recv: 0.044 ms (73.3%), Process: 0.004 ms (6.7%), Addr: 0.000 ms (0.0%), Loops: 3
2025-08-18 15:30:33 [tcp_connect.cpp:255:netWrite] INFO  - [PERF_WRITE] Total: 0.040 ms, Reset: 0.000 ms (0.0%), Pack: 0.008 ms (20.0%), Send: 0.029 ms (72.5%)
2025-08-18 15:30:33 [tcp_connect.cpp:413:netRead] INFO  - [PERF_READ] Total: 0.103 ms, Loop: 0.096 ms (93.2%), ReadSize: 0.004 ms (3.9%), Recv: 0.088 ms (85.4%), Process: 0.002 ms (1.9%), Addr: 0.000 ms (0.0%), Loops: 3
2025-08-18 15:30:33 [tcp_connect.cpp:255:netWrite] INFO  - [PERF_WRITE] Total: 0.022 ms, Reset: 0.000 ms (0.0%), Pack: 0.007 ms (31.8%), Send: 0.012 ms (54.5%)
2025-08-18 15:30:33 [tcp_connect.cpp:413:netRead] INFO  - [PERF_READ] Total: 0.069 ms, Loop: 0.065 ms (94.2%), ReadSize: 0.005 ms (7.2%), Recv: 0.056 ms (81.2%), Process: 0.002 ms (2.9%), Addr: 0.000 ms (0.0%), Loops: 3
       16B          0.189          0.159          0.219          0.219               0.161
```
大量测试(禁用 Nagle + 禁用延迟确认):
```
=== TCP Connect Performance Test ===
      Size   Avg RTT (ms)   Min RTT (ms)   Max RTT (ms)   P99 RTT (ms)   Throughput (MB/s)
------------------------------------------------------------------------------------------
       16B          0.087          0.036          0.556          0.468               0.351
       64B          0.043          0.035          0.133          0.097               2.846
      256B          0.057          0.038          0.158          0.131               8.514
       1KB          0.073          0.054          0.134          0.130              26.765
       4KB          0.078          0.061          0.146          0.134              99.671
      16KB          0.146          0.132          0.221          0.221             214.359
```
禁用 Nagle + 默认打开延迟确认：
```
=== TCP Connect Performance Test ===
      Size   Avg RTT (ms)   Min RTT (ms)   Max RTT (ms)   P99 RTT (ms)   Throughput (MB/s)
------------------------------------------------------------------------------------------
       16B          0.042          0.032          0.192          0.083               0.723
       64B          0.036          0.032          0.089          0.062               3.391
      256B          0.040          0.032          0.108          0.087              12.359
       1KB          0.050          0.032          0.116          0.108              38.829
       4KB          0.079          0.053          0.196          0.159              98.759
      16KB          0.173          0.130          0.335          0.335             180.649
```
默认打开 Nagle + 延迟确认：
```
=== TCP Connect Performance Test ===
      Size   Avg RTT (ms)   Min RTT (ms)   Max RTT (ms)   P99 RTT (ms)   Throughput (MB/s)
------------------------------------------------------------------------------------------
       16B         82.049          0.178         84.162         84.048               0.000
       64B         82.276         81.535         84.041         83.897               0.001
      256B         82.328         81.688         84.156         84.007               0.006
       1KB         82.257         81.687         84.225         84.084               0.024
       4KB         82.212         81.658         83.958         83.703               0.095
      16KB         82.105         81.672         83.404         83.404               0.381
```
默认打开 Nagle + 禁用延迟确认：
```
=== TCP Connect Performance Test ===
      Size   Avg RTT (ms)   Min RTT (ms)   Max RTT (ms)   P99 RTT (ms)   Throughput (MB/s)
------------------------------------------------------------------------------------------
       16B         40.035          0.042         42.249         42.081               0.001
       64B         40.992          0.224         42.262         42.111               0.003
      256B         41.130         40.540         42.188         42.102               0.012
       1KB         41.202         40.596         42.231         42.109               0.047
       4KB         41.263         40.693         43.815         42.899               0.189
      16KB         41.888         41.013         43.068         43.068               0.746
```
按理来说，该测试模式也不会导致其有 40 ms 延迟；如果延迟确认被关闭，那么TCP层中只会有一个未确认小包，所以，导致其的问题是因为分包，而且是先发小包，再发大包，完全符合当前的TCP测试用例。
查询资料，发现，其关键在于场景——交替发送小数据包和等待响应，其容易造成 nagle 算法的影响。

Nagle算法 和 delayed ack算法 同时启动可能会导致的问题
这在某些应用场景下会导致一个典型的“发-发-收”的场景问题，即： 接收方要在收到二个TCP小报文，并在应用层将二个报文合并后再完成应用层处理后，然后再把应用层响应结果发送回发送方的场景 。
如下所示：
1) 发送方发送第一个小报文给接收方
2) 接收方应用层收到第一个报文，并等待第二个小报文的到来
3) 接收方delayed ack，不发回TCP应答
4) 发送放Nagle算法，没有等到第一个小报文的TCP应答，则不发送第二个小报文
5) 接收方和发送方相互等待死锁，直到接收方的delayer ack的200ms定时器超时，发送回TCP应答ACK
6) 发送方发送第二个小报文给接收方
7) 接收方应用层收到第一和第二两个小报文，处理后发回应用层响应(捎带回TCP应答ACK)
则相比于不开启 nagle 或者不开启 delayed ack(二者只要有一个不开启，或者二个都不开启)，则我们可以看到第5步这里，我们白白的多等待了200ms。

## [8.19] rpc 多线程并发问题

发现其 net pool rpc 接口在多线程中的并发问题；

目前经过调查，最优解为不使用 socket send 进行多线程发送，其会带来数据交错、触发 TCP 拥塞控制等其他隐患。
并发性质的提高，应该通过 TCP 多个连接建立生产者-消费者模型来解决。

暂时通过加上锁后解决该问题。

其可能存在的问题：
1. id 生成的号并非是强时间关联随机，在多节点网络中仍然可能重复；
2. 锁加上的地方是在保护 connect, 而非保护 send 本身;

但是其仍然暴露了许多可改进的问题：
1. 提高并发的效率应该是采用线程池, 提高 net pool 到另一个 net pool 的连接数目来控制并发效率;

## [8.20] 租户和权限表的开发

这块功能很模糊, 使用简单的租户模式?
其本质为, 为使用者提供查询某个用户, 是否有对某个表的访问权限的功能; 所以还没有到租户一层, 租户本质是为了区分系统资源的抽象逻辑层;
因此应该在 meta data 层添加权限相关功能, 然后在 meta server 中添加允许接收获取权限的请求;

首先找到系统权限表的使用示例.

PgIndexSchema

PgPermissionSchema

发现其是一个 DataBase catalog 中有一个系统表.
这种设计理念在于, 其实权限表是期望其只能有一个的.

理想架构为:
租户管理为 MeatClient;每个租户为 MetaServer, 每个租户中存储有权限相关的内容, 其可以是 k-v ,表示的是 <用户 - 数据库 >权限.
权限表因该是管理所有数据库的表。
meta server 其能够增加其数据一致性。

MarkDelete 和 UpdateTuple 似乎没有，是否可以用此处内容进行替代？或者实现？
其有一些接口是没有的，或者说update可以替代？但是delete没有，是否可以写一个delete？

开发完成权限表，在 metaData 中支持权限表的相关 api ;

你写的测试用例中为了模拟一个catalog与存储引擎进行交互，十分的麻烦，因为其内部还做了很多工作，才建立了系统表，所以，我希望你能够通过这个winners 的测试用例，了解到其DB的基本open过程，然后建立DB，进而GetCatalog一个catalog放入到metdata之中，这样就可以测试其权限表与metadata的正确性.

现阶段问题还是很多：
1. catalog 的生成和序列化问题，其并没有序列化权限表内容；
2. meta data 中 data info 其存在 get 访问函数，并非线程安全；

## [9.2] 权限表开发，meta server 与 data server

权限和 data server 联系:
最好是，master 开启的时候能够有一个权限的注册。直接一步到位。
实际上，权限表压根没有必要称为系统表。

## [9.3] blob pages

本质是溢出页的开发。

KV 数据库 RocksDB 
向量检索库 hnswlib

WriteOverflowStringsToDisk
OverflowStringWriter

UncompressedStringSegmentState
UncompressedStringStorage
    StringAppendBase - StringAppend

```
static idx_t StringAppendBase(BufferHandle &handle, ColumnSegment &segment, SegmentStatistics &stats,
	                              UnifiedVectorFormat &data, idx_t offset, idx_t count);
```

ColumnSegment::Append
ColumnData::AppendData
RowGroup::Append
RowGroupCollection::Append
PhysicalInsert::Sink

UnifiedVectorFormat

ColumnData ：某一列在一个行范围（RowGroup）内的“列存管理器”（拥有 SegmentTree、负责扫描/追加/更新/统计）。
ColumnSegment ：物理上一段连续行范围的压缩存储单元（含数据块指针与统计信息）。
ColumnAppendState ：一次“持续追加会话”的临时状态对象，握住当前可写 segment 及其游标与增量统计，帮助 ColumnData 高效多次 Append。

ValidityColumnData
StandardColumnData
ListColumnData

Table (逻辑表)
 └── DataTable / RowGroup 集合
       └── RowGroup (覆盖一批连续行，如 ~100K 或更多)
             └── ColumnData (该 RowGroup 内某一列)
                   ├── SegmentTree (按起始行号组织)
                   │     └── ColumnSegment(0)
                   │     └── ColumnSegment(1)
                   │     └── ...
                   ├── 版本链(UpdateInfo)  (可选：处理 UPDATE/DELETE)
                   └── 子 ColumnData (如果是 LIST/STRUCT 等嵌套类型)


### UncompressedStringStorage

UncompressedStringStorage 是DuckDB中用于处理未压缩字符串数据存储的核心类。它提供了一系列静态方法，用于在列段（column segments）中存储、读取和管理未压缩的字符串数据。

核心功能
UncompressedStringStorage主要处理以下几个方面：

字符串数据的存储和检索：提供方法将字符串数据写入存储块，并在需要时从存储块中读取字符串
溢出字符串的处理：处理无法放入主数据块的大型字符串（溢出字符串）
字典管理：维护字符串字典，优化存储空间使用
段初始化和扫描：提供初始化段和扫描段的方法

### ColumnData

这些都是 ColumnData 的具体派生实现（面向不同逻辑类型或辅助“伪列”），负责一个 RowGroup 中某一列（或子列/辅助位图）的数据管理。

| 类名 | 面向的数据逻辑类型 | 作用核心 |
|------|--------------------|----------|
| StandardColumnData | 标准标量（INT、BIGINT、DOUBLE、DATE、TIMESTAMP、BOOLEAN、UUID 等固定/可直接段压缩的类型） | 普通数值/标量列的段管理 |
| StringColumnData（或相关字符串实现） | VARCHAR | 处理变长字符串（字典/FSST/内联等策略） |
| ListColumnData | LIST<T> | 管理 ListEntry 数组 + 子元素列 |
| StructColumnData | STRUCT{...} | 聚合多个子 ColumnData（字段）并统一 validity |
| MapColumnData | MAP<K,V>（内部 LIST<STRUCT<key,val>>）的语法层包装 | 转成底层 LIST/STRUCT 组合 |
| UnionColumnData（若存在版本中） | UNION | 管理 tag 列 + 子 variant 数据 |
| ValidityColumnData | “有效性位图”伪列（null mask） | 把 null 信息单独抽象为一个列状数据（位图段） |

注：不同 DuckDB 版本中命名或是否单独成类会有细微变动，但概念保持一致：根据逻辑类型提供特化数据/附属结构管理。

```
Table
 └── DataTable
      └── RowGroup (row range e.g. 0..N)
           ├── ColumnData (col0: INT) -> StandardColumnData
           ├── ColumnData (col1: VARCHAR) -> StringColumnData
           ├── ColumnData (col2: LIST<INT>)
           │       ↳ ListColumnData
           │            - entries segments (ListEntry[])
           │            - child ColumnData -> StandardColumnData (INT)
           └── ColumnData (col3: STRUCT { a INT, b LIST<VARCHAR> })
                   ↳ StructColumnData
                        - child[0] StandardColumnData (a)
                        - child[1] ListColumnData (b)
                              - entries segments
                              - child (VARCHAR) -> StringColumnData
                        - (optional) ValidityColumnData (STRUCT null mask)
```

### tzdb 存储引擎

class Page{} : GetData to return actual data for write.
BasicPageGuard imposes constraints on page.

其参考的 busTub ， 而 busTub 是没有溢出页的:

```markdown
3. 为什么官方教学实现避免 overflow page
教学简化：减少学生在并发 / 恢复 / GC 上的心智负担。
通过“可扩展哈希（extendible hashing）”本身已经能避免传统 static hash 需要 overflow 链的问题。
B+ Tree 分裂 + 合并（redistribute/merge）即可维持平衡，无需外溢链。
Heap Page 实验聚焦 slotted page 结构本身，不讨论大对象（LOB/BLOB）外部存储。
4. 什么时候“溢出页”是合理需求
你可能需要自己加 overflow page 的典型动机：

哈希桶分裂代价太高或想减少目录膨胀：用溢出页链补足极少数热点桶。
想支持比 4KB（默认页大小）更大的长文本 / 二进制字段（类似 PostgreSQL TOAST）。
B+ Tree 叶子上某个 key 拥有巨量重复值（需要 posting list 溢出）。
想做分段式存储：主页存稀疏索引，溢出页存稠密值。
```

| 页类型                        | 作用               | 关键内容                                                          |
| :---------------------------- | :----------------- | :---------------------------------------------------------------- |
| ExtendibleHTableHeaderPage    | 顶层元数据（入口） | 目录页数量、各目录页 page_id、（可选）魔数等                      |
| ExtendibleHTableDirectoryPage | 具体的目录切片     | 若干个 bucket 指针数组项；包含 global depth（或一部分）及辅助信息 |
| ExtendibleHTableBucketPage    | 实际键值存放       | (key, value) 对；当前计数；局部深度 local depth                   |

在 BusTub 的 buffer pool 里，所有这些都是“Page”，页是统一的最小 I/O / 缓存单位。但每种 Page 有不同的解释布局：

| Page 类型示例                 | 属于哪种索引    | 内容                            |
| :---------------------------- | :-------------- | :------------------------------ |
| ExtendibleHTableHeaderPage    | Extendible Hash | 目录页 id 列表                  |
| ExtendibleHTableDirectoryPage | Extendible Hash | bucket 指针数组 + 深度信息      |
| ExtendibleHTableBucketPage    | Extendible Hash | (key,value or key,RID) 存储     |
| BPlusTreeInternalPage         | B+ Tree         | 分割键 + 子页号                 |
| BPlusTreeLeafPage             | B+ Tree         | (key,RID) 有序数组 + 叶子链指针 |

因此：
“哈希桶”对应 ExtendibleHTableBucketPage（数据终端）
BPlusTreeInternalPage 是另一棵树结构里的中间导航页
它们功能、逻辑语义不同，不在一个结构中“并列”

如果你要“再加一种索引”，怎么做？
假设你要实现一个简单的 Bitmap Index（针对低基数字段）：
定义页面类型：
BitmapHeaderPage：列出所有位图分段页 id
BitmapSegmentPage：位数组（存某值的出现位置 bitset）
在 Catalog 中注册：index_type = BITMAP
写 Index 类接口（Insert / ScanEqual / ScanAnySet）
Buffer Pool 一视同仁，只是解析方式不同
WAL / 恢复（如果你已完成日志实验）为 Insert 设置日志格式

同理，如果是 LSM-Tree（更大工程）：
内存：MemTable（跳表，不用磁盘页）
刷盘：SSTable Pages（自定义格式：Index Block, Data Block, Meta Block）
你就会再引入一套新的“页族”

### 具体实现

具体开发内容：
1. 开发溢出页工具，参考 xxx ；
2. 嵌入逻辑策略，总共有两个最基本的策略组：
   1. 位于 Rid DiskEngine::WriteForTable 中；
   2. xxx；


## [9.8] 6XX 分布式测试

## [10.14]

sql 支持建议：
1. timestamp；
2. DROP TABLE IF EXISTS test_odbc；







# 性能测试

## 序列化基准测试

string 对象的序列化：

```bash
===== 单个对象序列化性能测试 =====

数据大小: 4.000 KB (迭代次数: 50)
原始数据大小: 4076 字节
序列化后的数据大小: 4077 字节
序列化压缩比: 1.00
Memcpy 平均时间: 0.10 us (40792.63 MB/s)
序列化 平均时间: 3.18 us (1280.53 MB/s)
反序列化 平均时间: 7.63 us (534.53 MB/s)
完整周期 平均时间: 9.28 us (219.68 MB/s)
序列化开销 (vs Memcpy): 31.86x
反序列化开销 (vs Memcpy): 76.33x
完整周期开销 (vs Memcpy): 92.87x
Memcpy 每字节时间: 0.025 ns/byte
序列化 每字节时间: 0.781 ns/byte
反序列化 每字节时间: 1.871 ns/byte

数据大小: 64.000 KB (迭代次数: 50)
原始数据大小: 65516 字节
序列化后的数据大小: 65518 字节
序列化压缩比: 1.00
Memcpy 平均时间: 1.88 us (34769.04 MB/s)
序列化 平均时间: 35.08 us (1867.55 MB/s)
反序列化 平均时间: 69.01 us (949.37 MB/s)
完整周期 平均时间: 98.36 us (333.06 MB/s)
序列化开销 (vs Memcpy): 18.62x
反序列化开销 (vs Memcpy): 36.62x
完整周期开销 (vs Memcpy): 52.20x
Memcpy 每字节时间: 0.029 ns/byte
序列化 每字节时间: 0.535 ns/byte
反序列化 每字节时间: 1.053 ns/byte

数据大小: 512.000 KB (迭代次数: 50)
原始数据大小: 524268 字节
序列化后的数据大小: 524270 字节
序列化压缩比: 1.00
Memcpy 平均时间: 33.84 us (15491.64 MB/s)
序列化 平均时间: 219.22 us (2391.55 MB/s)
反序列化 平均时间: 421.49 us (1243.86 MB/s)
完整周期 平均时间: 887.98 us (295.20 MB/s)
序列化开销 (vs Memcpy): 6.48x
反序列化开销 (vs Memcpy): 12.45x
完整周期开销 (vs Memcpy): 26.24x
Memcpy 每字节时间: 0.065 ns/byte
序列化 每字节时间: 0.418 ns/byte
反序列化 每字节时间: 0.804 ns/byte
```

vector 序列化：

```bash
===== 序列化与协议性能对比测试 =====

数据大小: 4.000 KB
原始数据大小: 4096 字节
序列化后的数据大小: 4102 字节
序列化压缩比: 1.00
Memcpy 平均时间: 0.09 us (43380.64 MB/s)
序列化 平均时间: 154.21 us (26.56 MB/s)
反序列化 平均时间: 178.13 us (22.99 MB/s)
完整周期 平均时间: 311.18 us (6.58 MB/s)
序列化开销 (vs Memcpy): 1633.26x
反序列化开销 (vs Memcpy): 1886.60x
完整周期开销 (vs Memcpy): 3295.74x

数据大小: 64.00 KB
原始数据大小: 65536 字节
序列化后的数据大小: 65543 字节
序列化压缩比: 1.00
Memcpy 平均时间: 2.74 us (23934.15 MB/s)
序列化 平均时间: 2621.54 us (25.00 MB/s)
反序列化 平均时间: 2475.22 us (26.48 MB/s)
完整周期 平均时间: 4464.55 us (7.34 MB/s)
序列化开销 (vs Memcpy): 957.40x
反序列化开销 (vs Memcpy): 903.97x
完整周期开销 (vs Memcpy): 1630.48x

数据大小: 512.00 KB
原始数据大小: 524288 字节
序列化后的数据大小: 524295 字节
序列化压缩比: 1.00
Memcpy 平均时间: 21.49 us (24391.82 MB/s)
序列化 平均时间: 15846.59 us (33.09 MB/s)
反序列化 平均时间: 19594.91 us (26.76 MB/s)
完整周期 平均时间: 39011.29 us (6.72 MB/s)
序列化开销 (vs Memcpy): 737.24x
反序列化开销 (vs Memcpy): 911.63x
完整周期开销 (vs Memcpy): 1814.95x
```

优化后的 vector 表现：

```bash
===== 序列化与协议性能对比测试 =====

数据大小: 4.000 KB
原始数据大小: 4096 字节
序列化后的数据大小: 4104 字节
序列化压缩比: 1.00
Memcpy 平均时间: 0.09 us (46715.33 MB/s)
序列化 平均时间: 1.08 us (3802.45 MB/s)
反序列化 平均时间: 1.99 us (2058.25 MB/s)
完整周期 平均时间: 4.07 us (502.60 MB/s)
序列化开销 (vs Memcpy): 12.29x
反序列化开销 (vs Memcpy): 22.70x
完整周期开销 (vs Memcpy): 46.47x

数据大小: 64.00 KB
原始数据大小: 65536 字节
序列化后的数据大小: 65546 字节
序列化压缩比: 1.00
Memcpy 平均时间: 1.81 us (36178.55 MB/s)
序列化 平均时间: 36.14 us (1813.44 MB/s)
反序列化 平均时间: 43.34 us (1512.05 MB/s)
完整周期 平均时间: 49.79 us (658.11 MB/s)
序列化开销 (vs Memcpy): 19.95x
反序列化开销 (vs Memcpy): 23.93x
完整周期开销 (vs Memcpy): 27.49x

数据大小: 512.00 KB
原始数据大小: 524288 字节
序列化后的数据大小: 524298 字节
序列化压缩比: 1.00
Memcpy 平均时间: 21.50 us (24379.93 MB/s)
序列化 平均时间: 206.50 us (2538.96 MB/s)
反序列化 平均时间: 221.35 us (2368.55 MB/s)
完整周期 平均时间: 398.64 us (657.60 MB/s)
序列化开销 (vs Memcpy): 9.60x
反序列化开销 (vs Memcpy): 10.29x
完整周期开销 (vs Memcpy): 18.54x
```

## 对比 string 和 vector

```bash
🏗️ Testing Construction Performance (SSO Optimization)...

📊 Short String Construction Performance Results:
   std::string:      24.66 ns/op
   std::vector<char>: 423.96 ns/op
   Performance ratio: 17.19x (string is 1619.4% faster) ✅
   SSO Status: Active ✅
   String capacity: 15 bytes

🔗 Testing Concatenation Performance...

📊 String Concatenation Performance Results:
   std::string:      3748.64 ns/op
   std::vector<char>: 18156.98 ns/op
   Performance ratio: 4.84x (string is 384.4% faster) ✅

🔍 Testing Search Performance...

📊 Substring Search Performance Results:
   std::string:      18.91 ns/op
   std::vector<char>: 369.56 ns/op
   Performance ratio: 19.54x (string is 1854.4% faster) ✅

✂️ Testing Substring Extraction Performance...

📊 Substring Extraction Performance Results:
   std::string:      24.84 ns/op
   std::vector<char>: 407.31 ns/op
   Performance ratio: 16.40x (string is 1539.7% faster) ✅

💾 Analyzing Memory Usage...
   Short String (5 chars):
     std::string size: 32 bytes
     std::string capacity: 15 chars
     std::vector<char> size: 24 bytes
     std::vector<char> capacity: 5 chars
   Long String (63 chars):
     std::string capacity: 63 chars
     std::vector<char> capacity: 63 chars
   SSO Optimization: Active ✅

🎯 Running Comprehensive Performance Test...

📊 Comprehensive Operations Performance Results:
   std::string:      429.68 ns/op
   std::vector<char>: 3286.21 ns/op
   Performance ratio: 7.65x (string is 664.8% faster) ✅
Process finished with exit code 0
```

