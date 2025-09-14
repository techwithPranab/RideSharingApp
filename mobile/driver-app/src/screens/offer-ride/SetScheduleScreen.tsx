/**
 * Set Schedule Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { OfferRideStackParamList } from '../../navigation/types';
import { DateTimePicker } from '../../components';

type SetScheduleScreenNavigationProp = StackNavigationProp<OfferRideStackParamList, 'SetSchedule'>;
type SetScheduleScreenRouteProp = RouteProp<OfferRideStackParamList, 'SetSchedule'>;

interface RecurringSchedule {
  isRecurring: boolean;
  days: string[];
  endDate?: Date;
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' },
];

const SetScheduleScreen: React.FC = () => {
  const navigation = useNavigation<SetScheduleScreenNavigationProp>();
  const route = useRoute<SetScheduleScreenRouteProp>();
  
  const { source, destination, stops } = route.params;
  
  const [departureDate, setDepartureDate] = useState(new Date());
  const [departureTime, setDepartureTime] = useState(new Date());
  const [isFlexible, setIsFlexible] = useState(false);
  const [flexibilityMinutes, setFlexibilityMinutes] = useState(15);
  
  const [recurring, setRecurring] = useState<RecurringSchedule>({
    isRecurring: false,
    days: [],
  });

  const toggleRecurringDay = (day: string) => {
    const updatedDays = recurring.days.includes(day)
      ? recurring.days.filter(d => d !== day)
      : [...recurring.days, day];
    
    setRecurring({ ...recurring, days: updatedDays });
  };

  const handleContinue = () => {
    const scheduleData = {
      departureDate: departureDate.toISOString(), // Convert to serializable string
      departureTime: departureTime.toISOString(), // Convert to serializable string
      isFlexible,
      flexibilityMinutes: isFlexible ? flexibilityMinutes : 0,
      recurring,
    };

    const params: any = {
      source,
      destination,
      schedule: scheduleData,
      seats: 4, // Default seats, will be set in pricing screen
    };
    
    if (stops && stops.length > 0) {
      params.stops = stops;
    }

    navigation.navigate('SetPricing', params);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Set Your Schedule</Text>
        <Text style={styles.subtitle}>
          Choose when you want to offer this ride
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Departure Time</Text>
        
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Date</Text>
          <DateTimePicker
            value={departureDate}
            onChange={setDepartureDate}
            mode="date"
            title="Select Departure Date"
            placeholder="Choose departure date"
            style={styles.datePicker}
          />
        </View>

        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Time</Text>
          <DateTimePicker
            value={departureTime}
            onChange={setDepartureTime}
            mode="time"
            title="Select Departure Time"
            placeholder="Choose departure time"
            style={styles.datePicker}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.flexibilityHeader}>
          <View>
            <Text style={styles.sectionTitle}>Time Flexibility</Text>
            <Text style={styles.sectionSubtitle}>
              Allow passengers to book within a time window
            </Text>
          </View>
          <Switch
            value={isFlexible}
            onValueChange={setIsFlexible}
            trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
            thumbColor={isFlexible ? '#fff' : '#f4f3f4'}
          />
        </View>

        {isFlexible && (
          <View style={styles.flexibilityOptions}>
            {[15, 30, 60].map((minutes) => (
              <TouchableOpacity
                key={minutes}
                style={[
                  styles.flexibilityOption,
                  flexibilityMinutes === minutes && styles.flexibilityOptionActive
                ]}
                onPress={() => setFlexibilityMinutes(minutes)}
              >
                <Text style={[
                  styles.flexibilityOptionText,
                  flexibilityMinutes === minutes && styles.flexibilityOptionTextActive
                ]}>
                  ± {minutes} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.recurringHeader}>
          <View>
            <Text style={styles.sectionTitle}>Recurring Ride</Text>
            <Text style={styles.sectionSubtitle}>
              Offer this ride on multiple days
            </Text>
          </View>
          <Switch
            value={recurring.isRecurring}
            onValueChange={(value) => setRecurring({ ...recurring, isRecurring: value })}
            trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
            thumbColor={recurring.isRecurring ? '#fff' : '#f4f3f4'}
          />
        </View>

        {recurring.isRecurring && (
          <View style={styles.daysContainer}>
            <Text style={styles.daysLabel}>Select Days</Text>
            <View style={styles.daysGrid}>
              {DAYS_OF_WEEK.map((day) => (
                <TouchableOpacity
                  key={day.key}
                  style={[
                    styles.dayButton,
                    recurring.days.includes(day.key) && styles.dayButtonActive
                  ]}
                  onPress={() => toggleRecurringDay(day.key)}
                >
                  <Text style={[
                    styles.dayButtonText,
                    recurring.days.includes(day.key) && styles.dayButtonTextActive
                  ]}>
                    {day.short}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
        <Text style={styles.continueButtonText}>Set Pricing</Text>
        <Icon name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 12,
  },
  dateTimeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  dateTimeLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  dateTimeValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginTop: 2,
  },
  flexibilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  flexibilityOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  flexibilityOption: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  flexibilityOptionActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  flexibilityOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  flexibilityOptionTextActive: {
    color: '#fff',
  },
  recurringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  daysContainer: {
    marginTop: 8,
  },
  daysLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontWeight: '500',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dayButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  dayButtonTextActive: {
    color: '#fff',
  },
  continueButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  datePicker: {
    marginBottom: 8,
  },
});

export default SetScheduleScreen;
