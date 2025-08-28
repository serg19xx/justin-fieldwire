#!/bin/bash

# FieldWire Deployment Script for WHC.ca
# This script builds the project and uploads it to WHC.ca via FTP

set -e  # Exit on any error

echo "🚀 Starting FieldWire deployment to WHC.ca..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if lftp is installed
if ! command -v lftp &> /dev/null; then
    echo -e "${RED}❌ Error: lftp is not installed${NC}"
    echo "Please install lftp:"
    echo "  macOS: brew install lftp"
    echo "  Ubuntu/Debian: sudo apt-get install lftp"
    exit 1
fi

# Check if .env file exists with FTP credentials
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Warning: .env file not found${NC}"
    echo "Please create .env file with your FTP credentials:"
    echo "FTP_SERVER=your-ftp-server.com"
    echo "FTP_USERNAME=your-username"
    echo "FTP_PASSWORD=your-password"
    echo ""
    read -p "Do you want to continue with manual input? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Load environment variables if .env exists
if [ -f .env ]; then
    source .env
fi

# Get FTP credentials
if [ -z "$FTP_SERVER" ]; then
    read -p "Enter FTP server: " FTP_SERVER
fi

if [ -z "$FTP_USERNAME" ]; then
    read -p "Enter FTP username: " FTP_USERNAME
fi

if [ -z "$FTP_PASSWORD" ]; then
    read -s -p "Enter FTP password: " FTP_PASSWORD
    echo
fi

echo -e "${YELLOW}📦 Building project...${NC}"
npm run build

echo -e "${YELLOW}📋 Copying .htaccess...${NC}"
cp .htaccess dist/

echo -e "${YELLOW}📤 Uploading to WHC.ca...${NC}"
echo "Server: $FTP_SERVER"
echo "Username: $FTP_USERNAME"

# Create lftp script for upload
cat > /tmp/lftp_upload.txt << EOF
set ssl:verify-certificate no
set ftp:ssl-allow no
set net:timeout 60
set net:max-retries 3
set net:reconnect-interval-base 5
set net:reconnect-interval-multiplier 1

open -u $FTP_USERNAME,$FTP_PASSWORD $FTP_SERVER
cd public_html
mirror --reverse --delete --verbose ./dist/ ./
bye
EOF

# Execute lftp upload
if lftp -f /tmp/lftp_upload.txt; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo "🌐 Your application should be available at:"
    echo "   https://yourdomain.com"
    echo ""
    echo "📋 Test these URLs:"
    echo "   - https://yourdomain.com/ (Dashboard)"
    echo "   - https://yourdomain.com/login (Login)"
    echo "   - https://yourdomain.com/projects (Projects)"
else
    echo -e "${RED}❌ Deployment failed!${NC}"
    echo ""
    echo "🔧 Troubleshooting tips:"
    echo "1. Check your FTP credentials"
    echo "2. Verify WHC.ca server is accessible"
    echo "3. Try uploading manually via FTP client"
    echo "4. Check FTP_TROUBLESHOOTING.md for more help"
    exit 1
fi

# Clean up
rm -f /tmp/lftp_upload.txt

echo -e "${GREEN}🎉 Deployment completed!${NC}"
