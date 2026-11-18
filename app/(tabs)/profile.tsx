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
import {
  User,
  Mail,
  Phone,
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
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import Header from '../../src/components/Header';
import api, { getStaticFileUrl } from '../../src/config/api';
import authService from '../../src/services/authService';
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
    if (!admissionNo) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get(`/students/${encodeURIComponent(admissionNo)}`);
      if (res.data?.success && res.data.data) {
        setStudentData(res.data.data);
      } else if (res.data && typeof res.data === 'object') {
        setStudentData(res.data.data || res.data.student || res.data);
      }
    } catch {
      // Keep existing data or user fallback
    }
  }, [admissionNo]);

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
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.loaderText}>Loading student profile...</Text>
        </View>
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
          {/* Top Banner (Deep Blue with subtle decorative accents) */}
          <View style={styles.topBanner}>
            <View style={styles.bannerGlow1} />
            <View style={styles.bannerGlow2} />
          </View>

          {/* Profile Card overlapping banner */}
          <View style={styles.profileCard}>
            {/* Circular Profile Avatar */}
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarCircle}>
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <User size={46} color="#1E3A8A" />
                  </View>
                )}
              </View>
            </View>

            {/* Student Name */}
            <Text style={styles.studentName} numberOfLines={2}>
              {displayData.student_name || displayData.name || user?.name || 'Student'}
            </Text>

            {/* Admission & PIN Pills */}
            <View style={styles.pillsRow}>
              <View style={styles.pillBadge}>
                <Text style={styles.pillText}>
                  Adm: {displayData.admission_number || student?.admission_number || '—'}
                </Text>
              </View>
              <View style={styles.pillBadge}>
                <Text style={styles.pillText}>
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

            {/* Academic Subcard: College, Branch & Year with Icons */}
            <View style={styles.academicSubCard}>
              <View style={styles.academicItem}>
                <Building2 size={15} color="#1E3A8A" />
                <Text style={styles.academicText} numberOfLines={1}>
                  {displayData.college || getStudentData('College') || '—'}
                </Text>
              </View>

              <View style={styles.academicItem}>
                <GraduationCap size={15} color="#16A34A" />
                <Text style={styles.academicText} numberOfLines={1}>
                  {courseBranch}
                </Text>
              </View>

              <View style={styles.academicItem}>
                <Calendar size={15} color="#D97706" />
                <Text style={styles.academicText} numberOfLines={1}>
                  Year {displayData.current_year || getStudentData('Year') || '—'} / Sem{' '}
                  {displayData.current_semester || getStudentData('Semister') || '—'}
                </Text>
              </View>
            </View>

            {/* Action Buttons: Edit Profile, Change Password & ID Card */}
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
                  <Clock size={13} color="#FFFFFF" />
                ) : (
                  <Edit3 size={13} color="#FFFFFF" />
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
                <Lock size={13} color="#FFFFFF" />
                <Text style={styles.actionBtnText} numberOfLines={1}>
                  Password
                </Text>
              </TouchableOpacity>

              {isStudent && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnEmerald]}
                  onPress={() => setShowIdCardModal(true)}
                  activeOpacity={0.8}
                >
                  <CreditCard size={13} color="#FFFFFF" />
                  <Text style={styles.actionBtnText} numberOfLines={1}>
                    ID Card
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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

          {/* Cards Container: Personal Details & Connect Details */}
          {isStudent ? (
            <View style={styles.sectionsContainer}>
              {/* 1. PERSONAL DETAILS CARD (Soft Blue container) */}
              <View style={styles.cardBlue}>
                <View style={styles.cardHeaderBlue}>
                  <View style={styles.cardIconBlue}>
                    <User size={16} color="#FFFFFF" />
                  </View>
                  <Text style={styles.cardTitleBlue}>PERSONAL DETAILS</Text>
                </View>

                {/* Row 1: Father Name | Gender | DOB */}
                <View style={styles.infoGridRow}>
                  <View style={{ flex: 1.2 }}>
                    <InfoItem
                      label="Father"
                      value={displayData.father_name || getStudentData('Father Name')}
                    />
                  </View>
                  <View style={{ flex: 0.9 }}>
                    <InfoItem
                      label="Gender"
                      value={displayData.gender || getStudentData('Gender')}
                    />
                  </View>
                  <View style={{ flex: 0.9 }}>
                    <InfoItem
                      label="DOB"
                      value={formatDate(displayData.dob || getStudentData('DOB'))}
                    />
                  </View>
                </View>

                {/* Row 2: Caste / Subcaste | Aadhar Number */}
                <View style={[styles.infoGridRow, styles.dividerBlue]}>
                  <View style={{ flex: 1 }}>
                    <InfoItem
                      label="Caste / Subcaste"
                      value={displayData.caste || getStudentData('Caste')}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <InfoItem
                      label="Aadhar Number"
                      value={displayData.adhar_no || getStudentData('Adhar No')}
                    />
                  </View>
                </View>
              </View>

              {/* 2. CONNECT DETAILS CARD (Soft Amber container) */}
              <View style={styles.cardAmber}>
                <View style={styles.cardHeaderAmber}>
                  <View style={styles.cardIconAmber}>
                    <MapPin size={16} color="#FFFFFF" />
                  </View>
                  <Text style={styles.cardTitleAmber}>CONNECT DETAILS</Text>
                </View>

                {/* Row 1: Student Mobile | Parent 1 | Parent 2 */}
                <View style={styles.infoGridRow}>
                  <View style={{ flex: 1.1 }}>
                    <InfoItem
                      label="Student Mobile"
                      value={
                        displayData.student_mobile ||
                        getStudentData('Student Mobile number')
                      }
                    />
                  </View>
                  <View style={{ flex: 0.95 }}>
                    <InfoItem
                      label="Parent 1"
                      value={
                        displayData.parent_mobile1 ||
                        getStudentData('Parent Mobile Number 1')
                      }
                    />
                  </View>
                  <View style={{ flex: 0.95 }}>
                    <InfoItem
                      label="Parent 2"
                      value={
                        displayData.parent_mobile2 ||
                        getStudentData('Parent Mobile Number 2')
                      }
                    />
                  </View>
                </View>

                {/* Row 2: Full Address | City / Village */}
                <View style={[styles.infoGridRow, styles.dividerAmber]}>
                  <View style={{ flex: 1.2 }}>
                    <InfoItem
                      label="Full Address"
                      value={
                        displayData.student_address ||
                        getStudentData('Student Address')
                      }
                    />
                  </View>
                  <View style={{ flex: 0.8 }}>
                    <InfoItem
                      label="City / Village"
                      value={displayData.city_village || getStudentData('City')}
                    />
                  </View>
                </View>

                {/* Row 3: Mandal | District */}
                <View style={[styles.infoGridRow, styles.dividerAmber]}>
                  <View style={{ flex: 1 }}>
                    <InfoItem
                      label="Mandal"
                      value={displayData.mandal_name || getStudentData('Mandal')}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <InfoItem
                      label="District"
                      value={displayData.district || getStudentData('District')}
                    />
                  </View>
                </View>
              </View>
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

// Compact, crisp InfoItem component matching the web layout
function InfoItem({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  const displayVal =
    value !== undefined && value !== null && String(value).trim() !== ''
      ? String(value)
      : '—';

  return (
    <View style={styles.infoItemCard}>
      <Text style={styles.infoItemLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.infoItemValue} numberOfLines={2}>
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
    padding: 12,
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  // Top Banner (matches web gradient backdrop)
  topBanner: {
    height: 110,
    backgroundColor: '#1E3A8A',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerGlow1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  bannerGlow2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  // Profile Card
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginTop: -45,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarWrapper: {
    marginTop: -48,
    marginBottom: 8,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  pillBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 10,
  },
  pillText: {
    color: '#1D4ED8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  // Academic SubCard
  academicSubCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 10,
    marginTop: 12,
    gap: 6,
  },
  academicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  academicText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    flex: 1,
  },
  // Action Buttons Row (Edit Profile, Change Password & ID Card)
  actionButtonsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnPrimary: {
    backgroundColor: '#1E3A8A',
  },
  actionBtnWarning: {
    backgroundColor: '#D97706',
  },
  actionBtnDark: {
    backgroundColor: '#1E293B',
  },
  actionBtnEmerald: {
    backgroundColor: '#059669', // matching web emerald-600
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
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
  // Sections Container
  sectionsContainer: {
    gap: 14,
    marginTop: 14,
  },
  // 1. Personal Details Card (Blue theme matching web)
  cardBlue: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 18,
    padding: 12,
  },
  cardHeaderBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
    marginBottom: 10,
  },
  cardIconBlue: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleBlue: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#1E3A8A',
    letterSpacing: 0.8,
  },
  dividerBlue: {
    borderTopWidth: 1,
    borderTopColor: '#DBEAFE',
    paddingTop: 8,
    marginTop: 8,
  },
  // 2. Connect Details Card (Amber theme matching web)
  cardAmber: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 18,
    padding: 12,
  },
  cardHeaderAmber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    marginBottom: 10,
  },
  cardIconAmber: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleAmber: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#B45309',
    letterSpacing: 0.8,
  },
  dividerAmber: {
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
    paddingTop: 8,
    marginTop: 8,
  },
  // Shared InfoItem Grid Rows
  infoGridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  infoItemCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 11,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 50,
    justifyContent: 'center',
  },
  infoItemLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  infoItemValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 16,
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
