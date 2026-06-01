import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useUserStore, convertWeight, convertHeight } from '../../store/userStore';
import { syncDatabase, getPendingSyncCount } from '../../database/sync';
import { WheelPicker } from '../../components/WheelPicker';
import { colors } from '../../styles/theme';

const GENDERS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
];

const ACTIVITY_LEVELS = [
  { label: 'Sedentary (little or no exercise)', value: 'sedentary' },
  { label: 'Light (1-3 days/week)', value: 'light' },
  { label: 'Moderate (3-5 days/week)', value: 'moderate' },
  { label: 'Active (6-7 days/week)', value: 'active' },
  { label: 'Very Active (athlete)', value: 'very_active' },
];

const GOALS = [
  { label: 'Lose Weight', value: 'lose' },
  { label: 'Maintain Weight', value: 'maintain' },
  { label: 'Gain Weight', value: 'gain' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const {
    age,
    gender,
    height,
    weight,
    activityLevel,
    goal,
    dailyCalorieGoal,
    proteinGoal,
    carbsGoal,
    fatGoal,
    preferredUnits,
    updateUserPreferences,
    calculateCalorieGoal,
    updateMacroGoals,
    toggleUnits,
    loadUserPreferences,
  } = useUserStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Form state
  const [formAge, setFormAge] = useState(age?.toString() || '');
  const [formGender, setFormGender] = useState(gender || 'male');
  const [formHeight, setFormHeight] = useState(height?.toString() || '');
  const [formWeight, setFormWeight] = useState(weight?.toString() || '');
  const [formActivityLevel, setFormActivityLevel] = useState(activityLevel || 'moderate');
  const [formGoal, setFormGoal] = useState(goal || 'maintain');

  // Macro percentages
  const [proteinPercent, setProteinPercent] = useState('30');
  const [carbsPercent, setCarbsPercent] = useState('40');
  const [fatPercent, setFatPercent] = useState('30');

  useEffect(() => {
    loadUserPreferences();
    loadPendingSyncCount();
  }, []);

  const loadPendingSyncCount = async () => {
    const count = await getPendingSyncCount();
    setPendingSyncCount(count);
  };

  const handleCalculateGoals = () => {
    if (!formAge || !formGender || !formHeight || !formWeight || !formActivityLevel || !formGoal) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const calculatedCalories = calculateCalorieGoal({
      age: parseInt(formAge),
      gender: formGender as 'male' | 'female',
      weight: parseFloat(formWeight),
      height: parseFloat(formHeight),
      activityLevel: formActivityLevel as any,
      goal: formGoal as any,
    });

    Alert.alert(
      'Calculated Goals',
      `Based on your information:\n\nDaily Calorie Goal: ${calculatedCalories} cal\n\nWould you like to save these settings?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async () => {
            setIsSaving(true);
            try {
              await updateUserPreferences({
                age: parseInt(formAge),
                gender: formGender,
                height: parseFloat(formHeight),
                weight: parseFloat(formWeight),
                activityLevel: formActivityLevel,
                goal: formGoal,
                dailyCalorieGoal: calculatedCalories,
              });

              // Calculate macro goals based on percentages
              await updateMacroGoals(
                parseFloat(proteinPercent),
                parseFloat(carbsPercent),
                parseFloat(fatPercent)
              );

              Alert.alert('Success', 'Your goals have been updated!');
              setIsEditing(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to save settings');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateUserPreferences({
        age: parseInt(formAge),
        gender: formGender,
        height: parseFloat(formHeight),
        weight: parseFloat(formWeight),
        activityLevel: formActivityLevel,
        goal: formGoal,
      });

      Alert.alert('Success', 'Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateMacros = async () => {
    const total = parseFloat(proteinPercent) + parseFloat(carbsPercent) + parseFloat(fatPercent);
    
    if (total !== 100) {
      Alert.alert('Error', 'Macro percentages must add up to 100%');
      return;
    }

    setIsSaving(true);
    try {
      await updateMacroGoals(
        parseFloat(proteinPercent),
        parseFloat(carbsPercent),
        parseFloat(fatPercent)
      );
      Alert.alert('Success', 'Macro goals updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update macro goals');
    } finally {
      setIsSaving(false);
    }
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await syncDatabase();
      
      Alert.alert('Success', 'Sync completed successfully!');
      
      await loadPendingSyncCount();
    } catch (error) {
      Alert.alert('Error', 'Sync failed. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/auth/login' as Href);
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // TODO: Implement account deletion API call
            Alert.alert('Info', 'Account deletion will be implemented in the backend');
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Your account</Text>
          <Text style={styles.title}>Profile</Text>
        </View>
        {user ? <Text style={styles.email}>{user.email}</Text> : null}
      </View>

      {/* Personal Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, styles.sectionTitleInline]}>Personal Information</Text>
          {!isEditing && (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            value={formAge}
            onChangeText={setFormAge}
            keyboardType="number-pad"
            editable={isEditing}
            placeholder="Enter your age"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender</Text>
          <WheelPicker
            value={formGender}
            options={GENDERS}
            onChange={setFormGender}
            disabled={!isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Height ({preferredUnits === 'metric' ? 'cm' : 'inches'})
          </Text>
          <TextInput
            style={styles.input}
            value={formHeight}
            onChangeText={setFormHeight}
            keyboardType="decimal-pad"
            editable={isEditing}
            placeholder="Enter your height"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Weight ({preferredUnits === 'metric' ? 'kg' : 'lbs'})
          </Text>
          <TextInput
            style={styles.input}
            value={formWeight}
            onChangeText={setFormWeight}
            keyboardType="decimal-pad"
            editable={isEditing}
            placeholder="Enter your weight"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Activity Level</Text>
          <WheelPicker
            value={formActivityLevel}
            options={ACTIVITY_LEVELS}
            onChange={setFormActivityLevel}
            disabled={!isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Goal</Text>
          <WheelPicker
            value={formGoal}
            options={GOALS}
            onChange={setFormGoal}
            disabled={!isEditing}
          />
        </View>

        {isEditing && (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => setIsEditing(false)}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleCalculateGoals}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color={colors.foreground} />
              ) : (
                <Text style={styles.primaryButtonText}>Calculate Goals</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Nutrition Goals */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nutrition Goals</Text>

        <View style={styles.goalCard}>
          <Text style={styles.goalLabel}>Daily Calories</Text>
          <Text style={styles.goalValue}>{dailyCalorieGoal || 2000} cal</Text>
        </View>

        <Text style={styles.macroTitle}>Macro Ratios</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Protein (%)</Text>
          <TextInput
            style={styles.input}
            value={proteinPercent}
            onChangeText={setProteinPercent}
            keyboardType="decimal-pad"
            placeholder="30"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Carbs (%)</Text>
          <TextInput
            style={styles.input}
            value={carbsPercent}
            onChangeText={setCarbsPercent}
            keyboardType="decimal-pad"
            placeholder="40"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Fat (%)</Text>
          <TextInput
            style={styles.input}
            value={fatPercent}
            onChangeText={setFatPercent}
            keyboardType="decimal-pad"
            placeholder="30"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleUpdateMacros}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.foreground} />
          ) : (
            <Text style={styles.primaryButtonText}>Update Macros</Text>
          )}
        </TouchableOpacity>

        <View style={styles.goalSummary}>
          <Text style={styles.goalSummaryText}>
            Protein: {proteinGoal}g | Carbs: {carbsGoal}g | Fat: {fatGoal}g
          </Text>
        </View>
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>

        <View style={styles.preferenceRow}>
          <Text style={styles.preferenceLabel}>
            Units: {preferredUnits === 'metric' ? 'Metric (kg, cm)' : 'Imperial (lbs, inches)'}
          </Text>
          <Switch
            value={preferredUnits === 'imperial'}
            onValueChange={toggleUnits}
            trackColor={{ false: colors.muted, true: colors.secondary }}
            thumbColor={colors.card}
          />
        </View>
      </View>

      {/* Sync */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync</Text>

        <View style={styles.syncInfo}>
          <Text style={styles.syncLabel}>Pending items:</Text>
          <Text style={styles.syncValue}>{pendingSyncCount}</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.syncButton]}
          onPress={handleForceSync}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator color={colors.foreground} />
          ) : (
            <Text style={styles.syncButtonText}>Force Sync</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Account Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={handleDeleteAccount}
        >
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Savor v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginBottom: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.foreground,
  },
  email: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 6,
  },
  section: {
    backgroundColor: colors.card,
    padding: 20,
    marginBottom: 16,
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 16,
  },
  sectionTitleInline: {
    marginBottom: 0,
  },
  editButton: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.inputBackground,
    color: colors.foreground,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryButton: {
    backgroundColor: colors.secondary,
  },
  primaryButtonText: {
    color: colors.secondaryForeground,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: colors.muted,
  },
  secondaryButtonText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
  goalCard: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  goalLabel: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginBottom: 4,
  },
  goalValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  macroTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 12,
  },
  goalSummary: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  goalSummaryText: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  preferenceLabel: {
    fontSize: 16,
    color: colors.foreground,
  },
  syncInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  syncLabel: {
    fontSize: 16,
    color: colors.mutedForeground,
  },
  syncValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.secondary,
  },
  syncButton: {
    backgroundColor: colors.muted,
  },
  syncButtonText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: colors.muted,
    marginBottom: 12,
  },
  logoutButtonText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  deleteButtonText: {
    color: colors.destructive,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
});
