import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { profileService } from '../../services/profile.service';
import {
  medicineReminderService,
  MedicineItem,
  SLOT_SHORT_LABELS,
  DoseSlot,
  getRemainingDays,
} from '../../services/medicineReminder.service';

export default function MedicinesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState('');
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const profile = await profileService.getCurrentProfile();

      if (!profile?.id) {
        Alert.alert('Profile required', 'Please select a profile first.');
        router.replace('/profile/select');
        return;
      }

      setProfileName(profile.name || 'Profile');
      const list = await medicineReminderService.getMedicines(profile.id);
      setMedicines(list);
    } catch (error) {
      Alert.alert('Error', 'Failed to load medicines.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const getCountdownColor = (remainingDays: number) => {
    if (remainingDays === 0) {
      return '#dc2626';
    }
    if (remainingDays <= 7) {
      return '#f59e0b';
    }
    return '#16a34a';
  };

  const renderSlot = (slot: DoseSlot, medicine: MedicineItem) => {
    const time = medicine.reminderTimes[slot];

    if (!time) {
      return null;
    }

    return (
      <View key={`${medicine.id}-${slot}`} style={styles.slotChip}>
        <Text style={styles.slotText}>{`${SLOT_SHORT_LABELS[slot]} ${time.replace(' ', '')}`}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Dose Remainder</Text>
        <Text style={styles.subtitle}>{profileName}'s medicine list</Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading medicines...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {medicines.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No medicines added yet</Text>
              <Text style={styles.emptyText}>
                Add your first medicine and pick Morning, Afternoon, or Evening schedule.
              </Text>
            </View>
          ) : (
            medicines.map((medicine) => (
              <View key={medicine.id} style={styles.medicineCard}>
                {(() => {
                  const remainingDays = getRemainingDays(medicine);
                  return (
                    <>
                <View style={styles.medicineHeaderRow}>
                  <Text style={styles.medicineName}>{medicine.name}</Text>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() =>
                      router.push({
                        pathname: '/profile/medicines-edit',
                        params: { medicineId: medicine.id },
                      })
                    }
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.countdownText, { color: getCountdownColor(remainingDays) }]}>
                  {remainingDays} day{remainingDays === 1 ? '' : 's'} left
                </Text>
                {medicine.dosage ? <Text style={styles.metaText}>Dosage: {medicine.dosage}</Text> : null}
                {medicine.notes ? <Text style={styles.metaText}>Note: {medicine.notes}</Text> : null}
                <View style={styles.slotWrap}>
                  {medicine.scheduleSlots.map((slot) => renderSlot(slot, medicine))}
                </View>
                    </>
                  );
                })()}
              </View>
            ))
          )}

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/profile/medicines-add')}
          >
            <Text style={styles.addButtonText}>+ Add New Medicine</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
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
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6b7280',
  },
  content: {
    padding: 20,
    paddingBottom: 120,
    gap: 12,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  medicineCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  medicineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#dbeafe',
  },
  editButtonText: {
    color: '#1d4ed8',
    fontSize: 13,
    fontWeight: '600',
  },
  countdownText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 6,
  },
  slotWrap: {
    marginTop: 4,
    gap: 8,
  },
  slotChip: {
    backgroundColor: '#eef2ff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  slotText: {
    fontSize: 13,
    color: '#1e3a8a',
  },
  addButton: {
    backgroundColor: '#2563eb',
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
