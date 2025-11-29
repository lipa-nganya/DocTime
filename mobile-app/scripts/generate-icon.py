#!/usr/bin/env python3
"""
Generate app icon from SVG
Requires: pip install cairosvg pillow
"""
import cairosvg
from PIL import Image
import io

# SVG content
svg_content = '''<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="512" cy="512" r="512" fill="#393D7E"/>
  <g transform="translate(512, 512)">
    <rect x="-120" y="-30" width="240" height="60" rx="10" fill="#6DC3BB"/>
    <rect x="-30" y="-120" width="60" height="240" rx="10" fill="#6DC3BB"/>
  </g>
</svg>'''

# Convert SVG to PNG
png_data = cairosvg.svg2png(bytestring=svg_content.encode('utf-8'), output_width=1024, output_height=1024)

# Save as icon.png
with open('../assets/icon.png', 'wb') as f:
    f.write(png_data)

# Also create adaptive-icon foreground (1024x1024)
with open('../assets/adaptive-icon.png', 'wb') as f:
    f.write(png_data)

print("✅ Icons generated successfully!")

