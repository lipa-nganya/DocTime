#!/usr/bin/env node

/**
 * Post-build script for regular web app (not PWA)
 * This runs after `expo export` to add basic web app support
 */

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const assetsDir = path.join(__dirname, '..', 'assets');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  console.error('❌ dist directory not found. Run "npx expo export --platform web" first.');
  process.exit(1);
}

// Create minimal manifest.json (for basic metadata only, not PWA)
const manifest = {
  name: 'Doc Time',
  description: 'Medical case management app for doctors',
  theme_color: '#4ECDC4',
  background_color: '#F8F9FA'
};

// Write manifest.json
const manifestPath = path.join(distDir, 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('✅ Created manifest.json');

// Update index.html to include manifest but NO service worker
const indexPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  
  // Remove service worker registration if present
  html = html.replace(/<script>[\s\S]*?service-worker[\s\S]*?<\/script>/gi, '');
  html = html.replace(/navigator\.serviceWorker\.register\([^)]+\)[\s\S]*?;/gi, '');
  
  // Add manifest link if not present
  if (!html.includes('manifest.json')) {
    html = html.replace(
      '<link rel="icon" href="/favicon.ico" />',
      '<link rel="icon" href="/favicon.ico" />\n    <link rel="manifest" href="/manifest.json" />'
    );
  }
  
  // Remove PWA-related meta tags if present
  html = html.replace(/<meta name="apple-mobile-web-app-capable"[^>]*>/gi, '');
  html = html.replace(/<meta name="apple-mobile-web-app-status-bar-style"[^>]*>/gi, '');
  html = html.replace(/<meta name="apple-mobile-web-app-title"[^>]*>/gi, '');
  html = html.replace(/<meta name="mobile-web-app-capable"[^>]*>/gi, '');
  
  fs.writeFileSync(indexPath, html);
  console.log('✅ Updated index.html (removed PWA features, added basic manifest)');
} else {
  console.warn('⚠️  index.html not found, skipping update');
}

// Copy icon to dist if it doesn't exist
const iconDest = path.join(distDir, 'assets', 'icon.png');
const iconSrc = path.join(assetsDir, 'icon.png');
if (fs.existsSync(iconSrc)) {
  const iconDestDir = path.dirname(iconDest);
  if (!fs.existsSync(iconDestDir)) {
    fs.mkdirSync(iconDestDir, { recursive: true });
  }
  if (!fs.existsSync(iconDest)) {
    fs.copyFileSync(iconSrc, iconDest);
    console.log('✅ Copied icon.png to dist/assets/');
  }
}

console.log('✅ Web app files generated successfully!');
console.log('📦 Ready to serve from: ' + distDir);

