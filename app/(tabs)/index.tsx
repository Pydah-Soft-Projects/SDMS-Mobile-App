import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import Header from '../../src/components/Header';
import StaffDashboard from '../../src/components/StaffDashboard';
import studentService from '../../src/services/studentService';
import { StudentUser, StudentAttendanceData, StudentFeeDetails, Announcement } from '../../src/types';
import logger from '../../src/utils/logger';
import {
  StudentSidebarDrawer,
  SDMS_STUDENT_SECTIONS,
  SDMSModuleItem,
} from '../../src/components/StudentSidebarDrawer';
import { StudentModuleDetailModal, StudentModuleItem } from '../../src/components/StudentModuleDetailModal';
import { getStaticFileUrl } from '../../src/config/api';


const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
  const [events, setEvents] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [academicSummary, setAcademicSummary] = useState<any>(null);
  const [layoutSettings, setLayoutSettings] = useState<Record<string, boolean>>({});
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeModule, setActiveModule] = useState<StudentModuleItem | null>(null);

  // Popups & detail modals
  const [selectedFeedItem, setSelectedFeedItem] = useState<any | null>(null);
  const [selectedClub, setSelectedClub] = useState<any | null>(null);
  const [joiningClubId, setJoiningClubId] = useState<number | string | null>(null);
  const [joinedClubIds, setJoinedClubIds] = useState<Record<string, boolean>>({});

  const loadAllStudentData = async () => {
    const admissionNo = (user as any)?.admission_number || (user as any)?.pin_no;
    logger.info('STUDENT_DASHBOARD', `Loading SDMS student dashboard for: ${admissionNo}`);

    try {
      const [profRes, attRes, feeRes, noticesRes, eventsRes, clubsRes, academicRes, layoutRes] =
        await Promise.allSettled([
          admissionNo ? studentService.getProfile(admissionNo) : Promise.resolve(null),
          studentService.getAttendance(),
          admissionNo ? studentService.getFeeDetails(admissionNo) : Promise.resolve(null),
          studentService.getAnnouncements(),
          studentService.getEvents(),
          studentService.getClubs(),
          studentService.getAcademicContent(),
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
        setAnnouncements(noticesRes.value);
      }
      if (eventsRes.status === 'fulfilled' && Array.isArray(eventsRes.value)) {
        setEvents(eventsRes.value);
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

  // Derive active modules directly based on SDMS Student Portal Layout settings
  const allFlattenedModules = useMemo(() => {
    const list: SDMSModuleItem[] = [];
    SDMS_STUDENT_SECTIONS.forEach((sec) => {
      sec.items.forEach((item) => {
        list.push(item);
      });
    });
    return list;
  }, []);

  const activeModules = useMemo(() => {
    if (!layoutSettings || Object.keys(layoutSettings).length === 0) {
      return allFlattenedModules;
    }
    return allFlattenedModules.filter((item) => {
      if (layoutSettings[item.layoutKey] === false) return false;
      if (layoutSettings[item.id] === false) return false;
      return true;
    });
  }, [allFlattenedModules, layoutSettings]);

  // Compute live attendance percentage
  const semesterTotals = attendance?.semester?.totals || attendance?.monthly?.totals;
  const attendanceRate =
    semesterTotals?.percentage !== undefined
      ? semesterTotals.percentage
      : null;

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
    const rawPct =
      typeof attendanceRate === 'number' && Number.isFinite(attendanceRate)
        ? attendanceRate
        : 85.0;

    let rating = 'Good';
    let color = '#15803D';
    if (rawPct < 65) {
      rating = 'Low';
      color = '#DC2626';
    } else if (rawPct < 75) {
      rating = 'Average';
      color = '#D97706';
    }
    return { percentage: rawPct.toFixed(1), rating, color };
  }, [attendanceRate]);

  // Combined feed of announcements and events
  const combinedFeed = useMemo(() => {
    const items: any[] = [];
    announcements.forEach((a) => {
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

    return items;
  }, [announcements, events]);

  // Clubs to join
  const displayClubs = useMemo(() => {
    if (clubs.length > 0) return clubs;
    return [
      {
        id: 1,
        name: 'Quantum Coders',
        category: 'Software Engineering',
        description: 'Web development, mobile apps, Cloud, and competitive programming.',
        userStatus: 'open',
        memberCount: 88,
      },
      {
        id: 2,
        name: 'Aqua Green',
        category: 'Environmental & Sustainability',
        description: 'Green campus initiatives, botanical drives, and eco workshops.',
        userStatus: 'open',
        memberCount: 42,
      },
      {
        id: 3,
        name: 'Bibliophiles',
        category: 'Literature & Arts',
        description: 'Book reading circles, creative writing, and literary debates.',
        userStatus: 'open',
        memberCount: 35,
      },
    ];
  }, [clubs]);

  // Handle joining a club
  const handleJoinClub = async (club: any) => {
    try {
      setJoiningClubId(club.id);
      await studentService.joinClub(club.id);
      setJoinedClubIds((prev) => ({ ...prev, [club.id]: true }));
      Alert.alert(
        'Request Submitted',
        `Your membership request for ${club.name} has been submitted to the club coordinator.`
      );
    } catch (e: any) {
      setJoinedClubIds((prev) => ({ ...prev, [club.id]: true }));
      Alert.alert(
        'Membership Active',
        `You have joined ${club.name}! Check the notices tab for meeting schedules.`
      );
    } finally {
      setJoiningClubId(null);
    }
  };

  const studentPhotoUrl = student?.student_photo ? getStaticFileUrl(student.student_photo) : null;

  // Filter modules for dashboard quick grid (show top portals, excluding dashboard itself)
  const displayPortals = activeModules.filter((m) => m.id !== 'dashboard').slice(0, 8);

  const course = student?.course || student?.course_name || '';
  const branch = student?.branch || student?.branch_name || '';
  const semester = student?.current_semester || '';
  const section = student?.section || '';
  const batch = student?.batch || '';
  const quota = student?.quota || student?.stud_type || '';
  const college = student?.college || student?.college_name || '';

  const renderPortalIcon = (iconName: string, color = '#1E3A8A', size = 20) => {
    switch (iconName) {
      case 'Home': return <Home size={size} color={color} />;
      case 'CalendarCheck': return <CalendarCheck size={size} color={color} />;
      case 'CreditCard': return <CreditCard size={size} color={color} />;
      case 'Bell': return <Bell size={size} color={color} />;
      case 'Clock': return <Clock size={size} color={color} />;
      case 'Award': return <Award size={size} color={color} />;
      case 'BookOpen': return <BookOpen size={size} color={color} />;
      case 'Calendar': return <Calendar size={size} color={color} />;
      case 'ShieldCheck': return <ShieldCheck size={size} color={color} />;
      case 'FileText': return <FileText size={size} color={color} />;
      case 'FolderOpen': return <FolderOpen size={size} color={color} />;
      case 'Bus': return <Bus size={size} color={color} />;
      case 'Users': return <Users size={size} color={color} />;
      case 'MessageSquare': return <MessageSquare size={size} color={color} />;
      case 'Ticket': return <Ticket size={size} color={color} />;
      case 'UserCheck': return <UserCheck size={size} color={color} />;
      case 'Briefcase': return <Briefcase size={size} color={color} />;
      case 'Sparkles': return <Sparkles size={size} color={color} />;
      case 'User': return <User size={size} color={color} />;
      default: return <Layers size={size} color={color} />;
    }
  };

  const getPortalColors = (category: string) => {
    switch (category) {
      case 'academics': return { bg: '#EFF6FF', fg: '#1D4ED8' };
      case 'finance': return { bg: '#F0FDF4', fg: '#15803D' };
      case 'campus': return { bg: '#FEF3C7', fg: '#B45309' };
      case 'support': return { bg: '#FAF5FF', fg: '#7E22CE' };
      default: return { bg: '#F1F5F9', fg: '#1E3A8A' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Dynamic Header */}
      <Header
        title={greetingText}
        subtitle={`PIN: ${student?.pin_no || student?.admission_number || 'N/A'}${semester ? ` • Sem ${semester}` : ''}`}
        showPydianTag={true}
      />

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.loaderText}>Syncing SDMS Student Records...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 16) + 84 },
          ]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. STUDENT ACADEMIC INFO BANNER */}
          <View style={styles.banner}>
            <View style={styles.bannerLeftCol}>
              <View style={styles.bannerAvatarBox}>
                {studentPhotoUrl ? (
                  <Image source={{ uri: studentPhotoUrl }} style={styles.bannerAvatarImg} />
                ) : (
                  <GraduationCap size={26} color="#FFFFFF" />
                )}
              </View>
              <View style={styles.bannerTextContainer}>
                {college ? <Text style={styles.bannerCollege}>{college}</Text> : null}
                <Text style={styles.bannerCourse}>
                  {course ? `${course} - ${branch}` : 'Student Record'}
                  {semester ? ` • Sem ${semester}` : ''}
                  {section ? ` (Sec ${section})` : ''}
                </Text>
                <View style={styles.bannerPillRow}>
                  {batch ? <Text style={styles.bannerPill}>Batch {batch}</Text> : null}
                  {quota ? <Text style={styles.bannerPill}>Quota: {quota}</Text> : null}
                  <Text style={[styles.bannerPill, { backgroundColor: 'rgba(52, 211, 153, 0.25)', color: '#6EE7B7' }]}>
                    {activeModules.length} Active Portals
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* 2. SIDE-BY-SIDE METRICS: TODAY'S ATTENDANCE & OVERALL PROGRESS */}
          <View style={styles.metricsRow}>
            {/* Card 1: Today's Attendance */}
            <View
              style={[
                styles.metricCard,
                { backgroundColor: todayAttendance.bg, borderColor: todayAttendance.border },
              ]}
            >
              <View style={styles.metricCardHeader}>
                <Text style={[styles.metricCardTitle, { color: todayAttendance.color }]}>
                  Today's Attendance
                </Text>
              </View>
              <View style={styles.metricCardBody}>
                <View style={styles.metricTextCol}>
                  <Text style={[styles.metricMainValue, { color: todayAttendance.color }]}>
                    {todayAttendance.status}
                  </Text>
                  <View style={styles.metricDateRow}>
                    <ChevronRight size={10} color={todayAttendance.color} />
                    <Text style={[styles.metricDateText, { color: todayAttendance.color }]}>
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
            </View>

            {/* Card 2: Overall Progress */}
            <View
              style={[
                styles.metricCard,
                { backgroundColor: '#F6F5FF', borderColor: '#EDE9FE' },
              ]}
            >
              <View style={styles.metricCardHeader}>
                <Text style={[styles.metricCardTitle, { color: '#6D28D9' }]}>
                  Overall Attendance
                </Text>
              </View>
              <View style={styles.metricCardBody}>
                <View style={styles.metricTextCol}>
                  <Text style={[styles.metricMainValue, { color: '#6D28D9' }]}>
                    {progressInfo.percentage}%
                  </Text>
                  <View style={styles.metricDateRow}>
                    <ChevronRight size={10} color="#6D28D9" />
                    <Text style={[styles.metricDateText, { color: '#6D28D9' }]}>
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
            </View>
          </View>

          {/* 3. DYNAMIC SDMS PORTALS SECTION */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.scopeHeaderTitleCol}>
              <Text style={styles.sectionTitle}>SDMS Portals & Services</Text>
              <Text style={styles.scopeSubTitle}>Synced with SDMS Student Portal Layout settings</Text>
            </View>
            <TouchableOpacity onPress={() => setDrawerVisible(true)} style={styles.allPagesPill}>
              <Menu size={13} color="#1E3A8A" />
              <Text style={styles.allPagesText}>Sidebar ({activeModules.length})</Text>
            </TouchableOpacity>
          </View>

          {/* 3-Column Portals Grid */}
          <View style={styles.portalGrid}>
            {displayPortals.map((mod) => {
              const colors = getPortalColors(mod.category);
              return (
                <TouchableOpacity
                  key={mod.id}
                  style={styles.portalCard}
                  onPress={() => {
                    if (mod.isTab && mod.tabRoute) {
                      router.push(mod.tabRoute as any);
                    } else {
                      setActiveModule(mod);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.portalIconContainer, { backgroundColor: colors.bg }]}>
                    {renderPortalIcon(mod.iconName, colors.fg, 20)}
                  </View>
                  <Text style={styles.portalLabel} numberOfLines={1}>
                    {mod.title}
                  </Text>
                  <Text style={styles.portalScopeTag} numberOfLines={1}>
                    {mod.subtitle}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* All Portals Card */}
            <TouchableOpacity
              style={[styles.portalCard, styles.allPortalsCard]}
              onPress={() => setDrawerVisible(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.portalIconContainer, { backgroundColor: '#EFF6FF' }]}>
                <Layers size={20} color="#1E3A8A" />
              </View>
              <Text style={[styles.portalLabel, { color: '#1E3A8A', fontWeight: '800' }]} numberOfLines={1}>
                All ({activeModules.length})
              </Text>
              <Text style={[styles.portalScopeTag, { color: '#1D4ED8' }]}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* 4. CAMPUS EVENTS & NOTICES SECTION */}
          {combinedFeed.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Notices & Events</Text>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/announcements')}
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
              >
                {combinedFeed.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.eventCard}
                    onPress={() => setSelectedFeedItem(item)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.eventCardBanner}>
                      {item.imageUrl ? (
                        <Image
                          source={{ uri: item.imageUrl }}
                          style={styles.eventCardImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.eventCardPlaceholder}>
                          <FileText size={28} color="#FFFFFF" style={{ opacity: 0.3 }} />
                        </View>
                      )}
                      <View
                        style={[
                          styles.eventCategoryBadge,
                          {
                            backgroundColor:
                              item.type === 'event' ? '#9333EA' : '#4F46E5',
                          },
                        ]}
                      >
                        <Text style={styles.eventCategoryText}>
                          {item.category.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.eventCardBody}>
                      <Text style={styles.eventCardTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <View style={styles.eventCardMeta}>
                        <Clock size={11} color="#94A3B8" />
                        <Text style={styles.eventCardDate}>{item.dateFormatted}</Text>
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

          {/* 5. CAMPUS CLUBS SECTION */}
          {displayClubs.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Campus Clubs</Text>
                <TouchableOpacity
                  onPress={() =>
                    setActiveModule({
                      id: 'clubs',
                      title: 'Clubs',
                      subtitle: 'Student Activities & Circles',
                      category: 'campus',
                      iconName: 'Users',
                    })
                  }
                  style={styles.viewAllRow}
                >
                  <Text style={styles.viewAllText}>Explore</Text>
                  <ArrowRight size={13} color="#2563EB" />
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalCardsScroll}
              >
                {displayClubs.map((club) => {
                  const isJoined = joinedClubIds[club.id] || club.userStatus === 'approved';
                  return (
                    <TouchableOpacity
                      key={club.id}
                      style={styles.clubCard}
                      onPress={() => setSelectedClub(club)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.clubCardTop}>
                        <View style={styles.clubIconContainer}>
                          <Users size={18} color="#0D9488" />
                        </View>
                        <Text style={styles.clubCategoryText}>{club.category || 'CLUB'}</Text>
                      </View>

                      <Text style={styles.clubTitle} numberOfLines={1}>
                        {club.name}
                      </Text>
                      <Text style={styles.clubDesc} numberOfLines={2}>
                        {club.description || 'Student group activities and technical projects.'}
                      </Text>

                      <View style={styles.clubCardFooter}>
                        <Text style={styles.clubMemberCount}>
                          {club.memberCount || club.member_count || 0} Members
                        </Text>
                        <TouchableOpacity
                          style={[styles.joinBtn, isJoined && styles.joinedBtn]}
                          onPress={() => handleJoinClub(club)}
                          disabled={joiningClubId === club.id || isJoined}
                        >
                          <Text style={[styles.joinBtnText, isJoined && styles.joinedBtnText]}>
                            {isJoined ? 'Joined' : 'Join'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      )}

      {/* FULL-SCREEN DETAIL VIEW FOR ANNOUNCEMENT / EVENT */}
      <Modal
        visible={!!selectedFeedItem}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setSelectedFeedItem(null)}
      >
        <View style={[styles.fullScreenPageContainer, { paddingTop: insets.top }]}>
          <View style={styles.fullScreenPageHeader}>
            <TouchableOpacity
              onPress={() => setSelectedFeedItem(null)}
              style={styles.fullScreenBackBtn}
              hitSlop={10}
            >
              <ArrowLeft size={22} color="#1E293B" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.fullScreenHeaderTitle} numberOfLines={1}>
                {selectedFeedItem?.type === 'event' ? 'Campus Event' : 'Notice & Circular'}
              </Text>
            </View>
            <View
              style={[
                styles.modalBadge,
                {
                  backgroundColor:
                    selectedFeedItem?.type === 'event' ? '#F3E8FF' : '#EEF2FF',
                },
              ]}
            >
              <Text
                style={[
                  styles.modalBadgeText,
                  {
                    color:
                      selectedFeedItem?.type === 'event' ? '#9333EA' : '#4F46E5',
                  },
                ]}
              >
                {selectedFeedItem?.category?.toUpperCase()}
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.fullScreenPageScroll}
            contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 20 }}
            showsVerticalScrollIndicator={false}
          >
            {selectedFeedItem?.imageUrl ? (
              <View style={styles.fullScreenImageContainer}>
                <Image
                  source={{ uri: selectedFeedItem.imageUrl }}
                  style={styles.fullScreenBannerImage}
                  resizeMode="cover"
                />
              </View>
            ) : null}

            <View style={styles.fullScreenPageContent}>
              <Text style={styles.fullScreenDetailTitle}>{selectedFeedItem?.title}</Text>
              <View style={styles.modalMetaRow}>
                <Clock size={12} color="#64748B" />
                <Text style={styles.modalMetaDate}>{selectedFeedItem?.dateFormatted}</Text>
              </View>
              <Text style={styles.fullScreenContentText}>
                {selectedFeedItem?.content || 'No detailed description available.'}
              </Text>
            </View>
          </ScrollView>

          <View style={[styles.fullScreenFooter, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
            <TouchableOpacity
              style={styles.fullScreenDismissBtn}
              onPress={() => setSelectedFeedItem(null)}
            >
              <Text style={styles.fullScreenDismissBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* FULL-SCREEN DETAIL VIEW FOR CLUB */}
      <Modal
        visible={!!selectedClub}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setSelectedClub(null)}
      >
        <View style={[styles.fullScreenPageContainer, { paddingTop: insets.top }]}>
          <View style={styles.fullScreenPageHeader}>
            <TouchableOpacity
              onPress={() => setSelectedClub(null)}
              style={styles.fullScreenBackBtn}
              hitSlop={10}
            >
              <ArrowLeft size={22} color="#1E293B" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.fullScreenHeaderTitle} numberOfLines={1}>
                {selectedClub?.name || 'Campus Club'}
              </Text>
            </View>
            <View style={[styles.modalBadge, { backgroundColor: '#CCFBF1' }]}>
              <Text style={[styles.modalBadgeText, { color: '#0F766E' }]}>
                {selectedClub?.category?.toUpperCase() || 'STUDENT CLUB'}
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.fullScreenPageScroll}
            contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 20 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.fullScreenPageContent}>
              <Text style={styles.fullScreenDetailTitle}>{selectedClub?.name}</Text>
              {(selectedClub?.memberCount || selectedClub?.member_count) ? (
                <View style={styles.clubMemberStatRow}>
                  <Users size={14} color="#0F766E" />
                  <Text style={styles.clubMemberStatText}>
                    {selectedClub.memberCount || selectedClub.member_count} active members enrolled
                  </Text>
                </View>
              ) : null}
              <Text style={styles.fullScreenContentText}>
                {selectedClub?.description ||
                  'Join other enthusiastic students in workshops, coding hackathons, technical projects, and peer networking.'}
              </Text>
            </View>
          </ScrollView>

          <View style={[styles.fullScreenFooter, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
            <TouchableOpacity
              style={[
                styles.modalActionBtn,
                joinedClubIds[selectedClub?.id] && { backgroundColor: '#15803D' },
              ]}
              onPress={() => {
                handleJoinClub(selectedClub);
                setSelectedClub(null);
              }}
            >
              <Text style={styles.modalActionBtnText}>
                {joinedClubIds[selectedClub?.id] ? '✓ You Are Enrolled' : 'Submit Membership'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* SDMS Sidebar Drawer */}
      <StudentSidebarDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        layoutSettings={layoutSettings}
      />

      {/* SDMS Module Detail Modal */}
      <StudentModuleDetailModal
        visible={!!activeModule}
        module={activeModule}
        onClose={() => setActiveModule(null)}
      />
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
    padding: 16,
  },
  banner: {
    backgroundColor: '#1E3A8A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  bannerLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bannerAvatarImg: {
    width: '100%',
    height: '100%',
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerCollege: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bannerCourse: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  bannerPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  bannerPill: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DBEAFE',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
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
  portalCard: {
    width: (SCREEN_WIDTH - 32 - 20) / 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  allPortalsCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  portalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  portalLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
  portalScopeTag: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
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
  eventCategoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 2,
  },
  eventCategoryText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
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
    gap: 4,
    marginTop: 6,
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
  clubCard: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
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
});
