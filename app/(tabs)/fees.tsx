import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import Header from '../../src/components/Header';
import StaffFeesView from '../../src/components/StaffFeesView';
import StudentFeesView from '../../src/components/StudentFeesView';

export default function FeesScreen() {
  const { user, userType } = useAuth();

  // If staff or admin user, render Staff Accounts & Fee Ledgers view
  if (userType === 'staff' || userType === 'admin') {
    return <StaffFeesView />;
  }

  const admissionNo =
    (user as any)?.admission_number ||
    (user as any)?.pin_no ||
    (user as any)?.admissionNumber ||
    (user as any)?.studentId ||
    (user as any)?.id;

  return (
    <View style={styles.container}>
      <Header title="Fee Management" subtitle="SDMS Financial Records & Dues" showBack />
      <StudentFeesView admissionNo={admissionNo} user={user} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
