/**
 * Reusable Button Component
 * Supports different variants, sizes, and states
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/config';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const getButtonStyle = () => {
    const baseStyle: ViewStyle = {
      borderRadius: BORDER_RADIUS.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    const sizeStyles = {
      small: {
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        minHeight: 36,
      },
      medium: {
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        minHeight: 48,
      },
      large: {
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.xl,
        minHeight: 56,
      },
    };

    const variantStyles = {
      primary: {
        backgroundColor: disabled ? COLORS.lightGray : COLORS.primary,
      },
      secondary: {
        backgroundColor: disabled ? COLORS.lightGray : COLORS.secondary,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: disabled ? COLORS.lightGray : COLORS.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    };

    return [baseStyle, sizeStyles[size], variantStyles[variant], style];
  };

  const getTextStyle = () => {
    const baseTextStyle: TextStyle = {
      fontWeight: '600',
    };

    const sizeTextStyles = {
      small: { fontSize: FONT_SIZES.sm },
      medium: { fontSize: FONT_SIZES.md },
      large: { fontSize: FONT_SIZES.lg },
    };

    const variantTextStyles = {
      primary: { color: COLORS.white },
      secondary: { color: COLORS.white },
      outline: { color: disabled ? COLORS.lightGray : COLORS.primary },
      ghost: { color: disabled ? COLORS.lightGray : COLORS.primary },
    };

    return [baseTextStyle, sizeTextStyles[size], variantTextStyles[variant], textStyle];
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'secondary' ? COLORS.white : COLORS.primary}
          style={{ marginRight: SPACING.sm }}
        />
      )}
      <Text style={getTextStyle()}>{title}</Text>
    </TouchableOpacity>
  );
};

export default Button;
