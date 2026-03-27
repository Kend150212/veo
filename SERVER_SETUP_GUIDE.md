# 🚀 Hướng dẫn Setup Server Mới (Ubuntu 22.04/24.04)

Tài liệu này hướng dẫn chi tiết cách deploy **Veo Prompt Generator** lên một server trắng (mới tinh).

## 1. Chuẩn bị Môi trường (System Dependencies)

Chạy các lệnh sau dưới quyền **root** hoặc user có quyền `sudo`.

```bash
# 1. Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# 2. Cài đặt các công cụ cơ bản: git, curl, nginx, certbot
sudo apt install -y git curl nginx certbot python3-certbot-nginx build-essential

# 3. Cài đặt Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Kiểm tra phiên bản (Node >= 18.17.0)
node -v
npm -v
```

---

## 2. Clone Code & Setup Project

```bash
# 1. Di chuyển vào thư mục web (hoặc thư mục tuỳ chọn)
cd /var/www

# 2. Clone source code (Thay URL của bạn vào đây)
sudo git clone https://github.com/Kend150212/veo.git veo

# 3. Cấp quyền cho user hiện tại (nếu đang dùng user thường)
sudo chown -R $USER:$USER /var/www/veo

# 4. Di chuyển vào thư mục dự án
cd /var/www/veo
```

---

## 3. Cấu hình Môi trường (.env)

```bash
# 1. Copy file mẫu
cp .env.example .env

# 2. Chỉnh sửa file .env
nano .env
```

**Các biến quan trọng cần chỉnh trong file `.env`:**
```ini
# Database (SQLite mặc định ok cho demo, PostgreSQL recommended cho production lớn)
DATABASE_URL="file:./prisma/prod.db"

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="sinh-ra-mot-chuoi-ngau-nhien-dai-dai"

# API Keys (Bắt buộc)
GEMINI_API_KEY="AIzaSy..."
OPENAI_API_KEY="sk-..."

# Admin mặc định (để seed database)
ADMIN_EMAIL="admin@veo.vn"
ADMIN_PASSWORD="password-manh-me"
```

---

## 4. Install & Build App

```bash
# 1. Cài đặt dependencies
npm install

# 2. Tạo Prisma Client & Push Database Schema
npx prisma generate
npx prisma db push

# 3. Seed Database (Tạo admin & dữ liệu mẫu)
npm run db:seed

# 4. Build Next.js App
npm run build
```

---

## 5. Setup PM2 (Process Manager)

PM2 giúp ứng dụng chạy ngầm và tự khởi động lại khi crash hoặc reboot server.

```bash
# 1. Cài đặt PM2 global
sudo npm install -g pm2

# 2. Khởi chạy ứng dụng
pm2 start npm --name "veo" -- start

# 3. Lưu cấu hình hiện tại để tự load khi reboot
pm2 save

# 4. Tạo script khởi động cùng hệ thống (Làm theo hướng dẫn in ra màn hình của lệnh này)
pm2 startup
```

---

## 6. Cấu hình Nginx (Reverse Proxy)

Nginx sẽ đóng vai trò cổng đón request từ internet (port 80/443) và chuyển vào ứng dụng Next.js (port 3000).

```bash
# 1. Tạo file config Nginx
sudo nano /etc/nginx/sites-available/veo
```

**Dán nội dung sau vào file (thay `your-domain.com` bằng domain thật):**

```nginx
server {
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Optional: Cache static files
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 60m;
    }
}
```

**Kích hoạt site:**
```bash
# 1. Tạo symlink sang sites-enabled
sudo ln -s /etc/nginx/sites-available/veo /etc/nginx/sites-enabled/

# 2. Kiểm tra cú pháp config
sudo nginx -t

# 3. Restart Nginx
sudo systemctl restart nginx
```

---

## 7. Cài đặt SSL (HTTPS) miễn phí với Certbot

```bash
# Tự động lấy chứng chỉ và cấu hình Nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Chọn `2` (Redirect) nếu được hỏi để tự động chuyển hướng HTTP sang HTTPS.

---

## ✅ Hoàn tất!

Truy cập `https://your-domain.com` để kiểm tra.

### Các lệnh bảo trì thường dùng:

**Cập nhật code mới:**
```bash
cd /var/www/veo
git pull origin main
npm install
npx prisma generate
npx prisma db push
npm run build
pm2 restart veo
```

**Xem logs lỗi:**
```bash
pm2 logs veo
```
