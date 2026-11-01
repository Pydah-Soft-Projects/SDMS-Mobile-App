import api from '../config/api';
import logger from '../utils/logger';
import { getFilteredNavTree, isFullAccessRole, AdminNavItem } from '../utils/rbac';

export interface CollegeStatItem {
  college: string;
  total: number;
  present: number;
  absent: number;
  rate: number;
}

export interface StaffDashboardStats {
  totalStudents: number;
  todayPresent: number;
  todayAbsent: number;
  attendancePercentage: number;
  colleges: CollegeStatItem[];
}

export const staffService = {
  /**
   * Fetch live institution statistics from SDMS backend
   */
  async getDashboardStats(): Promise<StaffDashboardStats> {
    let collegeStats: CollegeStatItem[] = [];
    let totalStudents = 0;
    let todayPresent = 0;
    let todayAbsent = 0;

    try {
      const colRes = await api.get('/colleges/dashboard-stats');
      if (colRes.data?.data && Array.isArray(colRes.data.data)) {
        collegeStats = colRes.data.data.map((c: any) => ({
          college: c.college || c.name || 'College',
          total: Number(c.total || 0),
          present: Number(c.present || 0),
          absent: Number(c.absent || 0),
          rate: Number(c.rate || 0),
        }));

        totalStudents = collegeStats.reduce((sum, c) => sum + c.total, 0);
        todayPresent = collegeStats.reduce((sum, c) => sum + c.present, 0);
        todayAbsent = collegeStats.reduce((sum, c) => sum + c.absent, 0);
      }
    } catch (e: any) {
      logger.error('STAFF_SERVICE', 'Could not load /colleges/dashboard-stats', e.message);
    }

    if (totalStudents === 0) {
      try {
        const stuRes = await api.get('/students/stats');
        const sData = stuRes.data;
        totalStudents = Number(sData?.total || 0);
        todayPresent = Number(sData?.todayPresent || 0);
        todayAbsent = totalStudents > todayPresent ? totalStudents - todayPresent : 0;
      } catch (err: any) {
        logger.error('STAFF_SERVICE', 'Could not load /students/stats', err.message);
      }
    }

    const rate = totalStudents > 0 ? (todayPresent / totalStudents) * 100 : 0;

    return {
      totalStudents,
      todayPresent,
      todayAbsent,
      attendancePercentage: Number(rate.toFixed(1)),
      colleges: collegeStats,
    };
  },

  /**
   * Search student directory in SDMS
   */
  async searchStudents(search: string, page = 1, limit = 30) {
    const res = await api.get('/students', {
      params: { search, page, limit },
    });
    return res.data?.students || res.data?.data || res.data || [];
  },

  /**
   * Self-Registration Submissions
   */
  async getSubmissions(page = 1, status = '') {
    const res = await api.get('/submissions', {
      params: { page, status },
    });
    return res.data?.submissions || res.data?.data || res.data || [];
  },

  async approveSubmission(submissionId: string | number, remarks?: string) {
    const res = await api.post(`/submissions/${submissionId}/approve`, { remarks });
    return res.data;
  },

  async rejectSubmission(submissionId: string | number, reason: string) {
    const res = await api.post(`/submissions/${submissionId}/reject`, { reason });
    return res.data;
  },

  /**
   * Profile Change Requests
   */
  async getProfileChangeRequests() {
    const res = await api.get('/profile-changes/all');
    return res.data?.requests || res.data?.data || res.data || [];
  },

  async updateProfileRequestStatus(requestId: number | string, status: 'approved' | 'rejected', notes?: string) {
    const res = await api.put(`/profile-changes/${requestId}/status`, {
      status,
      notes: notes || `Request ${status} via SDMS Mobile`,
    });
    return res.data;
  },

  /**
   * Seminar Hall Requests
   */
  async getSeminarHallRequests() {
    const res = await api.get('/seminar-halls/requests');
    return res.data?.data || res.data?.requests || res.data || [];
  },

  async updateSeminarHallRequestStatus(requestId: number | string, status: 'approved' | 'rejected', admin_notes?: string) {
    const res = await api.patch(`/seminar-halls/requests/${requestId}`, {
      status,
      admin_notes,
    });
    return res.data;
  },

  /**
   * Services & Certificate Borrow
   */
  async getServiceRequests() {
    const res = await api.get('/services/requests');
    return res.data?.requests || res.data?.data || res.data || [];
  },

  async updateServiceRequestStatus(requestId: number | string, status: string, notes?: string) {
    const res = await api.put(`/services/requests/${requestId}/status`, {
      status,
      remarks: notes,
    });
    return res.data;
  },

  async getCertificateBorrowRequests() {
    const res = await api.get('/certificate-borrow/admin/all-requests');
    return res.data?.data || res.data?.requests || res.data || [];
  },

  async updateCertificateBorrowStatus(id: number | string, status: string, remarks?: string) {
    const res = await api.put(`/certificate-borrow/admin/update-status/${id}`, {
      status,
      remarks,
    });
    return res.data;
  },

  /**
   * RBAC Users Management
   */
  async getRbacUsers() {
    const res = await api.get('/rbac/users');
    return res.data?.users || res.data?.data || res.data || [];
  },

  async createRbacUser(userData: any) {
    const res = await api.post('/rbac/users', userData);
    return res.data;
  },

  async updateUserStatus(userId: number, isActive: boolean) {
    const res = await api.put(`/rbac/users/${userId}`, { is_active: isActive });
    return res.data;
  },

  /**
   * Announcements & Notices
   */
  async getAdminAnnouncements() {
    const res = await api.get('/announcements/admin');
    return res.data?.announcements || res.data?.data || res.data || [];
  },

  async createAnnouncement(data: { title: string; content: string; priority?: string; targetRole?: string }) {
    const res = await api.post('/announcements', data);
    return res.data;
  },

  async deleteAnnouncement(id: number | string) {
    const res = await api.delete(`/announcements/${id}`);
    return res.data;
  },

  /**
   * Polls & Events
   */
  async getPolls() {
    const res = await api.get('/polls');
    return res.data?.polls || res.data?.data || res.data || [];
  },

  async getEvents() {
    const res = await api.get('/events');
    return res.data?.events || res.data?.data || res.data || [];
  },

  /**
   * Student Clubs
   */
  async getClubs() {
    const res = await api.get('/clubs');
    return res.data?.data || res.data?.clubs || res.data || [];
  },

  async getClubStudents() {
    const res = await api.get('/clubs/students/all');
    return res.data?.data || res.data?.students || res.data || [];
  },

  /**
   * Daily Attendance Mark
   */
  async markDailyAttendance(payload: {
    collegeId: number;
    courseId?: number;
    branchId?: number;
    date: string;
    records: { studentId: number; status: 'Present' | 'Absent' }[];
  }) {
    const res = await api.post('/attendance', payload);
    return res.data;
  },

  /**
   * Get Permitted Navigation Items for user
   */
  getPermittedNavItems(user: any): AdminNavItem[] {
    return getFilteredNavTree(user);
  },
};

export default staffService;
