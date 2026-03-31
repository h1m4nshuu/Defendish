import { StyleSheet, Switch, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

type IconName = keyof typeof MaterialIcons.glyphMap;

interface ToggleRowProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}

export default function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
}: ToggleRowProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, { borderBottomColor: colors.borderLight }] }>
      <View style={[styles.leftIcon, { backgroundColor: colors.infoBackground }] }>
        <MaterialIcons name={icon} size={20} color={colors.primary} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
      </View>

      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: colors.primaryLight, false: colors.borderDark }} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  leftIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
  },
});
