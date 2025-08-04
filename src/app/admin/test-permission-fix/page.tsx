'use client';

import { useState } from 'react';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';

export default function TestPermissionFixPage() {
  const [testRoleId, setTestRoleId] = useState<string>('');

  // 模擬 predefinedPages 結構
  const predefinedPages = {
    admin: [
      { path: '/admin/*', label: '管理員頁面', description: '所有管理員相關頁面' },
      { path: '/admin/students', label: '學生管理', description: '學生管理頁面' },
    ],
    teacher: [
      { path: '/teacher/*', label: '教師頁面', description: '所有教師相關頁面' },
      { path: '/teacher/dashboard', label: '教師儀表板', description: '教師儀表板' },
    ],
    parent: [
      { path: '/parent/*', label: '家長頁面', description: '所有家長相關頁面' },
      { path: '/parent/dashboard', label: '家長儀表板', description: '家長儀表板' },
    ]
  };

  // 模擬角色數據
  const roles = [
    { id: 'role-1', role_name: 'admin', display_name: '管理員' },
    { id: 'role-2', role_name: 'teacher', display_name: '教師' },
    { id: 'role-3', role_name: 'parent', display_name: '家長' },
  ];

  // 獲取當前選中角色的名稱
  const getCurrentRoleName = () => {
    const selectedRole = roles.find(role => role.id === testRoleId);
    return selectedRole?.role_name || 'admin';
  };

  // 測試修復後的邏輯
  const testFixedLogic = () => {
    const roleName = getCurrentRoleName();
    const pages = predefinedPages[roleName as keyof typeof predefinedPages] || predefinedPages.admin;
    
    console.log('測試結果:', {
      testRoleId,
      roleName,
      pagesCount: pages.length,
      pages
    });
    
    alert(`測試成功！\n角色ID: ${testRoleId}\n角色名稱: ${roleName}\n頁面數量: ${pages.length}`);
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#4B4036] mb-6">權限修復測試頁面</h1>

        <HanamiCard className="p-6 mb-6">
          <h2 className="text-xl font-bold text-[#4B4036] mb-4">測試權限修復邏輯</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">
                選擇角色ID (模擬 formData.role_id)
              </label>
              <select
                value={testRoleId}
                onChange={(e) => setTestRoleId(e.target.value)}
                className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:outline-none focus:border-[#FFD59A]"
              >
                <option value="">請選擇角色</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.display_name} ({role.role_name})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg">
              <h3 className="font-medium text-[#4B4036] mb-2">當前狀態:</h3>
              <div className="text-sm space-y-1">
                <div><strong>角色ID:</strong> {testRoleId || '未選擇'}</div>
                <div><strong>角色名稱:</strong> {getCurrentRoleName()}</div>
                <div><strong>可用頁面:</strong> {
                  predefinedPages[getCurrentRoleName() as keyof typeof predefinedPages]?.length || 0
                } 個
                </div>
              </div>
            </div>

            <HanamiButton
              onClick={testFixedLogic}
              variant="primary"
              disabled={!testRoleId}
            >
              測試修復邏輯
            </HanamiButton>
          </div>
        </HanamiCard>

        <HanamiCard className="p-6">
          <h2 className="text-xl font-bold text-[#4B4036] mb-4">修復說明</h2>
          
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium text-[#4B4036]">問題:</h3>
              <p className="text-[#8B7355]">
                原本的代碼使用 <code>predefinedPages[formData.role_id]</code>，但 <code>formData.role_id</code> 是 UUID，不是角色名稱，導致返回 <code>undefined</code>。
              </p>
            </div>

            <div>
              <h3 className="font-medium text-[#4B4036]">修復方案:</h3>
              <p className="text-[#8B7355]">
                1. 添加 <code>getCurrentRoleName()</code> 函數來根據 <code>role_id</code> 獲取角色名稱<br/>
                2. 使用 <code>predefinedPages[getCurrentRoleName()]</code> 替代 <code>predefinedPages[formData.role_id]</code><br/>
                3. 添加後備方案 <code>|| predefinedPages.admin</code> 防止出錯
              </p>
            </div>

            <div>
              <h3 className="font-medium text-[#4B4036]">修復後的代碼:</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
{`// 獲取當前選中角色的名稱
const getCurrentRoleName = () => {
  const selectedRole = roles.find(role => role.id === formData.role_id);
  return selectedRole?.role_name || 'admin';
};

// 使用修復後的邏輯
{(predefinedPages[getCurrentRoleName() as keyof typeof predefinedPages] || predefinedPages.admin).map((page) => {
  // 渲染頁面權限
})}`}
              </pre>
            </div>
          </div>
        </HanamiCard>
      </div>
    </div>
  );
} 