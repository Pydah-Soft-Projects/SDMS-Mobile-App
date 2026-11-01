import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import CustomInput from '../../src/components/CustomInput';
import CustomButton from '../../src/components/CustomButton';

export default function LoginScreen() {
  const router = useRouter();
  const { studentLogin } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    const cleanId = identifier.trim();

    if (!cleanId) {
      setError('Please enter your Roll Number, PIN, or Email');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);

    try {
      await studentLogin({
        rollNumber: cleanId,
        username: cleanId,
        password,
      });
    } catch (err: any) {
      const serverMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (err.response
          ? 'Unable to sign in. Please check your details and try again.'
          : 'Unable to connect. Check your internet connection and try again.');
      setError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* College Logo / Header */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/pydah-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Pydah Educational Academy</Text>
          <Text style={styles.appSubtitle}>Student Portal</Text>
        </View>

        {/* Error Alert */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {/* Inputs */}
        <CustomInput
          label="Roll Number / PIN / Email"
          placeholder="e.g. 246T1A0301 or PIN"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          leftIcon={<User size={20} color="#64748B" />}
        />

        <CustomInput
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          leftIcon={<Lock size={20} color="#64748B" />}
          rightIcon={
            showPassword ? <EyeOff size={20} color="#64748B" /> : <Eye size={20} color="#64748B" />
          }
          onRightIconPress={() => setShowPassword(!showPassword)}
        />

        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <CustomButton
          title="Sign In as Student"
          onPress={handleLogin}
          isLoading={loading}
          style={styles.submitBtn}
        />

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 12,
  },
  appName: {
    fontSize: 21,
    fontWeight: '800',
    color: '#1E3A8A',
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  actionsRow: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    fontSize: 13,
    color: '#1E3A8A',
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: 4,
  },
});
