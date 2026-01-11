import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';

interface ScanResult {
  ingredients?: string[];
  expiryDate?: string;
  manufacturingDate?: string;
  confidence: {
    ingredients?: 'high' | 'medium' | 'low';
    expiryDate?: 'high' | 'medium' | 'low';
    manufacturingDate?: 'high' | 'medium' | 'low';
  };
  extractedText: string;
}

interface Props {
  scanResult: ScanResult;
  allergens: string[];
  onConfirm: (data: {
    ingredients: string;
    manufacturingDate: string;
    expiryDate: string;
  }) => void;
  onRescan: (field?: 'mfg' | 'exp' | 'ingredients') => void;
  onCancel: () => void;
}

export default function ScanConfirmationScreen({
  scanResult,
  allergens,
  onConfirm,
  onRescan,
  onCancel,
}: Props) {
  const [editing, setEditing] = useState<'mfg' | 'exp' | 'ingredients' | null>(null);
  const [mfgDate, setMfgDate] = useState(scanResult.manufacturingDate || '');
  const [expDate, setExpDate] = useState(scanResult.expiryDate || '');
  const [ingredients, setIngredients] = useState(
    scanResult.ingredients?.join(', ') || ''
  );

  const getConfidenceColor = (confidence?: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return '#4CAF50';
      case 'medium':
        return '#FF9800';
      case 'low':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getConfidenceText = (confidence?: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return 'High Confidence';
      case 'medium':
        return 'Medium Confidence';
      case 'low':
        return 'Low Confidence';
      default:
        return 'Not Detected';
    }
  };

  const highlightAllergens = (text: string) => {
    const words = text.split(',').map(w => w.trim());
    return words.map((word, index) => {
      const isAllergen = allergens.some(allergen =>
        word.toLowerCase().includes(allergen.toLowerCase())
      );
      return (
        <Text key={index} style={isAllergen ? styles.allergenText : styles.normalText}>
          {word}
          {index < words.length - 1 ? ', ' : ''}
        </Text>
      );
    });
  };

  const handleConfirm = () => {
    if (!mfgDate || !expDate || !ingredients) {
      Alert.alert('Missing Information', 'Please provide all required fields');
      return;
    }

    onConfirm({
      manufacturingDate: mfgDate,
      expiryDate: expDate,
      ingredients,
    });
  };

  const hasAllergens = scanResult.ingredients?.some(ing =>
    allergens.some(allergen => ing.toLowerCase().includes(allergen.toLowerCase()))
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan Results</Text>
        <Text style={styles.subtitle}>Review and confirm the extracted information</Text>
      </View>

      {/* Ingredients Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📦 INGREDIENTS</Text>
          <View
            style={[
              styles.confidenceBadge,
              { backgroundColor: getConfidenceColor(scanResult.confidence.ingredients) },
            ]}
          >
            <Text style={styles.confidenceText}>
              {getConfidenceText(scanResult.confidence.ingredients)}
            </Text>
          </View>
        </View>

        {editing === 'ingredients' ? (
          <View>
            <TextInput
              style={styles.textInput}
              value={ingredients}
              onChangeText={setIngredients}
              multiline
              placeholder="Enter ingredients separated by commas"
              autoFocus
            />
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => setEditing(null)}
            >
              <Text style={styles.saveButtonText}>✓ Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.contentCard}>
            <Text style={styles.ingredientsText}>{highlightAllergens(ingredients)}</Text>
            
            {hasAllergens && (
              <View style={styles.allergenWarning}>
                <Text style={styles.allergenWarningText}>
                  ⚠️ Contains allergens from your profile
                </Text>
              </View>
            )}

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditing('ingredients')}
              >
                <Text style={styles.editButtonText}>✏️ Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rescanButton}
                onPress={() => onRescan('ingredients')}
              >
                <Text style={styles.rescanButtonText}>📸 Re-scan</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Manufacturing Date Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📅 MANUFACTURING DATE</Text>
          <View
            style={[
              styles.confidenceBadge,
              { backgroundColor: getConfidenceColor(scanResult.confidence.manufacturingDate) },
            ]}
          >
            <Text style={styles.confidenceText}>
              {getConfidenceText(scanResult.confidence.manufacturingDate)}
            </Text>
          </View>
        </View>

        {editing === 'mfg' ? (
          <View>
            <TextInput
              style={styles.dateInput}
              value={mfgDate}
              onChangeText={setMfgDate}
              placeholder="DD/MM/YYYY"
              autoFocus
            />
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => setEditing(null)}
            >
              <Text style={styles.saveButtonText}>✓ Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.contentCard}>
            <Text style={styles.dateText}>{mfgDate || 'Not detected'}</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditing('mfg')}
              >
                <Text style={styles.editButtonText}>✏️ Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rescanButton}
                onPress={() => onRescan('mfg')}
              >
                <Text style={styles.rescanButtonText}>📸 Re-scan Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Expiry Date Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>⏰ EXPIRY DATE</Text>
          <View
            style={[
              styles.confidenceBadge,
              { backgroundColor: getConfidenceColor(scanResult.confidence.expiryDate) },
            ]}
          >
            <Text style={styles.confidenceText}>
              {getConfidenceText(scanResult.confidence.expiryDate)}
            </Text>
          </View>
        </View>

        {editing === 'exp' ? (
          <View>
            <TextInput
              style={styles.dateInput}
              value={expDate}
              onChangeText={setExpDate}
              placeholder="DD/MM/YYYY"
              autoFocus
            />
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => setEditing(null)}
            >
              <Text style={styles.saveButtonText}>✓ Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.contentCard}>
            <Text style={styles.dateText}>{expDate || 'Not detected'}</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditing('exp')}
              >
                <Text style={styles.editButtonText}>✏️ Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rescanButton}
                onPress={() => onRescan('exp')}
              >
                <Text style={styles.rescanButtonText}>📸 Re-scan Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Main Actions */}
      <View style={styles.mainActions}>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>✓ Confirm All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  contentCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  ingredientsText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  normalText: {
    color: '#374151',
  },
  allergenText: {
    color: '#ef4444',
    fontWeight: 'bold',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
  },
  allergenWarning: {
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  allergenWarningText: {
    color: '#92400e',
    fontSize: 13,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rescanButton: {
    flex: 1,
    backgroundColor: '#6b7280',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  rescanButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mainActions: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  confirmButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
});
