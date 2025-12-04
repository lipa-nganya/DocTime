import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import { Text, Button, IconButton } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../theme';

export default function CalendarPicker({ value, onChange, label, style }) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value || new Date());

  // Sync tempDate when value changes externally
  useEffect(() => {
    if (value) {
      setTempDate(value);
    }
  }, [value]);

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (selectedDate) {
        onChange(selectedDate);
      }
    } else {
      // iOS - update temp date and show confirm button
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const handleConfirm = () => {
    setShowPicker(false);
    onChange(tempDate);
  };

  const handleCancel = () => {
    setShowPicker(false);
    setTempDate(value || new Date());
  };

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        {label && (
          <label style={styles.webLabel}>
            {label}
          </label>
        )}
        <input
          type="date"
          value={value ? new Date(value).toISOString().split('T')[0] : ''}
          onChange={(e) => {
            if (e.target.value) {
              const selectedDate = new Date(e.target.value + 'T00:00:00');
              onChange(selectedDate);
            }
          }}
          style={styles.webInput}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => {
          setTempDate(value || new Date());
          setShowPicker(true);
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.dateText}>{value ? formatDate(value) : 'Select Date'}</Text>
        <IconButton
          icon="calendar"
          size={20}
          iconColor="#00c4cc"
          style={styles.calendarIconButton}
        />
      </TouchableOpacity>

      {Platform.OS === 'ios' ? (
        <Modal
          visible={showPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Button onPress={handleCancel} textColor={theme.colors.textSecondary}>
                  Cancel
                </Button>
                <Text style={styles.modalTitle}>Select Date</Text>
                <Button onPress={handleConfirm} textColor={theme.colors.primary}>
                  Done
                </Button>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                style={styles.picker}
                textColor={theme.colors.text}
              />
            </View>
          </View>
        </Modal>
      ) : (
        showPicker && (
          <DateTimePicker
            value={value || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
    marginLeft: theme.spacing.md,
  },
  label: {
    fontSize: 12,
    color: '#00c4cc',
    marginBottom: 4,
    fontWeight: '500',
  },
  webLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#00c4cc',
    marginBottom: '4px',
    fontWeight: '500',
  },
  webInput: {
    width: '100%',
    maxWidth: '300px',
    padding: '16px',
    fontSize: '16px',
    border: '2px solid #00c4cc',
    borderRadius: '4px',
    backgroundColor: '#FFFFFF',
    color: '#292F36',
    outline: 'none',
    fontFamily: 'inherit',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 2,
    borderColor: '#00c4cc',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    minHeight: 56,
  },
  dateText: {
    fontSize: 16,
    color: '#292F36',
    flex: 1,
  },
  calendarIconButton: {
    margin: 0,
    width: 40,
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  picker: {
    height: 200,
  },
});

