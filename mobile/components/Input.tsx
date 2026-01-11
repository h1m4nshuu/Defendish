import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  Animated,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { TextStyles, FontWeight, FontSize } from '../constants/Typography';
import { Spacing, BorderRadius, BorderWidth, InputHeight } from '../constants/Spacing';

type InputSize = 'sm' | 'md' | 'lg';
type InputState = 'default' | 'focus' | 'error' | 'success' | 'disabled';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: InputSize;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  colorScheme?: 'light' | 'dark';
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  success,
  helperText,
  leftIcon,
  rightIcon,
  size = 'md',
  containerStyle,
  inputStyle,
  labelStyle,
  colorScheme = 'light',
  required = false,
  editable = true,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const colors = Colors[colorScheme];
  const borderAnim = React.useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.spring(borderAnim, {
      toValue: 1,
      useNativeDriver: false,
      speed: 50,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.spring(borderAnim, {
      toValue: 0,
      useNativeDriver: false,
      speed: 50,
    }).start();
  };

  const getInputState = (): InputState => {
    if (!editable) return 'disabled';
    if (error) return 'error';
    if (success) return 'success';
    if (isFocused) return 'focus';
    return 'default';
  };

  const getBorderColor = (): string => {
    const state = getInputState();
    switch (state) {
      case 'focus':
        return colors.primary;
      case 'error':
        return colors.danger;
      case 'success':
        return colors.success;
      case 'disabled':
        return colors.borderLight;
      default:
        return colors.border;
    }
  };

  const getBackgroundColor = (): string => {
    if (!editable) {
      return colorScheme === 'light' ? '#F9FAFB' : '#1F2937';
    }
    return colors.backgroundSecondary;
  };

  const getInputHeight = (): number => {
    switch (size) {
      case 'sm':
        return InputHeight.sm;
      case 'md':
        return InputHeight.md;
      case 'lg':
        return InputHeight.lg;
      default:
        return InputHeight.md;
    }
  };

  const animatedBorderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [getBorderColor(), colors.primary],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: colors.text }, labelStyle]}>
            {label}
            {required && <Text style={{ color: colors.danger }}> *</Text>}
          </Text>
        </View>
      )}

      <Animated.View
        style={[
          styles.inputContainer,
          {
            borderColor: error ? colors.danger : success ? colors.success : animatedBorderColor,
            backgroundColor: getBackgroundColor(),
            height: getInputHeight(),
          },
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          {...textInputProps}
          editable={editable}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.input,
            {
              color: colors.text,
              fontSize: size === 'sm' ? FontSize.sm : FontSize.base,
            },
            inputStyle,
          ]}
          placeholderTextColor={colors.textTertiary}
        />

        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </Animated.View>

      {(error || success || helperText) && (
        <View style={styles.messageContainer}>
          {error && (
            <Text style={[styles.message, { color: colors.danger }]}>
              {error}
            </Text>
          )}
          {success && !error && (
            <Text style={[styles.message, { color: colors.success }]}>
              {success}
            </Text>
          )}
          {helperText && !error && !success && (
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {helperText}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.base,
  },
  labelContainer: {
    marginBottom: Spacing.sm,
  },
  label: {
    ...TextStyles.label,
    fontWeight: FontWeight.medium,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: BorderWidth.medium,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    ...TextStyles.body,
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  rightIcon: {
    marginLeft: Spacing.sm,
  },
  messageContainer: {
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  message: {
    ...TextStyles.caption,
  },
});
