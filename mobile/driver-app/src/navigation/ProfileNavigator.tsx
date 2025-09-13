/**
 * Profile Stack Navigator
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import ProfileHomeScreen from '../screens/profile/ProfileHomeScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import VehicleManagementScreen from '../screens/profile/VehicleManagementScreen';
import DocumentsScreen from '../screens/profile/DocumentsScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import SupportScreen from '../screens/profile/SupportScreen';

// Import types
import { ProfileStackParamList } from '../navigation/types';

const Stack = createStackNavigator<ProfileStackParamList>();

const ProfileNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="ProfileHome"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="ProfileHome"
        component={ProfileHomeScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <Stack.Screen
        name="VehicleManagement"
        component={VehicleManagementScreen}
        options={{ title: 'Vehicle Management' }}
      />
      <Stack.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{ title: 'Documents' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen
        name="Support"
        component={SupportScreen}
        options={{ title: 'Support' }}
      />
    </Stack.Navigator>
  );
};

export default ProfileNavigator;
