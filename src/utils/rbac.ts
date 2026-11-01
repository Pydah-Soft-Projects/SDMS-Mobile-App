/**
 * Mobile RBAC Utility
 * Mirrors backend and web frontend role-based access control permissions.
 */

export const BACKEND_MODULES = {
  DASHBOARD: 'dashboard',
  PRE_REGISTRATION: 'pre_registration',
  STUDENT_MANAGEMENT: 'student_management',
  PROMOTIONS: 'promotions',
  SECTION_PARTITION: 'section_partition',
  ATTENDANCE: 'attendance',
  FEE_MANAGEMENT: 'fee_management',
  SETTINGS: 'settings',
  USER_MANAGEMENT: 'user_management',
  REPORTS: 'reports',
  TICKET_MANAGEMENT: 'ticket_management',
  ANNOUNCEMENTS: 'announcements',
  SERVICES: 'services',
  FACULTY_MANAGEMENT: 'faculty_management',
  FACULTY_ACADEMICS: 'faculty_academics',
  CLUBS: 'clubs',
  SEMINAR_HALLS: 'seminar_halls',
};

export const FRONTEND_MODULES = {
  DASHBOARD: 'dashboard',
  FORMS: 'forms',
  SUBMISSIONS: 'submissions',
  STUDENTS: 'students',
  PROMOTIONS: 'promotions',
  SECTION_PARTITION: 'section_partition',
  ATTENDANCE: 'attendance',
  FEES: 'fees',
  COURSES: 'courses',
  USERS: 'users',
  REPORTS: 'reports',
  TICKETS: 'tickets',
  TASK_MANAGEMENT: 'task_management',
  ANNOUNCEMENTS: 'announcements',
  SERVICES: 'services',
  FACULTY_MANAGEMENT: 'faculty_management',
  CLUBS: 'clubs',
  SEMINAR_HALLS: 'seminar_halls',
};

export const FRONTEND_TO_BACKEND_MAP: Record<string, string[]> = {
  [FRONTEND_MODULES.DASHBOARD]: [BACKEND_MODULES.DASHBOARD],
  [FRONTEND_MODULES.FORMS]: [BACKEND_MODULES.PRE_REGISTRATION],
  [FRONTEND_MODULES.SUBMISSIONS]: [BACKEND_MODULES.PRE_REGISTRATION],
  [FRONTEND_MODULES.STUDENTS]: [BACKEND_MODULES.STUDENT_MANAGEMENT],
  [FRONTEND_MODULES.PROMOTIONS]: [BACKEND_MODULES.PROMOTIONS],
  [FRONTEND_MODULES.SECTION_PARTITION]: [BACKEND_MODULES.SECTION_PARTITION],
  [FRONTEND_MODULES.ATTENDANCE]: [BACKEND_MODULES.ATTENDANCE],
  [FRONTEND_MODULES.FEES]: [BACKEND_MODULES.FEE_MANAGEMENT],
  [FRONTEND_MODULES.COURSES]: [BACKEND_MODULES.SETTINGS],
  [FRONTEND_MODULES.USERS]: [BACKEND_MODULES.USER_MANAGEMENT],
  [FRONTEND_MODULES.REPORTS]: [BACKEND_MODULES.REPORTS],
  [FRONTEND_MODULES.TICKETS]: [BACKEND_MODULES.TICKET_MANAGEMENT],
  [FRONTEND_MODULES.ANNOUNCEMENTS]: [BACKEND_MODULES.ANNOUNCEMENTS],
  [FRONTEND_MODULES.SERVICES]: [BACKEND_MODULES.SERVICES],
  [FRONTEND_MODULES.FACULTY_MANAGEMENT]: [BACKEND_MODULES.FACULTY_MANAGEMENT],
  [FRONTEND_MODULES.CLUBS]: [BACKEND_MODULES.CLUBS],
  [FRONTEND_MODULES.SEMINAR_HALLS]: [BACKEND_MODULES.SEMINAR_HALLS],
};

export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  COLLEGE_PRINCIPAL: 'college_principal',
  COLLEGE_AO: 'college_ao',
  COLLEGE_ATTENDER: 'college_attender',
  BRANCH_HOD: 'branch_hod',
  OFFICE_ASSISTANT: 'office_assistant',
  CASHIER: 'cashier',
  STAFF: 'staff',
  FACULTY: 'faculty',
  BRANCH_FACULTY: 'branch_faculty',
};

export const isFullAccessRole = (role?: string): boolean => {
  if (!role) return false;
  const r = role.toLowerCase();
  return r === USER_ROLES.SUPER_ADMIN || r === USER_ROLES.ADMIN || r === 'superadmin';
};

export const hasModuleAccess = (permissions: any, frontendModule: string): boolean => {
  if (!permissions || !frontendModule) return false;

  const backendModules = FRONTEND_TO_BACKEND_MAP[frontendModule];
  if (!backendModules || backendModules.length === 0) return false;

  return backendModules.some((backendModule) => {
    const perm = permissions[backendModule];
    if (!perm) return false;
    if (typeof perm === 'boolean') return perm;
    return Object.values(perm).some((val) => val === true);
  });
};

export const hasPermission = (permissions: any, backendModule: string, action: string): boolean => {
  if (!permissions || !backendModule || !action) return false;
  const modulePerm = permissions[backendModule];
  if (!modulePerm) return false;
  return modulePerm[action] === true;
};

export const hasWriteAccess = (permissions: any, frontendModule: string): boolean => {
  if (!permissions || !frontendModule) return false;
  const backendModules = FRONTEND_TO_BACKEND_MAP[frontendModule];
  if (!backendModules || backendModules.length === 0) return false;

  const writeActions = [
    'edit',
    'control',
    'manage',
    'add_student',
    'bulk_upload',
    'delete_student',
    'approve',
    'reject',
    'mark',
    'edit_profile_requests',
    'create',
    'write',
    'create_seminar_hall_request',
    'manage_seminar_halls',
    'manage_config',
    'manage_requests',
    'manage_certificate_borrow',
  ];

  return backendModules.some((backendModule) => {
    const perm = permissions[backendModule];
    if (!perm) return false;
    return writeActions.some((action) => perm[action] === true);
  });
};

export interface AdminNavSubItem {
  id: string;
  label: string;
  permission?: string;
  action?: string;
  actions?: string[];
  iconName: string;
}

export interface AdminNavItem {
  id: string;
  label: string;
  routeKey: string;
  iconName: string;
  permission: string;
  color: string;
  subItems?: AdminNavSubItem[];
}

/**
 * Full SDMS Navigation Hierarchy (Matches Sidebar Menu in Screenshot)
 */
export const SDMS_ADMIN_NAV_TREE: AdminNavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    routeKey: 'dashboard',
    iconName: 'LayoutDashboard',
    permission: FRONTEND_MODULES.DASHBOARD,
    color: '#1E3A8A',
  },
  {
    id: 'students',
    label: 'Students',
    routeKey: 'students',
    iconName: 'Users',
    permission: FRONTEND_MODULES.STUDENTS,
    color: '#0284C7',
    subItems: [
      {
        id: 'database',
        label: 'Students Database',
        iconName: 'Database',
        permission: FRONTEND_MODULES.STUDENTS,
      },
      {
        id: 'self_registration',
        label: 'Self Registration',
        iconName: 'UserPlus',
        permission: FRONTEND_MODULES.SUBMISSIONS,
        action: 'approve',
      },
      {
        id: 'profile_requests',
        label: 'Profile Requests',
        iconName: 'ClipboardList',
        permission: FRONTEND_MODULES.STUDENTS,
        action: 'view_profile_requests',
      },
      {
        id: 'section_partition',
        label: 'Section Management',
        iconName: 'LayoutGrid',
        permission: FRONTEND_MODULES.SECTION_PARTITION,
      },
      {
        id: 'promotions',
        label: 'Promotions',
        iconName: 'TrendingUp',
        permission: FRONTEND_MODULES.PROMOTIONS,
      },
      {
        id: 'print_id_cards',
        label: 'Print ID Cards',
        iconName: 'CreditCard',
        permission: FRONTEND_MODULES.STUDENTS,
        action: 'print_id_cards',
      },
    ],
  },
  {
    id: 'attendance',
    label: 'Attendance',
    routeKey: 'attendance',
    iconName: 'CalendarCheck',
    permission: FRONTEND_MODULES.ATTENDANCE,
    color: '#059669',
    subItems: [
      {
        id: 'daily',
        label: 'Daily Attendance',
        iconName: 'CalendarCheck',
        permission: FRONTEND_MODULES.ATTENDANCE,
        action: 'view',
      },
      {
        id: 'internship',
        label: 'Internship Attendance',
        iconName: 'Briefcase',
        permission: FRONTEND_MODULES.ATTENDANCE,
        action: 'view_internship',
      },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    routeKey: 'reports',
    iconName: 'BarChart3',
    permission: FRONTEND_MODULES.REPORTS,
    color: '#EA580C',
    subItems: [
      { id: 'registration', label: 'Registration Reports', iconName: 'FileText', permission: FRONTEND_MODULES.REPORTS },
      { id: 'attendance_report', label: 'Attendance Reports', iconName: 'ClipboardList', permission: FRONTEND_MODULES.REPORTS },
      { id: 'day_end', label: 'Day End Report', iconName: 'PieChart', permission: FRONTEND_MODULES.REPORTS },
      { id: 'category', label: 'Category Report', iconName: 'Tag', permission: FRONTEND_MODULES.REPORTS },
      { id: 'scholarship', label: 'Scholarship Report', iconName: 'Award', permission: FRONTEND_MODULES.REPORTS },
      { id: 'certificates', label: 'Certificate Reports', iconName: 'FileCheck', permission: FRONTEND_MODULES.REPORTS },
      { id: 'sms_reports', label: 'SMS Reports', iconName: 'MessageSquare', permission: FRONTEND_MODULES.REPORTS },
      { id: 'profile_reports', label: 'Profile Reports', iconName: 'ClipboardList', permission: FRONTEND_MODULES.REPORTS },
    ],
  },
  {
    id: 'users',
    label: 'User Management',
    routeKey: 'user-management',
    iconName: 'ShieldCheck',
    permission: FRONTEND_MODULES.USERS,
    color: '#DC2626',
  },
  {
    id: 'announcements',
    label: 'Announcements & Comm',
    routeKey: 'announcements',
    iconName: 'Megaphone',
    permission: FRONTEND_MODULES.ANNOUNCEMENTS,
    color: '#7C3AED',
    subItems: [
      { id: 'notices', label: 'Announcements', iconName: 'Megaphone', permission: FRONTEND_MODULES.ANNOUNCEMENTS },
      { id: 'polls', label: 'Polls', iconName: 'BarChart3', permission: FRONTEND_MODULES.ANNOUNCEMENTS },
      { id: 'sms', label: 'SMS', iconName: 'Smartphone', permission: FRONTEND_MODULES.ANNOUNCEMENTS },
      { id: 'events', label: 'Events', iconName: 'Calendar', permission: FRONTEND_MODULES.ANNOUNCEMENTS },
      { id: 'exam_notifications', label: 'Examination Notifications', iconName: 'Calendar', permission: FRONTEND_MODULES.ANNOUNCEMENTS },
    ],
  },
  {
    id: 'clubs',
    label: 'Student Clubs',
    routeKey: 'clubs',
    iconName: 'Users',
    permission: FRONTEND_MODULES.CLUBS,
    color: '#D97706',
    subItems: [
      { id: 'management', label: 'Club Management', iconName: 'ShieldCheck', permission: FRONTEND_MODULES.CLUBS },
      { id: 'members', label: 'Members', iconName: 'UserCheck', permission: FRONTEND_MODULES.CLUBS },
      { id: 'settings', label: 'Club Settings', iconName: 'Settings', permission: FRONTEND_MODULES.CLUBS },
    ],
  },
  {
    id: 'seminar_halls',
    label: 'Seminar Hall Requests',
    routeKey: 'seminar-halls',
    iconName: 'Building2',
    permission: FRONTEND_MODULES.SEMINAR_HALLS,
    color: '#0D9488',
    subItems: [
      {
        id: 'requests',
        label: 'Booking Requests',
        iconName: 'CalendarCheck',
        permission: FRONTEND_MODULES.SEMINAR_HALLS,
      },
      {
        id: 'halls',
        label: 'Campus Halls',
        iconName: 'Building2',
        permission: FRONTEND_MODULES.SEMINAR_HALLS,
      },
    ],
  },
  {
    id: 'services',
    label: 'Services',
    routeKey: 'services',
    iconName: 'Briefcase',
    permission: FRONTEND_MODULES.SERVICES,
    color: '#4F46E5',
    subItems: [
      { id: 'requests', label: 'Service Requests', iconName: 'ClipboardList', permission: FRONTEND_MODULES.SERVICES },
      { id: 'config', label: 'Configuration', iconName: 'Settings', permission: FRONTEND_MODULES.SERVICES },
      { id: 'borrow', label: 'Borrow Management', iconName: 'ShieldCheck', permission: FRONTEND_MODULES.SERVICES },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    routeKey: 'courses',
    iconName: 'Settings',
    permission: FRONTEND_MODULES.COURSES,
    color: '#475569',
    subItems: [
      { id: 'courses', label: 'Colleges & Programs', iconName: 'Layers', permission: FRONTEND_MODULES.COURSES },
      { id: 'calendar', label: 'Attendance Calendar', iconName: 'CalendarCheck', permission: FRONTEND_MODULES.COURSES },
      { id: 'academic-calendar', label: 'Academic Calendar', iconName: 'Calendar', permission: FRONTEND_MODULES.COURSES },
      { id: 'forms', label: 'Registration Form', iconName: 'FileText', permission: FRONTEND_MODULES.COURSES },
      { id: 'quotas', label: 'Student Quotas', iconName: 'Tags', permission: FRONTEND_MODULES.COURSES },
      { id: 'caste-categories', label: 'Categories & Castes', iconName: 'Users', permission: FRONTEND_MODULES.COURSES },
      { id: 'notifications', label: 'Notifications', iconName: 'Bell', permission: FRONTEND_MODULES.COURSES },
      { id: 'college-transfer', label: 'College Transfer', iconName: 'TrendingUp', permission: FRONTEND_MODULES.COURSES },
      { id: 'student-layout', label: 'Student Portal Layout', iconName: 'Layout', permission: FRONTEND_MODULES.COURSES },
      { id: 'qr-config', label: 'QR Code Config', iconName: 'QrCode', permission: FRONTEND_MODULES.COURSES },
      { id: 'rtf-amount', label: 'RTF Amount Setup', iconName: 'GraduationCap', permission: FRONTEND_MODULES.COURSES },
      { id: 'freeze-database', label: 'Freeze Database', iconName: 'Lock', permission: FRONTEND_MODULES.COURSES },
      { id: 'campus', label: 'Campus Creation', iconName: 'MapPin', permission: FRONTEND_MODULES.COURSES },
    ],
  },
];

/**
 * Filter SDMS navigation items according to logged in user's role and RBAC permissions
 */
export const getFilteredNavTree = (user: any): AdminNavItem[] => {
  if (!user) return [];

  const isSuper = isFullAccessRole(user.role);
  if (isSuper) {
    return SDMS_ADMIN_NAV_TREE;
  }

  const userPerms = user.permissions || {};
  const assignedModules: string[] = Array.isArray(user.modules) ? user.modules : [];

  return SDMS_ADMIN_NAV_TREE.filter((item) => {
    if (item.id === 'dashboard') return true;

    // Check if user has module access
    const hasAccess =
      hasModuleAccess(userPerms, item.permission) ||
      assignedModules.includes(item.id) ||
      assignedModules.includes(item.routeKey);

    return hasAccess;
  }).map((item) => {
    if (!item.subItems) return item;

    // Filter sub items based on granular permissions
    const filteredSubs = item.subItems.filter((sub) => {
      if (isSuper) return true;
      if (!sub.permission) return true;

      if (sub.action) {
        const backendMods = FRONTEND_TO_BACKEND_MAP[sub.permission] || [];
        return backendMods.some((bMod) => hasPermission(userPerms, bMod, sub.action!));
      }

      return hasModuleAccess(userPerms, sub.permission);
    });

    return {
      ...item,
      subItems: filteredSubs.length > 0 ? filteredSubs : item.subItems,
    };
  });
};

