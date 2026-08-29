import { NativeModules, Platform } from 'react-native';
import {
  extractGoogleIdToken,
  formatAppleFullName,
  GOOGLE_REBUILD_MSG,
  mapGoogleSignInError,
} from './socialAuth.helpers';

export {
  formatAppleFullName,
  extractGoogleIdToken,
  GOOGLE_REBUILD_MSG,
} from './socialAuth.helpers';

let googleConfigured = false;

export function isGoogleSignInAvailable(): boolean {
  return !!NativeModules.RNGoogleSignin;
}

export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    const AppleAuthentication = await import('expo-apple-authentication');
    return AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

async function loadGoogleModule() {
  if (!isGoogleSignInAvailable()) {
    throw new Error(GOOGLE_REBUILD_MSG);
  }
  return import('@react-native-google-signin/google-signin');
}

export async function configureGoogleSignIn() {
  if (googleConfigured) return;

  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!iosClientId && !webClientId) return;

  const { GoogleSignin } = await loadGoogleModule();
  GoogleSignin.configure({
    iosClientId,
    webClientId,
    offlineAccess: false,
  });
  googleConfigured = true;
}

export async function signInWithGoogle(): Promise<string> {
  await configureGoogleSignIn();
  const { GoogleSignin, statusCodes } = await loadGoogleModule();

  try {
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }
    const res = await GoogleSignin.signIn();
    return extractGoogleIdToken(res);
  } catch (err: any) {
    mapGoogleSignInError(err, statusCodes);
    return '';
  }
}

export type AppleSignInResult = {
  identityToken: string;
  email?: string;
  fullName?: string;
};

export async function signInWithApple(): Promise<AppleSignInResult> {
  const available = await isAppleSignInAvailable();
  if (!available) {
    throw new Error('Apple Sign-In is not available on this device');
  }

  const AppleAuthentication = await import('expo-apple-authentication');
  const cred = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!cred.identityToken) {
    throw new Error('Apple sign-in did not return a token');
  }

  return {
    identityToken: cred.identityToken,
    email: cred.email ?? undefined,
    fullName: formatAppleFullName(cred.fullName),
  };
}
