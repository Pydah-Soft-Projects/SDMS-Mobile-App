import api from '../config/api';
import logger from '../utils/logger';
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
   * Expects: { username, password }
   */
  async studentLogin(payload: StudentLoginPayload): Promise<LoginResponse> {
    const identifier = (
      payload.username ||
      payload.rollNumber ||
      payload.email ||
      payload.loginIdentifier ||
      ''
    ).trim();

    logger.info('AUTH', `Attempting Student login for: "${identifier}"`);

    const response = await api.post('/students/login', {
      username: identifier,
      rollNumber: identifier,
      password: payload.password,
    });

    const data = response.data;
    const user = data.user || data.student || data;
    const token = data.token;

    if (!token) {
      throw new Error(data.message || 'Authentication token missing in response');
    }

    logger.info('AUTH', `Student login successful for "${identifier}"`, {
      name: user.name || user.student_name,
      pin: user.pin_no || user.admission_number,
    });

    return {
      success: true,
      token,
      userType: 'student',
      user: {
        id: user.id || 0,
        rollNumber: user.pin_no || user.admission_number || user.rollNumber || identifier,
        name: user.name || user.student_name || user.fullName || 'Student',
        email: user.email || '',
        phone: user.student_mobile || user.phone || user.mobile || '',
        collegeId: user.college_id || user.collegeId,
        collegeName: user.college || user.college_name || user.collegeName,
        courseId: user.course_id || user.courseId,
        courseName: user.course || user.course_name || user.courseName,
        branchId: user.branch_id || user.branchId,
        branchName: user.branch || user.branch_name || user.branchName,
        academicYear: user.academic_year || user.current_year || user.academicYear,
        currentSemester: user.current_semester || user.currentSemester || 1,
        avatarUrl: user.student_photo || user.photo_url || user.avatarUrl,
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
    const identifier = (payload.username || payload.email || '').trim();
    logger.info('AUTH', `Attempting Staff Unified login for: "${identifier}"`);

    const response = await api.post('/auth/unified-login', {
      username: identifier,
      email: identifier,
      password: payload.password,
    });

    const data = response.data;
    logger.info('AUTH', `Staff login successful for: "${identifier}"`, {
      role: data.role || data.user?.role,
    });

    return {
      success: true,
      token: data.token,
      userType: data.role === 'admin' ? 'admin' : 'staff',
      user: {
        id: data.user?.id || data.id,
        username: data.user?.username || data.username || identifier,
        email: data.user?.email || data.email,
        name: data.user?.name || data.name || data.user?.username || identifier,
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
    logger.info('AUTH', `Sending Parent OTP to: ${phone}`);
    const response = await api.post('/auth/parent/otp/send', { phone });
    return response.data;
  },

  /**
   * Parent Login: Verify OTP
   * Endpoint: POST /api/auth/parent/otp/verify
   */
  async parentVerifyOtp(phone: string, otp: string) {
    logger.info('AUTH', `Verifying Parent OTP for: ${phone}`);
    const response = await api.post('/auth/parent/otp/verify', { phone, otp });
    return response.data;
  },

  /**
   * Verify Active Session Token
   * Endpoint: GET /api/auth/verify
   */
  async verifyToken() {
    logger.info('AUTH', 'Verifying session token with backend');
    const response = await api.get('/auth/verify');
    return response.data;
  },

  /**
   * Change Student Password
   * Endpoint: POST /api/students/change-password
   */
  async changePassword(currentPassword: string, newPassword: string) {
    logger.info('AUTH', 'Submitting password change request');
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
    logger.info('AUTH', `Requesting forgot password for: ${rollNumberOrEmail}`);
    const response = await api.post('/students/forgot-password', {
      username: rollNumberOrEmail,
      identifier: rollNumberOrEmail,
    });
    return response.data;
  },
};

export default authService;
