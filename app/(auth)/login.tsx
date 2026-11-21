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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  User,
  Users,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Phone,
  RotateCw,
  ChevronRight,
  GraduationCap,
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import authService from '../../src/services/authService';
import CustomInput from '../../src/components/CustomInput';
import CustomButton from '../../src/components/CustomButton';

export default function LoginScreen() {
  const router = useRouter();
  const { studentLogin, parentLogin } = useAuth();
  const scrollRef = useRef<ScrollView>(null);

  // Active Role Tab: 'student' | 'parent'
  const [activeRoleTab, setActiveRoleTab] = useState<'student' | 'parent'>('student');

  // Student Login State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Parent Login State
  const [parentMobile, setParentMobile] = useState('');
  const [parentOtp, setParentOtp] = useState('');
  const [parentStep, setParentStep] = useState<'mobile' | 'otp' | 'select'>('mobile');
  const [parentLoading, setParentLoading] = useState(false);
  const [selectionToken, setSelectionToken] = useState<string | null>(null);
  const [linkedStudents, setLinkedStudents] = useState<any[]>([]);
  const [selectingStudentId, setSelectingStudentId] = useState<number | string | null>(null);

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

  // Parent Send OTP
  const handleSendParentOtp = async () => {
    Keyboard.dismiss();
    setError(null);
    const cleanMobile = parentMobile.trim().replace(/\D/g, '');

    if (!cleanMobile || cleanMobile.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setParentLoading(true);
    try {
      const res = await authService.sendParentOtp(cleanMobile);
      if (res.success) {
        setParentStep('otp');
      } else {
        setError(res.message || 'Failed to send OTP. Please check the mobile number.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'No linked student found for this number or SMS error.';
      setError(msg);
    } finally {
      setParentLoading(false);
    }
  };

  // Parent Verify OTP
  const handleVerifyParentOtp = async () => {
    Keyboard.dismiss();
    setError(null);
    const cleanOtp = parentOtp.trim();

    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setParentLoading(true);
    try {
      const res = await authService.verifyParentOtp(parentMobile.trim(), cleanOtp);
      if (!res.success) {
        setError(res.message || 'Invalid or expired OTP');
        return;
      }

      if (res.requiresSelection) {
        setSelectionToken(res.selectionToken || null);
        setLinkedStudents(res.students || []);
        setParentStep('select');
        return;
      }

      if (res.token && res.user) {
        await parentLogin(res.token, res.user);
      } else {
        setError('Login response incomplete. Please try again.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid OTP. Please check and try again.';
      setError(msg);
    } finally {
      setParentLoading(false);
    }
  };

  // Parent Select Student
  const handleSelectStudent = async (studentId: number | string) => {
    if (!selectionToken) return;
    setError(null);
    setSelectingStudentId(studentId);
    setParentLoading(true);

    try {
      const res = await authService.selectParentStudent(selectionToken, studentId);
      if (res.success && res.token && res.user) {
        await parentLogin(res.token, res.user);
      } else {
        setError(res.message || 'Could not select student. Please retry.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to sign in for selected ward.');
    } finally {
      setParentLoading(false);
      setSelectingStudentId(null);
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

            <Text style={styles.welcomeTitle}>
              {activeRoleTab === 'parent' ? 'Parent Portal' : 'Welcome Back Buddy'}
            </Text>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Role Switcher Segmented Control */}
            <View style={styles.roleTabsContainer}>
              <TouchableOpacity
                style={[styles.roleTab, activeRoleTab === 'student' && styles.roleTabActive]}
                onPress={() => {
                  setActiveRoleTab('student');
                  setError(null);
                }}
                activeOpacity={0.8}
              >
                <User size={15} color={activeRoleTab === 'student' ? '#FFFFFF' : '#64748B'} />
                <Text
                  style={[
                    styles.roleTabText,
                    activeRoleTab === 'student' && styles.roleTabTextActive,
                  ]}
                >
                  Student
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleTab, activeRoleTab === 'parent' && styles.roleTabActive]}
                onPress={() => {
                  setActiveRoleTab('parent');
                  setError(null);
                }}
                activeOpacity={0.8}
              >
                <Users size={15} color={activeRoleTab === 'parent' ? '#FFFFFF' : '#64748B'} />
                <Text
                  style={[
                    styles.roleTabText,
                    activeRoleTab === 'parent' && styles.roleTabTextActive,
                  ]}
                >
                  Parent
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error Banner */}
            {error && (
              <View style={styles.errorBanner}>
                <AlertCircle size={18} color="#B91C1C" style={styles.errorIcon} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            {/* TAB 1: STUDENT / STAFF LOGIN */}
            {activeRoleTab === 'student' && (
              <>
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
              </>
            )}

            {/* TAB 2: PARENT PORTAL OTP LOGIN */}
            {activeRoleTab === 'parent' && (
              <>
                {parentStep === 'mobile' && (
                  <>
                    <CustomInput
                      label="Registered Mobile Number"
                      placeholder="e.g. 9876543210"
                      value={parentMobile}
                      onChangeText={(text) => {
                        setParentMobile(text);
                        if (error) setError(null);
                      }}
                      keyboardType="phone-pad"
                      maxLength={10}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={handleSendParentOtp}
                      inputWrapperStyle={styles.roundedInputWrapper}
                      leftIcon={<Phone size={19} color="#64748B" />}
                    />

                    <Text style={styles.parentNoticeText}>
                      We will send a one-time password (OTP) to the mobile number registered in your ward&apos;s college records.
                    </Text>

                    <CustomButton
                      title="Send OTP"
                      onPress={handleSendParentOtp}
                      isLoading={parentLoading}
                      icon={!parentLoading ? <ArrowRight size={18} color="#FFFFFF" /> : undefined}
                      style={styles.submitBtn}
                    />
                  </>
                )}

                {parentStep === 'otp' && (
                  <>
                    <View style={styles.otpSentBadge}>
                      <Text style={styles.otpSentBadgeText}>
                        OTP sent to +91 {parentMobile}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setParentStep('mobile');
                          setError(null);
                        }}
                      >
                        <Text style={styles.changeMobileText}>Edit</Text>
                      </TouchableOpacity>
                    </View>

                    <CustomInput
                      label="6-Digit Verification Code"
                      placeholder="e.g. 123456"
                      value={parentOtp}
                      onChangeText={(text) => {
                        setParentOtp(text);
                        if (error) setError(null);
                      }}
                      keyboardType="number-pad"
                      maxLength={6}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={handleVerifyParentOtp}
                      inputWrapperStyle={styles.roundedInputWrapper}
                      leftIcon={<ShieldCheck size={19} color="#64748B" />}
                    />

                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        onPress={handleSendParentOtp}
                        disabled={parentLoading}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.forgotText}>Resend OTP</Text>
                      </TouchableOpacity>
                    </View>

                    <CustomButton
                      title="Verify & Sign In"
                      onPress={handleVerifyParentOtp}
                      isLoading={parentLoading}
                      icon={!parentLoading ? <ArrowRight size={18} color="#FFFFFF" /> : undefined}
                      style={styles.submitBtn}
                    />
                  </>
                )}

                {parentStep === 'select' && (
                  <View style={styles.selectWardContainer}>
                    <Text style={styles.selectWardHeading}>Select Ward Profile</Text>
                    <Text style={styles.selectWardSub}>
                      Multiple students are linked to this number. Select which ward to sign into:
                    </Text>

                    <View style={styles.studentCardsList}>
                      {linkedStudents.map((s) => (
                        <TouchableOpacity
                          key={s.id}
                          style={styles.studentSelectCard}
                          onPress={() => handleSelectStudent(s.id)}
                          disabled={parentLoading}
                          activeOpacity={0.85}
                        >
                          <View style={styles.studentCardAvatar}>
                            <User size={20} color="#0047BA" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.studentCardName}>{s.student_name}</Text>
                            <Text style={styles.studentCardAdm}>Adm: {s.admission_number}</Text>
                            <Text style={styles.studentCardBranch}>
                              {s.course} • {s.branch}
                            </Text>
                          </View>
                          {selectingStudentId === s.id && parentLoading ? (
                            <ActivityIndicator size="small" color="#0047BA" />
                          ) : (
                            <ChevronRight size={18} color="#64748B" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}
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

  // Role Switcher Tabs
  roleTabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 28,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'transparent',
  },
  roleTabActive: {
    backgroundColor: '#1E3A8A',
  },
  roleTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  roleTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // Error Banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
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

  roundedInputWrapper: {
    borderRadius: 28,
    paddingHorizontal: 18,
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
    borderRadius: 28,
    height: 52,
  },

  // Parent Notices & Badges
  parentNoticeText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginTop: -4,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  otpSentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  otpSentBadgeText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  changeMobileText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1E3A8A',
    textDecorationLine: 'underline',
  },

  // Select Ward Step
  selectWardContainer: {
    gap: 10,
    marginBottom: 10,
  },
  selectWardHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  selectWardSub: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 17,
  },
  studentCardsList: {
    gap: 8,
    marginTop: 6,
  },
  studentSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  studentCardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentCardName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  studentCardAdm: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  studentCardBranch: {
    fontSize: 11,
    color: '#1E3A8A',
    fontWeight: '700',
    marginTop: 1,
  },

  // Footer / Support Notice
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
