import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
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
  TrendingUp,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import StatCard from './StatCard';
import staffService, { StaffDashboardStats, StaffOperation } from '../services/staffService';
import logger from '../utils/logger';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const staff = user as any;

  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<StaffDashboardStats>({
    totalStudents: 0,
    todayPresent: 0,
    todayAbsent: 0,
    attendancePercentage: 0,
    totalCourses: 0,
    totalColleges: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [operations, setOperations] = useState<StaffOperation[]>([]);

  const loadStaffData = async () => {
    try {
      logger.info('STAFF_DASHBOARD', 'Loading staff metrics and permitted modules');
      const data = await staffService.getDashboardStats();
      setStats(data);

      const ops = staffService.getPermittedOperations(staff);
      setOperations(ops);
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

  const getOperationIcon = (iconName: string, color: string) => {
    switch (iconName) {
      case 'Users':
        return <Users size={22} color={color} />;
      case 'CalendarCheck':
        return <CalendarCheck size={22} color={color} />;
      case 'Split':
        return <Split size={22} color={color} />;
      case 'GraduationCap':
        return <GraduationCap size={22} color={color} />;
      case 'FileCheck':
        return <FileCheck size={22} color={color} />;
      case 'FileText':
        return <FileText size={22} color={color} />;
      case 'BookOpen':
        return <BookOpen size={22} color={color} />;
      case 'BarChart3':
        return <BarChart3 size={22} color={color} />;
      case 'ShieldCheck':
        return <ShieldCheck size={22} color={color} />;
      case 'LayoutDashboard':
      default:
        return <LayoutDashboard size={22} color={color} />;
    }
  };

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return;
    Alert.alert(
      'Student Search',
      `Searching database for: "${searchQuery.trim()}" across assigned campus scope.`
    );
  };

  const handleOperationPress = (op: StaffOperation) => {
    Alert.alert(
      op.label,
      `${op.description}\n\nPermitted under your staff role: ${staff?.role?.toUpperCase() || 'STAFF'}`
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title={`Welcome, ${staff?.name || staff?.username || 'Staff'}`}
        subtitle={`Role: ${(staff?.role || 'Staff').toUpperCase()} • Admin Portal`}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Staff Authority Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerTop}>
            <View style={styles.roleBadge}>
              <ShieldCheck size={14} color="#1E3A8A" />
              <Text style={styles.roleBadgeText}>
                {(staff?.role || 'Staff').replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            <Text style={styles.bannerScope}>
              {staff?.collegeId ? `College Scope #${staff.collegeId}` : 'Campus-Wide Master Access'}
            </Text>
          </View>
          <Text style={styles.bannerHeadline}>Institution Management Console</Text>
          <Text style={styles.bannerSub}>
            Real-time synchronization with Pydah SDMS Master Database.
          </Text>
        </View>

        {/* Quick Student Search */}
        <View style={styles.searchBar}>
          <Search size={18} color="#94A3B8" />
          <TextInput
            placeholder="Search student by Name, PIN or Roll Number..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleSearchSubmit} style={styles.searchGoBtn}>
              <Text style={styles.searchGoText}>Search</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Institution Live Metrics */}
        <Text style={styles.sectionTitle}>Institution Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            label="Total Students"
            value={stats.totalStudents.toLocaleString()}
            subValue="Enrolled Regular"
            icon={<Users size={18} color="#0284C7" />}
            color="#0284C7"
            style={styles.halfCard}
          />
          <StatCard
            label="Today's Attendance"
            value={`${stats.attendancePercentage}%`}
            subValue={`${stats.todayPresent} Present • ${stats.todayAbsent} Absent`}
            icon={<TrendingUp size={18} color="#059669" />}
            color="#059669"
            style={styles.halfCard}
          />
        </View>

        {/* Permitted Staff Modules */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Permitted Operations</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{operations.length} Enabled</Text>
          </View>
        </View>
        <Text style={styles.sectionSubtitle}>
          Configured according to your assigned RBAC modules and permissions:
        </Text>

        <View style={styles.operationsGrid}>
          {operations.map((op) => (
            <TouchableOpacity
              key={op.key}
              style={styles.opCard}
              onPress={() => handleOperationPress(op)}
              activeOpacity={0.7}
            >
              <View style={[styles.opIconWrap, { backgroundColor: `${op.color}15` }]}>
                {getOperationIcon(op.iconName, op.color)}
              </View>
              <View style={styles.opContent}>
                <Text style={styles.opTitle}>{op.label}</Text>
                <Text style={styles.opDesc} numberOfLines={2}>
                  {op.description}
                </Text>
              </View>
              <ChevronRight size={18} color="#CBD5E1" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

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
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  bannerScope: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  bannerHeadline: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  bannerSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
  },
  searchGoBtn: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  searchGoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  countBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    marginBottom: 10,
  },
  halfCard: {
    flex: 1,
  },
  operationsGrid: {
    gap: 10,
  },
  opCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  opIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  opContent: {
    flex: 1,
    marginRight: 8,
  },
  opTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  opDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});

export default StaffDashboard;

