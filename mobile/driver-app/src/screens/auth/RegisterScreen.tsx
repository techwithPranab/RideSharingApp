/**
 * Register Screen Component
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Import actions
import { sendOTP } from '../../store/slices/authSlice';

// Import types
import { AuthStackParamList } from '../../navigation/types';
import { RootState } from '../../store';
import { useAppDispatch } from '../../hooks/redux';

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

const RegisterScreen: React.FC = () => {
  const [formData, setFormData] = useState({
    phoneNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    drivingLicenseNumber: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    vehicleLicensePlate: '',
    vehicleType: '',
    vehicleCapacity: '',
  });

  const dispatch = useAppDispatch();
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const {
      phoneNumber,
      firstName,
      lastName,
      drivingLicenseNumber,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      vehicleColor,
      vehicleLicensePlate,
      vehicleType,
      vehicleCapacity,
    } = formData;

    if (!phoneNumber || phoneNumber.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return false;
    }

    if (!firstName || !lastName) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }

    if (!drivingLicenseNumber) {
      Alert.alert('Error', 'Please enter your driving license number');
      return false;
    }

    if (!vehicleMake || !vehicleModel || !vehicleYear || !vehicleColor || !vehicleLicensePlate) {
      Alert.alert('Error', 'Please fill in all vehicle details');
      return false;
    }

    if (!vehicleType || !vehicleCapacity) {
      Alert.alert('Error', 'Please select vehicle type and capacity');
      return false;
    }

    return true;
  };

  const handleSendOTP = async () => {
    if (!validateForm()) return;

    try {
      await dispatch(sendOTP(formData.phoneNumber)).unwrap();
      // Navigate to OTP verification with registration data
      navigation.navigate('OTPVerification', {
        phoneNumber: formData.phoneNumber,
        isLogin: false
      });
    } catch (error) {
      Alert.alert('Error', error as string);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Driver Registration</Text>
        <Text style={styles.subtitle}>Join our driver network</Text>
      </View>

      <View style={styles.form}>
        {/* Personal Information */}
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <TextInput
          style={styles.input}
          placeholder="Phone Number (10 digits)"
          value={formData.phoneNumber}
          onChangeText={(value) => updateFormData('phoneNumber', value)}
          keyboardType="phone-pad"
          maxLength={10}
        />

        <TextInput
          style={styles.input}
          placeholder="First Name"
          value={formData.firstName}
          onChangeText={(value) => updateFormData('firstName', value)}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder="Last Name"
          value={formData.lastName}
          onChangeText={(value) => updateFormData('lastName', value)}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder="Email (optional)"
          value={formData.email}
          onChangeText={(value) => updateFormData('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Driving License Number"
          value={formData.drivingLicenseNumber}
          onChangeText={(value) => updateFormData('drivingLicenseNumber', value)}
          autoCapitalize="characters"
        />

        {/* Vehicle Information */}
        <Text style={styles.sectionTitle}>Vehicle Information</Text>

        <TextInput
          style={styles.input}
          placeholder="Vehicle Make (e.g., Toyota)"
          value={formData.vehicleMake}
          onChangeText={(value) => updateFormData('vehicleMake', value)}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder="Vehicle Model (e.g., Camry)"
          value={formData.vehicleModel}
          onChangeText={(value) => updateFormData('vehicleModel', value)}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder="Manufacturing Year (e.g., 2020)"
          value={formData.vehicleYear}
          onChangeText={(value) => updateFormData('vehicleYear', value)}
          keyboardType="number-pad"
          maxLength={4}
        />

        <TextInput
          style={styles.input}
          placeholder="Vehicle Color"
          value={formData.vehicleColor}
          onChangeText={(value) => updateFormData('vehicleColor', value)}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder="License Plate Number"
          value={formData.vehicleLicensePlate}
          onChangeText={(value) => updateFormData('vehicleLicensePlate', value)}
          autoCapitalize="characters"
        />

        <TextInput
          style={styles.input}
          placeholder="Vehicle Type (sedan, suv, hatchback, etc.)"
          value={formData.vehicleType}
          onChangeText={(value) => updateFormData('vehicleType', value)}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Passenger Capacity (excluding driver)"
          value={formData.vehicleCapacity}
          onChangeText={(value) => updateFormData('vehicleCapacity', value)}
          keyboardType="number-pad"
          maxLength={2}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleSendOTP} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Send OTP</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
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
  },
  form: {
    flex: 1,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  backText: {
    color: '#007AFF',
    fontSize: 16,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default RegisterScreen;
