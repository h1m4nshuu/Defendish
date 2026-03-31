import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import SectionCard from '../../components/settings/SectionCard';
import ToggleRow from '../../components/settings/ToggleRow';
import SettingItem from '../../components/settings/SettingItem';
import { useSettings } from '../../hooks/useSettings';

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { settings, updateSetting } = useSettings();

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Privacy & Security</Text></View>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionCard title="Security">
          <ToggleRow
            icon="fingerprint"
            title="Biometric Lock"
            subtitle="Require biometric authentication on app open"
            value={settings.privacyBiometricLock}
            onValueChange={(v) => updateSetting('privacyBiometricLock', v)}
          />
          <ToggleRow
            icon="vpn-key"
            title="API Permissions"
            subtitle="Allow secure data exchange with cloud services"
            value={settings.privacyApiPermissions}
            onValueChange={(v) => updateSetting('privacyApiPermissions', v)}
          />
        </SectionCard>

        <SectionCard title="Data Actions">
          <SettingItem icon="download" title="Download Data" subtitle="Export your account and profile data" onPress={() => Alert.alert('Export started', 'Your data export will be prepared.')} />
          <SettingItem icon="delete-sweep" title="Delete Health Records" subtitle="Remove incident and health history" onPress={() => Alert.alert('Confirm', 'Health records deletion requested.')} />
        </SectionCard>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}><Text style={styles.backButtonText}>Back</Text></TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  content: { padding: 16, paddingBottom: 120 },
  backButton: { marginTop: 8, backgroundColor: '#ffffff', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  backButtonText: { color: '#374151', fontSize: 16, fontWeight: '600' },
});
