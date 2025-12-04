import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { TextInput, Button, Text, RadioButton, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';

const ROLES = ['Surgeon', 'Assistant Surgeon', 'Anaesthetist', 'Assistant Anaesthetist', 'Other'];
const PREFIXES = ['Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Miss', 'Prof.'];

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const { completeOnboarding, isLoading: authIsLoading } = useAuth();
  
  const [prefix, setPrefix] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [role, setRole] = useState('');
  const [otherRole, setOtherRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [prefixExpanded, setPrefixExpanded] = useState(false);
  const [error, setError] = useState('');
  
  const isLoading = loading || authIsLoading;

  const showError = (message) => {
    setError(message);
    if (Platform.OS === 'web') {
      window.alert(message);
    } else {
      window.alert(message);
    }
  };

  const handleComplete = async () => {
    console.log('🔘 Continue button clicked on Onboarding');
    console.log('📝 Form data:', { prefix, preferredName, role, otherRole });
    
    if (!preferredName.trim()) {
      console.log('❌ Validation failed: preferredName is empty');
      showError('Please enter your preferred name');
      return;
    }

    if (!role) {
      console.log('❌ Validation failed: role is not selected');
      showError('Please select your role');
      return;
    }

    if (role === 'Other' && !otherRole.trim()) {
      console.log('❌ Validation failed: otherRole is empty');
      showError('Please specify your role');
      return;
    }

    if (loading || isLoading) {
      console.log('⏸️ Already loading, ignoring click', { loading, isLoading });
      return;
    }

    console.log('✅ Validation passed, starting onboarding...');
    setError('');
    setLoading(true);

    try {
      console.log('🔄 Calling completeOnboarding...');
      await completeOnboarding(prefix, preferredName, role, otherRole);
      console.log('✅ Onboarding complete, redirecting...');
      
      // Immediately redirect
      if (Platform.OS === 'web') {
        console.log('🌐 Web platform: redirecting to /');
        window.location.reload();
      } else {
        console.log('📱 Native platform: navigating to MainTabs');
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      }
    } catch (error) {
      console.error('❌ Onboarding error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      showError(error.response?.data?.error || error.message || 'Failed to save profile');
      setLoading(false);
    }
  };


  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      <Text style={styles.title}>Welcome to Doc Time</Text>
      <Text style={styles.subtitle}>Let's set up your profile</Text>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      <Text style={styles.sectionLabel}>Prefix (Optional)</Text>
      <View style={styles.dropdownContainer}>
        <TouchableOpacity
          style={styles.dropdownHeader}
          onPress={() => setPrefixExpanded(!prefixExpanded)}
          activeOpacity={0.7}
        >
          <TextInput
            label="Prefix"
            value={prefix}
            mode="outlined"
            editable={false}
            style={styles.dropdownInput}
            placeholder="Select prefix"
            outlineColor="#00c4cc"
            activeOutlineColor="#00c4cc"
            pointerEvents="none"
          />
          <IconButton
            icon={prefixExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            iconColor="#00c4cc"
            style={styles.dropdownIcon}
            onPress={() => setPrefixExpanded(!prefixExpanded)}
          />
        </TouchableOpacity>
        
        {prefixExpanded && (
          <View style={styles.dropdownContent}>
            <TouchableOpacity
              style={styles.dropdownOption}
              onPress={() => {
                setPrefix('');
                setPrefixExpanded(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.dropdownOptionText, !prefix && styles.dropdownOptionSelected]}>
                None
              </Text>
            </TouchableOpacity>
            {PREFIXES.map((p) => (
              <TouchableOpacity
                key={p}
                style={styles.dropdownOption}
                onPress={() => {
                  setPrefix(p);
                  setPrefixExpanded(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.dropdownOptionText, prefix === p && styles.dropdownOptionSelected]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <TextInput
        label="Preferred Name *"
        value={preferredName}
        onChangeText={setPreferredName}
        mode="outlined"
        style={styles.input}
        placeholder="Enter your preferred name"
        outlineColor="#00c4cc"
        activeOutlineColor="#00c4cc"
      />

      <Text style={styles.sectionLabel}>What role best describes you?</Text>

      <RadioButton.Group onValueChange={setRole} value={role}>
        {ROLES.map((r) => (
          <View key={r} style={styles.radioRow}>
            <RadioButton value={r} />
            <Text style={styles.radioLabel}>{r}</Text>
          </View>
        ))}
      </RadioButton.Group>

      {role === 'Other' && (
        <TextInput
          label="Specify your role"
          value={otherRole}
          onChangeText={setOtherRole}
          mode="outlined"
          style={styles.input}
          outlineColor="#00c4cc"
          activeOutlineColor="#00c4cc"
        />
      )}

      <Button
        mode="contained"
        onPress={(e) => {
          console.log('🔘 Continue button pressed', e);
          handleComplete();
        }}
        loading={loading || isLoading}
        disabled={loading || isLoading}
        style={styles.button}
        contentStyle={styles.buttonContent}
        textColor={theme.colors.buttonText}
      >
        {loading || isLoading ? 'Saving Profile...' : 'Continue'}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f6eb',
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.xl,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  radioLabel: {
    fontSize: 16,
    marginLeft: theme.spacing.sm,
    color: theme.colors.text,
  },
  input: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  button: {
    marginTop: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
  },
  buttonContent: {
    paddingVertical: theme.spacing.sm,
  },
  sectionLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.md,
    fontWeight: '500',
  },
  dropdownContainer: {
    marginBottom: theme.spacing.md,
    zIndex: 5,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: '#00c4cc',
    minHeight: 56,
  },
  dropdownInput: {
    flex: 1,
    marginBottom: 0,
    backgroundColor: 'transparent',
  },
  dropdownIcon: {
    position: 'absolute',
    right: 8,
    top: 8,
    margin: 0,
  },
  dropdownContent: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#00c4cc',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    marginTop: -8,
    paddingVertical: theme.spacing.xs,
    position: 'absolute',
    width: '100%',
    zIndex: 4,
    maxHeight: 200,
  },
  dropdownOption: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  dropdownOptionText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  dropdownOptionSelected: {
    color: '#00c4cc',
    fontWeight: 'bold',
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
});
