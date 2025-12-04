/**
 * SMS Reading Utility for OTP Auto-population
 * 
 * Note: Reading SMS requires native Android permissions and a custom native module.
 * This is a placeholder implementation. For full SMS reading support, you'll need to:
 * 1. Create a custom native module for Android SMS reading
 * 2. Request READ_SMS permission
 * 3. Implement SMS receiver broadcast listener
 * 
 * For now, this provides a structure for future implementation.
 */

import { Platform } from 'react-native';

/**
 * Extract OTP from SMS message
 * Looks for patterns like: "Your Doc Time verification code is: 1234"
 */
export function extractOTPFromMessage(message) {
  if (!message) return null;
  
  // Pattern 1: "Your Doc Time verification code is: 1234"
  let match = message.match(/verification code is:\s*(\d{4})/i);
  if (match) return match[1];
  
  // Pattern 2: "Your OTP is: 1234"
  match = message.match(/OTP is:\s*(\d{4})/i);
  if (match) return match[1];
  
  // Pattern 3: "Code: 1234"
  match = message.match(/code:\s*(\d{4})/i);
  if (match) return match[1];
  
  // Pattern 4: Any 4-digit number
  match = message.match(/\b(\d{4})\b/);
  if (match) return match[1];
  
  return null;
}

/**
 * Check if SMS is from the configured sender ID
 */
export function isOTPSMS(message, senderId = 'WOLFGANG') {
  if (!message) return false;
  
  // Check if message contains Doc Time or verification code
  const isDocTimeMessage = 
    message.toLowerCase().includes('doc time') ||
    message.toLowerCase().includes('verification code') ||
    message.toLowerCase().includes('otp');
  
  return isDocTimeMessage;
}

/**
 * Android SMS Reading (requires custom native module)
 * 
 * To implement:
 * 1. Create a custom native module: android/app/src/main/java/com/doctime/SMSReaderModule.java
 * 2. Request READ_SMS permission in AndroidManifest.xml
 * 3. Implement BroadcastReceiver for SMS_RECEIVED
 * 4. Expose method to React Native via NativeModules
 * 
 * Example native module structure:
 * 
 * public class SMSReaderModule extends ReactContextBaseJavaModule {
 *   @ReactMethod
 *   public void startListening(Promise promise) {
 *     // Register SMS receiver
 *   }
 *   
 *   @ReactMethod
 *   public void stopListening() {
 *     // Unregister SMS receiver
 *   }
 * }
 */
export async function startSMSListening(callback) {
  if (Platform.OS !== 'android') {
    console.warn('SMS reading is only supported on Android');
    return;
  }
  
  // TODO: Implement native module integration
  // For now, this is a placeholder
  console.log('📱 SMS listening would be enabled here with native module');
  
  // Example of how it would work:
  // const { SMSReaderModule } = require('react-native').NativeModules;
  // SMSReaderModule.startListening((error, sms) => {
  //   if (!error && sms) {
  //     const otp = extractOTPFromMessage(sms.body);
  //     if (otp && isOTPSMS(sms.body)) {
  //       callback(otp);
  //     }
  //   }
  // });
}

export async function stopSMSListening() {
  if (Platform.OS !== 'android') {
    return;
  }
  
  // TODO: Implement native module integration
  console.log('📱 SMS listening would be stopped here');
}

