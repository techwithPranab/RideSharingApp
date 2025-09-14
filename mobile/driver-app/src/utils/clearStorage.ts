/**
 * Utility to clear all storage for debugging and development
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistor } from '../store';

export const clearAllStorage = async () => {
  try {
    console.log('🔄 Clearing AsyncStorage...');

    // Clear all AsyncStorage data
    const keys = await AsyncStorage.getAllKeys();
    if (keys.length > 0) {
      await AsyncStorage.multiRemove(keys);
      console.log('✅ Cleared AsyncStorage keys:', keys);
    } else {
      console.log('ℹ️  AsyncStorage was already empty');
    }

    // Also clear Redux Persist storage
    await persistor.purge();
    console.log('✅ Cleared Redux Persist storage');

    console.log('🎉 All storage cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Error clearing storage:', error);
    return false;
  }
};

export const debugStorage = async () => {
  try {
    console.log('=== DEBUG STORAGE ===');
    const keys = await AsyncStorage.getAllKeys();
    console.log('All keys:', keys);

    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      console.log(`${key}:`, value);
    }

    console.log('=== END DEBUG ===');
  } catch (error) {
    console.error('Error debugging storage:', error);
  }
};

export const clearAuthStorage = async () => {
  try {
    console.log('🔄 Clearing authentication storage...');

    const keysToRemove = ['driver_token', 'driver_id'];
    await AsyncStorage.multiRemove(keysToRemove);
    console.log('✅ Cleared auth keys:', keysToRemove);

    // Also clear Redux Persist storage
    await persistor.purge();
    console.log('✅ Cleared Redux Persist storage');

    return true;
  } catch (error) {
    console.error('❌ Error clearing auth storage:', error);
    return false;
  }
};
