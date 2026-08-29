import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function getApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (!__DEV__) {
    if (!envUrl || !envUrl.startsWith('https://')) {
      throw new Error(
        'EXPO_PUBLIC_API_URL must be set to an HTTPS URL for production builds.',
      );
    }
    return envUrl.replace(/\/$/, '');
  }

  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.replace(/\/$/, '');
  }

  const hostUri = Constants.expoConfig?.hostUri;
  const devHost = hostUri?.split(':')[0];
  if (devHost && devHost !== 'localhost' && devHost !== '127.0.0.1') {
    return `http://${devHost}:3000/api`;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  }

  return envUrl || 'http://localhost:3000/api';
}
