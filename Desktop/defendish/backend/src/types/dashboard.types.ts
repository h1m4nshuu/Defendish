/**
 * Dashboard Types
 * TypeScript interfaces for dashboard statistics and data structures
 */

export interface DashboardProduct {
  id: string;
  name: string;
  barcode: string | null;
  ingredients: string[];
  expiryDate: Date | null;
  manufacturingDate: Date | null;
  createdAt: Date;
  hasUserAllergens?: boolean;
  matchingAllergens?: string[];
}

export interface DashboardStats {
  totalProducts: number;
  productsWithUserAllergens: number;
  expiringThisWeek: number;
  expiringProducts: DashboardProduct[];
  recentProducts: DashboardProduct[];
}

export interface DashboardDataParams {
  userId: string;
  profileId?: string;
  userAllergens: string[];
}
