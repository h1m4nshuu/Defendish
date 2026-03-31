import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

const SETTINGS_OPTIONS = [
  {
    title: 'Account',
    subtitle: 'Profile, password, and account',
    icon: 'account-circle-outline' as const,
  },
  {
    title: 'Notifications',
    subtitle: 'Alerts and reminders',
    icon: 'bell-outline' as const,
  },
  {
    title: 'Privacy & Security',
    subtitle: 'Data protection and security',
    icon: 'lock-outline' as const,
  },
  {
    title: 'Preferences',
    subtitle: 'Theme, language, and region',
    icon: 'palette-outline' as const,
  },
];

export default function SettingsTabScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const handleMainOptionPress = (title: string) => {
    if (title === 'Account') {
      router.push('/settings/account');
    } else if (title === 'Notifications') {
      router.push('/settings/notifications');
    } else if (title === 'Privacy & Security') {
      router.push('/settings/privacy');
    } else if (title === 'Preferences') {
      router.push('/settings/preferences');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.backgroundSecondary, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manage your preferences</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {SETTINGS_OPTIONS.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.settingItem, { backgroundColor: colors.card, borderBottomColor: colors.borderLight }]}
            onPress={() => handleMainOptionPress(item.title)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.infoBackground }]}>
              <MaterialCommunityIcons
                name={item.icon}
                size={24}
                color={colors.primary}
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textTertiary }]}>{item.subtitle}</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderRadius: 12,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingSubtitle: {
    marginTop: 2,
    fontSize: 13,
  },
});
