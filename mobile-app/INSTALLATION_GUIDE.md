# Doc Time Installation Guide

## Google Play Protect Warning

When installing the APK on Android, Google Play Protect may show a warning. This is normal for development builds.

### How to Install Despite the Warning

1. **On the Warning Screen:**
   - Tap "OK" to dismiss the warning
   - You'll see "App not installed" - this is expected

2. **Enable Installation from Unknown Sources:**
   - Go to **Settings** > **Security** (or **Apps** > **Special access**)
   - Enable **"Install unknown apps"** or **"Unknown sources"**
   - Select your file manager or browser
   - Enable **"Allow from this source"**

3. **Alternative Method:**
   - Go to **Settings** > **Apps** > **Google Play Protect**
   - Tap **Settings** (gear icon)
   - Turn OFF **"Scan apps with Play Protect"** temporarily
   - Install the APK
   - Turn Play Protect back ON after installation

4. **Install the APK:**
   - Open the downloaded APK file
   - Tap **"Install anyway"** or **"Install"**
   - The app will install successfully

### Why This Happens

- The app requests sensitive permissions (contacts, SMS, biometrics)
- It's not signed by Google Play
- It's a development build from an external source

### Reducing Warnings (For Production)

1. **Sign the APK properly** with a release keystore
2. **Publish to Google Play Store** (recommended)
3. **Use Google Play App Signing** for better trust
4. **Add privacy policy** and app description
5. **Request only necessary permissions**

### Current Permissions Used

- `INTERNET` - For API calls
- `ACCESS_NETWORK_STATE` - Check connectivity
- `READ_CONTACTS` - For case referrals
- `SEND_SMS` / `RECEIVE_SMS` - For referral SMS
- `USE_BIOMETRIC` / `USE_FINGERPRINT` - For login

All permissions are necessary for app functionality.

### After Installation

Once installed, the app will work normally. Google Play Protect warnings only appear during installation, not when using the app.

