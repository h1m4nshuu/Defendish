import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Animated,
  View,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { TextStyles, FontWeight } from '../constants/Typography';
import { Spacing, BorderRadius, Shadows, ButtonHeight, OpacityValues } from '../constants/Spacing';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  colorScheme?: 'light' | 'dark';
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
  colorScheme = 'light',
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const colors = Colors[colorScheme];

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BorderRadius.lg,
      paddingHorizontal: getSizePadding(),
      height: getSizeHeight(),
      ...(fullWidth && { width: '100%' }),
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? colors.textDisabled : colors.primary,
          ...Shadows.md,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? colors.textDisabled : colors.secondary,
          ...Shadows.md,
        };
      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: disabled ? colors.textDisabled : colors.danger,
          ...Shadows.md,
        };
      case 'success':
        return {
          ...baseStyle,
          backgroundColor: disabled ? colors.textDisabled : colors.success,
          ...Shadows.md,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: disabled ? colors.borderLight : colors.primary,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...TextStyles.button,
      fontSize: getSizeFontSize(),
      fontWeight: FontWeight.semibold,
    };

    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
      case 'success':
        return {
          ...baseStyle,
          color: colors.textInverse,
        };
      case 'outline':
      case 'ghost':
        return {
          ...baseStyle,
          color: disabled ? colors.textDisabled : colors.primary,
        };
      default:
        return baseStyle;
    }
  };

  const getSizeHeight = (): number => {
    switch (size) {
      case 'sm':
        return ButtonHeight.sm;
      case 'md':
        return ButtonHeight.md;
      case 'lg':
        return ButtonHeight.lg;
      case 'xl':
        return ButtonHeight.xl;
      default:
        return ButtonHeight.md;
    }
  };

  const getSizePadding = (): number => {
    switch (size) {
      case 'sm':
        return Spacing.md;
      case 'md':
        return Spacing.base;
      case 'lg':
        return Spacing.lg;
      case 'xl':
        return Spacing.xl;
      default:
        return Spacing.base;
    }
  };

  const getSizeFontSize = (): number => {
    switch (size) {
      case 'sm':
        return 14;
      case 'md':
        return 16;
      case 'lg':
        return 18;
      case 'xl':
        return 20;
      default:
        return 16;
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={OpacityValues.pressed}
        style={[getButtonStyle(), style]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.textInverse}
          />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <View style={{ marginRight: Spacing.sm }}>{icon}</View>
            )}
            <Text style={[getTextStyle(), textStyle]}>{title}</Text>
            {icon && iconPosition === 'right' && (
              <View style={{ marginLeft: Spacing.sm }}>{icon}</View>
            )}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};
