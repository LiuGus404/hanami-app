'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, DEFAULT_PRIORITY_CONFIG, DEFAULT_STATUS_CONFIG } from '@/types/task-management';
import { supabase } from '@/lib/supabase';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onStatusChange?: (task: Task, newStatus: string) => void;
  onProgressUpdate?: (task: Task, progress: number) => void;
  onAssign?: (task: Task, assignedTo: string[]) => void;
  onApprove?: (task: Task) => void;
  canApprove?: boolean;
  currentUser?: any;
  showActions?: boolean;
  className?: string;
}

export default function TaskCard({
  task,
  currentUser,
  onEdit,
  onDelete,
  onStatusChange,
  onProgressUpdate,
  onAssign,
  onApprove,
  canApprove = false,
  showActions = true,
  className = ''
}: TaskCardProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const [allStaff, setAllStaff] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const assignMenuRef = useRef<HTMLDivElement>(null);

  const priorityConfig = DEFAULT_PRIORITY_CONFIG.find(p => p.value === task.priority);
  const statusConfig = DEFAULT_STATUS_CONFIG.find(s => s.value === task.status);

  // Helper for current assignees (handles string or array)
  const currentAssignees = Array.isArray(task.assigned_to) ? task.assigned_to : (task.assigned_to ? [task.assigned_to] : []);

  // Load Staff Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: employeesData } = await supabase
          .from('hanami_employee')
          .select('id, teacher_fullname, teacher_nickname')
          .order('teacher_fullname');

        const { data: adminsData } = await supabase
          .from('hanami_admin')
          .select('id, admin_name')
          .order('admin_name');

        const employees = (employeesData || []).map(emp => ({
          id: emp.id,
          name: emp.teacher_nickname || emp.teacher_fullname || '',
          type: 'employee'
        }));

        const admins = (adminsData || []).map(admin => ({
          id: admin.id,
          name: admin.admin_name || '',
          type: 'admin'
        }));

        setAllStaff([...employees, ...admins]);
      } catch (error) {
        console.error('Failed to load staff data:', error);
      }
    };

    loadData();
  }, []);

  // Initialize selected staff
  useEffect(() => {
    if (task.assigned_to) {
      if (Array.isArray(task.assigned_to)) {
        setSelectedStaff(task.assigned_to);
      } else {
        setSelectedStaff([task.assigned_to]);
      }
    } else {
      setSelectedStaff([]);
    }
  }, [task.assigned_to]);

  // Click outside handler
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

  const handleStatusSelect = async (newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(task, newStatus);
    }
    setShowStatusMenu(false);
  };

  const handleAssignClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAssignMenu(!showAssignMenu);
  };

  const handleStaffToggle = (staffName: string) => {
    const newStaff = selectedStaff.includes(staffName)
      ? selectedStaff.filter(name => name !== staffName)
      : [...selectedStaff, staffName];
    setSelectedStaff(newStaff);
  };

  const handleAssignConfirm = () => {
    if (onAssign) {
      onAssign(task, selectedStaff);
    }
    setShowAssignMenu(false);
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(task);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit(task);
  };

  const handleProgressClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onProgressUpdate) {
      const newProgress = task.progress_percentage === 100 ? 0 : task.progress_percentage + 25;
      onProgressUpdate(task, newProgress);
    }
  };

  const handleApproveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onApprove) onApprove(task);
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent_important': return 'bg-red-400';
      case 'important_not_urgent': return 'bg-orange-400';
      case 'urgent_not_important': return 'bg-yellow-400';
      default: return 'bg-gray-300';
    }
  }

  return (
    <div
      onClick={handleEditClick}
      className={`group relative flex flex-col gap-4 cursor-pointer hover:border-gray-200 ${className}`}
    >
      {/* Top Row: Icon + Title + Menu */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Priority Dot */}
          <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${getPriorityColor(task.priority)}`} title={priorityConfig?.label} />

          <div className="flex flex-col min-w-0">
            <h3 className="font-bold text-[#2B3A3B] text-lg leading-tight truncate pr-2">{task.title}</h3>
            {task.category && (
              <span className="text-xs text-gray-400 font-medium mt-0.5">{task.category}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onDelete && (
            <button
              onClick={handleDeleteClick}
              className="p-1.5 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Middle: Progress Bar */}
      <div className="relative pt-2" onClick={handleProgressClick}>
        <div className="flex justify-between text-xs font-bold text-gray-400 mb-1">
          <span>Progress</span>
          <span>{task.progress_percentage}%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${task.progress_percentage}%` }}
            className={`h-full rounded-full ${task.status === 'completed' ? 'bg-green-400' :
              task.progress_percentage > 50 ? 'bg-[#FFD59A]' : 'bg-[#FFE8C8]'
              }`}
          />
        </div>
      </div>

      {/* Bottom Row: Assignees & Points/Status */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50/50">

        {/* Assignees / Pick Up Logic */}
        <div className="flex items-center gap-2">
          {/* If unassigned, show Pick Up Button */}
          {currentAssignees.length === 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (currentUser?.name) {
                  if (onAssign) onAssign(task, [currentUser.name]);
                } else {
                  alert('Unable to identify user. Please relogin.');
                }
              }}
              className="px-3 py-1.5 bg-[#FFD59A] text-[#2B3A3B] text-xs font-bold rounded-full hover:bg-[#FFC06A] transition-colors flex items-center gap-1 shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              接任務
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {/* Provide Drop option if assigned to current user */}
              {currentUser?.name && currentAssignees.includes(currentUser.name) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('確定要放棄此任務嗎？')) {
                      const newAssignees = currentAssignees.filter(p => p !== currentUser.name);
                      if (onAssign) onAssign(task, newAssignees);
                    }
                  }}
                  className="px-3 py-1.5 bg-gray-100 text-gray-500 text-xs font-bold rounded-full hover:bg-red-50 hover:text-red-500 transition-colors flex items-center gap-1"
                  title="放棄任務"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  放棄
                </button>
              )}

              {/* Avatar Display */}
              <div
                className="flex -space-x-2 relative"
                onClick={handleAssignClick}
              >
                {currentAssignees.slice(0, 3).map((staff, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500 shadow-sm z-10 hover:z-20 transition-all">
                    {staff.charAt(0)}
                  </div>
                ))}
                {currentAssignees.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-gray-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-400 z-0">
                    +{currentAssignees.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assign Menu Popup (Only for admins/owners usually, or keeping for flexibility) */}
          <AnimatePresence>
            {showAssignMenu && (
              <motion.div
                ref={assignMenuRef}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 cursor-default"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="max-h-48 overflow-y-auto mb-2">
                  {allStaff.map(staff => (
                    <div
                      key={staff.id}
                      onClick={() => handleStaffToggle(staff.name)}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm ${selectedStaff.includes(staff.name) ? 'bg-[#FFD59A]/20 text-[#2B3A3B] font-bold' : 'hover:bg-gray-50 text-gray-600'}`}
                    >
                      <div className={`w-3 h-3 rounded-full border ${selectedStaff.includes(staff.name) ? 'bg-[#FFD59A] border-[#FFD59A]' : 'border-gray-300'}`} />
                      {staff.name}
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleAssignConfirm}
                  className="w-full py-1.5 bg-[#2B3A3B] text-white text-xs font-bold rounded-lg hover:bg-black transition-colors"
                >
                  Done
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Points Badge & Approve Button */}
        <div className="flex items-center gap-2">
          {task.points !== undefined && task.points > 0 && (
            <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors
                       ${task.is_approved ? 'bg-green-100 text-green-700' : 'bg-orange-50 text-orange-600'}
                   `}>
              {task.is_approved && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {task.points} pts
            </div>
          )}

          {/* Approve Button for Admin */}
          {canApprove && !task.is_approved && task.status === 'completed' && (
            <button
              onClick={handleApproveClick}
              className="px-3 py-1 bg-[#2B3A3B] text-white text-xs font-bold rounded-full hover:scale-105 transition-transform"
            >
              Approve
            </button>
          )}
        </div>
      </div>
    </div>
  );
}