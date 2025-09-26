export type UserRole = 'admin' | 'teacher' | 'parent' | 'student';

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  fullName: string;
  phone: string;
  additionalInfo?: Record<string, any>;
  // 教師專用欄位
  teacherBackground?: string;
  teacherBankId?: string;
  teacherAddress?: string;
  teacherDob?: string;
  // 家長專用欄位
  parentStudentName?: string;
  parentStudentDob?: string;
  // 人機驗證
  captchaAnswer?: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

// 註冊申請狀態
export type RegistrationStatus = 'pending' | 'approved' | 'rejected';

// 註冊申請介面
export interface RegistrationRequest {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: UserRole;
  status: RegistrationStatus;
  additional_info?: Record<string, any>;
  created_at: string;
  updated_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
}

// 權限管理介面
export interface PermissionManagement {
  id: string;
  user_id: string;
  role: UserRole;
  permissions: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
} 