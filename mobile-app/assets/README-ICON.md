# App Icon Generation

The app icon is defined in `icon.svg` with:
- Background color: #393D7E
- Icon color: #6DC3BB

## Recommended Icon Sizes

For Expo apps, the recommended sizes are:

- **`icon.png`**: **1024x1024 pixels** (Expo will automatically generate all required sizes for iOS and Android from this)
- **`adaptive-icon.png`**: **1024x1024 pixels** (Used for Android adaptive icons)
- **`favicon.png`**: 512x512 pixels (Optional, for web)

> **Note**: Expo automatically generates all platform-specific icon sizes from a single 1024x1024 source image, so you only need to provide one high-resolution icon.

## Generating PNG Icons from SVG

### Option 1: Using Python (Recommended)
```bash
cd mobile-app/scripts
pip install cairosvg pillow
python generate-icon.py
```
This will generate both `icon.png` and `adaptive-icon.png` at 1024x1024.

### Option 2: Using Online Tools
1. Open `icon.svg` in a browser or SVG editor (e.g., Inkscape, Figma)
2. Export as PNG at **1024x1024 pixels** resolution
3. Save as `icon.png` and `adaptive-icon.png` in the `assets/` folder

### Option 3: Using ImageMagick (if installed)
```bash
convert -background none -resize 1024x1024 assets/icon.svg assets/icon.png
cp assets/icon.png assets/adaptive-icon.png
```

### Option 4: Using Inkscape (Command Line)
```bash
inkscape --export-type=png --export-width=1024 --export-height=1024 assets/icon.svg --export-filename=assets/icon.png
cp assets/icon.png assets/adaptive-icon.png
```

The icon will be included in the next build.

