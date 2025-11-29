import { Alert } from 'react-native';
import { theme } from '../theme';

/**
 * Custom Alert wrapper with improved styling
 * Note: React Native Alert is platform-native, so we can't fully customize it
 * But we can ensure consistent messaging and use Paper's Dialog for better control
 */
export const customAlert = {
  alert: (title, message, buttons = [{ text: 'OK' }]) => {
    Alert.alert(title, message, buttons);
  },
  
  confirm: (title, message, onConfirm, onCancel) => {
    Alert.alert(
      title,
      message,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: onCancel
        },
        {
          text: 'Confirm',
          style: 'default',
          onPress: onConfirm
        }
      ]
    );
  },
  
  error: (message, onPress) => {
    Alert.alert('Error', message, [{ text: 'OK', onPress }]);
  },
  
  success: (message, onPress) => {
    Alert.alert('Success', message, [{ text: 'OK', onPress }]);
  }
};

export default customAlert;

