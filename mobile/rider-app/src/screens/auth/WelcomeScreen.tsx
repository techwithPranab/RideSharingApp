/**
 * Welcome Screen for RideShare Rider App
 * First screen users see when opening the app
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';

type WelcomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

const { width, height } = Dimensions.get('window');

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();

  const handleEmailLogin = () => {
    navigation.navigate('EmailLogin');
  };

  const handleEmailOTPLogin = () => {
    navigation.navigate('EmailOTPVerification', { email: '' });
  };

  const handleRegister = () => {
    navigation.navigate('Register', { phoneNumber: '' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo and Title */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>🚗</Text>
          </View>
          <Text style={styles.title}>RideShare</Text>
          <Text style={styles.subtitle}>Your ride, your way</Text>
        </View>

        {/* Illustration */}
        {/* <View style={styles.illustrationContainer}>
          <Text style={styles.illustrationEmoji}>🗺️</Text>
          <Text style={styles.illustrationText}>Find rides anywhere</Text>
        </View> */}

        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Text style={styles.featureEmoji}>⚡</Text>
            <Text style={styles.featureText}>Fast & Reliable</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureEmoji}>💰</Text>
            <Text style={styles.featureText}>Affordable Rides</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureEmoji}>👥</Text>
            <Text style={styles.featureText}>Share & Save</Text>
          </View>
        </View>

        {/* Get Started Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleEmailLogin}>
            <Text style={styles.primaryButtonText}>Login with Email</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleEmailOTPLogin}>
            <Text style={styles.secondaryButtonText}>Login with Email OTP</Text>
          </TouchableOpacity>

          {/* Registration Link */}
          <View style={styles.registrationContainer}>
            <Text style={styles.registrationText}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={styles.registrationLink}>Sign up</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.linkText}>Terms of Service</Text> and{' '}
            <Text style={styles.linkText}>Privacy Policy</Text>
          </Text>
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
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  illustrationEmoji: {
    fontSize: 120,
    marginBottom: 16,
  },
  illustrationText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 40, // Reduced from 60 to prevent overlap
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    // Removed flex: 1 to prevent overlap
    paddingBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24, // Increased to make room for registration link
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  registrationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  registrationText: {
    fontSize: 14,
    color: '#666',
  },
  registrationLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  termsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  linkText: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});

export default WelcomeScreen;
