import api from '../config/api';
import { StudentUser, AttendanceSummary, SubjectAttendance } from '../types';

export const studentService = {
  /**
   * Fetch logged-in student profile
   */
  async getProfile(): Promise<StudentUser> {
    const response = await api.get('/students/profile');
    const data = response.data.student || response.data;
    return {
      id: data.id,
      rollNumber: data.roll_number || data.rollNumber,
      name: data.name || data.fullName,
      email: data.email,
      phone: data.phone || data.mobile,
      collegeId: data.college_id || data.collegeId,
      collegeName: data.college_name || data.collegeName,
      courseId: data.course_id || data.courseId,
      courseName: data.course_name || data.courseName,
      branchId: data.branch_id || data.branchId,
      branchName: data.branch_name || data.branchName,
      academicYear: data.academic_year || data.academicYear,
      currentSemester: data.current_semester || data.currentSemester || 1,
      avatarUrl: data.photo_url || data.avatarUrl,
      quota: data.quota,
      caste: data.caste_category || data.caste,
      gender: data.gender,
      dob: data.dob,
      parentPhone: data.parent_phone || data.parentPhone,
    };
  },

  /**
   * Fetch overall and subject-wise attendance
   */
  async getAttendance(studentId?: number): Promise<{
    summary: AttendanceSummary;
    subjects: SubjectAttendance[];
  }> {
    try {
      const response = await api.get('/attendance/student/my-attendance', {
        params: studentId ? { studentId } : undefined,
      });
      return response.data;
    } catch {
      // Fallback endpoint if specific student id query is used
      const response = await api.get(`/attendance/student/${studentId || 'me'}`);
      return response.data;
    }
  },

  /**
   * Fetch timetable for student
   */
  async getTimetable(params?: { collegeId?: number; courseId?: number; branchId?: number; semester?: number }) {
    const response = await api.get('/timetable/student', { params });
    return response.data;
  },

  /**
   * Submit student profile change request
   */
  async submitProfileChangeRequest(data: {
    field: string;
    oldValue: string;
    newValue: string;
    reason: string;
  }) {
    const response = await api.post('/profile-change/requests', data);
    return response.data;
  },
};

export default studentService;

