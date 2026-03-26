---
title: "TianmaiOS适配"
description: "project-tzdb-rebuild 文档整理稿（源：raw_snapshot/docs/config/tianmai_os_adaptation.md）"
---

# 天脉操作系统 (Tianmai OS) 适配指南

## 概述

本文档说明 TZDB 数据库在天脉操作系统上的适配情况和注意事项。天脉操作系统是一个实时操作系统，不完全支持标准 C++ 库的某些特性，因此需要进行特殊适配。

## 编译配置

### 启用天脉操作系统适配

通过宏 `TM_ENABLE` 控制是否启用天脉操作系统适配：

```cpp
// inc/common/lang/std_compact_config.h
#if !defined(TM_ENABLE) || TM_ENABLE != 0
#define TM_OS 1  // Enable Tianmai OS adaptation
#else
#define TM_OS 0  // Disable Tianmai OS adaptation
#endif
```

**使用方式：**
- 编译时定义 `TM_ENABLE=1` 或不定义（默认启用）
- 编译时定义 `TM_ENABLE=0` 禁用天脉适配

---

## 标准库适配情况

### 1. 容器类适配

#### 1.1 `std::unordered_map` 适配

**问题：** 天脉操作系统不支持 `std::unordered_map`

**解决方案：** 使用 `robin_hood::unordered_map` 作为替代实现

**适配文件：** `inc/common/lang/unordered_map.h`

**使用方式：**
```cpp
#include "common/lang/unordered_map.h"

// Use std_compat::unordered_map instead of std::unordered_map
std_compat::unordered_map<int, std::string> my_map;
```

**实现细节：**
```cpp
#if TM_OS
  // Use robin_hood hash map for Tianmai OS
  #include "third_party/robin_hood/robin_hood.h"
  namespace std_compat {
    template <class K, class V, ...>
    class unordered_map : public robin_hood::unordered_map<K, V, ...> {
      // Wrapper implementation
    };
  }
#else
  // Use standard library for other platforms
  #include <unordered_map>
  namespace std_compat {
    template <class K, class V, ...>
    class unordered_map : public std::unordered_map<K, V, ...> {
      // Wrapper implementation
    };
  }
#endif
```

**注意事项：**
- 所有代码应使用 `std_compat::unordered_map` 而非 `std::unordered_map`
- `robin_hood::unordered_map` 是一个高性能的轻量级哈希表实现
- API 与 `std::unordered_map` 基本兼容

#### 1.2 `std::unordered_set` 适配

**问题：** 天脉操作系统不支持 `std::unordered_set`

**当前状态：** 
- 部分代码仍直接使用 `std::unordered_set`（如 `storage/disk/utils/mempool.h`）
- 建议创建类似 `unordered_map` 的适配层

**建议方案：**
```cpp
// 创建 inc/common/lang/unordered_set.h
#if TM_OS
  #include "third_party/robin_hood/robin_hood.h"
  namespace std_compat {
    template <class K, ...>
    class unordered_set : public robin_hood::unordered_set<K, ...> {
      // Wrapper implementation
    };
  }
#else
  #include <unordered_set>
  namespace std_compat {
    template <class K, ...>
    class unordered_set : public std::unordered_set<K, ...> {
      // Wrapper implementation
    };
  }
#endif
```

---

### 2. 线程相关适配

#### 2.1 `std::thread` 适配

**问题：** 天脉操作系统不支持 `std::thread`，使用 POSIX 线程 API

**解决方案：** 使用 `std_compat::thread` 封装天脉操作系统的任务 API

**适配文件：** `inc/common/lang/thread.hpp`

**使用方式：**
```cpp
#include "common/lang/thread.hpp"

// Create thread with name
std_compat::thread t("worker_thread", []() {
    // Thread function
});

// Join thread
t.join();

// Get thread ID (unified type across platforms)
std_compat::thread_id tid = std_compat::this_thread::get_id();

// Thread ID type is consistent
std_compat::thread::id tid2 = t.get_id();  // Same as thread_id
```

**实现细节：**
```cpp
namespace std_compat {

// Unified thread ID type across platforms
#if TM_OS
  using thread_id = Task_ID;
#else
  using thread_id = std::thread::id;
#endif

namespace this_thread {
  // Returns unified thread_id type
  inline thread_id get_id() noexcept {
#if TM_OS
    return (thread_id)ACoreOs_task_get_current_id();
#else
    return std::this_thread::get_id();
#endif
  }
}

#if TM_OS
  // Use ACoreOs task API
  class thread {
  public:
    using id = thread_id;  // Unified type
    using native_handle_type = Task_ID;
    
    template <typename Fn, typename... Args>
    explicit thread(std::string name, Fn &&fn, Args &&... args) {
      // Use ACoreOs_task_create and ACoreOs_task_start
      ACoreOs_Task_Param attr;
      attr.stack_size = 1024*1024;  // 1MB stack
      attr.initial_priority = 11;    // Default priority
      // ...
    }
    
    void join() { /* Implementation */ }
    void detach() { /* Implementation */ }
  };
#else
  // Use std::thread for other platforms
  class thread {
  public:
    using id = thread_id;  // Unified type
    using native_handle_type = std::thread::native_handle_type;
    
    std::thread t_;
    // Wrapper implementation
  };
#endif

}  // namespace std_compat
```

**配置参数：**
- 默认栈大小：1MB (`dbThreadStackSize = 1024*1024`)
- 默认优先级：11 (`DEFAULT_TASK_PRIORITY`)
- 任务属性：`ACOREOS_PREEMPT | ACOREOS_TIMESLICE`

**注意事项：**
- ✅ **线程 ID 类型已统一**：使用 `std_compat::thread_id` 在两个平台保持一致
- 线程创建时必须提供名称（用于调试）
- 天脉操作系统的 `join()` 和 `detach()` 当前为空实现（需要根据实际需求完善）
- 底层类型：天脉为 `Task_ID`，标准为 `std::thread::id`，但通过类型别名统一

#### 2.2 `std::mutex` 适配

**问题：** 天脉操作系统的互斥锁实现与标准库不同

**解决方案：** 使用 `TZMutex` 封装平台相关的互斥锁实现

**适配文件：** `inc/os/sync/tz_mutex.h`

**使用方式：**
```cpp
#include "os/sync/tz_mutex.h"

tzdb::TZMutex mutex;

// Manual lock/unlock
mutex.lock();
// Critical section
mutex.unlock();

// Use with lock guards
{
  tzdb::lock_guard<tzdb::TZMutex> guard(mutex);
  // Critical section
}

// Use with unique_lock
{
  tzdb::unique_lock<tzdb::TZMutex> lock(mutex);
  // Critical section
  lock.unlock();  // Can unlock manually
}
```

**实现细节：**
- `TZMutex` 内部使用 Pimpl 模式隐藏平台相关实现
- 提供 `lock()` 和 `unlock()` 方法兼容标准库接口
- 自定义实现 `lock_guard` 和 `unique_lock` 模板类

**注意事项：**
- 不要直接使用 `std::mutex`、`std::lock_guard`、`std::unique_lock`
- 使用 `tzdb::TZMutex`、`tzdb::lock_guard`、`tzdb::unique_lock`

#### 2.3 `std::shared_lock` 适配

**问题：** 读写锁的共享锁定支持

**解决方案：** 提供 `tzdb::shared_lock` 模板类

**适配文件：** `inc/os/sync/tz_mutex.h`

**使用方式：**
```cpp
#include "os/sync/tz_mutex.h"

// Assuming you have a mutex type that supports lock_shared()
tzdb::shared_lock<MutexType> lock(rw_mutex);
// Shared read access
```

**实现细节：**
```cpp
template <class MutexType>
class shared_lock {
public:
  explicit shared_lock(MutexType &mutex) : mutex_(mutex), locked_(true) {
    mutex_.lock_shared();
  }
  
  ~shared_lock() {
    if (locked_) mutex_.unlock_shared();
  }
  
  void unlock() {
    if (locked_) {
      mutex_.unlock_shared();
      locked_ = false;
    }
  }
};
```

#### 2.4 `std::condition_variable` 适配

**问题：** 天脉操作系统不支持标准条件变量

**解决方案：** 使用信号量实现条件变量

**适配文件：** `inc/os/sync/tz_condition_variable.h`

**使用方式：**
```cpp
#include "os/sync/tz_condition_variable.h"

tzdb::TZMutex mutex;
tzdb::condition_variable cv;

// Wait
{
  tzdb::unique_lock<tzdb::TZMutex> lock(mutex);
  cv.wait(lock);
}

// Wait with predicate
{
  tzdb::unique_lock<tzdb::TZMutex> lock(mutex);
  cv.wait(lock, []{ return condition_met; });
}

// Wait with timeout
{
  tzdb::unique_lock<tzdb::TZMutex> lock(mutex);
  auto status = cv.wait_for(lock, std::chrono::seconds(5));
  if (status == tzdb::cv_status::timeout) {
    // Timeout occurred
  }
}

// Notify
cv.notify_one();   // Wake one thread
cv.notify_all();   // Wake all threads
```

**实现细节：**
- 基于 `TZSemaphore` 实现
- 使用 `std::atomic<int>` 记录等待线程数
- 支持相对时间和绝对时间等待
- 支持谓词等待

**注意事项：**
- 条件变量必须与 `tzdb::unique_lock` 配合使用
- `wait_for` 和 `wait_until` 仍然使用 `std::chrono`（见下文）

---

### 3. 时间相关适配

#### 3.1 `std::chrono` 适配

**问题：** 天脉操作系统部分支持 `std::chrono`，但在某些场景需要使用系统 API

**当前状态：** 
- `std::chrono` 在条件变量中正常使用（`tz_condition_variable.h`）
- 在某些延时场景使用天脉系统 API

**适配示例：**

**场景 1：条件变量超时（使用 `std::chrono`）**
```cpp
// inc/os/sync/tz_condition_variable.h
auto current_time = std::chrono::system_clock::now();
auto secs = std::chrono::time_point_cast<std::chrono::seconds>(current_time);
auto ns = std::chrono::time_point_cast<std::chrono::nanoseconds>(current_time);
```

**场景 2：线程休眠（使用天脉 API）**
```cpp
// os/communicate/tcp_connect.cpp
#if TM_OS
  SYSTEM_TIME_TYPE TIME_OUT = (SYSTEM_TIME_TYPE)sleep_time;
  TIME_OUT *= (long long)1000000;  // Convert to nanoseconds
  RETURN_CODE_TYPE rc = NO_ERROR;
  // Use Tianmai OS sleep API
#else
  std::this_thread::sleep_for(std::chrono::milliseconds(sleep_time));
#endif
```

**场景 3：Raft 选举超时（使用天脉 API）**
```cpp
// inc/distribution/raft/raft_election.hpp
#if TM_OS
  SYSTEM_TIME_TYPE TIME_OUT = (SYSTEM_TIME_TYPE)10;
  TIME_OUT *= (long long)1000000;
  RETURN_CODE_TYPE rc = NO_ERROR;
  // Use Tianmai OS delay API
#else
  std::this_thread::sleep_for(std::chrono::milliseconds(10));
#endif
```

**注意事项：**
- `std::chrono` 的时间点和时长类型可以使用
- 线程休眠需要使用天脉系统 API
- 时间单位转换：天脉 API 通常使用纳秒

---

### 4. 原子操作适配

#### 4.1 `std::atomic` 适配

**问题：** 需要确认天脉操作系统对原子操作的支持

**当前状态：** 直接使用 `std::atomic`

**适配文件：** `inc/common/lang/atomic.h`

**使用方式：**
```cpp
#include "common/lang/atomic.h"

atomic<int> counter{0};
counter.fetch_add(1, std::memory_order_relaxed);
```

**实现细节：**
```cpp
// inc/common/lang/atomic.h
#include <atomic>
using std::atomic;
```

**注意事项：**
- 当前假设天脉操作系统支持 `std::atomic`
- 如果不支持，需要使用平台相关的原子操作 API

---

### 5. 其他标准库适配

#### 5.1 `std::max_align_t` 适配

**问题：** 天脉操作系统可能不提供 `std::max_align_t`

**解决方案：** 提供自定义实现

**适配文件：** `inc/common/lang/max_align_t.h`

**使用方式：**
```cpp
#if TM_OS
  #include "common/lang/max_align_t.h"
#else
  #include <cstddef>
#endif
```

#### 5.2 信号量适配

**问题：** 天脉操作系统的信号量 API 不同

**解决方案：** 使用天脉系统的信号量头文件

**适配示例：**
```cpp
// inc/third_party/concurrentqueue/lightweightsemaphore.h
#if TM_OS
  #include "os/pos/posix/semaphore.h"
  #include "rtl/errno.h"
  
  #define EINTR 4  /* Interrupted system call */
  
  class Semaphore {
    sem_t m_sema;
    
  public:
    Semaphore(int initialCount = 0) {
      sem_init(&m_sema, 0, initialCount);
    }
    
    ~Semaphore() {
      sem_destroy(&m_sema);
    }
    
    bool wait() {
      int rc;
      do {
        rc = sem_wait(&m_sema);
      } while (rc == -1 && errno == EINTR);
      return rc == 0;
    }
    
    void signal() {
      while (sem_post(&m_sema) == -1);
    }
  };
#endif
```

---

## 文件系统和 I/O 适配

### 6.1 文件操作适配

**适配文件：**
- `os/file/acoreos3/file_handle.cpp`
- `os/file/acoreos3/local_file_system.cpp`

**编译条件：**
```cpp
#if defined(ACOREOS_CPP) || TM_OS
  // Tianmai OS specific implementation
#endif
```

**注意事项：**
- 天脉操作系统不支持 `O_DIRECT` 标志
- 使用 `fcntl` 替代方案（类似 macOS）

```cpp
#if defined(__DARWIN__) || defined(__APPLE__) || defined(__OpenBSD__) || TM_OS
  // OSX/Tianmai does not have O_DIRECT, use fcntl instead
#else
  open_flags |= O_DIRECT;
#endif
```

### 6.2 网络 I/O 适配

**适配文件：**
- `inc/os/io_model/io_model_system.h`
- `os/communicate/acoreos3/communicate.cpp`

**编译条件：**
```cpp
#if defined(ACOREOS) || defined(ACOREOSRTP) || (TM_OS == 1)
  #include <drv/sysSelect.h>
  typedef fd_set EVENT_HANDLE;
#endif
```

### 6.3 Socket 适配

**适配文件：** `inc/os/communicate/socket_system.h`

**编译条件：**
```cpp
#if defined(ACORE_OS) || defined(ACOREOSRTP) || TM_OS
  #define SOCKET int
  // Tianmai OS socket definitions
#endif
```

### 6.4 Select 系统调用适配

**适配文件：** `distribution/raft/runtime.cpp`

**编译条件：**
```cpp
#if defined(TM_OS)
  #include <sysSelect.h>
#else
  #include <poll.h>
#endif
```

---

## 第三方库适配

### 7.1 并发队列适配

**适配文件：**
- `inc/third_party/concurrentqueue/concurrentqueue.h`
- `inc/third_party/concurrentqueue/lightweightsemaphore.h`

**适配内容：**
- `std::max_align_t` 类型定义
- 信号量实现
- EINTR 错误码定义

### 7.2 Robin Hood Hash Map

**适配文件：** `inc/third_party/robin_hood/robin_hood.h`

**用途：** 替代 `std::unordered_map` 和 `std::unordered_set`

**特点：**
- 头文件库，无需编译
- 高性能，低内存占用
- API 与标准库兼容

---

## 适配检查清单

在天脉操作系统上编译和运行 TZDB 时，请检查以下事项：

### 编译时检查

- [ ] 确保定义了 `TM_ENABLE=1` 或未定义（默认启用）
- [ ] 检查所有 `#if TM_OS` 分支是否正确
- [ ] 确认天脉系统头文件路径正确
  - `<tasks.h>`
  - `<Attribute.h>`
  - `<drv/sysSelect.h>`
  - `<sysTypes.h>`
  - `"os/pos/posix/semaphore.h"`
  - `"rtl/errno.h"`
  - `"rtl/fcntl.h"`

### 代码使用检查

- [ ] 使用 `std_compat::unordered_map` 而非 `std::unordered_map`
- [ ] 使用 `std_compat::thread` 而非 `std::thread`
- [ ] 使用 `tzdb::TZMutex` 而非 `std::mutex`
- [ ] 使用 `tzdb::lock_guard` 而非 `std::lock_guard`
- [ ] 使用 `tzdb::unique_lock` 而非 `std::unique_lock`
- [ ] 使用 `tzdb::shared_lock` 而非 `std::shared_lock`
- [ ] 使用 `tzdb::condition_variable` 而非 `std::condition_variable`
- [ ] 线程休眠使用天脉 API 而非 `std::this_thread::sleep_for`

### 运行时检查

- [ ] 线程创建和销毁是否正常
- [ ] 互斥锁和条件变量是否工作正常
- [ ] 文件 I/O 操作是否正常
- [ ] 网络 I/O 操作是否正常
- [ ] 内存分配和释放是否正常

---

## 待完善的适配

以下功能在天脉操作系统上可能需要进一步适配：

1. **`std::unordered_set` 适配层**
   - 当前部分代码直接使用 `std::unordered_set`
   - 建议创建 `inc/common/lang/unordered_set.h` 适配层

2. **线程 `join()` 和 `detach()` 实现**
   - 当前为空实现
   - 需要根据天脉 API 完善

3. **`std::future` 和 `std::promise` 适配**
   - 如果需要使用异步操作，可能需要适配
   - 当前有 `inc/common/lang/future.h` 文件

4. **异常处理**
   - 确认天脉操作系统对 C++ 异常的支持程度
   - 可能需要使用错误码替代异常

5. **RTTI 支持**
   - 确认天脉操作系统对 RTTI 的支持
   - 可能需要禁用 `-fno-rtti` 编译选项

---

## 性能优化建议

### 1. 内存对齐

天脉操作系统可能对内存对齐有特殊要求：

```cpp
// Use 64-byte alignment for cache line optimization
#if TM_OS
  constexpr size_t CACHE_LINE_SIZE = 64;
  alignas(CACHE_LINE_SIZE) struct AlignedData {
    // Data members
  };
#endif
```

### 2. 线程栈大小

根据实际需求调整线程栈大小：

```cpp
// inc/common/lang/thread.hpp
#if TM_OS
  const size_t dbThreadStackSize = 1024*1024;  // 1MB default
  // For I/O threads, may need larger stack
  // For worker threads, may need smaller stack
#endif
```

### 3. 线程优先级

根据任务类型设置合适的优先级：

```cpp
#if TM_OS
  #define DEFAULT_TASK_PRIORITY (11)      // Normal priority
  #define HIGH_PRIORITY_TASK (8)          // High priority
  #define LOW_PRIORITY_TASK (14)          // Low priority
#endif
```

---

## 调试技巧

### 1. 编译时调试

添加编译时检查：

```cpp
#if TM_OS
  #pragma message("Compiling for Tianmai OS")
#else
  #pragma message("Compiling for standard platform")
#endif
```

### 2. 运行时调试

添加平台标识日志：

```cpp
void PrintPlatformInfo() {
#if TM_OS
  LOG_INFO("Running on Tianmai OS");
#else
  LOG_INFO("Running on standard platform");
#endif
}
```

### 3. 条件编译检查

确保所有 `#if TM_OS` 都有对应的 `#else` 分支：

```cpp
#if TM_OS
  // Tianmai OS implementation
#else
  // Standard implementation
#endif
```

---

## 参考文件

以下文件包含天脉操作系统适配的关键代码：

### 核心适配文件
- `inc/common/lang/std_compact_config.h` - 编译配置
- `inc/common/lang/thread.hpp` - 线程适配
- `inc/common/lang/unordered_map.h` - 哈希表适配
- `inc/os/sync/tz_mutex.h` - 互斥锁适配
- `inc/os/sync/tz_condition_variable.h` - 条件变量适配

### 系统接口适配
- `inc/os/io_model/io_model_system.h` - I/O 模型适配
- `inc/os/communicate/socket_system.h` - Socket 适配
- `os/file/acoreos3/file_handle.cpp` - 文件操作适配
- `os/file/acoreos3/local_file_system.cpp` - 文件系统适配

### 第三方库适配
- `inc/third_party/concurrentqueue/concurrentqueue.h` - 并发队列适配
- `inc/third_party/concurrentqueue/lightweightsemaphore.h` - 信号量适配
- `inc/third_party/robin_hood/robin_hood.h` - 哈希表实现

### 应用层适配
- `os/communicate/tcp_connect.cpp` - TCP 连接适配
- `distribution/raft/runtime.cpp` - Raft 运行时适配
- `inc/distribution/raft/raft_election.hpp` - Raft 选举适配
- `inc/storage/common/disk_manager/disk_manager_memory.h` - 磁盘管理适配

---

## 总结

TZDB 在天脉操作系统上的适配主要涉及以下方面：

1. **容器类**：使用 `robin_hood` 替代 `std::unordered_map/set`
2. **线程**：使用 ACoreOs 任务 API 替代 `std::thread`
3. **同步原语**：自定义实现 `mutex`、`condition_variable`、`lock_guard` 等
4. **时间操作**：部分使用 `std::chrono`，部分使用天脉系统 API
5. **文件和网络 I/O**：使用天脉系统的 POSIX 兼容 API

通过统一的 `TM_OS` 宏和适配层，代码可以在天脉操作系统和标准平台之间无缝切换。

---

**文档版本：** 1.0  
**最后更新：** 2025-10-10  
**维护者：** TZDB 开发团队
