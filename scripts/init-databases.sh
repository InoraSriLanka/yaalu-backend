#!/bin/bash
# Creates all the databases needed by the microservices.
# This script runs automatically on first start of the postgres container
# (mounted into /docker-entrypoint-initdb.d/).

set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE yaalu_products;
    CREATE DATABASE yaalu_orders;
    CREATE DATABASE yaalu_payments;
    CREATE DATABASE yaalu_notifications;
EOSQL
