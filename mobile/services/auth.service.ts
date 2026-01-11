import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SignupData {
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface VerifyOTPData {
  email: string;
  otp: string;
}

export const authService = {
  signup: async (data: SignupData) => {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },

  verifyOTP: async (data: VerifyOTPData) => {
    const response = await api.post('/auth/verify-otp', data);
    if (response.data.success) {
      await AsyncStorage.setItem('authToken', response.data.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  login: async (data: LoginData) => {
    const response = await api.post('/auth/login', data);
    if (response.data.success) {
      await AsyncStorage.setItem('authToken', response.data.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  resendOTP: async (email: string) => {
    const response = await api.post('/auth/resend-otp', { email });
    return response.data;
  },

  logout: async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userData');
    await AsyncStorage.removeItem('currentProfile');
  },

  getCurrentUser: async () => {
    const userData = await AsyncStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  },

  isAuthenticated: async () => {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  },
};
