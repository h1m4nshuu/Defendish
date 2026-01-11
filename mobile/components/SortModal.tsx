import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

interface SortModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (sortOption: SortOption) => void;
  currentSort: SortOption;
}

export interface SortOption {
  label: string;
  value: 'name' | 'createdAt' | 'expiryDate';
  order: 'asc' | 'desc';
}

export const SORT_OPTIONS: SortOption[] = [
  { label: 'Name (A-Z)', value: 'name', order: 'asc' },
  { label: 'Name (Z-A)', value: 'name', order: 'desc' },
  { label: 'Newest First', value: 'createdAt', order: 'desc' },
  { label: 'Oldest First', value: 'createdAt', order: 'asc' },
  { label: 'Expiry Date (Soonest)', value: 'expiryDate', order: 'asc' },
  { label: 'Expiry Date (Latest)', value: 'expiryDate', order: 'desc' },
];

export default function SortModal({ visible, onClose, onApply, currentSort }: SortModalProps) {
  const [selectedSort, setSelectedSort] = useState<SortOption>(currentSort);

  const handleSelect = (option: SortOption) => {
    setSelectedSort(option);
    onApply(option);
    onClose();
  };

  const handleReset = () => {
    const defaultSort = SORT_OPTIONS[2]; // Newest First
    setSelectedSort(defaultSort);
    onApply(defaultSort);
    onClose();
  };

  const isSelected = (option: SortOption) => {
    return option.value === selectedSort.value && option.order === selectedSort.order;
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
            <Text style={styles.headerTitle}>⇅ Sort By</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.optionsList}>
              {SORT_OPTIONS.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.option}
                  onPress={() => handleSelect(option)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.radio,
                      isSelected(option) && styles.radioSelected,
                    ]}
                  >
                    {isSelected(option) && <View style={styles.radioDot} />}
                  </View>
                  <Text
                    style={[
                      styles.optionLabel,
                      isSelected(option) && styles.optionLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected(option) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleReset}
              activeOpacity={0.7}
            >
              <Text style={styles.resetButtonText}>Reset to Default</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.doneButtonText}>Done</Text>
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
    maxHeight: '70%',
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
    maxHeight: '55%',
  },
  optionsList: {
    padding: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#2563eb',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563eb',
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  optionLabelSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 20,
    color: '#2563eb',
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  doneButton: {
    flex: 1,
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
  doneButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
