#!/bin/bash

# Build script for DXT bundle
# Creates a versioned DXT file ready for GitHub releases

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Validate environment
if ! command -v node &> /dev/null; then
    log_error "Node.js is required but not installed"
    exit 1
fi

if ! command -v zip &> /dev/null; then
    log_error "zip command is required but not found"
    exit 1
fi

# Get version from package.json
if [ ! -f "package.json" ]; then
    log_error "package.json not found"
    exit 1
fi

VERSION=$(node -p "require('./package.json').version" 2>/dev/null)
if [ $? -ne 0 ] || [ -z "$VERSION" ]; then
    log_error "Failed to read version from package.json"
    exit 1
fi

DXT_NAME="financial-data-mcp-v${VERSION}.dxt"

log_info "Building DXT bundle v${VERSION}..."

# Validate required files
REQUIRED_FILES=("manifest.json" "package.json" "server/index.js")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        log_error "Required file missing: $file"
        exit 1
    fi
done

log_success "All required files present"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        log_error "Failed to install dependencies"
        exit 1
    fi
fi

# Validate manifest.json
log_info "Validating manifest.json..."
node -e "
    const manifest = require('./manifest.json');
    const pkg = require('./package.json');

    if (manifest.version !== pkg.version) {
        throw new Error(\`Version mismatch: manifest.json(\${manifest.version}) != package.json(\${pkg.version})\`);
    }

    if (!manifest.server || !manifest.tools || !Array.isArray(manifest.tools)) {
        throw new Error('Invalid manifest structure');
    }

    console.log('Manifest validation passed');
" 2>/dev/null

if [ $? -ne 0 ]; then
    log_error "Manifest validation failed"
    exit 1
fi

log_success "Manifest validation passed"

# Create dist directory
mkdir -p dist

# Clean old builds
if [ -f "dist/${DXT_NAME}" ]; then
    log_warning "Removing existing build: ${DXT_NAME}"
    rm "dist/${DXT_NAME}"
fi

# Create DXT bundle (it's essentially a ZIP file)
log_info "Creating DXT bundle..."

# Create exclusion list
EXCLUSIONS=(
    "dist/*"
    "node_modules/*"
    ".git/*"
    ".github/*"
    "*.log"
    ".DS_Store"
    "build-dxt.sh"
    "RELEASE_NOTES.md"
    ".gitignore"
    "*.md"
)

# Build zip command with exclusions
ZIP_CMD="zip -r dist/${DXT_NAME} ."
for exclusion in "${EXCLUSIONS[@]}"; do
    ZIP_CMD+=" -x \"$exclusion\""
done

# Execute zip command
eval $ZIP_CMD > /dev/null

if [ $? -ne 0 ]; then
    log_error "Failed to create DXT bundle"
    exit 1
fi

# Also create a generic filename for latest
cp "dist/${DXT_NAME}" "dist/financial-data-mcp.dxt"

# Get file sizes
VERSIONED_SIZE=$(stat -f%z "dist/${DXT_NAME}" 2>/dev/null || stat -c%s "dist/${DXT_NAME}")
VERSIONED_SIZE_KB=$((VERSIONED_SIZE / 1024))

log_success "DXT bundle created successfully!"
echo ""
log_info "📦 Files created:"
echo "   📦 dist/${DXT_NAME} (${VERSIONED_SIZE_KB} KB)"
echo "   📦 dist/financial-data-mcp.dxt (latest)"
echo ""

# Validate bundle
log_info "Validating DXT bundle..."
unzip -t "dist/${DXT_NAME}" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    log_success "DXT bundle integrity check passed"
else
    log_error "DXT bundle integrity check failed"
    exit 1
fi

# List bundle contents
log_info "Bundle contents:"
unzip -l "dist/${DXT_NAME}" | grep -E "(manifest\.json|package\.json|server/)" | sed 's/^/   /'

echo ""
log_success "🚀 Ready for GitHub release!"
echo "   Upload to: https://github.com/lucianfialho/financialbreakfast-mcp/releases"