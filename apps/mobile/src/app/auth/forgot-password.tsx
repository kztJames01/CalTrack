import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, Link, Href } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { authFormStyles } from '../../styles/authScreenStyles';
import { colors } from '../../styles/theme';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword, isLoading, clearError } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      clearError();
      await forgotPassword(data.email);
      Alert.alert(
        'Check Your Email',
        'If an account exists with that email, we sent a password reset link.',
        [{ text: 'OK', onPress: () => router.push('/auth/reset-password' as Href) }],
      );
    } catch {
      Alert.alert('Check Your Email', 'If an account exists with that email, we sent a password reset link.');
    }
  };

  return (
    <AuthScreenLayout>
      <Text style={authFormStyles.title}>Forgot Password?</Text>
      <Text style={authFormStyles.subtitle}>Enter your email and we will send a reset link.</Text>

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

      <TouchableOpacity
        style={[authFormStyles.primaryButton, isLoading && authFormStyles.primaryButtonDisabled]}
        onPress={handleSubmit(onSubmit)}
        disabled={isLoading}
        activeOpacity={0.85}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={authFormStyles.primaryButtonText}>Send Reset Link</Text>
        )}
      </TouchableOpacity>

      <View style={authFormStyles.footerRow}>
        <Ionicons name="arrow-back" size={14} color={colors.secondary} />
        <Link href={'/auth/login' as Href} asChild>
          <TouchableOpacity>
            <Text style={authFormStyles.footerLink}> Back to Login</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </AuthScreenLayout>
  );
}
