# ngrok Setup for Doc Time

## Current Status

✅ **ngrok is running** on port 5001
✅ **URL**: `https://homiest-psychopharmacologic-anaya.ngrok-free.dev`
✅ **Backend**: Running on `http://localhost:5001`

## Important Notes

### ngrok Free Tier Limitations

- **URLs change** when you restart ngrok
- **Tunnels expire** after 2 hours of inactivity
- **Connection limits** apply

### Keep ngrok Running

To ensure the app works, **keep ngrok running**:

```bash
# Start ngrok (if not running)
cd /Users/maria/doc-time
ngrok http 5001

# Or run in background
ngrok http 5001 > ngrok.log 2>&1 &
```

### Check ngrok Status

```bash
# Check if ngrok is running
ps aux | grep ngrok | grep -v grep

# Get current ngrok URL
curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok[^"]*' | head -1
```

### If ngrok URL Changes

If ngrok restarts and gets a new URL:

1. **Get new URL:**
   ```bash
   curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok[^"]*' | head -1
   ```

2. **Update eas.json:**
   - Update `EXPO_PUBLIC_API_BASE_URL` in `local-dev` and `cloud-dev` profiles

3. **Publish OTA update:**
   ```bash
   cd mobile-app
   eas update --branch local-dev --message "Update ngrok URL"
   ```

### For Production

When ready for production:
- Use a **paid ngrok plan** for static URLs, OR
- Deploy backend to **Google Cloud Run** or similar
- Update `cloud-dev` profile with production URL

## Current Configuration

- **Backend Port**: 5001
- **ngrok URL**: `https://homiest-psychopharmacologic-anaya.ngrok-free.dev`
- **App Config**: Uses ngrok URL for `local-dev` builds

## Troubleshooting

**"Failed to send OTP" error:**
1. Check if backend is running: `curl http://localhost:5001/health`
2. Check if ngrok is running: `ps aux | grep ngrok`
3. Test ngrok URL: `curl https://homiest-psychopharmacologic-anaya.ngrok-free.dev/api/health`
4. Restart ngrok if needed: `pkill ngrok && ngrok http 5001`

**ngrok tunnel offline:**
- Restart ngrok: `ngrok http 5001`
- Check backend is running on port 5001
- Verify firewall isn't blocking

