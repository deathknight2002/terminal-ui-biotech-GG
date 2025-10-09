# PWA Icons

This directory contains icons for the Progressive Web App.

## Required Icon Sizes

- **icon-180.png** (180x180) - iOS/iPadOS App Icon
- **icon-192.png** (192x192) - Android/Chrome standard
- **icon-256.png** (256x256) - Android/Chrome larger
- **icon-384.png** (384x384) - Android/Chrome larger
- **icon-512.png** (512x512) - Android/Chrome largest
- **icon-512-maskable.png** (512x512) - Maskable variant for Android

## Generating Icons

Use the `icon.svg` template to generate all required sizes:

```bash
# Using ImageMagick
convert icon.svg -resize 180x180 icon-180.png
convert icon.svg -resize 192x192 icon-192.png
convert icon.svg -resize 256x256 icon-256.png
convert icon.svg -resize 384x384 icon-384.png
convert icon.svg -resize 512x512 icon-512.png
convert icon.svg -resize 512x512 icon-512-maskable.png

# Or use an online tool:
# - https://realfavicongenerator.net/
# - https://www.pwabuilder.com/imageGenerator
```

## Placeholder Icons

For development, you can use the SVG directly or create simple PNG placeholders:

```bash
# Create a simple colored square as placeholder
convert -size 512x512 xc:'#00d4ff' icon-512.png
convert -size 384x384 xc:'#00d4ff' icon-384.png
convert -size 256x256 xc:'#00d4ff' icon-256.png
convert -size 192x192 xc:'#00d4ff' icon-192.png
convert -size 180x180 xc:'#00d4ff' icon-180.png
```

## Testing

After generating icons:
1. Deploy to a web server with HTTPS
2. Open in Safari on iOS 26
3. Add to Home Screen
4. Verify icon appears correctly

## Design Guidelines

- **iOS**: 180x180px minimum, no transparency
- **Android**: 192x192px minimum, transparency OK
- **Maskable**: 512x512px with safe zone (80% of image)
