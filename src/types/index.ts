// User and Auth Types
export type UserRole = 'student' | 'staff' | 'admin' | 'parent';

export interface StudentUser {
  id?: number;
  admission_number: string;
  pin_no?: string;
  rollNumber?: string;
  name: string;
  username: string;
  email?: string;
  phone?: string;
  batch?: string;
  college?: string;
  college_name?: string;
  college_id?: number;
  course?: string;
  course_name?: string;
  course_id?: number;
  course_level?: string;
  branch?: string;
  branch_name?: string;
  branch_id?: number;
  current_year?: number | string;
  current_semester?: number | string;
  section?: string;
  student_photo?: string;
  avatarUrl?: string;
  registration_status?: string;
  quota?: string;
  caste?: string;
  gender?: string;
  dob?: string;
  parent_phone?: string;
  role: 'student';
}

export interface StaffUser {
  id: number;
  username: string;
  email: string;
  name?: string;
  role: string;
  modules?: string[];
  permissions?: Record<string, any>;
  collegeId?: number;
  courseId?: number;
  branchId?: number;
}

export interface AuthSession {
  token: string;
  userType: UserRole;
  user: StudentUser | StaffUser;
}

// Attendance Types from SDMS /api/attendance/student
export interface AttendanceTotals {
  percentage?: number;
  present: number;
  absent: number;
  workingDays: number;
  holidays?: number;
}

export interface AttendanceSeriesItem {
  date: string;
  status: 'Present' | 'Absent' | 'Holiday' | 'Weekend';
  isHoliday?: boolean;
  holidayReason?: string;
}

export interface StudentAttendanceData {
  student: {
    id: number;
    name: string;
    pin: string;
    batch?: string;
  };
  weekly?: {
    totals: AttendanceTotals;
    series: AttendanceSeriesItem[];
  };
  monthly?: {
    totals: AttendanceTotals;
    series: AttendanceSeriesItem[];
  };
  semester?: {
    startDate?: string;
    endDate?: string;
    totals: AttendanceTotals;
    series?: AttendanceSeriesItem[];
  };
}

// Fee Types from SDMS /api/fees/students/:admissionNumber/details
export interface FeeSummary {
  totalFee: number;
  paidFee: number;
  dueFee: number;
  dueDate?: string;
  scholarship?: number;
  concession?: number;
}

export interface FeeHeaderItem {
  id: number;
  name: string;
  amount: number;
  paidAmount?: number;
  dueAmount?: number;
  year?: number;
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

export interface StudentFeeDetails {
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  dueDate?: string;
  feeHeaders: FeeHeaderItem[];
  transactions: FeeTransaction[];
}

// Announcement Type from SDMS /api/announcements/student
export interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  category?: string;
  imageUrl?: string;
  attachmentUrl?: string;
}
