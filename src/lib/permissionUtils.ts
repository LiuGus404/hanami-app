import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from './database.types';

export interface PermissionCheck {
  user_email: string;
  resource_type: 'page' | 'feature' | 'data';
  operation: 'view' | 'create' | 'edit' | 'delete';
  resource_id?: string;
}

export interface PermissionResult {
  has_permission: boolean;
  role_name?: string;
  status?: string;
  message?: string;
}

// 權限檢查函數
export async function checkPermission(check: PermissionCheck): Promise<PermissionResult> {
  try {
    const response = await fetch('/api/permissions/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(check),
    });

    if (response.ok) {
      return await response.json();
    } else {
      console.error('權限檢查API錯誤:', response.status);
      return {
        has_permission: false,
        message: '權限檢查失敗',
      };
    }
  } catch (error) {
    console.error('權限檢查錯誤:', error);
    return {
      has_permission: false,
      message: '權限檢查錯誤',
    };
  }
}

// 批量權限檢查
export async function checkMultiplePermissions(checks: PermissionCheck[]): Promise<PermissionResult[]> {
  try {
    const response = await fetch('/api/permissions/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ checks }),
    });

    if (response.ok) {
      return await response.json();
    } else {
      console.error('批量權限檢查API錯誤:', response.status);
      return checks.map(() => ({
        has_permission: false,
        message: '權限檢查失敗',
      }));
    }
  } catch (error) {
    console.error('批量權限檢查錯誤:', error);
    return checks.map(() => ({
      has_permission: false,
      message: '權限檢查錯誤',
    }));
  }
}

// 獲取用戶權限摘要
export async function getUserPermissionSummary(user_email: string) {
  try {
    const response = await fetch(`/api/permissions/summary?user_email=${encodeURIComponent(user_email)}`);
    
    if (response.ok) {
      return await response.json();
    } else {
      console.error('獲取權限摘要失敗:', response.status);
      return null;
    }
  } catch (error) {
    console.error('獲取權限摘要錯誤:', error);
    return null;
  }
}

// 檢查頁面訪問權限
export async function checkPagePermission(user_email: string, page_path: string): Promise<boolean> {
  const result = await checkPermission({
    user_email,
    resource_type: 'page',
    operation: 'view',
    resource_id: page_path,
  });
  return result.has_permission;
}

// 檢查用戶權限（別名函數，向後相容）
export async function checkUserPermission(user_email: string, resource_type: 'page' | 'feature' | 'data', operation: 'view' | 'create' | 'edit' | 'delete', resource_id?: string): Promise<boolean> {
  const result = await checkPermission({
    user_email,
    resource_type,
    operation,
    resource_id,
  });
  return result.has_permission;
}

// 檢查功能訪問權限
export async function checkFeaturePermission(user_email: string, feature_name: string, operation: 'view' | 'create' | 'edit' | 'delete' = 'view'): Promise<boolean> {
  const result = await checkPermission({
    user_email,
    resource_type: 'feature',
    operation,
    resource_id: feature_name,
  });
  
  return result.has_permission;
}

// 檢查資料訪問權限
export async function checkDataPermission(user_email: string, data_type: string, operation: 'view' | 'create' | 'edit' | 'delete' = 'view', resource_id?: string): Promise<boolean> {
  const result = await checkPermission({
    user_email,
    resource_type: 'data',
    operation,
    resource_id: resource_id || data_type,
  });
  
  return result.has_permission;
}

// 權限檢查 Hook (用於 React 組件)
export function usePermissionCheck() {
  const checkPermissionAsync = async (check: PermissionCheck): Promise<PermissionResult> => {
    return await checkPermission(check);
  };

  const checkPagePermissionAsync = async (user_email: string, page_path: string): Promise<boolean> => {
    return await checkPagePermission(user_email, page_path);
  };

  const checkFeaturePermissionAsync = async (user_email: string, feature_name: string, operation?: 'view' | 'create' | 'edit' | 'delete'): Promise<boolean> => {
    return await checkFeaturePermission(user_email, feature_name, operation);
  };

  const checkDataPermissionAsync = async (user_email: string, data_type: string, operation?: 'view' | 'create' | 'edit' | 'delete', resource_id?: string): Promise<boolean> => {
    return await checkDataPermission(user_email, data_type, operation, resource_id);
  };

  return {
    checkPermission: checkPermissionAsync,
    checkPagePermission: checkPagePermissionAsync,
    checkFeaturePermission: checkFeaturePermissionAsync,
    checkDataPermission: checkDataPermissionAsync,
  };
}

// 權限常量
export const PERMISSIONS = {
  // 頁面權限
  PAGES: {
    ADMIN_DASHBOARD: '/admin',
    STUDENT_MANAGEMENT: '/admin/students',
    TEACHER_MANAGEMENT: '/admin/teachers',
    PERMISSION_MANAGEMENT: '/admin/permission-management',
    AI_HUB: '/admin/ai-hub',
    STUDENT_PROGRESS: '/admin/student-progress',
    RESOURCE_LIBRARY: '/admin/resource-library',
    TEACHER_DASHBOARD: '/teacher/dashboard',
    PARENT_DASHBOARD: '/parent/dashboard',
  },
  
  // 功能權限
  FEATURES: {
    USER_MANAGEMENT: 'user_management',
    PERMISSION_MANAGEMENT: 'permission_management',
    STUDENT_MANAGEMENT: 'student_management',
    TEACHER_MANAGEMENT: 'teacher_management',
    COURSE_MANAGEMENT: 'course_management',
    AI_TOOLS: 'ai_tools',
    LESSON_MANAGEMENT: 'lesson_management',
    STUDENT_PROGRESS: 'student_progress',
    MEDIA_MANAGEMENT: 'media_management',
    DATA_EXPORT: 'data_export',
    FINANCIAL_DATA: 'financial_data',
  },
  
  // 資料權限
  DATA: {
    STUDENTS: 'students',
    TEACHERS: 'teachers',
    COURSES: 'courses',
    LESSONS: 'lessons',
    MEDIA: 'media',
    PROGRESS: 'progress',
  },
} as const;

// 權限檢查工具函數
export const PermissionUtils = {
  // 檢查是否為管理員
  isAdmin: (role_name?: string): boolean => {
    return role_name === '管理員' || role_name === 'admin';
  },

  // 檢查是否為教師
  isTeacher: (role_name?: string): boolean => {
    return role_name === '教師' || role_name === 'teacher';
  },

  // 檢查是否為家長
  isParent: (role_name?: string): boolean => {
    return role_name === '家長' || role_name === 'parent';
  },

  // 檢查權限狀態
  isApproved: (status?: string): boolean => {
    return status === 'approved';
  },

  // 檢查是否為系統角色
  isSystemRole: (role_name?: string): boolean => {
    return ['管理員', '教師', '家長', 'admin', 'teacher', 'parent'].includes(role_name || '');
  },
}; 