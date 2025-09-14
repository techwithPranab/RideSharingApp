/**
 * Main App Component for RideShare Rider App
 * Handles app initialization, authentication state, and navigation setup
 */

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import * as SplashScreen from 'expo-splash-screen';

import { store, persistor } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import LoadingScreen from './src/screens/LoadingScreen';

// Keep splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Skip font loading for now - use system fonts
        // await Font.loadAsync({
        //   'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
        //   'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
        //   'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
        // });

        // Setup push notifications (placeholder - implement later)
        // await setupNotifications();

        console.log('App initialization completed');
      } catch (e) {
        console.warn('Error during app initialization:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = React.useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <SafeAreaProvider onLayout={onLayoutRootView}>
          <StatusBar barStyle="dark-content" />
          <AppContent />
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}

/**
 * App Content Component with Redux state access
 */
const AppContent: React.FC = () => {
  return <AppNavigator />;
};
