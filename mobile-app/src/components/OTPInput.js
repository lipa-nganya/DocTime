import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TextInput, Platform } from 'react-native';
import { theme } from '../theme';

export default function OTPInput({ value, onChange, onComplete }) {
  const inputRefs = useRef([]);

  useEffect(() => {
    // Auto-focus first input when component mounts
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (text, index) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, '');
    
    if (numericText.length > 1) {
      // Handle paste - split the text across inputs
      const digits = numericText.slice(0, 4).split('');
      const newValue = [...value];
      
      digits.forEach((digit, i) => {
        if (index + i < 4) {
          newValue[index + i] = digit;
        }
      });
      
      onChange(newValue);
      
      // Focus the next empty input or the last one
      const nextIndex = Math.min(index + digits.length, 3);
      if (inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex].focus();
      }
    } else {
      const newValue = [...value];
      newValue[index] = numericText;
      onChange(newValue);
      
      // Auto-advance to next input
      if (numericText && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  // Use useEffect to check for completion after state updates
  useEffect(() => {
    const otpValue = value.join('');
    if (otpValue.length === 4 && value.every(v => v !== '')) {
      // Small delay to ensure state is fully updated
      const timer = setTimeout(() => {
        onComplete?.(otpValue);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [value, onComplete]);

  const handleKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleFocus = (index) => {
    // Select all text when focused
    // setNativeProps is not available on web, use setSelectionRange instead
    if (inputRefs.current[index]) {
      if (Platform.OS === 'web') {
        // On web, use setSelectionRange
        try {
          if (inputRefs.current[index].setSelectionRange) {
            inputRefs.current[index].setSelectionRange(0, value[index]?.length || 0);
          }
        } catch (e) {
          // Ignore errors on web
        }
      } else {
        // On native, use setNativeProps
        try {
          inputRefs.current[index].setNativeProps({ selection: { start: 0, end: value[index]?.length || 0 } });
        } catch (e) {
          // Ignore errors if setNativeProps is not available
        }
      }
    }
  };

  return (
    <View style={styles.container}>
      {[0, 1, 2, 3].map((index) => (
        <TextInput
          key={index}
          ref={(ref) => (inputRefs.current[index] = ref)}
          style={styles.input}
          value={value[index] || ''}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          onFocus={() => handleFocus(index)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
          textAlign="center"
          autoFocus={index === 0}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  input: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: '#00c4cc',
    borderRadius: 8,
    fontSize: 24,
    fontWeight: 'bold',
    backgroundColor: '#FFFFFF',
    color: theme.colors.text,
    textAlign: 'center',
    textAlignVertical: 'center',
    padding: 0,
    margin: 0,
  },
});

