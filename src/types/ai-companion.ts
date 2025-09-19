// ========================================
// Hanami AI 伙伴系統 - TypeScript 型別定義
// ========================================
// 版本: 1.0
// 建立日期: 2025-01-17

// ========================================
// 基礎型別
// ========================================

export type SenderType = 'user' | 'role' | 'system';
export type MemoryScope = 'global' | 'role' | 'user' | 'room' | 'session' | 'task';
export type TaskStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
export type RoleStatus = 'active' | 'inactive' | 'archived';
export type RoomMemberRole = 'owner' | 'admin' | 'member' | 'observer';
export type MessageStatus = 'queued' | 'processing' | 'sent' | 'error' | 'cancelled';
export type MemoryType = 'fact' | 'preference' | 'skill' | 'constraint' | 'context' | 'relationship';
export type RelationType = 'related' | 'conflicts' | 'updates' | 'derives_from';

// ========================================
// 房間相關型別
// ========================================

export interface AIRoom {
  id: string;
  title: string;
  description?: string;
  room_type: 'chat' | 'project' | 'research' | 'creative';
  settings: Record<string, any>;
  created_by?: string;
  last_message_at: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoomMember {
  room_id: string;
  user_id: string;
  role: RoomMemberRole;
  permissions: Record<string, any>;
  joined_at: string;
  last_active_at: string;
}

export interface CreateRoomRequest {
  title: string;
  description?: string;
  room_type?: 'chat' | 'project' | 'research' | 'creative';
  settings?: Record<string, any>;
}

// ========================================
// AI 角色相關型別
// ========================================

export interface AIRole {
  id: string;
  name: string;
  slug: string;
  description?: string;
  avatar_url?: string;
  category: string;
  
  // AI 配置
  default_model: string;
  system_prompt: string;
  temperature: number;
  max_tokens: number;
  
  // 工具與能力
  tools: string[];
  capabilities: Record<string, any>;
  
  // 定價覆寫
  pricing_override?: Record<string, any>;
  
  // 權限與狀態
  creator_user_id?: string;
  is_public: boolean;
  status: RoleStatus;
  version: number;
  
  // 統計
  usage_count: number;
  rating: number;
  
  created_at: string;
  updated_at: string;
}

export interface RoleInstance {
  id: string;
  room_id: string;
  role_id: string;
  
  // 實例化配置
  nickname?: string;
  model_override?: string;
  system_prompt_override?: string;
  temperature_override?: number;
  max_tokens_override?: number;
  
  // 實例設定
  settings: Record<string, any>;
  context_window: number;
  
  // 狀態
  is_active: boolean;
  last_used_at?: string;
  
  // 權限
  created_by?: string;
  
  created_at: string;
  updated_at: string;
  
  // 關聯資料
  role?: AIRole;
}

export interface RoomRole {
  room_id: string;
  role_instance_id: string;
  display_order: number;
  is_active: boolean;
  quick_access: boolean;
}

export interface CreateRoleRequest {
  name: string;
  slug: string;
  description?: string;
  avatar_url?: string;
  category?: string;
  system_prompt: string;
  default_model?: string;
  temperature?: number;
  max_tokens?: number;
  tools?: string[];
  capabilities?: Record<string, any>;
  is_public?: boolean;
}

export interface CreateRoleInstanceRequest {
  room_id: string;
  role_id: string;
  nickname?: string;
  model_override?: string;
  system_prompt_override?: string;
  temperature_override?: number;
  max_tokens_override?: number;
  settings?: Record<string, any>;
}

// ========================================
// 訊息相關型別
// ========================================

export interface AIMessage {
  id: string;
  room_id: string;
  session_id?: string;
  
  // 發送者資訊
  sender_type: SenderType;
  sender_user_id?: string;
  sender_role_instance_id?: string;
  
  // 訊息內容
  content?: string;
  content_json?: Record<string, any>;
  attachments: MessageAttachment[];
  
  // 回覆關係
  reply_to_id?: string;
  thread_id?: string;
  
  // AI 相關
  model_used?: string;
  tool_calls?: Record<string, any>;
  processing_time_ms?: number;
  
  // 狀態
  status: MessageStatus;
  error_message?: string;
  
  // 互動統計
  reactions: Record<string, any>;
  is_pinned: boolean;
  is_edited: boolean;
  
  created_at: string;
  updated_at: string;
  
  // 關聯資料
  sender_user?: {
    id: string;
    name?: string;
    avatar_url?: string;
  };
  sender_role_instance?: RoleInstance;
  reply_to?: AIMessage;
}

export interface MessageAttachment {
  id: string;
  room_id: string;
  message_id: string;
  
  // 檔案資訊
  storage_path: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  
  // 處理狀態
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  extracted_text?: string;
  metadata: Record<string, any>;
  
  created_by?: string;
  created_at: string;
}

export interface SendMessageRequest {
  room_id: string;
  session_id?: string;
  content?: string;
  content_json?: Record<string, any>;
  attachments?: File[];
  reply_to_id?: string;
  target_role_instance_id?: string; // 指定特定角色回應
}

// ========================================
// 記憶系統型別
// ========================================

export interface MemoryItem {
  id: string;
  
  // 記憶範圍
  scope: MemoryScope;
  role_id?: string;
  role_instance_id?: string;
  user_id?: string;
  room_id?: string;
  session_id?: string;
  task_id?: string;
  
  // 記憶內容
  key?: string;
  value: string;
  value_json?: Record<string, any>;
  
  // 記憶類型與屬性
  memory_type: MemoryType;
  importance: number; // 0.0-1.0
  confidence: number; // 0.0-1.0
  
  // 來源追蹤
  source: Record<string, any>;
  
  // 語義搜尋
  embedding?: number[];
  
  // 生命週期
  ttl_days?: number;
  expires_at?: string;
  access_count: number;
  last_accessed_at?: string;
  
  created_at: string;
  updated_at: string;
}

export interface MemoryRelation {
  id: string;
  from_memory_id: string;
  to_memory_id: string;
  relation_type: RelationType;
  strength: number;
  created_at: string;
}

export interface CreateMemoryRequest {
  scope: MemoryScope;
  role_id?: string;
  role_instance_id?: string;
  user_id?: string;
  room_id?: string;
  session_id?: string;
  key?: string;
  value: string;
  value_json?: Record<string, any>;
  memory_type?: MemoryType;
  importance?: number;
  confidence?: number;
  source?: Record<string, any>;
  ttl_days?: number;
}

export interface SearchMemoryRequest {
  query: string;
  room_id?: string;
  user_id?: string;
  scope?: MemoryScope;
  memory_type?: MemoryType;
  limit?: number;
  similarity_threshold?: number;
}

export interface SearchMemoryResult {
  id: string;
  key?: string;
  value: string;
  memory_type: MemoryType;
  similarity: number;
}

// ========================================
// 計費系統型別
// ========================================

export interface ModelPricing {
  provider: string;
  model: string;
  unit: string;
  input_price_usd: number;
  output_price_usd: number;
  image_price_usd?: number;
  audio_price_usd?: number;
  
  // 限制與配置
  max_tokens?: number;
  context_window?: number;
  supports_tools: boolean;
  supports_vision: boolean;
  supports_audio: boolean;
  
  metadata: Record<string, any>;
  is_active: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface AIUsage {
  id: string;
  
  // 關聯資訊
  room_id: string;
  session_id?: string;
  message_id?: string;
  role_instance_id?: string;
  user_id?: string;
  
  // 模型資訊
  provider: string;
  model: string;
  
  // 用量統計
  input_tokens: number;
  output_tokens: number;
  image_count: number;
  audio_seconds: number;
  total_tokens: number;
  
  // 性能指標
  latency_ms?: number;
  first_token_ms?: number;
  
  // 成本計算
  cost_usd?: number;
  pricing_snapshot?: ModelPricing;
  
  // 請求詳情
  request_data?: Record<string, any>;
  response_data?: Record<string, any>;
  
  created_at: string;
}

export interface UsageStats {
  total_requests: number;
  total_tokens: number;
  total_cost: number;
  avg_latency: number;
  by_model: Record<string, {
    requests: number;
    tokens: number;
    cost: number;
  }>;
  by_date: Record<string, {
    requests: number;
    tokens: number;
    cost: number;
  }>;
}

// ========================================
// 任務系統型別
// ========================================

export interface AITask {
  id: string;
  room_id: string;
  
  // 任務基本資訊
  title: string;
  description?: string;
  task_type: string;
  
  // 任務配置
  workflow: Record<string, any>;
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  
  // 狀態管理
  status: TaskStatus;
  progress: number;
  
  // 參與角色
  assigned_roles: string[];
  current_role_id?: string;
  
  // 時間追蹤
  started_at?: string;
  completed_at?: string;
  estimated_duration?: number;
  
  // 錯誤處理
  error_message?: string;
  retry_count: number;
  max_retries: number;
  
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskStep {
  id: string;
  task_id: string;
  
  // 步驟資訊
  step_name: string;
  step_order: number;
  role_instance_id?: string;
  
  // 步驟配置
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  prompt_template?: string;
  
  // 狀態
  status: TaskStatus;
  started_at?: string;
  completed_at?: string;
  
  // 關聯訊息
  message_id?: string;
  
  created_at: string;
}

export interface CreateTaskRequest {
  room_id: string;
  title: string;
  description?: string;
  task_type?: string;
  workflow: Record<string, any>;
  input_data?: Record<string, any>;
  assigned_roles?: string[];
  estimated_duration?: number;
}

// ========================================
// 統計與分析型別
// ========================================

export interface RoomStatistics {
  total_messages: number;
  total_users: number;
  total_roles: number;
  total_cost: number;
  avg_response_time: number;
}

export interface DailyUsageStats {
  usage_date: string;
  room_id: string;
  provider: string;
  model: string;
  role_name?: string;
  request_count: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost: number;
  avg_latency_ms: number;
}

export interface ActiveRoom {
  id: string;
  title: string;
  room_type: string;
  member_count: number;
  role_count: number;
  message_count: number;
  last_message_at: string;
  created_at: string;
}

export interface RoleUsageStats {
  id: string;
  name: string;
  slug: string;
  category: string;
  instance_count: number;
  usage_count: number;
  total_cost: number;
  avg_latency: number;
  rating: number;
  created_at: string;
}

// ========================================
// API 回應型別
// ========================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// ========================================
// 前端狀態型別
// ========================================

export interface ChatSession {
  id: string;
  room_id: string;
  messages: AIMessage[];
  active_roles: RoleInstance[];
  is_loading: boolean;
  error?: string;
}

export interface RoleEditor {
  role?: AIRole;
  is_editing: boolean;
  is_saving: boolean;
  errors: Record<string, string>;
}

export interface MemoryManager {
  memories: MemoryItem[];
  search_results: SearchMemoryResult[];
  is_searching: boolean;
  search_query: string;
}

// ========================================
// 事件型別
// ========================================

export interface MessageEvent {
  type: 'message_created' | 'message_updated' | 'message_deleted';
  message: AIMessage;
  room_id: string;
}

export interface RoleEvent {
  type: 'role_added' | 'role_removed' | 'role_updated';
  role_instance: RoleInstance;
  room_id: string;
}

export interface TaskEvent {
  type: 'task_created' | 'task_updated' | 'task_completed' | 'task_failed';
  task: AITask;
  room_id: string;
}

// ========================================
// Hook 相關型別
// ========================================

export interface UseAIRoomOptions {
  room_id: string;
  auto_load?: boolean;
  real_time?: boolean;
}

export interface UseAIRoomReturn {
  room: AIRoom | null;
  members: RoomMember[];
  roles: RoleInstance[];
  messages: AIMessage[];
  is_loading: boolean;
  error: string | null;
  sendMessage: (request: SendMessageRequest) => Promise<void>;
  addRole: (request: CreateRoleInstanceRequest) => Promise<void>;
  removeRole: (role_instance_id: string) => Promise<void>;
  updateRoom: (updates: Partial<AIRoom>) => Promise<void>;
}

export interface UseAIRolesOptions {
  category?: string;
  is_public?: boolean;
  creator_user_id?: string;
}

export interface UseAIRolesReturn {
  roles: AIRole[];
  is_loading: boolean;
  error: string | null;
  createRole: (request: CreateRoleRequest) => Promise<AIRole>;
  updateRole: (id: string, updates: Partial<AIRole>) => Promise<AIRole>;
  deleteRole: (id: string) => Promise<void>;
}

export interface UseMemoryOptions {
  room_id?: string;
  user_id?: string;
  scope?: MemoryScope;
}

export interface UseMemoryReturn {
  memories: MemoryItem[];
  is_loading: boolean;
  error: string | null;
  createMemory: (request: CreateMemoryRequest) => Promise<MemoryItem>;
  searchMemory: (request: SearchMemoryRequest) => Promise<SearchMemoryResult[]>;
  updateMemory: (id: string, updates: Partial<MemoryItem>) => Promise<MemoryItem>;
  deleteMemory: (id: string) => Promise<void>;
}

// ========================================
// 組件 Props 型別
// ========================================

export interface AIRoomListProps {
  rooms: ActiveRoom[];
  onRoomSelect: (room_id: string) => void;
  onRoomCreate: () => void;
  selected_room_id?: string;
}

export interface AIMessageListProps {
  messages: AIMessage[];
  is_loading?: boolean;
  onMessageReply?: (message: AIMessage) => void;
  onMessageEdit?: (message: AIMessage) => void;
  onMessageDelete?: (message_id: string) => void;
}

export interface RoleInstanceCardProps {
  role_instance: RoleInstance;
  is_active?: boolean;
  onToggleActive?: (role_instance_id: string) => void;
  onEdit?: (role_instance: RoleInstance) => void;
  onRemove?: (role_instance_id: string) => void;
}

export interface MemoryItemProps {
  memory: MemoryItem;
  onEdit?: (memory: MemoryItem) => void;
  onDelete?: (memory_id: string) => void;
  show_scope?: boolean;
}

export interface UsageStatsProps {
  stats: UsageStats;
  time_range?: 'day' | 'week' | 'month' | 'year';
  onTimeRangeChange?: (range: string) => void;
}

// ========================================
// 工具型別
// ========================================

export interface AITool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  required?: string[];
}

export interface ToolCall {
  id: string;
  tool: string;
  parameters: Record<string, any>;
  result?: any;
  error?: string;
}

// ========================================
// 配置型別
// ========================================

export interface AICompanionConfig {
  default_model: string;
  max_context_length: number;
  memory_retention_days: number;
  max_roles_per_room: number;
  supported_file_types: string[];
  max_file_size_mb: number;
  embedding_model: string;
  webhook_endpoints: {
    message_processing: string;
    task_execution: string;
    memory_indexing: string;
  };
}

export default {
  // 導出所有型別供其他模組使用
};
