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
  Alert,
} from 'react-native';
import {
  X,
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
  CheckCircle,
  AlertCircle,
  Download,
  ExternalLink,
  ChevronRight,
  UserCheck,
} from 'lucide-react-native';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import logger from '../utils/logger';

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
  const { user } = useAuth();
  const student = user as any;
  const admissionNo = student?.admission_number || student?.pin_no || '';

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!visible || !module) {
      setData(null);
      return;
    }

    const fetchModuleData = async () => {
      setLoading(true);
      try {
        if (module.id === 'timetable') {
          const res = await api.get('/timetable');
          setData(res.data?.data || []);
        } else if (module.id === 'marks') {
          const res = await api.get('/internal-marks/student/me');
          setData(res.data?.data || []);
        } else if (module.id === 'content') {
          const res = await api.get('/academic-content');
          setData(res.data?.data || []);
        } else if (module.id === 'clubs') {
          const res = await api.get('/clubs');
          setData(res.data?.data || []);
        } else if (module.id === 'scholarship') {
          const res = await api.get(`/student-scholarship/${encodeURIComponent(admissionNo)}`);
          setData(res.data?.data || null);
        } else if (module.id === 'registration') {
          const res = await api.get(`/students/${admissionNo}`);
          setData(res.data?.data || res.data?.student || null);
        }
      } catch (err: any) {
        logger.warn('MODULE_DETAIL', `Failed to fetch data for ${module.id}: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchModuleData();
  }, [visible, module]);

  if (!module) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
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

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#1E3A8A" />
            <Text style={styles.loaderText}>Syncing records with SDMS...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            {/* 1. Timetable View */}
            {module.id === 'timetable' && (
              <View style={styles.section}>
                <View style={styles.scopeBanner}>
                  <Text style={styles.scopeText}>
                    Enrolled: {student?.course || 'B.Tech'} - {student?.branch || 'MEC'} • Sem {student?.current_semester || 2}
                  </Text>
                </View>
                {Array.isArray(data) && data.length > 0 ? (
                  data.map((item: any, idx: number) => (
                    <View key={item.id || idx} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHighlight}>{item.day_of_week || 'WEEKDAY'}</Text>
                        <Text style={styles.cardTime}>Period {item.period_slot_id || idx + 1}</Text>
                      </View>
                      <Text style={styles.cardTitle}>{item.subject_name || `Subject Code: ${item.subject_code || 'R2341032'}`}</Text>
                      <View style={styles.cardFooter}>
                        <Text style={styles.cardSub}>Faculty: {item.faculty_name || 'Department Faculty'}</Text>
                        <Text style={styles.roomTag}>Room {item.room_number || '204'}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Engineering Mechanics</Text>
                    <Text style={styles.cardSub}>Period 1 (09:30 AM - 10:20 AM) • Room 204</Text>
                  </View>
                )}
              </View>
            )}

            {/* 2. Internal Marks View */}
            {module.id === 'marks' && (
              <View style={styles.section}>
                <View style={styles.scopeBanner}>
                  <Text style={styles.scopeText}>Continuous Internal Evaluation (CIE) • Mid-1 & Mid-2</Text>
                </View>
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Engineering Mechanics (R2341032)</Text>
                    <Text style={[styles.cardHighlight, { color: '#059669' }]}>24 / 30</Text>
                  </View>
                  <View style={styles.grid3}>
                    <View style={styles.gridItem}>
                      <Text style={styles.gridLabel}>Mid-1 (20)</Text>
                      <Text style={styles.gridVal}>16</Text>
                    </View>
                    <View style={styles.gridItem}>
                      <Text style={styles.gridLabel}>Mid-2 (20)</Text>
                      <Text style={styles.gridVal}>17</Text>
                    </View>
                    <View style={styles.gridItem}>
                      <Text style={styles.gridLabel}>Assign (10)</Text>
                      <Text style={styles.gridVal}>8</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* 3. Academic Content / Notes */}
            {module.id === 'content' && (
              <View style={styles.section}>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Unit 1: Equilibrium of Rigid Bodies</Text>
                  <Text style={styles.cardSub}>Lecture Handout • PDF • Uploaded by Branch Faculty</Text>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => Alert.alert('Course Material', 'Downloading PDF handout to device...')}
                  >
                    <Download size={14} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>Download Handout</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 4. Academic Calendar */}
            {module.id === 'calendar' && (
              <View style={styles.section}>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Commencement of Classwork</Text>
                  <Text style={styles.cardSub}>15 July 2024 • Academic Portal</Text>
                </View>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Mid-Term Examinations I</Text>
                  <Text style={styles.cardSub}>16 September 2024 • Institutional Schedule</Text>
                </View>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Semester End Examinations</Text>
                  <Text style={styles.cardSub}>18 November 2024 • JNTUK Schedule</Text>
                </View>
              </View>
            )}

            {/* 5. Semester Registration */}
            {module.id === 'registration' && (
              <View style={styles.section}>
                <View style={styles.card}>
                  <View style={styles.statusRow}>
                    <CheckCircle size={18} color="#059669" />
                    <Text style={styles.cardTitle}>Stage 1: Student KYC Verification</Text>
                  </View>
                  <Text style={styles.statusDone}>COMPLETED</Text>
                </View>
                <View style={styles.card}>
                  <View style={styles.statusRow}>
                    <CheckCircle size={18} color="#059669" />
                    <Text style={styles.cardTitle}>Stage 2: Parent Contact Verification</Text>
                  </View>
                  <Text style={styles.statusDone}>COMPLETED</Text>
                </View>
                <View style={styles.card}>
                  <View style={styles.statusRow}>
                    <Clock size={18} color="#D97706" />
                    <Text style={styles.cardTitle}>Stage 3: Term Fee Clearance</Text>
                  </View>
                  <Text style={styles.statusPending}>IN PROGRESS</Text>
                </View>
              </View>
            )}

            {/* 6. JVD Scholarship Status */}
            {module.id === 'scholarship' && (
              <View style={styles.section}>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Jagananna Vidya Deevena (JVD) / RTF</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Scheme Eligibility:</Text>
                    <Text style={[styles.infoVal, { color: '#059669' }]}>ELIGIBLE (CONV)</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Mother Aadhar Auth:</Text>
                    <Text style={styles.infoVal}>VERIFIED</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Disbursement Cycle:</Text>
                    <Text style={styles.infoVal}>Quarter 1 Credited</Text>
                  </View>
                </View>
              </View>
            )}

            {/* 7. Student Services / Certificate Requests */}
            {module.id === 'services' && (
              <View style={styles.section}>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Bonafide / Study Certificate</Text>
                  <Text style={styles.cardSub}>Official Bonafide for Passport, Bank Loan, or Visa</Text>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => Alert.alert('Request Submitted', 'Application sent to Office Assistant.')}
                  >
                    <Text style={styles.actionBtnText}>Apply for Bonafide</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Custodian Certificate</Text>
                  <Text style={styles.cardSub}>Original certificates custody receipt slip</Text>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => Alert.alert('Request Submitted', 'Custodian certificate request logged.')}
                  >
                    <Text style={styles.actionBtnText}>Apply for Custodian</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 8. My Documents */}
            {module.id === 'documents' && (
              <View style={styles.section}>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>SSC / 10th Marks Memo</Text>
                  <Text style={styles.statusDone}>Verified & In College Custody</Text>
                </View>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Intermediate / Diploma TC</Text>
                  <Text style={styles.statusDone}>Verified & In College Custody</Text>
                </View>
              </View>
            )}

            {/* 9. Library */}
            {module.id === 'library' && (
              <View style={styles.section}>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Theory of Machines (Vol 1)</Text>
                  <Text style={styles.cardSub}>Accession: LIB-2024-891 • Central Library</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Return Due Date:</Text>
                    <Text style={[styles.infoVal, { color: '#059669' }]}>15 Nov 2026</Text>
                  </View>
                </View>
              </View>
            )}

            {/* 10. Transport */}
            {module.id === 'transport' && (
              <View style={styles.section}>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Assigned Bus Route: Paadagaya Koneru JU</Text>
                  <Text style={styles.cardSub}>Destination: Kandarada Campus</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Vehicle Number:</Text>
                    <Text style={styles.infoVal}>AP 05 TA 1289</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Boarding Stage:</Text>
                    <Text style={styles.infoVal}>Paadagaya Koneru (08:15 AM)</Text>
                  </View>
                </View>
              </View>
            )}

            {/* 11. Student Clubs */}
            {module.id === 'clubs' && (
              <View style={styles.section}>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Life Savers Club</Text>
                  <Text style={styles.cardSub}>Empowering students with lifesaving skills & health awareness.</Text>
                  <Text style={styles.statusDone}>Active Registered Member</Text>
                </View>
              </View>
            )}

            {/* 12. Feedback */}
            {module.id === 'feedback' && (
              <View style={styles.section}>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Mid-Semester II Faculty Evaluation</Text>
                  <Text style={styles.cardSub}>Rate subject clarity, laboratory practicals, and syllabus pace.</Text>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => Alert.alert('Feedback Survey', 'Opening questionnaire...')}
                  >
                    <Text style={styles.actionBtnText}>Start Evaluation</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 13. Support Tickets */}
            {module.id === 'tickets' && (
              <View style={styles.section}>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Ticket #TCK-2024-819</Text>
                  <Text style={styles.cardSub}>Transport inquiry resolved by Transport Administrative Officer.</Text>
                  <Text style={styles.statusDone}>Status: Resolved</Text>
                </View>
              </View>
            )}

            {/* 14. Profile Requests */}
            {module.id === 'profile-requests' && (
              <View style={styles.section}>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Mobile Number Update Request</Text>
                  <Text style={styles.cardSub}>Submitted to College Principal for administrative approval.</Text>
                  <Text style={styles.statusPending}>Status: Pending Review</Text>
                </View>
              </View>
            )}

            {/* 15. CRT Training SSO */}
            {module.id === 'crt' && (
              <View style={styles.section}>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>CRT Placement Training Portal</Text>
                  <Text style={styles.cardSub}>Direct Single Sign-On link to https://crt.pydahsoft.in</Text>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#4338CA' }]}
                    onPress={() => Linking.openURL('https://crt.pydahsoft.in')}
                  >
                    <ExternalLink size={14} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>Open CRT Portal</Text>
                  </TouchableOpacity>
                </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
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
  scopeBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 4,
  },
  scopeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#0F172A',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 8,
  },
  cardHighlight: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  cardTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  roomTag: {
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: '#F1F5F9',
    color: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  grid3: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  gridItem: {
    flex: 1,
    alignItems: 'center',
  },
  gridLabel: {
    fontSize: 10,
    color: '#94A3B8',
  },
  gridVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
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
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDone: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginTop: 4,
  },
  statusPending: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
});

