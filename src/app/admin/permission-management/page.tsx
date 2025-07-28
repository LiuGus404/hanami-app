'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import HanamiInput from '@/components/ui/HanamiInput';
import HanamiSelect from '@/components/ui/HanamiSelect';
import StudentSelector from '@/components/ui/StudentSelector';
import { PopupSelect } from '@/components/ui/PopupSelect';

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
        // 批准：創建用戶權限後刪除註冊申請
        console.log('批准申請，創建用戶權限...');
        
        // 創建用戶權限記錄
        await createUserPermissionsFromRequest(request);
        
        console.log('用戶權限創建成功，刪除註冊申請...');
        
        // 刪除註冊申請
        const deleteResponse = await fetch(`/api/registration-requests?id=${requestId}`, {
          method: 'DELETE',
        });

        if (!deleteResponse.ok) {
          const errorText = await deleteResponse.text();
          console.error('刪除 API 錯誤響應:', errorText);
          throw new Error(`刪除申請失敗: ${errorText}`);
        }

        console.log('成功刪除已批准的申請');
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
      console.log('開始創建用戶權限，申請:', request); // Added
      
      // 獲取角色ID
      const roleId = await getRoleId(request.role);
      console.log('獲取到角色ID:', roleId); // Added
      
      // 創建用戶權限記錄
      const permissionData = {
        user_email: request.email,
        user_phone: request.phone,
        role_id: roleId,
        status: 'approved',
        is_active: true
      };

      console.log('準備創建的權限數據:', permissionData); // Added

      const response = await fetch('/api/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_user_permission',
          data: permissionData
        }),
      });

      console.log('權限創建 API 響應狀態:', response.status); // Added

      if (!response.ok) {
        const errorText = await response.text(); // Added
        console.error('權限創建 API 錯誤響應:', errorText); // Added
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText };
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('權限創建成功響應:', result); // Added
      console.log('成功創建用戶權限:', request.email);
    } catch (err) {
      console.error('創建用戶權限錯誤:', err);
      throw err;
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
            <HanamiButton
              onClick={() => setShowPermissionForm(true)}
              variant="primary"
              size="md"
            >
              <span className="mr-2">➕</span>
              新增權限
            </HanamiButton>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg shadow">
              <thead className="bg-[#FFD59A]">
                <tr>
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
                      <HanamiButton
                        onClick={() => setSelectedPermission(permission)}
                        variant="secondary"
                        size="sm"
                      >
                        編輯
                      </HanamiButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

    return {
      role_name: initialData?.role_name || '',
      display_name: initialData?.display_name || '',
      description: initialData?.description || '',
      is_system_role: initialData?.is_system_role || false,
      permissions: initialData?.permissions || defaultPermissions
    };
  });

  // 預定義的頁面列表
  const predefinedPages = [
    { path: '/admin/*', label: '管理員頁面', description: '所有管理員相關頁面' },
    { path: '/admin/students', label: '學生管理', description: '學生管理頁面' },
    { path: '/admin/teachers', label: '教師管理', description: '教師管理頁面' },
    { path: '/admin/class-management', label: '課程管理', description: '課程管理頁面' },
    { path: '/admin/schedule-management', label: '排程管理', description: '排程管理頁面' },
    { path: '/admin/ai-hub', label: 'AI 工具', description: 'AI 工具中心' },
    { path: '/admin/permission-management', label: '權限管理', description: '權限管理頁面' },
    { path: '/admin/student-progress', label: '學生進度', description: '學生進度管理' },
    { path: '/admin/resource-library', label: '資源庫', description: '教學資源庫' },
    { path: '/teacher/*', label: '教師頁面', description: '所有教師相關頁面' },
    { path: '/teacher/dashboard', label: '教師儀表板', description: '教師儀表板' },
    { path: '/parent/*', label: '家長頁面', description: '所有家長相關頁面' },
    { path: '/parent/dashboard', label: '家長儀表板', description: '家長儀表板' }
  ];

  // 預定義的功能列表
  const predefinedFeatures = [
    { name: 'user_management', label: '用戶管理', description: '管理用戶帳號和權限' },
    { name: 'permission_management', label: '權限管理', description: '管理角色和權限' },
    { name: 'system_settings', label: '系統設定', description: '系統配置和設定' },
    { name: 'student_management', label: '學生管理', description: '學生資料管理' },
    { name: 'teacher_management', label: '教師管理', description: '教師資料管理' },
    { name: 'course_management', label: '課程管理', description: '課程和排程管理' },
    { name: 'ai_tools', label: 'AI 工具', description: 'AI 輔助功能' },
    { name: 'lesson_management', label: '課程記錄', description: '課程記錄管理' },
    { name: 'student_progress', label: '學生進度', description: '學生學習進度追蹤' },
    { name: 'media_management', label: '媒體管理', description: '學生作品管理' }
  ];

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
            access: newAccess,
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
            access: newAccess,
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
          onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
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
          onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
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

      {/* 頁面權限控制 */}
      <div className="border-t border-[#EADBC8] pt-4">
        <h4 className="text-lg font-semibold text-[#4B4036] mb-3">頁面權限控制</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {predefinedPages.map((page) => {
            const isAllowed = formData.permissions.pages?.[page.path]?.access === 'allow';
            return (
              <div key={page.path} className="flex items-center justify-between p-3 bg-[#FFF9F2] rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-[#4B4036]">{page.label}</div>
                  <div className="text-sm text-[#2B3A3B]">{page.description}</div>
                  <div className="text-xs text-[#2B3A3B] opacity-75">{page.path}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${isAllowed ? 'text-green-600' : 'text-red-600'}`}>
                    {isAllowed ? '啟用' : '停用'}
                  </span>
                  <button
                    type="button"
                    onClick={() => togglePagePermission(page.path)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:ring-offset-2 ${
                      isAllowed ? 'bg-green-500' : 'bg-gray-300'
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
          {predefinedFeatures.map((feature) => {
            const isAllowed = formData.permissions.features?.[feature.name]?.access === 'allow';
            return (
              <div key={feature.name} className="flex items-center justify-between p-3 bg-[#FFF9F2] rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-[#4B4036]">{feature.label}</div>
                  <div className="text-sm text-[#2B3A3B]">{feature.description}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${isAllowed ? 'text-green-600' : 'text-red-600'}`}>
                    {isAllowed ? '啟用' : '停用'}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleFeaturePermission(feature.name)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:ring-offset-2 ${
                      isAllowed ? 'bg-green-500' : 'bg-gray-300'
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
            <div><strong>當前角色ID:</strong> {formData.role_id}</div>
            <div><strong>角色權限:</strong> {JSON.stringify(getRolePermissions(formData.role_id), null, 2)}</div>
            <div><strong>自定義權限:</strong> {JSON.stringify(formData.custom_permissions, null, 2)}</div>
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

  // 預定義的頁面列表
  const predefinedPages = [
    { path: '/admin/*', label: '管理員頁面', description: '所有管理員相關頁面' },
    { path: '/admin/students', label: '學生管理', description: '學生管理頁面' },
    { path: '/admin/teachers', label: '教師管理', description: '教師管理頁面' },
    { path: '/admin/class-management', label: '課程管理', description: '課程管理頁面' },
    { path: '/admin/schedule-management', label: '排程管理', description: '排程管理頁面' },
    { path: '/admin/ai-hub', label: 'AI 工具', description: 'AI 工具中心' },
    { path: '/admin/permission-management', label: '權限管理', description: '權限管理頁面' },
    { path: '/admin/student-progress', label: '學生進度', description: '學生進度管理' },
    { path: '/admin/resource-library', label: '資源庫', description: '教學資源庫' },
    { path: '/teacher/*', label: '教師頁面', description: '所有教師相關頁面' },
    { path: '/teacher/dashboard', label: '教師儀表板', description: '教師儀表板' },
    { path: '/parent/*', label: '家長頁面', description: '所有家長相關頁面' },
    { path: '/parent/dashboard', label: '家長儀表板', description: '家長儀表板' }
  ];

  // 預定義的功能列表
  const predefinedFeatures = [
    { name: 'user_management', label: '用戶管理', description: '管理用戶帳號和權限' },
    { name: 'permission_management', label: '權限管理', description: '管理角色和權限' },
    { name: 'system_settings', label: '系統設定', description: '系統配置和設定' },
    { name: 'student_management', label: '學生管理', description: '學生資料管理' },
    { name: 'teacher_management', label: '教師管理', description: '教師資料管理' },
    { name: 'course_management', label: '課程管理', description: '課程和排程管理' },
    { name: 'ai_tools', label: 'AI 工具', description: 'AI 輔助功能' },
    { name: 'lesson_management', label: '課程記錄', description: '課程記錄管理' },
    { name: 'student_progress', label: '學生進度', description: '學生學習進度追蹤' },
    { name: 'media_management', label: '媒體管理', description: '學生作品管理' }
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

      {/* 頁面權限控制 */}
      <div className="border-t border-[#EADBC8] pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-[#4B4036]">頁面權限控制</h4>
          <button
            type="button"
            onClick={() => {
              const rolePermissions = getRolePermissions(formData.role_id);
              setFormData(prev => ({
                ...prev,
                custom_permissions: {
                  ...prev.custom_permissions,
                  pages: rolePermissions.pages || {}
                }
              }));
            }}
            className="px-3 py-1 text-sm bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors"
          >
            重置為角色預設
          </button>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {predefinedPages.map((page) => {
            const isAllowed = formData.custom_permissions.pages?.[page.path]?.access === 'allow';
            return (
              <div key={page.path} className="flex items-center justify-between p-3 bg-[#FFF9F2] rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-[#4B4036]">{page.label}</div>
                  <div className="text-sm text-[#2B3A3B]">{page.description}</div>
                  <div className="text-xs text-[#2B3A3B] opacity-75">{page.path}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${isAllowed ? 'text-green-600' : 'text-red-600'}`}>
                    {isAllowed ? '啟用' : '停用'}
                  </span>
                  <button
                    type="button"
                    onClick={() => togglePagePermission(page.path)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:ring-offset-2 ${
                      isAllowed ? 'bg-green-500' : 'bg-gray-300'
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
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-[#4B4036]">功能權限控制</h4>
          <button
            type="button"
            onClick={() => {
              const rolePermissions = getRolePermissions(formData.role_id);
              setFormData(prev => ({
                ...prev,
                custom_permissions: {
                  ...prev.custom_permissions,
                  features: rolePermissions.features || {}
                }
              }));
            }}
            className="px-3 py-1 text-sm bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors"
          >
            重置為角色預設
          </button>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {predefinedFeatures.map((feature) => {
            const isAllowed = formData.custom_permissions.features?.[feature.name]?.access === 'allow';
            return (
              <div key={feature.name} className="flex items-center justify-between p-3 bg-[#FFF9F2] rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-[#4B4036]">{feature.label}</div>
                  <div className="text-sm text-[#2B3A3B]">{feature.description}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${isAllowed ? 'text-green-600' : 'text-red-600'}`}>
                    {isAllowed ? '啟用' : '停用'}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleFeaturePermission(feature.name)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:ring-offset-2 ${
                      isAllowed ? 'bg-green-500' : 'bg-gray-300'
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