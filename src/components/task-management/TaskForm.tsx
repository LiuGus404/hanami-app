'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Task, CreateTaskForm, UpdateTaskForm, DEFAULT_PRIORITY_CONFIG, DEFAULT_CATEGORY_CONFIG } from '@/types/task-management';
import { supabase } from '@/lib/supabase';
import CategoryIcon from './CategoryIcon';

interface TaskFormProps {
  task?: Task;
  onSubmit: (data: CreateTaskForm | UpdateTaskForm) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function TaskForm({ task, onSubmit, onCancel, isLoading = false }: TaskFormProps) {
  // 用於避免瀏覽器自動填入日期時間欄位以及強制重新掛載輸入元素
  const [formInstanceId] = useState<string>(() => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`);
  const [formData, setFormData] = useState<CreateTaskForm>({
    title: '',
    description: '',
    follow_up_content: '',
    priority: 'important_not_urgent',
    category: [],
    phone: '',
    assigned_to: [],
    due_date: '',
    time_block_start: '',
    time_block_end: '',
    is_public: false,
    project_id: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [students, setStudents] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [showAssignMenu, setShowAssignMenu] = useState(false);

  // 載入數據
  useEffect(() => {
    const loadData = async () => {
      try {
        // 載入學生數據
        const { data: studentsData } = await supabase
          .from('Hanami_Students')
          .select('id, full_name, contact_number, nick_name')
          .order('full_name');

        // 載入員工數據
        const { data: employeesData } = await supabase
          .from('hanami_employee')
          .select('id, teacher_fullname, teacher_nickname, teacher_email')
          .order('teacher_fullname');

        // 載入管理員數據
        const { data: adminsData } = await supabase
          .from('hanami_admin')
          .select('id, admin_name, admin_email')
          .order('admin_name');

        setStudents(studentsData || []);
        setEmployees(employeesData || []);
        setAdmins(adminsData || []);

        // 如果有電話號碼，查找對應學生
        if (task?.phone) {
          const student = studentsData?.find(s => s.contact_number === task.phone);
          setSelectedStudent(student || null);
        }
      } catch (error) {
        console.error('載入數據失敗:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [task?.phone]);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        follow_up_content: (task as any).follow_up_content || '',
        priority: task.priority || 'important_not_urgent',
        category: task.category || [],
        phone: task.phone || '',
        assigned_to: Array.isArray(task.assigned_to) ? task.assigned_to : (task.assigned_to ? (task.assigned_to as string).split(',').map(name => name.trim()) : []),
        due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
        time_block_start: task.time_block_start ? new Date(task.time_block_start).toISOString().slice(0, 16) : '',
        time_block_end: task.time_block_end ? new Date(task.time_block_end).toISOString().slice(0, 16) : '',
        is_public: !!task.is_public,
        project_id: task.project_id || ''
      });
    } else {
      // 重置表單數據為初始狀態，截止日期設為24小時後
      const tomorrow = new Date();
      tomorrow.setHours(tomorrow.getHours() + 24);
      const tomorrowISOString = tomorrow.toISOString().slice(0, 16);
      
      setFormData({
        title: '',
        description: '',
        follow_up_content: '',
        priority: 'important_not_urgent',
        category: [],
        phone: '',
        assigned_to: [],
        due_date: tomorrowISOString,
        time_block_start: '',
        time_block_end: '',
        is_public: false,
        project_id: ''
      });
    }
  }, [task]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '標題為必填項目';
    }


    if (formData.time_block_start && formData.time_block_end) {
      const start = new Date(formData.time_block_start);
      const end = new Date(formData.time_block_end);
      if (start >= end) {
        newErrors.time_block_end = '結束時間必須晚於開始時間';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // 轉換時間格式
    const submitData = {
      ...formData,
      due_date: formData.due_date ? new Date(formData.due_date).toISOString() : undefined,
      time_block_start: formData.time_block_start ? new Date(formData.time_block_start).toISOString() : undefined,
      time_block_end: formData.time_block_end ? new Date(formData.time_block_end).toISOString() : undefined,
    };

    onSubmit(submitData);
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      category: checked 
        ? [...(prev.category || []), category as any]
        : (prev.category || []).filter(c => c !== category)
    }));
  };

  const handlePhoneChange = (phone: string) => {
    setFormData(prev => ({ ...prev, phone }));
    
    // 查找對應的學生
    const student = students.find(s => s.contact_number === phone);
    setSelectedStudent(student || null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-br from-white to-[#FFF9F2] rounded-3xl p-8 shadow-xl border border-[#EADBC8] max-w-3xl mx-auto"
    >
      {/* 標題區域 */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-2xl flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-[#2B3A3B]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-[#2B3A3B]">
            {task ? '編輯任務' : '創建新任務'}
          </h2>
          <p className="text-[#777] mt-1">
            {task ? '修改任務詳情' : '設定任務資訊和優先級'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 標題 */}
        <div>
          <label className="block text-sm font-medium text-[#2B3A3B] mb-2">
            任務標題 *
          </label>
          <input
            type="text"
            value={formData.title || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className={`w-full px-4 py-3 rounded-xl border ${
              errors.title ? 'border-red-300' : 'border-[#EADBC8]'
            } focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent`}
            placeholder="輸入任務標題..."
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        {/* 截止日期 */}
        <div>
          <label className="block text-sm font-medium text-[#2B3A3B] mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#FF8C42]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
            </svg>
            截止日期
          </label>
          <div className="flex gap-2">
            <input
              type="datetime-local"
              value={formData.due_date || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              className="flex-1 px-4 py-3 rounded-xl border border-[#EADBC8] focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
              autoComplete="off"
              inputMode="none"
              name={`due_date_${formInstanceId}`}
              key={`due_date_${formInstanceId}`}
              placeholder=""
            />
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, due_date: '' }))}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors"
              title="清除日期"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
          {/* 快速設定按鈕 */}
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                now.setHours(now.getHours() + 1);
                setFormData(prev => ({ ...prev, due_date: now.toISOString().slice(0, 16) }));
              }}
              className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
            >
              1小時後
            </button>
            <button
              type="button"
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setHours(tomorrow.getHours() + 24);
                setFormData(prev => ({ ...prev, due_date: tomorrow.toISOString().slice(0, 16) }));
              }}
              className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
            >
              24小時後
            </button>
            <button
              type="button"
              onClick={() => {
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                setFormData(prev => ({ ...prev, due_date: nextWeek.toISOString().slice(0, 16) }));
              }}
              className="px-3 py-1 text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition-colors"
            >
              一週後
            </button>
          </div>
        </div>

        {/* 客戶資訊 */}
        <div>
          <label className="block text-lg font-semibold text-[#2B3A3B] mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#FF8C42]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            客戶資訊
          </label>
          <div className="bg-gradient-to-r from-[#FFF9F2] to-[#FFD59A]/10 rounded-2xl p-4 border border-[#EADBC8]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-[#2B3A3B]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div className="flex-1">
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="hidden"
                />
                {selectedStudent ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-3 bg-green-100 text-green-800 rounded-xl">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                      </svg>
                      <span className="font-semibold text-lg">{selectedStudent.full_name}</span>
                    </div>
                    {selectedStudent.nick_name && (
                      <span className="text-sm text-gray-500">({selectedStudent.nick_name})</span>
                    )}
                  </div>
                ) : formData.phone ? (
                  <div className="flex items-center gap-2 px-4 py-3 bg-orange-100 text-orange-800 rounded-xl">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <span className="font-semibold text-lg">新客戶</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <span className="font-semibold text-lg">未識別客戶</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 描述 */}
        <div>
          <label className="block text-sm font-medium text-[#2B3A3B] mb-2">
            任務描述
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-[#EADBC8] focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
            placeholder="輸入任務描述..."
          />
        </div>

        {/* 跟進內容/回覆內容 */}
        <div>
          <label className="block text-sm font-medium text-[#2B3A3B] mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#FF8C42]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
            跟進內容/回覆內容
          </label>
          <textarea
            value={formData.follow_up_content || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, follow_up_content: e.target.value }))}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-[#EADBC8] focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
            placeholder="輸入跟進內容或回覆內容..."
          />
        </div>

        {/* 優先級 */}
        <div>
          <label className="block text-lg font-semibold text-[#2B3A3B] mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#FF8C42]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            優先級 *
          </label>
          <div className="grid grid-cols-2 gap-4">
            {DEFAULT_PRIORITY_CONFIG.map((priority) => (
              <motion.label
                key={priority.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                  formData.priority === priority.value
                    ? 'border-[#FFD59A] bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/20 shadow-lg'
                    : 'border-[#EADBC8] hover:border-[#FFD59A] hover:shadow-md'
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value={priority.value}
                  checked={formData.priority === priority.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="sr-only"
                />
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${
                  priority.value === 'urgent_important' 
                    ? 'bg-red-100 text-red-600' 
                    : priority.value === 'important_not_urgent'
                    ? 'bg-orange-100 text-orange-600'
                    : priority.value === 'urgent_not_important'
                    ? 'bg-yellow-100 text-yellow-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {priority.value === 'urgent_important' ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ) : priority.value === 'important_not_urgent' ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ) : priority.value === 'urgent_not_important' ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-[#2B3A3B]">{priority.label}</div>
                  <div className="text-sm text-gray-500">{priority.description}</div>
                </div>
              </motion.label>
            ))}
          </div>
        </div>

        {/* 類別 */}
        <div>
          <label className="block text-lg font-semibold text-[#2B3A3B] mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#FF8C42]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            任務類別
          </label>
          <div className="grid grid-cols-3 gap-3">
            {DEFAULT_CATEGORY_CONFIG.map((category) => (
              <motion.label
                key={category.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  formData.category?.includes(category.value)
                    ? 'border-[#FFD59A] bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/20 shadow-md'
                    : 'border-[#EADBC8] hover:border-[#FFD59A] hover:shadow-sm'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.category?.includes(category.value) || false}
                  onChange={(e) => handleCategoryChange(category.value, e.target.checked)}
                  className="sr-only"
                />
                <div className="w-8 h-8 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-lg flex items-center justify-center mr-3">
                  <CategoryIcon category={category.value} className="w-4 h-4 text-[#2B3A3B]" />
                </div>
                <span className="text-sm font-semibold text-[#2B3A3B]">{category.label}</span>
              </motion.label>
            ))}
          </div>
        </div>

        {/* 指派給 */}
        <div>
          <label className="block text-lg font-semibold text-[#2B3A3B] mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#FF8C42]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99L14 10.5c-.47-.62-1.21-.99-2.01-.99H9.46c-.8 0-1.54.37-2.01.99L6 10.5c-.47-.62-1.21-.99-2.01-.99H2.46c-.8 0-1.54.37-2.01.99L0 10.5v9.5h2v6h2v-6h2v6h2v-6h2v6h2v-6h2v6h2z"/>
            </svg>
            指派給
          </label>
          
          {/* 已選擇的負責人顯示 */}
          {formData.assigned_to && formData.assigned_to.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {formData.assigned_to.map((name, index) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                  {name}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      assigned_to: (prev.assigned_to || []).filter((_, i) => i !== index)
                    }))}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* 自定義下拉選單 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAssignMenu(!showAssignMenu)}
              className="w-full px-4 py-3 rounded-xl border border-[#EADBC8] focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent bg-white text-left flex items-center justify-between"
              disabled={loadingData}
            >
              <span className="text-gray-500">
                {formData.assigned_to && formData.assigned_to.length > 0 
                  ? `已選擇 ${formData.assigned_to.length} 人` 
                  : '選擇指派對象...'}
              </span>
              <svg className={`w-5 h-5 text-[#FF8C42] transition-transform ${showAssignMenu ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 10l5 5 5-5z"/>
              </svg>
            </button>
            
            {/* 下拉選單內容 */}
            {showAssignMenu && (
              <div className="absolute top-full left-0 right-0 z-50 bg-white rounded-xl shadow-lg border border-[#EADBC8] mt-1 max-h-[400px] overflow-y-auto">
                {/* 標題和操作按鈕 */}
                <div className="px-4 py-2 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-[#2B3A3B]">選擇負責人</h4>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, assigned_to: [] }))}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors"
                      >
                        清除
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAssignMenu(false)}
                        className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                      >
                        確認
                      </button>
                    </div>
                  </div>
                  {formData.assigned_to && formData.assigned_to.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      已選擇: {formData.assigned_to.length} 人
                    </div>
                  )}
                </div>
                
                {/* 人員列表 */}
                <div className="py-2">
                  {employees.map(employee => (
                    <label
                      key={employee.id}
                      className="w-full px-4 py-2 text-left text-sm flex items-center gap-3 hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.assigned_to?.includes(employee.teacher_fullname) || false}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              assigned_to: [...(prev.assigned_to || []), employee.teacher_fullname]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              assigned_to: prev.assigned_to?.filter(name => name !== employee.teacher_fullname) || []
                            }));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <div className="w-5 h-5 rounded-lg flex items-center justify-center bg-blue-100">
                        <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-[#2B3A3B]">{employee.teacher_fullname}</div>
                        {employee.teacher_nickname && (
                          <div className="text-xs text-gray-500">({employee.teacher_nickname})</div>
                        )}
                      </div>
                      <div className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                        教師
                      </div>
                    </label>
                  ))}
                  {admins.map(admin => (
                    <label
                      key={admin.id}
                      className="w-full px-4 py-2 text-left text-sm flex items-center gap-3 hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.assigned_to?.includes(admin.admin_name) || false}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              assigned_to: [...(prev.assigned_to || []), admin.admin_name]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              assigned_to: prev.assigned_to?.filter(name => name !== admin.admin_name) || []
                            }));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <div className="w-5 h-5 rounded-lg flex items-center justify-center bg-orange-100">
                        <svg className="w-3 h-3 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-[#2B3A3B]">{admin.admin_name}</div>
                      </div>
                      <div className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-700">
                        管理員
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 時間安排 */}
        <div>
          <label className="block text-lg font-semibold text-[#2B3A3B] mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#FF8C42]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"/>
            </svg>
            時間安排
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2B3A3B] mb-2">開始時間</label>
              <input
                type="datetime-local"
                value={formData.time_block_start || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, time_block_start: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-[#EADBC8] focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                autoComplete="off"
                inputMode="none"
                name={`time_block_start_${formInstanceId}`}
                key={`time_block_start_${formInstanceId}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2B3A3B] mb-2">結束時間</label>
              <input
                type="datetime-local"
                value={formData.time_block_end || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, time_block_end: e.target.value }))}
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.time_block_end ? 'border-red-300' : 'border-[#EADBC8]'
                } focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent`}
                autoComplete="off"
                inputMode="none"
                name={`time_block_end_${formInstanceId}`}
                key={`time_block_end_${formInstanceId}`}
              />
              {errors.time_block_end && (
                <p className="mt-1 text-sm text-red-600">{errors.time_block_end}</p>
              )}
            </div>
          </div>
        </div>


        {/* 按鈕 */}
        <div className="flex items-center justify-end gap-4 pt-8 border-t border-[#EADBC8]">
          <motion.button
            type="button"
            onClick={onCancel}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 text-[#2B3A3B] border-2 border-[#EADBC8] rounded-2xl hover:border-[#FFD59A] hover:bg-[#FFF9F2] transition-all duration-200 font-semibold"
            disabled={isLoading}
          >
            取消
          </motion.button>
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] rounded-2xl hover:from-[#EBC9A4] hover:to-[#FFD59A] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                </svg>
                處理中...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                </svg>
                {task ? '更新任務' : '創建任務'}
              </div>
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}
