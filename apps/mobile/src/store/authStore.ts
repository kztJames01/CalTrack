import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '../lib/apiClient';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/auth/login', { email, password });
          const { user, accessToken, refreshToken } = response.data;

          // Store tokens securely
          await SecureStore.setItemAsync('access_token', accessToken);
          await SecureStore.setItemAsync('refresh_token', refreshToken);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Login failed',
          });
          throw error;
        }
      },

      signup: async (email: string, password: string, firstName?: string, lastName?: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/auth/signup', {
            email,
            password,
            firstName,
            lastName,
          });
          const { user, accessToken, refreshToken } = response.data;

          // Store tokens securely
          await SecureStore.setItemAsync('access_token', accessToken);
          await SecureStore.setItemAsync('refresh_token', refreshToken);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Signup failed',
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          // Call backend logout endpoint (optional)
          await apiClient.post('/auth/logout').catch(() => {});

          // Clear secure storage
          await SecureStore.deleteItemAsync('access_token');
          await SecureStore.deleteItemAsync('refresh_token');

          // Clear AsyncStorage
          await AsyncStorage.clear();

          set({
            user: null,
            isAuthenticated: false,
            error: null,
          });
        } catch (error) {
          console.error('Logout error:', error);
        }
      },

      refreshToken: async () => {
        try {
          const refreshToken = await SecureStore.getItemAsync('refresh_token');
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await apiClient.post('/auth/refresh', { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data;

          await SecureStore.setItemAsync('access_token', accessToken);
          if (newRefreshToken) {
            await SecureStore.setItemAsync('refresh_token', newRefreshToken);
          }
        } catch (error) {
          // Token refresh failed, logout user
          await get().logout();
          throw error;
        }
      },

      clearError: () => set({ error: null }),

      checkAuth: async () => {
        try {
          const token = await SecureStore.getItemAsync('access_token');
          if (token) {
            // Verify token with backend
            const response = await apiClient.get('/auth/me');
            set({
              user: response.data,
              isAuthenticated: true,
            });
          } else {
            set({ isAuthenticated: false, user: null });
          }
        } catch (error) {
          set({ isAuthenticated: false, user: null });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Setup global event listener for auth logout
if (typeof global !== 'undefined') {
  if (!(global as any).eventEmitter) {
    const { EventEmitter } = require('events');
    (global as any).eventEmitter = new EventEmitter();
  }
  
  (global as any).eventEmitter.on('auth:logout', () => {
    useAuthStore.getState().logout();
  });
}
