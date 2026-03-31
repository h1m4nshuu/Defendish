import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import SectionCard from '../../components/settings/SectionCard';
import ToggleRow from '../../components/settings/ToggleRow';
import { NuriPersonality, NuriVoiceType, useSettings } from '../../hooks/useSettings';

function OptionPills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: T[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <View style={styles.pillWrap}>
      {options.map((item) => {
        const selected = item === value;
        return (
          <TouchableOpacity key={item} style={[styles.pill, selected && styles.pillSelected]} onPress={() => onChange(item)}>
            <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{item}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function NuriSettingsScreen() {
  const router = useRouter();
  const { settings, updateSetting } = useSettings();

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Nuri AI</Text></View>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionCard title="Assistant Behavior">
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>AI Personality</Text>
            <OptionPills<NuriPersonality>
              options={['friendly', 'professional', 'strict']}
              value={settings.nuriPersonality}
              onChange={(next) => updateSetting('nuriPersonality', next)}
            />
          </View>

          <ToggleRow
            icon="record-voice-over"
            title="Voice ON/OFF"
            subtitle="Allow Nuri voice responses"
            value={settings.nuriVoiceEnabled}
            onValueChange={(v) => updateSetting('nuriVoiceEnabled', v)}
          />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Voice Type</Text>
            <OptionPills<NuriVoiceType>
              options={['female', 'male', 'neutral']}
              value={settings.nuriVoiceType}
              onChange={(next) => updateSetting('nuriVoiceType', next)}
            />
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Language</Text>
            <OptionPills<string>
              options={['English', 'Hindi', 'Spanish']}
              value={settings.nuriLanguage}
              onChange={(next) => updateSetting('nuriLanguage', next)}
            />
          </View>

          <ToggleRow
            icon="health-and-safety"
            title="Allow AI to use health data"
            subtitle="Enable personalized medical safety context"
            value={settings.nuriAllowHealthData}
            onValueChange={(v) => updateSetting('nuriAllowHealthData', v)}
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
  fieldRow: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  fieldLabel: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 10 },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#ffffff' },
  pillSelected: { borderColor: '#2563eb', backgroundColor: '#dbeafe' },
  pillText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  pillTextSelected: { color: '#1d4ed8' },
  backButton: { marginTop: 8, backgroundColor: '#ffffff', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  backButtonText: { color: '#374151', fontSize: 16, fontWeight: '600' },
});
