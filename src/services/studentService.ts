import api from '../config/api';
import logger from '../utils/logger';
import {
  StudentUser,
  StudentAttendanceData,
  StudentFeeDetails,
  Announcement,
} from '../types';

export const studentService = {
  /**
   * Fetch complete student profile from SDMS database
   * Endpoint: GET /api/students/:admissionNumber
   */
  async getProfile(admissionNumber: string): Promise<StudentUser> {
    logger.info('STUDENT_SERVICE', `Fetching profile for: ${admissionNumber}`);
    const response = await api.get(`/students/${admissionNumber}`);
    const s = response.data?.student || response.data?.data || response.data;

    let parsedData: any = {};
    if (s.student_data) {
      if (typeof s.student_data === 'string') {
        try {
          parsedData = JSON.parse(s.student_data);
        } catch {}
      } else {
        parsedData = s.student_data;
      }
    }

    return {
      id: s.id,
      admission_number: s.admission_number || admissionNumber,
      pin_no: s.pin_no || s.roll_number || admissionNumber,
      rollNumber: s.pin_no || s.roll_number || admissionNumber,
      username: s.username || admissionNumber,
      name: s.student_name || s.name || parsedData['Student Name'] || 'Student',
      email: s.email || parsedData['Email'] || parsedData['Student Email'] || '',
      phone: s.student_mobile || s.phone || parsedData['Student Mobile'] || '',
      batch: s.batch || parsedData['Batch'] || '',
      college: s.college || parsedData['College'] || '',
      college_name: s.college || parsedData['College'] || '',
      course: s.course || parsedData['Course'] || '',
      course_name: s.course || parsedData['Course'] || '',
      branch: s.branch || parsedData['Branch'] || '',
      branch_name: s.branch || parsedData['Branch'] || '',
      current_year: s.current_year || 1,
      current_semester: s.current_semester || 1,
      section: s.section || parsedData['Section'] || '',
      student_photo: s.student_photo || '',
      avatarUrl: s.student_photo || '',
      registration_status: s.registration_status || s.registration_status_computed || 'Regular',
      gender: s.gender || parsedData['Gender'] || '',
      dob: s.dob || parsedData['DOB (Date of Birth - DD-MM-YYYY)'] || '',
      caste: s.caste || parsedData['Caste Category'] || '',
      quota: s.quota || parsedData['Quota'] || '',
      parent_phone: s.parent_mobile || parsedData['Parent Mobile'] || '',
      role: 'student',
    };
  },

  /**
   * Fetch live attendance records from SDMS
   * Endpoint: GET /api/attendance/student
   */
  async getAttendance(): Promise<StudentAttendanceData | null> {
    logger.info('STUDENT_SERVICE', 'Fetching attendance records from /api/attendance/student');
    try {
      const response = await api.get('/attendance/student', {
        params: { _t: Date.now() },
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      return null;
    } catch (e: any) {
      logger.error('STUDENT_SERVICE', 'Failed to fetch attendance', e.message);
      return null;
    }
  },

  /**
   * Fetch student fee dues and payment history from SDMS
   * Endpoint: GET /api/fees/students/:admissionNumber/details
   */
  async getFeeDetails(admissionNumber: string): Promise<StudentFeeDetails | null> {
    logger.info('STUDENT_SERVICE', `Fetching fee details for: ${admissionNumber}`);
    try {
      const response = await api.get(`/fees/students/${admissionNumber}/details`);
      const data = response.data;

      if (!data) return null;

      const feeHeaders = (data.feeHeaders || data.headers || []).map((h: any) => ({
        id: h.id,
        name: h.name || h.fee_head || 'Tuition Fee',
        amount: Number(h.amount || 0),
        paidAmount: Number(h.paid_amount || h.paid || 0),
        dueAmount: Number(h.due_amount || (h.amount - (h.paid_amount || 0)) || 0),
        year: h.year || h.current_year,
      }));

      const transactions = (data.transactions || []).map((t: any) => ({
        id: t.id || t.payment_id,
        receiptNumber: t.receipt_number || t.receiptNo || `REC-${t.id}`,
        amount: Number(t.amount || 0),
        date: t.created_at || t.payment_date || new Date().toISOString(),
        paymentMode: t.payment_mode || t.method || 'ONLINE',
        status:
          t.status === 'success' || t.status === 'captured' ? 'SUCCESS' : t.status || 'SUCCESS',
        semester: t.semester,
      }));

      const totalAmount = Number(data.totalAmount || data.total_fee || data.totalFee || 0);
      const paidAmount = Number(data.paidAmount || data.paid_fee || data.paidFee || 0);
      const dueAmount = Number(
        data.dueAmount !== undefined
          ? data.dueAmount
          : Math.max(0, totalAmount - paidAmount)
      );

      return {
        totalAmount,
        paidAmount,
        dueAmount,
        dueDate: data.dueDate,
        feeHeaders,
        transactions,
      };
    } catch (e: any) {
      logger.error('STUDENT_SERVICE', 'Failed to fetch fee details', e.message);
      return null;
    }
  },

  /**
   * Fetch announcements for student from SDMS
   * Endpoint: GET /api/announcements/student
   */
  async getAnnouncements(): Promise<Announcement[]> {
    logger.info('STUDENT_SERVICE', 'Fetching student announcements');
    try {
      const response = await api.get('/announcements/student');
      const list = response.data?.data || response.data?.announcements || response.data || [];

      if (!Array.isArray(list)) return [];

      return list.map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content || item.description || '',
        priority: item.priority || 'medium',
        createdAt: item.created_at || item.createdAt || new Date().toISOString(),
        category: item.category || 'General',
        imageUrl: item.image_url || item.attachment_url,
        attachmentUrl: item.attachment_url,
      }));
    } catch (e: any) {
      logger.warn('STUDENT_SERVICE', 'Failed to fetch announcements', e.message);
      return [];
    }
  },

  /**
   * Fetch SDMS Student Portal Layout Settings (active modules)
   * Endpoint: GET /api/settings/student-layout
   */
  async getLayoutSettings(): Promise<Record<string, boolean>> {
    try {
      const response = await api.get('/settings/student-layout');
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
    } catch {}
    return {
      attendance: true,
      fees: true,
      announcements: true,
      clubs: true,
      events: true,
      library: true,
      services: true,
    };
  },

  /**
   * Fetch active campus clubs for student
   * Endpoint: GET /api/clubs
   */
  async getClubs(): Promise<any[]> {
    try {
      const res = await api.get('/clubs');
      return res.data?.data || res.data || [];
    } catch (e: any) {
      logger.warn('STUDENT_SERVICE', 'Failed to fetch clubs', e.message);
      return [];
    }
  },

  /**
   * Join a student campus club
   * Endpoint: POST /api/clubs/:clubId/join
   */
  async joinClub(clubId: number | string): Promise<any> {
    const res = await api.post(`/clubs/${clubId}/join`);
    return res.data;
  },

  /**
   * Fetch campus events for student
   * Endpoint: GET /api/events/student
   */
  async getEvents(): Promise<any[]> {
    try {
      const res = await api.get('/events/student');
      return res.data?.data || res.data?.events || res.data || [];
    } catch (e: any) {
      logger.warn('STUDENT_SERVICE', 'Failed to fetch events', e.message);
      return [];
    }
  },

  /**
   * Fetch academic content summary
   * Endpoint: GET /api/academic-content
   */
  async getAcademicContent(): Promise<any> {
    try {
      const res = await api.get('/academic-content');
      return res.data || null;
    } catch {
      return null;
    }
  },
};

export default studentService;
