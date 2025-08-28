# WHC.ca Deployment Guide

This guide covers deploying the FieldWire application to WHC.ca hosting.

## 🚀 WHC.ca Hosting Overview

WHC.ca is a Canadian hosting provider that typically offers:
- Shared hosting with cPanel
- Node.js support (may be limited)
- Static file hosting
- FTP/SFTP access

## 📋 Prerequisites

- WHC.ca hosting account
- FTP/SFTP access credentials
- Domain name (optional)
- Basic knowledge of file upload

## 🔧 Deployment Options

### Option 1: Static File Deployment (Recommended)

Since WHC.ca may have limited Node.js support, we'll deploy the built static files.

#### 1. Build Locally

```bash
# On your local machine
npm install
npm run build
```

This creates a `dist/` folder with static files.

#### 2. Upload to WHC.ca

**Using FTP/SFTP:**
1. Connect to your WHC.ca hosting via FTP/SFTP
2. Navigate to the `public_html` directory
3. Upload all contents of the `dist/` folder to `public_html`

**Using cPanel File Manager:**
1. Log into cPanel
2. Open File Manager
3. Navigate to `public_html`
4. Upload all files from the `dist/` folder

#### 3. Configure .htaccess

Create a `.htaccess` file in `public_html`:

```apache
# Enable SPA routing
RewriteEngine On
RewriteBase /

# Handle Angular/Vue routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# Enable Gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
```

### Option 2: Node.js Deployment (If Supported)

If WHC.ca supports Node.js applications:

#### 1. Prepare Application

```bash
# Create production build
npm run build

# Create package.json for production
npm install --production
```

#### 2. Upload Files

Upload the entire project folder to your hosting directory.

#### 3. Configure Node.js

Create a `start.js` file:

```javascript
const express = require('express');
const path = require('path');
const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## 🔄 Update Process

### For Static Deployment:

1. **Build locally:**
   ```bash
   npm run build
   ```

2. **Upload new files:**
   - Connect via FTP/SFTP
   - Replace files in `public_html` with new `dist/` contents

### Automated Upload Script

Create `upload-to-whc.sh`:

```bash
#!/bin/bash

echo "🚀 Building and uploading to WHC.ca..."

# Build application
npm run build

# Upload via FTP (requires lftp or similar)
lftp -c "
open ftp.your-domain.com
user your-username your-password
mirror --reverse --delete dist/ public_html/
bye
"

echo "✅ Upload completed!"
```

## 🌐 Domain Configuration

### Subdomain Setup

If you want to use a subdomain (e.g., `app.yourdomain.com`):

1. **In WHC.ca cPanel:**
   - Go to "Subdomains"
   - Create subdomain `app`
   - Point to `public_html/app`

2. **Upload files to subdirectory:**
   - Upload `dist/` contents to `public_html/app/`

### Custom Domain

1. **Point domain to WHC.ca:**
   - Update DNS A record to WHC.ca IP
   - Or use WHC.ca nameservers

2. **Configure in cPanel:**
   - Add domain in "Addon Domains"
   - Point to appropriate directory

## 🔧 Environment Configuration

### Environment Variables

Since static hosting doesn't support server-side environment variables, use build-time variables:

1. **Create `.env.production`:**
   ```env
   VITE_APP_TITLE=FieldWire
   VITE_API_BASE_URL=https://your-api-domain.com
   ```

2. **Build with production config:**
   ```bash
   npm run build
   ```

## 🚨 Security Considerations

### HTTPS Setup

1. **Enable SSL in cPanel:**
   - Go to "SSL/TLS"
   - Install SSL certificate
   - Force HTTPS redirect

### Security Headers

Add to `.htaccess`:

```apache
# Security headers
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-XSS-Protection "1; mode=block"
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "no-referrer-when-downgrade"
```

## 🐛 Troubleshooting

### Common Issues

1. **404 errors on routes:**
   - Ensure `.htaccess` is properly configured
   - Check that `index.html` is in root directory

2. **Assets not loading:**
   - Verify file paths in `dist/`
   - Check file permissions (644 for files, 755 for directories)

3. **Build errors:**
   - Run `npm run type-check` locally
   - Check for missing dependencies

### WHC.ca Specific

1. **Contact WHC.ca support** for:
   - Node.js version compatibility
   - Custom domain configuration
   - SSL certificate issues

2. **Check hosting limitations:**
   - File upload size limits
   - Directory structure restrictions
   - PHP/Node.js version support

## 📞 WHC.ca Support

For hosting-specific issues:
- **WHC.ca Support**: https://whc.ca/support
- **Documentation**: Check WHC.ca knowledge base
- **Live Chat**: Available in WHC.ca control panel

## 📈 Performance Optimization

### For Static Deployment

1. **Enable caching** in `.htaccess`
2. **Use CDN** for static assets (if available)
3. **Optimize images** before upload
4. **Minify CSS/JS** (already done by Vite build)

### Monitoring

1. **Check file sizes** before upload
2. **Test loading speed** with tools like PageSpeed Insights
3. **Monitor error logs** in cPanel

---

**Note**: This guide assumes WHC.ca provides standard shared hosting with cPanel. Contact WHC.ca support for specific hosting features and limitations.
