import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../constants/Colors';
import { TextStyles } from '../constants/Typography';
import { Spacing, IconSize } from '../constants/Spacing';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  colorScheme?: 'light' | 'dark';
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📦',
  title,
  description,
  actionLabel,
  onAction,
  colorScheme = 'light',
  style,
}) => {
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {description && (
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <View style={styles.actionContainer}>
          <Button
            title={actionLabel}
            onPress={onAction}
            variant="primary"
            size="lg"
            colorScheme={colorScheme}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['4xl'],
  },
  icon: {
    fontSize: IconSize['3xl'],
    marginBottom: Spacing.base,
  },
  title: {
    ...TextStyles.h3,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    ...TextStyles.body,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    maxWidth: 300,
  },
  actionContainer: {
    marginTop: Spacing.base,
    width: '100%',
    maxWidth: 300,
  },
});
