import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StudentModuleView } from '../../src/components/StudentModuleDetailModal';
import { getStudentModuleById } from '../../src/components/StudentSidebarDrawer';

export default function StudentModuleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const moduleItem = getStudentModuleById(String(id || ''));

  return <StudentModuleView module={moduleItem} onBack={() => router.back()} />;
}

