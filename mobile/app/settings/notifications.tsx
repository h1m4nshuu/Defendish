import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import SectionCard from '../../components/settings/SectionCard';
import ToggleRow from '../../components/settings/ToggleRow';
import { useSettings } from '../../hooks/useSettings';

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const { settings, updateSetting } = useSettings();

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Notifications & Alerts</Text></View>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionCard title="Expiry Alerts">
          <ToggleRow icon="event" title="7 Days Before" value={settings.notifyExpiry7d} onValueChange={(v) => updateSetting('notifyExpiry7d', v)} />
          <ToggleRow icon="event" title="3 Days Before" value={settings.notifyExpiry3d} onValueChange={(v) => updateSetting('notifyExpiry3d', v)} />
          <ToggleRow icon="event" title="1 Day Before" value={settings.notifyExpiry1d} onValueChange={(v) => updateSetting('notifyExpiry1d', v)} />
          <ToggleRow icon="today" title="Same Day" value={settings.notifyExpirySameDay} onValueChange={(v) => updateSetting('notifyExpirySameDay', v)} />
        </SectionCard>

        <SectionCard title="Safety Alerts">
          <ToggleRow icon="warning" title="Allergy Alerts" value={settings.notifyAllergy} onValueChange={(v) => updateSetting('notifyAllergy', v)} />
          <ToggleRow icon="mail" title="Email Alerts" value={settings.notifyEmail} onValueChange={(v) => updateSetting('notifyEmail', v)} />
          <ToggleRow icon="notifications-active" title="Push Alerts" value={settings.notifyPush} onValueChange={(v) => updateSetting('notifyPush', v)} />
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
