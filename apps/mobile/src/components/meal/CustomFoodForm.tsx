import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { theme } from '../../styles/theme';
import type { CustomFoodFormProps, FoodSearchResult } from '../../types';
import { SERVING_UNITS } from '../../types';

export default function CustomFoodForm({ onSubmit, onCancel }: CustomFoodFormProps) {
  const [foodName, setFoodName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [servingSize, setServingSize] = useState('100');
  const [servingUnit, setServingUnit] = useState('g');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [sugar, setSugar] = useState('');
  const [sodium, setSodium] = useState('');

  const handleSubmit = () => {
    // Validate required fields
    if (!foodName.trim()) {
      Alert.alert('Error', 'Food name is required');
      return;
    }

    if (!calories || !protein || !carbs || !fat) {
      Alert.alert('Error', 'Calories, protein, carbs, and fat are required');
      return;
    }

    const foodData: FoodSearchResult = {
      name: foodName.trim(),
      brandName: brandName.trim() || undefined,
      servingSize: parseFloat(servingSize) || 100,
      servingUnit,
      calories: parseFloat(calories),
      protein: parseFloat(protein),
      carbs: parseFloat(carbs),
      fat: parseFloat(fat),
      fiber: fiber ? parseFloat(fiber) : undefined,
      sugar: sugar ? parseFloat(sugar) : undefined,
      sodium: sodium ? parseFloat(sodium) : undefined,
    };

    onSubmit(foodData);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add Custom Food</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Food Name *</Text>
        <TextInput
          style={styles.input}
          value={foodName}
          onChangeText={setFoodName}
          placeholder="e.g., Chicken Breast"
          autoFocus
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Brand Name (Optional)</Text>
        <TextInput
          style={styles.input}
          value={brandName}
          onChangeText={setBrandName}
          placeholder="e.g., Trader Joe's"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.flex]}>
          <Text style={styles.label}>Serving Size *</Text>
          <TextInput
            style={styles.input}
            value={servingSize}
            onChangeText={setServingSize}
            keyboardType="decimal-pad"
            placeholder="100"
          />
        </View>

        <View style={[styles.inputGroup, styles.flex]}>
          <Text style={styles.label}>Unit *</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.unitRow}
          >
            {SERVING_UNITS.map(unit => (
              <TouchableOpacity
                key={unit}
                style={[styles.unitButton, servingUnit === unit && styles.unitButtonActive]}
                onPress={() => setServingUnit(unit)}
                activeOpacity={0.8}
              >
                <Text style={[styles.unitText, servingUnit === unit && styles.unitTextActive]}>
                  {unit}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Macronutrients (Required)</Text>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.flex]}>
          <Text style={styles.label}>Calories *</Text>
          <TextInput
            style={styles.input}
            value={calories}
            onChangeText={setCalories}
            keyboardType="decimal-pad"
            placeholder="0"
          />
        </View>

        <View style={[styles.inputGroup, styles.flex]}>
          <Text style={styles.label}>Protein (g) *</Text>
          <TextInput
            style={styles.input}
            value={protein}
            onChangeText={setProtein}
            keyboardType="decimal-pad"
            placeholder="0"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.flex]}>
          <Text style={styles.label}>Carbs (g) *</Text>
          <TextInput
            style={styles.input}
            value={carbs}
            onChangeText={setCarbs}
            keyboardType="decimal-pad"
            placeholder="0"
          />
        </View>

        <View style={[styles.inputGroup, styles.flex]}>
          <Text style={styles.label}>Fat (g) *</Text>
          <TextInput
            style={styles.input}
            value={fat}
            onChangeText={setFat}
            keyboardType="decimal-pad"
            placeholder="0"
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Additional Info (Optional)</Text>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.flex]}>
          <Text style={styles.label}>Fiber (g)</Text>
          <TextInput
            style={styles.input}
            value={fiber}
            onChangeText={setFiber}
            keyboardType="decimal-pad"
            placeholder="0"
          />
        </View>

        <View style={[styles.inputGroup, styles.flex]}>
          <Text style={styles.label}>Sugar (g)</Text>
          <TextInput
            style={styles.input}
            value={sugar}
            onChangeText={setSugar}
            keyboardType="decimal-pad"
            placeholder="0"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Sodium (mg)</Text>
        <TextInput
          style={styles.input}
          value={sodium}
          onChangeText={setSodium}
          keyboardType="decimal-pad"
          placeholder="0"
        />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.submitButton]}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>Add Food</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.foreground,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.foreground,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  unitRow: {
    gap: 8,
    paddingRight: 4,
  },
  unitButton: {
    paddingVertical: 12,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.inputBackground,
  },
  unitButtonActive: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  unitText: {
    color: theme.colors.foreground,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  unitTextActive: {
    color: theme.colors.secondaryForeground,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: theme.spacing.lg,
    marginBottom: 40,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.muted,
  },
  cancelButtonText: {
    color: theme.colors.foreground,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  submitButton: {
    backgroundColor: theme.colors.secondary,
  },
  submitButtonText: {
    color: theme.colors.secondaryForeground,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
