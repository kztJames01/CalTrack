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
  displayName?: string;
  photoUrl?: string;
  provider?: string;
}

function mapUser(raw: any): User {
  return {
    id: raw.id,
    email: raw.email,
    firstName: raw.firstName,
    lastName: raw.lastName,
    displayName: raw.displayName,
    photoUrl: raw.photoUrl,
    provider: raw.provider,
  };
}

async function saveTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync('access_token', accessToken);
  await SecureStore.setItemAsync('refresh_token', refreshToken);
}

function getErrorMessage(error: any, fallback: string) {
  const msg = error?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  if (typeof msg === 'string') return msg;
  return error?.message || fallback;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  appleLogin: () => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
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
          await saveTokens(accessToken, refreshToken);
          set({
            user: mapUser(user),
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const message = getErrorMessage(error, 'Login failed');
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      signup: async (email: string, password: string, firstName?: string, lastName?: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/auth/register', {
            email,
            password,
            firstName,
            lastName,
          });
          const { user, accessToken, refreshToken } = response.data;
          await saveTokens(accessToken, refreshToken);
          set({
            user: mapUser(user),
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const message = getErrorMessage(error, 'Signup failed');
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      googleLogin: async () => {
        set({ isLoading: true, error: null });
        try {
          const { signInWithGoogle } = await import('../lib/socialAuth');
          const idToken = await signInWithGoogle();
          const response = await apiClient.post('/auth/google', { idToken });
          const { user, accessToken, refreshToken } = response.data;
          await saveTokens(accessToken, refreshToken);
          set({
            user: mapUser(user),
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const message = getErrorMessage(error, 'Google sign-in failed');
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      appleLogin: async () => {
        set({ isLoading: true, error: null });
        try {
          const { signInWithApple } = await import('../lib/socialAuth');
          const apple = await signInWithApple();
          const response = await apiClient.post('/auth/apple', apple);
          const { user, accessToken, refreshToken } = response.data;
          await saveTokens(accessToken, refreshToken);
          set({
            user: mapUser(user),
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const message = getErrorMessage(error, 'Apple sign-in failed');
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      logout: async () => {
        try {
          await apiClient.post('/auth/logout').catch(() => {});
          await SecureStore.deleteItemAsync('access_token');
          await SecureStore.deleteItemAsync('refresh_token');
          await AsyncStorage.clear();
          set({ user: null, isAuthenticated: false, error: null });
        } catch (error) {
          console.error('Logout error:', error);
        }
      },

      refreshToken: async () => {
        try {
          const refreshToken = await SecureStore.getItemAsync('refresh_token');
          if (!refreshToken) throw new Error('No refresh token available');

          const response = await apiClient.post('/auth/refresh', { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data;

          await SecureStore.setItemAsync('access_token', accessToken);
          if (newRefreshToken) {
            await SecureStore.setItemAsync('refresh_token', newRefreshToken);
          }
        } catch (error) {
          await get().logout();
          throw error;
        }
      },

      clearError: () => set({ error: null }),

      forgotPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.post('/auth/forgot-password', { email });
          set({ isLoading: false });
        } catch (error: any) {
          const message = getErrorMessage(error, 'Failed to send reset email');
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      resetPassword: async (token: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.post('/auth/reset-password', { token, password });
          set({ isLoading: false });
        } catch (error: any) {
          const message = getErrorMessage(error, 'Failed to reset password');
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      checkAuth: async () => {
        try {
          const token = await SecureStore.getItemAsync('access_token');
          if (token) {
            const response = await apiClient.get('/auth/me');
            set({
              user: mapUser(response.data),
              isAuthenticated: true,
            });
          } else {
            set({ isAuthenticated: false, user: null });
          }
        } catch {
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
    },
  ),
);

if (typeof global !== 'undefined') {
  if (!(global as any).eventEmitter) {
    const { EventEmitter } = require('events');
    (global as any).eventEmitter = new EventEmitter();
  }

  (global as any).eventEmitter.on('auth:logout', () => {
    useAuthStore.getState().logout();
  });
}
