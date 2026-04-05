import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Image,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../styles/theme';

const savorSymbol = require('../../../assets/images/branding/savor-symbol.png');

const signupSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupScreen() {
  const router = useRouter();
  const { signup, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      clearError();
      await signup(data.email, data.password, data.firstName, data.lastName);
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Signup Failed', error || 'An error occurred during signup');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#0D2A2F', '#134047', '#1B525A']} style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.brandRow}>
              <Image source={savorSymbol} style={styles.logoImage} resizeMode="contain" />
              <View>
                <Text style={styles.brandText}>Savor</Text>
                <Text style={styles.brandSubtext}>AI Calorie Tracker</Text>
              </View>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Start your nutrition journey today.</Text>

              <View style={styles.nameRow}>
                <View style={[styles.inputGroup, styles.nameInputLeft]}>
                  <Text style={styles.label}>First Name</Text>
                  <Controller
                    control={control}
                    name="firstName"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={[styles.inputWrapper, errors.firstName && styles.inputError]}>
                        <Ionicons name="person-outline" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                          placeholder="First"
                          placeholderTextColor={colors.mutedForeground}
                          autoCapitalize="words"
                          editable={!isLoading}
                        />
                      </View>
                    )}
                  />
                  {errors.firstName && <Text style={styles.errorText}>{errors.firstName.message}</Text>}
                </View>

                <View style={[styles.inputGroup, styles.nameInputRight]}>
                  <Text style={styles.label}>Last Name</Text>
                  <Controller
                    control={control}
                    name="lastName"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.input}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                          placeholder="Optional"
                          placeholderTextColor={colors.mutedForeground}
                          autoCapitalize="words"
                          editable={!isLoading}
                        />
                      </View>
                    )}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                      <Ionicons name="mail-outline" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        placeholder="Enter your email"
                        placeholderTextColor={colors.mutedForeground}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        editable={!isLoading}
                      />
                    </View>
                  )}
                />
                {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                      <Ionicons name="lock-closed-outline" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        placeholder="Create a password"
                        placeholderTextColor={colors.mutedForeground}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        editable={!isLoading}
                      />
                      <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
                        <Ionicons
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={20}
                          color={colors.mutedForeground}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                />
                {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}>
                      <Ionicons name="lock-closed-outline" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        placeholder="Confirm your password"
                        placeholderTextColor={colors.mutedForeground}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        editable={!isLoading}
                      />
                      <TouchableOpacity onPress={() => setShowConfirmPassword((prev) => !prev)}>
                        <Ionicons
                          name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={20}
                          color={colors.mutedForeground}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                />
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
                onPress={handleSubmit(onSubmit)}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.signupButtonText}>Sign Up</Text>}
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <Link href="/auth/login" asChild>
                  <TouchableOpacity>
                    <Text style={styles.loginLink}>Log In</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D2A2F',
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 14,
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
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
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
    backgroundColor: '#FFFCF5',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E7DBC7',
  },
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
  },
  nameRow: {
    flexDirection: 'row',
  },
  nameInputLeft: {
    flex: 1,
    marginRight: 8,
  },
  nameInputRight: {
    flex: 1,
    marginLeft: 8,
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
  signupButton: {
    marginTop: 10,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    color: '#243036',
    fontSize: 16,
    fontWeight: '700',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginText: {
    color: colors.mutedForeground,
    fontSize: 14,
  },
  loginLink: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '700',
  },
});
