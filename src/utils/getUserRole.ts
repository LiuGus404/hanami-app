'use client';

import { SupabaseClient } from '@supabase/supabase-js';

import { Database } from '@/lib/database.types';

export async function getUserRole(supabase: SupabaseClient<Database>): Promise<string | null> {
  console.log('[getUserRole] 開始檢查用戶角色');

  try {
    // 獲取當前 session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[getUserRole] Session 錯誤：', sessionError);
      return null;
    }

    if (!session) {
      console.warn('[getUserRole] 沒有有效的 session');
      return null;
    }

    const user = session.user;
    const userEmail = user.email;

    if (!userEmail) {
      console.warn('[getUserRole] 用戶沒有 email');
      return null;
    }

    console.log('[getUserRole] 使用者 email:', userEmail);

    // 檢查 user_metadata 中的角色
    const role = user.user_metadata?.role;
    if (role) {
      console.log('[getUserRole] 從 user_metadata 找到角色：', role);
      return role;
    }

    // 檢查 hanami_admin 表
    const { data: adminData, error: adminError } = await supabase
      .from('hanami_admin')
      .select('admin_email')
      .eq('admin_email', userEmail)
      .single();

    if (adminError) {
      console.error('[getUserRole] 查詢 hanami_admin 錯誤：', adminError);
    } else if (adminData) {
      console.log('[getUserRole] 找到管理員身份');
      return 'admin';
    }

    // 檢查 hanami_employee 表
    const { data: employeeData, error: employeeError } = await supabase
      .from('hanami_employee')
      .select('teacher_email')
      .eq('teacher_email', userEmail)
      .single();

    if (employeeError) {
      console.error('[getUserRole] 查詢 hanami_employee 錯誤：', employeeError);
    } else if (employeeData) {
      console.log('[getUserRole] 找到教師身份');
      return 'teacher';
    }

    // 檢查 Hanami_Students 表
    const { data: studentData, error: studentError } = await supabase
      .from('Hanami_Students')
      .select('parent_email')
      .eq('parent_email', userEmail)
      .single();

    if (studentError) {
      console.error('[getUserRole] 查詢 Hanami_Students 錯誤：', studentError);
    } else if (studentData) {
      console.log('[getUserRole] 找到家長身份');
      return 'parent';
    }

    console.warn('[getUserRole] 未找到任何匹配的角色');
    return null;
  } catch (error) {
    console.error('[getUserRole] 發生錯誤：', error);
    return null;
  }
}