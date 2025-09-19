// ========================================
// Hanami AI 伙伴系統 - React Hooks
// ========================================
// 版本: 1.0
// 建立日期: 2025-01-17

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import aiAPI from '../lib/ai-companion-api';
import type {
  AIRoom,
  RoomMember,
  AIRole,
  RoleInstance,
  AIMessage,
  MemoryItem,
  CreateRoomRequest,
  CreateRoleRequest,
  CreateRoleInstanceRequest,
  SendMessageRequest,
  CreateMemoryRequest,
  SearchMemoryRequest,
  SearchMemoryResult,
  UsageStats,
  UseAIRoomOptions,
  UseAIRoomReturn,
  UseAIRolesOptions,
  UseAIRolesReturn,
  UseMemoryOptions,
  UseMemoryReturn,
} from '../types/ai-companion';

// ========================================
// 房間管理 Hook
// ========================================

export function useAIRoom(options: UseAIRoomOptions): UseAIRoomReturn {
  const { room_id, auto_load = true, real_time = true } = options;
  
  const [room, setRoom] = useState<AIRoom | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [roles, setRoles] = useState<RoleInstance[]>([]);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const subscriptionRef = useRef<any>(null);

  // 載入房間資料
  const loadRoomData = useCallback(async () => {
    if (!room_id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [roomData, membersData, rolesData, messagesData] = await Promise.all([
        aiAPI.room.getRoomById(room_id),
        aiAPI.room.getRoomMembers(room_id),
        aiAPI.role.getRoomRoleInstances(room_id),
        aiAPI.message.getRoomMessages(room_id, 50),
      ]);
      
      setRoom(roomData);
      setMembers(membersData);
      setRoles(rolesData);
      setMessages(messagesData);
    } catch (err: any) {
      setError(err.message || '載入房間資料失敗');
      toast.error('載入房間資料失敗');
    } finally {
      setIsLoading(false);
    }
  }, [room_id]);

  // 發送訊息
  const sendMessage = useCallback(async (request: SendMessageRequest) => {
    try {
      const message = await aiAPI.message.sendMessage(request);
      setMessages(prev => [...prev, message]);
      toast.success('訊息已發送');
    } catch (err: any) {
      setError(err.message || '發送訊息失敗');
      toast.error('發送訊息失敗');
      throw err;
    }
  }, []);

  // 添加角色
  const addRole = useCallback(async (request: CreateRoleInstanceRequest) => {
    try {
      const roleInstance = await aiAPI.role.addRoleToRoom(request);
      setRoles(prev => [...prev, roleInstance]);
      toast.success(`已添加角色：${roleInstance.nickname || roleInstance.role?.name}`);
    } catch (err: any) {
      setError(err.message || '添加角色失敗');
      toast.error('添加角色失敗');
      throw err;
    }
  }, []);

  // 移除角色
  const removeRole = useCallback(async (roleInstanceId: string) => {
    try {
      await aiAPI.role.removeRoleFromRoom(roleInstanceId);
      setRoles(prev => prev.filter(r => r.id !== roleInstanceId));
      toast.success('角色已移除');
    } catch (err: any) {
      setError(err.message || '移除角色失敗');
      toast.error('移除角色失敗');
      throw err;
    }
  }, []);

  // 更新房間
  const updateRoom = useCallback(async (updates: Partial<AIRoom>) => {
    try {
      const updatedRoom = await aiAPI.room.updateRoom(room_id, updates);
      setRoom(updatedRoom);
      toast.success('房間已更新');
    } catch (err: any) {
      setError(err.message || '更新房間失敗');
      toast.error('更新房間失敗');
      throw err;
    }
  }, [room_id]);

  // 設置即時訂閱 (暫時停用)
  useEffect(() => {
    if (!real_time || !room_id) return;

    // TODO: 實現即時訂閱功能
    console.log('即時訂閱功能暫時停用');

    return () => {
      // TODO: 清理訂閱
    };
  }, [real_time, room_id]);

  // 初始載入
  useEffect(() => {
    if (auto_load && room_id) {
      loadRoomData();
    }
  }, [auto_load, room_id, loadRoomData]);

  return {
    room,
    members,
    roles,
    messages,
    is_loading: isLoading,
    error,
    sendMessage,
    addRole,
    removeRole,
    updateRoom,
  };
}

// ========================================
// 房間列表 Hook
// ========================================

export function useAIRooms() {
  const [rooms, setRooms] = useState<AIRoom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRooms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const roomsData = await aiAPI.room.getUserRooms();
      setRooms(roomsData);
    } catch (err: any) {
      setError(err.message || '載入房間列表失敗');
      toast.error('載入房間列表失敗');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createRoom = useCallback(async (request: CreateRoomRequest): Promise<AIRoom> => {
    try {
      const newRoom = await aiAPI.room.createRoom(request);
      setRooms(prev => [newRoom, ...prev]);
      toast.success('房間已創建');
      return newRoom;
    } catch (err: any) {
      setError(err.message || '創建房間失敗');
      toast.error('創建房間失敗');
      throw err;
    }
  }, []);

  const deleteRoom = useCallback(async (roomId: string) => {
    try {
      await aiAPI.room.deleteRoom(roomId);
      setRooms(prev => prev.filter(r => r.id !== roomId));
      toast.success('房間已刪除');
    } catch (err: any) {
      setError(err.message || '刪除房間失敗');
      toast.error('刪除房間失敗');
      throw err;
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  return {
    rooms,
    isLoading,
    error,
    createRoom,
    deleteRoom,
    reload: loadRooms,
  };
}

// ========================================
// AI 角色管理 Hook
// ========================================

export function useAIRoles(options: UseAIRolesOptions = {}): UseAIRolesReturn {
  const { category, is_public, creator_user_id } = options;
  
  const [roles, setRoles] = useState<AIRole[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRoles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let rolesData: AIRole[];
      
      if (is_public !== false) {
        rolesData = await aiAPI.role.getPublicRoles(category);
      } else {
        rolesData = await aiAPI.role.getUserRoles();
      }
      
      setRoles(rolesData);
    } catch (err: any) {
      setError(err.message || '載入角色列表失敗');
      toast.error('載入角色列表失敗');
    } finally {
      setIsLoading(false);
    }
  }, [category, is_public, creator_user_id]);

  const createRole = useCallback(async (request: CreateRoleRequest): Promise<AIRole> => {
    try {
      const newRole = await aiAPI.role.createRole(request);
      setRoles(prev => [newRole, ...prev]);
      toast.success('角色已創建');
      return newRole;
    } catch (err: any) {
      setError(err.message || '創建角色失敗');
      toast.error('創建角色失敗');
      throw err;
    }
  }, []);

  const updateRole = useCallback(async (id: string, updates: Partial<AIRole>): Promise<AIRole> => {
    try {
      const updatedRole = await aiAPI.role.updateRole(id, updates);
      setRoles(prev => prev.map(r => r.id === id ? updatedRole : r));
      toast.success('角色已更新');
      return updatedRole;
    } catch (err: any) {
      setError(err.message || '更新角色失敗');
      toast.error('更新角色失敗');
      throw err;
    }
  }, []);

  const deleteRole = useCallback(async (id: string): Promise<void> => {
    try {
      await aiAPI.role.deleteRole(id);
      setRoles(prev => prev.filter(r => r.id !== id));
      toast.success('角色已刪除');
    } catch (err: any) {
      setError(err.message || '刪除角色失敗');
      toast.error('刪除角色失敗');
      throw err;
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  return {
    roles,
    is_loading: isLoading,
    error,
    createRole,
    updateRole,
    deleteRole,
  };
}

// ========================================
// 記憶管理 Hook
// ========================================

export function useMemory(options: UseMemoryOptions = {}): UseMemoryReturn {
  const { room_id, user_id, scope } = options;
  
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMemories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const memoriesData = await aiAPI.memory.getMemories(scope, room_id, user_id);
      setMemories(memoriesData);
    } catch (err: any) {
      setError(err.message || '載入記憶失敗');
      toast.error('載入記憶失敗');
    } finally {
      setIsLoading(false);
    }
  }, [scope, room_id, user_id]);

  const createMemory = useCallback(async (request: CreateMemoryRequest): Promise<MemoryItem> => {
    try {
      const newMemory = await aiAPI.memory.createMemory(request);
      setMemories(prev => [newMemory, ...prev]);
      toast.success('記憶已創建');
      return newMemory;
    } catch (err: any) {
      setError(err.message || '創建記憶失敗');
      toast.error('創建記憶失敗');
      throw err;
    }
  }, []);

  const searchMemory = useCallback(async (request: SearchMemoryRequest): Promise<SearchMemoryResult[]> => {
    try {
      const results = await aiAPI.memory.searchMemory(request);
      return results;
    } catch (err: any) {
      setError(err.message || '搜尋記憶失敗');
      toast.error('搜尋記憶失敗');
      throw err;
    }
  }, []);

  const updateMemory = useCallback(async (id: string, updates: Partial<MemoryItem>): Promise<MemoryItem> => {
    try {
      const updatedMemory = await aiAPI.memory.updateMemory(id, updates);
      setMemories(prev => prev.map(m => m.id === id ? updatedMemory : m));
      toast.success('記憶已更新');
      return updatedMemory;
    } catch (err: any) {
      setError(err.message || '更新記憶失敗');
      toast.error('更新記憶失敗');
      throw err;
    }
  }, []);

  const deleteMemory = useCallback(async (id: string): Promise<void> => {
    try {
      await aiAPI.memory.deleteMemory(id);
      setMemories(prev => prev.filter(m => m.id !== id));
      toast.success('記憶已刪除');
    } catch (err: any) {
      setError(err.message || '刪除記憶失敗');
      toast.error('刪除記憶失敗');
      throw err;
    }
  }, []);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  return {
    memories,
    is_loading: isLoading,
    error,
    createMemory,
    searchMemory,
    updateMemory,
    deleteMemory,
  };
}

// ========================================
// 用量統計 Hook
// ========================================

export function useUsageStats(roomId?: string, days: number = 7) {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const statsData = roomId 
        ? await aiAPI.usage.getRoomUsage(roomId, days)
        : await aiAPI.usage.getUserUsage(days);
      
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || '載入用量統計失敗');
      toast.error('載入用量統計失敗');
    } finally {
      setIsLoading(false);
    }
  }, [roomId, days]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    isLoading,
    error,
    reload: loadStats,
  };
}

// ========================================
// 聊天會話 Hook
// ========================================

export function useChatSession(roomId: string) {
  const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID());
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const { 
    room, 
    roles, 
    messages, 
    is_loading: isLoading, 
    error, 
    sendMessage 
  } = useAIRoom({ 
    room_id: roomId, 
    auto_load: true, 
    real_time: true 
  });

  const sendChatMessage = useCallback(async (
    content: string, 
    targetRoleId?: string,
    attachments?: File[]
  ) => {
    if (!content.trim() && !attachments?.length) return;

    setIsTyping(true);
    
    try {
      await sendMessage({
        room_id: roomId,
        session_id: sessionId,
        content: content.trim() || undefined,
        attachments,
        target_role_instance_id: targetRoleId,
      });
    } finally {
      setIsTyping(false);
    }
  }, [roomId, sessionId, sendMessage]);

  const startNewSession = useCallback(() => {
    setSessionId(crypto.randomUUID());
  }, []);

  return {
    room,
    roles,
    messages,
    sessionId,
    isLoading,
    isTyping,
    typingUsers,
    error,
    sendMessage: sendChatMessage,
    startNewSession,
  };
}

// ========================================
// 角色編輯器 Hook
// ========================================

export function useRoleEditor(initialRole?: AIRole) {
  const [role, setRole] = useState<AIRole | undefined>(initialRole);
  const [isEditing, setIsEditing] = useState(!initialRole);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateRole = useCallback((roleData: Partial<AIRole>): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!roleData.name?.trim()) {
      newErrors.name = '角色名稱為必填項';
    }

    if (!roleData.slug?.trim()) {
      newErrors.slug = '角色代碼為必填項';
    } else if (!/^[a-z0-9-]+$/.test(roleData.slug)) {
      newErrors.slug = '角色代碼只能包含小寫字母、數字和連字符';
    }

    if (!roleData.system_prompt?.trim()) {
      newErrors.system_prompt = '系統提示為必填項';
    }

    return newErrors;
  }, []);

  const updateRole = useCallback((updates: Partial<AIRole>) => {
    setRole(prev => prev ? { ...prev, ...updates } : undefined);
    
    // 清除相關錯誤
    setErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(updates).forEach(key => {
        delete newErrors[key];
      });
      return newErrors;
    });
  }, []);

  const saveRole = useCallback(async (): Promise<AIRole | null> => {
    if (!role) return null;

    const validationErrors = validateRole(role);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return null;
    }

    setIsSaving(true);
    setErrors({});

    try {
      let savedRole: AIRole;
      
      if (role.id) {
        savedRole = await aiAPI.role.updateRole(role.id, role);
      } else {
        savedRole = await aiAPI.role.createRole(role as CreateRoleRequest);
      }

      setRole(savedRole);
      setIsEditing(false);
      toast.success(role.id ? '角色已更新' : '角色已創建');
      return savedRole;
    } catch (err: any) {
      setErrors({ general: err.message || '保存角色失敗' });
      toast.error('保存角色失敗');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [role, validateRole]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setErrors({});
    if (initialRole) {
      setRole(initialRole);
    }
  }, [initialRole]);

  const startEdit = useCallback(() => {
    setIsEditing(true);
    setErrors({});
  }, []);

  return {
    role,
    isEditing,
    isSaving,
    errors,
    updateRole,
    saveRole,
    cancelEdit,
    startEdit,
  };
}

// ========================================
// 導出所有 Hooks
// ========================================
