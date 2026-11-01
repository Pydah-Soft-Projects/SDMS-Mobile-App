import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Users,
  CalendarCheck,
  Building2,
  Search,
  ShieldCheck,
  GraduationCap,
  FileCheck,
  FileText,
  BookOpen,
  BarChart3,
  Split,
  LayoutDashboard,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Megaphone,
  Briefcase,
  Settings,
  Menu,
  X,
  UserPlus,
  ClipboardList,
  LayoutGrid,
  CreditCard,
  PieChart,
  Tag,
  Award,
  MessageSquare,
  Smartphone,
  Calendar,
  UserCheck,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import StatCard from './StatCard';
import staffService, { StaffDashboardStats } from '../services/staffService';
import { AdminNavItem, AdminNavSubItem } from '../utils/rbac';
import logger from '../utils/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const StaffDashboard: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const staff = user as any;

  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<StaffDashboardStats>({
    totalStudents: 0,
    todayPresent: 0,
    todayAbsent: 0,
    attendancePercentage: 0,
    colleges: [],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [navItems, setNavItems] = useState<AdminNavItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedNavs, setExpandedNavs] = useState<Record<string, boolean>>({
    students: true,
  });

  const loadStaffData = async () => {
    try {
      const data = await staffService.getDashboardStats();
      setStats(data);

      const items = staffService.getPermittedNavItems(staff);
      setNavItems(items);
    } catch (e: any) {
      logger.error('STAFF_DASHBOARD', 'Failed to load staff metrics', e.message);
    }
  };

  useEffect(() => {
    loadStaffData();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStaffData();
    setRefreshing(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedNavs((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const navigateToOperation = (routeKey: string, subId?: string) => {
    setDrawerOpen(false);
    if (routeKey === 'dashboard') {
      return;
    }
    if (routeKey === 'attendance' && !subId) {
      router.push('/(tabs)/attendance' as any);
      return;
    }
    const path = subId
      ? (`/operation/${routeKey}?sub=${subId}` as any)
      : (`/operation/${routeKey}` as any);
    router.push(path);
  };

  const renderIcon = (name: string, size = 18, color = '#FFFFFF') => {
    switch (name) {
      case 'LayoutDashboard':
        return <LayoutDashboard size={size} color={color} />;
      case 'Users':
        return <Users size={size} color={color} />;
      case 'Database':
        return <Users size={size} color={color} />;
      case 'UserPlus':
        return <UserPlus size={size} color={color} />;
      case 'ClipboardList':
        return <ClipboardList size={size} color={color} />;
      case 'LayoutGrid':
        return <LayoutGrid size={size} color={color} />;
      case 'TrendingUp':
        return <TrendingUp size={size} color={color} />;
      case 'CreditCard':
        return <CreditCard size={size} color={color} />;
      case 'CalendarCheck':
        return <CalendarCheck size={size} color={color} />;
      case 'Briefcase':
        return <Briefcase size={size} color={color} />;
      case 'BarChart3':
        return <BarChart3 size={size} color={color} />;
      case 'FileText':
        return <FileText size={size} color={color} />;
      case 'PieChart':
        return <PieChart size={size} color={color} />;
      case 'Tag':
        return <Tag size={size} color={color} />;
      case 'Award':
        return <Award size={size} color={color} />;
      case 'FileCheck':
        return <FileCheck size={size} color={color} />;
      case 'MessageSquare':
        return <MessageSquare size={size} color={color} />;
      case 'ShieldCheck':
        return <ShieldCheck size={size} color={color} />;
      case 'Megaphone':
        return <Megaphone size={size} color={color} />;
      case 'Smartphone':
        return <Smartphone size={size} color={color} />;
      case 'Calendar':
        return <Calendar size={size} color={color} />;
      case 'UserCheck':
        return <UserCheck size={size} color={color} />;
      case 'Building2':
        return <Building2 size={size} color={color} />;
      case 'Settings':
      default:
        return <Settings size={size} color={color} />;
    }
  };

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return;
    router.push(`/operation/students?search=${encodeURIComponent(searchQuery.trim())}` as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Admin Portal"
        subtitle={`Welcome, ${staff?.name || staff?.username || 'Staff'}`}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Top Control Bar with Menu Button */}
        <View style={styles.menuBar}>
          <TouchableOpacity
            style={styles.menuTriggerBtn}
            onPress={() => setDrawerOpen(true)}
            activeOpacity={0.8}
          >
            <Menu size={18} color="#FFFFFF" />
            <Text style={styles.menuTriggerText}>All Modules & Pages</Text>
          </TouchableOpacity>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>
              {String(staff?.role || 'Staff').toUpperCase().replace(/_/g, ' ')}
            </Text>
          </View>
        </View>

        {/* Global Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={18} color="#64748B" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search student by Name, PIN or Roll No..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleSearchSubmit} style={styles.searchBtn}>
                <Text style={styles.searchBtnText}>Search</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Today's Institutional Metrics */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Institutional Overview</Text>
          <Text style={styles.sectionSub}>Live metrics from SDMS</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            label="Total Students"
            value={stats.totalStudents.toLocaleString()}
            icon={<Users size={18} color="#1E3A8A" />}
            color="#1E3A8A"
            subValue="Enrolled active"
            style={{ flex: 1 }}
          />
          <StatCard
            label="Attendance"
            value={`${stats.attendancePercentage}%`}
            icon={<CalendarCheck size={18} color="#059669" />}
            color="#059669"
            subValue="Today's aggregate"
            style={{ flex: 1 }}
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            label="Present Today"
            value={stats.todayPresent.toLocaleString()}
            icon={<CheckCircle size={18} color="#10B981" />}
            color="#10B981"
            subValue="Marked present"
            style={{ flex: 1 }}
          />
          <StatCard
            label="Absent Today"
            value={stats.todayAbsent.toLocaleString()}
            icon={<XCircle size={18} color="#EF4444" />}
            color="#EF4444"
            subValue="Absentees"
            style={{ flex: 1 }}
          />
        </View>

        {/* Permitted Operations & Subpages Section */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Permitted Modules</Text>
            <Text style={styles.sectionSub}>Select an operation to perform administrative actions</Text>
          </View>
          <TouchableOpacity onPress={() => setDrawerOpen(true)}>
            <Text style={styles.viewAllLink}>View Tree</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modulesGrid}>
          {navItems
            .filter((item) => item.id !== 'dashboard')
            .map((item) => (
              <View key={item.id} style={styles.moduleCard}>
                <TouchableOpacity
                  style={[styles.moduleCardHeader, { borderLeftColor: item.color }]}
                  onPress={() => navigateToOperation(item.routeKey)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.moduleIconBox, { backgroundColor: item.color }]}>
                    {renderIcon(item.iconName, 20, '#FFFFFF')}
                  </View>
                  <View style={styles.moduleInfo}>
                    <Text style={styles.moduleTitle}>{item.label}</Text>
                    <Text style={styles.moduleCount}>
                      {item.subItems ? `${item.subItems.length} Subpages` : 'Direct Operation'}
                    </Text>
                  </View>
                  <ChevronRight size={18} color="#94A3B8" />
                </TouchableOpacity>

                {/* Sub-item quick chips */}
                {item.subItems && item.subItems.length > 0 && (
                  <View style={styles.chipsContainer}>
                    {item.subItems.map((sub) => (
                      <TouchableOpacity
                        key={sub.id}
                        style={styles.subChip}
                        onPress={() => navigateToOperation(item.routeKey, sub.id)}
                        activeOpacity={0.6}
                      >
                        <Text style={styles.subChipText} numberOfLines={1}>
                          {sub.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}
        </View>

        {/* College Attendance Breakdown */}
        {stats.colleges.length > 0 && (
          <View style={styles.collegeBreakdownSection}>
            <Text style={styles.sectionTitle}>College-Wise Today's Attendance</Text>
            <View style={styles.tableCard}>
              <View style={styles.tableHeader}>
                <Text style={[styles.thCell, { flex: 2 }]}>College</Text>
                <Text style={styles.thCell}>Total</Text>
                <Text style={styles.thCell}>Present</Text>
                <Text style={styles.thCell}>Rate</Text>
              </View>
              {stats.colleges.map((col, index) => (
                <View
                  key={index}
                  style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}
                >
                  <Text style={[styles.tdCell, { flex: 2, fontWeight: '600' }]} numberOfLines={1}>
                    {col.college}
                  </Text>
                  <Text style={styles.tdCell}>{col.total}</Text>
                  <Text style={[styles.tdCell, { color: '#059669', fontWeight: '700' }]}>
                    {col.present}
                  </Text>
                  <Text style={[styles.tdCell, { color: '#1E3A8A', fontWeight: '700' }]}>
                    {col.rate.toFixed(1)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* FULL-SCREEN SLIDE OVER NAVIGATION MENU (Matches web sidebar in screenshot) */}
      <Modal
        visible={drawerOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setDrawerOpen(false)}
      >
        <SafeAreaView style={styles.drawerContainer}>
          {/* Drawer Header */}
          <View style={styles.drawerHeader}>
            <View style={styles.drawerBrandRow}>
              <View style={styles.drawerLogoCircle}>
                <Building2 size={20} color="#84CC16" />
              </View>
              <View>
                <Text style={styles.drawerBrandTitle}>SDMS Navigation</Text>
                <Text style={styles.drawerBrandSub}>
                  {String(staff?.role || 'Staff').replace(/_/g, ' ')} Portal
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.drawerCloseBtn}
              onPress={() => setDrawerOpen(false)}
              hitSlop={10}
            >
              <X size={22} color="#E2E8F0" />
            </TouchableOpacity>
          </View>

          {/* Drawer Navigation List */}
          <ScrollView contentContainerStyle={styles.drawerList}>
            {navItems.map((item) => {
              const hasSub = item.subItems && item.subItems.length > 0;
              const isExpanded = !!expandedNavs[item.id];

              return (
                <View key={item.id} style={styles.navGroup}>
                  <TouchableOpacity
                    style={[
                      styles.navItemBtn,
                      hasSub && isExpanded && styles.navItemBtnExpanded,
                    ]}
                    onPress={() => {
                      if (hasSub) {
                        toggleExpand(item.id);
                      } else {
                        navigateToOperation(item.routeKey);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.navItemLeft}>
                      <View style={styles.navItemIcon}>
                        {renderIcon(item.iconName, 20, '#A3E635')}
                      </View>
                      <Text style={styles.navItemLabel}>{item.label}</Text>
                    </View>
                    {hasSub ? (
                      isExpanded ? (
                        <ChevronDown size={18} color="#94A3B8" />
                      ) : (
                        <ChevronRight size={18} color="#94A3B8" />
                      )
                    ) : null}
                  </TouchableOpacity>

                  {/* Sub-Items dropdown */}
                  {hasSub && isExpanded && (
                    <View style={styles.subItemContainer}>
                      {item.subItems!.map((sub: AdminNavSubItem) => (
                        <TouchableOpacity
                          key={sub.id}
                          style={styles.subItemBtn}
                          onPress={() => navigateToOperation(item.routeKey, sub.id)}
                          activeOpacity={0.6}
                        >
                          <View style={styles.subItemDot} />
                          <View style={styles.subItemIconBox}>
                            {renderIcon(sub.iconName, 15, '#CBD5E1')}
                          </View>
                          <Text style={styles.subItemLabel}>{sub.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  menuBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  menuTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2C22',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuTriggerText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  rolePill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  rolePillText: {
    color: '#1E3A8A',
    fontWeight: '700',
    fontSize: 11,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  searchBtn: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  viewAllLink: {
    fontSize: 13,
    color: '#1E3A8A',
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  modulesGrid: {
    gap: 12,
  },
  moduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  moduleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderLeftWidth: 4,
  },
  moduleIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  moduleCount: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  subChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  subChipText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  collegeBreakdownSection: {
    marginTop: 20,
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  thCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRowAlt: {
    backgroundColor: '#FAFAFA',
  },
  tdCell: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    textAlign: 'center',
  },

  /* Drawer Modal Styles (Exact Dark Green / Theme from Web Sidebar) */
  drawerContainer: {
    flex: 1,
    backgroundColor: '#162118',
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#283618',
  },
  drawerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  drawerLogoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#283618',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerBrandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  drawerBrandSub: {
    fontSize: 11,
    color: '#A3E635',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  drawerCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#283618',
  },
  drawerList: {
    padding: 12,
    paddingBottom: 40,
  },
  navGroup: {
    marginBottom: 6,
  },
  navItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  navItemBtnExpanded: {
    backgroundColor: '#283618',
  },
  navItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navItemIcon: {
    width: 28,
    alignItems: 'center',
  },
  navItemLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  subItemContainer: {
    marginTop: 4,
    paddingLeft: 20,
    borderLeftWidth: 2,
    borderLeftColor: '#283618',
    marginLeft: 26,
    gap: 2,
  },
  subItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 10,
  },
  subItemDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#A3E635',
  },
  subItemIconBox: {
    width: 18,
    alignItems: 'center',
  },
  subItemLabel: {
    fontSize: 13,
    color: '#CBD5E1',
    fontWeight: '500',
  },
});

export default StaffDashboard;
