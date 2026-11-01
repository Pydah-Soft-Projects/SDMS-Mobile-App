import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import Header from '../../src/components/Header';
import studentService from '../../src/services/studentService';
import { AttendanceSummary, SubjectAttendance } from '../../src/types';

export default function AttendanceScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<AttendanceSummary>({
    totalClasses: 120,
    attendedClasses: 104,
    percentage: 86.6,
  });
  const [subjects, setSubjects] = useState<SubjectAttendance[]>([
    {
      subjectCode: 'CS501',
      subjectName: 'Design & Analysis of Algorithms',
      totalClasses: 32,
      attendedClasses: 29,
      percentage: 90.6,
      facultyName: 'Dr. Ramesh Kumar',
    },
    {
      subjectCode: 'CS502',
      subjectName: 'Database Management Systems',
      totalClasses: 30,
      attendedClasses: 25,
      percentage: 83.3,
      facultyName: 'Prof. Anitha S.',
    },
    {
      subjectCode: 'CS503',
      subjectName: 'Operating Systems',
      totalClasses: 28,
      attendedClasses: 24,
      percentage: 85.7,
      facultyName: 'Mr. P. Satyanarayana',
    },
    {
      subjectCode: 'CS504',
      subjectName: 'Software Engineering',
      totalClasses: 30,
      attendedClasses: 26,
      percentage: 86.6,
      facultyName: 'Mrs. K. Lakshmi',
    },
  ]);

  const fetchAttendance = async () => {
    try {
      if (user?.id) {
        const res = await studentService.getAttendance(user.id);
        if (res?.summary) setSummary(res.summary);
        if (res?.subjects?.length) setSubjects(res.subjects);
      }
    } catch (e) {
      console.warn('Could not load live attendance, using defaults', e);
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

  return (
    <View style={styles.container}>
      <Header title="Attendance Tracker" subtitle="Current Semester Attendance" />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#1E3A8A" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Main Attendance Card */}
          <View style={styles.overviewCard}>
            <View style={styles.percentageCircle}>
              <Text style={styles.percentageText}>{summary.percentage.toFixed(1)}%</Text>
              <Text style={styles.percentageSub}>Overall</Text>
            </View>
            <View style={styles.statsColumn}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Total Classes:</Text>
                <Text style={styles.statVal}>{summary.totalClasses}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Attended Classes:</Text>
                <Text style={[styles.statVal, { color: '#059669' }]}>
                  {summary.attendedClasses}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Missed Classes:</Text>
                <Text style={[styles.statVal, { color: '#DC2626' }]}>
                  {summary.totalClasses - summary.attendedClasses}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  summary.percentage >= 75 ? styles.badgeSuccess : styles.badgeDanger,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    summary.percentage >= 75 ? styles.badgeTextSuccess : styles.badgeTextDanger,
                  ]}
                >
                  {summary.percentage >= 75 ? 'Eligible for Exams (>75%)' : 'Attendance Shortage'}
                </Text>
              </View>
            </View>
          </View>

          {/* Subject Wise Breakdown */}
          <Text style={styles.sectionHeader}>Subject-wise Attendance</Text>

          {subjects.map((sub, idx) => {
            const isGood = sub.percentage >= 75;
            return (
              <View key={sub.subjectCode || idx} style={styles.subjectCard}>
                <View style={styles.subjectHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subjectTitle}>{sub.subjectName}</Text>
                    <Text style={styles.subjectSub}>
                      {sub.subjectCode} {sub.facultyName ? `• ${sub.facultyName}` : ''}
                    </Text>
                  </View>
                  <Text style={[styles.subjectPercent, { color: isGood ? '#059669' : '#DC2626' }]}>
                    {sub.percentage.toFixed(1)}%
                  </Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(sub.percentage, 100)}%`,
                        backgroundColor: isGood ? '#059669' : '#DC2626',
                      },
                    ]}
                  />
                </View>

                <View style={styles.subjectFooter}>
                  <Text style={styles.subDetail}>
                    Classes: {sub.attendedClasses} / {sub.totalClasses}
                  </Text>
                  <Text style={[styles.subDetail, { color: isGood ? '#059669' : '#DC2626' }]}>
                    {isGood ? 'On Track' : 'Needs Attention'}
                  </Text>
                </View>
              </View>
            );
          })}
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
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EEF2FF',
    borderWidth: 4,
    borderColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  percentageText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E3A8A',
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
    marginTop: 8,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  subjectTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  subjectSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  subjectPercent: {
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  subjectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subDetail: {
    fontSize: 12,
    color: '#64748B',
  },
});

