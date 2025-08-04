import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getUserSession } from '@/lib/authUtils';

interface TeacherPermissions {
  canViewDashboard: boolean;
  canViewProfile: boolean;
  canViewGrowthTree: boolean;
  canViewAbilityDevelopment: boolean;
  canViewTeachingActivities: boolean;
  canViewAbilityAssessment: boolean;
  loading: boolean;
}

export function useTeacherPermissions(): TeacherPermissions {
  const [permissions, setPermissions] = useState<TeacherPermissions>({
    canViewDashboard: true, // 預設顯示
    canViewProfile: true, // 預設顯示
    canViewGrowthTree: true, // 預設顯示
    canViewAbilityDevelopment: true, // 預設顯示
    canViewTeachingActivities: true, // 預設顯示
    canViewAbilityAssessment: true, // 預設顯示
    loading: true,
  });

  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const userSession = getUserSession();
        if (!userSession || userSession.role !== 'teacher') {
          console.log('用戶會話無效或非教師角色');
          setPermissions(prev => ({ ...prev, loading: false }));
          return;
        }

        console.log('開始檢查教師權限，用戶:', userSession.email);

        // 簡化的權限檢查 - 直接檢查是否有教師權限記錄
        const { data: permissionData, error: permissionError } = await supabase
          .from('hanami_user_permissions_v2')
          .select('id, user_email, role_id, status, is_active')
          .eq('user_email', userSession.email)
          .eq('status', 'approved')
          .eq('is_active', true)
          .single();

        console.log('權限檢查結果:', { permissionData, permissionError });

        if (permissionData && !permissionError) {
          // 有權限記錄，檢查角色
          const { data: roleData, error: roleError } = await supabase
            .from('hanami_roles')
            .select('role_name, display_name')
            .eq('id', permissionData.role_id)
            .single();

          console.log('角色檢查結果:', { roleData, roleError });

          if (roleData && !roleError) {
            // 如果是教師角色，給予所有權限
            if (roleData.role_name === 'teacher' || roleData.role_name === '教師') {
              setPermissions({
                canViewDashboard: true,
                canViewProfile: true,
                canViewGrowthTree: true,
                canViewAbilityDevelopment: true,
                canViewTeachingActivities: true,
                canViewAbilityAssessment: true,
                loading: false,
              });
              return;
            }
          }
        }

        // 如果沒有權限記錄或角色不匹配，使用預設值
        console.log('使用預設權限');
        setPermissions({
          canViewDashboard: true,
          canViewProfile: true,
          canViewGrowthTree: true,
          canViewAbilityDevelopment: true,
          canViewTeachingActivities: true,
          canViewAbilityAssessment: true,
          loading: false,
        });

      } catch (error) {
        console.error('權限檢查錯誤:', error);
        // 發生錯誤時使用預設權限
        setPermissions({
          canViewDashboard: true,
          canViewProfile: true,
          canViewGrowthTree: true,
          canViewAbilityDevelopment: true,
          canViewTeachingActivities: true,
          canViewAbilityAssessment: true,
          loading: false,
        });
      }
    };

    // 延遲檢查權限，避免阻塞頁面載入
    const timer = setTimeout(() => {
      checkPermissions();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return permissions;
} 