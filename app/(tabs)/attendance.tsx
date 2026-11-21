import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  ChartColumnIncreasing,
  ChartColumn,
  CheckCircle2,
  AlertTriangle,
  CalendarDays,
  X,
  Info,
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import Header from '../../src/components/Header';
import StaffAttendanceView from '../../src/components/StaffAttendanceView';
import { AttendanceSkeleton } from '../../src/components/SkeletonLoader';
import studentService from '../../src/services/studentService';
import { StudentAttendanceData, AttendanceTotals } from '../../src/types';
import logger from '../../src/utils/logger';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AttendanceScreen() {
  const insets = useSafeAreaInsets();
  const { user, userType } = useAuth();

  // If staff or admin user, render Staff Attendance Monitoring view
  if (userType === 'staff' || userType === 'admin') {
    return <StaffAttendanceView />;
  }

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'semester' | 'monthly' | 'weekly'>('semester');
  const [attendanceData, setAttendanceData] = useState<StudentAttendanceData | null>(null);

  // Calendar State
  const [selectedMonthDate, setSelectedMonthDate] = useState<Date>(() => new Date());

  // Insights Modal State
  const [insightsModalVisible, setInsightsModalVisible] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | 'present' | 'absent' | 'holiday'>('all');

  const fetchAttendance = async () => {
    logger.info('ATTENDANCE_SCREEN', 'Fetching live attendance records');
    try {
      const data = await studentService.getAttendance();
      setAttendanceData(data);
    } catch (e: any) {
      logger.error('ATTENDANCE_SCREEN', 'Failed to fetch attendance', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAttendance();
    setRefreshing(false);
  };

  // Sync initial calendar view with the latest record available in student data
  useEffect(() => {
    if (attendanceData) {
      const dates = [
        ...(attendanceData.semester?.series || []),
        ...(attendanceData.monthly?.series || []),
        ...(attendanceData.weekly?.series || []),
        ...(attendanceData.daily?.records || []),
      ]
        .map((r: any) => r?.date?.split('T')[0])
        .filter(Boolean)
        .sort();

      if (dates.length > 0) {
        const latestDateStr = dates[dates.length - 1];
        const [y, m] = latestDateStr.split('-').map(Number);
        if (y && m) {
          setSelectedMonthDate(new Date(y, m - 1, 1));
        }
      }
    }
  }, [attendanceData]);

  // Handle Tab Switch: Update active tab and navigate calendar to appropriate month
  const handleTabChange = (tab: 'semester' | 'monthly' | 'weekly') => {
    setActiveTab(tab);
    if (tab === 'monthly' || tab === 'weekly') {
      const now = new Date();
      setSelectedMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
    }
  };

  // Resolve totals safely based on active tab
  const getActiveTotals = (): AttendanceTotals => {
    let rawTotals: any = null;
    if (activeTab === 'weekly') {
      rawTotals = attendanceData?.weekly?.totals;
    } else if (activeTab === 'monthly') {
      rawTotals = attendanceData?.monthly?.totals;
    } else {
      rawTotals = attendanceData?.semester?.totals;
    }

    const present = Number(rawTotals?.present ?? 0);
    const absent = Number(rawTotals?.absent ?? 0);
    const workingDays = Number(rawTotals?.workingDays ?? present + absent);
    const rawPct = rawTotals?.percentage ?? rawTotals?.rate;
    const computedPercentage =
      rawPct !== undefined && rawPct !== null && !isNaN(Number(rawPct))
        ? Number(rawPct)
        : workingDays > 0
        ? (present / workingDays) * 100
        : 0;

    return {
      percentage: Number.isFinite(computedPercentage) ? computedPercentage : 0,
      present,
      absent,
      workingDays,
    };
  };

  const getActiveSeries = () => {
    if (activeTab === 'weekly') return attendanceData?.weekly?.series || [];
    if (activeTab === 'monthly') return attendanceData?.monthly?.series || [];
    return attendanceData?.semester?.series || [];
  };

  const totals = getActiveTotals();
  const series = getActiveSeries();
  const isEligible = (totals.percentage || 0) >= 75;

  // Build high-performance lookup map of attendance by date "YYYY-MM-DD"
  const attendanceMap = useMemo(() => {
    const map = new Map<string, { status: 'Present' | 'Absent' | 'Holiday'; reason?: string }>();

    // 1. Incorporate all series
    const allSeries = [
      ...(attendanceData?.semester?.series || []),
      ...(attendanceData?.monthly?.series || []),
      ...(attendanceData?.weekly?.series || []),
    ];
    for (const item of allSeries) {
      if (!item?.date) continue;
      const dateKey = String(item.date).split('T')[0];
      const isPresent = item.status === 'Present' || String(item.status).toLowerCase() === 'present';
      const isHoliday =
        item.isHoliday ||
        item.status === 'Holiday' ||
        String(item.status).toLowerCase() === 'holiday';
      const isAbsent = item.status === 'Absent' || String(item.status).toLowerCase() === 'absent';

      if (isPresent) {
        map.set(dateKey, { status: 'Present' });
      } else if (isAbsent) {
        map.set(dateKey, { status: 'Absent' });
      } else if (isHoliday) {
        map.set(dateKey, { status: 'Holiday', reason: item.holidayReason });
      }
    }

    // 2. Incorporate daily records (fine-grained session attendance)
    const dailyRecords = attendanceData?.daily?.records || [];
    for (const rec of dailyRecords) {
      if (!rec?.date) continue;
      const dateKey = String(rec.date).split('T')[0];
      if (rec.present > 0 && rec.absent === 0) {
        map.set(dateKey, { status: 'Present' });
      } else if (rec.absent > 0 && rec.present === 0) {
        map.set(dateKey, { status: 'Absent' });
      } else if (rec.dayStatus === 'holiday') {
        map.set(dateKey, { status: 'Holiday' });
      } else if (rec.dayStatus === 'present') {
        map.set(dateKey, { status: 'Present' });
      } else if (rec.dayStatus === 'absent') {
        map.set(dateKey, { status: 'Absent' });
      }
    }

    return map;
  }, [attendanceData]);

  // Comprehensive Daily Activity Log incorporating ALL days (no truncations)
  const fullActivityLog = useMemo(() => {
    const map = new Map<
      string,
      {
        date: string;
        status: 'Present' | 'Absent' | 'Holiday';
        reason?: string;
        sessions?: any[];
      }
    >();

    // 1. From semester, monthly, and weekly series
    const allSeries = [
      ...(attendanceData?.semester?.series || []),
      ...(attendanceData?.monthly?.series || []),
      ...(attendanceData?.weekly?.series || []),
    ];
    for (const item of allSeries) {
      if (!item?.date) continue;
      const dateKey = String(item.date).split('T')[0];
      const isPresent =
        item.status === 'Present' || String(item.status).toLowerCase() === 'present';
      const isHoliday =
        item.isHoliday ||
        item.status === 'Holiday' ||
        String(item.status).toLowerCase() === 'holiday';
      const isAbsent =
        item.status === 'Absent' || String(item.status).toLowerCase() === 'absent';

      const status: 'Present' | 'Absent' | 'Holiday' = isPresent
        ? 'Present'
        : isAbsent
        ? 'Absent'
        : isHoliday
        ? 'Holiday'
        : 'Present';

      if (!map.has(dateKey)) {
        map.set(dateKey, { date: dateKey, status, reason: item.holidayReason });
      }
    }

    // 2. From daily records (fine-grained sessions)
    const dailyRecords = attendanceData?.daily?.records || [];
    for (const rec of dailyRecords) {
      if (!rec?.date) continue;
      const dateKey = String(rec.date).split('T')[0];
      const status: 'Present' | 'Absent' | 'Holiday' =
        rec.present > 0 && rec.absent === 0
          ? 'Present'
          : rec.absent > 0 && rec.present === 0
          ? 'Absent'
          : rec.dayStatus === 'holiday'
          ? 'Holiday'
          : rec.dayStatus === 'present'
          ? 'Present'
          : rec.dayStatus === 'absent'
          ? 'Absent'
          : 'Present';

      map.set(dateKey, {
        date: dateKey,
        status,
        sessions: rec.sessions,
      });
    }

    // Convert to array and sort descending by date (latest first)
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [attendanceData]);

  // Filtered log based on selected logFilter ('all' | 'present' | 'absent' | 'holiday')
  const filteredActivityLog = useMemo(() => {
    if (logFilter === 'all') return fullActivityLog;
    return fullActivityLog.filter(
      (item) => item.status.toLowerCase() === logFilter.toLowerCase()
    );
  }, [fullActivityLog, logFilter]);

  // Calendar Month Navigation
  const handlePrevMonth = () => {
    setSelectedMonthDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setSelectedMonthDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  // Generate 7-column Calendar Grid for selected month
  const calendarGrid = useMemo(() => {
    const year = selectedMonthDate.getFullYear();
    const month = selectedMonthDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon ...
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const grid: Array<{
      day: number | null;
      dateKey?: string;
      status?: 'Present' | 'Absent' | 'Holiday' | 'Normal';
      isSunday?: boolean;
    }> = [];

    // Leading empty slots
    for (let i = 0; i < firstDayIndex; i++) {
      grid.push({ day: null });
    }

    // Actual days of month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(year, month, d).getDay();
      const isSunday = dayOfWeek === 0;

      let status: 'Present' | 'Absent' | 'Holiday' | 'Normal' = 'Normal';
      const record = attendanceMap.get(dateKey);

      if (record) {
        status = record.status;
      } else if (isSunday) {
        status = 'Holiday';
      }

      grid.push({
        day: d,
        dateKey,
        status,
        isSunday,
      });
    }

    return grid;
  }, [selectedMonthDate, attendanceMap]);

  // Handle Day Cell Click
  const handleDayPress = (dayItem: any) => {
    if (!dayItem.day || !dayItem.dateKey) return;
    const record = attendanceMap.get(dayItem.dateKey);
    const dateFormatted = new Date(dayItem.dateKey).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    if (record) {
      Alert.alert(
        `${dateFormatted}`,
        `Status: ${record.status}${record.reason ? `\nReason: ${record.reason}` : ''}`
      );
    } else if (dayItem.isSunday) {
      Alert.alert(`${dateFormatted}`, 'Status: Sunday Holiday');
    }
  };

  const monthYearTitle = selectedMonthDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={styles.container}>
      {/* 1. TOP HEADER */}
      <Header
        title="Attendance Tracker"
        subtitle="SDMS Live Academic Attendance"
        showBack
      />

      {/* 2. RANGE FILTER PILLS: Semester | This Month | This Week */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'semester' && styles.tabBtnActive]}
          onPress={() => handleTabChange('semester')}
          activeOpacity={0.8}
        >
          <Text
            style={[styles.tabText, activeTab === 'semester' && styles.tabTextActive]}
          >
            Semester
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'monthly' && styles.tabBtnActive]}
          onPress={() => handleTabChange('monthly')}
          activeOpacity={0.8}
        >
          <Text
            style={[styles.tabText, activeTab === 'monthly' && styles.tabTextActive]}
          >
            This Month
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'weekly' && styles.tabBtnActive]}
          onPress={() => handleTabChange('weekly')}
          activeOpacity={0.8}
        >
          <Text
            style={[styles.tabText, activeTab === 'weekly' && styles.tabTextActive]}
          >
            This Week
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <AttendanceSkeleton />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 16) + 72 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0047BA']}
              tintColor="#0047BA"
            />
          }
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS === 'android'}
          scrollEventThrottle={16}
          overScrollMode="never"
        >
          {/* 3. 4 METRIC STATS ROW (Matching exact design) */}
          <View style={styles.metricsRow}>
            {/* Card 1: Percentage */}
            <View style={[styles.metricCard, styles.metricCardBlue]}>
              <Text style={styles.metricCardPercentage}>
                {(totals.percentage ?? 0).toFixed(1)}%
              </Text>
              <View style={styles.metricSubRow}>
                <Text style={styles.metricSubLabelBlue}>
                  {activeTab === 'semester'
                    ? 'Semester'
                    : activeTab === 'monthly'
                    ? 'Month'
                    : 'Week'}
                </Text>
                <ChartColumnIncreasing size={13} color="#0052CC" />
              </View>
            </View>

            {/* Card 2: Working Days */}
            <View style={[styles.metricCard, styles.metricCardSlate]}>
              <Text style={styles.metricCardNumberDark}>{totals.workingDays}</Text>
              <Text style={styles.metricCardLabel}>Working</Text>
            </View>

            {/* Card 3: Present Days */}
            <View style={[styles.metricCard, styles.metricCardGreen]}>
              <Text style={styles.metricCardNumberGreen}>{totals.present}</Text>
              <Text style={styles.metricCardLabelGreen}>Present</Text>
            </View>

            {/* Card 4: Absent Days */}
            <View style={[styles.metricCard, styles.metricCardRed]}>
              <Text style={styles.metricCardNumberRed}>{totals.absent}</Text>
              <Text style={styles.metricCardLabelRed}>Absent</Text>
            </View>
          </View>

          {/* 4. INTERACTIVE MONTHLY CALENDAR CARD */}
          <View style={styles.calendarCard}>
            {/* Calendar Navigation Header */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                onPress={handlePrevMonth}
                style={styles.calendarNavBtn}
                hitSlop={12}
                activeOpacity={0.7}
              >
                <ChevronLeft size={22} color="#0F172A" />
              </TouchableOpacity>

              <Text style={styles.calendarMonthTitle}>{monthYearTitle}</Text>

              <TouchableOpacity
                onPress={handleNextMonth}
                style={styles.calendarNavBtn}
                hitSlop={12}
                activeOpacity={0.7}
              >
                <ChevronRight size={22} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {/* Weekdays Row: Sun Mon Tue Wed Thu Fri Sat */}
            <View style={styles.daysHeaderRow}>
              {WEEKDAYS.map((day) => (
                <View key={day} style={styles.dayHeaderCell}>
                  <Text style={styles.dayHeaderText}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Calendar 7-Column Days Grid */}
            <View style={styles.calendarGrid}>
              {calendarGrid.map((item, idx) => {
                if (!item.day) {
                  return <View key={`blank_${idx}`} style={styles.dayCellWrapper} />;
                }

                const isPresent = item.status === 'Present';
                const isAbsent = item.status === 'Absent';
                const isHoliday = item.status === 'Holiday';

                return (
                  <TouchableOpacity
                    key={`day_${item.dateKey || idx}`}
                    style={styles.dayCellWrapper}
                    onPress={() => handleDayPress(item)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.dayCircle,
                        isPresent && styles.dayCirclePresent,
                        isAbsent && styles.dayCircleAbsent,
                        isHoliday && styles.dayCircleHoliday,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isPresent && styles.dayTextPresent,
                          isAbsent && styles.dayTextAbsent,
                          isHoliday && styles.dayTextHoliday,
                        ]}
                      >
                        {item.day}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 5. ATTENDANCE INSIGHTS CARD */}
          <TouchableOpacity
            style={styles.insightsCard}
            onPress={() => setInsightsModalVisible(true)}
            activeOpacity={0.85}
          >
            <View style={styles.insightsLeft}>
              <View style={styles.insightsIconBox}>
                <ChartColumn size={20} color="#0047BA" />
              </View>
              <View>
                <Text style={styles.insightsTitle}>Attendance Insights</Text>
                <Text style={styles.insightsLink}>View detailed report &gt;</Text>
              </View>
            </View>
            <View style={styles.insightsArrowCircle}>
              <ChevronRight size={17} color="#0047BA" />
            </View>
          </TouchableOpacity>

          {/* 6. STATUS LEGEND ROW */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDotGreen]} />
              <Text style={styles.legendText}>Present</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDotRed]} />
              <Text style={styles.legendText}>Absent</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDotYellow]} />
              <Text style={styles.legendText}>Holiday</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* DETAILED ATTENDANCE INSIGHTS MODAL */}
      <Modal
        visible={insightsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInsightsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderTitleGroup}>
                <View style={styles.modalIconBox}>
                  <ChartColumnIncreasing size={20} color="#0047BA" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Attendance Analysis</Text>
                  <Text style={styles.modalSubtitle}>Academic Eligibility & Logs</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setInsightsModalVisible(false)}
                style={styles.modalCloseBtn}
                hitSlop={8}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Examination Eligibility Banner */}
              <View
                style={[
                  styles.eligibilityBanner,
                  isEligible ? styles.eligibilitySuccess : styles.eligibilityWarning,
                ]}
              >
                {isEligible ? (
                  <CheckCircle2 size={18} color="#15803D" />
                ) : (
                  <AlertTriangle size={18} color="#B91C1C" />
                )}
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.eligibilityTitle,
                      isEligible ? styles.textSuccess : styles.textDanger,
                    ]}
                  >
                    {isEligible
                      ? 'Examination Eligible (≥ 75%)'
                      : 'Shortage of Attendance (< 75%)'}
                  </Text>
                  <Text style={styles.eligibilitySubtitle}>
                    {isEligible
                      ? `Your overall attendance of ${(totals.percentage || 0).toFixed(
                          1
                        )}% satisfies college examination guidelines.`
                      : `Your attendance is ${(totals.percentage || 0).toFixed(
                          1
                        )}%. Regular attendance in upcoming sessions is advised.`}
                  </Text>
                </View>
              </View>

              {/* Summary Stats Grid */}
              <View style={styles.modalStatsGrid}>
                <View style={styles.modalStatItem}>
                  <Text style={styles.modalStatLabel}>Total Sessions</Text>
                  <Text style={styles.modalStatVal}>{totals.workingDays}</Text>
                </View>
                <View style={styles.modalStatItem}>
                  <Text style={styles.modalStatLabel}>Present Days</Text>
                  <Text style={[styles.modalStatVal, { color: '#16A34A' }]}>
                    {totals.present}
                  </Text>
                </View>
                <View style={styles.modalStatItem}>
                  <Text style={styles.modalStatLabel}>Absent Days</Text>
                  <Text style={[styles.modalStatVal, { color: '#DC2626' }]}>
                    {totals.absent}
                  </Text>
                </View>
                <View style={styles.modalStatItem}>
                  <Text style={styles.modalStatLabel}>Percentage</Text>
                  <Text style={[styles.modalStatVal, { color: '#0047BA' }]}>
                    {(totals.percentage || 0).toFixed(1)}%
                  </Text>
                </View>
              </View>

              {/* Daily Records Log Header */}
              <View style={styles.modalLogHeaderRow}>
                <Text style={styles.modalSectionTitle}>
                  Daily Activity Log ({filteredActivityLog.length} Days)
                </Text>
              </View>

              {/* Filter Chips inside Modal: All | Present | Absent | Holiday */}
              <View style={styles.modalFilterRow}>
                <TouchableOpacity
                  style={[
                    styles.modalFilterChip,
                    logFilter === 'all' && styles.modalFilterChipActive,
                  ]}
                  onPress={() => setLogFilter('all')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.modalFilterChipText,
                      logFilter === 'all' && styles.modalFilterChipTextActive,
                    ]}
                  >
                    All ({fullActivityLog.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalFilterChip,
                    logFilter === 'present' && styles.modalFilterChipActiveGreen,
                  ]}
                  onPress={() => setLogFilter('present')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.modalFilterChipText,
                      logFilter === 'present' && styles.modalFilterChipTextGreen,
                    ]}
                  >
                    Present ({totals.present})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalFilterChip,
                    logFilter === 'absent' && styles.modalFilterChipActiveRed,
                  ]}
                  onPress={() => setLogFilter('absent')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.modalFilterChipText,
                      logFilter === 'absent' && styles.modalFilterChipTextRed,
                    ]}
                  >
                    Absent ({totals.absent})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalFilterChip,
                    logFilter === 'holiday' && styles.modalFilterChipActiveYellow,
                  ]}
                  onPress={() => setLogFilter('holiday')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.modalFilterChipText,
                      logFilter === 'holiday' && styles.modalFilterChipTextYellow,
                    ]}
                  >
                    Holiday
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Complete List of Daily Records (No 15-item limit!) */}
              {filteredActivityLog.length > 0 ? (
                filteredActivityLog.map((item, idx) => {
                  const isPres =
                    item.status === 'Present' || String(item.status).toLowerCase() === 'present';
                  const isAbs =
                    item.status === 'Absent' || String(item.status).toLowerCase() === 'absent';
                  const isHol =
                    item.status === 'Holiday' || String(item.status).toLowerCase() === 'holiday';

                  return (
                    <View key={item.date || idx} style={styles.logRow}>
                      <View style={styles.logLeft}>
                        <CalendarDays size={16} color="#64748B" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.logDate}>
                            {new Date(item.date).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </Text>
                          {item.reason && (
                            <Text style={styles.logReason}>{item.reason}</Text>
                          )}
                        </View>
                      </View>
                      <View
                        style={[
                          styles.logPill,
                          isPres && styles.pillPresent,
                          isAbs && styles.pillAbsent,
                          isHol && styles.pillHoliday,
                        ]}
                      >
                        <Text
                          style={[
                            styles.logPillText,
                            isPres && styles.textPresent,
                            isAbs && styles.textAbsent,
                            isHol && styles.textHoliday,
                          ]}
                        >
                          {item.status}
                        </Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptyLogText}>No records found for this filter.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  // 1. FILTER TABS (Semester | This Month | This Week)
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
  },
  tabBtnActive: {
    backgroundColor: '#0047BA',
    shadowColor: '#0047BA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  content: {
    padding: 14,
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  // 2. 4 METRIC CARDS ROW
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  metricCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: 82,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  metricCardBlue: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
  },
  metricCardSlate: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  metricCardGreen: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  metricCardRed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  metricCardPercentage: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0A2540',
    letterSpacing: -0.3,
  },
  metricSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  metricSubLabelBlue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0052CC',
  },
  metricCardNumberDark: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  metricCardLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
    marginTop: 3,
  },
  metricCardNumberGreen: {
    fontSize: 20,
    fontWeight: '900',
    color: '#16A34A',
  },
  metricCardLabelGreen: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#15803D',
    marginTop: 3,
  },
  metricCardNumberRed: {
    fontSize: 20,
    fontWeight: '900',
    color: '#DC2626',
  },
  metricCardLabelRed: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#B91C1C',
    marginTop: 3,
  },
  // 3. MONTHLY CALENDAR CARD
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  calendarMonthTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  calendarNavBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  daysHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellWrapper: {
    width: '14.28%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4.5,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCirclePresent: {
    backgroundColor: '#DCFCE7',
  },
  dayCircleAbsent: {
    backgroundColor: '#FEE2E2',
  },
  dayCircleHoliday: {
    backgroundColor: '#FEF3C7',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  dayTextPresent: {
    color: '#15803D',
    fontWeight: '800',
  },
  dayTextAbsent: {
    color: '#B91C1C',
    fontWeight: '800',
  },
  dayTextHoliday: {
    color: '#B45309',
    fontWeight: '800',
  },
  // 4. ATTENDANCE INSIGHTS CARD
  insightsCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  insightsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  insightsIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0A2540',
  },
  insightsLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0052CC',
    marginTop: 2,
  },
  insightsArrowCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 5. STATUS LEGEND ROW
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendDotGreen: {
    backgroundColor: '#22C55E',
  },
  legendDotRed: {
    backgroundColor: '#EF4444',
  },
  legendDotYellow: {
    backgroundColor: '#F59E0B',
  },
  legendText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  // 6. INSIGHTS MODAL
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
    maxHeight: '85%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  modalHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  eligibilityBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
  eligibilitySuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  eligibilityWarning: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  eligibilityTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  eligibilitySubtitle: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    lineHeight: 16,
  },
  textSuccess: {
    color: '#15803D',
  },
  textDanger: {
    color: '#B91C1C',
  },
  modalStatsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  modalStatItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalStatLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  modalStatVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalLogHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 6,
  },
  modalFilterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  modalFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  modalFilterChipActive: {
    backgroundColor: '#0047BA',
  },
  modalFilterChipActiveGreen: {
    backgroundColor: '#DCFCE7',
  },
  modalFilterChipActiveRed: {
    backgroundColor: '#FEE2E2',
  },
  modalFilterChipActiveYellow: {
    backgroundColor: '#FEF3C7',
  },
  modalFilterChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  modalFilterChipTextActive: {
    color: '#FFFFFF',
  },
  modalFilterChipTextGreen: {
    color: '#15803D',
  },
  modalFilterChipTextRed: {
    color: '#B91C1C',
  },
  modalFilterChipTextYellow: {
    color: '#B45309',
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logDate: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  logReason: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 1,
  },
  logPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pillPresent: {
    backgroundColor: '#DCFCE7',
  },
  pillAbsent: {
    backgroundColor: '#FEE2E2',
  },
  pillHoliday: {
    backgroundColor: '#FEF3C7',
  },
  logPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  textPresent: {
    color: '#15803D',
  },
  textAbsent: {
    color: '#B91C1C',
  },
  textHoliday: {
    color: '#B45309',
  },
  emptyLogText: {
    fontSize: 12.5,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
