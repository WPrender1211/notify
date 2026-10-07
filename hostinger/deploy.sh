#!/bin/bash
# Hostinger VPS 1-Click Deployment Script for CallNotify
set -e

echo "======================================================"
echo "🚀 Deploying CallNotify Multi-User Platform on Hostinger"
echo "======================================================"

# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js (v20 LTS), npm, and git if missing
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# 3. Install PM2 process manager globally
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# 4. Install backend dependencies
echo "📦 Installing backend packages..."
cd backend
npm install --production=false
cd ..

# 5. Install frontend dependencies and build production bundle
echo "📦 Building frontend dashboard bundle..."
cd frontend
npm install
npm run build
cd ..

# 6. Start / Reload with PM2
echo "🚀 Starting Node.js server with PM2..."
pm2 start hostinger/ecosystem.config.cjs || pm2 restart hostinger/ecosystem.config.cjs
pm2 save
pm2 startup systemd -u $USER --hp $HOME || true

echo "======================================================"
echo "✅ Deployment Successful!"
echo "📡 Backend & Web Dashboard running on http://127.0.0.1:5000"
echo "======================================================"
