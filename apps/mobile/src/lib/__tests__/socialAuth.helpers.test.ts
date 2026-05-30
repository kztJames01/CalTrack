import {
  extractGoogleIdToken,
  formatAppleFullName,
  mapGoogleSignInError,
} from '../socialAuth.helpers';

describe('socialAuth.helpers', () => {
  describe('formatAppleFullName', () => {
    it('joins given and family name', () => {
      expect(formatAppleFullName({ givenName: 'Jane', familyName: 'Doe' })).toBe('Jane Doe');
    });

    it('returns undefined when empty', () => {
      expect(formatAppleFullName({ givenName: null, familyName: null })).toBeUndefined();
      expect(formatAppleFullName(null)).toBeUndefined();
    });
  });

  describe('extractGoogleIdToken', () => {
    it('returns token when present', () => {
      expect(extractGoogleIdToken({ data: { idToken: 'abc123' } })).toBe('abc123');
    });

    it('throws when token missing', () => {
      expect(() => extractGoogleIdToken({ data: {} })).toThrow('Google sign-in did not return a token');
    });
  });

  describe('mapGoogleSignInError', () => {
    const codes = { SIGN_IN_CANCELLED: 'CANCEL', IN_PROGRESS: 'BUSY' };

    it('maps cancelled', () => {
      expect(() => mapGoogleSignInError({ code: 'CANCEL' }, codes)).toThrow('cancelled');
    });

    it('maps in progress', () => {
      expect(() => mapGoogleSignInError({ code: 'BUSY' }, codes)).toThrow('already in progress');
    });

    it('rethrows unknown', () => {
      const err = new Error('boom');
      expect(() => mapGoogleSignInError(err, codes)).toThrow('boom');
    });
  });
});
