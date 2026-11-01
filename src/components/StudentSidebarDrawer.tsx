import React, { useState } from 'react';
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
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { getStaticFileUrl } from '../config/api';
import { StudentModuleItem, StudentModuleDetailModal } from './StudentModuleDetailModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StudentSidebarDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export const STUDENT_SIDEBAR_MODULES: {
  category: string;
  items: (StudentModuleItem & { isTab?: boolean; tabRoute?: string })[];
}[] = [
  {
    category: 'Core Academic Portals',
    items: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        subtitle: 'Main Academic Overview',
        category: 'academics',
        iconName: 'Home',
        isTab: true,
        tabRoute: '/(tabs)',
      },
      {
        id: 'attendance',
        title: 'Attendance Tracker',
        subtitle: 'Live Biometric Records',
        category: 'academics',
        iconName: 'CalendarCheck',
        isTab: true,
        tabRoute: '/(tabs)/attendance',
      },
      {
        id: 'timetable',
        title: 'Class Timetable',
        subtitle: 'Period Slots & Weekly Grid',
        category: 'academics',
        iconName: 'Clock',
      },
      {
        id: 'marks',
        title: 'Internal Marks',
        subtitle: 'Mid-1, Mid-2 & Assignments',
        category: 'academics',
        iconName: 'Award',
      },
      {
        id: 'content',
        title: 'Academic Content',
        subtitle: 'Lecture Handouts & Notes',
        category: 'academics',
        iconName: 'BookOpen',
      },
      {
        id: 'calendar',
        title: 'Academic Calendar',
        subtitle: 'Semester Working Days',
        category: 'academics',
        iconName: 'Calendar',
      },
      {
        id: 'registration',
        title: 'Semester Registration',
        subtitle: 'Progression & Verification',
        category: 'academics',
        iconName: 'ShieldCheck',
      },
    ],
  },
  {
    category: 'Finance & Administration',
    items: [
      {
        id: 'fees',
        title: 'Fee Management',
        subtitle: 'Dues & PPG Online Payment',
        category: 'finance',
        iconName: 'CreditCard',
        isTab: true,
        tabRoute: '/(tabs)/fees',
      },
      {
        id: 'scholarship',
        title: 'Scholarship Status',
        subtitle: 'JVD / RTF Disbursement',
        category: 'finance',
        iconName: 'Award',
      },
      {
        id: 'services',
        title: 'Certificate Requests',
        subtitle: 'Bonafide, Custodian & TC',
        category: 'finance',
        iconName: 'FileText',
      },
      {
        id: 'documents',
        title: 'Document Vault',
        subtitle: 'SSC, Inter & Certificates',
        category: 'finance',
        iconName: 'FolderOpen',
      },
    ],
  },
  {
    category: 'Campus Facilities & Life',
    items: [
      {
        id: 'library',
        title: 'Campus Library',
        subtitle: 'Book Issues & Catalog',
        category: 'campus',
        iconName: 'BookOpen',
      },
      {
        id: 'transport',
        title: 'Transport & Bus',
        subtitle: 'Route & Vehicle Tracking',
        category: 'campus',
        iconName: 'Bus',
      },
      {
        id: 'clubs',
        title: 'Student Clubs',
        subtitle: 'Life Savers & Committees',
        category: 'campus',
        iconName: 'Users',
      },
      {
        id: 'announcements',
        title: 'Campus Circulars',
        subtitle: 'Official Notices & Exams',
        category: 'campus',
        iconName: 'Bell',
        isTab: true,
        tabRoute: '/(tabs)/announcements',
      },
    ],
  },
  {
    category: 'Support & Career',
    items: [
      {
        id: 'feedback',
        title: 'Feedback Portal',
        subtitle: 'Faculty Rating & Surveys',
        category: 'support',
        iconName: 'MessageSquare',
      },
      {
        id: 'tickets',
        title: 'Helpdesk Tickets',
        subtitle: 'Service & Maintenance',
        category: 'support',
        iconName: 'Ticket',
      },
      {
        id: 'profile-requests',
        title: 'Profile Requests',
        subtitle: 'Mobile & Photo Changes',
        category: 'support',
        iconName: 'UserCheck',
      },
      {
        id: 'crt',
        title: 'CRT Training Portal',
        subtitle: 'Placement Training Workspace',
        category: 'support',
        iconName: 'Briefcase',
      },
      {
        id: 'profile',
        title: 'My Profile',
        subtitle: 'Institutional KYC Details',
        category: 'support',
        iconName: 'User',
        isTab: true,
        tabRoute: '/(tabs)/profile',
      },
    ],
  },
];

export const StudentSidebarDrawer: React.FC<StudentSidebarDrawerProps> = ({ visible, onClose }) => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const student = user as any;

  const [selectedModule, setSelectedModule] = useState<StudentModuleItem | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const avatarUrl = student?.avatarUrl ? getStaticFileUrl(student.avatarUrl) : null;

  const handleItemPress = (item: (typeof STUDENT_SIDEBAR_MODULES)[0]['items'][0]) => {
    onClose();
    if (item.isTab && item.tabRoute) {
      router.push(item.tabRoute as any);
    } else {
      setSelectedModule(item);
      setDetailModalVisible(true);
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
              {/* Drawer Student Profile Banner */}
              <View style={styles.profileHeader}>
                <View style={styles.profileRow}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {(student?.name || student?.username || 'S')[0].toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.profileInfo}>
                    <Text style={styles.studentName} numberOfLines={1}>
                      {student?.name || 'Student'}
                    </Text>
                    <Text style={styles.studentPin}>
                      PIN: {student?.pin_no || student?.admission_number || 'N/A'}
                    </Text>
                    <Text style={styles.studentCourse} numberOfLines={1}>
                      {student?.course || 'B.Tech'} - {student?.branch || 'Branch'} (Sem {student?.current_semester || 1})
                    </Text>
                  </View>
                  <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
                    <X size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* All Student Pages List */}
              <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
                {STUDENT_SIDEBAR_MODULES.map((section, sIdx) => (
                  <View key={sIdx} style={styles.section}>
                    <Text style={styles.sectionHeader}>{section.category}</Text>
                    {section.items.map((item) => (
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
                          <Text style={styles.itemSub}>{item.subtitle}</Text>
                        </View>
                        <ChevronRight size={16} color="#CBD5E1" />
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
                  <LogOut size={18} color="#EF4444" />
                  <Text style={styles.logoutText}>Sign Out of Student Account</Text>
                </TouchableOpacity>
              </ScrollView>
            </SafeAreaView>
          </View>
        </View>
      </Modal>

      {/* Module Detail Modal */}
      <StudentModuleDetailModal
        visible={detailModalVisible}
        module={selectedModule}
        onClose={() => setDetailModalVisible(false)}
      />
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
    width: Math.min(SCREEN_WIDTH * 0.85, 340),
    backgroundColor: '#FFFFFF',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
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
    paddingBottom: 18,
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
  },
  studentCourse: {
    fontSize: 11,
    color: '#93C5FD',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  scrollList: {
    padding: 14,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 18,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
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
    width: 32,
    height: 32,
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
    marginTop: 10,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
});

