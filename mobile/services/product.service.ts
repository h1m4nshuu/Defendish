import api from './api';

export interface ProductData {
  profileId: string;
  name: string;
  barcode?: string;
  rawIngredients: string;
  manufacturingDate?: string;
  expiryDate?: string;
  dosage?: string;
  storageInstructions?: string;
}

export interface ProductFilters {
  search?: string;
  allergens?: string[];
  sortBy?: 'name' | 'createdAt' | 'expiryDate';
  sortOrder?: 'asc' | 'desc';
}

export const productService = {
  createProduct: async (data: ProductData) => {
    const response = await api.post('/products', data);
    return response.data;
  },

  getProducts: async (profileId: string, filters?: ProductFilters) => {
    const params: any = { profileId };
    
    if (filters?.search) {
      params.search = filters.search;
    }
    
    if (filters?.allergens && filters.allergens.length > 0) {
      params.allergens = filters.allergens;
    }
    
    if (filters?.sortBy) {
      params.sortBy = filters.sortBy;
    }
    
    if (filters?.sortOrder) {
      params.sortOrder = filters.sortOrder;
    }

    const response = await api.get('/products', { params });
    return response.data;
  },

  getProduct: async (productId: string) => {
    const response = await api.get(`/products/${productId}`);
    return response.data;
  },

  updateSuitability: async (productId: string, profileId: string, status: 'safe' | 'unsafe') => {
    const response = await api.put(`/products/${productId}/suitability`, {
      profileId,
      status,
    });
    return response.data;
  },

  updateProduct: async (productId: string, data: Partial<ProductData>) => {
    const response = await api.put(`/products/${productId}`, data);
    return response.data;
  },

  deleteProduct: async (productId: string) => {
    const response = await api.delete(`/products/${productId}`);
    return response.data;
  },

  scanBarcode: async (barcode: string, profileId: string) => {
    const response = await api.post('/products/scan-barcode', {
      barcode,
      profileId,
    });
    return response.data;
  },

  scanImage: async (imageUri: string, profileId: string) => {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'product.jpg',
    } as any);
    formData.append('profileId', profileId);

    const response = await api.post('/products/scan-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
