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
   * Student Login - uses unified login matching web frontend
   * Endpoint: POST /api/auth/unified-login (fallback: /api/students/login)
   */
  async studentLogin(payload: StudentLoginPayload): Promise<LoginResponse> {
    const identifier = (
      payload.username ||
      payload.rollNumber ||
      payload.email ||
      payload.loginIdentifier ||
      ''
    ).trim();

    logger.info('AUTH', `Logging in student: "${identifier}"`);

    let response;
    try {
      // Primary: Unified Login endpoint matching web frontend
      response = await api.post('/auth/unified-login', {
        username: identifier,
        password: payload.password,
        expectedRole: 'student',
      });
    } catch (err: any) {
      logger.warn('AUTH', 'Unified login endpoint failed, falling back to /students/login', err.message);
      // Fallback: direct student login route
      response = await api.post('/students/login', {
        username: identifier,
        rollNumber: identifier,
        password: payload.password,
      });
    }

    const data = response.data;
    if (!data.success && data.message) {
      throw new Error(data.message);
    }

    const rawUser = data.user || data.student || data;
    const token = data.token;

    if (!token) {
      throw new Error(data.message || 'Authentication token missing in server response');
    }

    const admissionNumber =
      rawUser.admission_number ||
      rawUser.admission_no ||
      rawUser.pin_no ||
      identifier;

    const studentUser: StudentUser = {
      id: rawUser.id,
      admission_number: admissionNumber,
      pin_no: rawUser.pin_no || rawUser.roll_number || admissionNumber,
      rollNumber: rawUser.pin_no || rawUser.roll_number || admissionNumber,
      username: rawUser.username || identifier,
      name: rawUser.name || rawUser.student_name || rawUser.fullName || 'Student',
      email: rawUser.email || '',
      phone: rawUser.student_mobile || rawUser.phone || rawUser.mobile || '',
      batch: rawUser.batch || '',
      college: rawUser.college || rawUser.college_name || '',
      college_name: rawUser.college || rawUser.college_name || '',
      college_id: rawUser.college_id,
      course: rawUser.course || rawUser.course_name || '',
      course_name: rawUser.course || rawUser.course_name || '',
      course_id: rawUser.course_id,
      course_level: rawUser.course_level || '',
      branch: rawUser.branch || rawUser.branch_name || '',
      branch_name: rawUser.branch || rawUser.branch_name || '',
      branch_id: rawUser.branch_id,
      current_year: rawUser.current_year || 1,
      current_semester: rawUser.current_semester || 1,
      section: rawUser.section || '',
      student_photo: rawUser.student_photo || rawUser.photo_url || '',
      avatarUrl: rawUser.student_photo || rawUser.photo_url || '',
      registration_status: rawUser.registration_status || 'Regular',
      quota: rawUser.quota,
      caste: rawUser.caste || rawUser.caste_category,
      gender: rawUser.gender,
      dob: rawUser.dob,
      role: 'student',
    };

    logger.info('AUTH', `Student session verified for ${studentUser.name} (${studentUser.admission_number})`);

    return {
      success: true,
      token,
      userType: 'student',
      user: studentUser,
    };
  },

  /**
   * Staff / Admin Login
   * Endpoint: POST /api/auth/unified-login
   */
  async staffLogin(payload: StaffLoginPayload): Promise<LoginResponse> {
    const identifier = (payload.username || payload.email || '').trim();
    logger.info('AUTH', `Logging in staff: "${identifier}"`);

    const response = await api.post('/auth/unified-login', {
      username: identifier,
      password: payload.password,
      expectedRole: 'staff',
    });

    const data = response.data;
    if (!data.success && data.message) {
      throw new Error(data.message);
    }

    const rawUser = data.user || data;
    const role = (rawUser.role || data.role || 'staff').toLowerCase();
    const isAdmin = ['admin', 'super_admin', 'superadmin'].includes(role);

    const staffUser: StaffUser = {
      id: rawUser.id,
      username: rawUser.username || identifier,
      email: rawUser.email || '',
      name: rawUser.name || rawUser.username || identifier,
      role: rawUser.role || 'staff',
      modules: rawUser.modules || data.modules || [],
      permissions: rawUser.permissions || {},
      collegeId: rawUser.collegeId || rawUser.college_id,
      courseId: rawUser.courseId || rawUser.course_id,
      branchId: rawUser.branchId || rawUser.branch_id,
    };

    logger.info('AUTH', `Staff login successful for ${staffUser.username} [Role: ${staffUser.role}]`);

    return {
      success: true,
      token: data.token,
      userType: isAdmin ? 'admin' : 'staff',
      user: staffUser,
    };
  },

  /**
   * Verify Active Session Token with Backend
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
      username: rollNumberOrEmail,
      identifier: rollNumberOrEmail,
    });
    return response.data;
  },
};

export default authService;
