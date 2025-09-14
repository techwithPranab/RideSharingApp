/**
 * Login Screen Component
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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import actions
import { sendOTP, clearError, login } from '../../store/slices/authSlice';

// Import types
import { AuthStackParamList } from '../../navigation/types';
import { RootState } from '../../store';
import { useAppDispatch } from '../../hooks/redux';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');

  const dispatch = useAppDispatch();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  // Clear any existing errors when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handlePasswordLogin = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!password || password.length < 6) {
      Alert.alert('Error', 'Please enter a password (minimum 6 characters)');
      return;
    }

    try {
      const result = await dispatch(login({ email, password })).unwrap();
      console.log('Login successful:', result);
      // Navigation will be handled by the auth slice/navigation logic
    } catch (error) {
      console.log('Login error:', error);
      Alert.alert('Login Failed', error as string);
    }
  };

  const handleOTPLogin = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      console.log('=== Starting OTP Send Process ===');
      console.log('Email:', email);
      
      const result = await dispatch(sendOTP(email)).unwrap();
      console.log('OTP sent successfully:', result);
      
      // Navigate to OTP verification screen
      navigation.navigate('OTPVerification', { email, isLogin: true });
      
    } catch (error) {
      console.log('OTP send error:', error);
      Alert.alert('Error', error as string);
    }
  };

  const handleLogin = () => {
    if (loginMethod === 'password') {
      handlePasswordLogin();
    } else {
      handleOTPLogin();
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const toggleLoginMethod = () => {
    setLoginMethod(loginMethod === 'password' ? 'otp' : 'password');
    setPassword(''); // Clear password when switching methods
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Driver Login</Text>
        <Text style={styles.subtitle}>Welcome back! Please sign in to continue</Text>
      </View>

      <View style={styles.form}>
        {/* Login method toggle */}
        <View style={styles.methodToggle}>
          <TouchableOpacity
            style={[
              styles.methodButton,
              loginMethod === 'password' && styles.methodButtonActive
            ]}
            onPress={() => setLoginMethod('password')}
          >
            <Text
              style={[
                styles.methodButtonText,
                loginMethod === 'password' && styles.methodButtonTextActive
              ]}
            >
              Password
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.methodButton,
              loginMethod === 'otp' && styles.methodButtonActive
            ]}
            onPress={() => setLoginMethod('otp')}
          >
            <Text
              style={[
                styles.methodButtonText,
                loginMethod === 'otp' && styles.methodButtonTextActive
              ]}
            >
              OTP
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {loginMethod === 'password' && (
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Icon
                name={showPassword ? 'visibility-off' : 'visibility'}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          </View>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {loginMethod === 'password' ? 'Sign In' : 'Send OTP'}
            </Text>
          )}
        </TouchableOpacity>

        {loginMethod === 'password' && (
          <TouchableOpacity style={styles.linkButton} onPress={handleForgotPassword}>
            <Text style={styles.linkText}>Forgot Password?</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.linkButton} onPress={toggleLoginMethod}>
          <Text style={styles.linkText}>
            {loginMethod === 'password' 
              ? 'Login with OTP instead' 
              : 'Login with Password instead'}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <Text style={styles.dividerText}>Don't have an account?</Text>
        </View>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleRegister}>
          <Text style={styles.secondaryButtonText}>Register as Driver</Text>
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
  },
  form: {
    flex: 1,
  },
  methodToggle: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  methodButtonActive: {
    backgroundColor: '#007AFF',
  },
  methodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  methodButtonTextActive: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 15,
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
  linkButton: {
    alignItems: 'center',
    marginTop: 15,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
  },
  divider: {
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerText: {
    fontSize: 16,
    color: '#666',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default LoginScreen;
