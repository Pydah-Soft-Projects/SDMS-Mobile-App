import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LogOut, Terminal, Menu } from 'lucide-react-native';
import { StudentSidebarDrawer } from './StudentSidebarDrawer';
import { useAuth } from '../context/AuthContext';
import { getStaticFileUrl } from '../config/api';
import LogViewerModal from './LogViewerModal';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showLogout?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, showLogout = true }) => {
  const { user, userType, logout } = useAuth();
  const [showSidebar, setShowSidebar] = useState(false);
  const isStudent = userType === 'student' || (!userType && !(user as any)?.role?.includes('admin') && !(user as any)?.role?.includes('staff'));
  const [showLogs, setShowLogs] = useState(false);
  const avatarUrl = (user as any)?.avatarUrl ? getStaticFileUrl((user as any).avatarUrl) : null;

  return (
    <>
      <View style={styles.container}>
        {isStudent && (
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => setShowSidebar(true)}
            hitSlop={8}
            activeOpacity={0.7}
          >
            <Menu size={22} color="#1E3A8A" />
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => setShowLogs(true)}
            style={styles.terminalBtn}
            hitSlop={8}
          >
            <Terminal size={18} color="#1E3A8A" />
          </TouchableOpacity>

          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {(user?.name || (user as any)?.username || 'U')[0].toUpperCase()}
              </Text>
            </View>
          )}

          {showLogout && (
            <TouchableOpacity onPress={logout} style={styles.logoutBtn} hitSlop={10}>
              <LogOut size={18} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <LogViewerModal visible={showLogs} onClose={() => setShowLogs(false)} />
      <StudentSidebarDrawer visible={showSidebar} onClose={() => setShowSidebar(false)} />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuBtn: {
    marginRight: 12,
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  terminalBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#1E3A8A',
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
});

export default Header;
