import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { SocialAuthButtons } from '../../components/SocialAuthButtons';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { authFormStyles } from '../../styles/authScreenStyles';
import { colors } from '../../styles/theme';

const passwordRule =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

const signupSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        passwordRule,
        'Password needs upper, lower, number, and special character',
      ),
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
  const { signup, googleLogin, appleLogin, isLoading, clearError } = useAuthStore();
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
    } catch (err: any) {
      Alert.alert('Signup Failed', err.message || 'An error occurred during signup');
    }
  };

  const handleGoogle = async () => {
    try {
      clearError();
      await googleLogin();
      router.replace('/(tabs)');
    } catch (err: any) {
      if (!err.message?.includes('cancelled')) {
        Alert.alert('Google Sign-In Failed', err.message || 'Could not sign up with Google');
      }
    }
  };

  const handleApple = async () => {
    try {
      clearError();
      await appleLogin();
      router.replace('/(tabs)');
    } catch (err: any) {
      if (err?.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Apple Sign-In Failed', err.message || 'Could not sign up with Apple');
      }
    }
  };

  return (
    <AuthScreenLayout>
      <Text style={authFormStyles.title}>Create Account</Text>
      <Text style={authFormStyles.subtitle}>Start your nutrition journey today.</Text>

      <SocialAuthButtons
        onGooglePress={handleGoogle}
        onApplePress={handleApple}
        disabled={isLoading}
        loading={isLoading}
      />

      <View style={styles.nameRow}>
        <View style={[authFormStyles.inputGroup, styles.nameInputLeft]}>
          <Text style={authFormStyles.label}>First Name</Text>
          <Controller
            control={control}
            name="firstName"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={[authFormStyles.inputWrapper, errors.firstName && authFormStyles.inputError]}>
                <TextInput
                  style={authFormStyles.input}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
            )}
          />
          {errors.firstName && <Text style={authFormStyles.errorText}>{errors.firstName.message}</Text>}
        </View>

        <View style={[authFormStyles.inputGroup, styles.nameInputRight]}>
          <Text style={authFormStyles.label}>Last Name</Text>
          <Controller
            control={control}
            name="lastName"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={authFormStyles.inputWrapper}>
                <TextInput
                  style={authFormStyles.input}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
            )}
          />
        </View>
      </View>

      <View style={authFormStyles.inputGroup}>
        <Text style={authFormStyles.label}>Email</Text>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={[authFormStyles.inputWrapper, errors.email && authFormStyles.inputError]}>
              <Ionicons name="mail-outline" size={18} color={colors.mutedForeground} style={authFormStyles.inputIcon} />
              <TextInput
                style={authFormStyles.input}
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
        {errors.email && <Text style={authFormStyles.errorText}>{errors.email.message}</Text>}
      </View>

      <View style={authFormStyles.inputGroup}>
        <Text style={authFormStyles.label}>Password</Text>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={[authFormStyles.inputWrapper, errors.password && authFormStyles.inputError]}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.mutedForeground} style={authFormStyles.inputIcon} />
              <TextInput
                style={authFormStyles.input}
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
        {errors.password && <Text style={authFormStyles.errorText}>{errors.password.message}</Text>}
      </View>

      <View style={authFormStyles.inputGroup}>
        <Text style={authFormStyles.label}>Confirm Password</Text>
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={[authFormStyles.inputWrapper, errors.confirmPassword && authFormStyles.inputError]}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.mutedForeground} style={authFormStyles.inputIcon} />
              <TextInput
                style={authFormStyles.input}
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
          <Text style={authFormStyles.errorText}>{errors.confirmPassword.message}</Text>
        )}
      </View>

      <TouchableOpacity
        style={[authFormStyles.primaryButton, styles.signupButton, isLoading && authFormStyles.primaryButtonDisabled]}
        onPress={handleSubmit(onSubmit)}
        disabled={isLoading}
        activeOpacity={0.85}
      >
        {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={authFormStyles.primaryButtonText}>Sign Up</Text>}
      </TouchableOpacity>

      <View style={authFormStyles.footerRow}>
        <Text style={authFormStyles.footerText}>Already have an account? </Text>
        <Link href="/auth/login" asChild>
          <TouchableOpacity>
            <Text style={authFormStyles.footerLink}>Log In</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
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
  signupButton: {
    marginTop: 10,
  },
});
