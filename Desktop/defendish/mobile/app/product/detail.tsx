import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { productService } from '../../services/product.service';
import { profileService } from '../../services/profile.service';
import { userService } from '../../services/user.service';

export default function ProductDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const [product, setProduct] = useState<any>(null);
  const [userAllergens, setUserAllergens] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadProduct();
    loadUserAllergens();
  }, []);

  const loadUserAllergens = async () => {
    try {
      const response = await userService.getUserProfile();
      setUserAllergens(response.data.allergens || []);
    } catch (error) {
      console.error('Failed to load user allergens:', error);
    }
  };

  const loadProduct = async () => {
    try {
      const response = await productService.getProduct(productId!);
      setProduct(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load product');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSuitability = async (status: 'safe' | 'unsafe') => {
    try {
      setUpdating(true);
      const currentProfile = await profileService.getCurrentProfile();
      
      const response = await productService.updateSuitability(
        productId!,
        currentProfile.id,
        status
      );

      setProduct({ ...product, suitabilityStatus: status, aiRecommendation: response.data.aiRecommendation });

      // Show AI recommendation
      const ai = response.data.aiRecommendation;
      Alert.alert(
        'AI Analysis',
        `${ai.reason}\n\n${ai.explanation}`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update suitability');
    } finally {
      setUpdating(false);
    }
  };

  const getExpiryCountdown = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffMs = expiry.getTime() - now.getTime();
    
    if (diffMs < 0) {
      return { text: 'Expired', color: '#dc2626' };
    }
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    let text = '';
    let color = '#10b981';
    
    if (diffDays > 365) {
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);
      text = `${years} year${years > 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''} left`;
      color = '#10b981';
    } else if (diffDays > 30) {
      const months = Math.floor(diffDays / 30);
      const days = diffDays % 30;
      text = `${months} month${months !== 1 ? 's' : ''} ${days} day${days !== 1 ? 's' : ''} left`;
      color = '#10b981';
    } else if (diffDays > 7) {
      text = `${diffDays} days ${diffHours} hours left`;
      color = '#f59e0b';
    } else if (diffDays > 0) {
      text = `${diffDays} day${diffDays !== 1 ? 's' : ''} ${diffHours} hour${diffHours !== 1 ? 's' : ''} left`;
      color = '#f59e0b';
    } else if (diffHours > 0) {
      text = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} left`;
      color = '#dc2626';
    } else {
      text = `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} left`;
      color = '#dc2626';
    }
    
    return { text, color };
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setUpdating(true);
              await productService.deleteProduct(productId!);
              Alert.alert('Success', 'Product deleted successfully', [
                {
                  text: 'OK',
                  onPress: () => router.back(),
                },
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete product');
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const getMatchingAllergens = () => {
    if (userAllergens.length === 0 || !product.ingredients) return [];
    
    return userAllergens.filter((allergen) =>
      product.ingredients.some((ingredient: string) =>
        ingredient.toLowerCase().includes(allergen.toLowerCase())
      )
    );
  };

  const matchingAllergens = getMatchingAllergens();
  const hasAllergenWarning = matchingAllergens.length > 0;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={() => router.push(`/products/${productId}/edit` as any)}
              disabled={updating}
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>✏️ Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleDelete}
              disabled={updating}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.headerTitle}>{product.name}</Text>
      </View>

      {hasAllergenWarning && (
        <View style={styles.allergenWarningBanner}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>ALLERGEN WARNING!</Text>
            <Text style={styles.warningText}>
              This product contains {matchingAllergens.join(', ')} which you're allergic to!
            </Text>
          </View>
        </View>
      )}

      {product.aiRecommendation && product.aiRecommendation.decision && (
        <View style={[
          styles.aiCard,
          {
            backgroundColor:
              product.aiRecommendation.decision === 'safe'
                ? '#d1fae5'
                : product.aiRecommendation.decision === 'avoid'
                ? '#fee2e2'
                : '#fef3c7',
          },
        ]}>
          <Text style={styles.aiTitle}>AI Recommendation</Text>
          <Text style={styles.aiDecision}>
            {product.aiRecommendation.decision?.toUpperCase() || 'UNKNOWN'}
          </Text>
          <Text style={styles.aiReason}>{product.aiRecommendation.reason || 'No reason provided'}</Text>
          
          {product.aiRecommendation.warnings && product.aiRecommendation.warnings.length > 0 && (
            <View style={styles.warningsContainer}>
              {product.aiRecommendation.warnings.map((warning: string, index: number) => (
                <Text key={index} style={styles.aiWarningText}>
                  {warning}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ingredients</Text>
        <View style={styles.ingredientsList}>
          {product.ingredients && product.ingredients.length > 0 ? (
            product.ingredients.map((ingredient: string, index: number) => (
              <View key={index} style={styles.ingredientBadge}>
                <Text style={styles.ingredientText}>{ingredient}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.infoText}>No ingredients listed</Text>
          )}
        </View>
      </View>

      {product.expiryDate && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expiry Information</Text>
          <View style={styles.countdownContainer}>
            <Text style={[
              styles.countdownText,
              { color: getExpiryCountdown(product.expiryDate).color }
            ]}>
              ⏰ {getExpiryCountdown(product.expiryDate).text}
            </Text>
            <Text style={styles.expiryDateText}>
              Expires: {new Date(product.expiryDate).toLocaleDateString()}
            </Text>
          </View>
        </View>
      )}

      {product.dosage && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dosage / Usage</Text>
          <Text style={styles.infoText}>{product.dosage}</Text>
        </View>
      )}

      {product.storageInstructions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage Instructions</Text>
          <Text style={styles.infoText}>{product.storageInstructions}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Is this product suitable for you?</Text>
        <View style={styles.suitabilityButtons}>
          <TouchableOpacity
            style={[
              styles.suitabilityButton,
              styles.safeButton,
              product.suitabilityStatus === 'safe' && styles.suitabilityButtonActive,
            ]}
            onPress={() => handleSuitability('safe')}
            disabled={updating}
          >
            <Text style={styles.suitabilityIcon}>✅</Text>
            <Text style={styles.suitabilityText}>Safe for Me</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.suitabilityButton,
              styles.unsafeButton,
              product.suitabilityStatus === 'unsafe' && styles.suitabilityButtonActive,
            ]}
            onPress={() => handleSuitability('unsafe')}
            disabled={updating}
          >
            <Text style={styles.suitabilityIcon}>❌</Text>
            <Text style={styles.suitabilityText}>Not Suitable</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  backButton: {
    fontSize: 16,
    color: '#2563eb',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#dbeafe',
  },
  editButtonText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  allergenWarningBanner: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#991b1b',
  },
  warningIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 15,
    color: '#ffffff',
    lineHeight: 20,
  },
  aiCard: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  aiDecision: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  aiReason: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 12,
  },
  warningsContainer: {
    gap: 8,
  },
  aiWarningText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#ffffff',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  ingredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ingredientBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  ingredientText: {
    color: '#1e40af',
    fontSize: 14,
  },
  infoText: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  countdownContainer: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  countdownText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  expiryDateText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  suitabilityButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  suitabilityButton: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  safeButton: {
    backgroundColor: '#f0fdf4',
  },
  unsafeButton: {
    backgroundColor: '#fef2f2',
  },
  suitabilityButtonActive: {
    borderColor: '#2563eb',
    borderWidth: 3,
  },
  suitabilityIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  suitabilityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
});
