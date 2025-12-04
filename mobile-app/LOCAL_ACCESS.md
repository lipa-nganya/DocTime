# Accessing Doc Time PWA Locally

## Quick Start

### Option 1: Using the npm script (Easiest)

```bash
cd /Users/maria/doc-time/mobile-app
npm run serve:web
```

This will:
1. Build the PWA
2. Start a local server on port 8080
3. Open your browser to `http://localhost:8080`

### Option 2: Build once, serve separately

```bash
# Build the PWA (only needed once or when you make changes)
cd /Users/maria/doc-time/mobile-app
npm run build:pwa

# Then serve it
npm run serve
```

Visit: `http://localhost:8080`

## Other Options

### Option 3: Using Python HTTP Server (Manual)

```bash
cd /Users/maria/doc-time/mobile-app/dist
python3 -m http.server 8080
```

Then open: `http://localhost:8080`

### Option 4: Using Node.js http-server

```bash
# Install globally (one time)
npm install -g http-server

# Serve the dist folder
cd /Users/maria/doc-time/mobile-app
http-server dist -p 8080
```

### Option 5: Using Expo Dev Server (Development Mode)

For development with hot reload:

```bash
cd /Users/maria/doc-time/mobile-app
npm start
# Then press 'w' to open in web browser
```

This runs in development mode with hot reload, but doesn't include PWA features.

## Testing PWA Features

### Install the PWA

1. **Chrome/Edge (Desktop):**
   - Open `http://localhost:8080`
   - Look for the install icon (⊕) in the address bar
   - Click "Install" to add to desktop

2. **Chrome (Android):**
   - Make sure your phone and computer are on the same Wi-Fi
   - Find your computer's IP address:
     ```bash
     ipconfig getifaddr en0  # Mac
     # or
     ifconfig | grep "inet " | grep -v 127.0.0.1
     ```
   - On your phone, visit: `http://YOUR_IP:8080`
   - Tap menu (⋮) → "Add to Home screen"

3. **Safari (iOS):**
   - Visit `http://YOUR_IP:8080` on your iPhone/iPad
   - Tap Share (□↑) → "Add to Home Screen"

### Test Service Worker

1. Open Chrome DevTools (F12)
2. Go to **Application** tab
3. Check **Service Workers** - should show "activated and running"
4. Check **Manifest** - should show all PWA details
5. Go to **Network** tab → Check "Offline" → Refresh page (should still work)

### Test Offline Mode

1. Open the app in browser
2. Open DevTools → Network tab
3. Check "Offline" checkbox
4. Refresh the page
5. The app should still load (cached by service worker)

## Important Notes

### HTTPS Requirement

- **Service Workers** require HTTPS (or `localhost` for development)
- `localhost` works for local testing ✅
- For production, you MUST use HTTPS

### CORS Issues

If you see CORS errors when accessing the API:
- The API server needs to allow requests from `http://localhost:8080`
- Check backend CORS configuration in `backend/server.js`

### Port Already in Use?

If port 8080 is busy, use a different port:

```bash
# Python
python3 -m http.server 3000

# Or update package.json serve script to use different port
```

## Troubleshooting

### "Service Worker registration failed"
- Make sure you're accessing via `localhost` (not `127.0.0.1`)
- Check browser console for errors
- Service workers only work over HTTPS or localhost

### "Manifest not found"
- Make sure you ran `npm run build:pwa` first
- Check that `dist/manifest.json` exists

### App not loading
- Check browser console for errors
- Verify the build completed successfully
- Make sure you're serving from the `dist` folder

### API calls failing
- Check that backend server is running
- Verify API URL in `app.config.js`
- Check CORS settings on backend

## Development Workflow

1. **Make code changes** in `src/`
2. **Rebuild PWA:**
   ```bash
   npm run build:pwa
   ```
3. **Refresh browser** (or restart server if needed)

For faster development, use `npm start` and press `w` for web, but note:
- Development mode doesn't include PWA features
- Use `build:pwa` for full PWA testing

