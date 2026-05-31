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
import { useRouter, Link, Href } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { SocialAuthButtons } from '../../components/SocialAuthButtons';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { authFormStyles } from '../../styles/authScreenStyles';
import { colors } from '../../styles/theme';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { login, googleLogin, appleLogin, isLoading, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError();
      await login(data.email, data.password);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'An error occurred during login');
    }
  };

  const handleGoogle = async () => {
    try {
      clearError();
      await googleLogin();
      router.replace('/(tabs)');
    } catch (err: any) {
      if (!err.message?.includes('cancelled')) {
        Alert.alert('Google Sign-In Failed', err.message || 'Could not sign in with Google');
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
        Alert.alert('Apple Sign-In Failed', err.message || 'Could not sign in with Apple');
      }
    }
  };

  return (
    <AuthScreenLayout>
      <Text style={authFormStyles.title}>Welcome Back</Text>
      <Text style={authFormStyles.subtitle}>Log in to continue tracking your meals.</Text>

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
                placeholder="Enter your password"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
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

      <View style={styles.forgotPasswordRow}>
        <Link href={'/auth/forgot-password' as Href} asChild>
          <TouchableOpacity>
            <Text style={styles.forgotPasswordLink}>Forgot Password?</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <TouchableOpacity
        style={[authFormStyles.primaryButton, isLoading && authFormStyles.primaryButtonDisabled]}
        onPress={handleSubmit(onSubmit)}
        disabled={isLoading}
        activeOpacity={0.85}
      >
        {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={authFormStyles.primaryButtonText}>Log In</Text>}
      </TouchableOpacity>

      <SocialAuthButtons
        onGooglePress={handleGoogle}
        onApplePress={handleApple}
        disabled={isLoading}
        loading={isLoading}
      />

      <View style={authFormStyles.footerRow}>
        <Text style={authFormStyles.footerText}>Don't have an account? </Text>
        <Link href={'/auth/signup' as Href} asChild>
          <TouchableOpacity>
            <Text style={authFormStyles.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  forgotPasswordRow: {
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  forgotPasswordLink: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
});
