import React, { useEffect, useState, useRef } from 'react';
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
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
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
  Edit2,
  KeyRound,
  RotateCcw,
  MessageSquare,
  Send,
  Wallet,
  Tag,
  Award,
  PieChart,
  Filter,
  CheckSquare,
} from 'lucide-react-native';
import api from '../../src/config/api';
import { useAuth } from '../../src/context/AuthContext';
import staffService from '../../src/services/staffService';
import { isFullAccessRole, hasWriteAccess, SDMS_ADMIN_NAV_TREE } from '../../src/utils/rbac';
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

  // PAGINATION STATE
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const scrollRef = useRef<any>(null);

  // FILTER STATE (Mirrors Frontend SDMS Filters)
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedPinStatus, setSelectedPinStatus] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');

  const [filterOptions, setFilterOptions] = useState<{
    batches: string[];
    colleges: string[];
    courses: string[];
    branches: string[];
    years: (string | number)[];
    semesters: (string | number)[];
  }>({
    batches: [],
    colleges: [],
    courses: [],
    branches: [],
    years: [1, 2, 3, 4],
    semesters: [1, 2],
  });

  useEffect(() => {
    staffService.getQuickFilters().then((opts) => {
      setFilterOptions({
        batches: opts.batches || [],
        colleges: opts.colleges || [],
        courses: opts.courses || [],
        branches: opts.branches || [],
        years: opts.years?.length ? opts.years : [1, 2, 3, 4],
        semesters: opts.semesters?.length ? opts.semesters : [1, 2],
      });
    });
  }, []);

  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedCollege) count++;
    if (selectedCourse) count++;
    if (selectedBranch) count++;
    if (selectedBatch) count++;
    if (selectedYear) count++;
    if (selectedSemester) count++;
    if (selectedSection) count++;
    if (selectedPinStatus) count++;
    if (selectedGender) count++;
    if (selectedStatus) count++;
    if (selectedRole) count++;
    if (selectedPriority) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  const handleClearAllFilters = () => {
    setSelectedCollege('');
    setSelectedCourse('');
    setSelectedBranch('');
    setSelectedBatch('');
    setSelectedYear('');
    setSelectedSemester('');
    setSelectedSection('');
    setSelectedPinStatus('');
    setSelectedGender('');
    setSelectedStatus('');
    setSelectedRole('');
    setSelectedPriority('');
    setPage(1);
    loadData(searchQuery, 1, {
      college: '',
      course: '',
      branch: '',
      batch: '',
      year: '',
      semester: '',
      section: '',
      pinStatus: '',
      gender: '',
      status: '',
      role: '',
      priority: '',
    });
  };

  // ACTION MODAL STATE
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionType, setActionType] = useState<
    | 'create_student'
    | 'edit_student'
    | 'create_user'
    | 'create_announcement'
    | 'edit_announcement'
    | 'create_club'
    | 'create_seminar_hall'
    | 'create_hall_item'
    | 'create_service'
    | 'edit_service'
    | 'reject_prompt'
    | 'update_pin'
    | null
  >(null);
  const [actionTargetItem, setActionTargetItem] = useState<any | null>(null);
  const [actionRemark, setActionRemark] = useState('');

  // Form Fields State
  const [formName, setFormName] = useState('');
  const [formAdmissionNo, setFormAdmissionNo] = useState('');
  const [formPin, setFormPin] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formYear, setFormYear] = useState('1');
  const [formSection, setFormSection] = useState('A');

  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('staff');

  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [formPrice, setFormPrice] = useState('0');

  const [formHallName, setFormHallName] = useState('');
  const [formBookingDate, setFormBookingDate] = useState('');
  const [formPurpose, setFormPurpose] = useState('');
  const [formRequester, setFormRequester] = useState('');
  const [formHallLocation, setFormHallLocation] = useState('');
  const [formHallCapacity, setFormHallCapacity] = useState('250');
  const [formHallOpenTime, setFormHallOpenTime] = useState('08:00');
  const [formHallCloseTime, setFormHallCloseTime] = useState('20:00');

  // Attendance marking state
  const [attendanceRecords, setAttendanceRecords] = useState<Record<number, 'Present' | 'Absent'>>({});
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  // SMS Specific State
  const [smsSummary, setSmsSummary] = useState<{ total: number; sent: number; failed: number }>({
    total: 0,
    sent: 0,
    failed: 0,
  });
  const [smsBalance, setSmsBalance] = useState<{ credits?: number; testMode?: boolean } | null>(null);
  const [selectedSmsLog, setSelectedSmsLog] = useState<any | null>(null);
  const [smsModalVisible, setSmsModalVisible] = useState(false);

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

  const loadData = async (
    query = searchQuery,
    targetPage = page,
    overrideFilters: any = {}
  ) => {
    setLoading(true);
    const fCollege = overrideFilters.college !== undefined ? overrideFilters.college : selectedCollege;
    const fCourse = overrideFilters.course !== undefined ? overrideFilters.course : selectedCourse;
    const fBranch = overrideFilters.branch !== undefined ? overrideFilters.branch : selectedBranch;
    const fBatch = overrideFilters.batch !== undefined ? overrideFilters.batch : selectedBatch;
    const fYear = overrideFilters.year !== undefined ? overrideFilters.year : selectedYear;
    const fSemester = overrideFilters.semester !== undefined ? overrideFilters.semester : selectedSemester;
    const fSection = overrideFilters.section !== undefined ? overrideFilters.section : selectedSection;
    const fPinStatus = overrideFilters.pinStatus !== undefined ? overrideFilters.pinStatus : selectedPinStatus;
    const fGender = overrideFilters.gender !== undefined ? overrideFilters.gender : selectedGender;
    const fStatus = overrideFilters.status !== undefined ? overrideFilters.status : selectedStatus;
    const fRole = overrideFilters.role !== undefined ? overrideFilters.role : selectedRole;
    const fPriority = overrideFilters.priority !== undefined ? overrideFilters.priority : selectedPriority;

    try {
      if (opKey === 'students' && (activeSubTab === 'database' || !activeSubTab)) {
        // Server-side paginated student directory with full SDMS filters
        const res = await staffService.getPaginatedStudents({
          search: query,
          page: targetPage,
          limit: pageSize,
          college: fCollege,
          course: fCourse,
          branch: fBranch,
          batch: fBatch,
          year: fYear,
          semester: fSemester,
          section: fSection,
          pinStatus: fPinStatus,
          gender: fGender,
        });
        setDataList(res.students);
        setTotalCount(res.total);
        setTotalPages(res.totalPages);
        setPage(res.page);
      } else if (
        (opKey === 'announcements' && activeSubTab === 'sms') ||
        (opKey === 'reports' && activeSubTab === 'sms_reports')
      ) {
        // SMS Reports & Live Logs with Server-side Pagination
        const [repData, logsRes] = await Promise.all([
          staffService.getSmsReport({
            date_from: selectedAttendanceDate,
            date_to: selectedAttendanceDate,
            status: fStatus,
            search: query,
          }),
          staffService.getSmsLogs({
            page: targetPage,
            limit: pageSize,
            date_from: selectedAttendanceDate,
            date_to: selectedAttendanceDate,
            status: fStatus,
            search: query,
          }),
        ]);

        if (repData) {
          setSmsSummary({
            total: Number(repData.summary?.total || 0),
            sent: Number(repData.summary?.sent || 0),
            failed: Number(repData.summary?.failed || 0),
          });
          setSmsBalance(repData.accountBalance || null);
        }

        const logs = logsRes.logs || [];
        setDataList(logs);
        const pag = logsRes.pagination;
        setTotalCount(pag.total ?? logs.length);
        setTotalPages(Math.max(1, pag.totalPages ?? 1));
        setPage(pag.page ?? targetPage);
      } else {
        // Other modules
        let rawList: any[] = [];
        if (opKey === 'students') {
          if (activeSubTab === 'self_registration') {
            const allSub = await staffService.getSubmissions(1);
            rawList = fStatus ? allSub.filter((s: any) => s.status === fStatus) : allSub;
          } else if (activeSubTab === 'profile_requests') {
            const allReqs = await staffService.getProfileChangeRequests();
            rawList = fStatus ? allReqs.filter((r: any) => r.status === fStatus) : allReqs;
          } else if (activeSubTab === 'print_id_cards') {
            const idRes = await staffService.getPaginatedStudents({
              search: query,
              page: targetPage,
              limit: pageSize,
              college: fCollege,
              course: fCourse,
              branch: fBranch,
              batch: fBatch,
              year: fYear,
              semester: fSemester,
              section: fSection,
            });
            setDataList(idRes.students);
            setTotalCount(idRes.total);
            setTotalPages(idRes.totalPages);
            setPage(idRes.page);
            return;
          } else if (activeSubTab === 'section_partition' || activeSubTab === 'promotions') {
            const res = await api.get('/courses');
            rawList = res.data?.data || res.data || [];
          }
        } else if (opKey === 'attendance') {
          if (activeSubTab === 'internship') {
            const res = await api.get('/internship/list');
            rawList = res.data?.data || res.data || [];
          } else {
            // Daily Attendance class roll call with exact SDMS filters
            try {
              const attData = await staffService.getClassAttendance({
                date: selectedAttendanceDate,
                college_id: fCollege || staff?.collegeId || 1,
                course_id: fCourse || undefined,
                branch_id: fBranch || undefined,
                year: fYear || undefined,
                semester: fSemester || undefined,
                section: fSection || undefined,
              });

              if (Array.isArray(attData) && attData.length > 0) {
                rawList = attData;
                const recordMap: Record<number, 'Present' | 'Absent'> = {};
                attData.forEach((s: any) => {
                  const sId = s.student_id || s.id;
                  if (sId) {
                    recordMap[sId] = String(s.status || '').toLowerCase() === 'absent' ? 'Absent' : 'Present';
                  }
                });
                setAttendanceRecords(recordMap);
              } else {
                // Fallback to student directory matching class
                const stuRes = await staffService.getPaginatedStudents({
                  page: 1,
                  limit: 150,
                  college: fCollege,
                  course: fCourse,
                  branch: fBranch,
                  year: fYear,
                  semester: fSemester,
                  section: fSection,
                  search: query,
                });
                rawList = stuRes.students;
                const initialMap: Record<number, 'Present' | 'Absent'> = {};
                rawList.forEach((s: any) => {
                  if (s.id) initialMap[s.id] = 'Present';
                });
                setAttendanceRecords(initialMap);
              }
            } catch (attErr) {
              const res = await api.get('/students', { params: { limit: 100 } });
              rawList = res.data?.students || res.data?.data || [];
              const initialMap: Record<number, 'Present' | 'Absent'> = {};
              rawList.forEach((s: any) => {
                if (s.id) initialMap[s.id] = 'Present';
              });
              setAttendanceRecords(initialMap);
            }
          }
        } else if (opKey === 'seminar-halls') {
          if (activeSubTab === 'halls') {
            const halls = await staffService.getSeminarHalls();
            rawList = query ? halls.filter((h: any) => String(h.name || h.hall_name || '').toLowerCase().includes(query.toLowerCase())) : halls;
          } else {
            // Booking requests
            const allHalls = await staffService.getSeminarHallRequests();
            rawList = fStatus ? allHalls.filter((h: any) => h.status === fStatus) : allHalls;
            if (query) {
              rawList = rawList.filter((r: any) =>
                String(r.event_title || r.purpose || r.hall_name || '').toLowerCase().includes(query.toLowerCase())
              );
            }
          }
        } else if (opKey === 'services') {
          if (activeSubTab === 'config') {
            const allConfigs = await staffService.getServicesConfig();
            rawList = allConfigs;
            if (fStatus === 'active') rawList = rawList.filter((s: any) => s.is_active !== false);
            if (fStatus === 'inactive') rawList = rawList.filter((s: any) => s.is_active === false);
            if (query) {
              rawList = rawList.filter((s: any) =>
                String(s.name || s.description || '').toLowerCase().includes(query.toLowerCase())
              );
            }
          } else if (activeSubTab === 'borrow') {
            const allBorrow = await staffService.getCertificateBorrowRequests();
            rawList = fStatus ? allBorrow.filter((b: any) => b.status === fStatus) : allBorrow;
            if (query) {
              rawList = rawList.filter((b: any) =>
                String(b.student_name || b.certificate_type || b.admission_number || '').toLowerCase().includes(query.toLowerCase())
              );
            }
          } else {
            const allServ = await staffService.getServiceRequests();
            rawList = fStatus ? allServ.filter((s: any) => s.status === fStatus) : allServ;
            if (query) {
              rawList = rawList.filter((s: any) =>
                String(s.student_name || s.service_title || s.admission_number || '').toLowerCase().includes(query.toLowerCase())
              );
            }
          }
        } else if (opKey === 'user-management') {
          const allUsers = await staffService.getRbacUsers();
          rawList = allUsers.filter((u: any) => {
            if (fRole && u.role !== fRole) return false;
            if (fStatus === 'active' && u.is_active === false) return false;
            if (fStatus === 'inactive' && u.is_active !== false) return false;
            return true;
          });
        } else if (opKey === 'announcements') {
          if (activeSubTab === 'polls') {
            rawList = await staffService.getPolls();
          } else if (activeSubTab === 'events') {
            rawList = await staffService.getEvents();
          } else if (activeSubTab === 'exam_notifications') {
            try {
              const notifRes = await api.get('/notifications');
              rawList = notifRes.data?.data || (Array.isArray(notifRes.data) ? notifRes.data : []);
            } catch (err) {
              rawList = [];
            }
          } else {
            const allAnn = await staffService.getAdminAnnouncements();
            rawList = fPriority ? allAnn.filter((n: any) => n.priority === fPriority) : allAnn;
          }
        } else if (opKey === 'clubs') {
          if (activeSubTab === 'members') {
            rawList = await staffService.getClubStudents();
          } else {
            rawList = await staffService.getClubs();
          }
        } else if (opKey === 'reports') {
          if (activeSubTab === 'registration') {
            const abstractData = await staffService.getRegistrationAbstract({
              academic_year: fBatch || undefined,
              college_id: fCollege || undefined,
            });
            rawList = Array.isArray(abstractData) ? abstractData : [];
          } else if (activeSubTab === 'category') {
            const catData = await staffService.getCategoryReport({
              academic_year: fBatch || undefined,
              college_id: fCollege || undefined,
            });
            rawList = Array.isArray(catData) ? catData : [];
          } else if (activeSubTab === 'scholarship') {
            const scholData = await staffService.getScholarshipReport({
              academic_year: fBatch || undefined,
              college_id: fCollege || undefined,
            });
            rawList = Array.isArray(scholData) ? scholData : [];
          } else if (activeSubTab === 'day_end' || activeSubTab === 'attendance_report') {
            const dayEndRes = await staffService.getAttendanceSummary({
              date: selectedAttendanceDate,
              college_id: fCollege || undefined,
            });
            rawList = dayEndRes?.colleges || dayEndRes?.data || (Array.isArray(dayEndRes) ? dayEndRes : []);
            if (rawList.length === 0) {
              const dashRes = await api.get('/colleges/dashboard-stats');
              rawList = dashRes.data?.data || [];
            }
          } else {
            const res = await api.get('/colleges/dashboard-stats');
            rawList = res.data?.data || [];
          }
        } else if (opKey === 'courses') {
          const res = await api.get('/courses');
          rawList = res.data?.data || res.data || [];
        } else {
          const res = await api.get('/colleges/dashboard-stats');
          rawList = res.data?.data || [];
        }

        const total = rawList.length;
        const computedPages = Math.max(1, Math.ceil(total / pageSize));
        const validP = targetPage > computedPages ? 1 : Math.max(1, targetPage);
        const start = (validP - 1) * pageSize;
        const paginatedSlice = rawList.slice(start, start + pageSize);

        setDataList(paginatedSlice);
        setTotalCount(total);
        setTotalPages(computedPages);
        setPage(validP);
      }
    } catch (e: any) {
      logger.error('OPERATION_SCREEN', `Failed loading ${opKey}/${activeSubTab}`, e.message);
      setDataList([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    loadData(searchQuery, newPage);
  };

  useEffect(() => {
    if (activeSubTab) {
      setPage(1);
      loadData(searchQuery, 1);
    }
  }, [opKey, activeSubTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // OPEN CREATE MODAL HANDLER
  const handleOpenCreateModal = () => {
    if (opKey === 'students') {
      setActionType('create_student');
      setFormName('');
      setFormAdmissionNo('');
      setFormPin('');
      setFormPhone('');
      setFormEmail('');
      setFormYear('1');
      setFormSection('A');
    } else if (opKey === 'user-management') {
      setActionType('create_user');
      setFormUsername('');
      setFormName('');
      setFormEmail('');
      setFormPassword('');
      setFormRole('staff');
    } else if (opKey === 'announcements') {
      setActionType('create_announcement');
      setFormTitle('');
      setFormContent('');
      setFormPriority('medium');
    } else if (opKey === 'clubs') {
      setActionType('create_club');
      setFormTitle('');
      setFormContent('');
    } else if (opKey === 'seminar-halls') {
      if (activeSubTab === 'halls') {
        setActionType('create_hall_item');
        setFormHallName('');
        setFormHallLocation('');
        setFormHallCapacity('250');
        setFormHallOpenTime('08:00');
        setFormHallCloseTime('20:00');
        setFormContent('');
      } else {
        setActionType('create_seminar_hall');
        setFormHallName('Main Auditorium');
        setFormBookingDate(new Date().toISOString().split('T')[0]);
        setFormPurpose('');
        setFormRequester(staff?.name || 'Staff');
      }
    } else if (opKey === 'services' && activeSubTab === 'config') {
      setActionType('create_service');
      setFormTitle('');
      setFormContent('');
      setFormPrice('0');
    }
    setActionModalVisible(true);
  };

  // OPEN EDIT SERVICE MODAL
  const handleOpenEditService = (service: any) => {
    setActionTargetItem(service);
    setActionType('edit_service');
    setFormTitle(service.name || '');
    setFormContent(service.description || '');
    setFormPrice(String(service.price ?? 0));
    setActionModalVisible(true);
  };

  // OPEN EDIT STUDENT MODAL
  const handleOpenEditStudent = (student: any) => {
    setSelectedItem(null);
    setActionTargetItem(student);
    setActionType('edit_student');
    setFormName(student.student_name || student.name || '');
    setFormAdmissionNo(student.admission_number || student.pin_no || '');
    setFormPin(student.pin_no || student.admission_number || '');
    setFormPhone(student.phone || student.mobile || '');
    setFormEmail(student.email || '');
    setFormYear(String(student.current_year || '1'));
    setFormSection(student.section || 'A');
    setActionModalVisible(true);
  };

  // OPEN EDIT ANNOUNCEMENT MODAL
  const handleOpenEditAnnouncement = (item: any) => {
    setActionTargetItem(item);
    setActionType('edit_announcement');
    setFormTitle(item.title || '');
    setFormContent(item.content || '');
    setFormPriority(item.priority || 'medium');
    setActionModalVisible(true);
  };

  // FORM SUBMISSION HANDLER
  const handleSaveForm = async () => {
    try {
      if (actionType === 'create_student') {
        if (!formName.trim() || !formAdmissionNo.trim()) {
          Alert.alert('Required', 'Please enter Student Name and Admission/PIN Number');
          return;
        }
        await staffService.createStudent({
          student_name: formName.trim(),
          admission_number: formAdmissionNo.trim(),
          pin_no: formPin.trim() || formAdmissionNo.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim(),
          current_year: Number(formYear) || 1,
          section: formSection.trim() || 'A',
          college_id: staff?.collegeId || 1,
        });
        Alert.alert('Success', 'Student created successfully');
      } else if (actionType === 'edit_student') {
        const admission = actionTargetItem?.admission_number || actionTargetItem?.pin_no || formAdmissionNo;
        await staffService.updateStudent(admission, {
          student_name: formName.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim(),
          current_year: Number(formYear) || 1,
          section: formSection.trim() || 'A',
        });
        Alert.alert('Updated', 'Student profile updated successfully');
      } else if (actionType === 'create_user') {
        if (!formUsername.trim() || !formPassword.trim()) {
          Alert.alert('Required', 'Username and password are required');
          return;
        }
        await staffService.createRbacUser({
          username: formUsername.trim(),
          name: formName.trim() || formUsername.trim(),
          email: formEmail.trim(),
          password: formPassword.trim(),
          role: formRole,
          college_id: staff?.collegeId || 1,
        });
        Alert.alert('Success', `Staff user "${formUsername}" created`);
      } else if (actionType === 'create_announcement') {
        if (!formTitle.trim() || !formContent.trim()) {
          Alert.alert('Required', 'Title and Content are required');
          return;
        }
        await staffService.createAnnouncement({
          title: formTitle.trim(),
          content: formContent.trim(),
          priority: formPriority,
        });
        Alert.alert('Success', 'Announcement broadcasted to portal');
      } else if (actionType === 'edit_announcement') {
        await staffService.updateAnnouncement(actionTargetItem.id, {
          title: formTitle.trim(),
          content: formContent.trim(),
          priority: formPriority,
        });
        Alert.alert('Updated', 'Announcement updated');
      } else if (actionType === 'create_club') {
        if (!formTitle.trim()) {
          Alert.alert('Required', 'Club Name is required');
          return;
        }
        await staffService.createClub({
          name: formTitle.trim(),
          description: formContent.trim(),
        });
        Alert.alert('Success', `Club "${formTitle}" created`);
      } else if (actionType === 'create_seminar_hall') {
        await staffService.createSeminarHallRequest({
          hall_name: formHallName.trim(),
          booking_date: formBookingDate.trim(),
          purpose: formPurpose.trim(),
          requester_name: formRequester.trim(),
        });
        Alert.alert('Success', 'Seminar Hall request submitted');
      } else if (actionType === 'create_hall_item') {
        if (!formHallName.trim()) {
          Alert.alert('Required', 'Hall name is required');
          return;
        }
        await staffService.createSeminarHall({
          hallName: formHallName.trim(),
          location: formHallLocation.trim(),
          capacity: Number(formHallCapacity) || 200,
          description: formContent.trim(),
          openTime: formHallOpenTime.trim() || '08:00',
          closeTime: formHallCloseTime.trim() || '20:00',
        });
        Alert.alert('Success', `Seminar Hall "${formHallName}" created`);
      } else if (actionType === 'create_service') {
        if (!formTitle.trim()) {
          Alert.alert('Required', 'Service Name is required');
          return;
        }
        await staffService.createServiceConfig({
          name: formTitle.trim(),
          description: formContent.trim(),
          price: Number(formPrice) || 0,
          is_active: true,
        });
        Alert.alert('Success', `Service "${formTitle}" created`);
      } else if (actionType === 'edit_service') {
        if (!formTitle.trim()) {
          Alert.alert('Required', 'Service Name is required');
          return;
        }
        await staffService.updateServiceConfig(actionTargetItem.id, {
          name: formTitle.trim(),
          description: formContent.trim(),
          price: Number(formPrice) || 0,
        });
        Alert.alert('Updated', 'Service configuration updated');
      } else if (actionType === 'update_pin') {
        if (!formPin.trim()) {
          Alert.alert('Required', 'Please enter new PIN number');
          return;
        }
        const admission = actionTargetItem?.admission_number || actionTargetItem?.pin_no;
        await staffService.updateStudentPin(admission, formPin.trim());
        Alert.alert('PIN Updated', `New PIN assigned: ${formPin.trim()}`);
      }

      setActionModalVisible(false);
      loadData();
    } catch (err: any) {
      Alert.alert('Operation Failed', err.response?.data?.message || err.message || 'Error occurred');
    }
  };

  // DELETE ACTIONS
  const handleDeleteStudent = (student: any) => {
    const admission = student.admission_number || student.pin_no;
    Alert.alert('Delete Student', `Permanently delete student ${student.student_name || admission}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await staffService.deleteStudent(admission);
            setSelectedItem(null);
            Alert.alert('Deleted', 'Student record removed');
            loadData();
          } catch (e: any) {
            Alert.alert('Delete Failed', e.message);
          }
        },
      },
    ]);
  };

  const handleDeleteUser = (userItem: any) => {
    Alert.alert('Delete User', `Remove access for ${userItem.name || userItem.username}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await staffService.deleteRbacUser(userItem.id);
            Alert.alert('Deleted', 'Staff user deleted');
            loadData();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const handleToggleUserStatus = async (userItem: any) => {
    try {
      const nextStatus = userItem.is_active === false;
      await staffService.updateUserStatus(userItem.id, nextStatus);
      loadData();
    } catch (e: any) {
      Alert.alert('Failed', e.message);
    }
  };

  const handleDeleteAnnouncement = (id: number | string) => {
    Alert.alert('Delete Notice', 'Delete this notice from circulars?', [
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

  const handleDeleteSubmission = (id: number | string) => {
    Alert.alert('Delete Submission', 'Discard this applicant submission?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await staffService.deleteSubmission(id);
            loadData();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const handleDeleteClub = (clubId: number | string) => {
    Alert.alert('Delete Club', 'Remove this student club?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await staffService.deleteClub(clubId);
            loadData();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const handleToggleClubStatus = async (clubId: number | string) => {
    try {
      await staffService.toggleClubStatus(clubId);
      loadData();
    } catch (e: any) {
      Alert.alert('Failed', e.message);
    }
  };

  const handleDeleteServiceRequest = (id: number | string) => {
    Alert.alert('Delete Request', 'Delete this student service request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await staffService.deleteServiceRequest(id);
            loadData();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const handleResetPassword = (admission: string) => {
    Alert.alert('Reset Password', `Reset login password for student ${admission}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        onPress: async () => {
          try {
            await staffService.resetStudentPassword(admission);
            Alert.alert('Success', 'Password has been reset to default');
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  // APPROVAL HANDLERS
  const handleApproveSubmission = async (id: string | number) => {
    try {
      await staffService.approveSubmission(id, 'Approved via SDMS Mobile');
      Alert.alert('Success', 'Student submission approved');
      loadData();
    } catch (e: any) {
      Alert.alert('Approval Failed', e.message);
    }
  };

  const handleRejectSubmissionPrompt = (id: string | number) => {
    setActionTargetItem({ id });
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
      await staffService.rejectSubmission(actionTargetItem.id, actionRemark.trim());
      setActionModalVisible(false);
      Alert.alert('Rejected', 'Submission has been rejected');
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleProfileRequestAction = async (id: number | string, status: 'approved' | 'rejected') => {
    try {
      await staffService.updateProfileRequestStatus(id, status);
      Alert.alert('Success', `Profile request marked as ${status}`);
      loadData();
    } catch (e: any) {
      Alert.alert('Failed', e.message);
    }
  };

  const handleSeminarHallAction = async (id: number | string, status: 'approved' | 'rejected') => {
    try {
      await staffService.updateSeminarHallRequestStatus(id, status);
      Alert.alert('Success', `Seminar Hall booking ${status}`);
      loadData();
    } catch (e: any) {
      Alert.alert('Failed', e.message);
    }
  };

  const handleServiceRequestAction = async (id: number | string, status: string) => {
    try {
      await staffService.updateServiceRequestStatus(id, status);
      Alert.alert('Updated', `Service status set to: ${status}`);
      loadData();
    } catch (e: any) {
      Alert.alert('Failed', e.message);
    }
  };

  const handleToggleServiceStatus = async (service: any) => {
    try {
      const nextStatus = !service.is_active;
      await staffService.toggleServiceConfigStatus(service.id, nextStatus);
      Alert.alert('Status Updated', `Service "${service.name}" is now ${nextStatus ? 'Active' : 'Inactive'}`);
      loadData();
    } catch (e: any) {
      Alert.alert('Failed', e.message);
    }
  };

  const handleDeleteService = (serviceId: number | string, serviceName: string) => {
    Alert.alert('Delete Service', `Permanently delete service "${serviceName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await staffService.deleteServiceConfig(serviceId);
            Alert.alert('Deleted', 'Service removed from configuration');
            loadData();
          } catch (e: any) {
            Alert.alert('Delete Failed', e.message);
          }
        },
      },
    ]);
  };

  const handleCertificateBorrowAction = async (id: number | string, status: string) => {
    try {
      await staffService.updateCertificateBorrowStatus(id, status, `Marked as ${status} via SDMS Mobile`);
      Alert.alert('Updated', `Borrow request marked as ${status}`);
      loadData();
    } catch (e: any) {
      Alert.alert('Action Failed', e.message);
    }
  };

  const handleToggleAttendance = (studentId: number) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === 'Present' ? 'Absent' : 'Present',
    }));
  };

  const handleMarkAllPresent = () => {
    const updated: Record<number, 'Present' | 'Absent'> = {};
    dataList.forEach((s: any) => {
      const sId = s.student_id || s.id;
      if (sId) updated[sId] = 'Present';
    });
    setAttendanceRecords(updated);
  };

  const handleMarkAllAbsent = () => {
    const updated: Record<number, 'Present' | 'Absent'> = {};
    dataList.forEach((s: any) => {
      const sId = s.student_id || s.id;
      if (sId) updated[sId] = 'Absent';
    });
    setAttendanceRecords(updated);
  };

  const handleResetAttendance = () => {
    Alert.alert(
      'Reset Attendance',
      `Clear recorded roll call for date ${selectedAttendanceDate}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await staffService.deleteClassAttendance({
                date: selectedAttendanceDate,
                college_id: selectedCollege || staff?.collegeId || 1,
                course_id: selectedCourse || undefined,
                branch_id: selectedBranch || undefined,
                year: selectedYear || undefined,
                semester: selectedSemester || undefined,
                section: selectedSection || undefined,
              });
              Alert.alert('Reset Complete', 'Attendance cleared for this class.');
              loadData();
            } catch (err: any) {
              Alert.alert('Reset Failed', err.response?.data?.message || err.message);
            }
          },
        },
      ]
    );
  };

  const handleSendDayEndReports = () => {
    Alert.alert(
      'Send Day-End SMS Reports',
      `Dispatch absentee SMS reports for date ${selectedAttendanceDate}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Reports',
          onPress: async () => {
            try {
              const res = await staffService.sendDayEndReports({
                date: selectedAttendanceDate,
                college_id: selectedCollege || 'all',
              });
              Alert.alert('Dispatched', res?.message || 'Day-end reports broadcasted successfully.');
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || err.message);
            }
          },
        },
      ]
    );
  };

  const handleRetrySmsGlobal = async (logId?: number | string) => {
    try {
      const res = await staffService.retrySms(logId ? { logId } : { date: selectedAttendanceDate });
      Alert.alert('SMS Retry', res?.message || 'Failed SMS queue re-dispatched.');
      loadData();
    } catch (err: any) {
      Alert.alert('Retry Failed', err.response?.data?.message || err.message);
    }
  };

  const handleDeleteSeminarHall = (hallId: number | string, hallName: string) => {
    Alert.alert('Delete Seminar Hall', `Permanently delete ${hallName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await staffService.deleteSeminarHall(hallId);
            Alert.alert('Deleted', 'Seminar hall removed.');
            loadData();
          } catch (e: any) {
            Alert.alert('Delete Failed', e.response?.data?.message || e.message);
          }
        },
      },
    ]);
  };

  const handleSubmitDailyAttendance = async () => {
    const records = Object.entries(attendanceRecords).map(([studentId, status]) => ({
      student_id: Number(studentId),
      status: status.toLowerCase(),
    }));

    if (records.length === 0) {
      Alert.alert('Empty Class', 'No student records available to submit.');
      return;
    }

    try {
      await staffService.submitClassAttendance({
        date: selectedAttendanceDate,
        college_id: selectedCollege || staff?.collegeId || 1,
        course_id: selectedCourse || undefined,
        branch_id: selectedBranch || undefined,
        year: selectedYear || undefined,
        semester: selectedSemester || undefined,
        section: selectedSection || undefined,
        attendance: records,
      });
      Alert.alert('Attendance Saved', `Recorded roll call for ${records.length} students`);
      loadData();
    } catch (e: any) {
      Alert.alert('Submission Error', e.response?.data?.message || e.message || 'Could not submit attendance');
    }
  };

  const hasCreateAction =
    canWrite &&
    ((opKey === 'students' && (activeSubTab === 'database' || !activeSubTab)) ||
      opKey === 'user-management' ||
      (opKey === 'announcements' && activeSubTab === 'notices') ||
      (opKey === 'clubs' && activeSubTab === 'management') ||
      opKey === 'seminar-halls' ||
      (opKey === 'services' && activeSubTab === 'config'));

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

        {/* Dynamic Header Action (+ Create / Add) */}
        {hasCreateAction && (
          <TouchableOpacity style={styles.addHeaderBtn} onPress={handleOpenCreateModal} activeOpacity={0.8}>
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.addHeaderBtnText}>
              {opKey === 'students'
                ? 'Add Student'
                : opKey === 'user-management'
                ? 'Add Staff'
                : opKey === 'announcements'
                ? 'New Notice'
                : opKey === 'clubs'
                ? 'New Club'
                : opKey === 'seminar-halls'
                ? activeSubTab === 'halls'
                  ? 'Add Hall'
                  : 'Book Hall'
                : opKey === 'services' && activeSubTab === 'config'
                ? 'Add Service'
                : 'New Item'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Subpage Tabs */}
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

      {/* Search and Filters Bar */}
      {(opKey === 'students' ||
        opKey === 'user-management' ||
        opKey === 'announcements' ||
        opKey === 'seminar-halls' ||
        opKey === 'services' ||
        opKey === 'clubs' ||
        opKey === 'attendance' ||
        opKey === 'reports') && (
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchBar}>
            <Search size={16} color="#94A3B8" />
            <TextInput
              placeholder={`Search in ${currentNav.label}...`}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => {
                setPage(1);
                loadData(searchQuery.trim(), 1);
              }}
              returnKeyType="search"
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setPage(1);
                  loadData(searchQuery.trim(), 1);
                }}
                style={styles.searchGoBtn}
              >
                <Text style={styles.searchGoBtnText}>Go</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Trigger Button */}
          <TouchableOpacity
            style={[styles.filterTriggerBtn, activeFilterCount > 0 && styles.filterTriggerBtnActive]}
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.8}
          >
            <Filter size={15} color={activeFilterCount > 0 ? '#FFFFFF' : '#1E3A8A'} />
            <Text
              style={[
                styles.filterTriggerText,
                activeFilterCount > 0 && styles.filterTriggerTextActive,
              ]}
            >
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Active Filter Pills Horizontal Bar */}
      {activeFilterCount > 0 && (
        <View style={styles.activeFiltersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeFiltersScroll}
          >
            {selectedBatch ? (
              <TouchableOpacity
                style={styles.activeFilterPill}
                onPress={() => {
                  setSelectedBatch('');
                  loadData(searchQuery, 1, { batch: '' });
                }}
              >
                <Text style={styles.activeFilterPillText}>Batch: {selectedBatch}</Text>
                <X size={12} color="#1E3A8A" />
              </TouchableOpacity>
            ) : null}
            {selectedCourse ? (
              <TouchableOpacity
                style={styles.activeFilterPill}
                onPress={() => {
                  setSelectedCourse('');
                  loadData(searchQuery, 1, { course: '' });
                }}
              >
                <Text style={styles.activeFilterPillText}>Course: {selectedCourse}</Text>
                <X size={12} color="#1E3A8A" />
              </TouchableOpacity>
            ) : null}
            {selectedBranch ? (
              <TouchableOpacity
                style={styles.activeFilterPill}
                onPress={() => {
                  setSelectedBranch('');
                  loadData(searchQuery, 1, { branch: '' });
                }}
              >
                <Text style={styles.activeFilterPillText}>Branch: {selectedBranch}</Text>
                <X size={12} color="#1E3A8A" />
              </TouchableOpacity>
            ) : null}
            {selectedYear ? (
              <TouchableOpacity
                style={styles.activeFilterPill}
                onPress={() => {
                  setSelectedYear('');
                  loadData(searchQuery, 1, { year: '' });
                }}
              >
                <Text style={styles.activeFilterPillText}>Year: {selectedYear}</Text>
                <X size={12} color="#1E3A8A" />
              </TouchableOpacity>
            ) : null}
            {selectedSemester ? (
              <TouchableOpacity
                style={styles.activeFilterPill}
                onPress={() => {
                  setSelectedSemester('');
                  loadData(searchQuery, 1, { semester: '' });
                }}
              >
                <Text style={styles.activeFilterPillText}>Sem: {selectedSemester}</Text>
                <X size={12} color="#1E3A8A" />
              </TouchableOpacity>
            ) : null}
            {selectedSection ? (
              <TouchableOpacity
                style={styles.activeFilterPill}
                onPress={() => {
                  setSelectedSection('');
                  loadData(searchQuery, 1, { section: '' });
                }}
              >
                <Text style={styles.activeFilterPillText}>Sec: {selectedSection}</Text>
                <X size={12} color="#1E3A8A" />
              </TouchableOpacity>
            ) : null}
            {selectedPinStatus ? (
              <TouchableOpacity
                style={styles.activeFilterPill}
                onPress={() => {
                  setSelectedPinStatus('');
                  loadData(searchQuery, 1, { pinStatus: '' });
                }}
              >
                <Text style={styles.activeFilterPillText}>PIN: {selectedPinStatus}</Text>
                <X size={12} color="#1E3A8A" />
              </TouchableOpacity>
            ) : null}
            {selectedGender ? (
              <TouchableOpacity
                style={styles.activeFilterPill}
                onPress={() => {
                  setSelectedGender('');
                  loadData(searchQuery, 1, { gender: '' });
                }}
              >
                <Text style={styles.activeFilterPillText}>Gender: {selectedGender}</Text>
                <X size={12} color="#1E3A8A" />
              </TouchableOpacity>
            ) : null}
            {selectedStatus ? (
              <TouchableOpacity
                style={styles.activeFilterPill}
                onPress={() => {
                  setSelectedStatus('');
                  loadData(searchQuery, 1, { status: '' });
                }}
              >
                <Text style={styles.activeFilterPillText}>Status: {selectedStatus}</Text>
                <X size={12} color="#1E3A8A" />
              </TouchableOpacity>
            ) : null}
            {selectedRole ? (
              <TouchableOpacity
                style={styles.activeFilterPill}
                onPress={() => {
                  setSelectedRole('');
                  loadData(searchQuery, 1, { role: '' });
                }}
              >
                <Text style={styles.activeFilterPillText}>Role: {selectedRole}</Text>
                <X size={12} color="#1E3A8A" />
              </TouchableOpacity>
            ) : null}
            {selectedPriority ? (
              <TouchableOpacity
                style={styles.activeFilterPill}
                onPress={() => {
                  setSelectedPriority('');
                  loadData(searchQuery, 1, { priority: '' });
                }}
              >
                <Text style={styles.activeFilterPillText}>Priority: {selectedPriority}</Text>
                <X size={12} color="#1E3A8A" />
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.clearAllFiltersBtn}
              onPress={handleClearAllFilters}
            >
              <Text style={styles.clearAllFiltersText}>Reset All</Text>
            </TouchableOpacity>
          </ScrollView>
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
          ref={scrollRef}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Total Record Summary Bar */}
          {totalCount > 0 && (
            <View style={styles.countSummaryBar}>
              <Text style={styles.countSummaryText}>
                Total Records:{' '}
                <Text style={{ fontWeight: '800', color: '#1E3A8A' }}>
                  {totalCount.toLocaleString()}
                </Text>
                {totalPages > 1 ? ` • Page ${page} of ${totalPages}` : ''}
              </Text>
            </View>
          )}
          {/* 1. DAILY ATTENDANCE MARKING LIST */}
          {opKey === 'attendance' && (activeSubTab === 'daily' || !activeSubTab) ? (
            <View>
              {/* Class Roll Call Stats Card */}
              <View style={styles.attSummaryCard}>
                <View style={styles.attSummaryTop}>
                  <View>
                    <Text style={styles.attSummaryDate}>Date: {selectedAttendanceDate}</Text>
                    <Text style={styles.attSummaryTitle}>Daily Roll Call Status</Text>
                  </View>
                  <View style={styles.attRateBadge}>
                    <Text style={styles.attRateBadgeText}>
                      {dataList.length > 0
                        ? `${((Object.values(attendanceRecords).filter((s) => s === 'Present').length / dataList.length) * 100).toFixed(1)}%`
                        : '0.0%'}
                    </Text>
                  </View>
                </View>

                <View style={styles.attSummaryRow}>
                  <View style={styles.attSummaryCol}>
                    <Text style={styles.attSummaryLabel}>Enrolled</Text>
                    <Text style={styles.attSummaryVal}>{dataList.length}</Text>
                  </View>
                  <View style={styles.attSummaryCol}>
                    <Text style={styles.attSummaryLabel}>Present</Text>
                    <Text style={[styles.attSummaryVal, { color: '#059669' }]}>
                      {Object.values(attendanceRecords).filter((s) => s === 'Present').length}
                    </Text>
                  </View>
                  <View style={styles.attSummaryCol}>
                    <Text style={styles.attSummaryLabel}>Absent</Text>
                    <Text style={[styles.attSummaryVal, { color: '#DC2626' }]}>
                      {dataList.length - Object.values(attendanceRecords).filter((s) => s === 'Present').length}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Attendance Quick Actions Bar */}
              {canWrite && (
                <View style={styles.attToolbar}>
                  <TouchableOpacity
                    style={[styles.attQuickBtn, { backgroundColor: '#DCFCE7' }]}
                    onPress={handleMarkAllPresent}
                    activeOpacity={0.8}
                  >
                    <CheckSquare size={13} color="#15803D" />
                    <Text style={[styles.attQuickBtnText, { color: '#15803D' }]}>All Present</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.attQuickBtn, { backgroundColor: '#FEE2E2' }]}
                    onPress={handleMarkAllAbsent}
                    activeOpacity={0.8}
                  >
                    <X size={13} color="#DC2626" />
                    <Text style={[styles.attQuickBtnText, { color: '#DC2626' }]}>All Absent</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.attQuickBtn, { backgroundColor: '#F1F5F9' }]}
                    onPress={handleResetAttendance}
                    activeOpacity={0.8}
                  >
                    <RotateCcw size={13} color="#475569" />
                    <Text style={[styles.attQuickBtnText, { color: '#475569' }]}>Reset</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.attQuickBtn, { backgroundColor: '#EEF2FF' }]}
                    onPress={handleSendDayEndReports}
                    activeOpacity={0.8}
                  >
                    <Send size={13} color="#1E3A8A" />
                    <Text style={[styles.attQuickBtnText, { color: '#1E3A8A' }]}>Day-End</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Student Roll Call Rows */}
              {dataList.map((stu: any, idx: number) => {
                const sId = stu.student_id || stu.id;
                const isPres = attendanceRecords[sId] === 'Present';
                return (
                  <View key={sId || idx} style={styles.attendanceRowCard}>
                    <View style={styles.attendanceLeft}>
                      <Text style={styles.attendanceName}>{stu.student_name || stu.name || 'Student'}</Text>
                      <Text style={styles.attendancePin}>{stu.admission_number || stu.pin_no || 'PIN N/A'}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.attBadge, isPres ? styles.attBadgePres : styles.attBadgeAbs]}
                      onPress={() => handleToggleAttendance(sId)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.attBadgeText, isPres ? styles.attBadgeTextPres : styles.attBadgeTextAbs]}>
                        {isPres ? 'Present' : 'Absent'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}

              {dataList.length > 0 && canWrite && (
                <TouchableOpacity style={styles.submitAttBtn} onPress={handleSubmitDailyAttendance} activeOpacity={0.8}>
                  <Check size={18} color="#FFFFFF" />
                  <Text style={styles.submitAttBtnText}>Submit Roll Call</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (opKey === 'announcements' && activeSubTab === 'sms') ||
            (opKey === 'reports' && activeSubTab === 'sms_reports') ? (
            /* 2. SMS REPORTS & LOGS VIEW */
            <View>
              {/* SMS Metrics Cards */}
              <View style={styles.smsStatRow}>
                <View style={styles.smsStatCard}>
                  <View style={styles.smsStatIcon}>
                    <Wallet size={16} color="#1E3A8A" />
                  </View>
                  <Text style={styles.smsStatLabel}>Balance</Text>
                  <Text style={styles.smsStatVal}>
                    {smsBalance?.credits != null ? Number(smsBalance.credits).toLocaleString('en-IN') : 'Active'}
                  </Text>
                </View>

                <View style={styles.smsStatCard}>
                  <View style={[styles.smsStatIcon, { backgroundColor: '#DCFCE7' }]}>
                    <CheckCircle size={16} color="#15803D" />
                  </View>
                  <Text style={styles.smsStatLabel}>Sent</Text>
                  <Text style={[styles.smsStatVal, { color: '#15803D' }]}>{smsSummary.sent}</Text>
                </View>

                <View style={styles.smsStatCard}>
                  <View style={[styles.smsStatIcon, { backgroundColor: '#FEE2E2' }]}>
                    <XCircle size={16} color="#DC2626" />
                  </View>
                  <Text style={styles.smsStatLabel}>Failed</Text>
                  <Text style={[styles.smsStatVal, { color: '#DC2626' }]}>{smsSummary.failed}</Text>
                </View>
              </View>

              {/* SMS Action Bar */}
              {canWrite && (
                <View style={styles.smsRetryBar}>
                  <TouchableOpacity
                    style={styles.smsRetryBtn}
                    onPress={() => handleRetrySmsGlobal()}
                    activeOpacity={0.8}
                  >
                    <RotateCcw size={15} color="#FFFFFF" />
                    <Text style={styles.smsRetryBtnText}>Retry Failed SMS Queue</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* SMS Logs List */}
              {dataList.length > 0 ? (
                dataList.map((log: any, idx: number) => {
                  const isSent =
                    String(log.status || '').toLowerCase() === 'sent' ||
                    String(log.status || '').toLowerCase() === 'delivered';
                  const isFailed = String(log.status || '').toLowerCase() === 'failed';
                  return (
                    <TouchableOpacity
                      key={log.id || idx}
                      style={styles.smsLogCard}
                      onPress={() => {
                        setSelectedSmsLog(log);
                        setSmsModalVisible(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.smsLogHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.smsLogPhone}>{log.phone_number || log.phone || log.recipient || 'Phone'}</Text>
                          <Text style={styles.smsLogSub}>
                            {log.template_name || log.category || 'SMS Notice'} •{' '}
                            {log.sent_at || log.created_at ? String(log.sent_at || log.created_at).split('T')[0] : 'Recent'}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.statusPill,
                            isSent ? styles.pillSuccess : isFailed ? styles.pillInactive : styles.pillPending,
                          ]}
                        >
                          <Text style={styles.statusPillText}>{log.status || 'Sent'}</Text>
                        </View>
                      </View>
                      <Text style={styles.smsLogMsg} numberOfLines={2}>
                        {log.message || log.content || 'SMS Message content'}
                      </Text>

                      {isFailed && canWrite && (
                        <TouchableOpacity
                          style={styles.smsSingleRetryBtn}
                          onPress={() => handleRetrySmsGlobal(log.id)}
                        >
                          <RotateCcw size={12} color="#DC2626" />
                          <Text style={styles.smsSingleRetryText}>Retry Send</Text>
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>No SMS Dispatches</Text>
                  <Text style={styles.emptyText}>No SMS records found for this date. Pull down to refresh.</Text>
                </View>
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

                    {canWrite && (
                      <View style={styles.btnRow}>
                        {item.status !== 'approved' && (
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.approveBtn]}
                            onPress={() => handleApproveSubmission(item.id)}
                          >
                            <Check size={14} color="#FFFFFF" />
                            <Text style={styles.actionBtnText}>Approve</Text>
                          </TouchableOpacity>
                        )}
                        {item.status !== 'rejected' && (
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.rejectBtn]}
                            onPress={() => handleRejectSubmissionPrompt(item.id)}
                          >
                            <X size={14} color="#FFFFFF" />
                            <Text style={styles.actionBtnText}>Reject</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.deleteActionBtn]}
                          onPress={() => handleDeleteSubmission(item.id)}
                        >
                          <Trash2 size={14} color="#DC2626" />
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

              // 3. SEMINAR HALLS (CAMPUS HALLS)
              if (opKey === 'seminar-halls' && activeSubTab === 'halls') {
                return (
                  <View key={item.id || idx} style={styles.actionCard}>
                    <View style={styles.actionCardHeader}>
                      <View style={styles.actionCardInfo}>
                        <Text style={styles.actionTitle}>{item.name || item.hall_name || 'Seminar Hall'}</Text>
                        <Text style={styles.actionSub}>Location: {item.location || 'Campus Ground Floor'}</Text>
                        <Text style={styles.actionDetail}>
                          Capacity: <Text style={{ fontWeight: '700', color: '#1E3A8A' }}>{item.capacity || 250} Seats</Text> • Hours: {item.open_time || '08:00'} - {item.close_time || '20:00'}
                        </Text>
                        {item.description ? <Text style={styles.actionDetail}>{item.description}</Text> : null}
                      </View>
                      <View style={[styles.statusPill, styles.pillSuccess]}>
                        <Text style={styles.statusPillText}>Available</Text>
                      </View>
                    </View>

                    {canWrite && (
                      <View style={styles.btnRow}>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.deleteActionBtn]}
                          onPress={() => handleDeleteSeminarHall(item.id, item.name || item.hall_name)}
                        >
                          <Trash2 size={14} color="#DC2626" />
                          <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>Delete Hall</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              }

              // 4. SEMINAR HALL REQUESTS
              if (opKey === 'seminar-halls') {
                return (
                  <View key={item.id || idx} style={styles.actionCard}>
                    <View style={styles.actionCardHeader}>
                      <View style={styles.actionCardInfo}>
                        <Text style={styles.actionTitle}>{item.hall_name || 'Seminar Hall'}</Text>
                        <Text style={styles.actionSub}>Event: {item.event_title || item.purpose || 'Campus Event'}</Text>
                        <Text style={styles.actionSub}>
                          Date: {item.booking_date || item.event_date} ({item.start_time || 'Morning'} - {item.end_time || 'Evening'})
                        </Text>
                        <Text style={styles.actionDetail}>
                          Attendees: <Text style={{ fontWeight: '700' }}>{item.expected_attendees || '150'}</Text> • By: {item.requester_name || item.organizer || 'Staff'}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusPill,
                          item.status === 'approved'
                            ? styles.pillSuccess
                            : item.status === 'rejected'
                            ? styles.pillInactive
                            : styles.pillPending,
                        ]}
                      >
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

              // 5. REGISTRATION REPORTS (ABSTRACT)
              if (opKey === 'reports' && activeSubTab === 'registration') {
                return (
                  <View key={item.id || idx} style={styles.reportAbstractCard}>
                    <View style={styles.reportHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reportTitle}>{item.college || item.college_name || item.course || 'Institution'}</Text>
                        <Text style={styles.reportSub}>
                          {item.course ? `${item.course} • ` : ''}
                          {item.branch || 'All Branches'}
                        </Text>
                      </View>
                      <View style={styles.reportTotalBadge}>
                        <Text style={styles.reportTotalText}>{Number(item.total || 0).toLocaleString()} Enrolled</Text>
                      </View>
                    </View>

                    <View style={styles.reportMetricsGrid}>
                      <View style={styles.reportMetricCol}>
                        <Text style={styles.reportMetricLabel}>Completed</Text>
                        <Text style={[styles.reportMetricVal, { color: '#059669' }]}>
                          {Number(item.overall_completed || item.completed || 0).toLocaleString()}
                        </Text>
                      </View>
                      <View style={styles.reportMetricCol}>
                        <Text style={styles.reportMetricLabel}>Temporary</Text>
                        <Text style={[styles.reportMetricVal, { color: '#D97706' }]}>
                          {Number(item.overall_temporary || item.temporary || 0).toLocaleString()}
                        </Text>
                      </View>
                      <View style={styles.reportMetricCol}>
                        <Text style={styles.reportMetricLabel}>Verified</Text>
                        <Text style={[styles.reportMetricVal, { color: '#1E3A8A' }]}>
                          {Number(item.verification_completed || item.verified || 0).toLocaleString()}
                        </Text>
                      </View>
                      <View style={styles.reportMetricCol}>
                        <Text style={styles.reportMetricLabel}>Fee Cleared</Text>
                        <Text style={[styles.reportMetricVal, { color: '#7C3AED' }]}>
                          {Number(item.fee_cleared || 0).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              }

              // 6. CATEGORY REPORT
              if (opKey === 'reports' && activeSubTab === 'category') {
                return (
                  <View key={item.id || idx} style={styles.actionCard}>
                    <View style={styles.actionCardHeader}>
                      <View style={styles.actionCardInfo}>
                        <Text style={styles.actionTitle}>{item.category || item.name || 'Category'}</Text>
                        <Text style={styles.actionSub}>Total: {Number(item.total || item.count || 0).toLocaleString()} Students</Text>
                        <Text style={styles.actionDetail}>
                          Boys: {Number(item.boys || item.male || 0).toLocaleString()} • Girls: {Number(item.girls || item.female || 0).toLocaleString()}
                        </Text>
                      </View>
                      <View style={[styles.statusPill, { backgroundColor: '#EEF2FF' }]}>
                        <Text style={[styles.statusPillText, { color: '#1E3A8A' }]}>
                          {item.percentage ? `${item.percentage}%` : 'Category'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              }

              // 7. SCHOLARSHIP REPORT
              if (opKey === 'reports' && activeSubTab === 'scholarship') {
                return (
                  <View key={item.id || idx} style={styles.actionCard}>
                    <View style={styles.actionCardHeader}>
                      <View style={styles.actionCardInfo}>
                        <Text style={styles.actionTitle}>{item.student_name || item.course || 'Scholarship Record'}</Text>
                        <Text style={styles.actionSub}>
                          Sanctioned: ₹{Number(item.sanctioned_amount || item.sanctioned || 0).toLocaleString('en-IN')}
                        </Text>
                        <Text style={styles.actionDetail}>
                          Released: ₹{Number(item.released_amount || item.released || 0).toLocaleString('en-IN')} • Due: ₹{Number(item.due_amount || item.due || 0).toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View style={[styles.statusPill, item.status === 'released' ? styles.pillSuccess : styles.pillPending]}>
                        <Text style={styles.statusPillText}>{item.status || 'Pending'}</Text>
                      </View>
                    </View>
                  </View>
                );
              }

              // 8. DAY END ATTENDANCE REPORT
              if (opKey === 'reports' && (activeSubTab === 'day_end' || activeSubTab === 'attendance_report')) {
                return (
                  <View key={item.id || idx} style={styles.actionCard}>
                    <View style={styles.actionCardHeader}>
                      <View style={styles.actionCardInfo}>
                        <Text style={styles.actionTitle}>{item.college || item.name || 'Institution'}</Text>
                        <Text style={styles.actionSub}>
                          Present: {Number(item.present || 0).toLocaleString()} / {Number(item.total || 0).toLocaleString()}
                        </Text>
                        <Text style={styles.actionDetail}>
                          Absent: <Text style={{ color: '#DC2626', fontWeight: '700' }}>{Number(item.absent || 0).toLocaleString()}</Text>
                        </Text>
                      </View>
                      <View style={[styles.statusPill, Number(item.rate || 0) >= 75 ? styles.pillSuccess : styles.pillInactive]}>
                        <Text style={styles.statusPillText}>{Number(item.rate || 0).toFixed(1)}%</Text>
                      </View>
                    </View>

                    {canWrite && (
                      <View style={styles.btnRow}>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: '#1E3A8A' }]}
                          onPress={handleSendDayEndReports}
                        >
                          <Send size={14} color="#FFFFFF" />
                          <Text style={styles.actionBtnText}>Broadcast Day-End SMS</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              }

              // 4. SERVICES - CONFIGURATION (Settings & Actions)
              if (opKey === 'services' && activeSubTab === 'config') {
                const isActive = item.is_active !== false;
                const adminFields = Array.isArray(item.admin_fields) ? item.admin_fields : [];
                return (
                  <View key={item.id || idx} style={styles.actionCard}>
                    <View style={styles.actionCardHeader}>
                      <View style={styles.actionCardInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <Text style={styles.actionTitle}>{item.name}</Text>
                          <View style={styles.servicePriceBadge}>
                            <Text style={styles.servicePriceText}>
                              {Number(item.price || 0) > 0 ? `₹${item.price}` : 'FREE'}
                            </Text>
                          </View>
                        </View>
                        {item.description ? (
                          <Text style={styles.serviceDesc} numberOfLines={2}>
                            {item.description}
                          </Text>
                        ) : null}
                        {adminFields.length > 0 && (
                          <View style={styles.adminFieldsRow}>
                            <Text style={styles.adminFieldTagText}>Fields: </Text>
                            {adminFields.map((field: any, fIdx: number) => (
                              <View key={fIdx} style={styles.adminFieldTag}>
                                <Text style={styles.adminFieldTagText}>{field.label || field.name || field}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                      <TouchableOpacity
                        style={[styles.statusPill, isActive ? styles.pillSuccess : styles.pillInactive]}
                        onPress={() => canWrite && handleToggleServiceStatus(item)}
                      >
                        <Text style={styles.statusPillText}>{isActive ? 'Active' : 'Inactive'}</Text>
                      </TouchableOpacity>
                    </View>

                    {canWrite && (
                      <View style={styles.btnRow}>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: isActive ? '#F59E0B' : '#059669' }]}
                          onPress={() => handleToggleServiceStatus(item)}
                        >
                          <Text style={styles.actionBtnText}>{isActive ? 'Deactivate' : 'Activate'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: '#1E3A8A' }]}
                          onPress={() => handleOpenEditService(item)}
                        >
                          <Edit2 size={14} color="#FFFFFF" />
                          <Text style={styles.actionBtnText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.deleteActionBtn]}
                          onPress={() => handleDeleteService(item.id, item.name)}
                        >
                          <Trash2 size={14} color="#DC2626" />
                          <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              }

              // SERVICES - CERTIFICATE BORROW
              if (opKey === 'services' && activeSubTab === 'borrow') {
                const borrowStatus = String(item.status || 'pending').toLowerCase();
                return (
                  <View key={item.id || idx} style={styles.actionCard}>
                    <View style={styles.actionCardHeader}>
                      <View style={styles.actionCardInfo}>
                        <Text style={styles.actionTitle}>{item.certificate_type || item.service_name || 'Certificate Borrow'}</Text>
                        <Text style={styles.actionSub}>Student: {item.student_name || item.name} ({item.admission_number || item.pin_no || 'N/A'})</Text>
                        <Text style={styles.actionDetail}>Purpose: {item.purpose || item.reason || 'Not specified'}</Text>
                        {item.expected_return_date && (
                          <Text style={[styles.actionDetail, { color: '#4338CA', marginTop: 2 }]}>
                            Return Date: {item.expected_return_date.split('T')[0]}
                          </Text>
                        )}
                      </View>
                      <View
                        style={[
                          styles.statusPill,
                          borrowStatus === 'approved' || borrowStatus === 'issued'
                            ? styles.pillSuccess
                            : borrowStatus === 'returned'
                            ? { backgroundColor: '#E0E7FF' }
                            : borrowStatus === 'rejected'
                            ? styles.pillInactive
                            : styles.pillPending,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusPillText,
                            borrowStatus === 'returned' ? { color: '#3730A3' } : undefined,
                          ]}
                        >
                          {item.status || 'Pending'}
                        </Text>
                      </View>
                    </View>

                    {canWrite && (
                      <View style={styles.btnRow}>
                        {borrowStatus === 'pending' && (
                          <>
                            <TouchableOpacity
                              style={[styles.actionBtn, styles.approveBtn]}
                              onPress={() => handleCertificateBorrowAction(item.id, 'approved')}
                            >
                              <Check size={14} color="#FFFFFF" />
                              <Text style={styles.actionBtnText}>Approve</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.actionBtn, styles.deleteActionBtn]}
                              onPress={() => handleCertificateBorrowAction(item.id, 'rejected')}
                            >
                              <X size={14} color="#DC2626" />
                              <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>Reject</Text>
                            </TouchableOpacity>
                          </>
                        )}
                        {borrowStatus === 'approved' && (
                          <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
                            onPress={() => handleCertificateBorrowAction(item.id, 'issued')}
                          >
                            <Check size={14} color="#FFFFFF" />
                            <Text style={styles.actionBtnText}>Issue Certificate</Text>
                          </TouchableOpacity>
                        )}
                        {borrowStatus === 'issued' && (
                          <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#059669' }]}
                            onPress={() => handleCertificateBorrowAction(item.id, 'returned')}
                          >
                            <Check size={14} color="#FFFFFF" />
                            <Text style={styles.actionBtnText}>Mark Returned</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                );
              }

              // 4. SERVICES - REQUESTS (Student Certificate / Document Applications)
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

                    {canWrite && (
                      <View style={styles.btnRow}>
                        {item.status !== 'completed' && (
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.approveBtn]}
                            onPress={() => handleServiceRequestAction(item.id, 'completed')}
                          >
                            <Check size={14} color="#FFFFFF" />
                            <Text style={styles.actionBtnText}>Complete</Text>
                          </TouchableOpacity>
                        )}
                        {item.status === 'pending' && (
                          <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
                            onPress={() => handleServiceRequestAction(item.id, 'processing')}
                          >
                            <Text style={styles.actionBtnText}>Process</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.deleteActionBtn]}
                          onPress={() => handleDeleteServiceRequest(item.id)}
                        >
                          <Trash2 size={14} color="#DC2626" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              }

              // 5. USER MANAGEMENT
              if (opKey === 'user-management') {
                const isActive = item.is_active !== false;
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
                      <TouchableOpacity
                        style={[styles.statusPill, isActive ? styles.pillSuccess : styles.pillInactive]}
                        onPress={() => canWrite && handleToggleUserStatus(item)}
                      >
                        <Text style={styles.statusPillText}>{isActive ? 'Active' : 'Inactive'}</Text>
                      </TouchableOpacity>
                    </View>

                    {canWrite && (
                      <View style={styles.btnRow}>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: isActive ? '#F59E0B' : '#059669' }]}
                          onPress={() => handleToggleUserStatus(item)}
                        >
                          <Text style={styles.actionBtnText}>{isActive ? 'Deactivate' : 'Activate'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.deleteActionBtn]}
                          onPress={() => handleDeleteUser(item)}
                        >
                          <Trash2 size={14} color="#DC2626" />
                          <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    )}
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
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                          <TouchableOpacity onPress={() => handleOpenEditAnnouncement(item)} hitSlop={10}>
                            <Edit2 size={16} color="#1E3A8A" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteAnnouncement(item.id)} hitSlop={10}>
                            <Trash2 size={16} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                    <Text style={styles.noticeBody}>{item.content}</Text>
                  </View>
                );
              }

              // 7. STUDENT CLUBS
              if (opKey === 'clubs' && activeSubTab === 'management') {
                const isClubActive = item.is_active !== false;
                return (
                  <View key={item.id || idx} style={styles.actionCard}>
                    <View style={styles.actionCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.actionTitle}>{item.name}</Text>
                        <Text style={styles.actionSub}>{item.description || 'Institutional Student Club'}</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.statusPill, isClubActive ? styles.pillSuccess : styles.pillInactive]}
                        onPress={() => canWrite && handleToggleClubStatus(item.id)}
                      >
                        <Text style={styles.statusPillText}>{isClubActive ? 'Active' : 'Inactive'}</Text>
                      </TouchableOpacity>
                    </View>

                    {canWrite && (
                      <View style={styles.btnRow}>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: '#F1F5F9' }]}
                          onPress={() => handleToggleClubStatus(item.id)}
                        >
                          <Text style={[styles.actionBtnText, { color: '#334155' }]}>
                            {isClubActive ? 'Deactivate' : 'Activate'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.deleteActionBtn]}
                          onPress={() => handleDeleteClub(item.id)}
                        >
                          <Trash2 size={14} color="#DC2626" />
                          <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    )}
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
                      {item.admission_number || item.pin_no || item.code || item.role || item.total
                        ? `PIN: ${item.admission_number || item.pin_no || item.code || item.role || item.total}`
                        : 'Details'}
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

          {/* Pagination Navigation Bar */}
          {totalCount > 0 && totalPages > 1 && (
            <View style={styles.paginationCard}>
              <View style={styles.paginationInfoRow}>
                <Text style={styles.paginationInfoText}>
                  Showing{' '}
                  <Text style={{ fontWeight: '700' }}>
                    {Math.min(totalCount, (page - 1) * pageSize + 1)}
                  </Text>{' '}
                  -{' '}
                  <Text style={{ fontWeight: '700' }}>
                    {Math.min(totalCount, page * pageSize)}
                  </Text>{' '}
                  of{' '}
                  <Text style={{ fontWeight: '700' }}>
                    {totalCount.toLocaleString()}
                  </Text>
                </Text>
                <View style={styles.pageBadge}>
                  <Text style={styles.pageBadgeText}>
                    Page {page} of {totalPages}
                  </Text>
                </View>
              </View>

              <View style={styles.paginationBtnRow}>
                <TouchableOpacity
                  style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                  disabled={page <= 1}
                  onPress={() => handlePageChange(1)}
                  activeOpacity={0.7}
                >
                  <ChevronsLeft size={16} color={page <= 1 ? '#94A3B8' : '#1E3A8A'} />
                  <Text style={[styles.pageBtnText, page <= 1 && styles.pageBtnTextDisabled]}>
                    First
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                  disabled={page <= 1}
                  onPress={() => handlePageChange(page - 1)}
                  activeOpacity={0.7}
                >
                  <ChevronLeft size={16} color={page <= 1 ? '#94A3B8' : '#1E3A8A'} />
                  <Text style={[styles.pageBtnText, page <= 1 && styles.pageBtnTextDisabled]}>
                    Prev
                  </Text>
                </TouchableOpacity>

                <View style={styles.currentPageIndicator}>
                  <Text style={styles.currentPageNumber}>{page}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
                  disabled={page >= totalPages}
                  onPress={() => handlePageChange(page + 1)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pageBtnText, page >= totalPages && styles.pageBtnTextDisabled]}>
                    Next
                  </Text>
                  <ChevronRight size={16} color={page >= totalPages ? '#94A3B8' : '#1E3A8A'} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
                  disabled={page >= totalPages}
                  onPress={() => handlePageChange(totalPages)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pageBtnText, page >= totalPages && styles.pageBtnTextDisabled]}>
                    Last
                  </Text>
                  <ChevronsRight size={16} color={page >= totalPages ? '#94A3B8' : '#1E3A8A'} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* DETAIL MODAL WITH EDIT / RESET / DELETE ACTIONS FOR STUDENT */}
      <Modal visible={!!selectedItem} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
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

            {/* If Student record, provide Action Toolbar */}
            {opKey === 'students' && canWrite && selectedItem?.admission_number && (
              <View style={styles.modalActionBar}>
                <TouchableOpacity
                  style={[styles.modalActionBtn, { backgroundColor: '#EEF2FF' }]}
                  onPress={() => handleOpenEditStudent(selectedItem)}
                >
                  <Edit2 size={14} color="#1E3A8A" />
                  <Text style={[styles.modalActionBtnText, { color: '#1E3A8A' }]}>Edit Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalActionBtn, { backgroundColor: '#FEF3C7' }]}
                  onPress={() => {
                    const adm = selectedItem.admission_number || selectedItem.pin_no;
                    setSelectedItem(null);
                    setActionTargetItem(selectedItem);
                    setActionType('update_pin');
                    setFormPin(selectedItem.pin_no || '');
                    setActionModalVisible(true);
                  }}
                >
                  <KeyRound size={14} color="#D97706" />
                  <Text style={[styles.modalActionBtnText, { color: '#D97706' }]}>Update PIN</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalActionBtn, { backgroundColor: '#F1F5F9' }]}
                  onPress={() => handleResetPassword(selectedItem.admission_number || selectedItem.pin_no)}
                >
                  <RotateCcw size={14} color="#475569" />
                  <Text style={[styles.modalActionBtnText, { color: '#475569' }]}>Reset Pass</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalActionBtn, { backgroundColor: '#FEE2E2' }]}
                  onPress={() => handleDeleteStudent(selectedItem)}
                >
                  <Trash2 size={14} color="#DC2626" />
                  <Text style={[styles.modalActionBtnText, { color: '#DC2626' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}

            <ScrollView style={styles.modalBody}>
              {selectedItem &&
                Object.entries(selectedItem)
                  .filter(([k, v]) => typeof v !== 'object' && v !== null && !['id', 'password'].includes(k))
                  .map(([keyName, val]) => (
                    <View key={keyName} style={styles.modalInfoRow}>
                      <Text style={styles.modalLabel}>{keyName.replace(/_/g, ' ').toUpperCase()}</Text>
                      <Text style={styles.modalValue}>{String(val)}</Text>
                    </View>
                  ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* SMS MESSAGE DETAIL MODAL */}
      <Modal visible={smsModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalName}>
                  {selectedSmsLog?.phone_number || selectedSmsLog?.phone || 'SMS Dispatch Details'}
                </Text>
                <Text style={styles.modalPin}>
                  Template: {selectedSmsLog?.template_name || selectedSmsLog?.category || 'General SMS'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSmsModalVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.smsModalContent}>
              <View style={styles.smsModalMetaRow}>
                <Text style={styles.smsModalMetaLabel}>Status:</Text>
                <View
                  style={[
                    styles.statusPill,
                    String(selectedSmsLog?.status || '').toLowerCase() === 'sent' ||
                    String(selectedSmsLog?.status || '').toLowerCase() === 'delivered'
                      ? styles.pillSuccess
                      : String(selectedSmsLog?.status || '').toLowerCase() === 'failed'
                      ? styles.pillInactive
                      : styles.pillPending,
                  ]}
                >
                  <Text style={styles.statusPillText}>{selectedSmsLog?.status || 'Sent'}</Text>
                </View>
              </View>

              <View style={styles.smsModalMetaRow}>
                <Text style={styles.smsModalMetaLabel}>Timestamp:</Text>
                <Text style={styles.smsModalMetaVal}>
                  {selectedSmsLog?.sent_at || selectedSmsLog?.created_at || 'Recorded Today'}
                </Text>
              </View>

              <Text style={styles.smsModalMsgTitle}>Message Content</Text>
              <View style={styles.smsModalMsgBox}>
                <Text style={styles.smsModalMsgText}>
                  {selectedSmsLog?.message || selectedSmsLog?.content || 'No content recorded'}
                </Text>
              </View>

              {String(selectedSmsLog?.status || '').toLowerCase() === 'failed' && canWrite && (
                <TouchableOpacity
                  style={[styles.submitAttBtn, { backgroundColor: '#DC2626', marginTop: 16 }]}
                  onPress={() => {
                    setSmsModalVisible(false);
                    handleRetrySmsGlobal(selectedSmsLog?.id);
                  }}
                >
                  <RotateCcw size={16} color="#FFFFFF" />
                  <Text style={styles.submitAttBtnText}>Retry SMS Dispatch</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ACTION DIALOG MODAL (Create Student, Edit Student, Create User, Announcements, etc.) */}
      <Modal visible={actionModalVisible} transparent animationType="fade">
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogCard}>
            {/* 1. REJECT PROMPT */}
            {actionType === 'reject_prompt' ? (
              <View>
                <Text style={styles.dialogTitle}>Reject Submission</Text>
                <Text style={styles.dialogSub}>Specify reason for applicant rejection</Text>
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
            ) : actionType === 'create_student' || actionType === 'edit_student' ? (
              /* 2. CREATE / EDIT STUDENT */
              <View>
                <Text style={styles.dialogTitle}>
                  {actionType === 'create_student' ? 'Add New Student' : 'Edit Student Profile'}
                </Text>
                <Text style={styles.dialogSub}>
                  {actionType === 'create_student'
                    ? 'Enter student enrollment details'
                    : `Editing ${formAdmissionNo}`}
                </Text>

                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Student Full Name *"
                  value={formName}
                  onChangeText={setFormName}
                />
                {actionType === 'create_student' && (
                  <TextInput
                    style={styles.dialogSingleInput}
                    placeholder="Admission Number / PIN *"
                    value={formAdmissionNo}
                    onChangeText={setFormAdmissionNo}
                    autoCapitalize="characters"
                  />
                )}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    style={[styles.dialogSingleInput, { flex: 1 }]}
                    placeholder="Phone Number"
                    value={formPhone}
                    onChangeText={setFormPhone}
                    keyboardType="phone-pad"
                  />
                  <TextInput
                    style={[styles.dialogSingleInput, { flex: 1 }]}
                    placeholder="Section (e.g. A)"
                    value={formSection}
                    onChangeText={setFormSection}
                    autoCapitalize="characters"
                  />
                </View>
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Email Address"
                  value={formEmail}
                  onChangeText={setFormEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <View style={styles.dialogBtnRow}>
                  <TouchableOpacity
                    style={styles.dialogCancelBtn}
                    onPress={() => setActionModalVisible(false)}
                  >
                    <Text style={styles.dialogCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dialogConfirmBtn} onPress={handleSaveForm}>
                    <Text style={styles.dialogConfirmText}>Save Student</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : actionType === 'update_pin' ? (
              /* 3. UPDATE PIN */
              <View>
                <Text style={styles.dialogTitle}>Update PIN Number</Text>
                <Text style={styles.dialogSub}>Assign new roll call PIN to student</Text>
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Enter New PIN"
                  value={formPin}
                  onChangeText={setFormPin}
                  autoCapitalize="characters"
                />
                <View style={styles.dialogBtnRow}>
                  <TouchableOpacity
                    style={styles.dialogCancelBtn}
                    onPress={() => setActionModalVisible(false)}
                  >
                    <Text style={styles.dialogCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dialogConfirmBtn} onPress={handleSaveForm}>
                    <Text style={styles.dialogConfirmText}>Update PIN</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : actionType === 'create_user' ? (
              /* 4. CREATE USER */
              <View>
                <Text style={styles.dialogTitle}>Add Staff User</Text>
                <Text style={styles.dialogSub}>Grant institutional access to staff member</Text>
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Username *"
                  value={formUsername}
                  onChangeText={setFormUsername}
                  autoCapitalize="none"
                />
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Full Name"
                  value={formName}
                  onChangeText={setFormName}
                />
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Email"
                  value={formEmail}
                  onChangeText={setFormEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Temporary Password *"
                  value={formPassword}
                  onChangeText={setFormPassword}
                  secureTextEntry
                />
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Role (e.g. staff, faculty, college_ao)"
                  value={formRole}
                  onChangeText={setFormRole}
                  autoCapitalize="none"
                />
                <View style={styles.dialogBtnRow}>
                  <TouchableOpacity
                    style={styles.dialogCancelBtn}
                    onPress={() => setActionModalVisible(false)}
                  >
                    <Text style={styles.dialogCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dialogConfirmBtn} onPress={handleSaveForm}>
                    <Text style={styles.dialogConfirmText}>Create User</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : actionType === 'create_announcement' || actionType === 'edit_announcement' ? (
              /* 5. CREATE / EDIT ANNOUNCEMENT */
              <View>
                <Text style={styles.dialogTitle}>
                  {actionType === 'create_announcement' ? 'New Announcement' : 'Edit Announcement'}
                </Text>
                <Text style={styles.dialogSub}>Broadcast a notice to students and staff</Text>
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Announcement Title *"
                  value={formTitle}
                  onChangeText={setFormTitle}
                />
                <TextInput
                  style={[styles.dialogInput, { height: 90 }]}
                  placeholder="Content / Notice body... *"
                  value={formContent}
                  onChangeText={setFormContent}
                  multiline
                />
                <View style={styles.dialogBtnRow}>
                  <TouchableOpacity
                    style={styles.dialogCancelBtn}
                    onPress={() => setActionModalVisible(false)}
                  >
                    <Text style={styles.dialogCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dialogConfirmBtn} onPress={handleSaveForm}>
                    <Text style={styles.dialogConfirmText}>Broadcast</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : actionType === 'create_club' ? (
              /* 6. CREATE CLUB */
              <View>
                <Text style={styles.dialogTitle}>New Student Club</Text>
                <Text style={styles.dialogSub}>Register a new campus organization</Text>
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Club Name *"
                  value={formTitle}
                  onChangeText={setFormTitle}
                />
                <TextInput
                  style={[styles.dialogInput, { height: 70 }]}
                  placeholder="Club Purpose / Description..."
                  value={formContent}
                  onChangeText={setFormContent}
                  multiline
                />
                <View style={styles.dialogBtnRow}>
                  <TouchableOpacity
                    style={styles.dialogCancelBtn}
                    onPress={() => setActionModalVisible(false)}
                  >
                    <Text style={styles.dialogCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dialogConfirmBtn} onPress={handleSaveForm}>
                    <Text style={styles.dialogConfirmText}>Register Club</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : actionType === 'create_seminar_hall' ? (
              /* 7. BOOK SEMINAR HALL */
              <View>
                <Text style={styles.dialogTitle}>Book Seminar Hall</Text>
                <Text style={styles.dialogSub}>Reserve venue for academic seminar or club event</Text>
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Seminar Hall (e.g. Main Auditorium)"
                  value={formHallName}
                  onChangeText={setFormHallName}
                />
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Date (YYYY-MM-DD)"
                  value={formBookingDate}
                  onChangeText={setFormBookingDate}
                />
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Purpose / Event Title"
                  value={formPurpose}
                  onChangeText={setFormPurpose}
                />
                <View style={styles.dialogBtnRow}>
                  <TouchableOpacity
                    style={styles.dialogCancelBtn}
                    onPress={() => setActionModalVisible(false)}
                  >
                    <Text style={styles.dialogCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dialogConfirmBtn} onPress={handleSaveForm}>
                    <Text style={styles.dialogConfirmText}>Submit Booking</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : actionType === 'create_hall_item' ? (
              /* 8. CREATE CAMPUS SEMINAR HALL */
              <View>
                <Text style={styles.dialogTitle}>Add Seminar Hall</Text>
                <Text style={styles.dialogSub}>Register a new auditorium or seminar venue</Text>
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Hall Name * (e.g. Visvesvaraya Hall)"
                  value={formHallName}
                  onChangeText={setFormHallName}
                />
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Location (e.g. Block A, 2nd Floor)"
                  value={formHallLocation}
                  onChangeText={setFormHallLocation}
                />
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Seating Capacity (e.g. 250)"
                  value={formHallCapacity}
                  onChangeText={setFormHallCapacity}
                  keyboardType="numeric"
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    style={[styles.dialogSingleInput, { flex: 1 }]}
                    placeholder="Open (08:00)"
                    value={formHallOpenTime}
                    onChangeText={setFormHallOpenTime}
                  />
                  <TextInput
                    style={[styles.dialogSingleInput, { flex: 1 }]}
                    placeholder="Close (20:00)"
                    value={formHallCloseTime}
                    onChangeText={setFormHallCloseTime}
                  />
                </View>
                <TextInput
                  style={[styles.dialogInput, { height: 60 }]}
                  placeholder="Description / Facilities..."
                  value={formContent}
                  onChangeText={setFormContent}
                  multiline
                />
                <View style={styles.dialogBtnRow}>
                  <TouchableOpacity
                    style={styles.dialogCancelBtn}
                    onPress={() => setActionModalVisible(false)}
                  >
                    <Text style={styles.dialogCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dialogConfirmBtn} onPress={handleSaveForm}>
                    <Text style={styles.dialogConfirmText}>Save Hall</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : actionType === 'create_service' || actionType === 'edit_service' ? (
              /* 9. CREATE / EDIT SERVICE CONFIGURATION */
              <View>
                <Text style={styles.dialogTitle}>
                  {actionType === 'create_service' ? 'New Service' : 'Edit Service'}
                </Text>
                <Text style={styles.dialogSub}>
                  Configure student certificate or document service
                </Text>
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Service Name * (e.g. Study Certificate)"
                  value={formTitle}
                  onChangeText={setFormTitle}
                />
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Price (₹) (e.g. 50, 0 for free)"
                  value={formPrice}
                  onChangeText={setFormPrice}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.dialogInput, { height: 75 }]}
                  placeholder="Description / Requirements..."
                  value={formContent}
                  onChangeText={setFormContent}
                  multiline
                />
                <View style={styles.dialogBtnRow}>
                  <TouchableOpacity
                    style={styles.dialogCancelBtn}
                    onPress={() => setActionModalVisible(false)}
                  >
                    <Text style={styles.dialogCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dialogConfirmBtn} onPress={handleSaveForm}>
                    <Text style={styles.dialogConfirmText}>
                      {actionType === 'create_service' ? 'Create Service' : 'Update Service'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* SMS MESSAGE DETAIL MODAL */}
      <Modal visible={smsModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalName}>
                  {selectedSmsLog?.phone_number || selectedSmsLog?.phone || 'SMS Dispatch Details'}
                </Text>
                <Text style={styles.modalPin}>
                  Template: {selectedSmsLog?.template_name || selectedSmsLog?.category || 'General SMS'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSmsModalVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.smsModalContent}>
              <View style={styles.smsModalMetaRow}>
                <Text style={styles.smsModalMetaLabel}>Status:</Text>
                <View
                  style={[
                    styles.statusPill,
                    String(selectedSmsLog?.status || '').toLowerCase() === 'sent' ||
                    String(selectedSmsLog?.status || '').toLowerCase() === 'delivered'
                      ? styles.pillSuccess
                      : String(selectedSmsLog?.status || '').toLowerCase() === 'failed'
                      ? styles.pillInactive
                      : styles.pillPending,
                  ]}
                >
                  <Text style={styles.statusPillText}>{selectedSmsLog?.status || 'Sent'}</Text>
                </View>
              </View>

              <View style={styles.smsModalMetaRow}>
                <Text style={styles.smsModalMetaLabel}>Timestamp:</Text>
                <Text style={styles.smsModalMetaVal}>
                  {selectedSmsLog?.sent_at || selectedSmsLog?.created_at || 'Recorded Today'}
                </Text>
              </View>

              <Text style={styles.smsModalMsgTitle}>Message Content</Text>
              <View style={styles.smsModalMsgBox}>
                <Text style={styles.smsModalMsgText}>
                  {selectedSmsLog?.message || selectedSmsLog?.content || 'No content recorded'}
                </Text>
              </View>

              {String(selectedSmsLog?.status || '').toLowerCase() === 'failed' && canWrite && (
                <TouchableOpacity
                  style={[styles.submitAttBtn, { backgroundColor: '#DC2626', marginTop: 16 }]}
                  onPress={() => {
                    setSmsModalVisible(false);
                    handleRetrySmsGlobal(selectedSmsLog?.id);
                  }}
                >
                  <RotateCcw size={16} color="#FFFFFF" />
                  <Text style={styles.submitAttBtnText}>Retry SMS Dispatch</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
      {/* FILTER BOTTOM SHEET MODAL (Matching Frontend Filters) */}
      <Modal visible={filterModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalName}>Filter Records</Text>
                <Text style={styles.modalPin}>
                  {activeFilterCount > 0
                    ? `${activeFilterCount} filter(s) active`
                    : 'Refine search results'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterModalBody} showsVerticalScrollIndicator={false}>
              {/* ACADEMIC FILTERS (Students, Attendance & Reports) */}
              {(opKey === 'students' || opKey === 'attendance' || opKey === 'reports') && (
                <>
                  {/* Academic Year Filter */}
                  <Text style={styles.filterGroupTitle}>Academic Year</Text>
                  <View style={styles.filterChipRow}>
                    {['', '1', '2', '3', '4'].map((yr) => (
                      <TouchableOpacity
                        key={yr}
                        style={[
                          styles.filterSelectChip,
                          selectedYear === yr && styles.filterSelectChipActive,
                        ]}
                        onPress={() => setSelectedYear(yr)}
                      >
                        <Text
                          style={[
                            styles.filterSelectChipText,
                            selectedYear === yr && styles.filterSelectChipTextActive,
                          ]}
                        >
                          {yr
                            ? `${yr}${
                                yr === '1'
                                  ? 'st'
                                  : yr === '2'
                                  ? 'nd'
                                  : yr === '3'
                                  ? 'rd'
                                  : 'th'
                              } Year`
                            : 'All Years'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Semester Filter */}
                  <Text style={styles.filterGroupTitle}>Semester</Text>
                  <View style={styles.filterChipRow}>
                    {['', '1', '2'].map((sem) => (
                      <TouchableOpacity
                        key={sem}
                        style={[
                          styles.filterSelectChip,
                          selectedSemester === sem && styles.filterSelectChipActive,
                        ]}
                        onPress={() => setSelectedSemester(sem)}
                      >
                        <Text
                          style={[
                            styles.filterSelectChipText,
                            selectedSemester === sem && styles.filterSelectChipTextActive,
                          ]}
                        >
                          {sem ? `Sem ${sem}` : 'All Semesters'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Section Filter */}
                  <Text style={styles.filterGroupTitle}>Section</Text>
                  <View style={styles.filterChipRow}>
                    {['', 'A', 'B', 'C', 'D'].map((sec) => (
                      <TouchableOpacity
                        key={sec}
                        style={[
                          styles.filterSelectChip,
                          selectedSection === sec && styles.filterSelectChipActive,
                        ]}
                        onPress={() => setSelectedSection(sec)}
                      >
                        <Text
                          style={[
                            styles.filterSelectChipText,
                            selectedSection === sec && styles.filterSelectChipTextActive,
                          ]}
                        >
                          {sec ? `Sec ${sec}` : 'All Sections'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* PIN Number Status Filter */}
                  <Text style={styles.filterGroupTitle}>PIN / Roll Number</Text>
                  <View style={styles.filterChipRow}>
                    {[
                      { label: 'All', value: '' },
                      { label: 'Assigned', value: 'assigned' },
                      { label: 'Unassigned', value: 'unassigned' },
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.value}
                        style={[
                          styles.filterSelectChip,
                          selectedPinStatus === item.value && styles.filterSelectChipActive,
                        ]}
                        onPress={() => setSelectedPinStatus(item.value)}
                      >
                        <Text
                          style={[
                            styles.filterSelectChipText,
                            selectedPinStatus === item.value && styles.filterSelectChipTextActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Gender Filter */}
                  <Text style={styles.filterGroupTitle}>Gender</Text>
                  <View style={styles.filterChipRow}>
                    {[
                      { label: 'All', value: '' },
                      { label: 'Male', value: 'Male' },
                      { label: 'Female', value: 'Female' },
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.value}
                        style={[
                          styles.filterSelectChip,
                          selectedGender === item.value && styles.filterSelectChipActive,
                        ]}
                        onPress={() => setSelectedGender(item.value)}
                      >
                        <Text
                          style={[
                            styles.filterSelectChipText,
                            selectedGender === item.value && styles.filterSelectChipTextActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Batch Filter */}
                  {filterOptions.batches.length > 0 && (
                    <>
                      <Text style={styles.filterGroupTitle}>Batch</Text>
                      <View style={styles.filterChipRow}>
                        {['', ...filterOptions.batches.slice(0, 6)].map((batch) => (
                          <TouchableOpacity
                            key={batch}
                            style={[
                              styles.filterSelectChip,
                              selectedBatch === batch && styles.filterSelectChipActive,
                            ]}
                            onPress={() => setSelectedBatch(batch)}
                          >
                            <Text
                              style={[
                                styles.filterSelectChipText,
                                selectedBatch === batch && styles.filterSelectChipTextActive,
                              ]}
                            >
                              {batch || 'All Batches'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}

                  {/* Course Filter */}
                  {filterOptions.courses.length > 0 && (
                    <>
                      <Text style={styles.filterGroupTitle}>Course</Text>
                      <View style={styles.filterChipRow}>
                        {['', ...filterOptions.courses.slice(0, 6)].map((crs) => (
                          <TouchableOpacity
                            key={crs}
                            style={[
                              styles.filterSelectChip,
                              selectedCourse === crs && styles.filterSelectChipActive,
                            ]}
                            onPress={() => setSelectedCourse(crs)}
                          >
                            <Text
                              style={[
                                styles.filterSelectChipText,
                                selectedCourse === crs && styles.filterSelectChipTextActive,
                              ]}
                            >
                              {crs || 'All Courses'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}
                </>
              )}

              {/* STATUS FILTER */}
              {(activeSubTab === 'self_registration' ||
                activeSubTab === 'profile_requests' ||
                opKey === 'seminar-halls' ||
                opKey === 'services' ||
                opKey === 'user-management') && (
                <>
                  <Text style={styles.filterGroupTitle}>Record Status</Text>
                  <View style={styles.filterChipRow}>
                    {(opKey === 'services' && activeSubTab === 'config'
                      ? [
                          { label: 'All Statuses', value: '' },
                          { label: 'Active', value: 'active' },
                          { label: 'Inactive', value: 'inactive' },
                        ]
                      : opKey === 'services' && activeSubTab === 'borrow'
                      ? [
                          { label: 'All Statuses', value: '' },
                          { label: 'Pending', value: 'pending' },
                          { label: 'Approved', value: 'approved' },
                          { label: 'Issued', value: 'issued' },
                          { label: 'Returned', value: 'returned' },
                          { label: 'Rejected', value: 'rejected' },
                        ]
                      : [
                          { label: 'All Statuses', value: '' },
                          { label: 'Pending', value: 'pending' },
                          { label: 'Approved', value: 'approved' },
                          { label: 'Rejected', value: 'rejected' },
                          ...(opKey === 'services'
                            ? [
                                { label: 'Processing', value: 'processing' },
                                { label: 'Completed', value: 'completed' },
                              ]
                            : []),
                          ...(opKey === 'user-management'
                            ? [
                                { label: 'Active', value: 'active' },
                                { label: 'Inactive', value: 'inactive' },
                              ]
                            : []),
                        ]
                    ).map((item) => (
                      <TouchableOpacity
                        key={item.value}
                        style={[
                          styles.filterSelectChip,
                          selectedStatus === item.value && styles.filterSelectChipActive,
                        ]}
                        onPress={() => setSelectedStatus(item.value)}
                      >
                        <Text
                          style={[
                            styles.filterSelectChipText,
                            selectedStatus === item.value && styles.filterSelectChipTextActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* USER ROLE FILTER */}
              {opKey === 'user-management' && (
                <>
                  <Text style={styles.filterGroupTitle}>Staff Role</Text>
                  <View style={styles.filterChipRow}>
                    {[
                      { label: 'All Roles', value: '' },
                      { label: 'Super Admin', value: 'super_admin' },
                      { label: 'Principal', value: 'college_principal' },
                      { label: 'AO', value: 'college_ao' },
                      { label: 'Branch HOD', value: 'branch_hod' },
                      { label: 'Faculty', value: 'faculty' },
                      { label: 'Cashier', value: 'cashier' },
                      { label: 'Staff', value: 'staff' },
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.value}
                        style={[
                          styles.filterSelectChip,
                          selectedRole === item.value && styles.filterSelectChipActive,
                        ]}
                        onPress={() => setSelectedRole(item.value)}
                      >
                        <Text
                          style={[
                            styles.filterSelectChipText,
                            selectedRole === item.value && styles.filterSelectChipTextActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* ANNOUNCEMENT PRIORITY FILTER */}
              {opKey === 'announcements' && (
                <>
                  <Text style={styles.filterGroupTitle}>Notice Priority</Text>
                  <View style={styles.filterChipRow}>
                    {[
                      { label: 'All Priorities', value: '' },
                      { label: 'Urgent', value: 'urgent' },
                      { label: 'High', value: 'high' },
                      { label: 'Medium', value: 'medium' },
                      { label: 'Low', value: 'low' },
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.value}
                        style={[
                          styles.filterSelectChip,
                          selectedPriority === item.value && styles.filterSelectChipActive,
                        ]}
                        onPress={() => setSelectedPriority(item.value)}
                      >
                        <Text
                          style={[
                            styles.filterSelectChipText,
                            selectedPriority === item.value && styles.filterSelectChipTextActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>

            {/* Filter Action Bottom Bar */}
            <View style={styles.filterModalFooter}>
              <TouchableOpacity
                style={styles.filterResetBtn}
                onPress={() => {
                  handleClearAllFilters();
                  setFilterModalVisible(false);
                }}
              >
                <Text style={styles.filterResetBtnText}>Reset All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.filterApplyBtn}
                onPress={() => {
                  setFilterModalVisible(false);
                  setPage(1);
                  loadData(searchQuery, 1);
                }}
              >
                <Text style={styles.filterApplyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SMS MESSAGE DETAIL MODAL */}
      <Modal visible={smsModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalName}>
                  {selectedSmsLog?.phone_number || selectedSmsLog?.phone || 'SMS Dispatch Details'}
                </Text>
                <Text style={styles.modalPin}>
                  Template: {selectedSmsLog?.template_name || selectedSmsLog?.category || 'General SMS'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSmsModalVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.smsModalContent}>
              <View style={styles.smsModalMetaRow}>
                <Text style={styles.smsModalMetaLabel}>Status:</Text>
                <View
                  style={[
                    styles.statusPill,
                    String(selectedSmsLog?.status || '').toLowerCase() === 'sent' ||
                    String(selectedSmsLog?.status || '').toLowerCase() === 'delivered'
                      ? styles.pillSuccess
                      : String(selectedSmsLog?.status || '').toLowerCase() === 'failed'
                      ? styles.pillInactive
                      : styles.pillPending,
                  ]}
                >
                  <Text style={styles.statusPillText}>{selectedSmsLog?.status || 'Sent'}</Text>
                </View>
              </View>

              <View style={styles.smsModalMetaRow}>
                <Text style={styles.smsModalMetaLabel}>Timestamp:</Text>
                <Text style={styles.smsModalMetaVal}>
                  {selectedSmsLog?.sent_at || selectedSmsLog?.created_at || 'Recorded Today'}
                </Text>
              </View>

              <Text style={styles.smsModalMsgTitle}>Message Content</Text>
              <View style={styles.smsModalMsgBox}>
                <Text style={styles.smsModalMsgText}>
                  {selectedSmsLog?.message || selectedSmsLog?.content || 'No content recorded'}
                </Text>
              </View>

              {String(selectedSmsLog?.status || '').toLowerCase() === 'failed' && canWrite && (
                <TouchableOpacity
                  style={[styles.submitAttBtn, { backgroundColor: '#DC2626', marginTop: 16 }]}
                  onPress={() => {
                    setSmsModalVisible(false);
                    handleRetrySmsGlobal(selectedSmsLog?.id);
                  }}
                >
                  <RotateCcw size={16} color="#FFFFFF" />
                  <Text style={styles.submitAttBtnText}>Retry SMS Dispatch</Text>
                </TouchableOpacity>
              )}
            </View>
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
    gap: 8,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
  },
  topBarTitleCol: {
    flex: 1,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  topBarSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  addHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'center',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  deleteActionBtn: {
    flex: 0,
    paddingHorizontal: 12,
    backgroundColor: '#FEE2E2',
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
    maxHeight: '85%',
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
  modalActionBar: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  modalActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
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
    marginTop: 4,
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
  countSummaryBar: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  countSummaryText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  paginationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  paginationInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  paginationInfoText: {
    fontSize: 12,
    color: '#64748B',
  },
  pageBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pageBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  paginationBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 3,
  },
  pageBtnDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.6,
  },
  pageBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  pageBtnTextDisabled: {
    color: '#94A3B8',
  },
  currentPageIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentPageNumber: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  filterTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    gap: 6,
    marginLeft: 8,
  },
  filterTriggerBtnActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  filterTriggerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  filterTriggerTextActive: {
    color: '#FFFFFF',
  },
  activeFiltersContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 8,
  },
  activeFiltersScroll: {
    paddingHorizontal: 16,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  activeFilterPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  clearAllFiltersBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  clearAllFiltersText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  filterModalBody: {
    paddingVertical: 14,
  },
  filterGroupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 8,
  },
  filterChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  filterSelectChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterSelectChipActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  filterSelectChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterSelectChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 10,
  },
  filterModalFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 10,
  },
  filterClearBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  filterResetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  filterClearBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  filterResetBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  filterApplyBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
  },
  filterApplyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // ATTENDANCE STYLES
  attSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  attSummaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  attSummaryDate: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  attSummaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  attRateBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  attRateBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803D',
  },
  attSummaryRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  attSummaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  attSummaryLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 2,
  },
  attSummaryVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  attToolbar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  attQuickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  attQuickBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // SMS STYLES
  smsStatRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  smsStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  smsStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  smsStatLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  smsStatVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  smsRetryBar: {
    marginBottom: 12,
  },
  smsRetryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  smsRetryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  smsLogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  smsLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  smsLogPhone: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  smsLogSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  smsLogMsg: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
  },
  smsSingleRetryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    marginTop: 8,
  },
  smsSingleRetryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  smsModalContent: {
    paddingTop: 14,
  },
  smsModalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  smsModalMetaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  smsModalMetaVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  smsModalMsgTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 6,
  },
  smsModalMsgBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
  },
  smsModalMsgText: {
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 18,
  },
  // REPORTS STYLES
  reportAbstractCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reportHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  reportSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  reportTotalBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reportTotalText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  reportMetricsGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  reportMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  reportMetricLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginBottom: 2,
  },
  reportMetricVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  // SERVICES CONFIG STYLES
  servicePriceBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  servicePriceText: {
    color: '#065F46',
    fontSize: 11,
    fontWeight: '800',
  },
  serviceDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 17,
  },
  adminFieldsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  adminFieldTag: {
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  adminFieldTagText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
});
