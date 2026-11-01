import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar as RNStatusBar } from 'react-native';
import { Menu, Bell } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StudentSidebarDrawer } from './StudentSidebarDrawer';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showLogout?: boolean;
  showPydianTag?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showLogout = false,
  showPydianTag,
}) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? RNStatusBar.currentHeight || 24 : 0,
    16
  );
  const router = useRouter();
  const { user, userType } = useAuth();
  const [showSidebar, setShowSidebar] = useState(false);
  const isStudent =
    userType === 'student' ||
    (!userType && !(user as any)?.role?.includes('admin') && !(user as any)?.role?.includes('staff'));

  const shouldShowPydian = showPydianTag || title.toLowerCase().includes('good');

  return (
    <>
      <View style={[styles.container, { paddingTop: topInset + 8 }]}>
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
        <Image source={require("../../assets/pydah-logo.png")} style={styles.brandLogo} resizeMode="contain" />
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {shouldShowPydian && (
              <View style={styles.pydianTag}>
                <Text style={styles.pydianTagText}>Pydian</Text>
              </View>
            )}
          </View>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        <View style={styles.actions}>
          {isStudent && (
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/announcements' as any)}
              style={styles.bellBtn}
              hitSlop={8}
            >
              <Bell size={18} color="#1E3A8A" />
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>2</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

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
  brandLogo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  pydianTag: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  pydianTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EA580C',
    letterSpacing: 0.3,
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
  bellBtn: {
    position: 'relative',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 7,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});

export default Header;
