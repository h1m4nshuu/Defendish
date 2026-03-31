import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import SettingItem from '../../components/settings/SettingItem';
import SectionCard from '../../components/settings/SectionCard';

const SETTINGS_ROUTES = [
  { title: 'Account', subtitle: 'Profile, password, and account actions', icon: 'person', path: '/settings/account' },
  { title: 'Family & Profiles', subtitle: 'Members, allergies, and child safety', icon: 'groups', path: '/settings/family' },
  { title: 'Nuri AI', subtitle: 'Assistant behavior and voice setup', icon: 'smart-toy', path: '/settings/nuri' },
  { title: 'Notifications & Alerts', subtitle: 'Expiry, allergy, push, and email alerts', icon: 'notifications', path: '/settings/notifications' },
  { title: 'Product & Scanning', subtitle: 'Auto-scan and detection behavior', icon: 'qr-code-scanner', path: '/settings/products' },
  { title: 'Privacy & Security', subtitle: 'Biometric lock and data controls', icon: 'lock', path: '/settings/privacy' },
  { title: 'Language & Accessibility', subtitle: 'Language, text size, and contrast', icon: 'language', path: '/settings/language' },
  { title: 'Health Records & History', subtitle: 'Records, incidents, and export options', icon: 'medical-services', path: '/settings/health' },
  { title: 'App Preferences', subtitle: 'Theme, units, and regional preferences', icon: 'tune', path: '/settings/preferences' },
  { title: 'Advanced', subtitle: 'Debug options and system information', icon: 'build', path: '/settings/advanced' },
  { title: 'Help & Support', subtitle: 'FAQ, contact, and bug reporting', icon: 'help-outline', path: '/settings/support' },
  { title: 'Legal', subtitle: 'Privacy policy and terms', icon: 'gavel', path: '/settings/legal' },
] as const;

export default function SettingsIndexScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your Defendish preferences</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <SectionCard title="Settings Modules">
          {SETTINGS_ROUTES.map((item) => (
            <SettingItem
              key={item.path}
              icon={item.icon}
              title={item.title}
              subtitle={item.subtitle}
              onPress={() => router.push(item.path as any)}
            />
          ))}
        </SectionCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#6b7280',
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
});
