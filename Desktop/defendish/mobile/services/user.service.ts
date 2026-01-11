import api from './api';

export interface UserProfile {
  id: string;
  email: string;
  allergens: string[];
  createdAt: string;
  updatedAt: string;
}

export const userService = {
  getUserProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  updateUserProfile: async (allergens: string[]) => {
    const response = await api.put('/users/profile', { allergens });
    return response.data;
  },
};
