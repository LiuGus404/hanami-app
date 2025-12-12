'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, CreateTaskForm, UpdateTaskForm, DEFAULT_PRIORITY_CONFIG, DEFAULT_CATEGORY_CONFIG, TaskTemplate } from '@/types/task-management';
import { supabase } from '@/lib/supabase';
import CategoryIcon from './CategoryIcon';
import TaskTemplateModal from './TaskTemplateModal';

interface TaskFormProps {
  task?: Task;
  onSubmit: (data: CreateTaskForm | UpdateTaskForm) => void;
  onCancel: () => void;
  isLoading?: boolean;
  canEditPoints?: boolean;
  orgId?: string;
}

export default function TaskForm({ task, onSubmit, onCancel, isLoading = false, canEditPoints = false, orgId }: TaskFormProps) {
  const [formInstanceId] = useState<string>(() => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`);

  // Form State
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
    project_id: '',
    points: 0,
    checklist: []
  });

  // UI State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [students, setStudents] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Checklist State Helper
  const [newChecklistItem, setNewChecklistItem] = useState('');

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: studentsData } = await supabase.from('Hanami_Students').select('id, full_name, contact_number, nick_name').order('full_name');

        let employeesQuery = supabase.from('hanami_employee').select('id, teacher_fullname, teacher_nickname, teacher_email').order('teacher_fullname');
        if (orgId) {
          employeesQuery = employeesQuery.eq('org_id', orgId);
        }
        const { data: employeesData } = await employeesQuery;

        const { data: adminsData } = await supabase.from('hanami_admin').select('id, admin_name, admin_email').order('admin_name');

        setStudents(studentsData || []);
        setEmployees(employeesData || []);
        setAdmins(adminsData || []);

        if (task?.phone) {
          const student = (studentsData || []).find((s: any) => s.contact_number === task.phone);
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

  // Init Form
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        follow_up_content: (task as any).follow_up_content || '',
        priority: task.priority || 'important_not_urgent',
        category: task.category || [],
        phone: task.phone || '',
        assigned_to: Array.isArray(task.assigned_to) ? task.assigned_to :
          (task.assigned_to && typeof task.assigned_to === 'string' ? (task.assigned_to as string).split(',') : []),
        due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
        time_block_start: task.time_block_start ? new Date(task.time_block_start).toISOString().slice(0, 16) : '',
        time_block_end: task.time_block_end ? new Date(task.time_block_end).toISOString().slice(0, 16) : '',
        is_public: !!task.is_public,
        project_id: task.project_id || '',
        points: task.points || 0,
        checklist: (task as any).checklist || []
      });
    } else {
      const tomorrow = new Date();
      tomorrow.setHours(tomorrow.getHours() + 24);
      setFormData({
        title: '',
        description: '',
        follow_up_content: '',
        priority: 'important_not_urgent',
        category: [],
        phone: '',
        assigned_to: [],
        due_date: tomorrow.toISOString().slice(0, 16),
        time_block_start: '',
        time_block_end: '',
        is_public: false,
        project_id: '',
        points: 0,
        checklist: []
      });
    }
  }, [task]);

  // --- Handlers ---

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = '標題為必填項目';
    if (formData.time_block_start && formData.time_block_end) {
      if (new Date(formData.time_block_start) >= new Date(formData.time_block_end)) {
        newErrors.time_block_end = '結束時間必須晚於開始時間';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submitData = {
      ...formData,
      due_date: formData.due_date ? new Date(formData.due_date).toISOString() : undefined,
      time_block_start: formData.time_block_start ? new Date(formData.time_block_start).toISOString() : undefined,
      time_block_end: formData.time_block_end ? new Date(formData.time_block_end).toISOString() : undefined,
    };
    onSubmit(submitData);
  };

  // Checklist Logic
  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      text: newChecklistItem.trim(),
      is_checked: false
    };
    setFormData(prev => ({ ...prev, checklist: [...(prev.checklist || []), newItem] }));
    setNewChecklistItem('');
  };

  const removeChecklistItem = (id: string) => {
    setFormData(prev => ({ ...prev, checklist: (prev.checklist || []).filter(item => item.id !== id) }));
  };

  const toggleChecklistItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: (prev.checklist || []).map(item => item.id === id ? { ...item, is_checked: !item.is_checked } : item)
    }));
  };

  // Template Logic
  // Template State
  const [editingTemplate, setEditingTemplate] = useState<{ id: string, name: string } | null>(null);

  const handleSaveTemplate = async () => {
    // If editing existing, confirm update
    if (editingTemplate) {
      if (window.confirm(`Update existing template "${editingTemplate.name}"?`)) {
        try {
          const response = await fetch('/api/tasks/templates', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: editingTemplate.id,
              name: editingTemplate.name,
              description: formData.description,
              task_data: {
                checklist: formData.checklist,
                follow_up_content: formData.follow_up_content
              }
            })
          });
          if (!response.ok) throw new Error('Failed');
          alert('Template updated!');
          setEditingTemplate(null); // Exit edit mode
          return;
        } catch (e) {
          alert('Failed to update template');
          return;
        }
      }
    }

    // Save New
    const name = window.prompt("請輸入模板名稱:");
    if (!name) return;

    try {
      const response = await fetch('/api/tasks/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: formData.description, // Optional description for the template itself
          task_data: {
            // Only save checklist and follow-up content
            checklist: formData.checklist,
            follow_up_content: formData.follow_up_content
          }
        })
      });
      if (!response.ok) throw new Error('Failed');
      alert('模板已保存！');
    } catch (e) {
      alert('保存模板失敗');
    }
  };

  const handleLoadTemplate = (template: TaskTemplate) => {
    // Just load data for new task, don't set editing state
    const data = template.task_data as any;
    setFormData(prev => ({
      ...prev,
      follow_up_content: data.follow_up_content || '',
      checklist: data.checklist || [],
    }));
    setShowTemplateModal(false);
  };

  const handleEditTemplate = (template: TaskTemplate) => {
    // Load for EDITING the template itself
    const data = template.task_data as any;
    setFormData(prev => ({
      ...prev,
      follow_up_content: data.follow_up_content || '',
      checklist: data.checklist || [],
    }));
    setEditingTemplate({ id: template.id, name: template.name });
    setShowTemplateModal(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-[#FFF9F2] rounded-[2.5rem] p-8 shadow-2xl border border-[#EADBC8] max-w-4xl mx-auto relative overflow-hidden"
    >
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#FFD59A]/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-[#2B3A3B] to-[#1a2324] rounded-2xl flex items-center justify-center shadow-lg text-white">
            {task ? <span className="text-2xl">✏️</span> : <span className="text-2xl">✨</span>}
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-[#2B3A3B] tracking-tight">
              {task ? '編輯任務' : '創建新任務'}
            </h2>
            <p className="text-[#2B3A3B]/60 font-medium">
              {task ? '更新任務詳情' : '擬定一個新任務'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowTemplateModal(true)}
            className="px-4 py-2 bg-white border-2 border-[#EADBC8] text-[#2B3A3B] rounded-xl font-bold text-sm hover:bg-[#FFD59A]/10 hover:border-[#FFD59A] transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            載入模板
          </button>
          <button
            type="button"
            onClick={handleSaveTemplate}
            className={`px-4 py-2 border-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 ${editingTemplate
              ? 'bg-blue-100 border-blue-400 text-blue-700 hover:bg-blue-200'
              : 'bg-[#FFD59A]/20 border-[#FFD59A] text-[#2B3A3B] hover:bg-[#FFD59A]/40'
              }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            {editingTemplate ? '更新模板' : '存為模板'}
          </button>
        </div>
      </div>

      {/* Banner for Editing Mode */}
      {editingTemplate && (
        <div className="bg-blue-50 border-b border-blue-100 px-8 py-2 flex justify-between items-center -mt-4 mb-6">
          <span className="text-sm text-blue-700 font-bold">
            編輯模板: "{editingTemplate.name}"
          </span>
          <button
            type="button"
            onClick={() => setEditingTemplate(null)}
            className="text-xs text-blue-500 hover:text-blue-700 underline"
          >
            取消編輯
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 relative z-10">

        {/* Main Input Group */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Core Info */}
          <div className="lg:col-span-2 space-y-6">

            {/* Points (Moved to Top) */}
            {canEditPoints && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-orange-100 flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">任務積分</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <input
                        type="number"
                        value={formData.points}
                        onChange={(e) => setFormData(p => ({ ...p, points: Math.max(0, parseInt(e.target.value) || 0) }))}
                        className="text-3xl font-bold text-[#2B3A3B] bg-transparent border-b-2 border-transparent hover:border-gray-200 focus:border-orange-400 focus:outline-none w-24 p-0 transition-colors"
                      />
                      <span className="text-sm font-normal text-gray-400">pts</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setFormData(p => ({ ...p, points: Math.max(0, (p.points || 0) - 10) }))} className="w-10 h-10 rounded-xl bg-gray-50 text-gray-600 font-bold hover:bg-gray-100 text-lg">-10</button>
                  <button type="button" onClick={() => setFormData(p => ({ ...p, points: (p.points || 0) + 10 }))} className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 font-bold hover:bg-orange-100 text-lg">+10</button>
                </div>
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#2B3A3B]/80 uppercase tracking-wider ml-1">標題</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="需要完成什麼工作？"
                className="w-full text-2xl font-bold bg-white border-none rounded-2xl p-5 shadow-sm focus:ring-4 focus:ring-[#FFD59A]/50 placeholder-gray-300"
              />
              {errors.title && <p className="text-red-500 text-sm font-bold ml-2">{errors.title}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#2B3A3B]/80 uppercase tracking-wider ml-1">描述</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="添加詳細說明..."
                className="w-full bg-white border-none rounded-2xl p-5 shadow-sm focus:ring-4 focus:ring-[#FFD59A]/50 resize-none"
              />
            </div>

            {/* Follow-up & Checklist */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-50 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="font-bold text-[#2B3A3B]">追蹤事項 & 檢查清單</h3>
              </div>

              <textarea
                value={formData.follow_up_content}
                onChange={e => setFormData({ ...formData, follow_up_content: e.target.value })}
                rows={2}
                placeholder="筆記或回覆內容..."
                className="w-full bg-[#FAFAFA] border-none rounded-xl p-4 focus:ring-2 focus:ring-orange-200 text-sm"
              />

              {/* Checklist Items */}
              <div className="space-y-2 mt-4">
                {formData.checklist?.map(item => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 bg-[#FAFAFA] p-2 rounded-xl group"
                  >
                    <button
                      type="button"
                      onClick={() => toggleChecklistItem(item.id)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${item.is_checked ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}
                    >
                      {item.is_checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </button>
                    <span className={`flex-1 text-sm font-medium ${item.is_checked ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                      {item.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeChecklistItem(item.id)}
                      className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      ✕
                    </button>
                  </motion.div>
                ))}

                {/* Add Item Input */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="w-5 h-5 rounded-full border-2 border-gray-200 border-dashed" />
                  <input
                    type="text"
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                    placeholder="添加檢查項目..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Clicked Add');
                      addChecklistItem();
                    }}
                    className={`text-sm font-bold px-4 py-2 rounded-lg transition-all border-2 ${newChecklistItem.trim()
                      ? 'bg-[#FFD59A] text-[#2B3A3B] border-[#FFD59A] cursor-pointer shadow-sm hover:shadow-md active:scale-95'
                      : 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed'
                      }`}
                  >
                    新增
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Settings */}
          <div className="space-y-6">

            {/* Teaching Task Type (Category) */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">教學任務類型</h3>
              <div className="grid grid-cols-4 gap-2">
                {DEFAULT_CATEGORY_CONFIG.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => {
                      const current = formData.category || [];
                      const exists = current.includes(cat.value);
                      setFormData({
                        ...formData,
                        category: exists ? current.filter(c => c !== cat.value) : [...current, cat.value]
                      });
                    }}
                    title={cat.label}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border-2 ${(formData.category || []).includes(cat.value)
                      ? 'border-[#FFD59A] bg-[#FFF9F2] shadow-sm'
                      : 'border-transparent bg-gray-50 hover:bg-gray-100'
                      }`}
                  >
                    <div className="text-xl">
                      <CategoryIcon category={cat.value} />
                    </div>
                  </button>
                ))}
              </div>
              {/* Label display for selected */}
              <div className="flex flex-wrap gap-2 mt-3 min-h-[24px]">
                {(formData.category || []).map(c => {
                  const cat = DEFAULT_CATEGORY_CONFIG.find(conf => conf.value === c);
                  return cat ? (
                    <span key={c} className="text-[10px] font-bold px-2 py-1 rounded-full bg-[#FFD59A]/30 text-[#2B3A3B]">
                      {cat.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            {/* Assigned Member */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">負責成員</h3>
              <div className="flex flex-wrap gap-2">
                {employees.map(emp => {
                  const isSelected = (formData.assigned_to || []).includes(emp.teacher_fullname || emp.teacher_nickname);
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => {
                        const current = formData.assigned_to || [];
                        const name = emp.teacher_fullname || emp.teacher_nickname;
                        if (current.includes(name)) {
                          setFormData({ ...formData, assigned_to: current.filter(n => n !== name) });
                        } else {
                          setFormData({ ...formData, assigned_to: [...current, name] });
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${isSelected
                        ? 'bg-[#2B3A3B] text-white border-[#2B3A3B]'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      {emp.teacher_fullname || emp.teacher_nickname}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">優先級</h3>
              <div className="grid grid-cols-2 gap-2">
                {DEFAULT_PRIORITY_CONFIG.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: p.value })}
                    className={`p-3 rounded-2xl border-2 text-left transition-all relative overflow-hidden group ${formData.priority === p.value ? 'border-[#FFD59A] bg-[#FFF9F2]' : 'border-transparent bg-gray-50 hover:bg-gray-100'}`}
                  >
                    <div className="text-xl mb-1 relative z-10">
                      {p.value === 'urgent_important' && (
                        <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                        </svg>
                      )}
                      {p.value === 'important_not_urgent' && (
                        <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      )}
                      {p.value === 'urgent_not_important' && (
                        <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {p.value === 'not_urgent_not_important' && (
                        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      )}
                    </div>
                    <div className="text-xs font-bold text-[#2B3A3B] leading-tight relative z-10">{p.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Visibility / Permissions */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">顯示權限</h3>
              <div className="space-y-3">
                {[
                  { label: 'Admin & Owner', value: ['owner', 'admin'] },
                  { label: 'Teacher', value: ['teacher'] },
                  { label: 'Member', value: ['member', 'student'] } // Assuming member/student are equivalent logic-wise for visibility group
                ].map((group) => {
                  // Check if all roles in this group are selected
                  const isSelected = group.value.every(r => (formData.visible_to_roles || []).includes(r));

                  return (
                    <div key={group.label} className="flex items-center gap-3">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          id={`visibility-${group.label}`}
                          className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-gray-200 transition-all checked:border-[#FFD59A] checked:bg-[#FFD59A]"
                          checked={isSelected}
                          onChange={(e) => {
                            const currentRoles = formData.visible_to_roles || [];
                            let newRoles = [...currentRoles];

                            if (e.target.checked) {
                              // Add roles that aren't already there
                              group.value.forEach(r => {
                                if (!newRoles.includes(r)) newRoles.push(r);
                              });
                            } else {
                              // Remove roles
                              newRoles = newRoles.filter(r => !group.value.includes(r));
                            }
                            setFormData({ ...formData, visible_to_roles: newRoles });
                          }}
                        />
                        <svg
                          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M10 3L4.5 8.5L2 6"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <label htmlFor={`visibility-${group.label}`} className="text-sm font-medium text-[#2B3A3B] cursor-pointer select-none">
                        {group.label}
                      </label>
                    </div>
                  );
                })}
                <p className="text-xs text-gray-400 mt-2">
                  * 未選擇任何權限時，預設對所有人可見
                </p>
              </div>
            </div>

            {/* Deadlines */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">時間安排</h3>
              <div className="space-y-4">
                {/* Due Date */}
                <div>
                  <label className="text-xs font-bold text-[#2B3A3B]/60 mb-1 block">截止日期</label>
                  <input
                    type="datetime-local"
                    value={formData.due_date}
                    onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full bg-[#FAFAFA] border-none rounded-xl p-3 text-sm font-medium text-[#2B3A3B]"
                  />
                </div>

                {/* Estimated Duration */}
                <div>
                  <label className="text-xs font-bold text-[#2B3A3B]/60 mb-1 block">預計完成時間 (分鐘)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="e.g. 30"
                      value={formData.estimated_duration || ''}
                      onChange={e => setFormData({ ...formData, estimated_duration: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#FAFAFA] border-none rounded-xl p-3 text-sm font-medium text-[#2B3A3B]"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold pointer-events-none">
                      min
                    </div>
                  </div>
                </div>

                {/* Quick Add Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => {
                    const d = new Date(); d.setDate(d.getDate() + 1);
                    setFormData({ ...formData, due_date: d.toISOString().slice(0, 16) })
                  }} className="px-2 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-lg hover:bg-green-100">+24小時</button>
                  <button type="button" onClick={() => {
                    const d = new Date(); d.setDate(d.getDate() + 7);
                    setFormData({ ...formData, due_date: d.toISOString().slice(0, 16) })
                  }} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100">+1週</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-[#EADBC8]/50">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-4 text-[#2B3A3B]/60 font-bold hover:text-[#2B3A3B] transition-colors"
            disabled={isLoading}
          >
            取消
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-10 py-4 bg-[#2B3A3B] text-white rounded-[20px] font-bold text-lg shadow-lg hover:scale-105 hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>}
            {task ? '更新任務' : '創建任務'}
          </button>
        </div>

      </form>

      {/* Template Modal */}
      <AnimatePresence>
        {showTemplateModal && (
          <TaskTemplateModal
            onSelect={handleLoadTemplate}
            onEdit={handleEditTemplate}
            onClose={() => setShowTemplateModal(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
