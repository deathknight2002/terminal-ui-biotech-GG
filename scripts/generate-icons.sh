#!/bin/bash
# Generate placeholder PWA icons for development
# Requires ImageMagick: sudo apt-get install imagemagick (Linux) or brew install imagemagick (macOS)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ICONS_DIR="$SCRIPT_DIR/../terminal/public/icons"
SVG_FILE="$ICONS_DIR/icon.svg"

echo "🎨 Generating PWA Icons..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "⚠️  ImageMagick not found. Install with:"
    echo "   - Linux: sudo apt-get install imagemagick"
    echo "   - macOS: brew install imagemagick"
    echo "   - Windows: https://imagemagick.org/script/download.php"
    echo ""
    echo "Or use an online generator:"
    echo "   - https://realfavicongenerator.net/"
    echo "   - https://www.pwabuilder.com/imageGenerator"
    exit 1
fi

# Convert SVG to PNG at various sizes
cd "$ICONS_DIR"

echo "  📐 Generating icon-180.png (iOS/iPadOS App Icon)..."
convert "$SVG_FILE" -resize 180x180 -background none icon-180.png

echo "  📐 Generating icon-192.png (Android/Chrome)..."
convert "$SVG_FILE" -resize 192x192 -background none icon-192.png

echo "  📐 Generating icon-256.png..."
convert "$SVG_FILE" -resize 256x256 -background none icon-256.png

echo "  📐 Generating icon-384.png..."
convert "$SVG_FILE" -resize 384x384 -background none icon-384.png

echo "  📐 Generating icon-512.png..."
convert "$SVG_FILE" -resize 512x512 -background none icon-512.png

echo "  📐 Generating icon-512-maskable.png..."
convert "$SVG_FILE" -resize 512x512 -background none icon-512-maskable.png

echo ""
echo "✅ Icons generated successfully!"
echo ""
echo "📱 Next steps:"
echo "   1. Build the terminal app: cd terminal && npm run build"
echo "   2. Deploy to HTTPS server (required for PWA)"
echo "   3. Open in Safari on iOS 26"
echo "   4. Add to Home Screen"
echo ""
echo "📖 See docs/IOS_PWA_GUIDE.md for detailed installation instructions"
