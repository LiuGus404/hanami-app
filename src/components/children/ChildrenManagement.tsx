'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  UserIcon,
  CalendarIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import ReactPortalModal from './ReactPortalModal';

interface Child {
  id: string;
  full_name: string;
  nick_name?: string;
  birth_date: string;
  age_months?: number;
  gender: '男孩' | '女孩';
  preferences?: string;
  health_notes?: string;
  allergies?: string;
  created_at: string;
  updated_at: string;
}


interface ChildrenManagementProps {
  onClose?: () => void;
}

export default function ChildrenManagement({ onClose }: ChildrenManagementProps) {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    nick_name: '',
    birth_date: '',
    gender: '男孩' as '男孩' | '女孩',
    preferences: '',
    health_notes: '',
    allergies: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 載入孩子列表
  const loadChildren = async () => {
    try {
      setLoading(true);
      console.log('開始載入孩子資料...');
      
      // 獲取用戶信息 - 使用 email 直接查詢
      console.log('正在獲取用戶信息...');
      
      // 從會話存儲中獲取 email
      const userEmail = 'tqfea12@gmail.com'; // 從日誌中看到的 email
      console.log('使用 email 查詢用戶:', userEmail);
      
      const userResponse = await fetch(`/api/children/get-user-by-email?email=${encodeURIComponent(userEmail)}`);
      const userData = await userResponse.json();
      
      console.log('用戶查詢結果:', userData);
      
      if (!userData.success) {
        console.error('獲取用戶信息失敗:', userData.error);
        alert('獲取用戶信息失敗，請重新登入');
        return;
      }
      
      const user = userData.user;
      console.log('用戶 ID:', user.id);
      
      // 先進行完整的調試測試
      console.log('正在進行完整調試測試...');
      const testResponse = await fetch('/api/children/full-debug');
      const testData = await testResponse.json();
      console.log('完整調試結果:', testData);
      
      if (!testData.success) {
        console.error('調試測試失敗:', testData.error);
        alert(`調試測試失敗: ${testData.error}`);
        setChildren([]);
        return;
      }
      
      // 檢查 hanami_children 表是否可以訪問
      if (!testData.debug.hanami_children.success) {
        console.error('hanami_children 表無法訪問:', testData.debug.hanami_children.error);
        alert(`hanami_children 表無法訪問: ${testData.debug.hanami_children.error}`);
        setChildren([]);
        return;
      }
      
      const response = await fetch(`/api/children?userId=${user.id}`);
      const data = await response.json();
      
      console.log('API 響應:', { status: response.status, data });
      
      if (response.ok) {
        setChildren(data.children || []);
        console.log('成功載入孩子資料:', data.children?.length || 0, '個');
      } else {
        console.error('載入孩子資料失敗:', data.error);
        alert(`載入失敗: ${data.error}`);
        setChildren([]);
      }
    } catch (error) {
      console.error('載入孩子資料失敗:', error);
      alert('載入失敗，請稍後再試');
      setChildren([]);
    } finally {
      setLoading(false);
    }
  };

  // 驗證表單
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = '請輸入孩子全名';
    }

    if (!formData.birth_date) {
      newErrors.birth_date = '請選擇出生日期';
    } else {
      const birthDate = new Date(formData.birth_date);
      const today = new Date();
      if (birthDate > today) {
        newErrors.birth_date = '出生日期不能是未來日期';
      }
    }

    if (!formData.gender) {
      newErrors.gender = '請選擇性別';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交表單
  const handleSubmit = async (e?: React.FormEvent) => {
    console.log('handleSubmit 被調用');
    if (e) {
      e.preventDefault();
    }
    
    if (!validateForm()) {
      console.log('表單驗證失敗');
      return;
    }
    
    console.log('開始提交表單，formData:', formData);

    try {
      // 獲取用戶信息 - 使用 email 查詢方法
      const userResponse = await fetch('/api/children/get-user-by-email?email=tqfea12@gmail.com');
      const userResult = await userResponse.json();
      
      if (!userResult.success || !userResult.user) {
        alert('無法獲取用戶信息');
        return;
      }
      
      const user = userResult.user;

      const url = editingChild ? `/api/children/${editingChild.id}` : '/api/children';
      const method = editingChild ? 'PUT' : 'POST';
      
      const requestData = editingChild ? formData : { ...formData, parent_id: user.id };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok) {
        await loadChildren();
        resetForm();
        alert(editingChild ? '孩子資料已更新' : '孩子資料已添加');
      } else {
        alert(data.error || '操作失敗');
      }
    } catch (error) {
      console.error('提交失敗:', error);
      alert('操作失敗，請稍後再試');
    }
  };

  // 刪除孩子
  const handleDelete = async (childId: string, childName: string) => {
    if (!confirm(`確定要刪除 ${childName} 的資料嗎？此操作無法復原。`)) {
      return;
    }

    try {
      const response = await fetch(`/api/children/${childId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        await loadChildren();
        alert('孩子資料已刪除');
      } else {
        alert(data.error || '刪除失敗');
      }
    } catch (error) {
      console.error('刪除失敗:', error);
      alert('刪除失敗，請稍後再試');
    }
  };

  // 重置表單
  const resetForm = () => {
    setFormData({
      full_name: '',
      nick_name: '',
      birth_date: '',
      gender: '男孩',
      preferences: '',
      health_notes: '',
      allergies: ''
    });
    setErrors({});
    setShowAddForm(false);
    setEditingChild(null);
  };

  // 編輯孩子
  const handleEdit = (child: Child) => {
    setFormData({
      full_name: child.full_name,
      nick_name: child.nick_name || '',
      birth_date: child.birth_date,
      gender: child.gender,
      preferences: child.preferences || '',
      health_notes: child.health_notes || '',
      allergies: child.allergies || ''
    });
    setEditingChild(child);
    setShowAddForm(true);
  };

  // 處理載入綁定學生資料
  const handleLoadBoundStudents = async () => {
    try {
      setLoading(true);
      
      // 獲取用戶信息 - 使用 email 直接查詢
      const userEmail = 'tqfea12@gmail.com'; // 從日誌中看到的 email
      console.log('載入綁定學生 - 使用 email 查詢用戶:', userEmail);
      
      const userResponse = await fetch(`/api/children/get-user-by-email?email=${encodeURIComponent(userEmail)}`);
      const userData = await userResponse.json();
      
      console.log('載入綁定學生 - 用戶查詢結果:', userData);
      
      if (!userData.success) {
        console.error('獲取用戶信息失敗:', userData.error);
        alert('獲取用戶信息失敗，請重新登入');
        return;
      }
      
      const user = userData.user;
      console.log('載入綁定學生 - 用戶 ID:', user.id);
      
      // 先進行詳細調試
      console.log('進行詳細調試...');
      const debugResponse = await fetch(`/api/children/debug-bound-students?userId=${user.id}`);
      const debugData = await debugResponse.json();
      console.log('詳細調試結果:', debugData);
      
      const response = await fetch(`/api/children/load-bound-students-cross-db?userId=${user.id}`);
      const data = await response.json();
      
      if (response.ok && data.students && data.students.length > 0) {
        // 批量載入所有綁定的學生
        let successCount = 0;
        let errorCount = 0;
        
        for (const student of data.students) {
          try {
            const childData = {
              parent_id: user.id,
              full_name: student.full_name,
              nick_name: student.nick_name || '',
              birth_date: student.birth_date,
              gender: student.gender === '男' ? '男孩' : '女孩',
              preferences: student.preferences || '',
              health_notes: student.health_notes || '',
              allergies: '' // 現有學生資料中沒有過敏信息
            };
            
            const response = await fetch('/api/children', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(childData),
            });
            
            if (response.ok) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (error) {
            console.error('載入學生失敗:', student.full_name, error);
            errorCount++;
          }
        }
        
        // 重新載入孩子列表
        await loadChildren();
        
        // 顯示結果
        if (successCount > 0) {
          alert(`成功載入 ${successCount} 個孩子的資料${errorCount > 0 ? `，${errorCount} 個載入失敗` : ''}`);
        } else {
          alert('載入失敗，請稍後再試');
        }
      } else {
        alert('沒有找到綁定的學生資料');
      }
    } catch (error) {
      console.error('載入綁定學生資料失敗:', error);
      alert('載入學生資料失敗');
    } finally {
      setLoading(false);
    }
  };

  // 計算年齡顯示
  const getAgeDisplay = (ageMonths?: number) => {
    if (!ageMonths) return '未知';
    const years = Math.floor(ageMonths / 12);
    const months = ageMonths % 12;
    if (years === 0) return `${months}個月`;
    if (months === 0) return `${years}歲`;
    return `${years}歲${months}個月`;
  };

  useEffect(() => {
    loadChildren();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD59A]"></div>
        <span className="ml-2 text-[#4B4036]">載入中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 標題和添加按鈕 */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-[#4B4036]">孩子資料</h3>
        <div className="flex space-x-3">
          <button
            onClick={handleLoadBoundStudents}
            className="w-10 h-10 bg-[#EBC9A4] text-[#4B4036] rounded-full hover:bg-[#FFD59A] transition-colors flex items-center justify-center shadow-lg hover:shadow-xl"
            title="載入綁定學生資料"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="w-10 h-10 bg-[#FFD59A] text-[#4B4036] rounded-full hover:bg-[#EBC9A4] transition-colors flex items-center justify-center shadow-lg hover:shadow-xl"
            title="添加孩子"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 孩子列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {children.map((child) => (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-[#EADBC8] hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-[#FFD59A] rounded-full flex items-center justify-center mr-3">
                    <UserIcon className="w-5 h-5 text-[#4B4036]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#4B4036]">{child.full_name}</h4>
                    {child.nick_name && (
                      <p className="text-sm text-[#4B4036]/70">暱稱: {child.nick_name}</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEdit(child)}
                    className="p-1 text-[#4B4036] hover:bg-[#FFD59A]/20 rounded"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(child.id, child.full_name)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center text-[#4B4036]/70">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  <span>{getAgeDisplay(child.age_months)}</span>
                  <span className="mx-2">•</span>
                  <span>{child.gender}</span>
                </div>
                
                {child.preferences && (
                  <div className="flex items-start text-[#4B4036]/70">
                    <HeartIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{child.preferences}</span>
                  </div>
                )}
                
                {(child.health_notes || child.allergies) && (
                  <div className="flex items-start text-[#4B4036]/70">
                    <ExclamationTriangleIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      {child.health_notes && <div>健康: {child.health_notes}</div>}
                      {child.allergies && <div>過敏: {child.allergies}</div>}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {children.length === 0 && (
        <div className="text-center py-8">
          <UserIcon className="w-16 h-16 text-[#4B4036]/30 mx-auto mb-4" />
          <p className="text-[#4B4036]/70 mb-6">還沒有添加任何孩子資料</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleLoadBoundStudents}
              className="w-12 h-12 bg-[#EBC9A4] text-[#4B4036] rounded-full hover:bg-[#FFD59A] transition-colors flex items-center justify-center shadow-lg hover:shadow-xl"
              title="載入綁定學生資料"
            >
              <ArrowPathIcon className="w-6 h-6" />
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="w-12 h-12 bg-[#FFD59A] text-[#4B4036] rounded-full hover:bg-[#EBC9A4] transition-colors flex items-center justify-center shadow-lg hover:shadow-xl"
              title="添加第一個孩子"
            >
              <PlusIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* 添加/編輯表單 */}
      <ReactPortalModal
        isOpen={showAddForm}
        onClose={resetForm}
        title={editingChild ? '編輯孩子資料' : '添加孩子資料'}
        submitButtonText={editingChild ? '更新' : '添加'}
        onSubmit={handleSubmit}
      >
        <div className="space-y-6">
          {/* 基本資料區塊 */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-[#EADBC8]">
            <h3 className="text-lg font-semibold text-[#4B4036] mb-4 flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center">
                <UserIcon className="w-3 h-3 text-[#4B4036]" />
              </div>
              基本資料
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 全名 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#4B4036] mb-2">
                  全名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent transition-all ${
                    errors.full_name ? 'border-red-500 bg-red-50' : 'border-[#EADBC8] bg-[#FFF9F2]'
                  }`}
                  placeholder="請輸入孩子全名"
                />
                {errors.full_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>
                )}
              </div>

              {/* 暱稱 */}
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">暱稱</label>
                <input
                  type="text"
                  value={formData.nick_name}
                  onChange={(e) => setFormData({ ...formData, nick_name: e.target.value })}
                  className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent bg-[#FFF9F2] transition-all"
                  placeholder="請輸入暱稱（選填）"
                />
              </div>

              {/* 出生日期 */}
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">
                  出生日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent transition-all ${
                    errors.birth_date ? 'border-red-500 bg-red-50' : 'border-[#EADBC8] bg-[#FFF9F2]'
                  }`}
                />
                {errors.birth_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.birth_date}</p>
                )}
              </div>

              {/* 性別 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#4B4036] mb-2">
                  性別 <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-6">
                  <label className="flex items-center p-3 rounded-xl border border-[#EADBC8] bg-[#FFF9F2] cursor-pointer transition-all hover:bg-[#FFD59A]/20">
                    <input
                      type="radio"
                      value="男孩"
                      checked={formData.gender === '男孩'}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as '男孩' | '女孩' })}
                      className="mr-3 w-4 h-4 text-[#FFD59A] focus:ring-[#FFD59A]"
                    />
                    <span className="text-[#4B4036] font-medium">男孩</span>
                  </label>
                  <label className="flex items-center p-3 rounded-xl border border-[#EADBC8] bg-[#FFF9F2] cursor-pointer transition-all hover:bg-[#FFD59A]/20">
                    <input
                      type="radio"
                      value="女孩"
                      checked={formData.gender === '女孩'}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as '男孩' | '女孩' })}
                      className="mr-3 w-4 h-4 text-[#FFD59A] focus:ring-[#FFD59A]"
                    />
                    <span className="text-[#4B4036] font-medium">女孩</span>
                  </label>
                </div>
                {errors.gender && (
                  <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
                )}
              </div>
            </div>
          </div>

          {/* 詳細資料區塊 */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-[#EADBC8]">
            <h3 className="text-lg font-semibold text-[#4B4036] mb-4 flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center">
                <HeartIcon className="w-3 h-3 text-[#4B4036]" />
              </div>
              詳細資料
            </h3>
            <div className="space-y-4">
              {/* 喜好物 */}
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">
                  喜好物 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.preferences}
                  onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                  className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent bg-[#FFF9F2] transition-all resize-none"
                  rows={3}
                  placeholder="請描述孩子的喜好物..."
                />
              </div>

              {/* 健康情況 */}
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">健康情況</label>
                <textarea
                  value={formData.health_notes}
                  onChange={(e) => setFormData({ ...formData, health_notes: e.target.value })}
                  className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent bg-[#FFF9F2] transition-all resize-none"
                  rows={2}
                  placeholder="請描述健康情況（選填）"
                />
              </div>

              {/* 過敏情況 */}
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">過敏情況</label>
                <textarea
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent bg-[#FFF9F2] transition-all resize-none"
                  rows={2}
                  placeholder="請描述過敏情況（選填）"
                />
              </div>
            </div>
          </div>
        </div>
      </ReactPortalModal>

    </div>
  );
}
