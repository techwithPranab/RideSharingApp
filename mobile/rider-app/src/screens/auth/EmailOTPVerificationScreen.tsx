/**
 * Email OTP Verification Screen for RideShare Rider App
 * Allows users to enter OTP received on their email
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { verifyEmail, sendEmailOTP } from '../../store/slices/authSlice';
import { RootStackParamList } from '../../types';

type EmailOTPVerificationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EmailOTPVerification'>;

const EmailOTPVerificationScreen: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const navigation = useNavigation<EmailOTPVerificationScreenNavigationProp>();
  const route = useRoute();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector(state => state.auth);

  const email = (route.params as any)?.email || '';
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
      await dispatch(verifyEmail({
        email,
        otp: otp.trim()
      })).unwrap();
      // Navigation will be handled by the auth state change
    } catch (error) {
      Alert.alert('Error', 'Invalid or expired OTP. Please try again.');
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    try {
      await dispatch(sendEmailOTP(email)).unwrap();
      setResendTimer(30);
      Alert.alert('Success', 'OTP sent successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleChangeEmail = () => {
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
          <Text style={styles.title}>Verify Email</Text>
        </View>

        {/* Email Address Display */}
        <View style={styles.emailContainer}>
          <Text style={styles.emailLabel}>Enter the 6-digit code sent to</Text>
          <Text style={styles.emailAddress}>{email}</Text>
          <TouchableOpacity onPress={handleChangeEmail}>
            <Text style={styles.changeEmailText}>Change email address</Text>
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

        {/* Info Text */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Check your email for the verification code. It may take a few minutes to arrive.
          </Text>
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

        {/* Alternative Login Option */}
        <View style={styles.alternativeContainer}>
          <Text style={styles.alternativeText}>Have a password? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('EmailLogin')}>
            <Text style={styles.linkText}>Login with Password</Text>
          </TouchableOpacity>
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
  emailContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emailLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emailAddress: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  changeEmailText: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  inputContainer: {
    marginBottom: 24,
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
  infoContainer: {
    marginBottom: 40,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
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
    marginBottom: 24,
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
  alternativeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alternativeText: {
    fontSize: 14,
    color: '#666',
  },
  linkText: {
    color: '#007AFF',
    textDecorationLine: 'underline',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EmailOTPVerificationScreen;
