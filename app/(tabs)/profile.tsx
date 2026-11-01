import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { User, Mail, Phone, BookOpen, GraduationCap, ShieldAlert, LogOut, KeyRound } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import Header from '../../src/components/Header';
import CustomButton from '../../src/components/CustomButton';
import { getStaticFileUrl } from '../../src/config/api';
import { ENV } from '../../src/config/env';

export default function ProfileScreen() {
  const { user, userType, logout } = useAuth();
  const student = user as any;
  const avatarUrl = student?.avatarUrl ? getStaticFileUrl(student.avatarUrl) : null;

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of your session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header title="My Profile" subtitle="Account & Academic Records" showLogout={false} />

      <ScrollView contentContainerStyle={styles.content}>
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

        {/* Academic Details */}
        <Text style={styles.sectionHeader}>Academic Information</Text>
        <View style={styles.infoCard}>
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
        </View>

        {/* Account Security */}
        <Text style={styles.sectionHeader}>Account & Security</Text>
        <View style={styles.infoCard}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() =>
              Alert.alert('Change Password', 'Password change service ready in settings.')
            }
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
});

