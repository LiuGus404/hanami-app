/**
 * 角色權限說明組件
 * 以簡單易懂的方式展示各角色的權限
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Check, X, FileText } from 'lucide-react';
import { useState } from 'react';
import { PAGE_PERMISSIONS, type OrgRole } from '@/lib/permissions';

const roleLabels: Record<OrgRole, string> = {
  owner: '創建者',
  admin: '管理員',
  teacher: '教師',
  member: '成員',
};

const roleColors: Record<OrgRole, string> = {
  owner: 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4]',
  admin: 'bg-gradient-to-r from-[#A8D5E2] to-[#B8E0D2]',
  teacher: 'bg-gradient-to-r from-[#C8E6C9] to-[#A5D6A7]',
  member: 'bg-gradient-to-r from-[#E0E0E0] to-[#BDBDBD]',
};

const roleDescriptions: Record<OrgRole, string> = {
  owner: '機構創建者，擁有最高權限，可訪問所有頁面',
  admin: '機構管理員，擁有大部分管理權限，可訪問所有頁面',
  teacher: '教師，可管理課堂活動和學習資源',
  member: '機構成員，可查看課堂活動（不包含排期管理）',
};

interface RolePermissionsGuideProps {
  className?: string;
}

export default function RolePermissionsGuide({ className = '' }: RolePermissionsGuideProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedRole, setExpandedRole] = useState<OrgRole | null>(null);

  // 獲取每個角色可以訪問的頁面
  const getRolePages = (role: OrgRole) => {
    return Object.values(PAGE_PERMISSIONS).filter((permission) =>
      permission.allowedRoles.includes(role)
    );
  };

  // 页面分组显示
  const pageGroups = {
    '管理功能': ['students', 'members', 'teachers', 'pending-students', 'organization-settings', 'permission-management'],
    '課程管理': ['class-activities', 'schedule-management', 'lesson-availability'],
    '學習相關': ['learning-resources', 'progress'],
    '其他功能': ['finance', 'tasks', 'ai-tools', 'ai-select', 'ai-project-logs'],
  };

  const getPageGroup = (pageKey: string): string => {
    for (const [group, pages] of Object.entries(pageGroups)) {
      if (pages.includes(pageKey)) {
        return group;
      }
    }
    return '其他功能';
  };

  const toggleRole = (role: OrgRole) => {
    setExpandedRole(expandedRole === role ? null : role);
  };

  return (
    <div className={`relative overflow-hidden rounded-[28px] border border-white/60 bg-gradient-to-br from-white/80 via-[#FFEFE2] to-[#FFE4F5] shadow-[0_24px_60px_rgba(231,200,166,0.28)] p-6 ${className}`}>
      <div className="absolute -right-14 top-10 h-48 w-48 rounded-full bg-white/40 blur-2xl" aria-hidden="true" />
      <div className="absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-[#FFD6E7]/60 blur-3xl" aria-hidden="true" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#4B4036] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#FFB6C1]" />
            角色權限說明
          </h2>
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[#6E5A4A] hover:text-[#4B4036] hover:bg-white/50 rounded-lg transition-colors"
          >
            <span>{isExpanded ? '收起' : '展開'}</span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </motion.button>
        </div>
        <p className="text-sm text-[#6E5A4A] mb-6">
          以下說明各角色在機構中可以訪問的頁面和功能
        </p>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="space-y-3">
          {(Object.keys(roleLabels) as OrgRole[]).map((role) => {
            const pages = getRolePages(role);
            const isExpanded = expandedRole === role;

            return (
              <div
                key={role}
                className="border border-[#EADBC8] rounded-xl bg-[#FFFDF8] overflow-hidden"
              >
                <motion.button
                  onClick={() => toggleRole(role)}
                  className="w-full p-4 flex items-center justify-between hover:bg-[#FFF9F2] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${roleColors[role]}`}>
                      {roleLabels[role]}
                    </span>
                    <div className="text-left">
                      <p className="text-sm font-medium text-[#4B4036]">{roleDescriptions[role]}</p>
                      <p className="text-xs text-[#6E5A4A] mt-1">
                        可訪問 {pages.length} 個頁面
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-[#6E5A4A]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#6E5A4A]" />
                  )}
                </motion.button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 border-t border-[#EADBC8]">
                        {/* 按分组显示页面 */}
                        {Object.entries(pageGroups).map(([groupName, groupPages]) => {
                          const groupPagePermissions = pages.filter((p) =>
                            groupPages.includes(p.key)
                          );

                          if (groupPagePermissions.length === 0) return null;

                          return (
                            <div key={groupName} className="mb-4 last:mb-0">
                              <h4 className="text-xs font-semibold text-[#8A7C70] mb-2 uppercase tracking-wide">
                                {groupName}
                              </h4>
                              <div className="space-y-2">
                                {groupPagePermissions.map((page) => {
                                  // 檢查是否有功能限制
                                  const hasRestrictions =
                                    page.restrictedFeatures &&
                                    page.restrictedFeatures.length > 0 &&
                                    (role === 'teacher' || role === 'member');

                                  return (
                                    <div
                                      key={page.key}
                                      className="flex items-start gap-2 p-2 rounded-lg bg-white/50 border border-[#EADBC8]"
                                    >
                                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[#4B4036]">
                                          {page.title}
                                        </p>
                                        {page.description && (
                                          <p className="text-xs text-[#6E5A4A] mt-1">
                                            {page.description}
                                          </p>
                                        )}
                                        {hasRestrictions && (
                                          <div className="mt-2 space-y-1">
                                            <p className="text-xs font-medium text-orange-600">
                                              限制功能：
                                            </p>
                                            {page.restrictedFeatures?.map((feature) => (
                                              <div
                                                key={feature}
                                                className="flex items-center gap-1 text-xs text-[#6E5A4A]"
                                              >
                                                <X className="w-3 h-3 text-red-500" />
                                                <span>
                                                  {feature === 'schedule-management'
                                                    ? '課程與課堂排期管理'
                                                    : feature === 'multi-course-schedule'
                                                    ? '多課程時間表'
                                                    : feature}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}

                        {/* 显示其他未分组的页面 */}
                        {pages.filter(
                          (p) =>
                            !Object.values(pageGroups).some((groupPages) =>
                              groupPages.includes(p.key)
                            )
                        ).length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-xs font-semibold text-[#8A7C70] mb-2 uppercase tracking-wide">
                              其他功能
                            </h4>
                            <div className="space-y-2">
                              {pages
                                .filter(
                                  (p) =>
                                    !Object.values(pageGroups).some((groupPages) =>
                                      groupPages.includes(p.key)
                                    )
                                )
                                .map((page) => (
                                  <div
                                    key={page.key}
                                    className="flex items-start gap-2 p-2 rounded-lg bg-white/50 border border-[#EADBC8]"
                                  >
                                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-[#4B4036]">
                                        {page.title}
                                      </p>
                                      {page.description && (
                                        <p className="text-xs text-[#6E5A4A] mt-1">
                                          {page.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              );
            })}
              </div>

              <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-200">
                <p className="text-xs text-blue-800 leading-relaxed">
                  <strong>提示：</strong>
                  權限不足的頁面會顯示為灰色，點擊時會提示「權限不足，未能進入」。如需調整權限，請聯繫機構管理員。
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

