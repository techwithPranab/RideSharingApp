/**
 * Earnings Stack Navigator
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import EarningsHomeScreen from '../screens/earnings/EarningsHomeScreen';
import EarningsDetailsScreen from '../screens/earnings/EarningsDetailsScreen';
import PayoutHistoryScreen from '../screens/earnings/PayoutHistoryScreen';
import WeeklyEarningsScreen from '../screens/earnings/WeeklyEarningsScreen';

// Import types
import { EarningsStackParamList } from '../navigation/types';

const Stack = createStackNavigator<EarningsStackParamList>();

const EarningsNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="EarningsHome"
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
        name="EarningsHome"
        component={EarningsHomeScreen}
        options={{ title: 'Earnings' }}
      />
      <Stack.Screen
        name="EarningsDetails"
        component={EarningsDetailsScreen}
        options={{ title: 'Earnings Details' }}
      />
      <Stack.Screen
        name="PayoutHistory"
        component={PayoutHistoryScreen}
        options={{ title: 'Payout History' }}
      />
      <Stack.Screen
        name="WeeklyEarnings"
        component={WeeklyEarningsScreen}
        options={{ title: 'Weekly Earnings' }}
      />
    </Stack.Navigator>
  );
};

export default EarningsNavigator;
