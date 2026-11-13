import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, StatusBar as RNStatusBar } from 'react-native';
import { Menu, BellRing } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StudentSidebarDrawer } from './StudentSidebarDrawer';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notificationService';

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

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isStudent) return;
    notificationService.getUnreadCount().then(setUnreadCount);
    const unsubscribe = notificationService.subscribeBadge(setUnreadCount);
    return unsubscribe;
  }, [isStudent]);

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
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {title}
            </Text>
            {shouldShowPydian && (
              <View style={styles.pydianTag}>
                <Text style={styles.pydianTagText}>Campo</Text>
              </View>
            )}
          </View>
          {subtitle && <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">{subtitle}</Text>}
        </View>

        <View style={styles.actions}>
          {isStudent && (
            <TouchableOpacity
              onPress={() => {
                setUnreadCount(0);
                notificationService.markAllAsSeen();
                router.push('/(tabs)/announcements' as any);
              }}
              style={styles.bellBtn}
              hitSlop={8}
            >
              <BellRing size={20} color="#1E3A8A" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  brandLogo: {
    width: 32,
    height: 32,
    marginHorizontal: 8,
  },
  menuBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 10,
  },
  titleContainer: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    flexShrink: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  pydianTag: {
    flexShrink: 0,
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
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  actions: {
    width: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: 8,
  },
  bellBtn: {
    position: 'relative',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});

export default Header;
