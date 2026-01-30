#!/bin/bash

# Script để update server - tự động xử lý conflicts và reset về version mới nhất

set -e

echo "🔄 Cập nhật server..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Stash hoặc xóa local changes
echo -e "${BLUE}📦 Bước 1: Xử lý local changes...${NC}"

# Xóa các file đã bị xóa trong version mới
if [ -f "scripts/deploy-production.sh" ]; then
    echo -e "${YELLOW}⚠️  Xóa file cũ: scripts/deploy-production.sh${NC}"
    rm -f scripts/deploy-production.sh
fi

if [ -f ".npmrc" ]; then
    echo -e "${YELLOW}⚠️  Xóa file cũ: .npmrc${NC}"
    rm -f .npmrc
fi

if [ -f "scripts/debug-server.sh" ]; then
    echo -e "${YELLOW}⚠️  Xóa file cũ: scripts/debug-server.sh${NC}"
    rm -f scripts/debug-server.sh
fi

if [ -f "scripts/fix-build.sh" ]; then
    echo -e "${YELLOW}⚠️  Xóa file cũ: scripts/fix-build.sh${NC}"
    rm -f scripts/fix-build.sh
fi

# Stash các thay đổi khác nếu có
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}⚠️  Stash local changes...${NC}"
    git stash push -m "Auto-stash before update $(date +%Y-%m-%d_%H:%M:%S)"
fi

echo -e "${GREEN}✅ Đã xử lý local changes${NC}"
echo ""

# Step 2: Fetch và reset về origin/main
echo -e "${BLUE}📥 Bước 2: Fetch và reset về version mới nhất...${NC}"
git fetch origin
git reset --hard origin/main
echo -e "${GREEN}✅ Đã reset về version mới nhất${NC}"
echo ""

# Step 3: Cài đặt dependencies
echo -e "${BLUE}📦 Bước 3: Cài đặt dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Đã cài đặt dependencies${NC}"
echo ""

# Step 4: Generate Prisma Client
echo -e "${BLUE}🗄️  Bước 4: Generate Prisma Client...${NC}"
npx prisma generate
echo -e "${GREEN}✅ Đã generate Prisma Client${NC}"
echo ""

# Step 5: Build
echo -e "${BLUE}🏗️  Bước 5: Build Next.js application...${NC}"
rm -rf .next
npm run build || {
    echo -e "${RED}❌ Lỗi khi build. Kiểm tra lại code.${NC}"
    exit 1
}
echo -e "${GREEN}✅ Đã build thành công${NC}"
echo ""

# Step 6: Restart PM2
echo -e "${BLUE}🔄 Bước 6: Restart PM2...${NC}"
pm2 restart veo || {
    echo -e "${YELLOW}⚠️  PM2 chưa chạy, đang start...${NC}"
    pm2 start npm --name "veo" -- start
    pm2 save
}
echo -e "${GREEN}✅ Đã restart PM2${NC}"
echo ""

echo -e "${GREEN}✅ Cập nhật server hoàn tất!${NC}"
echo ""
