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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, Lock, Eye, EyeOff, Terminal } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import CustomInput from '../../src/components/CustomInput';
import CustomButton from '../../src/components/CustomButton';
import LogViewerModal from '../../src/components/LogViewerModal';
import { ENV } from '../../src/config/env';
import logger from '../../src/utils/logger';

export default function LoginScreen() {
  const router = useRouter();
  const { studentLogin } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const handleLogin = async () => {
    setError(null);
    const cleanId = identifier.trim();

    if (!cleanId) {
      const err = 'Please enter your Roll Number, PIN, or Email';
      setError(err);
      logger.warn('LOGIN_UI', `Validation failed: ${err}`);
      return;
    }
    if (!password) {
      setError('Please enter your password');
      logger.warn('LOGIN_UI', 'Validation failed: Password missing');
      return;
    }

    setLoading(true);
    logger.info('LOGIN_UI', `User initiated STUDENT login for "${cleanId}" targeting ${ENV.apiUrl}`);

    try {
      await studentLogin({
        rollNumber: cleanId,
        username: cleanId,
        password,
      });
      logger.info('LOGIN_UI', `Login flow completed successfully! Redirecting...`);
    } catch (err: any) {
      const status = err.response?.status;
      const serverMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Connection to backend failed.';

      const formattedError = `[Status ${status || 'Network Error'}] ${serverMsg}`;
      setError(formattedError);

      logger.error('LOGIN_UI', `Login failed: ${formattedError}`, {
        url: `${ENV.apiUrl}/students/login`,
        status,
        response: err.response?.data,
      });

      // Show alert if network connection fails completely
      if (!err.response) {
        Alert.alert(
          'Network Connection Error',
          `Could not connect to backend server at:\n${ENV.apiUrl}\n\nMake sure your backend is running and that your mobile device is on the same Wi-Fi network. Tap "View Logs / IP" at the top to check connection settings.`,
          [
            { text: 'View Logs', onPress: () => setShowLogs(true) },
            { text: 'OK' },
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Top Utility Bar */}
      <View style={styles.topUtilityBar}>
        <TouchableOpacity
          style={styles.logPill}
          onPress={() => setShowLogs(true)}
          activeOpacity={0.7}
        >
          <Terminal size={14} color="#1E3A8A" />
          <Text style={styles.logPillText}>View Logs / IP</Text>
        </TouchableOpacity>

        <View style={[styles.envBadge, ENV.isProd ? styles.envProd : styles.envDev]}>
          <Text style={styles.envText}>EAS: {ENV.appEnv.toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* College Logo / Header */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/icon.png')}
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

        {/* Backend Host & Log Trigger Footer */}
        <TouchableOpacity onPress={() => setShowLogs(true)} style={styles.serverInfoBtn}>
          <Text style={styles.serverInfo}>
            Connecting to: <Text style={styles.serverInfoBold}>{ENV.apiUrl}</Text>
          </Text>
          <Text style={styles.serverInfoHint}>(Tap to inspect logs & change IP)</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* In-App Live Log Viewer Modal */}
      <LogViewerModal visible={showLogs} onClose={() => setShowLogs(false)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topUtilityBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 44 : 54,
    paddingBottom: 8,
  },
  logPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  logPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A8A',
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
    width: 76,
    height: 76,
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
  envBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
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
  serverInfoBtn: {
    marginTop: 20,
    alignItems: 'center',
    padding: 8,
  },
  serverInfo: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  serverInfoBold: {
    fontWeight: '700',
    color: '#1E3A8A',
  },
  serverInfoHint: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
});
