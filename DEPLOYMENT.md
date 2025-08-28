# Simple VPS Deployment Guide

This guide covers deploying the FieldWire application to a VPS server using PM2 only.

## 🚀 Prerequisites

- VPS with Ubuntu/Debian or CentOS/RHEL
- SSH access to your server
- Basic knowledge of Linux commands

## 📋 Server Requirements

### Minimum Requirements
- **CPU**: 1 core
- **RAM**: 1 GB
- **Storage**: 10 GB
- **OS**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+

### Recommended Requirements
- **CPU**: 2+ cores
- **RAM**: 2+ GB
- **Storage**: 20+ GB SSD
- **OS**: Ubuntu 22.04 LTS

## 🔧 Server Setup

### 1. Update System

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### 2. Install Node.js

```bash
# Using NodeSource repository (recommended)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### 4. Create Log Directory

```bash
sudo mkdir -p /var/log/fieldwire
sudo chown $USER:$USER /var/log/fieldwire
```

## 🏗️ Application Deployment

### 1. Clone Repository

```bash
# Create application directory
sudo mkdir -p /var/www/fieldwire
sudo chown $USER:$USER /var/www/fieldwire

# Clone your repository
cd /var/www/fieldwire
git clone <your-repository-url> .
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build Application

```bash
npm run build
```

### 4. Start Application

```bash
# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🔄 Deployment Updates

### Using the Deployment Script

```bash
# Make script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### Manual Deployment

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build application
npm run build

# Restart PM2 process
pm2 restart fieldwire
```

## 📊 Monitoring

### PM2 Commands

```bash
# View logs
pm2 logs fieldwire

# Monitor processes
pm2 monit

# View status
pm2 status

# Restart application
pm2 restart fieldwire

# Stop application
pm2 stop fieldwire

# Delete application
pm2 delete fieldwire
```

## 🔧 Environment Variables

Create `.env.production` file:

```env
VITE_APP_TITLE=FieldWire
VITE_API_BASE_URL=https://your-api-domain.com
NODE_ENV=production
```

## 🚨 Security Considerations

### 1. Firewall Setup

```bash
# Install UFW
sudo apt install ufw -y

# Allow SSH
sudo ufw allow ssh

# Allow application port
sudo ufw allow 3000

# Enable firewall
sudo ufw enable
```

### 2. Regular Updates

```bash
# Create update script
sudo nano /usr/local/bin/update-server.sh

#!/bin/bash
apt update && apt upgrade -y
npm update -g pm2
```

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   sudo netstat -tulpn | grep :3000
   pm2 delete fieldwire
   pm2 start ecosystem.config.js
   ```

2. **Permission denied**
   ```bash
   sudo chown -R $USER:$USER /var/www/fieldwire
   sudo chmod -R 755 /var/www/fieldwire
   ```

3. **PM2 process not starting**
   ```bash
   pm2 logs fieldwire
   pm2 delete fieldwire
   pm2 start ecosystem.config.js
   ```

4. **Build errors**
   ```bash
   npm run type-check
   npm run lint
   ```

## 📈 Performance Optimization

### PM2 Cluster Mode

Update `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'fieldwire',
    script: 'npm',
    args: 'run preview',
    instances: 'max',  // Use all CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '0.0.0.0'
    }
  }]
}
```

## 🌐 Accessing the Application

After deployment, your application will be available at:

- **Local**: `http://localhost:3000`
- **External**: `http://your-server-ip:3000`
- **Domain**: `http://your-domain.com:3000` (if you have a domain)

## 📞 Support

For deployment issues:
1. Check logs: `pm2 logs fieldwire`
2. Verify configuration files
3. Test locally before deploying
4. Check firewall settings

---

**Note**: This is a simple deployment without reverse proxy. For production use, consider adding Nginx or Apache for better performance and security.
