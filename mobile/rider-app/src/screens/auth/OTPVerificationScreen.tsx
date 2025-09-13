/**
 * OTP Verification Screen for RideShare Rider App
 * Allows users to enter OTP received on their phone
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { verifyPhone, sendOTP } from '../../store/slices/authSlice';

const OTPVerificationScreen: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector(state => state.auth);

  const phoneNumber = (route.params as any)?.phoneNumber || '';
  const otpInputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Auto-focus OTP input
    setTimeout(() => {
      otpInputRef.current?.focus();
    }, 100);

    // Start resend timer
    const timer = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    try {
      await dispatch(verifyPhone({ phoneNumber, otp: otp.trim() })).unwrap();
      // Navigation will be handled by the auth state change
    } catch {
      Alert.alert('Error', 'Invalid OTP. Please try again.');
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    try {
      await dispatch(sendOTP(phoneNumber)).unwrap();
      setResendTimer(30);
      Alert.alert('Success', 'OTP sent successfully');
    } catch {
      Alert.alert('Error', 'Failed to resend OTP');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleChangePhone = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Verify Phone</Text>
        </View>

        {/* Phone Number Display */}
        <View style={styles.phoneContainer}>
          <Text style={styles.phoneLabel}>Enter the 6-digit code sent to</Text>
          <Text style={styles.phoneNumber}>+91 {phoneNumber}</Text>
          <TouchableOpacity onPress={handleChangePhone}>
            <Text style={styles.changePhoneText}>Change phone number</Text>
          </TouchableOpacity>
        </View>

        {/* OTP Input */}
        <View style={styles.inputContainer}>
          <TextInput
            ref={otpInputRef}
            style={styles.otpInput}
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
            editable={!isLoading}
            textAlign="center"
          />
        </View>

        {/* Verify Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.disabledButton]}
            onPress={handleVerifyOTP}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Verify OTP</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Resend OTP */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          {resendTimer > 0 ? (
            <Text style={styles.timerText}>Resend in {resendTimer}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResendOTP}>
              <Text style={styles.resendLink}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 20,
    color: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  phoneContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  phoneLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  phoneNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  changePhoneText: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  inputContainer: {
    marginBottom: 40,
  },
  otpInput: {
    height: 60,
    borderWidth: 2,
    borderColor: '#e1e1e1',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 8,
  },
  buttonContainer: {
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    height: 56,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#666',
  },
  timerText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  resendLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default OTPVerificationScreen;
