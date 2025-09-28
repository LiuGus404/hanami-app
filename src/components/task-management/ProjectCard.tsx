'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Project, ProjectMember } from '@/types/task-management';

interface ProjectCardProps {
  project: Project & { hanami_project_members?: ProjectMember[] };
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onJoin?: (project: Project) => void;
  onLeave?: (project: Project) => void;
  showActions?: boolean;
  className?: string;
  currentUserPhone?: string;
}

export default function ProjectCard({
  project,
  onEdit,
  onDelete,
  onJoin,
  onLeave,
  showActions = true,
  className = '',
  currentUserPhone
}: ProjectCardProps) {
  const isOwner = project.owner_id; // 這裡需要根據實際的用戶 ID 比較
  const isMember = project.hanami_project_members?.some(
    member => member.user_phone === currentUserPhone
  );
  const memberCount = project.hanami_project_members?.length || 0;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        bg-white rounded-2xl p-6 shadow-sm border border-[#EADBC8] cursor-pointer
        hover:shadow-md transition-all duration-200
        ${className}
      `}
      onClick={() => onEdit?.(project)}
    >
      {/* 項目標題和狀態 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-semibold text-[#2B3A3B]">
              {project.name}
            </h3>
            {project.is_public ? (
              <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                公開
              </span>
            ) : (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                私人
              </span>
            )}
          </div>
          {project.description && (
            <p className="text-gray-600 line-clamp-2">
              {project.description}
            </p>
          )}
        </div>
        <div className="text-2xl ml-3">
          {project.is_public ? '🌍' : '🔒'}
        </div>
      </div>

      {/* 項目信息 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">👥</span>
          <span className="text-sm text-gray-600">
            {memberCount} 位成員
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">📅</span>
          <span className="text-sm text-gray-600">
            {formatDate(project.created_at)}
          </span>
        </div>
      </div>

      {/* 邀請碼 */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">邀請碼</p>
            <p className="text-lg font-mono font-bold text-[#2B3A3B]">
              {project.invite_code}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(project.invite_code);
            }}
            className="px-3 py-1 text-sm bg-[#FFD59A] text-[#2B3A3B] rounded-lg hover:bg-[#EBC9A4] transition-colors"
          >
            複製
          </button>
        </div>
      </div>

      {/* 成員列表 */}
      {project.hanami_project_members && project.hanami_project_members.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">成員</p>
          <div className="flex flex-wrap gap-2">
            {project.hanami_project_members.slice(0, 5).map((member, index) => (
              <div
                key={index}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs"
              >
                <span>👤</span>
                <span>{member.user_phone || '未知用戶'}</span>
                <span className="text-gray-500">({member.role})</span>
              </div>
            ))}
            {project.hanami_project_members.length > 5 && (
              <div className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-500">
                +{project.hanami_project_members.length - 5} 更多
              </div>
            )}
          </div>
        </div>
      )}

      {/* 操作按鈕 */}
      {showActions && (
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
          {!isMember && !isOwner && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onJoin?.(project);
              }}
              className="px-4 py-2 text-sm bg-[#FFD59A] text-[#2B3A3B] rounded-lg hover:bg-[#EBC9A4] transition-colors"
            >
              加入項目
            </button>
          )}
          
          {isMember && !isOwner && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLeave?.(project);
              }}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              離開項目
            </button>
          )}

          {isOwner && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(project);
                }}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
              >
                編輯
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(project);
                }}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
              >
                刪除
              </button>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}

