import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { authFormStyles } from '../../styles/authScreenStyles';
import { colors } from '../../styles/theme';

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset code is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        'Must contain uppercase, lowercase, number and special character',
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { resetPassword, isLoading, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      clearError();
      await resetPassword(data.token, data.password);
      Alert.alert('Success', 'Your password has been reset successfully.', [
        { text: 'Log In', onPress: () => router.replace('/auth/login' as Href) },
      ]);
    } catch {
      Alert.alert('Error', 'Invalid or expired reset code. Please try again.');
    }
  };

  return (
    <AuthScreenLayout>
      <Text style={authFormStyles.title}>Reset Password</Text>
      <Text style={authFormStyles.subtitle}>Enter your reset code and choose a new password.</Text>

      <View style={authFormStyles.inputGroup}>
        <Text style={authFormStyles.label}>Reset Code</Text>
        <Controller
          control={control}
          name="token"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={[authFormStyles.inputWrapper, errors.token && authFormStyles.inputError]}>
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color={colors.mutedForeground}
                style={authFormStyles.inputIcon}
              />
              <TextInput
                style={authFormStyles.input}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Paste reset code"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>
          )}
        />
        {errors.token && <Text style={authFormStyles.errorText}>{errors.token.message}</Text>}
      </View>

      <View style={authFormStyles.inputGroup}>
        <Text style={authFormStyles.label}>New Password</Text>
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
                placeholder="New password"
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
                placeholder="Confirm new password"
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
        {errors.confirmPassword && <Text style={authFormStyles.errorText}>{errors.confirmPassword.message}</Text>}
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
          <Text style={authFormStyles.primaryButtonText}>Reset Password</Text>
        )}
      </TouchableOpacity>
    </AuthScreenLayout>
  );
}
