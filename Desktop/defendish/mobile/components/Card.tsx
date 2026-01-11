import React from 'react';
import { View, StyleSheet, ViewStyle, Animated } from 'react-native';
import { Colors } from '../constants/Colors';
import { Spacing, BorderRadius, Shadows } from '../constants/Spacing';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  colorScheme?: 'light' | 'dark';
  variant?: 'elevated' | 'outlined' | 'filled';
  onPress?: () => void;
  animateOnPress?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  colorScheme = 'light',
  variant = 'elevated',
  onPress,
  animateOnPress = true,
}) => {
  const colors = Colors[colorScheme];
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (animateOnPress && onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        speed: 50,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (animateOnPress && onPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
      }).start();
    }
  };

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.base,
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          ...Shadows.md,
        };
      case 'outlined':
        return {
          ...baseStyle,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: colors.backgroundSecondary,
        };
      default:
        return baseStyle;
    }
  };

  const content = <View style={[getCardStyle(), style]}>{children}</View>;

  if (onPress) {
    return (
      <Animated.View
        style={{ transform: [{ scale: scaleAnim }] }}
        onTouchStart={handlePressIn}
        onTouchEnd={handlePressOut}
      >
        {content}
      </Animated.View>
    );
  }

  return content;
};
