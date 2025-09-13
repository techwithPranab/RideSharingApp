/**
 * Rides Stack Navigator
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import RidesHomeScreen from '../screens/rides/RidesHomeScreen';
import RideDetailsScreen from '../screens/rides/RideDetailsScreen';
import RideHistoryScreen from '../screens/rides/RideHistoryScreen';
import ActiveRideScreen from '../screens/rides/ActiveRideScreen';

// Import types
import { RidesStackParamList } from '../navigation/types';

const Stack = createStackNavigator<RidesStackParamList>();

const RidesNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="RidesHome"
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
        name="RidesHome"
        component={RidesHomeScreen}
        options={{ title: 'My Rides' }}
      />
      <Stack.Screen
        name="RideDetails"
        component={RideDetailsScreen}
        options={{ title: 'Ride Details' }}
      />
      <Stack.Screen
        name="RideHistory"
        component={RideHistoryScreen}
        options={{ title: 'Ride History' }}
      />
      <Stack.Screen
        name="ActiveRide"
        component={ActiveRideScreen}
        options={{ title: 'Active Ride' }}
      />
    </Stack.Navigator>
  );
};

export default RidesNavigator;
