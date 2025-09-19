// ========================================
// Hanami AI 伙伴系統 - API 工具函數
// ========================================
// 版本: 1.0
// 建立日期: 2025-01-17

import { getSupabaseClient } from './supabase';

const supabase = getSupabaseClient();
import type {
  AIRoom,
  RoomMember,
  AIRole,
  RoleInstance,
  AIMessage,
  MemoryItem,
  AIUsage,
  AITask,
  CreateRoomRequest,
  CreateRoleRequest,
  CreateRoleInstanceRequest,
  SendMessageRequest,
  CreateMemoryRequest,
  SearchMemoryRequest,
  SearchMemoryResult,
  CreateTaskRequest,
  APIResponse,
  PaginatedResponse,
  RoomStatistics,
  UsageStats,
} from '../types/ai-companion';

// ========================================
// 錯誤處理工具
// ========================================

class AICompanionError extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message);
    this.name = 'AICompanionError';
  }
}

const handleSupabaseError = (error: any): never => {
  console.error('Supabase error:', error);
  throw new AICompanionError(
    error.message || '資料庫操作失敗',
    error.code,
    error.details
  );
};

// ========================================
// 房間管理 API
// ========================================

export const roomAPI = {
  // 獲取用戶的房間列表
  async getUserRooms(): Promise<AIRoom[]> {
    try {
      const { data, error } = await supabase
        .from('ai_rooms')
        .select(`
          *,
          room_members!inner(user_id)
        `)
        .eq('room_members.user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('is_archived', false)
        .order('last_message_at', { ascending: false });

      if (error) handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('獲取房間列表失敗:', error);
      throw error;
    }
  },

  // 獲取單個房間詳情
  async getRoomById(roomId: string): Promise<AIRoom | null> {
    try {
      const { data, error } = await supabase
        .from('ai_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error) handleSupabaseError(error);
      return data;
    } catch (error) {
      console.error('獲取房間詳情失敗:', error);
      throw error;
    }
  },

  // 創建新房間
  async createRoom(request: CreateRoomRequest): Promise<AIRoom> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new AICompanionError('用戶未登入');

      const { data: room, error: roomError } = await supabase
        .from('ai_rooms')
        .insert({
          ...request,
          created_by: user.id,
        })
        .select()
        .single();

      if (roomError) handleSupabaseError(roomError);

      // 將創建者添加為房間擁有者
      const { error: memberError } = await supabase
        .from('room_members')
        .insert({
          room_id: room.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) handleSupabaseError(memberError);

      return room;
    } catch (error) {
      console.error('創建房間失敗:', error);
      throw error;
    }
  },

  // 更新房間
  async updateRoom(roomId: string, updates: Partial<AIRoom>): Promise<AIRoom> {
    try {
      const { data, error } = await supabase
        .from('ai_rooms')
        .update(updates)
        .eq('id', roomId)
        .select()
        .single();

      if (error) handleSupabaseError(error);
      return data;
    } catch (error) {
      console.error('更新房間失敗:', error);
      throw error;
    }
  },

  // 刪除房間（歸檔）
  async deleteRoom(roomId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_rooms')
        .update({ is_archived: true })
        .eq('id', roomId);

      if (error) handleSupabaseError(error);
    } catch (error) {
      console.error('刪除房間失敗:', error);
      throw error;
    }
  },

  // 獲取房間成員
  async getRoomMembers(roomId: string): Promise<RoomMember[]> {
    try {
      const { data, error } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', roomId)
        .order('joined_at');

      if (error) handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('獲取房間成員失敗:', error);
      throw error;
    }
  },

  // 邀請用戶加入房間
  async inviteUser(roomId: string, userId: string, role: string = 'member'): Promise<void> {
    try {
      const { error } = await supabase
        .from('room_members')
        .insert({
          room_id: roomId,
          user_id: userId,
          role,
        });

      if (error) handleSupabaseError(error);
    } catch (error) {
      console.error('邀請用戶失敗:', error);
      throw error;
    }
  },

  // 離開房間
  async leaveRoom(roomId: string): Promise<void> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new AICompanionError('用戶未登入');

      const { error } = await supabase
        .from('room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user.id);

      if (error) handleSupabaseError(error);
    } catch (error) {
      console.error('離開房間失敗:', error);
      throw error;
    }
  },
};

// ========================================
// AI 角色管理 API
// ========================================

export const roleAPI = {
  // 獲取公開角色列表
  async getPublicRoles(category?: string): Promise<AIRole[]> {
    try {
      let query = supabase
        .from('ai_roles')
        .select('*')
        .eq('is_public', true)
        .eq('status', 'active')
        .order('usage_count', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('獲取公開角色失敗:', error);
      throw error;
    }
  },

  // 獲取用戶創建的角色
  async getUserRoles(): Promise<AIRole[]> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return [];

      const { data, error } = await supabase
        .from('ai_roles')
        .select('*')
        .eq('creator_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('獲取用戶角色失敗:', error);
      throw error;
    }
  },

  // 創建新角色
  async createRole(request: CreateRoleRequest): Promise<AIRole> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new AICompanionError('用戶未登入');

      const { data, error } = await supabase
        .from('ai_roles')
        .insert({
          ...request,
          creator_user_id: user.id,
        })
        .select()
        .single();

      if (error) handleSupabaseError(error);
      return data;
    } catch (error) {
      console.error('創建角色失敗:', error);
      throw error;
    }
  },

  // 更新角色
  async updateRole(roleId: string, updates: Partial<AIRole>): Promise<AIRole> {
    try {
      const { data, error } = await supabase
        .from('ai_roles')
        .update(updates)
        .eq('id', roleId)
        .select()
        .single();

      if (error) handleSupabaseError(error);
      return data;
    } catch (error) {
      console.error('更新角色失敗:', error);
      throw error;
    }
  },

  // 刪除角色
  async deleteRole(roleId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_roles')
        .delete()
        .eq('id', roleId);

      if (error) handleSupabaseError(error);
    } catch (error) {
      console.error('刪除角色失敗:', error);
      throw error;
    }
  },

  // 獲取房間內的角色實例
  async getRoomRoleInstances(roomId: string): Promise<RoleInstance[]> {
    try {
      const { data, error } = await supabase
        .from('role_instances')
        .select(`
          *,
          role:ai_roles(*),
          room_roles(display_order, is_active, quick_access)
        `)
        .eq('room_id', roomId)
        .order('created_at');

      if (error) handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('獲取房間角色實例失敗:', error);
      throw error;
    }
  },

  // 在房間中添加角色實例
  async addRoleToRoom(request: CreateRoleInstanceRequest): Promise<RoleInstance> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new AICompanionError('用戶未登入');

      const { data: instance, error: instanceError } = await supabase
        .from('role_instances')
        .insert({
          ...request,
          created_by: user.id,
        })
        .select('*, role:ai_roles(*)')
        .single();

      if (instanceError) handleSupabaseError(instanceError);

      // 添加到房間角色列表
      const { error: roomRoleError } = await supabase
        .from('room_roles')
        .insert({
          room_id: request.room_id,
          role_instance_id: instance.id,
          display_order: 0,
        });

      if (roomRoleError) handleSupabaseError(roomRoleError);

      return instance;
    } catch (error) {
      console.error('添加角色到房間失敗:', error);
      throw error;
    }
  },

  // 更新角色實例
  async updateRoleInstance(instanceId: string, updates: Partial<RoleInstance>): Promise<RoleInstance> {
    try {
      const { data, error } = await supabase
        .from('role_instances')
        .update(updates)
        .eq('id', instanceId)
        .select('*, role:ai_roles(*)')
        .single();

      if (error) handleSupabaseError(error);
      return data;
    } catch (error) {
      console.error('更新角色實例失敗:', error);
      throw error;
    }
  },

  // 從房間移除角色
  async removeRoleFromRoom(instanceId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('role_instances')
        .delete()
        .eq('id', instanceId);

      if (error) handleSupabaseError(error);
    } catch (error) {
      console.error('從房間移除角色失敗:', error);
      throw error;
    }
  },
};

// ========================================
// 訊息管理 API
// ========================================

export const messageAPI = {
  // 獲取房間訊息
  async getRoomMessages(
    roomId: string, 
    limit: number = 50, 
    before?: string
  ): Promise<AIMessage[]> {
    try {
      let query = supabase
        .from('ai_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data, error } = await query;
      if (error) handleSupabaseError(error);
      
      return (data || []).reverse(); // 反轉為時間順序
    } catch (error) {
      console.error('獲取房間訊息失敗:', error);
      throw error;
    }
  },

  // 發送訊息
  async sendMessage(request: SendMessageRequest): Promise<AIMessage> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new AICompanionError('用戶未登入');

      // 生成會話 ID（如果沒有提供）
      const sessionId = request.session_id || crypto.randomUUID();

      const { data, error } = await supabase
        .from('ai_messages')
        .insert({
          room_id: request.room_id,
          session_id: sessionId,
          sender_type: 'user',
          sender_user_id: user.id,
          content: request.content,
          content_json: request.content_json,
          reply_to_id: request.reply_to_id,
          status: 'sent',
        })
        .select('*')
        .single();

      if (error) handleSupabaseError(error);

      // 如果有指定目標角色，創建一個處理中的 AI 回應
      if (request.target_role_instance_id) {
        await supabase
          .from('ai_messages')
          .insert({
            room_id: request.room_id,
            session_id: sessionId,
            sender_type: 'role',
            sender_role_instance_id: request.target_role_instance_id,
            reply_to_id: data?.id,
            status: 'queued',
          });
      }

      return data;
    } catch (error) {
      console.error('發送訊息失敗:', error);
      throw error;
    }
  },

  // 更新訊息
  async updateMessage(messageId: string, updates: Partial<AIMessage>): Promise<AIMessage> {
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .update({
          ...updates,
          is_edited: true,
        })
        .eq('id', messageId)
        .select('*')
        .single();

      if (error) handleSupabaseError(error);
      return data;
    } catch (error) {
      console.error('更新訊息失敗:', error);
      throw error;
    }
  },

  // 刪除訊息
  async deleteMessage(messageId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_messages')
        .delete()
        .eq('id', messageId);

      if (error) handleSupabaseError(error);
    } catch (error) {
      console.error('刪除訊息失敗:', error);
      throw error;
    }
  },

  // 上傳附件
  async uploadAttachment(file: File, roomId: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${roomId}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('message-attachments')
        .upload(fileName, file);

      if (error) handleSupabaseError(error);
      return data?.path || '';
    } catch (error) {
      console.error('上傳附件失敗:', error);
      throw error;
    }
  },
};

// ========================================
// 記憶管理 API
// ========================================

export const memoryAPI = {
  // 創建記憶
  async createMemory(request: CreateMemoryRequest): Promise<MemoryItem> {
    try {
      const { data, error } = await supabase
        .from('memory_items')
        .insert(request)
        .select()
        .single();

      if (error) handleSupabaseError(error);
      return data;
    } catch (error) {
      console.error('創建記憶失敗:', error);
      throw error;
    }
  },

  // 搜尋記憶
  async searchMemory(request: SearchMemoryRequest): Promise<SearchMemoryResult[]> {
    try {
      // 這裡應該調用語義搜尋 API 或使用 embedding 搜尋
      // 暫時使用文字搜尋作為替代
      let query = supabase
        .from('memory_items')
        .select('id, key, value, memory_type')
        .ilike('value', `%${request.query}%`);

      if (request.room_id) {
        query = query.eq('room_id', request.room_id);
      }
      if (request.user_id) {
        query = query.eq('user_id', request.user_id);
      }
      if (request.scope) {
        query = query.eq('scope', request.scope);
      }
      if (request.memory_type) {
        query = query.eq('memory_type', request.memory_type);
      }

      query = query.limit(request.limit || 10);

      const { data, error } = await query;
      if (error) handleSupabaseError(error);

      return (data || []).map(item => ({
        ...item,
        similarity: 0.8, // 模擬相似度分數
      }));
    } catch (error) {
      console.error('搜尋記憶失敗:', error);
      throw error;
    }
  },

  // 獲取記憶列表
  async getMemories(
    scope?: string, 
    roomId?: string, 
    userId?: string,
    limit: number = 50
  ): Promise<MemoryItem[]> {
    try {
      let query = supabase
        .from('memory_items')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (scope) query = query.eq('scope', scope);
      if (roomId) query = query.eq('room_id', roomId);
      if (userId) query = query.eq('user_id', userId);

      const { data, error } = await query;
      if (error) handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('獲取記憶列表失敗:', error);
      throw error;
    }
  },

  // 更新記憶
  async updateMemory(memoryId: string, updates: Partial<MemoryItem>): Promise<MemoryItem> {
    try {
      const { data, error } = await supabase
        .from('memory_items')
        .update(updates)
        .eq('id', memoryId)
        .select()
        .single();

      if (error) handleSupabaseError(error);
      return data;
    } catch (error) {
      console.error('更新記憶失敗:', error);
      throw error;
    }
  },

  // 刪除記憶
  async deleteMemory(memoryId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('memory_items')
        .delete()
        .eq('id', memoryId);

      if (error) handleSupabaseError(error);
    } catch (error) {
      console.error('刪除記憶失敗:', error);
      throw error;
    }
  },
};

// ========================================
// 用量統計 API
// ========================================

export const usageAPI = {
  // 獲取房間用量統計
  async getRoomUsage(roomId: string, days: number = 7): Promise<UsageStats> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('ai_usage')
        .select('*')
        .eq('room_id', roomId)
        .gte('created_at', startDate.toISOString());

      if (error) handleSupabaseError(error);

      // 處理統計資料
      const usage = data || [];
      const totalRequests = usage.length;
      const totalTokens = usage.reduce((sum, u) => sum + (u.total_tokens || 0), 0);
      const totalCost = usage.reduce((sum, u) => sum + (u.cost_usd || 0), 0);
      const avgLatency = usage.reduce((sum, u) => sum + (u.latency_ms || 0), 0) / totalRequests || 0;

      // 按模型統計
      const byModel: Record<string, any> = {};
      usage.forEach(u => {
        const key = `${u.provider}/${u.model}`;
        if (!byModel[key]) {
          byModel[key] = { requests: 0, tokens: 0, cost: 0 };
        }
        byModel[key].requests++;
        byModel[key].tokens += u.total_tokens || 0;
        byModel[key].cost += u.cost_usd || 0;
      });

      // 按日期統計
      const byDate: Record<string, any> = {};
      usage.forEach(u => {
        const date = u.created_at.split('T')[0];
        if (!byDate[date]) {
          byDate[date] = { requests: 0, tokens: 0, cost: 0 };
        }
        byDate[date].requests++;
        byDate[date].tokens += u.total_tokens || 0;
        byDate[date].cost += u.cost_usd || 0;
      });

      return {
        total_requests: totalRequests,
        total_tokens: totalTokens,
        total_cost: totalCost,
        avg_latency: avgLatency,
        by_model: byModel,
        by_date: byDate,
      };
    } catch (error) {
      console.error('獲取用量統計失敗:', error);
      throw error;
    }
  },

  // 獲取用戶用量統計
  async getUserUsage(days: number = 30): Promise<UsageStats> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new AICompanionError('用戶未登入');

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('ai_usage')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      if (error) handleSupabaseError(error);

      // 處理統計資料（類似 getRoomUsage 的邏輯）
      const usage = data || [];
      const totalRequests = usage.length;
      const totalTokens = usage.reduce((sum, u) => sum + (u.total_tokens || 0), 0);
      const totalCost = usage.reduce((sum, u) => sum + (u.cost_usd || 0), 0);
      const avgLatency = usage.reduce((sum, u) => sum + (u.latency_ms || 0), 0) / totalRequests || 0;

      return {
        total_requests: totalRequests,
        total_tokens: totalTokens,
        total_cost: totalCost,
        avg_latency: avgLatency,
        by_model: {},
        by_date: {},
      };
    } catch (error) {
      console.error('獲取用戶用量統計失敗:', error);
      throw error;
    }
  },
};

// ========================================
// 任務管理 API
// ========================================

export const taskAPI = {
  // 創建任務
  async createTask(request: CreateTaskRequest): Promise<AITask> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new AICompanionError('用戶未登入');

      const { data, error } = await supabase
        .from('ai_tasks')
        .insert({
          ...request,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) handleSupabaseError(error);
      return data;
    } catch (error) {
      console.error('創建任務失敗:', error);
      throw error;
    }
  },

  // 獲取房間任務
  async getRoomTasks(roomId: string): Promise<AITask[]> {
    try {
      const { data, error } = await supabase
        .from('ai_tasks')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false });

      if (error) handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('獲取房間任務失敗:', error);
      throw error;
    }
  },

  // 更新任務狀態
  async updateTaskStatus(taskId: string, status: string, progress?: number): Promise<AITask> {
    try {
      const updates: any = { status };
      if (progress !== undefined) updates.progress = progress;
      if (status === 'running' && !updates.started_at) updates.started_at = new Date().toISOString();
      if (['succeeded', 'failed', 'cancelled'].includes(status)) updates.completed_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('ai_tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) handleSupabaseError(error);
      return data;
    } catch (error) {
      console.error('更新任務狀態失敗:', error);
      throw error;
    }
  },
};

// ========================================
// 統計 API
// ========================================

export const statsAPI = {
  // 獲取房間統計
  async getRoomStats(roomId: string): Promise<RoomStatistics> {
    try {
      const { data, error } = await supabase
        .rpc('get_room_statistics', { p_room_id: roomId });

      if (error) handleSupabaseError(error);
      return data || {
        total_messages: 0,
        total_users: 0,
        total_roles: 0,
        total_cost: 0,
        avg_response_time: 0,
      };
    } catch (error) {
      console.error('獲取房間統計失敗:', error);
      throw error;
    }
  },

  // 獲取活躍房間
  async getActiveRooms(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('v_active_rooms')
        .select('*')
        .limit(10);

      if (error) handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('獲取活躍房間失敗:', error);
      throw error;
    }
  },

  // 獲取角色使用統計
  async getRoleUsageStats(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('v_role_usage_stats')
        .select('*')
        .limit(20);

      if (error) handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('獲取角色使用統計失敗:', error);
      throw error;
    }
  },
};

// ========================================
// 即時訂閱 (暫時停用)
// ========================================

export const realtimeAPI = {
  // 訂閱房間訊息 (暫時停用)
  subscribeToRoomMessages(roomId: string, callback: (message: AIMessage) => void) {
    // TODO: 實現即時訂閱
    return null;
  },

  // 訂閱房間角色變更 (暫時停用)
  subscribeToRoomRoles(roomId: string, callback: (roleInstance: RoleInstance) => void) {
    // TODO: 實現即時訂閱
    return null;
  },

  // 取消訂閱
  unsubscribe(subscription: any) {
    // TODO: 實現取消訂閱
    return null;
  },
};

// ========================================
// 導出所有 API
// ========================================

export default {
  room: roomAPI,
  role: roleAPI,
  message: messageAPI,
  memory: memoryAPI,
  usage: usageAPI,
  task: taskAPI,
  stats: statsAPI,
  realtime: realtimeAPI,
};
