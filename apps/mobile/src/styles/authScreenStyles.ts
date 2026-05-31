import { StyleSheet } from 'react-native';
import { colors } from './theme';

export const AUTH_H_PAD = 24;
export const AUTH_FORM_RADIUS = 20;
export const AUTH_FORM_BORDER = '#E7DBC7';
export const AUTH_GRADIENT = ['#0D2A2F', '#134047', '#1B525A'] as const;

export const authScreenStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0D2A2F',
  },
  gradient: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: AUTH_H_PAD,
    zIndex: 10,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF22',
    borderWidth: 1,
    borderColor: '#FFFFFF33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  brandSection: {
    paddingHorizontal: AUTH_H_PAD,
    marginTop: 12,
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F7F2E8',
  },
  brandText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  brandSubtext: {
    fontSize: 12,
    color: '#DCCDB8',
    marginTop: 2,
  },
  formCard: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFCF5',
    borderTopLeftRadius: AUTH_FORM_RADIUS,
    borderTopRightRadius: AUTH_FORM_RADIUS,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: AUTH_FORM_BORDER,
    paddingHorizontal: AUTH_H_PAD,
    paddingTop: 18,
    paddingBottom: 24,
  },
  bottomCard: {
    width: '100%',
    backgroundColor: '#FFFCF5',
    borderTopLeftRadius: AUTH_FORM_RADIUS,
    borderTopRightRadius: AUTH_FORM_RADIUS,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: AUTH_FORM_BORDER,
    paddingHorizontal: AUTH_H_PAD,
    paddingTop: 18,
  },
});

export const authFormStyles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.foreground,
  },
  subtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 6,
    marginBottom: 18,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.foreground,
  },
  inputError: {
    borderColor: colors.destructive,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 12,
    marginTop: 5,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#243036',
    fontSize: 16,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    color: colors.mutedForeground,
    fontSize: 14,
  },
  footerLink: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '700',
  },
});
