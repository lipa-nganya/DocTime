# Connecting Doc Time App to Development Server

## App Successfully Installed! ✅

The "Doc Time (Local) Development Build" app is now installed on your Android device.

## Connect to Development Server

### Method 1: Scan QR Code (Easiest)

1. **Start Expo Dev Server:**
   ```bash
   cd /Users/maria/doc-time/mobile-app
   npm start
   ```

2. **On Your Phone:**
   - Open the "Doc Time (Local)" app
   - Tap "Scan QR Code"
   - Point camera at the QR code shown in terminal
   - The app will connect automatically

### Method 2: Manual Connection

1. **Get Your Computer's IP Address:**
   - On Mac: `ipconfig getifaddr en0` or check System Settings → Network
   - Example: `192.168.1.100`

2. **Start Expo Server:**
   ```bash
   cd /Users/maria/doc-time/mobile-app
   npm start
   ```

3. **In the App:**
   - Tap the URL field (currently shows `http://localhost:8081`)
   - Change `localhost` to your computer's IP address
   - Example: `http://192.168.1.100:8081`
   - Tap "Connect"

### Method 3: Fetch Development Servers

1. **Make sure your phone and computer are on the same Wi-Fi network**

2. **Start Expo Server:**
   ```bash
   cd /Users/maria/doc-time/mobile-app
   npm start
   ```

3. **In the App:**
   - Tap "Fetch development servers"
   - Your server should appear in the list
   - Tap on it to connect

## Troubleshooting

### Can't Connect?

1. **Check Wi-Fi:**
   - Phone and computer must be on the same network
   - Try disabling VPN if active

2. **Check Firewall:**
   - Allow port 8081 through firewall
   - On Mac: System Settings → Network → Firewall

3. **Check Expo Server:**
   - Make sure `npm start` is running
   - Look for QR code in terminal
   - Check for any error messages

4. **Try Tunnel Mode:**
   ```bash
   npm start -- --tunnel
   ```
   This uses Expo's tunnel service (slower but works across networks)

### Server Not Showing?

- Make sure Expo server is running (`npm start`)
- Check that both devices are on same Wi-Fi
- Try restarting Expo server: Press `r` in terminal, then restart

## Once Connected

After connecting, the app will:
- Load your React Native code
- Show the Doc Time app interface
- Hot reload when you make code changes
- Show error messages in the app if something breaks

## Development Workflow

1. **Make code changes** in `/Users/maria/doc-time/mobile-app/src/`
2. **Save files** - changes will auto-reload in the app
3. **Check terminal** for any errors or warnings
4. **Test features** directly on your device

## Backend Connection

The app is configured to connect to:
- **Local Dev**: `https://homiest-psychopharmacologic-anaya.ngrok-free.dev`
- Make sure your backend is running: `cd backend && npm start`
- Backend should be accessible at `http://localhost:5001`

Happy coding! 🚀

