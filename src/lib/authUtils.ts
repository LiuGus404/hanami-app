import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from './database.types';

export type UserRole = 'admin' | 'teacher' | 'parent';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  relatedIds?: string[]; // 老師的學生ID列表或家長的學生ID列表
}

export interface LoginResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
}

// 新的函數：驗證用戶憑證並返回用戶資料
export async function validateUserCredentials(email: string, password: string): Promise<LoginResult> {
  const supabase = createClientComponentClient<Database>();
  
  try {
    // 檢查管理員
    const { data: adminData, error: adminError } = await supabase
      .from('hanami_admin')
      .select('id, admin_name, admin_email, admin_password')
      .eq('admin_email', email)
      .eq('admin_password', password)
      .single();

    if (adminData && !adminError) {
      return {
        success: true,
        user: {
          id: adminData.id,
          email: adminData.admin_email || email,
          role: 'admin',
          name: adminData.admin_name || '管理員'
        }
      };
    }

    // 檢查老師
    const { data: teacherData, error: teacherError } = await supabase
      .from('hanami_employee')
      .select('id, teacher_fullname, teacher_email, teacher_password, teacher_nickname')
      .eq('teacher_email', email)
      .eq('teacher_password', password)
      .single();

    if (teacherData && !teacherError) {
      // 獲取老師負責的學生ID列表
      const { data: students } = await supabase
        .from('Hanami_Students')
        .select('id')
        .eq('student_teacher', teacherData.id);

      return {
        success: true,
        user: {
          id: teacherData.id,
          email: teacherData.teacher_email || email,
          role: 'teacher',
          name: teacherData.teacher_nickname || teacherData.teacher_fullname || '老師',
          relatedIds: students?.map(s => s.id) || []
        }
      };
    }

    // 檢查學生/家長 (通過學生資料的 student_email 和 student_password)
    const { data: studentData, error: studentError } = await supabase
      .from('Hanami_Students')
      .select('id, full_name, student_email, student_password, parent_email')
      .eq('student_email', email)
      .eq('student_password', password)
      .single();

    if (studentData && !studentError) {
      return {
        success: true,
        user: {
          id: studentData.id,
          email: studentData.student_email || email,
          role: 'parent',
          name: `${studentData.full_name}的家長`,
          relatedIds: [studentData.id]
        }
      };
    }

    // 檢查家長 (通過學生資料的 parent_email)
    const { data: parentData, error: parentError } = await supabase
      .from('Hanami_Students')
      .select('id, full_name, parent_email')
      .eq('parent_email', email)
      .single();

    if (parentData && !parentError) {
      // 注意：這裡家長沒有密碼驗證，可能需要額外的驗證邏輯
      // 暫時返回成功，但建議添加家長密碼欄位
      return {
        success: true,
        user: {
          id: parentData.id,
          email: parentData.parent_email || email,
          role: 'parent',
          name: `${parentData.full_name}的家長`,
          relatedIds: [parentData.id]
        }
      };
    }

    return {
      success: false,
      error: '帳號或密碼錯誤'
    };

  } catch (error) {
    console.error('Error validating credentials:', error);
    return {
      success: false,
      error: '登入驗證失敗'
    };
  }
}

export async function getUserRole(): Promise<UserRole | null> {
  const supabase = createClientComponentClient<Database>();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) return null;

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
    if (!user) return null;

    const role = await getUserRole();
    if (!role) return null;

    switch (role) {
      case 'admin':
        const { data: adminData } = await supabase
          .from('hanami_admin')
          .select('id, admin_name, admin_email')
          .eq('admin_email', user.email)
          .single();
        
        if (adminData) {
          return {
            id: adminData.id,
            email: adminData.admin_email || user.email,
            role: 'admin',
            name: adminData.admin_name || '管理員'
          };
        }
        break;

      case 'teacher':
        const { data: teacherData } = await supabase
          .from('hanami_employee')
          .select('id, teacher_fullname, teacher_email, teacher_nickname')
          .eq('teacher_email', user.email)
          .single();
        
        if (teacherData) {
          // 獲取老師負責的學生ID列表
          const { data: students } = await supabase
            .from('Hanami_Students')
            .select('id')
            .eq('student_teacher', teacherData.id);

          return {
            id: teacherData.id,
            email: teacherData.teacher_email || user.email,
            role: 'teacher',
            name: teacherData.teacher_nickname || teacherData.teacher_fullname || '老師',
            relatedIds: students?.map(s => s.id) || []
          };
        }
        break;

      case 'parent':
        // 獲取家長相關的學生資料
        const { data: students } = await supabase
          .from('Hanami_Students')
          .select('id, full_name, parent_email')
          .eq('parent_email', user.email);

        if (students && students.length > 0) {
          return {
            id: user.id,
            email: user.email,
            role: 'parent',
            name: `${students[0].full_name}的家長`,
            relatedIds: students.map(s => s.id)
          };
        }
        break;
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
    const sessionData = {
      user,
      timestamp: Date.now()
    };
    
    // 設置 localStorage
    localStorage.setItem('hanami_user_session', JSON.stringify(sessionData));
    
    // 設置 cookie（供 middleware 使用）
    const cookieValue = encodeURIComponent(JSON.stringify(sessionData));
    document.cookie = `hanami_user_session=${cookieValue}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`;
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
          return data.user;
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
          return data.user;
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
    localStorage.removeItem('hanami_user_session');
    document.cookie = 'hanami_user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
}

export function isUserLoggedIn(): boolean {
  return getUserSession() !== null;
} 