import React, { useEffect, useState, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Alert, AppState, AppStateStatus, Image, Platform, View } from 'react-native';
import * as Updates from 'expo-updates';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import logger from '../src/utils/logger';
import UpdateModal from '../src/components/UpdateModal';
import NotificationBanner from '../src/components/NotificationBanner';
import NotificationPermissionModal from '../src/components/NotificationPermissionModal';
import notificationService from '../src/services/notificationService';

// Safely resolve expo-notifications only if native module exists in binary
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch {
  Notifications = null;
}

function RootNavigation() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Official live updates state hook
  const { isUpdateAvailable, isUpdatePending } = Updates.useUpdates();
  
  // Custom Update Modal State
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [modalIsPending, setModalIsPending] = useState(false);
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);
  const userDismissedRef = useRef(false);

  // Notification Permission Request Modal State
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // 1. Trigger modal when update has finished downloading in the background
  useEffect(() => {
    if (!Updates.isEnabled || Platform.OS === 'web' || !isUpdatePending || userDismissedRef.current) return;

    setModalIsPending(true);
    setShowUpdateModal(true);
  }, [isUpdatePending]);

  // 2. Trigger modal when a new update is detected on the server (and not yet finished downloading)
  useEffect(() => {
    if (!Updates.isEnabled || Platform.OS === 'web' || !isUpdateAvailable || isUpdatePending || userDismissedRef.current) return;

    setModalIsPending(false);
    setShowUpdateModal(true);
  }, [isUpdateAvailable, isUpdatePending]);

  // 3. Proactively check for updates on startup and whenever the app resumes to foreground
  useEffect(() => {
    if (__DEV__ || isLoading || Platform.OS === 'web' || !Updates.isEnabled) return;

    const performUpdateCheck = async () => {
      try {
        if (__DEV__ || !Updates.isEnabled) return;
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) {
          try {
            await Updates.fetchUpdateAsync();
          } catch (fetchErr) {
            logger.warn('UPDATES', 'Background update prefetch failed', fetchErr);
          }
        }
      } catch (error: any) {
        if (error?.code !== 'ERR_NOT_SUPPORTED') {
          logger.error('UPDATES', 'Failed to check for update', error);
        }
      }
    };

    performUpdateCheck();

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        performUpdateCheck();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isLoading]);

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

    notificationService.registerForPushNotifications();
    notificationService.checkForNewAlerts();

    // Check if notification permission modal should be prompted to user (only if native notifications exist)
    if (Notifications) {
      notificationService.shouldShowPermissionModal().then((shouldShow) => {
        if (shouldShow) {
          setShowPermissionModal(true);
        }
      });
    }

    // Check for new circulars and events every 45 seconds while active
    const pollInterval = setInterval(() => {
      notificationService.checkForNewAlerts();
    }, 45000);

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        notificationService.checkForNewAlerts();
      }
    });

    let subscription: any = null;
    try {
      if (Notifications?.addNotificationResponseReceivedListener) {
        subscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
          try {
            const data = response?.notification?.request?.content?.data;
            if (data?.url) {
              router.push(data.url as any);
            } else {
              router.push('/(tabs)/announcements' as any);
            }
          } catch {
            router.push('/(tabs)/announcements' as any);
          }
        });
      }
    } catch (e) {
      logger.warn('NOTIFICATIONS', 'Notification listener not supported on current binary', e);
    }

    return () => {
      clearInterval(pollInterval);
      appStateSub.remove();
      subscription?.remove?.();
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

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <Image
          source={require('../assets/campo-icon.png')}
          style={{ width: 84, height: 84, marginBottom: 20 }}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#1E3A8A" />
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
