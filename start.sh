#!/bin/sh
set -e

# Wait for PostgreSQL to be ready (simple wait, adjust as needed)
echo "Waiting for PostgreSQL to be ready..."
sleep 5

# Initialize the databases
node src/init-db.js

# Seed the databases
node src/seed.js

# Start the app
node src/index.js
