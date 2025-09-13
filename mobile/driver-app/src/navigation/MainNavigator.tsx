/**
 * Main Tab Navigator for Driver App
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Import stack navigators
import DashboardNavigator from './DashboardNavigator';
import RidesNavigator from './RidesNavigator';
import EarningsNavigator from './EarningsNavigator';
import ProfileNavigator from './ProfileNavigator';

// Import types
import { MainTabParamList } from '../navigation/types';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Placeholder components for now
const PlaceholderScreen: React.FC<{ title: string }> = ({ title }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>{title} Screen</Text>
  </View>
);

const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string = '';

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Rides') {
            iconName = focused ? 'car' : 'car-outline';
          } else if (route.name === 'Earnings') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardNavigator}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Rides"
        component={RidesNavigator}
        options={{ title: 'Rides' }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsNavigator}
        options={{ title: 'Earnings' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
