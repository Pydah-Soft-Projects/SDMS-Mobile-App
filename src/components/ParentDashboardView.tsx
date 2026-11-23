import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User,
  Calendar,
  CreditCard,
  ChevronRight,
  GraduationCap,
  Building2,
  BookOpen,
  Clock,
  Bus,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MapPin,
  RotateCw,
  ArrowRight,
  ArrowUpDown,
  ShieldCheck,
  Award,
  Layers,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import parentService, { ParentChildSummary, ParentDashboardSummary } from '../services/parentService';
import { getStaticFileUrl } from '../config/api';
import { DashboardSkeleton } from './SkeletonLoader';
import DigitalStudentIdCardModal from './DigitalStudentIdCardModal';

export const ParentDashboardView: React.FC = () => {
  const router = useRouter();
  const { user, switchChild } = useAuth();
  const parentUser = user as any;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<ParentDashboardSummary | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [feeSummary, setFeeSummary] = useState<any>(null);
  const [childrenList, setChildrenList] = useState<ParentChildSummary[]>(() => {
    if (Array.isArray(parentUser?.students) && parentUser.students.length > 0) {
      return parentUser.students;
    }
    return [];
  });
  const [switchingChildId, setSwitchingChildId] = useState<number | string | null>(null);
  const [showIdCardModal, setShowIdCardModal] = useState(false);

  // Dynamic greeting: Good Morning, Good Afternoon, or Good Evening
  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const loadAllData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [summaryRes, profileRes, feeRes, childrenRes] = await Promise.allSettled([
        parentService.getDashboardSummary(),
        parentService.getProfile(),
        parentService.getFees(),
        parentService.getChildren(),
      ]);

      if (summaryRes.status === 'fulfilled' && summaryRes.value) {
        setDashboardData(summaryRes.value);
      }
      if (profileRes.status === 'fulfilled' && profileRes.value) {
        setProfileData(profileRes.value);
      }
      if (feeRes.status === 'fulfilled' && feeRes.value) {
        setFeeSummary(feeRes.value);
      }
      if (childrenRes.status === 'fulfilled' && Array.isArray(childrenRes.value)) {
        setChildrenList(childrenRes.value);
      } else if (Array.isArray(parentUser?.students) && parentUser.students.length > 0) {
        setChildrenList(parentUser.students);
      }
    } catch (e) {
      console.error('Failed to load parent dashboard:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [parentUser?.students]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData, parentUser?.studentId, parentUser?.id]);

  const handleSwitchChild = async (childId: number | string) => {
    if (String(childId) === String(parentUser?.studentId || parentUser?.id)) return;
    try {
      setSwitchingChildId(childId);
      const success = await switchChild(childId);
      if (success) {
        await loadAllData();
      } else {
        Alert.alert('Switch Child', 'Could not switch active child. Please try again.');
      }
    } catch {
      Alert.alert('Error', 'Failed to switch child.');
    } finally {
      setSwitchingChildId(null);
    }
  };

  // Student display details
  const student = profileData || dashboardData?.student || parentUser;
  const studentName = student?.student_name || student?.name || 'Student';
  const admissionNo = student?.admission_number || student?.pin_no || 'N/A';
  const pinNo = student?.pin_no || student?.roll_number || admissionNo;
  const collegeName = student?.college || student?.college_name || 'Pydah College of Engineering';
  const courseBranch = `${student?.course || 'B.Tech'} • ${student?.branch || 'CSE'}`;
  const yearSem = `Year ${student?.current_year || 1} / Sem ${student?.current_semester || 1}`;

  const photoUri = student?.student_photo || student?.avatarUrl;
  const photoUrl = photoUri ? getStaticFileUrl(photoUri) : null;

  // Attendance metrics
  const attendance = dashboardData?.attendance;
  const attendancePercentage = useMemo(() => {
    if (attendance?.percentage !== undefined && attendance?.percentage !== null) {
      return Number(attendance.percentage).toFixed(1);
    }
    const weeklyTotals = attendance?.weekly?.totals;
    const monthlyTotals = attendance?.monthly?.totals;
    const semesterTotals = attendance?.semester?.totals;
    const totals = semesterTotals || monthlyTotals || weeklyTotals;
    if (totals?.percentage !== undefined) {
      return Number(totals.percentage).toFixed(1);
    }
    if (totals?.present !== undefined && totals?.workingDays) {
      return ((totals.present / totals.workingDays) * 100).toFixed(1);
    }
    return '85.0';
  }, [attendance]);

  const todayStatus = attendance?.todayStatus || 'Present';

  // Fee metrics
  const feeDuesAmount = useMemo(() => {
    if (dashboardData?.fees?.totalDue !== undefined) {
      return Number(dashboardData.fees.totalDue);
    }
    if (feeSummary?.totals?.due !== undefined) {
      return Number(feeSummary.totals.due);
    }
    if (Array.isArray(feeSummary?.invoices)) {
      const invTotal = feeSummary.invoices.reduce((acc: number, inv: any) => acc + (Number(inv.amount) || 0), 0);
      const paidTotal = Array.isArray(feeSummary?.transactions)
        ? feeSummary.transactions.reduce((acc: number, tx: any) => acc + (Number(tx.amount) || 0), 0)
        : 0;
      return Math.max(0, invTotal - paidTotal);
    }
    return 0;
  }, [dashboardData, feeSummary]);

  const todayClasses = dashboardData?.todayClasses || [];
  const announcements = dashboardData?.latestAnnouncements || [];

  if (loading && !dashboardData && !profileData) {
    return (
      <View style={styles.container}>
        <Header
          title={greetingText}
          tagText="Parent"
          tagColor="#B47B2B"
        />
        <DashboardSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header matching Image 1: [Campo Logo] | Good Morning Parent */}
      <Header
        title={greetingText}
        tagText="Parent"
        tagColor="#B47B2B"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadAllData(true)} tintColor="#0047BA" />
        }
      >
        {/* ROYAL BLUE WARD HERO CARD */}
        <LinearGradient
          colors={['#003896', '#0047BA', '#0284C7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          {/* Top Badges Row */}
          <View style={styles.heroTopRow}>
            <View style={styles.parentRolePill}>
              <ShieldCheck size={12} color="#FFFFFF" />
              <Text style={styles.parentRolePillText}>PARENT PORTAL</Text>
            </View>

            {childrenList.length > 1 && (
              <TouchableOpacity
                style={styles.switchChildBtn}
                onPress={() => {
                  const nextChild = childrenList.find((c) => String(c.id) !== String(parentUser?.studentId || parentUser?.id));
                  if (nextChild) handleSwitchChild(nextChild.id);
                }}
                disabled={switchingChildId !== null}
                activeOpacity={0.8}
              >
                {switchingChildId !== null ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <ArrowUpDown size={12} color="#FFFFFF" />
                    <Text style={styles.switchChildBtnText}>Switch Ward</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Student Avatar & Basic Info */}
          <View style={styles.heroMainRow}>
            <View style={styles.avatarWrap}>
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={styles.avatarImg} resizeMode="cover" />
              ) : (
                <View style={styles.avatarFallback}>
                  <User size={36} color="#FFFFFF" />
                </View>
              )}
            </View>

            <View style={styles.heroInfoCol}>
              <Text style={styles.heroStudentName} numberOfLines={1}>
                {studentName}
              </Text>
              <View style={styles.pillsRow}>
                <View style={styles.codePill}>
                  <Text style={styles.codePillText}>Adm: {admissionNo}</Text>
                </View>
                {pinNo && pinNo !== admissionNo ? (
                  <View style={styles.codePill}>
                    <Text style={styles.codePillText}>PIN: {pinNo}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.heroCollegeText} numberOfLines={1}>
                {collegeName}
              </Text>
              <Text style={styles.heroBranchText}>
                {courseBranch} • {yearSem}
              </Text>
            </View>
          </View>

          {/* Action Buttons: Digital ID Card & Ward Profile */}
          <View style={styles.heroActionsRow}>
            <TouchableOpacity
              style={styles.heroActionBtnOutline}
              onPress={() => setShowIdCardModal(true)}
              activeOpacity={0.8}
            >
              <CreditCard size={14} color="#FFFFFF" />
              <Text style={styles.heroActionBtnOutlineText}>Digital ID Card</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.heroActionBtnFilled}
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.85}
            >
              <User size={14} color="#0047BA" />
              <Text style={styles.heroActionBtnFilledText}>Full Profile</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* 3. FOUR QUICK METRIC CARDS */}
        <View style={styles.metricsGrid}>
          {/* Metric 1: Attendance */}
          <TouchableOpacity
            style={[styles.metricCard, styles.metricBlue]}
            onPress={() => router.push('/(tabs)/attendance')}
            activeOpacity={0.8}
          >
            <View style={styles.metricTopRow}>
              <Text style={styles.metricLabel}>Attendance</Text>
              <CheckCircle2 size={16} color="#0047BA" />
            </View>
            <Text style={[styles.metricNumber, { color: '#0047BA' }]}>{attendancePercentage}%</Text>
            <Text style={styles.metricSub}>Live Academic Status</Text>
          </TouchableOpacity>

          {/* Metric 2: Fee Dues */}
          <TouchableOpacity
            style={[styles.metricCard, feeDuesAmount > 0 ? styles.metricOrange : styles.metricGreen]}
            onPress={() => router.push('/(tabs)/fees')}
            activeOpacity={0.8}
          >
            <View style={styles.metricTopRow}>
              <Text style={styles.metricLabel}>Fee Dues</Text>
              <CreditCard size={16} color={feeDuesAmount > 0 ? '#D97706' : '#16A34A'} />
            </View>
            <Text
              style={[
                styles.metricNumber,
                { color: feeDuesAmount > 0 ? '#B45309' : '#15803D' },
              ]}
            >
              {feeDuesAmount > 0 ? `₹${feeDuesAmount.toLocaleString('en-IN')}` : 'All Clear'}
            </Text>
            <Text style={styles.metricSub}>{feeDuesAmount > 0 ? 'Payment Pending' : 'No Overdue Dues'}</Text>
          </TouchableOpacity>

          {/* Metric 3: Today's Class Status */}
          <View style={[styles.metricCard, styles.metricPurple]}>
            <View style={styles.metricTopRow}>
              <Text style={styles.metricLabel}>Today&apos;s Status</Text>
              <Clock size={16} color="#9333EA" />
            </View>
            <Text style={[styles.metricNumber, { color: '#9333EA' }]}>{todayStatus}</Text>
            <Text style={styles.metricSub}>Daily Attendance Log</Text>
          </View>

          {/* Metric 4: Academic Progress */}
          <TouchableOpacity
            style={[styles.metricCard, styles.metricTeal]}
            onPress={() => router.push('/student-module/timetable' as any)}
            activeOpacity={0.8}
          >
            <View style={styles.metricTopRow}>
              <Text style={styles.metricLabel}>Timetable</Text>
              <GraduationCap size={16} color="#0D9488" />
            </View>
            <Text style={[styles.metricNumber, { color: '#0D9488' }]}>{yearSem.split('•')[0]}</Text>
            <Text style={styles.metricSub}>View Daily Periods ›</Text>
          </TouchableOpacity>
        </View>

        {/* 4. QUICK PORTAL SERVICES */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Portals & Services</Text>
        </View>

        <View style={styles.servicesGrid}>
          <TouchableOpacity
            style={styles.serviceTile}
            onPress={() => router.push('/(tabs)/attendance')}
            activeOpacity={0.8}
          >
            <View style={[styles.serviceIconBox, { backgroundColor: '#EFF6FF' }]}>
              <CheckCircle2 size={22} color="#0047BA" />
            </View>
            <Text style={styles.serviceTileLabel}>Attendance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.serviceTile}
            onPress={() => router.push('/(tabs)/fees')}
            activeOpacity={0.8}
          >
            <View style={[styles.serviceIconBox, { backgroundColor: '#F0FDF4' }]}>
              <CreditCard size={22} color="#16A34A" />
            </View>
            <Text style={styles.serviceTileLabel}>Fee Dues</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.serviceTile}
            onPress={() => router.push('/student-module/timetable' as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.serviceIconBox, { backgroundColor: '#FFF7ED' }]}>
              <Clock size={22} color="#EA580C" />
            </View>
            <Text style={styles.serviceTileLabel}>Timetable</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.serviceTile}
            onPress={() => router.push('/student-module/transport' as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.serviceIconBox, { backgroundColor: '#FAF5FF' }]}>
              <Bus size={22} color="#9333EA" />
            </View>
            <Text style={styles.serviceTileLabel}>Bus (GPS)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.serviceTile}
            onPress={() => router.push('/student-module/calendar' as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.serviceIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Calendar size={22} color="#0284C7" />
            </View>
            <Text style={styles.serviceTileLabel}>Calendar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.serviceTile}
            onPress={() => router.push('/(tabs)/announcements')}
            activeOpacity={0.8}
          >
            <View style={[styles.serviceIconBox, { backgroundColor: '#FEF2F2' }]}>
              <Megaphone size={22} color="#DC2626" />
            </View>
            <Text style={styles.serviceTileLabel}>Notices</Text>
          </TouchableOpacity>
        </View>

        {/* 5. TODAY'S CLASSES */}
        {todayClasses.length > 0 && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Today&apos;s Classes</Text>
              <TouchableOpacity onPress={() => router.push('/student-module/timetable' as any)}>
                <Text style={styles.viewAllText}>Full Schedule ›</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.classesList}>
              {todayClasses.map((item, idx) => (
                <View key={item.id || idx} style={styles.classCard}>
                  <View style={styles.classSlotBox}>
                    <Text style={styles.classSlotText}>P{item.slot_order || idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.classSubjectTitle}>{item.subject_name || 'Academic Lecture'}</Text>
                    <Text style={styles.classTimeText}>
                      {item.start_time} – {item.end_time}
                      {item.faculty_name ? ` • ${item.faculty_name}` : ''}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 6. LATEST ANNOUNCEMENTS */}
        {announcements.length > 0 && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Latest Notices & Circulars</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/announcements')}>
                <Text style={styles.viewAllText}>View All ›</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.announcementsList}>
              {announcements.slice(0, 3).map((item, idx) => (
                <TouchableOpacity
                  key={item.id || idx}
                  style={styles.announcementCard}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/announcements',
                      params: {
                        tab: 'announcements',
                        id: String(item.id || ''),
                        type: 'announcement',
                        _t: String(Date.now()),
                      },
                    } as any)
                  }
                  activeOpacity={0.8}
                >
                  <View style={styles.announcementIconBox}>
                    <Megaphone size={16} color="#0047BA" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.announcementTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.announcementDate}>
                      {item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN') : 'Recent Circular'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Digital ID Card Modal */}
        {showIdCardModal && (
          <DigitalStudentIdCardModal
            visible={showIdCardModal}
            onClose={() => setShowIdCardModal(false)}
            student={student}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },

  // HERO CARD
  heroCard: {
    borderRadius: 22,
    padding: 18,
    shadowColor: '#0047BA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    gap: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  parentRolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  parentRolePillText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  switchChildBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  switchChildBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfoCol: {
    flex: 1,
  },
  heroStudentName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 4,
  },
  codePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  codePillText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },
  heroCollegeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
  },
  heroBranchText: {
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 1,
  },
  heroActionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 4,
  },
  heroActionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingVertical: 9,
    borderRadius: 12,
  },
  heroActionBtnOutlineText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroActionBtnFilled: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 9,
    borderRadius: 12,
  },
  heroActionBtnFilledText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0047BA',
  },

  // METRICS GRID
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '48.5%',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    gap: 4,
  },
  metricBlue: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
  },
  metricGreen: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  metricOrange: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FFEDD5',
  },
  metricPurple: {
    backgroundColor: '#FAF5FF',
    borderColor: '#F3E8FF',
  },
  metricTeal: {
    backgroundColor: '#F0FDFA',
    borderColor: '#CCFBF1',
  },
  metricTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  metricSub: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },

  // SERVICES
  sectionWrap: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  viewAllText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0047BA',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  serviceTile: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  serviceIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTileLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },

  // CLASSES LIST
  classesList: {
    gap: 8,
  },
  classCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  classSlotBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  classSlotText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0047BA',
  },
  classSubjectTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  classTimeText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },

  // ANNOUNCEMENTS
  announcementsList: {
    gap: 8,
  },
  announcementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  announcementIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  announcementTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  announcementDate: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
});

export default ParentDashboardView;
