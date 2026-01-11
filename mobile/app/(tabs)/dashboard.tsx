import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { dashboardService, DashboardStats, DashboardProduct } from '../../services/dashboard.service';
import { authService } from '../../services/auth.service';
import {
  formatGreeting,
  getCurrentDateFormatted,
  formatExpiryCountdown,
  formatRelativeDate,
  getExpiryUrgencyColor,
} from '../../utils/dateHelpers';

export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUserName(currentUser.name || 'there');
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getDashboardData();
      setDashboardData(data);
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleRetry = () => {
    loadDashboardData();
  };

  const navigateToProductDetail = (productId: string) => {
    router.push(`/product/detail?productId=${productId}` as any);
  };

  const navigateToProfile = () => {
    router.push('/profile' as any);
  };

  const navigateToScan = () => {
    router.push('/(tabs)/scan' as any);
  };

  if (loading && !dashboardData) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error && !dashboardData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stats = dashboardData!;

  if (stats.totalProducts === 0) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{formatGreeting()}, {userName}! 👋</Text>
            <Text style={styles.date}>{getCurrentDateFormatted()}</Text>
          </View>
          <TouchableOpacity onPress={navigateToProfile} style={styles.profileButton}>
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateIcon}>📦</Text>
          <Text style={styles.emptyStateTitle}>Welcome to Defendish!</Text>
          <Text style={styles.emptyStateMessage}>
            Start protecting your family by scanning your first product
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={navigateToScan}>
            <Text style={styles.primaryButtonText}>📷 Scan First Product</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{formatGreeting()}, {userName}! 👋</Text>
          <Text style={styles.date}>{getCurrentDateFormatted()}</Text>
        </View>
        <TouchableOpacity onPress={navigateToProfile} style={styles.profileButton}>
          <Text style={styles.profileIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.statCardPrimary]}>
          <Text style={styles.statIcon}>📦</Text>
          <Text style={styles.statNumber}>{stats.totalProducts}</Text>
          <Text style={styles.statLabel}>Total Products</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.statCard,
            stats.productsWithUserAllergens > 0 ? styles.statCardWarning : styles.statCardGray,
          ]}
        >
          <Text style={styles.statIcon}>⚠️</Text>
          <Text style={styles.statNumber}>{stats.productsWithUserAllergens}</Text>
          <Text style={styles.statLabel}>With Allergens</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statCard,
            stats.expiringThisWeek > 0 ? styles.statCardDanger : styles.statCardGray,
          ]}
        >
          <Text style={styles.statIcon}>⏰</Text>
          <Text style={styles.statNumber}>{stats.expiringThisWeek}</Text>
          <Text style={styles.statLabel}>Expiring Soon</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Expiring Soon</Text>
        </View>

        {stats.expiringProducts.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionIcon}>✅</Text>
            <Text style={styles.emptySectionText}>No products expiring soon!</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {stats.expiringProducts.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => navigateToProductDetail(product.id)}
              >
                <View
                  style={[
                    styles.productCardHeader,
                    { backgroundColor: getExpiryUrgencyColor(product.expiryDate) },
                  ]}
                >
                  <Text style={styles.productCardIcon}>⏰</Text>
                  {product.hasUserAllergens && (
                    <View style={styles.allergenBadge}>
                      <Text style={styles.allergenBadgeText}>⚠️</Text>
                    </View>
                  )}
                </View>
                <View style={styles.productCardBody}>
                  <Text style={styles.productCardName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={styles.productCardExpiry}>
                    {formatExpiryCountdown(product.expiryDate)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recently Added</Text>
        </View>

        {stats.recentProducts.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionIcon}>📦</Text>
            <Text style={styles.emptySectionText}>No products yet</Text>
          </View>
        ) : (
          <View style={styles.recentProductsList}>
            {stats.recentProducts.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.recentProductCard}
                onPress={() => navigateToProductDetail(product.id)}
              >
                <View style={styles.recentProductLeft}>
                  <Text style={styles.recentProductIcon}>📦</Text>
                </View>
                <View style={styles.recentProductMiddle}>
                  <Text style={styles.recentProductName} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={styles.recentProductDate}>
                    Added {formatRelativeDate(product.createdAt)}
                  </Text>
                </View>
                <View style={styles.recentProductRight}>
                  {product.hasUserAllergens && (
                    <Text style={styles.allergenBadgeTextSmall}>⚠️</Text>
                  )}
                  <Text style={styles.chevron}>›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.primaryButton} onPress={navigateToScan}>
          <Text style={styles.primaryButtonText}>📷 Scan New Product</Text>
        </TouchableOpacity>

        <View style={styles.secondaryActions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(tabs)/products' as any)}
          >
            <Text style={styles.secondaryButtonText}>🔍 Search</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={navigateToProfile}>
            <Text style={styles.secondaryButtonText}>👤 Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomSpacer} />
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
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconButtonText: {
    fontSize: 20,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#6b7280',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardPrimary: {
    backgroundColor: '#2563eb',
  },
  statCardWarning: {
    backgroundColor: '#f97316',
  },
  statCardDanger: {
    backgroundColor: '#dc2626',
  },
  statCardGray: {
    backgroundColor: '#6b7280',
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  filterIndicator: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  filterIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  emptySection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptySectionIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptySectionText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  clearFiltersButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  clearFiltersButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  productCard: {
    width: 180,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productCardHeader: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  productCardIcon: {
    fontSize: 32,
  },
  allergenBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  allergenBadgeText: {
    fontSize: 14,
  },
  productCardBody: {
    padding: 12,
  },
  productCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
    minHeight: 40,
  },
  productCardExpiry: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  recentProductsList: {
    gap: 12,
  },
  recentProductCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  recentProductLeft: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentProductIcon: {
    fontSize: 24,
  },
  recentProductMiddle: {
    flex: 1,
  },
  recentProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  recentProductDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  recentProductRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  allergenBadgeTextSmall: {
    fontSize: 16,
  },
  chevron: {
    fontSize: 24,
    color: '#9ca3af',
  },
  quickActions: {
    padding: 16,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryButtonText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 400,
  },
  emptyStateIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  bottomSpacer: {
    height: 32,
  },
});
