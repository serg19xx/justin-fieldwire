#!/bin/bash

# Convert Markdown to PDF using pandoc
# Install pandoc first: brew install pandoc (on macOS) or apt-get install pandoc (on Ubuntu)

echo "Converting RESOURCE_MANAGEMENT_ANALYSIS.md to PDF..."

pandoc RESOURCE_MANAGEMENT_ANALYSIS.md \
  -o RESOURCE_MANAGEMENT_ANALYSIS.pdf \
  --pdf-engine=xelatex \
  --variable geometry:margin=1in \
  --variable fontsize=11pt \
  --variable documentclass=article \
  --variable colorlinks=true \
  --variable linkcolor=blue \
  --variable urlcolor=blue \
  --variable toccolor=black \
  --toc \
  --toc-depth=3 \
  --highlight-style=tango \
  --metadata title="Resource Management System Analysis" \
  --metadata author="Fieldwire Development Team" \
  --metadata date="$(date '+%B %Y')"

if [ $? -eq 0 ]; then
    echo "✅ PDF created successfully: RESOURCE_MANAGEMENT_ANALYSIS.pdf"
    echo "📄 File size: $(du -h RESOURCE_MANAGEMENT_ANALYSIS.pdf | cut -f1)"
else
    echo "❌ Error creating PDF. Please check if pandoc is installed."
    echo "Install pandoc: brew install pandoc (macOS) or apt-get install pandoc (Ubuntu)"
fi