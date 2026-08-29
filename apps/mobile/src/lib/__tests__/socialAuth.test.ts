import { NativeModules } from 'react-native';
import {
  GOOGLE_REBUILD_MSG,
  isGoogleSignInAvailable,
  signInWithGoogle,
} from '../socialAuth';

jest.mock('react-native', () => ({
  NativeModules: { RNGoogleSignin: null },
  Platform: { OS: 'ios' },
}));

describe('socialAuth native checks', () => {
  it('isGoogleSignInAvailable is false without native module', () => {
    NativeModules.RNGoogleSignin = undefined as any;
    expect(isGoogleSignInAvailable()).toBe(false);
  });

  it('signInWithGoogle throws rebuild message when native module missing', async () => {
    NativeModules.RNGoogleSignin = undefined as any;
    await expect(signInWithGoogle()).rejects.toThrow(GOOGLE_REBUILD_MSG);
  });

  it('isGoogleSignInAvailable is true when module linked', () => {
    NativeModules.RNGoogleSignin = {} as any;
    expect(isGoogleSignInAvailable()).toBe(true);
  });
});
