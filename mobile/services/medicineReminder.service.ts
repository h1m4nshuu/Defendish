import AsyncStorage from '@react-native-async-storage/async-storage';

export type DoseSlot = 'morning' | 'afternoon' | 'evening';

export interface MedicineItem {
  id: string;
  name: string;
  dosage?: string;
  notes?: string;
  scheduleSlots: DoseSlot[];
  reminderTimes: Record<DoseSlot, string | undefined>;
  durationDays: number;
  startDate: string;
  createdAt: string;
}

export interface CreateMedicineInput {
  name: string;
  dosage?: string;
  notes?: string;
  scheduleSlots: DoseSlot[];
  durationDays: number;
}

export interface UpdateMedicineInput {
  name: string;
  dosage?: string;
  notes?: string;
  scheduleSlots: DoseSlot[];
  durationDays: number;
}

const STORAGE_PREFIX = 'medicines';

const SLOT_DEFAULT_TIMES: Record<DoseSlot, string> = {
  morning: '08:30 AM',
  afternoon: '01:15 PM',
  evening: '08:30 PM',
};

export const SLOT_WINDOWS: Record<DoseSlot, { label: string; range: string }> = {
  morning: { label: 'Morning', range: '7:00 AM - 10:00 AM' },
  afternoon: { label: 'Afternoon', range: '12:30 PM - 2:00 PM' },
  evening: { label: 'Evening', range: '7:00 PM - 10:00 PM' },
};

export const SLOT_SHORT_LABELS: Record<DoseSlot, string> = {
  morning: 'MOR',
  afternoon: 'AFT',
  evening: 'EVE',
};

function getStorageKey(profileId: string): string {
  return `${STORAGE_PREFIX}:${profileId}`;
}

function buildReminderTimes(slots: DoseSlot[]): Record<DoseSlot, string | undefined> {
  return {
    morning: slots.includes('morning') ? SLOT_DEFAULT_TIMES.morning : undefined,
    afternoon: slots.includes('afternoon') ? SLOT_DEFAULT_TIMES.afternoon : undefined,
    evening: slots.includes('evening') ? SLOT_DEFAULT_TIMES.evening : undefined,
  };
}

export const medicineReminderService = {
  async getMedicines(profileId: string): Promise<MedicineItem[]> {
    const raw = await AsyncStorage.getItem(getStorageKey(profileId));
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as MedicineItem[];
      const normalized = parsed.map((item) => ({
        ...item,
        durationDays: item.durationDays ?? 25,
        startDate: item.startDate ?? item.createdAt,
      }));
      return normalized.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch {
      return [];
    }
  },

  async addMedicine(profileId: string, input: CreateMedicineInput): Promise<MedicineItem[]> {
    const current = await this.getMedicines(profileId);

    const newMedicine: MedicineItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: input.name.trim(),
      dosage: input.dosage?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
      scheduleSlots: input.scheduleSlots,
      reminderTimes: buildReminderTimes(input.scheduleSlots),
      durationDays: input.durationDays,
      startDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const updated = [newMedicine, ...current];
    await AsyncStorage.setItem(getStorageKey(profileId), JSON.stringify(updated));
    return updated;
  },

  async getMedicineById(profileId: string, medicineId: string): Promise<MedicineItem | null> {
    const current = await this.getMedicines(profileId);
    return current.find((item) => item.id === medicineId) || null;
  },

  async updateMedicine(
    profileId: string,
    medicineId: string,
    input: UpdateMedicineInput
  ): Promise<MedicineItem[]> {
    const current = await this.getMedicines(profileId);

    const updated = current.map((item) => {
      if (item.id !== medicineId) {
        return item;
      }

      return {
        ...item,
        name: input.name.trim(),
        dosage: input.dosage?.trim() || undefined,
        notes: input.notes?.trim() || undefined,
        scheduleSlots: input.scheduleSlots,
        reminderTimes: buildReminderTimes(input.scheduleSlots),
        durationDays: input.durationDays,
      };
    });

    await AsyncStorage.setItem(getStorageKey(profileId), JSON.stringify(updated));
    return updated;
  },

  async deleteMedicine(profileId: string, medicineId: string): Promise<MedicineItem[]> {
    const current = await this.getMedicines(profileId);
    const updated = current.filter((item) => item.id !== medicineId);
    await AsyncStorage.setItem(getStorageKey(profileId), JSON.stringify(updated));
    return updated;
  },
};

export function getRemainingDays(medicine: MedicineItem): number {
  const start = new Date(medicine.startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + medicine.durationDays);

  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  const remaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, remaining);
}
