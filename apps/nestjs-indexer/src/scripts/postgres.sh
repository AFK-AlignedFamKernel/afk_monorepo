#!/bin/bash
set -e

SERVER="afk-indexer";
USER="postgres"
PW="postgres";
DB="indexer";

echo "echo stop & remove old docker [$SERVER] and starting new fresh instance of [$SERVER]"
(docker kill $SERVER || :) && \
  (docker rm $SERVER || :) && \
  docker run --name $SERVER -e POSTGRES_USER=$USER \
  -e POSTGRES_PASSWORD=$PW \
  -p 5432:5432 \
  -d postgres

# wait for pg to start
echo "sleep wait for pg-server [$SERVER] to start";
sleep 10;

# create the db 
docker exec $SERVER psql -U postgres -c "CREATE DATABASE $DB;"
echo "\l" | docker exec -i $SERVER psql -U postgres

echo "postgres database created."
