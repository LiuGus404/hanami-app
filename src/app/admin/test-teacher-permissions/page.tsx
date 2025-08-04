'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { getUserSession } from '@/lib/authUtils';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';

export default function TestTeacherPermissionsPage() {
  const [userSession, setUserSession] = useState<any>(null);
  const [permissionData, setPermissionData] = useState<any>(null);
  const [roleData, setRoleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      setLoading(true);
      setError(null);

      // 獲取用戶會話
      const session = getUserSession();
      setUserSession(session);

      if (!session) {
        setError('沒有用戶會話');
        return;
      }

      console.log('用戶會話:', session);

      // 檢查權限記錄
      const { data: permissionData, error: permissionError } = await supabase
        .from('hanami_user_permissions_v2')
        .select(`
          id, user_email, role_id, status, is_active,
          hanami_roles (
            role_name, display_name, permissions
          )
        `)
        .eq('user_email', session.email)
        .eq('status', 'approved')
        .eq('is_active', true)
        .single();

      console.log('權限查詢結果:', { permissionData, permissionError });

      if (permissionError) {
        console.error('權限查詢錯誤:', permissionError);
        setError(`權限查詢錯誤: ${permissionError.message}`);
      } else {
        setPermissionData(permissionData);
        
        if (permissionData?.hanami_roles) {
          setRoleData(permissionData.hanami_roles);
        }
      }

      // 檢查角色表
      const { data: rolesData, error: rolesError } = await supabase
        .from('hanami_roles')
        .select('*')
        .eq('is_active', true);

      console.log('角色查詢結果:', { rolesData, rolesError });

    } catch (err) {
      console.error('檢查權限時發生錯誤:', err);
      setError(`檢查權限時發生錯誤: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const createTeacherRole = async () => {
    try {
      const teacherPermissions = {
        pages: {
          '/teacher/*': { access: 'allow', operations: ['view', 'create', 'edit'] },
          '/teacher/dashboard': { access: 'allow', operations: ['view'] },
          '/teacher/profile': { access: 'allow', operations: ['view', 'edit'] }
        },
        features: {
          'lesson_management': { access: 'allow', operations: ['view', 'create', 'edit'] },
          'student_progress': { access: 'allow', operations: ['view', 'edit'] },
          'media_management': { access: 'allow', operations: ['view', 'create', 'edit'] },
          'growth_tree_management': { access: 'allow', operations: ['view', 'create', 'edit'] },
          'ability_development': { access: 'allow', operations: ['view', 'create', 'edit'] },
          'teaching_activities': { access: 'allow', operations: ['view', 'create', 'edit'] },
          'ability_assessment': { access: 'allow', operations: ['view', 'create', 'edit'] },
          'schedule_management': { access: 'allow', operations: ['view', 'edit'] }
        }
      };

      const { data, error } = await supabase
        .from('hanami_roles')
        .upsert({
          role_name: 'teacher',
          display_name: '教師',
          description: '教師角色，擁有教學相關權限',
          is_system_role: true,
          permissions: teacherPermissions,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      console.log('教師角色創建/更新成功:', data);
      alert('教師角色創建/更新成功');
      checkPermissions();
    } catch (err) {
      console.error('創建教師角色失敗:', err);
      alert(`創建教師角色失敗: ${err}`);
    }
  };

  const createTeacherPermission = async () => {
    if (!userSession) {
      alert('請先登入');
      return;
    }

    try {
      // 獲取教師角色ID
      const { data: roleData, error: roleError } = await supabase
        .from('hanami_roles')
        .select('id')
        .eq('role_name', 'teacher')
        .single();

      if (roleError) throw roleError;

      const { data, error } = await supabase
        .from('hanami_user_permissions_v2')
        .upsert({
          user_email: userSession.email,
          user_phone: userSession.phone || '',
          role_id: roleData.id,
          status: 'approved',
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      console.log('教師權限創建/更新成功:', data);
      alert('教師權限創建/更新成功');
      checkPermissions();
    } catch (err) {
      console.error('創建教師權限失敗:', err);
      alert(`創建教師權限失敗: ${err}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF9F2] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-[#FFD59A] border-t-[#A64B2A] rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F2] p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#4B4036] mb-6">教師權限測試頁面</h1>

        {error && (
          <HanamiCard className="p-6 mb-6 bg-red-50 border-red-200">
            <h3 className="text-lg font-bold text-red-700 mb-2">錯誤</h3>
            <p className="text-red-600">{error}</p>
          </HanamiCard>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 用戶會話資訊 */}
          <HanamiCard className="p-6">
            <h3 className="text-lg font-bold text-[#4B4036] mb-4">用戶會話資訊</h3>
            {userSession ? (
              <div className="space-y-2">
                <div><strong>ID:</strong> {userSession.id}</div>
                <div><strong>Email:</strong> {userSession.email}</div>
                <div><strong>Role:</strong> {userSession.role}</div>
                <div><strong>Name:</strong> {userSession.name}</div>
              </div>
            ) : (
              <p className="text-[#8B7355]">沒有用戶會話</p>
            )}
          </HanamiCard>

          {/* 權限記錄資訊 */}
          <HanamiCard className="p-6">
            <h3 className="text-lg font-bold text-[#4B4036] mb-4">權限記錄資訊</h3>
            {permissionData ? (
              <div className="space-y-2">
                <div><strong>ID:</strong> {permissionData.id}</div>
                <div><strong>Email:</strong> {permissionData.user_email}</div>
                <div><strong>Role ID:</strong> {permissionData.role_id}</div>
                <div><strong>Status:</strong> {permissionData.status}</div>
                <div><strong>Active:</strong> {permissionData.is_active ? '是' : '否'}</div>
              </div>
            ) : (
              <p className="text-[#8B7355]">沒有權限記錄</p>
            )}
          </HanamiCard>

          {/* 角色資訊 */}
          <HanamiCard className="p-6">
            <h3 className="text-lg font-bold text-[#4B4036] mb-4">角色資訊</h3>
            {roleData ? (
              <div className="space-y-2">
                <div><strong>Role Name:</strong> {roleData.role_name}</div>
                <div><strong>Display Name:</strong> {roleData.display_name}</div>
                <div><strong>System Role:</strong> {roleData.is_system_role ? '是' : '否'}</div>
                <div className="mt-4">
                  <strong>權限配置:</strong>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(roleData.permissions, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-[#8B7355]">沒有角色資訊</p>
            )}
          </HanamiCard>

          {/* 操作按鈕 */}
          <HanamiCard className="p-6">
            <h3 className="text-lg font-bold text-[#4B4036] mb-4">操作</h3>
            <div className="space-y-3">
              <HanamiButton
                onClick={checkPermissions}
                variant="primary"
                className="w-full"
              >
                重新檢查權限
              </HanamiButton>
              
              <HanamiButton
                onClick={createTeacherRole}
                variant="secondary"
                className="w-full"
              >
                創建/更新教師角色
              </HanamiButton>
              
              <HanamiButton
                onClick={createTeacherPermission}
                variant="secondary"
                className="w-full"
              >
                創建/更新教師權限
              </HanamiButton>
            </div>
          </HanamiCard>
        </div>

        {/* 調試資訊 */}
        <HanamiCard className="p-6 mt-6">
          <h3 className="text-lg font-bold text-[#4B4036] mb-4">調試資訊</h3>
          <div className="space-y-4">
            <div>
              <strong>用戶會話:</strong>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(userSession, null, 2)}
              </pre>
            </div>
            
            <div>
              <strong>權限數據:</strong>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(permissionData, null, 2)}
              </pre>
            </div>
            
            <div>
              <strong>角色數據:</strong>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(roleData, null, 2)}
              </pre>
            </div>
          </div>
        </HanamiCard>
      </div>
    </div>
  );
} 