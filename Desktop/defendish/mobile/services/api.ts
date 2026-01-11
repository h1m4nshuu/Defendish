import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use localhost for web, IP address for mobile
const API_URL = Platform.OS === 'web' 
  ? 'http://localhost:5000/api'
  : 'http://10.131.93.32:5000/api';

console.log('API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      // Navigate to login (handled by app)
    }
    return Promise.reject(error);
  }
);

// Helper to get full image URL
export const getImageUrl = (path: string | undefined | null): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('file://')) {
    return path;
  }
  const baseURL = Platform.OS === 'web' 
    ? 'http://localhost:5000'
    : 'http://10.131.93.32:5000';
  return `${baseURL}${path}`;
};

export default api;
