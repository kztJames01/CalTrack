import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/theme';

type Props = {
  onGooglePress: () => void;
  onApplePress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function SocialAuthButtons({ onGooglePress, onApplePress, disabled, loading }: Props) {
  const blocked = disabled || loading;
  const showApple = Platform.OS === 'ios';

  return (
    <View style={styles.wrap}>


      {loading ? (
        <ActivityIndicator color={colors.secondary} style={styles.loader} />
      ) : (
        <>
          <TouchableOpacity
            style={[styles.btn, styles.googleBtn, blocked && styles.btnDisabled]}
            onPress={blocked ? undefined : onGooglePress}
            disabled={blocked}
            activeOpacity={0.85}
          >
            <Ionicons name="logo-google" size={20} color="#4285F4" />
            <Text style={styles.btnText}>Continue with Google</Text>
          </TouchableOpacity>

          {showApple && (
            <TouchableOpacity
              style={[styles.btn, styles.appleBtn, blocked && styles.btnDisabled]}
              onPress={blocked ? undefined : onApplePress}
              disabled={blocked}
              activeOpacity={0.85}
            >
              <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
              <Text style={[styles.btnText, styles.appleText]}>Continue with Apple</Text>
            </TouchableOpacity>
          )}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>
        </>

      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 18,
    gap: 10,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 12,
    color: colors.mutedForeground,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
  },
  googleBtn: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border,
  },
  appleBtn: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  appleText: {
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  loader: {
    marginVertical: 12,
  },
});
