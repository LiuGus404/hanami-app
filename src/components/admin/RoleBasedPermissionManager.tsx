'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface PermissionConfig {
  access: 'allow' | 'deny';
  operations: string[];
}

interface RolePermissions {
  pages: Record<string, PermissionConfig>;
  features: Record<string, PermissionConfig>;
}

interface RoleBasedPermissionManagerProps {
  permissions: RolePermissions;
  onPermissionsChange: (permissions: RolePermissions) => void;
}

export default function RoleBasedPermissionManager({
  permissions,
  onPermissionsChange,
}: RoleBasedPermissionManagerProps) {
  const [activeRole, setActiveRole] = useState<'admin' | 'teacher' | 'parent'>('admin');

  // 預定義的頁面列表 - 按角色分類
  const predefinedPages = {
    admin: [
      { path: '/admin/*', label: '管理員頁面', description: '所有管理員相關頁面', icon: '👑' },
      { path: '/admin/students', label: '學生管理', description: '學生管理頁面', icon: '👥' },
      { path: '/admin/teachers', label: '教師管理', description: '教師管理頁面', icon: '👨‍🏫' },
      { path: '/admin/class-management', label: '課程管理', description: '課程管理頁面', icon: '📚' },
      { path: '/admin/schedule-management', label: '排程管理', description: '排程管理頁面', icon: '📅' },
      { path: '/admin/ai-hub', label: 'AI 工具', description: 'AI 工具中心', icon: '🤖' },
      { path: '/admin/permission-management', label: '權限管理', description: '權限管理頁面', icon: '🔐' },
      { path: '/admin/student-progress', label: '學生進度', description: '學生進度管理', icon: '📊' },
      { path: '/admin/resource-library', label: '資源庫', description: '教學資源庫', icon: '📖' },
      { path: '/admin/trial-queue', label: '試聽隊列', description: '試聽學生管理', icon: '🎵' },
      { path: '/admin/registration-requests', label: '註冊申請', description: '用戶註冊申請管理', icon: '📝' },
    ],
    teacher: [
      { path: '/teacher/*', label: '教師頁面', description: '所有教師相關頁面', icon: '👨‍🏫' },
      { path: '/teacher/dashboard', label: '教師儀表板', description: '教師儀表板', icon: '🏠' },
      { path: '/teacher/profile', label: '個人資料', description: '教師個人資料管理', icon: '👤' },
      { path: '/teacher/students', label: '學生管理', description: '教師的學生管理', icon: '👥' },
      { path: '/teacher/lessons', label: '課程記錄', description: '課程記錄管理', icon: '📝' },
      { path: '/teacher/schedule', label: '課程安排', description: '個人課程安排', icon: '📅' },
      { path: '/teacher/progress', label: '學生進度', description: '學生學習進度', icon: '📊' },
      { path: '/teacher/media', label: '媒體管理', description: '學生作品管理', icon: '🎨' },
    ],
    parent: [
      { path: '/parent/*', label: '家長頁面', description: '所有家長相關頁面', icon: '👨‍👩‍👧‍👦' },
      { path: '/parent/dashboard', label: '家長儀表板', description: '家長儀表板', icon: '🏠' },
      { path: '/parent/profile', label: '個人資料', description: '家長個人資料', icon: '👤' },
      { path: '/parent/children', label: '子女管理', description: '子女資料管理', icon: '👶' },
      { path: '/parent/progress', label: '學習進度', description: '子女學習進度', icon: '📊' },
      { path: '/parent/schedule', label: '課程安排', description: '子女課程安排', icon: '📅' },
      { path: '/parent/media', label: '作品展示', description: '子女作品展示', icon: '🎨' },
    ]
  };

  // 預定義的功能列表 - 按角色分類
  const predefinedFeatures = {
    admin: [
      { name: 'user_management', label: '用戶管理', description: '管理用戶帳號和權限', icon: '👥' },
      { name: 'permission_management', label: '權限管理', description: '管理角色和權限', icon: '🔐' },
      { name: 'system_settings', label: '系統設定', description: '系統配置和設定', icon: '⚙️' },
      { name: 'student_management', label: '學生管理', description: '學生資料管理', icon: '👶' },
      { name: 'teacher_management', label: '教師管理', description: '教師資料管理', icon: '👨‍🏫' },
      { name: 'course_management', label: '課程管理', description: '課程和排程管理', icon: '📚' },
      { name: 'ai_tools', label: 'AI 工具', description: 'AI 輔助功能', icon: '🤖' },
      { name: 'data_export', label: '數據導出', description: '數據導出功能', icon: '📤' },
      { name: 'financial_data', label: '財務數據', description: '財務數據管理', icon: '💰' },
    ],
    teacher: [
      { name: 'lesson_management', label: '課程記錄', description: '課程記錄管理', icon: '📝' },
      { name: 'student_progress', label: '學生進度', description: '學生學習進度追蹤', icon: '📊' },
      { name: 'media_management', label: '媒體管理', description: '學生作品管理', icon: '🎨' },
      { name: 'growth_tree_management', label: '成長樹管理', description: '學生成長樹管理', icon: '🌳' },
      { name: 'ability_development', label: '發展能力圖卡', description: '能力發展圖卡', icon: '📈' },
      { name: 'teaching_activities', label: '教學活動管理', description: '教學活動管理', icon: '🎯' },
      { name: 'ability_assessment', label: '能力評估管理', description: '學生能力評估', icon: '✅' },
      { name: 'schedule_management', label: '排程管理', description: '個人課程排程', icon: '📅' },
    ],
    parent: [
      { name: 'child_info', label: '子女資訊', description: '查看子女基本資訊', icon: '👶' },
      { name: 'progress_tracking', label: '進度追蹤', description: '追蹤子女學習進度', icon: '📊' },
      { name: 'lesson_records', label: '課程記錄', description: '查看子女課程記錄', icon: '📝' },
      { name: 'media_viewing', label: '作品查看', description: '查看子女作品', icon: '🎨' },
      { name: 'communication', label: '溝通功能', description: '與教師溝通', icon: '💬' },
      { name: 'schedule_viewing', label: '課程安排查看', description: '查看子女課程安排', icon: '📅' },
    ]
  };

  // 切換頁面權限
  const togglePagePermission = (pagePath: string) => {
    const currentPermission = permissions.pages?.[pagePath];
    const newAccess = currentPermission?.access === 'allow' ? 'deny' : 'allow';
    
    const updatedPermissions = {
      ...permissions,
      pages: {
        ...permissions.pages,
        [pagePath]: {
          access: newAccess as "allow" | "deny",
          operations: newAccess === 'allow' ? ['view', 'create', 'edit', 'delete'] : []
        }
      }
    };
    
    onPermissionsChange(updatedPermissions);
  };

  // 切換功能權限
  const toggleFeaturePermission = (featureName: string) => {
    const currentPermission = permissions.features?.[featureName];
    const newAccess = currentPermission?.access === 'allow' ? 'deny' : 'allow';
    
    const updatedPermissions = {
      ...permissions,
      features: {
        ...permissions.features,
        [featureName]: {
          access: newAccess as "allow" | "deny",
          operations: newAccess === 'allow' ? ['view', 'create', 'edit', 'delete'] : []
        }
      }
    };
    
    onPermissionsChange(updatedPermissions);
  };

  // 批量設置角色權限
  const setRolePermissions = (role: 'admin' | 'teacher' | 'parent', access: 'allow' | 'deny') => {
    const updatedPermissions = { ...permissions };
    
    // 設置頁面權限
    predefinedPages[role].forEach(page => {
      updatedPermissions.pages[page.path] = {
        access: access as "allow" | "deny",
        operations: access === 'allow' ? ['view', 'create', 'edit', 'delete'] : []
      };
    });
    
    // 設置功能權限
    predefinedFeatures[role].forEach(feature => {
      updatedPermissions.features[feature.name] = {
        access: access as "allow" | "deny",
        operations: access === 'allow' ? ['view', 'create', 'edit', 'delete'] : []
      };
    });
    
    onPermissionsChange(updatedPermissions);
  };

  return (
    <div className="space-y-6">
      {/* 角色選擇器 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-[#4B4036] mb-4">選擇角色類型</h3>
        <div className="grid grid-cols-3 gap-4">
          {(['admin', 'teacher', 'parent'] as const).map((role) => (
            <motion.button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`p-4 rounded-xl border-2 transition-all ${
                activeRole === role
                  ? 'border-[#FFD59A] bg-[#FFF9F2] shadow-md'
                  : 'border-[#EADBC8] bg-white hover:border-[#FFD59A]'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">
                  {role === 'admin' ? '👑' : role === 'teacher' ? '👨‍🏫' : '👨‍👩‍👧‍👦'}
                </div>
                <div className="font-medium text-[#4B4036]">
                  {role === 'admin' ? '管理員' : role === 'teacher' ? '教師' : '家長'}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* 批量操作 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-[#4B4036] mb-4">批量權限設置</h3>
        <div className="flex space-x-4">
          <motion.button
            onClick={() => setRolePermissions(activeRole, 'allow')}
            className="px-6 py-2 bg-[#4CAF50] text-white rounded-xl font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            全部允許
          </motion.button>
          <motion.button
            onClick={() => setRolePermissions(activeRole, 'deny')}
            className="px-6 py-2 bg-[#F44336] text-white rounded-xl font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            全部拒絕
          </motion.button>
        </div>
      </div>

      {/* 頁面權限 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-[#4B4036] mb-4 flex items-center">
          <span className="mr-2">📄</span>
          {activeRole === 'admin' ? '管理員' : activeRole === 'teacher' ? '教師' : '家長'} 頁面權限
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {predefinedPages[activeRole].map((page) => {
            const isAllowed = permissions.pages?.[page.path]?.access === 'allow';
            return (
              <motion.div
                key={page.path}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  isAllowed
                    ? 'border-[#4CAF50] bg-[#E8F5E8]'
                    : 'border-[#E0E0E0] bg-[#F5F5F5]'
                }`}
                onClick={() => togglePagePermission(page.path)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{page.icon}</span>
                    <div>
                      <div className="font-medium text-[#4B4036]">{page.label}</div>
                      <div className="text-sm text-[#8B7355]">{page.description}</div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isAllowed
                      ? 'bg-[#4CAF50] text-white'
                      : 'bg-[#E0E0E0] text-[#666]'
                  }`}>
                    {isAllowed ? '✓ 允許' : '✗ 拒絕'}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 功能權限 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-[#4B4036] mb-4 flex items-center">
          <span className="mr-2">⚙️</span>
          {activeRole === 'admin' ? '管理員' : activeRole === 'teacher' ? '教師' : '家長'} 功能權限
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {predefinedFeatures[activeRole].map((feature) => {
            const isAllowed = permissions.features?.[feature.name]?.access === 'allow';
            return (
              <motion.div
                key={feature.name}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  isAllowed
                    ? 'border-[#4CAF50] bg-[#E8F5E8]'
                    : 'border-[#E0E0E0] bg-[#F5F5F5]'
                }`}
                onClick={() => toggleFeaturePermission(feature.name)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{feature.icon}</span>
                    <div>
                      <div className="font-medium text-[#4B4036]">{feature.label}</div>
                      <div className="text-sm text-[#8B7355]">{feature.description}</div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isAllowed
                      ? 'bg-[#4CAF50] text-white'
                      : 'bg-[#E0E0E0] text-[#666]'
                  }`}>
                    {isAllowed ? '✓ 允許' : '✗ 拒絕'}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 