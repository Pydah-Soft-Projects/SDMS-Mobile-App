import React, { useEffect, useState, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Alert, AppState, AppStateStatus, Image, Platform, View, LogBox } from 'react-native';

LogBox.ignoreAllLogs(true);
import * as Updates from 'expo-updates';
import { useFonts } from 'expo-font';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import logger from '../src/utils/logger';
import UpdateModal from '../src/components/UpdateModal';
import { SkeletonBox } from '../src/components/SkeletonLoader';
import NotificationBanner from '../src/components/NotificationBanner';
import NotificationPermissionModal from '../src/components/NotificationPermissionModal';
import notificationService, { isExpoGo } from '../src/services/notificationService';
import { initGlobalFont } from '../src/utils/customFont';

// Initialize global bundled font family
initGlobalFont();

// Suppress known Expo Go push notification warning in local development
LogBox.ignoreLogs([
  '`expo-notifications` functionality is not fully supported in Expo Go',
  'expo-notifications: Android Push notifications',
]);

// Safely resolve expo-notifications only if running in standalone/dev binary (remote push removed from Expo Go in SDK 53+)
let Notifications: any = null;
if (!isExpoGo && Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
  } catch {
    Notifications = null;
  }
}

function RootNavigation() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Load bundled Inter & Cursive fonts
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
    'DancingScript': require('../assets/fonts/DancingScript-Bold.ttf'),
    'DancingScript-Bold': require('../assets/fonts/DancingScript-Bold.ttf'),
  });

  // Official live updates state hook
  const { isUpdateAvailable, isUpdatePending } = Updates.useUpdates();
  
  // Custom Update Modal State
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [modalIsPending, setModalIsPending] = useState(false);
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);
  const userDismissedRef = useRef(false);

  // Notification Permission Request Modal State
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // 1. Trigger modal when update has finished downloading in the background via official hook
  useEffect(() => {
    if (!Updates.isEnabled || Platform.OS === 'web' || !isUpdatePending || userDismissedRef.current) return;

    setModalIsPending(true);
    setShowUpdateModal(true);
  }, [isUpdatePending]);

  // 2. Trigger modal when a new update is detected on the server via official hook
  useEffect(() => {
    if (!Updates.isEnabled || Platform.OS === 'web' || !isUpdateAvailable || isUpdatePending || userDismissedRef.current) return;

    setModalIsPending(false);
    setShowUpdateModal(true);
  }, [isUpdateAvailable, isUpdatePending]);

  // 3. Proactively check for updates on startup, every 45s while active, and whenever app resumes
  useEffect(() => {
    if (__DEV__ || Platform.OS === 'web' || !Updates.isEnabled) return;

    let isChecking = false;

    const performUpdateCheck = async () => {
      if (isChecking || userDismissedRef.current) return;
      isChecking = true;
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) {
          logger.info('UPDATES', 'New update detected on server!');
          // Immediately show update modal on whichever page the student is currently viewing
          setShowUpdateModal(true);
          setModalIsPending(false);

          // Fetch update in background
          try {
            const fetchResult = await Updates.fetchUpdateAsync();
            if (fetchResult.isNew) {
              setModalIsPending(true);
            }
          } catch (fetchErr) {
            logger.warn('UPDATES', 'Background update prefetch failed', fetchErr);
          }
        }
      } catch (error: any) {
        if (error?.code !== 'ERR_NOT_SUPPORTED') {
          logger.warn('UPDATES', 'Update check notice', error?.message);
        }
      } finally {
        isChecking = false;
      }
    };

    // Run immediately on boot
    performUpdateCheck();

    // Continuously check every 45 seconds so update appears on any page without reloading
    const updateInterval = setInterval(() => {
      performUpdateCheck();
    }, 45000);

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        performUpdateCheck();
      }
    });

    return () => {
      clearInterval(updateInterval);
      subscription.remove();
    };
  }, []);

  // Handle action when user confirms update in modal
  const handleConfirmUpdate = async () => {
    setIsApplyingUpdate(true);
    try {
      if (modalIsPending) {
        await Updates.reloadAsync();
      } else {
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      }
    } catch (error: any) {
      setIsApplyingUpdate(false);
      if (error?.code !== 'ERR_NOT_SUPPORTED') {
        logger.error('UPDATES', 'Failed to apply update', error);
        Alert.alert(
          'Update Notice',
          'Unable to complete automatic update. Please restart the app manually to apply changes.'
        );
      }
    }
  };

  const handleDismissUpdate = () => {
    userDismissedRef.current = true;
    setShowUpdateModal(false);
  };

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inOperation = segments[0] === 'operation' || segments[0] === 'student-module';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect unauthenticated user to login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && (inAuthGroup || (!inTabsGroup && !inOperation))) {
      // Redirect authenticated user to dashboard tabs
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  // Initialize mobile push notifications, live alerts, and response listeners
  useEffect(() => {
    if (!isAuthenticated || Platform.OS === 'web') return;

    if (!isExpoGo) {
      notificationService.registerForPushNotifications();
    }
    notificationService.checkForNewAlerts();

    // Check if notification permission modal should be prompted to user
    const timer = setTimeout(() => {
      notificationService.shouldShowPermissionModal().then((shouldShow) => {
        if (shouldShow) {
          setShowPermissionModal(true);
        }
      });
    }, 600);

    // Check for new circulars and events every 45 seconds while active
    const pollInterval = setInterval(() => {
      notificationService.checkForNewAlerts();
    }, 45000);

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        notificationService.checkForNewAlerts();
        notificationService.shouldShowPermissionModal().then((shouldShow) => {
          if (shouldShow) {
            setShowPermissionModal(true);
          }
        });
      }
    });

    let responseSubscription: any = null;
    let receivedSubscription: any = null;

    try {
      if (Notifications?.addNotificationReceivedListener) {
        receivedSubscription = Notifications.addNotificationReceivedListener(() => {
          notificationService.getUnreadCount();
        });
      }
    } catch {}

    try {
      if (Notifications?.addNotificationResponseReceivedListener) {
        responseSubscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
          try {
            const data = response?.notification?.request?.content?.data;
            let targetUrl = data?.url || '/(tabs)/announcements';
            if (targetUrl.includes('announcement') || targetUrl.includes('event')) {
              targetUrl = '/(tabs)/announcements';
            }
            router.push(targetUrl as any);
          } catch {
            router.push('/(tabs)/announcements' as any);
          }
        });
      }
    } catch (e) {
      logger.warn('NOTIFICATIONS', 'Notification listener not supported on current binary', e);
    }

    return () => {
      clearTimeout(timer);
      clearInterval(pollInterval);
      appStateSub.remove();
      receivedSubscription?.remove?.();
      responseSubscription?.remove?.();
    };
  }, [isAuthenticated]);

  const handleAllowNotifications = async () => {
    setShowPermissionModal(false);
    await notificationService.markPermissionModalDismissed();
    await notificationService.requestPermissionWithPrompt();
  };

  const handleDismissPermissionModal = async () => {
    setShowPermissionModal(false);
    await notificationService.markPermissionModalDismissed();
  };

  if (isLoading || (!fontsLoaded && !fontError)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', gap: 16 }}>
        <Image
          source={require('../assets/campo-icon.png')}
          style={{ width: 84, height: 84 }}
          resizeMode="contain"
        />
        <SkeletonBox width={140} height={8} borderRadius={4} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="operation/[key]" options={{ headerShown: false }} />
        <Stack.Screen name="student-module/[id]" options={{ headerShown: false }} />
      </Stack>

      {/* In-App Sliding Notification Banner */}
      <NotificationBanner />

      {/* Push Notification Permission Setup Modal */}
      <NotificationPermissionModal
        visible={showPermissionModal}
        onAllow={handleAllowNotifications}
        onDismiss={handleDismissPermissionModal}
      />

      {/* Modern OTA In-App Update Modal */}
      <UpdateModal
        visible={showUpdateModal}
        isPending={modalIsPending}
        isApplying={isApplyingUpdate}
        onConfirm={handleConfirmUpdate}
        onDismiss={handleDismissUpdate}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigation />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
