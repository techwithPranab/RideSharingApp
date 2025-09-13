/**
 * App Navigator for RideShare Rider App
 * Handles authentication flow and main app navigation
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { NotificationProvider } from '../components/NotificationProvider';

import { RootStackParamList, TabParamList } from '../types';

// Auth Screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import PhoneLoginScreen from '../screens/auth/PhoneLoginScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main App Screens
import HomeScreen from '../screens/main/HomeScreen';
import HistoryScreen from '../screens/main/HistoryScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

// Loading Screen
import LoadingScreen from '../screens/LoadingScreen';

// Ride Screens
import RideRequestScreen from '../screens/ride/RideRequestScreen';
import SearchingDriverScreen from '../screens/ride/SearchingDriverScreen';
import RideTrackingScreen from '../screens/ride/RideTrackingScreen';
import RideCompletedScreen from '../screens/ride/RideCompletedScreen';

// Profile Screens
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import PaymentMethodsScreen from '../screens/profile/PaymentMethodsScreen';
import TripHistoryScreen from '../screens/profile/TripHistoryScreen';
import AddressBookScreen from '../screens/profile/AddressBookScreen';
import SupportScreen from '../screens/profile/SupportScreen';

// Subscription Screens
import SubscriptionPlansScreen from '../screens/subscription/SubscriptionPlansScreen';
import SubscriptionPurchaseScreen from '../screens/subscription/SubscriptionPurchaseScreen';
import SubscriptionManagementScreen from '../screens/subscription/SubscriptionManagementScreen';

// Other Screens
import PlaceSearchScreen from '../screens/PlaceSearchScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

/**
 * Tab Bar Icon Component
 */
const TabBarIcon: React.FC<{ name: string; color: string; size: number }> = ({ name, color, size }) => {
  // For now, return a simple text icon. In a real app, you'd use react-native-vector-icons or similar
  return null;
};

/**
 * Icon components for tab bar
 */
const HomeIcon: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <TabBarIcon name="home" color={color} size={size} />
);

const HistoryIcon: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <TabBarIcon name="history" color={color} size={size} />
);

const ProfileIcon: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <TabBarIcon name="profile" color={color} size={size} />
);

/**
 * Main Tab Navigator for authenticated users
 */
const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e5e5e5',
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: HomeIcon,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: HistoryIcon,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ProfileIcon,
        }}
      />
    </Tab.Navigator>
  );
};

/**
 * Main App Navigator
 */
const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useSelector((state: any) => state.auth);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NotificationProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          {!isAuthenticated ? (
            // Auth Stack
            <>
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="PhoneLogin" component={PhoneLoginScreen} />
              <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          ) : (
            // Main App Stack
            <>
              <Stack.Screen name="MainTabs" component={MainTabNavigator} />
              <Stack.Screen name="RideRequest" component={RideRequestScreen} />
              <Stack.Screen name="SearchingDriver" component={SearchingDriverScreen} />
              <Stack.Screen name="RideTracking" component={RideTrackingScreen} />
              <Stack.Screen name="RideCompleted" component={RideCompletedScreen} />
              <Stack.Screen name="EditProfile" component={EditProfileScreen} />
              <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
              <Stack.Screen name="TripHistory" component={TripHistoryScreen} />
              <Stack.Screen name="AddressBook" component={AddressBookScreen} />
              <Stack.Screen name="Support" component={SupportScreen} />
              <Stack.Screen name="SubscriptionPlans" component={SubscriptionPlansScreen} />
              <Stack.Screen name="SubscriptionPurchase" component={SubscriptionPurchaseScreen} />
              <Stack.Screen name="SubscriptionManagement" component={SubscriptionManagementScreen} />
              <Stack.Screen name="PlaceSearch" component={PlaceSearchScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </NotificationProvider>
  );
};

export default AppNavigator;
