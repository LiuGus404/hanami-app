'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, DEFAULT_PRIORITY_CONFIG, DEFAULT_STATUS_CONFIG } from '@/types/task-management';
import { supabase } from '@/lib/supabase';
import CategoryIcon from './CategoryIcon';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onStatusChange?: (task: Task, newStatus: string) => void;
  onProgressUpdate?: (task: Task, progress: number) => void;
  onAssign?: (task: Task, assignedTo: string[]) => void;
  showActions?: boolean;
  className?: string;
}

export default function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onProgressUpdate,
  onAssign,
  showActions = true,
  className = ''
}: TaskCardProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const [allStaff, setAllStaff] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const assignMenuRef = useRef<HTMLDivElement>(null);
  const priorityConfig = DEFAULT_PRIORITY_CONFIG.find(p => p.value === task.priority);
  const statusConfig = DEFAULT_STATUS_CONFIG.find(s => s.value === task.status);

  // 載入所有員工數據
  useEffect(() => {
    const loadData = async () => {
      try {
        // 載入員工數據
        const { data: employeesData } = await supabase
          .from('hanami_employee')
          .select('id, teacher_fullname, teacher_nickname')
          .order('teacher_fullname');

        // 載入管理員數據
        const { data: adminsData } = await supabase
          .from('hanami_admin')
          .select('id, admin_name')
          .order('admin_name');

        // 合併數據
        const typedEmployeesData = (employeesData || []) as Array<{
          id: string;
          teacher_nickname?: string | null;
          teacher_fullname?: string | null;
          [key: string]: any;
        }>;
        const typedAdminsData = (adminsData || []) as Array<{
          id: string;
          admin_name?: string | null;
          [key: string]: any;
        }>;
        
        const employees = typedEmployeesData.map(emp => ({
          id: emp.id,
          name: emp.teacher_nickname || emp.teacher_fullname || '',
          type: 'employee'
        }));

        const admins = typedAdminsData.map(admin => ({
          id: admin.id,
          name: admin.admin_name || '',
          type: 'admin'
        }));

        setAllStaff([...employees, ...admins]);
        setLoadingData(false);
      } catch (error) {
        console.error('載入員工數據失敗:', error);
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  // 初始化選中的員工
  useEffect(() => {
    if (task.assigned_to) {
      // 處理陣列格式
      if (Array.isArray(task.assigned_to)) {
        setSelectedStaff(task.assigned_to);
      } else {
        // 處理字串格式（向後兼容）
        setSelectedStaff([task.assigned_to]);
      }
    } else {
      setSelectedStaff([]);
    }
  }, [task.assigned_to]);

  // 點擊外部關閉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setShowStatusMenu(false);
      }
      if (assignMenuRef.current && !assignMenuRef.current.contains(event.target as Node)) {
        setShowAssignMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowStatusMenu(!showStatusMenu);
  };

  const handleStatusSelect = async (newStatus: string) => {
    try {
      // 直接更新任務狀態
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus
        })
      });

      if (!response.ok) {
        throw new Error('更新狀態失敗');
      }

      // 更新本地任務狀態
      if (onStatusChange) {
        onStatusChange(task, newStatus);
      }
      
      setShowStatusMenu(false);
    } catch (error) {
      console.error('狀態更新失敗:', error);
      alert('狀態更新失敗，請重試');
    }
  };

  const handleAssignClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAssignMenu(!showAssignMenu);
  };

  const handleStaffToggle = (staffName: string) => {
    setSelectedStaff(prev => {
      if (prev.includes(staffName)) {
        return prev.filter(name => name !== staffName);
      } else {
        return [...prev, staffName];
      }
    });
  };

  const handleAssignConfirm = async () => {
    try {
      // 直接更新任務的分配
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigned_to: selectedStaff.join(',')
        })
      });

      if (!response.ok) {
        throw new Error('更新分配失敗');
      }

      // 更新本地任務狀態
      if (onAssign) {
        onAssign(task, selectedStaff);
      }
      
      setShowAssignMenu(false);
    } catch (error) {
      console.error('分配更新失敗:', error);
      alert('分配更新失敗，請重試');
    }
  };

  const handleClearAll = () => {
    setSelectedStaff([]);
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 確認刪除
    if (!confirm(`確定要刪除任務「${task.title}」嗎？此操作無法復原。`)) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('刪除任務失敗');
      }

      // 通知父組件任務已刪除
      if (onDelete) {
        onDelete(task);
      }
    } catch (error) {
      console.error('刪除任務失敗:', error);
      alert('刪除任務失敗，請重試');
    }
  };

  const handleProgressClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onProgressUpdate) {
      const newProgress = task.progress_percentage === 100 ? 0 : 
                         task.progress_percentage + 25;
      onProgressUpdate(task, newProgress);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className={`bg-white rounded-xl px-4 py-3 shadow-sm border border-[#EADBC8] hover:shadow-md transition-all min-h-[80px] ${className}`}
    >
      {/* 第一行：優先級圖示 + 狀態按鈕 + 任務標題 + 操作按鈕 */}
      <div className="flex items-start gap-3 mb-2">
        {/* 優先級圖示 */}
        <div className="mt-1">
          {priorityConfig && (
            <div
              className={`p-2 rounded-lg ${
                priorityConfig.value === 'urgent_important' ? 'bg-red-100' :
                priorityConfig.value === 'important_not_urgent' ? 'bg-orange-100' :
                priorityConfig.value === 'urgent_not_important' ? 'bg-yellow-100' :
                'bg-gray-100'
              }`}
              title={priorityConfig.description}
            >
              <svg
                className={`w-4 h-4 ${
                  priorityConfig.value === 'urgent_important' ? 'text-red-600' :
                  priorityConfig.value === 'important_not_urgent' ? 'text-orange-600' :
                  priorityConfig.value === 'urgent_not_important' ? 'text-yellow-600' :
                  'text-gray-600'
                }`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                {priorityConfig.value === 'urgent_important' && (
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                )}
                {priorityConfig.value === 'important_not_urgent' && (
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                )}
                {priorityConfig.value === 'urgent_not_important' && (
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                )}
                {priorityConfig.value === 'not_urgent_not_important' && (
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                )}
              </svg>
            </div>
          )}
        </div>

        {/* 狀態按鈕 */}
        <div className="relative" ref={statusMenuRef}>
          <button
            onClick={handleStatusClick}
            className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${
              statusConfig?.value === 'pending' ? 'bg-yellow-100 border-yellow-300' :
              statusConfig?.value === 'in_progress' ? 'bg-blue-100 border-blue-300' :
              statusConfig?.value === 'completed' ? 'bg-green-100 border-green-300' :
              statusConfig?.value === 'cancelled' ? 'bg-red-100 border-red-300' :
              statusConfig?.value === 'blocked' ? 'bg-gray-100 border-gray-300' :
              'bg-gray-100 border-gray-300'
            }`}
            title={statusConfig?.label}
          >
            <svg className={`w-4 h-4 ${
              statusConfig?.value === 'pending' ? 'text-yellow-600' :
              statusConfig?.value === 'in_progress' ? 'text-blue-600' :
              statusConfig?.value === 'completed' ? 'text-green-600' :
              statusConfig?.value === 'cancelled' ? 'text-red-600' :
              statusConfig?.value === 'blocked' ? 'text-gray-600' :
              'text-gray-600'
            }`} fill="currentColor" viewBox="0 0 24 24">
              {statusConfig?.value === 'pending' && (
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              )}
              {statusConfig?.value === 'in_progress' && (
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              )}
              {statusConfig?.value === 'completed' && (
                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
              )}
              {statusConfig?.value === 'cancelled' && (
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              )}
              {statusConfig?.value === 'blocked' && (
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              )}
            </svg>
          </button>
          
          {/* 狀態選擇下拉選單 */}
          <AnimatePresence>
            {showStatusMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 z-50 bg-white rounded-lg shadow-lg border border-[#EADBC8] mt-1 min-w-[180px] sm:min-w-[200px] max-w-[90vw]"
              >
                {DEFAULT_STATUS_CONFIG.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => handleStatusSelect(status.value)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                  >
                    <div className={`w-4 h-4 rounded border-2 ${
                      status.value === 'pending' ? 'bg-yellow-100 border-yellow-300' :
                      status.value === 'in_progress' ? 'bg-blue-100 border-blue-300' :
                      status.value === 'completed' ? 'bg-green-100 border-green-300' :
                      status.value === 'cancelled' ? 'bg-red-100 border-red-300' :
                      status.value === 'blocked' ? 'bg-gray-100 border-gray-300' :
                      'bg-gray-100 border-gray-300'
                    }`}>
                      <svg className={`w-3 h-3 m-0.5 ${
                        status.value === 'pending' ? 'text-yellow-600' :
                        status.value === 'in_progress' ? 'text-blue-600' :
                        status.value === 'completed' ? 'text-green-600' :
                        status.value === 'cancelled' ? 'text-red-600' :
                        status.value === 'blocked' ? 'text-gray-600' :
                        'text-gray-600'
                      }`} fill="currentColor" viewBox="0 0 24 24">
                        {status.value === 'pending' && (
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        )}
                        {status.value === 'in_progress' && (
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                        )}
                        {status.value === 'completed' && (
                          <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                        )}
                        {status.value === 'cancelled' && (
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        )}
                        {status.value === 'blocked' && (
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        )}
                      </svg>
                    </div>
                    <span className="text-[#2B3A3B]">{status.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 中間：任務標題 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {task.category && task.category.length > 0 && (
              <div className="flex items-center gap-1">
                <CategoryIcon category={task.category[0]} className="w-4 h-4 text-gray-500" />
              </div>
            )}
            
            <h3 
              className="text-[15px] font-semibold text-[#2B3A3B] cursor-pointer hover:text-orange-600 transition-colors"
              onClick={() => onEdit?.(task)}
            >
              {task.title}
            </h3>
          </div>
        </div>

        {/* 右側：操作按鈕 */}
        {showActions && (
          <div className="flex items-center gap-1">
            {/* switch：分配人員 */}
            <div className="relative" ref={assignMenuRef}>
              <button
                onClick={handleAssignClick}
                className="w-8 h-8 rounded-lg border border-[#EADBC8] flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 transition-colors"
                title="分配人員"
                disabled={loadingData}
              >
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h8v-2.5C9 14.17 6.33 13 4 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h8v-1.5C21 14.17 18.33 13 16 13z"/>
                </svg>
              </button>
              
              {/* 員工選擇下拉選單 */}
              <AnimatePresence>
                {showAssignMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 z-50 bg-white rounded-lg shadow-lg border border-[#EADBC8] mt-1 min-w-[200px] max-w-[90vw]"
                  >
                    <div className="p-3">
                      <div className="text-sm font-medium text-[#2B3A3B] mb-2">選擇負責人</div>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {allStaff.map((staff) => (
                          <label key={staff.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedStaff.includes(staff.name)}
                              onChange={() => handleStaffToggle(staff.name)}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <span className="text-sm text-[#2B3A3B]">{staff.name}</span>
                          </label>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-3 pt-2 border-t">
                        <button
                          onClick={handleClearAll}
                          className="flex-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                        >
                          清除
                        </button>
                        <button
                          onClick={handleAssignConfirm}
                          className="flex-1 px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                          確認
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* edit：編輯 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(task);
              }}
              className="w-8 h-8 rounded-lg border border-[#EADBC8] flex items-center justify-center hover:bg-orange-50 hover:border-orange-300 transition-colors"
              title="編輯內容"
            >
              <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41L18.37 3.29a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>

            {/* delete：刪除任務 */}
            <button
              onClick={handleDeleteClick}
              className="w-8 h-8 rounded-lg border border-[#EADBC8] flex items-center justify-center hover:bg-red-50 hover:border-red-300 transition-colors"
              title="刪除任務"
            >
              <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* 第二行：分配人員 + 任務描述 */}
      <div className="flex items-center justify-between gap-3 mt-2">
        {/* 分配人員 */}
        <div className="flex items-center gap-2">
          {task.assigned_to && task.assigned_to.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {task.assigned_to.map((name, index) => (
                <span key={index} className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                  {name.trim()}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-gray-400">未分配</span>
          )}
        </div>

        {/* 任務描述 */}
        {task.description && (
          <div className="flex-1 text-right">
            <p className="text-sm text-gray-600 truncate max-w-[250px] ml-auto">
              {task.description.length > 60 
                ? `${task.description.substring(0, 60)}...` 
                : task.description
              }
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}