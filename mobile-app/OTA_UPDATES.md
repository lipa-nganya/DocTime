# OTA (Over-The-Air) Updates Guide

## What is OTA Updates?

OTA updates allow you to push code changes to your app without rebuilding and redistributing the APK. Users get updates automatically when they open the app.

## How It Works

1. **Make code changes** in your React Native/JavaScript code
2. **Publish update** using `eas update`
3. **Users get update** automatically next time they open the app

## Publishing Updates

### For Local-Dev Build:
```bash
cd /Users/maria/doc-time/mobile-app
eas update --branch local-dev --message "Your update message"
```

### For Cloud-Dev Build:
```bash
cd /Users/maria/doc-time/mobile-app
eas update --branch cloud-dev --message "Your update message"
```

## What Can Be Updated OTA

✅ **Can Update:**
- JavaScript/TypeScript code
- React components
- Styles and UI
- Business logic
- API endpoints
- Assets (images, fonts)

❌ **Cannot Update:**
- Native code changes
- New native dependencies
- App version number
- App permissions
- Native module configurations

## Update Channels

- **local-dev**: Updates for local-dev builds
- **cloud-dev**: Updates for cloud-dev builds
- **production**: Updates for production builds (when ready)

## Current Setup

- ✅ Expo Updates installed
- ✅ Update channels configured
- ✅ Auto-check on app load enabled
- ✅ Update URL configured: `https://u.expo.dev/99962261-3ad5-4037-b1e7-58145d9b2e5b`

## Testing Updates

1. **Publish an update:**
   ```bash
   eas update --branch local-dev --message "Test update"
   ```

2. **Close and reopen the app** - update will download automatically

3. **Check update status:**
   ```bash
   eas update:list --branch local-dev
   ```

## Rollback Updates

If an update causes issues:
```bash
eas update:rollback --branch local-dev
```

## Best Practices

1. **Test updates** on a test device first
2. **Use descriptive messages** for each update
3. **Monitor update status** via Expo dashboard
4. **Keep builds up to date** - OTA updates require a recent build

## Current Status

The OTP fix has been published to the `local-dev` channel. Users with the local-dev app installed will get the update automatically when they:
1. Close the app completely
2. Reopen it
3. The update downloads and applies automatically

No need to rebuild or reinstall!

