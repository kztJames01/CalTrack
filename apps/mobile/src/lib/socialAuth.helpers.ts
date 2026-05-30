export type AppleNameParts = {
  givenName?: string | null;
  familyName?: string | null;
};

export function formatAppleFullName(fullName?: AppleNameParts | null): string | undefined {
  if (!fullName) return undefined;
  const parts = [fullName.givenName, fullName.familyName].filter(Boolean);
  const name = parts.join(' ').trim();
  return name || undefined;
}

export function extractGoogleIdToken(res: { data?: { idToken?: string | null } | null }): string {
  const idToken = res.data?.idToken;
  if (!idToken) {
    throw new Error('Google sign-in did not return a token');
  }
  return idToken;
}

export function mapGoogleSignInError(err: any, statusCodes: { SIGN_IN_CANCELLED: string; IN_PROGRESS: string }) {
  if (err?.code === statusCodes.SIGN_IN_CANCELLED) {
    throw new Error('Google sign-in was cancelled');
  }
  if (err?.code === statusCodes.IN_PROGRESS) {
    throw new Error('Google sign-in already in progress');
  }
  throw err;
}

export const GOOGLE_REBUILD_MSG =
  'Google Sign-In is not linked in this build. Run: cd apps/mobile && npx expo run:ios';
