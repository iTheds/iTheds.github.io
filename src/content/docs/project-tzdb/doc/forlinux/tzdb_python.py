
"""
本处为 python 项目调用本地接口的辅助文件 模板。
通过调用该文件中定义的类，实现在 python 中更为便捷的操作 TZDB。

其中，扩展调配为：
1. 更改数据库名称;更改类名称；
2. 更改其内置函数 __DBName_get 和 __DBName_put 方法；
3. 其他功能扩展自行增添方法；

@author iTheds
"""

# coding=utf-8
import ctypes
import threading
from enum import Enum
import queue

# test import
import random
from datetime import datetime, timedelta
import string
import os
import time

# 导入标准的库，使用数据库
ll = ctypes.cdll.LoadLibrary
tzdb = ll("./build/libTZDBLinux.so") # 路径为执行路径的相对路径

####################################################################
# 构建之后将要使用到的、同等与C++类成员的python 类
class UAVTab(ctypes.Structure):
    _fields_ = [
        ('EDB_Hf', ctypes.c_ulonglong * 7)
    ]

class edb_cursor_t(ctypes.Structure):
    _fields_ = [
        ('c', ctypes.c_ulonglong * 7 * 7)
    ]

# 类别形式转换函数
def cbytesFromStr(input_str):
    # return bytes(input_str, 'iso-8859-1')
    # return bytes(input_str, 'utf-16')
    return bytes(input_str, 'utf-8')
    # return bytes(input_str, 'ascii')
    # return bytes(input_str)

def StrFromcbytes(input_str, len):
    return input_str.decode('utf-8', 'ignore')[:len]
    # return str(input_str[:len])

####################################################################

"""
数据格式支持如下：

单条数据：

Sensor: [Sensor_ID,gps_timeStr,gps_x,gps_y,gps_z,ori_timeStr,ori_w,ori_x,ori_y,ori_z]\n\n
Detect: [Detect_ID,cam_timeStr,probability,xmin,ymin,xmax,ymax,Class,img_path]\n\n
Fight: [Fight_ID,f_timeStr,f_state]\n\n

"""

####################################################################

class SDFDB():
    """适用于 python 的基础类"""

    # 构建等效与字符串指针的字符串
    # 数据库名称
    db_name = cbytesFromStr("UAVDB")
    # 数据库内存大小
    model_len = 1024 * 1024 * 6
    ## 数据库必要变量
    # 数据库句柄，为 C++ 的 void 指针,数据结构指针
    db = ctypes.c_void_p(0)
    # 数据库事务句柄
    t = ctypes.c_void_p(0)
    # 建立数据库游标对象
    c = edb_cursor_t()
    
    # 构建实例进行存放内容
    uav_detect = UAVTab()
    uav_sensor = UAVTab()
    uav_fight = UAVTab()

    # 存放的结果
    # 定义一个全局锁
    # lock.acquire()
    # lock.release()
    lock = threading.Lock()

    cuint_buf = ctypes.c_uint(99)
    cbool_buf = ctypes.c_bool(0)
    cint_buf = ctypes.c_int(0)
    cfloat_buf = ctypes.c_float(0)

    cstr_entity_get_buf = (ctypes.c_char * 64)()

    class __mem_str_tmp:
    # class __mem_str:
        """内存寄存类，备用方案"""
        mem_block = []

        def __init__(self, block_num):
            """None"""

        def allocate(self):
            str_mem= {}
            str_mem['istr_value'] = (ctypes.c_char * 64)()  # 构建实体
            str_mem['str_type'] = ctypes.pointer(str_mem['istr_value'])  # 获取指针
            self.mem_block.append(str_mem)
            return str_mem['str_type']
        
        def free(self):
            """free , 暂不使用"""

        def return_men_num(self, num):
            """None"""

        def return_all(self):
            """None"""


    class __mem_str:
    # class __mem_str_tmp:
        """内存寄存类，可优化"""
        free_queue = queue.Queue()
        useing_queue = queue.Queue()

        def __init__(self, block_num):
            for _ in range(block_num):
                str_mem= {}
                str_mem['istr_value'] = (ctypes.c_char * 64)()  # 构建实体
                str_mem['str_type'] = ctypes.pointer(str_mem['istr_value'])  # 获取指针
                self.free_queue.put(str_mem)
            
        def allocate(self):
            res = self.free_queue.get()
            self.useing_queue.put(res)
            return res['str_type']
        
        def return_men(self, dict):
            """free"""
            self.free_queue.put(dict)

        def return_men_num(self, num):
            """free"""
            if num > self.useing_queue.qsize() :
                num = self.useing_queue.qsize()
            for _ in range(num):
                tmp = self.useing_queue.get()
                self.free_queue.put(tmp)
            
        def return_all(self):
            """"""
            for _ in range(self.useing_queue.qsize()):
                tmp = self.useing_queue.get()
                self.free_queue.put(tmp)


    mem_pool_size = 100
    all_data_used_str = 10
    mem_pool = __mem_str(mem_pool_size)

    insert_frequency = 10

    def __init__(self, db_name, model_len):
        """初始化;名称不可用下划线;model_len 例如 1024 * 1024 * 10"""

        self.db_name = cbytesFromStr(db_name)
        self.model_len = model_len

        self.insert_frequency = self.mem_pool_size / self.all_data_used_str
    
    def open(self):
        # 打开数据库，该方法为适用于 linux 的额外扩展方法，调用前序 dll 动态库内方法
        rc = tzdb.edb_db_open_SCFDB(self.db_name, self.model_len, 0)
        assert rc == 0

    def close(self):
        rc = tzdb.edb_db_close(self.db_name)
        assert rc == 0

    def connect(self):
        """连接数据库并保持连接状态"""
        # 连接数据库，与数据库建立连接，ctypes.byref 为C++ 中指针写法
        rc = tzdb.edb_db_connect(self.db_name, ctypes.byref(self.db))
        assert rc == 0

    def disconnect(self):
        """断开数据库"""
        rc = tzdb.edb_db_disconnect(self.db)
        assert rc == 0

    def errorCode(self, rc):
        """返回码异常处理;返回 bool"""
        if rc == 904:        
            print("无结果")  # 查询不到则返回无结果
            return True

    def __trans(self, callback, *args, **kwargs):
        """裹挟事务的回调函数方法，支持可变数量参数"""
        rc = tzdb.edb_trans_start(self.db, 2, 0, ctypes.byref(self.t))
        assert rc == 0

        res = callback(*args)

        rc = tzdb.edb_trans_commit(self.t)
        assert rc == 0

        return res

    # 插入
    def insert_table(self, insertCase, TableType):
        """对指定表插入一条数据,insertCase 为字典或者一维数组;TableType 为表格式 例如 SDFDB.TableType.Detect;\n
        Sensor: [Sensor_ID,gps_timeStr,gps_x,gps_y,gps_z,ori_timeStr,ori_w,ori_x,ori_y,ori_z]\n\n
        Detect: [Detect_ID,cam_timeStr,probability,xmin,ymin,xmax,ymax,Class,img_path]\n\n
        Fight: [Fight_ID,f_timeStr,f_state]\n\n"""

        self.__trans(self.__db__put_without_trans[TableType], self, insertCase)

    # 插入一条数据
    def insert(self, insertCase):
        """插入一条数据,insertCase 为字典或者一维数组;\n
        Sensor: [Sensor_ID,gps_timeStr,gps_x,gps_y,gps_z,ori_timeStr,ori_w,ori_x,ori_y,ori_z]\n\n
        Detect: [Detect_ID,cam_timeStr,probability,xmin,ymin,xmax,ymax,Class,img_path]\n\n
        Fight: [Fight_ID,f_timeStr,f_state]\n\n"""

        self.__trans(self.__insert_without_trans, insertCase)
        self.mem_pool.return_men_num(10)

    # 批量插入数据
    def insert_all(self, insertCase):
        """插入一条数据,insertCase 为字典或者一维数组;\n
        Sensor: [Sensor_ID,gps_timeStr,gps_x,gps_y,gps_z,ori_timeStr,ori_w,ori_x,ori_y,ori_z]\n\n
        Detect: [Detect_ID,cam_timeStr,probability,xmin,ymin,xmax,ymax,Class,img_path]\n\n
        Fight: [Fight_ID,f_timeStr,f_state]\n\n"""

        rc = tzdb.edb_trans_start(self.db, 2, 0, ctypes.byref(self.t))
        assert rc == 0

        count = 0
        for i in insertCase:
            self.__insert_without_trans(i)
            count += 1
            if count % (self.insert_frequency) == 0:
                rc = tzdb.edb_trans_commit(self.t)
                assert rc == 0
                rc = tzdb.edb_trans_start(self.db, 2, 0, ctypes.byref(self.t))
                assert rc == 0
                self.mem_pool.return_all()

        rc = tzdb.edb_trans_commit(self.t)
        assert rc == 0
        self.mem_pool.return_all()


    # 查询数据 

    def select_all(self):
        """联表查询所有"""
        return self.__trans(self.__select_all_without_trans)

    def select_table_all(self, TableType):
        """查询指定表所有数据;TableType 为表格式 例如 SDFDB.TableType.Detect;\n"""
        
        return self.__trans(self.__select_table_all_without_trans, TableType)

    def isClass(self, str):
        """ 查询指定的 class 是否存在;返回 boolen """
        res = True

        istr_value_class = (ctypes.c_char * 64)()  # 构建实体
        str_type_class = ctypes.pointer(istr_value_class)  # 获取指针
        search_class = bytes(str)  # 查询对应的类别
        class_len = len(search_class)
        tzdb.sprintf(str_type_class, search_class)  # 之后 str 内容为 "uav_target"

        # 开启事务
        rc = tzdb.edb_trans_start(self.db, 2, 0, ctypes.byref(self.t))
        assert rc == 0
        tzdb.Detect_ClassIndex_index_cursor(self.t, ctypes.byref(self.c))

        # MCO_LT = 1, MCO_LE = 2, MCO_EQ = 3, MCO_GE = 4, MCO_GT = 5,
        # MCO_OVERLAP = 6, MCO_CONTAIN = 7, MCO_EX = 8, MCO_BEST = 9, MCO_PREF = 10, MCO_NEXT_MATCH = 11, MCO_NEIGHBOURHOOD = 12
        rc = tzdb.Detect_ClassIndex_search(self.t, ctypes.byref(self.c), 3, str_type_class, class_len)
        self.errorCode(rc)
        # 查看是否存在
        if rc != 0:
            res = False

        rc = tzdb.edb_trans_commit(self.t)
        assert rc == 0

        return res

    def select_all_class(self, class_str):
        """查询指定类别的所有对象，顺序查找;class_str 类;返回结果集，其为二维数组;"""
        caseResult = []

        return caseResult

    # 删除数据
    def delete_table_id(self, id, TableType):
        print()

    def delete_id(self, id):
        print()

    # 更新数据
    def update_table(self, id , updateCase, TableType):
        print()

    def update_table(self, id , updateCase, TableType):
        print()

    def displayCount(self):
        print ()


    # 内部方法(无需查看) ####################################################################################################

    # 插入一条数据
    def __insert_without_trans(self, insertCase):
        """插入一条数据,insertCase 为字典或者一维数组;\n
        Sensor: [Sensor_ID,gps_timeStr,gps_x,gps_y,gps_z,ori_timeStr,ori_w,ori_x,ori_y,ori_z]\n\n
        Detect: [Detect_ID,cam_timeStr,probability,xmin,ymin,xmax,ymax,Class,img_path]\n\n
        Fight: [Fight_ID,f_timeStr,f_state]\n\n"""

        self.__detect_put_without_trans(insertCase)
        self.__sensor_put_without_trans(insertCase)
        self.__fight_put_without_trans(insertCase)

    def __select_all_without_trans(self):
        res = []
        res_tmp = []

        res = self.__select_table_all_without_trans(SDFDB.TableType.Detect)

        for value in res :
            res_tmp = self.__select_table_id_index_without_trans(SDFDB.TableType.Sensor, value['Detect_ID'])
            if len(res_tmp) == 1:
                value.update(res_tmp[0])

        for value in res :
            res_tmp = self.__select_table_id_index_without_trans(SDFDB.TableType.Fight, value['Detect_ID'])
            if len(res_tmp) == 1:
                value.update(res_tmp[0])
        return res

    def __select_table_id_index_without_trans(self, TableType, id):
        """根据 id 进行查询"""
        res = []

        rc = self.__tzdb_IdIndex_index_cursor[TableType](self.t, ctypes.byref(self.c))
        assert rc == 0
        rc = self.__tzdb_IdIndex_search[TableType](self.t, ctypes.byref(self.c), 3 , id)
        if rc == 904:
            print("无结果")  # 查询不到则返回无结果
            return res

        res = self.__db_fetch_all[TableType](self)
        return res
    
    def __select_table_all_without_trans(self, TableType):
        """无事务查询 指定 表"""
        res = []

        rc = self.__tzdb_list_cursor[TableType](self.t, ctypes.byref(self.c))
        if rc == 904:
            print("无结果")  # 查询不到则返回无结果
            return res
        rc = tzdb.edb_cursor_first(self.t, ctypes.byref(self.c))
        assert rc == 0

        res = self.__db_fetch_all[TableType](self)
        return res

    def __select_detect_class(self, class_str):
        """无事务指定 class 查询 detect 表"""

        istr_value_class = (ctypes.c_char * 64)()  # 构建实体
        str_type_class = ctypes.pointer(istr_value_class)  # 获取指针
        search_class = bytes(class_str)  # 查询对应的类别
        class_len = len(search_class)
        tzdb.sprintf(str_type_class, search_class)  # 之后 str 内容为 "uav_target"

        tzdb.Detect_ClassIndex_index_cursor(self.t, ctypes.byref(self.c))
        rc = tzdb.Detect_ClassIndex_search(self.t, ctypes.byref(self.c), 3, str_type_class, class_len)
        assert self.errorCode(rc)

        return self.__detect_fetch_all()

    # 该部分无需查看，直接查阅选择器

    def __detect_fetch_all(self):
        """针对查询的结果，遍历游标，获取所有结果集"""
        caseResult = []
        row = 0
        rc = 0
        while rc == 0:
            tzdb.Detect_from_cursor(self.t, ctypes.byref(self.c), ctypes.byref(self.uav_detect))
            
            caseResult.append(self.__Detect_get())

            rc = tzdb.edb_cursor_next(self.t, ctypes.byref(self.c))
            # print("edb_cursor_next rc is {rc}", rc)
            row = row + 1
        return caseResult
    
    # 针对查询的结果，遍历游标，获取所有结果集
    def __sensor_fetch_all(self):
        """针对查询的结果，遍历游标，获取所有结果集"""
        caseResult = []
        row = 0
        rc = 0
        while rc == 0:
            tzdb.Sensor_from_cursor(self.t, ctypes.byref(self.c), ctypes.byref(self.uav_sensor))
            
            caseResult.append(self.__Sensor_get())

            rc = tzdb.edb_cursor_next(self.t, ctypes.byref(self.c))
            # print("edb_cursor_next rc is {rc}", rc)
            row = row + 1
        return caseResult

    # 针对查询的结果，遍历游标，获取所有结果集
    def __fight_fetch_all(self):
        """针对查询的结果，遍历游标，获取所有结果集"""
        caseResult = []
        row = 0
        rc = 0
        while rc == 0:
            tzdb.Fight_from_cursor(self.t, ctypes.byref(self.c), ctypes.byref(self.uav_fight))
            
            caseResult.append(self.__Fight_get())

            rc = tzdb.edb_cursor_next(self.t, ctypes.byref(self.c))
            # print("edb_cursor_next rc is {rc}", rc)
            row = row + 1
        return caseResult

    # 无事务插入数据
    def __detect_put_without_trans(self, insertCase):
        rc = tzdb.Detect_new(self.t, ctypes.byref(self.uav_detect))
        assert rc == 0
        return self.__Detect_put(insertCase)
        # self.__Detect_put(insertCase)

    # 无事务插入数据
    def __sensor_put_without_trans(self,insertCase):
        rc = tzdb.Sensor_new(self.t, ctypes.byref(self.uav_sensor))
        assert rc == 0
        self.__Sensor_put(insertCase)

    # 无事务插入数据
    def __fight_put_without_trans(self,insertCase):
        rc = tzdb.Fight_new(self.t, ctypes.byref(self.uav_fight))
        assert rc == 0
        self.__Fight_put(insertCase)

    #
    def __Detect_get(self):
        """事务内 get 所有信息;返回一个一维数组"""
        # self.lock.acquire()
        caseResult = {}

        tzdb.Detect_Detect_ID_get(ctypes.byref(self.uav_detect), ctypes.byref(self.cuint_buf))
        caseResult['Detect_ID'] = int(self.cuint_buf.value)

        self.cint_buf.value = 0
        tzdb.Detect_cam_timeStr_get(ctypes.byref(self.uav_detect), self.cstr_entity_get_buf, 128, ctypes.byref(self.cint_buf))
        a_str = StrFromcbytes(self.cstr_entity_get_buf.value, self.cint_buf.value)
        # print(self.istr_value_10.value)
        # print(a_str + '\t')
        # print(self.b_int.value)
        caseResult['cam_timeStr'] = a_str
        tzdb.Detect_probability_get(ctypes.byref(self.uav_detect), ctypes.byref(self.cfloat_buf))
        # print(repr(tmp_uint.value) + '\t')
        caseResult['probability'] = round(float(self.cfloat_buf.value), 2)
        # caseResult['probability'] = self.cfloat_buf.value
        tzdb.Detect_xmin_get(ctypes.byref(self.uav_detect), ctypes.byref(self.cfloat_buf))
        # print(repr(tmp_uint.value) + '\t')
        caseResult['xmin'] = round(float(self.cfloat_buf.value), 2)
        tzdb.Detect_ymin_get(ctypes.byref(self.uav_detect), ctypes.byref(self.cfloat_buf))
        # print(repr(tmp_uint.value) + '\t')
        caseResult['ymin'] = round(float(self.cfloat_buf.value), 2)
        tzdb.Detect_xmax_get(ctypes.byref(self.uav_detect), ctypes.byref(self.cfloat_buf))
        # print(repr(tmp_uint.value) + '\t')
        caseResult['xmax'] = round(float(self.cfloat_buf.value), 2)
        tzdb.Detect_ymax_get(ctypes.byref(self.uav_detect), ctypes.byref(self.cfloat_buf))
        # print(repr(tmp_uint.value) + '\t')
        caseResult['ymax'] = round(float(self.cfloat_buf.value), 2)
        tzdb.Detect_Class_get(ctypes.byref(self.uav_detect), self.cstr_entity_get_buf, 128, ctypes.byref(self.cint_buf))
        a_str = StrFromcbytes(self.cstr_entity_get_buf.value, self.cint_buf.value)
        caseResult['Class'] = a_str
        tzdb.Detect_img_path_get(ctypes.byref(self.uav_detect), self.cstr_entity_get_buf, 128, ctypes.byref(self.cint_buf))
        a_str = StrFromcbytes(self.cstr_entity_get_buf.value, self.cint_buf.value)
        caseResult['img_path'] = a_str
        # self.lock.release()

        return caseResult
    
    def __Sensor_get(self):
        # self.lock.acquire()
        caseResult = {}

        tzdb.Sensor_Sensor_ID_get(ctypes.byref(self.uav_sensor), ctypes.byref(self.cuint_buf))
        caseResult['Sensor_ID'] = int(self.cuint_buf.value)

        tzdb.Sensor_gps_timeStr_get(ctypes.byref(self.uav_sensor), self.cstr_entity_get_buf, 128, ctypes.byref(self.cint_buf))
        a_str = StrFromcbytes(self.cstr_entity_get_buf.value, self.cint_buf.value)
        caseResult['gps_timeStr'] = a_str

        tzdb.Sensor_gps_x_get(ctypes.byref(self.uav_sensor), ctypes.byref(self.cfloat_buf))
        # print(repr(tmp_uint.value) + '\t')
        caseResult['gps_x'] = round(float(self.cfloat_buf.value), 3)
        tzdb.Sensor_gps_y_get(ctypes.byref(self.uav_sensor), ctypes.byref(self.cfloat_buf))
        # print(repr(tmp_uint.value) + '\t')
        caseResult['gps_y'] = round(float(self.cfloat_buf.value), 3)
        tzdb.Sensor_gps_z_get(ctypes.byref(self.uav_sensor), ctypes.byref(self.cfloat_buf))
        # print(repr(tmp_uint.value) + '\t')
        caseResult['gps_z'] = round(float(self.cfloat_buf.value), 3)

        tzdb.Sensor_ori_timeStr_get(ctypes.byref(self.uav_sensor), self.cstr_entity_get_buf, 128, ctypes.byref(self.cint_buf))
        a_str = StrFromcbytes(self.cstr_entity_get_buf.value, self.cint_buf.value)
        caseResult['ori_timeStr'] = a_str

        tzdb.Sensor_ori_w_get(ctypes.byref(self.uav_sensor), ctypes.byref(self.cfloat_buf))
        # print(repr(tmp_uint.value) + '\t')
        caseResult['ori_w'] = round(float(self.cfloat_buf.value), 3)
        tzdb.Sensor_ori_x_get(ctypes.byref(self.uav_sensor), ctypes.byref(self.cfloat_buf))
        # print(repr(tmp_uint.value) + '\t')
        caseResult['ori_x'] = round(float(self.cfloat_buf.value), 3)
        tzdb.Sensor_ori_y_get(ctypes.byref(self.uav_sensor), ctypes.byref(self.cfloat_buf))
        # print(repr(tmp_uint.value) + '\t')
        caseResult['ori_y'] = round(float(self.cfloat_buf.value), 3)
        tzdb.Sensor_ori_z_get(ctypes.byref(self.uav_sensor), ctypes.byref(self.cfloat_buf))
        caseResult['ori_z'] = round(float(self.cfloat_buf.value), 3)

        # self.lock.release()
        return caseResult

    def __Fight_get(self):
        # self.lock.acquire()
        caseResult = {}

        tzdb.Fight_Fight_ID_get(ctypes.byref(self.uav_fight), ctypes.byref(self.cuint_buf))
        caseResult['Fight_ID'] = int(self.cuint_buf.value)

        tzdb.Fight_f_timeStr_get(ctypes.byref(self.uav_fight), self.cstr_entity_get_buf, 128, ctypes.byref(self.cint_buf))
        a_str = StrFromcbytes(self.cstr_entity_get_buf.value, self.cint_buf.value)
        caseResult['f_timeStr'] = a_str

        tzdb.Fight_f_state_get(ctypes.byref(self.uav_fight), ctypes.byref(self.cbool_buf))
        # print(repr(self.cbool_buf.value) + '\t')
        caseResult['f_state'] = bool(self.cbool_buf.value)
        # self.lock.release()
        return caseResult

    # 
    def __Detect_put(self, insertCase):
        """事务内 put 所有信息;输入的为 key—value 的字典\n\n
        Detect: [Detect_ID,cam_timeStr,probability,xmin,ymin,xmax,ymax,Class,img_path]\n\n"""

        # 使用一个内存返回方式，对内存进行寄存
        # self.mem_pool = SDFDB.__mem_str()

        rc = tzdb.Detect_Detect_ID_put(ctypes.byref(self.uav_detect), ctypes.c_int(insertCase['Detect_ID']))
        assert rc == 0

        str_mem = self.mem_pool.allocate()
        tzdb.sprintf(str_mem, cbytesFromStr(insertCase['cam_timeStr']))
        rc = tzdb.Detect_cam_timeStr_put(ctypes.byref(self.uav_detect), str_mem, 0)
        assert rc == 0

        rc = tzdb.Detect_probability_put(ctypes.byref(self.uav_detect), ctypes.c_float(insertCase['probability']))
        rc = tzdb.Detect_xmin_put(ctypes.byref(self.uav_detect), ctypes.c_float(insertCase['xmin']))
        rc = tzdb.Detect_ymin_put(ctypes.byref(self.uav_detect), ctypes.c_float(insertCase['ymin']))
        rc = tzdb.Detect_xmax_put(ctypes.byref(self.uav_detect), ctypes.c_float(insertCase['xmax']))
        rc = tzdb.Detect_ymax_put(ctypes.byref(self.uav_detect), ctypes.c_float(insertCase['ymax']))
        assert rc == 0

        str_mem = self.mem_pool.allocate()
        tzdb.sprintf(str_mem, cbytesFromStr(insertCase['Class']))
        rc = tzdb.Detect_Class_put(ctypes.byref(self.uav_detect), str_mem, 0)
        assert rc == 0

        str_mem = self.mem_pool.allocate()
        tzdb.sprintf(str_mem, cbytesFromStr(insertCase['img_path']))
        rc = tzdb.Detect_img_path_put(ctypes.byref(self.uav_detect), str_mem, 0)
        assert rc == 0

        # return self.mem_pool

    def __Sensor_put(self, insertCase):
        """事务内 put 所有信息\n\n
        Sensor: [Sensor_ID,gps_timeStr,gps_x,gps_y,gps_z,ori_timeStr,ori_w,ori_x,ori_y,ori_z]\n\n"""
        # 使用一个内存返回方式，对内存进行寄存
        # self.mem_pool = SDFDB.__mem_str()

        rc = tzdb.Sensor_Sensor_ID_put(ctypes.byref(self.uav_sensor), ctypes.c_int(insertCase['Sensor_ID']))  # 只适合一对一

        str_type = self.mem_pool.allocate()
        tzdb.sprintf(str_type, cbytesFromStr(insertCase['gps_timeStr']))  # 之后 str 内容为 "uav_target"
        rc = tzdb.Sensor_gps_timeStr_put(ctypes.byref(self.uav_sensor), str_type, 0)
        assert rc == 0

        rc = tzdb.Sensor_gps_x_put(ctypes.byref(self.uav_sensor), ctypes.c_float(insertCase['gps_x']))
        rc = tzdb.Sensor_gps_y_put(ctypes.byref(self.uav_sensor), ctypes.c_float(insertCase['gps_y']))
        rc = tzdb.Sensor_gps_z_put(ctypes.byref(self.uav_sensor), ctypes.c_float(insertCase['gps_z']))
        assert rc == 0

        str_type = self.mem_pool.allocate()
        tzdb.sprintf(str_type, cbytesFromStr(insertCase['ori_timeStr']))  # 之后 str 内容为 "uav_target"
        rc = tzdb.Sensor_ori_timeStr_put(ctypes.byref(self.uav_sensor), str_type, 0)
        assert rc == 0

        rc = tzdb.Sensor_ori_w_put(ctypes.byref(self.uav_sensor), ctypes.c_float(insertCase['ori_w']))
        rc = tzdb.Sensor_ori_x_put(ctypes.byref(self.uav_sensor), ctypes.c_float(insertCase['ori_x']))
        rc = tzdb.Sensor_ori_y_put(ctypes.byref(self.uav_sensor), ctypes.c_float(insertCase['ori_y']))
        rc = tzdb.Sensor_ori_z_put(ctypes.byref(self.uav_sensor), ctypes.c_float(insertCase['ori_z']))
        assert rc == 0

        # return self.mem_pool

    def __Fight_put(self, insertCase):
        """事务内 put 所有信息\n\n
        Fight: [Fight_ID,f_timeStr,f_state]\n\n"""
        # 使用一个内存返回方式，对内存进行寄存
        # self.mem_pool = SDFDB.__mem_str()

        rc = tzdb.Fight_Fight_ID_put(ctypes.byref(self.uav_fight), ctypes.c_int(insertCase['Sensor_ID']))
        assert rc == 0

        str_type = self.mem_pool.allocate()
        tzdb.sprintf(str_type, cbytesFromStr(insertCase['f_timeStr']))
        rc = tzdb.Fight_f_timeStr_put(ctypes.byref(self.uav_fight), str_type, 0)
        assert rc == 0

        rc = tzdb.Fight_f_state_put(ctypes.byref(self.uav_fight), ctypes.c_bool(insertCase['f_state']))
        assert rc == 0

        # return self.mem_pool

    # 内部方法选择 #########################################################################################################

    class TableType(Enum):
        Sensor = 0
        Detect = 1
        Fight = 2

    # 获取方法
    __db_get_func = {
        TableType.Sensor: __Sensor_get,
        TableType.Detect: __Detect_get,
        TableType.Fight: __Fight_get
    }

    # 插入方法
    __db_put_func = {
        TableType.Sensor: __Sensor_put,
        TableType.Detect: __Detect_put,
        TableType.Fight: __Fight_put
    }

    # 无事务 fetch 所有结果方法
    __db_fetch_all = {
        TableType.Sensor: __sensor_fetch_all,
        TableType.Detect: __detect_fetch_all,
        TableType.Fight: __fight_fetch_all
    }

    # 无事务插入单条数据的方法
    __db__put_without_trans = {
        TableType.Sensor: __sensor_put_without_trans,
        TableType.Detect: __detect_put_without_trans,
        TableType.Fight: __fight_put_without_trans
    }

    # tzdb 方法选择器 - list
    __tzdb_list_cursor = {
        TableType.Sensor: tzdb.Sensor_list_cursor,
        TableType.Detect: tzdb.Detect_list_cursor,
        TableType.Fight: tzdb.Fight_list_cursor
    }
    
    # tzdb 方法选择器 - IdIndex_index_cursor
    __tzdb_IdIndex_index_cursor = {
        TableType.Sensor: tzdb.Sensor_IdIndex_index_cursor,
        TableType.Detect: tzdb.Detect_IdIndex_index_cursor,
        TableType.Fight: tzdb.Fight_IdIndex_index_cursor
    }

    # tzdb 方法选择器 - IdIndex_search
    __tzdb_IdIndex_search = {
        TableType.Sensor: tzdb.Sensor_IdIndex_search,
        TableType.Detect: tzdb.Detect_IdIndex_search,
        TableType.Fight: tzdb.Fight_IdIndex_search
    }

    def test_enum(self):
        choice = "B"
        if choice in self.__db_get_func:
            self.__db_get_func[choice]()
        else:
            print("Invalid choice")

##################################################################################################################
# 测试

db_mem = 1024 * 1024 * 6000

# 检查两个数组是否内容一致
def are_dicts_equal(d1, d2):
    if set(d1.keys()) != set(d2.keys()) :
        return False
    keys_list = list(d1.keys())
    for key in keys_list:
        if d1[key] != d2[key]:
            print(d1[key] + " != " + d2[key])
            return False
    return True

# 数据校对器
def is_dict_equal(array1, array2):
    if len(array1) != len(array2):
        print(f"len error : {len(array1)}")
        return False
    

    sorted_data1 = sorted(array1, key=lambda x: x["Detect_ID"])
    sorted_data2 = sorted(array2, key=lambda x: x["Detect_ID"])

    # 检查每对字典是否内容一致
    results = [are_dicts_equal(d1, d2) for d1, d2 in zip(sorted_data1, sorted_data2)]
    # 检查是否所有字典内容一致
    if all(results):
        return True
    else:
        return False

# 数据校对回调函数

# 生成随机整数
def random_int():
    return random.randint(0, 100)

def random_float():
    return round(random.uniform(0.0, 30.0), 2)

# 生成随机字符串
def random_string(length):
    letters = string.ascii_letters
    return ''.join(random.choice(letters) for _ in range(length))

def random_class():
    rm = random.randint(0, 9)
    if rm >= 6:
        return "Car"
    else :
        if rm >= 3:
            return "Home"
        else :
            return "Human"

def random_time_str():
    # 生成随机日期
    start_date = datetime(2022, 1, 1)
    end_date = datetime(2023, 12, 31)
    random_date = start_date + timedelta(seconds=random.randint(0, int((end_date - start_date).total_seconds())))

    # 格式化日期为字符串
    random_date_str = random_date.strftime("%Y-%m-%d %H:%M:%S")
    return random_date_str

def time_callback(callback, *args, **kwargs):
    """时间测试回调函数"""
    # 在函数开始时记录时间戳
    start_time = time.time()
    res = callback(*args)
    # 在函数结束时记录时间戳
    end_time = time.time()
    # 计算执行时间
    execution_time = end_time - start_time
    return [res, execution_time]

def new_detect(i):
    # 创建随机 insertCase 字典,Detect 表
    return {
        "Detect_ID": i,
        "cam_timeStr": random_time_str(),  # 随机生成时间字符串
        "probability": random_float(),
        "xmin": random_float(),
        "ymin": random_float(),
        "xmax": random_float(),
        "ymax": random_float(),
        "Class": random_class(),  # 随机生成长度为5的字符串
        "img_path": "/path/to/image.jpg"
    }

# 数据生成器
def new_insertcase(i):
    """创建随机 insertCase 字典"""
    insertCase = {
        "Sensor_ID": i,
        "gps_timeStr": random_time_str(),
        "gps_x": random_float(),
        "gps_y": random_float(),
        "gps_z": random_float(),
        "ori_timeStr": random_time_str(),
        "ori_w": random_float(),
        "ori_x": random_float(),
        "ori_y": random_float(),
        "ori_z": random_float(),
        "Detect_ID": i,
        "cam_timeStr": random_time_str(),
        "probability": random_float(),
        "xmin": random_float(),
        "ymin": random_float(),
        "xmax": random_float(),
        "ymax": random_float(),
        "Class": random_class(),
        "img_path": "/path/to/image.jpg",
        "Fight_ID": i,
        "f_timeStr": random_time_str(),
        "f_state": True
    }
    return insertCase

# data_num = [1000]
# insert time = [18.614879]
# select time = [0.392303]
# insertCase equal selectRes = [True]
def testcase_insert_single(insert_num):
    """测试插入;返回插入的数据"""
    dbtest = SDFDB("testDbName",db_mem)
    dbtest.open()
    dbtest.connect()

    insertCase = []

    for i in range(insert_num):
        value = new_insertcase(i)
        dbtest.insert(value)
        # value['img_path'] = "/path/to/image.jg"
        insertCase.append(value)

    dbtest.disconnect()
    dbtest.close()

    return insertCase

def testcase_insert_all(insert_num):
    """测试插入;返回插入的数据"""
    dbtest = SDFDB("testDbName",db_mem)
    dbtest.open()
    dbtest.connect()

    insertCase = []
    value_case = []

    for j in range(insert_num):
        value = new_insertcase(j)
        value_case.append(value)

        if j % 50 == 0 :
            dbtest.insert_all(value_case)
            insertCase.extend(value_case)
            value_case = []

    if len(insertCase) != 0 :
        dbtest.insert_all(value_case)
        insertCase.extend(value_case)
        value_case = []

    dbtest.disconnect()
    dbtest.close()

    return insertCase

def testcase_insert_detect(insert_num):
    dbtest = SDFDB("testDbName",db_mem)
    dbtest.open()
    dbtest.connect()

    for i in range(insert_num):
        insertCase = new_detect(i)
        dbtest.insert_table(insertCase, SDFDB.TableType.Detect)

    dbtest.disconnect()
    dbtest.close()

# 功能测试
def testcase_select_table():

    # tzdb.testcase_SCFDB_SELECT_ALL()

    dbtest = SDFDB("testDbName",db_mem)
    dbtest.open()
    dbtest.connect()
    
    res = dbtest.select_table_all(SDFDB.TableType.Detect)
    print(res)

    dbtest.disconnect()
    dbtest.close()


def testcase_select_all():
    """查询的基准测试;返回查询出的结果"""
    # tzdb.testcase_SCFDB_SELECT_ALL()

    dbtest = SDFDB("testDbName",db_mem)
    dbtest.open()
    dbtest.connect()
    
    res = dbtest.select_all()

    dbtest.disconnect()
    dbtest.close()
    return res

def testcase_process(data_num):
    print(f"data_num = [{data_num}]")
    [insertCase, execute_time] = time_callback(testcase_insert_all, data_num)
    print(f"insert time = [{execute_time:.6f}]")
    # print(insertCase)
    [selectRes, execute_time] = time_callback(testcase_select_all)
    # print(selectRes)
    print(f"select time = [{execute_time:.6f}]")
    is_eque_v = is_dict_equal(insertCase, selectRes)
    print(f"insertCase equal selectRes = [{is_eque_v}]")

# python 语法验证测试
def testcase_python_():

    istr_value_10 = (ctypes.c_char * 64)()
    b = ctypes.c_int(0)

    a_str = str(istr_value_10.value[:b.value])
    print(a_str)

def testcase_enum_and():
    class DB(Enum):
        Sensor = 1
        Detect = 2
        Fight = 3
    def choice_a():
        print("You chose A")
    def choice_b():
        print("You chose B")
    def choice_c():
        print("You chose C")
    # 方法选择器
    choices = {
        DB.Sensor: choice_a,
        DB.Detect: choice_b,
        DB.Fight: choice_c
    }

    choice = DB.Fight
    if choice in choices:
        choices[choice]()
    else:
        print("Invalid choice")
    
    choices[DB.Sensor]()

# 可变参数测试
def testcase_callback():
    def callback_function(*args, **kwargs):
        print("Positional Arguments:")
        for arg in args:
            print(arg)

        print("\nKeyword Arguments:")
        for key, value in kwargs.items():
            print(f"{key}: {value}")

    # 调用回调函数，传递不定数量的参数
    callback_function(1, 2, 3, name="Alice", age=30, city="New York")

##################################################################################################################

if __name__ == '__main__':

    file_path = 'testDbName.aed'
    # file_path = ctypeForStr('testDbName.aed')
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            print(f"文件 {file_path} 删除成功")
        except Exception as e:
            print(f"删除文件时出现错误: {str(e)}")
    else:
        print(f"文件 {file_path} 不存在")

    testcase_process(1000000)

    # testcase_select_table()

    # testcase_callback()

    # testcase_enum_and()

    # testcase_python_()
