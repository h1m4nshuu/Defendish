import { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { profileService } from '../../services/profile.service';
import {
  medicineReminderService,
  DoseSlot,
  SLOT_WINDOWS,
} from '../../services/medicineReminder.service';
import {
  getMedicinePurposeByName,
  getMedicineSuggestions,
} from '../../constants/medicineCatalog';

const SLOT_ORDER: DoseSlot[] = ['morning', 'afternoon', 'evening'];
const DURATION_PRESETS = [7, 15, 25, 30, 45];

export default function AddMedicineScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<DoseSlot[]>([]);
  const [durationDays, setDurationDays] = useState('25');
  const [saving, setSaving] = useState(false);

  const helperText = useMemo(
    () =>
      'System reminder windows: Morning (7:00 AM - 10:00 AM), Afternoon (12:30 PM - 2:00 PM), Evening (7:00 PM - 10:00 PM).',
    []
  );

  const nameSuggestions = useMemo(() => getMedicineSuggestions(name), [name]);
  const selectedMedicinePurpose = useMemo(() => getMedicinePurposeByName(name), [name]);

  const toggleSlot = (slot: DoseSlot) => {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((item) => item !== slot) : [...prev, slot]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Please enter medicine name.');
      return;
    }

    if (selectedSlots.length === 0) {
      Alert.alert('Validation', 'Please select at least one dose schedule.');
      return;
    }

    const durationValue = Number(durationDays);
    if (!Number.isFinite(durationValue) || durationValue <= 0) {
      Alert.alert('Validation', 'Please enter valid treatment days.');
      return;
    }

    try {
      setSaving(true);
      const profile = await profileService.getCurrentProfile();

      if (!profile?.id) {
        Alert.alert('Profile required', 'Please select a profile first.');
        router.replace('/profile/select');
        return;
      }

      await medicineReminderService.addMedicine(profile.id, {
        name,
        dosage,
        notes,
        scheduleSlots: SLOT_ORDER.filter((slot) => selectedSlots.includes(slot)),
        durationDays: Math.floor(durationValue),
      });

      router.replace('/profile/medicines');
    } catch (error) {
      Alert.alert('Error', 'Failed to save medicine.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add New Medicine</Text>
        <Text style={styles.subtitle}>Set dose schedule and reminder windows</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Medicine Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Cetirizine"
            style={styles.input}
            placeholderTextColor="#9ca3af"
          />

          {name.trim().length >= 3 && (
            <View style={styles.suggestionWrap}>
              {nameSuggestions.length > 0 ? (
                nameSuggestions.map((item) => (
                  <TouchableOpacity
                    key={item.name}
                    style={styles.suggestionItem}
                    onPress={() => setName(item.name)}
                  >
                    <Text style={styles.suggestionName}>{item.name}</Text>
                    <Text style={styles.suggestionPurpose}>{item.purpose}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.suggestionEmpty}>No medicine suggestions found</Text>
              )}
            </View>
          )}

          {selectedMedicinePurpose ? (
            <View style={styles.purposeCard}>
              <Text style={styles.purposeTitle}>Medicine use</Text>
              <Text style={styles.purposeText}>{selectedMedicinePurpose}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>Dosage</Text>
          <TextInput
            value={dosage}
            onChangeText={setDosage}
            placeholder="e.g. 1 tablet"
            style={styles.input}
            placeholderTextColor="#9ca3af"
          />

          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Any special instruction"
            style={[styles.input, styles.notesInput]}
            placeholderTextColor="#9ca3af"
            multiline
          />

          <Text style={styles.label}>Dose Schedule</Text>
          <Text style={styles.helperText}>{helperText}</Text>

          <Text style={styles.label}>Duration (days)</Text>
          <TextInput
            value={durationDays}
            onChangeText={setDurationDays}
            placeholder="e.g. 25"
            keyboardType="number-pad"
            style={styles.input}
            placeholderTextColor="#9ca3af"
          />
          <View style={styles.presetWrap}>
            {DURATION_PRESETS.map((value) => {
              const selected = durationDays === String(value);
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.presetButton, selected && styles.presetButtonSelected]}
                  onPress={() => setDurationDays(String(value))}
                >
                  <Text style={[styles.presetButtonText, selected && styles.presetButtonTextSelected]}>
                    {value} days
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.scheduleList}>
            {SLOT_ORDER.map((slot) => {
              const selected = selectedSlots.includes(slot);
              const details = SLOT_WINDOWS[slot];

              return (
                <TouchableOpacity
                  key={slot}
                  style={[styles.scheduleOption, selected && styles.scheduleOptionSelected]}
                  onPress={() => toggleSlot(slot)}
                >
                  <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                    {selected ? <Text style={styles.checkmark}>✓</Text> : null}
                  </View>
                  <View style={styles.scheduleTextWrap}>
                    <Text style={styles.scheduleTitle}>{details.label}</Text>
                    <Text style={styles.scheduleRange}>{details.range}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Medicine'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    fontSize: 16,
    color: '#2563eb',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#6b7280',
  },
  content: {
    padding: 20,
    paddingBottom: 120,
    gap: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1f2937',
  },
  notesInput: {
    minHeight: 86,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#6b7280',
    marginBottom: 12,
  },
  scheduleList: {
    gap: 10,
  },
  presetWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    marginBottom: 6,
  },
  presetButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#ffffff',
  },
  presetButtonSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  presetButtonText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
  },
  presetButtonTextSelected: {
    color: '#1d4ed8',
  },
  scheduleOption: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleOptionSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#ffffff',
  },
  checkboxSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb',
  },
  checkmark: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  scheduleTextWrap: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  scheduleRange: {
    marginTop: 2,
    fontSize: 13,
    color: '#6b7280',
  },
  saveButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionWrap: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    marginTop: 8,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  suggestionPurpose: {
    marginTop: 2,
    fontSize: 12,
    color: '#6b7280',
  },
  suggestionEmpty: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#6b7280',
  },
  purposeCard: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 10,
  },
  purposeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 2,
  },
  purposeText: {
    fontSize: 13,
    color: '#1e3a8a',
  },
});
