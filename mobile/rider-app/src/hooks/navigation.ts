/**
 * Navigation hooks for the RideShare Rider App
 * Provides typed navigation hooks for React Navigation
 */

import { useNavigation as useRNNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, TabParamList } from '../types';

// Root Stack Navigation Hook
export const useNavigation = () => {
  return useRNNavigation<StackNavigationProp<RootStackParamList>>();
};

// Tab Navigation Hook
export const useTabNavigation = () => {
  return useRNNavigation<BottomTabNavigationProp<TabParamList>>();
};

// Specific screen navigation hooks
export const useAuthNavigation = () => {
  return useRNNavigation<StackNavigationProp<RootStackParamList>>();
};

export const useMainNavigation = () => {
  return useRNNavigation<StackNavigationProp<RootStackParamList>>();
};

export const useRideNavigation = () => {
  return useRNNavigation<StackNavigationProp<RootStackParamList>>();
};

export const useProfileNavigation = () => {
  return useRNNavigation<StackNavigationProp<RootStackParamList>>();
};
