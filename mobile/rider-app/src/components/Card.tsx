/**
 * Card Component
 * Reusable card container with shadow and customizable styling
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/config';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: keyof typeof SPACING | number;
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  contentStyle,
  onPress,
  disabled = false,
  variant = 'elevated',
  padding = 'md',
}) => {
  const getCardStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle = {
      backgroundColor: COLORS.white,
      borderRadius: BORDER_RADIUS.lg,
    };

    const variantStyles: Record<string, ViewStyle> = {
      elevated: {
        ...SHADOWS.medium,
      },
      outlined: {
        borderWidth: 1,
        borderColor: COLORS.border,
      },
      filled: {
        backgroundColor: COLORS.surface,
      },
    };

    return [baseStyle, variantStyles[variant], style].filter(Boolean) as ViewStyle[];
  };

  const getContentStyle = (): ViewStyle[] => {
    const paddingValue = typeof padding === 'number' ? padding : SPACING[padding];

    const baseContentStyle: ViewStyle = {
      padding: paddingValue,
    };

    return [baseContentStyle, contentStyle].filter(Boolean) as ViewStyle[];
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={getCardStyle()}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <View style={getContentStyle()}>
          {children}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={getCardStyle()}>
      <View style={getContentStyle()}>
        {children}
      </View>
    </View>
  );
};

export default Card;
