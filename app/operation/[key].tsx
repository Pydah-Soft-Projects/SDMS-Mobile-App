import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Users,
  Search,
  BookOpen,
  Building2,
  FileCheck,
  FileText,
  ShieldCheck,
  GraduationCap,
  Split,
  BarChart3,
  ChevronRight,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
} from 'lucide-react-native';
import api from '../../src/config/api';
import logger from '../../src/utils/logger';

export default function OperationScreen() {
  const router = useRouter();
  const { key } = useLocalSearchParams<{ key: string }>();
  const opKey = String(key || 'students').toLowerCase();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dataList, setDataList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const getPageInfo = () => {
    switch (opKey) {
      case 'students':
        return { title: 'Students Directory', subtitle: 'Search & Review Student Records', icon: Users };
      case 'courses':
        return { title: 'Colleges & Courses', subtitle: 'Academic Branch Structures', icon: BookOpen };
      case 'user-management':
        return { title: 'Staff Access Control', subtitle: 'RBAC Staff Roles & Modules', icon: ShieldCheck };
      case 'submissions':
        return { title: 'Form Submissions', subtitle: 'Student Applications & Approvals', icon: FileCheck };
      case 'forms':
        return { title: 'Dynamic Academic Forms', subtitle: 'Active Forms & Registrations', icon: FileText };
      case 'promotions':
        return { title: 'Student Promotions', subtitle: 'Academic Cycle Progression', icon: GraduationCap };
      case 'section_partition':
        return { title: 'Section Partition', subtitle: 'Batch & Section Assignments', icon: Split };
      case 'reports':
        return { title: 'Reports & Analytics', subtitle: 'Institutional Performance Data', icon: BarChart3 };
      default:
        return { title: 'Operation Management', subtitle: 'SDMS Administrative Console', icon: Building2 };
    }
  };

  const pageInfo = getPageInfo();
  const PageIcon = pageInfo.icon;

  const loadData = async (query = searchQuery) => {
    try {
      if (opKey === 'students') {
        const res = await api.get('/students', {
          params: { search: query, page: 1, limit: 30 },
        });
        const list = res.data?.students || res.data?.data || res.data || [];
        setDataList(Array.isArray(list) ? list : []);
      } else if (opKey === 'courses') {
        const [colRes, crsRes] = await Promise.allSettled([
          api.get('/colleges'),
          api.get('/courses'),
        ]);
        const cols = colRes.status === 'fulfilled' ? colRes.value.data?.data || colRes.value.data || [] : [];
        const crs = crsRes.status === 'fulfilled' ? crsRes.value.data?.data || crsRes.value.data || [] : [];
        setDataList([...cols, ...crs]);
      } else if (opKey === 'user-management') {
        const res = await api.get('/rbac/users');
        const list = res.data?.users || res.data?.data || res.data || [];
        setDataList(Array.isArray(list) ? list : []);
      } else if (opKey === 'submissions') {
        const res = await api.get('/submissions');
        const list = res.data?.submissions || res.data?.data || res.data || [];
        setDataList(Array.isArray(list) ? list : []);
      } else if (opKey === 'forms') {
        const res = await api.get('/forms');
        const list = res.data?.forms || res.data?.data || res.data || [];
        setDataList(Array.isArray(list) ? list : []);
      } else {
        // Generic / reports / promotions fallback
        const res = await api.get('/colleges/dashboard-stats');
        setDataList(res.data?.data || []);
      }
    } catch (e: any) {
      logger.error('OPERATION_PAGE', `Failed loading ${opKey}`, e.message);
      setDataList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [opKey]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSearchSubmit = () => {
    setLoading(true);
    loadData(searchQuery.trim());
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Navigation Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.topBarTitleCol}>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {pageInfo.title}
          </Text>
          <Text style={styles.topBarSub} numberOfLines={1}>
            {pageInfo.subtitle}
          </Text>
        </View>
        <View style={styles.topBarIcon}>
          <PageIcon size={20} color="#1E3A8A" />
        </View>
      </View>

      {/* Search Bar for searchable operations */}
      {(opKey === 'students' || opKey === 'user-management' || opKey === 'courses') && (
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchBar}>
            <Search size={16} color="#94A3B8" />
            <TextInput
              placeholder={`Search in ${pageInfo.title}...`}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleSearchSubmit} style={styles.goBtn}>
                <Text style={styles.goBtnText}>Find</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Main Content List */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.loaderText}>Loading {pageInfo.title} records...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {dataList.length > 0 ? (
            dataList.map((item, idx) => {
              // RENDER STUDENTS
              if (opKey === 'students') {
                return (
                  <TouchableOpacity
                    key={item.id || idx}
                    style={styles.card}
                    onPress={() => setSelectedItem(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.avatarCircle}>
                      <User size={18} color="#1E3A8A" />
                    </View>
                    <View style={styles.cardBody}>
                      <Text style={styles.cardTitle}>{item.student_name || item.name || 'Student'}</Text>
                      <Text style={styles.cardSub}>
                        PIN: {item.pin_no || item.admission_number || 'N/A'} • {item.branch || item.course || ''}
                      </Text>
                      <Text style={styles.cardDetail}>
                        {item.college || 'Pydah'} • Year {item.current_year || 1} • {item.section ? `Sec ${item.section}` : ''}
                      </Text>
                    </View>
                    <ChevronRight size={18} color="#CBD5E1" />
                  </TouchableOpacity>
                );
              }

              // RENDER COURSES & COLLEGES
              if (opKey === 'courses') {
                return (
                  <View key={item.id || idx} style={styles.card}>
                    <View style={[styles.avatarCircle, { backgroundColor: '#F0FDF4' }]}>
                      <Building2 size={18} color="#15803D" />
                    </View>
                    <View style={styles.cardBody}>
                      <Text style={styles.cardTitle}>{item.name || item.course_name || 'Academic Unit'}</Text>
                      <Text style={styles.cardSub}>
                        {item.code ? `Code: ${item.code} • ` : ''}
                        {item.level ? `Level: ${item.level} • ` : ''}
                        {item.total_years ? `${item.total_years} Years Duration` : 'Campus Unit'}
                      </Text>
                    </View>
                  </View>
                );
              }

              // RENDER STAFF USER MANAGEMENT
              if (opKey === 'user-management') {
                return (
                  <View key={item.id || idx} style={styles.card}>
                    <View style={[styles.avatarCircle, { backgroundColor: '#FEF3C7' }]}>
                      <ShieldCheck size={18} color="#B45309" />
                    </View>
                    <View style={styles.cardBody}>
                      <Text style={styles.cardTitle}>{item.name || item.username}</Text>
                      <Text style={styles.cardSub}>
                        Role: {String(item.role || 'Staff').toUpperCase()} • @{item.username}
                      </Text>
                      <Text style={styles.cardDetail}>
                        {item.email || 'No email registered'}
                      </Text>
                    </View>
                  </View>
                );
              }

              // GENERIC RENDER (Submissions, Forms, Reports)
              return (
                <View key={item.id || idx} style={styles.card}>
                  <View style={styles.avatarCircle}>
                    <PageIcon size={18} color="#1E3A8A" />
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>
                      {item.title || item.name || item.college || `Record #${item.id || idx + 1}`}
                    </Text>
                    <Text style={styles.cardSub}>
                      {item.status ? `Status: ${item.status} • ` : ''}
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'SDMS Active Record'}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <PageIcon size={36} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No records found</Text>
              <Text style={styles.emptyText}>
                No data entries match the current filter in {pageInfo.title}.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Student Details Popup Modal */}
      <Modal visible={!!selectedItem} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalName}>{selectedItem?.student_name || selectedItem?.name}</Text>
                <Text style={styles.modalPin}>
                  PIN: {selectedItem?.pin_no || selectedItem?.admission_number}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedItem(null)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalLabel}>College:</Text>
                <Text style={styles.modalValue}>{selectedItem?.college || 'Pydah College'}</Text>
              </View>
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalLabel}>Course & Branch:</Text>
                <Text style={styles.modalValue}>{selectedItem?.course} - {selectedItem?.branch}</Text>
              </View>
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalLabel}>Year / Semester:</Text>
                <Text style={styles.modalValue}>
                  Year {selectedItem?.current_year || 1} • Sem {selectedItem?.current_semester || 1}
                </Text>
              </View>
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalLabel}>Section / Batch:</Text>
                <Text style={styles.modalValue}>
                  {selectedItem?.section ? `Sec ${selectedItem.section}` : 'N/A'} • {selectedItem?.batch || 'Regular'}
                </Text>
              </View>
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalLabel}>Registration Status:</Text>
                <Text style={[styles.modalValue, { color: '#059669', fontWeight: '700' }]}>
                  {selectedItem?.student_status || selectedItem?.registration_status || 'Regular'}
                </Text>
              </View>
              {selectedItem?.student_mobile ? (
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalLabel}>Student Mobile:</Text>
                  <Text style={styles.modalValue}>{selectedItem.student_mobile}</Text>
                </View>
              ) : null}
              {selectedItem?.parent_mobile ? (
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalLabel}>Parent Mobile:</Text>
                  <Text style={styles.modalValue}>{selectedItem.parent_mobile}</Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  backBtn: {
    padding: 6,
  },
  topBarTitleCol: {
    flex: 1,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  topBarSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  topBarIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },
  goBtn: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  goBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loaderText: {
    fontSize: 13,
    color: '#64748B',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardBody: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSub: {
    fontSize: 12,
    color: '#1E3A8A',
    fontWeight: '600',
    marginTop: 2,
  },
  cardDetail: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 14,
  },
  modalName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalPin: {
    fontSize: 13,
    color: '#1E3A8A',
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  closeBtnText: {
    color: '#1E3A8A',
    fontWeight: '700',
    fontSize: 13,
  },
  modalBody: {
    paddingTop: 16,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  modalLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  modalValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
});
