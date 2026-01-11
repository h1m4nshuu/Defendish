import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform, Modal, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { profileService } from '../../services/profile.service';
import ProfileAvatar from '../../components/ProfileAvatar';
import AvatarSelector from '../../components/AvatarSelector';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const RELATIONS = [
  { value: 'self', label: 'Self' },
  { value: 'child', label: 'Child' },
  { value: 'parent', label: 'Parent' },
  { value: 'other', label: 'Other' },
];

// Comprehensive allergen, ingredient, and side effect database
const COMMON_ALLERGENS = [
  // Major food allergens
  'Peanuts', 'Tree nuts', 'Milk', 'Eggs', 'Wheat', 'Soy', 'Fish', 'Shellfish',
  'Sesame', 'Mustard', 'Celery', 'Lupin', 'Sulfites', 'Molluscs',
  
  // Specific nuts and seeds
  'Almonds', 'Cashews', 'Walnuts', 'Pecans', 'Pistachios', 'Hazelnuts', 'Macadamia',
  'Brazil nuts', 'Pine nuts', 'Chestnuts', 'Sunflower seeds', 'Pumpkin seeds',
  'Chia seeds', 'Flax seeds', 'Poppy seeds',
  
  // Dairy products
  'Lactose', 'Casein', 'Whey', 'Butter', 'Cheese', 'Yogurt', 'Cream', 'Ghee',
  'Paneer', 'Buttermilk', 'Condensed milk', 'Milk powder',
  
  // Grains and cereals
  'Gluten', 'Barley', 'Rye', 'Oats', 'Corn', 'Rice', 'Millet', 'Quinoa',
  'Buckwheat', 'Amaranth', 'Sorghum', 'Maize',
  
  // Fruits
  'Strawberries', 'Kiwi', 'Banana', 'Avocado', 'Citrus', 'Mango', 'Peach',
  'Apple', 'Orange', 'Lemon', 'Lime', 'Grapes', 'Pineapple', 'Papaya',
  'Watermelon', 'Melon', 'Cherries', 'Plum', 'Apricot', 'Fig', 'Dates',
  'Pomegranate', 'Guava', 'Lychee', 'Dragon fruit',
  
  // Vegetables
  'Tomatoes', 'Carrots', 'Onions', 'Garlic', 'Peppers', 'Potatoes', 'Sweet potato',
  'Spinach', 'Broccoli', 'Cauliflower', 'Cabbage', 'Lettuce', 'Cucumber',
  'Eggplant', 'Zucchini', 'Pumpkin', 'Beetroot', 'Radish', 'Turnip',
  'Beans', 'Peas', 'Chickpeas', 'Lentils',
  
  // Spices and herbs
  'Cinnamon', 'Cumin', 'Turmeric', 'Coriander', 'Cardamom', 'Cloves', 'Nutmeg',
  'Black pepper', 'Chili', 'Paprika', 'Saffron', 'Bay leaves', 'Oregano',
  'Basil', 'Thyme', 'Rosemary', 'Mint', 'Parsley', 'Dill', 'Fennel',
  'Star anise', 'Ginger', 'Galangal',
  
  // Indian specific ingredients
  'Asafoetida', 'Fenugreek', 'Curry leaves', 'Tamarind', 'Jaggery', 'Hing',
  'Methi', 'Ajwain', 'Kalonji', 'Mustard seeds', 'Kokum', 'Amchur',
  'Kasuri methi', 'Panch phoron',
  
  // Meat and seafood
  'Beef', 'Pork', 'Chicken', 'Lamb', 'Mutton', 'Turkey', 'Duck', 'Goat',
  'Shrimp', 'Crab', 'Lobster', 'Prawns', 'Oysters', 'Clams', 'Mussels',
  'Squid', 'Octopus', 'Salmon', 'Tuna', 'Cod', 'Sardines', 'Anchovies',
  
  // Food additives and preservatives
  'MSG', 'Monosodium glutamate', 'Artificial colors', 'Preservatives',
  'Benzoates', 'Nitrates', 'Nitrites', 'BHA', 'BHT', 'TBHQ',
  'Tartrazine', 'E numbers', 'Food dyes', 'Carrageenan', 'Xanthan gum',
  'Guar gum', 'Lecithin', 'Sodium benzoate', 'Potassium sorbate',
  
  // Sweeteners
  'Sugar', 'Honey', 'Maple syrup', 'Agave', 'Stevia', 'Aspartame', 'Sucralose',
  'Saccharin', 'Sorbitol', 'Xylitol', 'Erythritol', 'High fructose corn syrup',
  
  // Common medications
  'Penicillin', 'Aspirin', 'Ibuprofen', 'Paracetamol', 'Acetaminophen',
  'Amoxicillin', 'Ciprofloxacin', 'Metformin', 'Sulfa drugs', 'Sulfamethoxazole',
  'Codeine', 'Morphine', 'Insulin', 'Statins', 'Beta blockers', 'ACE inhibitors',
  'Diuretics', 'Antihistamines', 'Naproxen', 'Diclofenac', 'Tetracycline',
  'Erythromycin', 'Cephalosporins', 'Quinolones',
  
  // Other allergens
  'Latex', 'Pollen', 'Dust mites', 'Pet dander', 'Mold', 'Yeast', 'Gelatin',
  'Cocoa', 'Coconut', 'Vanilla', 'Coffee', 'Tea', 'Alcohol', 'Wine', 'Beer',
  
  // Oils and fats
  'Olive oil', 'Coconut oil', 'Peanut oil', 'Sesame oil', 'Sunflower oil',
  'Canola oil', 'Palm oil', 'Soybean oil', 'Mustard oil',
  
  // Beverages
  'Caffeine', 'Chocolate', 'Cocoa', 'Green tea', 'Black tea', 'Herbal tea',
  
  // Miscellaneous
  'Propolis', 'Royal jelly', 'Bee pollen', 'Seaweed', 'Algae', 'Spirulina',
  'Chlorella', 'Soy sauce', 'Vinegar', 'Balsamic vinegar', 'Apple cider vinegar',
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function CreateProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [allergyInput, setAllergyInput] = useState('');
  const [allergySuggestions, setAllergySuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(2000);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    bloodGroup: '',
    height: '',
    weight: '',
    relation: 'self',
    allergies: [] as string[],
    photoUrl: '',
  });

  const handleAllergyInputChange = (text: string) => {
    setAllergyInput(text);
    
    if (text.trim().length > 0) {
      const searchTerm = text.toLowerCase();
      const matches = COMMON_ALLERGENS.filter(allergen => 
        allergen.toLowerCase().includes(searchTerm) &&
        !formData.allergies.includes(allergen)
      ).slice(0, 8); // Limit to 8 suggestions
      
      setAllergySuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setAllergySuggestions([]);
      setShowSuggestions(false);
    }
  };

  const addAllergy = (allergen?: string) => {
    const allergyToAdd = allergen || allergyInput.trim();
    if (allergyToAdd && !formData.allergies.includes(allergyToAdd)) {
      setFormData({
        ...formData,
        allergies: [...formData.allergies, allergyToAdd],
      });
      setAllergyInput('');
      setShowSuggestions(false);
      setAllergySuggestions([]);
    }
  };

  const removeAllergy = (index: number) => {
    setFormData({
      ...formData,
      allergies: formData.allergies.filter((_, i) => i !== index),
    });
  };

  const handleDateConfirm = () => {
    const date = new Date(selectedYear, selectedMonth, selectedDay);
    const formattedDate = date.toISOString().split('T')[0];
    setFormData({ ...formData, dateOfBirth: formattedDate });
    setShowDatePicker(false);
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to select a photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        allowsMultipleSelection: false,
        aspect: [1, 1],
        quality: 0.8,
        exif: false,
        presentationStyle: Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen',
      });

      if (!result.canceled && result.assets[0]) {
        setFormData({ ...formData, photoUrl: result.assets[0].uri });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.relation) {
      Alert.alert('Error', 'Please fill in name and relation');
      return;
    }

    try {
      setLoading(true);
      
      // Upload photo if it's a local file
      let photoUrl = formData.photoUrl;
      if (photoUrl && photoUrl.startsWith('file://')) {
        const uploadResponse = await profileService.uploadProfilePhoto(photoUrl);
        photoUrl = uploadResponse.data.photoUrl;
      }

      await profileService.createProfile({
        ...formData,
        photoUrl,
        height: formData.height ? parseFloat(formData.height) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
      });

      Alert.alert('Success', 'Profile created successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.innerContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Profile</Text>
        </View>

        <View style={styles.form}>
        {/* Avatar Selection - WhatsApp Style */}
        <View style={styles.avatarPreviewSection}>
          <TouchableOpacity 
            style={styles.avatarPreviewContainer}
            onPress={() => setShowPhotoOptions(true)}
            disabled={loading}
          >
            <ProfileAvatar 
              name={formData.name || 'User'}
              photoUrl={formData.photoUrl}
              size={120}
            />
            <View style={styles.avatarOverlay}>
              <Text style={styles.avatarOverlayText}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to change profile photo</Text>
        </View>

        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Full name"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          editable={!loading}
        />

        <Text style={styles.label}>Relation *</Text>
        <View style={styles.relationGrid}>
          {RELATIONS.map((rel) => (
            <TouchableOpacity
              key={rel.value}
              style={[
                styles.relationButton,
                formData.relation === rel.value && styles.relationButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, relation: rel.value as any })}
              disabled={loading}
            >
              <Text
                style={[
                  styles.relationButtonText,
                  formData.relation === rel.value && styles.relationButtonTextActive,
                ]}
              >
                {rel.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Date of Birth</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
          disabled={loading}
        >
          <Text style={styles.datePickerText}>
            {formData.dateOfBirth || 'Select Date of Birth'}
          </Text>
        </TouchableOpacity>

        <Modal visible={showDatePicker} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Date of Birth</Text>
              
              <View style={styles.datePickerRow}>
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerLabel}>Day</Text>
                  <ScrollView style={styles.picker}>
                    {Array.from({ length: getDaysInMonth(selectedMonth, selectedYear) }, (_, i) => i + 1).map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={[styles.pickerItem, selectedDay === day && styles.pickerItemSelected]}
                        onPress={() => setSelectedDay(day)}
                      >
                        <Text style={[styles.pickerItemText, selectedDay === day && styles.pickerItemTextSelected]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerLabel}>Month</Text>
                  <ScrollView style={styles.picker}>
                    {MONTHS.map((month, index) => (
                      <TouchableOpacity
                        key={month}
                        style={[styles.pickerItem, selectedMonth === index && styles.pickerItemSelected]}
                        onPress={() => setSelectedMonth(index)}
                      >
                        <Text style={[styles.pickerItemText, selectedMonth === index && styles.pickerItemTextSelected]}>
                          {month}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerLabel}>Year</Text>
                  <ScrollView style={styles.picker}>
                    {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                      <TouchableOpacity
                        key={year}
                        style={[styles.pickerItem, selectedYear === year && styles.pickerItemSelected]}
                        onPress={() => setSelectedYear(year)}
                      >
                        <Text style={[styles.pickerItemText, selectedYear === year && styles.pickerItemTextSelected]}>
                          {year}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalButtonCancel} onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.modalButtonCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalButtonConfirm} onPress={handleDateConfirm}>
                  <Text style={styles.modalButtonConfirmText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Text style={styles.label}>Blood Group</Text>
        <View style={styles.bloodGroupGrid}>
          {BLOOD_GROUPS.map((group) => (
            <TouchableOpacity
              key={group}
              style={[
                styles.bloodGroupButton,
                formData.bloodGroup === group && styles.bloodGroupButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, bloodGroup: group })}
              disabled={loading}
            >
              <Text
                style={[
                  styles.bloodGroupButtonText,
                  formData.bloodGroup === group && styles.bloodGroupButtonTextActive,
                ]}
              >
                {group}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Height (cm)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 170"
          value={formData.height}
          onChangeText={(text) => setFormData({ ...formData, height: text })}
          keyboardType="numeric"
          editable={!loading}
        />

        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 65"
          value={formData.weight}
          onChangeText={(text) => setFormData({ ...formData, weight: text })}
          keyboardType="numeric"
          editable={!loading}
        />

        <Text style={styles.label}>Allergies & Side Effects</Text>
        <Text style={styles.helperText}>Enter any food allergies, drug reactions, or side effects</Text>
        <View style={styles.allergyInputContainer}>
          <TextInput
            style={[styles.input, styles.allergyInput]}
            placeholder="Start typing (e.g., Peanuts, Penicillin)"
            value={allergyInput}
            onChangeText={handleAllergyInputChange}
            editable={!loading}
            onSubmitEditing={() => addAllergy()}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={styles.addAllergyButton}
            onPress={() => addAllergy()}
            disabled={loading || !allergyInput.trim()}
          >
            <Text style={styles.addAllergyButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {showSuggestions && allergySuggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Suggestions:</Text>
            <ScrollView 
              style={styles.suggestionsList}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
              {allergySuggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => addAllergy(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                  <Text style={styles.suggestionIcon}>+</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {formData.allergies.length > 0 && (
          <View style={styles.allergyList}>
            {formData.allergies.map((allergy, index) => (
              <View key={index} style={styles.allergyBadge}>
                <Text style={styles.allergyText}>{allergy}</Text>
                <TouchableOpacity onPress={() => removeAllergy(index)}>
                  <Text style={styles.allergyRemove}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating...' : 'Create Profile'}
          </Text>
        </TouchableOpacity>
      </View>
      </View>
      </ScrollView>
      
      {/* Photo Options Modal */}
      <Modal
        visible={showPhotoOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPhotoOptions(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPhotoOptions(false)}
        >
          <View style={styles.photoOptionsContainer}>
            <Text style={styles.photoOptionsTitle}>Profile Photo</Text>
            
            <TouchableOpacity
              style={styles.photoOption}
              onPress={() => {
                setShowPhotoOptions(false);
                pickImage();
              }}
            >
              <Text style={styles.photoOptionText}>📷 Upload Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.photoOption}
              onPress={() => {
                setShowPhotoOptions(false);
                setShowAvatarSelector(true);
              }}
            >
              <Text style={styles.photoOptionText}>😊 Choose Avatar</Text>
            </TouchableOpacity>
            
            {formData.photoUrl && (
              <TouchableOpacity
                style={styles.photoOption}
                onPress={() => {
                  setFormData({ ...formData, photoUrl: '' });
                  setShowPhotoOptions(false);
                }}
              >
                <Text style={[styles.photoOptionText, { color: '#ef4444' }]}>🗑️ Remove Photo</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.photoOption, styles.cancelOption]}
              onPress={() => setShowPhotoOptions(false)}
            >
              <Text style={styles.photoOptionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      
      <AvatarSelector
        visible={showAvatarSelector}
        onSelect={(avatarId) => {
          setFormData({ ...formData, photoUrl: avatarId });
          setShowAvatarSelector(false);
        }}
        onClose={() => setShowAvatarSelector(false)}
        selectedAvatar={formData.photoUrl}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    alignItems: 'center',
  },
  innerContainer: {
    width: '100%',
    maxWidth: 700,
  },
  header: {
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
    gap: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: -12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  datePickerText: {
    fontSize: 16,
    color: '#374151',
  },
  relationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationButton: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  relationButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  relationButtonText: {
    fontSize: 16,
    color: '#374151',
  },
  relationButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  avatarPreviewSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  avatarPreviewContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2563eb',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  avatarOverlayText: {
    fontSize: 20,
  },
  avatarHint: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  photoOptionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 8,
    marginHorizontal: 20,
    marginVertical: 'auto',
  },
  photoOptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  photoOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  photoOptionText: {
    fontSize: 16,
    color: '#1f2937',
    textAlign: 'center',
  },
  cancelOption: {
    borderBottomWidth: 0,
  },
  bloodGroupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bloodGroupButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  bloodGroupButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  bloodGroupButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  bloodGroupButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  allergyInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  allergyInput: {
    flex: 1,
  },
  addAllergyButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    justifyContent: 'center',
    borderRadius: 8,
  },
  addAllergyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  allergyList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 0,
  },
  allergyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  allergyText: {
    color: '#1e40af',
    fontSize: 14,
  },
  allergyRemove: {
    color: '#1e40af',
    fontSize: 24,
    fontWeight: '300',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 12,
  },
  suggestionsContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  suggestionsList: {
    maxHeight: 150,
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    marginBottom: 6,
  },
  suggestionText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  suggestionIcon: {
    fontSize: 20,
    color: '#2563eb',
    fontWeight: '600',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  datePickerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  picker: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
  },
  pickerItem: {
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pickerItemSelected: {
    backgroundColor: '#eff6ff',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#374151',
  },
  pickerItemTextSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButtonCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  modalButtonConfirm: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  modalButtonConfirmText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
});
