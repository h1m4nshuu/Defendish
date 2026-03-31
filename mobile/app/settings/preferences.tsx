import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import SectionCard from '../../components/settings/SectionCard';
import ToggleRow from '../../components/settings/ToggleRow';
import { UnitSystem, useSettings } from '../../hooks/useSettings';
import { useTheme } from '../../hooks/useTheme';

function Pills<T extends string>({
  title,
  value,
  options,
  onChange,
  colors,
}: {
  title: string;
  value: T;
  options: T[];
  onChange: (next: T) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
      <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.pillWrap}>
        {options.map((item) => {
          const selected = item === value;
          return (
            <TouchableOpacity
              key={item}
              style={[
                styles.pill,
                { borderColor: colors.borderDark, backgroundColor: colors.card },
                selected && [styles.pillSelected, { borderColor: colors.primary, backgroundColor: colors.infoBackground }],
              ]}
              onPress={() => onChange(item)}
            >
              <Text style={[styles.pillText, { color: colors.textSecondary }, selected && [styles.pillTextSelected, { color: colors.primary }]]}>{item}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function PreferencesSettingsScreen() {
  const router = useRouter();
  const { settings, updateSetting } = useSettings();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.backgroundSecondary, borderBottomColor: colors.border }]}><Text style={[styles.title, { color: colors.text }]}>App Preferences</Text></View>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionCard title="Interface">
          <ToggleRow
            icon="dark-mode"
            title="Dark / Light Mode"
            subtitle="Switch app visual mode"
            value={settings.darkMode}
            onValueChange={(v) => updateSetting('darkMode', v)}
          />
          <View style={[styles.themeIndicator, { backgroundColor: colors.infoBackground, borderColor: colors.border }]}>
            <Text style={[styles.themeIndicatorText, { color: colors.primary }]}>
              Theme: {settings.darkMode ? 'Dark' : 'Light'} Mode
            </Text>
          </View>

          <Pills<UnitSystem>
            title="Units"
            value={settings.units}
            options={['kg', 'lbs']}
            onChange={(next) => updateSetting('units', next)}
            colors={colors}
          />

          <Pills<string>
            title="Region"
            value={settings.region}
            options={['India', 'US', 'UK', 'EU']}
            onChange={(next) => updateSetting('region', next)}
            colors={colors}
          />
        </SectionCard>

        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.back()}><Text style={[styles.backButtonText, { color: colors.textSecondary }]}>Back</Text></TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 120 },
  row: { padding: 14, borderBottomWidth: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', marginBottom: 10 },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7 },
  pillSelected: {},
  pillText: { fontSize: 13, fontWeight: '600' },
  pillTextSelected: {},
  backButton: { marginTop: 8, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1 },
  backButtonText: { fontSize: 16, fontWeight: '600' },
  themeIndicator: { marginHorizontal: 14, marginTop: 12, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  themeIndicatorText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
