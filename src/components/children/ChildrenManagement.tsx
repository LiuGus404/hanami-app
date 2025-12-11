'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';

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
  const { user } = useSaasAuth();
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
  const loadChildren = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/children?userId=${user.id}`);
      const data = await response.json();

      if (response.ok) {
        setChildren(data.children || []);
      } else {
        console.error('載入孩子資料失敗:', data.error);
        setChildren([]);
      }
    } catch (error) {
      console.error('載入孩子資料失敗:', error);
      setChildren([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadChildren();
    }
  }, [loadChildren, user?.id]);

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
    if (e) {
      e.preventDefault();
    }

    if (!validateForm()) {
      return;
    }

    if (!user?.id) {
      alert('無法獲取用戶信息，請重新登入');
      return;
    }

    try {
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
    if (!user?.id) return;

    try {
      setLoading(true);

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

  if (loading && !children.length) {
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
        <div className="flex space-x-4">
          <button
            onClick={handleLoadBoundStudents}
            className="w-10 h-10 bg-[#FFF9F2] text-[#4B4036] rounded-2xl shadow-[5px_5px_10px_#E6D9C5,-5px_-5px_10px_#FFFFFF] hover:shadow-[inset_3px_3px_6px_#E6D9C5,inset_-3px_-3px_6px_#FFFFFF] transition-all flex items-center justify-center active:scale-95"
            title="載入綁定學生資料"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="w-10 h-10 bg-[#FFF9F2] text-[#4B4036] rounded-2xl shadow-[5px_5px_10px_#E6D9C5,-5px_-5px_10px_#FFFFFF] hover:shadow-[inset_3px_3px_6px_#E6D9C5,inset_-3px_-3px_6px_#FFFFFF] transition-all flex items-center justify-center active:scale-95"
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
              className="rounded-[2.5rem] p-6 bg-[#FFF9F2] shadow-[8px_8px_16px_#E6D9C5,-8px_-8px_16px_#FFFFFF] transition-all hover:-translate-y-1 duration-300"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-14 h-14 rounded-full bg-[#FFF9F2] shadow-[inset_3px_3px_6px_#D1C3B1,inset_-3px_-3px_6px_#FFFFFF] flex items-center justify-center mr-4 text-[#EBC9A4]">
                    <UserIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-[#4B4036]">{child.full_name}</h4>
                    {child.nick_name && (
                      <p className="text-sm text-[#8B7E74]">暱稱: {child.nick_name}</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(child)}
                    className="p-2 text-[#8B7E74] bg-[#FFF9F2] rounded-xl shadow-[4px_4px_8px_#E6D9C5,-4px_-4px_8px_#FFFFFF] hover:shadow-[inset_2px_2px_4px_#E6D9C5,inset_-2px_-2px_4px_#FFFFFF] hover:text-[#4B4036] transition-all active:scale-95"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(child.id, child.full_name)}
                    className="p-2 text-[#8B7E74] bg-[#FFF9F2] rounded-xl shadow-[4px_4px_8px_#E6D9C5,-4px_-4px_8px_#FFFFFF] hover:shadow-[inset_2px_2px_4px_#E6D9C5,inset_-2px_-2px_4px_#FFFFFF] hover:text-red-500 transition-all active:scale-95"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-sm mt-4 pl-1">
                <div className="flex items-center text-[#8B7E74]">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  <span>{getAgeDisplay(child.age_months)}</span>
                  <span className="mx-2 text-[#E6D9C5]">•</span>
                  <span>{child.gender}</span>
                </div>

                {child.preferences && (
                  <div className="flex items-start text-[#8B7E74]">
                    <HeartIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{child.preferences}</span>
                  </div>
                )}

                {(child.health_notes || child.allergies) && (
                  <div className="flex items-start text-[#8B7E74]">
                    <ExclamationTriangleIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-orange-400" />
                    <div className="space-y-1">
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
          <div className="flex justify-center space-x-6">
            <button
              onClick={handleLoadBoundStudents}
              className="px-6 py-3 bg-[#FFF9F2] text-[#4B4036] rounded-2xl shadow-[6px_6px_12px_#E6D9C5,-6px_-6px_12px_#FFFFFF] hover:shadow-[inset_3px_3px_6px_#E6D9C5,inset_-3px_-3px_6px_#FFFFFF] transition-all flex items-center justify-center gap-2 font-bold active:scale-95"
              title="載入綁定學生資料"
            >
              <ArrowPathIcon className="w-5 h-5" />
              <span>載入學生</span>
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-[#FFF9F2] text-[#4B4036] rounded-2xl shadow-[6px_6px_12px_#E6D9C5,-6px_-6px_12px_#FFFFFF] hover:shadow-[inset_3px_3px_6px_#E6D9C5,inset_-3px_-3px_6px_#FFFFFF] transition-all flex items-center justify-center gap-2 font-bold active:scale-95"
              title="添加第一個孩子"
            >
              <PlusIcon className="w-5 h-5" />
              <span>添加孩子</span>
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
          <div className="bg-[#FFF9F2] rounded-[2rem] p-6 shadow-[8px_8px_16px_#E6D9C5,-8px_-8px_16px_#FFFFFF]">
            <h3 className="text-lg font-semibold text-[#4B4036] mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-[#FFF9F2] rounded-full flex items-center justify-center shadow-[inset_2px_2px_4px_#D1C3B1,inset_-2px_-2px_4px_#FFFFFF]">
                <UserIcon className="w-4 h-4 text-[#8B7E74]" />
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
                  className={`w-full px-5 py-3 border-none rounded-xl bg-[#FFF9F2] shadow-[inset_2px_2px_5px_#D1C3B1,inset_-2px_-2px_5px_#FFFFFF] focus:ring-0 focus:shadow-[inset_3px_3px_6px_#D1C3B1,inset_-3px_-3px_6px_#FFFFFF] transition-all text-[#4B4036] placeholder-[#8B7E74]/50 ${errors.full_name ? 'ring-2 ring-red-500' : ''
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
                  className="w-full px-5 py-3 border-none rounded-xl bg-[#FFF9F2] shadow-[inset_2px_2px_5px_#D1C3B1,inset_-2px_-2px_5px_#FFFFFF] focus:ring-0 focus:shadow-[inset_3px_3px_6px_#D1C3B1,inset_-3px_-3px_6px_#FFFFFF] transition-all text-[#4B4036] placeholder-[#8B7E74]/50"
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
                  className={`w-full px-5 py-3 border-none rounded-xl bg-[#FFF9F2] shadow-[inset_2px_2px_5px_#D1C3B1,inset_-2px_-2px_5px_#FFFFFF] focus:ring-0 focus:shadow-[inset_3px_3px_6px_#D1C3B1,inset_-3px_-3px_6px_#FFFFFF] transition-all text-[#4B4036] ${errors.birth_date ? 'ring-2 ring-red-500' : ''
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
                  <div className="flex space-x-6">
                    <label className={`flex items-center p-3 rounded-xl cursor-pointer transition-all ${formData.gender === '男孩'
                      ? 'bg-[#FFF9F2] shadow-[inset_2px_2px_5px_#D1C3B1,inset_-2px_-2px_5px_#FFFFFF] text-[#E69138]'
                      : 'bg-[#FFF9F2] shadow-[5px_5px_10px_#E6D9C5,-5px_-5px_10px_#FFFFFF] text-[#8B7E74] hover:text-[#4B4036]'
                      }`}>
                      <input
                        type="radio"
                        value="男孩"
                        checked={formData.gender === '男孩'}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as '男孩' | '女孩' })}
                        className="hidden"
                      />
                      <span className="font-bold px-2">男孩</span>
                    </label>
                    <label className={`flex items-center p-3 rounded-xl cursor-pointer transition-all ${formData.gender === '女孩'
                      ? 'bg-[#FFF9F2] shadow-[inset_2px_2px_5px_#D1C3B1,inset_-2px_-2px_5px_#FFFFFF] text-[#E69138]'
                      : 'bg-[#FFF9F2] shadow-[5px_5px_10px_#E6D9C5,-5px_-5px_10px_#FFFFFF] text-[#8B7E74] hover:text-[#4B4036]'
                      }`}>
                      <input
                        type="radio"
                        value="女孩"
                        checked={formData.gender === '女孩'}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as '男孩' | '女孩' })}
                        className="hidden"
                      />
                      <span className="font-bold px-2">女孩</span>
                    </label>
                  </div>
                </div>
                {errors.gender && (
                  <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
                )}
              </div>
            </div>
          </div>

          {/* 詳細資料區塊 */}
          <div className="bg-[#FFF9F2] rounded-[2rem] p-6 shadow-[8px_8px_16px_#E6D9C5,-8px_-8px_16px_#FFFFFF] mt-6">
            <h3 className="text-lg font-semibold text-[#4B4036] mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-[#FFF9F2] rounded-full flex items-center justify-center shadow-[inset_2px_2px_4px_#D1C3B1,inset_-2px_-2px_4px_#FFFFFF]">
                <HeartIcon className="w-4 h-4 text-[#8B7E74]" />
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
                  className="w-full px-5 py-3 border-none rounded-xl bg-[#FFF9F2] shadow-[inset_2px_2px_5px_#D1C3B1,inset_-2px_-2px_5px_#FFFFFF] focus:ring-0 focus:shadow-[inset_3px_3px_6px_#D1C3B1,inset_-3px_-3px_6px_#FFFFFF] transition-all text-[#4B4036] placeholder-[#8B7E74]/50 resize-none"
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
                  className="w-full px-5 py-3 border-none rounded-xl bg-[#FFF9F2] shadow-[inset_2px_2px_5px_#D1C3B1,inset_-2px_-2px_5px_#FFFFFF] focus:ring-0 focus:shadow-[inset_3px_3px_6px_#D1C3B1,inset_-3px_-3px_6px_#FFFFFF] transition-all text-[#4B4036] placeholder-[#8B7E74]/50 resize-none"
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
                  className="w-full px-5 py-3 border-none rounded-xl bg-[#FFF9F2] shadow-[inset_2px_2px_5px_#D1C3B1,inset_-2px_-2px_5px_#FFFFFF] focus:ring-0 focus:shadow-[inset_3px_3px_6px_#D1C3B1,inset_-3px_-3px_6px_#FFFFFF] transition-all text-[#4B4036] placeholder-[#8B7E74]/50 resize-none"
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
