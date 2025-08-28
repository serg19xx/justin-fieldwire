# FTP Deployment Troubleshooting

## Common Issues and Solutions

### 1. ECONNRESET Error
**Error:** `Error: Client is closed because read ECONNRESET (data socket)`

**Possible Causes:**
- FTP server timeout
- Network connectivity issues
- Firewall blocking connection
- Server overload

**Solutions:**
1. **Check FTP credentials** - Ensure they are correct in GitHub Secrets
2. **Verify server status** - Check if WHC.ca is accessible
3. **Try manual upload** - Use the `upload-to-whc.sh` script locally
4. **Contact hosting provider** - Ask about FTP connection limits

### 2. Manual Deployment Alternative

If GitHub Actions continues to fail, use the local deployment script:

```bash
# Make sure you have lftp installed
brew install lftp  # macOS
# or
sudo apt-get install lftp  # Ubuntu/Debian

# Run the upload script
./upload-to-whc.sh
```

### 3. FTP Connection Settings

**Recommended FTP settings for WHC.ca:**
- **Protocol:** FTP (not SFTP)
- **Port:** 21 (default)
- **Passive mode:** Enabled
- **Timeout:** 60 seconds

### 4. Alternative Deployment Methods

#### Method 1: cPanel File Manager
1. Build locally: `npm run build`
2. Zip the `dist/` folder
3. Upload via cPanel File Manager
4. Extract in `public_html/`

#### Method 2: FTP Client (FileZilla, etc.)
1. Build locally: `npm run build`
2. Connect via FTP client
3. Upload contents of `dist/` to `public_html/`

### 5. Testing Deployment

After deployment, test these URLs:
- `https://yourdomain.com/` - Main page
- `https://yourdomain.com/dashboard` - Dashboard
- `https://yourdomain.com/login` - Login page

### 6. Common WHC.ca Issues

**If files don't update:**
- Clear browser cache
- Check file permissions (should be 644 for files, 755 for folders)
- Verify `.htaccess` is uploaded correctly

**If routing doesn't work:**
- Ensure `.htaccess` is in `public_html/`
- Check if mod_rewrite is enabled on WHC.ca
- Verify Apache configuration allows `.htaccess` overrides

## Getting Help

1. **Check GitHub Actions logs** for detailed error messages
2. **Test FTP connection** manually using an FTP client
3. **Contact WHC.ca support** if FTP issues persist
4. **Use manual deployment** as a fallback option
