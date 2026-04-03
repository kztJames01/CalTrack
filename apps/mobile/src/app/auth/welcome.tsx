import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../styles/theme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Background with gradient */}
      <View style={styles.topSection}>
        <View style={styles.backgroundDecoration}>
          {/* Decorative circles */}
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
          <View style={[styles.circle, styles.circle3]} />
        </View>

        {/* Food calorie labels */}
        <View style={styles.calorieLabels}>
          <View style={[styles.calorieTag, { top: height * 0.12, left: 30 }]}>
            <Text style={styles.calorieTagText}>132 Kcal</Text>
          </View>
          <View style={[styles.calorieTag, { top: height * 0.22, left: 20 }]}>
            <Text style={styles.calorieTagText}>504 Kcal</Text>
          </View>
          <View style={[styles.calorieTag, { top: height * 0.30, right: 40 }]}>
            <Text style={styles.calorieTagText}>320 Kcal</Text>
          </View>
        </View>

        {/* Logo & title */}
        <View style={styles.brandingContainer}>
          <View style={styles.logoRow}>
            <Ionicons name="leaf" size={28} color={colors.secondary} />
            <Text style={styles.brandName}>CalTrack</Text>
          </View>
          <View style={styles.accentBar} />
        </View>

        {/* Hero text */}
        <View style={styles.heroContainer}>
          <Text style={styles.heroText}>
            Your Daily{'\n'}Guide{'\n'}to{' '}
            <View style={styles.smarterBadge}>
              <Ionicons name="flame" size={20} color="#FFFFFF" />
            </View>
            {' '}Smarter{'\n'}Eating.
          </Text>
        </View>
      </View>

      {/* Bottom CTA */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={() => router.push('/auth/signup' as Href)}
          activeOpacity={0.8}
        >
          <View style={styles.getStartedInner}>
            <View style={styles.arrowCircle}>
              <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
            </View>
            <Text style={styles.getStartedText}>Get Started</Text>
            <TouchableOpacity
              style={styles.checkCircle}
              onPress={() => router.push('/auth/login' as Href)}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark" size={20} color={colors.secondary} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/auth/login' as Href)}
          style={styles.existingAccountButton}
          activeOpacity={0.7}
        >
          <Text style={styles.existingAccountText}>
            Already have an account? <Text style={styles.loginLinkText}>Log In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topSection: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  backgroundDecoration: {
    ...StyleSheet.absoluteFillObject,
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: `${colors.primary}18`,
  },
  circle1: {
    width: 300,
    height: 300,
    top: -80,
    right: -100,
  },
  circle2: {
    width: 200,
    height: 200,
    top: 180,
    left: -60,
  },
  circle3: {
    width: 150,
    height: 150,
    bottom: 40,
    right: -30,
  },
  calorieLabels: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  calorieTag: {
    position: 'absolute',
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  calorieTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.foreground,
  },
  brandingContainer: {
    marginBottom: 40,
    zIndex: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.secondary,
  },
  accentBar: {
    width: 48,
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginTop: 12,
  },
  heroContainer: {
    zIndex: 1,
    marginTop: 20,
  },
  heroText: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.foreground,
    lineHeight: 52,
    letterSpacing: -0.5,
  },
  smarterBadge: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSection: {
    padding: 24,
    paddingBottom: 48,
  },
  getStartedButton: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    overflow: 'hidden',
  },
  getStartedInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  arrowCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  getStartedText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.foreground,
  },
  checkCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  existingAccountButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  existingAccountText: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  loginLinkText: {
    color: colors.secondary,
    fontWeight: '600',
  },
});
