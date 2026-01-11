import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { profileService } from '../../services/profile.service';
import { productService } from '../../services/product.service';
import { lookupProductByBarcode } from '../../services/productLookup';

export default function AddProductScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [fetchingProductInfo, setFetchingProductInfo] = useState(false);
  const [lookupSkipped, setLookupSkipped] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<{
    name?: boolean;
    ingredients?: boolean;
  }>({});
  const [dataSource, setDataSource] = useState<'openfoodfacts' | 'manual' | null>(null);
  const [showDateScanner, setShowDateScanner] = useState<'mfg' | 'exp' | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processingImage, setProcessingImage] = useState(false);
  const [detectedDate, setDetectedDate] = useState<string>('');
  const [showDateConfirmation, setShowDateConfirmation] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    barcode: params.barcode as string || '',
    rawIngredients: '',
    manufacturingDate: '',
    expiryDate: '',
    dosage: '',
    storageInstructions: '',
  });

  // Auto-format date as user types (DD/MM/YYYY)
  const formatDateInput = (text: string): string => {
    // Remove all non-numeric characters
    const numbers = text.replace(/[^\d]/g, '');
    
    // Limit to 8 digits
    const limited = numbers.slice(0, 8);
    
    // Auto-format based on length
    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 4) {
      // DD/MM
      return `${limited.slice(0, 2)}/${limited.slice(2)}`;
    } else {
      // DD/MM/YYYY
      return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`;
    }
  };

  // Convert DD/MM/YYYY to YYYY-MM-DD for backend
  const convertDateToISO = (dateStr: string): string => {
    if (!dateStr) return '';
    
    // If already in YYYY-MM-DD format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Handle DD/MM/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return dateStr;
  };

  useEffect(() => {
    if (params.barcode && !lookupSkipped) {
      fetchProductInfo(params.barcode as string);
    }
  }, [params.barcode]);

  const fetchProductInfo = async (barcode: string) => {
    try {
      setFetchingProductInfo(true);
      console.log('🔍 Looking up product via backend API...');
      
      // Call backend API which uses OpenFoodFacts
      const result = await lookupProductByBarcode(barcode);
      
      if (result.success && result.found && result.data) {
        // Product found - auto-fill fields
        const { productName, ingredients, brand } = result.data;
        
        setFormData({
          ...formData,
          name: productName || '',
          barcode: barcode,
          rawIngredients: ingredients || '',
        });
        
        // Mark fields as auto-filled
        setAutoFilledFields({
          name: !!productName,
          ingredients: !!ingredients,
        });
        
        setDataSource('openfoodfacts');
        
        // Show success message
        Alert.alert(
          '✅ Product Found!',
          `${productName || 'Unknown Product'}${brand ? ` (${brand})` : ''}\n\nName and ingredients auto-filled from OpenFoodFacts.\n\n⚠️ Please verify the details and enter the manufacturing and expiry dates from your package.`,
          [{ text: 'OK' }]
        );
      } else {
        // Product not found
        setDataSource('manual');
        Alert.alert(
          'ℹ️ Product Not Found',
          result.message || 'This product is not in the OpenFoodFacts database. Please enter the details manually.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Error fetching product info:', error);
      setDataSource('manual');
      Alert.alert(
        'Lookup Failed',
        'Could not connect to product database. Please enter details manually.',
        [{ text: 'OK' }]
      );
    } finally {
      setFetchingProductInfo(false);
    }
  };

  const retryLookup = () => {
    if (formData.barcode) {
      setLookupSkipped(false);
      setAutoFilledFields({});
      setDataSource(null);
      fetchProductInfo(formData.barcode);
    }
  };

  const skipLookup = () => {
    setLookupSkipped(true);
    setFetchingProductInfo(false);
    setDataSource('manual');
  };

  const openDateScanner = async (type: 'mfg' | 'exp') => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to scan dates');
        return;
      }
    }
    setShowDateScanner(type);
  };

  const captureImage = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        quality: 1,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
        setShowDateScanner(null);
        // Process image with OCR
        processDateImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  const processDateImage = async (imageUri: string) => {
    try {
      setProcessingImage(true);
      
      // Get current profile
      const currentProfile = await profileService.getCurrentProfile();
      if (!currentProfile) {
        Alert.alert('Error', 'Please select a profile first');
        return;
      }

      console.log('📸 Scanning image with backend OCR...');
      
      // Use our backend OCR service
      const response = await productService.scanImage(imageUri, currentProfile.id);
      
      console.log('✅ OCR Response:', response);
      
      if (response.success && response.data) {
        const { manufacturingDate, expiryDate, extractedText, confidence } = response.data;
        
        // Determine which date to use based on scanner type
        let detectedDate = null;
        if (showDateScanner === 'mfg' && manufacturingDate) {
          detectedDate = manufacturingDate;
        } else if (showDateScanner === 'exp' && expiryDate) {
          detectedDate = expiryDate;
        }
        
        if (detectedDate) {
          // Convert DD/MM/YYYY to YYYY-MM-DD format
          const dateParts = detectedDate.split('/');
          if (dateParts.length === 3) {
            const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
            setDetectedDate(formattedDate);
          } else {
            setDetectedDate(detectedDate);
          }
          
          setShowDateConfirmation(true);
        } else {
          // Show extracted text to help user enter manually
          const preview = extractedText ? extractedText.substring(0, 200) : 'No text extracted';
          
          Alert.alert(
            'Date Detection Failed', 
            `OCR Quality: ${confidence}\n\nThe image quality may be too low or the date format is not recognized.\n\nExtracted text preview:\n${preview}...\n\nPlease enter the ${showDateScanner === 'mfg' ? 'manufacturing' : 'expiry'} date manually.`,
            [
              { 
                text: 'Try Again', 
                onPress: () => setCapturedImage(null),
                style: 'cancel'
              },
              { 
                text: 'Enter Manually', 
                onPress: () => {
                  setCapturedImage(null);
                  setShowDateScanner(null);
                }
              }
            ]
          );
        }
      } else {
        throw new Error('OCR service returned no data');
      }
      
    } catch (error: any) {
      console.error('❌ OCR Error:', error);
      Alert.alert(
        'Scan Failed', 
        `Could not process the image. Please enter the date manually.\n\nError: ${error.message}`,
        [{ 
          text: 'OK', 
          onPress: () => {
            setCapturedImage(null);
            setShowDateScanner(null);
          }
        }]
      );
    } finally {
      setProcessingImage(false);
    }
  };

  const getBase64FromUri = async (uri: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64.split(',')[1]); // Remove data:image/jpeg;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw error;
    }
  };

  const extractDateFromText = (text: string): string | null => {
    // Remove extra spaces and newlines
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    // Common date patterns
    const patterns = [
      // YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
      /\b(20\d{2})[\/\-\.](0[1-9]|1[0-2])[\/\-\.](0[1-9]|[12]\d|3[01])\b/,
      // DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
      /\b(0[1-9]|[12]\d|3[01])[\/\-\.](0[1-9]|1[0-2])[\/\-\.](20\d{2})\b/,
      // MM-DD-YYYY or MM/DD/YYYY or MM.DD.YYYY
      /\b(0[1-9]|1[0-2])[\/\-\.](0[1-9]|[12]\d|3[01])[\/\-\.](20\d{2})\b/,
      // MFG or EXP followed by date
      /(?:MFG|EXP|mfg|exp)[:\s]*(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{2,4})/,
      // Just numbers like 25/12/2025
      /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/,
    ];

    for (const pattern of patterns) {
      const match = cleanText.match(pattern);
      if (match) {
        // Parse the matched date
        let year, month, day;
        
        if (pattern === patterns[0]) {
          // YYYY-MM-DD
          [, year, month, day] = match;
        } else if (pattern === patterns[1]) {
          // DD-MM-YYYY
          [, day, month, year] = match;
        } else if (pattern === patterns[2]) {
          // MM-DD-YYYY
          [, month, day, year] = match;
        } else {
          // Try to parse other formats
          const parts = match[0].split(/[\/\-\.]/);
          if (parts.length === 3) {
            // Guess format based on values
            if (parseInt(parts[0]) > 2000) {
              // YYYY-MM-DD
              [year, month, day] = parts;
            } else if (parseInt(parts[2]) > 2000 || parts[2].length === 4) {
              // DD-MM-YYYY or MM-DD-YYYY
              [day, month, year] = parts;
            } else {
              continue;
            }
          }
        }
        
        // Convert 2-digit year to 4-digit
        if (year && year.length === 2) {
          year = '20' + year;
        }
        
        // Validate and format
        if (!year || !month || !day) {
          continue;
        }
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
        const dayNum = parseInt(day);
        
        if (yearNum >= 2020 && yearNum <= 2050 && 
            monthNum >= 1 && monthNum <= 12 && 
            dayNum >= 1 && dayNum <= 31) {
          
          // Format as YYYY-MM-DD
          const formattedMonth = String(monthNum).padStart(2, '0');
          const formattedDay = String(dayNum).padStart(2, '0');
          return `${yearNum}-${formattedMonth}-${formattedDay}`;
        }
      }
    }
    
    return null;
  };

  const confirmDetectedDate = () => {
    if (!detectedDate.trim()) {
      Alert.alert('Error', 'Please enter the date');
      return;
    }
    
    if (showDateScanner === 'mfg') {
      setFormData({ ...formData, manufacturingDate: detectedDate });
    } else if (showDateScanner === 'exp') {
      setFormData({ ...formData, expiryDate: detectedDate });
    }
    setShowDateConfirmation(false);
    setDetectedDate('');
    setCapturedImage(null);
    setShowDateScanner(null);
  };

  const rejectDetectedDate = () => {
    setShowDateConfirmation(false);
    setDetectedDate('');
    setCapturedImage(null);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.rawIngredients) {
      Alert.alert('Error', 'Please fill in product name and ingredients');
      return;
    }

    try {
      setLoading(true);
      const currentProfile = await profileService.getCurrentProfile();
      
      if (!currentProfile) {
        Alert.alert('Error', 'Please select a profile first');
        router.replace('/profile/select');
        return;
      }

      // Convert dates to ISO format before sending
      const productData = {
        profileId: currentProfile.id,
        ...formData,
        manufacturingDate: convertDateToISO(formData.manufacturingDate),
        expiryDate: convertDateToISO(formData.expiryDate),
      };

      await productService.createProduct(productData);

      Alert.alert('Success', 'Product added successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Product</Text>
      </View>

      {fetchingProductInfo && (
        <View style={styles.fetchingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.fetchingText}>🔍 Looking up product...</Text>
          <Text style={styles.fetchingSubtext}>Searching OpenFoodFacts database</Text>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={skipLookup}
          >
            <Text style={styles.skipButtonText}>Skip Lookup & Enter Manually</Text>
          </TouchableOpacity>
        </View>
      )}

      {dataSource && !fetchingProductInfo && (
        <View style={[
          styles.dataSourceBadge,
          dataSource === 'openfoodfacts' ? styles.dataSourceAuto : styles.dataSourceManual
        ]}>
          <Text style={styles.dataSourceText}>
            {dataSource === 'openfoodfacts' ? '📦 From OpenFoodFacts Database' : '✍️ Manual Entry'}
          </Text>
          {dataSource === 'openfoodfacts' && formData.barcode && (
            <TouchableOpacity onPress={retryLookup} style={styles.refreshButton}>
              <Text style={styles.refreshButtonText}>🔄 Re-lookup</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.form}>
        <Text style={styles.label}>
          Product Name *
          {autoFilledFields.name && <Text style={styles.autoFilledBadge}> ✨ Auto-filled</Text>}
        </Text>
        <TextInput
          style={[
            styles.input,
            autoFilledFields.name && styles.inputAutoFilled
          ]}
          placeholder="e.g., Almond Milk"
          value={formData.name}
          onChangeText={(text) => {
            setFormData({ ...formData, name: text });
            if (autoFilledFields.name) {
              setAutoFilledFields({ ...autoFilledFields, name: false });
            }
          }}
          editable={!loading && !fetchingProductInfo}
        />

        {formData.barcode && (
          <>
            <Text style={styles.label}>Barcode</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={formData.barcode}
              editable={false}
            />
          </>
        )}

        <Text style={styles.label}>
          Ingredients *
          {autoFilledFields.ingredients && <Text style={styles.autoFilledBadge}> ✨ Auto-filled</Text>}
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            autoFilledFields.ingredients && styles.inputAutoFilled
          ]}
          placeholder="Enter all ingredients separated by commas"
          value={formData.rawIngredients}
          onChangeText={(text) => {
            setFormData({ ...formData, rawIngredients: text });
            if (autoFilledFields.ingredients) {
              setAutoFilledFields({ ...autoFilledFields, ingredients: false });
            }
          }}
          multiline
          numberOfLines={6}
          editable={!loading && !fetchingProductInfo}
        />

        <Text style={styles.label}>Manufacturing Date (from package)</Text>
        <Text style={styles.helperText}>Scan or enter the date printed on the product</Text>
        <View style={styles.dateInputContainer}>
          <TextInput
            style={[styles.input, styles.dateInput]}
            placeholder="DD/MM/YYYY"
            value={formData.manufacturingDate}
            onChangeText={(text) => {
              const formatted = formatDateInput(text);
              setFormData({ ...formData, manufacturingDate: formatted });
            }}
            keyboardType="numeric"
            maxLength={10}
            editable={!loading && !fetchingProductInfo}
          />
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => openDateScanner('mfg')}
            disabled={loading || fetchingProductInfo}
          >
            <Text style={styles.scanButtonText}>📷 Scan</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Expiry Date (from package)</Text>
        <Text style={styles.helperText}>Scan or enter the expiry date on the product</Text>
        <View style={styles.dateInputContainer}>
          <TextInput
            style={[styles.input, styles.dateInput]}
            placeholder="DD/MM/YYYY"
            value={formData.expiryDate}
            onChangeText={(text) => {
              const formatted = formatDateInput(text);
              setFormData({ ...formData, expiryDate: formatted });
            }}
            keyboardType="numeric"
            maxLength={10}
            editable={!loading && !fetchingProductInfo}
          />
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => openDateScanner('exp')}
            disabled={loading || fetchingProductInfo}
          >
            <Text style={styles.scanButtonText}>📷 Scan</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Dosage / Usage</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 1 cup per serving"
          value={formData.dosage}
          onChangeText={(text) => setFormData({ ...formData, dosage: text })}
          editable={!loading && !fetchingProductInfo}
        />

        <Text style={styles.label}>Storage Instructions</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="e.g., Store in a cool, dry place"
          value={formData.storageInstructions}
          onChangeText={(text) => setFormData({ ...formData, storageInstructions: text })}
          multiline
          numberOfLines={3}
          editable={!loading && !fetchingProductInfo}
        />

        <TouchableOpacity
          style={[styles.button, (loading || fetchingProductInfo) && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading || fetchingProductInfo}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Adding...' : 'Add Product'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Scanner Modal */}
      <Modal
        visible={showDateScanner !== null}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowDateScanner(null)}
      >
        <View style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <Text style={styles.scannerTitle}>
              Scan {showDateScanner === 'mfg' ? 'Manufacturing' : 'Expiry'} Date
            </Text>
            <Text style={styles.scannerSubtitle}>
              Position the date label clearly within the frame
            </Text>
          </View>
          
          <View style={styles.scannerGuide}>
            <Text style={styles.guideText}>📷 Tap the button below to capture the date</Text>
          </View>

          <View style={styles.scannerActions}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={captureImage}
            >
              <Text style={styles.captureButtonText}>📷 Capture Date</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowDateScanner(null)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Processing Indicator */}
      {processingImage && (
        <Modal transparent={true} visible={true}>
          <View style={styles.processingOverlay}>
            <View style={styles.processingContent}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.processingText}>Detecting date from image...</Text>
              <Text style={styles.processingSubtext}>Please wait</Text>
            </View>
          </View>
        </Modal>
      )}

      {/* Date Confirmation Modal */}
      <Modal
        visible={showDateConfirmation}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDateConfirmation(false)}
      >
        <View style={styles.confirmationOverlay}>
          <View style={styles.confirmationContent}>
            <Text style={styles.confirmationTitle}>✓ Date Detected!</Text>
            <Text style={styles.confirmationSubtitle}>
              {showDateScanner === 'mfg' ? 'Manufacturing Date' : 'Expiry Date'}
            </Text>
            
            {capturedImage && (
              <View style={styles.capturedImageContainer}>
                <Text style={styles.imageLabel}>Captured image:</Text>
                <Image 
                  source={{ uri: capturedImage }} 
                  style={styles.capturedImage}
                  resizeMode="contain"
                />
              </View>
            )}
            
            <View style={styles.detectedDateBox}>
              <Text style={styles.detectedDateLabel}>Detected Date (verify & edit if needed):</Text>
              <TextInput
                style={styles.detectedDateInput}
                value={detectedDate}
                onChangeText={setDetectedDate}
                placeholder="YYYY-MM-DD (e.g., 2025-12-24)"
                keyboardType="numbers-and-punctuation"
              />
            </View>

            <Text style={styles.confirmationHint}>
              Please verify the date is correct before confirming
            </Text>

            <View style={styles.confirmationActions}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmDetectedDate}
              >
                <Text style={styles.confirmButtonText}>✓ Confirm Date</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.retryButton}
                onPress={rejectDetectedDate}
              >
                <Text style={styles.retryButtonText}>✗ Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  fetchingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    margin: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  fetchingText: {
    marginTop: 12,
    fontSize: 18,
    color: '#2563eb',
    fontWeight: '600',
  },
  fetchingSubtext: {
    marginTop: 6,
    fontSize: 14,
    color: '#6b7280',
  },
  skipButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6b7280',
  },
  skipButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  dataSourceBadge: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 14,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataSourceAuto: {
    backgroundColor: '#dcfce7',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  dataSourceManual: {
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  dataSourceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  refreshButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  refreshButtonText: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '600',
  },
  autoFilledBadge: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '500',
  },
  inputAutoFilled: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
    borderWidth: 2,
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
    gap: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: -12,
  },
  helperText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  inputDisabled: {
    backgroundColor: '#e5e7eb',
    color: '#6b7280',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  dateInputContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dateInput: {
    flex: 1,
  },
  scanButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scannerHeader: {
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  scannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  scannerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  scannerGuide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  guideText: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
    borderRadius: 12,
  },
  scannerActions: {
    padding: 20,
    gap: 12,
  },
  captureButton: {
    backgroundColor: '#2563eb',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  captureButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#6b7280',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  processingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContent: {
    backgroundColor: '#ffffff',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 200,
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  processingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  confirmationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmationContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmationSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  capturedImageContainer: {
    marginBottom: 20,
  },
  imageLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  capturedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  detectedDateBox: {
    backgroundColor: '#f0f9ff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  detectedDateLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  detectedDateInput: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
    borderWidth: 2,
    borderColor: '#2563eb',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#ffffff',
    textAlign: 'center',
  },
  confirmationHint: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  confirmationActions: {
    gap: 12,
  },
  confirmButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
