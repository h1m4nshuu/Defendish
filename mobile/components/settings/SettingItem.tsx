import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

type IconName = keyof typeof MaterialIcons.glyphMap;

interface SettingItemProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightText?: string;
}

export default function SettingItem({ icon, title, subtitle, onPress, rightText }: SettingItemProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity style={[styles.row, { borderBottomColor: colors.borderLight }]} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <View style={[styles.leftIcon, { backgroundColor: colors.infoBackground }]}>
        <MaterialIcons name={icon} size={20} color={colors.primary} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
      </View>

      {rightText ? <Text style={[styles.rightText, { color: colors.textSecondary }]}>{rightText}</Text> : null}
      <MaterialIcons name="chevron-right" size={22} color={colors.textTertiary} />
    </TouchableOpacity>
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
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
  },
  rightText: {
    marginRight: 8,
    fontSize: 12,
  },
});
