import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Building2,
  CalendarCheck,
  TrendingUp,
  Users,
  Clock,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react-native';
import Header from './Header';
import StatCard from './StatCard';
import api from '../config/api';
import logger from '../utils/logger';

interface CollegeAttendanceItem {
  college: string;
  total: number;
  present: number;
  absent: number;
  rate: number;
}

export const StaffAttendanceView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [colleges, setColleges] = useState<CollegeAttendanceItem[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [todayPresent, setTodayPresent] = useState(0);
  const [todayAbsent, setTodayAbsent] = useState(0);

  const loadAttendanceStats = async () => {
    try {
      const response = await api.get('/colleges/dashboard-stats');
      const list = response.data?.data || [];

      if (Array.isArray(list)) {
        const parsed = list.map((c: any) => ({
          college: c.college || c.name || 'Campus College',
          total: Number(c.total || 0),
          present: Number(c.present || 0),
          absent: Number(c.absent || 0),
          rate: Number(c.rate || 0),
        }));

        setColleges(parsed);
        const tot = parsed.reduce((sum, item) => sum + item.total, 0);
        const pres = parsed.reduce((sum, item) => sum + item.present, 0);
        const abs = parsed.reduce((sum, item) => sum + item.absent, 0);

        setTotalStudents(tot);
        setTodayPresent(pres);
        setTodayAbsent(abs);
      }
    } catch (e: any) {
      logger.error('STAFF_ATTENDANCE', 'Failed to load college attendance stats', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAttendanceStats();
    setRefreshing(false);
  };

  const overallRate = totalStudents > 0 ? (todayPresent / totalStudents) * 100 : 0;

  return (
    <View style={styles.container}>
      <Header title="Attendance Monitoring" subtitle="Institution-wide Attendance Operations" />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.loaderText}>Syncing college attendance records...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Institution Header Card */}
          <View style={styles.summaryCard}>
            <View style={styles.topRow}>
              <View>
                <Text style={styles.summaryLabel}>Today's Overall Attendance</Text>
                <Text style={styles.summaryRate}>{overallRate.toFixed(1)}%</Text>
              </View>
              <View
                style={[
                  styles.rateBadge,
                  { backgroundColor: overallRate >= 75 ? '#DCFCE7' : '#FEF3C7' },
                ]}
              >
                <Text
                  style={[
                    styles.rateBadgeText,
                    { color: overallRate >= 75 ? '#15803D' : '#B45309' },
                  ]}
                >
                  {overallRate >= 75 ? 'Healthy Standing' : 'Below Target'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.breakdownRow}>
              <View style={styles.breakdownCol}>
                <Text style={styles.colLabel}>Total Enrolled</Text>
                <Text style={styles.colVal}>{totalStudents.toLocaleString()}</Text>
              </View>
              <View style={styles.breakdownCol}>
                <Text style={styles.colLabel}>Total Present</Text>
                <Text style={[styles.colVal, { color: '#059669' }]}>
                  {todayPresent.toLocaleString()}
                </Text>
              </View>
              <View style={styles.breakdownCol}>
                <Text style={styles.colLabel}>Total Absent</Text>
                <Text style={[styles.colVal, { color: '#DC2626' }]}>
                  {todayAbsent.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          {/* College-wise Attendance List */}
          <Text style={styles.sectionTitle}>College-wise Attendance Status</Text>

          {colleges.length > 0 ? (
            colleges.map((col, index) => (
              <TouchableOpacity
                key={index}
                style={styles.collegeCard}
                onPress={() =>
                  Alert.alert(
                    col.college,
                    `Total Students: ${col.total}\nPresent: ${col.present}\nAbsent: ${col.absent}\nAttendance Rate: ${col.rate}%`
                  )
                }
                activeOpacity={0.7}
              >
                <View style={styles.collegeHeader}>
                  <View style={styles.collegeIcon}>
                    <Building2 size={18} color="#1E3A8A" />
                  </View>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.collegeTitle} numberOfLines={1}>
                      {col.college}
                    </Text>
                    <Text style={styles.collegeSub}>
                      {col.present.toLocaleString()} Present of {col.total.toLocaleString()}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.collegePercent,
                      { color: col.rate >= 75 ? '#059669' : '#DC2626' },
                    ]}
                  >
                    {col.rate}%
                  </Text>
                </View>

                {/* Progress bar */}
                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.min(col.rate, 100)}%`,
                        backgroundColor: col.rate >= 75 ? '#059669' : '#DC2626',
                      },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                No college attendance records available for today.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  summaryRate: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E3A8A',
    marginTop: 4,
  },
  rateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rateBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownCol: {
    alignItems: 'center',
  },
  colLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 2,
  },
  colVal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  collegeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  collegeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  collegeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  collegeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  collegeSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  collegePercent: {
    fontSize: 16,
    fontWeight: '800',
  },
  barBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
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

export default StaffAttendanceView;
