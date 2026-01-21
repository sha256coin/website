#!/bin/bash
# S256 Website Deployment Script
# Usage: ./deploy.sh YOUR_DOMAIN

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

if [ -z "$1" ]; then
    echo -e "${RED}Usage: $0 YOUR_DOMAIN${NC}"
    echo "Example: $0 s256coin.com"
    exit 1
fi

DOMAIN=$1
WEB_ROOT="/var/www/s256"

echo -e "${GREEN}S256 Website Deployment${NC}"
echo "======================================"
echo "Domain: $DOMAIN"
echo "Web Root: $WEB_ROOT"
echo ""

# Install nginx if not present
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}Installing nginx...${NC}"
    apt-get update
    apt-get install -y nginx
else
    echo -e "${GREEN}✓ nginx already installed${NC}"
fi

# Create web root
echo -e "${YELLOW}Creating web directory...${NC}"
mkdir -p $WEB_ROOT

# Copy website files (assuming script is run from website directory)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo -e "${YELLOW}Copying website files from $SCRIPT_DIR...${NC}"
cp -r $SCRIPT_DIR/* $WEB_ROOT/

# Set permissions
chown -R www-data:www-data $WEB_ROOT
chmod -R 755 $WEB_ROOT

# Create nginx config
echo -e "${YELLOW}Creating nginx configuration...${NC}"
cat > /etc/nginx/sites-available/s256 << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    root $WEB_ROOT;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    location / {
        try_files \$uri \$uri/ =404;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|pdf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

# Enable site
if [ ! -L /etc/nginx/sites-enabled/s256 ]; then
    ln -s /etc/nginx/sites-available/s256 /etc/nginx/sites-enabled/
    echo -e "${GREEN}✓ Site enabled${NC}"
fi

# Remove default site if exists
if [ -L /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
    echo -e "${YELLOW}Default site disabled${NC}"
fi

# Test nginx config
echo -e "${YELLOW}Testing nginx configuration...${NC}"
nginx -t

# Reload nginx
echo -e "${YELLOW}Reloading nginx...${NC}"
systemctl reload nginx
systemctl enable nginx

# Configure firewall
if command -v ufw &> /dev/null; then
    echo -e "${YELLOW}Configuring firewall...${NC}"
    ufw allow 'Nginx Full'
    ufw allow OpenSSH
    echo "y" | ufw enable
fi

echo ""
echo -e "${GREEN}======================================"
echo "✓ Deployment complete!"
echo "======================================${NC}"
echo ""
echo "Your website should now be accessible at:"
echo "  http://$DOMAIN"
echo "  http://www.$DOMAIN"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Make sure your domain DNS points to this server's IP"
echo "2. Install SSL certificate:"
echo "   apt-get install certbot python3-certbot-nginx"
echo "   certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "3. Create downloads directory for wallet releases:"
echo "   mkdir -p $WEB_ROOT/downloads"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  systemctl status nginx  - Check nginx status"
echo "  systemctl reload nginx  - Reload configuration"
echo "  tail -f /var/log/nginx/access.log - View access logs"
echo ""
