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
    colleges: [],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [operations, setOperations] = useState<StaffOperation[]>([]);

  const loadStaffData = async () => {
    try {
      logger.info('STAFF_DASHBOARD', 'Syncing real SDMS metrics and permitted operations');
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
      'SDMS Student Search',
      `Searching student database for: "${searchQuery.trim()}" across permitted campus scopes.`
    );
  };

  const handleOperationPress = (op: StaffOperation) => {
    Alert.alert(
      op.label,
      `${op.description}\n\nAssigned module active for your role: ${(staff?.role || 'staff').toUpperCase()}`
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title={`Welcome, ${staff?.name || staff?.username || 'Staff'}`}
        subtitle={`Role: ${(staff?.role || 'Staff').toUpperCase()} • Admin Console`}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Authority Level Card */}
        <View style={styles.banner}>
          <View style={styles.bannerTop}>
            <View style={styles.roleBadge}>
              <ShieldCheck size={14} color="#1E3A8A" />
              <Text style={styles.roleBadgeText}>
                {(staff?.role || 'Staff').replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            <Text style={styles.bannerScope}>
              {staff?.collegeId ? `College ID #${staff.collegeId}` : 'Institutional Master Access'}
            </Text>
          </View>
          <Text style={styles.bannerHeadline}>SDMS Institution Console</Text>
          <Text style={styles.bannerSub}>
            Live metrics from Pydah Student Database Management System.
          </Text>
        </View>

        {/* Search Student Bar */}
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

        {/* Institution Real Metrics */}
        <Text style={styles.sectionTitle}>Real-time Campus Metrics</Text>
        <View style={styles.statsGrid}>
          <StatCard
            label="Enrolled Regular"
            value={stats.totalStudents.toLocaleString()}
            subValue="Active Students"
            icon={<Users size={18} color="#0284C7" />}
            color="#0284C7"
            style={styles.halfCard}
          />
          <StatCard
            label="Today's Attendance"
            value={`${stats.attendancePercentage}%`}
            subValue={`${stats.todayPresent.toLocaleString()} Present / ${stats.todayAbsent.toLocaleString()} Absent`}
            icon={<TrendingUp size={18} color="#059669" />}
            color="#059669"
            style={styles.halfCard}
          />
        </View>

        {/* College Breakdown (if available) */}
        {stats.colleges.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Colleges Breakdown</Text>
            <View style={styles.collegesList}>
              {stats.colleges.map((col, idx) => (
                <View key={idx} style={styles.colCard}>
                  <View style={styles.colTop}>
                    <Building2 size={16} color="#1E3A8A" />
                    <Text style={styles.colName} numberOfLines={1}>
                      {col.college}
                    </Text>
                  </View>
                  <View style={styles.colStatsRow}>
                    <Text style={styles.colTotal}>{col.total.toLocaleString()} Students</Text>
                    <Text style={styles.colRate}>{col.rate}% Present</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Permitted Operations Grid */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Permitted Operations</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{operations.length} Permitted</Text>
          </View>
        </View>
        <Text style={styles.sectionSubtitle}>
          Configured according to your assigned RBAC modules and operations:
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
    marginBottom: 16,
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
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
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
    marginBottom: 16,
  },
  halfCard: {
    flex: 1,
  },
  collegesList: {
    gap: 8,
    marginBottom: 16,
  },
  colCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  colTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  colName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  colStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colTotal: {
    fontSize: 12,
    color: '#64748B',
  },
  colRate: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
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
