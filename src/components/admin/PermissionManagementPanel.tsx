'use client';

import React, { useState, useEffect } from 'react';

import AccountForm from '@/components/admin/AccountForm';
import AccountIcon from '@/components/ui/AccountIcon';
import HanamiBadge from '@/components/ui/HanamiBadge';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import HanamiInput from '@/components/ui/HanamiInput';
import { HanamiSelect } from '@/components/ui/HanamiSelect';
import { supabase } from '@/lib/supabase';

interface UserPermission {
  id: string;
  user_id: string;
  user_type: 'admin' | 'teacher' | 'parent';
  user_email: string;
  can_view_all_students: boolean;
  can_view_all_lessons: boolean;
  can_manage_teachers: boolean;
  can_manage_students: boolean;
  can_manage_lessons: boolean;
  can_view_financial_data: boolean;
  can_export_data: boolean;
  is_active: boolean;
}

interface Teacher {
  id: string;
  teacher_fullname: string;
  teacher_email: string;
  teacher_nickname: string;
  teacher_status: string;
  teacher_phone: string | null;
  teacher_role: string | null;
  created_at: string | null;
}

interface Student {
  id: string;
  full_name: string;
  student_email: string;
  parent_email: string;
  student_teacher: string;
  nick_name: string | null;
  contact_number: string;
  student_age: number | null;
  course_type: string | null;
  student_type: string | null;
  created_at: string | null;
}

interface Admin {
  id: string;
  admin_name: string | null;
  admin_email: string | null;
  role: string | null;
  created_at: string;
}

type UserType = 'teacher' | 'student' | 'admin';
type AccountStatus = 'active' | 'inactive' | 'all';

export default function PermissionManagementPanel() {
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'permissions' | 'teachers' | 'students' | 'accounts'>('permissions');
  const [selectedUser, setSelectedUser] = useState<UserPermission | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // 帳戶管理相關狀態
  const [accountActiveTab, setAccountActiveTab] = useState<UserType>('teacher');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AccountStatus>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // 載入資料
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('開始載入權限管理資料...');
      
      // 載入老師資料
      const { data: teachersData, error: teachersError } = await supabase
        .from('hanami_employee')
        .select('*')
        .order('teacher_fullname');

      if (teachersError) {
        console.error('載入老師資料失敗:', teachersError);
        setError(`載入老師資料失敗: ${teachersError.message}`);
      } else {
        console.log('老師資料載入成功:', teachersData?.length || 0, '筆');
        setTeachers((teachersData || []) as Teacher[]);
      }

      // 載入學生資料
      const { data: studentsData, error: studentsError } = await supabase
        .from('Hanami_Students')
        .select('*')
        .order('full_name');

      if (studentsError) {
        console.error('載入學生資料失敗:', studentsError);
        setError(`載入學生資料失敗: ${studentsError.message}`);
      } else {
        console.log('學生資料載入成功:', studentsData?.length || 0, '筆');
        setStudents((studentsData || []) as Student[]);
      }

      // 載入管理員資料
      const { data: adminsData, error: adminsError } = await supabase
        .from('hanami_admin')
        .select('*')
        .order('created_at', { ascending: false });

      if (adminsError) {
        console.error('載入管理員資料失敗:', adminsError);
        setError(`載入管理員資料失敗: ${adminsError.message}`);
      } else {
        console.log('管理員資料載入成功:', adminsData?.length || 0, '筆');
        setAdmins((adminsData || []).map(a => ({
          ...a,
          created_at: a.created_at ?? '',
          admin_name: a.admin_name ?? null,
          admin_email: a.admin_email ?? null,
          role: a.role ?? null,
        })));
      }

      // 創建模擬的用戶權限資料
      const mockPermissions: UserPermission[] = [
        {
          id: '1',
          user_id: 'admin-1',
          user_type: 'admin',
          user_email: 'admin@hanami.com',
          can_view_all_students: true,
          can_view_all_lessons: true,
          can_manage_teachers: true,
          can_manage_students: true,
          can_manage_lessons: true,
          can_view_financial_data: true,
          can_export_data: true,
          is_active: true,
        },
        ...(teachersData?.map((teacher, index) => ({
          id: `teacher-${index + 1}`,
          user_id: teacher.id,
          user_type: 'teacher' as const,
          user_email: teacher.teacher_email || '',
          can_view_all_students: false,
          can_view_all_lessons: true,
          can_manage_teachers: false,
          can_manage_students: false,
          can_manage_lessons: true,
          can_view_financial_data: false,
          can_export_data: false,
          is_active: teacher.teacher_status === 'active',
        })) || []),
      ];

      console.log('權限資料創建成功:', mockPermissions.length, '筆');
      setUserPermissions(mockPermissions);

    } catch (error) {
      console.error('載入資料失敗:', error);
      setError(`載入資料失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  // 更新用戶權限
  const updateUserPermission = async (id: string, updates: Partial<UserPermission>) => {
    try {
      // 模擬更新操作
      setUserPermissions(prev => 
        prev.map(up => up.id === id ? { ...up, ...updates } : up),
      );
      
      alert('權限更新成功！');
    } catch (error) {
      console.error('更新用戶權限失敗:', error);
      alert('權限更新失敗，請重試');
    }
  };

  // 批量更新權限
  const batchUpdatePermissions = async (userType: string, updates: Partial<UserPermission>) => {
    try {
      setUserPermissions(prev => 
        prev.map(up => up.user_type === userType ? { ...up, ...updates } : up),
      );

      alert('批量更新成功！');
    } catch (error) {
      console.error('批量更新失敗:', error);
      alert('批量更新失敗，請重試');
    }
  };

  // 獲取用戶名稱
  const getUserName = (userType: string, userId: string) => {
    switch (userType) {
      case 'teacher': {
        const teacher = teachers.find(t => t.id === userId);
        return teacher ? teacher.teacher_nickname || teacher.teacher_fullname : '未知老師';
      }
      case 'parent': {
        const student = students.find(s => s.id === userId);
        return student ? `${student.full_name}的家長` : '未知家長';
      }
      case 'admin':
        return '管理員';
      default:
        return '未知用戶';
    }
  };

  // 編輯用戶權限
  const handleEditUser = (user: UserPermission) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  // 保存編輯
  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    try {
      await updateUserPermission(selectedUser.id, selectedUser);
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('保存失敗:', error);
    }
  };

  // 帳戶管理相關函數
  const getFilteredData = () => {
    let data: any[] = [];
    
    switch (accountActiveTab) {
      case 'teacher':
        data = teachers;
        break;
      case 'student':
        data = students;
        break;
      case 'admin':
        data = admins;
        break;
    }

    // 搜尋篩選
    if (searchTerm) {
      data = data.filter(item => {
        const searchFields = [
          item.teacher_fullname || item.full_name || item.admin_name,
          item.teacher_email || item.student_email || item.admin_email,
          item.teacher_nickname || item.nick_name,
        ].filter(Boolean);
        
        return searchFields.some(field => 
          field.toLowerCase().includes(searchTerm.toLowerCase()),
        );
      });
    }

    // 狀態篩選
    if (statusFilter !== 'all') {
      data = data.filter(item => {
        const status = item.teacher_status || item.student_type || item.role;
        return status === statusFilter;
      });
    }

    return data;
  };

  const handleDeleteUser = async (userId: string, userType: UserType) => {
    if (!confirm('確定要刪除此帳戶嗎？此操作無法復原。')) {
      return;
    }

    try {
      let tableName = '';
      switch (userType) {
        case 'teacher':
          tableName = 'hanami_employee';
          break;
        case 'student':
          tableName = 'Hanami_Students';
          break;
        case 'admin':
          tableName = 'hanami_admin';
          break;
      }

      const { error } = await supabase
        .from(tableName as any)
        .delete()
        .eq('id', userId);

      if (error) {
        alert(`刪除失敗：${error.message}`);
      } else {
        alert('刪除成功');
        loadData();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('刪除失敗');
    }
  };

  const handleStatusChange = async (userId: string, userType: UserType, newStatus: string) => {
    try {
      let tableName = '';
      let statusField = '';
      
      switch (userType) {
        case 'teacher':
          tableName = 'hanami_employee';
          statusField = 'teacher_status';
          break;
        case 'student':
          tableName = 'Hanami_Students';
          statusField = 'student_type';
          break;
        case 'admin':
          tableName = 'hanami_admin';
          statusField = 'role';
          break;
      }

      const { error } = await supabase
        .from(tableName as any)
        .update({ [statusField]: newStatus })
        .eq('id', userId);

      if (error) {
        alert(`狀態更新失敗：${error.message}`);
      } else {
        alert('狀態更新成功');
        loadData();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('狀態更新失敗');
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <HanamiBadge variant="default">未設定</HanamiBadge>;
    
    switch (status) {
      case 'active':
      case '在職':
        return <HanamiBadge variant="success">啟用</HanamiBadge>;
      case 'inactive':
      case '離職':
        return <HanamiBadge variant="danger">停用</HanamiBadge>;
      default:
        return <HanamiBadge variant="warning">{status}</HanamiBadge>;
    }
  };

  const handleAddAccount = () => {
    setEditingUser(null);
    setShowAddModal(true);
  };

  const handleEditAccount = (user: any) => {
    setEditingUser(user);
    setShowAddModal(true);
  };

  const handleFormSuccess = () => {
    loadData();
  };

  const handleFormClose = () => {
    setShowAddModal(false);
    setEditingUser(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD59A] mx-auto" />
          <p className="mt-4 text-lg text-[#2B3A3B]">載入權限管理系統...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <HanamiCard>
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold text-red-600 mb-2">載入失敗</h3>
            <p className="text-[#555] mb-4">{error}</p>
            <HanamiButton variant="primary" onClick={() => loadData()}>
              重新載入
            </HanamiButton>
          </div>
        </HanamiCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 標籤頁導航 */}
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          className={`px-4 py-2 font-medium rounded-t-lg ${
            activeTab === 'permissions'
              ? 'bg-[#FDE6B8] text-[#A64B2A] border-b-2 border-[#A64B2A]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('permissions')}
        >
          用戶權限 ({userPermissions.length})
        </button>
        <button
          className={`px-4 py-2 font-medium rounded-t-lg ${
            activeTab === 'teachers'
              ? 'bg-[#FDE6B8] text-[#A64B2A] border-b-2 border-[#A64B2A]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('teachers')}
        >
          老師管理 ({teachers.length})
        </button>
        <button
          className={`px-4 py-2 font-medium rounded-t-lg ${
            activeTab === 'students'
              ? 'bg-[#FDE6B8] text-[#A64B2A] border-b-2 border-[#A64B2A]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('students')}
        >
          學生管理 ({students.length})
        </button>
        <button
          className={`px-4 py-2 font-medium rounded-t-lg ${
            activeTab === 'accounts'
              ? 'bg-[#FDE6B8] text-[#A64B2A] border-b-2 border-[#A64B2A]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('accounts')}
        >
          帳戶管理
        </button>
      </div>

      {/* 權限管理內容 */}
      {activeTab === 'permissions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-[#2B3A3B]">用戶權限管理</h3>
            <HanamiButton variant="primary" onClick={() => loadData()}>
              重新載入
            </HanamiButton>
          </div>

          {/* 批量操作 */}
          <HanamiCard>
            <div className="space-y-4">
              <h4 className="font-medium text-[#2B3A3B]">批量權限設置</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#555] mb-2">老師權限</label>
                  <div className="space-y-2">
                    <HanamiButton
                      size="sm"
                      variant="secondary"
                      onClick={() => batchUpdatePermissions('teacher', { can_view_all_students: true })}
                    >
                      允許查看所有學生
                    </HanamiButton>
                    <HanamiButton
                      size="sm"
                      variant="secondary"
                      onClick={() => batchUpdatePermissions('teacher', { can_view_all_students: false })}
                    >
                      限制學生查看
                    </HanamiButton>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#555] mb-2">家長權限</label>
                  <div className="space-y-2">
                    <HanamiButton
                      size="sm"
                      variant="secondary"
                      onClick={() => batchUpdatePermissions('parent', { can_view_all_students: true })}
                    >
                      允許查看進度
                    </HanamiButton>
                    <HanamiButton
                      size="sm"
                      variant="secondary"
                      onClick={() => batchUpdatePermissions('parent', { can_view_all_students: false })}
                    >
                      限制進度查看
                    </HanamiButton>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#555] mb-2">管理員權限</label>
                  <div className="space-y-2">
                    <HanamiButton
                      size="sm"
                      variant="secondary"
                      onClick={() => batchUpdatePermissions('admin', { can_view_financial_data: true })}
                    >
                      允許查看財務
                    </HanamiButton>
                    <HanamiButton
                      size="sm"
                      variant="secondary"
                      onClick={() => batchUpdatePermissions('admin', { can_view_financial_data: false })}
                    >
                      限制財務查看
                    </HanamiButton>
                  </div>
                </div>
              </div>
            </div>
          </HanamiCard>

          {/* 用戶權限列表 */}
          <div className="space-y-4">
            {userPermissions.length === 0 ? (
              <HanamiCard>
                <div className="text-center py-8">
                  <p className="text-[#555]">暫無用戶權限資料</p>
                </div>
              </HanamiCard>
            ) : (
              userPermissions.map((user) => (
                <HanamiCard key={user.id}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-[#2B3A3B]">
                        {getUserName(user.user_type, user.user_id)}
                      </h4>
                      <p className="text-sm text-[#555]">{user.user_email}</p>
                      <p className="text-xs text-[#777]">類型: {user.user_type}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.is_active ? '啟用' : '停用'}
                      </span>
                      <HanamiButton
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEditUser(user)}
                      >
                        編輯
                      </HanamiButton>
                    </div>
                  </div>
                </HanamiCard>
              ))
            )}
          </div>
        </div>
      )}

      {/* 老師管理內容 */}
      {activeTab === 'teachers' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#2B3A3B]">老師管理</h3>
          {teachers.length === 0 ? (
            <HanamiCard>
              <div className="text-center py-8">
                <p className="text-[#555]">暫無老師資料</p>
              </div>
            </HanamiCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teachers.map((teacher) => (
                <HanamiCard key={teacher.id}>
                  <div>
                    <h4 className="font-medium text-[#2B3A3B]">
                      {teacher.teacher_nickname || teacher.teacher_fullname}
                    </h4>
                    <p className="text-sm text-[#555]">{teacher.teacher_email}</p>
                    <p className="text-xs text-[#777]">狀態: {teacher.teacher_status || '未知'}</p>
                  </div>
                </HanamiCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 學生管理內容 */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#2B3A3B]">學生管理</h3>
          {students.length === 0 ? (
            <HanamiCard>
              <div className="text-center py-8">
                <p className="text-[#555]">暫無學生資料</p>
              </div>
            </HanamiCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((student) => (
                <HanamiCard key={student.id}>
                  <div>
                    <h4 className="font-medium text-[#2B3A3B]">{student.full_name}</h4>
                    <p className="text-sm text-[#555]">{student.student_email}</p>
                    <p className="text-xs text-[#777]">家長: {student.parent_email}</p>
                    <p className="text-xs text-[#777]">老師: {student.student_teacher || '未分配'}</p>
                  </div>
                </HanamiCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 帳戶管理內容 */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-[#2B3A3B]">帳戶管理</h3>
            <HanamiButton variant="primary" onClick={() => loadData()}>
              重新載入
            </HanamiButton>
          </div>

          {/* 帳戶類型標籤 */}
          <HanamiCard>
            <nav className="flex space-x-4">
              {[
                { id: 'teacher', name: '老師帳戶', type: 'teacher' as const, count: teachers.length },
                { id: 'student', name: '學生帳戶', type: 'student' as const, count: students.length },
                { id: 'admin', name: '管理員帳戶', type: 'admin' as const, count: admins.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`flex items-center px-3 py-2 rounded-xl font-medium text-sm transition-all ${
                    accountActiveTab === tab.id
                      ? 'bg-[#FDE6B8] text-[#A64B2A]'
                      : 'text-[#666] hover:bg-[#FFF3E0]'
                  }`}
                  onClick={() => setAccountActiveTab(tab.id as UserType)}
                >
                  <AccountIcon className="mr-2" size="sm" type={tab.type} />
                  {tab.name}
                  <span className="ml-2 bg-white text-[#666] px-2 py-1 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </HanamiCard>

          {/* 搜尋和篩選 */}
          <HanamiCard>
            <div className="space-y-4">
              <HanamiInput
                placeholder="搜尋姓名、電子郵件..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="flex gap-3">
                <HanamiSelect
                  className="flex-1"
                  options={[
                    { value: 'all', label: '所有狀態' },
                    { value: 'active', label: '啟用' },
                    { value: 'inactive', label: '停用' },
                  ]}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as AccountStatus)}
                />
                <HanamiButton
                  className="whitespace-nowrap"
                  onClick={handleAddAccount}
                >
                  新增帳戶
                </HanamiButton>
              </div>
            </div>
          </HanamiCard>

          {/* 帳戶列表 */}
          <HanamiCard>
            <div className="space-y-3">
              {getFilteredData().map((user) => (
                <div key={user.id} className="bg-[#FFF9F2] rounded-xl p-4 border border-[#EADBC8]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <AccountIcon 
                        size="md" 
                        type={accountActiveTab} 
                      />
                      <div>
                        <h3 className="font-semibold text-[#2B3A3B]">
                          {user.teacher_fullname || user.full_name || user.admin_name || '未設定'}
                        </h3>
                        <p className="text-sm text-[#666]">
                          {user.teacher_email || user.student_email || user.admin_email || '未設定'}
                        </p>
                        <p className="text-sm text-[#666]">
                          {user.teacher_phone || user.contact_number || '未設定'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(user.teacher_status || user.student_type || user.role)}
                      <div className="flex space-x-1">
                        <HanamiButton
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEditAccount(user)}
                        >
                          編輯
                        </HanamiButton>
                        <HanamiButton
                          size="sm"
                          variant="secondary"
                          onClick={() => handleStatusChange(
                            user.id, 
                            accountActiveTab, 
                            (user.teacher_status || user.student_type || user.role) === 'active' ? 'inactive' : 'active',
                          )}
                        >
                          {(user.teacher_status || user.student_type || user.role) === 'active' ? '停用' : '啟用'}
                        </HanamiButton>
                        <HanamiButton
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteUser(user.id, accountActiveTab)}
                        >
                          刪除
                        </HanamiButton>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-[#999]">
                    建立日期：{user.created_at ? new Date(user.created_at).toLocaleDateString('zh-TW') : '未知'}
                  </div>
                </div>
              ))}
              
              {getFilteredData().length === 0 && (
                <div className="text-center py-8">
                  <AccountIcon className="mx-auto mb-3 opacity-50" size="lg" type="all" />
                  <p className="text-[#666]">沒有找到符合條件的帳戶</p>
                </div>
              )}
            </div>
          </HanamiCard>
        </div>
      )}

      {/* 編輯權限模態框 */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-[#2B3A3B] mb-4">編輯用戶權限</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#555] mb-2">用戶郵箱</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  type="email"
                  value={selectedUser.user_email}
                  onChange={(e) => setSelectedUser({ ...selectedUser, user_email: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center">
                  <input
                    checked={selectedUser.can_view_all_students}
                    className="mr-2"
                    type="checkbox"
                    onChange={(e) => setSelectedUser({ ...selectedUser, can_view_all_students: e.target.checked })}
                  />
                  <span className="text-sm">查看所有學生</span>
                </label>
                <label className="flex items-center">
                  <input
                    checked={selectedUser.can_view_all_lessons}
                    className="mr-2"
                    type="checkbox"
                    onChange={(e) => setSelectedUser({ ...selectedUser, can_view_all_lessons: e.target.checked })}
                  />
                  <span className="text-sm">查看所有課程</span>
                </label>
                <label className="flex items-center">
                  <input
                    checked={selectedUser.can_manage_teachers}
                    className="mr-2"
                    type="checkbox"
                    onChange={(e) => setSelectedUser({ ...selectedUser, can_manage_teachers: e.target.checked })}
                  />
                  <span className="text-sm">管理老師</span>
                </label>
                <label className="flex items-center">
                  <input
                    checked={selectedUser.can_manage_students}
                    className="mr-2"
                    type="checkbox"
                    onChange={(e) => setSelectedUser({ ...selectedUser, can_manage_students: e.target.checked })}
                  />
                  <span className="text-sm">管理學生</span>
                </label>
                <label className="flex items-center">
                  <input
                    checked={selectedUser.can_view_financial_data}
                    className="mr-2"
                    type="checkbox"
                    onChange={(e) => setSelectedUser({ ...selectedUser, can_view_financial_data: e.target.checked })}
                  />
                  <span className="text-sm">查看財務資料</span>
                </label>
                <label className="flex items-center">
                  <input
                    checked={selectedUser.is_active}
                    className="mr-2"
                    type="checkbox"
                    onChange={(e) => setSelectedUser({ ...selectedUser, is_active: e.target.checked })}
                  />
                  <span className="text-sm">啟用帳戶</span>
                </label>
              </div>
              <div className="flex justify-end space-x-2">
                <HanamiButton
                  variant="secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  取消
                </HanamiButton>
                <HanamiButton
                  variant="primary"
                  onClick={handleSaveEdit}
                >
                  保存
                </HanamiButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新增/編輯帳戶表單 */}
      {showAddModal && (
        <AccountForm
          editingUser={editingUser}
          userType={accountActiveTab}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
} 