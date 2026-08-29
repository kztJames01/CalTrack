import React from 'react';
import {
  Image,
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
import { AUTH_GRADIENT, authScreenStyles } from '../styles/authScreenStyles';

const foodImage = require('../../assets/images/auth-food-bg.png');

type Props = {
  children: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
};

export function AuthScreenLayout({ children, showBack = true, onBack }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const goBack = onBack ?? (() => router.replace('/auth/welcome' as any));

  return (
    <View style={authScreenStyles.screen}>
      <LinearGradient colors={[...AUTH_GRADIENT]} style={authScreenStyles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={authScreenStyles.flex}
        >
          <View style={authScreenStyles.topSection}>
            <Image
              source={foodImage}
              style={authScreenStyles.foodBg}
              resizeMode="cover"
              pointerEvents="none"
            />

            {showBack ? (
              <View style={[authScreenStyles.topBar, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity
                  style={authScreenStyles.backButton}
                  onPress={goBack}
                >
                  <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          <View style={[authScreenStyles.formCard, { paddingBottom: insets.bottom + 24 }]}>
            <ScrollView
              style={authScreenStyles.flex}
              contentContainerStyle={authScreenStyles.scrollContent}
              keyboardShouldPersistTaps="handled"
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}
