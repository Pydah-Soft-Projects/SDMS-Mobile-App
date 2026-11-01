import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Calendar, CheckCircle2, XCircle, Clock, AlertTriangle, CalendarDays } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import Header from '../../src/components/Header';
import StaffAttendanceView from '../../src/components/StaffAttendanceView';
import studentService from '../../src/services/studentService';
import { StudentAttendanceData, AttendanceTotals } from '../../src/types';
import logger from '../../src/utils/logger';

export default function AttendanceScreen() {
  const { user, userType } = useAuth();

  // If staff or admin user, render Staff Attendance Monitoring view
  if (userType === 'staff' || userType === 'admin') {
    return <StaffAttendanceView />;
  }
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'semester' | 'monthly' | 'weekly'>('semester');
  const [attendanceData, setAttendanceData] = useState<StudentAttendanceData | null>(null);

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
    const workingDays = Number(rawTotals?.workingDays ?? (present + absent));
    const rawPct = rawTotals?.percentage ?? rawTotals?.rate;
    const computedPercentage =
      rawPct !== undefined && rawPct !== null && !isNaN(Number(rawPct))
        ? Number(rawPct)
        : (workingDays > 0 ? (present / workingDays) * 100 : 0);

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

  return (
    <View style={styles.container}>
      <Header title="Attendance Tracker" subtitle="SDMS Live Academic Attendance" />

      {/* Range Filter Selector */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'semester' && styles.tabBtnActive]}
          onPress={() => setActiveTab('semester')}
        >
          <Text style={[styles.tabText, activeTab === 'semester' && styles.tabTextActive]}>
            Semester
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'monthly' && styles.tabBtnActive]}
          onPress={() => setActiveTab('monthly')}
        >
          <Text style={[styles.tabText, activeTab === 'monthly' && styles.tabTextActive]}>
            This Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'weekly' && styles.tabBtnActive]}
          onPress={() => setActiveTab('weekly')}
        >
          <Text style={[styles.tabText, activeTab === 'weekly' && styles.tabTextActive]}>
            This Week
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.loaderText}>Loading attendance data...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Main Attendance Score Card */}
          <View style={styles.overviewCard}>
            <View
              style={[
                styles.percentageCircle,
                { borderColor: isEligible ? '#059669' : '#DC2626' },
              ]}
            >
              <Text
                style={[
                  styles.percentageText,
                  { color: isEligible ? '#059669' : '#DC2626' },
                ]}
              >
                {(totals?.percentage ?? 0).toFixed(1)}%
              </Text>
              <Text style={styles.percentageSub}>
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </Text>
            </View>

            <View style={styles.statsColumn}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Working Days:</Text>
                <Text style={styles.statVal}>{totals.workingDays}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Present Days:</Text>
                <Text style={[styles.statVal, { color: '#059669' }]}>{totals.present}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Absent Days:</Text>
                <Text style={[styles.statVal, { color: '#DC2626' }]}>{totals.absent}</Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  isEligible ? styles.badgeSuccess : styles.badgeDanger,
                ]}
              >
                {isEligible ? (
                  <CheckCircle2 size={12} color="#15803D" />
                ) : (
                  <AlertTriangle size={12} color="#B91C1C" />
                )}
                <Text
                  style={[
                    styles.statusBadgeText,
                    isEligible ? styles.badgeTextSuccess : styles.badgeTextDanger,
                  ]}
                >
                  {isEligible ? 'Examination Eligible (≥75%)' : 'Shortage of Attendance (<75%)'}
                </Text>
              </View>
            </View>
          </View>

          {/* Daily Records List */}
          <Text style={styles.sectionHeader}>
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Daily Log ({series.length} Days)
          </Text>

          {series.length > 0 ? (
            series.map((item, idx) => {
              const isPresent = item.status === 'Present';
              const isHoliday = item.isHoliday || item.status === 'Holiday';
              const isAbsent = item.status === 'Absent';

              return (
                <View key={item.date || idx} style={styles.dayCard}>
                  <View style={styles.dayLeft}>
                    <CalendarDays size={18} color="#64748B" />
                    <View>
                      <Text style={styles.dayDate}>
                        {new Date(item.date).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                      {item.holidayReason && (
                        <Text style={styles.holidayReason}>{item.holidayReason}</Text>
                      )}
                    </View>
                  </View>

                  <View
                    style={[
                      styles.dayStatusPill,
                      isPresent && styles.pillPresent,
                      isAbsent && styles.pillAbsent,
                      isHoliday && styles.pillHoliday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayStatusText,
                        isPresent && styles.textPresent,
                        isAbsent && styles.textAbsent,
                        isHoliday && styles.textHoliday,
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                No daily attendance logs found for this period.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  tabBtnActive: {
    backgroundColor: '#1E3A8A',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loaderText: {
    fontSize: 13,
    color: '#64748B',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  percentageCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  percentageText: {
    fontSize: 22,
    fontWeight: '800',
  },
  percentageSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statsColumn: {
    flex: 1,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  statVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeSuccess: {
    backgroundColor: '#DCFCE7',
  },
  badgeDanger: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextSuccess: {
    color: '#15803D',
  },
  badgeTextDanger: {
    color: '#B91C1C',
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dayDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  holidayReason: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  dayStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
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
  dayStatusText: {
    fontSize: 11,
    fontWeight: '700',
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
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
  },
});
