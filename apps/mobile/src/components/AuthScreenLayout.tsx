import React from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthBrandHeader } from './AuthBrandHeader';
import { AUTH_GRADIENT, authScreenStyles } from '../styles/authScreenStyles';

type Props = {
  children: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
};

export function AuthScreenLayout({ children, showBack = true, onBack }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={authScreenStyles.screen}>
      <LinearGradient colors={[...AUTH_GRADIENT]} style={authScreenStyles.gradient}>
        {showBack ? (
          <View style={[authScreenStyles.topBar, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity
              style={authScreenStyles.backButton}
              onPress={onBack ?? (() => router.back())}
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : null}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={authScreenStyles.flex}
        >
          <ScrollView
            style={authScreenStyles.flex}
            contentContainerStyle={[authScreenStyles.scrollContent, { paddingBottom: insets.bottom }]}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <View style={authScreenStyles.brandSection}>
              <AuthBrandHeader />
            </View>
            <View style={authScreenStyles.formCard}>{children}</View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}
