import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
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
import { StudentModuleItem, StudentModuleDetailModal } from './StudentModuleDetailModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
        subtitle: 'Pydah Academic Assistant',
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
  const [selectedModule, setSelectedModule] = useState<StudentModuleItem | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

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
        // Direct layout toggle check from SDMS database settings
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

  const handleItemPress = (item: SDMSModuleItem) => {
    onClose();
    if (item.isTab && item.tabRoute) {
      router.push(item.tabRoute as any);
    } else {
      router.push(`/student-module/${item.id}` as any);
    }
  };

  const renderIcon = (name: string, size = 18, color = '#1E3A8A') => {
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

  return (
    <>
      <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

          <View style={styles.drawerContainer}>
            <SafeAreaView style={styles.safeArea}>
              {/* Student Profile Header */}
              <View style={styles.profileHeader}>
                <View style={styles.profileRow}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {(student?.name || student?.student_name || student?.username || 'S')[0].toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.profileInfo}>
                    <Text style={styles.studentName} numberOfLines={1}>
                      {student?.name || student?.student_name || 'Student Portal'}
                    </Text>
                    <Text style={styles.studentPin}>
                      PIN: {student?.pin_no || student?.admission_number || 'N/A'}
                    </Text>
                    <Text style={styles.studentCourse} numberOfLines={1}>
                      {course ? `${course} - ${branch}` : 'Student Record'}
                      {semester ? ` • Sem ${semester}` : ''}
                      {section ? ` (Sec ${section})` : ''}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
                    <X size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {/* SDMS Metadata Pills */}
                <View style={styles.scopeBadgeContainer}>
                  {batch ? (
                    <View style={styles.scopePill}>
                      <GraduationCap size={11} color="#93C5FD" />
                      <Text style={styles.scopePillText}>Batch {batch}</Text>
                    </View>
                  ) : null}
                  {quota ? (
                    <View style={styles.scopePill}>
                      <ShieldCheck size={11} color="#93C5FD" />
                      <Text style={styles.scopePillText}>Quota: {quota}</Text>
                    </View>
                  ) : null}
                  <View style={[styles.scopePill, { backgroundColor: 'rgba(5, 150, 105, 0.3)' }]}>
                    <Sparkles size={11} color="#34D399" />
                    <Text style={[styles.scopePillText, { color: '#6EE7B7' }]}>
                      {totalActiveCount} SDMS Portals
                    </Text>
                  </View>
                </View>
              </View>

              {/* Dynamic SDMS Portals List */}
              <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
                {activeSections.map((sectionGroup, sIdx) => (
                  <View key={sIdx} style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.sectionHeader}>{sectionGroup.categoryTitle}</Text>
                      <Text style={styles.sectionCountTag}>{sectionGroup.items.length}</Text>
                    </View>

                    {sectionGroup.items.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.moduleItem}
                        onPress={() => handleItemPress(item)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.itemIconContainer}>
                          {renderIcon(item.iconName, 18, '#1E3A8A')}
                        </View>
                        <View style={styles.itemTextContainer}>
                          <Text style={styles.itemTitle}>{item.title}</Text>
                          <Text style={styles.itemSub} numberOfLines={1}>
                            {item.subtitle}
                          </Text>
                        </View>
                        <ChevronRight size={15} color="#CBD5E1" />
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}

                {/* Sign Out Action */}
                <TouchableOpacity
                  style={styles.logoutBtn}
                  onPress={() => {
                    onClose();
                    logout();
                  }}
                >
                  <LogOut size={16} color="#EF4444" />
                  <Text style={styles.logoutText}>Sign Out of Student Account</Text>
                </TouchableOpacity>
              </ScrollView>
            </SafeAreaView>
          </View>
        </View>
      </Modal>


    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  drawerContainer: {
    width: Math.min(SCREEN_WIDTH * 0.86, 350),
    backgroundColor: '#FFFFFF',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: -3, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 16,
  },
  safeArea: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  studentPin: {
    fontSize: 11,
    color: '#BFDBFE',
    marginTop: 2,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  studentCourse: {
    fontSize: 11,
    color: '#93C5FD',
    marginTop: 1,
    fontWeight: '500',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
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
  scopePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#DBEAFE',
  },
  scrollList: {
    padding: 14,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginLeft: 4,
    marginRight: 4,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCountTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E3A8A',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  moduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 6,
  },
  itemIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
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
    color: '#1E293B',
  },
  itemSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginTop: 8,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
});
