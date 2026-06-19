#!/bin/bash
set -e
GREEN='\033[0;32m'; NC='\033[0m'
echo -e "${GREEN}🎯 ValBrief VPS Deploy${NC}"

# 1. Install Node.js 20 if needed
if ! command -v node &>/dev/null; then
  echo "Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# 2. Install PM2 globally
npm install -g pm2 2>/dev/null | tail -1

# 3. Install project dependencies
cd /root/ValBrief
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 4. Build TypeScript backend
echo "Compiling backend..."
cd backend && npx tsc && cd ..

# 5. Build frontend
echo "Building frontend..."
cd frontend && npm run build && cd ..

# 6. Copy frontend to web directory
mkdir -p /var/www/valbrief
cp -r /root/ValBrief/frontend/dist/* /var/www/valbrief/

# 7. Start/restart backend with PM2
echo "Starting backend..."
pm2 delete valbrief-backend 2>/dev/null || true
pm2 start /root/ValBrief/ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null | tail -1

# 8. Setup nginx
echo "Configuring nginx..."
apt-get install -y nginx 2>/dev/null | tail -1
cp /root/ValBrief/nginx.conf /etc/nginx/sites-available/valbrief
ln -sf /etc/nginx/sites-available/valbrief /etc/nginx/sites-enabled/valbrief
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx && systemctl enable nginx

echo -e "${GREEN}✅ 部署完成！${NC}"
echo -e "網站：${GREEN}http://45.76.187.81${NC}"
echo -e "後端：${GREEN}http://45.76.187.81/api/health${NC}"
