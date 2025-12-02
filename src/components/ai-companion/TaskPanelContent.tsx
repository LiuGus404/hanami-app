import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CpuChipIcon, CheckCircleIcon, ClockIcon, SparklesIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Task } from '@/types/ai-companion';

// TaskCard component (extracted from page.tsx as well, or redefine it here if it's small)
// It seems TaskCard was also defined in page.tsx. I should check if I need to extract it too.
// For now, I'll include a local version of TaskCard here or import it if I extract it.
// Looking at page.tsx, TaskCard is defined at the bottom. I should probably include it here.

interface TaskCardProps {
    task: Task;
}

function TaskCard({ task }: TaskCardProps) {
    const getStatusColor = (status: Task['status']) => {
        switch (status) {
            case 'queued': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
            case 'running': return 'text-blue-600 bg-blue-100 border-blue-200';
            case 'succeeded': return 'text-green-600 bg-green-100 border-green-200';
            case 'failed': return 'text-red-600 bg-red-100 border-red-200';
            case 'cancelled': return 'text-gray-600 bg-gray-100 border-gray-200';
            default: return 'text-gray-600 bg-gray-100 border-gray-200';
        }
    };

    const getStatusIcon = (status: Task['status']) => {
        switch (status) {
            case 'queued': return ClockIcon;
            case 'running': return SparklesIcon;
            case 'succeeded': return CheckCircleIcon;
            case 'failed': return ExclamationTriangleIcon;
            case 'cancelled': return ExclamationTriangleIcon;
            default: return ClockIcon;
        }
    };

    const StatusIcon = getStatusIcon(task.status);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white/60 backdrop-blur-sm border border-[#EADBC8] rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <h4 className="font-medium text-[#4B4036] text-sm mb-1">{task.title}</h4>
                    <p className="text-xs text-[#2B3A3B] line-clamp-2">{task.description}</p>
                </div>

                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                    <StatusIcon className="w-3 h-3" />
                    <span>
                        {task.status === 'queued' ? '等待' :
                            task.status === 'running' ? '進行中' :
                                task.status === 'succeeded' ? '完成' :
                                    task.status === 'failed' ? '失敗' : '已取消'}
                    </span>
                </div>
            </div>

            {/* 分配的角色 */}
            <div className="flex items-center space-x-2 mb-3">
                <span className="text-xs text-[#2B3A3B]">分配給:</span>
                <div className="flex -space-x-1">
                    {task.assigned_roles?.map((roleId, index) => (
                        <div key={index} className={`w-4 h-4 rounded-full border border-white bg-gradient-to-br ${roleId === 'hibi' ? 'from-orange-400 to-red-500' :
                            roleId === 'mori' ? 'from-amber-400 to-orange-500' :
                                'from-blue-400 to-cyan-500'
                            }`} title={roleId} />
                    ))}
                </div>
            </div>

            {/* 進度條 */}
            {task.status === 'running' && (
                <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-[#2B3A3B]">進度</span>
                        <span className="text-xs font-medium text-[#4B4036]">{Math.round(task.progress)}%</span>
                    </div>
                    <div className="w-full bg-[#F8F5EC] rounded-full h-1.5">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${task.progress}%` }}
                            transition={{ duration: 0.5 }}
                            className="bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] h-1.5 rounded-full"
                        />
                    </div>
                </div>
            )}

            {/* 時間 */}
            <div className="text-xs text-[#2B3A3B]/70">
                {new Date(task.created_at).toLocaleString('zh-TW')}
            </div>
        </motion.div>
    );
}

export interface TaskPanelContentProps {
    tasks: Task[];
    activeRoles: ('hibi' | 'mori' | 'pico')[];
    room: any;
    editingProject: boolean;
    editProjectName: string;
    setEditProjectName: (name: string) => void;
    editProjectDescription: string;
    setEditProjectDescription: (desc: string) => void;
    handleStartEditProject: () => void;
    handleUpdateProject: () => void;
    setEditingProject: (editing: boolean) => void;
}

export const TaskPanelContent = ({
    tasks,
    activeRoles,
    room,
    editingProject,
    editProjectName,
    setEditProjectName,
    editProjectDescription,
    setEditProjectDescription,
    handleStartEditProject,
    handleUpdateProject,
    setEditingProject
}: TaskPanelContentProps) => (
    <>
        {/* 任務統計 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-blue-600">{tasks.filter(t => t.status === 'queued' || t.status === 'running').length}</div>
                <div className="text-xs text-blue-500">進行中</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-green-600">{tasks.filter(t => t.status === 'succeeded').length}</div>
                <div className="text-xs text-green-500">已完成</div>
            </div>
        </div>

        {/* 專案資訊編輯區域 */}
        <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[#4B4036] flex items-center space-x-2">
                    <div className="w-4 h-4 bg-purple-400 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </div>
                    <span>專案資訊</span>
                </h3>

                {!editingProject && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleStartEditProject}
                        className="flex items-center space-x-1 px-2 py-1 bg-[#FFD59A] hover:bg-[#EBC9A4] text-[#4B4036] rounded-lg text-xs font-medium transition-all shadow-sm"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>編輯</span>
                    </motion.button>
                )}
            </div>

            {editingProject ? (
                /* 編輯模式 */
                <div className="space-y-3 p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <div>
                        <label className="block text-xs font-medium text-[#4B4036] mb-1">專案名稱</label>
                        <input
                            type="text"
                            value={editProjectName}
                            onChange={(e) => setEditProjectName(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-purple-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FFB6C1] focus:border-transparent transition-all"
                            placeholder="輸入專案名稱..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[#4B4036] mb-1">專案指引</label>
                        <textarea
                            value={editProjectDescription}
                            onChange={(e) => setEditProjectDescription(e.target.value)}
                            rows={2}
                            className="w-full px-2 py-1.5 text-sm border border-purple-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FFB6C1] focus:border-transparent transition-all resize-none"
                            placeholder="輸入專案指引..."
                        />
                    </div>

                    <div className="flex space-x-2">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleUpdateProject}
                            className="flex-1 px-3 py-1.5 bg-[#FFB6C1] hover:bg-[#FFB6C1]/80 text-white rounded-md text-xs font-medium transition-all shadow-sm"
                        >
                            保存
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setEditingProject(false)}
                            className="flex-1 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-[#4B4036] rounded-md text-xs font-medium transition-all"
                        >
                            取消
                        </motion.button>
                    </div>
                </div>
            ) : (
                /* 顯示模式 */
                <div className="p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <div className="mb-2">
                        <div className="text-xs font-medium text-purple-700 mb-0.5">專案名稱</div>
                        <div className="text-sm text-[#4B4036] font-semibold">{room.title}</div>
                    </div>
                    <div>
                        <div className="text-xs font-medium text-purple-700 mb-0.5">專案指引</div>
                        <div className="text-xs text-[#2B3A3B] leading-relaxed">{room.description || '暫無指引'}</div>
                    </div>
                </div>
            )}
        </div>

        {/* 任務列表 */}
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#4B4036] mb-3">活躍任務</h3>
            <AnimatePresence>
                {tasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                ))}
            </AnimatePresence>

            {tasks.length === 0 && (
                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-[#F8F5EC] rounded-full flex items-center justify-center mx-auto mb-3">
                        <CpuChipIcon className="w-8 h-8 text-[#2B3A3B]" />
                    </div>
                    <p className="text-sm text-[#2B3A3B]">還沒有任務</p>
                    <p className="text-xs text-[#2B3A3B]/70">在對話中提及需求，AI 會自動創建任務</p>
                </div>
            )}
        </div>
    </>
);
