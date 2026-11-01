import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState } from 'react';
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
} from 'react-native';
import { User, Mail, Phone, BookOpen, GraduationCap, ShieldAlert, LogOut, KeyRound } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import Header from '../../src/components/Header';
import CustomButton from '../../src/components/CustomButton';
import api, { getStaticFileUrl } from '../../src/config/api';
import { ENV } from '../../src/config/env';
import authService from '../../src/services/authService';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, userType, logout } = useAuth();
  const student = user as any;
  const avatarUrl = student?.avatarUrl ? getStaticFileUrl(student.avatarUrl) : null;
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [profileEmail, setProfileEmail] = useState(student?.email || '');
  const [profilePhone, setProfilePhone] = useState(student?.phone || '');
  const [submittingProfileRequest, setSubmittingProfileRequest] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing details', 'Complete all password fields before submitting.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Password too short', 'Your new password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Check the new password and confirmation.');
      return;
    }

    setChangingPassword(true);
    try {
      if (userType === 'student') {
        await authService.changePassword(currentPassword, newPassword);
      } else {
        await api.post('/auth/change-password', { currentPassword, newPassword });
      }
      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Password changed', 'Your password has been updated.');
    } catch (error: any) {
      Alert.alert(
        'Password change failed',
        error.response?.data?.message || 'Unable to change your password. Please try again.'
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const handleProfileRequest = async () => {
    const requestedChanges: Record<string, string> = {};
    if (profileEmail.trim() !== String(student?.email || '').trim()) {
      requestedChanges.email = profileEmail.trim();
    }
    if (profilePhone.trim() !== String(student?.phone || '').trim()) {
      requestedChanges.student_mobile = profilePhone.trim();
    }
    if (Object.keys(requestedChanges).length === 0) {
      Alert.alert('No changes', 'Update your email or phone number before submitting.');
      return;
    }
    if (requestedChanges.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requestedChanges.email)) {
      Alert.alert('Invalid email', 'Enter a valid email address.');
      return;
    }

    setSubmittingProfileRequest(true);
    try {
      await api.post('/profile-changes/request', { requested_changes: requestedChanges });
      setProfileModalVisible(false);
      Alert.alert(
        'Request submitted',
        'Your profile update is awaiting approval from the college.'
      );
    } catch (error: any) {
      Alert.alert(
        'Request failed',
        error.response?.data?.message || 'Unable to submit your profile update. Please try again.'
      );
    } finally {
      setSubmittingProfileRequest(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of your session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header title="My Profile" subtitle="Account & Academic Records" showLogout={false} />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 84 }]}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {(student?.name || student?.username || 'U')[0].toUpperCase()}
              </Text>
            </View>
          )}

          <Text style={styles.name}>{student?.name || student?.username || 'Student Name'}</Text>
          <Text style={styles.rollNumber}>{student?.rollNumber || 'Roll Number N/A'}</Text>

          <View style={styles.roleTag}>
            <Text style={styles.roleTagText}>{userType?.toUpperCase() || 'STUDENT'}</Text>
          </View>
        </View>

        {/* Academic / Staff Role Details */}
        <Text style={styles.sectionHeader}>
          {userType === 'student' ? 'Academic Information' : 'Staff Scope & Authority'}
        </Text>
        <View style={styles.infoCard}>
          {userType === 'student' ? (
            <>
              <View style={styles.infoRow}>
                <GraduationCap size={18} color="#1E3A8A" />
                <View style={styles.infoTextCol}>
                  <Text style={styles.infoLabel}>College</Text>
                  <Text style={styles.infoValue}>{student?.collegeName || 'Pydah College'}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <BookOpen size={18} color="#1E3A8A" />
                <View style={styles.infoTextCol}>
                  <Text style={styles.infoLabel}>Course & Branch</Text>
                  <Text style={styles.infoValue}>
                    {student?.courseName || 'B.Tech'} - {student?.branchName || 'CSE'}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <User size={18} color="#1E3A8A" />
                <View style={styles.infoTextCol}>
                  <Text style={styles.infoLabel}>Semester & Year</Text>
                  <Text style={styles.infoValue}>
                    Semester {student?.currentSemester || 1} • {student?.academicYear || '2025-2026'}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <ShieldAlert size={18} color="#1E3A8A" />
                <View style={styles.infoTextCol}>
                  <Text style={styles.infoLabel}>Role Permission Level</Text>
                  <Text style={styles.infoValue}>
                    {(student?.role || 'Staff').replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <BookOpen size={18} color="#1E3A8A" />
                <View style={styles.infoTextCol}>
                  <Text style={styles.infoLabel}>Assigned Modules ({Array.isArray(student?.modules) ? student.modules.length : 'All'})</Text>
                  <Text style={styles.infoValue}>
                    {Array.isArray(student?.modules) && student.modules.length > 0
                      ? student.modules.join(', ')
                      : 'All Operations Permitted'}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Contact Details */}
        <Text style={styles.sectionHeader}>Contact Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Mail size={18} color="#1E3A8A" />
            <View style={styles.infoTextCol}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>{student?.email || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Phone size={18} color="#1E3A8A" />
            <View style={styles.infoTextCol}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{student?.phone || 'N/A'}</Text>
            </View>
          </View>
          {userType === 'student' ? (
            <TouchableOpacity
              style={styles.profileRequestButton}
              onPress={() => {
                setProfileEmail(student?.email || '');
                setProfilePhone(student?.phone || '');
                setProfileModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.profileRequestButtonText}>Request Profile Update</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Account Security */}
        <Text style={styles.sectionHeader}>Account & Security</Text>
        <View style={styles.infoCard}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => setPasswordModalVisible(true)}
          >
            <View style={styles.actionRowLeft}>
              <KeyRound size={18} color="#64748B" />
              <Text style={styles.actionRowText}>Change Password</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() =>
              Alert.alert(
                'EAS Environment Config',
                `Current Profile: ${ENV.appEnv}\nAPI Root: ${ENV.apiUrl}\nGateway: ${ENV.ppgUrl}`
              )
            }
          >
            <View style={styles.actionRowLeft}>
              <ShieldAlert size={18} color="#64748B" />
              <Text style={styles.actionRowText}>Connection Environment</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <CustomButton
          title="Sign Out"
          variant="danger"
          onPress={handleLogout}
          icon={<LogOut size={18} color="#FFFFFF" />}
          style={{ marginTop: 24 }}
        />
      </ScrollView>
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="New password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setPasswordModalVisible(false)}
                disabled={changingPassword}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSubmitButton]}
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={profileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Request Profile Update</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Email address"
              value={profileEmail}
              onChangeText={setProfileEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Phone number"
              value={profilePhone}
              onChangeText={setProfilePhone}
              keyboardType="phone-pad"
            />
            <Text style={styles.modalHelpText}>
              Profile changes are sent for approval before they appear on your account.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setProfileModalVisible(false)}
                disabled={submittingProfileRequest}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSubmitButton]}
                onPress={handleProfileRequest}
                disabled={submittingProfileRequest}
              >
                {submittingProfileRequest ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>Submit Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#1E3A8A',
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  rollNumber: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  roleTag: {
    marginTop: 10,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  roleTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 10,
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoTextCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  actionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionRowText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  profileRequestButton: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    marginTop: 16,
    paddingVertical: 11,
  },
  profileRequestButtonText: {
    color: '#1E3A8A',
    fontSize: 13,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  modalCancelButton: {
    backgroundColor: '#F1F5F9',
  },
  modalSubmitButton: {
    backgroundColor: '#1E3A8A',
  },
  modalCancelText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalHelpText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
});
