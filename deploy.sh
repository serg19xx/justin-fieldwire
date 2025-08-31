#!/bin/bash

# Check if environment is specified
ENV=${1:-production}

echo "🚀 Building and deploying FieldWire for $ENV environment..."

# Build the project for specified environment
echo "📦 Building project for $ENV..."
if [ "$ENV" = "development" ]; then
    npm run build:dev
else
    npm run build:prod
fi

# Copy .htaccess
echo "📋 Copying .htaccess..."
cp .htaccess dist/

# Upload to server
echo "📤 Uploading to server..."
lftp -c "set ssl:verify-certificate no; set ftp:ssl-allow no; open -u fieldwire@medicalcontractor.ca,carespace2025 ftp.medicalcontractor.ca; mirror --reverse --delete ./dist/ ./; bye"

echo "✅ Deployment completed!"
echo "🌐 Your app is available at: https://fieldwire.medicalcontractor.ca"
