#!/bin/bash

# WHC.ca Upload Script
# This script builds and uploads the FieldWire application to WHC.ca hosting

set -e  # Exit on any error

echo "🚀 Building and uploading to WHC.ca..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if lftp is installed
if ! command -v lftp &> /dev/null; then
    print_error "lftp is not installed. Please install it first:"
    echo "  macOS: brew install lftp"
    echo "  Ubuntu: sudo apt install lftp"
    echo "  CentOS: sudo yum install lftp"
    exit 1
fi

# Configuration (update these values)
FTP_HOST="ftp.your-domain.com"
FTP_USER="your-username"
FTP_PASS="your-password"
FTP_PATH="public_html"

print_status "Configuration:"
echo "  Host: $FTP_HOST"
echo "  User: $FTP_USER"
echo "  Path: $FTP_PATH"

# Build application
print_status "Building application..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    print_error "Build failed! dist directory not found."
    exit 1
fi

print_status "Build completed successfully!"

# Copy .htaccess to dist folder
if [ -f ".htaccess" ]; then
    print_status "Copying .htaccess to dist folder..."
    cp .htaccess dist/
else
    print_warning ".htaccess file not found. SPA routing may not work properly."
fi

# Upload to WHC.ca
print_status "Uploading to WHC.ca..."

# Create lftp script
cat > upload.lftp << EOF
open $FTP_HOST
user $FTP_USER $FTP_PASS
mirror --reverse --delete dist/ $FTP_PATH/
bye
EOF

# Execute lftp script
lftp -f upload.lftp

# Clean up
rm upload.lftp

print_status "✅ Upload completed successfully!"
print_status "Your application should now be available at: https://your-domain.com"

echo ""
print_status "Upload finished at $(date)"
