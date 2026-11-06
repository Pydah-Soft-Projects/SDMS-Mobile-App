import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Alert, AppState, AppStateStatus, Platform, View } from 'react-native';
import * as Updates from 'expo-updates';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import logger from '../src/utils/logger';

function RootNavigation() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Official live updates state hook
  const { isUpdateAvailable, isUpdatePending } = Updates.useUpdates();

  // 1. Trigger popup when update has finished downloading in the background
  useEffect(() => {
    if (!Updates.isEnabled || Platform.OS === 'web' || !isUpdatePending) return;

    Alert.alert(
      'Update Ready',
      'A new version of the app has been downloaded. Restart the app now to apply the latest updates?',
      [
        { text: 'Later', style: 'cancel' },
        {
          text: 'Restart Now',
          onPress: async () => {
            try {
              await Updates.reloadAsync();
            } catch (error) {
              logger.error('UPDATES', 'Failed to reload app for update', error);
            }
          },
        },
      ]
    );
  }, [isUpdatePending]);

  // 2. Trigger popup when a new update is detected on the server
  useEffect(() => {
    if (!Updates.isEnabled || Platform.OS === 'web' || !isUpdateAvailable) return;

    Alert.alert(
      'New Update Available',
      'A new version of the app is available. Would you like to install it now?',
      [
        { text: 'Later', style: 'cancel' },
        {
          text: 'Update Now',
          onPress: async () => {
            try {
              const download = await Updates.fetchUpdateAsync();
              if (download.isNew) {
                await Updates.reloadAsync();
              }
            } catch (error) {
              logger.error('UPDATES', 'Failed to download or apply update', error);
              Alert.alert(
                'Update Failed',
                'The update could not be downloaded. Please check your network and try again.'
              );
            }
          },
        },
      ]
    );
  }, [isUpdateAvailable]);

  // 3. Proactively check for updates on startup and whenever the app resumes to foreground
  useEffect(() => {
    if (isLoading || Platform.OS === 'web' || !Updates.isEnabled) return;

    const performUpdateCheck = async () => {
      try {
        await Updates.checkForUpdateAsync();
      } catch (error) {
        logger.error('UPDATES', 'Failed to check for update', error);
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

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect unauthenticated user to login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect authenticated user to dashboard tabs
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="operation/[key]" options={{ headerShown: false }} />
        <Stack.Screen name="student-module/[id]" options={{ headerShown: false }} />
      </Stack>
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
