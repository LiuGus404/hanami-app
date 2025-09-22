import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface EmployeeData {
  id: string;
  teacher_email: string;
  teacher_fullname: string;
  teacher_nickname: string;
  teacher_role: string;
  teacher_status: string;
}

interface SaasUserData {
  id: string;
  email: string;
  name: string;
  role: string;
  subscription_status: string;
}

interface TeacherAccessData {
  success: boolean;
  email: string;
  hasTeacherAccess: boolean;
  employeeData: EmployeeData | null;
  saasUserData: SaasUserData | null;
  message: string;
  timestamp?: number; // 添加時間戳用於會話管理
}

export function useTeacherAccess() {
  const [teacherAccess, setTeacherAccess] = useState<TeacherAccessData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 會話存儲鍵
  const SESSION_STORAGE_KEY = 'hanami_teacher_access';

  // 從 sessionStorage 恢復教師權限狀態
  const restoreFromSession = useCallback((email: string) => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const data: TeacherAccessData = JSON.parse(stored);
        // 檢查是否為同一用戶且數據未過期（會話期間有效）
        if (data.email === email && data.timestamp) {
          const now = Date.now();
          const sessionTimeout = 8 * 60 * 60 * 1000; // 8小時會話超時
          if (now - data.timestamp < sessionTimeout) {
            console.log('從會話存儲恢復教師權限狀態:', data);
            setTeacherAccess(data);
            return true; // 成功恢復
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
    return false; // 未能恢復
  }, []);

  // 保存教師權限狀態到 sessionStorage
  const saveToSession = useCallback((data: TeacherAccessData) => {
    try {
      const dataWithTimestamp = { ...data, timestamp: Date.now() };
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(dataWithTimestamp));
      console.log('教師權限狀態已保存到會話存儲');
    } catch (error) {
      console.error('保存教師權限狀態失敗:', error);
    }
  }, []);

  const checkTeacherAccess = useCallback(async (email: string, forceCheck: boolean = false) => {
    if (!email) {
      setError('缺少 email 參數');
      return;
    }

    // 如果不是強制檢查，首先嘗試從會話存儲恢復狀態
    if (!forceCheck && restoreFromSession(email)) {
      console.log('使用會話存儲的教師權限狀態，跳過 API 調用');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(forceCheck ? '強制檢查教師權限，開始 API 調用' : '會話存儲中沒有找到有效的教師權限狀態，開始 API 檢查');

      let response;
      
      if (forceCheck) {
        // 強制檢查模式，直接調用強制檢查 API
        response = await fetch(`/api/force-check-teacher-access?email=${encodeURIComponent(email)}`);
      } else {
        // 正常模式，首先嘗試完整版本，如果失敗則使用簡化版本
        response = await fetch(`/api/check-teacher-access?email=${encodeURIComponent(email)}`);
        
        if (!response.ok) {
          console.warn('完整版本 API 失敗，嘗試簡化版本');
          response = await fetch(`/api/check-teacher-access-simple?email=${encodeURIComponent(email)}`);
        }
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '檢查教師權限失敗');
      }

      const data: TeacherAccessData = await response.json();
      console.log('API 檢查結果:', data);
      
      // 強制更新狀態
      setTeacherAccess(data);
      console.log('已調用 setTeacherAccess，數據:', data);

      // 保存到會話存儲
      saveToSession(data);
      
      // 強制刷新狀態（確保狀態更新）
      setTimeout(() => {
        console.log('延遲檢查狀態:', { teacherAccess: data, hasTeacherAccess: data.hasTeacherAccess });
        setTeacherAccess(data);
      }, 100);

      // 顯示結果通知（只在第一次檢查時顯示）
      if (data.hasTeacherAccess) {
        toast.success(data.message, {
          duration: 3000,
        });
      } else {
        toast(data.message, {
          icon: 'ℹ️',
          duration: 2000,
        });
      }

    } catch (err: any) {
      console.error('檢查教師權限錯誤:', err);
      setError(err.message);
      toast.error('檢查教師權限時發生錯誤', {
        icon: '❌',
      });
    } finally {
      setLoading(false);
    }
  }, [restoreFromSession, saveToSession]);

  const clearTeacherAccess = useCallback(() => {
    setTeacherAccess(null);
    setError(null);
    // 清除會話存儲
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      console.log('已清除教師權限會話存儲');
    } catch (error) {
      console.error('清除教師權限會話存儲失敗:', error);
    }
  }, [SESSION_STORAGE_KEY]);

  // 強制刷新狀態
  const forceRefreshState = useCallback(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const data: TeacherAccessData = JSON.parse(stored);
        console.log('強制刷新狀態，從會話存儲讀取:', data);
        setTeacherAccess(data);
        return data;
      }
    } catch (error) {
      console.error('強制刷新狀態失敗:', error);
    }
    return null;
  }, [SESSION_STORAGE_KEY]);

  return {
    teacherAccess,
    loading,
    error,
    checkTeacherAccess,
    clearTeacherAccess,
    forceRefreshState,
    hasTeacherAccess: teacherAccess?.hasTeacherAccess || false,
    employeeData: teacherAccess?.employeeData,
    saasUserData: teacherAccess?.saasUserData,
  };
}
