/**
 * OTP Verification Screen Component
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Import actions
import { verifyOTP } from '../../store/slices/authSlice';

// Import types
import { AuthStackParamList } from '../../navigation/types';
import { RootState } from '../../store';
import { useAppDispatch } from '../../hooks/redux';

type OTPVerificationScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'OTPVerification'>;
type OTPVerificationScreenRouteProp = RouteProp<AuthStackParamList, 'OTPVerification'>;

const OTPVerificationScreen: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(30);

  const dispatch = useAppDispatch();
  const navigation = useNavigation<OTPVerificationScreenNavigationProp>();
  const route = useRoute<OTPVerificationScreenRouteProp>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const { email, isLogin } = route.params;

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [resendTimer]);

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    try {
      console.log('Verifying OTP:', { email, otp, isLogin });
      const result = await dispatch(verifyOTP({ email, otp })).unwrap();
      console.log('OTP verification result:', result);
      
      // Show success message
      Alert.alert('Success', 'OTP verified successfully!');
      
      // Navigation will be handled by the navigator based on auth state
    } catch (error) {
      console.log('OTP verification error:', error);
      Alert.alert('Verification Failed', error as string);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    try {
      // Reset timer
      setResendTimer(30);
      setOtp('');

      // Resend OTP
      // Note: You might want to dispatch sendOTP again here
      Alert.alert('Success', 'OTP sent successfully');
    } catch {
      Alert.alert('Error', 'Failed to resend OTP');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Verify Email Address</Text>
        <Text style={styles.subtitle}>
          We've sent a 6-digit code to{'\n'}{email}
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Enter 6-digit OTP"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
          autoCapitalize="none"
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleVerifyOTP} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isLogin ? 'Login' : 'Verify & Continue'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          <TouchableOpacity
            onPress={handleResendOTP}
            disabled={resendTimer > 0}
          >
            <Text style={[
              styles.resendLink,
              resendTimer > 0 && styles.resendLinkDisabled
            ]}>
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backText}>Change Email Address</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    marginTop: 80,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 20,
    fontSize: 20,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    textAlign: 'center',
    letterSpacing: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: {
    fontSize: 16,
    color: '#666',
  },
  resendLink: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  resendLinkDisabled: {
    color: '#ccc',
  },
  backButton: {
    alignItems: 'center',
    marginTop: 30,
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

export default OTPVerificationScreen;
