---
title: "TSBS测试"
published: 2025-08-21
description: "TSBS测试"
tags:
  - "C/C++"
category: "编程"
draft: false
author: "Lonnie iTheds"
---
# TSBS测试

TSBS（Time Series Benchmark Suite）是由 Timescale（TimescaleDB 的公司）主导的一个开源基准测试套件，用来评测不同时间序列/时序型数据库在 数据写入（ingestion）、查询（query workloads） 等方面的性能。它的目标是提供统一的数据生成方式与一组可比的查询场景，使得诸如 TimescaleDB、InfluxDB、ClickHouse、QuestDB、VictoriaMetrics、MongoDB（作为对比）等系统之间的测试更客观。

## 目的

安装 TSBS， 并且测试 InfluxDB、TimescaleDB、QuestDB、 TDengine 。

## 测试参数

测试参数的调配主要包括 `workers`、导入数据时的 `batch-size`、生成查询语句中的 `queries`。

其作用主要为：
1. workers - 并发工作线程数
  作用：
  控制并行执行的线程/进程数量
  影响数据加载和查询执行的并发度
  直接影响CPU 利用率和整体吞吐量
2. batch-size - 批量插入大小
  作用：
  控制每次批量写入的记录条数
  平衡内存占用和写入效率
  影响网络往返次数和数据库事务大小
3. queries - 查询语句数量
  作用：
  决定生成多少条测试查询
  影响基准测试的统计可靠性
  决定测试运行时长

```bash
./bin/tsbs_load_questdb \
  --file=$DATA_DIR/devops_questdb.gz \
  --workers=8 \
  --batch-size=$BATCH_SIZE \
  --url=http://127.0.0.1:9000/ \
  | tee $RESULT_DIR/load_questdb.log

./bin/tsbs_generate_queries \
  --use-case=devops --seed=$SEED --scale=$SCALE \
  --timestamp-start=$START --timestamp-end=$END \
  --queries=1000 --format=influx \
  $(printf ' --query-type=%s' "${QUERY_TYPES[@]}") \
  --file=$QUERY_DIR/queries_influx.gz
```

## 步骤

### 安装 TDengine client

```bash
# 示例（其实安装客户端即可，但这里使用了服务包）
https://www.tdengine.com/assets-download/3.0/TDengine-server-3.3.6.13-Linux-x64.rpm
# client
https://www.tdengine.com/assets-download/3.0/TDengine-client-3.3.6.13-Linux-x64.tar.gz

sudo dnf install -y ./TDengine-client-3.3.6.13-Linux-x64.rpm
```

### 安装目标数据库 docker 版本并启动

```bash
# TimescaleDB
docker run -d --name tsdb \
  -e POSTGRES_PASSWORD=tsbs \
  -p 5432:5432 \
  timescale/timescaledb:latest-pg16

# InfluxDB 1.8（如用 2.x 请提前说明）
docker run -d --name influx -p 8086:8086 influxdb:1.8

# QuestDB
docker run -d --name questdb \
  -p 9000:9000 -p 9009:9009 -p 8812:8812 \
  questdb/questdb:latest

# TDengie
docker run -d --name tdengine -p 6030:6030 -p 6041:6041 tdengine/tdengine:latest
```

假设需要进行一次性运行：
```bash
docker run -d --name tsdb   -e POSTGRES_PASSWORD=tsbs -p 5432:5432 timescale/timescaledb:latest-pg16
docker run -d --name influx  -p 8086:8086 influxdb:1.8
docker run -d --name questdb -p 9009:9009 -p 8812:8812 questdb/questdb:latest
```

运行后如果关闭需要启动：
```bash
docker start tsdb influx questdb tdengine
```

```bash
docker run -d --name tsdb -p 5432:5432 -e POSTGRES_PASSWORD=tsbs timescale/timescaledb:latest-pg16
```

查验:
```bash
docker ps
CONTAINER ID   IMAGE                               COMMAND                  CREATED         STATUS         PORTS                                                                                                                             NAMES
992d59cb5be6   timescale/timescaledb:latest-pg16   "docker-entrypoint.s…"   2 seconds ago   Up 2 seconds   0.0.0.0:5432->5432/tcp, :::5432->5432/tcp                                                                                         tsdb
2af7ba0f9489   questdb/questdb:latest              "/docker-entrypoint.…"   3 days ago      Up 2 days      0.0.0.0:8812->8812/tcp, :::8812->8812/tcp, 0.0.0.0:9000->9000/tcp, :::9000->9000/tcp, 0.0.0.0:9009->9009/tcp, :::9009->9009/tcp   questdb
5ae38264d97a   influxdb:1.8                        "/entrypoint.sh infl…"   3 days ago      Up 2 days      0.0.0.0:8086->8086/tcp, :::8086->8086/tcp                                                                                         influx                                                                                       influx
```

版本备案：
```bash
docker images --digests | grep -E "tdengine|timescale|questdb|influxdb"
questdb/questdb                      latest         sha256:c7f8077aaa337afaa034e0141f2eb22ba8405078483921b2f38b3127767c9e13   ce568334825b   8 weeks ago     178MB
timescale/timescaledb                latest-pg16    sha256:8d199415beb2f56d7655fc096521e1259430aed1dd156b15493ec57dea704fe0   418359e64e22   2 months ago    1.01GB
tdengine/tdengine                    latest         sha256:79d32ce8a42f64c7dbfc33946a36b3e176ea23c0cd695a1bc9e8aa889ca03b88   0270c5b10020   3 months ago    947MB
influxdb                             1.8            sha256:299ebda2c7e308dbef42e26ac9b8fd1d9b3bcb8a0aee80c6509aa0219c1d0290   899f8d89099b   14 months ago   307MB

docker pull tdengine/tdengine@sha256:79d32ce8a42f64c7dbfc33946a36b3e176ea23c0cd695a1bc9e8aa889ca03b88
```

### 安装 tsbs

建议直接拉 itheds 的库 git@github.com:iTheds/tsbs.git

```bash
cd tsbs/
git clone https://github.com/timescale/tsbs.git
cd tsbs/

go version
go env GOPROXY GOSUMDB GOPRIVATE GONOSUMDB GONOPROXY GOINSECURE
go env -w GOPROXY=https://goproxy.cn
go env -w GOPRIVATE=
go env -w GONOPROXY=
go env -w GONOSUMDB=
go env -w GOPROXY=https://goproxy.cn
go env -w GOSUMDB=sum.golang.org
go env GOPROXY GOSUMDB GOPRIVATE GONOPROXY
go clean -cache -modcache
curl -I https://goproxy.cn
```

```bash
go mod download -x 2>&1 | tee mod_download.log
time go build -v ./cmd/tsbs_generate_data
mkdir -p bin
for d in cmd/*; do n=$(basename "$d"); echo "===> $n"; go build -o bin/$n "./cmd/$n" || exit 1; done

go mod tidy
```

```bash
#!/usr/bin/env bash
set -euo pipefail

# --------------------------------------------------------------------
# 可配置参数
GOOS_ARG="${GOOS:-}"        # 允许在外部: GOOS=linux ./build_all.sh
GOARCH_ARG="${GOARCH:-}"    # 允许在外部: GOARCH=amd64 ./build_all.sh
PARALLEL="${PARALLEL:-1}"   # 并行度: 默认顺序。设为 $(nproc) 可加速
EXCLUDE_REGEX="${EXCLUDE_REGEX:-/adapter$}"  # 例: 排除 adapter 可执行。留空表示不过滤
LD_FLAGS='-s -w'            # 可追加版本信息 -X 变量
OUT_DIR="bin"
# --------------------------------------------------------------------

echo "[info] 输出目录: $OUT_DIR"
mkdir -p "$OUT_DIR"

echo "[info] 收集 main 包..."
PKGS=$(go list -f '{{if eq .Name "main"}}{{.ImportPath}}{{end}}' ./cmd/... | grep -v '^$')

# 过滤（可选）
if [[ -n "$EXCLUDE_REGEX" ]]; then
  PKGS=$(echo "$PKGS" | grep -Ev "$EXCLUDE_REGEX" || true)
fi

echo "[info] 需要构建的包列表:"
echo "$PKGS" | sed 's/^/  - /'

build_one () {
  pkg="$1"
  name=$(basename "$pkg")
  out="$OUT_DIR/$name"
  echo "[build] $pkg -> $out"
  if [[ -n "$GOOS_ARG" && -n "$GOARCH_ARG" ]]; then
    GOOS="$GOOS_ARG" GOARCH="$GOARCH_ARG" go build -trimpath -ldflags "$LD_FLAGS" -o "$out" "$pkg"
  else
    go build -trimpath -ldflags "$LD_FLAGS" -o "$out" "$pkg"
  fi
}

export -f build_one
export OUT_DIR GOOS_ARG GOARCH_ARG LD_FLAGS

if [[ "$PARALLEL" -le 1 ]]; then
  echo "[info] 顺序构建..."
  while read -r p; do
    [[ -z "$p" ]] && continue
    build_one "$p"
  done <<< "$PKGS"
else
  echo "[info] 并行构建 (并发=$PARALLEL)..."
  # 需要 bash + xargs 支持
  echo "$PKGS" | xargs -I{} -P "$PARALLEL" bash -c 'build_one "$@"' _ {}
fi

echo "[info] 生成 SHA256 清单..."
if command -v sha256sum >/dev/null 2>&1; then
  (cd "$OUT_DIR" && sha256sum * > manifest.sha256)
elif command -v shasum >/dev/null 2>&1; then
  (cd "$OUT_DIR" && shasum -a 256 * > manifest.sha256)
fi

echo "[done] 全部构建完成."
```


```bash
chmod +x build_all.sh
# 顺序构建，排除 /adapter（默认）
./build_all.sh

# Linux amd64 并行构建（比如 8 核）
PARALLEL=8 GOOS=linux GOARCH=amd64 ./build_all.sh
```

### 统一进行配置

对环境变量进行设置：
```bash
export SCALE=64
export START="2024-01-01T00:00:00Z"
export END="2024-01-03T00:00:00Z"    # 48h
export SEED=123
export DATA_DIR=./data
export QUERY_DIR=./queries
export RESULT_DIR=./results

export BATCH_SIZE=10000
export QUERIES_NUM=1000
export WORKERS_NUM=8
export PGHOST=127.0.0.1
export PGPORT=5432
export PGUSER=postgres
export PGPASSWORD=tsbs

mkdir -p "$DATA_DIR"
mkdir -p "$RESULT_DIR"
mkdir -p "$QUERY_DIR"

export TSBS_BIN_DIR=./bin
export QUERY_TYPES="cpu-max-all-1 cpu-max-all-8 lastpoint"
export QUERIES_PER_TYPE=100
export FORMAT=influx

# 当前弃用，目前是脚本设定
export QUERY_TYPES=(
cpu-max-all-1
cpu-max-all-8
cpu-max-all-32-24
high-cpu-1
high-cpu-all
double-groupby-1
double-groupby-5
double-groupby-all
single-groupby-1-1-1
single-groupby-1-1-12
single-groupby-5-1-1
single-groupby-5-1-12
single-groupby-1-8-1
single-groupby-5-8-1
groupby-orderby-limit
lastpoint
)
```

#### iot 配置

对环境变量进行设置：
```bash
export SCALE=64
export START="2026-01-01T00:00:00Z"
export END="2026-01-31T00:00:00Z"    # 48h
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

### 生成数据

```bash
# TimescaleDB
./bin/tsbs_generate_data \
  --use-case=devops --seed=$SEED --scale=$SCALE \
  --timestamp-start=$START --timestamp-end=$END \
  --log-interval=10s --format=timescaledb \
  --file=$DATA_DIR/devops_timescaledb.gz

# InfluxDB
./bin/tsbs_generate_data \
  --use-case=devops --seed=$SEED --scale=$SCALE \
  --timestamp-start=$START --timestamp-end=$END \
  --log-interval=10s --format=influx \
  --file=$DATA_DIR/devops_influx.gz

# QuestDB
./bin/tsbs_generate_data \
  --use-case=devops --seed=$SEED --scale=$SCALE \
  --timestamp-start=$START --timestamp-end=$END \
  --log-interval=10s --format=questdb \
  --file=$DATA_DIR/devops_questdb.gz

./bin/tsbs_generate_data \
  --use-case=devops --seed=$SEED --scale=$SCALE \
  --timestamp-start=$START --timestamp-end=$END \
  --log-interval=10s --format=TDengine \
  --file=$DATA_DIR/devops_tdengine.gz

ls -lh $DATA_DIR
```

其生成的场景是 devops 即模拟的 cpu 场景下、采集的 cpu 相关的度量数据作为本次的测试数据。

#### iot 生成数据

```
# TimescaleDB
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

### 导入数据

```bash
curl -G http://192.168.3.248:8086/query --data-urlencode "q=CREATE DATABASE tsbs_devops" || true
./bin/tsbs_load_influx \
  --urls=http://192.168.3.248:8086 \
  --db-name=tsbs_devops \
  --replication-factor=1 \
  --workers=$WORKERS_NUM --batch-size=$BATCH_SIZE \
  --file=$DATA_DIR/devops_influx.gz \
  | tee $RESULT_DIR/load_influx.log

./bin/tsbs_load_questdb \
  --file=$DATA_DIR/devops_questdb.gz \
  --workers=$WORKERS_NUM \
  --batch-size=$BATCH_SIZE \
  --ilp-bind-to=192.168.3.248:9009 \
  --url=http://192.168.3.248:9000/ \
  | tee $RESULT_DIR/load_questdb.log

./bin/tsbs_load_tdengine \
  --host=127.0.0.1 \
  --port=6030 \
  --user=root \
  --pass=taosdata \
  --db-name=tsbs_devops \
  --workers=$WORKERS_NUM \
  --batch-size=$BATCH_SIZE \
  --file=$DATA_DIR/devops_tdengine.gz \
  | tee $RESULT_DIR/load_tdengine.log
```

influx 和 questdb 似乎导入数据成功了。

解决问题 `replication_factor` 旧版字段问题(详见 Q&A)后运行：

```bash
createdb tsbs_devops

./bin/tsbs_load_timescaledb \
  --postgres="host=$PGHOST port=$PGPORT user=$PGUSER password=$PGPASSWORD dbname=tsbs_devops sslmode=disable" \
  --workers=$WORKERS_NUM --batch-size=$BATCH_SIZE \
  --file=$DATA_DIR/devops_timescaledb.gz \
  | tee $RESULT_DIR/load_timescaledb.log
```

#### iot 导入数据

```bash
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

```

createdb tsbs_iot


### 生成查询文件

生成查询文件由于 bash 对数组支持不尽相同，导致 QUERY_TYPES 被覆盖下述命令只能生成一种查询类型。因此生成和运行都交给脚本 `tsbs_query_manager.sh`。

> 注意：当前脚本中设置了 workers 的数量，如需要设置，请直接修改脚本。

```bash
./tsbs_query_manager.sh --dbs influx
./tsbs_query_manager.sh --dbs TDengine
./tsbs_query_manager.sh --dbs questdb
./tsbs_query_manager.sh --dbs timescaledb
```

以下命令无需执行，只是作为基础备份。

```bash
./bin/tsbs_generate_queries \
  --use-case=devops --seed=$SEED --scale=$SCALE \
  --timestamp-start=$START --timestamp-end=$END \
  --queries=$QUERIES_NUM --format=influx \
  $(printf ' --query-type=%s' "${QUERY_TYPES[@]}") \
  --file=$QUERY_DIR/queries_influx.gz

./bin/tsbs_generate_queries \
  --use-case=devops --seed=$SEED --scale=$SCALE \
  --timestamp-start=$START --timestamp-end=$END \
  --queries=$QUERIES_NUM --format=questdb \
  $(printf ' --query-type=%s' "${QUERY_TYPES[@]}") \
  --file=$QUERY_DIR/queries_questdb.gz

./bin/tsbs_generate_queries \
  --use-case=devops --seed=$SEED --scale=$SCALE \
  --timestamp-start=$START --timestamp-end=$END \
  --queries=$QUERIES_NUM --format=timescaledb \
  $(printf ' --query-type=%s' "${QUERY_TYPES[@]}") \
  --file=$QUERY_DIR/queries_timescaledb.gz

./bin/tsbs_generate_queries \
  --use-case=devops --seed=$SEED --scale=$SCALE \
  --timestamp-start=$START --timestamp-end=$END \
  --queries=$QUERIES_NUM --format=TDengine \
  $(printf ' --query-type=%s' "${QUERY_TYPES[@]}") \
  --file=$QUERY_DIR/queries_tdengine.gz

ls -lh $QUERY_DIR
```

#### iot 场景:

```bash
./tsbs_iot_query_manager.sh --dbs influx
./tsbs_iot_query_manager.sh --dbs TDengine
./tsbs_iot_query_manager.sh --dbs timescaledb
./tsbs_iot_query_manager.sh --dbs questdb
```

### 运行测试 备份内容

无需执行，都已经包括在脚本 tsbs_query_manager.h

```bash
./bin/tsbs_run_queries_influx \
  --urls=http://localhost:8086 \
  --db-name=tsbs_devops \
  --workers=8 \
  --file=$QUERY_DIR/queries_influx.gz \
  > $RESULT_DIR/queries_influx.txt

./bin/tsbs_run_queries_questdb \
  --urls=http://localhost:9000 \
  --workers=8 \
  --file=$QUERY_DIR/queries_questdb.gz \
  --print-interval=100 \
  > $RESULT_DIR/queries_questdb.txt

./bin/tsbs_run_queries_timescaledb \
  --postgres="host=$PGHOST port=$PGPORT user=$PGUSER password=$PGPASSWORD dbname=tsbs_devops sslmode=disable" \
  --workers=8 \
  --file=$QUERY_DIR/queries_timescaledb.gz \
  > $RESULT_DIR/queries_timescaledb.txt

./bin/tsbs_run_queries_tdengine \
  --host=127.0.0.1 --port=6030 \
  --user=root --pass=taosdata \
  --db-name=tsbs_devops \
  --workers=8 \
  --file=$QUERY_DIR/queries_tdengine.gz \
  > $RESULT_DIR/queries_tdengine.txt
```

#### iot 场景

```bash
./bin/tsbs_run_queries_influx \
  --urls=http://localhost:8086 \
  --db-name=tsbs_iot \
  --workers=8 \
  --file=$QUERY_DIR/queries_influx.gz \
  > $RESULT_DIR/queries_influx.txt

./bin/tsbs_run_queries_questdb \
  --urls=http://localhost:9000 \
  --workers=8 \
  --file=$QUERY_DIR/queries_questdb.gz \
  --print-interval=100 \
  > $RESULT_DIR/queries_questdb.txt

./bin/tsbs_run_queries_timescaledb \
  --postgres="host=$PGHOST port=$PGPORT user=$PGUSER password=$PGPASSWORD dbname=tsbs_iot sslmode=disable" \
  --workers=8 \
  --file=$QUERY_DIR/queries_timescaledb.gz \
  > $RESULT_DIR/queries_timescaledb.txt

./bin/tsbs_run_queries_tdengine \
  --host=127.0.0.1 --port=6030 \
  --user=root --pass=taosdata \
  --db-name=tsbs_iot \
  --workers=8 \
  --file=$QUERY_DIR/queries_tdengine.gz \
  > $RESULT_DIR/queries_tdengine.txt
```

### 生成报告


## docker 远程迁移

docker save -o all-images.tar \
  tdengine/tdengine:latest \
  timescale/timescaledb:latest-pg16 \
  questdb/questdb:latest \
  influxdb:1.8

docker load -i all-images.tar

### tsbs 服务器:

```
245
inspur
qwe123qwe123
```

### 存储数据库：

```
248
root
1q2w3e123
```


## Q&A

### replication_factor 问题

./bin/tsbs_load_timescaledb \
  --postgres="host=$PGHOST port=$PGPORT user=$PGUSER password=$PGPASSWORD dbname=tsbs_devops sslmode=disable" \
  --workers=8 --batch-size=$BATCH_SIZE \
  --file=$DATA_DIR/devops_timescaledb.gz \
  | tee $RESULT_DIR/load_timescaledb.log
could not execute sql: SELECT create_hypertable('cpu'::regclass, 'time'::name, replication_factor => NULL, chunk_time_interval => 43200000000, create_default_indexes=>FALSE)panic: ERROR: function create_hypertable(regclass, name, replication_factor => unknown, chunk_time_interval => bigint, create_default_indexes => boolean) does not exist (SQLSTATE 42883)

修改源码：
```go
func (d *dbCreator) createTableAndIndexes(dbBench *sql.DB, tableName string, fieldDefs []string, indexDefs []string) {
	// We default to the tags_id column unless users are creating the
	// name/hostname column in the time-series table for multi-node
	// testing. For distributed queries, pushdown of JOINs is not yet
	// supported.
	var partitionColumn string = "tags_id"

	if d.opts.InTableTag {
		partitionColumn = tableCols[tagsKey][0]
	}

	MustExec(dbBench, fmt.Sprintf("DROP TABLE IF EXISTS %s", tableName))
	MustExec(dbBench, fmt.Sprintf("CREATE TABLE %s (time timestamptz, tags_id integer, %s, additional_tags JSONB DEFAULT NULL)", tableName, strings.Join(fieldDefs, ",")))
	if d.opts.PartitionIndex {
		MustExec(dbBench, fmt.Sprintf("CREATE INDEX ON %s(%s, \"time\" DESC)", tableName, partitionColumn))
	}

	// Only allow one or the other, it's probably never right to have both.
	// Experimentation suggests (so far) that for 100k devices it is better to
	// use --time-partition-index for reduced index lock contention.
	if d.opts.TimePartitionIndex {
		MustExec(dbBench, fmt.Sprintf("CREATE INDEX ON %s(\"time\" DESC, %s)", tableName, partitionColumn))
	} else if d.opts.TimeIndex {
		MustExec(dbBench, fmt.Sprintf("CREATE INDEX ON %s(\"time\" DESC)", tableName))
	}

	for _, indexDef := range indexDefs {
		MustExec(dbBench, indexDef)
	}

	if d.opts.UseHypertable {
		var creationCommand string = "create_hypertable"
		var partitionsOption string = "replication_factor => NULL"

		MustExec(dbBench, "CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE")

		// Replication factor determines whether we create a distributed hypertable
		// or not. If it is unset or zero, then we will create a regular
		// hypertable with no partitions.
		//
		// If replication factor is greater >= 1, we assume there are at least multiple
		// data nodes. We currently use `create_hypertable` for both statements, the
		// default behavior is to create a distributed hypertable if `replication_factor`
		// is >= 1

		// We assume a single partition hypertable. This provides an option to test
		// partitioning on regular hypertables
		if d.opts.NumberPartitions > 0 {
			partitionsOption = fmt.Sprintf("partitioning_column => '%s'::name, number_partitions => %v::smallint", partitionColumn, d.opts.NumberPartitions)
		}

		// This gives us a future option of testing the impact of
		// multi-node replication across data nodes
		if d.opts.ReplicationFactor > 0 {
			partitionsOption = fmt.Sprintf("partitioning_column => '%s'::name, replication_factor => %v::smallint", partitionColumn, d.opts.ReplicationFactor)
		}

		// ORIGINAL (single attempt) version was:
		// MustExec(dbBench,
		//     fmt.Sprintf("SELECT %s('%s'::regclass, 'time'::name, %s, chunk_time_interval => %d, create_default_indexes=>FALSE)",
		//         creationCommand, tableName, partitionsOption, d.opts.ChunkTime.Nanoseconds()/1000))
		//
		// We now add a backwards/forwards compatible fallback sequence for newer TimescaleDB versions
		// where integer microseconds + replication_factor parameter in create_hypertable may be removed or changed.
		//
		// Strategy:
		//   1. Try the original (old) signature (integer microseconds).
		//   2. If it fails, try the new style using INTERVAL 'X microseconds'.
		//   3. If replication_factor > 0 also try create_distributed_hypertable (new API) after old attempt.
		//
		// We preserve variable names and structure to minimize diff footprint.

		chunkUS := d.opts.ChunkTime.Nanoseconds() / 1000

		// Collect candidate SQL statements (ordered: old -> new)
		candidates := make([]string, 0, 3)

		// Old style (what the original code used)
		oldSQL := fmt.Sprintf(
			"SELECT %s('%s'::regclass, 'time'::name, %s, chunk_time_interval => %d, create_default_indexes=>FALSE)",
			creationCommand, tableName, partitionsOption, chunkUS)
		candidates = append(candidates, oldSQL)

		// New style (INTERVAL) for non-distributed & distributed alike (create_hypertable)
		// Build a minimally adapted partitions fragment for the new form (remove ::name casts where safe)
		// We reuse the intent of partitionsOption but must adapt because new versions expect plain identifiers.
		// Simplistic rewrite: just re-create a parallel option string.
		var newStyleParts string
		if d.opts.ReplicationFactor > 0 {
			// distributed path (new create_distributed_hypertable will be separate)
			newStyleParts = fmt.Sprintf("partitioning_column => '%s', replication_factor => %d", partitionColumn, d.opts.ReplicationFactor)
		} else if d.opts.NumberPartitions > 0 {
			newStyleParts = fmt.Sprintf("partitioning_column => '%s', number_partitions => %d", partitionColumn, d.opts.NumberPartitions)
		} else {
			// nothing (explicit replication_factor=>NULL no longer needed)
			newStyleParts = ""
		}
		// Only append comma if we actually have partition options
		newPartsFragment := ""
		if newStyleParts != "" {
			newPartsFragment = ", " + newStyleParts
		}
		newSQL := fmt.Sprintf(
			"SELECT create_hypertable('%s','time'%s, chunk_time_interval => INTERVAL '%d microseconds', create_default_indexes=>FALSE)",
			tableName, newPartsFragment, chunkUS)
		candidates = append(candidates, newSQL)

		// If replication factor > 0 add explicit create_distributed_hypertable attempt (new API)
		if d.opts.ReplicationFactor > 0 {
			distSQL := fmt.Sprintf(
				"SELECT create_distributed_hypertable('%s','time', partitioning_column => '%s', replication_factor => %d, chunk_time_interval => INTERVAL '%d microseconds', create_default_indexes=>FALSE)",
				tableName, partitionColumn, d.opts.ReplicationFactor, chunkUS)
			candidates = append(candidates, distSQL)
		}

		var lastErr error
		for i, stmt := range candidates {
			if _, err := dbBench.Exec(stmt); err != nil {
				lastErr = err
				if i < len(candidates)-1 {
					continue
				}
			} else {
				lastErr = nil
				break
			}
		}
		if lastErr != nil {
			// Mirror MustExec style termination
			log.Fatalf("failed to create hypertable for table %s (all attempts). last error: %v\nTried:\n%s",
				tableName, lastErr, strings.Join(candidates, ";\n"))
		}
	}
}
```

部分编译即可：

```bash
go build -o bin/tsbs_load_timescaledb ./cmd/tsbs_load_timescaledb

# or

go build -o ./bin/tsbs_load_questdb ./cmd/tsbs_load_questdb
go build -o ./bin/tsbs_run_queries_questdb ./cmd/tsbs_run_queries_questdb
```

### questdb iot 不支持

生成查询文件期间：
```
./bin/tsbs_generate_queries --use-case iot --format questdb --queries 1 --query-type avg-load --file /tmp/queries_questdb_avg-load.gz

error: use case 'iot' not implemented for format 'questdb'
```

./bin/tsbs_load_questdb \
  --file=$DATA_DIR/devops_questdb.gz \
  --workers=8 \
  --batch-size=$BATCH_SIZE \
  --url=http://127.0.0.1:9000/ \
  | tee $RESULT_DIR/load_questdb.log

./bin/tsbs_generate_queries \
  --use-case=devops --seed=$SEED --scale=$SCALE \
  --timestamp-start=$START --timestamp-end=$END \
  --queries=1000 --format=questdb \
  --query-type=high-cpu-1 \
  --file=$QUERY_DIR/queries_questdb.gz

./bin/tsbs_run_queries_questdb --urls="http://localhost:9000" --workers="8" --file="./queries/queries_questdb_high-cpu-1.gz" --print-interval="100"

ok。。

导入的时候显示已经存在 cpu 表格， 即使导入的是 iot 的表格。

```
./bin/tsbs_load_questdb \
  --file=$DATA_DIR/iot_questdb.gz \
  --workers=8 \
  --batch-size=$BATCH_SIZE \
  --url=http://127.0.0.1:9000/ \
  | tee $RESULT_DIR/load_questdb.log

./bin/tsbs_generate_queries \
  --use-case=iot --seed=$SEED --scale=$SCALE \
  --timestamp-start=$START --timestamp-end=$END \
  --queries=1000 --format=questdb \
  --query-type=avg-load \
  --file=$QUERY_DIR/queries_questdb_avg-load.gz

./bin/tsbs_run_queries_questdb --urls=http://localhost:9000 --workers=8 --file=./queries_iot/queries_questdb_avg-load.gz --print-interval=100


./bin/tsbs_run_queries_questdb \
  --urls=http://localhost:9000/exec \
  --workers=8 \
  --file=$QUERY_DIR/queries_questdb_avg-load.gz \
  --print-interval=100 \
  > $RESULT_DIR/queries_questdb.txt


curl -i "http://localhost:9000/exec?query=select%201"
```

删除数据之后也会出错。

```
docker exec -it questdb bash
rm -rf /var/lib/questdb/*
exit
docker restart questdb
```

发现是其 iot 语法问题，于是重新为 tsbs 添加支持，当前版本记录在 itheds 仓库中。
但是需要注意，由于 questdb 的语法问题， having 关键字大部分被修改为 where 代替，并且设置的嵌套语句数目强行增多，基准测试可能并不理想。

## 附件资料

### 核心组成

1. 数据生成器
   通过 `tsbs_generate_data` 根据某个 use case（例如 devops）模拟产生大量时间序列点。  
2. 查询生成器
   通过 `tsbs_generate_queries` 生成多种类型的查询（聚合、group by、lastpoint、time interval、high/low CPU 等）。  
3. 针对不同数据库的加载与执行工具
   例如：`tsbs_load_timescaledb`、`tsbs_run_queries_timescaledb`，或对应 Influx、ClickHouse 等的加载/查询执行器。  

### 工作流程示例（TimescaleDB）

```bash
# 1. 生成数据（示例：devops，规模 scale=10，采样间隔 10s，格式为 timescaledb）
tsbs_generate_data \
  --use-case=devops \
  --scale=10 \
  --seed=123 \
  --sampling-interval=10s \
  --format=timescaledb > /tmp/devops-data.sql

# 2. 加载数据到 TimescaleDB
tsbs_load_timescaledb \
  --host=localhost \
  --port=5432 \
  --user=postgres \
  --pass=你的密码 \
  --db-name=benchmark \
  --workers=4 < /tmp/devops-data.sql

# 3. 生成查询（例如 1000 个 lastpoint 查询）
tsbs_generate_queries \
  --use-case=devops \
  --scale=10 \
  --queries=1000 \
  --query-type=lastpoint \
  --format=timescaledb > /tmp/queries.sql

# 4. 执行查询并统计性能
tsbs_run_queries_timescaledb \
  --workers=4 < /tmp/queries.sql
```

### 常见查询类型

- lastpoint（每主机最后一个数据点）
- groupby-agg（在时间窗口上做聚合）
- agg-over-time（单指标聚合）
- cpu-max / high-cpu（查最高 CPU 的时间段或主机）
- single-host / multi-host 比较
具体类型会随版本丰富。

### 指标与结果

通常输出：
- 吞吐：数据写入速率（行/秒）
- 查询延迟分布（平均、P95、P99）
- QPS（queries per second）
用于横向对比不同数据库或不同参数调优结果。

### 与其它基准对比

| 基准           | 侧重点        | 场景类型                 | 是否面向时序特性   |
| -------------- | ------------- | ------------------------ | ------------------ |
| TSBS           | 时序写入+查询 | 运维监控（主机指标）为主 | 是                 |
| TPC-H / TPC-DS | 决策分析 OLAP | 通用 BI/仓库             | 否（非专门时序）   |
| YCSB           | KV/文档存取   | NoSQL CRUD               | 部分（非专门时序） |
| Locust/JMeter  | 压测框架      | Web/API                  | 否                 |

### 使用建议

- 做数据库选型或容量规划时，先用 TSBS 的标准 use case 比较底座能力，再用真实数据集做二次验证。
- 调参（如连接数、批量写入大小、索引策略、压缩设置）时，用相同数据生成参数+查询集循环测试，记录版本与配置。

### 常见坑

1. Scale 与时间跨度：Scale 增大不仅是主机数增长，也会成倍增加数据行数，注意磁盘与加载时间。  
2. 查询与热数据：如果测试时把所有数据都放在内存缓存里，结果会过于乐观。  
3. 格式匹配：生成数据的 --format 必须与加载工具对应，否则无法解析。  
4. 并发 workers 设置过大：会出现数据库端连接争用，曲线反而下降。  
5. 没有记录版本/参数：导致后续结果不可复现。  

### iot 库表模型

diagnostics
readings

#### QuestDB

```sql
CREATE TABLE 'diagnostics' ( 
	name SYMBOL CAPACITY 256 CACHE INDEX CAPACITY 256,
	fleet SYMBOL CAPACITY 256 CACHE,
	driver SYMBOL CAPACITY 256 CACHE,
	model SYMBOL CAPACITY 256 CACHE,
	device_version SYMBOL CAPACITY 256 CACHE,
	load_capacity DOUBLE,
	fuel_capacity DOUBLE,
	nominal_fuel_consumption DOUBLE,
	fuel_state DOUBLE,
	current_load DOUBLE,
	status LONG,
	timestamp TIMESTAMP
) timestamp(timestamp) PARTITION BY DAY WAL
WITH maxUncommittedRows=500000, o3MaxLag=`600`000000us;

CREATE TABLE 'readings' ( 
	name SYMBOL CAPACITY 256 CACHE INDEX CAPACITY 256,
	fleet SYMBOL CAPACITY 256 CACHE INDEX CAPACITY 256,
	driver SYMBOL CAPACITY 256 CACHE,
	model SYMBOL CAPACITY 256 CACHE INDEX CAPACITY 256,
	device_version SYMBOL CAPACITY 256 CACHE,
	load_capacity DOUBLE,
	fuel_capacity DOUBLE,
	nominal_fuel_consumption DOUBLE,
	latitude DOUBLE,
	longitude DOUBLE,
	elevation DOUBLE,
	velocity DOUBLE,
	heading DOUBLE,
	grade DOUBLE,
	fuel_consumption DOUBLE,
	timestamp TIMESTAMP
) timestamp(timestamp) PARTITION BY DAY WAL
WITH maxUncommittedRows=500000, o3MaxLag=600000000us;
```

#### TimescaleDB

```sql
-- 创建数据库
CREATE DATABASE iot;

\c iot;

-- 启用 TimescaleDB 扩展
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- 创建标签表（优化存储，避免重复）
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    fleet TEXT,
    driver TEXT,
    model TEXT,
    device_version TEXT,
    UNIQUE(name, fleet, driver, model, device_version)
);

-- 1. 诊断数据表
CREATE TABLE IF NOT EXISTS diagnostics (
    time TIMESTAMPTZ NOT NULL,
    tags_id INTEGER NOT NULL,
    load_capacity DOUBLE PRECISION,
    fuel_capacity DOUBLE PRECISION,
    nominal_fuel_consumption DOUBLE PRECISION,
    fuel_state DOUBLE PRECISION,
    current_load DOUBLE PRECISION,
    status BIGINT
);

-- 2. 读数数据表
CREATE TABLE IF NOT EXISTS readings (
    time TIMESTAMPTZ NOT NULL,
    tags_id INTEGER NOT NULL,
    load_capacity DOUBLE PRECISION,
    fuel_capacity DOUBLE PRECISION,
    nominal_fuel_consumption DOUBLE PRECISION,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    elevation DOUBLE PRECISION,
    velocity DOUBLE PRECISION,
    heading DOUBLE PRECISION,
    grade DOUBLE PRECISION,
    fuel_consumption DOUBLE PRECISION
);

-- 转换为超表（hypertable）
SELECT create_hypertable('diagnostics', 'time', 
    chunk_time_interval => INTERVAL '8 hours',
    if_not_exists => TRUE
);

SELECT create_hypertable('readings', 'time', 
    chunk_time_interval => INTERVAL '8 hours',
    if_not_exists => TRUE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_diagnostics_tags_time 
    ON diagnostics (tags_id, time DESC);

CREATE INDEX IF NOT EXISTS idx_readings_tags_time 
    ON readings (tags_id, time DESC);

CREATE INDEX IF NOT EXISTS idx_tags_name 
    ON tags (name);

-- 添加外键约束（可选）
ALTER TABLE diagnostics 
    ADD CONSTRAINT fk_diagnostics_tags 
    FOREIGN KEY (tags_id) REFERENCES tags(id);

ALTER TABLE readings 
    ADD CONSTRAINT fk_readings_tags 
    FOREIGN KEY (tags_id) REFERENCES tags(id);

-- 启用压缩（可选，适合历史数据）
ALTER TABLE diagnostics SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'tags_id'
);

ALTER TABLE readings SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'tags_id'
);

-- 添加压缩策略（7天后自动压缩）
SELECT add_compression_policy('diagnostics', INTERVAL '7 days');
SELECT add_compression_policy('readings', INTERVAL '7 days');

-- 添加数据保留策略（可选，1年后自动删除）
SELECT add_retention_policy('diagnostics', INTERVAL '365 days');
SELECT add_retention_policy('readings', INTERVAL '365 days');
```

#### TDengine

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS iot 
    KEEP 365 
    DAYS 10 
    BLOCKS 6 
    UPDATE 0;

USE iot;

-- 1. 诊断数据超级表
CREATE STABLE IF NOT EXISTS diagnostics (
    ts TIMESTAMP,
    load_capacity DOUBLE,
    fuel_capacity DOUBLE,
    nominal_fuel_consumption DOUBLE,
    fuel_state DOUBLE,
    current_load DOUBLE,
    status BIGINT
) TAGS (
    name NCHAR(64),
    fleet NCHAR(64),
    driver NCHAR(64),
    model NCHAR(64),
    device_version NCHAR(64)
);

-- 2. 读数数据超级表
CREATE STABLE IF NOT EXISTS readings (
    ts TIMESTAMP,
    load_capacity DOUBLE,
    fuel_capacity DOUBLE,
    nominal_fuel_consumption DOUBLE,
    latitude DOUBLE,
    longitude DOUBLE,
    elevation DOUBLE,
    velocity DOUBLE,
    heading DOUBLE,
    grade DOUBLE,
    fuel_consumption DOUBLE
) TAGS (
    name NCHAR(64),
    fleet NCHAR(64),
    driver NCHAR(64),
    model NCHAR(64),
    device_version NCHAR(64)
);

-- 创建子表示例（每个设备创建对应的子表）
-- 假设有 truck_0 到 truck_99 共 100 辆卡车

CREATE TABLE IF NOT EXISTS diagnostics_truck_0 
    USING diagnostics 
    TAGS ('truck_0', 'South', 'Andy', 'H-2', 'v2.3');

CREATE TABLE IF NOT EXISTS readings_truck_0 
    USING readings 
    TAGS ('truck_0', 'South', 'Andy', 'H-2', 'v2.3');

CREATE TABLE IF NOT EXISTS diagnostics_truck_1 
    USING diagnostics 
    TAGS ('truck_1', 'North', 'Derek', 'G-2000', 'v1.5');

CREATE TABLE IF NOT EXISTS readings_truck_1 
    USING readings 
    TAGS ('truck_1', 'North', 'Derek', 'G-2000', 'v1.5');

-- ... 依此类推，为每个设备创建子表
```

#### InfluxDB

```sql
-- 1. 创建数据库
CREATE DATABASE iot;

-- 2. 切换到数据库
USE iot;

-- 3. 创建保留策略（可选）
CREATE RETENTION POLICY "one_year" ON "iot" 
    DURATION 365d 
    REPLICATION 1 
    SHARD DURATION 1d
    DEFAULT;

-- 4. 创建连续查询（可选，用于数据聚合）
CREATE CONTINUOUS QUERY "cq_diagnostics_1h" ON "iot"
BEGIN
  SELECT mean(fuel_state) AS mean_fuel_state,
         mean(current_load) AS mean_current_load
  INTO "diagnostics_1h"
  FROM "diagnostics"
  GROUP BY time(1h), name, fleet
END;

-- 5. 第一次写入数据（触发自动创建 measurement）
-- 这是 InfluxDB 真正"建表"的方式

-- diagnostics 表的第一条数据
INSERT diagnostics,name=truck_0,fleet=South,driver=Andy,model=H-2,device_version=v2.3 
    load_capacity=2000,
    fuel_capacity=150,
    nominal_fuel_consumption=12,
    fuel_state=0.8,
    current_load=1500,
    status=1i 
    1609459200000000000

-- readings 表的第一条数据
INSERT readings,name=truck_0,fleet=South,driver=Andy,model=H-2,device_version=v2.3 
    load_capacity=2000,
    fuel_capacity=150,
    nominal_fuel_consumption=12,
    latitude=40.7128,
    longitude=-74.0060,
    elevation=10.5,
    velocity=65.5,
    heading=180.0,
    grade=0.5,
    fuel_consumption=11.8 
    1609459200000000000
```