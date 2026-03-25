---
title: "Shenyang Config"
description: "project-tzdb-rebuild 文档整理稿（源：raw_snapshot/docs/TmSystem/shenyang_config.md）"
---

# config

# marcos

CPU=ARMV8A
ACOREMCOS_MCORE
ACOREMCOS_64BIT
BOARD=$(CONFIG_BOARD)
ACOREOS_CPP

## path

$(PLATFORM)/target/common/include/rtl
$(PLATFORM)/target/common/include/rtl/sys
$(PLATFORM)/target/acoreosmp/include/posix
$(PLATFORM)/target/acoreosmp/include
$(PLATFORM)/target/common/include
$(PLATFORM)/target/common/include/os
$(PLATFORM)/target/common/include/drv
$(PLATFORM)/target/common/include/arch
$(PLATFORM)/target/common/include/inet
$(PLATFORM)/target/common/include/inet/sys
"${workspace_loc:/${ProjName}/src/inc}"
"${workspace_loc:/${ProjName}/src/include}"
"${workspace_loc:/${ProjName}/src/tools/tzdb-odbc/inc}"
"${workspace_loc:/${ProjName}/src/tools/tzdb_fs/inc}"

# others

## dso_handle undefined

-fno-use-cxa-atexit
