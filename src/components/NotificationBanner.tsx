import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  Sparkles,
  X,
  ChevronRight,
  AlertTriangle,
  GraduationCap,
  Calendar,
  Briefcase,
  Award,
} from 'lucide-react-native';
import notificationService, { InAppAlert } from '../services/notificationService';
import { isExamRelated } from '../utils/filterUtils';

export const NotificationBanner: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [alert, setAlert] = useState<InAppAlert | null>(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const dismissTimer = useRef<any>(null);

  const topOffset = Math.max(insets.top, Platform.OS === 'android' ? 24 : 12);

  const showBanner = (newAlert: InAppAlert) => {
    if (!newAlert || isExamRelated(newAlert)) return;
    setAlert(newAlert);
    if (dismissTimer.current) clearTimeout(dismissTimer.current);

    Animated.spring(translateY, {
      toValue: 0,
      damping: 20,
      mass: 0.8,
      stiffness: 220,
      useNativeDriver: true,
    }).start();

    // Auto dismiss after 6 seconds
    dismissTimer.current = setTimeout(() => {
      hideBanner();
    }, 6000);
  };

  const hideBanner = () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    Animated.timing(translateY, {
      toValue: -150,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setAlert(null);
    });
  };

  useEffect(() => {
    const unsubscribe = notificationService.subscribeAlert(showBanner);
    return () => {
      unsubscribe();
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);

  if (!alert || isExamRelated(alert)) return null;

  const isEvent = alert.type === 'event';
  const categoryStr = (alert.category || '').toLowerCase();

  // Dynamic category resolver for all types of notices and events
  let badgeText = isEvent ? '🎉 CAMPUS EVENT' : '📢 CIRCULAR';
  let badgeColor = '#D97706';
  let badgeBg = '#FEF3C7';
  let IconComponent = Bell;

  if (isEvent) {
    if (categoryStr.includes('workshop')) {
      badgeText = '🛠️ WORKSHOP';
      badgeColor = '#4F46E5';
      badgeBg = '#EEF2FF';
      IconComponent = Sparkles;
    } else if (categoryStr.includes('seminar') || categoryStr.includes('webinar')) {
      badgeText = '💡 SEMINAR';
      badgeColor = '#0891B2';
      badgeBg = '#ECFEFF';
      IconComponent = Sparkles;
    } else if (categoryStr.includes('sports')) {
      badgeText = '🏆 SPORTS';
      badgeColor = '#059669';
      badgeBg = '#ECFDF5';
      IconComponent = Award;
    } else if (categoryStr.includes('cultural') || categoryStr.includes('fest')) {
      badgeText = '🎭 CULTURAL FEST';
      badgeColor = '#9333EA';
      badgeBg = '#FAF5FF';
      IconComponent = Sparkles;
    } else if (categoryStr.includes('placement') || categoryStr.includes('drive')) {
      badgeText = '💼 PLACEMENT DRIVE';
      badgeColor = '#2563EB';
      badgeBg = '#EFF6FF';
      IconComponent = Briefcase;
    } else {
      badgeText = `🎉 ${alert.category ? alert.category.toUpperCase() : 'CAMPUS EVENT'}`;
      badgeColor = '#2563EB';
      badgeBg = '#EFF6FF';
      IconComponent = Calendar;
    }
  } else {
    // Announcements
    if (categoryStr.includes('academic') || categoryStr.includes('syllabus')) {
      badgeText = '📚 ACADEMIC NOTICE';
      badgeColor = '#2563EB';
      badgeBg = '#EFF6FF';
      IconComponent = GraduationCap;
    } else if (categoryStr.includes('urgent') || categoryStr.includes('important')) {
      badgeText = '🚨 URGENT NOTICE';
      badgeColor = '#DC2626';
      badgeBg = '#FEE2E2';
      IconComponent = AlertTriangle;
    } else if (categoryStr.includes('holiday')) {
      badgeText = '🌴 HOLIDAY ALERT';
      badgeColor = '#059669';
      badgeBg = '#ECFDF5';
      IconComponent = Calendar;
    } else {
      badgeText = `📢 ${alert.category ? alert.category.toUpperCase() : 'CIRCULAR'}`;
      badgeColor = '#D97706';
      badgeBg = '#FEF3C7';
      IconComponent = Bell;
    }
  }

  const handlePress = () => {
    hideBanner();
    router.push('/(tabs)/announcements');
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { top: topOffset + 4, transform: [{ translateY }] },
      ]}
    >
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={handlePress}
      >
        {/* Leading Campo C Logo + Category Mini Badge */}
        <View style={styles.brandIconWrapper}>
          <Image
            source={require('../../assets/campo-icon.png')}
            style={styles.campoLogo}
            resizeMode="contain"
          />
          <View style={[styles.miniBadge, { backgroundColor: badgeColor }]}>
            <IconComponent size={9} color="#FFFFFF" />
          </View>
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <View style={styles.metaRow}>
            <Text style={[styles.badgeLabel, { color: badgeColor }]}>
              {badgeText}
            </Text>
            <Text style={styles.timeLabel}>• Campo</Text>
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {alert.title}
          </Text>
          {alert.body ? (
            <View style={styles.bodyWrapper}>
              <Text style={styles.body} numberOfLines={2}>
                {alert.body}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Tap to view */}
        <View style={styles.actionRow}>
          <ChevronRight size={16} color="#94A3B8" />
        </View>

        {/* Dismiss Button */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={(e) => {
            e.stopPropagation();
            hideBanner();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={14} color="#94A3B8" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 9999,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.16,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  brandIconWrapper: {
    position: 'relative',
    width: 38,
    height: 38,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  campoLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  miniBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  timeLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#94A3B8',
  },
  textContainer: {
    flex: 1,
    marginRight: 6,
  },
  badgeLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  bodyWrapper: {
    marginTop: 1,
  },
  body: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
    fontWeight: '400',
  },
  actionRow: {
    paddingHorizontal: 2,
  },
  closeBtn: {
    padding: 6,
    marginLeft: 4,
  },
});

export default NotificationBanner;
