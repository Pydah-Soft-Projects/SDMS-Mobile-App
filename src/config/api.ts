import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, STATIC_BASE_URL } from './env';

export const STORAGE_KEYS = {
  TOKEN: 'pydah_auth_token',
  USER: 'pydah_auth_user',
  USER_TYPE: 'pydah_auth_user_type',
};

// Create configured Axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Broadcast listener callback for session expiry
type SessionExpiryListener = () => void;
let onSessionExpiry: SessionExpiryListener | null = null;

export const setSessionExpiryHandler = (handler: SessionExpiryListener) => {
  onSessionExpiry = handler;
};

// Request Interceptor: Attach JWT bearer token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Failed to retrieve auth token for request', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle errors and 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const url = error.config?.url || '';

    // Ignore 401 for explicit login attempts
    const isLoginEndpoint =
      url.includes('/login') ||
      url.includes('/unified-login') ||
      url.includes('/otp/verify') ||
      url.includes('/sso-session');

    if (status === 401 && !isLoginEndpoint) {
      console.warn('Session expired or unauthorized - clearing credentials');
      try {
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.TOKEN,
          STORAGE_KEYS.USER,
          STORAGE_KEYS.USER_TYPE,
        ]);
        if (onSessionExpiry) {
          onSessionExpiry();
        }
      } catch (e) {
        console.error('Error clearing session storage', e);
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to resolve static file/upload URLs (avatars, receipts, certificates)
export const getStaticFileUrl = (path?: string | null): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('data:')) return path;

  // Clean relative slashes
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  if (cleanPath.startsWith('uploads/')) {
    return `${STATIC_BASE_URL}/${cleanPath}`;
  }
  return `${STATIC_BASE_URL}/uploads/${cleanPath}`;
};

export default api;

