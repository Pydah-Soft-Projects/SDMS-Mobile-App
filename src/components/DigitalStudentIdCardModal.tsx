import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import {
  CreditCard,
  X,
  Building2,
  Calendar,
  Phone,
  MapPin,
  User,
  Heart,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react-native';
import { getStaticFileUrl } from '../config/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 48, 330);
const CARD_HEIGHT = Math.round(CARD_WIDTH * 1.58);

interface DigitalStudentIdCardModalProps {
  visible: boolean;
  onClose: () => void;
  student: any;
  getStudentData?: (key: string, fallback?: string) => string;
}

export default function DigitalStudentIdCardModal({
  visible,
  onClose,
  student,
  getStudentData,
}: DigitalStudentIdCardModalProps) {
  const [activeSide, setActiveSide] = useState<'both' | 'front' | 'back'>('both');

  const studObj = student || {};

  const get = (key: string, fallback = '—') => {
    if (typeof getStudentData === 'function') {
      const res = getStudentData(key, fallback);
      if (res && res !== fallback) return res;
    }
    const val = studObj[key];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      return String(val).trim();
    }
    return fallback;
  };

  // Student name
  const studentName = (
    studObj.student_name ||
    studObj.name ||
    get('student_name', 'Student')
  ).toUpperCase();

  // Admission / PIN
  const pinNo =
    studObj.pin_no ||
    studObj.pin_number ||
    studObj.pin ||
    get('PIN') ||
    get('Pin Number') ||
    studObj.admission_number ||
    studObj.admission_no ||
    '—';

  const admissionNumber =
    studObj.admission_number || studObj.admission_no || pinNo;

  // Course & Branch
  const program =
    studObj.course ||
    get('Program') ||
    get('Course') ||
    'B.Tech';

  const branch =
    studObj.branch ||
    get('Branch') ||
    get('Branch Name') ||
    '';

  // College Name
  const collegeName =
    studObj.college ||
    get('College') ||
    'Pydah College of Engineering';

  // Batch
  const rawBatch = studObj.batch || get('Batch') || '';
  const matchYears = String(rawBatch).match(/\b(20\d{2})\b/g);
  const startYear = matchYears && matchYears.length > 0 ? Number(matchYears[0]) : 2023;
  const courseDuration = program.toLowerCase().includes('pharm') ? 4 : 4;
  const endYear = startYear + courseDuration;
  const batchStr = `${startYear} - ${endYear}`;
  const validityStr = `MAY ${endYear}`;

  // DOB
  const rawDob = studObj.dob || get('DOB') || studObj.date_of_birth || '';
  let formattedDob = '—';
  if (rawDob && rawDob !== '—') {
    try {
      const d = new Date(rawDob);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        formattedDob = `${day}/${month}/${year}`;
      } else {
        formattedDob = String(rawDob);
      }
    } catch {
      formattedDob = String(rawDob);
    }
  }

  // Personal Info for Back
  const fatherName =
    studObj.father_name || get('Father Name') || get('Father') || '—';
  const bloodGroup =
    studObj.blood_group || get('Blood Group') || 'O+';
  const mobile =
    studObj.student_mobile ||
    studObj.phone ||
    get('Student Mobile number') ||
    get('Mobile') ||
    '—';
  const emergencyMobile =
    studObj.parent_mobile1 ||
    studObj.parent_mobile ||
    get('Parent Mobile') ||
    mobile;

  const address =
    studObj.student_address ||
    get('Student Address') ||
    [studObj.city_village, studObj.mandal_name, studObj.district]
      .filter(Boolean)
      .join(', ') ||
    'Kakinada, Andhra Pradesh';

  // Photo URL
  const photoRaw = studObj.student_photo || studObj.avatarUrl || studObj.photo;
  const photoUrl = photoRaw ? getStaticFileUrl(photoRaw) : null;

  // Barcode representation
  const barcodePill = useMemo(() => {
    const code = String(pinNo).replace(/[^a-zA-Z0-9]/g, '');
    const bars: boolean[] = [];
    for (let i = 0; i < code.length; i++) {
      const num = code.charCodeAt(i);
      bars.push(num % 2 === 0);
      bars.push(num % 3 === 0);
      bars.push(num % 5 === 0);
    }
    return bars.slice(0, 42);
  }, [pinNo]);

  // Front Card JSX
  const renderFrontCard = () => (
    <View style={[styles.idCard, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
      {/* Top Red Wave Header */}
      <View style={styles.frontHeader}>
        <View style={styles.headerLogoRow}>
          <Image
            source={require('../../assets/pydah-logo.webp')}
            style={styles.collegeLogo}
            resizeMode="contain"
          />
          <View style={styles.headerTitleCol}>
            <Text style={styles.collegeNameText} numberOfLines={2}>
              {collegeName.toUpperCase()}
            </Text>
            <Text style={styles.collegeSubText}>
              AFFILIATED TO JNTUK • APPROVED BY AICTE
            </Text>
          </View>
        </View>

        {/* Identity Card Ribbon */}
        <View style={styles.ribbonBanner}>
          <Text style={styles.ribbonText}>STUDENT IDENTITY CARD</Text>
        </View>
      </View>

      {/* Card Body */}
      <View style={styles.frontBody}>
        {/* Student Photo with Frame */}
        <View style={styles.photoContainer}>
          <View style={styles.photoFrame}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.photoImg} />
            ) : (
              <View style={styles.photoFallback}>
                <User size={48} color="#94A3B8" />
              </View>
            )}
          </View>
        </View>

        {/* Student Name */}
        <Text style={styles.frontStudentName} numberOfLines={2}>
          {studentName}
        </Text>

        {/* PIN Badge */}
        <View style={styles.pinBadge}>
          <Text style={styles.pinBadgeLabel}>PIN / ROLL NO:</Text>
          <Text style={styles.pinBadgeVal}>{pinNo}</Text>
        </View>

        {/* Details Table */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Course</Text>
            <Text style={styles.detailColon}>:</Text>
            <Text style={styles.detailVal} numberOfLines={1}>
              {program}
            </Text>
          </View>

          {branch ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Branch</Text>
              <Text style={styles.detailColon}>:</Text>
              <Text style={styles.detailVal} numberOfLines={1}>
                {branch}
              </Text>
            </View>
          ) : null}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Batch</Text>
            <Text style={styles.detailColon}>:</Text>
            <Text style={styles.detailVal}>{batchStr}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Valid Upto</Text>
            <Text style={styles.detailColon}>:</Text>
            <Text style={[styles.detailVal, { color: '#B91C1C', fontWeight: '800' }]}>
              {validityStr}
            </Text>
          </View>
        </View>
      </View>

      {/* Front Footer */}
      <View style={styles.frontFooter}>
        {/* Barcode Strip */}
        <View style={styles.barcodeStrip}>
          <View style={styles.barcodeLines}>
            {barcodePill.map((thick, idx) => (
              <View
                key={idx}
                style={[
                  styles.barcodeBar,
                  { width: thick ? 2.5 : 1, opacity: thick ? 0.95 : 0.65 },
                ]}
              />
            ))}
          </View>
          <Text style={styles.barcodeText}>{pinNo}</Text>
        </View>

        {/* Principal Signature */}
        <View style={styles.signatureCol}>
          <View style={styles.signatureSeal}>
            <Text style={styles.signatureScript}>P.V. Rao</Text>
          </View>
          <Text style={styles.signatureLabel}>PRINCIPAL</Text>
        </View>
      </View>
    </View>
  );

  // Back Card JSX
  const renderBackCard = () => (
    <View style={[styles.idCard, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
      {/* Top Red Header */}
      <View style={styles.backHeader}>
        <Text style={styles.backCollegeTitle} numberOfLines={2}>
          {collegeName.toUpperCase()}
        </Text>
        <Text style={styles.backCampusText}>
          Yanam Road, Matlapalem, Kakinada - 533003, A.P.
        </Text>
      </View>

      {/* Back Body: Personal Particulars */}
      <View style={styles.backBody}>
        <View style={styles.backParticularsCard}>
          <Text style={styles.backSectionTitle}>STUDENT PARTICULARS</Text>

          <View style={styles.backDetailRow}>
            <Text style={styles.backDetailLabel}>Father's Name</Text>
            <Text style={styles.backDetailColon}>:</Text>
            <Text style={styles.backDetailVal} numberOfLines={1}>
              {fatherName}
            </Text>
          </View>

          <View style={styles.backDetailRow}>
            <Text style={styles.backDetailLabel}>Date of Birth</Text>
            <Text style={styles.backDetailColon}>:</Text>
            <Text style={styles.backDetailVal}>{formattedDob}</Text>
          </View>

          <View style={styles.backDetailRow}>
            <Text style={styles.backDetailLabel}>Blood Group</Text>
            <Text style={styles.backDetailColon}>:</Text>
            <Text style={[styles.backDetailVal, { color: '#DC2626', fontWeight: '800' }]}>
              {bloodGroup}
            </Text>
          </View>

          <View style={styles.backDetailRow}>
            <Text style={styles.backDetailLabel}>Student Contact</Text>
            <Text style={styles.backDetailColon}>:</Text>
            <Text style={styles.backDetailVal}>{mobile}</Text>
          </View>

          <View style={styles.backDetailRow}>
            <Text style={styles.backDetailLabel}>Emergency No</Text>
            <Text style={styles.backDetailColon}>:</Text>
            <Text style={styles.backDetailVal}>{emergencyMobile}</Text>
          </View>

          <View style={[styles.backDetailRow, { alignItems: 'flex-start' }]}>
            <Text style={[styles.backDetailLabel, { marginTop: 1 }]}>Address</Text>
            <Text style={[styles.backDetailColon, { marginTop: 1 }]}>:</Text>
            <Text style={styles.backDetailValAddress} numberOfLines={3}>
              {address}
            </Text>
          </View>
        </View>

        {/* Institutional Rules */}
        <View style={styles.rulesBox}>
          <Text style={styles.rulesTitle}>INSTRUCTIONS & POLICIES</Text>
          <Text style={styles.ruleItem}>
            1. This card is non-transferable and remains the institutional property of the college.
          </Text>
          <Text style={styles.ruleItem}>
            2. The cardholder must produce it on demand for campus entry, library, and examinations.
          </Text>
          <Text style={styles.ruleItem}>
            3. If found, please return to College Administrative Office, Kakinada.
          </Text>
        </View>
      </View>

      {/* Back Footer */}
      <View style={styles.backFooter}>
        <View style={styles.backFooterCol}>
          <Text style={styles.backFooterLabel}>HELPLINE</Text>
          <Text style={styles.backFooterVal}>+91 94943 94943</Text>
        </View>
        <View style={styles.backFooterDivider} />
        <View style={styles.backFooterCol}>
          <Text style={styles.backFooterLabel}>OFFICIAL PORTAL</Text>
          <Text style={styles.backFooterVal}>www.pydah.edu.in</Text>
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Mobile Sheet Drag Indicator */}
          <View style={styles.sheetHandle} />

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.idCardIconBox}>
                <CreditCard size={18} color="#059669" />
              </View>
              <View>
                <View style={styles.titleRow}>
                  <Text style={styles.modalTitle}>ID Card</Text>
                  <View style={styles.verifiedBadge}>
                    <ShieldCheck size={11} color="#15803D" style={{ marginRight: 3 }} />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                </View>
                <Text style={styles.modalSub}>
                  Official Student Digital Identity Record
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={10}
            >
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* View Switcher Bar */}
          <View style={styles.switcherBar}>
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  activeSide === 'both' && styles.segmentBtnActive,
                ]}
                onPress={() => setActiveSide('both')}
              >
                <Text
                  style={[
                    styles.segmentText,
                    activeSide === 'both' && styles.segmentTextActive,
                  ]}
                >
                  Both Sides
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  activeSide === 'front' && styles.segmentBtnActive,
                ]}
                onPress={() => setActiveSide('front')}
              >
                <Text
                  style={[
                    styles.segmentText,
                    activeSide === 'front' && styles.segmentTextActive,
                  ]}
                >
                  Front
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  activeSide === 'back' && styles.segmentBtnActive,
                ]}
                onPress={() => setActiveSide('back')}
              >
                <Text
                  style={[
                    styles.segmentText,
                    activeSide === 'back' && styles.segmentTextActive,
                  ]}
                >
                  Back
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Cards Scrollable Body */}
          <ScrollView
            style={styles.cardsScroll}
            contentContainerStyle={styles.cardsContainer}
            showsVerticalScrollIndicator={false}
          >
            {(activeSide === 'both' || activeSide === 'front') && (
              <View style={styles.cardWrapper}>
                <Text style={styles.cardSideLabel}>FRONT SIDE</Text>
                {renderFrontCard()}
              </View>
            )}

            {(activeSide === 'both' || activeSide === 'back') && (
              <View style={[styles.cardWrapper, activeSide === 'both' && { marginTop: 20 }]}>
                <Text style={styles.cardSideLabel}>BACK SIDE</Text>
                {renderBackCard()}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxHeight: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  sheetHandle: {
    width: 44,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  idCardIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#15803D',
    textTransform: 'uppercase',
  },
  modalSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  switcherBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  segmentBtn: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#1E3A8A',
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  cardsScroll: {
    paddingTop: 12,
  },
  cardsContainer: {
    alignItems: 'center',
    paddingBottom: 28,
  },
  cardWrapper: {
    alignItems: 'center',
  },
  cardSideLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 8,
  },

  // CR80 ID CARD BASE STYLES
  idCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    justifyContent: 'space-between',
  },

  // FRONT CARD
  frontHeader: {
    backgroundColor: '#B91C1C',
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 10,
  },
  headerLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  collegeLogo: {
    width: 38,
    height: 38,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  headerTitleCol: {
    flex: 1,
  },
  collegeNameText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  collegeSubText: {
    fontSize: 7.5,
    color: '#FEE2E2',
    fontWeight: '600',
    marginTop: 1,
  },
  ribbonBanner: {
    backgroundColor: '#7F1D1D',
    marginTop: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignItems: 'center',
  },
  ribbonText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#FEF08A',
    letterSpacing: 0.8,
  },
  frontBody: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    flex: 1,
  },
  photoContainer: {
    marginTop: 2,
    marginBottom: 6,
  },
  photoFrame: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: '#B91C1C',
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  photoFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  frontStudentName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  pinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
    marginBottom: 8,
  },
  pinBadgeLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#991B1B',
  },
  pinBadgeVal: {
    fontSize: 10,
    fontWeight: '900',
    color: '#B91C1C',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  detailsGrid: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 3.5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    width: 60,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#475569',
  },
  detailColon: {
    width: 10,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
  },
  detailVal: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
  },
  frontFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  barcodeStrip: {
    alignItems: 'flex-start',
  },
  barcodeLines: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 18,
    gap: 1.5,
  },
  barcodeBar: {
    height: '100%',
    backgroundColor: '#0F172A',
  },
  barcodeText: {
    fontSize: 7.5,
    color: '#475569',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  signatureCol: {
    alignItems: 'center',
  },
  signatureSeal: {
    height: 18,
    justifyContent: 'center',
  },
  signatureScript: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E3A8A',
    fontStyle: 'italic',
  },
  signatureLabel: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 2,
  },

  // BACK CARD
  backHeader: {
    backgroundColor: '#B91C1C',
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  backCollegeTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  backCampusText: {
    fontSize: 7.5,
    color: '#FEE2E2',
    textAlign: 'center',
    marginTop: 2,
  },
  backBody: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  backParticularsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 8,
    gap: 3.5,
  },
  backSectionTitle: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#B91C1C',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  backDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backDetailLabel: {
    width: 82,
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  backDetailColon: {
    width: 8,
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  backDetailVal: {
    flex: 1,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  backDetailValAddress: {
    flex: 1,
    fontSize: 9,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 12,
  },
  rulesBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 8,
    gap: 3,
  },
  rulesTitle: {
    fontSize: 8,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  ruleItem: {
    fontSize: 7.5,
    color: '#64748B',
    lineHeight: 10.5,
  },
  backFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: '#0F172A',
  },
  backFooterCol: {
    alignItems: 'center',
  },
  backFooterDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#334155',
  },
  backFooterLabel: {
    fontSize: 7,
    fontWeight: '800',
    color: '#94A3B8',
  },
  backFooterVal: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 1,
  },
});
