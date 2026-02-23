import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { database } from '../../database';
import { Q } from '@nozbe/watermelondb';
import Meal from '../../database/models/Meal';
import { useRouter, Href } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface MealWithDate extends Meal {
  dateKey: string;
}

export default function HistoryScreen() {
  const router = useRouter();
  const [meals, setMeals] = useState<MealWithDate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'week' | 'month' | 'all'>('week');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMeals();
  }, [dateFilter, searchQuery]);

  const loadMeals = async () => {
    setIsLoading(true);
    try {
      const mealCollection = database.collections.get<Meal>('meals');
      let query = mealCollection.query();

      // Apply date filter
      const now = new Date();
      if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        query = mealCollection.query(
          Q.where('meal_date', Q.gte(weekAgo.getTime()))
        );
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        query = mealCollection.query(
          Q.where('meal_date', Q.gte(monthAgo.getTime()))
        );
      }

      let results = await query.fetch();

      // Apply search filter if query exists
      if (searchQuery.trim()) {
        const foodItemsPromises = results.map(async (meal: Meal) => {
          const foodItems = await meal.foodItems.fetch();
          const hasMatch = foodItems.some((item: any) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
          return hasMatch ? meal : null;
        });

        const filteredResults = await Promise.all(foodItemsPromises);
        results = filteredResults.filter((meal: any) => meal !== null) as Meal[];
      }

      // Sort by date descending and add date keys for grouping
      const mealsWithDates = results
        .sort((a: any, b: any) => b.date.getTime() - a.date.getTime())
        .map((meal: any) => ({
          ...meal,
          dateKey: new Date(meal.date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        })) as MealWithDate[];

      setMeals(mealsWithDates);
    } catch (error) {
      console.error('Failed to load meals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = async () => {
    try {
      // Generate CSV content
      let csv = 'Date,Meal Type,Total Calories,Protein (g),Carbs (g),Fat (g)\n';

      for (const meal of meals) {
        const date = new Date((meal as any).date).toLocaleDateString();
        csv += `${date},${(meal as any).mealType},${(meal as any).totalCalories},${(meal as any).totalProtein},${(meal as any).totalCarbs},${(meal as any).totalFat}\n`;
      }

      // Save to file
      const fileName = `caltrack_export_${Date.now()}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Meal History',
        });
      } else {
        Alert.alert('Success', `File saved to ${filePath}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const renderMealItem = ({ item }: { item: MealWithDate }) => {
    const isNewDate =
      meals.findIndex((m) => (m as any).id === (item as any).id) === 0 ||
      meals[meals.findIndex((m) => (m as any).id === (item as any).id) - 1]?.dateKey !== item.dateKey;

    return (
      <>
        {isNewDate && (
          <View style={styles.dateHeader}>
            <Text style={styles.dateHeaderText}>{item.dateKey}</Text>
            <Text style={styles.dateHeaderTotal}>
              {meals
                .filter((m) => m.dateKey === item.dateKey)
                .reduce((sum, m) => sum + (m as any).totalCalories, 0)
                .toFixed(0)}{' '}
              cal
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.mealCard}
          onPress={() => router.push(`/(tabs)/meal/${(item as any).id}` as Href)}
        >
          <View style={styles.mealHeader}>
            <Text style={styles.mealType}>
              {(item as any).mealType.charAt(0).toUpperCase() + (item as any).mealType.slice(1)}
            </Text>
            <Text style={styles.mealTime}>
              {new Date((item as any).date).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={styles.mealNutrition}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{Math.round((item as any).totalCalories)}</Text>
              <Text style={styles.nutritionLabel}>cal</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{Math.round((item as any).totalProtein)}g</Text>
              <Text style={styles.nutritionLabel}>protein</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{Math.round((item as any).totalCarbs)}g</Text>
              <Text style={styles.nutritionLabel}>carbs</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{Math.round((item as any).totalFat)}g</Text>
              <Text style={styles.nutritionLabel}>fat</Text>
            </View>
          </View>
        </TouchableOpacity>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>

        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by food name..."
          placeholderTextColor="#94a3b8"
        />

        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[styles.filterButton, dateFilter === 'week' && styles.filterButtonActive]}
            onPress={() => setDateFilter('week')}
          >
            <Text
              style={[
                styles.filterButtonText,
                dateFilter === 'week' && styles.filterButtonTextActive,
              ]}
            >
              Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, dateFilter === 'month' && styles.filterButtonActive]}
            onPress={() => setDateFilter('month')}
          >
            <Text
              style={[
                styles.filterButtonText,
                dateFilter === 'month' && styles.filterButtonTextActive,
              ]}
            >
              Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, dateFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setDateFilter('all')}
          >
            <Text
              style={[
                styles.filterButtonText,
                dateFilter === 'all' && styles.filterButtonTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.exportButton} onPress={exportToCSV}>
          <Text style={styles.exportButtonText}>📊 Export CSV</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      ) : meals.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No meals found</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery
              ? 'Try a different search term'
              : 'Start logging meals to see your history'}
          </Text>
        </View>
      ) : (
        <FlashList
          data={meals}
          renderItem={renderMealItem}
          estimatedItemSize={120}
          keyExtractor={(item) => (item as any).id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  exportButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  listContent: {
    paddingBottom: 20,
  },
  dateHeader: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  dateHeaderTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  mealCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  mealTime: {
    fontSize: 14,
    color: '#64748b',
  },
  mealNutrition: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
