import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthBrandHeader } from '../../components/AuthBrandHeader';
import {
  AUTH_GRADIENT,
  AUTH_H_PAD,
  authScreenStyles,
} from '../../styles/authScreenStyles';
import { colors } from '../../styles/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={authScreenStyles.screen}>
      <LinearGradient
        colors={[...AUTH_GRADIENT]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={authScreenStyles.gradient}
      >
        <View style={styles.glowLarge} />
        <View style={styles.glowSmall} />

        <View style={[styles.topSection, { paddingTop: insets.top + 20 }]}>
          <AuthBrandHeader />

          <View style={styles.heroCopyContainer}>
            <Text style={styles.heroTitle}>Your Daily Guide to Smarter Eating</Text>
            <Text style={styles.heroDescription}>
              Track calories, macros, and meals in one place. Build healthier habits
              with a clean nutrition dashboard designed for momentum.
            </Text>
          </View>
        </View>

        <View style={[authScreenStyles.bottomCard, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={() => router.push('/auth/signup' as Href)}
            activeOpacity={0.85}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
            <Text style={styles.getStartedArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/auth/login' as Href)}
            style={styles.loginButton}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>Already have an account? Log In</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  glowLarge: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#D9A36A33',
    top: -60,
    right: -100,
  },
  glowSmall: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FFFFFF1A',
    bottom: 120,
    left: -70,
  },
  topSection: {
    flex: 1,
    paddingHorizontal: AUTH_H_PAD,
  },
  heroCopyContainer: {
    marginTop: 36,
  },
  heroTitle: {
    fontSize: 44,
    lineHeight: 50,
    fontWeight: '700',
    color: '#F7F1E7',
    letterSpacing: -1,
  },
  heroDescription: {
    marginTop: 18,
    fontSize: 16,
    lineHeight: 24,
    color: '#D8E0DE',
    maxWidth: 340,
  },
  getStartedButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#243036',
  },
  getStartedArrow: {
    fontSize: 22,
    color: '#243036',
    fontWeight: '600',
    marginLeft: 8,
  },
  loginButton: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loginButtonText: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: '600',
  },
});
