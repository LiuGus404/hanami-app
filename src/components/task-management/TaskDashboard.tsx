import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Task, DEFAULT_STATUS_CONFIG, DEFAULT_PRIORITY_CONFIG } from '@/types/task-management';
import TaskCard from './TaskCard';
import SharedTaskSection from './SharedTaskSection';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskDashboardProps {
  userPhone?: string;
  orgId?: string;
  userEmail?: string;
  onTaskEdit: (task: Task) => void;
  onTaskCreate: () => void;
  taskFilter?: 'all' | 'personal' | 'shared';
  userSession?: any;
  personalTasks?: Task[];
  onFilteredTasksChange?: (tasks: Task[]) => void;
  canApprove?: boolean;
}

interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  points: number;
  rank: number;
}

interface TaskStats {
  totalPoints: number;
  approvedTasks: number;
  leaderboard: LeaderboardEntry[];
}

export default function TaskDashboard({ userPhone, orgId, userEmail, onTaskEdit, onTaskCreate, taskFilter, userSession, personalTasks, onFilteredTasksChange, canApprove = false }: TaskDashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>(['pending', 'in_progress']);

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, [userPhone, orgId, taskFilter]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      let url = '/api/tasks?';

      const params = new URLSearchParams();
      if (orgId) params.append('orgId', orgId);
      if (taskFilter === 'personal' && userPhone) {
        params.append('assigneeId', userPhone);
      }

      const response = await fetch(`${url}${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch tasks');

      const data = await response.json();
      const tasksList = data.tasks || [];
      setTasks(tasksList);
      if (onFilteredTasksChange) {
        onFilteredTasksChange(tasksList);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入任務失敗');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (orgId) params.append('orgId', orgId);

      const response = await fetch(`/api/tasks/stats?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;
    const task = tasks.find(t => t.id === draggableId);

    if (task) {
      // Optimistic update
      handleTaskStatusChange(task, newStatus);
    }
  };

  const handleTaskStatusChange = async (task: Task, newStatus: string) => {
    const taskId = task.id;
    try {
      console.log('Updating status locally:', taskId, newStatus);

      // 1. Optimistic update
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: newStatus as any } : t
      ));

      // 2. API Call
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Update failed body:', errorText);
        let errorData: any = {};
        try { errorData = JSON.parse(errorText); } catch (e) { }
        throw new Error(`Failed to update status: ${errorData?.details || errorData?.error || response.statusText}`);
      }

      const updatedTask = await response.json();
      console.log('API update success:', updatedTask);

      // 3. Update with server data
      setTasks(prev => prev.map(t =>
        t.id === taskId ? updatedTask : t
      ));

      // Refresh stats if completed
      if (newStatus === 'completed') {
        fetchStats();
      }

    } catch (err) {
      console.error('Update failed:', err);
      setError(err instanceof Error ? err.message : '更新狀態失敗');
      // Revert on error
      fetchTasks();
    }
  };

  const handleTaskProgressUpdate = async (task: Task, progress: number) => {
    const taskId = task.id;
    try {
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, progress } : t
      ));

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress }),
      });

      if (!response.ok) throw new Error('Failed to update progress');
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新進度失敗');
      fetchTasks();
    }
  };

  const handleTaskAssign = async (task: Task, assignedTo: string[]) => {
    const taskId = task.id;
    try {
      // Optimistic update
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, assigned_to: assignedTo } : t
      ));

      const response = await fetch(`/api/tasks/${taskId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigneeIds: assignedTo }),
      });

      if (!response.ok) throw new Error('Failed to assign task');

      // Refresh to get full task data
      fetchTasks();
    } catch (err) {
      console.error('Assign failed:', err);
      setError(err instanceof Error ? err.message : '分配任務失敗');
      fetchTasks();
    }
  };

  const handleTaskDelete = async (task: Task) => {
    if (!window.confirm('確定要刪除此任務嗎？')) return;

    try {
      setTasks(prev => prev.filter(t => t.id !== task.id));

      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete task');
    } catch (err) {
      console.error('Delete failed:', err);
      setError(err instanceof Error ? err.message : '刪除任務失敗');
      fetchTasks();
    }
  };


  const handleTaskApprove = async (task: Task) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_approved: true,
          approved_by: userSession?.name || 'Admin', // In real app, get from session
          approved_at: new Date().toISOString()
        }),
      });

      if (!response.ok) throw new Error('Failed to approve task');

      const updatedTask = await response.json();
      setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));

      // Refresh stats to update leaderboard
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : '批准任務失敗');
    }
  };

  const getPriorityTasks = (priority: string) => {
    return tasks.filter(task => task.priority === priority).length;
  };

  // Filter logic
  const filteredTasks = tasks.filter(task => {
    if (priorityFilter.length > 0 && !priorityFilter.includes(task.priority)) return false;
    return true;
  });

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD59A]" />
      </div>
    );
  }

  return (
    <div className="bg-[#FDFBF7] min-h-screen p-6 font-['Outfit',sans-serif]">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-1">歡迎</div>
          <h1 className="text-3xl font-bold text-[#2B3A3B]">{userSession?.name || 'User'}</h1>
          <h2 className="text-4xl font-extrabold text-[#2B3A3B] mt-1">
            任務中心
            {canApprove && (
              <span className="text-xs bg-[#FFD59A] text-[#2B3A3B] px-2 py-1 rounded ml-2 align-middle">
                管理員
              </span>
            )}
          </h2>
        </div>

        <div className="relative group">
          <button
            onClick={() => onTaskCreate()}
            className="w-14 h-14 bg-[#2B3A3B] rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <div className="absolute top-full right-0 mt-2 bg-[#2B3A3B] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            創建任務
          </div>
        </div>
      </div>

      {/* Stats & Leaderboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Left Column: My Points (Hide in Shared Mode) */}
        {taskFilter !== 'shared' && (
          <div className="bg-[#FFD59A] rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col justify-between min-h-[300px] shadow-sm transition-transform hover:scale-[1.02]">
            <div className="relative z-10">
              <h3 className="text-[#2B3A3B] font-bold text-xl mb-1">我的積分</h3>
              <p className="text-[#2B3A3B]/70 text-sm font-medium">累積積分總覽</p>
            </div>

            <div className="relative z-10 flex flex-col items-center my-6">
              {/* Circular Progress Representation */}
              <div className="w-32 h-32 rounded-full border-4 border-white/30 flex items-center justify-center relative">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="46" fill="transparent" stroke="white" strokeWidth="8" strokeOpacity="0.3" />
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    fill="transparent"
                    stroke="white"
                    strokeWidth="8"
                    strokeDasharray="289"
                    strokeDashoffset={289 - (289 * (stats?.leaderboard?.length ? ((stats.leaderboard.length - (stats.leaderboard.findIndex(l => l.user_name === userSession?.name) || 0)) / stats.leaderboard.length) : 0))}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-center absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-4xl font-extrabold text-[#2B3A3B]">
                    {stats?.leaderboard?.find(l => l.user_name === userSession?.name)?.points || 0}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#2B3A3B]/60 mt-1">PTS</div>
                </div>
              </div>
            </div>

            <div className="relative z-10">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[#2B3A3B]/60 text-xs font-bold uppercase mb-1">排名</div>
                  <div className="text-2xl font-bold text-[#2B3A3B]">
                    #{stats?.leaderboard?.find(l => l.user_name === userSession?.name)?.rank || '-'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[#2B3A3B]/60 text-xs font-bold uppercase mb-1">前標</div>
                  <div className="text-2xl font-bold text-[#2B3A3B]">
                    {stats?.leaderboard?.length ? Math.round(((stats.leaderboard.length - (stats.leaderboard.findIndex(l => l.user_name === userSession?.name))) / stats.leaderboard.length) * 100) : 0}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right Column: Leaderboard & Filters */}
        <div className={`${taskFilter === 'shared' ? 'lg:col-span-3' : 'lg:col-span-2'} flex flex-col gap-6`}>

          {/* Priority Filters (Hide in Shared Mode) */}
          {taskFilter !== 'shared' && (
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100/50">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">優先級篩選</h3>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {DEFAULT_PRIORITY_CONFIG.map((priority) => (
                  <button
                    key={priority.value}
                    onClick={() => {
                      if (priorityFilter.includes(priority.value)) {
                        setPriorityFilter(priorityFilter.filter(p => p !== priority.value));
                      } else {
                        setPriorityFilter([...priorityFilter, priority.value]);
                      }
                    }}
                    className={`
                    px-5 py-4 rounded-3xl flex flex-col items-start min-w-[130px] transition-all duration-300 border
                    ${priorityFilter.includes(priority.value)
                        ? 'bg-[#2B3A3B] text-white border-[#2B3A3B] shadow-lg transform -translate-y-1'
                        : 'bg-[#F9F9F9] text-gray-500 border-transparent hover:bg-[#EEEEEE]'
                      }
                  `}
                  >
                    <div className={`w-3 h-3 rounded-full mb-3 ${priority.value === 'urgent_important' ? 'bg-red-400' :
                      priority.value === 'important_not_urgent' ? 'bg-orange-400' :
                        priority.value === 'urgent_not_important' ? 'bg-yellow-400' :
                          'bg-gray-400'
                      }`} />
                    <span className="text-sm font-bold text-left leading-tight">{priority.label}</span>
                    <span className={`text-[10px] font-bold mt-2 ${priorityFilter.includes(priority.value) ? 'text-white/60' : 'text-gray-400'}`}>
                      {getPriorityTasks(priority.value)} 個任務
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Leaderboard Horizontal Scroll */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex-1 min-h-[200px]">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">積分排行榜</h3>
              <span className="text-xs font-bold text-gray-300">{stats?.leaderboard?.length || 0} 位成員</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {stats?.leaderboard?.slice(0, 10).map((entry, index) => (
                <div key={index} className="flex-shrink-0 w-36 bg-[#FDFBF7] rounded-3xl p-4 flex flex-col items-center border border-gray-50 relative group hover:shadow-md transition-all hover:-translate-y-1">
                  <div className="absolute top-3 right-3 text-[10px] font-bold text-gray-300 bg-white px-2 py-0.5 rounded-full">#{entry.rank}</div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-3 border-4 border-white shadow-sm
                        ${index === 0 ? 'bg-yellow-100 text-yellow-600' : index === 1 ? 'bg-gray-100 text-gray-600' : index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-blue-50 text-blue-600'}
                    `}>
                    {entry.user_name.charAt(0)}
                  </div>
                  <div className="text-[#2B3A3B] font-bold text-sm truncate w-full text-center mb-1">{entry.user_name}</div>
                  <div className="text-xs font-bold text-orange-400 bg-orange-50 px-3 py-1 rounded-full mt-1">{entry.points} pts</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Task Groups Section */}
      {/* Task Groups Section - Conditional Layout */}
      {taskFilter === 'shared' ? (
        <SharedTaskSection
          filteredTasks={filteredTasks}
          userSession={userSession}
          onTaskEdit={onTaskEdit}
          handleTaskDelete={handleTaskDelete}
          handleTaskStatusChange={handleTaskStatusChange}
          handleTaskProgressUpdate={handleTaskProgressUpdate}
          handleTaskAssign={handleTaskAssign}
          canApprove={canApprove}
          handleTaskApprove={handleTaskApprove}
        />
      ) : (
        /* Personal Tasks: Kanban Columns with Drag and Drop */
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
            {['pending', 'in_progress', 'blocked', 'completed'].map((status) => {
              const statusTasks = filteredTasks.filter(t => t.status === status);
              const statusConfig = DEFAULT_STATUS_CONFIG.find(s => s.value === status);

              return (
                <div key={status} className="flex flex-col gap-4">
                  <div className="flex items-center justify-between px-4 py-2">
                    <h3 className="text-[#2B3A3B] font-bold text-lg">{statusConfig?.label}</h3>
                    <span className="bg-white px-3 py-1 rounded-full text-xs font-bold text-gray-400 shadow-sm border border-gray-100">
                      {statusTasks.length}
                    </span>
                  </div>

                  <Droppable droppableId={status}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex flex-col gap-4 min-h-[200px] rounded-[2rem] p-2 transition-colors duration-200
                          ${snapshot.isDraggingOver ? 'bg-gray-50/80 border-2 border-dashed border-[#FFD59A]' : ''}
                        `}
                      >
                        <AnimatePresence>
                          {statusTasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{ ...provided.draggableProps.style }}
                                  className={`${snapshot.isDragging ? 'z-50 rotate-2 scale-105 opacity-90' : ''}`}
                                >
                                  <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <TaskCard
                                      task={task}
                                      currentUser={userSession}
                                      onEdit={onTaskEdit}
                                      onDelete={handleTaskDelete}
                                      onStatusChange={handleTaskStatusChange}
                                      onProgressUpdate={handleTaskProgressUpdate}
                                      onAssign={handleTaskAssign}
                                      canApprove={canApprove}
                                      onApprove={handleTaskApprove}
                                      className="bg-white !rounded-[2rem] !border-none !shadow-sm hover:!shadow-lg transition-all duration-300 p-6 group"
                                    />
                                  </motion.div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        </AnimatePresence>
                        {provided.placeholder}

                        {statusTasks.length === 0 && !snapshot.isDraggingOver && (
                          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-[2rem] opacity-50">
                            <p className="text-gray-400 text-sm font-bold">暫無任務</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-xl text-sm font-bold z-50 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
            <button onClick={() => setError(null)} className="ml-2 opacity-80 hover:opacity-100">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
