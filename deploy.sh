#!/bin/bash

echo "🚀 Building and deploying FieldWire..."

# Build the project
echo "📦 Building project..."
npm run build

# Copy .htaccess
echo "📋 Copying .htaccess..."
cp .htaccess dist/

# Upload to server
echo "📤 Uploading to server..."
lftp -c "set ssl:verify-certificate no; set ftp:ssl-allow no; open -u fieldwire@medicalcontractor.ca,carespace2025 ftp.medicalcontractor.ca; mirror --reverse --delete ./dist/ ./; bye"

echo "✅ Deployment completed!"
echo "🌐 Your app is available at: https://fieldwire.medicalcontractor.ca"
