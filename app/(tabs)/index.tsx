import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarCheck, CreditCard, Bell, BookOpen, GraduationCap, ChevronRight } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import Header from '../../src/components/Header';
import StatCard from '../../src/components/StatCard';
import studentService from '../../src/services/studentService';
import announcementService from '../../src/services/announcementService';
import { Announcement } from '../../src/types';
import { ENV } from '../../src/config/env';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [attendancePercent, setAttendancePercent] = useState<number>(85);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const loadDashboardData = async () => {
    try {
      const notices = await announcementService.getStudentAnnouncements();
      setAnnouncements(notices.slice(0, 3));

      if (user?.id) {
        const att = await studentService.getAttendance(user.id);
        if (att?.summary?.percentage !== undefined) {
          setAttendancePercent(att.summary.percentage);
        }
      }
    } catch (e) {
      console.warn('Dashboard load non-fatal error', e);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const student = user as any;

  return (
    <View style={styles.container}>
      <Header
        title={`Hello, ${student?.name?.split(' ')[0] || 'Student'}!`}
        subtitle={`Roll No: ${student?.rollNumber || 'PYDAH-STU'} | Sem ${student?.currentSemester || 1}`}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Academic Banner */}
        <View style={styles.banner}>
          <GraduationCap size={28} color="#FFFFFF" />
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerCollege}>{student?.collegeName || 'Pydah College'}</Text>
            <Text style={styles.bannerCourse}>
              {student?.courseName || 'Engineering'} • {student?.branchName || 'CSE'}
            </Text>
          </View>
        </View>

        {/* Overview Stats */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            label="Attendance"
            value={`${attendancePercent}%`}
            subValue={attendancePercent >= 75 ? 'Good Standing' : 'Low Attendance Alert'}
            icon={<CalendarCheck size={18} color="#059669" />}
            color={attendancePercent >= 75 ? '#059669' : '#DC2626'}
            style={styles.halfCard}
          />
          <StatCard
            label="Semester"
            value={`Sem ${student?.currentSemester || 1}`}
            subValue={student?.academicYear || '2025-2026'}
            icon={<BookOpen size={18} color="#2563EB" />}
            color="#2563EB"
            style={styles.halfCard}
          />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
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

        {/* Recent Announcements */}
        <View style={styles.announcementsHeader}>
          <Text style={styles.sectionTitle}>Recent Notices</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/announcements')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {announcements.length > 0 ? (
          announcements.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.noticeCard}
              onPress={() => router.push('/(tabs)/announcements')}
            >
              <View style={styles.noticeContent}>
                <Text style={styles.noticeTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.noticeSnippet} numberOfLines={2}>
                  {item.content}
                </Text>
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyNotice}>
            <Text style={styles.emptyNoticeText}>No new circulars right now.</Text>
          </View>
        )}

        {/* Environment Profile Footer */}
        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>
            EAS Profile: {ENV.appEnv} | Backend: {ENV.apiUrl}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  noticeSnippet: {
    fontSize: 12,
    color: '#64748B',
  },
  emptyNotice: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyNoticeText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  footerInfo: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    color: '#94A3B8',
  },
});

