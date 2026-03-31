import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface SectionCardProps {
  title: string;
  children: ReactNode;
}

export default function SectionCard({ title, children }: SectionCardProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginHorizontal: 4,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
