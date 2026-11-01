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
   * Search and Paginate student directory in SDMS
   * Supports server-side pagination with limit, offset, and SDMS filters
   */
  async getPaginatedStudents(params: {
    search?: string;
    page?: number;
    limit?: number;
    college?: string;
    course?: string;
    branch?: string;
    batch?: string;
    year?: string | number;
    semester?: string | number;
    section?: string;
    pinStatus?: string;
    gender?: string;
    registrationStatus?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 20);
    const offset = (page - 1) * limit;

    const queryParams: Record<string, any> = {
      search: params.search || '',
      limit,
      offset,
    };

    if (params.college) queryParams.filter_college = params.college;
    if (params.course) queryParams.filter_course = params.course;
    if (params.branch) queryParams.filter_branch = params.branch;
    if (params.batch) queryParams.filter_batch = params.batch;
    if (params.year) queryParams.filter_year = params.year;
    if (params.semester) queryParams.filter_semester = params.semester;
    if (params.section) queryParams.filter_section = params.section;
    if (params.pinStatus) queryParams.filter_pinNumberStatus = params.pinStatus;
    if (params.gender) queryParams.filter_gender = params.gender;
    if (params.registrationStatus) queryParams.filter_registration_status = params.registrationStatus;

    const res = await api.get('/students', { params: queryParams });

    const list = res.data?.data || res.data?.students || (Array.isArray(res.data) ? res.data : []);
    const total = Number(res.data?.pagination?.total ?? (Array.isArray(list) ? list.length : 0));
    const totalPages = Math.max(1, Number(res.data?.pagination?.totalPages ?? Math.ceil(total / limit)));

    return {
      students: Array.isArray(list) ? list : [],
      total,
      totalPages,
      page,
      limit,
    };
  },

  /**
   * Fetch quick filter options from SDMS
   */
  async getQuickFilters(filters: any = {}) {
    try {
      const res = await api.get('/students/quick-filters', { params: filters });
      return (
        res.data?.data || {
          batches: [],
          colleges: [],
          courses: [],
          branches: [],
          years: [1, 2, 3, 4],
          semesters: [1, 2],
        }
      );
    } catch (e: any) {
      return {
        batches: [],
        colleges: [],
        courses: [],
        branches: [],
        years: [1, 2, 3, 4],
        semesters: [1, 2],
      };
    }
  },

  async searchStudents(search: string, page = 1, limit = 20) {
    const res = await this.getPaginatedStudents({ search, page, limit });
    return res.students;
  },

  async createStudent(studentData: any) {
    const res = await api.post('/students', studentData);
    return res.data;
  },

  async updateStudent(admissionNumber: string, data: any) {
    const res = await api.put(`/students/${admissionNumber}`, data);
    return res.data;
  },

  async deleteStudent(admissionNumber: string) {
    const res = await api.delete(`/students/${admissionNumber}`);
    return res.data;
  },

  async updateStudentPin(admissionNumber: string, pin_number: string) {
    const res = await api.put(`/students/${admissionNumber}/pin-number`, { pin_number });
    return res.data;
  },

  async resetStudentPassword(admissionNumber: string) {
    const res = await api.post(`/students/${admissionNumber}/reset-password`);
    return res.data;
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

  async deleteSubmission(submissionId: string | number) {
    const res = await api.delete(`/submissions/${submissionId}`);
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

  async updateRbacUser(userId: number | string, data: any) {
    const res = await api.put(`/rbac/users/${userId}`, data);
    return res.data;
  },

  async updateUserStatus(userId: number, isActive: boolean) {
    const res = await api.put(`/rbac/users/${userId}`, { is_active: isActive });
    return res.data;
  },

  async deleteRbacUser(userId: number | string) {
    const res = await api.delete(`/rbac/users/${userId}`);
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

  async updateAnnouncement(id: number | string, data: any) {
    const res = await api.put(`/announcements/${id}`, data);
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

  async createClub(clubData: any) {
    const res = await api.post('/clubs', clubData);
    return res.data;
  },

  async toggleClubStatus(clubId: number | string) {
    const res = await api.patch(`/clubs/${clubId}/status`);
    return res.data;
  },

  async deleteClub(clubId: number | string) {
    const res = await api.delete(`/clubs/${clubId}`);
    return res.data;
  },

  async getClubStudents() {
    const res = await api.get('/clubs/students/all');
    return res.data?.data || res.data?.students || res.data || [];
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

  async deleteServiceRequest(requestId: number | string) {
    const res = await api.delete(`/services/requests/${requestId}`);
    return res.data;
  },

  async getServicesConfig() {
    const res = await api.get('/services');
    return res.data?.data || (Array.isArray(res.data) ? res.data : []);
  },

  async createServiceConfig(data: { name: string; description?: string; price?: number; is_active?: boolean }) {
    const res = await api.post('/services', {
      name: data.name,
      description: data.description || '',
      price: Number(data.price) || 0,
      is_active: data.is_active !== false,
      template_type: 'standard',
    });
    return res.data;
  },

  async updateServiceConfig(id: number | string, data: any) {
    const res = await api.put(`/services/${id}`, data);
    return res.data;
  },

  async toggleServiceConfigStatus(id: number | string, isActive: boolean) {
    const res = await api.put(`/services/${id}`, { is_active: isActive });
    return res.data;
  },

  async deleteServiceConfig(id: number | string) {
    const res = await api.delete(`/services/${id}`);
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
   * Seminar Halls & Requests
   */
  async getSeminarHallRequests() {
    const res = await api.get('/seminar-halls/requests');
    return res.data?.data || res.data?.requests || res.data || [];
  },

  async createSeminarHallRequest(data: any) {
    const res = await api.post('/seminar-halls/requests', data);
    return res.data;
  },

  async updateSeminarHallRequestStatus(requestId: number | string, status: 'approved' | 'rejected', admin_notes?: string) {
    const res = await api.patch(`/seminar-halls/requests/${requestId}`, {
      status,
      admin_notes,
    });
    return res.data;
  },

  async getSeminarHalls() {
    const res = await api.get('/seminar-halls/halls');
    return res.data?.data || res.data?.halls || res.data || [];
  },

  async createSeminarHall(data: {
    hallName: string;
    location?: string;
    capacity?: number;
    description?: string;
    openTime?: string;
    closeTime?: string;
  }) {
    const res = await api.post('/seminar-halls/halls', data);
    return res.data;
  },

  async updateSeminarHall(hallId: number | string, data: any) {
    const res = await api.put(`/seminar-halls/halls/${hallId}`, data);
    return res.data;
  },

  async deleteSeminarHall(hallId: number | string) {
    const res = await api.delete(`/seminar-halls/halls/${hallId}`);
    return res.data;
  },

  /**
   * Daily Attendance Mark, Roll Call & Day-End Actions
   */
  async getAttendanceFilters(params?: any) {
    const res = await api.get('/attendance/filters', { params });
    return res.data?.data || res.data || {};
  },

  async getClassAttendance(params: {
    date: string;
    college_id: any;
    course_id?: any;
    branch_id?: any;
    year?: any;
    semester?: any;
    section?: any;
  }) {
    const res = await api.get('/attendance', { params });
    return res.data?.data || res.data || [];
  },

  async submitClassAttendance(payload: {
    date: string;
    college_id: any;
    course_id?: any;
    branch_id?: any;
    year?: any;
    semester?: any;
    section?: any;
    attendance: { student_id: any; status: string }[];
  }) {
    const res = await api.post('/attendance', payload);
    return res.data;
  },

  async deleteClassAttendance(params: {
    date: string;
    college_id: any;
    course_id?: any;
    branch_id?: any;
    year?: any;
    semester?: any;
    section?: any;
  }) {
    const res = await api.delete('/attendance', { params });
    return res.data;
  },

  async sendDayEndReports(payload: { date: string; college_id: any }) {
    const res = await api.post('/attendance/send-day-end-reports', payload);
    return res.data;
  },

  async getAttendanceSummary(params?: { date?: string; college_id?: any }) {
    const res = await api.get('/attendance/summary', { params });
    return res.data?.data || res.data || null;
  },

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
   * SMS Reports, Logs & Retry Actions
   */
  async getSmsReport(params?: {
    date_from?: string;
    date_to?: string;
    category?: string;
    status?: string;
    search?: string;
    template_id?: string;
  }) {
    const res = await api.get('/students/reports/sms', { params });
    return res.data?.data || res.data || null;
  },

  async getSmsLogs(params?: {
    page?: number;
    limit?: number;
    date_from?: string;
    date_to?: string;
    category?: string;
    status?: string;
    search?: string;
    template_id?: string;
  }) {
    const res = await api.get('/students/reports/sms/logs', { params });
    return {
      logs: res.data?.data || [],
      pagination: res.data?.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 },
    };
  },

  async retrySms(data?: { logId?: number | string; date?: string; college_id?: number | string }) {
    const res = await api.post('/attendance/retry-sms', data || {});
    return res.data;
  },

  async getSmsTemplates() {
    const res = await api.get('/sms-templates');
    return res.data?.data || res.data || [];
  },

  /**
   * SDMS Institution Reports
   */
  async getRegistrationAbstract(params?: { academic_year?: string; college_id?: any }) {
    const res = await api.get('/students/reports/registration/abstract', { params });
    return res.data?.data || res.data || [];
  },

  async getRegistrationStats(params?: any) {
    const res = await api.get('/students/reports/registration/stats', { params });
    return res.data?.data || res.data || null;
  },

  async getCategoryReport(params?: { academic_year?: string; college_id?: any }) {
    const res = await api.get('/students/reports/category', { params });
    return res.data?.data || res.data || [];
  },

  async getScholarshipReport(params?: { academic_year?: string; college_id?: any }) {
    const res = await api.get('/students/reports/scholarship', { params });
    return res.data?.data || res.data || [];
  },

  /**
   * Get Permitted Navigation Items for user
   */
  getPermittedNavItems(user: any): AdminNavItem[] {
    return getFilteredNavTree(user);
  },
};

export default staffService;
