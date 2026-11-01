import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  CalendarCheck,
  CreditCard,
  Bell,
  BookOpen,
  GraduationCap,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Clock,
  Award,
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import Header from '../../src/components/Header';
import StatCard from '../../src/components/StatCard';
import StaffDashboard from '../../src/components/StaffDashboard';
import studentService from '../../src/services/studentService';
import { StudentUser, StudentAttendanceData, StudentFeeDetails, Announcement } from '../../src/types';
import logger from '../../src/utils/logger';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, userType } = useAuth();

  // If staff or admin user, render Staff Management Dashboard
  if (userType === 'staff' || userType === 'admin') {
    return <StaffDashboard />;
  }

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<StudentUser | null>(user as StudentUser);
  const [attendance, setAttendance] = useState<StudentAttendanceData | null>(null);
  const [feeDetails, setFeeDetails] = useState<StudentFeeDetails | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [layoutSettings, setLayoutSettings] = useState<Record<string, boolean>>({});

  const loadAllStudentData = async () => {
    const admissionNo = (user as any)?.admission_number || (user as any)?.pin_no;
    logger.info('STUDENT_DASHBOARD', `Loading real SDMS data for admission: ${admissionNo}`);

    try {
      const [profRes, attRes, feeRes, noticesRes, layoutRes] = await Promise.allSettled([
        admissionNo ? studentService.getProfile(admissionNo) : Promise.resolve(null),
        studentService.getAttendance(),
        admissionNo ? studentService.getFeeDetails(admissionNo) : Promise.resolve(null),
        studentService.getAnnouncements(),
        studentService.getLayoutSettings(),
      ]);

      if (profRes.status === 'fulfilled' && profRes.value) {
        setProfile(profRes.value);
      }
      if (attRes.status === 'fulfilled' && attRes.value) {
        setAttendance(attRes.value);
      }
      if (feeRes.status === 'fulfilled' && feeRes.value) {
        setFeeDetails(feeRes.value);
      }
      if (noticesRes.status === 'fulfilled' && Array.isArray(noticesRes.value)) {
        setAnnouncements(noticesRes.value.slice(0, 4));
      }
      if (layoutRes.status === 'fulfilled' && layoutRes.value) {
        setLayoutSettings(layoutRes.value);
      }
    } catch (e: any) {
      logger.error('STUDENT_DASHBOARD', 'Failed to load SDMS student data', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllStudentData();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllStudentData();
    setRefreshing(false);
  };

  const student = profile || (user as any);

  // Compute live attendance percentage
  const semesterTotals = attendance?.semester?.totals || attendance?.monthly?.totals;
  const attendanceRate =
    semesterTotals?.percentage !== undefined
      ? semesterTotals.percentage
      : null;

  const dueAmount = feeDetails?.dueAmount !== undefined ? feeDetails.dueAmount : null;

  return (
    <View style={styles.container}>
      <Header
        title={`Hello, ${student?.name?.split(' ')[0] || 'Student'}!`}
        subtitle={`PIN: ${student?.pin_no || student?.admission_number || 'N/A'} • Sem ${student?.current_semester || 1}`}
      />

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.loaderText}>Syncing with SDMS Database...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Real Academic Info Banner */}
          <View style={styles.banner}>
            <GraduationCap size={28} color="#FFFFFF" />
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerCollege}>
                {student?.college || student?.college_name || 'Pydah College'}
              </Text>
              <Text style={styles.bannerCourse}>
                {student?.course || 'Course'} • {student?.branch || 'Branch'}
                {student?.batch ? ` (${student.batch})` : ''}
              </Text>
              {student?.section && (
                <Text style={styles.bannerSection}>Section {student.section}</Text>
              )}
            </View>
          </View>

          {/* Quick Metrics */}
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              label="Live Attendance"
              value={attendanceRate !== null ? `${attendanceRate.toFixed(1)}%` : 'Active'}
              subValue={
                semesterTotals
                  ? `${semesterTotals.present} Present / ${semesterTotals.workingDays} Days`
                  : 'Current Term'
              }
              icon={<TrendingUp size={18} color="#059669" />}
              color={attendanceRate !== null && attendanceRate < 75 ? '#DC2626' : '#059669'}
              style={styles.halfCard}
            />

            <StatCard
              label="Fee Dues"
              value={dueAmount !== null ? `₹${dueAmount.toLocaleString('en-IN')}` : '₹0'}
              subValue={dueAmount && dueAmount > 0 ? 'Pending Payment' : 'No Dues Pending'}
              icon={<CreditCard size={18} color={dueAmount && dueAmount > 0 ? '#DC2626' : '#2563EB'} />}
              color={dueAmount && dueAmount > 0 ? '#DC2626' : '#2563EB'}
              style={styles.halfCard}
            />
          </View>

          {/* Quick Action Navigation */}
          <Text style={styles.sectionTitle}>Academic Portals</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/attendance')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#EFF6FF' }]}>
                <CalendarCheck size={22} color="#1D4ED8" />
              </View>
              <Text style={styles.actionLabel}>Attendance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/fees')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}>
                <CreditCard size={22} color="#15803D" />
              </View>
              <Text style={styles.actionLabel}>Pay Fees</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/announcements')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Bell size={22} color="#B45309" />
              </View>
              <Text style={styles.actionLabel}>Notices</Text>
            </TouchableOpacity>
          </View>

          {/* Real Campus Announcements */}
          <View style={styles.announcementsHeader}>
            <Text style={styles.sectionTitle}>Official Circulars & Notices</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/announcements')}>
              <Text style={styles.viewAllText}>View All ({announcements.length})</Text>
            </TouchableOpacity>
          </View>

          {announcements.length > 0 ? (
            announcements.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.noticeCard}
                onPress={() => router.push('/(tabs)/announcements')}
                activeOpacity={0.7}
              >
                <View style={styles.noticeContent}>
                  <Text style={styles.noticeTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.noticeSnippet} numberOfLines={2}>
                    {item.content}
                  </Text>
                  <View style={styles.noticeMeta}>
                    <Text style={styles.noticeDate}>
                      {new Date(item.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                    {item.category && (
                      <Text style={styles.noticeCategory}>#{item.category}</Text>
                    )}
                  </View>
                </View>
                <ChevronRight size={18} color="#94A3B8" />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyNotice}>
              <Text style={styles.emptyNoticeText}>
                No circulars posted for your department at this time.
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
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  banner: {
    backgroundColor: '#1E3A8A',
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerTextContainer: {
    marginLeft: 14,
    flex: 1,
  },
  bannerCollege: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bannerCourse: {
    color: '#BFDBFE',
    fontSize: 13,
    marginTop: 2,
  },
  bannerSection: {
    color: '#93C5FD',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  halfCard: {
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  announcementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 13,
    color: '#1E3A8A',
    fontWeight: '600',
  },
  noticeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noticeContent: {
    flex: 1,
    marginRight: 10,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  noticeSnippet: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  noticeMeta: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  noticeDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  noticeCategory: {
    fontSize: 11,
    color: '#1E3A8A',
    fontWeight: '600',
  },
  emptyNotice: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyNoticeText: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
  },
});
