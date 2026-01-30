# Hướng dẫn Deploy lên Server

## 1. Push code lên GitHub

Nếu chưa push được, bạn có thể:

### Cách 1: Push với token
```bash
git push https://YOUR_TOKEN@github.com/Kend150212/veo.git main
```

### Cách 2: Push với SSH (nếu đã setup SSH key)
```bash
git remote set-url origin git@github.com:Kend150212/veo.git
git push origin main
```

### Cách 3: Push thủ công qua GitHub Desktop hoặc GitHub web interface

## 2. Lệnh chạy trên Server

### Bước 1: Clone/Pull code từ GitHub
```bash
# Nếu chưa clone
git clone https://github.com/Kend150212/veo.git
cd veo

# Nếu đã có code, pull mới nhất
git pull origin main
```

### Bước 2: Cài đặt dependencies (nếu chưa có)
```bash
npm install
```

### Bước 3: Cập nhật database và chạy server

#### Option A: Development mode
```bash
chmod +x scripts/update-and-run.sh
./scripts/update-and-run.sh dev
```

#### Option B: Production mode với PM2
```bash
# Cập nhật database
npx prisma generate
npx prisma db push

# Build application
npm run build

# Chạy với PM2
pm2 delete veo 2>/dev/null || true
pm2 start npm --name "veo" -- start
pm2 save
pm2 startup  # Chạy lệnh này để tự động start khi server reboot
```

#### Option C: Sử dụng script có sẵn
```bash
chmod +x scripts/update-and-run.sh
./scripts/update-and-run.sh prod
```

### Bước 4: Kiểm tra server đang chạy
```bash
# Kiểm tra PM2 status
pm2 status

# Xem logs
pm2 logs veo

# Restart nếu cần
pm2 restart veo
```

## 3. Cấu hình Nginx (nếu cần)

Tạo file `/etc/nginx/sites-available/veo`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Sau đó:
```bash
sudo ln -s /etc/nginx/sites-available/veo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 4. Setup SSL với Let's Encrypt
```bash
sudo certbot --nginx -d your-domain.com
```

## 5. Environment Variables

Đảm bảo file `.env` có các biến sau:
```env
DATABASE_URL="file:./prisma/prod.db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="https://your-domain.com"
GEMINI_API_KEY="your-gemini-key"  # Nếu dùng Gemini
OPENAI_API_KEY="your-openai-key"  # Nếu dùng OpenAI
```

## 6. Quick Deploy Script (Tất cả trong một)

Tạo file `deploy-quick.sh`:
```bash
#!/bin/bash
set -e

echo "🚀 Deploying to server..."

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Update database
npx prisma generate
npx prisma db push

# Build
npm run build

# Restart PM2
pm2 restart veo

echo "✅ Deploy complete!"
```

Chạy:
```bash
chmod +x deploy-quick.sh
./deploy-quick.sh
```
