'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getUserSession } from '@/lib/authUtils';
import { Project, CreateProjectForm, UpdateProjectForm, ProjectInviteForm } from '@/types/task-management';
import ProjectCard from '@/components/task-management/ProjectCard';
import ProjectForm from '@/components/task-management/ProjectForm';
import ProjectJoinForm from '@/components/task-management/ProjectJoinForm';

export default function ProjectManagementPage() {
  const router = useRouter();
  const [userSession, setUserSession] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // 檢查用戶會話
    const session = getUserSession();
    if (!session || session.role !== 'admin') {
      router.replace('/admin/login');
      return;
    }
    setUserSession(session);
    fetchProjects();
  }, [router]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      
      const data = await response.json();
      setProjects(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入項目失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreate = () => {
    setEditingProject(null);
    setShowProjectForm(true);
  };

  const handleProjectEdit = (project: Project) => {
    setEditingProject(project);
    setShowProjectForm(true);
  };

  const handleProjectSubmit = async (data: CreateProjectForm | UpdateProjectForm) => {
    try {
      setIsSubmitting(true);
      
      const url = editingProject ? `/api/projects/${editingProject.id}` : '/api/projects';
      const method = editingProject ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(editingProject ? '更新項目失敗' : '創建項目失敗');
      }

      setShowProjectForm(false);
      setEditingProject(null);
      fetchProjects(); // 重新載入項目列表
    } catch (error) {
      console.error('Project submission error:', error);
      alert(error instanceof Error ? error.message : '操作失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProjectDelete = async (project: Project) => {
    if (!confirm('確定要刪除這個項目嗎？這將同時刪除項目中的所有任務。')) return;

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('刪除項目失敗');
      }

      fetchProjects(); // 重新載入項目列表
    } catch (error) {
      console.error('Project deletion error:', error);
      alert(error instanceof Error ? error.message : '刪除失敗');
    }
  };

  const handleProjectJoin = async (data: ProjectInviteForm) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/projects/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '加入項目失敗');
      }

      setShowJoinForm(false);
      fetchProjects(); // 重新載入項目列表
      alert('成功加入項目！');
    } catch (error) {
      console.error('Project join error:', error);
      alert(error instanceof Error ? error.message : '加入失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProjectFormCancel = () => {
    setShowProjectForm(false);
    setEditingProject(null);
  };

  const handleJoinFormCancel = () => {
    setShowJoinForm(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FFF9F2]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD59A] mx-auto" />
          <p className="mt-4 text-[#2B3A3B]">載入項目管理...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F2] p-6">
      <div className="max-w-7xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#2B3A3B] mb-2">
                📁 項目管理中心
              </h1>
              <p className="text-gray-600">
                管理您的項目，邀請團隊成員，協作完成任務
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowJoinForm(true)}
                className="px-4 py-2 text-[#2B3A3B] border border-[#EADBC8] rounded-xl hover:bg-gray-50 transition-colors"
              >
                + 加入項目
              </button>
              <button
                onClick={() => router.push('/admin/task-management')}
                className="px-4 py-2 text-[#2B3A3B] border border-[#EADBC8] rounded-xl hover:bg-gray-50 transition-colors"
              >
                ← 返回任務管理
              </button>
            </div>
          </div>
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* 快速統計 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 border border-[#EADBC8] shadow-sm"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl">
                <span className="text-2xl">📁</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">總項目數</p>
                <p className="text-2xl font-bold text-[#2B3A3B]">{projects.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 border border-[#EADBC8] shadow-sm"
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-xl">
                <span className="text-2xl">🌍</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">公開項目</p>
                <p className="text-2xl font-bold text-[#2B3A3B]">
                  {projects.filter(p => p.is_public).length}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-[#EADBC8] shadow-sm"
          >
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-xl">
                <span className="text-2xl">🔒</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">私人項目</p>
                <p className="text-2xl font-bold text-[#2B3A3B]">
                  {projects.filter(p => !p.is_public).length}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 創建項目按鈕 */}
        <div className="flex justify-end mb-6">
          <button
            onClick={handleProjectCreate}
            className="px-6 py-3 bg-[#FFD59A] text-[#2B3A3B] rounded-xl hover:bg-[#EBC9A4] transition-colors font-medium"
          >
            + 創建新項目
          </button>
        </div>

        {/* 項目列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleProjectEdit}
              onDelete={handleProjectDelete}
              currentUserPhone={userSession?.phone}
            />
          ))}
        </div>

        {/* 空狀態 */}
        {projects.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-xl font-semibold text-[#2B3A3B] mb-2">
              還沒有項目
            </h3>
            <p className="text-gray-600 mb-6">
              開始創建您的第一個項目，與團隊協作完成任務
            </p>
            <button
              onClick={handleProjectCreate}
              className="px-6 py-3 bg-[#FFD59A] text-[#2B3A3B] rounded-xl hover:bg-[#EBC9A4] transition-colors font-medium"
            >
              + 創建新項目
            </button>
          </motion.div>
        )}

        {/* 項目表單彈窗 */}
        <AnimatePresence>
          {showProjectForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
              onClick={handleProjectFormCancel}
            >
              <motion.div
                initial={{ y: 20, scale: 0.98, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <ProjectForm
                  project={editingProject || undefined}
                  onSubmit={handleProjectSubmit}
                  onCancel={handleProjectFormCancel}
                  isLoading={isSubmitting}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 加入項目表單彈窗 */}
        <AnimatePresence>
          {showJoinForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
              onClick={handleJoinFormCancel}
            >
              <motion.div
                initial={{ y: 20, scale: 0.98, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <ProjectJoinForm
                  onSubmit={handleProjectJoin}
                  onCancel={handleJoinFormCancel}
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
