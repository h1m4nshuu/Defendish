import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import SectionCard from '../../components/settings/SectionCard';
import ToggleRow from '../../components/settings/ToggleRow';
import { ProductScanPriority, ProductSensitivity, useSettings } from '../../hooks/useSettings';

function Selector<T extends string>({
  title,
  value,
  options,
  onChange,
}: {
  title: string;
  value: T;
  options: T[];
  onChange: (next: T) => void;
}) {
  return (
    <View style={styles.selectorRow}>
      <Text style={styles.selectorLabel}>{title}</Text>
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

export default function ProductSettingsScreen() {
  const router = useRouter();
  const { settings, updateSetting } = useSettings();

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Product & Scanning</Text></View>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionCard title="Scan Behavior">
          <ToggleRow
            icon="camera-alt"
            title="Auto Scan"
            subtitle="Trigger scan pipeline automatically"
            value={settings.productAutoScan}
            onValueChange={(v) => updateSetting('productAutoScan', v)}
          />

          <Selector<ProductScanPriority>
            title="Barcode / Image Priority"
            value={settings.productScanPriority}
            options={['barcode', 'image']}
            onChange={(next) => updateSetting('productScanPriority', next)}
          />

          <Selector<ProductSensitivity>
            title="Sensitivity"
            value={settings.productSensitivity}
            options={['strict', 'balanced', 'lenient']}
            onChange={(next) => updateSetting('productSensitivity', next)}
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
  selectorRow: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  selectorLabel: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 10 },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#ffffff' },
  pillSelected: { borderColor: '#2563eb', backgroundColor: '#dbeafe' },
  pillText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  pillTextSelected: { color: '#1d4ed8' },
  backButton: { marginTop: 8, backgroundColor: '#ffffff', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  backButtonText: { color: '#374151', fontSize: 16, fontWeight: '600' },
});
