import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import SectionCard from '../../components/settings/SectionCard';
import SettingItem from '../../components/settings/SettingItem';
import ToggleRow from '../../components/settings/ToggleRow';
import { useSettings } from '../../hooks/useSettings';

export default function FamilySettingsScreen() {
  const router = useRouter();
  const { settings, updateSetting } = useSettings();

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Family & Profiles</Text></View>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionCard title="Family Management">
          <SettingItem icon="person-add" title="Add Member" subtitle="Create a new family profile" onPress={() => router.push('/profile/create' as any)} />
          <SettingItem icon="manage-accounts" title="Edit Members" subtitle="Manage existing profiles" onPress={() => router.push('/profile/select' as any)} />
          <SettingItem icon="vaccines" title="Manage Allergies" subtitle="Update family allergy details" onPress={() => Alert.alert('Tip', 'Open a profile and edit allergies.')} />
          <SettingItem icon="monitor-heart" title="Health Info" subtitle="View health details by profile" onPress={() => router.push('/profile' as any)} />
          <ToggleRow
            icon="child-care"
            title="Child Safety Mode"
            subtitle="Apply stricter allergy and expiry safety checks"
            value={settings.childSafetyMode}
            onValueChange={(v) => updateSetting('childSafetyMode', v)}
          />
        </SectionCard>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
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
