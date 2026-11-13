import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Tabs } from 'expo-router';
import {
  Home,
  CalendarCheck,
  CreditCard,
  Bell,
  User,
  LayoutDashboard,
  ShieldCheck,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import notificationService from '../../src/services/notificationService';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const THEME_COLOR = '#1E3A8A';
const INDICATOR_WIDTH = 48;

function SlidingTabBar({
  state,
  descriptors,
  navigation,
  insets,
  unreadCount,
  isStaff,
}: BottomTabBarProps & { insets: any; unreadCount: number; isStaff: boolean }) {
  const totalTabs = state.routes.length || 5;
  const [tabBarWidth, setTabBarWidth] = useState(Dimensions.get('window').width);
  const tabWidth = tabBarWidth / totalTabs;

  // Animated horizontal translation for the sliding top indicator bar
  const indicatorX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const targetX = state.index * tabWidth + (tabWidth - INDICATOR_WIDTH) / 2;
    Animated.spring(indicatorX, {
      toValue: targetX,
      friction: 8,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [state.index, tabWidth]);

  return (
    <View
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0) setTabBarWidth(w);
      }}
      style={[
        styles.tabBarContainer,
        {
          height: 58 + (insets.bottom > 0 ? insets.bottom : 8),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
        },
      ]}
    >
      {/* Animated Sliding Top Indicator Bar in Theme Royal Navy Blue */}
      <Animated.View
        style={[
          styles.animatedTopBar,
          {
            width: INDICATOR_WIDTH,
            transform: [{ translateX: indicatorX }],
          },
        ]}
      />

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const activeTextColor = THEME_COLOR;
        const inactiveTextColor = '#64748B';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (route.name === 'announcements') {
            notificationService.markAllAsSeen();
          }

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const renderIcon = () => {
          const size = 22;
          const strokeWidth = isFocused ? 2.2 : 1.8;
          const iconColor = isFocused ? THEME_COLOR : '#64748B';

          switch (route.name) {
            case 'index':
              return isStaff ? (
                <LayoutDashboard size={size} color={iconColor} strokeWidth={strokeWidth} />
              ) : (
                <Home size={size} color={iconColor} strokeWidth={strokeWidth} />
              );
            case 'attendance':
              return <CalendarCheck size={size} color={iconColor} strokeWidth={strokeWidth} />;
            case 'fees':
              return <CreditCard size={size} color={iconColor} strokeWidth={strokeWidth} />;
            case 'announcements':
              return (
                <View style={styles.iconBadgeWrapper}>
                  <Bell size={size} color={iconColor} strokeWidth={strokeWidth} />
                  {unreadCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                    </View>
                  )}
                </View>
              );
            case 'profile':
              return isStaff ? (
                <ShieldCheck size={size} color={iconColor} strokeWidth={strokeWidth} />
              ) : (
                <User size={size} color={iconColor} strokeWidth={strokeWidth} />
              );
            default:
              return null;
          }
        };

        const label =
          options.title !== undefined
            ? options.title
            : options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : route.name;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.tabButton}
          >
            <View style={styles.iconContainer}>
              {renderIcon()}
            </View>
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isFocused ? activeTextColor : inactiveTextColor,
                  fontWeight: isFocused ? '700' : '500',
                },
              ]}
              numberOfLines={1}
            >
              {typeof label === 'string' ? label : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { userType } = useAuth();
  const isStaff = userType === 'staff' || userType === 'admin';
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    notificationService.getUnreadCount().then(setUnreadCount);
    const unsubscribe = notificationService.subscribeBadge(setUnreadCount);
    return unsubscribe;
  }, []);

  return (
    <Tabs
      tabBar={(props) => (
        <SlidingTabBar
          {...props}
          insets={insets}
          unreadCount={unreadCount}
          isStaff={isStaff}
        />
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isStaff ? 'Console' : 'Home',
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
        }}
      />
      <Tabs.Screen
        name="fees"
        options={{
          title: isStaff ? 'Accounts' : 'Fees',
        }}
      />
      <Tabs.Screen
        name="announcements"
        options={{
          title: 'Notifications',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: isStaff ? 'Staff Profile' : 'Profile',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  animatedTopBar: {
    position: 'absolute',
    top: 0,
    height: 2.5,
    backgroundColor: THEME_COLOR,
    borderBottomLeftRadius: 1,
    borderBottomRightRadius: 1,
    zIndex: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    paddingBottom: 2,
  },
  iconContainer: {
    height: 28,
    width: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBadgeWrapper: {
    position: 'relative',
  },
  tabLabel: {
    fontSize: 10.5,
    marginTop: 2,
    letterSpacing: -0.1,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#DC2626',
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
    fontSize: 9,
    fontWeight: '800',
  },
});
