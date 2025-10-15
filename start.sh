#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}Starting Cargo Management System...${NC}\n"

# Get current IP address
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
echo -e "${YELLOW}Your IP address: ${IP}${NC}"
echo -e "${YELLOW}API will auto-detect this IP${NC}\n"

# Start Backend
echo -e "${GREEN}Starting Backend Server...${NC}"
(cd "$SCRIPT_DIR/backend" && npm run dev) &
BACKEND_PID=$!

# Wait a bit for backend to initialize
sleep 2

# Start Prisma Studio
echo -e "${GREEN}Starting Prisma Studio...${NC}"
(cd "$SCRIPT_DIR/backend" && npx prisma studio --port 5555) &
PRISMA_PID=$!

# Wait a bit
sleep 2

# Start Mobile App
echo -e "${GREEN}Starting Mobile App (Expo)...${NC}"
(cd "$SCRIPT_DIR/mobile-app" && npx expo start) &
EXPO_PID=$!

echo -e "\n${BLUE}All services started!${NC}"
echo -e "${GREEN}Backend:${NC} http://localhost:3000"
echo -e "${GREEN}Backend (network):${NC} http://${IP}:3000"
echo -e "${GREEN}Prisma Studio:${NC} http://localhost:5555"
echo -e "${GREEN}Expo Metro:${NC} http://localhost:8081"
echo -e "\n${YELLOW}Note: PostgreSQL must be running on port 5433${NC}"
echo -e "\n${BLUE}Press Ctrl+C to stop all services${NC}\n"

# Trap Ctrl+C and kill all processes
trap "echo -e '\n${BLUE}Stopping all services...${NC}'; kill $BACKEND_PID $PRISMA_PID $EXPO_PID 2>/dev/null; exit" INT

# Wait for all background processes
wait
