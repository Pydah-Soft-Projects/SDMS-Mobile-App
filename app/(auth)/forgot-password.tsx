import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, KeyRound } from 'lucide-react-native';
import CustomInput from '../../src/components/CustomInput';
import CustomButton from '../../src/components/CustomButton';
import authService from '../../src/services/authService';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!identifier.trim()) {
      Alert.alert('Required', 'Please enter your Roll Number or registered Email.');
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(identifier.trim());
      setSuccess(true);
    } catch (err: any) {
      Alert.alert(
        'Request Failed',
        err.response?.data?.message || 'Could not send reset link. Please contact the administrator.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <ArrowLeft size={24} color="#1E3A8A" />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <KeyRound size={32} color="#1E3A8A" />
        </View>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>
          Enter your Roll Number or Email. We'll send instructions or reset your password.
        </Text>
      </View>

      {success ? (
        <View style={styles.successBox}>
          <Text style={styles.successTitle}>Request Sent</Text>
          <Text style={styles.successText}>
            If an account matches "{identifier}", recovery instructions have been dispatched.
          </Text>
          <CustomButton
            title="Return to Login"
            onPress={() => router.replace('/(auth)/login')}
            style={{ marginTop: 20 }}
          />
        </View>
      ) : (
        <View>
          <CustomInput
            label="Roll Number / Email"
            placeholder="e.g. 21A91A0501"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
          />

          <CustomButton
            title="Send Reset Instructions"
            onPress={handleSubmit}
            isLoading={loading}
            style={{ marginTop: 12 }}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    padding: 8,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  successBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 12,
    padding: 20,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#15803D',
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
  },
});

