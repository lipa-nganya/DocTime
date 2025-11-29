import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, Card, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { theme } from '../theme';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Edit form state
  const [firstName, setFirstName] = useState('');
  const [prefix, setPrefix] = useState('');
  const [role, setRole] = useState('');
  const [otherRole, setOtherRole] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setFirstName(userData.firstName || '');
        setPrefix(userData.prefix || '');
        setRole(userData.role || '');
        setOtherRole(userData.otherRole || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!firstName.trim()) {
      Alert.alert('Error', 'Please enter your first name');
      return;
    }

    if (!prefix) {
      Alert.alert('Error', 'Please select your prefix');
      return;
    }

    if (!role) {
      Alert.alert('Error', 'Please select your role');
      return;
    }

    setSaving(true);
    try {
      const response = await api.put('/auth/profile', {
        firstName: firstName.trim(),
        prefix,
        role,
        otherRole: role === 'Other' ? otherRole.trim() : null
      });

      if (response.data && response.data.success) {
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        setEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPIN = async () => {
    Alert.alert(
      'Reset PIN',
      'You will receive an OTP to reset your PIN. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            try {
              const response = await api.post('/auth/request-reset-pin', {
                phoneNumber: user?.phoneNumber
              });
              
              if (response.data && response.data.success) {
                navigation.navigate('ResetPIN', { 
                  phoneNumber: user?.phoneNumber,
                  otp: response.data.otp 
                });
              }
            } catch (error) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to request PIN reset');
            }
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            navigation.reset({
              index: 0,
              routes: [{ name: 'SignUp' }]
            });
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Profile</Text>
          
          {!editing ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Name:</Text>
                <Text style={styles.value}>
                  {user?.prefix} {user?.firstName}
                </Text>
              </View>
              <Divider style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.label}>Role:</Text>
                <Text style={styles.value}>
                  {user?.role}{user?.otherRole ? ` (${user?.otherRole})` : ''}
                </Text>
              </View>
              <Divider style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.label}>Phone:</Text>
                <Text style={styles.value}>{user?.phoneNumber}</Text>
              </View>
              
              <Button
                mode="contained"
                onPress={() => setEditing(true)}
                style={styles.button}
              >
                Edit Profile
              </Button>
            </>
          ) : (
            <>
              <TextInput
                label="First Name"
                value={firstName}
                onChangeText={setFirstName}
                mode="outlined"
                style={styles.input}
              />
              
              <Text style={styles.sectionTitle}>Prefix</Text>
              <View style={styles.prefixContainer}>
                {['Mr', 'Miss', 'Dr', 'Mrs'].map((p) => (
                  <Button
                    key={p}
                    mode={prefix === p ? 'contained' : 'outlined'}
                    onPress={() => setPrefix(p)}
                    style={styles.prefixButton}
                  >
                    {p}
                  </Button>
                ))}
              </View>
              
              <Text style={styles.sectionTitle}>Role</Text>
              <View style={styles.roleContainer}>
                {['Surgeon', 'Assistant Surgeon', 'Anaesthetist', 'Assistant Anaesthetist', 'Other'].map((r) => (
                  <Button
                    key={r}
                    mode={role === r ? 'contained' : 'outlined'}
                    onPress={() => setRole(r)}
                    style={styles.roleButton}
                  >
                    {r}
                  </Button>
                ))}
              </View>
              
              {role === 'Other' && (
                <TextInput
                  label="Specify Role"
                  value={otherRole}
                  onChangeText={setOtherRole}
                  mode="outlined"
                  style={styles.input}
                />
              )}
              
              <View style={styles.buttonRow}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setEditing(false);
                    loadProfile();
                  }}
                  style={styles.button}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSaveProfile}
                  loading={saving}
                  style={styles.button}
                >
                  Save
                </Button>
              </View>
            </>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Button
            mode="outlined"
            onPress={handleResetPIN}
            style={styles.actionButton}
            icon="lock-reset"
          >
            Reset PIN
          </Button>
          
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={[styles.actionButton, styles.logoutButton]}
            textColor={theme.colors.error}
            icon="logout"
          >
            Logout
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  card: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  label: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
    color: theme.colors.text,
  },
  divider: {
    marginVertical: theme.spacing.xs,
  },
  button: {
    marginTop: theme.spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  prefixContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  prefixButton: {
    flex: 1,
    minWidth: '22%',
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  roleButton: {
    flex: 1,
    minWidth: '45%',
  },
  actionButton: {
    marginBottom: theme.spacing.sm,
  },
  logoutButton: {
    borderColor: theme.colors.error,
  },
});

