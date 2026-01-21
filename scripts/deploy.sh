#!/bin/bash

# Veo Prompt Generator - Auto Setup Script
# Usage: ./setup.sh

set -e

echo "🚀 Starting Veo Prompt Generator Setup..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get domain from user or use default
DOMAIN=${1:-"localhost"}
echo -e "${YELLOW}Domain: $DOMAIN${NC}"

# Create .env file
echo -e "${GREEN}📝 Creating .env file...${NC}"
cat > .env << EOF
DATABASE_URL="file:./prisma/prod.db"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="https://$DOMAIN"
EOF

# Install dependencies
echo -e "${GREEN}📦 Installing dependencies...${NC}"
npm install

# Generate Prisma client and create database
echo -e "${GREEN}🗄️ Setting up database...${NC}"
npx prisma generate
npx prisma db push

# Build the application
echo -e "${GREEN}🔨 Building application...${NC}"
npm run build

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${GREEN}📥 Installing PM2...${NC}"
    sudo npm install -g pm2
fi

# Stop existing instance if running
pm2 delete veo 2>/dev/null || true

# Start with PM2
echo -e "${GREEN}▶️ Starting application with PM2...${NC}"
pm2 start npm --name "veo" -- start
pm2 save

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "📌 Next steps:"
echo "   1. Configure Nginx to proxy to port 3000"
echo "   2. Set up SSL with: sudo certbot --nginx -d $DOMAIN"
echo ""
echo "🔗 App is running at: http://localhost:3000"
echo ""

# Show PM2 status
pm2 status
