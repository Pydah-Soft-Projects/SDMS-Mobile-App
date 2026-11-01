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
import { User, Lock, Mail, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import CustomInput from '../../src/components/CustomInput';
import CustomButton from '../../src/components/CustomButton';
import { ENV } from '../../src/config/env';

export default function LoginScreen() {
  const router = useRouter();
  const { studentLogin, staffLogin } = useAuth();

  const [activeTab, setActiveTab] = useState<'student' | 'staff'>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    if (!identifier.trim()) {
      setError(activeTab === 'student' ? 'Please enter your Roll Number or Email' : 'Please enter your Username or Email');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      if (activeTab === 'student') {
        await studentLogin({
          rollNumber: identifier.trim(),
          password,
        });
      } else {
        await staffLogin({
          username: identifier.trim(),
          password,
        });
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Login failed. Please verify your credentials and network connection.';
      setError(msg);
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
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Pydah Educational Academy</Text>
          <Text style={styles.appSubtitle}>Student & Staff Management Portal</Text>
          
          {/* EAS Environment Indicator */}
          <View style={[styles.envBadge, ENV.isProd ? styles.envProd : styles.envDev]}>
            <Text style={styles.envText}>EAS: {ENV.appEnv.toUpperCase()}</Text>
          </View>
        </View>

        {/* Segmented Switcher */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'student' && styles.segmentBtnActive]}
            onPress={() => {
              setActiveTab('student');
              setError(null);
            }}
          >
            <Text style={[styles.segmentText, activeTab === 'student' && styles.segmentTextActive]}>
              Student Portal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'staff' && styles.segmentBtnActive]}
            onPress={() => {
              setActiveTab('staff');
              setError(null);
            }}
          >
            <Text style={[styles.segmentText, activeTab === 'staff' && styles.segmentTextActive]}>
              Staff / Admin
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Alert */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {/* Inputs */}
        <CustomInput
          label={activeTab === 'student' ? 'Roll Number / Email' : 'Username / Email'}
          placeholder={activeTab === 'student' ? 'e.g. 21A91A0501 or email' : 'e.g. faculty_admin'}
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          leftIcon={activeTab === 'student' ? <User size={20} color="#64748B" /> : <Mail size={20} color="#64748B" />}
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
          title={activeTab === 'student' ? 'Sign In as Student' : 'Sign In as Staff'}
          onPress={handleLogin}
          isLoading={loading}
          style={styles.submitBtn}
        />

        {/* Backend Host Reference */}
        <Text style={styles.serverInfo}>
          Connecting to backend: {ENV.apiUrl}
        </Text>
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
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E3A8A',
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  envBadge: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  envDev: {
    backgroundColor: '#FEF3C7',
  },
  envProd: {
    backgroundColor: '#DCFCE7',
  },
  envText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#1E3A8A',
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
    fontWeight: '500',
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
  serverInfo: {
    marginTop: 24,
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
});

