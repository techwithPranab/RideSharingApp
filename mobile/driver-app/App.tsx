/**
 * Main App Component for RideShare Driver App
 * Entry point with Redux store and navigation setup
 */

import React, { useEffect } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Import store
import { store, persistor } from './src/store';

// Import navigator
import AppNavigator from './src/navigation/AppNavigator';

// Import components
import LoadingScreen from './src/screens/LoadingScreen';

const App: React.FC = () => {
  // Clear storage on app reload (configurable)
  useEffect(() => {
    // Option 1: Clear storage on every app reload (uncomment to enable)
    // const clearStorageOnReload = async () => {
    //   try {
    //     console.log('🔄 Clearing AsyncStorage on app reload...');
    //     
    //     // Clear all AsyncStorage data
    //     const keys = await AsyncStorage.getAllKeys();
    //     if (keys.length > 0) {
    //       await AsyncStorage.multiRemove(keys);
    //       console.log('✅ Cleared AsyncStorage keys:', keys);
    //     } else {
    //       console.log('ℹ️  AsyncStorage was already empty');
    //     }
    //     
    //     // Also clear Redux Persist storage
    //     await persistor.purge();
    //     console.log('✅ Cleared Redux Persist storage');
    //     
    //     console.log('🎉 Storage cleared successfully on app reload');
    //   } catch (error) {
    //     console.error('❌ Error clearing storage:', error);
    //   }
    // };
    // clearStorageOnReload();

    // Option 2: Clear storage only in development (uncomment to enable)
    // if (__DEV__) {
    //   clearStorageOnReload();
    // }

    // Option 3: Clear storage based on environment variable (uncomment to enable)
    // const shouldClearStorage = process.env.EXPO_PUBLIC_CLEAR_STORAGE_ON_RELOAD === 'true';
    // if (shouldClearStorage) {
    //   clearStorageOnReload();
    // }
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <Provider store={store}>
        <PersistGate loading={<LoadingScreen />} persistor={persistor}>
          <StatusBar
            barStyle="dark-content"
            backgroundColor="#ffffff"
            translucent={false}
          />
          <AppNavigator />
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
