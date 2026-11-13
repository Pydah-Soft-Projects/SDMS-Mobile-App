import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
  Easing,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Home,
  CalendarCheck,
  CreditCard,
  Bell,
  User,
  Clock,
  Award,
  BookOpen,
  Calendar,
  ShieldCheck,
  FileText,
  FolderOpen,
  Bus,
  Users,
  MessageSquare,
  Ticket,
  UserCheck,
  Briefcase,
  ChevronRight,
  LogOut,
  Layers,
  GraduationCap,
  Sparkles,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { getStaticFileUrl } from '../config/api';
import studentService from '../services/studentService';
import { StudentModuleItem } from './StudentModuleDetailModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.84, 340);

export interface SDMSModuleItem extends StudentModuleItem {
  layoutKey: string;
  isTab?: boolean;
  tabRoute?: string;
}

/**
 * All student-side SDMS modules mapped to their exact keys in SDMS Student Portal Layout Settings.
 * Exactly corresponds to the 18 items in frontend/src/components/Layout/StudentLayout.jsx
 */
export const SDMS_STUDENT_SECTIONS: {
  categoryTitle: string;
  items: SDMSModuleItem[];
}[] = [
  {
    categoryTitle: 'Core Academic Portals',
    items: [
      {
        id: 'dashboard',
        layoutKey: 'dashboard',
        title: 'Dashboard',
        subtitle: 'Main Academic Overview',
        category: 'academics',
        iconName: 'Home',
        isTab: true,
        tabRoute: '/(tabs)',
      },
      {
        id: 'attendance',
        layoutKey: 'attendance',
        title: 'Attendance',
        subtitle: 'Live Biometric Records',
        category: 'academics',
        iconName: 'CalendarCheck',
        isTab: true,
        tabRoute: '/(tabs)/attendance',
      },
      {
        id: 'timetable',
        layoutKey: 'timetable',
        title: 'Time Table',
        subtitle: 'Weekly Academic Schedule',
        category: 'academics',
        iconName: 'Clock',
      },
      {
        id: 'events',
        layoutKey: 'events',
        title: 'Events',
        subtitle: 'College Events & Schedule',
        category: 'academics',
        iconName: 'Calendar',
      },
      {
        id: 'semester-registration',
        layoutKey: 'semester-registration',
        title: 'Sem Registration',
        subtitle: 'Enrollment & Documentation',
        category: 'academics',
        iconName: 'ShieldCheck',
      },
    ],
  },
  {
    categoryTitle: 'Finance & Administration',
    items: [
      {
        id: 'fees',
        layoutKey: 'fees',
        title: 'Fee Management',
        subtitle: 'Ledgers, Payments & Receipts',
        category: 'finance',
        iconName: 'CreditCard',
        isTab: true,
        tabRoute: '/(tabs)/fees',
      },
      {
        id: 'scholarship',
        layoutKey: 'scholarship',
        title: 'Scholarship',
        subtitle: 'JVD / RTF Status & History',
        category: 'finance',
        iconName: 'Award',
      },
      {
        id: 'services',
        layoutKey: 'services',
        title: 'Services',
        subtitle: 'Bonafide, Custodian & Slips',
        category: 'finance',
        iconName: 'FileText',
      },
      {
        id: 'my-documents',
        layoutKey: 'my-documents',
        title: 'My Documents',
        subtitle: 'Submitted Certificates in Custody',
        category: 'finance',
        iconName: 'FolderOpen',
      },
    ],
  },
  {
    categoryTitle: 'Campus Facilities & Life',
    items: [
      {
        id: 'announcements',
        layoutKey: 'announcements',
        title: 'Announcements',
        subtitle: 'Official College & Dept Notices',
        category: 'campus',
        iconName: 'Bell',
        isTab: true,
        tabRoute: '/(tabs)/announcements',
      },
      {
        id: 'clubs',
        layoutKey: 'clubs',
        title: 'Clubs',
        subtitle: 'Student Activities & Circles',
        category: 'campus',
        iconName: 'Users',
      },
      {
        id: 'transport',
        layoutKey: 'transport',
        title: 'Transport',
        subtitle: 'Bus Routes, Stops & Passes',
        category: 'campus',
        iconName: 'Bus',
      },
      {
        id: 'library',
        layoutKey: 'library',
        title: 'Library',
        subtitle: 'Book Search & Central Catalog',
        category: 'campus',
        iconName: 'BookOpen',
      },
    ],
  },
  {
    categoryTitle: 'Career & Student Support',
    items: [
      {
        id: 'internship',
        layoutKey: 'internship',
        title: 'Internship',
        subtitle: 'Industry Assignments & Logs',
        category: 'support',
        iconName: 'Briefcase',
      },
      {
        id: 'crt',
        layoutKey: 'crt',
        title: 'CRT Training Portal',
        subtitle: 'Campus Recruitment Training (SSO)',
        category: 'support',
        iconName: 'Briefcase',
      },
      {
        id: 'feedback',
        layoutKey: 'feedback',
        title: 'Feed Back',
        subtitle: 'Faculty & Course Surveys',
        category: 'support',
        iconName: 'MessageSquare',
      },
      {
        id: 'my-tickets',
        layoutKey: 'my-tickets',
        title: 'Maintenance',
        subtitle: 'Raise & Track Support Tickets',
        category: 'support',
        iconName: 'Ticket',
      },
      {
        id: 'ai-assistant',
        layoutKey: 'ai-assistant',
        title: 'AI Assistant',
        subtitle: 'Campo Academic Assistant',
        category: 'support',
        iconName: 'Sparkles',
      },
    ],
  },
];

export const getStudentModuleById = (id: string): SDMSModuleItem => {
  for (const section of SDMS_STUDENT_SECTIONS) {
    const item = section.items.find((i) => i.id === id || i.layoutKey === id);
    if (item) return item;
  }
  return {
    id,
    layoutKey: id,
    title: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' '),
    subtitle: 'Academic Service Portal',
    category: 'academics',
    iconName: 'Layers',
  };
};

interface StudentSidebarDrawerProps {
  visible: boolean;
  onClose: () => void;
  layoutSettings?: Record<string, boolean>;
}

// Category palette helper for polished icon cards
const getCategoryPalette = (category?: string) => {
  switch (category) {
    case 'academics':
      return { bg: '#EFF6FF', icon: '#2563EB', border: '#DBEAFE' };
    case 'finance':
      return { bg: '#ECFDF5', icon: '#059669', border: '#A7F3D0' };
    case 'campus':
      return { bg: '#FAF5FF', icon: '#7C3AED', border: '#E9D5FF' };
    case 'support':
      return { bg: '#FFF7ED', icon: '#EA580C', border: '#FED7AA' };
    default:
      return { bg: '#F1F5F9', icon: '#1E3A8A', border: '#E2E8F0' };
  }
};

export const StudentSidebarDrawer: React.FC<StudentSidebarDrawerProps> = ({
  visible,
  onClose,
  layoutSettings: externalLayoutSettings,
}) => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const student = user as any;

  const [internalLayout, setInternalLayout] = useState<Record<string, boolean> | null>(
    externalLayoutSettings || null
  );
  const [modalVisible, setModalVisible] = useState(visible);
  const drawerTranslateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const hasOpened = useRef(visible);

  // Smooth synchronized sliding & backdrop opacity animation
  useEffect(() => {
    drawerTranslateX.stopAnimation();

    if (visible) {
      hasOpened.current = true;
      drawerTranslateX.setValue(-DRAWER_WIDTH);
      setModalVisible(true);

      Animated.spring(drawerTranslateX, {
        toValue: 0,
        damping: 26,
        mass: 0.8,
        stiffness: 240,
        useNativeDriver: true,
      }).start();
      return;
    }

    if (hasOpened.current) {
      Animated.timing(drawerTranslateX, {
        toValue: -DRAWER_WIDTH,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          hasOpened.current = false;
          setModalVisible(false);
        }
      });
    }
  }, [visible, drawerTranslateX]);

  // Smooth dismiss handler
  const handleClose = () => {
    Animated.timing(drawerTranslateX, {
      toValue: -DRAWER_WIDTH,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        hasOpened.current = false;
        setModalVisible(false);
        onClose();
      }
    });
  };

  // Directly fetch SDMS Student Portal Layout settings if not provided
  useEffect(() => {
    if (externalLayoutSettings) {
      setInternalLayout(externalLayoutSettings);
    } else if (visible) {
      studentService.getLayoutSettings().then((settings) => {
        if (settings) setInternalLayout(settings);
      });
    }
  }, [externalLayoutSettings, visible]);

  // Filter modules directly based on SDMS Student Portal Layout settings
  const activeSections = useMemo(() => {
    const layout = internalLayout || externalLayoutSettings;
    if (!layout) {
      return SDMS_STUDENT_SECTIONS;
    }
    return SDMS_STUDENT_SECTIONS.map((sectionGroup) => {
      const activeItems = sectionGroup.items.filter((item) => {
        if (layout[item.layoutKey] === false) return false;
        if (layout[item.id] === false) return false;
        return true;
      });
      return {
        ...sectionGroup,
        items: activeItems,
      };
    }).filter((sectionGroup) => sectionGroup.items.length > 0);
  }, [internalLayout, externalLayoutSettings]);

  const totalActiveCount = activeSections.reduce((sum, s) => sum + s.items.length, 0);

  const avatarUrl = student?.avatarUrl || student?.student_photo ? getStaticFileUrl(student.avatarUrl || student.student_photo) : null;
  const course = student?.course || student?.course_name || '';
  const branch = student?.branch || student?.branch_name || '';
  const semester = student?.current_semester || '';
  const section = student?.section || '';
  const batch = student?.batch || '';
  const quota = student?.quota || student?.stud_type || '';
  const pathname = usePathname();

  const isItemActive = (item: SDMSModuleItem) => {
    if (!pathname) return false;
    if (item.id === 'dashboard') {
      return pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index';
    }
    if (item.isTab && item.tabRoute) {
      return pathname === item.tabRoute || pathname.startsWith(item.tabRoute);
    }
    return (
      pathname.includes(`/student-module/${item.id}`) ||
      pathname.endsWith(`/${item.id}`)
    );
  };

  const handleItemPress = (item: SDMSModuleItem) => {
    handleClose();
    if (item.isTab && item.tabRoute) {
      router.push(item.tabRoute as any);
    } else {
      router.push(`/student-module/${item.id}` as any);
    }
  };

  const renderIcon = (name: string, size = 18, color = '#2563EB') => {
    switch (name) {
      case 'Home': return <Home size={size} color={color} />;
      case 'CalendarCheck': return <CalendarCheck size={size} color={color} />;
      case 'Clock': return <Clock size={size} color={color} />;
      case 'Award': return <Award size={size} color={color} />;
      case 'BookOpen': return <BookOpen size={size} color={color} />;
      case 'Calendar': return <Calendar size={size} color={color} />;
      case 'ShieldCheck': return <ShieldCheck size={size} color={color} />;
      case 'CreditCard': return <CreditCard size={size} color={color} />;
      case 'FileText': return <FileText size={size} color={color} />;
      case 'FolderOpen': return <FolderOpen size={size} color={color} />;
      case 'Bus': return <Bus size={size} color={color} />;
      case 'Users': return <Users size={size} color={color} />;
      case 'Bell': return <Bell size={size} color={color} />;
      case 'MessageSquare': return <MessageSquare size={size} color={color} />;
      case 'Ticket': return <Ticket size={size} color={color} />;
      case 'UserCheck': return <UserCheck size={size} color={color} />;
      case 'Briefcase': return <Briefcase size={size} color={color} />;
      case 'Sparkles': return <Sparkles size={size} color={color} />;
      case 'User': return <User size={size} color={color} />;
      default: return <Layers size={size} color={color} />;
    }
  };

  // Interpolated backdrop opacity matching drawer translation
  const backdropOpacity = drawerTranslateX.interpolate({
    inputRange: [-DRAWER_WIDTH, 0],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <Modal visible={modalVisible} animationType="none" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        {/* Animated backdrop with touch dismiss */}
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleClose}
          />
        </Animated.View>

        {/* Sliding Drawer Container */}
        <Animated.View
          style={[
            styles.drawerContainer,
            { transform: [{ translateX: drawerTranslateX }] },
          ]}
        >
          <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'bottom']}>
            {/* Clean Drawer Header Bar (Top profile card removed as requested) */}
            <View style={styles.cleanDrawerHeader}>
              <View style={styles.drawerTitleRow}>
                <Layers size={18} color="#1E3A8A" />
                <Text style={styles.cleanDrawerTitle}>Portals & Navigation</Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.cleanCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Scrollable SDMS Portals Navigation List */}
            <ScrollView
              contentContainerStyle={styles.scrollList}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {activeSections.map((sectionGroup, sIdx) => (
                <View key={sIdx} style={styles.section}>
                  {/* Category Header with Indicator Accent */}
                  <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionTitleRow}>
                      <View style={styles.categoryAccentBar} />
                      <Text style={styles.sectionHeader}>{sectionGroup.categoryTitle}</Text>
                    </View>
                    <View style={styles.sectionCountTag}>
                      <Text style={styles.sectionCountText}>{sectionGroup.items.length}</Text>
                    </View>
                  </View>

                  {/* Module Cards */}
                  {sectionGroup.items.map((item) => {
                    const active = isItemActive(item);
                    const palette = getCategoryPalette(item.category);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.moduleItem,
                          active && styles.moduleItemActive,
                        ]}
                        onPress={() => handleItemPress(item)}
                        activeOpacity={0.7}
                      >
                        {active && <View style={styles.activeBar} />}
                        <View
                          style={[
                            styles.itemIconContainer,
                            active
                              ? styles.itemIconContainerActive
                              : { backgroundColor: palette.bg, borderColor: palette.border },
                          ]}
                        >
                          {renderIcon(item.iconName, 18, active ? '#FFFFFF' : palette.icon)}
                        </View>
                        <View style={styles.itemTextContainer}>
                          <Text style={[styles.itemTitle, active && styles.itemTitleActive]}>{item.title}</Text>
                          <Text style={[styles.itemSub, active && styles.itemSubActive]} numberOfLines={1}>
                            {item.subtitle}
                          </Text>
                        </View>
                        {active ? (
                          <View style={styles.activePillBadge}>
                            <Text style={styles.activePillBadgeText}>CURRENT</Text>
                          </View>
                        ) : (
                          <View style={styles.chevronBox}>
                            <ChevronRight size={14} color="#94A3B8" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}

              {/* Sign Out Card */}
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => {
                  handleClose();
                  logout();
                }}
                activeOpacity={0.8}
              >
                <View style={styles.logoutIconBox}>
                  <LogOut size={16} color="#DC2626" />
                </View>
                <Text style={styles.logoutText}>Sign Out of Student Account</Text>
              </TouchableOpacity>

              {/* Footer Note */}
              <View style={styles.drawerFooter}>
                <Text style={styles.footerBrand}>Campo SDMS Portal • Pydah Soft</Text>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  drawerContainer: {
    width: DRAWER_WIDTH,
    backgroundColor: '#F8FAFC',
    height: '100%',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  cleanDrawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  drawerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cleanDrawerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  cleanCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#1E3A8A',
  },
  profileInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  pinBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 3,
  },
  studentPin: {
    fontSize: 11,
    color: '#E0F2FE',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  studentCourse: {
    fontSize: 11,
    color: '#93C5FD',
    marginTop: 3,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scopeBadgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  scopePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  portalCountPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  scopePillText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#DBEAFE',
  },
  scrollList: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryAccentBar: {
    width: 3,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#2563EB',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionCountTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  sectionCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  moduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2F6',
    marginBottom: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  itemIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  itemSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  moduleItemActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
    borderWidth: 1.5,
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 4,
    borderRadius: 2,
    backgroundColor: '#1D4ED8',
  },
  itemIconContainerActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  itemTitleActive: {
    color: '#1E3A8A',
    fontWeight: '800',
  },
  itemSubActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  activePillBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activePillBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 0.5,
  },
  chevronBox: {
    paddingLeft: 4,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 8,
  },
  logoutIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#DC2626',
  },
  drawerFooter: {
    alignItems: 'center',
    marginTop: 18,
    paddingBottom: 8,
  },
  footerBrand: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
});

export default StudentSidebarDrawer;
