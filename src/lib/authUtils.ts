import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from './database.types';
import { checkPermission, PermissionCheck } from './permissionUtils';

export type UserRole = 'admin' | 'teacher' | 'parent' | 'student';

export interface OrganizationProfile {
  id: string;
  name: string;
  slug: string;
  status?: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  organization: OrganizationProfile;
  relatedIds?: string[]; // 老師的學生ID列表或家長的學生ID列表
}

export interface LoginResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
}

const DEFAULT_ORG_ID =
  process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || 'unassigned-org-placeholder';
const DEFAULT_ORG_SLUG = process.env.NEXT_PUBLIC_DEFAULT_ORG_SLUG || 'unassigned-org';
const DEFAULT_ORG_NAME = process.env.NEXT_PUBLIC_DEFAULT_ORG_NAME || '未設定機構';

const FALLBACK_ORG: OrganizationProfile = {
  id: DEFAULT_ORG_ID,
  name: DEFAULT_ORG_NAME,
  slug: DEFAULT_ORG_SLUG,
};

export const fallbackOrganization: OrganizationProfile = FALLBACK_ORG;

function normalizeUserProfile(raw: any): UserProfile {
  if (!raw) {
    throw new Error('無法正規化空的使用者資料');
  }

  const organization = raw.organization || {};

  return {
    id: raw.id,
    email: raw.email,
    role: raw.role,
    name: raw.name,
    relatedIds: raw.relatedIds || [],
    organization: {
      id: organization.id || FALLBACK_ORG.id,
      name: organization.name || FALLBACK_ORG.name,
      slug: organization.slug || FALLBACK_ORG.slug,
      status: organization.status ?? FALLBACK_ORG.status,
    },
  };
}

async function resolveOrganization(
  supabase: ReturnType<typeof createClientComponentClient<Database>>,
  orgId?: string | null,
  userEmail?: string | null,
): Promise<OrganizationProfile> {
  let targetOrgId = orgId || null;

  if (!targetOrgId && userEmail) {
    const { data: membership, error: membershipError } = await (supabase as any)
      .from('hanami_user_organizations')
      .select('org_id, hanami_organizations ( id, org_name, org_slug, status ), is_primary, created_at')
      .eq('user_email', userEmail)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!membershipError && membership) {
      targetOrgId = membership.org_id || null;

      if (membership.hanami_organizations) {
        const org = membership.hanami_organizations;
        return {
          id: org.id,
          name: org.org_name,
          slug: org.org_slug,
          status: org.status,
        };
      }
    }
  }

  const finalOrgId = targetOrgId || DEFAULT_ORG_ID;

  if (!finalOrgId || finalOrgId === 'default-org') {
    return FALLBACK_ORG;
  }

  const { data, error } = await supabase
    .from('hanami_organizations')
    .select('id, org_name, org_slug, status')
    .eq('id', finalOrgId)
    .maybeSingle();

  if (error) {
    console.warn('resolveOrganization: 無法取得組織資料，改用預設值', error);
    return FALLBACK_ORG;
  }

  if (!data) {
    return FALLBACK_ORG;
  }

  const typedData = data as { id: string; org_name: string; org_slug: string; status: string; [key: string]: any };

  return {
    id: typedData.id,
    name: typedData.org_name,
    slug: typedData.org_slug,
    status: typedData.status,
  };
}

// 新的函數：驗證用戶憑證並返回用戶資料
export async function validateUserCredentials(email: string, password: string): Promise<LoginResult> {
  const supabase = createClientComponentClient<Database>();
  
  try {
    // 首先檢查 hanami_user_permissions_v2 表（新權限系統）
    const { data: permissionData, error: permissionError } = await supabase
      .from('hanami_user_permissions_v2')
      .select('id, user_email, user_phone, role_id, status, is_active')
      .eq('user_email', email)
      .eq('status', 'approved')
      .eq('is_active', true)
      .single();

    if (permissionData && !permissionError) {
      const typedPermissionData = permissionData as { role_id: string; [key: string]: any };
      // 根據 role_id 查詢角色名稱
      const { data: roleData, error: roleError } = await supabase
        .from('hanami_roles')
        .select('role_name')
        .eq('id', typedPermissionData.role_id)
        .single();

      const typedRoleData = roleData as { role_name?: string; [key: string]: any } | null;
      const roleName = typedRoleData?.role_name;
      
      if (roleName === 'admin') {
        // 檢查管理員表
        const { data: adminData, error: adminError } = await supabase
          .from('hanami_admin')
          .select('id, admin_name, admin_email, org_id')
          .eq('admin_email', email)
          .single();

        if (adminData && !adminError) {
          const typedAdminData = adminData as { id: string; org_id: string | null; admin_email: string | null; admin_name: string | null; [key: string]: any };
          // 這裡可以添加密碼驗證邏輯
          // 暫時跳過密碼檢查，直接返回成功
          const organization = await resolveOrganization(supabase, typedAdminData.org_id, typedAdminData.admin_email || email);

          return {
            success: true,
            user: {
              id: typedAdminData.id,
              email: typedAdminData.admin_email || email,
              role: 'admin',
              name: typedAdminData.admin_name || '管理員',
              organization,
            },
          };
        }
      } else if (roleName === 'teacher') {
        // 檢查教師表
        const { data: teacherData, error: teacherError } = await supabase
          .from('hanami_employee')
          .select('id, teacher_fullname, teacher_email, teacher_password, teacher_nickname, org_id')
          .eq('teacher_email', email)
          .eq('teacher_password', password)
          .single();

        if (teacherData && !teacherError) {
          const typedTeacherData = teacherData as { id: string; org_id: string | null; teacher_email: string | null; teacher_fullname: string | null; teacher_nickname: string | null; [key: string]: any };
          // 獲取老師負責的學生ID列表
          const { data: students } = await supabase
            .from('Hanami_Students')
            .select('id')
            .eq('student_teacher', typedTeacherData.id);

          const typedStudents = (students || []) as Array<{ id: string }>;
          const organization = await resolveOrganization(supabase, typedTeacherData.org_id, typedTeacherData.teacher_email || email);

          return {
            success: true,
            user: {
              id: typedTeacherData.id,
              email: typedTeacherData.teacher_email || email,
              role: 'teacher',
              name: typedTeacherData.teacher_nickname || typedTeacherData.teacher_fullname || '老師',
              organization,
              relatedIds: typedStudents.map(s => s.id),
            },
          };
        }
      } else if (roleName === 'parent') {
        // 檢查家長表（新的家長帳戶系統）
        const { data: parentData, error: parentError } = await supabase
          .from('hanami_parents')
          .select('id, parent_name, parent_email, parent_password, parent_status, org_id')
          .eq('parent_email', email)
          .eq('parent_password', password)
          .eq('parent_status', 'active')
          .single();

        if (parentData && !parentError) {
          const typedParentData = parentData as { id: string; org_id: string | null; parent_email: string | null; parent_name: string | null; [key: string]: any };
          // 獲取家長連結的學生ID列表
          const { data: linkedStudents } = await supabase
            .from('hanami_parent_student_links')
            .select('student_id')
            .eq('parent_id', typedParentData.id);

          const typedLinkedStudents = (linkedStudents || []) as Array<{ student_id: string }>;
          const organization = await resolveOrganization(supabase, typedParentData.org_id, typedParentData.parent_email || email);

          return {
            success: true,
            user: {
              id: typedParentData.id,
              email: typedParentData.parent_email || email,
              role: 'parent',
              name: typedParentData.parent_name || '家長',
              organization,
              relatedIds: typedLinkedStudents.map(s => s.student_id),
            },
          };
        }
      }
    }

    // 如果新權限系統沒有找到，回退到舊的驗證方式
    // 檢查管理員
    const { data: adminData, error: adminError } = await supabase
      .from('hanami_admin')
      .select('id, admin_name, admin_email, admin_password, org_id')
      .eq('admin_email', email)
      .eq('admin_password', password)
      .single();

    if (adminData && !adminError && typeof adminData === 'object' && 'id' in adminData) {
      const admin = adminData as { id: string; admin_email?: string; admin_name?: string; org_id?: string };
      const organization = await resolveOrganization(supabase, admin.org_id, admin.admin_email || email);

      return {
        success: true,
        user: {
          id: admin.id,
          email: admin.admin_email || email,
          role: 'admin',
          name: admin.admin_name || '管理員',
          organization,
        },
      };
    }

    // 檢查老師
    const { data: teacherData, error: teacherError } = await supabase
      .from('hanami_employee')
      .select('id, teacher_fullname, teacher_email, teacher_password, teacher_nickname, org_id')
      .eq('teacher_email', email)
      .eq('teacher_password', password)
      .single();

    if (teacherData && !teacherError) {
      const typedTeacherData = teacherData as { id: string; org_id: string | null; teacher_email: string | null; teacher_fullname: string | null; teacher_nickname: string | null; [key: string]: any };
      // 獲取老師負責的學生ID列表
      const { data: students } = await supabase
        .from('Hanami_Students')
        .select('id')
        .eq('student_teacher', typedTeacherData.id);

      const typedStudents = (students || []) as Array<{ id: string }>;
      const organization = await resolveOrganization(supabase, typedTeacherData.org_id, typedTeacherData.teacher_email || email);

      return {
        success: true,
        user: {
          id: typedTeacherData.id,
          email: typedTeacherData.teacher_email || email,
          role: 'teacher',
          name: typedTeacherData.teacher_nickname || typedTeacherData.teacher_fullname || '老師',
          organization,
          relatedIds: typedStudents.map(s => s.id),
        },
      };
    }

    // 檢查學生/家長 (通過學生資料的 student_email 和 student_password)
    const { data: studentData, error: studentError } = await supabase
      .from('Hanami_Students')
      .select('id, full_name, student_email, student_password, parent_email, org_id')
      .eq('student_email', email)
      .eq('student_password', password)
      .single();

    if (studentData && !studentError) {
      const typedStudentData = studentData as { id: string; org_id: string | null; student_email: string | null; parent_email: string | null; full_name: string | null; [key: string]: any };
      const organization = await resolveOrganization(supabase, typedStudentData.org_id, typedStudentData.student_email || typedStudentData.parent_email || email);

      return {
        success: true,
        user: {
          id: typedStudentData.id,
          email: typedStudentData.student_email || email,
          role: 'parent',
          name: `${typedStudentData.full_name || '學生'}的家長`,
          organization,
          relatedIds: [typedStudentData.id],
        },
      };
    }

    // 檢查家長 (通過學生資料的 parent_email 和 student_password)
    const { data: parentData, error: parentError } = await supabase
      .from('Hanami_Students')
      .select('id, full_name, parent_email, student_password, org_id')
      .eq('parent_email', email)
      .eq('student_password', password)
      .single();

    if (parentData && !parentError) {
      const typedParentData = parentData as { id: string; org_id: string | null; parent_email: string | null; full_name: string | null; [key: string]: any };
      const organization = await resolveOrganization(supabase, typedParentData.org_id, typedParentData.parent_email || email);

      return {
        success: true,
        user: {
          id: typedParentData.id,
          email: typedParentData.parent_email || email,
          role: 'parent',
          name: `${typedParentData.full_name || '學生'}的家長`,
          organization,
          relatedIds: [typedParentData.id],
        },
      };
    }

    // 如果所有檢查都失敗，提供更具體的錯誤訊息
    // 先檢查郵箱是否存在
    const emailExists = await checkEmailExistsInAllTables(supabase, email);
    
    if (!emailExists) {
      return {
        success: false,
        error: '此電子郵件地址尚未註冊。請確認您輸入的郵箱是否正確，或前往註冊頁面創建新帳號。',
      };
    } else {
      return {
        success: false,
        error: '密碼錯誤。請確認您輸入的密碼是否正確，注意大小寫。如果忘記密碼，請使用忘記密碼功能。',
      };
    }

  } catch (error) {
    console.error('Error validating credentials:', error);
    // 提供更具體的錯誤訊息
    let errorMessage = '登入驗證失敗';
    if (error instanceof Error) {
      if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = '網路連線錯誤，請檢查您的網路連線後重試';
      } else if (error.message.includes('timeout')) {
        errorMessage = '連線逾時，請稍後再試';
      } else {
        errorMessage = `登入驗證失敗：${error.message}`;
      }
    }
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// 檢查郵箱是否在所有表中存在的輔助函數
async function checkEmailExistsInAllTables(supabase: any, email: string): Promise<boolean> {
  try {
    // 1. 檢查新權限系統
    const { data: permissionData } = await supabase
      .from('hanami_user_permissions_v2')
      .select('id')
      .eq('user_email', email)
      .limit(1);

    if (permissionData && permissionData.length > 0) {
      return true;
    }

    // 2. 檢查管理員表
    const { data: adminData } = await supabase
      .from('hanami_admin')
      .select('id')
      .eq('admin_email', email)
      .limit(1);

    if (adminData && adminData.length > 0) {
      return true;
    }

    // 3. 檢查教師表
    const { data: teacherData } = await supabase
      .from('hanami_employee')
      .select('id')
      .eq('teacher_email', email)
      .limit(1);

    if (teacherData && teacherData.length > 0) {
      return true;
    }

    // 4. 檢查家長表
    const { data: parentData } = await supabase
      .from('hanami_parents')
      .select('id')
      .eq('parent_email', email)
      .limit(1);

    if (parentData && parentData.length > 0) {
      return true;
    }

    // 5. 檢查學生表（通過student_email）
    const { data: studentData } = await supabase
      .from('Hanami_Students')
      .select('id')
      .eq('student_email', email)
      .limit(1);

    if (studentData && studentData.length > 0) {
      return true;
    }

    // 6. 檢查學生表（通過parent_email）
    const { data: parentStudentData } = await supabase
      .from('Hanami_Students')
      .select('id')
      .eq('parent_email', email)
      .limit(1);

    if (parentStudentData && parentStudentData.length > 0) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('檢查郵箱存在性時發生錯誤:', error);
    // 如果檢查失敗，返回 false 以顯示郵箱未註冊的錯誤
    return false;
  }
}

export async function getUserRole(): Promise<UserRole | null> {
  const supabase = createClientComponentClient<Database>();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return null;

    // 檢查是否為管理員
    const { data: adminData } = await supabase
      .from('hanami_admin')
      .select('id')
      .eq('admin_email', user.email)
      .single();

    if (adminData) return 'admin';

    // 檢查是否為老師
    const { data: teacherData } = await supabase
      .from('hanami_employee')
      .select('id, teacher_email')
      .eq('teacher_email', user.email)
      .single();

    if (teacherData) return 'teacher';

    // 檢查是否為家長 (通過學生資料的 parent_email)
    const { data: parentData } = await supabase
      .from('Hanami_Students')
      .select('id, parent_email')
      .eq('parent_email', user.email)
      .single();

    if (parentData) return 'parent';

    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = createClientComponentClient<Database>();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return null;

    const role = await getUserRole();
    if (!role) return null;

    switch (role) {
      case 'admin': {
        const { data: adminData } = await supabase
          .from('hanami_admin')
          .select('id, admin_name, admin_email, org_id')
          .eq('admin_email', user.email)
          .single();
        
        if (adminData) {
          const typedAdminData = adminData as { id: string; org_id: string | null; admin_email: string | null; admin_name: string | null; [key: string]: any };
          const organization = await resolveOrganization(supabase, typedAdminData.org_id, typedAdminData.admin_email || user.email);

          return {
            id: typedAdminData.id,
            email: typedAdminData.admin_email || user.email,
            role: 'admin',
            name: typedAdminData.admin_name || '管理員',
            organization,
          };
        }
        break;
      }

      case 'teacher': {
        const { data: teacherData } = await supabase
          .from('hanami_employee')
          .select('id, teacher_fullname, teacher_email, teacher_nickname, org_id')
          .eq('teacher_email', user.email)
          .single();
        
        if (teacherData) {
          const typedTeacherData = teacherData as { id: string; org_id: string | null; teacher_email: string | null; teacher_fullname: string | null; teacher_nickname: string | null; [key: string]: any };
          // 取得老師負責的學生ID列表
          const { data: students } = await supabase
            .from('Hanami_Students')
            .select('id')
            .eq('student_teacher', typedTeacherData.id);

          const typedStudents = (students || []) as Array<{ id: string }>;
          const organization = await resolveOrganization(supabase, typedTeacherData.org_id, typedTeacherData.teacher_email || user.email);

          return {
            id: typedTeacherData.id,
            email: typedTeacherData.teacher_email || user.email,
            role: 'teacher',
            name: typedTeacherData.teacher_nickname || typedTeacherData.teacher_fullname || '老師',
            organization,
            relatedIds: typedStudents.map(s => s.id),
          };
        }
        break;
      }

      case 'parent': {
        // 取得家長資料（新的家長帳戶系統）
        const { data: parentData } = await supabase
          .from('hanami_parents')
          .select('id, parent_name, parent_email, org_id')
          .eq('parent_email', user.email)
          .single();

        if (parentData) {
          const typedParentData = parentData as { id: string; org_id: string | null; parent_email: string | null; parent_name: string | null; [key: string]: any };
          // 取得家長連結的學生ID列表
          const { data: linkedStudents } = await supabase
            .from('hanami_parent_student_links')
            .select('student_id')
            .eq('parent_id', typedParentData.id);

          const typedLinkedStudents = (linkedStudents || []) as Array<{ student_id: string }>;
          const organization = await resolveOrganization(supabase, typedParentData.org_id, typedParentData.parent_email || user.email);

          return {
            id: typedParentData.id,
            email: typedParentData.parent_email || user.email,
            role: 'parent',
            name: typedParentData.parent_name || '家長',
            organization,
            relatedIds: typedLinkedStudents.map(s => s.student_id),
          };
        }
        break;
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'teacher':
      return '/teacher/dashboard';
    case 'parent':
      return '/parent/dashboard';
    default:
      return '/';
  }
}

export function getLoginPath(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin/login';
    case 'teacher':
      return '/teacher/login';
    case 'parent':
      return '/parent/login';
    default:
      return '/';
  }
}

// 會話管理函數
export function setUserSession(user: UserProfile) {
  if (typeof window !== 'undefined') {
    const normalizedUser = normalizeUserProfile(user);
    const sessionData = {
      user: normalizedUser,
      timestamp: Date.now(),
    };
    
    // 設置 localStorage
    localStorage.setItem('hanami_user_session', JSON.stringify(sessionData));
    
    // 設置 cookie（供 middleware 使用）
    const cookieValue = encodeURIComponent(JSON.stringify(sessionData));
    document.cookie = `hanami_user_session=${cookieValue}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`;

    window.dispatchEvent(new Event('hanami-user-session-changed'));
  }
}

export function getUserSession(): UserProfile | null {
  if (typeof window !== 'undefined') {
    // 優先檢查 localStorage
    const session = localStorage.getItem('hanami_user_session');
    if (session) {
      try {
        const data = JSON.parse(session);
        // 檢查會話是否過期 (24小時)
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          return normalizeUserProfile(data.user);
        } else {
          // 會話過期，清除
          localStorage.removeItem('hanami_user_session');
          document.cookie = 'hanami_user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
      } catch (error) {
        console.error('Error parsing user session:', error);
        localStorage.removeItem('hanami_user_session');
        document.cookie = 'hanami_user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    }
    
    // 如果 localStorage 沒有，檢查 cookie
    const cookies = document.cookie.split(';');
    const sessionCookie = cookies.find(cookie => cookie.trim().startsWith('hanami_user_session='));
    if (sessionCookie) {
      try {
        const cookieValue = sessionCookie.split('=')[1];
        const data = JSON.parse(decodeURIComponent(cookieValue));
        // 檢查會話是否過期 (24小時)
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          // 同步到 localStorage
          localStorage.setItem('hanami_user_session', JSON.stringify(data));
          return normalizeUserProfile(data.user);
        } else {
          // 會話過期，清除
          document.cookie = 'hanami_user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
      } catch (error) {
        console.error('Error parsing cookie session:', error);
        document.cookie = 'hanami_user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    }
  }
  return null;
}

export function clearUserSession() {
  if (typeof window !== 'undefined') {
    console.log('開始清除用戶會話');
    
    // 清除 localStorage
    localStorage.removeItem('hanami_user_session');
    console.log('已清除 localStorage 中的會話數據');
    
    // 清除所有相關的 cookie
    document.cookie = 'hanami_user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'hanami_user_session=; path=/admin; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    console.log('已清除 cookie 中的會話數據');
    
    // 清除其他可能的會話相關數據
    localStorage.removeItem('hanami_admin_session');
    localStorage.removeItem('hanami_teacher_session');
    localStorage.removeItem('hanami_parent_session');
    console.log('已清除其他會話相關數據');
    
    console.log('用戶會話清除完成');

    window.dispatchEvent(new Event('hanami-user-session-changed'));
  }
}

export function isUserLoggedIn(): boolean {
  return getUserSession() !== null;
}

// 新的權限檢查函數
export async function checkUserPermission(
  user_email: string,
  resource_type: 'page' | 'feature' | 'data',
  operation: 'view' | 'create' | 'edit' | 'delete',
  resource_id?: string
): Promise<boolean> {
  try {
    const check: PermissionCheck = {
      user_email,
      resource_type,
      operation,
      resource_id,
    };

    const result = await checkPermission(check);
    return result.has_permission;
  } catch (error) {
    console.error('權限檢查錯誤:', error);
    return false;
  }
}

// 檢查頁面權限
export async function checkPagePermission(user_email: string, page_path: string): Promise<boolean> {
  return checkUserPermission(user_email, 'page', 'view', page_path);
}

// 檢查功能權限
export async function checkFeaturePermission(
  user_email: string, 
  feature_name: string, 
  operation: 'view' | 'create' | 'edit' | 'delete' = 'view'
): Promise<boolean> {
  return checkUserPermission(user_email, 'feature', operation, feature_name);
}

// 檢查資料權限
export async function checkDataPermission(
  user_email: string, 
  data_type: string, 
  operation: 'view' | 'create' | 'edit' | 'delete' = 'view',
  resource_id?: string
): Promise<boolean> {
  return checkUserPermission(user_email, 'data', operation, resource_id || data_type);
} 