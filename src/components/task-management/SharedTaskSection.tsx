import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '@/types/task-management';
import TaskCard from './TaskCard';

export default function SharedTaskSection({
    filteredTasks,
    userSession,
    onTaskEdit,
    handleTaskDelete,
    handleTaskStatusChange,
    handleTaskProgressUpdate,
    handleTaskAssign,
    canApprove,
    handleTaskApprove
}: any) {
    const [filterType, setFilterType] = useState<'unassigned' | 'assigned'>('unassigned');

    const visibleTasks = filteredTasks.filter((task: Task) => {
        const isUnassigned = !task.assigned_to || task.assigned_to.length === 0;
        if (filterType === 'unassigned') return isUnassigned;
        return !isUnassigned;
    });

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-4 py-2">
                <h3 className="text-[#2B3A3B] font-bold text-lg">共同任務板</h3>

                <div className="flex items-center gap-4">
                    {/* Sliding Toggle Button */}
                    <div className="bg-white p-1 rounded-full border border-gray-100 flex items-center shadow-sm">
                        <button
                            onClick={() => setFilterType('unassigned')}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filterType === 'unassigned'
                                ? 'bg-[#2B3A3B] text-white shadow-md'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            未分配
                        </button>
                        <button
                            onClick={() => setFilterType('assigned')}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filterType === 'assigned'
                                ? 'bg-[#2B3A3B] text-white shadow-md'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            已分配
                        </button>
                    </div>

                    <span className="bg-white px-3 py-1 rounded-full text-xs font-bold text-gray-400 shadow-sm border border-gray-100">
                        {visibleTasks.length} 可用
                    </span>
                </div>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-8 pt-2 px-2 scrollbar-hide min-h-[300px] snap-x">
                <AnimatePresence mode="popLayout">
                    {visibleTasks.length > 0 ? (
                        visibleTasks.map((task: Task) => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                                className="min-w-[320px] w-[320px] snap-center"
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
                                    className={`bg-white !rounded-[2rem] !border-none !shadow-sm hover:!shadow-lg transition-all duration-300 p-6 group h-full flex flex-col
                     ${(!task.assigned_to || task.assigned_to.length === 0) ? 'ring-2 ring-[#FFD59A]/50' : 'opacity-90'}
                   `}
                                />
                            </motion.div>
                        ))
                    ) : (
                        <div className="w-full flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-[2rem] opacity-50 min-w-[300px]">
                            <p className="text-gray-400 text-sm font-bold">
                                {filterType === 'unassigned' ? '沒有未分配的任務' : '沒有已分配的任務'}
                            </p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
