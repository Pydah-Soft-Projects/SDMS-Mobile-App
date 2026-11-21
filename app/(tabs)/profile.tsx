import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
  RefreshControl,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User,
  UserCheck,
  Users,
  Mail,
  Phone,
  PhoneCall,
  Building2,
  GraduationCap,
  Calendar,
  MapPin,
  Lock,
  Edit3,
  Clock,
  AlertCircle,
  LogOut,
  ShieldAlert,
  BookOpen,
  KeyRound,
  X,
  Eye,
  EyeOff,
  CreditCard,
  Compass,
  FileText,
  Award,
  Heart,
  Landmark,
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import Header from '../../src/components/Header';
import { ProfileSkeleton } from '../../src/components/SkeletonLoader';
import api, { getStaticFileUrl } from '../../src/config/api';
import authService from '../../src/services/authService';
import parentService from '../../src/services/parentService';
import DigitalStudentIdCardModal from '../../src/components/DigitalStudentIdCardModal';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, userType, logout } = useAuth();
  const student = user as any;

  const isStudent =
    userType === 'student' ||
    (!userType && !student?.role?.includes('admin') && !student?.role?.includes('staff'));

  const admissionNo =
    student?.admission_number || student?.admission_no || student?.username || '';

  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Profile Requests State
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [latestRequest, setLatestRequest] = useState<any>(null);

  // Password Modal State
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Digital ID Card State
  const [showIdCardModal, setShowIdCardModal] = useState(false);

  // Active Tab State (Personal | Contact | Academic)
  const [activeTab, setActiveTab] = useState<'personal' | 'contact' | 'academic'>('personal');

  // Edit Profile Modal State
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editMandal, setEditMandal] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [submittingProfileRequest, setSubmittingProfileRequest] = useState(false);

  const fetchProfileData = useCallback(async () => {
    if (!admissionNo && userType !== 'parent') {
      setLoading(false);
      return;
    }
    try {
      if (userType === 'parent') {
        const parentProfile = await parentService.getProfile();
        if (parentProfile) {
          setStudentData(parentProfile);
        }
      } else {
        const res = await api.get(`/students/${encodeURIComponent(admissionNo)}`);
        if (res.data?.success && res.data.data) {
          setStudentData(res.data.data);
        } else if (res.data && typeof res.data === 'object') {
          setStudentData(res.data.data || res.data.student || res.data);
        }
      }
    } catch {
      // Keep existing data or user fallback
    }
  }, [admissionNo, userType]);

  const fetchStudentRequests = useCallback(async () => {
    if (!isStudent) return;
    try {
      const res = await api.get('/profile-changes/my-requests');
      if (res.data?.success && Array.isArray(res.data.data)) {
        const pending = res.data.data.find((r: any) => r.status === 'pending');
        setPendingRequest(pending || null);
        if (res.data.data.length > 0) {
          setLatestRequest(res.data.data[0]);
        }
      }
    } catch {
      // Proceed silently
    }
  }, [isStudent]);

  const loadAll = useCallback(async () => {
    await Promise.all([fetchProfileData(), fetchStudentRequests()]);
    setLoading(false);
  }, [fetchProfileData, fetchStudentRequests]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const displayData = studentData || user || {};

  // Case-insensitive lookup in student_data JSON dictionary
  const getStudentData = useCallback(
    (key: string, fallback = '—') => {
      if (!displayData) return fallback;
      let parsed = displayData.student_data;
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed);
        } catch {
          parsed = null;
        }
      }
      if (!parsed || typeof parsed !== 'object') return fallback;

      const keys = Object.keys(parsed);
      const target = keys.find((k) => k.toLowerCase() === key.toLowerCase());
      const val = target ? parsed[target] : undefined;
      return val !== undefined && val !== null && String(val).trim() !== ''
        ? String(val).trim()
        : fallback;
    },
    [displayData]
  );

  const formatDate = (rawDate: any) => {
    if (!rawDate || rawDate === 'N/A' || rawDate === '—') return '—';
    try {
      const str = rawDate.toString().trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        const parts = str.split('T')[0].split('-');
        if (parts.length === 3) {
          const [y, m, d] = parts;
          return `${d}/${m}/${y}`;
        }
      }
      const parsed = new Date(str);
      if (!isNaN(parsed.getTime())) {
        const day = String(parsed.getDate()).padStart(2, '0');
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const year = parsed.getFullYear();
        return `${day}/${month}/${year}`;
      }
    } catch {
      // return fallback
    }
    return String(rawDate);
  };

  const photoRaw = displayData.student_photo || displayData.avatarUrl;
  const photoUrl = photoRaw ? getStaticFileUrl(photoRaw) : null;

  const courseVal =
    displayData.course ||
    getStudentData('Program') ||
    getStudentData('Course') ||
    '';
  const branchVal =
    displayData.branch ||
    getStudentData('Branch') ||
    getStudentData('Branch Name') ||
    '';
  const courseBranch =
    courseVal && branchVal && courseVal !== branchVal
      ? `${courseVal} - ${branchVal}`
      : courseVal || branchVal || '—';

  // Open Edit Profile modal with pre-populated current values
  const handleOpenEditModal = () => {
    setEditMobile(
      displayData.student_mobile ||
      getStudentData('Student Mobile number') ||
      displayData.phone ||
      ''
    );
    setEditEmail(
      displayData.email || getStudentData('Email') || student?.email || ''
    );
    setEditAddress(
      displayData.student_address ||
      getStudentData('Student Address') ||
      ''
    );
    setEditCity(
      displayData.city_village || getStudentData('City') || ''
    );
    setEditMandal(
      displayData.mandal_name || getStudentData('Mandal') || ''
    );
    setEditDistrict(
      displayData.district || getStudentData('District') || ''
    );
    setProfileModalVisible(true);
  };

  const handleProfileRequest = async () => {
    const changes: Record<string, string> = {};

    const curMobile =
      displayData.student_mobile ||
      getStudentData('Student Mobile number') ||
      displayData.phone ||
      '';
    const curEmail = displayData.email || getStudentData('Email') || '';
    const curAddress =
      displayData.student_address || getStudentData('Student Address') || '';
    const curCity = displayData.city_village || getStudentData('City') || '';
    const curMandal =
      displayData.mandal_name || getStudentData('Mandal') || '';
    const curDistrict =
      displayData.district || getStudentData('District') || '';

    if (editMobile.trim() && editMobile.trim() !== curMobile.trim()) {
      changes.student_mobile = editMobile.trim();
    }
    if (editEmail.trim() && editEmail.trim() !== curEmail.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail.trim())) {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
        return;
      }
      changes.email = editEmail.trim();
    }
    if (editAddress.trim() && editAddress.trim() !== curAddress.trim()) {
      changes.student_address = editAddress.trim();
    }
    if (editCity.trim() && editCity.trim() !== curCity.trim()) {
      changes.city_village = editCity.trim();
    }
    if (editMandal.trim() && editMandal.trim() !== curMandal.trim()) {
      changes.mandal_name = editMandal.trim();
    }
    if (editDistrict.trim() && editDistrict.trim() !== curDistrict.trim()) {
      changes.district = editDistrict.trim();
    }

    if (Object.keys(changes).length === 0) {
      Alert.alert(
        'No Changes Detected',
        'You have not changed any details to submit for review.'
      );
      return;
    }

    setSubmittingProfileRequest(true);
    try {
      await api.post('/profile-changes/request', {
        requested_changes: changes,
      });
      setProfileModalVisible(false);
      Alert.alert(
        'Request Submitted',
        'Your profile update request has been submitted for principal and admin review.'
      );
      await fetchStudentRequests();
    } catch (err: any) {
      Alert.alert(
        'Submission Failed',
        err.response?.data?.message || 'Unable to submit change request. Please try again.'
      );
    } finally {
      setSubmittingProfileRequest(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      Alert.alert('Password Required', 'Please enter your new password.');
      return;
    }
    if (newPassword.trim().length < 6) {
      Alert.alert('Password Too Short', 'Password must be at least 6 characters long.');
      return;
    }
    if (confirmPassword && newPassword !== confirmPassword) {
      Alert.alert('Passwords Mismatch', 'The passwords entered do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      if (isStudent) {
        const response = await api.post('/students/change-password', {
          newPassword: newPassword.trim(),
        });
        if (response.data?.success !== false) {
          Alert.alert('Success', 'Your password has been updated successfully.');
          setPasswordModalVisible(false);
          setNewPassword('');
          setConfirmPassword('');
          setCurrentPassword('');
          return;
        }
      }
      // Fallback for staff or alternative auth endpoint
      await authService.changePassword(currentPassword, newPassword.trim());
      Alert.alert('Success', 'Your password has been updated successfully.');
      setPasswordModalVisible(false);
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    } catch (err: any) {
      Alert.alert(
        'Password Change Failed',
        err.response?.data?.message || 'Unable to update password. Please check your credentials.'
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of your SDMS account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const parsedRequestedChanges = useMemo(() => {
    if (!pendingRequest?.requested_changes) return {};
    let ch = pendingRequest.requested_changes;
    if (typeof ch === 'string') {
      try {
        ch = JSON.parse(ch);
      } catch {
        ch = {};
      }
    }
    return typeof ch === 'object' && ch !== null ? ch : {};
  }, [pendingRequest]);

  return (
    <View style={styles.container}>
      <Header
        title="My Profile"
        subtitle="Account & Academic Records"
        showLogout={false}
        showBack
      />

      {loading ? (
        <ProfileSkeleton />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 16) + 72 },
          ]}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS === 'android'}
          overScrollMode="never"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#1E3A8A']}
              tintColor="#1E3A8A"
            />
          }
        >
          {/* 1. HERO BANNER CARD (Vibrant Royal Blue Gradient with Building Watermark) */}
          <LinearGradient
            colors={['#0047BA', '#0052CC', '#0284C7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            {/* Campus Architectural Building Watermark in Top Right */}
            <Building2
              size={135}
              color="rgba(255, 255, 255, 0.13)"
              style={styles.heroWatermark}
            />

            {/* Top Row: Avatar on Left, Name & Adm/Pin Pills on Right */}
            <View style={styles.heroTopRow}>
              <View style={styles.heroAvatarWrapper}>
                <View style={styles.heroAvatarCircle}>
                  {photoUrl ? (
                    <Image source={{ uri: photoUrl }} style={styles.heroAvatarImg} />
                  ) : (
                    <View style={styles.heroAvatarFallback}>
                      <User size={42} color="#0052CC" />
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.heroNameCol}>
                <Text style={styles.heroStudentName} numberOfLines={2}>
                  {displayData.student_name || displayData.name || user?.name || 'Student'}
                </Text>
                <View style={styles.heroPillsRow}>
                  <View style={styles.heroPillBadge}>
                    <Text style={styles.heroPillText}>
                      Adm: {displayData.admission_number || student?.admission_number || '—'}
                    </Text>
                  </View>
                  <View style={styles.heroPillBadge}>
                    <Text style={styles.heroPillText}>
                      Pin:{' '}
                      {displayData.pin_no ||
                        displayData.pin_number ||
                        displayData.pin ||
                        getStudentData('PIN') ||
                        getStudentData('Pin Number') ||
                        getStudentData('Pin No') ||
                        'Not Assigned'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Floating Academic Info Subcard (Overlapping the bottom edge of blue card) */}
          <View style={styles.academicFloatingCard}>
            <View style={styles.academicRow}>
              <Building2 size={17} color="#0052CC" />
              <Text style={styles.academicRowText} numberOfLines={1}>
                {displayData.college || getStudentData('College') || '—'}
              </Text>
            </View>

            <View style={styles.academicRow}>
              <GraduationCap size={17} color="#1E293B" />
              <Text style={styles.academicRowText} numberOfLines={1}>
                {courseBranch}
              </Text>
            </View>

            <View style={[styles.academicRow, { borderBottomWidth: 0 }]}>
              <Calendar size={17} color="#EA580C" />
              <Text style={styles.academicRowText} numberOfLines={1}>
                Year {displayData.current_year || getStudentData('Year') || '—'} / Sem{' '}
                {displayData.current_semester || getStudentData('Semister') || '—'}
              </Text>
            </View>
          </View>

          {/* 2. ACTION BUTTONS ROW: Edit Profile, Password & ID Card */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                pendingRequest ? styles.actionBtnWarning : styles.actionBtnPrimary,
              ]}
              onPress={handleOpenEditModal}
              activeOpacity={0.8}
            >
              {pendingRequest ? (
                <Clock size={14} color="#FFFFFF" />
              ) : (
                <Edit3 size={14} color="#FFFFFF" />
              )}
              <Text style={styles.actionBtnText} numberOfLines={1}>
                {pendingRequest ? 'Pending' : 'Edit Profile'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnDark]}
              onPress={() => setPasswordModalVisible(true)}
              activeOpacity={0.8}
            >
              <Lock size={14} color="#FFFFFF" />
              <Text style={styles.actionBtnText} numberOfLines={1}>
                Password
              </Text>
            </TouchableOpacity>

            {isStudent && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnOrange]}
                onPress={() => setShowIdCardModal(true)}
                activeOpacity={0.8}
              >
                <CreditCard size={14} color="#FFFFFF" />
                <Text style={styles.actionBtnText} numberOfLines={1}>
                  ID Card
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Pending Request Status Banner */}
          {pendingRequest && (
            <View style={styles.pendingBanner}>
              <View style={styles.pendingHeaderRow}>
                <View style={styles.pendingIconBox}>
                  <Clock size={16} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.pendingTitleRow}>
                    <Text style={styles.pendingTitle}>
                      Profile Change Request Under Review
                    </Text>
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>Pending Approval</Text>
                    </View>
                  </View>
                  <Text style={styles.pendingSubtitle}>
                    Your requested changes are awaiting approval from the College Principal and
                    Super Admin.
                  </Text>
                </View>
              </View>

              {/* Requested Changes Chips */}
              {Object.keys(parsedRequestedChanges).length > 0 && (
                <View style={styles.chipsRow}>
                  {Object.entries(parsedRequestedChanges).map(([k, v]) => (
                    <View key={k} style={styles.chipPill}>
                      <Text style={styles.chipKey}>
                        {String(k).replace(/_/g, ' ')}:{' '}
                      </Text>
                      <Text style={styles.chipVal}>{String(v || '—')}</Text>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={styles.pendingViewBtn}
                onPress={handleOpenEditModal}
                activeOpacity={0.8}
              >
                <Clock size={13} color="#FFFFFF" />
                <Text style={styles.pendingViewBtnText}>View Request</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Rejection Notification Banner */}
          {!pendingRequest && latestRequest && latestRequest.status === 'rejected' && (
            <View style={styles.rejectedBanner}>
              <View style={styles.rejectedHeaderRow}>
                <View style={styles.rejectedIconBox}>
                  <AlertCircle size={16} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rejectedTitle}>
                    Previous Profile Update Request Not Approved
                  </Text>
                  <Text style={styles.rejectedSubtitle}>
                    {latestRequest.comments
                      ? `Remarks: "${latestRequest.comments}"`
                      : 'Your previous change request was not approved.'}{' '}
                    You can review and submit an updated request.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.rejectedEditBtn}
                onPress={handleOpenEditModal}
                activeOpacity={0.8}
              >
                <Edit3 size={13} color="#FFFFFF" />
                <Text style={styles.rejectedEditBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 3. SEGMENTED TABS PILL BAR: Personal | Contact | Academic */}
          {isStudent && (
            <View style={styles.tabBarContainer}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'personal' && styles.tabBtnActive]}
                onPress={() => setActiveTab('personal')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    activeTab === 'personal' && styles.tabBtnTextActive,
                  ]}
                >
                  Personal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'contact' && styles.tabBtnActive]}
                onPress={() => setActiveTab('contact')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    activeTab === 'contact' && styles.tabBtnTextActive,
                  ]}
                >
                  Contact
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'academic' && styles.tabBtnActive]}
                onPress={() => setActiveTab('academic')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    activeTab === 'academic' && styles.tabBtnTextActive,
                  ]}
                >
                  Academic
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 4. DETAILS CARD WITH ICON ROWS (Matching exact image alignment) */}
          {isStudent ? (
            <View style={styles.detailsCard}>
              {/* Card Header with Icon Box */}
              <View style={styles.detailsCardHeader}>
                <View style={styles.detailsCardIconBox}>
                  {activeTab === 'personal' && <User size={16} color="#FFFFFF" />}
                  {activeTab === 'contact' && <Phone size={16} color="#FFFFFF" />}
                  {activeTab === 'academic' && <GraduationCap size={16} color="#FFFFFF" />}
                </View>
                <Text style={styles.detailsCardTitle}>
                  {activeTab === 'personal' && 'Personal Details'}
                  {activeTab === 'contact' && 'Contact Details'}
                  {activeTab === 'academic' && 'Academic Details'}
                </Text>
              </View>

              {/* TAB 1: PERSONAL DETAILS */}
              {activeTab === 'personal' && (
                <View>
                  <DetailRow
                    icon={User}
                    label="Father Name"
                    value={displayData.father_name || getStudentData('Father Name') || getStudentData('Father')}
                  />
                  <DetailRow
                    icon={UserCheck}
                    label="Gender"
                    value={displayData.gender || getStudentData('Gender')}
                  />
                  <DetailRow
                    icon={Calendar}
                    label="Date of Birth"
                    value={formatDate(displayData.dob || getStudentData('DOB') || getStudentData('Date of Birth'))}
                  />
                  <DetailRow
                    icon={Users}
                    label="Caste / Subcaste"
                    value={displayData.caste || getStudentData('Caste') || getStudentData('Sub Caste') || getStudentData('Caste / Subcaste')}
                  />
                  <DetailRow
                    icon={CreditCard}
                    label="Aadhar Number"
                    value={displayData.adhar_no || displayData.aadhar_number || getStudentData('Adhar No') || getStudentData('Aadhar Number') || getStudentData('Aadhar')}
                  />
                  {(displayData.mother_name || getStudentData('Mother Name')) && (
                    <DetailRow
                      icon={Heart}
                      label="Mother Name"
                      value={displayData.mother_name || getStudentData('Mother Name')}
                    />
                  )}
                  {(displayData.blood_group || getStudentData('Blood Group')) && (
                    <DetailRow
                      icon={ShieldAlert}
                      label="Blood Group"
                      value={displayData.blood_group || getStudentData('Blood Group')}
                      isLast
                    />
                  )}
                </View>
              )}

              {/* TAB 2: CONTACT DETAILS */}
              {activeTab === 'contact' && (
                <View>
                  <DetailRow
                    icon={Phone}
                    label="Student Mobile"
                    value={displayData.student_mobile || displayData.mobile || student?.mobile || getStudentData('Student Mobile') || getStudentData('Student Mobile number')}
                  />
                  <DetailRow
                    icon={Mail}
                    label="Student Email"
                    value={displayData.student_email || displayData.email || student?.email || getStudentData('Student Email')}
                  />
                  <DetailRow
                    icon={PhoneCall}
                    label="Parent Mobile 1"
                    value={displayData.parent_mobile || displayData.parent_mobile1 || getStudentData('Parent Mobile') || getStudentData('Parent Mobile Number 1') || getStudentData('Father Mobile')}
                  />
                  {(displayData.parent_mobile2 || getStudentData('Parent Mobile Number 2')) && (
                    <DetailRow
                      icon={PhoneCall}
                      label="Parent Mobile 2"
                      value={displayData.parent_mobile2 || getStudentData('Parent Mobile Number 2')}
                    />
                  )}
                  <DetailRow
                    icon={MapPin}
                    label="Full Address"
                    value={displayData.student_address || displayData.address || getStudentData('Student Address') || getStudentData('Address')}
                  />
                  <DetailRow
                    icon={Building2}
                    label="City / Village"
                    value={displayData.city_village || displayData.city || getStudentData('City') || getStudentData('Town')}
                  />
                  <DetailRow
                    icon={Compass}
                    label="Mandal"
                    value={displayData.mandal_name || displayData.mandal || getStudentData('Mandal')}
                  />
                  <DetailRow
                    icon={MapPin}
                    label="District"
                    value={displayData.district || getStudentData('District')}
                    isLast
                  />
                </View>
              )}

              {/* TAB 3: ACADEMIC DETAILS */}
              {activeTab === 'academic' && (
                <View>
                  <DetailRow
                    icon={FileText}
                    label="Admission Number"
                    value={displayData.admission_number || student?.admission_number}
                  />
                  <DetailRow
                    icon={CreditCard}
                    label="PIN / Roll No"
                    value={displayData.pin_no || displayData.pin_number || displayData.pin || getStudentData('PIN')}
                  />
                  <DetailRow
                    icon={Building2}
                    label="College"
                    value={displayData.college || getStudentData('College')}
                  />
                  <DetailRow
                    icon={GraduationCap}
                    label="Course"
                    value={displayData.course || getStudentData('Course')}
                  />
                  <DetailRow
                    icon={BookOpen}
                    label="Branch"
                    value={displayData.branch || getStudentData('Branch')}
                  />
                  <DetailRow
                    icon={Calendar}
                    label="Year & Semester"
                    value={`Year ${displayData.current_year || getStudentData('Year') || '—'} / Sem ${displayData.current_semester || getStudentData('Semister') || '—'}`}
                  />
                  <DetailRow
                    icon={Clock}
                    label="Section / Batch"
                    value={displayData.section || getStudentData('Section') || displayData.batch || getStudentData('Batch')}
                  />
                  <DetailRow
                    icon={Award}
                    label="Regulation"
                    value={displayData.regulation || getStudentData('Regulation')}
                    isLast
                  />
                </View>
              )}
            </View>
          ) : (
            /* Staff fallback view */
            <View style={styles.staffCard}>
              <View style={styles.staffHeader}>
                <ShieldAlert size={20} color="#1E3A8A" />
                <Text style={styles.staffTitle}>Staff Authority & Scope</Text>
              </View>
              <View style={styles.staffRow}>
                <Text style={styles.staffLabel}>Role Level</Text>
                <Text style={styles.staffVal}>
                  {(student?.role || 'Staff').replace('_', ' ').toUpperCase()}
                </Text>
              </View>
              <View style={styles.staffRow}>
                <Text style={styles.staffLabel}>Assigned Modules</Text>
                <Text style={styles.staffVal}>
                  {Array.isArray(student?.modules) && student.modules.length > 0
                    ? student.modules.join(', ')
                    : 'All Operations Permitted'}
                </Text>
              </View>
            </View>
          )}

          {/* Bottom Logout Button */}
          <View style={styles.logoutContainer}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.85}
            >
              <LogOut size={18} color="#FFFFFF" />
              <Text style={styles.logoutButtonText}>LOGOUT</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Change Password Modal */}
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setPasswordModalVisible(false)}
              hitSlop={8}
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>

            <View style={styles.modalHeaderCenter}>
              <View style={styles.modalIconBox}>
                <Lock size={22} color="#1E3A8A" />
              </View>
              <Text style={styles.modalTitle}>Change Password</Text>
              <Text style={styles.modalSubtitle}>
                Protect your account with a secure password
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="Min. 6 characters"
                  placeholderTextColor="#94A3B8"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={8}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#64748B" />
                  ) : (
                    <Eye size={18} color="#64748B" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#94A3B8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setPasswordModalVisible(false)}
                disabled={changingPassword}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSubmit]}
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalBtnSubmitText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={profileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalCard, { maxHeight: '88%' }]}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setProfileModalVisible(false)}
              hitSlop={8}
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>

            <View style={styles.modalHeaderCenter}>
              <View style={[styles.modalIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Edit3 size={22} color="#1E3A8A" />
              </View>
              <Text style={styles.modalTitle}>Request Profile Update</Text>
              <Text style={styles.modalSubtitle}>
                Submitted changes are reviewed and approved by college authorities.
              </Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 360 }}
              contentContainerStyle={{ paddingVertical: 4 }}
            >
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Student Mobile Number</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#94A3B8"
                  value={editMobile}
                  onChangeText={setEditMobile}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="name@example.com"
                  placeholderTextColor="#94A3B8"
                  value={editEmail}
                  onChangeText={setEditEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Residential Address</Text>
                <TextInput
                  style={[styles.modalTextInput, { height: 64, textAlignVertical: 'top' }]}
                  placeholder="House/Door No, Street name"
                  placeholderTextColor="#94A3B8"
                  value={editAddress}
                  onChangeText={setEditAddress}
                  multiline
                />
              </View>

              <View style={styles.inputRow}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.inputLabel}>City / Village</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="City or Village"
                    placeholderTextColor="#94A3B8"
                    value={editCity}
                    onChangeText={setEditCity}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.inputLabel}>Mandal</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="Mandal name"
                    placeholderTextColor="#94A3B8"
                    value={editMandal}
                    onChangeText={setEditMandal}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>District</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="District"
                  placeholderTextColor="#94A3B8"
                  value={editDistrict}
                  onChangeText={setEditDistrict}
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setProfileModalVisible(false)}
                disabled={submittingProfileRequest}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSubmit]}
                onPress={handleProfileRequest}
                disabled={submittingProfileRequest}
              >
                {submittingProfileRequest ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalBtnSubmitText}>Submit Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Digital Student ID Card Modal */}
      {isStudent && (
        <DigitalStudentIdCardModal
          visible={showIdCardModal}
          onClose={() => setShowIdCardModal(false)}
          student={displayData}
          getStudentData={getStudentData}
        />
      )}
    </View>
  );
}

// Clean, aligned DetailRow component matching the user's executive design
function DetailRow({
  icon: Icon,
  label,
  value,
  isLast = false,
}: {
  icon: any;
  label: string;
  value?: string | number | null;
  isLast?: boolean;
}) {
  const displayVal =
    value !== undefined &&
    value !== null &&
    String(value).trim() !== '' &&
    String(value) !== 'null' &&
    String(value) !== 'undefined'
      ? String(value)
      : '—';

  return (
    <View style={[styles.detailRow, isLast && { borderBottomWidth: 0 }]}>
      <View style={styles.detailRowLabelGroup}>
        <Icon size={16} color="#0052CC" />
        <Text style={styles.detailRowLabel}>{label}</Text>
      </View>
      <Text style={styles.detailRowValue} numberOfLines={2}>
        {displayVal}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  content: {
    padding: 14,
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  // 1. HERO BANNER CARD
  heroCard: {
    borderRadius: 24,
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 42,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#0047BA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  heroWatermark: {
    position: 'absolute',
    top: -8,
    right: 4,
    opacity: 0.16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroAvatarWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  heroAvatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarImg: {
    width: '100%',
    height: '100%',
  },
  heroAvatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroNameCol: {
    flex: 1,
    justifyContent: 'center',
  },
  heroStudentName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  heroPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  heroPillBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  heroPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0047BA',
    letterSpacing: 0.2,
  },
  // Floating Academic Subcard (Overlapping bottom edge of blue hero card)
  academicFloatingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginTop: -28,
    marginHorizontal: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 10,
  },
  academicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  academicRowText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  // 2. Action Buttons Row (Edit Profile, Password, ID Card)
  actionButtonsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    marginBottom: 14,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnPrimary: {
    backgroundColor: '#0052CC',
  },
  actionBtnWarning: {
    backgroundColor: '#D97706',
  },
  actionBtnDark: {
    backgroundColor: '#1E293B',
  },
  actionBtnOrange: {
    backgroundColor: '#EA580C',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  // Pending Request Banner
  pendingBanner: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 12,
    marginTop: 14,
  },
  pendingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  pendingIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  pendingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  pendingTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
    flex: 1,
  },
  pendingBadge: {
    backgroundColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  pendingBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#92400E',
    textTransform: 'uppercase',
  },
  pendingSubtitle: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '500',
    marginTop: 3,
    lineHeight: 16,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  chipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  chipKey: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#B45309',
    textTransform: 'capitalize',
  },
  chipVal: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  pendingViewBtn: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  pendingViewBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  // Rejection Banner
  rejectedBanner: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    padding: 12,
    marginTop: 14,
  },
  rejectedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  rejectedIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  rejectedTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991B1B',
  },
  rejectedSubtitle: {
    fontSize: 11,
    color: '#B91C1C',
    fontWeight: '500',
    marginTop: 3,
    lineHeight: 16,
  },
  rejectedEditBtn: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  rejectedEditBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  // 3. SEGMENTED TABS CONTAINER
  tabBarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 24,
  },
  tabBtnActive: {
    backgroundColor: '#0047BA',
    shadowColor: '#0047BA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  // 4. DETAILS CARD
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  detailsCardHeader: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailsCardIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#0047BA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  detailsCardTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0047BA',
    letterSpacing: -0.2,
  },
  // DETAIL ROW TABLE ITEMS
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailRowLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  detailRowLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#475569',
  },
  detailRowValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'right',
    marginLeft: 12,
  },
  // Staff fallback card
  staffCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    gap: 10,
  },
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  staffTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  staffRow: {
    gap: 2,
  },
  staffLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  staffVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  // Bottom Logout Button
  logoutContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  logoutButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
    paddingVertical: 13,
    borderRadius: 16,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  // Modals
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    zIndex: 10,
  },
  modalHeaderCenter: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 3,
    textAlign: 'center',
    lineHeight: 17,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  modalTextInput: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 13.5,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    padding: 6,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  modalBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  modalBtnCancel: {
    backgroundColor: '#F1F5F9',
  },
  modalBtnSubmit: {
    backgroundColor: '#1E3A8A',
  },
  modalBtnCancelText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  modalBtnSubmitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
