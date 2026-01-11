import api from './api';

/**
 * Dashboard Product Interface
 */
export interface DashboardProduct {
  id: string;
  name: string;
  barcode: string | null;
  ingredients: string[];
  expiryDate: string | null;
  manufacturingDate: string | null;
  createdAt: string;
  hasUserAllergens?: boolean;
  matchingAllergens?: string[];
}

/**
 * Dashboard Statistics Interface
 */
export interface DashboardStats {
  totalProducts: number;
  productsWithUserAllergens: number;
  expiringThisWeek: number;
  expiringProducts: DashboardProduct[];
  recentProducts: DashboardProduct[];
}

/**
 * Dashboard API Response
 */
export interface DashboardResponse {
  success: boolean;
  data: DashboardStats;
}

/**
 * Get dashboard statistics and data
 * @returns Promise with dashboard stats
 */
export async function getDashboardData(): Promise<DashboardStats> {
  try {
    console.log('📊 Fetching dashboard data...');
    
    const response = await api.get<DashboardResponse>('/products/dashboard');
    
    console.log('✅ Dashboard data loaded successfully');
    console.log(`   - Total Products: ${response.data.data.totalProducts}`);
    console.log(`   - Products with Allergens: ${response.data.data.productsWithUserAllergens}`);
    console.log(`   - Expiring This Week: ${response.data.data.expiringThisWeek}`);
    
    return response.data.data;
  } catch (error: any) {
    console.error('❌ Error fetching dashboard data:', error);
    
    // Handle different error scenarios
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please log in again.');
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new Error('Request timed out. Please check your connection and try again.');
    } else if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error('Failed to load dashboard data. Please try again.');
    }
  }
}

/**
 * Dashboard Service Object
 */
export const dashboardService = {
  getDashboardData,
};

export default dashboardService;
