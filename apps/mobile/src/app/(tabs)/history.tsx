import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { database } from '../../database';
import { Q } from '@nozbe/watermelondb';
import Meal from '../../database/models/Meal';
import { colors } from '../../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_BAR_WIDTH = 28;
const CHART_HEIGHT = 160;
const TARGET_CALORIES = 1920;
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface DailyData {
  day: string;
  calories: number;
  percentage: number;
}

export default function StatisticsScreen() {
  const [weeklyData, setWeeklyData] = useState<DailyData[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [avgProtein, setAvgProtein] = useState(0);
  const [avgCarbs, setAvgCarbs] = useState(0);
  const [avgFat, setAvgFat] = useState(0);
  const [waterGlasses, setWaterGlasses] = useState(6);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    loadStatistics();
  }, [selectedPeriod]);

  const loadStatistics = async () => {
    try {
      const mealCollection = database.collections.get('meals') as any;
      const now = new Date();

      // Get start of current week (Monday)
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
      monday.setHours(0, 0, 0, 0);

      const startDate =
        selectedPeriod === 'week'
          ? monday
          : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const results = await mealCollection
        .query(Q.where('date', Q.gte(startDate.getTime())))
        .fetch();

      // Aggregate by day of week
      const dailyMap: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {};
      DAYS.forEach((d) => (dailyMap[d] = { calories: 0, protein: 0, carbs: 0, fat: 0 }));

      let totalCal = 0;
      let totalProt = 0;
      let totalCarb = 0;
      let totalF = 0;
      let count = 0;

      results.forEach((meal: any) => {
        const date = new Date(meal.date);
        const dayIndex = (date.getDay() + 6) % 7; // Monday = 0
        const dayKey = DAYS[dayIndex];
        if (dayKey) {
          dailyMap[dayKey]!.calories += meal.totalCalories || 0;
          dailyMap[dayKey]!.protein += meal.totalProtein || 0;
          dailyMap[dayKey]!.carbs += meal.totalCarbs || 0;
          dailyMap[dayKey]!.fat += meal.totalFat || 0;
        }
        totalCal += meal.totalCalories || 0;
        totalProt += meal.totalProtein || 0;
        totalCarb += meal.totalCarbs || 0;
        totalF += meal.totalFat || 0;
        count++;
      });

      const weekly = DAYS.map((day) => ({
        day,
        calories: Math.round(dailyMap[day]!.calories),
        percentage: Math.round((dailyMap[day]!.calories / TARGET_CALORIES) * 100),
      }));

      setWeeklyData(weekly);
      setTotalCalories(Math.round(totalCal));
      setAvgProtein(count > 0 ? Math.round(totalProt / Math.max(1, Object.values(dailyMap).filter((d) => d.calories > 0).length)) : 0);
      setAvgCarbs(count > 0 ? Math.round(totalCarb / Math.max(1, Object.values(dailyMap).filter((d) => d.calories > 0).length)) : 0);
      setAvgFat(count > 0 ? Math.round(totalF / Math.max(1, Object.values(dailyMap).filter((d) => d.calories > 0).length)) : 0);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const maxCalories = useMemo(
    () => Math.max(...weeklyData.map((d) => d.calories), TARGET_CALORIES),
    [weeklyData]
  );

  const todayCalories = useMemo(() => {
    const todayIndex = (new Date().getDay() + 6) % 7;
    return weeklyData[todayIndex]?.calories ?? 0;
  }, [weeklyData]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Statistics</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <View style={styles.periodRow}>
        <TouchableOpacity
          style={[styles.periodBtn, selectedPeriod === 'week' && styles.periodBtnActive]}
          onPress={() => setSelectedPeriod('week')}
        >
          <Text style={[styles.periodText, selectedPeriod === 'week' && styles.periodTextActive]}>
            Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodBtn, selectedPeriod === 'month' && styles.periodBtnActive]}
          onPress={() => setSelectedPeriod('month')}
        >
          <Text style={[styles.periodText, selectedPeriod === 'month' && styles.periodTextActive]}>
            Month
          </Text>
        </TouchableOpacity>
      </View>

      {/* Calories Card */}
      <View style={styles.card}>
        <View style={styles.calorieHeader}>
          <View>
            <Text style={styles.calorieLabel}>Calories</Text>
            <Text style={styles.calorieValue}>
              {todayCalories} <Text style={styles.calorieUnit}>Kcal</Text>
            </Text>
          </View>
          <View style={styles.targetBadge}>
            <Ionicons name="flame" size={14} color={colors.secondary} />
            <Text style={styles.targetText}>Target: {TARGET_CALORIES} Kcal</Text>
          </View>
        </View>

        {/* Bar Chart */}
        <View style={styles.chartContainer}>
          {/* Horizontal guide lines */}
          <View style={styles.guideLines}>
            {[100, 75, 50, 25, 0].map((pct) => (
              <View key={pct} style={styles.guideLine}>
                <Text style={styles.guideLabel}>{pct}%</Text>
                <View style={styles.guideRule} />
              </View>
            ))}
          </View>

          {/* Bars */}
          <View style={styles.barsRow}>
            {weeklyData.map((item, index) => {
              const barHeight = maxCalories > 0
                ? (item.calories / maxCalories) * CHART_HEIGHT
                : 0;
              const isToday = index === (new Date().getDay() + 6) % 7;

              return (
                <View key={item.day} style={styles.barColumn}>
                  <Text style={[styles.barPercentage, isToday && styles.barPercentageActive]}>
                    {item.percentage}%
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(barHeight, 4),
                          backgroundColor: isToday ? colors.secondary : colors.primary,
                          borderRadius: 6,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, isToday && styles.barLabelActive]}>
                    {item.day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Stat Cards Grid */}
      <View style={styles.statsGrid}>
        {/* Exercise Card */}
        <View style={styles.statCard}>
          <View style={styles.statCardHeader}>
            <View style={[styles.statIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="bicycle" size={18} color="#FB8C00" />
            </View>
            <Ionicons name="ellipsis-horizontal" size={16} color={colors.mutedForeground} />
          </View>
          <Text style={styles.statLabel}>Exercise</Text>
          <Text style={styles.statValue}>
            {avgProtein > 0 ? (avgProtein * 0.04).toFixed(1) : '0.0'}{' '}
            <Text style={styles.statUnit}>hours</Text>
          </Text>
          <View style={styles.miniBarContainer}>
            <View style={[styles.miniBar, { width: '65%', backgroundColor: '#FB8C00' }]} />
          </View>
        </View>

        {/* Protein Card (BPM-style) */}
        <View style={styles.statCard}>
          <View style={styles.statCardHeader}>
            <View style={[styles.statIcon, { backgroundColor: '#FCE4EC' }]}>
              <Ionicons name="heart" size={18} color="#E91E63" />
            </View>
            <Ionicons name="ellipsis-horizontal" size={16} color={colors.mutedForeground} />
          </View>
          <Text style={styles.statLabel}>Avg Protein</Text>
          <Text style={styles.statValue}>
            {avgProtein} <Text style={styles.statUnit}>g</Text>
          </Text>
          <View style={styles.miniWaveRow}>
            {[40, 65, 30, 80, 55, 70, 45, 60, 35, 75].map((h, i) => (
              <View
                key={i}
                style={[
                  styles.miniWaveBar,
                  { height: h * 0.25, backgroundColor: '#E91E63', opacity: 0.3 + (h / 100) * 0.7 },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Carbs Card */}
        <View style={styles.statCard}>
          <View style={styles.statCardHeader}>
            <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="nutrition" size={18} color={colors.secondary} />
            </View>
            <Ionicons name="ellipsis-horizontal" size={16} color={colors.mutedForeground} />
          </View>
          <Text style={styles.statLabel}>Avg Carbs</Text>
          <Text style={styles.statValue}>
            {avgCarbs} <Text style={styles.statUnit}>g</Text>
          </Text>
          <View style={styles.miniBarContainer}>
            <View style={[styles.miniBar, { width: `${Math.min((avgCarbs / 300) * 100, 100)}%`, backgroundColor: colors.secondary }]} />
          </View>
        </View>

        {/* Water Card */}
        <View style={styles.statCard}>
          <View style={styles.statCardHeader}>
            <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="water" size={18} color="#2196F3" />
            </View>
            <Ionicons name="ellipsis-horizontal" size={16} color={colors.mutedForeground} />
          </View>
          <Text style={styles.statLabel}>Water</Text>
          <Text style={styles.statValue}>
            {waterGlasses} <Text style={styles.statUnit}>glasses</Text>
          </Text>
          <View style={styles.waterDotsRow}>
            {Array.from({ length: 8 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.waterDot,
                  { backgroundColor: i < waterGlasses ? '#2196F3' : '#E3F2FD' },
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Weekly Summary Card */}
      <View style={[styles.card, { marginBottom: 100 }]}>
        <Text style={styles.summaryTitle}>Weekly Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalCalories}</Text>
            <Text style={styles.summaryLabel}>Total Kcal</Text>
          </View>
          <View style={[styles.summaryDivider]} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{avgProtein}g</Text>
            <Text style={styles.summaryLabel}>Avg Protein</Text>
          </View>
          <View style={[styles.summaryDivider]} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{avgCarbs}g</Text>
            <Text style={styles.summaryLabel}>Avg Carbs</Text>
          </View>
          <View style={[styles.summaryDivider]} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{avgFat}g</Text>
            <Text style={styles.summaryLabel}>Avg Fat</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.foreground,
  },
  periodRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: colors.muted,
    borderRadius: 12,
    padding: 4,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  periodBtnActive: {
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  periodTextActive: {
    color: colors.foreground,
  },
  card: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  calorieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  calorieLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.mutedForeground,
    marginBottom: 4,
  },
  calorieValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.foreground,
  },
  calorieUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.mutedForeground,
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  targetText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondary,
  },
  chartContainer: {
    position: 'relative',
    height: CHART_HEIGHT + 50,
  },
  guideLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: CHART_HEIGHT,
    justifyContent: 'space-between',
  },
  guideLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guideLabel: {
    width: 32,
    fontSize: 10,
    color: colors.mutedForeground,
    textAlign: 'right',
    marginRight: 8,
  },
  guideRule: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingLeft: 42,
    height: CHART_HEIGHT + 50,
    paddingTop: 0,
  },
  barColumn: {
    alignItems: 'center',
    width: CHART_BAR_WIDTH + 8,
  },
  barPercentage: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.mutedForeground,
    marginBottom: 4,
  },
  barPercentageActive: {
    color: colors.secondary,
  },
  barTrack: {
    width: CHART_BAR_WIDTH,
    height: CHART_HEIGHT,
    backgroundColor: colors.muted,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.mutedForeground,
    marginTop: 8,
  },
  barLabelActive: {
    color: colors.secondary,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: (SCREEN_WIDTH - 40 - 12) / 2,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 10,
  },
  statUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.mutedForeground,
  },
  miniBarContainer: {
    height: 6,
    backgroundColor: colors.muted,
    borderRadius: 3,
    overflow: 'hidden',
  },
  miniBar: {
    height: '100%',
    borderRadius: 3,
  },
  miniWaveRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 20,
  },
  miniWaveBar: {
    width: 4,
    borderRadius: 2,
  },
  waterDotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  waterDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.mutedForeground,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
});
