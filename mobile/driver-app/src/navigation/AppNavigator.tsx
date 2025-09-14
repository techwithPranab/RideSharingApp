/**
 * Main App Navigator for Driver App
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';

// Import navigators
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

// Import actions
import { validateAuthAsync } from '../store/slices/authSlice';
import { useAppDispatch } from '../hooks/redux';
import { debugStorage } from '../utils/clearStorage';

// Import types
import { RootStackParamList } from './types';

// Import store
import { RootState } from '../store';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { isAuthenticated, driver, token } = useSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();

  // Validate authentication state when component mounts
  useEffect(() => {
    console.log('AppNavigator: Starting auth validation...');
    debugStorage();
    dispatch(validateAuthAsync());
  }, [dispatch]);

  console.log('AppNavigator - isAuthenticated:', isAuthenticated);
  console.log('AppNavigator - driver:', !!driver);
  console.log('AppNavigator - token:', !!token);

  // We don't need to show loading screen for OTP operations
  // Only show loading if we're in an undefined authentication state
  // For now, let's just use the authentication state directly

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
        }}
      >
        {isAuthenticated ? (
          // Main app screens for authenticated users
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          // Authentication screens for unauthenticated users
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
