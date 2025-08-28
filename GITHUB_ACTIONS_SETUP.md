# GitHub Actions Setup for WHC.ca Deployment

This guide explains how to set up GitHub Actions for automatic deployment to WHC.ca hosting.

## 🚀 Overview

GitHub Actions will automatically:
1. Build your application when you push to main/master branch
2. Run type checking and linting
3. Deploy to WHC.ca via FTP
4. Only deploy from main/master branch (not from pull requests)

## 🔧 Setup Steps

### 1. Get WHC.ca FTP Credentials

From your WHC.ca hosting account, get:
- **FTP Server**: Usually `ftp.yourdomain.com` or provided by WHC.ca
- **FTP Username**: Your WHC.ca FTP username
- **FTP Password**: Your WHC.ca FTP password

### 2. Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add these three secrets:

#### Secret 1: FTP_SERVER
- **Name**: `FTP_SERVER`
- **Value**: `ftp.yourdomain.com` (your WHC.ca FTP server)

#### Secret 2: FTP_USERNAME
- **Name**: `FTP_USERNAME`
- **Value**: Your WHC.ca FTP username

#### Secret 3: FTP_PASSWORD
- **Name**: `FTP_PASSWORD`
- **Value**: Your WHC.ca FTP password

### 3. Test Deployment

1. Push any change to the `main` branch:
   ```bash
   git add .
   git commit -m "Test deployment"
   git push origin main
   ```

2. Check the deployment:
   - Go to **Actions** tab in your GitHub repository
   - Click on the latest workflow run
   - Monitor the deployment progress

## 📋 Workflow Details

### What the workflow does:

1. **Triggers**: On push to main/master branch
2. **Build**: Installs dependencies and builds the app
3. **Quality Checks**: Runs TypeScript and ESLint
4. **Deploy**: Uploads built files to WHC.ca via FTP

### Files deployed:
- All contents of `dist/` folder
- `.htaccess` file (copied to dist/ during build)
- Excludes: `.git`, `node_modules`, `.env` files

## 🔒 Security

- FTP credentials are stored as encrypted secrets
- Only visible to repository owners and collaborators
- Never logged in workflow output
- Can be rotated anytime by updating secrets

## 🐛 Troubleshooting

### Common Issues:

1. **FTP Connection Failed**
   - Check FTP server address
   - Verify username/password
   - Ensure FTP is enabled in WHC.ca

2. **Upload Failed**
   - Check disk space on WHC.ca
   - Verify `public_html/` directory exists
   - Check file permissions

3. **Build Failed**
   - Check TypeScript errors locally: `npm run type-check`
   - Check linting errors: `npm run lint`
   - Verify all dependencies are installed

### Debug Steps:

1. **Check workflow logs**:
   - Go to Actions tab
   - Click on failed workflow
   - Expand failed step to see error details

2. **Test locally first**:
   ```bash
   npm run build
   npm run type-check
   npm run lint
   ```

3. **Verify FTP manually**:
   - Use FTP client to test connection
   - Verify you can upload to `public_html/`

## 📈 Benefits of GitHub Actions

### Automatic Deployment:
- ✅ No manual uploads needed
- ✅ Consistent deployment process
- ✅ Quality checks before deployment
- ✅ Rollback capability (previous versions)

### Team Collaboration:
- ✅ All team members can trigger deployment
- ✅ Deployment history and logs
- ✅ No need to share FTP credentials

### Security:
- ✅ Encrypted credentials
- ✅ No credentials in code
- ✅ Access control via GitHub permissions

## 🔄 Manual Override

If you need to deploy manually:

1. **Trigger workflow manually**:
   - Go to Actions tab
   - Click on "Deploy to WHC.ca" workflow
   - Click "Run workflow"
   - Select branch and run

2. **Or use local script**:
   ```bash
   ./upload-to-whc.sh
   ```

## 📞 Support

For issues:
1. Check workflow logs in GitHub Actions
2. Verify WHC.ca FTP settings
3. Test build locally first
4. Contact WHC.ca support for FTP issues

---

**Note**: Keep your FTP credentials secure and update them if compromised.
