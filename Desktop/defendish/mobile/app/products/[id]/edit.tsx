import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { productService } from '../../../services/product.service';
import { lookupProductByBarcode } from '../../../services/productLookup';

interface ProductFormData {
  name: string;
  barcode: string;
  rawIngredients: string;
  manufacturingDate: Date | null;
  expiryDate: Date | null;
}

export default function ProductEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [relookingUp, setRelookingUp] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    barcode: '',
    rawIngredients: '',
    manufacturingDate: null,
    expiryDate: null,
  });

  const [showManufacturingPicker, setShowManufacturingPicker] = useState(false);
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);

  useEffect(() => {
    loadProduct();
  }, []);

  const loadProduct = async () => {
    try {
      const response = await productService.getProduct(id!);
      const product = response.data;

      setFormData({
        name: product.name || '',
        barcode: product.barcode || '',
        rawIngredients: product.ingredients ? product.ingredients.join(', ') : '',
        manufacturingDate: product.manufacturingDate ? new Date(product.manufacturingDate) : null,
        expiryDate: product.expiryDate ? new Date(product.expiryDate) : null,
      });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load product');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Product name is required');
      return false;
    }

    if (formData.manufacturingDate && formData.expiryDate) {
      if (formData.expiryDate <= formData.manufacturingDate) {
        Alert.alert('Validation Error', 'Expiry date must be after manufacturing date');
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const updateData = {
        name: formData.name.trim(),
        barcode: formData.barcode.trim() || undefined,
        rawIngredients: formData.rawIngredients.trim(),
        manufacturingDate: formData.manufacturingDate?.toISOString() || undefined,
        expiryDate: formData.expiryDate?.toISOString() || undefined,
      };

      await productService.updateProduct(id!, updateData);

      Alert.alert('Success', 'Product updated successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update product';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleRelookup = async () => {
    if (!formData.barcode || formData.barcode.trim().length === 0) {
      Alert.alert('No Barcode', 'This product does not have a barcode to look up.');
      return;
    }

    // Confirm before overwriting
    Alert.alert(
      'Re-lookup Product Data?',
      'This will fetch fresh data from OpenFoodFacts and overwrite the current product name and ingredients.\n\nYour dates and other fields will not be changed.\n\nContinue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes, Re-lookup',
          onPress: async () => {
            try {
              setRelookingUp(true);
              console.log('🔍 Re-looking up product:', formData.barcode);

              const result = await lookupProductByBarcode(formData.barcode);

              if (result.success && result.found && result.data) {
                const { productName, ingredients, brand } = result.data;

                // Update form with new data
                setFormData({
                  ...formData,
                  name: productName || formData.name,
                  rawIngredients: ingredients || formData.rawIngredients,
                });

                Alert.alert(
                  '✅ Data Updated!',
                  `Product information refreshed from OpenFoodFacts${brand ? ` (${brand})` : ''}.\n\nPlease review and save.`,
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert(
                  'Not Found',
                  result.message || 'Product not found in OpenFoodFacts database.',
                  [{ text: 'OK' }]
                );
              }
            } catch (error: any) {
              console.error('Re-lookup error:', error);
              Alert.alert('Lookup Failed', 'Could not fetch product data. Please try again.');
            } finally {
              setRelookingUp(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Not set';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.backButton}>← Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Product</Text>
        </View>

        <View style={styles.form}>
          {/* Product Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Product Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter product name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              editable={!saving}
            />
          </View>

          {/* Barcode */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Barcode</Text>
            <View style={styles.barcodeContainer}>
              <TextInput
                style={[styles.input, styles.barcodeInput]}
                placeholder="Enter barcode (optional)"
                value={formData.barcode}
                onChangeText={(text) => setFormData({ ...formData, barcode: text })}
                editable={!saving && !relookingUp}
                keyboardType="numeric"
              />
              {formData.barcode && formData.barcode.trim().length > 0 && (
                <TouchableOpacity
                  style={[styles.relookupButton, relookingUp && styles.relookupButtonDisabled]}
                  onPress={handleRelookup}
                  disabled={saving || relookingUp}
                >
                  <Text style={styles.relookupButtonText}>
                    {relookingUp ? '⏳ Looking up...' : '🔄 Re-lookup'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {formData.barcode && formData.barcode.trim().length > 0 && (
              <Text style={styles.hint}>
                Tap "Re-lookup" to refresh product data from OpenFoodFacts
              </Text>
            )}
          </View>

          {/* Ingredients */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Ingredients</Text>
            <Text style={styles.hint}>Comma-separated list</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g., Sugar, Milk, Wheat flour"
              value={formData.rawIngredients}
              onChangeText={(text) => setFormData({ ...formData, rawIngredients: text })}
              editable={!saving}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Manufacturing Date */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Manufacturing Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowManufacturingPicker(true)}
              disabled={saving}
            >
              <Text style={styles.dateButtonText}>
                📅 {formatDate(formData.manufacturingDate)}
              </Text>
            </TouchableOpacity>
            {formData.manufacturingDate && (
              <TouchableOpacity
                onPress={() => setFormData({ ...formData, manufacturingDate: null })}
                disabled={saving}
              >
                <Text style={styles.clearButton}>Clear date</Text>
              </TouchableOpacity>
            )}
          </View>

          {showManufacturingPicker && (
            <DateTimePicker
              value={formData.manufacturingDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowManufacturingPicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setFormData({ ...formData, manufacturingDate: selectedDate });
                }
                if (Platform.OS === 'android') {
                  setShowManufacturingPicker(false);
                }
              }}
              maximumDate={new Date()}
            />
          )}

          {/* Expiry Date */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Expiry Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowExpiryPicker(true)}
              disabled={saving}
            >
              <Text style={styles.dateButtonText}>
                📅 {formatDate(formData.expiryDate)}
              </Text>
            </TouchableOpacity>
            {formData.expiryDate && (
              <TouchableOpacity
                onPress={() => setFormData({ ...formData, expiryDate: null })}
                disabled={saving}
              >
                <Text style={styles.clearButton}>Clear date</Text>
              </TouchableOpacity>
            )}
          </View>

          {showExpiryPicker && (
            <DateTimePicker
              value={formData.expiryDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowExpiryPicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setFormData({ ...formData, expiryDate: selectedDate });
                }
                if (Platform.OS === 'android') {
                  setShowExpiryPicker(false);
                }
              }}
              minimumDate={formData.manufacturingDate || new Date()}
            />
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton, saving && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={[styles.saveButtonText, { marginLeft: 8 }]}>Saving...</Text>
                </>
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  form: {
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#dc2626',
  },
  hint: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  barcodeContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'stretch',
  },
  barcodeInput: {
    flex: 1,
  },
  relookupButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 130,
  },
  relookupButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  relookupButtonDisabled: {
    opacity: 0.6,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  dateButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1f2937',
  },
  clearButton: {
    fontSize: 14,
    color: '#dc2626',
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  cancelButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  saveButton: {
    backgroundColor: '#2563eb',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
