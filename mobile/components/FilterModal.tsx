import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

export interface FilterOptions {
  allergens: string[];
  onlyWithUserAllergens: boolean;
  onlyExpiringSoon: boolean;
}

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

export default function FilterModal({ visible, onClose, onApply, currentFilters }: FilterModalProps) {
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>(currentFilters.allergens);
  const [onlyWithUserAllergens, setOnlyWithUserAllergens] = useState(currentFilters.onlyWithUserAllergens);
  const [onlyExpiringSoon, setOnlyExpiringSoon] = useState(currentFilters.onlyExpiringSoon);

  const toggleAllergen = (allergen: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(allergen)
        ? prev.filter((a) => a !== allergen)
        : [...prev, allergen]
    );
  };

  const handleApply = () => {
    onApply({
      allergens: selectedAllergens,
      onlyWithUserAllergens,
      onlyExpiringSoon,
    });
    onClose();
  };

  const handleClearAll = () => {
    setSelectedAllergens([]);
    setOnlyWithUserAllergens(false);
    setOnlyExpiringSoon(false);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>🔍 Filters</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Filter by Allergens Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Filter by Allergens</Text>
              <Text style={styles.sectionDescription}>
                Show only products containing these allergens
              </Text>
              <View style={styles.allergenList}>
                {ALLERGEN_OPTIONS.map((allergen) => (
                  <TouchableOpacity
                    key={allergen}
                    style={styles.allergenOption}
                    onPress={() => toggleAllergen(allergen)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        selectedAllergens.includes(allergen) && styles.checkboxChecked,
                      ]}
                    >
                      {selectedAllergens.includes(allergen) && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                    <Text style={styles.allergenLabel}>{allergen}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Other Filters Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Other Filters</Text>

              <View style={styles.toggleOption}>
                <View style={styles.toggleOptionLeft}>
                  <Text style={styles.toggleOptionTitle}>
                    ⚠️ Only show products with my allergens
                  </Text>
                  <Text style={styles.toggleOptionDescription}>
                    Products containing your profile allergens
                  </Text>
                </View>
                <Switch
                  value={onlyWithUserAllergens}
                  onValueChange={setOnlyWithUserAllergens}
                  trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                  thumbColor={onlyWithUserAllergens ? '#2563eb' : '#f3f4f6'}
                />
              </View>

              <View style={styles.toggleOption}>
                <View style={styles.toggleOptionLeft}>
                  <Text style={styles.toggleOptionTitle}>
                    ⏰ Only show expiring soon
                  </Text>
                  <Text style={styles.toggleOptionDescription}>
                    Products expiring within 7 days
                  </Text>
                </View>
                <Switch
                  value={onlyExpiringSoon}
                  onValueChange={setOnlyExpiringSoon}
                  trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                  thumbColor={onlyExpiringSoon ? '#2563eb' : '#f3f4f6'}
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearAll}
              activeOpacity={0.7}
            >
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApply}
              activeOpacity={0.8}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: '600',
  },
  content: {
    maxHeight: '70%',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  allergenList: {
    gap: 12,
  },
  allergenOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  allergenLabel: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  toggleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  toggleOptionLeft: {
    flex: 1,
    marginRight: 12,
  },
  toggleOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  toggleOptionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
