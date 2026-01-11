import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ProfileData {
  name: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  height?: number;
  weight?: number;
  relation: 'self' | 'child' | 'parent' | 'other';
  allergies?: string[];
  photoUrl?: string;
}

export const profileService = {
  uploadProfilePhoto: async (uri: string) => {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('photo', {
      uri,
      name: filename,
      type,
    } as any);

    const response = await api.post('/profiles/upload-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  createProfile: async (data: ProfileData) => {
    const response = await api.post('/profiles', data);
    return response.data;
  },

  getProfiles: async () => {
    const response = await api.get('/profiles');
    return response.data;
  },

  getProfile: async (profileId: string) => {
    const response = await api.get(`/profiles/${profileId}`);
    return response.data;
  },

  updateProfile: async (profileId: string, data: Partial<ProfileData>) => {
    const response = await api.put(`/profiles/${profileId}`, data);
    return response.data;
  },

  deleteProfile: async (profileId: string) => {
    const response = await api.delete(`/profiles/${profileId}`);
    return response.data;
  },

  verifyPasswordForSwitch: async (password: string) => {
    const response = await api.post('/profiles/verify-switch', { password });
    return response.data;
  },

  setCurrentProfile: async (profile: any) => {
    await AsyncStorage.setItem('currentProfile', JSON.stringify(profile));
  },

  getCurrentProfile: async () => {
    const profile = await AsyncStorage.getItem('currentProfile');
    return profile ? JSON.parse(profile) : null;
  },

  clearCurrentProfile: async () => {
    await AsyncStorage.removeItem('currentProfile');
  },
};
