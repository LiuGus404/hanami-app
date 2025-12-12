'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { Task } from '@/types/task-management';
import TaskDashboard from '@/components/task-management/TaskDashboard';
import TaskForm from '@/components/task-management/TaskForm';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import AppSidebar from '@/components/AppSidebar';

export default function AihomeTaskManagementPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useSaasAuth();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [personalTasks, setPersonalTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [taskFilter, setTaskFilter] = useState<'all' | 'personal' | 'shared'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // 檢查用戶認證狀態
    if (!authLoading && !user) {
      router.push('/aihome/auth/login');
      return;
    }
  }, [user, authLoading, router]);

  // 登出處理
  const handleLogout = async () => {
    console.log('handleLogout 函數被調用');
    console.log('當前用戶狀態:', { user: !!user, loading: authLoading });

    try {
      await logout();
      window.location.href = '/aihome/auth/login';

    } catch (error) {
      console.error('登出過程中發生錯誤:', error);
      // 即使發生錯誤也要強制跳轉
      window.location.href = '/aihome/auth/login';
    }
  };

  // 獲取任務數據
  const fetchTasks = async () => {
    if (!user) return;

    try {
      // 1. 獲取所有任務（用於顯示）
      const role = user.user_role || 'member';
      const allTasksResponse = await fetch(`/api/tasks?userRole=${role}`);
      if (allTasksResponse.ok) {
        const allTasksData = await allTasksResponse.json();
        setTasks(allTasksData.tasks || []);
      }

      // 2. 獲取個人任務（根據 email 對應關係）
      const personalTasksResponse = await fetch(`/api/tasks/personal?email=${encodeURIComponent(user.email || '')}`);
      if (personalTasksResponse.ok) {
        const personalTasksData = await personalTasksResponse.json();
        setPersonalTasks(personalTasksData.tasks || []);

        // 記錄調試信息
        if (personalTasksData.userInfo) {
          console.log('個人任務查找結果:', {
            saasUser: personalTasksData.userInfo.saasUser,
            correspondingName: personalTasksData.userInfo.correspondingName,
            adminUser: personalTasksData.userInfo.adminUser,
            employeeUser: personalTasksData.userInfo.employeeUser,
            email: personalTasksData.userInfo.email,
            taskCount: personalTasksData.tasks?.length || 0
          });
        }
      } else {
        console.error('獲取個人任務失敗:', personalTasksResponse.status);
        setPersonalTasks([]);
      }
    } catch (error) {
      console.error('獲取任務失敗:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  // 處理任務編輯
  const handleTaskEdit = (task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  // 處理創建新任務
  const handleTaskCreate = () => {
    setEditingTask(null);
    setShowTaskForm(true);
  };

  // 處理任務提交
  const handleTaskSubmit = async (taskData: any) => {
    setIsSubmitting(true);
    try {
      const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks';
      const method = editingTask ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...taskData,
          phone: user?.phone,
          created_by: user?.full_name
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || '提交失敗');
      }

      setShowTaskForm(false);
      setEditingTask(null);
      await fetchTasks(); // 重新獲取任務列表
    } catch (error) {
      console.error('任務提交失敗:', error);
      alert(error instanceof Error ? error.message : '提交失敗，請重試');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 計算個人任務（屬於當前用戶的任務）
  const getPersonalTasks = () => {
    return personalTasks;
  };

  // 計算共同任務（所有可見任務，包含已分配和未分配）
  // 用戶需求：被接任務也會顯示在共同任務裏
  const getSharedTasks = (taskList?: Task[]) => {
    const sourceTasks = taskList || filteredTasks;
    return sourceTasks;
  };

  // 計算任務完成率
  const getTaskCompletionRate = (taskList: Task[]) => {
    if (taskList.length === 0) return 0;
    const completedTasks = taskList.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / taskList.length) * 100);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FFF9F2] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD59A]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FFF9F2] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-hanami-text mb-4">權限不足</h1>
          <p className="text-hanami-text-secondary">請先登入以訪問此頁面</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A]">
      <div className="flex">
        {/* 側邊欄選單 */}
        <AppSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentPath="/aihome/task-management"
        />

        {/* 主內容區域 */}
        <div className="flex-1 flex flex-col">
          {/* 頂部導航欄 */}
          <nav className="bg-white/80 backdrop-blur-sm border-b border-[#EADBC8] sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-4">
                  {/* 選單按鈕 */}
                  <motion.button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors relative z-40"
                    title={sidebarOpen ? "關閉選單" : "開啟選單"}
                  >
                    <Bars3Icon className="w-6 h-6 text-[#4B4036]" />
                  </motion.button>

                  <div className="w-10 h-10 relative">
                    <img
                      src="/@hanami.png"
                      alt="HanamiEcho Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div>
                    <h1 className="text-xl font-bold text-[#4B4036]">工作提示系統</h1>
                    <p className="text-sm text-[#2B3A3B]">任務管理與進度追蹤</p>
                  </div>

                  {/* 切換至課堂活動管理按鈕 */}
                  <motion.button
                    onClick={() => router.push('/aihome/teacher-zone')}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative overflow-hidden px-4 py-2 bg-gradient-to-br from-[#E8F5E8] via-[#D4F1D4] to-[#C6E8C6] text-[#2B3A3B] rounded-xl hover:from-[#D4F1D4] hover:via-[#C6E8C6] hover:to-[#B8E0B8] transition-all duration-300 font-medium shadow-md hover:shadow-lg flex items-center gap-2 group border border-[#C6E8C6]/50"
                  >
                    {/* 背景裝飾 */}
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white/30 blur-sm group-hover:bg-white/40 transition-all duration-300" />
                    <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full bg-white/20 blur-sm group-hover:bg-white/30 transition-all duration-300" />

                    {/* 圖標 */}
                    <div className="relative z-10 w-4 h-4 bg-white/40 rounded-lg flex items-center justify-center group-hover:bg-white/50 transition-all duration-300 shadow-sm">
                      <svg className="w-3 h-3 text-[#4A7C59]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>

                    {/* 文字 */}
                    <span className="relative z-10 text-sm font-medium">課堂活動管理</span>

                    {/* 懸停效果 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  </motion.button>
                </div>

                {/* 右側用戶信息 */}
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#4B4036]">
                      {user.full_name || user.email}
                    </p>
                    <p className="text-xs text-[#2B3A3B]">歡迎回來</p>
                  </div>

                  <div className="w-8 h-8 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-[#4B4036]">
                      {user.full_name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>

                  <motion.button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('登出按鈕被點擊，事件:', e);
                      handleLogout();
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-[#2B3A3B] hover:text-[#4B4036] hover:bg-[#FFD59A]/20 rounded-lg transition-all duration-200"
                    title="登出"
                    type="button"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    <span>登出</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </nav>

          {/* 主要內容 */}
          <div className="flex-1 px-4 py-6 max-w-7xl mx-auto w-full">
            {/* Personal and Shared Task Cards (Kanban Header Style) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Personal Tasks - Pastel Purple Style */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setTaskFilter(taskFilter === 'personal' ? 'all' : 'personal')}
                className={`rounded-[2rem] p-6 cursor-pointer transition-all duration-300 min-h-[160px] flex flex-col justify-between
                  ${taskFilter === 'personal'
                    ? 'bg-[#EAE8FF] ring-2 ring-[#7B61FF] shadow-lg'
                    : 'bg-[#F2F0FF] hover:bg-[#EAE8FF]'
                  }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white text-[#7B61FF] font-bold flex items-center justify-center text-sm shadow-sm">
                        {getPersonalTasks().length}
                      </div>
                      <h3 className="text-xl font-bold text-[#2B3A3B] flex items-center gap-2">
                        <span>🧸</span> 個人任務
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleTaskCreate(); }}
                        className="w-8 h-8 rounded-full hover:bg-white/50 flex items-center justify-center text-[#7B61FF] transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      <button className="text-[#7B61FF]">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-[#2B3A3B]/60 pl-1">您負責的任務清單</p>
                </div>

                {/* Optional Status Indicators */}
                <div className="flex gap-2 mt-4">
                  <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-bold text-[#7B61FF]">
                    {getTaskCompletionRate(getPersonalTasks())}% 完成
                  </span>
                </div>
              </motion.div>

              {/* Shared Tasks - Pastel Blue Style */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setTaskFilter(taskFilter === 'shared' ? 'all' : 'shared')}
                className={`rounded-[2rem] p-6 cursor-pointer transition-all duration-300 min-h-[160px] flex flex-col justify-between
                  ${taskFilter === 'shared'
                    ? 'bg-[#E6F2FF] ring-2 ring-[#2F80ED] shadow-lg'
                    : 'bg-[#F0F8FF] hover:bg-[#E6F2FF]'
                  }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white text-[#2F80ED] font-bold flex items-center justify-center text-sm shadow-sm">
                        {getSharedTasks().length}
                      </div>
                      <h3 className="text-xl font-bold text-[#2B3A3B] flex items-center gap-2">
                        <span>🏰</span> 共同任務
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleTaskCreate(); }}
                        className="w-8 h-8 rounded-full hover:bg-white/50 flex items-center justify-center text-[#2F80ED] transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      <button className="text-[#2F80ED]">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-[#2B3A3B]/60 pl-1">未分配和選擇任務</p>
                </div>

                <div className="flex gap-2 mt-4">
                  <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-bold text-[#2F80ED]">
                    {getTaskCompletionRate(getSharedTasks())}% 完成
                  </span>
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
                userPhone={user?.phone}
                onTaskEdit={handleTaskEdit}
                onTaskCreate={handleTaskCreate}
                taskFilter={taskFilter}
                userSession={user}
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
                  className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-[#4B4036]">
                        {editingTask ? '編輯任務' : '創建新任務'}
                      </h2>
                      <button
                        onClick={() => {
                          setShowTaskForm(false);
                          setEditingTask(null);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                      </button>
                    </div>

                    <TaskForm
                      key={editingTask?.id || 'new-task'}
                      task={editingTask || undefined}
                      onSubmit={handleTaskSubmit}
                      orgId={user?.org_id}
                      onCancel={() => {
                        setShowTaskForm(false);
                        setEditingTask(null);
                      }}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
