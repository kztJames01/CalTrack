import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../styles/theme';

const savorSymbol = require('../../../assets/images/branding/savor-symbol.png');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#0D2A2F', '#134047', '#1B525A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        <View style={styles.glowLarge} />
        <View style={styles.glowSmall} />

        <View style={styles.contentContainer}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Image source={savorSymbol} style={styles.logoImage} resizeMode="contain" />
            </View>
            <View>
              <Text style={styles.brandText}>Savor</Text>
              <Text style={styles.brandSubtext}>AI Calorie Tracker</Text>
            </View>
          </View>

          <View style={styles.heroCopyContainer}>
            <Text style={styles.heroTitle}>Your Daily Guide to Smarter Eating</Text>
            <Text style={styles.heroDescription}>
              Track calories, macros, and meals in one place. Build healthier habits
              with a clean nutrition dashboard designed for momentum.
            </Text>
          </View>

          <View style={styles.ctaContainer}>
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
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D2A2F',
  },
  gradientBackground: {
    flex: 1,
  },
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
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F3E8',
    borderWidth: 1,
    borderColor: '#FFFFFF33',
  },
  logoImage: {
    width: 38,
    height: 38,
  },
  brandText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  brandSubtext: {
    marginTop: 2,
    fontSize: 13,
    color: '#DCCDB8',
    letterSpacing: 0.2,
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
  ctaContainer: {
    gap: 14,
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
  },
  loginButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFFFFF33',
    paddingVertical: 14,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#E8EFED',
    fontSize: 15,
    fontWeight: '600',
  },
});
