#!/bin/bash

HTML_FILE="TASK_DEPENDENCIES_CLIENT_GUIDE_EN.html"

echo "🔄 Opening English Task Dependencies Guide..."

# Check if the HTML file exists
if [ ! -f "$HTML_FILE" ]; then
  echo "❌ Error: File $HTML_FILE not found."
  exit 1
fi

echo "📄 Opening HTML file in browser..."
# Open the HTML file in the default browser
if command -v open &> /dev/null; then
  open "$HTML_FILE"
elif command -v xdg-open &> /dev/null; then
  xdg-open "$HTML_FILE"
elif command -v start &> /dev/null; then
  start "$HTML_FILE"
else
  echo "⚠️ Could not open file in browser. Please open $HTML_FILE manually."
  exit 1
fi

echo "📋 Instructions for creating PDF:"
echo "1. In browser press Cmd+P (print)"
echo "2. Select 'Save as PDF'"
echo "3. Configure settings:"
echo "   - Size: A4"
echo "   - Margins: Standard"
echo "   - Scale: 100%"
echo "4. Save as 'TASK_DEPENDENCIES_CLIENT_GUIDE_EN.pdf'"
echo "✅ English HTML guide opened in browser"
echo "📝 Follow instructions above to create PDF"
