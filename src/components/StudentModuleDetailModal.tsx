import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
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
} from 'lucide-react-native';
import api from '../config/api';
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

interface StudentModuleDetailModalProps {
  visible: boolean;
  module: StudentModuleItem | null;
  onClose: () => void;
}

export const StudentModuleDetailModal: React.FC<StudentModuleDetailModalProps> = ({
  visible,
  module,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const student = user as any;
  const admissionNo = student?.admission_number || student?.pin_no || '';

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const course = student?.course || student?.course_name || '';
  const branch = student?.branch || student?.branch_name || '';
  const semester = student?.current_semester || '';
  const section = student?.section || '';
  const batch = student?.batch || '';
  const quota = student?.quota || student?.stud_type || '';

  useEffect(() => {
    if (!visible || !module) {
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
          const res = await api.get('/tickets/student/my-tickets');
          setData(res.data?.data || res.data?.tickets || []);
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
  }, [visible, module, admissionNo]);

  if (!module) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn} hitSlop={10}>
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
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
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
            {module.id === 'my-tickets' && (
              <View style={styles.section}>
                {Array.isArray(data) && data.length > 0 ? (
                  data.map((item: any, idx: number) => (
                    <View key={item.id || idx} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>{item.subject || item.title || `Ticket #${item.id}`}</Text>
                        <View style={[styles.pillBadge, { backgroundColor: '#EFF6FF' }]}>
                          <Text style={[styles.pillBadgeText, { color: '#1D4ED8' }]}>
                            {(item.status || 'OPEN').toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.cardSub}>{item.description || 'Campus maintenance or support ticket'}</Text>
                      {item.created_at ? (
                        <Text style={styles.timeScheduleText}>
                          Created: {new Date(item.created_at).toLocaleDateString('en-IN')}
                        </Text>
                      ) : null}
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyCard}>
                    <Ticket size={28} color="#94A3B8" />
                    <Text style={styles.emptyTitle}>No Support Tickets</Text>
                    <Text style={styles.emptySub}>You have not submitted any maintenance or helpdesk tickets.</Text>
                  </View>
                )}
              </View>
            )}

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
      </View>
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
