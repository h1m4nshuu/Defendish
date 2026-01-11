import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../constants/Colors';
import { TextStyles, FontWeight, FontSize } from '../constants/Typography';
import { Spacing, BorderRadius } from '../constants/Spacing';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  colorScheme?: 'light' | 'dark';
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  icon,
  style,
  textStyle,
  colorScheme = 'light',
}) => {
  const colors = Colors[colorScheme];

  const getBackgroundColor = (): string => {
    switch (variant) {
      case 'success':
        return colors.successBackground;
      case 'warning':
        return colors.warningBackground;
      case 'danger':
        return colors.dangerBackground;
      case 'info':
        return colors.infoBackground;
      case 'neutral':
      default:
        return colorScheme === 'light' ? '#F3F4F6' : '#374151';
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'danger':
        return colors.danger;
      case 'info':
        return colors.info;
      case 'neutral':
      default:
        return colors.text;
    }
  };

  const getBorderColor = (): string => {
    switch (variant) {
      case 'success':
        return colors.successBorder;
      case 'warning':
        return colors.warningBorder;
      case 'danger':
        return colors.dangerBorder;
      case 'info':
        return colors.infoBorder;
      case 'neutral':
      default:
        return colors.border;
    }
  };

  const getPadding = (): { paddingVertical: number; paddingHorizontal: number } => {
    switch (size) {
      case 'sm':
        return { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm };
      case 'md':
        return { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md };
      case 'lg':
        return { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.base };
      default:
        return { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md };
    }
  };

  const getFontSize = (): number => {
    switch (size) {
      case 'sm':
        return FontSize.xs;
      case 'md':
        return FontSize.sm;
      case 'lg':
        return FontSize.base;
      default:
        return FontSize.sm;
    }
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          ...getPadding(),
        },
        style,
      ]}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text
        style={[
          styles.text,
          {
            color: getTextColor(),
            fontSize: getFontSize(),
            fontWeight: FontWeight.medium,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: Spacing.xs,
  },
  text: {
    ...TextStyles.labelSmall,
  },
});
