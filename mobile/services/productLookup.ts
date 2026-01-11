import api from './api';

/**
 * Product lookup result from backend
 */
export interface ProductLookupData {
  productName: string | null;
  ingredients: string | null;
  barcode: string;
  brand: string | null;
  imageUrl?: string | null;
  lastModified?: string | null;
}

export interface ProductLookupResponse {
  success: boolean;
  found: boolean;
  data?: ProductLookupData;
  barcode?: string;
  message?: string;
}

/**
 * Lookup product information by barcode using backend API
 * @param barcode - Product barcode to lookup
 * @returns Promise with lookup result
 */
export async function lookupProductByBarcode(
  barcode: string
): Promise<ProductLookupResponse> {
  try {
    if (!barcode || barcode.trim().length === 0) {
      throw new Error('Barcode is required');
    }

    console.log(`🔍 Looking up barcode via backend: ${barcode}`);

    const response = await api.post<ProductLookupResponse>('/products/lookup', {
      barcode: barcode.trim(),
    });

    return response.data;
  } catch (error: any) {
    console.error('❌ Error looking up barcode:', error);
    
    // Handle network errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return {
        success: false,
        found: false,
        message: 'Lookup timed out. Please check your connection and try again.',
      };
    }

    // Handle API errors
    if (error.response?.data) {
      return {
        success: false,
        found: false,
        message: error.response.data.message || 'Failed to lookup product',
      };
    }

    // Generic error
    return {
      success: false,
      found: false,
      message: 'Network error. Please check your connection and try again.',
    };
  }
}

/**
 * Product lookup service object (for consistency with other services)
 */
export const productLookupService = {
  lookupByBarcode: lookupProductByBarcode,
};

export default productLookupService;
