#!/usr/bin/env bash
# Exit on first error (failed build or failed FTP) — do not print success if upload did not run.
set -euo pipefail

# Optional local secrets: copy deploy.env.example to .env.deploy (gitignored).
if [[ -f .env.deploy ]]; then
  # shellcheck disable=SC1091
  source .env.deploy
fi

FTP_HOST="${FTP_HOST:-ftp.medicalcontractor.ca}"
FTP_USER="${FTP_USER:-fieldwire@medicalcontractor.ca}"

if [[ -z "${FTP_PASSWORD:-}" ]]; then
  echo "Missing FTP_PASSWORD."
  echo "Create .env.deploy from deploy.env.example and set FTP_PASSWORD (current FTP password from hosting / cPanel)."
  exit 1
fi

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

# Upload to server (if this fails, the live site may still be an older build)
echo "📤 Uploading to server (${FTP_HOST})..."

if [[ "${FTP_USE_SSL:-0}" == "1" ]]; then
  LFTP_SSL_INIT='set ssl:verify-certificate no; set ftp:ssl-allow yes; set ftp:ssl-force yes; set ftp:ssl-protect-data yes'
else
  LFTP_SSL_INIT='set ssl:verify-certificate no; set ftp:ssl-allow no'
fi

# Note: avoid commas in FTP_PASSWORD (lftp open -u user,pass delimiter).
lftp -c "${LFTP_SSL_INIT}; open -u \"${FTP_USER}\",\"${FTP_PASSWORD}\" ${FTP_HOST}; mirror --reverse --delete ./dist/ ./; bye"

echo "✅ Deployment completed!"
echo "🌐 Your app is available at: https://fieldwire.medicalcontractor.ca"
