import api from '../config/api';
import logger from '../utils/logger';

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

export interface StaffOperation {
  key: string;
  label: string;
  description: string;
  iconName: string;
  color: string;
}

export const ALL_STAFF_OPERATIONS: StaffOperation[] = [
  {
    key: 'dashboard',
    label: 'Overview & Metrics',
    description: 'Institution-wide metrics and shortcuts',
    iconName: 'LayoutDashboard',
    color: '#1E3A8A',
  },
  {
    key: 'students',
    label: 'Students Management',
    description: 'Student profiles, enrollment data, and filters',
    iconName: 'Users',
    color: '#0284C7',
  },
  {
    key: 'attendance',
    label: 'Attendance Operations',
    description: 'Mark daily attendance and review history',
    iconName: 'CalendarCheck',
    color: '#059669',
  },
  {
    key: 'section_partition',
    label: 'Section Partition',
    description: 'Assign students to sections within a branch and batch',
    iconName: 'Split',
    color: '#7C3AED',
  },
  {
    key: 'promotions',
    label: 'Promotions',
    description: 'Promote students in bulk across academic stages',
    iconName: 'GraduationCap',
    color: '#D97706',
  },
  {
    key: 'submissions',
    label: 'Submissions',
    description: 'Review form submissions and manage approvals',
    iconName: 'FileCheck',
    color: '#2563EB',
  },
  {
    key: 'forms',
    label: 'Academic Forms',
    description: 'Create, edit, and publish dynamic academic forms',
    iconName: 'FileText',
    color: '#4F46E5',
  },
  {
    key: 'courses',
    label: 'Courses & Branches',
    description: 'Configure courses, branches, and academic structure',
    iconName: 'BookOpen',
    color: '#0D9488',
  },
  {
    key: 'reports',
    label: 'Reports & Analytics',
    description: 'Access attendance analytics, visual reports, and exports',
    iconName: 'BarChart3',
    color: '#EA580C',
  },
  {
    key: 'user-management',
    label: 'User Management',
    description: 'Create staff accounts and control access to operations',
    iconName: 'ShieldCheck',
    color: '#DC2626',
  },
];

export const staffService = {
  /**
   * Fetch live institution statistics from SDMS backend
   * Calls: GET /api/colleges/dashboard-stats and GET /api/students/stats
   */
  async getDashboardStats(): Promise<StaffDashboardStats> {
    logger.info('STAFF_SERVICE', 'Fetching real SDMS dashboard metrics');

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
      logger.warn('STAFF_SERVICE', 'Could not load /colleges/dashboard-stats', e.message);
    }

    if (totalStudents === 0) {
      try {
        const stuRes = await api.get('/students/stats');
        const sData = stuRes.data;
        totalStudents = Number(sData?.total || 0);
        todayPresent = Number(sData?.todayPresent || 0);
        todayAbsent = totalStudents > todayPresent ? totalStudents - todayPresent : 0;
      } catch (err: any) {
        logger.warn('STAFF_SERVICE', 'Could not load /students/stats', err.message);
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
   * Search real student list in SDMS
   * Endpoint: GET /api/students
   */
  async searchStudents(search: string, limit = 20) {
    const res = await api.get('/students', {
      params: { search, limit, page: 1 },
    });
    return res.data?.students || res.data?.data || res.data || [];
  },

  /**
   * Determine permitted operations from backend user model
   */
  getPermittedOperations(user: any): StaffOperation[] {
    if (!user) return [];

    const role = String(user.role || '').toLowerCase();
    const isSuperAdmin = ['admin', 'super_admin', 'superadmin'].includes(role);

    if (isSuperAdmin) {
      return ALL_STAFF_OPERATIONS;
    }

    const assignedModules: string[] = Array.isArray(user.modules) ? user.modules : [];

    const permitted = ALL_STAFF_OPERATIONS.filter((op) => {
      if (op.key === 'dashboard') return true;
      if (assignedModules.includes(op.key)) return true;
      if (user.permissions && user.permissions[op.key]) return true;
      return false;
    });

    return permitted.length > 0 ? permitted : [ALL_STAFF_OPERATIONS[0], ALL_STAFF_OPERATIONS[1]];
  },
};

export default staffService;
