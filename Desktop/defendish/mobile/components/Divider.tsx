import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';

interface DividerProps {
  colorScheme?: 'light' | 'dark';
  spacing?: number;
  thickness?: number;
}

export const Divider: React.FC<DividerProps> = ({
  colorScheme = 'light',
  spacing = Spacing.base,
  thickness = 1,
}) => {
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        styles.divider,
        {
          marginVertical: spacing,
          height: thickness,
          backgroundColor: colors.border,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  divider: {
    width: '100%',
  },
});
