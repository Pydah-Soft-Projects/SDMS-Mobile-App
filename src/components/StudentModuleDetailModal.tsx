import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
  Platform,
  StatusBar as RNStatusBar,
  TextInput,
} from 'react-native';
import {
  X,
  ArrowLeft,
  Clock,
  BookOpen,
  Award,
  FileText,
  Calendar,
  CreditCard,
  Bus,
  Users,
  MessageSquare,
  Ticket,
  Briefcase,
  ShieldCheck,
  Download,
  ExternalLink,
  ChevronRight,
  Inbox,
  Sparkles,
  CheckCircle2,
  FolderOpen,
  Plus,
  RefreshCw,
  Star,
  Eye,
  MapPin,
  RotateCcw,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import api, { getStaticFileUrl } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import logger from '../utils/logger';
import studentService from '../services/studentService';

export interface StudentModuleItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'academics' | 'finance' | 'campus' | 'support';
  iconName: string;
  badge?: string;
}

export interface StudentModuleViewProps {
  module: StudentModuleItem;
  onBack?: () => void;
}

interface StudentModuleDetailModalProps {
  visible: boolean;
  module: StudentModuleItem | null;
  onClose: () => void;
}

export const StudentModuleView: React.FC<StudentModuleViewProps> = ({
  module,
  onBack,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? RNStatusBar.currentHeight || 24 : 0,
    16
  );
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };
  const { user } = useAuth();
  const student = user as any;
  const admissionNo = student?.admission_number || student?.pin_no || '';

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [servicePurpose, setServicePurpose] = useState('');
  const [submittingServiceRequest, setSubmittingServiceRequest] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<any>(null);
  const [borrowPurpose, setBorrowPurpose] = useState('');
  const [borrowReturnDate, setBorrowReturnDate] = useState('');
  const [submittingBorrowRequest, setSubmittingBorrowRequest] = useState(false);
  const [joiningClubId, setJoiningClubId] = useState<number | string | null>(null);
  const [complaintCategories, setComplaintCategories] = useState<any[]>([]);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintForm, setComplaintForm] = useState({
    category_id: '',
    sub_category_id: '',
    title: '',
    description: '',
    block_no: '',
    room_no: '',
  });
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [complaintFilter, setComplaintFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [refreshingComplaints, setRefreshingComplaints] = useState(false);
  const [reopeningTicketId, setReopeningTicketId] = useState<number | string | null>(null);
  const [selectedTicketForDetails, setSelectedTicketForDetails] = useState<any | null>(null);
  const [showTicketDetailsModal, setShowTicketDetailsModal] = useState(false);
  const [selectedTicketForFeedback, setSelectedTicketForFeedback] = useState<any | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const handleRefreshComplaints = async () => {
    try {
      setRefreshingComplaints(true);
      const [ticketsRes, catsRes] = await Promise.all([
        api.get('/tickets/student/my-tickets').catch(() => ({ data: { data: [] } })),
        api.get('/complaint-categories/active').catch(() => ({ data: { data: [] } })),
      ]);
      setData(ticketsRes.data?.data || ticketsRes.data?.tickets || []);
      setComplaintCategories(catsRes.data?.data || []);
    } catch (_) {
      // silently proceed
    } finally {
      setRefreshingComplaints(false);
    }
  };

  const handleReopenComplaint = (ticketItem: any) => {
    if (!ticketItem?.id) return;
    const ticketIdLabel = ticketItem.complaint_number || ticketItem.ticket_number || ticketItem.id;
    Alert.alert(
      'Re-Raise Complaint',
      `Are you sure you want to re-raise complaint #${ticketIdLabel}? The campus maintenance team will reopen it as pending.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Re-Raise',
          style: 'destructive',
          onPress: async () => {
            try {
              setReopeningTicketId(ticketItem.id);
              await api.post(`/tickets/${ticketItem.id}/reopen`);
              Alert.alert('Complaint Reopened', 'The complaint status has been changed back to pending.');
              await handleRefreshComplaints();
              if (selectedTicketForDetails?.id === ticketItem.id) {
                setShowTicketDetailsModal(false);
                setSelectedTicketForDetails(null);
              }
            } catch (err: any) {
              Alert.alert('Reopen Error', err.response?.data?.message || 'Failed to reopen complaint.');
            } finally {
              setReopeningTicketId(null);
            }
          }
        }
      ]
    );
  };

  const handleOpenFeedback = (ticketItem: any) => {
    setSelectedTicketForFeedback(ticketItem);
    setFeedbackRating(5);
    setFeedbackText('');
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = async () => {
    if (!selectedTicketForFeedback?.id) return;
    try {
      setSubmittingFeedback(true);
      await api.post(`/tickets/${selectedTicketForFeedback.id}/feedback`, {
        rating: feedbackRating,
        feedback_text: feedbackText.trim() || undefined,
      });
      Alert.alert('Thank You', 'Your feedback has been submitted successfully.');
      setShowFeedbackModal(false);
      setSelectedTicketForFeedback(null);
      if (selectedTicketForDetails?.id === selectedTicketForFeedback.id) {
        setShowTicketDetailsModal(false);
        setSelectedTicketForDetails(null);
      }
      await handleRefreshComplaints();
    } catch (err: any) {
      Alert.alert('Feedback Error', err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleSubmitComplaint = async () => {
    if (!complaintForm.category_id) {
      Alert.alert('Category Required', 'Please select a complaint category.');
      return;
    }
    if (!complaintForm.title.trim()) {
      Alert.alert('Subject Required', 'Please enter a brief complaint subject or title.');
      return;
    }

    try {
      setSubmittingComplaint(true);
      await api.post('/tickets', {
        category_id: complaintForm.category_id,
        sub_category_id: complaintForm.sub_category_id || undefined,
        title: complaintForm.title.trim(),
        description: complaintForm.description.trim() || undefined,
        block_no: complaintForm.block_no.trim() || undefined,
        room_no: complaintForm.room_no.trim() || undefined,
      });

      Alert.alert('Complaint Submitted', 'Your maintenance complaint has been logged and assigned.');
      setShowComplaintModal(false);
      setComplaintForm({
        category_id: '',
        sub_category_id: '',
        title: '',
        description: '',
        block_no: '',
        room_no: '',
      });

      const res = await api.get('/tickets/student/my-tickets');
      setData(res.data?.data || res.data?.tickets || []);
    } catch (err: any) {
      Alert.alert('Submission Error', err.response?.data?.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const course = student?.course || student?.course_name || '';
  const branch = student?.branch || student?.branch_name || '';
  const semester = student?.current_semester || '';
  const section = student?.section || '';
  const batch = student?.batch || '';
  const quota = student?.quota || student?.stud_type || '';

  const submitServiceRequest = async () => {
    const purpose = servicePurpose.trim();
    if (!selectedService || !purpose) {
      Alert.alert('Purpose required', 'Please enter why you need this service.');
      return;
    }

    setSubmittingServiceRequest(true);
    try {
      await api.post('/services/requests', {
        service_id: selectedService.id,
        purpose,
      });
      setData((current: any) => ({
        ...current,
        requests: [
          {
            service_name: selectedService.name || selectedService.title,
            purpose,
            status: 'pending',
            created_at: new Date().toISOString(),
          },
          ...(current?.requests || []),
        ],
      }));
      setSelectedService(null);
      setServicePurpose('');
      Alert.alert('Request submitted', 'Your service request has been submitted.');
    } catch (error: any) {
      logger.error('MODULE_DETAIL', 'Failed to submit student service request', error.message);
      Alert.alert(
        'Request failed',
        error.response?.data?.message || 'Unable to submit the service request. Please try again.'
      );
    } finally {
      setSubmittingServiceRequest(false);
    }
  };

  const submitBorrowRequest = async () => {
    const purpose = borrowPurpose.trim();
    const returnDate = borrowReturnDate.trim();
    if (!selectedCertificate || !purpose || !returnDate) {
      Alert.alert('Details required', 'Enter a purpose and return date to continue.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(returnDate)) {
      Alert.alert('Invalid date', 'Use YYYY-MM-DD for the return date.');
      return;
    }

    setSubmittingBorrowRequest(true);
    try {
      await api.post('/certificate-borrow/student/request', {
        admissionNumber: admissionNo,
        certificateKey: selectedCertificate.key,
        certificateName: selectedCertificate.name,
        purpose,
        returnDate,
      });
      setData((current: any) => ({
        ...current,
        history: [
          {
            certificate_name: selectedCertificate.name,
            certificate_key: selectedCertificate.key,
            status: 'pending',
            purpose,
            expected_return_date: returnDate,
          },
          ...(current?.history || []),
        ],
      }));
      setSelectedCertificate(null);
      setBorrowPurpose('');
      setBorrowReturnDate('');
      Alert.alert('Request submitted', 'Your original-certificate request has been submitted.');
    } catch (error: any) {
      logger.error('MODULE_DETAIL', 'Failed to submit certificate request', error.message);
      Alert.alert(
        'Request failed',
        error.response?.data?.message || 'Unable to submit the certificate request. Please try again.'
      );
    } finally {
      setSubmittingBorrowRequest(false);
    }
  };

  const joinClub = async (club: any) => {
    setJoiningClubId(club.id);
    try {
      const response = await studentService.joinClub(club.id);
      setData((current: any[]) =>
        current.map((item) =>
          item.id === club.id
            ? { ...item, userStatus: response?.status || response?.data?.status || 'pending' }
            : item
        )
      );
      Alert.alert('Request submitted', `Your request to join ${club.name || club.club_name || 'this club'} has been submitted.`);
    } catch (error: any) {
      logger.error('MODULE_DETAIL', 'Failed to submit club membership request', error.message);
      Alert.alert(
        'Request failed',
        error.response?.data?.message || 'Unable to submit the membership request. Please try again.'
      );
    } finally {
      setJoiningClubId(null);
    }
  };

  useEffect(() => {
    if (!module) {
      setData(null);
      return;
    }

    const fetchModuleData = async () => {
      setLoading(true);
      try {
        if (module.id === 'timetable') {
          const branchCode = student?.branch || student?.branch_name;
          const currentYear = student?.current_year || 1;
          const currentSem = student?.current_semester || 1;
          const branchId = student?.branch_id;
          const res = await api
            .get('/timetable/my-timetable', {
              params: {
                branch: branchCode,
                year: currentYear,
                semester: currentSem,
                branch_id: branchId,
              },
            })
            .catch(() =>
              api.get('/timetable', {
                params: {
                  branch: branchCode,
                  year: currentYear,
                  semester: currentSem,
                  branch_id: branchId,
                },
              })
            );
          setData(res.data?.data || res.data?.timetable || []);
        } else if (module.id === 'events') {
          const res = await api.get('/events/student');
          setData(res.data?.data || res.data?.events || []);
        } else if (module.id === 'semester-registration') {
          const [studRes, schRes] = await Promise.all([
            api.get(`/students/${admissionNo}`).catch(() => null),
            api.get(`/student-scholarship/${encodeURIComponent(admissionNo)}`).catch(() => null),
          ]);
          setData({
            student: studRes?.data?.data || studRes?.data?.student || student,
            scholarship: schRes?.data?.data || null,
          });
        } else if (module.id === 'scholarship') {
          const res = await api.get(`/student-scholarship/${encodeURIComponent(admissionNo)}`);
          setData(res.data?.data || null);
        } else if (module.id === 'services') {
          const [reqRes, listRes] = await Promise.all([
            api.get('/services/requests').catch(() => ({ data: { data: [] } })),
            api.get('/services').catch(() => ({ data: { data: [] } })),
          ]);
          setData({
            requests: reqRes.data?.data || reqRes.data?.requests || [],
            availableServices: listRes.data?.data || listRes.data || [],
          });
        } else if (module.id === 'my-documents') {
          const [submittedRes, historyRes] = await Promise.all([
            api.get(`/certificate-borrow/student/submitted-certificates/${encodeURIComponent(admissionNo)}`).catch(() => ({ data: { data: [] } })),
            api.get(`/certificate-borrow/student/history/${encodeURIComponent(admissionNo)}`).catch(() => ({ data: { data: [] } })),
          ]);
          setData({
            submitted: submittedRes.data?.data || submittedRes.data?.certificates || [],
            history: historyRes.data?.data || [],
          });
        } else if (module.id === 'library') {
          const res = await api.get('/library/books').catch(() => ({ data: { data: [] } }));
          setData(res.data?.data || res.data?.books || []);
        } else if (module.id === 'transport') {
          const res = await api
            .get(`/transport/my-details?admission_number=${encodeURIComponent(admissionNo)}`)
            .catch(() => api.get('/transport/my-details'));
          setData(res.data || null);
        } else if (module.id === 'clubs') {
          const res = await api.get('/clubs');
          setData(res.data?.data || res.data?.clubs || []);
        } else if (module.id === 'feedback') {
          const res = await api.get('/student-feedback/publications');
          setData(res.data?.data || res.data?.publications || []);
        } else if (module.id === 'my-tickets') {
          const [ticketsRes, catsRes] = await Promise.all([
            api.get('/tickets/student/my-tickets').catch(() => ({ data: { data: [] } })),
            api.get('/complaint-categories/active').catch(() => ({ data: { data: [] } })),
          ]);
          setData(ticketsRes.data?.data || ticketsRes.data?.tickets || []);
          setComplaintCategories(catsRes.data?.data || []);
        } else if (module.id === 'internship') {
          const [assignRes, statusRes] = await Promise.all([
            api.get('/internship/my-assignment').catch(() => null),
            api.get('/internship/status').catch(() => null),
          ]);
          setData({
            assignment: assignRes?.data?.assignment || null,
            status: statusRes?.data?.status || null,
            attendanceWindows: assignRes?.data?.attendanceWindows || statusRes?.data?.attendanceWindows || null,
          });
        } else if (module.id === 'crt') {
          const ssoRes = await api.get('/auth/crt-sso').catch(() => null);
          setData({
            ssoUrl: ssoRes?.data?.url || 'https://crt.pydahsoft.in',
          });
        } else if (module.id === 'fees') {
          const feeRes = await studentService.getFeeDetails(admissionNo);
          setData(feeRes);
        } else if (module.id === 'attendance') {
          const attRes = await studentService.getAttendance();
          setData(attRes);
        } else if (module.id === 'announcements') {
          const notRes = await studentService.getAnnouncements();
          setData(notRes);
        } else if (module.id === 'ai-assistant') {
          setData({ active: true });
        }
      } catch (err: any) {
        logger.warn('MODULE_DETAIL', `Failed to fetch live data for ${module.id}: ${err.message}`);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchModuleData();
  }, [module?.id, admissionNo]);

  if (!module) return null;

  return (
    <View style={[styles.container, { paddingTop: topInset + 6, paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={10}>
            <ArrowLeft size={22} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.headerTitleRow}>
            <View style={styles.iconCircle}>
              <BookOpen size={20} color="#1E3A8A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{module.title}</Text>
              <Text style={styles.subtitle}>{module.subtitle}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleBack} style={styles.closeBtn} hitSlop={10}>
            <X size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Student Context Ribbon */}
        <View style={styles.enrolledScopeCard}>
          <Text style={styles.enrolledScopeDetail}>
            {course ? `${course} - ${branch}` : 'Student Record'}
            {semester ? ` • Sem ${semester}` : ''}
            {section ? ` (Sec ${section})` : ''}
          </Text>
          <View style={styles.enrolledPillRow}>
            {batch ? <Text style={styles.scopeMiniPill}>Batch {batch}</Text> : null}
            {quota ? <Text style={styles.scopeMiniPill}>Quota: {quota}</Text> : null}
            <Text style={[styles.scopeMiniPill, { backgroundColor: '#EFF6FF', color: '#1D4ED8' }]}>
              PIN: {student?.pin_no || admissionNo || 'N/A'}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#1E3A8A" />
            <Text style={styles.loaderText}>Syncing records with SDMS...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) + 24 }]} showsVerticalScrollIndicator={false}>
            {/* 1. Timetable View */}
            {module.id === 'timetable' && (
              <View style={styles.section}>
                {Array.isArray(data) && data.length > 0 ? (
                  data.map((item: any, idx: number) => (
                    <View key={item.id || idx} style={styles.card}>
                      <View style={styles.cardBannerWrapper}>
                        <Image
                          source={
                            item.image_url || item.banner_image
                              ? { uri: getStaticFileUrl(item.image_url || item.banner_image) }
                              : require('../../assets/pydah-logo.png')
                          }
                          style={styles.cardBannerImg}
                          resizeMode="cover"
                        />
                      </View>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHighlight}>{item.day_of_week || 'SCHEDULE'}</Text>
                        <Text style={styles.cardTime}>Period {item.period_slot_id || item.slot_name || idx + 1}</Text>
                      </View>
                      <Text style={styles.cardTitle}>{item.subject_name || item.subject_code || 'Academic Session'}</Text>
                      <View style={styles.cardFooter}>
                        <Text style={styles.cardSub}>
                          {item.faculty_name ? `Faculty: ${item.faculty_name}` : 'Department Faculty'}
                        </Text>
                        {item.room_number ? <Text style={styles.roomTag}>Room {item.room_number}</Text> : null}
                      </View>
                      {item.start_time && item.end_time ? (
                        <Text style={styles.timeScheduleText}>
                          {item.start_time} - {item.end_time}
                        </Text>
                      ) : null}
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyCard}>
                    <Inbox size={28} color="#94A3B8" />
                    <Text style={styles.emptyTitle}>No Timetable Published</Text>
                    <Text style={styles.emptySub}>
                      No class timetable schedule has been published for {branch || 'your branch'} Semester {semester || 'term'} yet.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* 2. Events & Academic Calendar */}
            {module.id === 'events' && (
              <View style={styles.section}>
                {Array.isArray(data) && data.length > 0 ? (
                  data.map((item: any, idx: number) => (
                    <View key={item.id || idx} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <View style={styles.pillBadge}>
                          <Text style={styles.pillBadgeText}>{(item.event_type || 'Event').toUpperCase()}</Text>
                        </View>
                      </View>
                      <Text style={styles.cardSub}>
                        {item.event_date ? new Date(item.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Scheduled'}
                        {item.start_time ? ` • ${item.start_time}` : ''}
                      </Text>
                      {item.description ? <Text style={styles.descText}>{item.description}</Text> : null}
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyCard}>
                    <Calendar size={28} color="#94A3B8" />
                    <Text style={styles.emptyTitle}>No Upcoming Events</Text>
                    <Text style={styles.emptySub}>No institution or department events scheduled at this time.</Text>
                  </View>
                )}
              </View>
            )}

            {/* 3. Semester Registration Details */}
            {module.id === 'semester-registration' && (
              <View style={styles.section}>
                {data?.student ? (
                  <>
                    <View style={styles.card}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Academic Enrollment Record</Text>
                        <View style={[styles.pillBadge, { backgroundColor: '#DCFCE7' }]}>
                          <Text style={[styles.pillBadgeText, { color: '#15803D' }]}>
                            {(data.student.registration_status || 'Completed').toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Student Name:</Text>
                        <Text style={styles.infoVal}>{data.student.student_name || student?.name || 'On File'}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Admission No:</Text>
                        <Text style={styles.infoVal}>{data.student.admission_number || admissionNo}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Branch & Term:</Text>
                        <Text style={styles.infoVal}>
                          {data.student.branch || branch} • Sem {data.student.current_semester || semester}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Enrollment Quota:</Text>
                        <Text style={styles.infoVal}>{data.student.stud_type || quota || 'CONV'}</Text>
                      </View>
                    </View>

                    {data?.scholarship && (
                      <View style={styles.card}>
                        <Text style={styles.cardTitle}>Registration Stage Verification</Text>
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Scholarship Quota:</Text>
                          <Text style={[styles.infoVal, { color: '#15803D' }]}>
                            {data.scholarship.student?.scholar_status || 'Eligible'}
                          </Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Linked JVD Years:</Text>
                          <Text style={styles.infoVal}>
                            {data.scholarship.years?.length || 0} Academic Year(s) Registered
                          </Text>
                        </View>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.emptyCard}>
                    <ShieldCheck size={28} color="#94A3B8" />
                    <Text style={styles.emptyTitle}>Registration Status Regular</Text>
                    <Text style={styles.emptySub}>Active registered student record for admission #{admissionNo}.</Text>
                  </View>
                )}
              </View>
            )}

            {/* 4. Scholarship (JVD / RTF Live Data) */}
            {module.id === 'scholarship' && (
              <View style={styles.section}>
                {data && Array.isArray(data.years) && data.years.length > 0 ? (
                  <>
                    {/* Student Scholarship Overview Card */}
                    <View style={styles.card}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Jagananna Vidya Deevena (JVD)</Text>
                        <View style={[styles.pillBadge, { backgroundColor: '#DCFCE7' }]}>
                          <Text style={[styles.pillBadgeText, { color: '#15803D' }]}>
                            {(data.student?.scholar_status || 'ELIGIBLE').toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Admission No:</Text>
                        <Text style={styles.infoVal}>{data.student?.admission_number || admissionNo}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Student Name:</Text>
                        <Text style={styles.infoVal}>{data.student?.student_name || student?.name}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Admitted Quota:</Text>
                        <Text style={styles.infoVal}>{data.student?.stud_type || quota || 'CONV'}</Text>
                      </View>
                      {data.student?.caste ? (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Social Category:</Text>
                          <Text style={styles.infoVal}>{data.student.caste}</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Academic Year Applications */}
                    {data.years.map((year: any, yIdx: number) => (
                      <View key={year.id || year.student_year || yIdx} style={styles.card}>
                        <View style={styles.cardHeader}>
                          <Text style={styles.cardTitle}>
                            Year {year.student_year} ({year.academic_year_label || 'AY'})
                          </Text>
                          <View
                            style={[
                              styles.pillBadge,
                              {
                                backgroundColor:
                                  year.eligible === 'eligible'
                                    ? '#DCFCE7'
                                    : year.eligible === 'not_eligible'
                                    ? '#FEE2E2'
                                    : '#FEF3C7',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.pillBadgeText,
                                {
                                  color:
                                    year.eligible === 'eligible'
                                      ? '#15803D'
                                      : year.eligible === 'not_eligible'
                                      ? '#B91C1C'
                                      : '#B45309',
                                },
                              ]}
                            >
                              {(year.eligible || 'PENDING').toUpperCase()}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>JVD Application ID:</Text>
                          <Text style={[styles.infoVal, { fontWeight: '700', color: '#1E3A8A' }]}>
                            {year.application_id || 'Not Assigned'}
                          </Text>
                        </View>

                        {year.sanctioned_amount !== undefined && year.sanctioned_amount !== null ? (
                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Sanctioned Amount:</Text>
                            <Text style={[styles.infoVal, { color: '#059669', fontWeight: '700' }]}>
                              ₹{Number(year.sanctioned_amount).toLocaleString('en-IN')}
                            </Text>
                          </View>
                        ) : null}

                        {/* Releases / Installments */}
                        {Array.isArray(year.releases) && year.releases.length > 0 ? (
                          <View style={{ marginTop: 10 }}>
                            <Text style={styles.subSectionLabel}>Released Transactions</Text>
                            {year.releases.map((rel: any, rIdx: number) => (
                              <View key={rel.id || rIdx} style={styles.transactionRow}>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.transTitle}>{rel.proceeding || 'Govt Proceeding'}</Text>
                                  <Text style={styles.transDate}>
                                    {rel.from_date ? `Period: ${rel.from_date} to ${rel.to_date || 'Current'}` : 'RTF Release'}
                                  </Text>
                                </View>
                                <Text style={styles.transAmount}>
                                  ₹{Number(rel.released_amount || rel.paid_amount || 0).toLocaleString('en-IN')}
                                </Text>
                              </View>
                            ))}
                          </View>
                        ) : null}

                        {/* Semesters */}
                        {Array.isArray(year.semesters) && year.semesters.length > 0 ? (
                          <View style={styles.semesterRow}>
                            {year.semesters.map((s: any, sIdx: number) => (
                              <View key={sIdx} style={styles.semPill}>
                                <Text style={styles.semPillText}>
                                  Sem {s.student_semester}: {(s.eligible || 'Eligible').toUpperCase()}
                                  {s.fee_paid ? ' • Paid' : ''}
                                </Text>
                              </View>
                            ))}
                          </View>
                        ) : null}
                      </View>
                    ))}
                  </>
                ) : (
                  <View style={styles.emptyCard}>
                    <Award size={28} color="#94A3B8" />
                    <Text style={styles.emptyTitle}>No Scholarship Record</Text>
                    <Text style={styles.emptySub}>
                      No government JVD/RTF application details recorded for admission #{admissionNo}.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* 5. Student Services & Certificate Requests */}
            {module.id === 'services' && (
              <View style={styles.section}>
                {data?.requests && Array.isArray(data.requests) && data.requests.length > 0 ? (
                  <>
                    <Text style={styles.subSectionLabel}>Submitted Service Requests</Text>
                    {data.requests.map((item: any, idx: number) => (
                      <View key={item.id || idx} style={styles.card}>
                        <View style={styles.cardHeader}>
                          <Text style={styles.cardTitle}>{item.service_name || item.type || 'Certificate Request'}</Text>
                          <View style={[styles.pillBadge, { backgroundColor: '#EFF6FF' }]}>
                            <Text style={[styles.pillBadgeText, { color: '#1D4ED8' }]}>
                              {(item.status || 'SUBMITTED').toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.cardSub}>
                          Requested on: {item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN') : 'N/A'}
                        </Text>
                        {item.purpose ? <Text style={styles.descText}>Purpose: {item.purpose}</Text> : null}
                      </View>
                    ))}
                  </>
                ) : null}

                {data?.availableServices && Array.isArray(data.availableServices) && data.availableServices.length > 0 ? (
                  <>
                    <Text style={[styles.subSectionLabel, { marginTop: 12 }]}>Available Services & Certificates</Text>
                    {data.availableServices.map((svc: any, idx: number) => (
                      <View key={svc.id || idx} style={styles.card}>
                        <View style={styles.cardHeader}>
                          <Text style={styles.cardTitle}>{svc.name || svc.title}</Text>
                          {svc.fee ? (
                            <Text style={styles.cardHighlight}>₹{svc.fee}</Text>
                          ) : (
                            <Text style={[styles.cardHighlight, { color: '#15803D' }]}>Free</Text>
                          )}
                        </View>
                        <Text style={styles.cardSub}>{svc.description || 'Standard institutional certificate service.'}</Text>
                        <TouchableOpacity
                          style={styles.moduleActionButton}
                          onPress={() => setSelectedService(svc)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.moduleActionButtonText}>Initiate Request</Text>
                          <ChevronRight size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </>
                ) : null}

                {(!data?.requests || data.requests.length === 0) &&
                (!data?.availableServices || data.availableServices.length === 0) ? (
                  <View style={styles.emptyCard}>
                    <FileText size={28} color="#94A3B8" />
                    <Text style={styles.emptyTitle}>No Service Requests</Text>
                    <Text style={styles.emptySub}>
                      No certificate requests (Bonafide, Study, Custodian) submitted for your account.
                    </Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* 6. Document Vault */}
            {module.id === 'my-documents' && (
              <View style={styles.section}>
                {data?.submitted && Array.isArray(data.submitted) && data.submitted.length > 0 ? (
                  <>
                    <Text style={styles.subSectionLabel}>Original Certificates in Custody</Text>
                    {data.submitted.map((item: any, idx: number) => (
                      <View key={item.id || idx} style={styles.card}>
                        <View style={styles.cardHeader}>
                          <Text style={styles.cardTitle}>{item.certificate_name || item.name || 'Certificate'}</Text>
                          <View style={[styles.pillBadge, { backgroundColor: '#DCFCE7' }]}>
                            <Text style={[styles.pillBadgeText, { color: '#15803D' }]}>IN CUSTODY</Text>
                          </View>
                        </View>
                        <Text style={styles.cardSub}>
                          {item.certificate_number ? `Doc No: ${item.certificate_number}` : 'Verified & Registered'}
                        </Text>
                        {(() => {
                          const certificateKey =
                            item.certificate_key || item.certificateKey || item.key ||
                            item.certificate_name || item.name;
                          const certificateName = item.certificate_name || item.name || 'Certificate';
                          const hasActiveRequest = (data.history || []).some(
                            (request: any) =>
                              String(request.certificate_key || request.certificateKey || '') === String(certificateKey) &&
                              ['pending', 'approved', 'issued'].includes(String(request.status || '').toLowerCase())
                          );

                          return (
                            <TouchableOpacity
                              style={[
                                styles.moduleActionButton,
                                hasActiveRequest && styles.moduleActionButtonDisabled,
                              ]}
                              onPress={() =>
                                setSelectedCertificate({ key: certificateKey, name: certificateName })
                              }
                              disabled={hasActiveRequest}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.moduleActionButtonText}>
                                {hasActiveRequest ? 'Request In Progress' : 'Request Original'}
                              </Text>
                              {!hasActiveRequest && <ChevronRight size={16} color="#FFFFFF" />}
                            </TouchableOpacity>
                          );
                        })()}
                      </View>
                    ))}
                  </>
                ) : null}

                {data?.history && Array.isArray(data.history) && data.history.length > 0 ? (
                  <>
                    <Text style={[styles.subSectionLabel, { marginTop: 12 }]}>Borrow & Return History</Text>
                    {data.history.map((h: any, idx: number) => (
                      <View key={h.id || idx} style={styles.card}>
                        <Text style={styles.cardTitle}>{h.certificate_name}</Text>
                        <Text style={styles.cardSub}>
                          Borrowed: {h.borrowed_date || 'N/A'} • Return Due: {h.expected_return_date || 'N/A'}
                        </Text>
                      </View>
                    ))}
                  </>
                ) : null}

                {(!data?.submitted || data.submitted.length === 0) &&
                (!data?.history || data.history.length === 0) ? (
                  <View style={styles.emptyCard}>
                    <FolderOpen size={28} color="#94A3B8" />
                    <Text style={styles.emptyTitle}>No Documents in Custody</Text>
                    <Text style={styles.emptySub}>
                      No original physical certificates recorded in college custody for admission #{admissionNo}.
                    </Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* 7. Campus Library */}
            {module.id === 'library' && (
              <View style={styles.section}>
                {Array.isArray(data) && data.length > 0 ? (
                  data.slice(0, 15).map((b: any, idx: number) => (
                    <View key={b.id || idx} style={styles.card}>
                      <Text style={styles.cardTitle}>{b.title || b.book_name || 'Library Volume'}</Text>
                      <Text style={styles.cardSub}>
                        {b.author ? `Author: ${b.author}` : ''} {b.category ? `• Category: ${b.category}` : ''}
                      </Text>
                      {b.available_copies !== undefined ? (
                        <Text style={[styles.timeScheduleText, { color: '#15803D' }]}>
                          Available Copies: {b.available_copies}
                        </Text>
                      ) : null}
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyCard}>
                    <BookOpen size={28} color="#94A3B8" />
                    <Text style={styles.emptyTitle}>No Library Books Found</Text>
                    <Text style={styles.emptySub}>No books or volumes currently issued to your PIN.</Text>
                  </View>
                )}
              </View>
            )}

            {/* 8. Transport Details */}
            {module.id === 'transport' && (
              <View style={styles.section}>
                {data && (data.hasActivePass || data.activePass) ? (
                  <View style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>College Bus Allocation</Text>
                      <View style={[styles.pillBadge, { backgroundColor: '#DCFCE7' }]}>
                        <Text style={[styles.pillBadgeText, { color: '#15803D' }]}>ACTIVE PASS</Text>
                      </View>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Route:</Text>
                      <Text style={styles.infoVal}>
                        {data.activePass?.route_name || data.route?.route_name || 'Designated Route'}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Bus Number:</Text>
                      <Text style={styles.infoVal}>
                        {data.activePass?.bus_number || data.bus?.bus_number || 'Campus Bus'}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Boarding Stop:</Text>
                      <Text style={styles.infoVal}>
                        {data.activePass?.stop_name || data.stop?.stop_name || 'Scheduled Stop'}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Schedule:</Text>
                      <Text style={styles.infoVal}>Morning: 07:30 AM • Evening: 04:30 PM</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyCard}>
                    <Bus size={28} color="#94A3B8" />
                    <Text style={styles.emptyTitle}>No Active Bus Pass</Text>
                    <Text style={styles.emptySub}>
                      No active bus pass or route allocation found for admission #{admissionNo}.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* 9. Student Clubs */}
            {module.id === 'clubs' && (
              <View style={styles.section}>
                {Array.isArray(data) && data.length > 0 ? (
                  data.map((item: any, idx: number) => (
                    <View key={item.id || idx} style={styles.card}>
                      <View style={styles.cardBannerWrapper}>
                        <Image
                          source={
                            item.image_url || item.image || item.club_image
                              ? { uri: getStaticFileUrl(item.image_url || item.image || item.club_image) }
                              : (item.has_image || item.id)
                              ? { uri: getStaticFileUrl(`/api/clubs/${item.id}/image`) }
                              : require('../../assets/pydah-logo.png')
                          }
                          style={styles.cardBannerImg}
                          resizeMode="cover"
                        />
                      </View>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>{item.name || item.club_name || 'Student Club'}</Text>
                        <View
                          style={[
                            styles.pillBadge,
                            {
                              backgroundColor:
                                item.userStatus === 'approved'
                                  ? '#DCFCE7'
                                  : item.userStatus === 'pending'
                                  ? '#FEF3C7'
                                  : '#EFF6FF',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.pillBadgeText,
                              {
                                color:
                                  item.userStatus === 'approved'
                                    ? '#15803D'
                                    : item.userStatus === 'pending'
                                    ? '#B45309'
                                    : '#1D4ED8',
                              },
                            ]}
                          >
                            {item.userStatus === 'approved'
                              ? 'ACTIVE MEMBER'
                              : item.userStatus === 'pending'
                              ? 'PENDING APPROVAL'
                              : 'EXPLORE CLUB'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.cardSub}>{item.description || 'Active campus student association.'}</Text>
                      <View style={styles.cardFooter}>
                        <Text style={styles.cardSub}>Members: {item.memberCount || 0}</Text>
                        <Text style={styles.roomTag}>
                          {Number(item.membership_fee) > 0 ? `₹${item.membership_fee}` : 'Free'}
                        </Text>
                      </View>
                      {item.userStatus !== 'approved' && item.userStatus !== 'pending' ? (
                        <TouchableOpacity
                          style={styles.moduleActionButton}
                          onPress={() => joinClub(item)}
                          disabled={joiningClubId === item.id}
                          activeOpacity={0.8}
                        >
                          {joiningClubId === item.id ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <Text style={styles.moduleActionButtonText}>Request Membership</Text>
                              <ChevronRight size={16} color="#FFFFFF" />
                            </>
                          )}
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyCard}>
                    <Users size={28} color="#94A3B8" />
                    <Text style={styles.emptyTitle}>No Clubs Found</Text>
                    <Text style={styles.emptySub}>No registered campus clubs available at this time.</Text>
                  </View>
                )}
              </View>
            )}

            {/* 10. Feedback Surveys */}
            {module.id === 'feedback' && (
              <View style={styles.section}>
                {Array.isArray(data) && data.length > 0 ? (
                  data.map((item: any, idx: number) => (
                    <View key={item.id || idx} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>{item.title || item.form_title || 'Faculty Feedback'}</Text>
                        <View style={[styles.pillBadge, { backgroundColor: '#FEF3C7' }]}>
                          <Text style={[styles.pillBadgeText, { color: '#B45309' }]}>
                            {item.isSubmitted ? 'COMPLETED' : 'PENDING'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.cardSub}>Academic Year: {item.academic_year || 'Current Term'}</Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyCard}>
                    <MessageSquare size={28} color="#94A3B8" />
                    <Text style={styles.emptyTitle}>No Active Feedback Surveys</Text>
                    <Text style={styles.emptySub}>No faculty evaluation surveys assigned to your section currently.</Text>
                  </View>
                )}
              </View>
            )}

            {/* 11. Support & Maintenance Tickets */}
            {module.id === 'my-tickets' && (() => {
              const complaintsList = Array.isArray(data) ? data : [];
              const pendingCount = complaintsList.filter((t: any) => t.status === 'pending').length;
              const inProgCount = complaintsList.filter((t: any) => t.status === 'approaching' || t.status === 'resolving').length;
              const completedCount = complaintsList.filter((t: any) => t.status === 'completed' || t.status === 'closed').length;

              const filteredList = complaintsList.filter((t: any) => {
                if (complaintFilter === 'all') return true;
                if (complaintFilter === 'pending') return t.status === 'pending';
                if (complaintFilter === 'in_progress') return t.status === 'approaching' || t.status === 'resolving';
                if (complaintFilter === 'completed') return t.status === 'completed' || t.status === 'closed';
                return true;
              });

              const getStatusConfig = (st: string) => {
                switch ((st || '').toLowerCase()) {
                  case 'pending':
                    return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A', label: 'Pending' };
                  case 'approaching':
                    return { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD', label: 'Assigned' };
                  case 'resolving':
                    return { bg: '#F3E8FF', text: '#6B21A8', border: '#E9D5FF', label: 'In Progress' };
                  case 'completed':
                    return { bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0', label: 'Resolved' };
                  case 'closed':
                    return { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0', label: 'Closed' };
                  default:
                    return { bg: '#F8FAFC', text: '#64748B', border: '#E2E8F0', label: st || 'Open' };
                }
              };

              return (
                <View style={styles.section}>
                  {/* Top Action Bar: Raise Complaint + Refresh */}
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        backgroundColor: '#1E3A8A',
                        borderRadius: 14,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        elevation: 2,
                        shadowColor: '#1E3A8A',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 4,
                      }}
                      onPress={() => setShowComplaintModal(true)}
                      activeOpacity={0.85}
                    >
                      <Plus size={18} color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>
                        Raise Complaint
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{
                        width: 48,
                        backgroundColor: '#F8FAFC',
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onPress={handleRefreshComplaints}
                      disabled={refreshingComplaints}
                      activeOpacity={0.7}
                    >
                      {refreshingComplaints ? (
                        <ActivityIndicator size="small" color="#1E3A8A" />
                      ) : (
                        <RefreshCw size={18} color="#1E3A8A" />
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Filter Pills Bar */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', gap: 6, paddingVertical: 2 }}>
                      {[
                        { id: 'all', label: 'All', count: complaintsList.length },
                        { id: 'pending', label: 'Pending', count: pendingCount },
                        { id: 'in_progress', label: 'In Progress', count: inProgCount },
                        { id: 'completed', label: 'Resolved', count: completedCount },
                      ].map((tab) => {
                        const active = complaintFilter === tab.id;
                        return (
                          <TouchableOpacity
                            key={tab.id}
                            onPress={() => setComplaintFilter(tab.id as any)}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 6,
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 20,
                              backgroundColor: active ? '#1E3A8A' : '#F1F5F9',
                              borderWidth: 1,
                              borderColor: active ? '#1E3A8A' : '#E2E8F0',
                            }}
                          >
                            <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#FFFFFF' : '#475569' }}>
                              {tab.label}
                            </Text>
                            <View
                              style={{
                                paddingHorizontal: 6,
                                paddingVertical: 1,
                                borderRadius: 10,
                                backgroundColor: active ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
                              }}
                            >
                              <Text style={{ fontSize: 10, fontWeight: '700', color: active ? '#FFFFFF' : '#64748B' }}>
                                {tab.count}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>

                  {/* Complaints Cards List */}
                  {filteredList.length > 0 ? (
                    filteredList.map((item: any, idx: number) => {
                      const stCfg = getStatusConfig(item.status);
                      const isCompletedOrClosed = item.status === 'completed' || item.status === 'closed';
                      const isReopeningThis = reopeningTicketId === item.id;

                      return (
                        <View key={item.id || idx} style={[styles.card, { paddingBottom: 12 }]}>
                          {/* Header: Title and Status Badge */}
                          <View style={styles.cardHeader}>
                            <Text style={[styles.cardTitle, { flex: 1, marginRight: 8 }]} numberOfLines={2}>
                              {item.title || item.subject || `Complaint #${item.id}`}
                            </Text>
                            <View
                              style={{
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderRadius: 8,
                                backgroundColor: stCfg.bg,
                                borderWidth: 1,
                                borderColor: stCfg.border,
                              }}
                            >
                              <Text style={{ fontSize: 11, fontWeight: '800', color: stCfg.text, textTransform: 'uppercase' }}>
                                {stCfg.label}
                              </Text>
                            </View>
                          </View>

                          {/* Category and Complaint Number */}
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginVertical: 4 }}>
                            {item.category_name ? (
                              <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: '#F1F5F9' }}>
                                <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>
                                  {item.category_name} {item.sub_category_name ? `• ${item.sub_category_name}` : ''}
                                </Text>
                              </View>
                            ) : null}
                            {item.complaint_number || item.ticket_number ? (
                              <Text style={{ fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: '#64748B' }}>
                                #{item.complaint_number || item.ticket_number}
                              </Text>
                            ) : null}
                          </View>

                          {/* Location (Block / Room) */}
                          {(item.block_no || item.room_no) ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginVertical: 2 }}>
                              <MapPin size={13} color="#64748B" />
                              <Text style={{ fontSize: 12, color: '#475569', fontWeight: '500' }}>
                                {item.block_no ? `Block: ${item.block_no}` : ''}
                                {(item.block_no && item.room_no) ? ' • ' : ''}
                                {item.room_no ? `Room: ${item.room_no}` : ''}
                              </Text>
                            </View>
                          ) : null}

                          {/* Description snippet */}
                          <Text style={[styles.cardSub, { marginVertical: 4 }]} numberOfLines={2}>
                            {item.description || 'Campus maintenance complaint'}
                          </Text>

                          {/* Created date */}
                          {item.created_at ? (
                            <Text style={[styles.timeScheduleText, { marginTop: 2, marginBottom: 8 }]}>
                              Raised on: {new Date(item.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                            </Text>
                          ) : null}

                          {/* Action Buttons on Complaint Card */}
                          <View
                            style={{
                              flexDirection: 'row',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                              gap: 8,
                              paddingTop: 8,
                              borderTopWidth: 1,
                              borderTopColor: '#F1F5F9',
                            }}
                          >
                            {/* View Details Button */}
                            <TouchableOpacity
                              onPress={() => {
                                setSelectedTicketForDetails(item);
                                setShowTicketDetailsModal(true);
                              }}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                borderRadius: 8,
                                backgroundColor: '#F1F5F9',
                                borderWidth: 1,
                                borderColor: '#E2E8F0',
                              }}
                            >
                              <Eye size={13} color="#334155" />
                              <Text style={{ fontSize: 11, fontWeight: '700', color: '#334155' }}>
                                View Details
                              </Text>
                            </TouchableOpacity>

                            {/* Raise Again Button (for completed or closed tickets) */}
                            {isCompletedOrClosed && (
                              <TouchableOpacity
                                onPress={() => handleReopenComplaint(item)}
                                disabled={isReopeningThis}
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 4,
                                  paddingHorizontal: 10,
                                  paddingVertical: 6,
                                  borderRadius: 8,
                                  backgroundColor: '#FEF3C7',
                                  borderWidth: 1,
                                  borderColor: '#FDE68A',
                                }}
                              >
                                {isReopeningThis ? (
                                  <ActivityIndicator size="small" color="#B45309" />
                                ) : (
                                  <RefreshCw size={13} color="#B45309" />
                                )}
                                <Text style={{ fontSize: 11, fontWeight: '700', color: '#B45309' }}>
                                  Raise Again
                                </Text>
                              </TouchableOpacity>
                            )}

                            {/* Rate Service / Feedback Button */}
                            {isCompletedOrClosed && !item.feedback && (
                              <TouchableOpacity
                                onPress={() => handleOpenFeedback(item)}
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 4,
                                  paddingHorizontal: 10,
                                  paddingVertical: 6,
                                  borderRadius: 8,
                                  backgroundColor: '#DCFCE7',
                                  borderWidth: 1,
                                  borderColor: '#BBF7D0',
                                }}
                              >
                                <Star size={13} color="#15803D" />
                                <Text style={{ fontSize: 11, fontWeight: '700', color: '#15803D' }}>
                                  Rate Service
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <View style={styles.emptyCard}>
                      <Ticket size={28} color="#94A3B8" />
                      <Text style={styles.emptyTitle}>
                        {complaintFilter === 'all' ? 'No Complaints Logged' : `No ${complaintFilter} Complaints`}
                      </Text>
                      <Text style={styles.emptySub}>
                        {complaintFilter === 'all'
                          ? 'You have not submitted any maintenance or facility complaints yet.'
                          : 'No complaints match the selected filter category.'}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })()}

            {/* 12. CRT Training Portal */}
            {module.id === 'crt' && (
              <View style={styles.section}>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Campus Recruitment Training (CRT)</Text>
                  <Text style={styles.cardSub}>
                    Institutional Single Sign-On link to official CRT training portal for coding, aptitude, and reasoning practice.
                  </Text>
                  <View style={styles.crtFeatureBox}>
                    <Text style={styles.crtFeatureText}>• Quantitative Aptitude & Analytical Reasoning</Text>
                    <Text style={styles.crtFeatureText}>• Technical Coding (Data Structures & Algorithms)</Text>
                    <Text style={styles.crtFeatureText}>• Verbal Ability, Soft Skills & Mock Assessments</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#4338CA', marginTop: 14 }]}
                    onPress={() => Linking.openURL(data?.ssoUrl || 'https://crt.pydahsoft.in')}
                  >
                    <ExternalLink size={14} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>Launch CRT Training Portal</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 13. Internship Assignment */}
            {module.id === 'internship' && (
              <View style={styles.section}>
                {data && data.assignment ? (
                  <View style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>
                        {data.assignment.company_name || data.assignment.organization || 'Industry Assignment'}
                      </Text>
                      <View style={[styles.pillBadge, { backgroundColor: '#DCFCE7' }]}>
                        <Text style={[styles.pillBadgeText, { color: '#15803D' }]}>
                          {(data.status || 'ACTIVE').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.cardSub}>
                      {data.assignment.title || data.assignment.project_title || 'Industry Internship Project'}
                    </Text>
                    {data.assignment.supervisor_name ? (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Supervisor:</Text>
                        <Text style={styles.infoVal}>{data.assignment.supervisor_name}</Text>
                      </View>
                    ) : null}
                    {data.attendanceWindows?.checkInWindow ? (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Attendance Window:</Text>
                        <Text style={styles.infoVal}>
                          {data.attendanceWindows.checkInWindow.start} - {data.attendanceWindows.checkInWindow.end} IST
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : (
                  <View style={styles.emptyCard}>
                    <Briefcase size={28} color="#94A3B8" />
                    <Text style={styles.emptyTitle}>No Active Internship</Text>
                    <Text style={styles.emptySub}>No industry internship assignment record assigned to your account.</Text>
                  </View>
                )}
              </View>
            )}

            {/* 14. AI Assistant */}
            {module.id === 'ai-assistant' && (
              <View style={styles.section}>
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Pydah AI Student Assistant</Text>
                    <Sparkles size={18} color="#7C3AED" />
                  </View>
                  <Text style={styles.cardSub}>
                    Get instant assistance for timetable questions, academic inquiries, syllabus topics, and college guidelines.
                  </Text>
                  <View style={styles.crtFeatureBox}>
                    <Text style={styles.crtFeatureText}>💬 "What are my total attendance credits this semester?"</Text>
                    <Text style={styles.crtFeatureText}>📚 "Show me the next scheduled CIE internal exam."</Text>
                    <Text style={styles.crtFeatureText}>📜 "How do I request a Bonafide Certificate?"</Text>
                  </View>
                </View>
              </View>
            )}

            {/* 15. Fee Management Details */}
            {module.id === 'fees' && (
              <View style={styles.section}>
                {data ? (
                  <>
                    <View style={styles.grid3}>
                      <View style={styles.metricCard}>
                        <Text style={styles.metricLabel}>Total Fee</Text>
                        <Text style={styles.metricVal}>₹{Number(data.totalAmount || 0).toLocaleString('en-IN')}</Text>
                      </View>
                      <View style={styles.metricCard}>
                        <Text style={styles.metricLabel}>Paid Fee</Text>
                        <Text style={[styles.metricVal, { color: '#059669' }]}>
                          ₹{Number(data.paidAmount || 0).toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View style={styles.metricCard}>
                        <Text style={styles.metricLabel}>Due Fee</Text>
                        <Text style={[styles.metricVal, { color: data.dueAmount > 0 ? '#DC2626' : '#059669' }]}>
                          ₹{Number(data.dueAmount || 0).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>

                    {Array.isArray(data.transactions) && data.transactions.length > 0 ? (
                      <View style={{ marginTop: 12 }}>
                        <Text style={styles.subSectionLabel}>Payment Transactions</Text>
                        {data.transactions.map((tx: any, idx: number) => (
                          <View key={tx.id || idx} style={styles.card}>
                            <View style={styles.cardHeader}>
                              <Text style={styles.cardTitle}>{tx.receiptNumber || 'Receipt'}</Text>
                              <Text style={[styles.cardHighlight, { color: '#059669' }]}>
                                ₹{Number(tx.amount || 0).toLocaleString('en-IN')}
                              </Text>
                            </View>
                            <Text style={styles.cardSub}>
                              Date: {tx.date ? new Date(tx.date).toLocaleDateString('en-IN') : 'N/A'} • Mode: {tx.paymentMode}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </>
                ) : (
                  <View style={styles.emptyCard}>
                    <CreditCard size={28} color="#94A3B8" />
                    <Text style={styles.emptyTitle}>Fee Record Synchronized</Text>
                    <Text style={styles.emptySub}>No outstanding balance records found.</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        )}
        <Modal
          visible={Boolean(selectedService || selectedCertificate)}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setSelectedService(null);
            setSelectedCertificate(null);
          }}
        >
          <View style={styles.actionModalBackdrop}>
            <View style={styles.actionModalCard}>
              <Text style={styles.actionModalTitle}>
                {selectedService ? 'Request Service' : 'Request Original Certificate'}
              </Text>
              <Text style={styles.actionModalSubtitle}>
                {selectedService
                  ? selectedService.name || selectedService.title
                  : selectedCertificate?.name}
              </Text>
              <TextInput
                style={styles.actionModalInput}
                placeholder="Purpose"
                value={selectedService ? servicePurpose : borrowPurpose}
                onChangeText={selectedService ? setServicePurpose : setBorrowPurpose}
                multiline
                textAlignVertical="top"
              />
              {selectedCertificate ? (
                <TextInput
                  style={styles.actionModalInput}
                  placeholder="Return date (YYYY-MM-DD)"
                  value={borrowReturnDate}
                  onChangeText={setBorrowReturnDate}
                  autoCapitalize="none"
                />
              ) : null}
              <View style={styles.actionModalButtons}>
                <TouchableOpacity
                  style={[styles.actionModalButton, styles.actionModalCancelButton]}
                  onPress={() => {
                    setSelectedService(null);
                    setSelectedCertificate(null);
                  }}
                  disabled={submittingServiceRequest || submittingBorrowRequest}
                >
                  <Text style={styles.actionModalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionModalButton, styles.actionModalSubmitButton]}
                  onPress={selectedService ? submitServiceRequest : submitBorrowRequest}
                  disabled={submittingServiceRequest || submittingBorrowRequest}
                >
                  {submittingServiceRequest || submittingBorrowRequest ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.actionModalSubmitText}>Submit Request</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* File Complaint Modal */}
        <Modal
          visible={showComplaintModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
            if (!submittingComplaint) setShowComplaintModal(false);
          }}
        >
          <View style={styles.actionModalBackdrop}>
            <View style={[styles.actionModalCard, { maxHeight: '85%' }]}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.actionModalTitle}>File Maintenance Complaint</Text>
                <Text style={styles.actionModalSubtitle}>
                  Select category and specify issue details for campus maintenance.
                </Text>

                {/* Categories */}
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6 }}>
                  Category *
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {complaintCategories.map((cat: any) => {
                      const isSelected = String(complaintForm.category_id) === String(cat.id);
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          onPress={() => setComplaintForm(prev => ({ ...prev, category_id: String(cat.id), sub_category_id: '' }))}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 10,
                            backgroundColor: isSelected ? '#1E3A8A' : '#F1F5F9',
                            borderWidth: 1,
                            borderColor: isSelected ? '#1E3A8A' : '#E2E8F0',
                          }}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '700', color: isSelected ? '#FFFFFF' : '#334155' }}>
                            {cat.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                {/* Subcategories if available */}
                {(() => {
                  const selectedCat = complaintCategories.find(c => String(c.id) === String(complaintForm.category_id));
                  if (!selectedCat?.sub_categories?.length) return null;
                  return (
                    <View style={{ marginBottom: 14 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 6 }}>
                        Sub-Category (Optional)
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          {selectedCat.sub_categories.map((sub: any) => {
                            const isSelected = String(complaintForm.sub_category_id) === String(sub.id);
                            return (
                              <TouchableOpacity
                                key={sub.id}
                                onPress={() => setComplaintForm(prev => ({
                                  ...prev,
                                  sub_category_id: isSelected ? '' : String(sub.id)
                                }))}
                                style={{
                                  paddingHorizontal: 10,
                                  paddingVertical: 6,
                                  borderRadius: 8,
                                  backgroundColor: isSelected ? '#3B82F6' : '#F8FAFC',
                                  borderWidth: 1,
                                  borderColor: isSelected ? '#3B82F6' : '#E2E8F0',
                                }}
                              >
                                <Text style={{ fontSize: 11, fontWeight: '600', color: isSelected ? '#FFFFFF' : '#475569' }}>
                                  {sub.name}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </ScrollView>
                    </View>
                  );
                })()}

                {/* Subject / Title */}
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6 }}>
                  Complaint Subject / Title *
                </Text>
                <TextInput
                  style={[styles.actionModalInput, { minHeight: 44, maxHeight: 44 }]}
                  placeholder="e.g. Fan not working, Water leakage"
                  placeholderTextColor="#94A3B8"
                  value={complaintForm.title}
                  onChangeText={(val) => setComplaintForm(prev => ({ ...prev, title: val }))}
                />

                {/* Location row */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 4 }}>Block</Text>
                    <TextInput
                      style={[styles.actionModalInput, { minHeight: 40, maxHeight: 40 }]}
                      placeholder="e.g. Block A"
                      placeholderTextColor="#94A3B8"
                      value={complaintForm.block_no}
                      onChangeText={(val) => setComplaintForm(prev => ({ ...prev, block_no: val }))}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 4 }}>Room No</Text>
                    <TextInput
                      style={[styles.actionModalInput, { minHeight: 40, maxHeight: 40 }]}
                      placeholder="e.g. 204"
                      placeholderTextColor="#94A3B8"
                      value={complaintForm.room_no}
                      onChangeText={(val) => setComplaintForm(prev => ({ ...prev, room_no: val }))}
                    />
                  </View>
                </View>

                {/* Description */}
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6 }}>
                  Description (Optional)
                </Text>
                <TextInput
                  style={[styles.actionModalInput, { minHeight: 70, maxHeight: 110 }]}
                  placeholder="Describe the issue in detail..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  value={complaintForm.description}
                  onChangeText={(val) => setComplaintForm(prev => ({ ...prev, description: val }))}
                />

                <View style={styles.actionModalButtons}>
                  <TouchableOpacity
                    style={[styles.actionModalButton, styles.actionModalCancelButton]}
                    onPress={() => setShowComplaintModal(false)}
                    disabled={submittingComplaint}
                  >
                    <Text style={styles.actionModalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionModalButton, styles.actionModalSubmitButton]}
                    onPress={handleSubmitComplaint}
                    disabled={submittingComplaint}
                  >
                    {submittingComplaint ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.actionModalSubmitText}>Submit Complaint</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Complaint Details Modal */}
        <Modal
          visible={showTicketDetailsModal && !!selectedTicketForDetails}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowTicketDetailsModal(false);
            setSelectedTicketForDetails(null);
          }}
        >
          <View style={styles.actionModalBackdrop}>
            <View style={[styles.actionModalCard, { maxHeight: '88%' }]}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedTicketForDetails && (() => {
                  const t = selectedTicketForDetails;
                  const isCompletedOrClosed = t.status === 'completed' || t.status === 'closed';

                  let historyList: any[] = [];
                  if (t.status_history) {
                    if (Array.isArray(t.status_history)) {
                      historyList = t.status_history;
                    } else if (typeof t.status_history === 'string') {
                      try {
                        const parsed = JSON.parse(t.status_history);
                        if (Array.isArray(parsed)) historyList = parsed;
                      } catch (_) {}
                    }
                  }

                  let assignmentsList: any[] = [];
                  if (t.assignments) {
                    if (Array.isArray(t.assignments)) {
                      assignmentsList = t.assignments;
                    } else if (typeof t.assignments === 'string') {
                      try {
                        const parsed = JSON.parse(t.assignments);
                        if (Array.isArray(parsed)) assignmentsList = parsed;
                      } catch (_) {}
                    }
                  }

                  let commentsList: any[] = [];
                  if (t.comments) {
                    if (Array.isArray(t.comments)) {
                      commentsList = t.comments;
                    } else if (typeof t.comments === 'string') {
                      try {
                        const parsed = JSON.parse(t.comments);
                        if (Array.isArray(parsed)) commentsList = parsed;
                      } catch (_) {}
                    }
                  }

                  return (
                    <View>
                      {/* Header */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={{ fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: '#64748B' }}>
                            #{t.complaint_number || t.ticket_number || t.id}
                          </Text>
                          <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 2 }}>
                            {t.title || t.subject}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => {
                            setShowTicketDetailsModal(false);
                            setSelectedTicketForDetails(null);
                          }}
                          style={{ padding: 6, borderRadius: 16, backgroundColor: '#F1F5F9' }}
                        >
                          <X size={18} color="#64748B" />
                        </TouchableOpacity>
                      </View>

                      {/* Status and Category Badges */}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: isCompletedOrClosed ? '#DCFCE7' : '#FEF3C7' }}>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: isCompletedOrClosed ? '#15803D' : '#B45309', textTransform: 'uppercase' }}>
                            {t.status || 'PENDING'}
                          </Text>
                        </View>
                        {t.category_name ? (
                          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#F1F5F9' }}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>
                              {t.category_name} {t.sub_category_name ? `• ${t.sub_category_name}` : ''}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      {/* Location Information */}
                      {(t.block_no || t.room_no || t.floor_no) ? (
                        <View style={{ backgroundColor: '#F8FAFC', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 4 }}>
                            Location
                          </Text>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155' }}>
                            {t.block_no ? `Block: ${t.block_no}` : ''}
                            {t.floor_no ? ` • Floor: ${t.floor_no}` : ''}
                            {t.room_no ? ` • Room: ${t.room_no}` : ''}
                          </Text>
                        </View>
                      ) : null}

                      {/* Description */}
                      <View style={{ marginBottom: 14 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 4 }}>
                          Issue Description
                        </Text>
                        <Text style={{ fontSize: 13, color: '#334155', lineHeight: 20 }}>
                          {t.description || 'No description provided.'}
                        </Text>
                      </View>

                      {/* Photo if present */}
                      {t.photo_url ? (
                        <View style={{ marginBottom: 14 }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 6 }}>
                            Attached Photo
                          </Text>
                          <Image
                            source={{ uri: t.photo_url.startsWith('http') || t.photo_url.startsWith('data:') ? t.photo_url : getStaticFileUrl(t.photo_url) }}
                            style={{ width: '100%', height: 180, borderRadius: 10, backgroundColor: '#E2E8F0' }}
                            resizeMode="cover"
                          />
                        </View>
                      ) : null}

                      {/* Status History Timeline */}
                      {historyList.length > 0 && (
                        <View style={{ marginBottom: 14 }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 8 }}>
                            Status Timeline
                          </Text>
                          <View style={{ gap: 8 }}>
                            {historyList.map((h: any, hIdx: number) => (
                              <View key={h.id || hIdx} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#1E3A8A', marginTop: 5 }} />
                                <View style={{ flex: 1 }}>
                                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#1E293B' }}>
                                    {h.new_status ? `${h.old_status || ''} ➔ ${h.new_status}`.trim() : (h.status || 'Updated')}
                                  </Text>
                                  {h.notes ? (
                                    <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                                      {h.notes}
                                    </Text>
                                  ) : null}
                                  {(h.created_at || h.updated_at) ? (
                                    <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>
                                      {new Date(h.created_at || h.updated_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                                    </Text>
                                  ) : null}
                                </View>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {/* Bottom Action Buttons in Modal */}
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                        {isCompletedOrClosed && (
                          <TouchableOpacity
                            onPress={() => handleReopenComplaint(t)}
                            disabled={reopeningTicketId === t.id}
                            style={{
                              flex: 1,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              paddingVertical: 10,
                              borderRadius: 10,
                              backgroundColor: '#FEF3C7',
                              borderWidth: 1,
                              borderColor: '#FDE68A',
                            }}
                          >
                            {reopeningTicketId === t.id ? (
                              <ActivityIndicator size="small" color="#B45309" />
                            ) : (
                              <RefreshCw size={14} color="#B45309" />
                            )}
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#B45309' }}>
                              Raise Again
                            </Text>
                          </TouchableOpacity>
                        )}

                        {isCompletedOrClosed && !t.feedback && (
                          <TouchableOpacity
                            onPress={() => handleOpenFeedback(t)}
                            style={{
                              flex: 1,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              paddingVertical: 10,
                              borderRadius: 10,
                              backgroundColor: '#DCFCE7',
                              borderWidth: 1,
                              borderColor: '#BBF7D0',
                            }}
                          >
                            <Star size={14} color="#15803D" />
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#15803D' }}>
                              Rate Service
                            </Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          onPress={() => {
                            setShowTicketDetailsModal(false);
                            setSelectedTicketForDetails(null);
                          }}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 10,
                            backgroundColor: '#F1F5F9',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569' }}>
                            Close
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })()}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Star Rating / Feedback Modal */}
        <Modal
          visible={showFeedbackModal && !!selectedTicketForFeedback}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowFeedbackModal(false);
            setSelectedTicketForFeedback(null);
          }}
        >
          <View style={styles.actionModalBackdrop}>
            <View style={[styles.actionModalCard, { maxHeight: '80%' }]}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.actionModalTitle}>Rate Maintenance Service</Text>
                <Text style={styles.actionModalSubtitle}>
                  Please share your feedback on the resolution of complaint #{selectedTicketForFeedback?.complaint_number || selectedTicketForFeedback?.ticket_number || selectedTicketForFeedback?.id}.
                </Text>

                {/* Star Rating Selector */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 16 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setFeedbackRating(star)}
                      activeOpacity={0.7}
                      style={{ padding: 4 }}
                    >
                      <Star
                        size={32}
                        color={star <= feedbackRating ? '#EAB308' : '#CBD5E1'}
                        fill={star <= feedbackRating ? '#EAB308' : 'none'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Rating Label */}
                <Text style={{ textAlign: 'center', fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 16 }}>
                  {feedbackRating === 1 && '1 - Very Unsatisfied (Poor)'}
                  {feedbackRating === 2 && '2 - Unsatisfied (Fair)'}
                  {feedbackRating === 3 && '3 - Neutral (Good)'}
                  {feedbackRating === 4 && '4 - Satisfied (Very Good)'}
                  {feedbackRating === 5 && '5 - Highly Satisfied (Excellent)'}
                </Text>

                {/* Comments */}
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6 }}>
                  Feedback Comments (Optional)
                </Text>
                <TextInput
                  style={[styles.actionModalInput, { minHeight: 70, maxHeight: 110 }]}
                  placeholder="Share details regarding the service, speed, or technician..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  value={feedbackText}
                  onChangeText={setFeedbackText}
                />

                <View style={styles.actionModalButtons}>
                  <TouchableOpacity
                    style={[styles.actionModalButton, styles.actionModalCancelButton]}
                    onPress={() => {
                      setShowFeedbackModal(false);
                      setSelectedTicketForFeedback(null);
                    }}
                    disabled={submittingFeedback}
                  >
                    <Text style={styles.actionModalCancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionModalButton, styles.actionModalSubmitButton]}
                    onPress={handleSubmitFeedback}
                    disabled={submittingFeedback}
                  >
                    {submittingFeedback ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.actionModalSubmitText}>Submit Feedback</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
  );
};

export const StudentModuleDetailModal: React.FC<StudentModuleDetailModalProps> = ({
  visible,
  module,
  onClose,
}) => {
  if (!visible || !module) return null;
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <StudentModuleView module={module} onBack={onClose} />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
    borderRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  enrolledScopeCard: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  enrolledScopeDetail: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  enrolledPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  scopeMiniPill: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 13,
    color: '#64748B',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    gap: 12,
  },
  subSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  cardBannerWrapper: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    marginBottom: 10,
  },
  cardBannerImg: {
    width: '100%',
    height: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
  },
  cardHighlight: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  cardTime: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  cardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  descText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 6,
    lineHeight: 17,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  roomTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timeScheduleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
    marginTop: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  pillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  transTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  transDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  transAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  semesterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  semPill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  semPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  grid3: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E3A8A',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  moduleActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  moduleActionButtonDisabled: {
    backgroundColor: '#64748B',
  },
  moduleActionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  actionModalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  actionModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  actionModalTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  actionModalSubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  actionModalInput: {
    minHeight: 48,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 12,
  },
  actionModalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionModalButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  actionModalCancelButton: {
    backgroundColor: '#F1F5F9',
  },
  actionModalSubmitButton: {
    backgroundColor: '#1E3A8A',
  },
  actionModalCancelText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  actionModalSubmitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  crtFeatureBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    gap: 4,
  },
  crtFeatureText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
});
