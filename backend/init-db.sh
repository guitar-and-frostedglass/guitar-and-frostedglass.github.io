#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE gfg_dev;
    CREATE DATABASE gfg_prod;
EOSQL
