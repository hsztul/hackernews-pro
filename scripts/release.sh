#!/bin/bash

# Simple release script for HackerNews Navigator Extension
# Usage: ./scripts/release.sh [version]
# Example: ./scripts/release.sh 1.1.0

set -e

# Get version from argument or extract from manifest.json
if [ "$1" ]; then
    VERSION="$1"
else
    VERSION=$(jq -r '.version' manifest.json)
fi

echo "🚀 Creating release for version $VERSION"

# Update manifest.json version if provided as argument
if [ "$1" ]; then
    echo "📝 Updating manifest.json to version $VERSION"
    jq ".version = \"$VERSION\"" manifest.json > manifest.json.tmp
    mv manifest.json.tmp manifest.json
fi

# Create local package for testing
echo "📦 Creating local package..."
mkdir -p dist
cp manifest.json content_script.js styles.css background.js README.md dist/
cd dist
zip -r "../hnav-extension-v$VERSION.zip" .
cd ..
rm -rf dist

echo "✅ Created: hnav-extension-v$VERSION.zip"

# Git operations
echo "📋 Committing changes..."
git add .
git commit -m "Release v$VERSION" || echo "No changes to commit"

echo "🏷️  Creating git tag..."
git tag -a "v$VERSION" -m "Release version $VERSION"

echo "⬆️  Pushing to origin..."
git push origin main
git push origin "v$VERSION"

echo ""
echo "🎉 Release v$VERSION created successfully!"
echo ""
echo "The GitHub Action will now:"
echo "1. Package the extension automatically"
echo "2. Create a GitHub release with the packaged files"
echo "3. Make it available for download"
echo ""
echo "Local package created: hnav-extension-v$VERSION.zip"
echo "You can test this locally by loading it as an unpacked extension in Chrome."
