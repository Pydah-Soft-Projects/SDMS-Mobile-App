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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  CalendarCheck,
  Megaphone,
  Briefcase,
  Settings,
  Plus,
  Trash2,
  Check,
  X,
  Filter,
} from 'lucide-react-native';
import api from '../../src/config/api';
import { useAuth } from '../../src/context/AuthContext';
import staffService from '../../src/services/staffService';
import { isFullAccessRole, hasPermission, hasWriteAccess, SDMS_ADMIN_NAV_TREE } from '../../src/utils/rbac';
import logger from '../../src/utils/logger';

export default function OperationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const staff = user as any;
  const { key, sub, search } = useLocalSearchParams<{ key: string; sub?: string; search?: string }>();
  const opKey = String(key || 'students').toLowerCase();

  const [activeSubTab, setActiveSubTab] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dataList, setDataList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState(search ? String(search) : '');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // Modals for actions
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionType, setActionType] = useState<'create_announcement' | 'reject_prompt' | 'add_user' | null>(null);
  const [actionTargetId, setActionTargetId] = useState<any>(null);
  const [actionRemark, setActionRemark] = useState('');

  // New announcement form state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  // Attendance marking state
  const [attendanceRecords, setAttendanceRecords] = useState<Record<number, 'Present' | 'Absent'>>({});

  // Get Nav definition
  const currentNav = SDMS_ADMIN_NAV_TREE.find((item) => item.routeKey === opKey) || {
    id: opKey,
    label: opKey.charAt(0).toUpperCase() + opKey.slice(1),
    routeKey: opKey,
    iconName: 'Building2',
    color: '#1E3A8A',
    permission: opKey,
  };

  const subItems = currentNav.subItems || [];

  // Initialize active sub-tab
  useEffect(() => {
    if (sub) {
      setActiveSubTab(String(sub));
    } else if (subItems.length > 0) {
      setActiveSubTab(subItems[0].id);
    } else {
      setActiveSubTab('default');
    }
  }, [opKey, sub]);

  const canWrite = isFullAccessRole(staff?.role) || hasWriteAccess(staff?.permissions, currentNav.permission);

  const loadData = async (query = searchQuery) => {
    setLoading(true);
    try {
      if (opKey === 'students') {
        if (activeSubTab === 'self_registration') {
          const list = await staffService.getSubmissions(1);
          setDataList(list);
        } else if (activeSubTab === 'profile_requests') {
          const list = await staffService.getProfileChangeRequests();
          setDataList(list);
        } else if (activeSubTab === 'section_partition' || activeSubTab === 'promotions') {
          const res = await api.get('/courses');
          setDataList(res.data?.data || res.data || []);
        } else {
          // default database
          const list = await staffService.searchStudents(query, 1, 30);
          setDataList(list);
        }
      } else if (opKey === 'attendance') {
        if (activeSubTab === 'internship') {
          const res = await api.get('/internship/list');
          setDataList(res.data?.data || res.data || []);
        } else {
          // Daily Attendance class roll call
          const res = await api.get('/students', { params: { limit: 25 } });
          const students = res.data?.students || res.data?.data || res.data || [];
          setDataList(students);
          // Initialize attendance
          const initialMap: Record<number, 'Present' | 'Absent'> = {};
          students.forEach((s: any) => {
            if (s.id) initialMap[s.id] = 'Present';
          });
          setAttendanceRecords(initialMap);
        }
      } else if (opKey === 'seminar-halls') {
        const list = await staffService.getSeminarHallRequests();
        setDataList(list);
      } else if (opKey === 'services') {
        if (activeSubTab === 'borrow') {
          const list = await staffService.getCertificateBorrowRequests();
          setDataList(list);
        } else {
          const list = await staffService.getServiceRequests();
          setDataList(list);
        }
      } else if (opKey === 'user-management') {
        const list = await staffService.getRbacUsers();
        setDataList(list);
      } else if (opKey === 'announcements') {
        if (activeSubTab === 'polls') {
          const list = await staffService.getPolls();
          setDataList(list);
        } else if (activeSubTab === 'events') {
          const list = await staffService.getEvents();
          setDataList(list);
        } else {
          const list = await staffService.getAdminAnnouncements();
          setDataList(list);
        }
      } else if (opKey === 'clubs') {
        if (activeSubTab === 'members') {
          const list = await staffService.getClubStudents();
          setDataList(list);
        } else {
          const list = await staffService.getClubs();
          setDataList(list);
        }
      } else if (opKey === 'reports') {
        const res = await api.get('/colleges/dashboard-stats');
        setDataList(res.data?.data || []);
      } else if (opKey === 'courses') {
        const res = await api.get('/courses');
        setDataList(res.data?.data || res.data || []);
      } else {
        const res = await api.get('/colleges/dashboard-stats');
        setDataList(res.data?.data || []);
      }
    } catch (e: any) {
      logger.error('OPERATION_SCREEN', `Failed loading ${opKey}/${activeSubTab}`, e.message);
      setDataList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab) {
      loadData();
    }
  }, [opKey, activeSubTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // ACTION HANDLERS
  const handleApproveSubmission = async (id: string | number) => {
    try {
      await staffService.approveSubmission(id, 'Approved via SDMS Mobile');
      Alert.alert('Success', 'Student submission approved successfully');
      loadData();
    } catch (e: any) {
      Alert.alert('Approval Failed', e.message || 'Could not approve submission');
    }
  };

  const handleRejectSubmission = async (id: string | number) => {
    setActionTargetId(id);
    setActionType('reject_prompt');
    setActionRemark('');
    setActionModalVisible(true);
  };

  const handleConfirmReject = async () => {
    if (!actionRemark.trim()) {
      Alert.alert('Required', 'Please enter a rejection reason');
      return;
    }
    try {
      await staffService.rejectSubmission(actionTargetId, actionRemark.trim());
      setActionModalVisible(false);
      Alert.alert('Rejected', 'Submission has been rejected');
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to reject submission');
    }
  };

  const handleProfileRequestAction = async (id: number | string, status: 'approved' | 'rejected') => {
    try {
      await staffService.updateProfileRequestStatus(id, status);
      Alert.alert('Success', `Profile request marked as ${status}`);
      loadData();
    } catch (e: any) {
      Alert.alert('Failed', e.message || `Could not update request`);
    }
  };

  const handleSeminarHallAction = async (id: number | string, status: 'approved' | 'rejected') => {
    try {
      await staffService.updateSeminarHallRequestStatus(id, status);
      Alert.alert('Success', `Seminar Hall booking ${status}`);
      loadData();
    } catch (e: any) {
      Alert.alert('Failed', e.message || `Could not update booking`);
    }
  };

  const handleServiceRequestAction = async (id: number | string, status: string) => {
    try {
      await staffService.updateServiceRequestStatus(id, status);
      Alert.alert('Updated', `Service request status changed to ${status}`);
      loadData();
    } catch (e: any) {
      Alert.alert('Failed', e.message || 'Could not update service status');
    }
  };

  const handleToggleAttendance = (studentId: number) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === 'Present' ? 'Absent' : 'Present',
    }));
  };

  const handleSubmitDailyAttendance = async () => {
    const records = Object.entries(attendanceRecords).map(([studentId, status]) => ({
      studentId: Number(studentId),
      status,
    }));
    try {
      const today = new Date().toISOString().split('T')[0];
      await staffService.markDailyAttendance({
        collegeId: staff?.collegeId || 1,
        date: today,
        records,
      });
      Alert.alert('Attendance Submitted', `Recorded attendance for ${records.length} students`);
    } catch (e: any) {
      Alert.alert('Submission Error', e.message || 'Could not submit attendance');
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      Alert.alert('Required', 'Please enter title and content');
      return;
    }
    try {
      await staffService.createAnnouncement({
        title: newTitle.trim(),
        content: newContent.trim(),
        priority: newPriority,
      });
      setActionModalVisible(false);
      setNewTitle('');
      setNewContent('');
      Alert.alert('Created', 'Announcement broadcasted to portal');
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create announcement');
    }
  };

  const handleDeleteAnnouncement = async (id: number | string) => {
    Alert.alert('Delete Announcement', 'Are you sure you want to delete this notice?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await staffService.deleteAnnouncement(id);
            loadData();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.topBarTitleCol}>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {currentNav.label}
          </Text>
          <Text style={styles.topBarSub} numberOfLines={1}>
            {subItems.find((s) => s.id === activeSubTab)?.label || 'Administrative Console'}
          </Text>
        </View>
        {opKey === 'announcements' && activeSubTab === 'notices' && canWrite && (
          <TouchableOpacity
            style={styles.addHeaderBtn}
            onPress={() => {
              setActionType('create_announcement');
              setActionModalVisible(true);
            }}
          >
            <Plus size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Subpage Tabs (Horizontal scroll bar if multiple sub-items) */}
      {subItems.length > 0 && (
        <View style={styles.subTabBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subTabScroll}>
            {subItems.map((subItem) => {
              const isActive = subItem.id === activeSubTab;
              return (
                <TouchableOpacity
                  key={subItem.id}
                  style={[styles.subTabItem, isActive && styles.subTabItemActive]}
                  onPress={() => setActiveSubTab(subItem.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.subTabText, isActive && styles.subTabTextActive]}>
                    {subItem.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Search Bar for search-enabled screens */}
      {(opKey === 'students' && (activeSubTab === 'database' || !activeSubTab)) && (
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchBar}>
            <Search size={16} color="#94A3B8" />
            <TextInput
              placeholder="Search students by PIN, Name, Roll No..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => loadData(searchQuery.trim())}
              returnKeyType="search"
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => loadData(searchQuery.trim())} style={styles.searchGoBtn}>
                <Text style={styles.searchGoBtnText}>Go</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.loaderText}>Loading live SDMS records...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* DAILY ATTENDANCE MARKING LIST */}
          {opKey === 'attendance' && activeSubTab === 'daily' ? (
            <View>
              <View style={styles.bannerInfo}>
                <CalendarCheck size={18} color="#1E3A8A" />
                <Text style={styles.bannerInfoText}>
                  Mark student roll call for today. Tap badge to toggle Present/Absent.
                </Text>
              </View>

              {dataList.map((stu: any, idx: number) => {
                const isPres = attendanceRecords[stu.id] === 'Present';
                return (
                  <View key={stu.id || idx} style={styles.attendanceRowCard}>
                    <View style={styles.attendanceLeft}>
                      <Text style={styles.attendanceName}>{stu.student_name || stu.name || 'Student'}</Text>
                      <Text style={styles.attendancePin}>{stu.admission_number || stu.pin_no || 'PIN N/A'}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.attBadge, isPres ? styles.attBadgePres : styles.attBadgeAbs]}
                      onPress={() => handleToggleAttendance(stu.id)}
                    >
                      <Text style={[styles.attBadgeText, isPres ? styles.attBadgeTextPres : styles.attBadgeTextAbs]}>
                        {isPres ? 'Present' : 'Absent'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}

              {dataList.length > 0 && canWrite && (
                <TouchableOpacity style={styles.submitAttBtn} onPress={handleSubmitDailyAttendance}>
                  <Check size={18} color="#FFFFFF" />
                  <Text style={styles.submitAttBtnText}>Submit Roll Call</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : dataList.length > 0 ? (
            dataList.map((item: any, idx: number) => {
              // 1. SELF REGISTRATION SUBMISSIONS
              if (opKey === 'students' && activeSubTab === 'self_registration') {
                return (
                  <View key={item.id || idx} style={styles.actionCard}>
                    <View style={styles.actionCardHeader}>
                      <View style={styles.actionCardInfo}>
                        <Text style={styles.actionTitle}>{item.applicant_name || item.name || 'Applicant'}</Text>
                        <Text style={styles.actionSub}>Form: {item.form_title || 'Registration'}</Text>
                        <Text style={styles.actionSub}>Date: {item.created_at ? item.created_at.split('T')[0] : 'Recent'}</Text>
                      </View>
                      <View style={[styles.statusPill, item.status === 'approved' ? styles.pillSuccess : styles.pillPending]}>
                        <Text style={styles.statusPillText}>{item.status || 'Pending'}</Text>
                      </View>
                    </View>

                    {canWrite && item.status !== 'approved' && item.status !== 'rejected' && (
                      <View style={styles.btnRow}>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.approveBtn]}
                          onPress={() => handleApproveSubmission(item.id)}
                        >
                          <Check size={14} color="#FFFFFF" />
                          <Text style={styles.actionBtnText}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.rejectBtn]}
                          onPress={() => handleRejectSubmission(item.id)}
                        >
                          <X size={14} color="#FFFFFF" />
                          <Text style={styles.actionBtnText}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              }

              // 2. PROFILE CHANGE REQUESTS
              if (opKey === 'students' && activeSubTab === 'profile_requests') {
                return (
                  <View key={item.id || idx} style={styles.actionCard}>
                    <View style={styles.actionCardHeader}>
                      <View style={styles.actionCardInfo}>
                        <Text style={styles.actionTitle}>{item.student_name || 'Student'}</Text>
                        <Text style={styles.actionSub}>PIN: {item.admission_number || item.pin_no}</Text>
                        <Text style={styles.actionDetail}>
                          Field: <Text style={{ fontWeight: '700' }}>{item.field_name}</Text>
                        </Text>
                        <Text style={styles.actionDetail}>
                          Proposed: <Text style={{ color: '#1E3A8A' }}>{item.proposed_value}</Text>
                        </Text>
                      </View>
                      <View style={[styles.statusPill, item.status === 'approved' ? styles.pillSuccess : styles.pillPending]}>
                        <Text style={styles.statusPillText}>{item.status || 'Pending'}</Text>
                      </View>
                    </View>

                    {canWrite && item.status === 'pending' && (
                      <View style={styles.btnRow}>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.approveBtn]}
                          onPress={() => handleProfileRequestAction(item.id, 'approved')}
                        >
                          <Check size={14} color="#FFFFFF" />
                          <Text style={styles.actionBtnText}>Approve Change</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.rejectBtn]}
                          onPress={() => handleProfileRequestAction(item.id, 'rejected')}
                        >
                          <X size={14} color="#FFFFFF" />
                          <Text style={styles.actionBtnText}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              }

              // 3. SEMINAR HALL REQUESTS
              if (opKey === 'seminar-halls') {
                return (
                  <View key={item.id || idx} style={styles.actionCard}>
                    <View style={styles.actionCardHeader}>
                      <View style={styles.actionCardInfo}>
                        <Text style={styles.actionTitle}>{item.hall_name || 'Seminar Hall'}</Text>
                        <Text style={styles.actionSub}>Event: {item.event_title || item.purpose}</Text>
                        <Text style={styles.actionSub}>
                          Date: {item.booking_date} ({item.start_time || 'Morning'})
                        </Text>
                        <Text style={styles.actionDetail}>Requested by: {item.requester_name || 'Staff'}</Text>
                      </View>
                      <View style={[styles.statusPill, item.status === 'approved' ? styles.pillSuccess : styles.pillPending]}>
                        <Text style={styles.statusPillText}>{item.status || 'Pending'}</Text>
                      </View>
                    </View>

                    {canWrite && item.status === 'pending' && (
                      <View style={styles.btnRow}>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.approveBtn]}
                          onPress={() => handleSeminarHallAction(item.id, 'approved')}
                        >
                          <Check size={14} color="#FFFFFF" />
                          <Text style={styles.actionBtnText}>Confirm Hall</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.rejectBtn]}
                          onPress={() => handleSeminarHallAction(item.id, 'rejected')}
                        >
                          <X size={14} color="#FFFFFF" />
                          <Text style={styles.actionBtnText}>Decline</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              }

              // 4. SERVICES / CERTIFICATES
              if (opKey === 'services') {
                return (
                  <View key={item.id || idx} style={styles.actionCard}>
                    <View style={styles.actionCardHeader}>
                      <View style={styles.actionCardInfo}>
                        <Text style={styles.actionTitle}>{item.service_title || item.certificate_type || 'Certificate Request'}</Text>
                        <Text style={styles.actionSub}>Student: {item.student_name} ({item.admission_number || item.pin_no})</Text>
                        <Text style={styles.actionDetail}>Date: {item.created_at ? item.created_at.split('T')[0] : 'Recent'}</Text>
                      </View>
                      <View style={[styles.statusPill, item.status === 'completed' ? styles.pillSuccess : styles.pillPending]}>
                        <Text style={styles.statusPillText}>{item.status || 'Pending'}</Text>
                      </View>
                    </View>

                    {canWrite && item.status !== 'completed' && (
                      <View style={styles.btnRow}>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.approveBtn]}
                          onPress={() => handleServiceRequestAction(item.id, 'completed')}
                        >
                          <Check size={14} color="#FFFFFF" />
                          <Text style={styles.actionBtnText}>Mark Completed</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              }

              // 5. USER MANAGEMENT
              if (opKey === 'user-management') {
                return (
                  <View key={item.id || idx} style={styles.actionCard}>
                    <View style={styles.userRow}>
                      <View style={styles.userAvatar}>
                        <ShieldCheck size={20} color="#1E3A8A" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.userName}>{item.name || item.username}</Text>
                        <Text style={styles.userRole}>
                          Role: {String(item.role || 'Staff').toUpperCase().replace(/_/g, ' ')}
                        </Text>
                        <Text style={styles.userEmail}>{item.email || 'No email'}</Text>
                      </View>
                      <View style={[styles.statusPill, item.is_active !== false ? styles.pillSuccess : styles.pillInactive]}>
                        <Text style={styles.statusPillText}>{item.is_active !== false ? 'Active' : 'Inactive'}</Text>
                      </View>
                    </View>
                  </View>
                );
              }

              // 6. ANNOUNCEMENTS
              if (opKey === 'announcements' && activeSubTab === 'notices') {
                return (
                  <View key={item.id || idx} style={styles.actionCard}>
                    <View style={styles.noticeHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.noticeTitle}>{item.title}</Text>
                        <Text style={styles.noticeDate}>{item.created_at ? item.created_at.split('T')[0] : 'Today'}</Text>
                      </View>
                      {canWrite && (
                        <TouchableOpacity onPress={() => handleDeleteAnnouncement(item.id)} hitSlop={10}>
                          <Trash2 size={16} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.noticeBody}>{item.content}</Text>
                  </View>
                );
              }

              // DEFAULT GENERIC CARD (Students DB, Reports, Courses, etc.)
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
                    <Text style={styles.cardTitle}>
                      {item.student_name || item.name || item.college || item.title || 'Record'}
                    </Text>
                    <Text style={styles.cardSub}>
                      {item.admission_number || item.pin_no || item.code || item.role || item.total ? `Total: ${item.total}` : 'Details'}
                    </Text>
                  </View>
                  <ChevronRight size={18} color="#94A3B8" />
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Records Found</Text>
              <Text style={styles.emptyText}>
                There are no active records for this module filter. Pull down to refresh.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* DETAIL MODAL */}
      <Modal visible={!!selectedItem} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalName}>
                  {selectedItem?.student_name || selectedItem?.name || selectedItem?.title || 'Details'}
                </Text>
                <Text style={styles.modalPin}>
                  {selectedItem?.admission_number || selectedItem?.pin_no || selectedItem?.code || ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedItem(null)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {selectedItem &&
                Object.entries(selectedItem)
                  .filter(([k, v]) => typeof v !== 'object' && v !== null && !['id', 'password'].includes(k))
                  .map(([key, val]) => (
                    <View key={key} style={styles.modalInfoRow}>
                      <Text style={styles.modalLabel}>{key.replace(/_/g, ' ').toUpperCase()}</Text>
                      <Text style={styles.modalValue}>{String(val)}</Text>
                    </View>
                  ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ACTION DIALOG MODAL (Create Announcement or Reject Prompt) */}
      <Modal visible={actionModalVisible} transparent animationType="fade">
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogCard}>
            {actionType === 'reject_prompt' ? (
              <View>
                <Text style={styles.dialogTitle}>Reject Submission</Text>
                <Text style={styles.dialogSub}>Please specify the reason for rejection</Text>
                <TextInput
                  style={styles.dialogInput}
                  placeholder="e.g. Incomplete certificates, incorrect quota..."
                  value={actionRemark}
                  onChangeText={setActionRemark}
                  multiline
                />
                <View style={styles.dialogBtnRow}>
                  <TouchableOpacity
                    style={styles.dialogCancelBtn}
                    onPress={() => setActionModalVisible(false)}
                  >
                    <Text style={styles.dialogCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dialogConfirmBtn} onPress={handleConfirmReject}>
                    <Text style={styles.dialogConfirmText}>Confirm Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : actionType === 'create_announcement' ? (
              <View>
                <Text style={styles.dialogTitle}>New Announcement</Text>
                <Text style={styles.dialogSub}>Broadcast a notice to students and staff</Text>
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Announcement Title"
                  value={newTitle}
                  onChangeText={setNewTitle}
                />
                <TextInput
                  style={[styles.dialogInput, { height: 90 }]}
                  placeholder="Content / Notice body..."
                  value={newContent}
                  onChangeText={setNewContent}
                  multiline
                />
                <View style={styles.dialogBtnRow}>
                  <TouchableOpacity
                    style={styles.dialogCancelBtn}
                    onPress={() => setActionModalVisible(false)}
                  >
                    <Text style={styles.dialogCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dialogConfirmBtn} onPress={handleCreateAnnouncement}>
                    <Text style={styles.dialogConfirmText}>Broadcast</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
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
  },
  backBtn: {
    padding: 6,
    marginRight: 10,
    borderRadius: 8,
  },
  topBarTitleCol: {
    flex: 1,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  topBarSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  addHeaderBtn: {
    backgroundColor: '#1E3A8A',
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subTabBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  subTabScroll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  subTabItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  subTabItemActive: {
    backgroundColor: '#1E3A8A',
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  subTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  searchGoBtn: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  searchGoBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  bannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  bannerInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#1E3A8A',
    fontWeight: '600',
  },
  attendanceRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  attendanceLeft: {
    flex: 1,
  },
  attendanceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  attendancePin: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  attBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  attBadgePres: {
    backgroundColor: '#DCFCE7',
  },
  attBadgeAbs: {
    backgroundColor: '#FEE2E2',
  },
  attBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  attBadgeTextPres: {
    color: '#15803D',
  },
  attBadgeTextAbs: {
    color: '#B91C1C',
  },
  submitAttBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 14,
    gap: 8,
  },
  submitAttBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  actionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  actionCardInfo: {
    flex: 1,
    marginRight: 8,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  actionDetail: {
    fontSize: 12,
    color: '#334155',
    marginTop: 4,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pillSuccess: {
    backgroundColor: '#DCFCE7',
  },
  pillPending: {
    backgroundColor: '#FEF3C7',
  },
  pillInactive: {
    backgroundColor: '#F1F5F9',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'capitalize',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  approveBtn: {
    backgroundColor: '#059669',
  },
  rejectBtn: {
    backgroundColor: '#DC2626',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  userRole: {
    fontSize: 11,
    color: '#1E3A8A',
    fontWeight: '600',
    marginTop: 1,
  },
  userEmail: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  noticeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  noticeDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  noticeBody: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginTop: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
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
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  modalValue: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
    maxWidth: '65%',
    textAlign: 'right',
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 380,
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  dialogSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 14,
  },
  dialogSingleInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    marginBottom: 10,
  },
  dialogInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    height: 70,
    fontSize: 13,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  dialogBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dialogCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  dialogCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  dialogConfirmBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
  },
  dialogConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
