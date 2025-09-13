/**
 * Main App Component for RideShare Rider App
 * Handles app initialization, authentication state, and navigation setup
 */

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { store, persistor } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import LoadingScreen from './src/screens/LoadingScreen';
import { useAppSelector } from './src/hooks/redux';

// Keep splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Load custom fonts
        await Font.loadAsync({
          'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
          'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
          'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
        });

        // Setup push notifications (placeholder - implement later)
        // await setupNotifications();

        // Artificially delay for 2 seconds to simulate a slow loading experience
        await new Promise(resolve => setTimeout(resolve, 2000));
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
  const { isLoading } = useAppSelector((state: any) => state.app);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <AppNavigator />;
};
