'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Task, CreateTaskForm, UpdateTaskForm } from '@/types/task-management';
import TaskDashboard from '@/components/task-management/TaskDashboard';
import TaskForm from '@/components/task-management/TaskForm';
import { TeacherLinkShell, useTeacherLinkOrganization } from '../TeacherLinkShell';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import CuteLoadingSpinner from '@/components/ui/CuteLoadingSpinner';
import BackButton from '@/components/ui/BackButton';
import { WithPermissionCheck } from '@/components/teacher-link/withPermissionCheck';
import { useTeacherLinkPermissions } from '@/hooks/useTeacherLinkPermissions';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function TaskManagementContent() {
  const router = useRouter();
  const { user: saasUser } = useSaasAuth();
  const { orgId, organization, organizationResolved, orgDataDisabled } = useTeacherLinkOrganization();
  const { role } = useTeacherLinkPermissions();

  const resolvedOrgId = React.useMemo(() => {
    if (orgId && UUID_REGEX.test(orgId) && orgId !== 'unassigned-org-placeholder') {
      return orgId;
    }
    if (organization?.id && UUID_REGEX.test(organization.id)) {
      return organization.id;
    }
    return null;
  }, [orgId, organization?.id]);

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [personalTasks, setPersonalTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [taskFilter, setTaskFilter] = useState<'all' | 'personal' | 'shared'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationResolved) {
      return;
    }

    if (orgDataDisabled || !resolvedOrgId) {
      setLoading(false);
      return;
    }

    fetchTasks();
    fetchPersonalTasks();
  }, [organizationResolved, orgDataDisabled, resolvedOrgId]);

  // 獲取個人任務數據
  const fetchPersonalTasks = async () => {
    if (!saasUser?.email) return;

    try {
      // 使用新的 API，包含 org_id 篩選（如果字段存在）
      const params = new URLSearchParams();
      params.append('userEmail', saasUser.email);
      if (resolvedOrgId) {
        params.append('orgId', resolvedOrgId);
      }

      const saasResponse = await fetch(`/api/tasks?${params}`);
      if (saasResponse.ok) {
        const saasData = await saasResponse.json();
        const saasTasks = saasData.tasks || [];

        // 過濾出分配給當前用戶的任務
        const personalTasks = saasTasks.filter((task: any) =>
          task.assigned_to &&
          Array.isArray(task.assigned_to) &&
          task.assigned_to.some((assignee: string) =>
            assignee.includes(saasUser.email || '') ||
            assignee.includes(saasUser.full_name || '')
          )
        );
        setPersonalTasks(personalTasks);
        setLoading(false);
        return;
      }

      setPersonalTasks([]);
      setLoading(false);
    } catch (error) {
      console.error('獲取個人任務失敗:', error);
      setPersonalTasks([]);
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    if (!resolvedOrgId) {
      setLoading(false);
      return;
    }

    try {
      const userEmail = saasUser?.email || '';
      // 使用新的 API，包含 org_id 篩選（如果字段存在）
      const params = new URLSearchParams();
      params.append('userEmail', userEmail);
      if (resolvedOrgId) {
        params.append('orgId', resolvedOrgId);
      }
      // Pass role for visibility filtering
      if (role) {
        params.append('userRole', role);
      }

      const response = await fetch(`/api/tasks?${params}`);
      if (!response.ok) throw new Error('Failed to fetch tasks');

      const data = await response.json();
      setTasks(data.tasks || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setLoading(false);
    }
  };

  // 計算個人任務（屬於當前用戶的任務）
  const getPersonalTasks = () => {
    return personalTasks;
  };

  // 計算共同任務（所有可見任務，包含已分配和未分配）
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

  const handleTaskCreate = () => {
    setEditingTask(null);
    setShowTaskForm(true);
  };

  const handleTaskEdit = (task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleTaskDelete = async (task: Task) => {
    if (!confirm('確定要刪除此任務嗎？')) return;
    
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('刪除任務失敗');

      await fetchTasks();
    } catch (error) {
      console.error('刪除任務失敗:', error);
      alert('刪除任務失敗');
    }
  };

  const handleTaskStatusChange = async (task: Task, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...task, status: newStatus }),
      });

      if (!response.ok) throw new Error('更新任務狀態失敗');

      await fetchTasks();
    } catch (error) {
      console.error('更新任務狀態失敗:', error);
      alert('更新任務狀態失敗');
    }
  };

  const handleTaskProgressUpdate = async (task: Task, progress: number) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...task, progress }),
      });

      if (!response.ok) throw new Error('更新任務進度失敗');

      await fetchTasks();
    } catch (error) {
      console.error('更新任務進度失敗:', error);
      alert('更新任務進度失敗');
    }
  };

  const handleTaskAssign = async (task: Task, assignedTo: string[]) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...task, assigned_to: assignedTo }),
      });

      if (!response.ok) throw new Error('分配任務失敗');

      await fetchTasks();
    } catch (error) {
      console.error('分配任務失敗:', error);
      alert('分配任務失敗');
    }
  };

  const handleTaskSubmit = async (data: CreateTaskForm | UpdateTaskForm) => {
    try {
      setIsSubmitting(true);

      const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks';
      const method = editingTask ? 'PUT' : 'POST';

      // 添加 org_id 到任務數據（如果字段存在）
      const taskData = {
        ...data,
        org_id: resolvedOrgId || undefined, // 如果字段不存在，API 會忽略這個字段
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
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

  if (orgDataDisabled) {
    return null;
  }

  if (loading || !organizationResolved) {
    return <CuteLoadingSpinner message="載入任務管理系統..." className="h-full min-h-[320px] p-8" />;
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
        {/* 返回按鈕 */}
        <div className="mb-6">
          <BackButton href="/aihome/teacher-link/create" label="返回管理面板" />
        </div>

        {/* 頁面標題 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#2B3A3B] mb-2 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shadow-sm hover:scale-105 transition-transform">
                  <img src="/rabbit.png" alt="Task Center" className="w-full h-full object-cover" />
                </div>
                任務管理中心
              </h1>
              <p className="text-gray-600">
                管理您的日常工作任務，追蹤進度，提升效率
              </p>
            </div>
          </div>
        </div>

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
            userPhone={saasUser?.email}
            orgId={resolvedOrgId || undefined}
            userEmail={saasUser?.email}
            onTaskEdit={handleTaskEdit}
            onTaskDelete={handleTaskDelete}
            onTaskStatusChange={handleTaskStatusChange}
            onTaskProgressUpdate={handleTaskProgressUpdate}
            onTaskAssign={handleTaskAssign}
            onTaskCreate={handleTaskCreate}
            taskFilter={taskFilter}
            userSession={{ email: saasUser?.email, name: saasUser?.full_name }}
            personalTasks={personalTasks}
            onFilteredTasksChange={setFilteredTasks}
            canApprove={role === 'owner' || role === 'admin'}
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
                  canEditPoints={role === 'owner' || role === 'admin'}
                  orgId={resolvedOrgId || undefined}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function TaskManagementPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/task-management">
      <WithPermissionCheck pageKey="tasks">
        <TaskManagementContent />
      </WithPermissionCheck>
    </TeacherLinkShell>
  );
}
