import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import { PieChart } from 'react-native-chart-kit';
import { useMealStore, selectMacroPercentages, selectMealsByType } from '../../store/mealStore';
import { useUserStore } from '../../store/userStore';
import { syncDatabase } from '@/database/sync';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const router = useRouter();
  const { meals, dailyTotals, loadMealsForDate, calculateDailyTotals } = useMealStore();
  const { dailyCalorieGoal, proteinGoal, carbsGoal, fatGoal, streakDays, calculateStreak } = useUserStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const macroPercentages = selectMacroPercentages(useMealStore.getState());
  const mealsByType = selectMealsByType(useMealStore.getState());

  useEffect(() => {
    loadMealsForDate(new Date());
    calculateStreak();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await syncDatabase();
      await loadMealsForDate(new Date());
      await calculateStreak();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const calorieProgress = dailyCalorieGoal
    ? Math.min((dailyTotals.calories / dailyCalorieGoal) * 100, 100)
    : 0;

  const macroData = [
    {
      name: 'Protein',
      value: macroPercentages.protein || 1,
      color: '#3b82f6',
      legendFontColor: '#64748b',
    },
    {
      name: 'Carbs',
      value: macroPercentages.carbs || 1,
      color: '#10b981',
      legendFontColor: '#64748b',
    },
    {
      name: 'Fat',
      value: macroPercentages.fat || 1,
      color: '#f59e0b',
      legendFontColor: '#64748b',
    },
  ];

  const renderMealSection = (type: string, label: string, meals: any[]) => {
    if (meals.length === 0) return null;

    const totalCalories = meals.reduce((sum, meal) => sum + meal.totalCalories, 0);

    return (
      <View style={styles.mealSection} key={type}>
        <View style={styles.mealHeader}>
          <Text style={styles.mealType}>{label}</Text>
          <Text style={styles.mealCalories}>{Math.round(totalCalories)} cal</Text>
        </View>
        {meals.map((meal) => (
          <TouchableOpacity
            key={meal.id}
            style={styles.mealItem}
            onPress={() => router.push(`/(tabs)/meal/${meal.id}` as Href)}
          >
            <View style={styles.mealInfo}>
              <Text style={styles.mealTime}>
                {new Date(meal.mealDate).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
              <Text style={styles.mealMacros}>
                P: {Math.round(meal.totalProtein)}g | C: {Math.round(meal.totalCarbs)}g | F: {Math.round(meal.totalFat)}g
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}</Text>
      </View>

      {/* Calorie Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressCircle}>
          <View style={styles.progressInner}>
            <Text style={styles.progressValue}>{Math.round(dailyTotals.calories)}</Text>
            <Text style={styles.progressGoal}>/ {dailyCalorieGoal || 2000}</Text>
            <Text style={styles.progressLabel}>calories</Text>
          </View>
          {/* Simplified circular progress */}
          <View
            style={[
              styles.progressRing,
              {
                borderColor: calorieProgress >= 100 ? '#10b981' : '#2563eb',
                opacity: Math.min(calorieProgress / 100, 1),
              },
            ]}
          />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Math.round(dailyTotals.protein)}g</Text>
            <Text style={styles.statLabel}>Protein</Text>
            <Text style={styles.statGoal}>/ {proteinGoal || 150}g</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Math.round(dailyTotals.carbs)}g</Text>
            <Text style={styles.statLabel}>Carbs</Text>
            <Text style={styles.statGoal}>/ {carbsGoal || 200}g</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Math.round(dailyTotals.fat)}g</Text>
            <Text style={styles.statLabel}>Fat</Text>
            <Text style={styles.statGoal}>/ {fatGoal || 65}g</Text>
          </View>
        </View>
      </View>

      {/* Macro Breakdown */}
      {dailyTotals.calories > 0 && (
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Macro Breakdown</Text>
          <PieChart
            data={macroData}
            width={screenWidth - 40}
            height={180}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute={false}
          />
        </View>
      )}

      {/* Streak Counter */}
      {streakDays > 0 && (
        <View style={styles.streakCard}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <View>
            <Text style={styles.streakValue}>{streakDays} {streakDays === 1 ? 'day' : 'days'}</Text>
            <Text style={styles.streakLabel}>logging streak!</Text>
          </View>
        </View>
      )}

      {/* Today's Meals */}
      <View style={styles.mealsSection}>
        <View style={styles.mealsSectionHeader}>
          <Text style={styles.sectionTitle}>Today's Meals</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/log-meal' as Href)}>
            <Text style={styles.addButton}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {meals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No meals logged yet</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(tabs)/log-meal' as Href)}
            >
              <Text style={styles.emptyButtonText}>Log Your First Meal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {renderMealSection('breakfast', 'Breakfast', mealsByType.breakfast)}
            {renderMealSection('lunch', 'Lunch', mealsByType.lunch)}
            {renderMealSection('dinner', 'Dinner', mealsByType.dinner)}
            {renderMealSection('snacks', 'Snacks', mealsByType.snacks)}
          </>
        )}
      </View>

      {/* Quick Add Buttons */}
      <View style={styles.quickAddSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickAddButtons}>
          <TouchableOpacity
            style={styles.quickAddButton}
            onPress={() => router.push('/(tabs)/camera' as Href)}
          >
            <Text style={styles.quickAddIcon}>📸</Text>
            <Text style={styles.quickAddText}>Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAddButton}
            onPress={() => router.push('/(tabs)/barcode' as Href)}
          >
            <Text style={styles.quickAddIcon}>📊</Text>
            <Text style={styles.quickAddText}>Barcode</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAddButton}
            onPress={() => router.push('/(tabs)/log-meal' as Href)}
          >
            <Text style={styles.quickAddIcon}>🔍</Text>
            <Text style={styles.quickAddText}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: '#64748b',
  },
  progressSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
  },
  progressCircle: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  progressInner: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  progressRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 12,
    top: 0,
  },
  progressValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  progressGoal: {
    fontSize: 20,
    color: '#64748b',
  },
  progressLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  statGoal: {
    fontSize: 11,
    color: '#94a3b8',
  },
  chartSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  streakCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  streakValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  streakLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  mealsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
  },
  mealsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mealSection: {
    marginBottom: 20,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  mealCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  mealItem: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  mealInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealTime: {
    fontSize: 14,
    color: '#64748b',
  },
  mealMacros: {
    fontSize: 12,
    color: '#94a3b8',
  },
  quickAddSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  quickAddButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAddButton: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    minWidth: 100,
  },
  quickAddIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickAddText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
});
