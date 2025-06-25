#!/bin/bash

# Database initialization script for Okami API
# This script ensures the database is properly set up with initial data

set -e

echo "🚀 Starting database initialization..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until pg_isready -h postgres -p 5432 -U okami_user -d okami_gym; do
  sleep 2
done

echo "✅ Database is ready!"

# Run Prisma operations if schema exists
if [ -f "/app/prisma/schema.prisma" ]; then
  echo "🔄 Running Prisma generate..."
  cd /app
  bun run db:generate
  
  echo "🔄 Pushing Prisma schema to database..."
  bun run db:push --accept-data-loss
fi

# Seed the database with initial users
echo "🌱 Seeding database with initial data..."
cd /app
bun run db:seed:users

echo "🎉 Database initialization completed!"

# Start the API server
echo "🚀 Starting API server..."
exec bun --hot src/index.ts 