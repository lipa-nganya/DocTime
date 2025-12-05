const axios = require('axios');

/**
 * Format phone number for Kenyan numbers
 */
function formatPhoneNumber(phone) {
  if (!phone) return null;
  
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }
  
  if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  
  cleaned = cleaned.replace(/\D/g, '');
  
  if (cleaned.length === 12 && cleaned.startsWith('254')) {
    return cleaned;
  }
  
  console.warn(`Invalid phone number format: ${phone} -> ${cleaned}`);
  return cleaned;
}

/**
 * Send SMS using Advanta SMS API
 */
async function sendSMS(phoneNumber, message) {
  // In dev/local mode, disable SMS by default
  // Only send SMS if explicitly enabled with ENABLE_SMS=true
  const isLocalDev = process.env.NODE_ENV === 'development' || 
                     process.env.NODE_ENV !== 'production' ||
                     process.env.ENVIRONMENT === 'local';
  
  // Always disable SMS in dev unless explicitly enabled
  if (isLocalDev && process.env.ENABLE_SMS !== 'true') {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📱 LOCAL DEV MODE - SMS NOT SENT');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Phone Number: ${formattedPhone || phoneNumber}`);
    console.log(`Message: ${message}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('ℹ️  Set ENABLE_SMS=true to send actual SMS in local');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    
    return {
      success: true,
      messageId: 'local-dev-no-sms',
      mobile: formattedPhone || phoneNumber,
      localDev: true
    };
  }
  
  try {
    const apiKey = process.env.ADVANTA_API_KEY || 'd25f14bfa5afdbb8035c464568f82a89';
    const partnerID = process.env.ADVANTA_PARTNER_ID || '14944';
    const shortcode = process.env.ADVANTA_SENDER_ID || 'WOLFGANG';
    const baseUrl = process.env.ADVANTA_API_URL || 'https://quicksms.advantasms.com';
    
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    if (!formattedPhone) {
      throw new Error(`Invalid phone number: ${phoneNumber}`);
    }
    
    const payload = {
      apikey: apiKey,
      partnerID: partnerID,
      message: message,
      shortcode: shortcode,
      mobile: formattedPhone
    };
    
    console.log(`📱 Sending SMS to ${formattedPhone} via Advanta API`);
    
    const response = await axios.post(`${baseUrl}/api/services/sendsms/`, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    if (response.data && response.data.responses && response.data.responses[0]) {
      const smsResponse = response.data.responses[0];
      
      // Check for success - response-code can be string '200', number 200, or response-description might be 'Success'
      const responseCode = smsResponse['response-code'];
      const responseDescription = smsResponse['response-description'] || smsResponse['response-description'] || '';
      
      // Success conditions: response-code is 200 (string or number) OR response-description is 'Success'
      const isSuccess = responseCode === '200' || 
                       responseCode === 200 || 
                       responseDescription.toLowerCase().includes('success') ||
                       responseDescription.toLowerCase() === 'success';
      
      if (isSuccess) {
        console.log(`✅ SMS sent successfully to ${formattedPhone}`);
        return {
          success: true,
          messageId: smsResponse['messageid'] || smsResponse.messageid || 'unknown',
          mobile: formattedPhone,
          networkId: smsResponse['networkid'] || smsResponse.networkid || 'unknown'
        };
      } else {
        throw new Error(`SMS API error: ${responseDescription || 'Unknown error'}`);
      }
    }
    
    // Also check if response.data itself indicates success
    if (response.data && (response.data.success || response.data.status === 'success')) {
      console.log(`✅ SMS sent successfully to ${formattedPhone}`);
      return {
        success: true,
        messageId: response.data.messageId || 'unknown',
        mobile: formattedPhone
      };
    }
    
    throw new Error('Unexpected response format from SMS API');
  } catch (error) {
    console.error('❌ Error sending SMS:', error.message);
    
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    
    throw error;
  }
}

/**
 * Send OTP using Advanta SMS API
 */
async function sendOTP(phoneNumber, otp) {
  // In dev/local mode, disable SMS by default
  // Only send SMS if explicitly enabled with ENABLE_SMS=true
  const isLocalDev = process.env.NODE_ENV === 'development' || 
                     process.env.NODE_ENV !== 'production' ||
                     process.env.ENVIRONMENT === 'local';
  
  // Always disable SMS in dev unless explicitly enabled
  if (isLocalDev && process.env.ENABLE_SMS !== 'true') {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📱 LOCAL DEV MODE - OTP NOT SENT');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Phone Number: ${formattedPhone || phoneNumber}`);
    console.log(`OTP: ${otp}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('ℹ️  Set ENABLE_SMS=true to send actual OTP in local');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    
    return {
      success: true,
      messageId: 'local-dev-no-otp',
      mobile: formattedPhone || phoneNumber,
      localDev: true
    };
  }
  
  try {
    const apiKey = process.env.ADVANTA_API_KEY || 'd25f14bfa5afdbb8035c464568f82a89';
    const partnerID = process.env.ADVANTA_PARTNER_ID || '14944';
    const shortcode = process.env.ADVANTA_SENDER_ID || 'WOLFGANG';
    const baseUrl = process.env.ADVANTA_API_URL || 'https://quicksms.advantasms.com';
    
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    if (!formattedPhone) {
      throw new Error(`Invalid phone number: ${phoneNumber}`);
    }
    
    const payload = {
      apikey: apiKey,
      partnerID: partnerID,
      message: `Your Doc Time verification code is: ${otp}. Valid for 10 minutes.`,
      shortcode: shortcode,
      mobile: formattedPhone
    };
    
    console.log(`📱 Sending OTP to ${formattedPhone} via Advanta API`);
    
    const response = await axios.post(`${baseUrl}/api/services/sendotp/`, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    // Check multiple response formats
    if (response.data && response.data.responses && response.data.responses[0]) {
      const otpResponse = response.data.responses[0];
      
      // Check for success - response-code can be string '200' or number 200
      const responseCode = otpResponse['response-code'];
      const responseDescription = otpResponse['response-description'] || otpResponse['response-description'] || '';
      
      // Success conditions: response-code is 200 OR response-description indicates success
      const isSuccess = responseCode === '200' || 
                       responseCode === 200 || 
                       responseDescription.toLowerCase().includes('success') ||
                       responseDescription.toLowerCase() === 'success';
      
      if (isSuccess) {
        console.log(`✅ OTP sent successfully to ${formattedPhone}`);
        return {
          success: true,
          messageId: otpResponse['messageid'] || otpResponse.messageid || 'unknown',
          mobile: formattedPhone
        };
      } else {
        const errorMsg = responseDescription || 'Unknown error';
        
        if (errorMsg.includes('credit') || errorMsg.includes('balance')) {
          console.error('⚠️  ADVANTA ACCOUNT HAS INSUFFICIENT CREDITS!');
          console.error('⚠️  Please top up your Advanta SMS account to continue sending OTPs.');
        }
        
        throw new Error(`OTP API error: ${errorMsg}`);
      }
    }
    
    // Also check if response.data itself indicates success (alternative format)
    if (response.data && (response.data.success || response.data.status === 'success' || response.status === 200)) {
      console.log(`✅ OTP sent successfully to ${formattedPhone} (alternative response format)`);
      return {
        success: true,
        messageId: response.data.messageId || 'unknown',
        mobile: formattedPhone
      };
    }
    
    // If we got a 200 status but unexpected format, assume success (SMS was likely sent)
    if (response.status === 200) {
      console.log(`✅ OTP sent successfully to ${formattedPhone} (assuming success from 200 status)`);
      return {
        success: true,
        messageId: 'unknown',
        mobile: formattedPhone
      };
    }
    
    throw new Error('Unexpected response format from OTP API');
  } catch (error) {
    console.error('❌ Error sending OTP:', error.message);
    
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    
    throw error;
  }
}

module.exports = {
  sendSMS,
  sendOTP,
  formatPhoneNumber
};

