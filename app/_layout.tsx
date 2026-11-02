import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Alert, Platform, View } from 'react-native';
import * as Updates from 'expo-updates';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import logger from '../src/utils/logger';

function RootNavigation() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || Platform.OS === 'web' || !Updates.isEnabled) return;

    let active = true;
    const checkForUpdate = async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (!active || !result.isAvailable) return;

        Alert.alert(
          'Update available',
          'A new version of the app is ready to download.',
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Update',
              onPress: async () => {
                try {
                  const download = await Updates.fetchUpdateAsync();
                  if (!download.isNew) return;
                  await Updates.reloadAsync();
                } catch (error) {
                  logger.error('UPDATES', 'Failed to download or apply update', error);
                  Alert.alert(
                    'Update failed',
                    'The update could not be installed. Please try again later.'
                  );
                }
              },
            },
          ]
        );
      } catch (error) {
        logger.error('UPDATES', 'Failed to check for an update', error);
      }
    };

    checkForUpdate();
    return () => {
      active = false;
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
