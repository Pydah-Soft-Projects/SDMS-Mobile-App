import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  Image,
  ImageBackground,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CalendarCheck,
  CreditCard,
  Bell,
  BookOpen,
  GraduationCap,
  ChevronRight,
  TrendingUp,
  Clock,
  Award,
  Bus,
  FileText,
  FolderOpen,
  Users,
  Menu,
  Layers,
  Sparkles,
  CheckCircle2,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  User,
  X,
  Ticket,
  Calendar,
  ShieldCheck,
  MessageSquare,
  UserCheck,
  Briefcase,
  Home,
  Megaphone,
  Vote,
  Wrench,
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import Header from '../../src/components/Header';
import StaffDashboard from '../../src/components/StaffDashboard';
import ParentDashboardView from '../../src/components/ParentDashboardView';
import { DashboardSkeleton } from '../../src/components/SkeletonLoader';
import studentService from '../../src/services/studentService';
import { StudentUser, StudentAttendanceData, StudentFeeDetails, Announcement } from '../../src/types';
import logger from '../../src/utils/logger';
import { StudentModuleDetailModal, StudentModuleItem } from '../../src/components/StudentModuleDetailModal';
import { getStaticFileUrl } from '../../src/config/api';
import DefaultEventPoster from '../../src/components/DefaultEventPoster';
import { isExamRelated } from '../../src/utils/filterUtils';

const SafeEventImage: React.FC<{ uri?: string | null; style: any }> = ({ uri, style }) => {
  const [loadError, setLoadError] = useState(false);

  if (!uri || loadError) {
    return <DefaultEventPoster style={style} />;
  }

  return (
    <Image
      source={{ uri: getStaticFileUrl(uri) }}
      style={style}
      resizeMode="cover"
      onError={() => setLoadError(true)}
    />
  );
};

const SafeClubImage: React.FC<{ club: any; style: any }> = ({ club, style }) => {
  const [loadError, setLoadError] = useState(false);
  const fallback = require('../../assets/campo-logo.png');
  const clubImg = club?.image_url || club?.image || club?.club_image;
  const clubUrl = clubImg
    ? getStaticFileUrl(clubImg)
    : club?.id
    ? getStaticFileUrl(`/api/clubs/${club.id}/image`)
    : null;

  if (!clubUrl || loadError) {
    return (
      <View style={[style, styles.clubCardImageFallback]}>
        <Image source={fallback} style={[styles.clubCardImage, { opacity: 0.85 }]} resizeMode="contain" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: clubUrl }}
      style={style}
      resizeMode="contain"
      onError={() => setLoadError(true)}
    />
  );
};

// Custom 3D Dashboard Card Images
const SERVICE_IMAGES: Record<string, any> = {
  attendance: require('../../assets/dashboard/attendance.webp'),
  academic: require('../../assets/dashboard/academic.webp'),
  fees: require('../../assets/dashboard/fees.webp'),
  timetable: require('../../assets/dashboard/timetable.webp'),
  'internal-marks': require('../../assets/dashboard/results.webp'),
  results: require('../../assets/dashboard/results.webp'),
  library: require('../../assets/dashboard/resources.webp'),
  resources: require('../../assets/dashboard/resources.webp'),
};

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const horizontalPadding = screenWidth < 360 ? 12 : 16;
  const portalColumns = screenWidth >= 600 ? 4 : 3;
  const gridGap = 10;
  const contentMaxWidth = Math.min(screenWidth, 720);
  const availableGridWidth = contentMaxWidth - horizontalPadding * 2;
  const portalCardWidth = Math.floor((availableGridWidth - gridGap * (portalColumns - 1)) / portalColumns);
  const horizontalCardWidth = Math.min(Math.max(Math.floor(screenWidth * 0.62), 220), 280);
  const { user, userType } = useAuth();

  // If staff or admin user, render Staff Management Dashboard
  if (userType === 'staff' || userType === 'admin') {
    return <StaffDashboard />;
  }

  // If parent user, render Parent Portal Dashboard
  if (userType === 'parent') {
    return <ParentDashboardView />;
  }

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<StudentUser | null>(user as StudentUser);
  const [attendance, setAttendance] = useState<StudentAttendanceData | null>(null);
  const [feeDetails, setFeeDetails] = useState<StudentFeeDetails | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [academicSummary, setAcademicSummary] = useState<any>(null);
  const [layoutSettings, setLayoutSettings] = useState<Record<string, boolean>>({});
  const [activeModule, setActiveModule] = useState<StudentModuleItem | null>(null);
  const [hasInternship, setHasInternship] = useState(false);
  const [hasTransportPass, setHasTransportPass] = useState(false);
  const [hasHostelAccount, setHasHostelAccount] = useState(false);

  // Popups & detail modals
  const [selectedFeedItem, setSelectedFeedItem] = useState<any | null>(null);

  const loadAllStudentData = async () => {
    const admissionNo = (user as any)?.admission_number || (user as any)?.pin_no;
    logger.info('STUDENT_DASHBOARD', `Loading SDMS student dashboard for: ${admissionNo}`);

    try {
      const [
        profRes,
        attRes,
        feeRes,
        noticesRes,
        eventsRes,
        clubsRes,
        academicRes,
        layoutRes,
        transRes,
        internRes,
        hostelRes,
      ] = await Promise.allSettled([
        admissionNo ? studentService.getProfile(admissionNo) : Promise.resolve(null),
        studentService.getAttendance(),
        admissionNo ? studentService.getFeeDetails(admissionNo) : Promise.resolve(null),
        studentService.getAnnouncements(),
        studentService.getEvents(),
        studentService.getClubs(),
        studentService.getAcademicContent(),
        studentService.getLayoutSettings(),
        studentService.getTransportDetails(),
        studentService.getInternshipAssignment(),
        studentService.getHostelDetails(),
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
        setAnnouncements(noticesRes.value);
      }
      if (eventsRes.status === 'fulfilled' && Array.isArray(eventsRes.value)) {
        const sortedEvents = (eventsRes.value || []).slice().sort((a: any, b: any) => {
          const timeA = new Date(a.event_date || a.createdAt || 0).getTime();
          const timeB = new Date(b.event_date || b.createdAt || 0).getTime();
          if (timeB !== timeA) return timeB - timeA;
          return Number(b.id || 0) - Number(a.id || 0);
        });
        setEvents(sortedEvents);
      }
      if (clubsRes.status === 'fulfilled' && Array.isArray(clubsRes.value)) {
        setClubs(clubsRes.value);
      }
      if (academicRes.status === 'fulfilled' && academicRes.value) {
        setAcademicSummary(academicRes.value);
      }
      if (layoutRes.status === 'fulfilled' && layoutRes.value) {
        setLayoutSettings(layoutRes.value);
      }
      if (transRes.status === 'fulfilled' && transRes.value?.hasActivePass) {
        setHasTransportPass(true);
      } else {
        setHasTransportPass(false);
      }
      if (internRes.status === 'fulfilled' && internRes.value) {
        setHasInternship(true);
      } else {
        setHasInternship(false);
      }
      if (hostelRes.status === 'fulfilled' && hostelRes.value?.hasHostelAccount) {
        setHasHostelAccount(true);
      } else {
        setHasHostelAccount(false);
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

  // Dynamic greeting based on current local hour
  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  // Compute live attendance percentage
  const semesterTotals = attendance?.semester?.totals ?? attendance?.monthly?.totals;
  const attendanceRate = useMemo(() => {
    if (!semesterTotals) return null;

    const present = semesterTotals.present;
    const absent = semesterTotals.absent;
    if (
      Number.isFinite(present) &&
      Number.isFinite(absent) &&
      present >= 0 &&
      absent >= 0 &&
      present + absent > 0
    ) {
      return (present / (present + absent)) * 100;
    }

    const percentage = semesterTotals.percentage;
    return typeof percentage === 'number' && Number.isFinite(percentage)
      ? percentage
      : null;
  }, [semesterTotals]);

  // Today's Attendance calculation
  const todayAttendance = useMemo(() => {
    const now = new Date();
    const isSunday = now.getDay() === 0;
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const dateText = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    const series = attendance?.semester?.series || [];
    const todayEntry = series.find((d: any) => d.date && d.date.startsWith(todayStr));

    let status = 'Holiday';
    let color = '#D97706';
    let bg = '#FEF3C7';
    let border = '#FDE68A';

    if (todayEntry) {
      const entryStatus = String(todayEntry.status).toLowerCase();
      if (entryStatus === 'present') {
        status = 'Present';
        color = '#15803D';
        bg = '#EDFBF4';
        border = '#DCFCE7';
      } else if (entryStatus === 'absent') {
        status = 'Absent';
        color = '#DC2626';
        bg = '#FEF2F2';
        border = '#FEE2E2';
      } else if (todayEntry.isHoliday || entryStatus === 'holiday' || entryStatus === 'weekend') {
        status = 'Holiday';
        color = '#D97706';
        bg = '#FEF3C7';
        border = '#FDE68A';
      } else {
        status = 'Active Session';
        color = '#0284C7';
        bg = '#F0F9FF';
        border = '#E0F2FE';
      }
    } else if (isSunday) {
      status = 'Holiday';
      color = '#D97706';
      bg = '#FEF3C7';
      border = '#FDE68A';
    } else {
      status = 'Active Session';
      color = '#0284C7';
      bg = '#F0F9FF';
      border = '#E0F2FE';
    }

    return { status, color, bg, border, dateText };
  }, [attendance]);

  // Overall Attendance Progress calculation
  const progressInfo = useMemo(() => {
    if (attendanceRate === null) {
      return { percentage: null, rating: 'No Data', color: '#64748B' };
    }

    let rating = 'Good';
    let color = '#15803D';
    if (attendanceRate < 65) {
      rating = 'Low';
      color = '#DC2626';
    } else if (attendanceRate < 75) {
      rating = 'Average';
      color = '#D97706';
    }
    return { percentage: attendanceRate.toFixed(1), rating, color };
  }, [attendanceRate]);

  // Combined feed of announcements and events
  const combinedFeed = useMemo(() => {
    const items: any[] = [];
    announcements.forEach((a) => {
      if (isExamRelated(a)) return;
      items.push({
        type: 'announcement',
        id: `ann-${a.id}`,
        title: a.title,
        content: a.content,
        date: a.createdAt,
        dateFormatted: a.createdAt
          ? new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : 'Recent',
        category: a.category || 'ANNOUNCEMENT',
        imageUrl: a.imageUrl ? getStaticFileUrl(a.imageUrl) : undefined,
        raw: a,
      });
    });

    events.forEach((e) => {
      if (isExamRelated(e)) return;
      items.push({
        type: 'event',
        id: `evt-${e.id}`,
        title: e.title,
        content: e.description || '',
        date: e.event_date || e.createdAt,
        dateFormatted: e.event_date
          ? new Date(e.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : 'Upcoming',
        category: e.event_type || 'EVENT',
        imageUrl: (e.banner_image || e.image_url) ? getStaticFileUrl(e.banner_image || e.image_url) : undefined,
        raw: e,
      });
    });

    // Sort so newest dates appear first
    items.sort((a, b) => {
      const timeA = new Date(a.date || 0).getTime();
      const timeB = new Date(b.date || 0).getTime();
      return timeB - timeA;
    });

    return items;
  }, [announcements, events]);

  // Dynamic clubs list (matches web dashboard Dashboard.jsx)
  const displayClubs = useMemo(() => {
    if (!Array.isArray(clubs) || clubs.length === 0) return [];
    const nonApproved = clubs.filter((c) => c.userStatus !== 'approved');
    return nonApproved.length > 0 ? nonApproved : clubs;
  }, [clubs]);

  const studentPhotoUrl = student?.avatarUrl || student?.student_photo ? getStaticFileUrl(student.avatarUrl || student.student_photo) : null;
  const studentName = student?.name || student?.student_name || 'Student';

  // Dynamic gender character avatar matching web dashboard (boy-animated.png / girl-animated.png)
  const genderAvatar = useMemo(() => {
    const data = student;
    let genderVal = '';
    if (data) {
      genderVal = (data.gender || (user as any)?.gender || '').toString().trim().toLowerCase();
    }
    const isFemale = genderVal === 'f' || genderVal === 'female' || genderVal === 'girl' || genderVal === 'woman';
    return isFemale
      ? require('../../assets/girl-animated.webp')
      : require('../../assets/boy-animated.webp');
  }, [student, user]);

  // Registration status check matching web version
  const isRegistrationCompleted = useMemo(() => {
    const reg = String(student?.registration_status || '').toLowerCase();
    return reg === 'completed' || reg === 'regular';
  }, [student]);

  // Profile verified percentage check matching web version
  const isProfileVerified = useMemo(() => {
    return Boolean(student?.email && (student?.phone || student?.student_mobile));
  }, [student]);

  // Helper to check if a module is enabled according to SDMS portal settings (matches web Dashboard.jsx)
  const isEnabled = (key: string) => {
    if (!layoutSettings || Object.keys(layoutSettings).length === 0) return true;
    return layoutSettings[key] !== false;
  };

  // Quick Action Buttons Side-by-Side Horizontal Row (All 19 Portal Functions from Web Version Dashboard)
  const menuActions = useMemo(() => {
    return [
      {
        key: 'attendance',
        label: 'Attendance',
        route: '/(tabs)/attendance',
        iconName: 'CheckCircle2',
        iconBg: '#DCFCE7',
        iconColor: '#16A34A',
        enabled: isEnabled('attendance'),
      },
      {
        key: 'academic',
        label: 'Academic',
        route: '/student-module/academic',
        iconName: 'BookOpen',
        iconBg: '#EFF6FF',
        iconColor: '#1D4ED8',
        enabled: true,
      },
      {
        key: 'fees',
        label: 'Fees',
        route: '/(tabs)/fees',
        iconName: 'Rupee',
        iconBg: '#FEE2E2',
        iconColor: '#DC2626',
        enabled: isEnabled('fees'),
      },
      {
        key: 'timetable',
        label: 'Timetable',
        route: '/student-module/timetable',
        iconName: 'Calendar',
        iconBg: '#EEF2FF',
        iconColor: '#4F46E5',
        enabled: isEnabled('timetable'),
      },
      {
        key: 'internal-marks',
        label: 'Results',
        route: '/student-module/internal-marks',
        iconName: 'FileText',
        iconBg: '#EFF6FF',
        iconColor: '#0284C7',
        enabled: true,
      },
      {
        key: 'library',
        label: 'Library',
        route: '/student-module/library',
        iconName: 'BookOpen',
        iconBg: '#DCFCE7',
        iconColor: '#16A34A',
        enabled: isEnabled('library'),
      },
      {
        key: 'semester-registration',
        label: 'Sem Reg.',
        route: '/student-module/semester-registration',
        iconName: 'ShieldCheck',
        iconBg: '#FEF3C7',
        iconColor: '#D97706',
        enabled: isEnabled('semester-registration'),
      },
      {
        key: 'clubs',
        label: 'Clubs',
        route: '/student-module/clubs',
        iconName: 'Users',
        iconBg: '#E0F2FE',
        iconColor: '#0284C7',
        enabled: isEnabled('clubs'),
      },
      {
        key: 'crt-portal',
        label: 'CRT Portal',
        route: '/student-module/crt',
        iconName: 'Briefcase',
        iconBg: '#EFF6FF',
        iconColor: '#1D4ED8',
        enabled: true,
      },
      {
        key: 'services',
        label: 'Campus Services',
        route: '/student-module/services',
        iconName: 'Sparkles',
        iconBg: '#EFF6FF',
        iconColor: '#1E3A8A',
        enabled: isEnabled('services'),
      },
      {
        key: 'my-tickets',
        label: 'Maintenance',
        route: '/student-module/my-tickets',
        iconName: 'Ticket',
        iconBg: '#DCFCE7',
        iconColor: '#16A34A',
        enabled: true,
      },
      {
        key: 'transport',
        label: 'Transport',
        route: '/student-module/transport',
        iconName: 'Bus',
        iconBg: '#FEF3C7',
        iconColor: '#D97706',
        enabled: hasTransportPass && isEnabled('transport'),
      },
      {
        key: 'hostel',
        label: 'Hostel',
        route: '/student-module/hostel',
        iconName: 'Home',
        iconBg: '#FEF3C7',
        iconColor: '#D97706',
        enabled: hasHostelAccount && isEnabled('hostel'),
      },
      {
        key: 'scholarship',
        label: 'Scholarship',
        route: '/student-module/scholarship',
        iconName: 'Award',
        iconBg: '#FEE2E2',
        iconColor: '#DC2626',
        enabled: isEnabled('scholarship'),
      },
      {
        key: 'feedback',
        label: 'Feedback',
        route: '/student-module/feedback',
        iconName: 'MessageSquare',
        iconBg: '#F1F5F9',
        iconColor: '#475569',
        enabled: isEnabled('feedback'),
      },
      {
        key: 'polls',
        label: 'Polls',
        route: { pathname: '/(tabs)/announcements', params: { tab: 'polls' } },
        iconName: 'Vote',
        iconBg: '#EFF6FF',
        iconColor: '#1E3A8A',
        enabled: true,
      },
    ].filter((item) => item.enabled);
  }, [layoutSettings, hasInternship, hasTransportPass, hasHostelAccount]);

  const renderActionIcon = (iconName: string, color: string, size = 20) => {
    switch (iconName) {
      case 'CheckCircle2':
        return <CheckCircle2 size={size} color={color} />;
      case 'Rupee':
        return (
          <Text style={{ fontSize: 18, fontWeight: '700', color, includeFontPadding: false }}>
            ₹
          </Text>
        );
      case 'BookOpen':
        return <BookOpen size={size} color={color} />;
      case 'Calendar':
        return <Calendar size={size} color={color} />;
      case 'FileText':
        return <FileText size={size} color={color} />;
      case 'ShieldCheck':
        return <ShieldCheck size={size} color={color} />;
      case 'Megaphone':
      case 'Bell':
        return <Megaphone size={size} color={color} />;
      case 'Award':
        return <Award size={size} color={color} />;
      case 'Users':
        return <Users size={size} color={color} />;
      case 'Briefcase':
        return <Briefcase size={size} color={color} />;
      case 'Sparkles':
        return <Sparkles size={size} color={color} />;
      case 'Ticket':
        return <Ticket size={size} color={color} />;
      case 'Bus':
        return <Bus size={size} color={color} />;
      case 'Home':
        return <Home size={size} color={color} />;
      case 'MessageSquare':
        return <MessageSquare size={size} color={color} />;
      case 'Vote':
        return <Vote size={size} color={color} />;
      case 'FolderOpen':
        return <FolderOpen size={size} color={color} />;
      default:
        return <Layers size={size} color={color} />;
    }
  };

  const course = student?.course || student?.course_name || '';
  const branch = student?.branch || student?.branch_name || '';
  const semester = student?.current_semester || '';
  const section = student?.section || '';
  const batch = student?.batch || '';
  const quota = student?.quota || student?.stud_type || '';
  const college = student?.college || student?.college_name || '';

  // Derive student's current year of study (1st, 2nd, 3rd, 4th Year)
  const rawYear =
    student?.current_year ||
    student?.year ||
    student?.year_of_study ||
    (semester && !isNaN(Number(semester)) ? Math.ceil(Number(semester) / 2) : '');

  const formatYearLabel = (yr: string | number) => {
    if (!yr) return '';
    const num = Number(yr);
    if (num === 1) return '1st Year';
    if (num === 2) return '2nd Year';
    if (num === 3) return '3rd Year';
    if (num === 4) return '4th Year';
    return `Year ${yr}`;
  };
  const currentYearText = formatYearLabel(rawYear);

  return (
    <View style={styles.container}>
      {/* Dynamic Header */}
      <Header
        title={greetingText}
        subtitle={`PIN: ${student?.pin_no || student?.admission_number || 'N/A'}${currentYearText ? ` • ${currentYearText}` : ''}${semester ? ` • Sem ${semester}` : ''}`}
        showBuddyTag={true}
      />

      {loading ? (
        <DashboardSkeleton paddingHorizontal={horizontalPadding} />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingHorizontal: horizontalPadding,
              paddingBottom: Math.max(insets.bottom, 16) + 84,
              maxWidth: 720,
              alignSelf: 'center',
              width: '100%',
            },
          ]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS === 'android'}
          scrollEventThrottle={16}
          overScrollMode="never"
          nestedScrollEnabled={true}
        >
          {/* 1. STUDENT ACADEMIC INFO BANNER (Web Dashboard Style with Character Illustration) */}
          <TouchableOpacity
            style={styles.banner}
            onPress={() => router.push('/(tabs)/profile' as any)}
            activeOpacity={0.92}
          >
            {/* Character Illustration Layered on Right (Exact Web Match) */}
            <View style={styles.bannerGenderCol} pointerEvents="none">
              <Image
                source={genderAvatar}
                style={styles.bannerGenderIllustration}
                resizeMode="contain"
              />
            </View>

            {/* Left Content */}
            <View style={styles.bannerContentCol}>
              <View style={styles.bannerPhotoRow}>
                <View style={styles.bannerAvatarBox}>
                  {studentPhotoUrl ? (
                    <Image source={{ uri: studentPhotoUrl }} style={styles.bannerAvatarImg} />
                  ) : (
                    <User size={24} color="#1E3A8A" />
                  )}
                </View>
                <View style={styles.bannerTitleCol}>
                  <Text style={styles.bannerStudentName} numberOfLines={1}>
                    {studentName}
                  </Text>
                  <Text style={styles.bannerCourseText} numberOfLines={1}>
                    {course && branch ? `${course} - ${branch}` : (course || branch || 'Student')}
                  </Text>
                </View>
              </View>

              {/* Badges Row (Web Replica: Registered & Profile 100%) */}
              <View style={styles.bannerPillRow}>
                <TouchableOpacity
                  style={[
                    styles.webBadge,
                    isRegistrationCompleted ? styles.webBadgeSuccess : styles.webBadgeDanger,
                  ]}
                  onPress={() => router.push('/student-module/semester-registration' as any)}
                  activeOpacity={0.7}
                >
                  <CheckCircle2
                    size={11}
                    color={isRegistrationCompleted ? '#15803D' : '#DC2626'}
                  />
                  <Text
                    style={[
                      styles.webBadgeText,
                      isRegistrationCompleted ? styles.webBadgeTextSuccess : styles.webBadgeTextDanger,
                    ]}
                  >
                    {isRegistrationCompleted ? 'Registered' : 'Not Completed'}
                  </Text>
                </TouchableOpacity>

                <View style={[styles.webBadge, styles.webBadgePrimary]}>
                  <CheckCircle2 size={11} color="#1D4ED8" />
                  <Text style={[styles.webBadgeText, styles.webBadgeTextPrimary]}>
                    Profile {isProfileVerified ? '100%' : '90%'}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* 2. SIDE-BY-SIDE METRICS: TODAY'S ATTENDANCE & OVERALL PROGRESS */}
          <View style={styles.metricsRow}>
            {/* Card 1: Today's Attendance */}
            <TouchableOpacity
              style={[
                styles.metricCard,
                { backgroundColor: todayAttendance.bg, borderColor: todayAttendance.border },
              ]}
              onPress={() => router.push('/(tabs)/attendance' as any)}
              activeOpacity={0.8}
            >
              <View style={styles.metricCardHeader}>
                <Text style={[styles.metricCardTitle, { color: todayAttendance.color }]} numberOfLines={1}>
                  Today's Attendance
                </Text>
              </View>
              <View style={styles.metricCardBody}>
                <View style={styles.metricTextCol}>
                  <Text
                    style={[styles.metricMainValue, { color: todayAttendance.color, fontSize: screenWidth < 360 ? 15 : 18 }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    {todayAttendance.status}
                  </Text>
                  <View style={styles.metricDateRow}>
                    <ChevronRight size={10} color={todayAttendance.color} />
                    <Text style={[styles.metricDateText, { color: todayAttendance.color }]} numberOfLines={1}>
                      {todayAttendance.dateText}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.metricIconBox,
                    { backgroundColor: todayAttendance.border, borderColor: todayAttendance.border },
                  ]}
                >
                  <Calendar size={15} color={todayAttendance.color} />
                </View>
              </View>
            </TouchableOpacity>

            {/* Card 2: Overall Progress */}
            <TouchableOpacity
              style={[
                styles.metricCard,
                { backgroundColor: '#F6F5FF', borderColor: '#EDE9FE' },
              ]}
              onPress={() => router.push('/(tabs)/attendance' as any)}
              activeOpacity={0.8}
            >
              <View style={styles.metricCardHeader}>
                <Text style={[styles.metricCardTitle, { color: '#6D28D9' }]} numberOfLines={1}>
                  Overall Attendance
                </Text>
              </View>
              <View style={styles.metricCardBody}>
                <View style={styles.metricTextCol}>
                  <Text
                    style={[styles.metricMainValue, { color: progressInfo.color, fontSize: screenWidth < 360 ? 15 : 18 }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    {progressInfo.percentage === null ? '—' : `${progressInfo.percentage}%`}
                  </Text>
                  <View style={styles.metricDateRow}>
                    <ChevronRight size={10} color="#6D28D9" />
                    <Text style={[styles.metricDateText, { color: progressInfo.color }]} numberOfLines={1}>
                      {progressInfo.rating} Rating
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.metricIconBox,
                    { backgroundColor: '#EDE9FE', borderColor: '#DDD6FE' },
                  ]}
                >
                  <BarChart3 size={15} color="#6D28D9" />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* 3. DYNAMIC SDMS PORTALS & SERVICES (Horizontally Scrollable Carousel) */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Portals & Services</Text>
          </View>

          {/* Horizontally Scrollable Services Cards (Matches Image 2) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.servicesHorizontalScroll}
            removeClippedSubviews={Platform.OS === 'android'}
            nestedScrollEnabled={true}
            overScrollMode="never"
          >
            {menuActions.map((action) => {
              const imageSrc = (action as any).image || SERVICE_IMAGES[action.key];
              return (
                <TouchableOpacity
                  key={action.key}
                  style={styles.serviceActionItem}
                  onPress={() => {
                    router.push(action.route as any);
                  }}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.serviceRoundedCard,
                      !imageSrc && { backgroundColor: action.iconBg },
                    ]}
                  >
                    {imageSrc ? (
                      <Image source={imageSrc} style={styles.serviceImg} resizeMode="contain" />
                    ) : (
                      renderActionIcon(action.iconName, action.iconColor, 24)
                    )}
                  </View>
                  <Text style={styles.serviceItemLabel} numberOfLines={1}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 4. CAMPUS EVENTS SECTION */}
          {combinedFeed.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Campus Events</Text>
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/(tabs)/announcements', params: { tab: 'events' } } as any)}
                  style={styles.viewAllRow}
                >
                  <Text style={styles.viewAllText}>View All</Text>
                  <ArrowRight size={13} color="#2563EB" />
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalCardsScroll}
                removeClippedSubviews={Platform.OS === 'android'}
                nestedScrollEnabled={true}
                overScrollMode="never"
              >
                {combinedFeed.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.eventCard, { width: horizontalCardWidth }]}
                    onPress={() => router.push({ pathname: '/(tabs)/announcements', params: { tab: item.type === 'event' ? 'events' : 'announcements' } } as any)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.eventCardBanner}>
                      <SafeEventImage uri={item.imageUrl} style={styles.eventCardImage} />
                    </View>

                    <View style={styles.eventCardBody}>
                      <Text style={styles.eventCardTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <View style={styles.eventCardMeta}>
                        <View style={styles.eventCardDateGroup}>
                          <Clock size={11} color="#94A3B8" />
                          <Text style={styles.eventCardDate}>{item.dateFormatted}</Text>
                        </View>
                        <View
                          style={[
                            styles.eventCategoryTag,
                            {
                              backgroundColor:
                                item.type === 'event' ? '#F3E8FF' : '#EEF2FF',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.eventCategoryTagText,
                              {
                                color:
                                  item.type === 'event' ? '#7E22CE' : '#4338CA',
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {item.category.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.eventCardFooter}>
                      <Text style={styles.readUpdateText}>Read Update</Text>
                      <ArrowRight size={12} color="#2563EB" />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* 5. EXPLORE LEARN BUILD BANNER (Full Card Background) */}
          <TouchableOpacity
            style={styles.exploreBannerContainer}
            onPress={() => router.push('/student-module/clubs' as any)}
            activeOpacity={0.88}
          >
            <ImageBackground
              source={require('../../assets/learn-build.webp')}
              style={styles.exploreBanner}
              imageStyle={styles.exploreBannerBgImage}
              resizeMode="cover"
            >
              <LinearGradient
                colors={['rgba(3, 14, 45, 0.78)', 'rgba(3, 14, 45, 0.38)', 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.exploreBannerOverlay}
              >
                <View style={styles.exploreBannerLeft}>
                  <Text style={styles.exploreBannerTitle} numberOfLines={1}>
                    Explore Learn Build
                  </Text>
                  <Text style={styles.exploreBannerSubtitle}>
                    Join Clubs, Workshops{'\n'}and Maker Space
                  </Text>
                </View>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>

          {/* 6. CLUBS TO JOIN SECTION (Dynamic - Matches Web Dashboard) */}
          {isEnabled('clubs') && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.sectionTitle}>Clubs to Join</Text>
                  {displayClubs.length > 0 && (
                    <View style={styles.availableCountBadge}>
                      <Text style={styles.availableCountBadgeText}>
                        {displayClubs.length} Available
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/student-module/clubs' as any)}
                  style={styles.viewAllRow}
                >
                  <Text style={styles.viewAllText}>View All</Text>
                  <ArrowRight size={13} color="#2563EB" />
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalCardsScroll}
                removeClippedSubviews={Platform.OS === 'android'}
                nestedScrollEnabled={true}
                overScrollMode="never"
              >
                {displayClubs.length > 0 ? (
                  displayClubs.map((club: any) => (
                    <TouchableOpacity
                      key={club.id}
                      style={[styles.clubCard, { width: horizontalCardWidth }]}
                      onPress={() =>
                        router.push({
                          pathname: '/student-module/clubs',
                          params: { clubId: String(club.id) },
                        } as any)
                      }
                      activeOpacity={0.85}
                    >
                      <View style={styles.clubCardBanner}>
                        <SafeClubImage club={club} style={styles.clubCardImage} />
                        <View
                          style={[
                            styles.clubStatusBadge,
                            club.userStatus === 'pending'
                              ? { backgroundColor: '#B45309' }
                              : { backgroundColor: '#10B981' },
                          ]}
                        >
                          {club.userStatus === 'pending' ? (
                            <Clock size={10} color="#FFFFFF" />
                          ) : (
                            <Sparkles size={10} color="#FFFFFF" />
                          )}
                          <Text style={styles.clubStatusBadgeText}>
                            {club.userStatus === 'pending' ? 'PENDING' : 'OPEN TO JOIN'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.clubCardContent}>
                        <Text style={styles.clubTitle} numberOfLines={1}>
                          {club.name}
                        </Text>
                        <Text style={styles.clubDesc} numberOfLines={2}>
                          {club.description || 'Join activities, workshops, and build skills.'}
                        </Text>

                        <View style={styles.clubCardFooter}>
                          <Text style={styles.clubMemberCount}>
                            {club.memberCount || club.member_count || 0} Members
                          </Text>
                          <View
                            style={[
                              styles.joinBtn,
                              club.userStatus === 'pending' && styles.joinedBtn,
                            ]}
                          >
                            <Text
                              style={[
                                styles.joinBtnText,
                                club.userStatus === 'pending' && styles.joinedBtnText,
                              ]}
                            >
                              {club.userStatus === 'pending' ? 'Pending' : 'View & Join'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={[styles.emptyCard, { width: screenWidth - 32 }]}>
                    <Users size={24} color="#94A3B8" />
                    <Text style={styles.emptyTitle}>No Clubs Available</Text>
                    <Text style={styles.emptySub}>Campus student clubs will appear here once active.</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {/* ANY PROBLEMS - REPORT US SECTION */}
          {isEnabled('my-tickets') && (
            <View style={styles.sectionContainer}>
              <TouchableOpacity
                style={styles.reportProblemCard}
                onPress={() => router.push('/student-module/my-tickets' as any)}
                activeOpacity={0.88}
              >
                <View style={styles.reportProblemBannerContainer}>
                  <Image
                    source={require('../../assets/dashboard/maintenance-report.webp')}
                    style={styles.reportProblemBannerImg}
                    resizeMode="cover"
                  />
                  <View style={styles.reportProblemBannerOverlay}>
                    <Text style={styles.reportProblemImageTitle}>
                      Any Issues{'\n'}Buddy?
                    </Text>
                  </View>
                </View>

                <View style={styles.reportProblemBody}>
                  <Text style={styles.reportProblemSub}>
                    Spot something that needs fixing on campus? Flag it in seconds and track real-time resolution right from your pocket.
                  </Text>

                  <View style={styles.reportProblemFooter}>
                    <Text style={styles.reportProblemBtnText}>Raise Maintenance Ticket</Text>
                    <ChevronRight size={16} color="#FFFFFF" />
                  </View>
                </View>
              </TouchableOpacity>
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
  },
  content: {
    paddingVertical: 16,
  },
  banner: {
    backgroundColor: '#1E3A8A',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  bannerGenderCol: {
    position: 'absolute',
    right: -4,
    bottom: -6,
    width: 135,
    height: '115%',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    zIndex: 1,
  },
  bannerGenderIllustration: {
    width: '100%',
    height: '100%',
    opacity: 0.95,
  },
  bannerContentCol: {
    maxWidth: '68%',
    zIndex: 2,
  },
  bannerPhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  bannerAvatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  bannerAvatarImg: {
    width: '100%',
    height: '100%',
  },
  bannerTitleCol: {
    flex: 1,
  },
  bannerStudentName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  bannerCourseText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 2,
  },
  bannerPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  webBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  webBadgeSuccess: {
    backgroundColor: '#DCFCE7',
  },
  webBadgeDanger: {
    backgroundColor: '#FEE2E2',
  },
  webBadgePrimary: {
    backgroundColor: '#DBEAFE',
  },
  webBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  webBadgeTextSuccess: {
    color: '#15803D',
  },
  webBadgeTextDanger: {
    color: '#DC2626',
  },
  webBadgeTextPrimary: {
    color: '#1D4ED8',
  },
  exploreBannerContainer: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
  },
  exploreBanner: {
    width: '100%',
    minHeight: 110,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  exploreBannerBgImage: {
    borderRadius: 20,
  },
  exploreBannerOverlay: {
    flex: 1,
    minHeight: 110,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  exploreBannerLeft: {
    flex: 1,
    paddingRight: 10,
    zIndex: 2,
    justifyContent: 'center',
  },
  exploreBannerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 22,
    letterSpacing: -0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  exploreBannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16.5,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
  },
  metricCardHeader: {
    marginBottom: 4,
  },
  metricCardTitle: {
    fontSize: 11,
    fontWeight: '800',
  },
  metricCardBody: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  metricTextCol: {
    flex: 1,
  },
  metricMainValue: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  metricDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  metricDateText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metricIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  scopeHeaderTitleCol: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  scopeSubTitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  allPagesPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  allPagesText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  portalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  servicesHorizontalScroll: {
    paddingVertical: 4,
    gap: 12,
    marginBottom: 20,
  },
  serviceActionItem: {
    width: 72,
    alignItems: 'center',
  },
  serviceRoundedCard: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  serviceImg: {
    width: 50,
    height: 50,
  },
  serviceItemLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
    marginTop: 6,
    width: '100%',
    includeFontPadding: false,
  },
  serviceSquareCard: {
    minWidth: 84,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 11,
  },
  allServicesCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  serviceIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  serviceImageContainer: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  serviceSquareLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
    includeFontPadding: false,
  },
  portalCard: {
    flexShrink: 0,
    minHeight: 96,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  allPortalsCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  portalIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  portalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    width: '100%',
  },
  portalScopeTag: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
    width: '100%',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  horizontalCardsScroll: {
    gap: 12,
    paddingVertical: 2,
  },
  eventCard: {
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  eventCardBanner: {
    height: 105,
    backgroundColor: '#312E81',
    position: 'relative',
    overflow: 'hidden',
  },
  eventCardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  eventCardPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#312E81',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventCategoryTag: {
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  eventCategoryTagText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  eventCardBody: {
    padding: 10,
  },
  eventCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 16,
  },
  eventCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 6,
  },
  eventCardDateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  eventCardDate: {
    fontSize: 10,
    color: '#64748B',
  },
  eventCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  readUpdateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  availableCountBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  availableCountBadgeText: {
    color: '#1D4ED8',
    fontSize: 10,
    fontWeight: '800',
  },

  clubCard: {
    width: 215,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  clubCardBanner: {
    width: '100%',
    height: 110,
    position: 'relative',
    backgroundColor: '#0F172A',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  clubCardImage: {
    width: '100%',
    height: '100%',
  },
  clubCardImageFallback: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clubFallbackOverlay: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clubStatusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    zIndex: 2,
  },
  clubStatusBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  clubCardContent: {
    padding: 10,
  },

  clubCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  clubIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubCategoryText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0F766E',
  },
  clubTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  clubDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginBottom: 10,
  },
  clubCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  clubMemberCount: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  joinBtn: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  joinBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  joinedBtn: {
    backgroundColor: '#DCFCE7',
  },
  joinedBtnText: {
    color: '#15803D',
  },
  emptyCard: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginTop: 6,
  },
  emptySub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
  },
  fullScreenPageContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  fullScreenPageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  fullScreenBackBtn: {
    padding: 6,
    borderRadius: 8,
    marginRight: 6,
  },
  fullScreenHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  fullScreenPageScroll: {
    flex: 1,
  },
  fullScreenImageContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#0F172A',
  },
  fullScreenBannerImage: {
    width: '100%',
    height: '100%',
  },
  fullScreenPageContent: {
    padding: 20,
  },
  fullScreenDetailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 26,
    marginBottom: 8,
  },
  fullScreenContentText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
    marginTop: 10,
  },
  fullScreenFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    gap: 12,
  },
  fullScreenDismissBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  fullScreenDismissBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modalBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  modalScrollBody: {
    maxHeight: 300,
  },
  modalImageContainer: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#0F172A',
  },
  modalBannerImage: {
    width: '100%',
    height: '100%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  modalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  modalMetaDate: {
    fontSize: 11,
    color: '#64748B',
  },
  modalContentText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  clubMemberStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  clubMemberStatText: {
    fontSize: 12,
    color: '#0F766E',
    fontWeight: '600',
  },
  modalFooter: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  modalDismissBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalDismissBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  modalActionBtn: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reportProblemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  reportProblemBannerContainer: {
    width: '100%',
    height: 150,
    backgroundColor: '#1E3A8A',
    position: 'relative',
  },
  reportProblemBannerImg: {
    width: '100%',
    height: '100%',
  },
  reportProblemBannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(15, 23, 42, 0.32)',
  },
  reportProblemImageTitle: {
    fontSize: 23,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'left',
    lineHeight: 29,
    letterSpacing: -0.4,
    textShadowColor: 'rgba(0, 0, 0, 0.65)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  reportProblemBody: {
    padding: 16,
    gap: 12,
  },
  reportProblemSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  reportProblemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3A8A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  reportProblemBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
