import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import SectionCard from '../../components/settings/SectionCard';

function LegalBlock({ title, content }: { title: string; content: string }) {
  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{title}</Text>
      <Text style={styles.blockText}>{content}</Text>
    </View>
  );
}

export default function LegalSettingsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Legal</Text></View>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionCard title="Policies">
          <LegalBlock title="Privacy Policy" content="Defendish stores profile and safety settings securely and uses them for allergy and expiry safety features." />
          <LegalBlock title="Terms & Conditions" content="By using Defendish, you agree to use recommendations as assistive guidance and verify critical health decisions with professionals." />
          <LegalBlock title="Data Usage Info" content="Data is used for personalized alerts, reminders, and AI assistance according to your app permissions." />
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
  block: { paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  blockTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  blockText: { fontSize: 13, color: '#4b5563', lineHeight: 19 },
  backButton: { marginTop: 8, backgroundColor: '#ffffff', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  backButtonText: { color: '#374151', fontSize: 16, fontWeight: '600' },
});
