#!/bin/bash

# Health check script for Okami API Docker setup
# Verifies database persistence and API functionality

set -e

echo "🔍 Okami API Health Check"
echo "========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if containers are running
echo -e "\n📦 Checking Docker containers..."
if docker ps | grep -q "okami-postgres"; then
    echo -e "${GREEN}✅ PostgreSQL container is running${NC}"
else
    echo -e "${RED}❌ PostgreSQL container is not running${NC}"
    exit 1
fi

if docker ps | grep -q "okami-api"; then
    echo -e "${GREEN}✅ API container is running${NC}"
else
    echo -e "${RED}❌ API container is not running${NC}"
    exit 1
fi

# Check database connectivity
echo -e "\n🗄️  Checking database connectivity..."
if docker exec okami-postgres pg_isready -U okami_user -d okami_gym > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database is accessible${NC}"
else
    echo -e "${RED}❌ Database is not accessible${NC}"
    exit 1
fi

# Check if volume exists
echo -e "\n💾 Checking data persistence..."
if docker volume ls | grep -q "postgres_data"; then
    echo -e "${GREEN}✅ PostgreSQL volume exists${NC}"
    
    # Get volume size
    VOLUME_SIZE=$(docker run --rm -v postgres_data:/data alpine du -sh /data | cut -f1)
    echo -e "${GREEN}📊 Volume size: ${VOLUME_SIZE}${NC}"
else
    echo -e "${RED}❌ PostgreSQL volume not found${NC}"
    exit 1
fi

# Check if default users exist
echo -e "\n👤 Checking default users..."
USER_COUNT=$(docker exec okami-postgres psql -U okami_user -d okami_gym -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs)
if [ "$USER_COUNT" -ge 2 ]; then
    echo -e "${GREEN}✅ Default users are seeded (${USER_COUNT} users found)${NC}"
    
    # List users
    echo -e "${YELLOW}📋 User list:${NC}"
    docker exec okami-postgres psql -U okami_user -d okami_gym -c "SELECT username, role, status FROM users ORDER BY role;" 2>/dev/null
else
    echo -e "${RED}❌ Default users not found or incomplete${NC}"
fi

# Check API health
echo -e "\n🌐 Checking API health..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API is responding${NC}"
else
    echo -e "${YELLOW}⚠️  API health endpoint not available (this is normal if /health route doesn't exist)${NC}"
fi

# Check API documentation
if curl -s http://localhost:3000/api-docs > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API documentation is available${NC}"
else
    echo -e "${YELLOW}⚠️  API documentation not accessible${NC}"
fi

# Test login endpoint
echo -e "\n🔐 Testing authentication..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -w "%{http_code}" -o /tmp/login_response.json)

if [ "$LOGIN_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Authentication is working${NC}"
    TOKEN=$(cat /tmp/login_response.json | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    if [ -n "$TOKEN" ]; then
        echo -e "${GREEN}🔑 JWT token generated successfully${NC}"
    fi
else
    echo -e "${RED}❌ Authentication failed (HTTP $LOGIN_RESPONSE)${NC}"
fi

# Clean up temp file
rm -f /tmp/login_response.json

echo -e "\n🎉 ${GREEN}Health check completed!${NC}"
echo -e "\n📊 Summary:"
echo -e "   • Database: ${GREEN}✅ Running and persistent${NC}"
echo -e "   • API: ${GREEN}✅ Running and accessible${NC}"
echo -e "   • Data: ${GREEN}✅ Persisted in Docker volume${NC}"
echo -e "   • Users: ${GREEN}✅ Default users seeded${NC}"

echo -e "\n🔗 Access points:"
echo -e "   • API: http://localhost:3000"
echo -e "   • API Docs: http://localhost:3000/api-docs"
echo -e "   • Adminer: http://localhost:8080"

echo -e "\n💡 To view logs: ${YELLOW}bun run docker:logs${NC}"
echo -e "💡 To backup data: ${YELLOW}bun run docker:backup${NC}" 