export type UserRole = 'admin' | 'teacher' | 'parent';

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  fullName: string;
  phone?: string;
}

export interface AuthError {
  message: string;
  code?: string;
} 