
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import HanamiInput from '@/components/ui/HanamiInput';
import { HanamiSelect } from '@/components/ui/HanamiSelect';
import StudentSelector from '@/components/ui/StudentSelector';
import { PopupSelect } from '@/components/ui/PopupSelect';
import {
  AdminIcon, UserManagementIcon, PermissionIcon, SettingsIcon, StudentIcon, TeacherIcon,
  CourseIcon, ScheduleIcon, AIIcon, ProgressIcon, ResourceIcon, TrialIcon, RegistrationIcon,
  DashboardIcon, ProfileIcon, MediaIcon, ChildIcon, PageIcon, ExportIcon, FinanceIcon,
  LessonIcon, GrowthSparklesIcon, AbilityIcon, ActivityIcon, AssessmentIcon, CommunicationIcon,
  FeatureIcon
} from '@/components/ui/PermissionIcons';

interface Role {
  id: string;
  role_name: string;
  display_name: string;
  description: string;
  is_system_role: boolean;
  permissions: any;
  is_active: boolean;
  created_at: string;
}

interface UserPermission {
  id: string;
  user_email: string;
  user_phone: string;
  role_id: string;
  status: string;
  approved_by: string;
  approved_at: string;
  custom_permissions: any;
  student_access_list: string[];
  page_access_list: string[];
  feature_access_list: string[];
  data_access_config: any;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  hanami_roles: {
    role_name: string;
    display_name: string;
    permissions: any;
  };
}

interface RegistrationRequest {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: 'admin' | 'teacher' | 'parent';
  status: 'pending' | 'approved' | 'rejected';
  additional_info: any;
  created_at: string;
  updated_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

interface PermissionApplication {
  id: string;
  applicant_email: string;
  applicant_phone: string;
  requested_role_id: string;
  application_type: string;
  current_role_id: string;
  reason: string;
  supporting_documents: any;
  status: string;
  reviewed_by: string;
  reviewed_at: string;
  review_notes: string;
  approved_permissions: any;
  expires_at: string;
  created_at: string;
  hanami_roles: {
    role_name: string;
    display_name: string;
  };
}

export default function PermissionManagementPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('roles');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 資料狀態
  const [roles, setRoles] = useState<Role[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [applications, setApplications] = useState<PermissionApplication[]>([]);
  const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>([]);

  // 表單狀態
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [showPermissionForm, setShowPermissionForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermission, setSelectedPermission] = useState<UserPermission | null>(null);

  // 多選狀態
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // 當選中的權限變化時，更新全選狀態
  useEffect(() => {
    if (selectedPermissions.length === 0) {
      setSelectAll(false);
    } else if (selectedPermissions.length === userPermissions.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedPermissions, userPermissions.length]);

  // 載入資料
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      switch (activeTab) {
        case 'roles':
          await loadRoles();
          break;
        case 'permissions':
          await loadUserPermissions();
          break;
        case 'applications':
          await loadApplications();
          break;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    const response = await fetch('/api/permissions?type=roles');
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || '載入角色失敗');
    }

    setRoles(result.data || []);
  };

  const loadUserPermissions = async () => {
    const response = await fetch('/api/permissions?type=user_permissions');
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || '載入用戶權限失敗');
    }

    setUserPermissions(result.data || []);
  };

  const loadApplications = async () => {
    try {
      // 載入註冊申請數據
      const response = await fetch('/api/registration-requests');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '載入註冊申請失敗');
      }

      setRegistrationRequests(result.data || []);
      console.log('載入註冊申請成功:', result.data?.length || 0, '條記錄');
    } catch (err) {
      console.error('載入註冊申請錯誤:', err);
      setError('載入註冊申請失敗: ' + (err instanceof Error ? err.message : '未知錯誤'));
    }
  };

  // 處理註冊申請審核
  const handleRegistrationReview = async (requestId: string, status: 'approved' | 'rejected', rejectionReason?: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('開始審核申請:', { requestId, status, rejectionReason });

      const request = registrationRequests.find(r => r.id === requestId);
      if (!request) {
        throw new Error('找不到申請記錄');
      }

      console.log('找到申請記錄:', request);

      if (status === 'rejected') {
        // 拒絕：直接刪除註冊申請
        console.log('拒絕申請，直接刪除...');
        
        const deleteResponse = await fetch(`/api/registration-requests?id=${requestId}`, {
          method: 'DELETE',
        });

        if (!deleteResponse.ok) {
          const errorText = await deleteResponse.text();
          console.error('刪除 API 錯誤響應:', errorText);
          throw new Error(`刪除申請失敗: ${errorText}`);
        }

        console.log('成功刪除被拒絕的申請');
      } else {
        // 批准：創建用戶權限和用戶帳號後刪除註冊申請
        console.log('批准申請，開始創建用戶權限和用戶帳號...');
        
        try {
          // 1. 創建用戶權限記錄
          console.log('步驟 1: 創建用戶權限記錄...');
          await createUserPermissionsFromRequest(request);
          console.log('✅ 用戶權限記錄創建成功');
          
          // 2. 創建實際用戶帳號
          console.log('步驟 2: 創建實際用戶帳號...');
          await createUserAccountFromRequest(request);
          console.log('✅ 用戶帳號創建成功');
          
          // 3. 刪除註冊申請（只有在權限和帳號都創建成功後才刪除）
          console.log('步驟 3: 刪除註冊申請...');
          const deleteResponse = await fetch(`/api/registration-requests?id=${requestId}`, {
            method: 'DELETE',
          });

          if (!deleteResponse.ok) {
            const errorText = await deleteResponse.text();
            console.error('刪除 API 錯誤響應:', errorText);
            console.warn('刪除註冊申請失敗，但不影響用戶帳號創建');
          } else {
            console.log('✅ 註冊申請已刪除');
          }
          
        } catch (createError) {
          console.error('創建用戶帳號或權限記錄失敗:', createError);
          throw new Error(`創建用戶帳號失敗: ${createError instanceof Error ? createError.message : '未知錯誤'}`);
        }
      }

      // 重新載入數據
      console.log('重新載入數據...');
      await loadApplications();
      
      setError(null);
      console.log('審核完成');
    } catch (err) {
      console.error('審核申請錯誤:', err);
      setError('審核申請失敗: ' + (err instanceof Error ? err.message : '未知錯誤'));
    } finally {
      setLoading(false);
    }
  };

  // 從註冊申請創建用戶權限
  const createUserPermissionsFromRequest = async (request: RegistrationRequest) => {
    try {
      console.log('開始創建用戶權限，申請:', request);
      
      // 1. 檢查是否已有權限記錄
      const { data: existingPermission, error: checkError } = await supabase
        .from('hanami_user_permissions_v2')
        .select('id, user_email, status')
        .eq('user_email', request.email)
        .single();

      if (existingPermission) {
        console.log(`權限記錄已存在: ${request.email}，跳過創建`);
        return; // 如果已存在，直接返回，不拋出錯誤
      }

      // 2. 直接使用 Supabase 查詢獲取角色ID，避免 getRoleId 函數的問題
      const { data: roleData, error: roleError } = await supabase
        .from('hanami_roles')
        .select('id, role_name')
        .eq('role_name', request.role)
        .single();

      if (roleError || !roleData) {
        console.error('角色查詢錯誤:', roleError);
        throw new Error(`找不到角色: ${request.role}`);
      }

      const typedRoleData = roleData as { id: string; role_name: string } | null;
      if (!typedRoleData || !typedRoleData.id) {
        throw new Error(`找不到角色: ${request.role}`);
      }

      console.log('找到角色:', typedRoleData);
      
      // 3. 創建用戶權限記錄
      const permissionData = {
        user_email: request.email,
        user_phone: request.phone || '',
        role_id: typedRoleData.id,
        status: 'approved',
        is_active: true
      };

      console.log('準備創建的權限數據:', permissionData);

      const { data: newPermission, error: insertError } = await (supabase
        .from('hanami_user_permissions_v2') as any)
        .insert(permissionData as any)
        .select()
        .single();

      if (insertError) {
        console.error('權限記錄插入錯誤:', insertError);
        throw insertError;
      }

      console.log(`已為 ${request.email} 創建權限記錄:`, newPermission);
    } catch (err) {
      console.error('創建權限記錄錯誤:', err);
      throw new Error(`創建權限記錄失敗: ${err instanceof Error ? err.message : '未知錯誤'}`);
    }
  };

  // 從註冊申請創建用戶帳號
  const createUserAccountFromRequest = async (request: RegistrationRequest) => {
    try {
      console.log('=== 開始創建用戶帳號 ===');
      console.log('請求數據:', request);
      console.log('角色:', request.role);
      console.log('郵箱:', request.email);
      console.log('姓名:', request.full_name);
      
      // 從 additional_info 中提取密碼，如果沒有則使用默認密碼
      const userPassword = request.additional_info?.password || 'hanami123';
      console.log('使用的密碼:', userPassword ? '已設置' : '使用默認密碼');
      console.log('additional_info:', request.additional_info);
      
      switch (request.role) {
        case 'admin': {
          // 創建管理員帳號
          const { error: adminError } = await (supabase
            .from('hanami_admin') as any)
            .insert({
              admin_email: request.email,
              admin_name: request.full_name,
              role: 'admin',
              admin_password: userPassword
            } as any);
          
          if (adminError) {
            console.error('創建管理員帳號錯誤:', adminError);
            throw adminError;
          }
          console.log('管理員帳號創建成功');
          break;
        }
          
        case 'teacher': {
          // 創建教師帳號
          console.log('開始創建教師帳號...');
          
          const teacherData = {
            teacher_email: request.email,
            teacher_fullname: request.full_name,
            teacher_nickname: request.full_name || '教師', // teacher_nickname 是 NOT NULL
            teacher_phone: request.phone || '',
            teacher_password: userPassword,
            teacher_role: 'teacher',
            teacher_status: 'active',
            teacher_background: request.additional_info?.teacherBackground || '',
            teacher_bankid: request.additional_info?.teacherBankId || '',
            teacher_address: request.additional_info?.teacherAddress || '',
            teacher_dob: request.additional_info?.teacherDob || null
          };
          
          console.log('準備插入的教師數據:', teacherData);
          
          const { data: newTeacher, error: teacherError } = await (supabase
            .from('hanami_employee') as any)
            .insert(teacherData as any)
            .select();
          
          if (teacherError) {
            console.error('創建教師帳號錯誤:', teacherError);
            throw teacherError;
          }
          console.log('教師帳號創建成功:', newTeacher);
          break;
        }
          
        case 'parent': {
          // 創建家長帳號（使用新的 hanami_parents 表）
          console.log('開始創建家長帳號...');
          
          const parentData = {
            parent_email: request.email,
            parent_name: request.full_name,
            parent_phone: request.phone || '',
            parent_password: userPassword,
            parent_address: request.additional_info?.address || '',
            parent_status: 'active',
            parent_notes: request.additional_info?.notes || ''
          };
          
          console.log('準備插入的家長數據:', parentData);
          
          const { data: newParent, error: parentError } = await (supabase
            .from('hanami_parents') as any)
            .insert(parentData as any)
            .select();
          
          if (parentError) {
            console.error('創建家長帳號錯誤:', parentError);
            throw parentError;
          }
          console.log('家長帳號創建成功:', newParent);
          break;
        }
          
        default:
          throw new Error(`不支援的角色類型: ${request.role}`);
      }
    } catch (err) {
      console.error('創建用戶帳號錯誤:', err);
      throw new Error(`創建用戶帳號失敗: ${err instanceof Error ? err.message : '未知錯誤'}`);
    }
  };



  // 獲取角色ID
  const getRoleId = async (roleName: string): Promise<string> => {
    console.log('獲取角色ID:', roleName); // Added
    
    const role = roles.find(r => r.role_name === roleName);
    if (role) {
      console.log('找到現有角色:', role.id); // Added
      return role.id;
    }

    console.log('角色不存在，創建默認角色:', roleName); // Added

    // 如果角色不存在，創建默認角色
    const defaultRole = {
      role_name: roleName,
      display_name: roleName === 'admin' ? '管理員' : roleName === 'teacher' ? '教師' : '家長',
      description: `默認${roleName === 'admin' ? '管理員' : roleName === 'teacher' ? '教師' : '家長'}角色`,
      is_system_role: true,
      permissions: getDefaultPermissions(roleName),
      is_active: true
    };

    console.log('準備創建的默認角色:', defaultRole); // Added

    const response = await fetch('/api/permissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create_role',
        data: defaultRole
      }),
    });

    console.log('創建角色 API 響應狀態:', response.status); // Added

    if (!response.ok) {
      const errorText = await response.text(); // Added
      console.error('創建角色 API 錯誤響應:', errorText); // Added
      throw new Error(`創建默認角色失敗: ${errorText}`);
    }

    const result = await response.json();
    console.log('創建角色成功響應:', result); // Added
    return result.data.id;
  };

  // 獲取默認權限配置
  const getDefaultPermissions = (roleName: string) => {
    switch (roleName) {
      case 'admin':
        return {
          pages: ['admin', 'students', 'teachers', 'permissions'],
          features: ['manage_users', 'manage_data', 'view_reports'],
          data_access: 'all'
        };
      case 'teacher':
        return {
          pages: ['teacher', 'students', 'lessons'],
          features: ['view_students', 'manage_lessons'],
          data_access: 'assigned_students'
        };
      case 'parent':
        return {
          pages: ['parent', 'student_progress'],
          features: ['view_child_progress'],
          data_access: 'own_children'
        };
      default:
        return {
          pages: [],
          features: [],
          data_access: 'none'
        };
    }
  };

  const handleCreateRole = async (roleData: any) => {
    try {
      const response = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_role',
          data: roleData
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '創建角色失敗');
      }

      alert(result.message);
      setShowRoleForm(false);
      await loadRoles();
    } catch (err: any) {
      alert(`創建角色失敗: ${err.message}`);
    }
  };

  const handleUpdateRole = async (roleData: any) => {
    try {
      if (!selectedRole?.id) {
        throw new Error('沒有選中的角色ID');
      }
      
      console.log('正在更新角色:', { ...roleData, id: selectedRole.id });
      
      const response = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_role',
          data: { ...roleData, id: selectedRole.id }
        })
      });

      console.log('API 響應狀態:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 錯誤響應:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('API 成功響應:', result);

      alert(result.message);
      setSelectedRole(null);
      await loadRoles();
    } catch (err: any) {
      console.error('更新角色詳細錯誤:', err);
      alert(`更新角色失敗: ${err.message}`);
    }
  };

  const handleCreatePermission = async (permissionData: any) => {
    try {
      const response = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_user_permission',
          data: permissionData
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '創建用戶權限失敗');
      }

      alert(result.message);
      setShowPermissionForm(false);
      await loadUserPermissions();
    } catch (err: any) {
      alert(`創建用戶權限失敗: ${err.message}`);
    }
  };

  const handleUpdatePermission = async (permissionData: any) => {
    try {
      if (!selectedPermission?.id) {
        throw new Error('沒有選中的權限ID');
      }
      
      console.log('正在更新用戶權限:', { ...permissionData, id: selectedPermission.id });
      
      const response = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_user_permission',
          data: { ...permissionData, id: selectedPermission.id }
        })
      });

      console.log('API 響應狀態:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 錯誤響應:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('API 成功響應:', result);

      alert(result.message);
      setSelectedPermission(null);
      await loadUserPermissions();
    } catch (err: any) {
      console.error('更新用戶權限詳細錯誤:', err);
      alert(`更新用戶權限失敗: ${err.message}`);
    }
  };

  const handleApproveApplication = async (applicationId: string, approvedBy: string) => {
    try {
      const response = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve_application',
          data: {
            id: applicationId,
            approved_by: approvedBy,
            review_notes: '管理員批准',
            approved_permissions: {}
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '批准申請失敗');
      }

      alert(result.message);
      await loadApplications();
    } catch (err: any) {
      alert(`批准申請失敗: ${err.message}`);
    }
  };

  const handleRejectApplication = async (applicationId: string, reviewedBy: string) => {
    try {
      const response = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject_application',
          data: {
            id: applicationId,
            reviewed_by: reviewedBy,
            review_notes: '管理員拒絕'
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '拒絕申請失敗');
      }

      alert(result.message);
      await loadApplications();
    } catch (err: any) {
      alert(`拒絕申請失敗: ${err.message}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'suspended':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // 多選相關函數
  const handleSelectPermission = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId) 
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedPermissions([]);
      setSelectAll(false);
    } else {
      setSelectedPermissions(userPermissions.map(p => p.id));
      setSelectAll(true);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedPermissions.length === 0) {
      alert('請選擇要刪除的權限記錄');
      return;
    }

    if (!confirm(`確定要刪除選中的 ${selectedPermissions.length} 條權限記錄嗎？此操作不可撤銷。`)) {
      return;
    }

    try {
      setLoading(true);
      
      // 批量刪除選中的權限記錄
      const deletePromises = selectedPermissions.map(id => {
        const requestBody = {
          type: 'user_permission',
          id: id
        };
        console.log(`發送批量刪除請求，ID: ${id}`, requestBody);
        
        return fetch('/api/permissions', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });
      });

      const results = await Promise.all(deletePromises);
      const failedDeletes = results.filter(r => !r.ok);

      if (failedDeletes.length > 0) {
        alert(`刪除完成，但有 ${failedDeletes.length} 條記錄刪除失敗`);
      } else {
        alert(`成功刪除 ${selectedPermissions.length} 條權限記錄`);
      }

      // 清空選中狀態並重新載入數據
      setSelectedPermissions([]);
      setSelectAll(false);
      await loadUserPermissions();
      
    } catch (error) {
      console.error('批量刪除錯誤:', error);
      alert('批量刪除過程中發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSingle = async (permissionId: string) => {
    if (!confirm('確定要刪除此權限記錄嗎？此操作不可撤銷。')) {
      return;
    }

    try {
      setLoading(true);
      
      const requestBody = {
        type: 'user_permission',
        id: permissionId
      };
      
      console.log('發送刪除請求:', requestBody);
      
      const response = await fetch('/api/permissions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('刪除響應狀態:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('刪除成功:', result);
        alert('權限記錄刪除成功');
        await loadUserPermissions();
      } else {
        const error = await response.json();
        console.error('刪除失敗:', error);
        alert(`刪除失敗: ${error.error || '未知錯誤'}`);
      }
    } catch (error) {
      console.error('刪除錯誤:', error);
      alert('刪除過程中發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#4B4036] mb-2">權限管理系統</h1>
        <p className="text-[#2B3A3B]">管理用戶角色、權限和申請</p>
      </div>

      {/* 標籤頁 */}
      <div className="flex space-x-1 mb-6 bg-[#FFF9F2] p-1 rounded-xl">
        {[
          { id: 'roles', label: '角色管理', icon: '👥' },
          { id: 'permissions', label: '用戶權限', icon: '🔐' },
          { id: 'applications', label: '用戶申請', icon: '📝' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-[#FFD59A] text-[#4B4036] shadow-md'
                : 'text-[#2B3A3B] hover:bg-[#EBC9A4]'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 錯誤訊息 */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* 載入狀態 */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD59A]"></div>
        </div>
      )}

      {/* 角色管理 */}
      {activeTab === 'roles' && !loading && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-[#4B4036]">角色管理</h2>
            <HanamiButton
              onClick={() => setShowRoleForm(true)}
              variant="primary"
              size="md"
            >
              <span className="mr-2">➕</span>
              新增角色
            </HanamiButton>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <HanamiCard key={role.id} className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-[#4B4036]">
                      {role.display_name}
                    </h3>
                    <p className="text-sm text-[#2B3A3B]">{role.role_name}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    role.is_system_role 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-green-100 text-green-600'
                  }`}>
                    {role.is_system_role ? '系統' : '自訂'}
                  </span>
                </div>
                <p className="text-sm text-[#2B3A3B] mb-3">
                  {role.description || '無描述'}
                </p>
                <div className="flex justify-between items-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    role.is_active 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {role.is_active ? '啟用' : '停用'}
                  </span>
                  <HanamiButton
                    onClick={() => setSelectedRole(role)}
                    variant="secondary"
                    size="sm"
                  >
                    編輯
                  </HanamiButton>
                </div>
              </HanamiCard>
            ))}
          </div>
        </div>
      )}

      {/* 用戶權限 */}
      {activeTab === 'permissions' && !loading && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-[#4B4036]">用戶權限</h2>
            <div className="flex gap-2">
              {selectedPermissions.length > 0 && (
                <HanamiButton
                  onClick={handleDeleteSelected}
                  variant="danger"
                  size="md"
                >
                  <span className="mr-2">🗑️</span>
                  刪除選中 ({selectedPermissions.length})
                </HanamiButton>
              )}
              {userPermissions.length > 0 && (
                <HanamiButton
                  onClick={handleSelectAll}
                  variant="secondary"
                  size="md"
                >
                  <span className="mr-2">📋</span>
                  {selectAll ? '取消全選' : '全選'}
                </HanamiButton>
              )}
              <HanamiButton
                onClick={() => setShowPermissionForm(true)}
                variant="primary"
                size="md"
              >
                <span className="mr-2">➕</span>
                新增權限
              </HanamiButton>
            </div>
          </div>

          {userPermissions.length === 0 ? (
            <div className="text-center py-8 text-[#2B3A3B]">
              暫無用戶權限記錄
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg shadow">
              <thead className="bg-[#FFD59A]">
                <tr>
                  <th className="px-4 py-3 text-left text-[#4B4036] font-semibold">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-[#FFD59A] bg-white border-[#EADBC8] rounded focus:ring-[#FFD59A] focus:ring-2"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-[#4B4036] font-semibold">用戶郵箱</th>
                  <th className="px-4 py-3 text-left text-[#4B4036] font-semibold">角色</th>
                  <th className="px-4 py-3 text-left text-[#4B4036] font-semibold">狀態</th>
                  <th className="px-4 py-3 text-left text-[#4B4036] font-semibold">批准時間</th>
                  <th className="px-4 py-3 text-left text-[#4B4036] font-semibold">操作</th>
                </tr>
              </thead>
              <tbody>
                {userPermissions.map((permission) => (
                  <tr key={permission.id} className="border-b border-[#EADBC8]">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission.id)}
                        onChange={() => handleSelectPermission(permission.id)}
                        className="w-4 h-4 text-[#FFD59A] bg-white border-[#EADBC8] rounded focus:ring-[#FFD59A] focus:ring-2"
                      />
                    </td>
                    <td className="px-4 py-3 text-[#2B3A3B]">
                      {permission.user_email}
                    </td>
                    <td className="px-4 py-3 text-[#2B3A3B]">
                      {permission.hanami_roles?.display_name || '未知角色'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(permission.status)}`}>
                        {permission.status === 'approved' ? '已批准' :
                         permission.status === 'pending' ? '待審核' :
                         permission.status === 'rejected' ? '已拒絕' :
                         permission.status === 'suspended' ? '已暫停' : permission.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#2B3A3B]">
                      {permission.approved_at ? new Date(permission.approved_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <HanamiButton
                          onClick={() => setSelectedPermission(permission)}
                          variant="secondary"
                          size="sm"
                        >
                          編輯
                        </HanamiButton>
                        <HanamiButton
                          onClick={() => handleDeleteSingle(permission.id)}
                          variant="danger"
                          size="sm"
                        >
                          刪除
                        </HanamiButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {/* 用戶申請 */}
      {activeTab === 'applications' && !loading && (
        <div>
          <h2 className="text-2xl font-semibold text-[#4B4036] mb-4">用戶申請</h2>

          {/* 註冊申請列表 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#4B4036] mb-3">註冊申請 ({registrationRequests.length})</h3>
            
            {registrationRequests.length === 0 ? (
              <div className="text-center py-8 text-[#2B3A3B]">
                暫無註冊申請
              </div>
            ) : (
              <div className="grid gap-4">
                {registrationRequests.map((request) => (
                  <HanamiCard key={request.id} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-lg font-semibold text-[#4B4036]">
                          {request.full_name}
                        </h4>
                        <p className="text-sm text-[#2B3A3B]">
                          郵箱: {request.email}
                        </p>
                        <p className="text-sm text-[#2B3A3B]">
                          電話: {request.phone || '-'}
                        </p>
                        <p className="text-sm text-[#2B3A3B]">
                          申請角色: {request.role === 'admin' ? '管理員' : 
                                     request.role === 'teacher' ? '教師' : '家長'}
                        </p>
                        {request.additional_info && Object.keys(request.additional_info).length > 0 && (
                          <div className="text-sm text-[#2B3A3B] mt-2">
                            <p className="font-medium">附加信息:</p>
                            <ul className="list-disc list-inside ml-2">
                              {Object.entries(request.additional_info).map(([key, value]) => (
                                <li key={key}>
                                  {key}: {typeof value === 'string' ? value : JSON.stringify(value)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(request.status)}`}>
                        {request.status === 'approved' ? '已批准' :
                         request.status === 'pending' ? '待審核' :
                         request.status === 'rejected' ? '已拒絕' : request.status}
                      </span>
                    </div>
                    
                    <p className="text-xs text-[#2B3A3B] mb-3">
                      申請時間: {new Date(request.created_at).toLocaleString()}
                    </p>
                    
                    {request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <HanamiButton
                          onClick={() => handleRegistrationReview(request.id, 'approved')}
                          variant="success"
                          size="sm"
                        >
                          批准並創建權限
                        </HanamiButton>
                        <HanamiButton
                          onClick={() => {
                            const reason = prompt('請輸入拒絕原因：');
                            if (reason !== null) {
                              handleRegistrationReview(request.id, 'rejected', reason);
                            }
                          }}
                          variant="danger"
                          size="sm"
                        >
                          拒絕並刪除
                        </HanamiButton>
                      </div>
                    )}
                    
                    {request.status === 'rejected' && request.rejection_reason && (
                      <div className="text-xs text-red-600 mt-2">
                        拒絕原因: {request.rejection_reason}
                      </div>
                    )}
                  </HanamiCard>
                ))}
              </div>
            )}
          </div>

          {/* 權限變更申請列表 */}
          <div>
            <h3 className="text-lg font-semibold text-[#4B4036] mb-3">權限變更申請 ({applications.length})</h3>
            
            {applications.length === 0 ? (
              <div className="text-center py-8 text-[#2B3A3B]">
                暫無權限變更申請
              </div>
            ) : (
              <div className="grid gap-4">
                {applications.map((application) => (
                  <HanamiCard key={application.id} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-lg font-semibold text-[#4B4036]">
                          {application.applicant_email}
                        </h4>
                        <p className="text-sm text-[#2B3A3B]">
                          申請角色: {application.hanami_roles?.display_name || '未知角色'}
                        </p>
                        <p className="text-sm text-[#2B3A3B]">
                          申請類型: {application.application_type === 'new_user' ? '新用戶' :
                                    application.application_type === 'role_change' ? '角色變更' :
                                    application.application_type === 'permission_extension' ? '權限擴展' : application.application_type}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(application.status)}`}>
                        {application.status === 'approved' ? '已批准' :
                         application.status === 'pending' ? '待審核' :
                         application.status === 'rejected' ? '已拒絕' :
                         application.status === 'cancelled' ? '已取消' : application.status}
                      </span>
                    </div>
                    <p className="text-sm text-[#2B3A3B] mb-3">
                      申請理由: {application.reason}
                    </p>
                    <p className="text-xs text-[#2B3A3B] mb-3">
                      申請時間: {new Date(application.created_at).toLocaleString()}
                    </p>
                    
                    {application.status === 'pending' && (
                      <div className="flex space-x-2">
                        <HanamiButton
                          onClick={() => handleApproveApplication(application.id, 'admin-id')}
                          variant="success"
                          size="sm"
                        >
                          批准
                        </HanamiButton>
                        <HanamiButton
                          onClick={() => handleRejectApplication(application.id, 'admin-id')}
                          variant="danger"
                          size="sm"
                        >
                          拒絕
                        </HanamiButton>
                      </div>
                    )}
                  </HanamiCard>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 新增角色表單 */}
      {showRoleForm && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-xl font-semibold text-[#4B4036] mb-4">新增角色</h3>
            <RoleForm
              onSubmit={handleCreateRole}
              onCancel={() => setShowRoleForm(false)}
            />
          </div>
        </div>
      )}

      {/* 新增權限表單 */}
      {showPermissionForm && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-xl font-semibold text-[#4B4036] mb-4">新增用戶權限</h3>
            <PermissionForm
              roles={roles}
              onSubmit={handleCreatePermission}
              onCancel={() => setShowPermissionForm(false)}
            />
          </div>
        </div>
      )}

      {/* 編輯角色表單 */}
      {selectedRole && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-xl font-semibold text-[#4B4036] mb-4">編輯角色</h3>
            <RoleForm
              initialData={selectedRole}
              onSubmit={handleUpdateRole}
              onCancel={() => setSelectedRole(null)}
            />
          </div>
        </div>
      )}

      {/* 編輯權限表單 */}
      {selectedPermission && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-xl font-semibold text-[#4B4036] mb-4">編輯用戶權限</h3>
            <PermissionForm
              roles={roles}
              initialData={selectedPermission}
              onSubmit={handleUpdatePermission}
              onCancel={() => setSelectedPermission(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// 角色表單組件
function RoleForm({ 
  initialData, 
  onSubmit, 
  onCancel 
}: { 
  initialData?: Role; 
  onSubmit: (data: any) => void; 
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState(() => {
    const defaultPermissions = {
      pages: {
        '/admin/*': { access: 'allow', operations: ['view', 'create', 'edit', 'delete'] },
        '/teacher/*': { access: 'deny', operations: [] },
        '/parent/*': { access: 'deny', operations: [] }
      },
      features: {
        'user_management': { access: 'allow', operations: ['view', 'create', 'edit', 'delete'] },
        'permission_management': { access: 'allow', operations: ['view', 'create', 'edit', 'delete'] },
        'system_settings': { access: 'allow', operations: ['view', 'edit'] },
        'student_management': { access: 'allow', operations: ['view', 'create', 'edit', 'delete'] },
        'teacher_management': { access: 'allow', operations: ['view', 'create', 'edit', 'delete'] },
        'course_management': { access: 'allow', operations: ['view', 'create', 'edit', 'delete'] },
        'ai_tools': { access: 'allow', operations: ['view', 'create', 'edit', 'delete'] }
      },
      data: {
        'students': { access: 'all', operations: ['view', 'edit', 'delete'] },
        'teachers': { access: 'all', operations: ['view', 'edit', 'delete'] },
        'courses': { access: 'all', operations: ['view', 'edit', 'delete'] }
      }
    };

    // 根據角色設置預設權限
    const getDefaultPermissionsByRole = (roleName: string) => {
      switch (roleName) {
        case 'admin':
          return {
            pages: {
              '/admin/*': { access: 'allow', operations: ['view', 'create', 'edit', 'delete'] },
              '/teacher/*': { access: 'deny', operations: [] },
              '/parent/*': { access: 'deny', operations: [] }
            },
            features: {
              'user_management': { access: 'allow', operations: ['view', 'create', 'edit', 'delete'] },
              'permission_management': { access: 'allow', operations: ['view', 'create', 'edit', 'delete'] },
              'system_settings': { access: 'allow', operations: ['view', 'edit'] },
              'student_management': { access: 'allow', operations: ['view', 'create', 'edit', 'delete'] },
              'teacher_management': { access: 'allow', operations: ['view', 'create', 'edit', 'delete'] },
              'course_management': { access: 'allow', operations: ['view', 'create', 'edit', 'delete'] },
              'ai_tools': { access: 'allow', operations: ['view', 'create', 'edit', 'delete'] }
            }
          };
        case 'teacher':
          return {
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
        case 'parent':
          return {
            pages: {
              '/parent/*': { access: 'allow', operations: ['view'] },
              '/parent/dashboard': { access: 'allow', operations: ['view'] },
              '/parent/profile': { access: 'allow', operations: ['view', 'edit'] }
            },
            features: {
              'child_info': { access: 'allow', operations: ['view'] },
              'progress_tracking': { access: 'allow', operations: ['view'] },
              'lesson_records': { access: 'allow', operations: ['view'] },
              'media_viewing': { access: 'allow', operations: ['view'] },
              'communication': { access: 'allow', operations: ['view', 'create'] },
              'schedule_viewing': { access: 'allow', operations: ['view'] }
            }
          };
        default:
          return defaultPermissions;
      }
    };

    return {
      role_name: initialData?.role_name || '',
      display_name: initialData?.display_name || '',
      description: initialData?.description || '',
      is_system_role: initialData?.is_system_role || false,
      permissions: initialData?.permissions || defaultPermissions
    };
  });

  // 篩選狀態
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'teacher' | 'parent'>('all');

  // 統一的頁面權限列表 - 包含所有角色的頁面
  const allPages = [
    // 管理員頁面
    { path: '/admin/*', label: '管理員頁面', description: '所有管理員相關頁面', role: 'admin', icon: AdminIcon },
    { path: '/admin/students', label: '學生管理', description: '學生管理頁面', role: 'admin', icon: StudentIcon },
    { path: '/admin/teachers', label: '教師管理', description: '教師管理頁面', role: 'admin', icon: TeacherIcon },
    { path: '/admin/class-management', label: '課程管理', description: '課程管理頁面', role: 'admin', icon: CourseIcon },
    { path: '/admin/schedule-management', label: '排程管理', description: '排程管理頁面', role: 'admin', icon: ScheduleIcon },
    { path: '/admin/ai-hub', label: 'AI 工具', description: 'AI 工具中心', role: 'admin', icon: AIIcon },
    { path: '/admin/permission-management', label: '權限管理', description: '權限管理頁面', role: 'admin', icon: PermissionIcon },
    { path: '/admin/student-progress', label: '學生進度', description: '學生進度管理', role: 'admin', icon: ProgressIcon },
    { path: '/admin/resource-library', label: '資源庫', description: '教學資源庫', role: 'admin', icon: ResourceIcon },
    { path: '/admin/trial-queue', label: '試聽隊列', description: '試聽學生管理', role: 'admin', icon: TrialIcon },
    { path: '/admin/registration-requests', label: '註冊申請', description: '用戶註冊申請管理', role: 'admin', icon: RegistrationIcon },
    
    // 教師頁面
    { path: '/teacher/*', label: '教師頁面', description: '所有教師相關頁面', role: 'teacher', icon: TeacherIcon },
    { path: '/teacher/dashboard', label: '教師儀表板', description: '教師儀表板', role: 'teacher', icon: DashboardIcon },
    { path: '/teacher/profile', label: '個人資料', description: '教師個人資料管理', role: 'teacher', icon: ProfileIcon },
    { path: '/teacher/students', label: '學生管理', description: '教師的學生管理', role: 'teacher', icon: StudentIcon },
    { path: '/teacher/lessons', label: '課程記錄', description: '課程記錄管理', role: 'teacher', icon: PageIcon },
    { path: '/teacher/schedule', label: '課程安排', description: '個人課程安排', role: 'teacher', icon: ScheduleIcon },
    { path: '/teacher/progress', label: '學生進度', description: '學生學習進度', role: 'teacher', icon: ProgressIcon },
    { path: '/teacher/media', label: '媒體管理', description: '學生作品管理', role: 'teacher', icon: MediaIcon },
    
    // 家長頁面
    { path: '/parent/*', label: '家長頁面', description: '所有家長相關頁面', role: 'parent', icon: ProfileIcon },
    { path: '/parent/dashboard', label: '家長儀表板', description: '家長儀表板', role: 'parent', icon: DashboardIcon },
    { path: '/parent/profile', label: '個人資料', description: '家長個人資料', role: 'parent', icon: ProfileIcon },
    { path: '/parent/children', label: '子女管理', description: '子女資料管理', role: 'parent', icon: ChildIcon },
    { path: '/parent/progress', label: '學習進度', description: '子女學習進度', role: 'parent', icon: ProgressIcon },
    { path: '/parent/schedule', label: '課程安排', description: '子女課程安排', role: 'parent', icon: ScheduleIcon },
    { path: '/parent/media', label: '作品展示', description: '子女作品展示', role: 'parent', icon: MediaIcon },
  ];

  // 統一的功能權限列表 - 包含所有角色的功能
  const allFeatures = [
    // 管理員功能
    { name: 'user_management', label: '用戶管理', description: '管理用戶帳號和權限', role: 'admin', icon: UserManagementIcon },
    { name: 'permission_management', label: '權限管理', description: '管理角色和權限', role: 'admin', icon: PermissionIcon },
    { name: 'system_settings', label: '系統設定', description: '系統配置和設定', role: 'admin', icon: SettingsIcon },
    { name: 'student_management', label: '學生管理', description: '學生資料管理', role: 'admin', icon: StudentIcon },
    { name: 'teacher_management', label: '教師管理', description: '教師資料管理', role: 'admin', icon: TeacherIcon },
    { name: 'course_management', label: '課程管理', description: '課程和排程管理', role: 'admin', icon: CourseIcon },
    { name: 'ai_tools', label: 'AI 工具', description: 'AI 輔助功能', role: 'admin', icon: AIIcon },
    { name: 'data_export', label: '數據導出', description: '數據導出功能', role: 'admin', icon: ExportIcon },
    { name: 'financial_data', label: '財務數據', description: '財務數據管理', role: 'admin', icon: FinanceIcon },
    
    // 教師功能
    { name: 'lesson_management', label: '課程記錄', description: '課程記錄管理', role: 'teacher', icon: LessonIcon },
    { name: 'student_progress', label: '學生進度', description: '學生學習進度追蹤', role: 'teacher', icon: ProgressIcon },
    { name: 'media_management', label: '媒體管理', description: '學生作品管理', role: 'teacher', icon: MediaIcon },
    { name: 'growth_tree_management', label: '成長樹管理', description: '學生成長樹管理', role: 'teacher', icon: GrowthSparklesIcon },
    { name: 'ability_development', label: '發展能力圖卡', description: '能力發展圖卡', role: 'teacher', icon: AbilityIcon },
    { name: 'teaching_activities', label: '教學活動管理', description: '教學活動管理', role: 'teacher', icon: ActivityIcon },
    { name: 'ability_assessment', label: '能力評估管理', description: '學生能力評估', role: 'teacher', icon: AssessmentIcon },
    { name: 'schedule_management', label: '排程管理', description: '個人課程排程', role: 'teacher', icon: ScheduleIcon },
    
    // 家長功能
    { name: 'child_info', label: '子女資訊', description: '查看子女基本資訊', role: 'parent', icon: ChildIcon },
    { name: 'progress_tracking', label: '進度追蹤', description: '追蹤子女學習進度', role: 'parent', icon: ProgressIcon },
    { name: 'lesson_records', label: '課程記錄', description: '查看子女課程記錄', role: 'parent', icon: LessonIcon },
    { name: 'media_viewing', label: '作品查看', description: '查看子女作品', role: 'parent', icon: MediaIcon },
    { name: 'communication', label: '溝通功能', description: '與教師溝通', role: 'parent', icon: CommunicationIcon },
    { name: 'schedule_viewing', label: '課程安排查看', description: '查看子女課程安排', role: 'parent', icon: ScheduleIcon },
  ];

  // 批量操作函數
  const handleBatchOperation = (role: string, access: 'allow' | 'deny') => {
    const updatedPermissions = { ...formData.permissions };
    
    // 批量設置頁面權限
    allPages
      .filter(page => role === 'all' || page.role === role)
      .forEach(page => {
        updatedPermissions.pages[page.path] = {
          access,
          operations: access === 'allow' ? ['view', 'create', 'edit', 'delete'] : []
        };
      });
    
    // 批量設置功能權限
    allFeatures
      .filter(feature => role === 'all' || feature.role === role)
      .forEach(feature => {
        updatedPermissions.features[feature.name] = {
          access,
          operations: access === 'allow' ? ['view', 'create', 'edit', 'delete'] : []
        };
      });
    
    setFormData(prev => ({
      ...prev,
      permissions: updatedPermissions
    }));
  };

  // 切換頁面權限
  const togglePagePermission = (pagePath: string) => {
    const currentPermission = formData.permissions.pages?.[pagePath];
    const newAccess = currentPermission?.access === 'allow' ? 'deny' : 'allow';
    
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        pages: {
          ...prev.permissions.pages,
          [pagePath]: {
            access: newAccess as "allow" | "deny",
            operations: newAccess === 'allow' ? ['view', 'create', 'edit', 'delete'] : []
          }
        }
      }
    }));
  };

  // 切換功能權限
  const toggleFeaturePermission = (featureName: string) => {
    const currentPermission = formData.permissions.features?.[featureName];
    const newAccess = currentPermission?.access === 'allow' ? 'deny' : 'allow';
    
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        features: {
          ...prev.permissions.features,
          [featureName]: {
            access: newAccess as "allow" | "deny",
            operations: newAccess === 'allow' ? ['view', 'create', 'edit', 'delete'] : []
          }
        }
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('RoleForm 提交數據:', formData);
    console.log('RoleForm initialData:', initialData);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#4B4036] mb-1">
          角色名稱
        </label>
        <HanamiInput
          value={formData.role_name}
          onChange={(value) => setFormData({ ...formData, role_name: value })}
          placeholder="例如: custom_role_1"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-[#4B4036] mb-1">
          顯示名稱
        </label>
        <HanamiInput
          value={formData.display_name}
          onChange={(value) => setFormData({ ...formData, display_name: value })}
          placeholder="例如: 自訂角色1"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-[#4B4036] mb-1">
          描述
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD59A]"
          placeholder="角色描述"
          rows={3}
        />
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_system_role"
          checked={formData.is_system_role}
          onChange={(e) => setFormData({ ...formData, is_system_role: e.target.checked })}
          className="mr-2"
        />
        <label htmlFor="is_system_role" className="text-sm text-[#4B4036]">
          系統角色
        </label>
      </div>

      {/* 角色篩選 */}
      <div className="border-t border-[#EADBC8] pt-4">
        <h4 className="text-lg font-semibold text-[#4B4036] mb-3">角色篩選</h4>
        <div className="flex space-x-2 mb-4">
          {(['all', 'admin', 'teacher', 'parent'] as const).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setFilterRole(role)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterRole === role
                  ? 'bg-[#FFD59A] text-[#4B4036] shadow-md'
                  : 'bg-[#FFF9F2] text-[#8B7355] hover:bg-[#EADBC8]'
              }`}
            >
              {role === 'all' ? '全部' : role === 'admin' ? '管理員' : role === 'teacher' ? '教師' : '家長'}
            </button>
          ))}
        </div>
      </div>

      {/* 批量操作 */}
      <div className="border-t border-[#EADBC8] pt-4">
        <h4 className="text-lg font-semibold text-[#4B4036] mb-3">批量操作</h4>
        <div className="flex space-x-2 mb-4">
          <button
            type="button"
            onClick={() => handleBatchOperation(filterRole, 'allow')}
            className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            全部啟用
          </button>
          <button
            type="button"
            onClick={() => handleBatchOperation(filterRole, 'deny')}
            className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
          >
            全部停用
          </button>
        </div>
      </div>

      {/* 權限統計 */}
      <div className="border-t border-[#EADBC8] pt-4">
        <h4 className="text-lg font-semibold text-[#4B4036] mb-3">權限統計</h4>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-[#FFF9F2] p-3 rounded-lg">
            <div className="text-sm text-[#8B7355]">頁面權限</div>
            <div className="text-lg font-bold text-[#4B4036]">
              {Object.values(formData.permissions.pages || {}).filter((p: any) => p.access === 'allow').length} / {allPages.length}
            </div>
          </div>
          <div className="bg-[#FFF9F2] p-3 rounded-lg">
            <div className="text-sm text-[#8B7355]">功能權限</div>
            <div className="text-lg font-bold text-[#4B4036]">
              {Object.values(formData.permissions.features || {}).filter((f: any) => f.access === 'allow').length} / {allFeatures.length}
            </div>
          </div>
        </div>
      </div>

      {/* 頁面權限控制 */}
      <div className="border-t border-[#EADBC8] pt-4">
        <h4 className="text-lg font-semibold text-[#4B4036] mb-3">頁面權限控制</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {allPages
            .filter(page => filterRole === 'all' || page.role === filterRole)
            .map((page) => {
            const isAllowed = formData.permissions.pages?.[page.path]?.access === 'allow';
              const IconComponent = page.icon;
            return (
                <div key={page.path} className="flex items-center justify-between p-3 bg-[#FFF9F2] rounded-lg hover:bg-[#EADBC8] transition-colors">
                  <div className="flex items-center flex-1">
                    <div className="mr-3 text-[#FFD59A]">
                      <IconComponent className="w-5 h-5" />
                    </div>
                <div className="flex-1">
                  <div className="font-medium text-[#4B4036]">{page.label}</div>
                  <div className="text-sm text-[#2B3A3B]">{page.description}</div>
                      <div className="text-xs text-[#8B7355]">{page.path}</div>
                </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      page.role === 'admin' ? 'bg-red-100 text-red-700' :
                      page.role === 'teacher' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {page.role === 'admin' ? '管理員' : page.role === 'teacher' ? '教師' : '家長'}
                    </span>
                  <span className={`text-sm font-medium ${isAllowed ? 'text-green-600' : 'text-red-600'}`}>
                    {isAllowed ? '啟用' : '停用'}
                  </span>
                  <button
                    type="button"
                    onClick={() => togglePagePermission(page.path)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:ring-offset-2 ${
                        isAllowed ? 'bg-[#FFD59A]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                        isAllowed ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 功能權限控制 */}
      <div className="border-t border-[#EADBC8] pt-4">
        <h4 className="text-lg font-semibold text-[#4B4036] mb-3">功能權限控制</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {allFeatures
            .filter(feature => filterRole === 'all' || feature.role === filterRole)
            .map((feature) => {
            const isAllowed = formData.permissions.features?.[feature.name]?.access === 'allow';
              const IconComponent = feature.icon;
            return (
                <div key={feature.name} className="flex items-center justify-between p-3 bg-[#FFF9F2] rounded-lg hover:bg-[#EADBC8] transition-colors">
                  <div className="flex items-center flex-1">
                    <div className="mr-3 text-[#FFD59A]">
                      <IconComponent className="w-5 h-5" />
                    </div>
                <div className="flex-1">
                  <div className="font-medium text-[#4B4036]">{feature.label}</div>
                  <div className="text-sm text-[#2B3A3B]">{feature.description}</div>
                </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      feature.role === 'admin' ? 'bg-red-100 text-red-700' :
                      feature.role === 'teacher' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {feature.role === 'admin' ? '管理員' : feature.role === 'teacher' ? '教師' : '家長'}
                    </span>
                  <span className={`text-sm font-medium ${isAllowed ? 'text-green-600' : 'text-red-600'}`}>
                    {isAllowed ? '啟用' : '停用'}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleFeaturePermission(feature.name)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:ring-offset-2 ${
                        isAllowed ? 'bg-[#FFD59A]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                        isAllowed ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* 調試信息 */}
      <div className="border-t border-[#EADBC8] pt-4">
        <details className="text-xs">
          <summary className="cursor-pointer text-[#4B4036] font-medium mb-2">
            調試信息 (點擊展開)
          </summary>
          <div className="p-3 bg-gray-100 rounded-lg text-xs font-mono">
            <div><strong>角色名稱:</strong> {formData.role_name}</div>
            <div><strong>顯示名稱:</strong> {formData.display_name}</div>
            <div><strong>角色權限:</strong> {JSON.stringify(formData.permissions, null, 2)}</div>
          </div>
        </details>
      </div>

      <div className="flex space-x-2">
        <HanamiButton type="submit" variant="primary" size="md">
          {initialData ? '更新' : '創建'}
        </HanamiButton>
        <HanamiButton type="button" onClick={onCancel} variant="secondary" size="md">
          取消
        </HanamiButton>
      </div>
    </form>
  );
}

// 權限表單組件
function PermissionForm({ 
  roles, 
  initialData,
  onSubmit, 
  onCancel 
}: { 
  roles: Role[]; 
  initialData?: UserPermission;
  onSubmit: (data: any) => void; 
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState(() => {
    const defaultCustomPermissions = {
      pages: {
        '/admin/*': { access: 'deny', operations: [] },
        '/teacher/*': { access: 'deny', operations: [] },
        '/parent/*': { access: 'deny', operations: [] }
      },
      features: {
        'user_management': { access: 'deny', operations: [] },
        'permission_management': { access: 'deny', operations: [] },
        'system_settings': { access: 'deny', operations: [] },
        'student_management': { access: 'deny', operations: [] },
        'teacher_management': { access: 'deny', operations: [] },
        'course_management': { access: 'deny', operations: [] },
        'ai_tools': { access: 'deny', operations: [] }
      }
    };

    return {
      user_email: initialData?.user_email || '',
      user_phone: initialData?.user_phone || '',
      role_id: initialData?.role_id || '',
      status: initialData?.status || 'pending',
      custom_permissions: initialData?.custom_permissions || defaultCustomPermissions,
      student_access_list: initialData?.student_access_list || [],
      page_access_list: initialData?.page_access_list || [],
      feature_access_list: initialData?.feature_access_list || []
    };
  });

  // 獲取角色的預設權限
  const getRolePermissions = (roleId: string) => {
    const selectedRole = roles.find(role => role.id === roleId);
    return selectedRole?.permissions || {
      pages: {},
      features: {},
      data: {}
    };
  };

  // PopupSelect 狀態
  const [showRolePopup, setShowRolePopup] = useState(false);
  const [showStatusPopup, setShowStatusPopup] = useState(false);

  // 當角色改變時，載入該角色的預設權限
  useEffect(() => {
    if (formData.role_id && !initialData?.custom_permissions) {
      const rolePermissions = getRolePermissions(formData.role_id);
      
      // 合併角色權限和自定義權限
      const mergedPermissions = {
        pages: {
          ...formData.custom_permissions.pages,
          ...rolePermissions.pages
        },
        features: {
          ...formData.custom_permissions.features,
          ...rolePermissions.features
        }
      };

      setFormData(prev => ({
        ...prev,
        custom_permissions: mergedPermissions
      }));
    }
  }, [formData.role_id, roles, initialData?.custom_permissions]);

  // 獲取當前選中角色的名稱
  const getCurrentRoleName = () => {
    const selectedRole = roles.find(role => role.id === formData.role_id);
    return selectedRole?.role_name || 'admin';
  };

  // 篩選狀態
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'teacher' | 'parent'>('all');

  // 批量操作函數
  const handleBatchOperation = (role: string, access: 'allow' | 'deny') => {
    const updatedPermissions = { ...formData.custom_permissions };
    
    // 批量設置頁面權限
    allPages
      .filter(page => role === 'all' || page.role === role)
      .forEach(page => {
        updatedPermissions.pages[page.path] = {
          access,
          operations: access === 'allow' ? ['view', 'create', 'edit', 'delete'] : []
        };
      });
    
    // 批量設置功能權限
    allFeatures
      .filter(feature => role === 'all' || feature.role === role)
      .forEach(feature => {
        updatedPermissions.features[feature.name] = {
          access,
          operations: access === 'allow' ? ['view', 'create', 'edit', 'delete'] : []
        };
      });
    
    setFormData(prev => ({
      ...prev,
      custom_permissions: updatedPermissions
    }));
  };

  // 統一的頁面權限列表 - 包含所有角色的頁面
  const allPages = [
    // 管理員頁面
    { path: '/admin/*', label: '管理員頁面', description: '所有管理員相關頁面', role: 'admin', icon: AdminIcon },
    { path: '/admin/students', label: '學生管理', description: '學生管理頁面', role: 'admin', icon: StudentIcon },
    { path: '/admin/teachers', label: '教師管理', description: '教師管理頁面', role: 'admin', icon: TeacherIcon },
    { path: '/admin/class-management', label: '課程管理', description: '課程管理頁面', role: 'admin', icon: CourseIcon },
    { path: '/admin/schedule-management', label: '排程管理', description: '排程管理頁面', role: 'admin', icon: ScheduleIcon },
    { path: '/admin/ai-hub', label: 'AI 工具', description: 'AI 工具中心', role: 'admin', icon: AIIcon },
    { path: '/admin/permission-management', label: '權限管理', description: '權限管理頁面', role: 'admin', icon: PermissionIcon },
    { path: '/admin/student-progress', label: '學生進度', description: '學生進度管理', role: 'admin', icon: ProgressIcon },
    { path: '/admin/resource-library', label: '資源庫', description: '教學資源庫', role: 'admin', icon: ResourceIcon },
    { path: '/admin/trial-queue', label: '試聽隊列', description: '試聽學生管理', role: 'admin', icon: TrialIcon },
    { path: '/admin/registration-requests', label: '註冊申請', description: '用戶註冊申請管理', role: 'admin', icon: RegistrationIcon },
    
    // 教師頁面
    { path: '/teacher/*', label: '教師頁面', description: '所有教師相關頁面', role: 'teacher', icon: TeacherIcon },
    { path: '/teacher/dashboard', label: '教師儀表板', description: '教師儀表板', role: 'teacher', icon: DashboardIcon },
    { path: '/teacher/profile', label: '個人資料', description: '教師個人資料管理', role: 'teacher', icon: ProfileIcon },
    { path: '/teacher/students', label: '學生管理', description: '教師的學生管理', role: 'teacher', icon: StudentIcon },
    { path: '/teacher/lessons', label: '課程記錄', description: '課程記錄管理', role: 'teacher', icon: PageIcon },
    { path: '/teacher/schedule', label: '課程安排', description: '個人課程安排', role: 'teacher', icon: ScheduleIcon },
    { path: '/teacher/progress', label: '學生進度', description: '學生學習進度', role: 'teacher', icon: ProgressIcon },
    { path: '/teacher/media', label: '媒體管理', description: '學生作品管理', role: 'teacher', icon: MediaIcon },
    
    // 家長頁面
    { path: '/parent/*', label: '家長頁面', description: '所有家長相關頁面', role: 'parent', icon: ProfileIcon },
    { path: '/parent/dashboard', label: '家長儀表板', description: '家長儀表板', role: 'parent', icon: DashboardIcon },
    { path: '/parent/profile', label: '個人資料', description: '家長個人資料', role: 'parent', icon: ProfileIcon },
    { path: '/parent/children', label: '子女管理', description: '子女資料管理', role: 'parent', icon: ChildIcon },
    { path: '/parent/progress', label: '學習進度', description: '子女學習進度', role: 'parent', icon: ProgressIcon },
    { path: '/parent/schedule', label: '課程安排', description: '子女課程安排', role: 'parent', icon: ScheduleIcon },
    { path: '/parent/media', label: '作品展示', description: '子女作品展示', role: 'parent', icon: MediaIcon },
  ];

  // 統一的功能權限列表 - 包含所有角色的功能
  const allFeatures = [
    // 管理員功能
    { name: 'user_management', label: '用戶管理', description: '管理用戶帳號和權限', role: 'admin', icon: UserManagementIcon },
    { name: 'permission_management', label: '權限管理', description: '管理角色和權限', role: 'admin', icon: PermissionIcon },
    { name: 'system_settings', label: '系統設定', description: '系統配置和設定', role: 'admin', icon: SettingsIcon },
    { name: 'student_management', label: '學生管理', description: '學生資料管理', role: 'admin', icon: StudentIcon },
    { name: 'teacher_management', label: '教師管理', description: '教師資料管理', role: 'admin', icon: TeacherIcon },
    { name: 'course_management', label: '課程管理', description: '課程和排程管理', role: 'admin', icon: CourseIcon },
    { name: 'ai_tools', label: 'AI 工具', description: 'AI 輔助功能', role: 'admin', icon: AIIcon },
    { name: 'data_export', label: '數據導出', description: '數據導出功能', role: 'admin', icon: ExportIcon },
    { name: 'financial_data', label: '財務數據', description: '財務數據管理', role: 'admin', icon: FinanceIcon },
    
    // 教師功能
    { name: 'lesson_management', label: '課程記錄', description: '課程記錄管理', role: 'teacher', icon: LessonIcon },
    { name: 'student_progress', label: '學生進度', description: '學生學習進度追蹤', role: 'teacher', icon: ProgressIcon },
    { name: 'media_management', label: '媒體管理', description: '學生作品管理', role: 'teacher', icon: MediaIcon },
    { name: 'growth_tree_management', label: '成長樹管理', description: '學生成長樹管理', role: 'teacher', icon: GrowthSparklesIcon },
    { name: 'ability_development', label: '發展能力圖卡', description: '能力發展圖卡', role: 'teacher', icon: AbilityIcon },
    { name: 'teaching_activities', label: '教學活動管理', description: '教學活動管理', role: 'teacher', icon: ActivityIcon },
    { name: 'ability_assessment', label: '能力評估管理', description: '學生能力評估', role: 'teacher', icon: AssessmentIcon },
    { name: 'schedule_management', label: '排程管理', description: '個人課程排程', role: 'teacher', icon: ScheduleIcon },
    
    // 家長功能
    { name: 'child_info', label: '子女資訊', description: '查看子女基本資訊', role: 'parent', icon: ChildIcon },
    { name: 'progress_tracking', label: '進度追蹤', description: '追蹤子女學習進度', role: 'parent', icon: ProgressIcon },
    { name: 'lesson_records', label: '課程記錄', description: '查看子女課程記錄', role: 'parent', icon: LessonIcon },
    { name: 'media_viewing', label: '作品查看', description: '查看子女作品', role: 'parent', icon: MediaIcon },
    { name: 'communication', label: '溝通功能', description: '與教師溝通', role: 'parent', icon: CommunicationIcon },
    { name: 'schedule_viewing', label: '課程安排查看', description: '查看子女課程安排', role: 'parent', icon: ScheduleIcon },
  ];

  // 切換頁面權限
  const togglePagePermission = (pagePath: string) => {
    const currentPermission = formData.custom_permissions.pages?.[pagePath];
    const newAccess = currentPermission?.access === 'allow' ? 'deny' : 'allow';
    
    setFormData(prev => ({
      ...prev,
      custom_permissions: {
        ...prev.custom_permissions,
        pages: {
          ...prev.custom_permissions.pages,
          [pagePath]: {
            access: newAccess,
            operations: newAccess === 'allow' ? ['view', 'create', 'edit', 'delete'] : []
          }
        }
      }
    }));
  };

  // 切換功能權限
  const toggleFeaturePermission = (featureName: string) => {
    const currentPermission = formData.custom_permissions.features?.[featureName];
    const newAccess = currentPermission?.access === 'allow' ? 'deny' : 'allow';
    
    setFormData(prev => ({
      ...prev,
      custom_permissions: {
        ...prev.custom_permissions,
        features: {
          ...prev.custom_permissions.features,
          [featureName]: {
            access: newAccess,
            operations: newAccess === 'allow' ? ['view', 'create', 'edit', 'delete'] : []
          }
        }
      }
    }));
  };



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('PermissionForm 提交數據:', formData);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#4B4036] mb-1">
          用戶郵箱
        </label>
        <HanamiInput
          value={formData.user_email}
          onChange={(value) => setFormData({ ...formData, user_email: value })}
          placeholder="user@example.com"
          type="email"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-[#4B4036] mb-1">
          用戶電話
        </label>
        <HanamiInput
          value={formData.user_phone}
          onChange={(value) => setFormData({ ...formData, user_phone: value })}
          placeholder="+886 912 345 678"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-[#4B4036] mb-1">
          角色
        </label>
        <button
          type="button"
          onClick={() => setShowRolePopup(true)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#A64B2A] text-left bg-white"
        >
          {formData.role_id ? roles.find(r => r.id === formData.role_id)?.display_name : '請選擇角色'}
        </button>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-[#4B4036] mb-1">
          狀態
        </label>
        <button
          type="button"
          onClick={() => setShowStatusPopup(true)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#A64B2A] text-left bg-white"
        >
          {formData.status === 'pending' ? '待審核' : 
           formData.status === 'approved' ? '已批准' : 
           formData.status === 'rejected' ? '已拒絕' : 
           formData.status === 'suspended' ? '已暫停' : '請選擇狀態'}
        </button>
      </div>

      {/* 當前角色信息 */}
      {formData.role_id && (
        <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="text-sm font-medium text-green-800">
              當前選擇角色: {roles.find(r => r.id === formData.role_id)?.display_name}
            </span>
          </div>
          <div className="text-xs text-green-700 mb-1">
            角色描述: {roles.find(r => r.id === formData.role_id)?.description}
          </div>
          <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
            提示: 選擇角色後，系統會自動載入該角色的預設權限。您可以在此基礎上進行自定義調整。
          </div>
        </div>
      )}

      {/* 統一權限控制 */}
      <div className="border-t border-[#EADBC8] pt-4">
        <h4 className="text-lg font-semibold text-[#4B4036] mb-3">統一權限控制</h4>
        
        {/* 角色篩選器 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#4B4036] mb-2">篩選角色</label>
          <div className="flex space-x-2">
            {['all', 'admin', 'teacher', 'parent'].map((role) => (
          <button
                key={role}
            type="button"
                onClick={() => setFilterRole(role as any)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filterRole === role
                    ? 'bg-[#FFD59A] text-[#4B4036]'
                    : 'bg-[#F9F2EF] text-[#8B7355] hover:bg-[#EADBC8]'
                }`}
              >
                {role === 'all' ? '全部' : role === 'admin' ? '管理員' : role === 'teacher' ? '教師' : '家長'}
          </button>
            ))}
        </div>
        </div>

                  {/* 權限列表 */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {/* 頁面權限 */}
            <div>
              <h5 className="text-md font-medium text-[#4B4036] mb-3 flex items-center">
                <PageIcon className="w-5 h-5 mr-2 text-[#FFD59A]" />
                頁面權限
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {allPages
                  .filter(page => filterRole === 'all' || page.role === filterRole)
                  .map((page) => {
            const isAllowed = formData.custom_permissions.pages?.[page.path]?.access === 'allow';
                    const IconComponent = page.icon;
            return (
                      <div key={page.path} className="flex items-center justify-between p-3 bg-[#FFF9F2] rounded-lg border border-[#EADBC8] hover:bg-[#F9F2EF] transition-colors">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <IconComponent className="w-5 h-5 text-[#FFD59A]" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-[#4B4036] text-sm truncate">{page.label}</div>
                            <div className="text-xs text-[#8B7355] truncate">{page.description}</div>
                            <div className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                              page.role === 'admin' 
                                ? 'text-[#A64B2A] bg-[#FFE0E0]' 
                                : page.role === 'teacher' 
                                ? 'text-[#2B3A3B] bg-[#E0F2E0]' 
                                : 'text-[#4B4036] bg-[#EADBC8]'
                            }`}>
                              {page.role === 'admin' ? '管理員' : page.role === 'teacher' ? '教師' : '家長'}
                </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-3">
                          <span className={`text-xs font-medium ${isAllowed ? 'text-green-600' : 'text-red-600'}`}>
                    {isAllowed ? '啟用' : '停用'}
                  </span>
                  <button
                    type="button"
                    onClick={() => togglePagePermission(page.path)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:ring-offset-1 ${
                              isAllowed ? 'bg-[#4CAF50]' : 'bg-[#EADBC8]'
                    }`}
                  >
                    <span
                              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                                isAllowed ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

            {/* 功能權限 */}
            <div>
              <h5 className="text-md font-medium text-[#4B4036] mb-3 flex items-center">
                <FeatureIcon className="w-5 h-5 mr-2 text-[#FFD59A]" />
                功能權限
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {allFeatures
                  .filter(feature => filterRole === 'all' || feature.role === filterRole)
                  .map((feature) => {
            const isAllowed = formData.custom_permissions.features?.[feature.name]?.access === 'allow';
                    const IconComponent = feature.icon;
            return (
                      <div key={feature.name} className="flex items-center justify-between p-3 bg-[#FFF9F2] rounded-lg border border-[#EADBC8] hover:bg-[#F9F2EF] transition-colors">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <IconComponent className="w-5 h-5 text-[#FFD59A]" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-[#4B4036] text-sm truncate">{feature.label}</div>
                            <div className="text-xs text-[#8B7355] truncate">{feature.description}</div>
                            <div className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                              feature.role === 'admin' 
                                ? 'text-[#A64B2A] bg-[#FFE0E0]' 
                                : feature.role === 'teacher' 
                                ? 'text-[#2B3A3B] bg-[#E0F2E0]' 
                                : 'text-[#4B4036] bg-[#EADBC8]'
                            }`}>
                              {feature.role === 'admin' ? '管理員' : feature.role === 'teacher' ? '教師' : '家長'}
                </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-3">
                          <span className={`text-xs font-medium ${isAllowed ? 'text-green-600' : 'text-red-600'}`}>
                    {isAllowed ? '啟用' : '停用'}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleFeaturePermission(feature.name)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:ring-offset-1 ${
                              isAllowed ? 'bg-[#4CAF50]' : 'bg-[#EADBC8]'
                    }`}
                  >
                    <span
                              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                                isAllowed ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
              </div>
            </div>
          </div>

                  {/* 批量操作 */}
          <div className="mt-4 pt-4 border-t border-[#EADBC8]">
            <h5 className="text-md font-medium text-[#4B4036] mb-3">批量操作</h5>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleBatchOperation('all', 'allow')}
                className="px-3 py-1 bg-[#4CAF50] text-white rounded-lg text-sm font-medium hover:bg-[#45a049] transition-colors"
              >
                全部啟用
              </button>
              <button
                type="button"
                onClick={() => handleBatchOperation('all', 'deny')}
                className="px-3 py-1 bg-[#F44336] text-white rounded-lg text-sm font-medium hover:bg-[#d32f2f] transition-colors"
              >
                全部停用
              </button>
              <button
                type="button"
                onClick={() => handleBatchOperation(filterRole, 'allow')}
                className="px-3 py-1 bg-[#FFD59A] text-[#4B4036] rounded-lg text-sm font-medium hover:bg-[#EBC9A4] transition-colors"
              >
                當前角色全部啟用
              </button>
              <button
                type="button"
                onClick={() => handleBatchOperation(filterRole, 'deny')}
                className="px-3 py-1 bg-[#EADBC8] text-[#4B4036] rounded-lg text-sm font-medium hover:bg-[#D4C4B8] transition-colors"
              >
                當前角色全部停用
              </button>
            </div>
        </div>
      </div>

      {/* 學生訪問控制 */}
      <div className="border-t border-[#EADBC8] pt-4">
        <h4 className="text-lg font-semibold text-[#4B4036] mb-3">學生訪問控制</h4>
        <div className="space-y-2">
          <div className="p-3 bg-gradient-to-r from-[#FFF9F2] to-[#FFF3E0] rounded-lg border border-[#EADBC8]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#FFD59A] rounded-full"></div>
                <span className="text-sm font-medium text-[#4B4036]">
                  可訪問的學生數量: {formData.student_access_list.length}
                </span>
              </div>
              <span className="text-xs text-[#4B4036] bg-[#FFD59A] px-2 py-1 rounded-full">
                支持常規和試堂學生
              </span>
            </div>
            
            {/* 學生選擇器 */}
            <StudentSelector
              selectedStudents={formData.student_access_list}
              onSelectionChange={(studentIds) => {
                setFormData(prev => ({ ...prev, student_access_list: studentIds }));
              }}
            />
          </div>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <HanamiButton type="submit" variant="primary" size="md">
          {initialData ? '更新' : '創建'}
        </HanamiButton>
        <HanamiButton type="button" onClick={onCancel} variant="secondary" size="md">
          取消
        </HanamiButton>
      </div>

      {/* PopupSelect 組件 */}
      {showRolePopup && (
        <PopupSelect
          title="選擇角色"
          options={roles.map(role => ({
            label: role.display_name,
            value: role.id
          }))}
          selected={formData.role_id}
          onChange={(value) => {
            const roleId = Array.isArray(value) ? value[0] : value;
            const rolePermissions = getRolePermissions(roleId);
            
            // 合併角色權限和現有自定義權限
            const mergedPermissions = {
              pages: {
                ...formData.custom_permissions.pages,
                ...rolePermissions.pages
              },
              features: {
                ...formData.custom_permissions.features,
                ...rolePermissions.features
              }
            };

            setFormData(prev => ({
              ...prev,
              role_id: roleId,
              custom_permissions: mergedPermissions
            }));
          }}
          onConfirm={() => setShowRolePopup(false)}
          onCancel={() => setShowRolePopup(false)}
          mode="single"
        />
      )}

      {showStatusPopup && (
        <PopupSelect
          title="選擇狀態"
          options={[
            { label: '待審核', value: 'pending' },
            { label: '已批准', value: 'approved' },
            { label: '已拒絕', value: 'rejected' },
            { label: '已暫停', value: 'suspended' }
          ]}
          selected={formData.status}
          onChange={(value) => {
            const status = Array.isArray(value) ? value[0] : value;
            setFormData(prev => ({ ...prev, status }));
          }}
          onConfirm={() => setShowStatusPopup(false)}
          onCancel={() => setShowStatusPopup(false)}
          mode="single"
        />
      )}
    </form>
  );
} 