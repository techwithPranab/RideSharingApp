/**
 * Loading Screen Component
 * Displays app loading state with animated spinner
 */

import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../constants/config';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...'
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* App Logo */}
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Loading Spinner */}
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={styles.spinner}
        />

        {/* Loading Message */}
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: SPACING.xl,
  },
  spinner: {
    marginBottom: SPACING.lg,
  },
  message: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
});

export default LoadingScreen;
