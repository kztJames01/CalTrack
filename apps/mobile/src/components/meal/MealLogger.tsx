import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMealStore } from '../../store/mealStore';
import { useAuthStore } from '../../store/authStore';
import { theme } from '../../styles/theme';
import type { FoodSearchResult, MealType } from '../../types';
import FoodSearch from '../../components/meal/FoodSearch';
import CustomFoodForm from '../../components/meal/CustomFoodForm';

const MEAL_TYPES: { label: string; value: MealType }[] = [
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Dinner', value: 'dinner' },
  { label: 'Snacks', value: 'snack' },
];

export default function MealLogger() {
  const router = useRouter();
  const { foodData } = useLocalSearchParams<{ foodData?: string }>();
  const { user } = useAuthStore();
  const { createMeal, addFoodToMeal } = useMealStore();

  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(
    foodData ? JSON.parse(foodData) : null
  );
  const [portionSize, setPortionSize] = useState('1');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [isLogging, setIsLogging] = useState(false);

  const handleFoodSelect = (food: FoodSearchResult) => {
    setSelectedFood(food);
  };

  const handleCustomFood = (customFood: FoodSearchResult) => {
    setSelectedFood(customFood);
    setShowCustomForm(false);
  };

  const calculateNutrition = () => {
    const portion = parseFloat(portionSize) || 1;
    return {
      calories: Math.round((selectedFood?.calories || 0) * portion),
      protein: Math.round((selectedFood?.protein || 0) * portion),
      carbs: Math.round((selectedFood?.carbs || 0) * portion),
      fat: Math.round((selectedFood?.fat || 0) * portion),
    };
  };

  const handleLogMeal = async () => {
    if (!selectedFood) {
      Alert.alert('Error', 'Please select a food item');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setIsLogging(true);
    try {
      // Create meal
      const meal = await createMeal(mealType, user.id);

      // Add food item to meal
      const portion = parseFloat(portionSize) || 1;
      const foodItemData = {
        name: selectedFood.name,
        brandName: selectedFood.brandName,
        servingSize: (selectedFood.servingSize || 1) * portion,
        servingUnit: selectedFood.servingUnit || 'serving',
        calories: (selectedFood.calories || 0) * portion,
        protein: (selectedFood.protein || 0) * portion,
        carbs: (selectedFood.carbs || 0) * portion,
        fat: (selectedFood.fat || 0) * portion,
        fiber: selectedFood.fiber ? selectedFood.fiber * portion : undefined,
        sugar: selectedFood.sugar ? selectedFood.sugar * portion : undefined,
        sodium: selectedFood.sodium ? selectedFood.sodium * portion : undefined,
        barcode: selectedFood.barcode,
      };

      await addFoodToMeal(meal.id, foodItemData);

      Alert.alert('Success', 'Meal logged successfully!', [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)'),
        },
      ]);
    } catch (error) {
      console.error('Failed to log meal:', error);
      Alert.alert('Error', 'Failed to log meal. Please try again.');
    } finally {
      setIsLogging(false);
    }
  };

  const nutrition = selectedFood ? calculateNutrition() : null;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Log Meal</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meal Type</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={mealType}
            onValueChange={setMealType}
            style={styles.picker}
          >
            {MEAL_TYPES.map(type => (
              <Picker.Item key={type.value} label={type.label} value={type.value} />
            ))}
          </Picker>
        </View>
      </View>

      {!selectedFood ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Food</Text>
          <FoodSearch
            onSelect={handleFoodSelect}
            placeholder="Search for food..."
          />
          
          <TouchableOpacity
            style={styles.customFoodButton}
            onPress={() => setShowCustomForm(true)}
          >
            <Text style={styles.customFoodButtonText}>+ Add Custom Food</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <View style={styles.selectedFoodHeader}>
              <Text style={styles.sectionTitle}>Selected Food</Text>
              <TouchableOpacity onPress={() => setSelectedFood(null)}>
                <Text style={styles.changeButton}>Change</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.selectedFoodCard}>
              <Text style={styles.selectedFoodName}>{selectedFood.name}</Text>
              {selectedFood.brandName && (
                <Text style={styles.selectedFoodBrand}>{selectedFood.brandName}</Text>
              )}
              <Text style={styles.servingInfo}>
                Per {selectedFood.servingSize} {selectedFood.servingUnit}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Portion Size</Text>
            <View style={styles.portionControl}>
              <TouchableOpacity
                style={styles.portionButton}
                onPress={() => setPortionSize(String(Math.max(0.25, parseFloat(portionSize) - 0.25)))}
              >
                <Text style={styles.portionButtonText}>-</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.portionInput}
                value={portionSize}
                onChangeText={setPortionSize}
                keyboardType="decimal-pad"
                selectTextOnFocus
              />

              <TouchableOpacity
                style={styles.portionButton}
                onPress={() => setPortionSize(String(parseFloat(portionSize) + 0.25))}
              >
                <Text style={styles.portionButtonText}>+</Text>
              </TouchableOpacity>

              <Text style={styles.portionUnit}>
                {selectedFood.servingUnit || 'serving(s)'}
              </Text>
            </View>
          </View>

          {nutrition && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nutrition Preview</Text>
              <View style={styles.nutritionPreview}>
                <View style={styles.nutritionRow}>
                  <Text style={styles.nutritionLabel}>Calories</Text>
                  <Text style={styles.nutritionValue}>{nutrition.calories}</Text>
                </View>
                <View style={styles.nutritionRow}>
                  <Text style={styles.nutritionLabel}>Protein</Text>
                  <Text style={styles.nutritionValue}>{nutrition.protein}g</Text>
                </View>
                <View style={styles.nutritionRow}>
                  <Text style={styles.nutritionLabel}>Carbs</Text>
                  <Text style={styles.nutritionValue}>{nutrition.carbs}g</Text>
                </View>
                <View style={styles.nutritionRow}>
                  <Text style={styles.nutritionLabel}>Fat</Text>
                  <Text style={styles.nutritionValue}>{nutrition.fat}g</Text>
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.logButton, isLogging && styles.logButtonDisabled]}
            onPress={handleLogMeal}
            disabled={isLogging}
          >
            <Text style={styles.logButtonText}>
              {isLogging ? 'Logging...' : 'Log Meal'}
            </Text>
          </TouchableOpacity>
        </>
      )}

      <Modal
        visible={showCustomForm}
        animationType="slide"
        onRequestClose={() => setShowCustomForm(false)}
      >
        <CustomFoodForm
          onSubmit={handleCustomFood}
          onCancel={() => setShowCustomForm(false)}
        />
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.lg,
    marginTop: 40,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.md,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.inputBackground,
  },
  picker: {
    height: 50,
    color: theme.colors.foreground,
  },
  customFoodButton: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.muted,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  customFoodButtonText: {
    color: theme.colors.secondary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  selectedFoodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  changeButton: {
    color: theme.colors.secondary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  selectedFoodCard: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedFoodName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.foreground,
    marginBottom: 4,
  },
  selectedFoodBrand: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.sm,
  },
  servingInfo: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  portionControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  portionButton: {
    width: 44,
    height: 44,
    backgroundColor: theme.colors.secondary,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  portionButtonText: {
    color: theme.colors.secondaryForeground,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  portionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: 'center',
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.foreground,
  },
  portionUnit: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.mutedForeground,
    minWidth: 80,
  },
  nutritionPreview: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  nutritionLabel: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.mutedForeground,
  },
  nutritionValue: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.foreground,
  },
  logButton: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: 40,
  },
  logButtonDisabled: {
    opacity: 0.6,
  },
  logButtonText: {
    color: theme.colors.secondaryForeground,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
