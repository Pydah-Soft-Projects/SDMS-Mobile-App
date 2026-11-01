import React from 'react';
import { Tabs } from 'expo-router';
import { Home, CalendarCheck, CreditCard, Bell, User, LayoutDashboard, ShieldCheck } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { userType } = useAuth();
  const isStaff = userType === 'staff' || userType === 'admin';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1E3A8A',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          height: 62 + (insets.bottom > 0 ? insets.bottom : 10),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isStaff ? 'Console' : 'Dashboard',
          tabBarIcon: ({ color, size }) =>
            isStaff ? <LayoutDashboard size={size} color={color} /> : <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: isStaff ? 'Attendance' : 'Attendance',
          tabBarIcon: ({ color, size }) => <CalendarCheck size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="fees"
        options={{
          title: isStaff ? 'Accounts' : 'Fees',
          tabBarIcon: ({ color, size }) => <CreditCard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="announcements"
        options={{
          title: 'Notices',
          tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: isStaff ? 'Staff Profile' : 'Profile',
          tabBarIcon: ({ color, size }) =>
            isStaff ? <ShieldCheck size={size} color={color} /> : <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
