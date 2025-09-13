/**
 * Reusable Input Component
 * Supports different input types, validation, and states
 */

import React, { useState, forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/config';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  variant?: 'outlined' | 'filled' | 'underlined';
  size?: 'small' | 'medium' | 'large';
}

const Input = forwardRef<TextInput, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  labelStyle,
  variant = 'outlined',
  size = 'medium',
  secureTextEntry,
  ...textInputProps
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    textInputProps.onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    textInputProps.onBlur?.(e);
  };

  const handleRightIconPress = () => {
    if (secureTextEntry) {
      setShowPassword(!showPassword);
    } else {
      onRightIconPress?.();
    }
  };

  const getContainerStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle = {
      marginBottom: SPACING.md,
    };

    const getBorderColor = () => {
      if (error) return COLORS.error;
      if (isFocused) return COLORS.primary;
      return COLORS.border;
    };

    const getBackgroundColor = () => {
      if (error) return COLORS.error + '10';
      if (isFocused) return COLORS.primary + '10';
      return COLORS.surface;
    };

    const variantStyles: Record<string, ViewStyle> = {
      outlined: {
        borderWidth: 1,
        borderColor: getBorderColor(),
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.white,
      },
      filled: {
        backgroundColor: getBackgroundColor(),
        borderRadius: BORDER_RADIUS.md,
      },
      underlined: {
        borderBottomWidth: 1,
        borderBottomColor: getBorderColor(),
        backgroundColor: 'transparent',
      },
    };

    return [baseStyle, variantStyles[variant], containerStyle].filter(Boolean) as ViewStyle[];
  };

  const getInputStyle = (): TextStyle[] => {
    const baseStyle: TextStyle = {
      flex: 1,
      color: COLORS.textPrimary,
      paddingHorizontal: leftIcon ? SPACING.sm : SPACING.md,
      paddingVertical: SPACING.md,
    };

    const sizeStyles: Record<string, TextStyle> = {
      small: { fontSize: FONT_SIZES.sm, paddingVertical: SPACING.sm },
      medium: { fontSize: FONT_SIZES.md },
      large: { fontSize: FONT_SIZES.lg, paddingVertical: SPACING.lg },
    };

    return [baseStyle, sizeStyles[size], inputStyle].filter(Boolean) as TextStyle[];
  };

  const getLabelStyle = (): TextStyle[] => {
    const baseStyle: TextStyle = {
      fontSize: FONT_SIZES.sm,
      fontWeight: '500',
      marginBottom: SPACING.xs,
      color: error ? COLORS.error : COLORS.textSecondary,
    };

    return [baseStyle, labelStyle].filter(Boolean) as TextStyle[];
  };

  const renderPasswordIcon = () => {
    if (!secureTextEntry) return rightIcon;

    return (
      <TouchableOpacity onPress={handleRightIconPress}>
        <Text style={{ fontSize: FONT_SIZES.lg, color: COLORS.textSecondary }}>
          {showPassword ? '🙈' : '👁️'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={getContainerStyle()}>
      {label && <Text style={getLabelStyle()}>{label}</Text>}

      <View style={styles.inputContainer}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          ref={ref}
          style={getInputStyle()}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry && !showPassword}
          placeholderTextColor={COLORS.textLight}
          {...textInputProps}
        />

        {(rightIcon || secureTextEntry) && (
          <View style={styles.rightIcon}>
            {renderPasswordIcon()}
          </View>
        )}
      </View>

      {(error || helperText) && (
        <Text style={[
          styles.helperText,
          error ? styles.errorText : undefined
        ]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftIcon: {
    paddingLeft: SPACING.md,
    justifyContent: 'center',
  },
  rightIcon: {
    paddingRight: SPACING.md,
    justifyContent: 'center',
  },
  helperText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    marginLeft: SPACING.md,
  },
  errorText: {
    color: COLORS.error,
  },
});

Input.displayName = 'Input';

export default Input;
