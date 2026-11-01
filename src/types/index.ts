// User and Auth Types
export type UserRole = 'student' | 'staff' | 'admin' | 'parent';

export interface StudentUser {
  id: number;
  rollNumber: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  collegeId?: number;
  collegeName?: string;
  courseId?: number;
  courseName?: string;
  branchId?: number;
  branchName?: string;
  academicYear?: string;
  currentSemester?: number;
  quota?: string;
  caste?: string;
  gender?: string;
  dob?: string;
  parentPhone?: string;
}

export interface StaffUser {
  id: number;
  username: string;
  email: string;
  name?: string;
  role: 'staff' | 'admin';
  modules?: string[];
  permissions?: Record<string, any>;
  collegeId?: number;
}

export interface AuthSession {
  token: string;
  userType: UserRole;
  user: StudentUser | StaffUser;
}

// Attendance Types
export interface AttendanceSummary {
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
  lastUpdated?: string;
}

export interface SubjectAttendance {
  subjectCode: string;
  subjectName: string;
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
  facultyName?: string;
}

// Fee Types
export interface FeeSummary {
  totalFee: number;
  paidFee: number;
  dueFee: number;
  dueDate?: string;
  concession?: number;
  scholarship?: number;
}

export interface FeeTransaction {
  id: string | number;
  receiptNumber: string;
  amount: number;
  date: string;
  paymentMode: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  semester?: number;
}

// Announcement Types
export interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  category?: string;
  attachmentUrl?: string;
}

