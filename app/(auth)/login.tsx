import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { User, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import CustomInput from '../../src/components/CustomInput';
import CustomButton from '../../src/components/CustomButton';

export default function LoginScreen() {
  const router = useRouter();
  const { studentLogin } = useAuth();
  const scrollRef = useRef<ScrollView>(null);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Automatically scroll up when keyboard opens while password field is focused
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        if (isPasswordFocused) {
          setTimeout(() => {
            scrollRef.current?.scrollToEnd({ animated: true });
          }, 80);
        }
      }
    );

    return () => {
      showSub.remove();
    };
  }, [isPasswordFocused]);

  const handlePasswordFocus = () => {
    setIsPasswordFocused(true);
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
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
    <View style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Background Image: Campo Login BG (WebP format, precisely fit edge-to-edge) */}
      <Image
        source={require('../../assets/Campo-Login-BG.webp')}
        style={styles.backgroundImage}
        resizeMode="stretch"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        style={styles.keyboardView}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Branding & Welcome Header */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/campo-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.welcomeTitle}>Welcome Back Buddy</Text>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Error Banner */}
            {error && (
              <View style={styles.errorBanner}>
                <AlertCircle size={18} color="#B91C1C" style={styles.errorIcon} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            {/* Roll Number / PIN / Email Field */}
            <CustomInput
              label="Roll Number / PIN / Email"
              placeholder="e.g. 246T1A0301 or PIN"
              value={identifier}
              onChangeText={(text) => {
                setIdentifier(text);
                if (error) setError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              inputWrapperStyle={styles.roundedInputWrapper}
              leftIcon={<User size={19} color="#64748B" />}
            />

            {/* Password Field */}
            <CustomInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) setError(null);
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              onFocus={handlePasswordFocus}
              onBlur={() => setIsPasswordFocused(false)}
              inputWrapperStyle={styles.roundedInputWrapper}
              leftIcon={<Lock size={19} color="#64748B" />}
              rightIcon={
                showPassword ? <EyeOff size={19} color="#64748B" /> : <Eye size={19} color="#64748B" />
              }
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            {/* Forgot Password Link */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/forgot-password')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <CustomButton
              title="Sign In as Student"
              onPress={handleLogin}
              isLoading={loading}
              icon={!loading ? <ArrowRight size={18} color="#FFFFFF" /> : undefined}
              style={styles.submitBtn}
            />
          </View>

          {/* Footer / Support Notice */}
          <View style={styles.footer}>
            <View style={styles.securityRow}>
              <ShieldCheck size={14} color="#64748B" />
              <Text style={styles.securityText}>Secured by Campo Unified Authentication</Text>
            </View>
            <Text style={styles.supportText}>
              Need assistance? Reach out to your Campus Administration
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F6FF',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 46,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 26,
  },
  logo: {
    width: 200,
    height: 58,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  formContainer: {
    width: '100%',
  },
  roundedInputWrapper: {
    borderRadius: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 18,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  actionsRow: {
    alignItems: 'flex-end',
    marginTop: -4,
    marginBottom: 20,
  },
  forgotText: {
    fontSize: 13,
    color: '#1E3A8A',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#1E3A8A',
    borderRadius: 20,
    height: 52,
  },
  footer: {
    alignItems: 'center',
    marginTop: 28,
    paddingHorizontal: 16,
    gap: 6,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  securityText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  supportText: {
    fontSize: 11.5,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
