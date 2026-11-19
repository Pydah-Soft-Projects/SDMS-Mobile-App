import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { DashboardSkeleton } from '../src/components/SkeletonLoader';

export default function RootIndex() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

