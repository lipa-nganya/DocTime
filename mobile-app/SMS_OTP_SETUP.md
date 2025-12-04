# SMS OTP Auto-Population Setup

## Current Implementation

### ✅ Completed
1. **4-Box OTP Input**: The Sign Up screen now uses 4 separate rectangular input boxes for OTP entry
2. **Advanta SMS Service**: Already configured with credentials from dial a drink project:
   - API Key: `d25f14bfa5afdbb8035c464568f82a89`
   - Partner ID: `14944`
   - Sender ID: `WOLFGANG`
   - API URL: `https://quicksms.advantasms.com`

3. **SMS Reading Structure**: Framework in place for auto-populating OTP from SMS

### ⚠️ Requires Additional Setup

**SMS Auto-Population** requires a custom native Android module because:
- Expo's `expo-sms` doesn't support reading incoming SMS
- Android requires `READ_SMS` permission and a BroadcastReceiver
- This needs to be implemented as a custom native module

## Implementation Steps for Full SMS Reading

### Option 1: Custom Native Module (Recommended)

1. **Create Native Module** (`android/app/src/main/java/com/doctime/SMSReaderModule.java`):
```java
package com.doctime;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import android.telephony.SmsMessage;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class SMSReaderModule extends ReactContextBaseJavaModule {
    private BroadcastReceiver smsReceiver;
    
    public SMSReaderModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }
    
    @Override
    public String getName() {
        return "SMSReader";
    }
    
    @ReactMethod
    public void startListening() {
        IntentFilter filter = new IntentFilter("android.provider.Telephony.SMS_RECEIVED");
        smsReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                Bundle bundle = intent.getExtras();
                if (bundle != null) {
                    Object[] pdus = (Object[]) bundle.get("pdus");
                    for (Object pdu : pdus) {
                        SmsMessage sms = SmsMessage.createFromPdu((byte[]) pdu);
                        String message = sms.getMessageBody();
                        String sender = sms.getDisplayOriginatingAddress();
                        
                        // Send to React Native
                        getReactApplicationContext()
                            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                            .emit("onSMSReceived", message);
                    }
                }
            }
        };
        getReactApplicationContext().registerReceiver(smsReceiver, filter);
    }
    
    @ReactMethod
    public void stopListening() {
        if (smsReceiver != null) {
            getReactApplicationContext().unregisterReceiver(smsReceiver);
            smsReceiver = null;
        }
    }
}
```

2. **Add Permission** to `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.READ_SMS" />
<uses-permission android:name="android.permission.RECEIVE_SMS" />
```

3. **Update React Native Code** in `src/utils/smsReader.js`:
```javascript
import { NativeModules, NativeEventEmitter } from 'react-native';

const { SMSReader } = NativeModules;
const smsEmitter = new NativeEventEmitter(SMSReader);

export async function startSMSListening(callback) {
  if (Platform.OS !== 'android' || !SMSReader) {
    return;
  }
  
  SMSReader.startListening();
  
  const subscription = smsEmitter.addListener('onSMSReceived', (message) => {
    const otp = extractOTPFromMessage(message);
    if (otp && isOTPSMS(message)) {
      callback(otp);
    }
  });
  
  return subscription;
}
```

### Option 2: Use Existing Library

Install `react-native-android-sms-listener`:
```bash
npm install react-native-android-sms-listener
```

Then update `src/utils/smsReader.js` to use it.

## Current OTP Input Features

- ✅ 4 separate rectangular input boxes
- ✅ Auto-advance to next box on input
- ✅ Auto-submit when all 4 digits entered
- ✅ Paste support (splits across boxes)
- ✅ Backspace navigation
- ✅ Visual feedback with border color `#00c4cc`

## Testing

1. **Test OTP Input**:
   - Enter digits one by one - should auto-advance
   - Paste 4-digit code - should populate all boxes
   - Complete all 4 digits - should auto-verify

2. **Test SMS Sending**:
   - Request OTP from Sign Up screen
   - Check phone for SMS from "WOLFGANG"
   - Message format: "Your Doc Time verification code is: 1234. Valid for 10 minutes."

3. **Test Auto-Population** (after native module):
   - Request OTP
   - When SMS arrives, OTP should auto-populate in boxes
   - Should auto-verify after population

## Environment Variables

The SMS service uses these environment variables (with defaults from dial a drink):
- `ADVANTA_API_KEY` (default: `d25f14bfa5afdbb8035c464568f82a89`)
- `ADVANTA_PARTNER_ID` (default: `14944`)
- `ADVANTA_SENDER_ID` (default: `WOLFGANG`)
- `ADVANTA_API_URL` (default: `https://quicksms.advantasms.com`)

To override, set these in your backend `.env` file.

