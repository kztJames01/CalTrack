import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMealStore } from '../../store/mealStore';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import { syncDatabase } from '../../database/sync';
import { colors } from '../../styles/theme';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const router = useRouter();
  const { dailyTotals, loadMealsForDate, selectedDate, setSelectedDate } = useMealStore();
  const { dailyCalorieGoal, proteinGoal, carbsGoal, fatGoal, streakDays, calculateStreak } = useUserStore();
  const { user } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(() => new Date(selectedDate));

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

  const MOCK_NOTIFICATIONS = [
    { id: '1', title: 'Daily goal', body: 'You are 80% toward your calorie target today.', time: '2h ago' },
    { id: '2', title: 'Stay hydrated', body: 'Log your water intake to keep your streak.', time: '5h ago' },
    { id: '3', title: 'Weekly summary', body: 'Your progress report for this week is ready.', time: 'Yesterday' },
  ];

  const openCalendar = () => {
    setPickerMonth(new Date(selectedDate));
    setCalendarOpen(true);
  };

  const pickCalendarDate = (day: Date) => {
    setSelectedDate(day);
    loadMealsForDate(day);
    setCalendarOpen(false);
  };

  const calendarCells = useMemo(() => {
    const year = pickerMonth.getFullYear();
    const month = pickerMonth.getMonth();
    const first = new Date(year, month, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(year, month, d));
    }
    return cells;
  }, [pickerMonth]);

  const shiftPickerMonth = (delta: number) => {
    const next = new Date(pickerMonth);
    next.setMonth(next.getMonth() + delta);
    setPickerMonth(next);
  };

  const calendarCellSize = Math.floor((screenWidth - 72) / 7);

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
          <TouchableOpacity style={styles.headerIconButton} onPress={openCalendar}>
            <Ionicons name="calendar-outline" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => setNotificationsOpen(true)}
          >
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
            <Text style={styles.macroLabel}>Protein: {Math.round(dailyTotals.protein)}g</Text>
          </View>
          <View style={styles.macroItem}>
            <View style={[styles.macroDot, { backgroundColor: colors.secondary }]} />
            <Text style={styles.macroLabel}>Carbs: {Math.round(dailyTotals.carbs)}g</Text>
          </View>
          <View style={styles.macroItem}>
            <View style={[styles.macroDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.macroLabel}>Fat: {Math.round(dailyTotals.fat)}g</Text>
          </View>
        </View>
        {/* Progress bar */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${calorieProgress}%` }]} />
        </View>
      </View>

      <View style={styles.logSection}>
        <TouchableOpacity
          style={styles.logButton}
          onPress={() => router.push('/(tabs)/log-meal' as Href)}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle" size={26} color={colors.secondaryForeground} />
          <Text style={styles.logButtonText}>Log meal</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 24 }} />

      <Modal visible={calendarOpen} transparent animationType="fade" onRequestClose={() => setCalendarOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setCalendarOpen(false)}>
          <Pressable style={styles.calendarPopup} onPress={e => e.stopPropagation()}>
            <View style={styles.calendarPopupHeader}>
              <TouchableOpacity onPress={() => shiftPickerMonth(-1)}>
                <Ionicons name="chevron-back" size={22} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={styles.calendarPopupTitle}>
                {pickerMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => shiftPickerMonth(1)}>
                <Ionicons name="chevron-forward" size={22} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <View style={styles.calendarWeekRow}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <Text key={`${d}-${i}`} style={styles.calendarWeekLabel}>{d}</Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {calendarCells.map((day, i) => {
                if (!day) {
                  return (
                    <View
                      key={`empty-${i}`}
                      style={{ width: calendarCellSize, height: calendarCellSize }}
                    />
                  );
                }
                const selected = day.toDateString() === selectedDate.toDateString();
                const today = day.toDateString() === new Date().toDateString();
                return (
                  <TouchableOpacity
                    key={day.toISOString()}
                    style={[
                      styles.calendarCell,
                      { width: calendarCellSize, height: calendarCellSize },
                      selected && styles.calendarCellSelected,
                      today && !selected && styles.calendarCellToday,
                    ]}
                    onPress={() => pickCalendarDate(day)}
                  >
                    <Text style={[styles.calendarCellText, selected && styles.calendarCellTextSelected]}>
                      {day.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={notificationsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setNotificationsOpen(false)}
      >
        <View style={styles.drawerRoot}>
          <Pressable style={styles.drawerBackdrop} onPress={() => setNotificationsOpen(false)} />
          <View style={styles.notificationDrawer}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setNotificationsOpen(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {MOCK_NOTIFICATIONS.map(n => (
                <View key={n.id} style={styles.notificationItem}>
                  <Text style={styles.notificationTitle}>{n.title}</Text>
                  <Text style={styles.notificationBody}>{n.body}</Text>
                  <Text style={styles.notificationTime}>{n.time}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  logSection: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.secondary,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logButtonText: {
    color: colors.secondaryForeground,
    fontSize: 17,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(37, 50, 56, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  calendarPopup: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calendarPopupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarPopupTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.foreground,
  },
  calendarWeekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarWeekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  calendarCellSelected: {
    backgroundColor: colors.primary,
  },
  calendarCellToday: {
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  calendarCellText: {
    fontSize: 15,
    color: colors.foreground,
    fontWeight: '500',
  },
  calendarCellTextSelected: {
    fontWeight: '700',
  },
  drawerRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(37, 50, 56, 0.35)',
  },
  notificationDrawer: {
    width: screenWidth * 0.82,
    backgroundColor: 'rgba(255, 252, 245, 0.92)',
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
  },
  notificationItem: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: colors.mutedForeground,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 8,
  },
});
