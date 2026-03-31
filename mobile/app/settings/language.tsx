import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import SectionCard from '../../components/settings/SectionCard';
import ToggleRow from '../../components/settings/ToggleRow';
import { useSettings } from '../../hooks/useSettings';

function SelectPills({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: string[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowTitle}>{title}</Text>
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
    </View>
  );
}

export default function LanguageSettingsScreen() {
  const router = useRouter();
  const { settings, updateSetting } = useSettings();

  const decreaseSize = () => updateSetting('textSize', Math.max(12, settings.textSize - 1));
  const increaseSize = () => updateSetting('textSize', Math.min(24, settings.textSize + 1));

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Language & Accessibility</Text></View>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionCard title="Language">
          <SelectPills title="App Language" options={['English', 'Hindi', 'Spanish']} value={settings.appLanguage} onChange={(next) => updateSetting('appLanguage', next)} />
          <SelectPills title="Voice Language" options={['English', 'Hindi', 'Spanish']} value={settings.voiceLanguage} onChange={(next) => updateSetting('voiceLanguage', next)} />
        </SectionCard>

        <SectionCard title="Accessibility">
          <View style={styles.row}>
            <Text style={styles.rowTitle}>Text Size Slider</Text>
            <View style={styles.sliderRow}>
              <TouchableOpacity style={styles.sizeButton} onPress={decreaseSize}><Text style={styles.sizeButtonText}>-</Text></TouchableOpacity>
              <Text style={[styles.previewText, { fontSize: settings.textSize }]}>Sample text ({settings.textSize})</Text>
              <TouchableOpacity style={styles.sizeButton} onPress={increaseSize}><Text style={styles.sizeButtonText}>+</Text></TouchableOpacity>
            </View>
          </View>

          <ToggleRow
            icon="contrast"
            title="High Contrast Mode"
            subtitle="Increase readability and visual clarity"
            value={settings.highContrastMode}
            onValueChange={(v) => updateSetting('highContrastMode', v)}
          />
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
  row: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 10 },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#ffffff' },
  pillSelected: { borderColor: '#2563eb', backgroundColor: '#dbeafe' },
  pillText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  pillTextSelected: { color: '#1d4ed8' },
  sliderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sizeButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  sizeButtonText: { fontSize: 22, color: '#111827', fontWeight: '700' },
  previewText: { flex: 1, textAlign: 'center', color: '#374151' },
  backButton: { marginTop: 8, backgroundColor: '#ffffff', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  backButtonText: { color: '#374151', fontSize: 16, fontWeight: '600' },
});
