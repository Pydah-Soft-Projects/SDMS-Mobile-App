import api from '../config/api';
import logger from '../utils/logger';

export interface ParentChildSummary {
  id: number | string;
  student_name: string;
  admission_number: string;
  pin_no?: string;
  roll_number?: string;
  college?: string;
  course?: string;
  branch?: string;
  current_year?: number;
  current_semester?: number;
  student_photo?: string;
}

export interface ParentDashboardSummary {
  student?: any;
  attendance?: {
    totalClasses?: number;
    attendedClasses?: number;
    percentage?: number;
    todayStatus?: string;
    weekly?: any;
    monthly?: any;
    semester?: any;
    daily?: any;
  };
  fees?: {
    totalDue?: number;
    totalPaid?: number;
    totalAmount?: number;
    status?: string;
  };
  todayClasses?: any[];
  latestAnnouncements?: any[];
  upcomingEvents?: any[];
}

export const parentService = {
  /**
   * Fetch comprehensive dashboard summary for active ward
   */
  async getDashboardSummary(): Promise<ParentDashboardSummary | null> {
    try {
      const res = await api.get('/parent/dashboard-summary');
      if (res.data?.success) {
        return res.data.data;
      }
      return null;
    } catch (err: any) {
      logger.warn('PARENT_SERVICE', `getDashboardSummary error: ${err.message}`);
      return null;
    }
  },

  /**
   * Fetch detailed student profile for active ward
   */
  async getProfile(): Promise<any> {
    try {
      const res = await api.get('/parent/profile');
      if (res.data?.success) {
        return res.data.data;
      }
      return null;
    } catch (err: any) {
      logger.warn('PARENT_SERVICE', `getProfile error: ${err.message}`);
      return null;
    }
  },

  /**
   * Fetch attendance data for active ward
   */
  async getAttendance(): Promise<any> {
    try {
      const res = await api.get('/parent/attendance');
      return res.data?.data || res.data || null;
    } catch (err: any) {
      logger.warn('PARENT_SERVICE', `getAttendance error: ${err.message}`);
      return null;
    }
  },

  /**
   * Fetch fees and dues for active ward
   */
  async getFees(): Promise<any> {
    try {
      const res = await api.get('/parent/fees');
      return res.data || null;
    } catch (err: any) {
      logger.warn('PARENT_SERVICE', `getFees error: ${err.message}`);
      return null;
    }
  },

  /**
   * Fetch timetable schedule for active ward
   */
  async getTimetable(): Promise<any> {
    try {
      const res = await api.get('/parent/timetable');
      return res.data?.data || res.data?.timetable || res.data || [];
    } catch (err: any) {
      logger.warn('PARENT_SERVICE', `getTimetable error: ${err.message}`);
      return [];
    }
  },

  /**
   * Fetch all children linked to this parent's phone number
   */
  async getChildren(): Promise<ParentChildSummary[]> {
    try {
      const res = await api.get('/parent/children');
      if (res.data?.success && Array.isArray(res.data.children)) {
        return res.data.children;
      }
      return [];
    } catch (err: any) {
      logger.warn('PARENT_SERVICE', `getChildren error: ${err.message}`);
      return [];
    }
  },

  /**
   * Switch the active child profile
   */
  async switchChild(studentId: number | string): Promise<{ success: boolean; token?: string; user?: any; message?: string }> {
    try {
      const res = await api.post('/parent/switch-child', { studentId });
      if (res.data?.success) {
        return {
          success: true,
          token: res.data.token,
          user: res.data.user,
        };
      }
      return { success: false, message: res.data?.message || 'Failed to switch child' };
    } catch (err: any) {
      logger.error('PARENT_SERVICE', `switchChild error: ${err.message}`);
      return {
        success: false,
        message: err.response?.data?.message || 'Network error while switching child',
      };
    }
  },

  /**
   * Log parent view engagement
   */
  async logView(page: string): Promise<void> {
    try {
      await api.post('/parent/view-log', { page });
    } catch {
      // Non-blocking telemetry
    }
  },
};

export default parentService;
