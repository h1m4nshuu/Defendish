import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import SectionCard from '../../components/settings/SectionCard';
import SettingItem from '../../components/settings/SettingItem';

export default function SupportSettingsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Help & Support</Text></View>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionCard title="Support Actions">
          <SettingItem icon="quiz" title="FAQ" subtitle="Common answers and guidance" onPress={() => Alert.alert('FAQ', 'FAQ section can be connected here.')} />
          <SettingItem icon="support-agent" title="Contact Support" subtitle="Email or chat with support team" onPress={() => Linking.openURL('mailto:support@defendish.app')} />
          <SettingItem icon="report-problem" title="Report Bug" subtitle="Share an issue with logs and screenshots" onPress={() => Alert.alert('Bug Report', 'Bug report form can be connected here.')} />
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
