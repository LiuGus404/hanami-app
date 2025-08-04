'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import RoleBasedPermissionManager from '@/components/admin/RoleBasedPermissionManager';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';

interface PermissionConfig {
  access: 'allow' | 'deny';
  operations: string[];
}

interface RolePermissions {
  pages: Record<string, PermissionConfig>;
  features: Record<string, PermissionConfig>;
}

interface Role {
  id: string;
  role_name: string;
  display_name: string;
  description: string | null;
  is_system_role: boolean;
  permissions: RolePermissions;
  is_active: boolean;
  created_at: string;
}

export default function RoleBasedPermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 載入角色列表
  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hanami_roles')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setRoles(data || []);
      
      // 預設選擇第一個角色
      if (data && data.length > 0) {
        setSelectedRole(data[0]);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      setMessage({ type: 'error', text: '載入角色失敗' });
    } finally {
      setLoading(false);
    }
  };

  // 更新角色權限
  const handlePermissionsChange = async (permissions: RolePermissions) => {
    if (!selectedRole) return;

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('hanami_roles')
        .update({ 
          permissions,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRole.id);

      if (error) throw error;

      // 更新本地狀態
      setSelectedRole(prev => prev ? { ...prev, permissions } : null);
      setRoles(prev => prev.map(role => 
        role.id === selectedRole.id 
          ? { ...role, permissions }
          : role
      ));

      setMessage({ type: 'success', text: '權限更新成功' });
      
      // 3秒後清除訊息
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error updating permissions:', error);
      setMessage({ type: 'error', text: '權限更新失敗' });
    } finally {
      setSaving(false);
    }
  };

  // 創建新角色
  const handleCreateRole = async () => {
    const newRole = {
      role_name: `custom_role_${Date.now()}`,
      display_name: '新角色',
      description: '新創建的角色',
      is_system_role: false,
      permissions: {
        pages: {},
        features: {}
      },
      is_active: true
    };

    try {
      setSaving(true);
      
      const { data, error } = await supabase
        .from('hanami_roles')
        .insert(newRole)
        .select()
        .single();

      if (error) throw error;

      setRoles(prev => [...prev, data]);
      setSelectedRole(data);
      setMessage({ type: 'success', text: '角色創建成功' });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error creating role:', error);
      setMessage({ type: 'error', text: '角色創建失敗' });
    } finally {
      setSaving(false);
    }
  };

  // 刪除角色
  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('確定要刪除此角色嗎？')) return;

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('hanami_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      setRoles(prev => prev.filter(role => role.id !== roleId));
      
      // 如果刪除的是當前選中的角色，選擇第一個角色
      if (selectedRole?.id === roleId) {
        const remainingRoles = roles.filter(role => role.id !== roleId);
        setSelectedRole(remainingRoles.length > 0 ? remainingRoles[0] : null);
      }

      setMessage({ type: 'success', text: '角色刪除成功' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting role:', error);
      setMessage({ type: 'error', text: '角色刪除失敗' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF9F2] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-[#FFD59A] border-t-[#A64B2A] rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F2] p-6">
      <div className="max-w-7xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#4B4036] mb-2">角色權限管理</h1>
          <p className="text-[#8B7355]">按角色分類管理頁面權限和功能權限</p>
        </div>

        {/* 訊息提示 */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-6 p-4 rounded-xl ${
              message.type === 'success' 
                ? 'bg-[#E8F5E8] border border-[#4CAF50] text-[#2E7D32]' 
                : 'bg-[#FFEBEE] border border-[#F44336] text-[#C62828]'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 角色列表側邊欄 */}
          <div className="lg:col-span-1">
            <HanamiCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#4B4036]">角色列表</h2>
                <HanamiButton
                  onClick={handleCreateRole}
                  disabled={saving}
                  size="sm"
                  variant="primary"
                >
                  + 新增
                </HanamiButton>
              </div>

              <div className="space-y-2">
                {roles.map((role) => (
                  <motion.div
                    key={role.id}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${
                      selectedRole?.id === role.id
                        ? 'bg-[#FFD59A] border-2 border-[#A64B2A]'
                        : 'bg-[#FFF9F2] border-2 border-[#EADBC8] hover:border-[#FFD59A]'
                    }`}
                    onClick={() => setSelectedRole(role)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#4B4036]">{role.display_name}</div>
                        <div className="text-sm text-[#8B7355]">{role.role_name}</div>
                        {role.is_system_role && (
                          <div className="text-xs text-[#A64B2A] bg-[#FFE0E0] px-2 py-1 rounded-full mt-1 inline-block">
                            系統角色
                          </div>
                        )}
                      </div>
                      {!role.is_system_role && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRole(role.id);
                          }}
                          className="text-[#F44336] hover:text-[#D32F2F] p-1"
                          disabled={saving}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </HanamiCard>
          </div>

          {/* 權限管理主區域 */}
          <div className="lg:col-span-3">
            {selectedRole ? (
              <div className="space-y-6">
                {/* 角色資訊 */}
                <HanamiCard className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-[#4B4036]">{selectedRole.display_name}</h2>
                      <p className="text-[#8B7355]">{selectedRole.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-[#8B7355]">角色名稱</div>
                      <div className="font-medium text-[#4B4036]">{selectedRole.role_name}</div>
                    </div>
                  </div>
                </HanamiCard>

                {/* 權限管理器 */}
                <RoleBasedPermissionManager
                  permissions={selectedRole.permissions}
                  onPermissionsChange={handlePermissionsChange}
                />

                {/* 保存按鈕 */}
                <div className="flex justify-end">
                  <HanamiButton
                    onClick={() => handlePermissionsChange(selectedRole.permissions)}
                    disabled={saving}
                    size="lg"
                    variant="primary"
                  >
                    {saving ? '保存中...' : '保存權限設置'}
                  </HanamiButton>
                </div>
              </div>
            ) : (
              <HanamiCard className="p-12 text-center">
                <div className="text-6xl mb-4">👑</div>
                <h3 className="text-xl font-bold text-[#4B4036] mb-2">選擇角色</h3>
                <p className="text-[#8B7355]">請從左側選擇一個角色來管理其權限</p>
              </HanamiCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 