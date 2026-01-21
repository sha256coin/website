# S256 Website

Official website for SHA256coin (S256) cryptocurrency.

<p align="center">
  <img src="public/s256_brand.png" alt="S256 Website" width="128">
</p>

<p align="center">
  <strong>Official Website for SHA256coin (S256)</strong><br>
  Built with Node.js and Express
</p>

<p align="center">
  <a href="https://sha256coin.eu">Website</a> •
  <a href="https://explorer.sha256coin.eu">Explorer</a>
</p>

## Features

- Modern, responsive design
- Cryptocurrency information and documentation
- Whitepaper access
- Download links for wallet software
- Mining pool directory
- Exchange listings

## Running Locally

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

```bash
cd website
npm install
npm start
```

The website will be available at `http://localhost:3000`

## Deployment

### Prerequisites

- VPS with Ubuntu/Debian Linux
- Domain name pointed to VPS IP
- SSH access to VPS
- Root or sudo privileges

### 1. Copy website files to VPS

From your local machine:
```bash
# Create tarball of website
tar -czf s256-website.tar.gz website/

# Copy to VPS (replace USER and VPS_IP)
scp s256-website.tar.gz USER@VPS_IP:~/
```

### 2. SSH into VPS and setup

```bash
ssh USER@VPS_IP

# Install nginx
sudo apt-get update
sudo apt-get install -y nginx

# Extract website
tar -xzf s256-website.tar.gz
sudo mkdir -p /var/www/s256
sudo cp -r website/* /var/www/s256/

# Set permissions
sudo chown -R www-data:www-data /var/www/s256
sudo chmod -R 755 /var/www/s256
```

### 3. Configure Nginx

Create nginx config:
```bash
sudo nano /etc/nginx/sites-available/s256
```

Paste this configuration (replace YOUR_DOMAIN):
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name YOUR_DOMAIN www.YOUR_DOMAIN;

    root /var/www/s256;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    location / {
        try_files $uri $uri/ =404;
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
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/s256 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. SSL Certificate (Recommended)

```bash
# Install certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d YOUR_DOMAIN -d www.YOUR_DOMAIN

# Auto-renewal is configured automatically
```

### 5. Firewall Setup

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

## Alternative: Quick Deploy Script

Run the included `deploy.sh` script:
```bash
chmod +x deploy.sh
./deploy.sh YOUR_DOMAIN
```

## Updating Website

To update website content:
```bash
# From local machine
scp -r website/* USER@VPS_IP:/var/www/s256/

# On VPS
sudo chown -R www-data:www-data /var/www/s256
```

## Troubleshooting

### Check nginx status
```bash
sudo systemctl status nginx
```

### Check nginx logs
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Test nginx config
```bash
sudo nginx -t
```

### Restart nginx
```bash
sudo systemctl restart nginx
```

## Domain Configuration

Point your domain's DNS records to your VPS:
- A record: `@` → `VPS_IP`
- A record: `www` → `VPS_IP`

DNS propagation can take up to 48 hours.

## License

MIT License - See LICENSE file for details
