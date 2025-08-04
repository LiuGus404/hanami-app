'use client';

import { useState } from 'react';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';
import {
  AdminIcon, UserManagementIcon, PermissionIcon, SettingsIcon, StudentIcon, TeacherIcon,
  CourseIcon, ScheduleIcon, AIIcon, ProgressIcon, ResourceIcon, TrialIcon, RegistrationIcon,
  DashboardIcon, ProfileIcon, MediaIcon, ChildIcon, PageIcon, ExportIcon, FinanceIcon,
  LessonIcon, GrowthTreeIcon, AbilityIcon, ActivityIcon, AssessmentIcon, CommunicationIcon,
  FeatureIcon
} from '@/components/ui/PermissionIcons';

export default function TestUnifiedPermissionsPage() {
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'teacher' | 'parent'>('all');

  // 統一的頁面權限列表 - 包含所有角色的頁面
  const allPages = [
    // 管理員頁面
    { path: '/admin/*', label: '管理員頁面', description: '所有管理員相關頁面', role: 'admin', icon: AdminIcon },
    { path: '/admin/students', label: '學生管理', description: '學生管理頁面', role: 'admin', icon: StudentIcon },
    { path: '/admin/teachers', label: '教師管理', description: '教師管理頁面', role: 'admin', icon: TeacherIcon },
    { path: '/admin/class-management', label: '課程管理', description: '課程管理頁面', role: 'admin', icon: CourseIcon },
    { path: '/admin/schedule-management', label: '排程管理', description: '排程管理頁面', role: 'admin', icon: ScheduleIcon },
    { path: '/admin/ai-hub', label: 'AI 工具', description: 'AI 工具中心', role: 'admin', icon: AIIcon },
    { path: '/admin/permission-management', label: '權限管理', description: '權限管理頁面', role: 'admin', icon: PermissionIcon },
    { path: '/admin/student-progress', label: '學生進度', description: '學生進度管理', role: 'admin', icon: ProgressIcon },
    { path: '/admin/resource-library', label: '資源庫', description: '教學資源庫', role: 'admin', icon: ResourceIcon },
    { path: '/admin/trial-queue', label: '試聽隊列', description: '試聽學生管理', role: 'admin', icon: TrialIcon },
    { path: '/admin/registration-requests', label: '註冊申請', description: '用戶註冊申請管理', role: 'admin', icon: RegistrationIcon },
    
    // 教師頁面
    { path: '/teacher/*', label: '教師頁面', description: '所有教師相關頁面', role: 'teacher', icon: TeacherIcon },
    { path: '/teacher/dashboard', label: '教師儀表板', description: '教師儀表板', role: 'teacher', icon: DashboardIcon },
    { path: '/teacher/profile', label: '個人資料', description: '教師個人資料管理', role: 'teacher', icon: ProfileIcon },
    { path: '/teacher/students', label: '學生管理', description: '教師的學生管理', role: 'teacher', icon: StudentIcon },
    { path: '/teacher/lessons', label: '課程記錄', description: '課程記錄管理', role: 'teacher', icon: PageIcon },
    { path: '/teacher/schedule', label: '課程安排', description: '個人課程安排', role: 'teacher', icon: ScheduleIcon },
    { path: '/teacher/progress', label: '學生進度', description: '學生學習進度', role: 'teacher', icon: ProgressIcon },
    { path: '/teacher/media', label: '媒體管理', description: '學生作品管理', role: 'teacher', icon: MediaIcon },
    
    // 家長頁面
    { path: '/parent/*', label: '家長頁面', description: '所有家長相關頁面', role: 'parent', icon: ProfileIcon },
    { path: '/parent/dashboard', label: '家長儀表板', description: '家長儀表板', role: 'parent', icon: DashboardIcon },
    { path: '/parent/profile', label: '個人資料', description: '家長個人資料', role: 'parent', icon: ProfileIcon },
    { path: '/parent/children', label: '子女管理', description: '子女資料管理', role: 'parent', icon: ChildIcon },
    { path: '/parent/progress', label: '學習進度', description: '子女學習進度', role: 'parent', icon: ProgressIcon },
    { path: '/parent/schedule', label: '課程安排', description: '子女課程安排', role: 'parent', icon: ScheduleIcon },
    { path: '/parent/media', label: '作品展示', description: '子女作品展示', role: 'parent', icon: MediaIcon },
  ];

  // 統一的功能權限列表 - 包含所有角色的功能
  const allFeatures = [
    // 管理員功能
    { name: 'user_management', label: '用戶管理', description: '管理用戶帳號和權限', role: 'admin', icon: UserManagementIcon },
    { name: 'permission_management', label: '權限管理', description: '管理角色和權限', role: 'admin', icon: PermissionIcon },
    { name: 'system_settings', label: '系統設定', description: '系統配置和設定', role: 'admin', icon: SettingsIcon },
    { name: 'student_management', label: '學生管理', description: '學生資料管理', role: 'admin', icon: StudentIcon },
    { name: 'teacher_management', label: '教師管理', description: '教師資料管理', role: 'admin', icon: TeacherIcon },
    { name: 'course_management', label: '課程管理', description: '課程和排程管理', role: 'admin', icon: CourseIcon },
    { name: 'ai_tools', label: 'AI 工具', description: 'AI 輔助功能', role: 'admin', icon: AIIcon },
    { name: 'data_export', label: '數據導出', description: '數據導出功能', role: 'admin', icon: ExportIcon },
    { name: 'financial_data', label: '財務數據', description: '財務數據管理', role: 'admin', icon: FinanceIcon },
    
    // 教師功能
    { name: 'lesson_management', label: '課程記錄', description: '課程記錄管理', role: 'teacher', icon: LessonIcon },
    { name: 'student_progress', label: '學生進度', description: '學生學習進度追蹤', role: 'teacher', icon: ProgressIcon },
    { name: 'media_management', label: '媒體管理', description: '學生作品管理', role: 'teacher', icon: MediaIcon },
    { name: 'growth_tree_management', label: '成長樹管理', description: '學生成長樹管理', role: 'teacher', icon: GrowthTreeIcon },
    { name: 'ability_development', label: '發展能力圖卡', description: '能力發展圖卡', role: 'teacher', icon: AbilityIcon },
    { name: 'teaching_activities', label: '教學活動管理', description: '教學活動管理', role: 'teacher', icon: ActivityIcon },
    { name: 'ability_assessment', label: '能力評估管理', description: '學生能力評估', role: 'teacher', icon: AssessmentIcon },
    { name: 'schedule_management', label: '排程管理', description: '個人課程排程', role: 'teacher', icon: ScheduleIcon },
    
    // 家長功能
    { name: 'child_info', label: '子女資訊', description: '查看子女基本資訊', role: 'parent', icon: ChildIcon },
    { name: 'progress_tracking', label: '進度追蹤', description: '追蹤子女學習進度', role: 'parent', icon: ProgressIcon },
    { name: 'lesson_records', label: '課程記錄', description: '查看子女課程記錄', role: 'parent', icon: LessonIcon },
    { name: 'media_viewing', label: '作品查看', description: '查看子女作品', role: 'parent', icon: MediaIcon },
    { name: 'communication', label: '溝通功能', description: '與教師溝通', role: 'parent', icon: CommunicationIcon },
    { name: 'schedule_viewing', label: '課程安排查看', description: '查看子女課程安排', role: 'parent', icon: ScheduleIcon },
  ];

  // 模擬權限狀態
  const [permissions, setPermissions] = useState(() => {
    const initialPermissions = {
      pages: {} as Record<string, { access: 'allow' | 'deny'; operations: string[] }>,
      features: {} as Record<string, { access: 'allow' | 'deny'; operations: string[] }>
    };

    // 初始化所有頁面權限為停用
    allPages.forEach(page => {
      initialPermissions.pages[page.path] = { access: 'deny', operations: [] };
    });

    // 初始化所有功能權限為停用
    allFeatures.forEach(feature => {
      initialPermissions.features[feature.name] = { access: 'deny', operations: [] };
    });

    return initialPermissions;
  });

  // 切換頁面權限
  const togglePagePermission = (pagePath: string) => {
    const currentPermission = permissions.pages[pagePath];
    const newAccess = currentPermission?.access === 'allow' ? 'deny' : 'allow';
    
    setPermissions(prev => ({
      ...prev,
      pages: {
        ...prev.pages,
        [pagePath]: {
          access: newAccess,
          operations: newAccess === 'allow' ? ['view', 'create', 'edit', 'delete'] : []
        }
      }
    }));
  };

  // 切換功能權限
  const toggleFeaturePermission = (featureName: string) => {
    const currentPermission = permissions.features[featureName];
    const newAccess = currentPermission?.access === 'allow' ? 'deny' : 'allow';
    
    setPermissions(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [featureName]: {
          access: newAccess,
          operations: newAccess === 'allow' ? ['view', 'create', 'edit', 'delete'] : []
        }
      }
    }));
  };

  // 批量操作函數
  const handleBatchOperation = (role: string, access: 'allow' | 'deny') => {
    const updatedPermissions = { ...permissions };
    
    // 批量設置頁面權限
    allPages
      .filter(page => role === 'all' || page.role === role)
      .forEach(page => {
        updatedPermissions.pages[page.path] = {
          access,
          operations: access === 'allow' ? ['view', 'create', 'edit', 'delete'] : []
        };
      });
    
    // 批量設置功能權限
    allFeatures
      .filter(feature => role === 'all' || feature.role === role)
      .forEach(feature => {
        updatedPermissions.features[feature.name] = {
          access,
          operations: access === 'allow' ? ['view', 'create', 'edit', 'delete'] : []
        };
      });
    
    setPermissions(updatedPermissions);
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[#4B4036] mb-6">統一權限管理測試頁面</h1>

        <HanamiCard className="p-6 mb-6">
          <h2 className="text-xl font-bold text-[#4B4036] mb-4">功能說明</h2>
          <div className="space-y-2 text-sm text-[#8B7355]">
            <p>✅ <strong>統一權限管理</strong>：將頁面權限和功能權限合併為一個界面</p>
            <p>✅ <strong>角色篩選</strong>：可以按角色（管理員、教師、家長）篩選權限</p>
            <p>✅ <strong>視覺化標籤</strong>：每個權限都有圖標和角色標籤</p>
            <p>✅ <strong>批量操作</strong>：支持批量啟用/停用權限</p>
            <p>✅ <strong>響應式設計</strong>：支持不同屏幕尺寸</p>
          </div>
        </HanamiCard>

        <HanamiCard className="p-6">
          <h2 className="text-xl font-bold text-[#4B4036] mb-4">統一權限控制</h2>
          
          {/* 角色篩選器 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#4B4036] mb-2">篩選角色</label>
            <div className="flex space-x-2">
              {['all', 'admin', 'teacher', 'parent'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setFilterRole(role as any)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    filterRole === role
                      ? 'bg-[#FFD59A] text-[#4B4036]'
                      : 'bg-[#F9F2EF] text-[#8B7355] hover:bg-[#EADBC8]'
                  }`}
                >
                  {role === 'all' ? '全部' : role === 'admin' ? '管理員' : role === 'teacher' ? '教師' : '家長'}
                </button>
              ))}
            </div>
          </div>

          {/* 權限列表 */}
          <div className="space-y-6">
            {/* 頁面權限 */}
            <div>
              <h3 className="text-lg font-medium text-[#4B4036] mb-3 flex items-center">
                <PageIcon className="w-5 h-5 mr-2 text-[#FFD59A]" />
                頁面權限 ({allPages.filter(page => filterRole === 'all' || page.role === filterRole).length} 項)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {allPages
                  .filter(page => filterRole === 'all' || page.role === filterRole)
                  .map((page) => {
                    const isAllowed = permissions.pages[page.path]?.access === 'allow';
                    const IconComponent = page.icon;
                    return (
                      <div key={page.path} className="flex items-center justify-between p-3 bg-[#FFF9F2] rounded-lg border border-[#EADBC8] hover:bg-[#F9F2EF] transition-colors">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <IconComponent className="w-5 h-5 text-[#FFD59A]" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-[#4B4036] text-sm truncate">{page.label}</div>
                            <div className="text-xs text-[#8B7355] truncate">{page.description}</div>
                            <div className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                              page.role === 'admin' 
                                ? 'text-[#A64B2A] bg-[#FFE0E0]' 
                                : page.role === 'teacher' 
                                ? 'text-[#2B3A3B] bg-[#E0F2E0]' 
                                : 'text-[#4B4036] bg-[#EADBC8]'
                            }`}>
                              {page.role === 'admin' ? '管理員' : page.role === 'teacher' ? '教師' : '家長'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-3">
                          <span className={`text-xs font-medium ${isAllowed ? 'text-green-600' : 'text-red-600'}`}>
                            {isAllowed ? '啟用' : '停用'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePagePermission(page.path)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:ring-offset-1 ${
                              isAllowed ? 'bg-[#4CAF50]' : 'bg-[#EADBC8]'
                            }`}
                          >
                            <span
                              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                                isAllowed ? 'translate-x-5' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 功能權限 */}
            <div>
              <h3 className="text-lg font-medium text-[#4B4036] mb-3 flex items-center">
                <FeatureIcon className="w-5 h-5 mr-2 text-[#FFD59A]" />
                功能權限 ({allFeatures.filter(feature => filterRole === 'all' || feature.role === filterRole).length} 項)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {allFeatures
                  .filter(feature => filterRole === 'all' || feature.role === filterRole)
                  .map((feature) => {
                    const isAllowed = permissions.features[feature.name]?.access === 'allow';
                    const IconComponent = feature.icon;
                    return (
                      <div key={feature.name} className="flex items-center justify-between p-3 bg-[#FFF9F2] rounded-lg border border-[#EADBC8] hover:bg-[#F9F2EF] transition-colors">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <IconComponent className="w-5 h-5 text-[#FFD59A]" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-[#4B4036] text-sm truncate">{feature.label}</div>
                            <div className="text-xs text-[#8B7355] truncate">{feature.description}</div>
                            <div className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                              feature.role === 'admin' 
                                ? 'text-[#A64B2A] bg-[#FFE0E0]' 
                                : feature.role === 'teacher' 
                                ? 'text-[#2B3A3B] bg-[#E0F2E0]' 
                                : 'text-[#4B4036] bg-[#EADBC8]'
                            }`}>
                              {feature.role === 'admin' ? '管理員' : feature.role === 'teacher' ? '教師' : '家長'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-3">
                          <span className={`text-xs font-medium ${isAllowed ? 'text-green-600' : 'text-red-600'}`}>
                            {isAllowed ? '啟用' : '停用'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleFeaturePermission(feature.name)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:ring-offset-1 ${
                              isAllowed ? 'bg-[#4CAF50]' : 'bg-[#EADBC8]'
                            }`}
                          >
                            <span
                              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                                isAllowed ? 'translate-x-5' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* 批量操作 */}
          <div className="mt-6 pt-6 border-t border-[#EADBC8]">
            <h3 className="text-lg font-medium text-[#4B4036] mb-3">批量操作</h3>
            <div className="flex flex-wrap gap-2">
              <HanamiButton
                onClick={() => handleBatchOperation('all', 'allow')}
                variant="primary"
                size="sm"
              >
                全部啟用
              </HanamiButton>
              <HanamiButton
                onClick={() => handleBatchOperation('all', 'deny')}
                variant="danger"
                size="sm"
              >
                全部停用
              </HanamiButton>
              <HanamiButton
                onClick={() => handleBatchOperation(filterRole, 'allow')}
                variant="secondary"
                size="sm"
              >
                當前角色全部啟用
              </HanamiButton>
              <HanamiButton
                onClick={() => handleBatchOperation(filterRole, 'deny')}
                variant="soft"
                size="sm"
              >
                當前角色全部停用
              </HanamiButton>
            </div>
          </div>

          {/* 權限統計 */}
          <div className="mt-6 pt-6 border-t border-[#EADBC8]">
            <h3 className="text-lg font-medium text-[#4B4036] mb-3">權限統計</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-[#FFF9F2] rounded-lg border border-[#EADBC8]">
                <div className="text-2xl font-bold text-[#4B4036]">
                  {Object.values(permissions.pages).filter(p => p.access === 'allow').length}
                </div>
                <div className="text-sm text-[#8B7355]">啟用頁面</div>
              </div>
              <div className="text-center p-3 bg-[#FFF9F2] rounded-lg border border-[#EADBC8]">
                <div className="text-2xl font-bold text-[#4B4036]">
                  {Object.values(permissions.features).filter(f => f.access === 'allow').length}
                </div>
                <div className="text-sm text-[#8B7355]">啟用功能</div>
              </div>
              <div className="text-center p-3 bg-[#FFF9F2] rounded-lg border border-[#EADBC8]">
                <div className="text-2xl font-bold text-[#4B4036]">
                  {allPages.length}
                </div>
                <div className="text-sm text-[#8B7355]">總頁面數</div>
              </div>
              <div className="text-center p-3 bg-[#FFF9F2] rounded-lg border border-[#EADBC8]">
                <div className="text-2xl font-bold text-[#4B4036]">
                  {allFeatures.length}
                </div>
                <div className="text-sm text-[#8B7355]">總功能數</div>
              </div>
            </div>
          </div>
        </HanamiCard>
      </div>
    </div>
  );
} 