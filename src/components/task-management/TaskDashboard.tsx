'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Task, TaskStats, DEFAULT_PRIORITY_CONFIG, DEFAULT_STATUS_CONFIG } from '@/types/task-management';
import TaskCard from './TaskCard';
import CategoryIcon from './CategoryIcon';
import Calendarui from '../ui/Calendarui';

interface TaskDashboardProps {
  userPhone?: string;
  orgId?: string | null;
  userEmail?: string;
  onTaskEdit?: (task: Task) => void;
  onTaskCreate?: () => void;
  taskFilter?: 'all' | 'personal' | 'shared';
  userSession?: any;
  personalTasks?: Task[];
  onFilteredTasksChange?: (tasks: Task[]) => void;
}

export default function TaskDashboard({ userPhone, orgId, userEmail, onTaskEdit, onTaskCreate, taskFilter, userSession, personalTasks, onFilteredTasksChange }: TaskDashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string[]>(['pending', 'in_progress']);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<Date[]>([]);
  const [dateFilterCount, setDateFilterCount] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'created_at' | 'due_date' | 'priority' | 'status'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, [userPhone, orgId, userEmail, statusFilter, priorityFilter, categoryFilter, dateFilter, sortBy, sortOrder]);

  // 更新日期篩選計數
  useEffect(() => {
    const count = calculateDateFilterCount();
    setDateFilterCount(count);
  }, [dateFilter, tasks]);

  // 計算篩選後的任務
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // 根據 taskFilter 進行額外篩選
    if (taskFilter === 'personal' && personalTasks) {
      filtered = personalTasks;
    } else if (taskFilter === 'shared') {
      filtered = tasks.filter(task => 
        !task.assigned_to || 
        task.assigned_to.length === 0
      );
    }

    return filtered;
  }, [tasks, taskFilter, personalTasks]);

  // 通知父組件篩選後的任務數據變化
  useEffect(() => {
    if (onFilteredTasksChange) {
      onFilteredTasksChange(filteredTasks);
    }
  }, [filteredTasks, onFilteredTasksChange]);

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-menu')) {
        setShowStatusMenu(false);
        setShowPriorityMenu(false);
        setShowCategoryMenu(false);
        setShowDateMenu(false);
        setShowSortMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (userPhone) params.append('phone', userPhone);
      
      // 狀態篩選
      if (statusFilter.length > 0 && !statusFilter.includes('all')) {
        statusFilter.forEach(status => params.append('status', status));
      }
      
      // 優先級篩選
      if (priorityFilter.length > 0) {
        priorityFilter.forEach(priority => params.append('priority', priority));
      }
      
      // 類別篩選
      if (categoryFilter.length > 0) {
        categoryFilter.forEach(category => params.append('category', category));
      }
      
      // 日期篩選
      if (dateFilter.length > 0) {
        dateFilter.forEach(date => {
          const dateStr = date.toISOString().split('T')[0];
          params.append('created_date', dateStr);
        });
      }
      
      // 排序
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);
      params.append('limit', '50');
      
      // 添加 org_id 和 userEmail 參數
      if (orgId) {
        params.append('orgId', orgId);
      }
      if (userEmail) {
        params.append('userEmail', userEmail);
      }

      const response = await fetch(`/api/tasks?${params}`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入任務失敗');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (orgId) {
        params.append('orgId', orgId);
      }
      if (userEmail) {
        params.append('userEmail', userEmail);
      }
      
      const response = await fetch(`/api/tasks/stats?${params}`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleDateFilterChange = (dates: Date[]) => {
    setDateFilter(dates);
  };

  const handleDateFilterClear = () => {
    setDateFilter([]);
  };

  // 清除所有篩選條件
  const handleClearAllFilters = () => {
    setStatusFilter(['pending', 'in_progress']); // 重置為默認狀態
    setPriorityFilter([]);
    setCategoryFilter([]);
    setDateFilter([]);
    setSortBy('created_at');
    setSortOrder('desc');
  };

  // 計算選中日期對應的任務數量
  const calculateDateFilterCount = () => {
    if (dateFilter.length === 0) return 0;
    
    // 將選中的日期轉換為字符串格式
    const selectedDateStrings = dateFilter.map(date => date.toISOString().split('T')[0]);
    
    // 計算在選中日期創建的任務數量
    const count = tasks.filter(task => {
      if (!task.created_at) return false;
      const taskDate = new Date(task.created_at).toISOString().split('T')[0];
      return selectedDateStrings.includes(taskDate);
    }).length;
    
    
    return count;
  };

  const handleTaskStatusChange = async (task: Task, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update task status');
      
      const updatedTask = await response.json();
      setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新任務狀態失敗');
    }
  };

  const handleTaskProgressUpdate = async (task: Task, progress: number) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          progress_percentage: progress,
          status: progress === 100 ? 'completed' : task.status
        })
      });

      if (!response.ok) throw new Error('Failed to update task progress');
      
      const updatedTask = await response.json();
      setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新任務進度失敗');
    }
  };

  const handleTaskAssign = async (task: Task, assignedTo: string[]) => {
    try {
      // 立即更新本地狀態以提供即時反饋
      const updatedTask = { ...task, assigned_to: assignedTo };
      setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
      
      // 同時更新後端
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: assignedTo.length > 0 ? assignedTo : null })
      });

      if (!response.ok) {
        // 如果後端更新失敗，回滾本地狀態
        setTasks(prev => prev.map(t => t.id === task.id ? task : t));
        throw new Error('Failed to assign task');
      }
      
      // 重新獲取最新數據以確保同步
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : '分配任務失敗');
    }
  };

  const handleTaskDelete = async (task: Task) => {
    try {
      // 立即從本地狀態中移除任務以提供即時反饋
      setTasks(prev => prev.filter(t => t.id !== task.id));
      
      // 同時從後端刪除
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        // 如果後端刪除失敗，重新獲取任務列表以恢復狀態
        await fetchTasks();
        throw new Error('Failed to delete task');
      }
      
      // 重新獲取任務列表以確保同步
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : '刪除任務失敗');
    }
  };

  // 現在篩選在 API 層面處理，所以直接使用 tasks

  const getStatusTasks = (status: string) => {
    return tasks.filter(task => task.status === status).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD59A]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 錯誤訊息 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}


      {/* 優先級統計 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {DEFAULT_PRIORITY_CONFIG.map((priority) => (
          <motion.div
            key={priority.value}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, y: -2 }}
              className={`rounded-2xl p-4 border text-center cursor-pointer hover:shadow-lg transition-all duration-300 ${
                priorityFilter.includes(priority.value)
                  ? 'bg-gradient-to-br from-[#FFF2CC] to-[#FFD9B3] border-[#FFB366] shadow-lg ring-2 ring-[#FFB366]/20'
                  : 'bg-white border-[#EADBC8] hover:border-[#FFB366]/40'
              }`}
            onClick={() => {
              if (priorityFilter.includes(priority.value)) {
                setPriorityFilter(priorityFilter.filter(p => p !== priority.value));
              } else {
                setPriorityFilter([...priorityFilter, priority.value]);
              }
            }}
          >
            <div className="mb-2 flex justify-center">
              <div className={`p-2 rounded-xl ${
                priority.value === 'urgent_important' ? 'bg-red-100' :
                priority.value === 'important_not_urgent' ? 'bg-orange-100' :
                priority.value === 'urgent_not_important' ? 'bg-yellow-100' :
                'bg-gray-100'
              }`}>
                <svg className={`w-6 h-6 ${
                  priority.value === 'urgent_important' ? 'text-red-600' :
                  priority.value === 'important_not_urgent' ? 'text-orange-600' :
                  priority.value === 'urgent_not_important' ? 'text-yellow-600' :
                  'text-gray-600'
                }`} fill="currentColor" viewBox="0 0 24 24">
                  {priority.value === 'urgent_important' && (
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  )}
                  {priority.value === 'important_not_urgent' && (
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  )}
                  {priority.value === 'urgent_not_important' && (
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                  )}
                  {priority.value === 'not_urgent_not_important' && (
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  )}
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-[#2B3A3B]">
              {tasks.filter(task => task.priority === priority.value).length}
            </div>
            <div className="text-sm text-gray-600">{priority.label}</div>
          </motion.div>
        ))}
      </div>

      {/* 狀態統計 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {DEFAULT_STATUS_CONFIG.map((status) => (
          <motion.div
            key={status.value}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, y: -2 }}
              className={`rounded-2xl p-4 border text-center cursor-pointer hover:shadow-lg transition-all duration-300 ${
                statusFilter.includes(status.value) || (statusFilter.includes('all' as any) && (status.value as any) !== 'all')
                  ? 'bg-gradient-to-br from-[#FFF2CC] to-[#FFD9B3] border-[#FFB366] shadow-lg ring-2 ring-[#FFB366]/20'
                  : 'bg-white border-[#EADBC8] hover:border-[#FFB366]/40'
              }`}
            onClick={() => {
              if (statusFilter.includes(status.value)) {
                setStatusFilter(statusFilter.filter(s => s !== status.value));
              } else {
                setStatusFilter([...statusFilter.filter(s => s !== 'all'), status.value]);
              }
            }}
          >
            <div className="mb-2 flex justify-center">
              <div className={`p-2 rounded-xl ${
                status.value === 'pending' ? 'bg-gray-100' :
                status.value === 'in_progress' ? 'bg-blue-100' :
                status.value === 'completed' ? 'bg-green-100' :
                status.value === 'cancelled' ? 'bg-red-100' :
                'bg-yellow-100'
              }`}>
                <svg className={`w-6 h-6 ${
                  status.value === 'pending' ? 'text-gray-600' :
                  status.value === 'in_progress' ? 'text-blue-600' :
                  status.value === 'completed' ? 'text-green-600' :
                  status.value === 'cancelled' ? 'text-red-600' :
                  'text-yellow-600'
                }`} fill="currentColor" viewBox="0 0 24 24">
                  {status.value === 'pending' && (
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  )}
                  {status.value === 'in_progress' && (
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                  )}
                  {status.value === 'completed' && (
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                  )}
                  {status.value === 'cancelled' && (
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  )}
                  {status.value === 'blocked' && (
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  )}
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-[#2B3A3B]">
              {getStatusTasks(status.value)}
            </div>
            <div className="text-sm text-gray-600">{status.label}</div>
          </motion.div>
        ))}
      </div>

       {/* 篩選和排序控制 */}
       <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        {/* 狀態篩選 */}
        <div className="relative dropdown-menu">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className="px-2 py-1.5 sm:px-4 sm:py-2 bg-white border border-[#EADBC8] rounded-md sm:rounded-lg text-xs sm:text-sm font-medium text-[#2B3A3B] hover:bg-gradient-to-r hover:from-[#FFF2CC]/30 hover:to-[#FFD9B3]/30 hover:border-[#FFB366]/40 transition-all duration-200 flex items-center gap-1 sm:gap-2"
          >
            <span>狀態: {statusFilter.includes('all') ? '全部' : `${statusFilter.length} 項`}</span>
            <svg className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${showStatusMenu ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </button>
          
          {showStatusMenu && (
            <div className="absolute top-full left-0 z-50 bg-white rounded-lg shadow-lg border border-[#EADBC8] mt-1 min-w-[180px] sm:min-w-[200px] max-w-[90vw]">
              <div className="p-2">
                {[
                  { value: 'all', label: '全部' },
                  { value: 'pending', label: '等待中' },
                  { value: 'in_progress', label: '進行中' },
                  { value: 'completed', label: '已完成' },
                  { value: 'cancelled', label: '已取消' },
                  { value: 'blocked', label: '已阻塞' }
                ].map((status) => (
                  <label key={status.value} className="flex items-center gap-2 p-2 hover:bg-gradient-to-r hover:from-[#FFF2CC]/30 hover:to-[#FFD9B3]/30 rounded cursor-pointer transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={statusFilter.includes(status.value)}
                      onChange={(e) => {
                        if (status.value === 'all') {
                          setStatusFilter(e.target.checked ? ['all'] : []);
                        } else {
                          const newFilter = statusFilter.filter(f => f !== 'all');
                          if (e.target.checked) {
                            setStatusFilter([...newFilter, status.value]);
                          } else {
                            setStatusFilter(newFilter);
                          }
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm">{status.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 優先級篩選 */}
        <div className="relative dropdown-menu">
          <button
            onClick={() => setShowPriorityMenu(!showPriorityMenu)}
            className="px-2 py-1.5 sm:px-4 sm:py-2 bg-white border border-[#EADBC8] rounded-md sm:rounded-lg text-xs sm:text-sm font-medium text-[#2B3A3B] hover:bg-gradient-to-r hover:from-[#FFF2CC]/30 hover:to-[#FFD9B3]/30 hover:border-[#FFB366]/40 transition-all duration-200 flex items-center gap-1 sm:gap-2"
          >
            <span>優先級: {priorityFilter.length === 0 ? '全部' : `${priorityFilter.length} 項`}</span>
            <svg className={`w-4 h-4 transition-transform ${showPriorityMenu ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </button>
          
          {showPriorityMenu && (
            <div className="absolute top-full left-0 z-50 bg-white rounded-lg shadow-lg border border-[#EADBC8] mt-1 min-w-[180px] sm:min-w-[200px] max-w-[90vw]">
              <div className="p-2">
                {[
                  { value: 'urgent_important', label: '緊急重要' },
                  { value: 'important_not_urgent', label: '重要不緊急' },
                  { value: 'urgent_not_important', label: '緊急不重要' },
                  { value: 'not_urgent_not_important', label: '不緊急不重要' }
                ].map((priority) => (
                  <label key={priority.value} className="flex items-center gap-2 p-2 hover:bg-gradient-to-r hover:from-[#FFF2CC]/30 hover:to-[#FFD9B3]/30 rounded cursor-pointer transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={priorityFilter.includes(priority.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPriorityFilter([...priorityFilter, priority.value]);
                        } else {
                          setPriorityFilter(priorityFilter.filter(p => p !== priority.value));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm">{priority.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 類別篩選 */}
        <div className="relative dropdown-menu">
          <button
            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
            className="px-2 py-1.5 sm:px-4 sm:py-2 bg-white border border-[#EADBC8] rounded-md sm:rounded-lg text-xs sm:text-sm font-medium text-[#2B3A3B] hover:bg-gradient-to-r hover:from-[#FFF2CC]/30 hover:to-[#FFD9B3]/30 hover:border-[#FFB366]/40 transition-all duration-200 flex items-center gap-1 sm:gap-2"
          >
            <span>類別: {categoryFilter.length === 0 ? '全部' : `${categoryFilter.length} 項`}</span>
            <svg className={`w-4 h-4 transition-transform ${showCategoryMenu ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </button>
          
          {showCategoryMenu && (
            <div className="absolute top-full left-0 z-50 bg-white rounded-lg shadow-lg border border-[#EADBC8] mt-1 min-w-[180px] sm:min-w-[200px] max-w-[90vw]">
              <div className="p-2">
                {[
                  { value: 'progress_tracking', label: '進度追蹤' },
                  { value: 'video_production', label: '影片製作' },
                  { value: 'photo_processing', label: '照片處理' },
                  { value: 'learning_related', label: '學習相關' },
                  { value: 'registration_processing', label: '報名處理' },
                  { value: 'course_inquiry', label: '課程查詢' },
                  { value: 'leave_processing', label: '請假處理' },
                  { value: 'payment_processing', label: '付款處理' },
                  { value: 'technical_support', label: '技術支援' },
                  { value: 'schedule_arrangement', label: '時間安排' },
                  { value: 'life_related', label: '生活相關' },
                  { value: 'complaint_handling', label: '投訴處理' },
                  { value: 'other', label: '其他' }
                ].map((category) => (
                  <label key={category.value} className="flex items-center gap-3 p-2 hover:bg-gradient-to-r hover:from-[#FFF2CC]/30 hover:to-[#FFD9B3]/30 rounded cursor-pointer transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={categoryFilter.includes(category.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCategoryFilter([...categoryFilter, category.value]);
                        } else {
                          setCategoryFilter(categoryFilter.filter(c => c !== category.value));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="w-5 h-5 flex items-center justify-center">
                      <CategoryIcon category={category.value} className="w-4 h-4" />
                    </div>
                    <span className="text-sm">{category.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 日期篩選 */}
        <div className="relative dropdown-menu">
          <button
            onClick={() => setShowDateMenu(!showDateMenu)}
            className="px-2 py-1.5 sm:px-4 sm:py-2 bg-white border border-[#EADBC8] rounded-md sm:rounded-lg text-xs sm:text-sm font-medium text-[#2B3A3B] hover:bg-gradient-to-r hover:from-[#FFF2CC]/30 hover:to-[#FFD9B3]/30 hover:border-[#FFB366]/40 transition-all duration-200 flex items-center gap-1 sm:gap-2"
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
            </svg>
            <span>日期: {dateFilter.length > 0 ? `${dateFilter.length} 天${dateFilterCount > 0 ? ` (${dateFilterCount} 任務)` : ''}` : '全部'}</span>
            <svg className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${showDateMenu ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </button>
          
          {showDateMenu && (
            <div className="absolute top-full left-0 z-50 bg-white rounded-lg shadow-lg border border-[#EADBC8] mt-1 min-w-[300px] sm:min-w-[350px] max-w-[90vw]">
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-sm font-medium text-[#2B3A3B]">選擇任務創建日期</span>
                    {dateFilter.length > 0 && (
                      <div className="text-xs text-[#FFB366] mt-1">
                        已選中 {dateFilter.length} 天{dateFilterCount > 0 ? `，共 ${dateFilterCount} 個任務` : '，無任務'}
                      </div>
                    )}
                  </div>
                  {dateFilter.length > 0 && (
                    <button
                      onClick={handleDateFilterClear}
                      className="text-xs text-[#FFB366] hover:text-[#FF8C42] transition-colors"
                    >
                      清除
                    </button>
                  )}
                </div>
                
                {dateFilter.length > 0 && (
                  <div className="mb-3 p-2 bg-[#FFF2CC]/20 rounded-lg border border-[#FFD9B3]">
                    <div className="text-xs text-[#4B4036] mb-1">已選擇：</div>
                    <div className="flex flex-wrap gap-1">
                      {dateFilter.map((date, index) => (
                        <span key={index} className="text-xs bg-[#FFD9B3] px-2 py-1 rounded-full text-[#4B4036]">
                          {date.toLocaleDateString('zh-TW')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <Calendarui
                  value={dateFilter}
                  onChange={handleDateFilterChange}
                  onClose={() => setShowDateMenu(false)}
                  multiple={true}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* 排序方式 */}
        <div className="relative dropdown-menu">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="px-2 py-1.5 sm:px-4 sm:py-2 bg-white border border-[#EADBC8] rounded-md sm:rounded-lg text-xs sm:text-sm font-medium text-[#2B3A3B] hover:bg-gradient-to-r hover:from-[#FFF2CC]/30 hover:to-[#FFD9B3]/30 hover:border-[#FFB366]/40 transition-all duration-200 flex items-center gap-1 sm:gap-2"
          >
            <span>排序: {
              sortBy === 'created_at' ? '創建時間' :
              sortBy === 'due_date' ? '截止日期' :
              sortBy === 'priority' ? '優先級' : '狀態'
            } ({sortOrder === 'asc' ? '升序' : '降序'})</span>
            <svg className={`w-4 h-4 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </button>
          
          {showSortMenu && (
            <div className="absolute top-full left-0 z-50 bg-white rounded-lg shadow-lg border border-[#EADBC8] mt-1 min-w-[180px] sm:min-w-[200px] max-w-[90vw]">
              <div className="p-2">
                <div className="text-xs text-gray-500 mb-2">排序欄位</div>
                {[
                  { value: 'created_at', label: '創建時間' },
                  { value: 'due_date', label: '截止日期' },
                  { value: 'priority', label: '優先級' },
                  { value: 'status', label: '狀態' }
                ].map((sort) => (
                  <button
                    key={sort.value}
                    onClick={() => setSortBy(sort.value as any)}
                    className={`w-full text-left p-2 rounded hover:bg-[#FFF2CC]/30 text-sm transition-colors ${
                      sortBy === sort.value ? 'bg-gradient-to-r from-[#FFF2CC]/40 to-[#FFD9B3]/40 text-[#FFB366] font-medium' : 'text-[#2B3A3B]'
                    }`}
                  >
                    {sort.label}
                  </button>
                ))}
                <div className="border-t my-2"></div>
                <div className="text-xs text-gray-500 mb-2">排序順序</div>
                {[
                  { value: 'desc', label: '降序' },
                  { value: 'asc', label: '升序' }
                ].map((order) => (
                  <button
                    key={order.value}
                    onClick={() => setSortOrder(order.value as any)}
                    className={`w-full text-left p-2 rounded hover:bg-[#FFF2CC]/30 text-sm transition-colors ${
                      sortOrder === order.value ? 'bg-gradient-to-r from-[#FFF2CC]/40 to-[#FFD9B3]/40 text-[#FFB366] font-medium' : 'text-[#2B3A3B]'
                    }`}
                  >
                    {order.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 操作按鈕區域 */}
      <div className="flex justify-end gap-3">
        {/* 清除篩選按鈕 */}
        <motion.button
          onClick={handleClearAllFilters}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="relative overflow-hidden px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-br from-[#FEF2F2] via-[#FEE2E2] to-[#FECACA] text-[#2B3A3B] rounded-xl sm:rounded-2xl hover:from-[#FEE2E2] hover:via-[#FECACA] hover:to-[#FCA5A5] transition-all duration-300 font-medium sm:font-semibold shadow-md hover:shadow-lg flex items-center gap-2 sm:gap-3 group text-sm sm:text-base border border-[#FECACA]/50"
        >
          {/* 背景裝飾 */}
          <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-white/30 blur-sm group-hover:bg-white/40 transition-all duration-300" />
          <div className="absolute -bottom-0.5 -left-0.5 sm:-bottom-1 sm:-left-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-white/20 blur-sm group-hover:bg-white/30 transition-all duration-300" />
          
          {/* 圖標 */}
          <div className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 bg-white/40 rounded-lg flex items-center justify-center group-hover:bg-white/50 transition-all duration-300 shadow-sm">
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#DC2626]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </div>
          
          {/* 文字 */}
          <span className="relative z-10 hidden sm:inline font-medium">清除篩選</span>
          <span className="relative z-10 sm:hidden font-medium">清除</span>
          
          {/* 懸停效果 */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        </motion.button>

        {/* 刷新按鈕 */}
        <motion.button
          onClick={fetchTasks}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          disabled={loading}
          className="relative overflow-hidden px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-br from-[#F0F9F0] via-[#E8F5E8] to-[#D4F1D4] text-[#2B3A3B] rounded-xl sm:rounded-2xl hover:from-[#E8F5E8] hover:via-[#D4F1D4] hover:to-[#C8E6C9] transition-all duration-300 font-medium sm:font-semibold shadow-md hover:shadow-lg flex items-center gap-2 sm:gap-3 group text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed border border-[#E0F2E0]/50"
        >
          {/* 背景裝飾 */}
          <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-white/30 blur-sm group-hover:bg-white/40 transition-all duration-300" />
          <div className="absolute -bottom-0.5 -left-0.5 sm:-bottom-1 sm:-left-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-white/20 blur-sm group-hover:bg-white/30 transition-all duration-300" />
          
          {/* 圖標 */}
          <div className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 bg-white/40 rounded-lg flex items-center justify-center group-hover:bg-white/50 transition-all duration-300 shadow-sm">
            <svg 
              className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#4A7C59] ${loading ? 'animate-spin' : ''}`} 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </div>
          
          {/* 文字 */}
          <span className="relative z-10 hidden sm:inline font-medium">刷新</span>
          <span className="relative z-10 sm:hidden font-medium">刷新</span>
          
          {/* 懸停效果 */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        </motion.button>

        {/* 創建任務按鈕 */}
        <motion.button
          onClick={onTaskCreate}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="relative overflow-hidden px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 bg-gradient-to-br from-[#FFF4E6] via-[#FFE8CC] to-[#FFD59A] text-[#2B3A3B] rounded-xl sm:rounded-2xl hover:from-[#FFE8CC] hover:via-[#FFD59A] hover:to-[#EBC9A4] transition-all duration-300 font-medium sm:font-semibold shadow-md hover:shadow-lg flex items-center gap-2 sm:gap-3 group text-sm sm:text-base border border-[#FFD59A]/50"
        >
          {/* 背景裝飾 */}
          <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full bg-white/30 blur-sm group-hover:bg-white/40 transition-all duration-300" />
          <div className="absolute -bottom-0.5 -left-0.5 sm:-bottom-1 sm:-left-1 w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 rounded-full bg-white/20 blur-sm group-hover:bg-white/30 transition-all duration-300" />
          
          {/* 圖標 */}
          <div className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-white/40 rounded-lg flex items-center justify-center group-hover:bg-white/50 transition-all duration-300 shadow-sm">
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-[#B8860B]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </div>
          
          {/* 文字 */}
          <span className="relative z-10 hidden sm:inline font-medium">創建新任務</span>
          <span className="relative z-10 sm:hidden font-medium">新增</span>
          
          {/* 懸停效果 */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        </motion.button>
      </div>

      {/* 任務列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onTaskEdit}
            onDelete={handleTaskDelete}
            onStatusChange={handleTaskStatusChange}
            onProgressUpdate={handleTaskProgressUpdate}
            onAssign={handleTaskAssign}
          />
        ))}
      </div>

      {/* 空狀態 */}
      {filteredTasks.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="mb-4 flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-[#2B3A3B]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-[#2B3A3B] mb-2">
            {statusFilter.includes('all') && priorityFilter.length === 0 && categoryFilter.length === 0 ? '還沒有任務' : '沒有符合條件的任務'}
          </h3>
          <p className="text-gray-600 mb-6">
            {statusFilter.includes('all') && priorityFilter.length === 0 && categoryFilter.length === 0
              ? '開始創建您的第一個任務吧！' 
              : '嘗試調整篩選條件或創建新任務'}
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onTaskCreate}
            className="px-6 py-3 bg-[#FFD59A] text-[#2B3A3B] rounded-xl hover:bg-[#EBC9A4] transition-colors font-medium flex items-center gap-2 mx-auto"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            創建新任務
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
