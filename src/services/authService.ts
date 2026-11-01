import api from '../config/api';
import { StudentUser, StaffUser, UserRole } from '../types';

export interface StudentLoginPayload {
  rollNumber?: string;
  username?: string;
  email?: string;
  password?: string;
  loginIdentifier?: string;
}

export interface StaffLoginPayload {
  username?: string;
  email?: string;
  password?: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  userType: UserRole;
  user: StudentUser | StaffUser;
  message?: string;
}

export const authService = {
  /**
   * Student Login
   * Endpoint: POST /api/students/login
   */
  async studentLogin(payload: StudentLoginPayload): Promise<LoginResponse> {
    const identifier = payload.rollNumber || payload.username || payload.email || payload.loginIdentifier;
    const response = await api.post('/students/login', {
      rollNumber: identifier,
      password: payload.password,
    });

    const data = response.data;
    const user = data.student || data.user || data;
    const token = data.token;

    return {
      success: true,
      token,
      userType: 'student',
      user: {
        id: user.id,
        rollNumber: user.roll_number || user.rollNumber || identifier || '',
        name: user.name || user.fullName || user.student_name || 'Student',
        email: user.email || '',
        phone: user.phone || user.mobile || '',
        collegeId: user.college_id || user.collegeId,
        collegeName: user.college_name || user.collegeName,
        courseId: user.course_id || user.courseId,
        courseName: user.course_name || user.courseName,
        branchId: user.branch_id || user.branchId,
        branchName: user.branch_name || user.branchName,
        academicYear: user.academic_year || user.academicYear,
        currentSemester: user.current_semester || user.currentSemester || 1,
        avatarUrl: user.photo_url || user.avatarUrl,
        quota: user.quota,
        caste: user.caste_category || user.caste,
      },
    };
  },

  /**
   * Staff / Admin Unified Login
   * Endpoint: POST /api/auth/unified-login
   */
  async staffLogin(payload: StaffLoginPayload): Promise<LoginResponse> {
    const response = await api.post('/auth/unified-login', {
      username: payload.username || payload.email,
      password: payload.password,
    });

    const data = response.data;
    return {
      success: true,
      token: data.token,
      userType: data.role === 'admin' ? 'admin' : 'staff',
      user: {
        id: data.user?.id || data.id,
        username: data.user?.username || data.username,
        email: data.user?.email || data.email,
        name: data.user?.name || data.name || data.user?.username,
        role: data.role || data.user?.role || 'staff',
        modules: data.modules || data.user?.modules || [],
        permissions: data.permissions || data.user?.permissions || {},
        collegeId: data.collegeId || data.user?.collegeId,
      },
    };
  },

  /**
   * Parent Login: Send OTP
   * Endpoint: POST /api/auth/parent/otp/send
   */
  async parentSendOtp(phone: string) {
    const response = await api.post('/auth/parent/otp/send', { phone });
    return response.data;
  },

  /**
   * Parent Login: Verify OTP
   * Endpoint: POST /api/auth/parent/otp/verify
   */
  async parentVerifyOtp(phone: string, otp: string) {
    const response = await api.post('/auth/parent/otp/verify', { phone, otp });
    return response.data;
  },

  /**
   * Verify Active Session Token
   * Endpoint: GET /api/auth/verify
   */
  async verifyToken() {
    const response = await api.get('/auth/verify');
    return response.data;
  },

  /**
   * Change Student Password
   * Endpoint: POST /api/students/change-password
   */
  async changePassword(currentPassword: string, newPassword: string) {
    const response = await api.post('/students/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  /**
   * Request Password Reset Link / OTP
   * Endpoint: POST /api/students/forgot-password
   */
  async forgotPassword(rollNumberOrEmail: string) {
    const response = await api.post('/students/forgot-password', {
      identifier: rollNumberOrEmail,
    });
    return response.data;
  },
};

export default authService;

