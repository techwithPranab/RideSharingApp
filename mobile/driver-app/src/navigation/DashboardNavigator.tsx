/**
 * Dashboard Stack Navigator
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import DashboardHomeScreen from '../screens/dashboard/DashboardHomeScreen';
import RideDetailsScreen from '../screens/dashboard/RideDetailsScreen';
import DriverStatusScreen from '../screens/dashboard/DriverStatusScreen';

// Import types
import { DashboardStackParamList } from '../navigation/types';

const Stack = createStackNavigator<DashboardStackParamList>();

const DashboardNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="DashboardHome"
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
        name="DashboardHome"
        component={DashboardHomeScreen}
        options={{ title: 'Dashboard' }}
      />
      <Stack.Screen
        name="RideDetails"
        component={RideDetailsScreen}
        options={{ title: 'Ride Details' }}
      />
      <Stack.Screen
        name="DriverStatus"
        component={DriverStatusScreen}
        options={{ title: 'Driver Status' }}
      />
    </Stack.Navigator>
  );
};

export default DashboardNavigator;
