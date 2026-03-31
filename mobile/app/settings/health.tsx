import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import SectionCard from '../../components/settings/SectionCard';
import SettingItem from '../../components/settings/SettingItem';

export default function HealthSettingsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Health Records & History</Text></View>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionCard title="Records">
          <SettingItem icon="folder" title="View Records" subtitle="Open all stored health records" onPress={() => Alert.alert('Health records', 'Records module can be connected here.')} />
          <SettingItem icon="history" title="Incident History" subtitle="View past safety incidents" onPress={() => Alert.alert('Incident history', 'Incident timeline can be connected here.')} />
          <SettingItem icon="ios-share" title="Export Report" subtitle="Create and share health report" onPress={() => Alert.alert('Export started', 'Report export is in progress.')} />
          <SettingItem icon="clear-all" title="Clear History" subtitle="Remove all health history logs" onPress={() => Alert.alert('Clear history', 'History cleanup requested.')} />
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
