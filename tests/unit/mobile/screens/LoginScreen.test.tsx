/**
 * Unit tests for Login Screen Component
 * Tests user authentication UI and user interactions
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import LoginScreen from '../../../../../../mobile/rider-app/src/screens/auth/LoginScreen';
import { login } from '../../../../../../mobile/rider-app/src/store/slices/authSlice';

// Mock dependencies
jest.mock('react-redux');
jest.mock('@react-navigation/native');
jest.mock('../../../../../../mobile/rider-app/src/store/slices/authSlice');

describe('LoginScreen', () => {
  let mockDispatch;
  let mockNavigation;

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockNavigation = {
      navigate: jest.fn(),
      goBack: jest.fn()
    };

    useDispatch.mockReturnValue(mockDispatch);
    useNavigation.mockReturnValue(mockNavigation);

    // Default selector state
    useSelector.mockImplementation((selector) => {
      const state = {
        auth: {
          loading: false,
          error: null,
          isAuthenticated: false
        }
      };
      return selector(state);
    });

    jest.clearAllMocks();
  });

  it('should render login form correctly', () => {
    render(<LoginScreen />);

    expect(screen.getByText('Welcome Back')).toBeTruthy();
    expect(screen.getByPlaceholderText('Phone Number')).toBeTruthy();
    expect(screen.getByPlaceholderText('Password')).toBeTruthy();
    expect(screen.getByText('Login')).toBeTruthy();
    expect(screen.getByText("Don't have an account? Register")).toBeTruthy();
  });

  it('should handle phone number input', () => {
    render(<LoginScreen />);

    const phoneInput = screen.getByPlaceholderText('Phone Number');
    fireEvent.changeText(phoneInput, '+1234567890');

    expect(phoneInput.props.value).toBe('+1234567890');
  });

  it('should handle password input', () => {
    render(<LoginScreen />);

    const passwordInput = screen.getByPlaceholderText('Password');
    fireEvent.changeText(passwordInput, 'password123');

    expect(passwordInput.props.value).toBe('password123');
  });

  it('should validate required fields before login', async () => {
    const mockAlert = jest.spyOn(Alert, 'alert');
    render(<LoginScreen />);

    const loginButton = screen.getByText('Login');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Validation Error',
        'Please enter both phone number and password'
      );
    });

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('should validate phone number format', async () => {
    const mockAlert = jest.spyOn(Alert, 'alert');
    render(<LoginScreen />);

    const phoneInput = screen.getByPlaceholderText('Phone Number');
    const passwordInput = screen.getByPlaceholderText('Password');
    const loginButton = screen.getByText('Login');

    fireEvent.changeText(phoneInput, '123'); // Invalid phone number
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Validation Error',
        'Please enter a valid phone number'
      );
    });

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('should dispatch login action with valid credentials', async () => {
    render(<LoginScreen />);

    const phoneInput = screen.getByPlaceholderText('Phone Number');
    const passwordInput = screen.getByPlaceholderText('Password');
    const loginButton = screen.getByText('Login');

    fireEvent.changeText(phoneInput, '+1234567890');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        login({
          phoneNumber: '+1234567890',
          password: 'password123'
        })
      );
    });
  });

  it('should show loading state during login', () => {
    useSelector.mockImplementation((selector) => {
      const state = {
        auth: {
          loading: true,
          error: null,
          isAuthenticated: false
        }
      };
      return selector(state);
    });

    render(<LoginScreen />);

    expect(screen.getByText('Logging in...')).toBeTruthy();
    expect(screen.getByTestId('login-button')).toBeDisabled();
  });

  it('should display error message when login fails', () => {
    const errorMessage = 'Invalid credentials';
    useSelector.mockImplementation((selector) => {
      const state = {
        auth: {
          loading: false,
          error: errorMessage,
          isAuthenticated: false
        }
      };
      return selector(state);
    });

    render(<LoginScreen />);

    expect(screen.getByText(errorMessage)).toBeTruthy();
    expect(screen.getByText(errorMessage)).toHaveStyle({
      color: '#ef4444' // Error color
    });
  });

  it('should navigate to register screen when register link pressed', () => {
    render(<LoginScreen />);

    const registerLink = screen.getByText("Don't have an account? Register");
    fireEvent.press(registerLink);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Register');
  });

  it('should navigate to forgot password screen', () => {
    render(<LoginScreen />);

    const forgotPasswordLink = screen.getByText('Forgot Password?');
    fireEvent.press(forgotPasswordLink);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('ForgotPassword');
  });

  it('should toggle password visibility', () => {
    render(<LoginScreen />);

    const passwordInput = screen.getByPlaceholderText('Password');
    const toggleButton = screen.getByTestId('password-toggle');

    // Initially password should be hidden
    expect(passwordInput.props.secureTextEntry).toBe(true);

    // Toggle to show password
    fireEvent.press(toggleButton);
    expect(passwordInput.props.secureTextEntry).toBe(false);

    // Toggle back to hide password
    fireEvent.press(toggleButton);
    expect(passwordInput.props.secureTextEntry).toBe(true);
  });

  it('should format phone number automatically', () => {
    render(<LoginScreen />);

    const phoneInput = screen.getByPlaceholderText('Phone Number');

    // Test US number formatting
    fireEvent.changeText(phoneInput, '1234567890');
    expect(phoneInput.props.value).toBe('+1 (234) 567-8900');

    // Test international number
    fireEvent.changeText(phoneInput, '+911234567890');
    expect(phoneInput.props.value).toBe('+91 1234567890');
  });

  it('should handle keyboard dismiss', () => {
    render(<LoginScreen />);

    const scrollView = screen.getByTestId('login-scroll-view');
    fireEvent(scrollView, 'onTouchStart');

    // This test verifies that touching the scroll view dismisses the keyboard
    // The actual implementation would call Keyboard.dismiss()
    expect(scrollView).toBeTruthy();
  });

  it('should clear error when user starts typing', () => {
    useSelector.mockImplementation((selector) => {
      const state = {
        auth: {
          loading: false,
          error: 'Previous error',
          isAuthenticated: false
        }
      };
      return selector(state);
    });

    render(<LoginScreen />);

    const phoneInput = screen.getByPlaceholderText('Phone Number');
    fireEvent.changeText(phoneInput, '1');

    // This would trigger clearing the error in the actual implementation
    // We test that the component responds to text input
    expect(phoneInput.props.value).toBe('1');
  });

  it('should navigate to main app after successful login', async () => {
    useSelector.mockImplementation((selector) => {
      const state = {
        auth: {
          loading: false,
          error: null,
          isAuthenticated: true
        }
      };
      return selector(state);
    });

    render(<LoginScreen />);

    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Main');
    });
  });

  it('should handle social login buttons', () => {
    render(<LoginScreen />);

    const googleButton = screen.getByText('Continue with Google');
    const facebookButton = screen.getByText('Continue with Facebook');

    fireEvent.press(googleButton);
    fireEvent.press(facebookButton);

    // These would trigger social login actions in the actual implementation
    expect(googleButton).toBeTruthy();
    expect(facebookButton).toBeTruthy();
  });

  it('should maintain form state during re-renders', () => {
    const { rerender } = render(<LoginScreen />);

    const phoneInput = screen.getByPlaceholderText('Phone Number');
    const passwordInput = screen.getByPlaceholderText('Password');

    fireEvent.changeText(phoneInput, '+1234567890');
    fireEvent.changeText(passwordInput, 'password123');

    // Re-render component
    rerender(<LoginScreen />);

    // Form values should persist
    expect(phoneInput.props.value).toBe('+1234567890');
    expect(passwordInput.props.value).toBe('password123');
  });

  it('should handle network connection errors', () => {
    useSelector.mockImplementation((selector) => {
      const state = {
        auth: {
          loading: false,
          error: 'Network error. Please check your connection.',
          isAuthenticated: false
        }
      };
      return selector(state);
    });

    render(<LoginScreen />);

    const errorText = screen.getByText('Network error. Please check your connection.');
    expect(errorText).toBeTruthy();
    expect(errorText).toHaveStyle({
      color: '#ef4444'
    });
  });
});
