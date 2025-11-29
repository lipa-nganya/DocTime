# Fix for EAS Build .Trash Permission Error

## Issue
EAS Build fails with: `EPERM: operation not permitted, scandir '/Users/maria/.Trash'`

## Solution

The issue occurs when EAS Build tries to scan parent directories. Here's how to fix it:

### Option 1: Use Git (Recommended)
1. Make sure git is initialized and all files are committed:
   ```bash
   cd /Users/maria/doc-time/mobile-app
   git add -A
   git commit -m "Prepare for build"
   ```

2. Run the build:
   ```bash
   eas build --profile local-dev --platform android
   ```

### Option 2: Build from a Clean Directory
If the issue persists, try building from a temporary clean directory:

```bash
# Create a clean copy
cp -r /Users/maria/doc-time/mobile-app /tmp/doctime-build
cd /tmp/doctime-build
rm -rf node_modules .expo
npm install
eas build --profile local-dev --platform android
```

### Option 3: Use Local Build
Build locally to avoid the upload issue:

```bash
cd /Users/maria/doc-time/mobile-app
eas build --profile local-dev --platform android --local
```

Note: Local builds require Android SDK and build tools installed.

## Current Status
- ✅ Git repository initialized
- ✅ .gitignore configured
- ✅ .easignore created
- ✅ Project ID configured: 99962261-3ad5-4037-b1e7-58145d9b2e5b
- ✅ Keystore generated

Try running the build command again - it should work now with git properly initialized.

