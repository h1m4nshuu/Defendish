import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl, getApiBaseUrlCandidates, getApiHostUrl } from './apiConfig';

const API_URL = getApiBaseUrl();
const API_URL_CANDIDATES = getApiBaseUrlCandidates();

type RetryableConfig = {
  _baseUrlRetryIndex?: number;
  _baseUrlRetryCandidates?: string[];
};

console.log('API URL:', API_URL);
console.log('API URL candidates:', API_URL_CANDIDATES);

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
  (response) => {
    const responseBaseUrl = response.config.baseURL;
    if (responseBaseUrl && api.defaults.baseURL !== responseBaseUrl) {
      api.defaults.baseURL = responseBaseUrl;
      console.log('Using API URL:', api.defaults.baseURL);
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      // Navigate to login (handled by app)
    }

    if (!error.response && error.config) {
      const config = error.config as typeof error.config & RetryableConfig;
      const currentBaseUrl = config.baseURL || API_URL;

      if (!config._baseUrlRetryCandidates) {
        config._baseUrlRetryCandidates = API_URL_CANDIDATES.filter((candidate) => candidate !== currentBaseUrl);
        config._baseUrlRetryIndex = 0;
      }

      const retryIndex = config._baseUrlRetryIndex ?? 0;
      const nextBaseUrl = config._baseUrlRetryCandidates[retryIndex];

      if (nextBaseUrl) {
        config._baseUrlRetryIndex = retryIndex + 1;
        config.baseURL = nextBaseUrl;
        console.log('Retrying request with fallback API URL:', config.baseURL);
        return api.request(config);
      }
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
  const baseURL = getApiHostUrl();
  return `${baseURL}${path}`;
};

export default api;
