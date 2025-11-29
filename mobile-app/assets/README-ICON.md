# App Icon Generation

The app icon is defined in `icon.svg` with:
- Background color: #393D7E
- Icon color: #6DC3BB

To generate PNG icons from the SVG:

## Option 1: Using Python (Recommended)
```bash
cd mobile-app/scripts
pip install cairosvg pillow
python generate-icon.py
```

## Option 2: Using online tools
1. Open `icon.svg` in a browser or SVG editor
2. Export as PNG at 1024x1024 resolution
3. Save as `icon.png` and `adaptive-icon.png` in the `assets/` folder

## Option 3: Using ImageMagick (if installed)
```bash
convert -background none -resize 1024x1024 assets/icon.svg assets/icon.png
cp assets/icon.png assets/adaptive-icon.png
```

The icon will be included in the next build.

