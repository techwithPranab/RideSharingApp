/**
 * Custom DateTime Picker Component for Rider App
 * Provides native-like date and time picker functionality using ActionSheet
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { COLORS, FONT_SIZES } from '../constants/config';

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  mode: 'date' | 'time' | 'datetime';
  minimumDate?: Date;
  maximumDate?: Date;
  title?: string;
  placeholder?: string;
  style?: any;
  disabled?: boolean;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  mode,
  minimumDate,
  maximumDate,
  title,
  placeholder = 'Select date and time',
  style,
  disabled = false,
}) => {
  const { showActionSheetWithOptions } = useActionSheet();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTime = (dateTime: Date) => {
    if (mode === 'date') return formatDate(dateTime);
    if (mode === 'time') return formatTime(dateTime);
    return `${formatDate(dateTime)} ${formatTime(dateTime)}`;
  };

  const showDatePicker = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        title || 'Select Date',
        'Enter date in format: MM/DD/YYYY',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'OK',
            onPress: (dateString) => {
              if (dateString) {
                const parsedDate = new Date(dateString);
                if (!isNaN(parsedDate.getTime())) {
                  onChange(parsedDate);
                } else {
                  Alert.alert('Invalid Date', 'Please enter a valid date.');
                }
              }
            },
          },
        ],
        'plain-text',
        formatDate(value)
      );
    } else {
      const options: Array<{ label: string; value: Date }> = [];
      const today = new Date();

      options.push({
        label: `Today - ${formatDate(today)}`,
        value: today,
      });

      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      options.push({
        label: `Tomorrow - ${formatDate(tomorrow)}`,
        value: tomorrow,
      });

      const dayAfter = new Date(today);
      dayAfter.setDate(today.getDate() + 2);
      options.push({
        label: `Day After - ${formatDate(dayAfter)}`,
        value: dayAfter,
      });

      showActionSheetWithOptions(
        {
          title: title || 'Select Date',
          options: [...options.map(opt => opt.label), 'Cancel'],
          cancelButtonIndex: options.length,
        },
        (buttonIndex?: number) => {
          if (buttonIndex !== undefined && buttonIndex < options.length) {
            const selectedOption = options[buttonIndex];
            if (selectedOption) {
              onChange(selectedOption.value);
            }
          }
        }
      );
    }
  };

  const showTimePicker = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        title || 'Select Time',
        'Enter time in format: HH:MM (24-hour)',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'OK',
            onPress: (timeString) => {
              if (timeString) {
                const timeParts = timeString.split(':');
                if (timeParts.length === 2 && timeParts[0] && timeParts[1]) {
                  const hours = parseInt(timeParts[0], 10);
                  const minutes = parseInt(timeParts[1], 10);
                  if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
                    const newDate = new Date(value);
                    newDate.setHours(hours, minutes, 0, 0);
                    onChange(newDate);
                  } else {
                    Alert.alert('Invalid Time', 'Please enter a valid time in HH:MM format.');
                  }
                } else {
                  Alert.alert('Invalid Format', 'Please enter time in HH:MM format.');
                }
              }
            },
          },
        ],
        'plain-text',
        formatTime(value)
      );
    } else {
      const timeSlots = [
        '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
        '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
        '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
      ];

      showActionSheetWithOptions(
        {
          title: title || 'Select Time',
          options: [...timeSlots, 'Cancel'],
          cancelButtonIndex: timeSlots.length,
        },
        (buttonIndex?: number) => {
          if (buttonIndex !== undefined && buttonIndex < timeSlots.length) {
            const timeString = timeSlots[buttonIndex];
            if (timeString) {
              const timeParts = timeString.split(':');
              if (timeParts.length === 2 && timeParts[0] && timeParts[1]) {
                const hours = parseInt(timeParts[0], 10);
                const minutes = parseInt(timeParts[1], 10);
                const newDate = new Date(value);
                newDate.setHours(hours, minutes, 0, 0);
                onChange(newDate);
              }
            }
          }
        }
      );
    }
  };

  const showDateTimePicker = () => {
    showDatePicker();
  };

  const handlePress = () => {
    if (disabled) return;

    switch (mode) {
      case 'date':
        showDatePicker();
        break;
      case 'time':
        showTimePicker();
        break;
      case 'datetime':
        showDateTimePicker();
        break;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, style, disabled && styles.disabled]}
      onPress={handlePress}
      disabled={disabled}
    >
      <View style={styles.content}>
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value ? formatDateTime(value) : placeholder}
        </Text>
        <Text style={styles.icon}>📅</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  disabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  value: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    flex: 1,
  },
  placeholder: {
    color: COLORS.textSecondary,
  },
  icon: {
    fontSize: 18,
    marginLeft: 8,
  },
});

export default DateTimePicker;
