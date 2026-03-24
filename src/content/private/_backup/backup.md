---
title: "backup"
published: 2026-03-24
description: "backup"
tags: []
draft: false
---
# 使用 digest 拉取精确版本的镜像

docker pull questdb/questdb@sha256:c7f8077aaa337afaa034e0141f2eb22ba8405078483921b2f38b3127767c9e13

docker pull timescale/timescaledb@sha256:8d199415beb2f56d7655fc096521e1259430aed1dd156b15493ec57dea704fe0

docker pull tdengine/tdengine@sha256:79d32ce8a42f64c7dbfc33946a36b3e176ea23c0cd695a1bc9e8aa889ca03b88

docker pull influxdb@sha256:299ebda2c7e308dbef42e26ac9b8fd1d9b3bcb8a0aee80c6509aa0219c1d0290



./bin/tsbs_load_questdb \
  --file=$DATA_DIR/iot_questdb.gz \
  --workers=$WORKERS_NUM \
  --batch-size=$BATCH_SIZE \
  --ilp-bind-to=192.168.3.248:9009 \
  --url=http://192.168.3.248:9000/ \
  | tee $RESULT_DIR/load_questdb.log

  ./bin/tsbs_load_timescaledb \
  --host=$PGHOST \
  --port=$PGPORT \
  --user=$PGUSER \
  --pass=$PGPASSWORD \
  --db-name=tsbs_iot \
  --workers=$WORKERS_NUM \
  --batch-size=$BATCH_SIZE \
  --file=$DATA_DIR/iot_timescaledb.gz \
  | tee $RESULT_DIR/load_timescaledb.log

##

[] export WORKERS_NUM=4

[] export WORKERS_NUM=8

[] export WORKERS_NUM=12

[x] export WORKERS_NUM=16


export RESULT_DIR=./results_iot_4_worker
mkdir -p "$RESULT_DIR"

## 生成数据

```
./bin/tsbs_generate_data \
  --use-case=iot --seed=$SEED --scale=$SCALE \
  --timestamp-start=$START --timestamp-end=$END \
  --log-interval=10s --format=timescaledb \
  --file=$DATA_DIR/iot_timescaledb.gz

# InfluxDB
./bin/tsbs_generate_data \
  --use-case=iot --seed=$SEED --scale=$SCALE \
  --timestamp-start=$START --timestamp-end=$END \
  --log-interval=10s --format=influx \
  --file=$DATA_DIR/iot_influx.gz

# QuestDB
./bin/tsbs_generate_data \
  --use-case=iot --seed=$SEED --scale=$SCALE \
  --timestamp-start=$START --timestamp-end=$END \
  --log-interval=10s --format=questdb \
  --file=$DATA_DIR/iot_questdb.gz

./bin/tsbs_generate_data \
  --use-case=iot --seed=$SEED --scale=$SCALE \
  --timestamp-start=$START --timestamp-end=$END \
  --log-interval=10s --format=TDengine \
  --file=$DATA_DIR/iot_tdengine.gz
```

## 导入数据

curl -G http://192.168.3.248:8086/query --data-urlencode "q=CREATE DATABASE tsbs_iot" || true

./bin/tsbs_load_influx \
  --urls=http://192.168.3.248:8086 \
  --db-name=tsbs_iot \
  --replication-factor=1 \
  --workers=$WORKERS_NUM --batch-size=$BATCH_SIZE \
  --file=$DATA_DIR/iot_influx.gz \
  | tee $RESULT_DIR/load_influx.log

./bin/tsbs_load_questdb \
  --file=$DATA_DIR/iot_questdb.gz \
  --workers=$WORKERS_NUM \
  --batch-size=$BATCH_SIZE \
  --ilp-bind-to=192.168.3.248:9009 \
  --url=http://192.168.3.248:9000/ \
  | tee $RESULT_DIR/load_questdb.log

./bin/tsbs_load_tdengine \
  --host=192.168.3.248 \
  --port=6030 \
  --user=root \
  --pass=taosdata \
  --db-name=tsbs_iot \
  --workers=$WORKERS_NUM \
  --batch-size=$BATCH_SIZE \
  --file=$DATA_DIR/iot_tdengine.gz \
  | tee $RESULT_DIR/load_tdengine.log

./bin/tsbs_load_timescaledb \
--host=$PGHOST \
--port=$PGPORT \
--user=$PGUSER \
--pass=$PGPASSWORD \
--db-name=tsbs_iot \
--workers=$WORKERS_NUM \
--batch-size=$BATCH_SIZE \
--file=$DATA_DIR/iot_timescaledb.gz \
| tee $RESULT_DIR/load_timescaledb.log


## 运行生成查询并且运行

```bash
./tsbs_iot_query_manager.sh --dbs influx
./tsbs_iot_query_manager.sh --dbs TDengine
./tsbs_iot_query_manager.sh --dbs timescaledb
./tsbs_iot_query_manager.sh --dbs questdb
```

./tsbs_iot_query_manager.sh --dbs TDengine --workers 4


##

```bash
# 第一次运行：生成查询并执行
./tsbs_iot_query_manager.sh --dbs TDengine --workers 8

# 后续运行：跳过生成，只执行查询（节省时间和资源）
./tsbs_iot_query_manager.sh --dbs TDengine --workers 8 --no-gen

# 仅生成查询，不执行
./tsbs_iot_query_manager.sh --dbs TDengine --no-run

# 仅执行查询，不生成
./tsbs_iot_query_manager.sh --dbs TDengine --no-gen
```

##


```bash
export START="2026-01-01T00:00:00Z"
export END="2026-01-21T00:00:00Z"    # 48h
export WORKERS_NUM=12
```

```bash
export SCALE=64
export START="2026-01-01T00:00:00Z"
export END="2026-01-20T00:00:00Z"    # 48h
export SEED=123
export DATA_DIR=./data_iot
export QUERY_DIR=./queries_iot
export RESULT_DIR=./results_iot

export BATCH_SIZE=10000
export QUERIES_NUM=1000
export WORKERS_NUM=8
export PGHOST=192.168.3.248
export PGPORT=5432
export PGUSER=postgres
export PGPASSWORD=tsbs

mkdir -p "$DATA_DIR"
mkdir -p "$RESULT_DIR"
mkdir -p "$QUERY_DIR"

export TSBS_BIN_DIR=./bin
export QUERIES_PER_TYPE=100
export FORMAT=influx
```

## 总脚本

```bash

./tsbs_iot_benchmark.sh --workers 4,8,12,16 --dbs TDengine

./tsbs_iot_benchmark.sh --workers 4,8,12,16 --dbs questdb

./tsbs_iot_benchmark.sh --workers 4,8,12,16 --dbs timescaledb

./tsbs_iot_benchmark.sh --workers 4,8,12,16 --dbs influx
```

```bash
# 测试 TDengine，worker 数量为 4, 8, 12, 16
./tsbs_iot_benchmark.sh --workers 4,8,12,16 --dbs tdengine

# 测试 QuestDB，单个 worker 数量
./tsbs_iot_benchmark.sh --workers 8 --dbs questdb

# 跳过导入，仅运行查询
./tsbs_iot_benchmark.sh --workers 4,8 --dbs tdengine --skip-load

# 跳过查询，仅运行导入
./tsbs_iot_benchmark.sh --workers 4,8 --dbs influx --skip-query

# 自定义参数
./tsbs_iot_benchmark.sh --workers 4,8,16 --dbs timescaledb \
  --batch-size 5000 \
  --data-dir ./my_data \
  --result-dir ./my_results
```

生成的文件在 ： /data/lintao/tsbs/result_iot_<N>_worker 
不同梯度不同文件


export RESULT_DIR_BASE=./results_iot_questdball