import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

interface TeacherAccessData {
  success: boolean;
  email: string;
  hasTeacherAccess: boolean;
  employeeData: any;
  message: string;
  mode: string;
  timestamp?: number;
}

export function useDirectTeacherAccess() {
  const [teacherAccess, setTeacherAccess] = useState<TeacherAccessData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 會話存儲鍵
  const SESSION_STORAGE_KEY = 'hanami_teacher_access';

  // 直接使用 supabase 查詢教師權限
  const checkTeacherAccess = useCallback(async (email: string) => {
    if (!email) {
      setError('缺少 email 參數');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('直接 Supabase 查詢教師權限，email:', email);

      // 直接查詢 hanami_employee 表
      const { data: employeeData, error: employeeError } = await supabase
        .from('hanami_employee')
        .select('id, teacher_email, teacher_fullname, teacher_nickname, teacher_role, teacher_status')
        .eq('teacher_email', email)
        .single();

      console.log('Supabase 查詢結果:', { employeeData, employeeError });
      console.log('教師狀態檢查:', { 
        teacher_status: employeeData?.teacher_status, 
        validStatuses: ['active', 'full time', 'part time', 'contract'],
        isValid: employeeData ? ['active', 'full time', 'part time', 'contract'].includes(employeeData.teacher_status) : false
      });

      if (employeeError) {
        if (employeeError.code === 'PGRST116') {
          // 沒有找到記錄
          const noAccessData: TeacherAccessData = {
            success: false,
            email: email,
            hasTeacherAccess: false,
            employeeData: null,
            message: '您不具備花見老師專區訪問權限',
            mode: 'direct_supabase_check'
          };
          setTeacherAccess(noAccessData);
          return noAccessData;
        } else {
          // 其他錯誤
          throw new Error(`資料庫查詢錯誤: ${employeeError.message}`);
        }
      }

      if (!employeeData) {
        const noAccessData: TeacherAccessData = {
          success: false,
          email: email,
          hasTeacherAccess: false,
          employeeData: null,
          message: '您不具備花見老師專區訪問權限',
          mode: 'direct_supabase_check'
        };
        setTeacherAccess(noAccessData);
        return noAccessData;
      }

      // 檢查教師狀態 - 支持多種狀態
      const validStatuses = ['active', 'full time', 'part time', 'contract'];
      if (!validStatuses.includes(employeeData.teacher_status)) {
        const inactiveData: TeacherAccessData = {
          success: false,
          email: email,
          hasTeacherAccess: false,
          employeeData,
          message: '您的教師帳號未啟用',
          mode: 'direct_supabase_check'
        };
        setTeacherAccess(inactiveData);
        return inactiveData;
      }

      // 成功 - 設置權限數據
      const successData: TeacherAccessData = {
        success: true,
        email: email,
        hasTeacherAccess: true,
        employeeData,
        message: '✓ 已驗證花見老師身份',
        mode: 'direct_supabase_check',
        timestamp: Date.now()
      };

      setTeacherAccess(successData);

      // 保存到會話存儲
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(successData));
        console.log('教師權限數據已保存到會話存儲');
      } catch (error) {
        console.error('保存會話存儲失敗:', error);
      }

      // 只在第一次驗證時顯示成功通知
      const notificationShownKey = 'hanami_teacher_access_notification_shown';
      const hasShownNotification = sessionStorage.getItem(notificationShownKey);
      
      if (!hasShownNotification) {
        toast.success(successData.message);
        sessionStorage.setItem(notificationShownKey, 'true');
      }

      // 強制重新渲染以確保狀態更新
      setTimeout(() => {
        setTeacherAccess(successData);
        console.log('強制更新教師權限狀態:', successData);
      }, 100);

      return successData;

    } catch (error: any) {
      console.error('直接 Supabase 檢查教師權限錯誤:', error);
      setError(error.message);
      toast.error('檢查教師權限失敗，請重試');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 從會話存儲恢復狀態
  const restoreFromSession = useCallback((email: string) => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const data: TeacherAccessData = JSON.parse(stored);
        // 檢查是否為同一用戶且數據未過期
        if (data.email === email && data.timestamp) {
          const now = Date.now();
          const sessionTimeout = 8 * 60 * 60 * 1000; // 8小時會話超時
          if (now - data.timestamp < sessionTimeout) {
            console.log('從會話存儲恢復教師權限狀態:', data);
            setTeacherAccess(data);
            return true;
          } else {
            console.log('會話已過期，清除存儲的教師權限狀態');
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
          }
        }
      }
    } catch (error) {
      console.error('恢復教師權限狀態失敗:', error);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
    return false;
  }, []);

  // 清除教師權限狀態
  const clearTeacherAccess = useCallback(() => {
    setTeacherAccess(null);
    setError(null);
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      console.log('已清除教師權限會話存儲');
    } catch (error) {
      console.error('清除教師權限會話存儲失敗:', error);
    }
  }, []);

  return {
    teacherAccess,
    loading,
    error,
    checkTeacherAccess,
    clearTeacherAccess,
    restoreFromSession,
    hasTeacherAccess: teacherAccess?.hasTeacherAccess || false,
    employeeData: teacherAccess?.employeeData,
  };
}
