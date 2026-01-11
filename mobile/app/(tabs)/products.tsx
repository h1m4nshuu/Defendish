import { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, BackHandler, Modal, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { productService, ProductFilters } from '../../services/product.service';
import { profileService } from '../../services/profile.service';
import { userService } from '../../services/user.service';
import { authService } from '../../services/auth.service';
import FilterModal, { FilterOptions } from '../../components/FilterModal';
import SortModal, { SortOption, SORT_OPTIONS as MODAL_SORT_OPTIONS } from '../../components/SortModal';

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

export default function ProductsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [userAllergens, setUserAllergens] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    allergens: [],
    onlyWithUserAllergens: false,
    onlyExpiringSoon: false,
  });
  const [sortOption, setSortOption] = useState<SortOption>(MODAL_SORT_OPTIONS[2]); // Newest First
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadData();

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (router.canGoBack()) {
        return false;
      }
      
      Alert.alert(
        'Exit App',
        'Do you want to exit the app?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => null },
          {
            text: 'Exit',
            style: 'destructive',
            onPress: () => BackHandler.exitApp(),
          },
        ]
      );
      return true;
    });

    return () => backHandler.remove();
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (!currentProfile) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setSearching(true);
    searchTimeoutRef.current = setTimeout(() => {
      loadProducts(currentProfile.id);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, filters, sortOption]);

  const loadData = async () => {
    try {
      const profile = await profileService.getCurrentProfile();
      if (!profile) {
        router.replace('/profile/select');
        return;
      }
      setCurrentProfile(profile);
      
      // Load user allergens
      try {
        const userProfileResponse = await userService.getUserProfile();
        setUserAllergens(userProfileResponse.data.allergens || []);
      } catch (error) {
        console.error('Failed to load user allergens:', error);
      }
      
      await loadProducts(profile.id);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (profileId: string) => {
    try {
      const productFilters: ProductFilters = {
        sortBy: sortOption.value,
        sortOrder: sortOption.order,
      };

      if (searchQuery.trim()) {
        productFilters.search = searchQuery.trim();
      }

      if (filters.allergens.length > 0) {
        productFilters.allergens = filters.allergens;
      }

      const response = await productService.getProducts(profileId, productFilters);
      let productsList = response.data;

      // Apply client-side filters for advanced options
      if (filters.onlyWithUserAllergens) {
        productsList = productsList.filter((product: any) => hasAllergenWarning(product));
      }

      if (filters.onlyExpiringSoon) {
        productsList = productsList.filter((product: any) => {
          if (!product.expiryDate) return false;
          const expiryDate = new Date(product.expiryDate);
          const today = new Date();
          const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 7;
        });
      }

      setProducts(productsList);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setSearching(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (currentProfile) {
      await loadProducts(currentProfile.id);
    }
    setRefreshing(false);
  };

  const handleApplyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleApplySort = (newSort: SortOption) => {
    setSortOption(newSort);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.allergens.length > 0) count++;
    if (filters.onlyWithUserAllergens) count++;
    if (filters.onlyExpiringSoon) count++;
    return count;
  };

  const hasActiveSortOption = () => {
    return sortOption.value !== 'createdAt' || sortOption.order !== 'desc';
  };

  const getExpiryColor = (status: string) => {
    switch (status) {
      case 'expired':
        return '#dc2626';
      case 'expiring_today':
      case 'expiring_soon':
        return '#f59e0b';
      default:
        return '#10b981';
    }
  };

  const getSuitabilityIcon = (status: string) => {
    switch (status) {
      case 'safe':
        return '✅';
      case 'unsafe':
        return '❌';
      default:
        return '❓';
    }
  };

  const hasAllergenWarning = (product: any) => {
    if (userAllergens.length === 0) return false;
    if (!product.ingredients || product.ingredients.length === 0) return false;
    
    return product.ingredients.some((ingredient: string) =>
      userAllergens.some((allergen) =>
        ingredient.toLowerCase().includes(allergen.toLowerCase())
      )
    );
  };

  const getExpiryCountdown = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffMs = expiry.getTime() - now.getTime();
    
    if (diffMs < 0) {
      return 'Expired';
    }
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 365) {
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);
      return `${years}y ${months}mo left`;
    } else if (diffDays > 30) {
      const months = Math.floor(diffDays / 30);
      const days = diffDays % 30;
      return `${months}mo ${days}d left`;
    } else if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h left`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m left`;
    } else {
      return `${diffMinutes}m left`;
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  if (!currentProfile) {
    return null;
  }

  const activeFilterCount = getActiveFilterCount();
  const hasFilters = searchQuery.trim() || filters.allergens.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Products</Text>
          <Text style={styles.headerSubtitle}>{currentProfile.name}'s Pantry</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/profile')}
          >
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/profile/select')}>
            <Text style={styles.switchProfile}>Switch</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Filter Bar */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products, ingredients..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterIcon, activeFilterCount > 0 && styles.filterIconActive]}>
            {activeFilterCount > 0 ? '▼' : '▽'}
          </Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowSortModal(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterIcon, hasActiveSortOption() && styles.filterIconActive]}>⇅</Text>
          {hasActiveSortOption() && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>1</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active Filters Display */}
      {(filters.allergens.length > 0 || filters.onlyWithUserAllergens || filters.onlyExpiringSoon) && (
        <ScrollView
          horizontal
          style={styles.activeFiltersContainer}
          showsHorizontalScrollIndicator={false}
        >
          {filters.allergens.map((allergen) => (
            <View key={allergen} style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>{allergen}</Text>
              <TouchableOpacity onPress={() => {
                setFilters({ ...filters, allergens: filters.allergens.filter(a => a !== allergen) });
              }}>
                <Text style={styles.activeFilterRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          {filters.onlyWithUserAllergens && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>⚠️ My Allergens</Text>
              <TouchableOpacity onPress={() => {
                setFilters({ ...filters, onlyWithUserAllergens: false });
              }}>
                <Text style={styles.activeFilterRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {filters.onlyExpiringSoon && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>⏰ Expiring Soon</Text>
              <TouchableOpacity onPress={() => {
                setFilters({ ...filters, onlyExpiringSoon: false });
              }}>
                <Text style={styles.activeFilterRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            style={styles.clearAllFiltersChip}
            onPress={() => setFilters({
              allergens: [],
              onlyWithUserAllergens: false,
              onlyExpiringSoon: false,
            })}
          >
            <Text style={styles.clearAllFiltersText}>Clear All</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Products List */}
      {searching && products.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>
            {getActiveFilterCount() > 0 ? '🔍' : '📦'}
          </Text>
          <Text style={styles.emptyText}>
            {getActiveFilterCount() > 0 ? 'No products found' : 'No products yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {getActiveFilterCount() > 0
              ? 'Try adjusting your search or filters'
              : 'Scan or add products to get started'}
          </Text>
          {getActiveFilterCount() > 0 ? (
            <TouchableOpacity style={styles.addButton} onPress={() => {
              setFilters({
                allergens: [],
                onlyWithUserAllergens: false,
                onlyExpiringSoon: false,
              });
            }}>
              <Text style={styles.addButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.addButtonText}>Add Product</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item: any) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }: any) => (
            <TouchableOpacity
              style={styles.productCard}
              onPress={() =>
                router.push({
                  pathname: '/product/detail',
                  params: { productId: item.id },
                })
              }
            >
              {hasAllergenWarning(item) && (
                <View style={styles.allergenWarningBadge}>
                  <Text style={styles.allergenWarningIcon}>⚠️</Text>
                </View>
              )}
              
              <View style={styles.productHeader}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.suitabilityIcon}>
                  {getSuitabilityIcon(item.suitabilityStatus)}
                </Text>
              </View>

              {item.expiryDate && (
                <View
                  style={[
                    styles.expiryBadge,
                    { backgroundColor: getExpiryColor(item.expiryStatus) },
                  ]}
                >
                  <Text style={styles.expiryText}>
                    ⏰ {getExpiryCountdown(item.expiryDate)}
                  </Text>
                </View>
              )}

              <Text style={styles.ingredientCount}>
                {item.ingredients.length} ingredients
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Add Product Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Add Product</Text>
            <Text style={styles.modalSubtitle}>Choose how to add your product</Text>
            
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setShowAddModal(false);
                router.push('/(tabs)/scan');
              }}
            >
              <Text style={styles.modalOptionIcon}>📷</Text>
              <View style={styles.modalOptionText}>
                <Text style={styles.modalOptionTitle}>Scan Barcode</Text>
                <Text style={styles.modalOptionSubtitle}>
                  Use camera to scan product barcode
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setShowAddModal(false);
                router.push('/product/add');
              }}
            >
              <Text style={styles.modalOptionIcon}>✍️</Text>
              <View style={styles.modalOptionText}>
                <Text style={styles.modalOptionTitle}>Enter Manually</Text>
                <Text style={styles.modalOptionSubtitle}>
                  Type product details yourself
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowAddModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
        currentFilters={filters}
      />

      {/* Sort Modal */}
      <SortModal
        visible={showSortModal}
        onClose={() => setShowSortModal(false)}
        onApply={handleApplySort}
        currentSort={sortOption}
      />
    </View>
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  switchProfile: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  searchFilterContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  clearIcon: {
    fontSize: 20,
    color: '#9ca3af',
    paddingLeft: 8,
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginLeft: 8,
  },
  filterIcon: {
    fontSize: 22,
    color: '#374151',
  },
  filterIconActive: {
    color: '#2563eb',
    fontWeight: 'bold',
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeFiltersContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  activeFilterText: {
    color: '#1e40af',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 6,
  },
  activeFilterRemove: {
    color: '#1e40af',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearAllFiltersChip: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  clearAllFiltersText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  productCard: {
    backgroundColor: '#ffffff',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  allergenWarningBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#dc2626',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  allergenWarningIcon: {
    fontSize: 18,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  suitabilityIcon: {
    fontSize: 24,
  },
  expiryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  expiryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  ingredientCount: {
    color: '#6b7280',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  fabIcon: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '300',
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
    padding: 24,
    width: '90%',
    maxWidth: 400,
    marginHorizontal: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  modalOptionIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  modalOptionText: {
    flex: 1,
  },
  modalOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  modalOptionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalCancelButton: {
    marginTop: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  // Filter Modal Styles
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  filterModalClose: {
    fontSize: 28,
    color: '#6b7280',
    fontWeight: '300',
  },
  filterModalBody: {
    padding: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    marginTop: 8,
  },
  allergenList: {
    marginBottom: 24,
  },
  allergenOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
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
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
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
  sortLabel: {
    fontSize: 16,
    color: '#1f2937',
  },
  filterModalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  applyFiltersButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  applyFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

