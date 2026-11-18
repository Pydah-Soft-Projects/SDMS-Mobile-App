import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { BellRing, ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notificationService';
import { getStaticFileUrl } from '../config/api';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showLogout?: boolean;
  showPydianTag?: boolean;
  showBuddyTag?: boolean;
  showBack?: boolean;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showLogout = false,
  showPydianTag,
  showBuddyTag,
  showBack = false,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? RNStatusBar.currentHeight || 24 : 0,
    16
  );
  const router = useRouter();
  const { user, userType } = useAuth();
  const student = user as any;
  const isStudent =
    userType === 'student' ||
    (!userType && !student?.role?.includes('admin') && !student?.role?.includes('staff'));

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isStudent) return;
    notificationService.getUnreadCount().then(setUnreadCount);
    const unsubscribe = notificationService.subscribeBadge(setUnreadCount);
    return unsubscribe;
  }, [isStudent]);

  const shouldShowBuddy =
    showBuddyTag !== undefined
      ? showBuddyTag
      : showPydianTag !== undefined
      ? showPydianTag
      : title.toLowerCase().includes('good');
  const initialLetter =
    (student?.name || student?.student_name || 'S')?.charAt(0)?.toUpperCase() || 'S';
  const studentPhotoUri =
    student?.avatarUrl || student?.student_photo
      ? getStaticFileUrl(student.avatarUrl || student.student_photo)
      : null;

  const handleBackPress = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)' as any);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topInset + 8 }]}>
      {/* Left: Back Button (optional) + Brand Icon + Divider (Matching Web TopHeaderBar) */}
      <View style={styles.brandGroup}>
        {showBack && (
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backBtn}
            hitSlop={10}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#1E293B" />
          </TouchableOpacity>
        )}
        <Image
          source={require('../../assets/campo-icon.png')}
          style={styles.brandIcon}
          resizeMode="contain"
        />
        <View style={styles.verticalDivider} />
      </View>

      {/* Middle: Title & Buddy in Cursive */}
      <View style={styles.titleContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            {title}
          </Text>
          {shouldShowBuddy && (
            <Text style={styles.buddyCursiveText}>Buddy</Text>
          )}
        </View>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right: Notifications Bell + Profile Avatar Button */}
      <View style={styles.actions}>
        {isStudent && (
          <>
            {/* Notification Bell */}
            <TouchableOpacity
              onPress={() => {
                setUnreadCount(0);
                notificationService.markAllAsSeen();
                router.push('/(tabs)/announcements' as any);
              }}
              style={styles.bellBtn}
              hitSlop={8}
              activeOpacity={0.7}
            >
              <BellRing size={19} color="#1E3A8A" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Profile Avatar Button (Navigates directly to profile, replacing sidebar) */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile' as any)}
              style={styles.profileBtn}
              activeOpacity={0.7}
            >
              {studentPhotoUri ? (
                <Image source={{ uri: studentPhotoUri }} style={styles.profileBtnImg} />
              ) : (
                <Text style={styles.profileInitialText}>{initialLetter}</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
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
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 6,
    paddingLeft: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  verticalDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E2E8F0',
    marginLeft: 10,
  },
  titleContainer: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  buddyCursiveText: {
    fontFamily: 'DancingScript-Bold',
    fontSize: 20,
    color: '#1E3A8A',
    marginLeft: 3,
    transform: [{ translateY: -1 }],
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  bellBtn: {
    position: 'relative',
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
  },
  profileBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
  },
  profileBtnImg: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  profileInitialText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default Header;
