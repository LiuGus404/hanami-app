/**
 * 權限定義
 * 定義系統中所有可用的權限
 * 基於 @hanami-saas-system 和 @old-supabase-structure.md
 */
export const PERMISSIONS = {
  // ========== 學生管理權限 ==========
  STUDENT_VIEW: 'student:view',
  STUDENT_CREATE: 'student:create',
  STUDENT_UPDATE: 'student:update',
  STUDENT_DELETE: 'student:delete',
  STUDENT_APPROVE: 'student:approve', // 審核待審核學生
  STUDENT_PROGRESS_VIEW: 'student:progress:view',
  STUDENT_PROGRESS_UPDATE: 'student:progress:update',
  STUDENT_MEDIA_VIEW: 'student:media:view',
  STUDENT_MEDIA_UPLOAD: 'student:media:upload',

  // ========== 課程管理權限 ==========
  LESSON_VIEW: 'lesson:view',
  LESSON_CREATE: 'lesson:create',
  LESSON_UPDATE: 'lesson:update',
  LESSON_DELETE: 'lesson:delete',
  LESSON_PLAN_VIEW: 'lesson:plan:view',
  LESSON_PLAN_CREATE: 'lesson:plan:create',
  LESSON_PLAN_UPDATE: 'lesson:plan:update',
  LESSON_PLAN_DELETE: 'lesson:plan:delete',

  // ========== 課程類型管理權限 ==========
  COURSE_TYPE_VIEW: 'course_type:view',
  COURSE_TYPE_CREATE: 'course_type:create',
  COURSE_TYPE_UPDATE: 'course_type:update',
  COURSE_TYPE_DELETE: 'course_type:delete',
  COURSE_PRICING_VIEW: 'course_pricing:view',
  COURSE_PRICING_UPDATE: 'course_pricing:update',

  // ========== 機構管理權限 ==========
  ORG_VIEW: 'org:view',
  ORG_UPDATE: 'org:update',
  ORG_DELETE: 'org:delete',
  ORG_MANAGE: 'org:manage',
  ORG_SETTINGS_VIEW: 'org:settings:view',
  ORG_SETTINGS_UPDATE: 'org:settings:update',

  // ========== 成員管理權限 ==========
  MEMBER_VIEW: 'member:view',
  MEMBER_CREATE: 'member:create',
  MEMBER_UPDATE: 'member:update',
  MEMBER_DELETE: 'member:delete',
  MEMBER_INVITE: 'member:invite',
  MEMBER_ROLE_ASSIGN: 'member:role:assign',

  // ========== 教師管理權限 ==========
  TEACHER_VIEW: 'teacher:view',
  TEACHER_CREATE: 'teacher:create',
  TEACHER_UPDATE: 'teacher:update',
  TEACHER_DELETE: 'teacher:delete',
  TEACHER_SCHEDULE_VIEW: 'teacher:schedule:view',
  TEACHER_SCHEDULE_MANAGE: 'teacher:schedule:manage',
  TEACHER_ATTENDANCE_VIEW: 'teacher:attendance:view',

  // ========== 排程管理權限 ==========
  SCHEDULE_VIEW: 'schedule:view',
  SCHEDULE_CREATE: 'schedule:create',
  SCHEDULE_UPDATE: 'schedule:update',
  SCHEDULE_DELETE: 'schedule:delete',
  SCHEDULE_MANAGE: 'schedule:manage',

  // ========== 財務管理權限 ==========
  FINANCIAL_VIEW: 'financial:view',
  FINANCIAL_UPDATE: 'financial:update',
  FINANCIAL_EXPORT: 'financial:export',
  PAYMENT_VIEW: 'payment:view',
  PAYMENT_PROCESS: 'payment:process',
  EXPENSE_VIEW: 'expense:view',
  EXPENSE_CREATE: 'expense:create',

  // ========== 報表權限 ==========
  REPORT_VIEW: 'report:view',
  REPORT_EXPORT: 'report:export',
  REPORT_CREATE: 'report:create',

  // ========== 系統設置權限 ==========
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_UPDATE: 'settings:update',
  SETTINGS_ADVANCED: 'settings:advanced',

  // ========== 教學活動權限 ==========
  ACTIVITY_VIEW: 'activity:view',
  ACTIVITY_CREATE: 'activity:create',
  ACTIVITY_UPDATE: 'activity:update',
  ACTIVITY_DELETE: 'activity:delete',
  ACTIVITY_TEMPLATE_MANAGE: 'activity:template:manage',

  // ========== 資源庫權限 ==========
  RESOURCE_VIEW: 'resource:view',
  RESOURCE_CREATE: 'resource:create',
  RESOURCE_UPDATE: 'resource:update',
  RESOURCE_DELETE: 'resource:delete',
  RESOURCE_DOWNLOAD: 'resource:download',
  RESOURCE_SHARE: 'resource:share',

  // ========== 成長樹權限 ==========
  GROWTH_TREE_VIEW: 'growth_tree:view',
  GROWTH_TREE_CREATE: 'growth_tree:create',
  GROWTH_TREE_UPDATE: 'growth_tree:update',
  GROWTH_TREE_DELETE: 'growth_tree:delete',
  GROWTH_TREE_ASSESSMENT_VIEW: 'growth_tree:assessment:view',
  GROWTH_TREE_ASSESSMENT_CREATE: 'growth_tree:assessment:create',

  // ========== AI 功能權限 (SaaS) ==========
  AI_CHAT_VIEW: 'ai:chat:view',
  AI_CHAT_CREATE: 'ai:chat:create',
  AI_ROLE_MANAGE: 'ai:role:manage',
  AI_PROJECT_VIEW: 'ai:project:view',
  AI_PROJECT_CREATE: 'ai:project:create',
  AI_TOOL_USE: 'ai:tool:use',

  // ========== 任務管理權限 ==========
  TASK_VIEW: 'task:view',
  TASK_CREATE: 'task:create',
  TASK_UPDATE: 'task:update',
  TASK_DELETE: 'task:delete',
  TASK_ASSIGN: 'task:assign',

  // ========== 權限管理權限 ==========
  PERMISSION_VIEW: 'permission:view',
  PERMISSION_MANAGE: 'permission:manage',
  PERMISSION_AUDIT: 'permission:audit',
  ROLE_MANAGE: 'role:manage',

  // ========== 審計和日誌權限 ==========
  AUDIT_LOG_VIEW: 'audit:log:view',
  SYSTEM_LOG_VIEW: 'system:log:view',

  // ========== 試聽學生管理權限 ==========
  TRIAL_STUDENT_VIEW: 'trial_student:view',
  TRIAL_STUDENT_CREATE: 'trial_student:create',
  TRIAL_STUDENT_UPDATE: 'trial_student:update',
  TRIAL_STUDENT_DELETE: 'trial_student:delete',
  TRIAL_QUEUE_VIEW: 'trial_queue:view',
  TRIAL_QUEUE_MANAGE: 'trial_queue:manage',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * 角色權限矩陣
 * 定義每個角色擁有的權限
 * 基於 @hanami-saas-system 和 @old-supabase-structure.md
 * 
 * 角色說明：
 * 
 * 機構角色（old-supabase-structure）：
 * - owner: 機構創建者，擁有最高權限
 * - admin: 機構管理員，擁有大部分管理權限
 * - teacher: 教師，可以管理學生和課程
 * - member: 機構成員，基本查看權限
 * 
 * SaaS 系統角色（hanami-saas-system）：
 * - super_admin: SaaS 系統超級管理員（跨機構）
 * - staff: SaaS 系統工作人員
 * - moderator: SaaS 系統審核員
 * - billing_manager: SaaS 系統財務管理員
 * - auditor: SaaS 系統審計員
 * - user: SaaS 系統普通用戶
 */
export const ROLE_MATRIX = {
  // ========== 機構角色 (old-supabase-structure) ==========
  owner: [
    // 學生管理
    PERMISSIONS.STUDENT_VIEW,
    PERMISSIONS.STUDENT_CREATE,
    PERMISSIONS.STUDENT_UPDATE,
    PERMISSIONS.STUDENT_DELETE,
    PERMISSIONS.STUDENT_APPROVE,
    PERMISSIONS.STUDENT_PROGRESS_VIEW,
    PERMISSIONS.STUDENT_PROGRESS_UPDATE,
    PERMISSIONS.STUDENT_MEDIA_VIEW,
    PERMISSIONS.STUDENT_MEDIA_UPLOAD,
    // 課程管理
    PERMISSIONS.LESSON_VIEW,
    PERMISSIONS.LESSON_CREATE,
    PERMISSIONS.LESSON_UPDATE,
    PERMISSIONS.LESSON_DELETE,
    PERMISSIONS.LESSON_PLAN_VIEW,
    PERMISSIONS.LESSON_PLAN_CREATE,
    PERMISSIONS.LESSON_PLAN_UPDATE,
    PERMISSIONS.LESSON_PLAN_DELETE,
    // 課程類型
    PERMISSIONS.COURSE_TYPE_VIEW,
    PERMISSIONS.COURSE_TYPE_CREATE,
    PERMISSIONS.COURSE_TYPE_UPDATE,
    PERMISSIONS.COURSE_TYPE_DELETE,
    PERMISSIONS.COURSE_PRICING_VIEW,
    PERMISSIONS.COURSE_PRICING_UPDATE,
    // 機構管理
    PERMISSIONS.ORG_VIEW,
    PERMISSIONS.ORG_UPDATE,
    PERMISSIONS.ORG_DELETE,
    PERMISSIONS.ORG_MANAGE,
    PERMISSIONS.ORG_SETTINGS_VIEW,
    PERMISSIONS.ORG_SETTINGS_UPDATE,
    // 成員管理
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.MEMBER_CREATE,
    PERMISSIONS.MEMBER_UPDATE,
    PERMISSIONS.MEMBER_DELETE,
    PERMISSIONS.MEMBER_INVITE,
    PERMISSIONS.MEMBER_ROLE_ASSIGN,
    // 教師管理
    PERMISSIONS.TEACHER_VIEW,
    PERMISSIONS.TEACHER_CREATE,
    PERMISSIONS.TEACHER_UPDATE,
    PERMISSIONS.TEACHER_DELETE,
    PERMISSIONS.TEACHER_SCHEDULE_VIEW,
    PERMISSIONS.TEACHER_SCHEDULE_MANAGE,
    PERMISSIONS.TEACHER_ATTENDANCE_VIEW,
    // 排程管理
    PERMISSIONS.SCHEDULE_VIEW,
    PERMISSIONS.SCHEDULE_CREATE,
    PERMISSIONS.SCHEDULE_UPDATE,
    PERMISSIONS.SCHEDULE_DELETE,
    PERMISSIONS.SCHEDULE_MANAGE,
    // 財務管理
    PERMISSIONS.FINANCIAL_VIEW,
    PERMISSIONS.FINANCIAL_UPDATE,
    PERMISSIONS.FINANCIAL_EXPORT,
    PERMISSIONS.PAYMENT_VIEW,
    PERMISSIONS.PAYMENT_PROCESS,
    PERMISSIONS.EXPENSE_VIEW,
    PERMISSIONS.EXPENSE_CREATE,
    // 報表
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.REPORT_CREATE,
    // 系統設置
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_UPDATE,
    PERMISSIONS.SETTINGS_ADVANCED,
    // 教學活動
    PERMISSIONS.ACTIVITY_VIEW,
    PERMISSIONS.ACTIVITY_CREATE,
    PERMISSIONS.ACTIVITY_UPDATE,
    PERMISSIONS.ACTIVITY_DELETE,
    PERMISSIONS.ACTIVITY_TEMPLATE_MANAGE,
    // 資源庫
    PERMISSIONS.RESOURCE_VIEW,
    PERMISSIONS.RESOURCE_CREATE,
    PERMISSIONS.RESOURCE_UPDATE,
    PERMISSIONS.RESOURCE_DELETE,
    PERMISSIONS.RESOURCE_DOWNLOAD,
    PERMISSIONS.RESOURCE_SHARE,
    // 成長樹
    PERMISSIONS.GROWTH_TREE_VIEW,
    PERMISSIONS.GROWTH_TREE_CREATE,
    PERMISSIONS.GROWTH_TREE_UPDATE,
    PERMISSIONS.GROWTH_TREE_DELETE,
    PERMISSIONS.GROWTH_TREE_ASSESSMENT_VIEW,
    PERMISSIONS.GROWTH_TREE_ASSESSMENT_CREATE,
    // 任務管理
    PERMISSIONS.TASK_VIEW,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.TASK_DELETE,
    PERMISSIONS.TASK_ASSIGN,
    // 權限管理
    PERMISSIONS.PERMISSION_VIEW,
    PERMISSIONS.PERMISSION_MANAGE,
    PERMISSIONS.PERMISSION_AUDIT,
    PERMISSIONS.ROLE_MANAGE,
    // 審計
    PERMISSIONS.AUDIT_LOG_VIEW,
    PERMISSIONS.SYSTEM_LOG_VIEW,
    // 試聽學生
    PERMISSIONS.TRIAL_STUDENT_VIEW,
    PERMISSIONS.TRIAL_STUDENT_CREATE,
    PERMISSIONS.TRIAL_STUDENT_UPDATE,
    PERMISSIONS.TRIAL_STUDENT_DELETE,
    PERMISSIONS.TRIAL_QUEUE_VIEW,
    PERMISSIONS.TRIAL_QUEUE_MANAGE,
  ],

  admin: [
    // 學生管理
    PERMISSIONS.STUDENT_VIEW,
    PERMISSIONS.STUDENT_CREATE,
    PERMISSIONS.STUDENT_UPDATE,
    PERMISSIONS.STUDENT_DELETE,
    PERMISSIONS.STUDENT_APPROVE,
    PERMISSIONS.STUDENT_PROGRESS_VIEW,
    PERMISSIONS.STUDENT_PROGRESS_UPDATE,
    PERMISSIONS.STUDENT_MEDIA_VIEW,
    PERMISSIONS.STUDENT_MEDIA_UPLOAD,
    // 課程管理
    PERMISSIONS.LESSON_VIEW,
    PERMISSIONS.LESSON_CREATE,
    PERMISSIONS.LESSON_UPDATE,
    PERMISSIONS.LESSON_DELETE,
    PERMISSIONS.LESSON_PLAN_VIEW,
    PERMISSIONS.LESSON_PLAN_CREATE,
    PERMISSIONS.LESSON_PLAN_UPDATE,
    PERMISSIONS.LESSON_PLAN_DELETE,
    // 課程類型
    PERMISSIONS.COURSE_TYPE_VIEW,
    PERMISSIONS.COURSE_TYPE_CREATE,
    PERMISSIONS.COURSE_TYPE_UPDATE,
    PERMISSIONS.COURSE_PRICING_VIEW,
    PERMISSIONS.COURSE_PRICING_UPDATE,
    // 機構管理（有限）
    PERMISSIONS.ORG_VIEW,
    PERMISSIONS.ORG_UPDATE,
    PERMISSIONS.ORG_SETTINGS_VIEW,
    PERMISSIONS.ORG_SETTINGS_UPDATE,
    // 成員管理
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.MEMBER_CREATE,
    PERMISSIONS.MEMBER_UPDATE,
    PERMISSIONS.MEMBER_DELETE,
    PERMISSIONS.MEMBER_INVITE,
    PERMISSIONS.MEMBER_ROLE_ASSIGN,
    // 教師管理
    PERMISSIONS.TEACHER_VIEW,
    PERMISSIONS.TEACHER_CREATE,
    PERMISSIONS.TEACHER_UPDATE,
    PERMISSIONS.TEACHER_DELETE,
    PERMISSIONS.TEACHER_SCHEDULE_VIEW,
    PERMISSIONS.TEACHER_SCHEDULE_MANAGE,
    PERMISSIONS.TEACHER_ATTENDANCE_VIEW,
    // 排程管理
    PERMISSIONS.SCHEDULE_VIEW,
    PERMISSIONS.SCHEDULE_CREATE,
    PERMISSIONS.SCHEDULE_UPDATE,
    PERMISSIONS.SCHEDULE_DELETE,
    PERMISSIONS.SCHEDULE_MANAGE,
    // 財務管理（查看和部分更新）
    PERMISSIONS.FINANCIAL_VIEW,
    PERMISSIONS.FINANCIAL_UPDATE,
    PERMISSIONS.PAYMENT_VIEW,
    PERMISSIONS.PAYMENT_PROCESS,
    PERMISSIONS.EXPENSE_VIEW,
    PERMISSIONS.EXPENSE_CREATE,
    // 報表
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.REPORT_CREATE,
    // 系統設置（有限）
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_UPDATE,
    // 教學活動
    PERMISSIONS.ACTIVITY_VIEW,
    PERMISSIONS.ACTIVITY_CREATE,
    PERMISSIONS.ACTIVITY_UPDATE,
    PERMISSIONS.ACTIVITY_DELETE,
    PERMISSIONS.ACTIVITY_TEMPLATE_MANAGE,
    // 資源庫
    PERMISSIONS.RESOURCE_VIEW,
    PERMISSIONS.RESOURCE_CREATE,
    PERMISSIONS.RESOURCE_UPDATE,
    PERMISSIONS.RESOURCE_DELETE,
    PERMISSIONS.RESOURCE_DOWNLOAD,
    PERMISSIONS.RESOURCE_SHARE,
    // 成長樹
    PERMISSIONS.GROWTH_TREE_VIEW,
    PERMISSIONS.GROWTH_TREE_CREATE,
    PERMISSIONS.GROWTH_TREE_UPDATE,
    PERMISSIONS.GROWTH_TREE_DELETE,
    PERMISSIONS.GROWTH_TREE_ASSESSMENT_VIEW,
    PERMISSIONS.GROWTH_TREE_ASSESSMENT_CREATE,
    // 任務管理
    PERMISSIONS.TASK_VIEW,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.TASK_DELETE,
    PERMISSIONS.TASK_ASSIGN,
    // 權限管理（查看）
    PERMISSIONS.PERMISSION_VIEW,
    // 審計（查看）
    PERMISSIONS.AUDIT_LOG_VIEW,
    // 試聽學生
    PERMISSIONS.TRIAL_STUDENT_VIEW,
    PERMISSIONS.TRIAL_STUDENT_CREATE,
    PERMISSIONS.TRIAL_STUDENT_UPDATE,
    PERMISSIONS.TRIAL_STUDENT_DELETE,
    PERMISSIONS.TRIAL_QUEUE_VIEW,
    PERMISSIONS.TRIAL_QUEUE_MANAGE,
  ],

  teacher: [
    // 學生管理（查看和自己負責的學生）
    PERMISSIONS.STUDENT_VIEW,
    PERMISSIONS.STUDENT_PROGRESS_VIEW,
    PERMISSIONS.STUDENT_PROGRESS_UPDATE,
    PERMISSIONS.STUDENT_MEDIA_VIEW,
    PERMISSIONS.STUDENT_MEDIA_UPLOAD,
    // 課程管理
    PERMISSIONS.LESSON_VIEW,
    PERMISSIONS.LESSON_CREATE,
    PERMISSIONS.LESSON_UPDATE,
    PERMISSIONS.LESSON_PLAN_VIEW,
    PERMISSIONS.LESSON_PLAN_CREATE,
    PERMISSIONS.LESSON_PLAN_UPDATE,
    // 課程類型（查看）
    PERMISSIONS.COURSE_TYPE_VIEW,
    // 排程管理（查看）
    PERMISSIONS.SCHEDULE_VIEW,
    PERMISSIONS.TEACHER_SCHEDULE_VIEW,
    // 報表（查看）
    PERMISSIONS.REPORT_VIEW,
    // 教學活動
    PERMISSIONS.ACTIVITY_VIEW,
    PERMISSIONS.ACTIVITY_CREATE,
    PERMISSIONS.ACTIVITY_UPDATE,
    // 資源庫（查看和下載）
    PERMISSIONS.RESOURCE_VIEW,
    PERMISSIONS.RESOURCE_DOWNLOAD,
    // 成長樹（查看和評估）
    PERMISSIONS.GROWTH_TREE_VIEW,
    PERMISSIONS.GROWTH_TREE_ASSESSMENT_VIEW,
    PERMISSIONS.GROWTH_TREE_ASSESSMENT_CREATE,
    // 任務管理（查看和更新自己的任務）
    PERMISSIONS.TASK_VIEW,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_UPDATE,
  ],

  member: [
    // 學生管理（查看）
    PERMISSIONS.STUDENT_VIEW,
    // 課程管理（查看）
    PERMISSIONS.LESSON_VIEW,
    // 排程管理（查看）
    PERMISSIONS.SCHEDULE_VIEW,
    // 資源庫（查看）
    PERMISSIONS.RESOURCE_VIEW,
    PERMISSIONS.RESOURCE_DOWNLOAD,
    // 任務管理
    PERMISSIONS.TASK_VIEW,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_UPDATE,
  ],

  // ========== SaaS 系統角色 (hanami-saas-system) ==========
  super_admin: [
    // SaaS 系統級別的所有權限
    PERMISSIONS.ORG_VIEW,
    PERMISSIONS.ORG_MANAGE,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_UPDATE,
    PERMISSIONS.SETTINGS_ADVANCED,
    PERMISSIONS.AUDIT_LOG_VIEW,
    PERMISSIONS.SYSTEM_LOG_VIEW,
    PERMISSIONS.PERMISSION_VIEW,
    PERMISSIONS.PERMISSION_MANAGE,
    PERMISSIONS.PERMISSION_AUDIT,
    PERMISSIONS.ROLE_MANAGE,
    // AI 功能
    PERMISSIONS.AI_CHAT_VIEW,
    PERMISSIONS.AI_CHAT_CREATE,
    PERMISSIONS.AI_ROLE_MANAGE,
    PERMISSIONS.AI_PROJECT_VIEW,
    PERMISSIONS.AI_PROJECT_CREATE,
    PERMISSIONS.AI_TOOL_USE,
  ],

  staff: [
    // SaaS 系統工作人員權限
    PERMISSIONS.ORG_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.AUDIT_LOG_VIEW,
    PERMISSIONS.AI_CHAT_VIEW,
    PERMISSIONS.AI_CHAT_CREATE,
    PERMISSIONS.AI_PROJECT_VIEW,
    PERMISSIONS.AI_PROJECT_CREATE,
  ],

  moderator: [
    // SaaS 系統審核員權限
    PERMISSIONS.ORG_VIEW,
    PERMISSIONS.AUDIT_LOG_VIEW,
    PERMISSIONS.PERMISSION_VIEW,
    PERMISSIONS.AI_CHAT_VIEW,
  ],

  billing_manager: [
    // SaaS 系統財務管理員權限
    PERMISSIONS.ORG_VIEW,
    PERMISSIONS.FINANCIAL_VIEW,
    PERMISSIONS.FINANCIAL_EXPORT,
    PERMISSIONS.PAYMENT_VIEW,
    PERMISSIONS.PAYMENT_PROCESS,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_EXPORT,
  ],

  auditor: [
    // SaaS 系統審計員權限
    PERMISSIONS.ORG_VIEW,
    PERMISSIONS.AUDIT_LOG_VIEW,
    PERMISSIONS.SYSTEM_LOG_VIEW,
    PERMISSIONS.PERMISSION_VIEW,
    PERMISSIONS.PERMISSION_AUDIT,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_EXPORT,
  ],

  // ========== SaaS 普通用戶 ==========
  user: [
    // SaaS 系統普通用戶權限
    PERMISSIONS.AI_CHAT_VIEW,
    PERMISSIONS.AI_CHAT_CREATE,
    PERMISSIONS.AI_PROJECT_VIEW,
    PERMISSIONS.AI_PROJECT_CREATE,
  ],
} as const;

export type RoleType = keyof typeof ROLE_MATRIX;

/**
 * 機構角色類型（用於 Teacher Link 頁面權限）
 */
export type OrgRole = 'owner' | 'admin' | 'teacher' | 'member';

/**
 * Teacher Link 頁面鍵類型
 */
export type PageKey =
  | 'students' // 學生管理
  | 'members' // 成員管理
  | 'class-activities' // 課堂活動管理
  | 'class-activities-full' // 課堂活動管理（完整版，包含課程與課堂排期管理、多課程時間表）
  | 'progress' // 學生進度
  | 'finance' // 財務管理
  | 'tasks' // 任務管理
  | 'learning-resources' // 學習資源
  | 'schedule-management' // 課程與課堂排期管理
  | 'organization-settings' // 機構設置
  | 'teachers' // 教師管理
  | 'pending-students' // 待處理學生
  | 'lesson-availability' // 課程可用性
  | 'permission-management' // 權限管理
  | 'ai-tools' // AI 工具
  | 'ai-select' // AI 選擇
  | 'ai-project-logs'; // AI 項目日誌

/**
 * 頁面權限配置接口
 */
export interface PagePermission {
  key: PageKey;
  path: string;
  title: string;
  description?: string;
  allowedRoles: OrgRole[];
  restrictedFeatures?: string[]; // 限制的功能（如 teacher 角色在 class-activities 中不能訪問某些功能）
}

/**
 * Teacher Link 頁面權限配置
 * 定義不同角色在機構中可以訪問的頁面和功能
 */
export const PAGE_PERMISSIONS: Record<PageKey, PagePermission> = {
  'students': {
    key: 'students',
    path: '/aihome/teacher-link/create/students',
    title: '學生管理',
    allowedRoles: ['owner', 'admin'],
  },
  'members': {
    key: 'members',
    path: '/aihome/teacher-link/create/member-management',
    title: '成員管理',
    allowedRoles: ['owner', 'admin'],
  },
  'class-activities': {
    key: 'class-activities',
    path: '/aihome/teacher-link/create/class-activities',
    title: '課堂活動管理',
    description: '不包含課程與課堂排期管理、多課程時間表',
    allowedRoles: ['owner', 'admin', 'teacher', 'member'],
    restrictedFeatures: ['schedule-management', 'multi-course-schedule'], // teacher 和 member 不能訪問的功能
  },
  'class-activities-full': {
    key: 'class-activities-full',
    path: '/aihome/teacher-link/create/class-activities',
    title: '課堂活動管理（完整版）',
    description: '包含課程與課堂排期管理、多課程時間表',
    allowedRoles: ['owner', 'admin'],
  },
  'progress': {
    key: 'progress',
    path: '/aihome/teacher-link/create/student-progress',
    title: '學生進度',
    allowedRoles: ['owner', 'admin'],
  },
  'finance': {
    key: 'finance',
    path: '/aihome/teacher-link/create/financial-management',
    title: '財務管理',
    allowedRoles: ['owner', 'admin'],
  },
  'tasks': {
    key: 'tasks',
    path: '/aihome/teacher-link/create/task-management',
    title: '任務管理',
    allowedRoles: ['owner', 'admin', 'teacher', 'member'],
  },
  'learning-resources': {
    key: 'learning-resources',
    path: '/aihome/teacher-link/create/learning-resources',
    title: '學習資源',
    allowedRoles: ['owner', 'admin', 'teacher'],
  },
  'schedule-management': {
    key: 'schedule-management',
    path: '/aihome/teacher-link/create/schedule-management',
    title: '課程與課堂排期管理',
    description: '包含課程類型、課程代碼與多課程時間表',
    allowedRoles: ['owner', 'admin'],
  },
  'organization-settings': {
    key: 'organization-settings',
    path: '/aihome/teacher-link/create/organization-settings',
    title: '機構設置',
    allowedRoles: ['owner', 'admin'],
  },
  'teachers': {
    key: 'teachers',
    path: '/aihome/teacher-link/create/teachers',
    title: '教師管理',
    allowedRoles: ['owner', 'admin'],
  },
  'pending-students': {
    key: 'pending-students',
    path: '/aihome/teacher-link/create/pending-students',
    title: '待處理學生',
    allowedRoles: ['owner', 'admin'],
  },
  'lesson-availability': {
    key: 'lesson-availability',
    path: '/aihome/teacher-link/create/lesson-availability',
    title: '課程可用性',
    allowedRoles: ['owner', 'admin'],
  },
  'permission-management': {
    key: 'permission-management',
    path: '/aihome/teacher-link/create/permission-management',
    title: '權限管理',
    allowedRoles: ['owner', 'admin'],
  },
  'ai-tools': {
    key: 'ai-tools',
    path: '/aihome/teacher-link/create/ai-tools',
    title: 'AI 工具',
    allowedRoles: ['owner', 'admin'],
  },
  'ai-select': {
    key: 'ai-select',
    path: '/aihome/teacher-link/create/ai-select',
    title: 'AI 選擇',
    allowedRoles: ['owner', 'admin'],
  },
  'ai-project-logs': {
    key: 'ai-project-logs',
    path: '/aihome/teacher-link/create/ai-project-logs',
    title: 'AI 項目日誌',
    allowedRoles: ['owner', 'admin'],
  },
};

/**
 * 檢查用戶是否有特定權限
 */
export function hasPermission(role: RoleType, permission: Permission): boolean {
  const rolePermissions = (ROLE_MATRIX[role] || []) as unknown as Permission[];
  return rolePermissions.includes(permission);
}

/**
 * 檢查用戶是否有任一權限
 */
export function hasAnyPermission(role: RoleType, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * 檢查用戶是否有所有權限
 */
export function hasAllPermissions(role: RoleType, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * 獲取角色的所有權限
 */
export function getRolePermissions(role: RoleType): Permission[] {
  return (ROLE_MATRIX[role] || []) as unknown as Permission[];
}

/**
 * 檢查角色是否有權限訪問頁面（Teacher Link）
 */
export function hasPagePermission(role: OrgRole | null, pageKey: PageKey): boolean {
  if (!role) return false;

  const permission = PAGE_PERMISSIONS[pageKey];
  if (!permission) return false;

  return permission.allowedRoles.includes(role);
}

/**
 * 檢查角色是否可以訪問某個功能（Teacher Link）
 */
export function hasFeaturePermission(
  role: OrgRole | null,
  pageKey: PageKey,
  feature: string
): boolean {
  if (!role) return false;

  const permission = PAGE_PERMISSIONS[pageKey];
  if (!permission) return false;

  // 如果角色不在允許列表中，無權限
  if (!permission.allowedRoles.includes(role)) return false;

  // 如果有限制功能列表，且當前功能在限制列表中，檢查角色
  if (permission.restrictedFeatures?.includes(feature)) {
    // owner 和 admin 可以訪問所有功能
    if (role === 'owner' || role === 'admin') return true;
    // teacher 和 member 不能訪問限制的功能
    return false;
  }

  return true;
}

/**
 * 獲取角色可以訪問的所有頁面（Teacher Link）
 */
export function getAllowedPages(role: OrgRole | null): PagePermission[] {
  if (!role) return [];

  return Object.values(PAGE_PERMISSIONS).filter((permission) =>
    permission.allowedRoles.includes(role)
  );
}

/**
 * 根據路徑獲取頁面權限配置（Teacher Link）
 */
export function getPagePermissionByPath(path: string): PagePermission | null {
  const page = Object.values(PAGE_PERMISSIONS).find((p) => path.startsWith(p.path));
  return page || null;
}

