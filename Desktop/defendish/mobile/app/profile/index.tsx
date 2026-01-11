import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { userService } from '../../services/user.service';

const ALLERGEN_OPTIONS = [
  'Peanuts',
  'Tree Nuts',
  'Milk',
  'Eggs',
  'Fish',
  'Shellfish',
  'Soy',
  'Wheat',
  'Sesame',
];

export default function UserProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [originalAllergens, setOriginalAllergens] = useState<string[]>([]);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await userService.getUserProfile();
      const allergens = response.data.allergens || [];
      setSelectedAllergens(allergens);
      setOriginalAllergens(allergens);
      setUserEmail(response.data.email);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load your allergen profile');
      console.error('Load profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAllergen = (allergen: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(allergen)
        ? prev.filter((a) => a !== allergen)
        : [...prev, allergen]
    );
  };

  const hasChanges = () => {
    if (selectedAllergens.length !== originalAllergens.length) return true;
    return selectedAllergens.some((a) => !originalAllergens.includes(a));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await userService.updateUserProfile(selectedAllergens);
      setOriginalAllergens(selectedAllergens);
      Alert.alert('Success', 'Your allergen profile has been updated!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update profile';
      Alert.alert('Error', message);
      console.error('Save profile error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges()) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Allergen Profile</Text>
          <Text style={styles.headerSubtitle}>{userEmail}</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={styles.infoText}>
              Select all ingredients you're allergic to. We'll warn you when products
              contain these allergens.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>I'm allergic to:</Text>

          <View style={styles.allergenList}>
            {ALLERGEN_OPTIONS.map((allergen) => {
              const isSelected = selectedAllergens.includes(allergen);
              return (
                <TouchableOpacity
                  key={allergen}
                  style={[
                    styles.allergenOption,
                    isSelected && styles.allergenOptionSelected,
                  ]}
                  onPress={() => toggleAllergen(allergen)}
                  disabled={saving}
                >
                  <View
                    style={[
                      styles.checkbox,
                      isSelected && styles.checkboxChecked,
                    ]}
                  >
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text
                    style={[
                      styles.allergenLabel,
                      isSelected && styles.allergenLabelSelected,
                    ]}
                  >
                    {allergen}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedAllergens.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎉</Text>
              <Text style={styles.emptyText}>No allergens selected</Text>
              <Text style={styles.emptySubtext}>
                Select any allergens above to get warnings
              </Text>
            </View>
          )}

          {selectedAllergens.length > 0 && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Your Allergens:</Text>
              <View style={styles.selectedList}>
                {selectedAllergens.map((allergen, index) => (
                  <Text key={allergen} style={styles.selectedItem}>
                    {index + 1}. {allergen}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {hasChanges() && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={[styles.saveButtonText, { marginLeft: 8 }]}>
                  Saving...
                </Text>
              </>
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    fontSize: 16,
    color: '#2563eb',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  content: {
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#dbeafe',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  allergenList: {
    gap: 12,
  },
  allergenOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  allergenOptionSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  allergenLabel: {
    fontSize: 17,
    color: '#1f2937',
    fontWeight: '500',
  },
  allergenLabelSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  selectedList: {
    gap: 8,
  },
  selectedItem: {
    fontSize: 15,
    color: '#4b5563',
  },
  footer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  saveButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
  },
});
