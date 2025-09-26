'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getUserSession } from '@/lib/authUtils';
import { Task, CreateTaskForm, UpdateTaskForm } from '@/types/task-management';
import TaskDashboard from '@/components/task-management/TaskDashboard';
import TaskForm from '@/components/task-management/TaskForm';

export default function TaskManagementPage() {
  const router = useRouter();
  const [userSession, setUserSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [personalTasks, setPersonalTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [taskFilter, setTaskFilter] = useState<'all' | 'personal' | 'shared'>('all');

  useEffect(() => {
    // 檢查用戶會話
    const session = getUserSession();
    if (!session || session.role !== 'admin') {
      router.replace('/admin/login');
      return;
    }
    setUserSession(session);
    setLoading(false);
    fetchTasks();
  }, [router]);

  // 獲取個人任務數據
  useEffect(() => {
    if (userSession) {
      fetchPersonalTasks();
    }
  }, [userSession]);

  const fetchPersonalTasks = async () => {
    if (!userSession) return;
    
    try {
      // 先檢查新系統 (hanami-saas-system)
      const saasResponse = await fetch('/api/tasks?phone=' + encodeURIComponent(userSession.phone || ''));
      if (saasResponse.ok) {
        const saasData = await saasResponse.json();
        const saasTasks = saasData.tasks || [];
        
        // 如果新系統有任務，直接使用
        if (saasTasks.length > 0) {
          const personalTasks = saasTasks.filter((task: any) => 
            task.assigned_to && 
            task.assigned_to.includes(userSession.name || userSession.email)
          );
          setPersonalTasks(personalTasks);
          return;
        }
      }
      
      // 如果新系統沒有任務，查詢舊系統 (Hanami-AI-Student-Database)
      const oldSystemResponse = await fetch('/api/tasks/legacy?phone=' + encodeURIComponent(userSession.phone || ''));
      if (oldSystemResponse.ok) {
        const oldSystemData = await oldSystemResponse.json();
        setPersonalTasks(oldSystemData.tasks || []);
        return;
      }
      
      setPersonalTasks([]);
    } catch (error) {
      console.error('獲取個人任務失敗:', error);
      setPersonalTasks([]);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      if (!response.ok) throw new Error('Failed to fetch tasks');
      
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  };

  // 計算個人任務（屬於當前用戶的任務）
  const getPersonalTasks = () => {
    return personalTasks;
  };

  // 計算共同任務（沒有分配成員的任務）
  const getSharedTasks = (taskList?: Task[]) => {
    const sourceTasks = taskList || filteredTasks;
    return sourceTasks.filter(task => 
      !task.assigned_to || 
      task.assigned_to.length === 0
    );
  };

  // 計算任務完成率
  const getTaskCompletionRate = (taskList: Task[]) => {
    if (taskList.length === 0) return 0;
    const completedTasks = taskList.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / taskList.length) * 100);
  };


  const handleTaskCreate = () => {
    setEditingTask(null);
    setShowTaskForm(true);
  };

  const handleTaskEdit = (task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleTaskSubmit = async (data: CreateTaskForm | UpdateTaskForm) => {
    try {
      setIsSubmitting(true);
      
      const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks';
      const method = editingTask ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        let detailsMsg = '';
        try {
          const errJson = await response.json();
          detailsMsg = errJson?.details || errJson?.error || '';
        } catch (error) {
          console.error('解析錯誤響應失敗:', error);
        }
        throw new Error((editingTask ? '更新任務失敗' : '創建任務失敗') + (detailsMsg ? `：${detailsMsg}` : ''));
      }

      setShowTaskForm(false);
      setEditingTask(null);
      
      // 重新獲取任務數據以更新統計
      await fetchTasks();
      await fetchPersonalTasks();
    } catch (error) {
      console.error('Task submission error:', error);
      alert(error instanceof Error ? error.message : '操作失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTaskFormCancel = () => {
    setShowTaskForm(false);
    setEditingTask(null);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FFF9F2]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD59A] mx-auto" />
          <p className="mt-4 text-[#2B3A3B]">載入任務管理系統...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F2] p-6 relative overflow-hidden">
      {/* 背景裝飾 */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-br from-[#FFD59A]/40 to-[#FFB6C1]/30 blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-gradient-to-br from-[#EBC9A4]/40 to-[#FFD59A]/20 blur-3xl" />
        <div className="absolute -bottom-28 left-1/4 w-96 h-96 rounded-full bg-gradient-to-tr from-[#FFB6C1]/30 to-[#FFD59A]/20 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* 頁面標題 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#2B3A3B] mb-2 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-[#2B3A3B]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="#10B981"/>
                  </svg>
                </div>
                任務管理中心
              </h1>
              <p className="text-gray-600">
                管理您的日常工作任務，追蹤進度，提升效率
              </p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 text-[#2B3A3B] border border-[#EADBC8] rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
              返回管理面板
            </button>
          </div>
        </div>


        {/* 今日任務和本週任務卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* 個人任務 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`rounded-2xl p-6 border shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer ${
              taskFilter === 'personal' 
                ? 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300 ring-2 ring-blue-200' 
                : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
            }`}
            onClick={() => setTaskFilter(taskFilter === 'personal' ? 'all' : 'personal')}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500 rounded-xl">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#2B3A3B]">個人任務</h3>
                  <p className="text-sm text-gray-600">個人負責的任務</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{getPersonalTasks().length}</p>
                <p className="text-xs text-gray-500">個任務</p>
              </div>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${getTaskCompletionRate(getPersonalTasks())}%` }}
              ></div>
            </div>
            <div className="mt-2 text-xs text-blue-600 font-medium">
              完成率: {getTaskCompletionRate(getPersonalTasks())}%
            </div>
          </motion.div>

          {/* 共同任務 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`rounded-2xl p-6 border shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer ${
              taskFilter === 'shared' 
                ? 'bg-gradient-to-br from-green-100 to-green-200 border-green-300 ring-2 ring-green-200' 
                : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
            }`}
            onClick={() => setTaskFilter(taskFilter === 'shared' ? 'all' : 'shared')}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500 rounded-xl">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 7c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm2 3c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm-8 0c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm-2 3c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm6 0c-.29 0-.62.02-.97.05.02.01.03.03.05.04 1.14.83 1.92 1.91 1.92 3.91v2h3v-2c0-2.66-3.33-4-4-4zm-6-6c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#2B3A3B]">共同任務</h3>
                  <p className="text-sm text-gray-600">未分配成員的任務</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{getSharedTasks().length}</p>
                <p className="text-xs text-gray-500">個任務</p>
              </div>
            </div>
            <div className="w-full bg-green-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${getTaskCompletionRate(getSharedTasks())}%` }}
              ></div>
            </div>
            <div className="mt-2 text-xs text-green-600 font-medium">
              完成率: {getTaskCompletionRate(getSharedTasks())}%
            </div>
          </motion.div>
        </div>


        {/* 任務儀表板 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-6 border border-[#EADBC8] shadow-sm"
        >
          <TaskDashboard
            userPhone={userSession?.phone}
            onTaskEdit={handleTaskEdit}
            onTaskCreate={handleTaskCreate}
            taskFilter={taskFilter}
            userSession={userSession}
            personalTasks={personalTasks}
            onFilteredTasksChange={setFilteredTasks}
          />
        </motion.div>

        {/* 任務表單彈窗 */}
        <AnimatePresence>
          {showTaskForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
              onClick={handleTaskFormCancel}
            >
              <motion.div
                initial={{ y: 20, scale: 0.98, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <TaskForm
                  key={editingTask?.id || 'new-task'}
                  task={editingTask || undefined}
                  onSubmit={handleTaskSubmit}
                  onCancel={handleTaskFormCancel}
                  isLoading={isSubmitting}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
