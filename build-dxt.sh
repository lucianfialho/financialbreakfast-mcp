#!/bin/bash

# Build script for DXT bundle
# Creates a versioned DXT file ready for GitHub releases

set -e

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
DXT_NAME="financial-data-mcp-v${VERSION}.dxt"

echo "🔨 Building DXT bundle v${VERSION}..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create dist directory
mkdir -p dist

# Create DXT bundle (it's essentially a ZIP file)
echo "📁 Creating DXT bundle..."
zip -r "dist/${DXT_NAME}" . \
    -x "dist/*" \
    -x "node_modules/*" \
    -x ".git/*" \
    -x "*.log" \
    -x ".DS_Store" \
    -x "build-dxt.sh"

# Also create a generic filename for latest
cp "dist/${DXT_NAME}" "dist/financial-data-mcp.dxt"

echo "✅ DXT bundle created:"
echo "   📦 dist/${DXT_NAME}"
echo "   📦 dist/financial-data-mcp.dxt (latest)"
echo ""
echo "🚀 Ready for GitHub release!"
echo "   Upload these files to: https://github.com/lucianfialho/financial-mcp-dxt/releases"