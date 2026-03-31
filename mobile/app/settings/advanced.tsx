import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import SectionCard from '../../components/settings/SectionCard';
import ToggleRow from '../../components/settings/ToggleRow';
import { useSettings } from '../../hooks/useSettings';
import { getApiBaseUrl } from '../../services/apiConfig';

export default function AdvancedSettingsScreen() {
  const router = useRouter();
  const { settings, updateSetting } = useSettings();

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Advanced</Text></View>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionCard title="Diagnostics">
          <ToggleRow
            icon="bug-report"
            title="Debug Mode"
            subtitle="Enable verbose logs and debug helpers"
            value={settings.debugMode}
            onValueChange={(v) => updateSetting('debugMode', v)}
          />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>API Status</Text>
            <Text style={styles.infoValue}>Connected ({getApiBaseUrl()})</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>AI Model Version</Text>
            <Text style={styles.infoValue}>Nuri-v1.0</Text>
          </View>
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
  infoRow: { paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  infoLabel: { fontSize: 13, color: '#6b7280' },
  infoValue: { marginTop: 3, fontSize: 14, color: '#111827', fontWeight: '600' },
  backButton: { marginTop: 8, backgroundColor: '#ffffff', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  backButtonText: { color: '#374151', fontSize: 16, fontWeight: '600' },
});
