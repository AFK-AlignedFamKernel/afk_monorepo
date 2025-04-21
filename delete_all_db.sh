#!/bin/bash

# Function to delete a database
delete_database() {
    local db_name=$1
    local port=$2
    
    echo "Deleting database: $db_name on port $port"
    PGPASSWORD=postgres psql -h localhost -p $port -U postgres -d $db_name -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
    
    if [ $? -eq 0 ]; then
        echo "Successfully deleted $db_name"
    else
        echo "Failed to delete $db_name"
    fi
}

# List of databases and their ports
declare -A databases=(
    ["indexer"]="5434"
    ["data-backend"]="5433"
)

# Delete each database
for db in "${!databases[@]}"; do
    delete_database "$db" "${databases[$db]}"
done

echo "All databases have been processed" 