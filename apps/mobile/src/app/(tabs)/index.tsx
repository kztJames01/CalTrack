import React, { useEffect, useState, useMemo } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useMealStore, selectMealsByType } from '../../store/mealStore';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import { syncDatabase } from '../../database/sync';
import { colors } from '../../styles/theme';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const router = useRouter();
  const { meals, dailyTotals, loadMealsForDate, selectedDate, setSelectedDate } = useMealStore();
  const { dailyCalorieGoal, proteinGoal, carbsGoal, fatGoal, streakDays, calculateStreak } = useUserStore();
  const { user } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const mealsByType = selectMealsByType(useMealStore.getState());

  useEffect(() => {
    loadMealsForDate(new Date());
    calculateStreak();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await syncDatabase();
      await loadMealsForDate(selectedDate);
      await calculateStreak();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const calorieGoal = dailyCalorieGoal || 2000;
  const calorieProgress = Math.min((dailyTotals.calories / calorieGoal) * 100, 100);

  // Calendar strip (current week)
  const calendarDays = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning!';
    if (hour < 17) return 'Good afternoon!';
    return 'Good evening!';
  };

  const firstName = user?.firstName || user?.email?.split('@')[0] || 'there';

  const renderMealSection = (type: string, label: string, mealList: any[], icon: string) => {
    const totalCalories = mealList.reduce((sum, meal) => sum + meal.totalCalories, 0);
    const minCal = mealList.length > 0 ? Math.round(totalCalories * 0.9) : 0;
    const maxCal = mealList.length > 0 ? Math.round(totalCalories * 1.1) : 0;

    return (
      <View style={styles.mealSection} key={type}>
        <View style={styles.mealSectionHeader}>
          <View style={styles.mealSectionLeft}>
            <Text style={styles.mealSectionTitle}>{label}</Text>
            {mealList.length > 0 && (
              <View style={styles.mealCalorieBadge}>
                <Ionicons name="flame-outline" size={14} color={colors.secondary} />
                <Text style={styles.mealCalorieText}>
                  {minCal} - {maxCal} kcal
                </Text>
              </View>
            )}
          </View>
          <View style={styles.mealSectionRight}>
            {mealList.map((_, idx) => (
              <View key={idx} style={styles.mealThumbnail}>
                <Ionicons name="restaurant-outline" size={16} color={colors.mutedForeground} />
              </View>
            ))}
            <TouchableOpacity
              style={styles.addMealButton}
              onPress={() => router.push('/(tabs)/log-meal' as Href)}
            >
              <Ionicons name="add" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={colors.secondary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.userName}>{firstName}</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="calendar-outline" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="notifications-outline" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Weekly Progress Card */}
      <View style={styles.weeklyProgressCard}>
        <View style={styles.weeklyProgressLeft}>
          <View style={styles.dailyIntakeLabel}>
            <Ionicons name="pulse-outline" size={16} color={colors.secondary} />
            <Text style={styles.dailyIntakeText}>Daily intake</Text>
          </View>
          <Text style={styles.weeklyProgressTitle}>Your Weekly{'\n'}Progress</Text>
        </View>
        <View style={styles.weeklyProgressRight}>
          <View style={styles.streakCircle}>
            <Text style={styles.streakNumber}>{streakDays || 0}</Text>
            <Text style={styles.streakDaysLabel}>days</Text>
          </View>
        </View>
      </View>

      {/* Step + Water Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <View style={styles.metricIconContainer}>
            <Ionicons name="footsteps-outline" size={20} color={colors.secondary} />
          </View>
          <Text style={styles.metricLabel}>Step to walk</Text>
          <Text style={styles.metricValue}>5,500 <Text style={styles.metricUnit}>steps</Text></Text>
        </View>
        <View style={styles.metricCard}>
          <View style={styles.metricIconContainer}>
            <Ionicons name="water-outline" size={20} color="#3B82F6" />
          </View>
          <Text style={styles.metricLabel}>Drink Water</Text>
          <Text style={styles.metricValue}>12 <Text style={styles.metricUnit}>glass</Text></Text>
        </View>
      </View>

      {/* Calendar Strip */}
      <View style={styles.calendarSection}>
        <View style={styles.calendarHeader}>
          <Text style={styles.calendarMonth}>
            {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <View style={styles.calendarNav}>
            <TouchableOpacity>
              <Ionicons name="chevron-back" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.calendarStrip}>
          {calendarDays.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.calendarDay,
                isSelected(day) && styles.calendarDaySelected,
              ]}
              onPress={() => {
                setSelectedDate(day);
              }}
            >
              <Text style={[
                styles.calendarDayName,
                isSelected(day) && styles.calendarDayNameSelected,
              ]}>
                {dayNames[day.getDay()]}
              </Text>
              <Text style={[
                styles.calendarDayNumber,
                isSelected(day) && styles.calendarDayNumberSelected,
              ]}>
                {day.getDate().toString().padStart(2, '0')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Calorie Summary */}
      <View style={styles.calorieSummaryCard}>
        <View style={styles.calorieSummaryLeft}>
          <Text style={styles.calorieConsumed}>{Math.round(dailyTotals.calories)}</Text>
          <Text style={styles.calorieOfGoal}>/ {calorieGoal} kcal</Text>
        </View>
        <View style={styles.macroRow}>
          <View style={styles.macroItem}>
            <View style={[styles.macroDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.macroLabel}>P: {Math.round(dailyTotals.protein)}g</Text>
          </View>
          <View style={styles.macroItem}>
            <View style={[styles.macroDot, { backgroundColor: colors.secondary }]} />
            <Text style={styles.macroLabel}>C: {Math.round(dailyTotals.carbs)}g</Text>
          </View>
          <View style={styles.macroItem}>
            <View style={[styles.macroDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.macroLabel}>F: {Math.round(dailyTotals.fat)}g</Text>
          </View>
        </View>
        {/* Progress bar */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${calorieProgress}%` }]} />
        </View>
      </View>

      {/* Meal Sections */}
      <View style={styles.mealSectionsContainer}>
        {renderMealSection('breakfast', 'Breakfast', mealsByType.breakfast, 'sunny-outline')}
        {renderMealSection('lunch', 'Lunch time', mealsByType.lunch, 'restaurant-outline')}
        {renderMealSection('dinner', 'Dinner', mealsByType.dinner, 'moon-outline')}
        {renderMealSection('snacks', 'Snacks', mealsByType.snacks, 'cafe-outline')}

        {meals.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={48} color={colors.muted} />
            <Text style={styles.emptyText}>No meals logged yet</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(tabs)/log-meal' as Href)}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyButtonText}>Log Your First Meal</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginBottom: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.foreground,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  // Weekly Progress
  weeklyProgressCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: `${colors.primary}30`,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weeklyProgressLeft: {
    flex: 1,
  },
  dailyIntakeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dailyIntakeText: {
    fontSize: 13,
    color: colors.secondary,
    fontWeight: '500',
  },
  weeklyProgressTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.foreground,
    lineHeight: 28,
  },
  weeklyProgressRight: {
    alignItems: 'center',
  },
  streakCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  streakNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.secondary,
  },
  streakDaysLabel: {
    fontSize: 11,
    color: colors.mutedForeground,
  },
  // Metrics
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricLabel: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.foreground,
  },
  metricUnit: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.mutedForeground,
  },
  // Calendar
  calendarSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarMonth: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
  },
  calendarNav: {
    flexDirection: 'row',
    gap: 12,
  },
  calendarStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarDay: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 16,
    minWidth: (screenWidth - 40 - 48) / 7,
  },
  calendarDaySelected: {
    backgroundColor: colors.primary,
  },
  calendarDayName: {
    fontSize: 13,
    color: colors.mutedForeground,
    fontWeight: '500',
    marginBottom: 6,
  },
  calendarDayNameSelected: {
    color: colors.foreground,
    fontWeight: '600',
  },
  calendarDayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  calendarDayNumberSelected: {
    color: colors.foreground,
    fontWeight: '700',
  },
  // Calorie Summary
  calorieSummaryCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calorieSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  calorieConsumed: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.foreground,
  },
  calorieOfGoal: {
    fontSize: 15,
    color: colors.mutedForeground,
    marginLeft: 4,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroLabel: {
    fontSize: 13,
    color: colors.mutedForeground,
    fontWeight: '500',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.muted,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: 3,
  },
  // Meals
  mealSectionsContainer: {
    paddingHorizontal: 20,
  },
  mealSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mealSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealSectionLeft: {
    flex: 1,
  },
  mealSectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 4,
  },
  mealCalorieBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mealCalorieText: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
  mealSectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mealThumbnail: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMealButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Empty state
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.mutedForeground,
    marginTop: 12,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
