'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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

export default function RegistrationRequestsPage() {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  // 組件載入時獲取數據
  useEffect(() => {
    fetchRequests();
  }, []);

  // 獲取註冊申請列表
  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('開始獲取註冊申請...');
      
      // 使用 fetch API 而不是 Supabase 客戶端，避免認證問題
      const response = await fetch('/api/registration-requests', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('API 響應狀態:', response.status);
      console.log('API 響應頭:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 錯誤響應:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const result = await response.json();
      console.log('獲取到的註冊申請:', result);
      console.log('數據類型:', typeof result);
      console.log('數據結構:', Object.keys(result));
      console.log('數據長度:', result.data?.length || 0);
      
      const newRequests = result.data || [];
      setRequests(newRequests);
      console.log('設置到 state 的數據:', newRequests);
      console.log('數據設置完成，長度:', newRequests.length);
    } catch (err) {
      console.error('獲取申請列表錯誤:', err);
      setError('獲取申請列表失敗: ' + (err instanceof Error ? err.message : '未知錯誤'));
    } finally {
      setLoading(false);
    }
  };

  // 審核申請
  const handleReview = async (requestId: string, status: 'approved' | 'rejected', rejectionReason?: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const request = requests.find(r => r.id === requestId);
      if (!request) {
        throw new Error('找不到申請記錄');
      }

      console.log('審核申請:', { request, status, rejectionReason });

      // 更新申請狀態
      const response = await fetch('/api/registration-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: requestId,
          status: status,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新失敗');
      }

      // 如果批准，創建用戶權限記錄和用戶帳號
      if (status === 'approved') {
        try {
          console.log('開始批准流程...');
          
          // 1. 創建用戶權限記錄
          console.log('步驟 1: 創建用戶權限記錄...');
          try {
            await createUserPermissions(request);
            console.log('✅ 用戶權限記錄創建成功');
          } catch (permError) {
            console.error('❌ 權限記錄創建失敗:', permError);
            throw new Error(`權限記錄創建失敗: ${permError instanceof Error ? permError.message : '未知錯誤'}`);
          }
          
          // 2. 創建實際用戶帳號
          console.log('步驟 2: 創建實際用戶帳號...');
          try {
            await createUserAccount(request);
            console.log('✅ 用戶帳號創建成功');
          } catch (accountError) {
            console.error('❌ 用戶帳號創建失敗:', accountError);
            throw new Error(`用戶帳號創建失敗: ${accountError instanceof Error ? accountError.message : '未知錯誤'}`);
          }
          
          // 3. 刪除註冊申請（只有在權限和帳號都創建成功後才刪除）
          console.log('步驟 3: 刪除註冊申請...');
          const deleteResponse = await fetch('/api/registration-requests', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: requestId }),
          });

          if (!deleteResponse.ok) {
            console.warn('刪除註冊申請失敗，但不影響用戶帳號創建');
          } else {
            console.log('✅ 註冊申請已刪除');
          }
          
          console.log('註冊申請已批准！用戶帳號已自動創建，用戶將使用註冊時設定的密碼登入。');
          setRequests(requests.filter(req => req.id !== requestId));
        } catch (createError) {
          console.error('創建用戶帳號或權限記錄失敗:', createError);
          setError(`批准成功，但創建用戶帳號失敗: ${createError instanceof Error ? createError.message : '未知錯誤'}`);
          console.log('批准成功，但創建用戶帳號失敗');
        }
      } else {
        console.log('申請已拒絕');
        setSuccess(`申請已拒絕`);
      }
      
      fetchRequests(); // 重新獲取列表
    } catch (err) {
      console.error('審核錯誤:', err);
      setError(err instanceof Error ? err.message : '審核失敗');
    } finally {
      setLoading(false);
    }
  };

  // 創建用戶權限記錄
  const createUserPermissions = async (request: RegistrationRequest) => {
    try {
      console.log('開始創建用戶權限記錄...');
      console.log('申請:', request);
      
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

      console.log('找到角色:', roleData);

      // 3. 創建權限記錄
      const { data: newPermission, error: insertError } = await supabase
        .from('hanami_user_permissions_v2')
        .insert({
          user_email: request.email,
          user_phone: request.phone || '',
          role_id: roleData.id,
          status: 'approved',
          is_active: true
        })
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

  // 創建用戶帳號
  const createUserAccount = async (request: RegistrationRequest) => {
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
          const { error: adminError } = await supabase
            .from('hanami_admin')
            .insert({
              admin_email: request.email,
              admin_name: request.full_name,
              role: 'admin',
              admin_password: userPassword
            });
          
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
          
          const { data: newTeacher, error: teacherError } = await supabase
            .from('hanami_employee')
            .insert(teacherData)
            .select();
          
          if (teacherError) {
            console.error('創建教師帳號錯誤:', teacherError);
            console.error('錯誤詳情:', teacherError);
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
          
          const { data: newParent, error: parentError } = await supabase
            .from('hanami_parents')
            .insert(parentData)
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
      
      console.log(`用戶帳號創建成功: ${request.email}`);
    } catch (err) {
      console.error('創建用戶帳號錯誤:', err);
      throw new Error(`創建用戶帳號失敗: ${err instanceof Error ? err.message : '未知錯誤'}`);
    }
  };

  // 獲取角色 ID
  const getRoleId = async (roleName: string): Promise<string> => {
    const { data, error } = await supabase
      .from('hanami_roles')
      .select('id')
      .eq('role_name', roleName)
      .single();

    if (error) {
      // 如果角色不存在，創建默認角色
      const { data: newRole, error: createError } = await supabase
        .from('hanami_roles')
        .insert({
          role_name: roleName,
          role_description: `${roleName} 角色`,
          permissions: getDefaultPermissions(roleName)
        })
        .select('id')
        .single();

      if (createError) throw createError;
      return newRole.id;
    }

    return data.id;
  };

  // 獲取默認權限
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

  useEffect(() => {
    fetchRequests();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'email_confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '等待確認';
      case 'email_confirmed':
        return 'Email已確認';
      case 'approved':
        return '已批准';
      case 'rejected':
        return '已拒絕';
      default:
        return status;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-purple-600 bg-purple-100';
      case 'teacher': return 'text-blue-600 bg-blue-100';
      case 'parent': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div className="min-h-screen bg-[#FFF9F2] p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A64B2A] mx-auto"></div>
              <p className="mt-4 text-brown-600">載入中...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F2] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-brown-700">註冊申請審核</h1>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                調試: {requests.length} 條記錄, 載入中: {loading.toString()}
              </div>
              <button
                onClick={fetchRequests}
                className="px-4 py-2 bg-[#A64B2A] text-white rounded-xl hover:bg-[#8B3A1F] transition-colors"
              >
                刷新
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl">
              {success}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#FFF9F2]">
                  <th className="border border-[#EADBC8] px-4 py-3 text-left text-brown-700">申請時間</th>
                  <th className="border border-[#EADBC8] px-4 py-3 text-left text-brown-700">姓名</th>
                  <th className="border border-[#EADBC8] px-4 py-3 text-left text-brown-700">郵箱</th>
                  <th className="border border-[#EADBC8] px-4 py-3 text-left text-brown-700">電話</th>
                  <th className="border border-[#EADBC8] px-4 py-3 text-left text-brown-700">角色</th>
                  <th className="border border-[#EADBC8] px-4 py-3 text-left text-brown-700">狀態</th>
                  <th className="border border-[#EADBC8] px-4 py-3 text-left text-brown-700">操作</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-[#FFF9F2]">
                    <td className="border border-[#EADBC8] px-4 py-3 text-sm">
                      {formatDate(request.created_at)}
                    </td>
                    <td className="border border-[#EADBC8] px-4 py-3">
                      {request.full_name}
                    </td>
                    <td className="border border-[#EADBC8] px-4 py-3">
                      {request.email}
                    </td>
                    <td className="border border-[#EADBC8] px-4 py-3">
                      {request.phone || '-'}
                    </td>
                    <td className="border border-[#EADBC8] px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(request.role)}`}>
                        {request.role === 'admin' ? '管理員' : 
                         request.role === 'teacher' ? '教師' : '家長'}
                      </span>
                    </td>
                    <td className="border border-[#EADBC8] px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
                    </td>
                    <td className="border border-[#EADBC8] px-4 py-3">
                      {request.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleReview(request.id, 'approved')}
                            className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                          >
                            批准
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('請輸入拒絕原因：');
                              if (reason !== null) {
                                handleReview(request.id, 'rejected', reason);
                              }
                            }}
                            className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                          >
                            拒絕
                          </button>
                        </div>
                      )}
                      {request.status === 'rejected' && request.rejection_reason && (
                        <div className="text-xs text-red-600">
                          原因: {request.rejection_reason}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {requests.length === 0 && (
            <div className="text-center py-8 text-brown-500">
              <div>暫無註冊申請</div>
              <div className="text-sm text-gray-500 mt-2">
                調試信息: requests.length = {requests.length}, loading = {loading.toString()}
              </div>
              {error && (
                <div className="text-red-500 mt-2">
                  錯誤: {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 