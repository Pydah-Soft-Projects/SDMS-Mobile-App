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
  Switch,
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
  Square,
  Layers,
  Calendar,
  Tags,
  Bell,
  Layout,
  QrCode,
  Lock,
  Unlock,
  MapPin,
  Landmark,
  TrendingUp,
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
    | 'create_college'
    | 'create_course'
    | 'create_branch'
    | 'create_holiday'
    | 'create_quota'
    | 'create_caste_category'
    | 'create_caste'
    | 'create_campus'
    | 'set_semester_dates'
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

  // Settings specific Form & Data State
  const [formCode, setFormCode] = useState('');
  const [formDegreeLevel, setFormDegreeLevel] = useState('DEGREE');
  const [formTotalYears, setFormTotalYears] = useState('4');
  const [formSemsPerYear, setFormSemsPerYear] = useState('2');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formSemesterNo, setFormSemesterNo] = useState('1');

  const [settingsColleges, setSettingsColleges] = useState<any[]>([]);
  const [settingsBatches, setSettingsBatches] = useState<any[]>([]);
  const [settingsCourses, setSettingsCourses] = useState<any[]>([]);
  const [settingsBranches, setSettingsBranches] = useState<any[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState<any>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<any>(null);
  const [selectedCasteCategoryId, setSelectedCasteCategoryId] = useState<any>(null);
  const [newBatchInput, setNewBatchInput] = useState('');
  const [studentLayout, setStudentLayout] = useState<any[]>([]);
  const [qrRole, setQrRole] = useState<'attender' | 'faculty' | 'cashier' | 'principal' | 'admin'>('attender');
  const [qrRoleConfig, setQrRoleConfig] = useState<any>({});
  const [frozenBatches, setFrozenBatches] = useState<string[]>([]);
  const [sourceCollegeId, setSourceCollegeId] = useState<any>(null);
  const [targetCollegeId, setTargetCollegeId] = useState<any>(null);
  const [selectedTransferStudentIds, setSelectedTransferStudentIds] = useState<(number | string)[]>([]);

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
          if (activeSubTab === 'calendar') {
            const holidays = await staffService.getHolidays();
            rawList = holidays;
          } else if (activeSubTab === 'academic-calendar') {
            const sems = await staffService.getSemesters();
            rawList = sems;
          } else if (activeSubTab === 'forms') {
            const forms = await staffService.getRegistrationForms();
            rawList = forms;
          } else if (activeSubTab === 'quotas') {
            const quotas = await staffService.getQuotas();
            rawList = quotas;
          } else if (activeSubTab === 'caste-categories') {
            const categories = await staffService.getCasteCategories();
            rawList = categories;
          } else if (activeSubTab === 'notifications') {
            const notifs = await staffService.getNotificationSettings();
            rawList = Array.isArray(notifs) ? notifs : (notifs?.settings || []);
          } else if (activeSubTab === 'college-transfer') {
            const colList = await staffService.getColleges();
            setSettingsColleges(colList);
            const curSource = sourceCollegeId || (colList[0]?.id);
            if (!sourceCollegeId && colList.length > 0) {
              setSourceCollegeId(colList[0].id);
            }
            if (!targetCollegeId && colList.length > 1) {
              setTargetCollegeId(colList[1].id);
            }
            if (curSource) {
              const stuRes = await staffService.getPaginatedStudents({
                college: curSource,
                limit: 50,
              });
              rawList = stuRes.students || [];
            } else {
              rawList = [];
            }
          } else if (activeSubTab === 'student-layout') {
            const layout = await staffService.getStudentLayout();
            const layoutArr = Array.isArray(layout) && layout.length > 0 ? layout : [
              { id: 'dashboard', label: 'Dashboard', enabled: true },
              { id: 'attendance', label: 'Attendance', enabled: true },
              { id: 'fees', label: 'Fee Receipts', enabled: true },
              { id: 'announcements', label: 'Announcements & Notices', enabled: true },
              { id: 'services', label: 'Services & Certificates', enabled: true },
              { id: 'seminar-halls', label: 'Seminar Halls', enabled: true },
              { id: 'clubs', label: 'Student Clubs', enabled: true },
              { id: 'profile', label: 'Profile Update', enabled: true },
            ];
            setStudentLayout(layoutArr);
            rawList = layoutArr;
          } else if (activeSubTab === 'qr-config') {
            const qr = await staffService.getQrConfig();
            setQrRoleConfig(qr);
            rawList = [
              { key: 'photo', label: 'Student Photo', defaultEnabled: true },
              { key: 'pin_no', label: 'PIN / Roll Number', defaultEnabled: true },
              { key: 'student_name', label: 'Student Full Name', defaultEnabled: true },
              { key: 'father_name', label: 'Father Name', defaultEnabled: true },
              { key: 'college', label: 'College Name', defaultEnabled: true },
              { key: 'course', label: 'Program / Course', defaultEnabled: true },
              { key: 'branch', label: 'Branch / Specialization', defaultEnabled: true },
              { key: 'current_year', label: 'Current Year', defaultEnabled: true },
              { key: 'fee_cleared', label: 'Fee Clearance Status', defaultEnabled: false },
            ];
          } else if (activeSubTab === 'rtf-amount') {
            const rtf = await staffService.getRtfAmountConfig();
            rawList = rtf?.entries || [];
          } else if (activeSubTab === 'freeze-database') {
            const frozen = await staffService.getFrozenBatches();
            const allBatches = await staffService.getBatches();
            const frozenList = Array.isArray(frozen) ? frozen : [];
            setFrozenBatches(frozenList);
            rawList = allBatches.map((b: any) => {
              const bName = typeof b === 'string' ? b : (b.academic_year || b.batch || String(b));
              return { batch: bName, is_frozen: frozenList.includes(bName) };
            });
          } else if (activeSubTab === 'campus') {
            const campuses = await staffService.getCampuses();
            rawList = campuses;
          } else {
            // 'courses' (Colleges & Programs)
            const [allColleges, allBatches, allCourses] = await Promise.all([
              staffService.getColleges(),
              staffService.getBatches(),
              staffService.getCourses(),
            ]);
            setSettingsColleges(allColleges);
            setSettingsBatches(allBatches);
            setSettingsCourses(allCourses);
            const activeColId = selectedCollegeId || (allColleges[0]?.id);
            if (!selectedCollegeId && allColleges.length > 0) {
              setSelectedCollegeId(allColleges[0].id);
            }
            const activeCourses = allCourses.filter((c: any) => !activeColId || String(c.college_id) === String(activeColId));
            const activeCourseId = selectedCourseId || (activeCourses[0]?.id);
            if (!selectedCourseId && activeCourses.length > 0) {
              setSelectedCourseId(activeCourses[0].id);
            }
            if (activeCourseId) {
              try {
                const branches = await staffService.getBranches(activeCourseId);
                setSettingsBranches(branches);
              } catch (err) {
                setSettingsBranches([]);
              }
            }
            rawList = allColleges;
          }
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
    } else if (opKey === 'courses') {
      if (activeSubTab === 'calendar') {
        setActionType('create_holiday');
        setFormTitle('');
        setFormBookingDate(new Date().toISOString().split('T')[0]);
        setFormContent('');
      } else if (activeSubTab === 'quotas') {
        setActionType('create_quota');
        setFormTitle('');
        setFormCode('');
      } else if (activeSubTab === 'caste-categories') {
        setActionType('create_caste_category');
        setFormTitle('');
      } else if (activeSubTab === 'campus') {
        setActionType('create_campus');
        setFormTitle('');
        setFormHallLocation('');
        setFormContent('');
      } else {
        // 'courses' (Colleges & Programs)
        setActionType('create_college');
        setFormName('');
        setFormCode('');
        setFormPhone('');
        setFormEmail('');
      }
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
      } else if (actionType === 'create_college') {
        if (!formName.trim()) {
          Alert.alert('Required', 'College Name is required');
          return;
        }
        await staffService.createCollege({
          name: formName.trim(),
          code: formCode.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim(),
        });
        Alert.alert('Success', `College "${formName}" created`);
      } else if (actionType === 'create_course') {
        if (!formName.trim()) {
          Alert.alert('Required', 'Program / Course Name is required');
          return;
        }
        await staffService.createCourse({
          name: formName.trim(),
          code: formCode.trim(),
          college_id: selectedCollegeId || 1,
          degree_level: formDegreeLevel || 'DEGREE',
          total_years: Number(formTotalYears) || 4,
          semesters_per_year: Number(formSemsPerYear) || 2,
        });
        Alert.alert('Success', `Program "${formName}" created`);
      } else if (actionType === 'create_branch') {
        if (!formName.trim()) {
          Alert.alert('Required', 'Branch Name is required');
          return;
        }
        await staffService.createBranch(selectedCourseId || 1, {
          name: formName.trim(),
          code: formCode.trim() || formName.trim().toUpperCase(),
        });
        Alert.alert('Success', `Branch "${formName}" created`);
      } else if (actionType === 'create_holiday') {
        if (!formTitle.trim() || !formBookingDate.trim()) {
          Alert.alert('Required', 'Holiday Name and Date are required');
          return;
        }
        await staffService.createHoliday({
          holiday_name: formTitle.trim(),
          holiday_date: formBookingDate.trim(),
          description: formContent.trim(),
        });
        Alert.alert('Success', `Holiday "${formTitle}" recorded`);
      } else if (actionType === 'create_quota') {
        if (!formTitle.trim() || !formCode.trim()) {
          Alert.alert('Required', 'Quota Name and Code are required');
          return;
        }
        await staffService.createQuota({
          name: formTitle.trim(),
          code: formCode.trim(),
          is_active: true,
        });
        Alert.alert('Success', `Quota "${formTitle}" created`);
      } else if (actionType === 'create_caste_category') {
        if (!formTitle.trim()) {
          Alert.alert('Required', 'Category Name is required');
          return;
        }
        await staffService.createCasteCategory(formTitle.trim());
        Alert.alert('Success', `Category "${formTitle}" created`);
      } else if (actionType === 'create_caste') {
        if (!formTitle.trim()) {
          Alert.alert('Required', 'Caste Name is required');
          return;
        }
        await staffService.createCaste(actionTargetItem?.id, formTitle.trim());
        Alert.alert('Success', `Caste "${formTitle}" created`);
      } else if (actionType === 'create_campus') {
        if (!formTitle.trim()) {
          Alert.alert('Required', 'Campus Name is required');
          return;
        }
        await staffService.createCampus({
          name: formTitle.trim(),
          location: formHallLocation.trim(),
          description: formContent.trim(),
        });
        Alert.alert('Success', `Campus "${formTitle}" created`);
      } else if (actionType === 'set_semester_dates') {
        await staffService.saveSemester({
          ...actionTargetItem,
          start_date: formStartDate,
          end_date: formEndDate,
        });
        Alert.alert('Success', 'Academic semester dates updated');
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

  // SDMS SETTINGS 13 SECTIONS CATALOG (Matches Web Settings 1:1)
  const SETTINGS_CARDS = [
    { id: 'courses', label: 'Colleges & Programs', sub: 'Manage colleges, programs & branches', icon: 'Layers', color: '#2563EB', bg: '#EFF6FF' },
    { id: 'calendar', label: 'Attendance Calendar', sub: 'Holidays & attendance calendar', icon: 'CalendarCheck', color: '#0284C7', bg: '#F0F9FF' },
    { id: 'academic-calendar', label: 'Academic Calendar', sub: 'Manage semester dates', icon: 'Calendar', color: '#16A34A', bg: '#F0FDF4' },
    { id: 'forms', label: 'Registration Form', sub: 'Student registration form fields', icon: 'FileText', color: '#9333EA', bg: '#FAF5FF' },
    { id: 'quotas', label: 'Student Quotas', sub: 'Quota names & codes', icon: 'Tags', color: '#7C3AED', bg: '#F5F3FF' },
    { id: 'caste-categories', label: 'Categories & Castes', sub: 'Categories & castes', icon: 'Users', color: '#D97706', bg: '#FFFBEB' },
    { id: 'notifications', label: 'Notifications', sub: 'SMS & Email templates', icon: 'Bell', color: '#4F46E5', bg: '#EEF2FF' },
    { id: 'college-transfer', label: 'College Transfer', sub: 'Manual student transfers', icon: 'TrendingUp', color: '#EA580C', bg: '#FFF7ED' },
    { id: 'student-layout', label: 'Student Portal Layout', sub: 'Enable/Disable sidebar items', icon: 'Layout', color: '#2563EB', bg: '#EFF6FF' },
    { id: 'qr-config', label: 'QR Code Config', sub: 'Per-role student field visibility', icon: 'QrCode', color: '#0D9488', bg: '#F0FDFA' },
    { id: 'rtf-amount', label: 'RTF Amount Setup', sub: 'Scholarship sanctioned amounts per batch', icon: 'GraduationCap', color: '#DB2777', bg: '#FDF2F8' },
    { id: 'freeze-database', label: 'Freeze Database', sub: 'Lock records by batch', icon: 'Lock', color: '#DC2626', bg: '#FEF2F2' },
    { id: 'campus', label: 'Campus Creation', sub: 'Group colleges under campuses', icon: 'MapPin', color: '#059669', bg: '#ECFDF5' },
  ];

  const renderSettingsIcon = (name: string, color: string, size = 18) => {
    switch (name) {
      case 'Layers': return <Layers size={size} color={color} />;
      case 'CalendarCheck': return <CalendarCheck size={size} color={color} />;
      case 'Calendar': return <Calendar size={size} color={color} />;
      case 'FileText': return <FileText size={size} color={color} />;
      case 'Tags': return <Tags size={size} color={color} />;
      case 'Users': return <Users size={size} color={color} />;
      case 'Bell': return <Bell size={size} color={color} />;
      case 'TrendingUp': return <TrendingUp size={size} color={color} />;
      case 'Layout': return <Layout size={size} color={color} />;
      case 'QrCode': return <QrCode size={size} color={color} />;
      case 'GraduationCap': return <GraduationCap size={size} color={color} />;
      case 'Lock': return <Lock size={size} color={color} />;
      case 'MapPin': return <MapPin size={size} color={color} />;
      default: return <Settings size={size} color={color} />;
    }
  };

  // SETTINGS ACTION HANDLERS
  const handleSelectCollege = (colId: any) => {
    setSelectedCollegeId(colId);
    const activeCourses = settingsCourses.filter((c: any) => String(c.college_id) === String(colId));
    if (activeCourses.length > 0) {
      setSelectedCourseId(activeCourses[0].id);
      staffService.getBranches(activeCourses[0].id).then((b) => setSettingsBranches(b)).catch(() => setSettingsBranches([]));
    } else {
      setSelectedCourseId(null);
      setSettingsBranches([]);
    }
  };

  const handleSelectCourse = (cId: any) => {
    setSelectedCourseId(cId);
    staffService.getBranches(cId).then((b) => setSettingsBranches(b)).catch(() => setSettingsBranches([]));
  };

  const handleAddBatch = async () => {
    if (!newBatchInput.trim()) {
      Alert.alert('Required', 'Enter batch year (e.g. 2027)');
      return;
    }
    try {
      await staffService.createAcademicYear(newBatchInput.trim());
      setNewBatchInput('');
      Alert.alert('Success', `Batch "${newBatchInput.trim()}" added`);
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDeleteBatch = (id: any, name: string) => {
    Alert.alert('Delete Batch', `Remove academic batch ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await staffService.deleteAcademicYear(id);
            Alert.alert('Deleted', 'Batch removed');
            loadData();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const handleDeleteCollege = (id: any, name: string) => {
    Alert.alert('Delete College', `Permanently delete "${name}"? This cascades to programs and branches.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await staffService.deleteCollege(id);
            Alert.alert('Deleted', 'College removed');
            loadData();
          } catch (e: any) {
            Alert.alert('Delete Failed', e.message);
          }
        },
      },
    ]);
  };

  const handleDeleteCourse = (id: any, name: string) => {
    Alert.alert('Delete Program', `Remove academic program "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await staffService.deleteCourse(id);
            Alert.alert('Deleted', 'Program removed');
            loadData();
          } catch (e: any) {
            Alert.alert('Delete Failed', e.message);
          }
        },
      },
    ]);
  };

  const handleDeleteBranch = (courseId: any, branchId: any, name: string) => {
    Alert.alert('Delete Branch', `Remove branch "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await staffService.deleteBranch(courseId, branchId);
            Alert.alert('Deleted', 'Branch removed');
            if (selectedCourseId) {
              const b = await staffService.getBranches(selectedCourseId);
              setSettingsBranches(b);
            }
          } catch (e: any) {
            Alert.alert('Delete Failed', e.message);
          }
        },
      },
    ]);
  };

  const handleDeleteHoliday = (id: any, name: string) => {
    Alert.alert('Delete Holiday', `Remove holiday "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await staffService.deleteHoliday(id);
            Alert.alert('Deleted', 'Holiday removed');
            loadData();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const handleToggleQuota = async (quota: any) => {
    try {
      await staffService.toggleQuota(quota.id, !quota.is_active);
      loadData();
    } catch (e: any) {
      Alert.alert('Failed', e.message);
    }
  };

  const handleDeleteQuota = (id: any, name: string) => {
    Alert.alert('Delete Quota', `Remove student quota "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await staffService.deleteQuota(id);
            Alert.alert('Deleted', 'Quota removed');
            loadData();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const handleDeleteCasteCategory = (id: any, name: string) => {
    Alert.alert('Delete Category', `Remove category "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await staffService.deleteCasteCategory(id);
            Alert.alert('Deleted', 'Category removed');
            loadData();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const handleDeleteCaste = (catId: any, casteId: any, name: string) => {
    Alert.alert('Delete Caste', `Remove caste "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await staffService.deleteCaste(catId, casteId);
            Alert.alert('Deleted', 'Caste removed');
            loadData();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const handleToggleFrozenBatch = async (batchName: string, isCurrentlyFrozen: boolean) => {
    try {
      const next = isCurrentlyFrozen
        ? frozenBatches.filter((b) => b !== batchName)
        : [...frozenBatches, batchName];
      await staffService.updateFrozenBatches(next);
      setFrozenBatches(next);
      Alert.alert(
        isCurrentlyFrozen ? 'Batch Unlocked' : 'Batch Frozen',
        `Batch ${batchName} is now ${isCurrentlyFrozen ? 'Unlocked' : 'Locked'}`
      );
      loadData();
    } catch (e: any) {
      Alert.alert('Failed', e.message);
    }
  };

  const handleToggleStudentLayoutItem = async (itemId: string) => {
    const updated = studentLayout.map((item) =>
      item.id === itemId ? { ...item, enabled: !item.enabled } : item
    );
    setStudentLayout(updated);
    try {
      await staffService.updateStudentLayout(updated);
    } catch (e: any) {
      Alert.alert('Update Failed', e.message);
    }
  };

  const handleToggleQrField = async (fieldKey: string) => {
    const curRoles = qrRoleConfig?.roleConfigs || {};
    const curForRole = curRoles[qrRole] || [];
    const nextForRole = curForRole.includes(fieldKey)
      ? curForRole.filter((k: string) => k !== fieldKey)
      : [...curForRole, fieldKey];
    const updatedConfigs = { ...curRoles, [qrRole]: nextForRole };
    setQrRoleConfig({ ...qrRoleConfig, roleConfigs: updatedConfigs });
    try {
      await staffService.saveQrConfig({
        roleConfigs: updatedConfigs,
        publicFields: qrRoleConfig?.publicFields || [],
      });
    } catch (e: any) {
      Alert.alert('Update Failed', e.message);
    }
  };

  const handleExecuteTransfer = async () => {
    if (selectedTransferStudentIds.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one student to transfer');
      return;
    }
    if (!targetCollegeId) {
      Alert.alert('Target Required', 'Please choose the destination college');
      return;
    }
    Alert.alert(
      'Confirm Transfer',
      `Transfer ${selectedTransferStudentIds.length} student(s) to destination college?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Transfer',
          onPress: async () => {
            try {
              await staffService.transferStudents({
                studentIds: selectedTransferStudentIds,
                targetCollegeId,
                remarks: 'Transferred via SDMS Mobile Settings',
              });
              setSelectedTransferStudentIds([]);
              Alert.alert('Transferred', 'Students transferred successfully');
              loadData();
            } catch (e: any) {
              Alert.alert('Transfer Failed', e.message);
            }
          },
        },
      ]
    );
  };

  const handleDeleteCampus = (id: any, name: string) => {
    Alert.alert('Delete Campus', `Remove campus "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await staffService.deleteCampus(id);
            Alert.alert('Deleted', 'Campus removed');
            loadData();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const renderActiveSettingsSection = () => {
    const curTab = activeSubTab || 'courses';

    // 1. COLLEGES & PROGRAMS
    if (curTab === 'courses') {
      const activeCourses = settingsCourses.filter(
        (c: any) => !selectedCollegeId || String(c.college_id) === String(selectedCollegeId)
      );
      const selectedProgram = settingsCourses.find((c: any) => c.id === selectedCourseId);

      return (
        <View style={{ marginTop: 14 }}>
          {/* Summary counters bar matching Web */}
          <View style={styles.settingsSummaryRow}>
            <View style={styles.settingsSummaryBadge}>
              <Text style={styles.settingsSummaryLabel}>Colleges: </Text>
              <Text style={styles.settingsSummaryVal}>{settingsColleges.length}</Text>
            </View>
            <View style={styles.settingsSummaryBadge}>
              <Text style={styles.settingsSummaryLabel}>Batches: </Text>
              <Text style={styles.settingsSummaryVal}>{settingsBatches.length}</Text>
            </View>
            <View style={styles.settingsSummaryBadge}>
              <Text style={styles.settingsSummaryLabel}>Programs: </Text>
              <Text style={styles.settingsSummaryVal}>{settingsCourses.length}</Text>
            </View>
            <View style={styles.settingsSummaryBadge}>
              <Text style={styles.settingsSummaryLabel}>Branches: </Text>
              <Text style={styles.settingsSummaryVal}>{settingsBranches.length}</Text>
            </View>
          </View>

          {/* 1. COLLEGES PANEL */}
          <View style={styles.settingsSectionBox}>
            <View style={styles.settingsSectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Landmark size={16} color="#1E3A8A" />
                <Text style={styles.settingsSectionTitle}>COLLEGES ({settingsColleges.length})</Text>
              </View>
              {canWrite && (
                <TouchableOpacity
                  style={styles.settingsAddBtn}
                  onPress={() => {
                    setActionType('create_college');
                    setFormName('');
                    setFormCode('');
                    setFormPhone('');
                    setFormEmail('');
                    setActionModalVisible(true);
                  }}
                >
                  <Plus size={13} color="#FFFFFF" />
                  <Text style={styles.settingsAddBtnText}>Add College</Text>
                </TouchableOpacity>
              )}
            </View>

            {settingsColleges.map((col: any) => {
              const isSel = selectedCollegeId === col.id;
              return (
                <TouchableOpacity
                  key={col.id}
                  style={[styles.settingsColCard, isSel && styles.settingsColCardActive]}
                  onPress={() => handleSelectCollege(col.id)}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <View style={[styles.colDot, { backgroundColor: col.is_active !== false ? '#10B981' : '#94A3B8' }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.settingsColTitle, isSel && { color: '#1E3A8A', fontWeight: '800' }]}>
                        {col.name}
                      </Text>
                      {col.code && <Text style={styles.settingsColCode}>Code: {col.code}</Text>}
                    </View>
                  </View>
                  {canWrite && (
                    <TouchableOpacity onPress={() => handleDeleteCollege(col.id, col.name)} hitSlop={8}>
                      <Trash2 size={15} color="#DC2626" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 2. BATCHES PANEL */}
          <View style={styles.settingsSectionBox}>
            <View style={styles.settingsSectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Calendar size={16} color="#059669" />
                <Text style={styles.settingsSectionTitle}>BATCHES ({settingsBatches.length})</Text>
              </View>
            </View>

            {canWrite && (
              <View style={styles.settingsBatchInputRow}>
                <TextInput
                  style={styles.settingsBatchInput}
                  placeholder="e.g. 2027"
                  value={newBatchInput}
                  onChangeText={setNewBatchInput}
                  keyboardType="numeric"
                />
                <TouchableOpacity style={styles.settingsBatchAddBtn} onPress={handleAddBatch} activeOpacity={0.8}>
                  <Plus size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.settingsBatchChipsRow}>
              {settingsBatches.map((b: any, bIdx: number) => {
                const bName = typeof b === 'string' ? b : (b.academic_year || b.batch || String(b));
                const bId = typeof b === 'object' ? b.id : bName;
                return (
                  <View key={bIdx} style={styles.settingsBatchChip}>
                    <Text style={styles.settingsBatchChipText}>{bName}</Text>
                    {canWrite && (
                      <TouchableOpacity onPress={() => handleDeleteBatch(bId, bName)} hitSlop={6}>
                        <X size={12} color="#DC2626" />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* 3. PROGRAMS / COURSES PANEL */}
          <View style={styles.settingsSectionBox}>
            <View style={styles.settingsSectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <BookOpen size={16} color="#7C3AED" />
                <Text style={styles.settingsSectionTitle}>SELECT PROGRAM ({activeCourses.length})</Text>
              </View>
              {canWrite && (
                <TouchableOpacity
                  style={[styles.settingsAddBtn, { backgroundColor: '#7C3AED' }]}
                  onPress={() => {
                    setActionType('create_course');
                    setFormName('');
                    setFormCode('');
                    setFormDegreeLevel('DEGREE');
                    setFormTotalYears('4');
                    setFormSemsPerYear('2');
                    setActionModalVisible(true);
                  }}
                >
                  <Plus size={13} color="#FFFFFF" />
                  <Text style={styles.settingsAddBtnText}>Add Program</Text>
                </TouchableOpacity>
              )}
            </View>

            {activeCourses.length === 0 ? (
              <Text style={{ fontSize: 12, color: '#94A3B8', padding: 8 }}>
                No programs configured for selected college. Tap "+ Add Program" above.
              </Text>
            ) : (
              activeCourses.map((crs: any) => {
                const isSel = selectedCourseId === crs.id;
                return (
                  <TouchableOpacity
                    key={crs.id}
                    style={[styles.settingsCourseCard, isSel && styles.settingsCourseCardActive]}
                    onPress={() => handleSelectCourse(crs.id)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.settingsCourseTitle, isSel && { color: '#7C3AED', fontWeight: '800' }]}>
                        {crs.name}
                      </Text>
                      <Text style={styles.settingsCourseMeta}>
                        {crs.degree_level || 'DEGREE'} • {crs.total_years || 4}yr • {crs.semesters_per_year || 2} sem/year
                      </Text>
                    </View>
                    {canWrite && (
                      <TouchableOpacity onPress={() => handleDeleteCourse(crs.id, crs.name)} hitSlop={8}>
                        <Trash2 size={15} color="#DC2626" />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* 4. BRANCHES PANEL */}
          <View style={styles.settingsSectionBox}>
            <View style={styles.settingsSectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Split size={16} color="#0D9488" />
                <Text style={styles.settingsSectionTitle} numberOfLines={1}>
                  {selectedProgram?.name || 'Program'} - Branches
                </Text>
              </View>
              {canWrite && selectedCourseId && (
                <TouchableOpacity
                  style={[styles.settingsAddBtn, { backgroundColor: '#0D9488' }]}
                  onPress={() => {
                    setActionType('create_branch');
                    setFormName('');
                    setFormCode('');
                    setActionModalVisible(true);
                  }}
                >
                  <Plus size={13} color="#FFFFFF" />
                  <Text style={styles.settingsAddBtnText}>Add Branch</Text>
                </TouchableOpacity>
              )}
            </View>

            {settingsBranches.length === 0 ? (
              <Text style={{ fontSize: 12, color: '#94A3B8', padding: 8 }}>
                No branches registered under this program.
              </Text>
            ) : (
              <View style={styles.settingsBatchChipsRow}>
                {settingsBranches.map((br: any) => (
                  <View key={br.id} style={[styles.settingsBranchChip, { backgroundColor: '#F0FDFA', borderColor: '#CCFBF1' }]}>
                    <Text style={[styles.settingsBranchChipText, { color: '#0F766E' }]}>
                      {br.name || br.code}
                    </Text>
                    {canWrite && (
                      <TouchableOpacity onPress={() => handleDeleteBranch(selectedCourseId, br.id, br.name || br.code)} hitSlop={6}>
                        <X size={12} color="#DC2626" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      );
    }

    // 2. ATTENDANCE CALENDAR
    if (curTab === 'calendar') {
      return (
        <View style={{ marginTop: 14 }}>
          <View style={styles.settingsSectionHeader}>
            <Text style={styles.settingsSectionTitle}>Holidays & Non-Working Days ({dataList.length})</Text>
            {canWrite && (
              <TouchableOpacity
                style={styles.settingsAddBtn}
                onPress={() => {
                  setActionType('create_holiday');
                  setFormTitle('');
                  setFormBookingDate(new Date().toISOString().split('T')[0]);
                  setFormContent('');
                  setActionModalVisible(true);
                }}
              >
                <Plus size={13} color="#FFFFFF" />
                <Text style={styles.settingsAddBtnText}>Add Holiday</Text>
              </TouchableOpacity>
            )}
          </View>

          {dataList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Calendar size={28} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Holidays Configured</Text>
              <Text style={styles.emptyText}>Add institutional breaks or public holidays.</Text>
            </View>
          ) : (
            dataList.map((h: any, idx: number) => (
              <View key={h.id || idx} style={styles.settingsHolidayCard}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={styles.settingsHolidayDate}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#1E3A8A' }}>
                        {h.holiday_date ? h.holiday_date.split('T')[0] : 'Date'}
                      </Text>
                    </View>
                    <Text style={styles.settingsHolidayTitle}>{h.holiday_name || h.name || 'Holiday'}</Text>
                  </View>
                  {h.description ? <Text style={styles.settingsHolidaySub}>{h.description}</Text> : null}
                </View>
                {canWrite && (
                  <TouchableOpacity onPress={() => handleDeleteHoliday(h.id, h.holiday_name || h.name)} hitSlop={8}>
                    <Trash2 size={16} color="#DC2626" />
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      );
    }

    // 3. ACADEMIC CALENDAR
    if (curTab === 'academic-calendar') {
      return (
        <View style={{ marginTop: 14 }}>
          <View style={styles.settingsSectionHeader}>
            <Text style={styles.settingsSectionTitle}>Academic Semester Dates ({dataList.length})</Text>
          </View>

          {dataList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Calendar size={28} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Semester Dates Configured</Text>
              <Text style={styles.emptyText}>Semester instructional periods will appear here.</Text>
            </View>
          ) : (
            dataList.map((sem: any, idx: number) => (
              <View key={sem.id || idx} style={styles.settingsHolidayCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsHolidayTitle}>
                    {sem.course_name || sem.course || 'Program'} - Sem {sem.semester_number || sem.semester || '1'}
                  </Text>
                  <Text style={styles.settingsHolidaySub}>
                    Batch: {sem.batch || 'All'} • College: {sem.college_name || 'All Colleges'}
                  </Text>
                  <Text style={[styles.settingsHolidaySub, { color: '#059669', fontWeight: '600', marginTop: 2 }]}>
                    Start: {sem.start_date ? sem.start_date.split('T')[0] : 'N/A'} • End: {sem.end_date ? sem.end_date.split('T')[0] : 'N/A'}
                  </Text>
                </View>
                {canWrite && (
                  <TouchableOpacity
                    style={[styles.settingsAddBtn, { backgroundColor: '#1E3A8A' }]}
                    onPress={() => {
                      setActionTargetItem(sem);
                      setActionType('set_semester_dates');
                      setFormStartDate(sem.start_date ? sem.start_date.split('T')[0] : '');
                      setFormEndDate(sem.end_date ? sem.end_date.split('T')[0] : '');
                      setActionModalVisible(true);
                    }}
                  >
                    <Edit2 size={13} color="#FFFFFF" />
                    <Text style={styles.settingsAddBtnText}>Dates</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      );
    }

    // 4. REGISTRATION FORM
    if (curTab === 'forms') {
      const form = dataList[0] || {};
      const fields = [
        { group: 'Basic Information', items: ['Student Full Name', 'Father Name', 'Gender', 'Date of Birth', 'Aadhaar Number', 'PIN / Roll Number', 'Mother Name'] },
        { group: 'Academic Details', items: ['College Name', 'Batch', 'Program / Course', 'Branch', 'Academic Year', 'Semester', 'Scholarship Status'] },
        { group: 'Contact Details', items: ['Student Mobile', 'Parent Mobile 1', 'Parent Mobile 2', 'Email Address'] },
        { group: 'Address', items: ['Permanent Address', 'City / Village', 'Mandal', 'District', 'State', 'Pincode'] },
      ];

      return (
        <View style={{ marginTop: 14 }}>
          <View style={styles.settingsSectionBox}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingsSectionTitle}>{form.form_name || 'Student Registration Form'}</Text>
                <Text style={styles.settingsHolidaySub}>{form.form_description || 'Public student admission and registration portal'}</Text>
              </View>
              {canWrite && (
                <Switch
                  value={form.is_active !== false}
                  onValueChange={async (val) => {
                    if (form.form_id || form.id) {
                      await staffService.toggleRegistrationForm(form.form_id || form.id, val);
                      loadData();
                    }
                  }}
                  trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                  thumbColor={form.is_active !== false ? '#1E3A8A' : '#F1F5F9'}
                />
              )}
            </View>
          </View>

          <Text style={[styles.settingsSectionTitle, { marginTop: 12, marginBottom: 8 }]}>Configured Fields</Text>
          {fields.map((grp, gIdx) => (
            <View key={gIdx} style={styles.settingsSectionBox}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E3A8A', marginBottom: 8 }}>{grp.group}</Text>
              {grp.items.map((fieldName, fIdx) => (
                <View key={fIdx} style={styles.settingsLayoutRow}>
                  <Text style={styles.settingsLayoutLabel}>{fieldName}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 10, color: '#059669', fontWeight: '700' }}>ACTIVE</Text>
                    <CheckSquare size={16} color="#059669" />
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      );
    }

    // 5. STUDENT QUOTAS
    if (curTab === 'quotas') {
      return (
        <View style={{ marginTop: 14 }}>
          <View style={styles.settingsSectionHeader}>
            <Text style={styles.settingsSectionTitle}>Admission Quotas ({dataList.length})</Text>
            {canWrite && (
              <TouchableOpacity
                style={styles.settingsAddBtn}
                onPress={() => {
                  setActionType('create_quota');
                  setFormTitle('');
                  setFormCode('');
                  setActionModalVisible(true);
                }}
              >
                <Plus size={13} color="#FFFFFF" />
                <Text style={styles.settingsAddBtnText}>Add Quota</Text>
              </TouchableOpacity>
            )}
          </View>

          {dataList.map((q: any, idx: number) => {
            const isAct = q.is_active !== false;
            return (
              <View key={q.id || idx} style={styles.settingsHolidayCard}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.settingsHolidayTitle}>{q.name}</Text>
                    <View style={[styles.settingsBatchChip, { backgroundColor: '#EEF2FF', paddingVertical: 2 }]}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#1E3A8A' }}>{q.code || 'QUOTA'}</Text>
                    </View>
                  </View>
                  <Text style={styles.settingsHolidaySub}>Status: {isAct ? 'Active' : 'Inactive'}</Text>
                </View>
                {canWrite && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Switch
                      value={isAct}
                      onValueChange={() => handleToggleQuota(q)}
                      trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                      thumbColor={isAct ? '#1E3A8A' : '#F1F5F9'}
                    />
                    <TouchableOpacity onPress={() => handleDeleteQuota(q.id, q.name)} hitSlop={8}>
                      <Trash2 size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      );
    }

    // 6. CASTE CATEGORIES & CASTES
    if (curTab === 'caste-categories') {
      const activeCat = dataList.find((c: any) => c.id === selectedCasteCategoryId) || dataList[0];
      const castes = activeCat?.castes || activeCat?.sub_castes || [];

      return (
        <View style={{ marginTop: 14 }}>
          <View style={styles.settingsSectionHeader}>
            <Text style={styles.settingsSectionTitle}>Caste Categories</Text>
            {canWrite && (
              <TouchableOpacity
                style={styles.settingsAddBtn}
                onPress={() => {
                  setActionType('create_caste_category');
                  setFormTitle('');
                  setActionModalVisible(true);
                }}
              >
                <Plus size={13} color="#FFFFFF" />
                <Text style={styles.settingsAddBtnText}>Add Category</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Category Chips Row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {dataList.map((cat: any) => {
                const isSel = (selectedCasteCategoryId || dataList[0]?.id) === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.settingsBatchChip, isSel && { backgroundColor: '#1E3A8A', borderColor: '#1E3A8A' }]}
                    onPress={() => setSelectedCasteCategoryId(cat.id)}
                  >
                    <Text style={[styles.settingsBatchChipText, isSel && { color: '#FFFFFF' }]}>{cat.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {activeCat && (
            <View style={styles.settingsSectionBox}>
              <View style={styles.settingsSectionHeader}>
                <Text style={styles.settingsSectionTitle}>Castes under {activeCat.name}</Text>
                {canWrite && (
                  <TouchableOpacity
                    style={[styles.settingsAddBtn, { backgroundColor: '#D97706' }]}
                    onPress={() => {
                      setActionTargetItem(activeCat);
                      setActionType('create_caste');
                      setFormTitle('');
                      setActionModalVisible(true);
                    }}
                  >
                    <Plus size={13} color="#FFFFFF" />
                    <Text style={styles.settingsAddBtnText}>Add Caste</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.settingsBatchChipsRow}>
                {castes.length === 0 ? (
                  <Text style={{ fontSize: 12, color: '#94A3B8' }}>No castes registered under {activeCat.name}.</Text>
                ) : (
                  castes.map((c: any) => (
                    <View key={c.id || c.name} style={styles.settingsBatchChip}>
                      <Text style={styles.settingsBatchChipText}>{c.name}</Text>
                      {canWrite && (
                        <TouchableOpacity onPress={() => handleDeleteCaste(activeCat.id, c.id, c.name)} hitSlop={6}>
                          <X size={12} color="#DC2626" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                )}
              </View>
            </View>
          )}
        </View>
      );
    }

    // 7. NOTIFICATIONS
    if (curTab === 'notifications') {
      return (
        <View style={{ marginTop: 14 }}>
          <View style={styles.settingsSectionHeader}>
            <Text style={styles.settingsSectionTitle}>Notification & SMS Templates ({dataList.length})</Text>
          </View>
          {dataList.map((tpl: any, idx: number) => (
            <View key={tpl.id || idx} style={styles.actionCard}>
              <View style={styles.actionCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTitle}>{tpl.name || tpl.title || 'SMS Template'}</Text>
                  <Text style={styles.actionSub}>Event: {tpl.event || tpl.type || 'System Event'}</Text>
                </View>
                <View style={[styles.statusPill, styles.pillSuccess]}>
                  <Text style={styles.statusPillText}>{tpl.channel || 'SMS'}</Text>
                </View>
              </View>
              <Text style={styles.smsLogMsg}>{tpl.template_body || tpl.message || tpl.content || 'Template text'}</Text>
            </View>
          ))}
        </View>
      );
    }

    // 8. COLLEGE TRANSFER
    if (curTab === 'college-transfer') {
      return (
        <View style={{ marginTop: 14 }}>
          <View style={styles.settingsSectionBox}>
            <Text style={[styles.settingsSectionTitle, { marginBottom: 10 }]}>Transfer Between Colleges</Text>
            <View style={styles.settingsTransferPickerRow}>
              <View style={styles.settingsTransferPickerCol}>
                <Text style={styles.settingsTransferPickerLabel}>Source College</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {settingsColleges.map((col: any) => (
                    <TouchableOpacity
                      key={col.id}
                      style={[styles.settingsBatchChip, sourceCollegeId === col.id && { backgroundColor: '#1E3A8A' }]}
                      onPress={() => {
                        setSourceCollegeId(col.id);
                        staffService.getPaginatedStudents({ college: col.id, limit: 50 }).then((res) => setDataList(res.students));
                      }}
                    >
                      <Text style={[styles.settingsBatchChipText, sourceCollegeId === col.id && { color: '#FFFFFF' }]}>
                        {col.code || col.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={[styles.settingsTransferPickerCol, { marginTop: 10 }]}>
                <Text style={styles.settingsTransferPickerLabel}>Destination College</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {settingsColleges.map((col: any) => (
                    <TouchableOpacity
                      key={col.id}
                      style={[styles.settingsBatchChip, targetCollegeId === col.id && { backgroundColor: '#059669' }]}
                      onPress={() => setTargetCollegeId(col.id)}
                    >
                      <Text style={[styles.settingsBatchChipText, targetCollegeId === col.id && { color: '#FFFFFF' }]}>
                        {col.code || col.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {canWrite && selectedTransferStudentIds.length > 0 && (
              <TouchableOpacity style={[styles.settingsSaveBtn, { backgroundColor: '#EA580C', marginTop: 14 }]} onPress={handleExecuteTransfer}>
                <TrendingUp size={16} color="#FFFFFF" />
                <Text style={styles.settingsSaveBtnText}>
                  Transfer Selected ({selectedTransferStudentIds.length}) Students
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.settingsSectionTitle, { marginTop: 12, marginBottom: 8 }]}>Select Students to Transfer</Text>
          {dataList.map((stu: any) => {
            const isChecked = selectedTransferStudentIds.includes(stu.id || stu.student_id);
            const stuId = stu.id || stu.student_id;
            return (
              <TouchableOpacity
                key={stuId}
                style={[styles.settingsColCard, isChecked && { borderColor: '#EA580C', backgroundColor: '#FFF7ED' }]}
                onPress={() => {
                  setSelectedTransferStudentIds((prev) =>
                    prev.includes(stuId) ? prev.filter((id) => id !== stuId) : [...prev, stuId]
                  );
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  {isChecked ? <CheckSquare size={18} color="#EA580C" /> : <Square size={18} color="#94A3B8" />}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingsColTitle}>{stu.student_name || stu.name}</Text>
                    <Text style={styles.settingsColCode}>{stu.admission_number || stu.pin_no} • {stu.course_name || 'Student'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    // 9. STUDENT PORTAL LAYOUT
    if (curTab === 'student-layout') {
      const items = studentLayout.length > 0 ? studentLayout : [
        { id: 'dashboard', label: 'Dashboard Overview', enabled: true },
        { id: 'attendance', label: 'Attendance Records', enabled: true },
        { id: 'fees', label: 'Fee Payments & Receipts', enabled: true },
        { id: 'announcements', label: 'Circulars & Notices', enabled: true },
        { id: 'services', label: 'Student Services', enabled: true },
        { id: 'seminar-halls', label: 'Seminar Hall Bookings', enabled: true },
        { id: 'clubs', label: 'Student Campus Clubs', enabled: true },
        { id: 'profile', label: 'Profile Update Requests', enabled: true },
      ];

      return (
        <View style={{ marginTop: 14 }}>
          <View style={styles.settingsSectionBox}>
            <Text style={styles.settingsSectionTitle}>Student Portal Sidebar Layout</Text>
            <Text style={styles.settingsHolidaySub}>Toggle navigation tabs visible to students upon login</Text>
          </View>

          {items.map((item: any) => (
            <View key={item.id} style={styles.settingsLayoutRow}>
              <Text style={styles.settingsLayoutLabel}>{item.label}</Text>
              <Switch
                value={item.enabled !== false}
                onValueChange={() => handleToggleStudentLayoutItem(item.id)}
                trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                thumbColor={item.enabled !== false ? '#1E3A8A' : '#F1F5F9'}
              />
            </View>
          ))}
        </View>
      );
    }

    // 10. QR CODE CONFIG
    if (curTab === 'qr-config') {
      const roles: ('attender' | 'faculty' | 'cashier' | 'principal' | 'admin')[] = [
        'attender', 'faculty', 'cashier', 'principal', 'admin',
      ];
      const curFields = qrRoleConfig?.roleConfigs?.[qrRole] || ['photo', 'pin_no', 'student_name', 'college', 'course'];

      return (
        <View style={{ marginTop: 14 }}>
          <View style={styles.settingsSectionBox}>
            <Text style={styles.settingsSectionTitle}>QR Scanner Role Field Visibility</Text>
            <Text style={styles.settingsHolidaySub}>Select a staff role and configure visible student card fields</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {roles.map((r) => {
                  const isSel = qrRole === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[styles.settingsQrRoleChip, isSel && styles.settingsQrRoleChipActive]}
                      onPress={() => setQrRole(r)}
                    >
                      <Text style={[styles.settingsQrRoleChipText, isSel && styles.settingsQrRoleChipTextActive]}>
                        {r.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {dataList.map((f: any) => {
            const isEnabled = curFields.includes(f.key);
            return (
              <View key={f.key} style={styles.settingsLayoutRow}>
                <Text style={styles.settingsLayoutLabel}>{f.label}</Text>
                <Switch
                  value={isEnabled}
                  onValueChange={() => handleToggleQrField(f.key)}
                  trackColor={{ false: '#CBD5E1', true: '#99F6E4' }}
                  thumbColor={isEnabled ? '#0D9488' : '#F1F5F9'}
                />
              </View>
            );
          })}
        </View>
      );
    }

    // 11. RTF AMOUNT SETUP
    if (curTab === 'rtf-amount') {
      return (
        <View style={{ marginTop: 14 }}>
          <View style={styles.settingsSectionBox}>
            <Text style={styles.settingsSectionTitle}>Reimbursement of Tuition Fee (RTF) Setup</Text>
            <Text style={styles.settingsHolidaySub}>Configure government scholarship sanctioned fees per program & batch</Text>
          </View>

          {dataList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <GraduationCap size={28} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No RTF Rates Configured</Text>
              <Text style={styles.emptyText}>RTF sanctioned amounts will be calculated dynamically.</Text>
            </View>
          ) : (
            dataList.map((entry: any, idx: number) => (
              <View key={idx} style={styles.settingsHolidayCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsHolidayTitle}>{entry.course || 'Program'} - {entry.batch || 'Batch'}</Text>
                  <Text style={styles.settingsHolidaySub}>College: {entry.college || 'All Institutions'}</Text>
                  <Text style={[styles.settingsHolidaySub, { color: '#DB2777', fontWeight: '800', marginTop: 2 }]}>
                    Sanctioned RTF: ₹{Number(entry.amount || entry.sanctioned || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      );
    }

    // 12. FREEZE DATABASE
    if (curTab === 'freeze-database') {
      return (
        <View style={{ marginTop: 14 }}>
          <View style={styles.settingsSectionBox}>
            <Text style={styles.settingsSectionTitle}>Freeze Academic Records</Text>
            <Text style={styles.settingsHolidaySub}>Lock completed batches to prevent accidental edits to student profiles or fees</Text>
          </View>

          {dataList.map((b: any, idx: number) => {
            const isFrozen = b.is_frozen;
            return (
              <View key={idx} style={styles.settingsHolidayCard}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.settingsHolidayTitle}>Batch {b.batch}</Text>
                    <View style={[styles.statusPill, isFrozen ? styles.pillInactive : styles.pillSuccess]}>
                      <Text style={styles.statusPillText}>{isFrozen ? 'LOCKED' : 'ACTIVE'}</Text>
                    </View>
                  </View>
                  <Text style={styles.settingsHolidaySub}>
                    {isFrozen ? 'Database modifications locked for this batch' : 'Modifications allowed'}
                  </Text>
                </View>
                {canWrite && (
                  <TouchableOpacity
                    style={[styles.settingsAddBtn, { backgroundColor: isFrozen ? '#059669' : '#DC2626' }]}
                    onPress={() => handleToggleFrozenBatch(b.batch, isFrozen)}
                  >
                    {isFrozen ? <Unlock size={14} color="#FFFFFF" /> : <Lock size={14} color="#FFFFFF" />}
                    <Text style={styles.settingsAddBtnText}>{isFrozen ? 'Unlock' : 'Freeze'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      );
    }

    // 13. CAMPUS CREATION
    if (curTab === 'campus') {
      return (
        <View style={{ marginTop: 14 }}>
          <View style={styles.settingsSectionHeader}>
            <Text style={styles.settingsSectionTitle}>Campus Locations ({dataList.length})</Text>
            {canWrite && (
              <TouchableOpacity
                style={[styles.settingsAddBtn, { backgroundColor: '#059669' }]}
                onPress={() => {
                  setActionType('create_campus');
                  setFormTitle('');
                  setFormHallLocation('');
                  setFormContent('');
                  setActionModalVisible(true);
                }}
              >
                <Plus size={13} color="#FFFFFF" />
                <Text style={styles.settingsAddBtnText}>Add Campus</Text>
              </TouchableOpacity>
            )}
          </View>

          {dataList.map((c: any, idx: number) => (
            <View key={c.id || idx} style={styles.actionCard}>
              <View style={styles.actionCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTitle}>{c.name || 'Campus'}</Text>
                  <Text style={styles.actionSub}>Location: {c.location || 'Main Campus'}</Text>
                  {c.description ? <Text style={styles.actionDetail}>{c.description}</Text> : null}
                </View>
                {canWrite && (
                  <TouchableOpacity onPress={() => handleDeleteCampus(c.id, c.name)} hitSlop={8}>
                    <Trash2 size={16} color="#DC2626" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      );
    }

    return null;
  };

  const hasCreateAction =
    canWrite &&
    ((opKey === 'students' && (activeSubTab === 'database' || !activeSubTab)) ||
      opKey === 'user-management' ||
      (opKey === 'announcements' && activeSubTab === 'notices') ||
      (opKey === 'clubs' && activeSubTab === 'management') ||
      opKey === 'seminar-halls' ||
      (opKey === 'services' && activeSubTab === 'config') ||
      (opKey === 'courses' &&
        (activeSubTab === 'courses' ||
          !activeSubTab ||
          activeSubTab === 'calendar' ||
          activeSubTab === 'quotas' ||
          activeSubTab === 'caste-categories' ||
          activeSubTab === 'campus')));

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
                : opKey === 'courses'
                ? activeSubTab === 'calendar'
                  ? 'Add Holiday'
                  : activeSubTab === 'quotas'
                  ? 'Add Quota'
                  : activeSubTab === 'caste-categories'
                  ? 'Add Category'
                  : activeSubTab === 'campus'
                  ? 'Add Campus'
                  : 'Add College'
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
          ) : opKey === 'courses' ? (
            /* SDMS SETTINGS FULL CONSOLE (All 13 Sections) */
            <View style={styles.settingsContainer}>
              {/* Top 13 Navigation Cards */}
              <View style={styles.settingsCardsGrid}>
                {SETTINGS_CARDS.map((card) => {
                  const isCurActive = (activeSubTab || 'courses') === card.id;
                  return (
                    <TouchableOpacity
                      key={card.id}
                      style={[
                        styles.settingsNavCard,
                        isCurActive && styles.settingsNavCardActive,
                      ]}
                      onPress={() => setActiveSubTab(card.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.settingsCardIconBox, { backgroundColor: card.bg }]}>
                        {renderSettingsIcon(card.icon, card.color, 16)}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.settingsNavCardTitle,
                            isCurActive && styles.settingsNavCardTitleActive,
                          ]}
                          numberOfLines={1}
                        >
                          {card.label}
                        </Text>
                        <Text style={styles.settingsNavCardSub} numberOfLines={1}>
                          {card.sub}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ACTIVE SETTINGS SECTION */}
              {renderActiveSettingsSection()}
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
            ) : actionType === 'create_college' ? (
              /* 10. CREATE COLLEGE */
              <View>
                <Text style={styles.dialogTitle}>Add New College</Text>
                <Text style={styles.dialogSub}>Register an institution under SDMS</Text>
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="College Name * (e.g. Pydah College of Engg)"
                  value={formName}
                  onChangeText={setFormName}
                />
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="College Code (e.g. PCE)"
                  value={formCode}
                  onChangeText={setFormCode}
                  autoCapitalize="characters"
                />
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Official Phone"
                  value={formPhone}
                  onChangeText={setFormPhone}
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Official Email"
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
                    <Text style={styles.dialogConfirmText}>Save College</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : actionType === 'create_course' ? (
              /* 11. CREATE PROGRAM / COURSE */
              <View>
                <Text style={styles.dialogTitle}>Add Academic Program</Text>
                <Text style={styles.dialogSub}>Define curriculum under selected college</Text>
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Program Name * (e.g. B.Tech Computer Science)"
                  value={formName}
                  onChangeText={setFormName}
                />
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Program Code (e.g. BTECH-CSE)"
                  value={formCode}
                  onChangeText={setFormCode}
                  autoCapitalize="characters"
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    style={[styles.dialogSingleInput, { flex: 1 }]}
                    placeholder="Total Years (4)"
                    value={formTotalYears}
                    onChangeText={setFormTotalYears}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.dialogSingleInput, { flex: 1 }]}
                    placeholder="Sems/Yr (2)"
                    value={formSemsPerYear}
                    onChangeText={setFormSemsPerYear}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.dialogBtnRow}>
                  <TouchableOpacity
                    style={styles.dialogCancelBtn}
                    onPress={() => setActionModalVisible(false)}
                  >
                    <Text style={styles.dialogCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dialogConfirmBtn} onPress={handleSaveForm}>
                    <Text style={styles.dialogConfirmText}>Save Program</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : actionType === 'create_branch' ? (
              /* 12. CREATE BRANCH */
              <View>
                <Text style={styles.dialogTitle}>Add Specialization / Branch</Text>
                <Text style={styles.dialogSub}>Add branch to selected program</Text>
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Branch Name * (e.g. CSE)"
                  value={formName}
                  onChangeText={setFormName}
                />
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Branch Code (e.g. 05)"
                  value={formCode}
                  onChangeText={setFormCode}
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
                    <Text style={styles.dialogConfirmText}>Save Branch</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : actionType === 'create_holiday' ? (
              /* 13. CREATE HOLIDAY */
              <View>
                <Text style={styles.dialogTitle}>Add Custom Holiday</Text>
                <Text style={styles.dialogSub}>Mark non-instructional day on calendar</Text>
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Holiday Name * (e.g. Sankranti Vacation)"
                  value={formTitle}
                  onChangeText={setFormTitle}
                />
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Date (YYYY-MM-DD) *"
                  value={formBookingDate}
                  onChangeText={setFormBookingDate}
                />
                <TextInput
                  style={[styles.dialogInput, { height: 60 }]}
                  placeholder="Notes / Scope..."
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
                    <Text style={styles.dialogConfirmText}>Save Holiday</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : actionType === 'create_quota' ? (
              /* 14. CREATE QUOTA */
              <View>
                <Text style={styles.dialogTitle}>Add Student Quota</Text>
                <Text style={styles.dialogSub}>Define admission quota category</Text>
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Quota Name * (e.g. Convener Quota)"
                  value={formTitle}
                  onChangeText={setFormTitle}
                />
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Quota Code * (e.g. CQ)"
                  value={formCode}
                  onChangeText={setFormCode}
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
                    <Text style={styles.dialogConfirmText}>Save Quota</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : actionType === 'create_caste_category' ? (
              /* 15. CREATE CASTE CATEGORY */
              <View>
                <Text style={styles.dialogTitle}>Add Caste Category</Text>
                <Text style={styles.dialogSub}>Register reservation category (e.g. BC-A, SC, ST)</Text>
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Category Name * (e.g. BC-E)"
                  value={formTitle}
                  onChangeText={setFormTitle}
                />
                <View style={styles.dialogBtnRow}>
                  <TouchableOpacity
                    style={styles.dialogCancelBtn}
                    onPress={() => setActionModalVisible(false)}
                  >
                    <Text style={styles.dialogCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dialogConfirmBtn} onPress={handleSaveForm}>
                    <Text style={styles.dialogConfirmText}>Save Category</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : actionType === 'create_caste' ? (
              /* 16. CREATE CASTE */
              <View>
                <Text style={styles.dialogTitle}>Add Sub-Caste</Text>
                <Text style={styles.dialogSub}>
                  Add caste under {actionTargetItem?.name || 'Category'}
                </Text>
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Caste Name * (e.g. Kapu, Reddy, Kamma, etc.)"
                  value={formTitle}
                  onChangeText={setFormTitle}
                />
                <View style={styles.dialogBtnRow}>
                  <TouchableOpacity
                    style={styles.dialogCancelBtn}
                    onPress={() => setActionModalVisible(false)}
                  >
                    <Text style={styles.dialogCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dialogConfirmBtn} onPress={handleSaveForm}>
                    <Text style={styles.dialogConfirmText}>Save Caste</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : actionType === 'create_campus' ? (
              /* 17. CREATE CAMPUS */
              <View>
                <Text style={styles.dialogTitle}>Add Campus Location</Text>
                <Text style={styles.dialogSub}>Register a physical university campus</Text>
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Campus Name * (e.g. Kakinada City Campus)"
                  value={formTitle}
                  onChangeText={setFormTitle}
                />
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Location (e.g. Main Road, Kakinada)"
                  value={formHallLocation}
                  onChangeText={setFormHallLocation}
                />
                <TextInput
                  style={[styles.dialogInput, { height: 60 }]}
                  placeholder="Description..."
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
                    <Text style={styles.dialogConfirmText}>Save Campus</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : actionType === 'set_semester_dates' ? (
              /* 18. SET SEMESTER DATES */
              <View>
                <Text style={styles.dialogTitle}>Academic Semester Schedule</Text>
                <Text style={styles.dialogSub}>
                  {actionTargetItem?.course_name || 'Program'} - Sem {actionTargetItem?.semester_number || '1'}
                </Text>
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="Start Date (YYYY-MM-DD)"
                  value={formStartDate}
                  onChangeText={setFormStartDate}
                />
                <TextInput
                  style={styles.dialogSingleInput}
                  placeholder="End Date (YYYY-MM-DD)"
                  value={formEndDate}
                  onChangeText={setFormEndDate}
                />
                <View style={styles.dialogBtnRow}>
                  <TouchableOpacity
                    style={styles.dialogCancelBtn}
                    onPress={() => setActionModalVisible(false)}
                  >
                    <Text style={styles.dialogCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dialogConfirmBtn} onPress={handleSaveForm}>
                    <Text style={styles.dialogConfirmText}>Save Dates</Text>
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
  // SDMS SETTINGS FULL CONSOLE STYLES
  settingsContainer: {
    paddingBottom: 24,
  },
  settingsCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  settingsNavCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsNavCardActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingsCardIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsNavCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  settingsNavCardTitleActive: {
    color: '#1E3A8A',
    fontWeight: '800',
  },
  settingsNavCardSub: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 1,
  },
  settingsSummaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  settingsSummaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  settingsSummaryLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  settingsSummaryVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  settingsSectionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 12,
  },
  settingsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  settingsSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  settingsAddBtn: {
    backgroundColor: '#1E3A8A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  settingsAddBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  settingsColCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
    marginBottom: 6,
  },
  settingsColCardActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  colDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  settingsColTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  settingsColCode: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  settingsBatchInputRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  settingsBatchInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: '#0F172A',
  },
  settingsBatchAddBtn: {
    backgroundColor: '#059669',
    width: 36,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsBatchChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  settingsBatchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  settingsBatchChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  settingsCourseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
    marginBottom: 6,
  },
  settingsCourseCardActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#FAF5FF',
  },
  settingsCourseTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  settingsCourseMeta: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  settingsBranchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  settingsBranchChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  settingsHolidayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  settingsHolidayDate: {
    backgroundColor: '#EEF2FF',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  settingsHolidayTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  settingsHolidaySub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  settingsLayoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingsLayoutLabel: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  settingsQrRoleChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  settingsQrRoleChipActive: {
    borderColor: '#0D9488',
    backgroundColor: '#0D9488',
  },
  settingsQrRoleChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  settingsQrRoleChipTextActive: {
    color: '#FFFFFF',
  },
  settingsTransferPickerRow: {
    marginBottom: 6,
  },
  settingsTransferPickerCol: {
    marginBottom: 6,
  },
  settingsTransferPickerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  settingsSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  settingsSaveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
