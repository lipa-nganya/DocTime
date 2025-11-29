# Client Installation Guide - Doc Time App

## Simple Installation for Your Client

Once the build is complete, you'll receive a download link that you can share with your client.

### What Your Client Needs to Do:

1. **Click the download link** you provide them
2. **Download the APK file** to their Android phone
3. **Open the downloaded file** when prompted
4. **Allow installation** from unknown sources (one-time permission)
5. **Install the app** - tap "Install"
6. **Open the app** and start using it!

### Installation Steps (For Your Client):

1. **Download the APK:**
   - Click the link you send them
   - The file will download to their phone
   - Look for "Doc Time.apk" in Downloads

2. **Install the App:**
   - Tap the downloaded file
   - If you see "Install blocked", tap "Settings"
   - Enable "Install unknown apps" or "Allow from this source"
   - Go back and tap "Install"
   - Tap "Open" when installation completes

3. **First Launch:**
   - The app will open automatically
   - Sign up with phone number
   - Enter OTP code received via SMS
   - Set up PIN
   - Select role (Surgeon, Anaesthetist, etc.)
   - Start using the app!

### What You Need to Provide:

1. **Download Link:**
   - After build completes, you'll get a URL like:
   - `https://expo.dev/artifacts/...` or direct download link
   - Share this link with your client via SMS, email, or WhatsApp

2. **Simple Instructions:**
   - "Click this link to download Doc Time app"
   - "Install the downloaded file"
   - "Open the app and sign up"

### Alternative: Share via Expo Go (Temporary)

If you want to test quickly before the standalone build:

1. **Build with Expo Go:**
   ```bash
   eas build --profile preview --platform android
   ```

2. **Share QR Code:**
   - Client installs Expo Go from Play Store
   - Scan QR code to open your app
   - This is temporary - standalone APK is better for production

### Troubleshooting for Client:

**"App blocked" warning:**
- This is normal for apps not from Play Store
- Tap "Install anyway" or enable "Install unknown apps"
- The app is safe - it's just Google being cautious

**Can't download:**
- Make sure they're using Android phone (not iPhone)
- Check internet connection
- Try downloading on Wi-Fi instead of mobile data

**App won't open:**
- Make sure backend server is running
- Check that ngrok URL is still active
- Contact you for support

### For Production (Future):

When ready for production:
1. Publish to Google Play Store (recommended)
2. Or use Expo's internal distribution
3. Or host APK on your own server

### Current Setup:

- **Build Profile:** `cloud-dev` (standalone APK)
- **Backend URL:** Configured to use ngrok URL
- **No dev server needed** - app works independently
- **Version:** 1.0.1

Once the build completes, you'll have a simple download link to share!

