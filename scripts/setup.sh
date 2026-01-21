#!/bin/bash

# Veo Prompt Generator - One-Click Setup Script
# Usage: ./scripts/setup.sh

set -e

echo "🚀 Veo Prompt Generator - Setup Script"
echo "========================================"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    
    # Generate random secret
    SECRET=$(openssl rand -base64 32)
    sed -i '' "s/your-super-secret-key-change-in-production-min-32-chars/$SECRET/" .env 2>/dev/null || \
    sed -i "s/your-super-secret-key-change-in-production-min-32-chars/$SECRET/" .env
    
    echo "⚠️  Please edit .env file to set your admin credentials and Gemini API key"
else
    echo "✅ .env file exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Push database schema
echo "🗄️  Setting up database..."
npx prisma db push

# Run seed
echo "🌱 Seeding database..."
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts

# Build the app
echo "🏗️  Building production app..."
npm run build

echo ""
echo "========================================"
echo "✅ Setup completed successfully!"
echo ""
echo "To start the app:"
echo "  npm run start"
echo ""
echo "Or with PM2 (recommended for production):"
echo "  pm2 start npm --name 'veo-prompt' -- start"
echo ""
echo "Default admin credentials (change in .env):"
echo "  Email: admin@example.com"
echo "  Password: admin123"
echo "========================================"
