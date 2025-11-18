// HanamiEcho 型別定義 - 基於實際 SAAS 表結構

// 核心用戶型別 - 對應 saas_users 表
export interface SaasUser {
  id: string;
  email: string;
  phone?: string;
  full_name: string;
  avatar_url?: string;
  subscription_status: string;
  subscription_plan_id?: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  usage_count: number;
  usage_limit: number;
  is_verified: boolean;
  verification_method: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
  user_role?: string;
  // HanamiEcho 擴展欄位
  user_type?: 'child' | 'adult';
  age_group?: string;
  preferences?: UserPreferences;
  family_group_id?: string;
  timezone?: string;
  language?: string;
  notification_settings?: NotificationSettings;
  privacy_settings?: PrivacySettings;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  ui_mode: 'children' | 'adults';
  learning_style: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  work_style: 'focused' | 'collaborative' | 'flexible';
  interests: string[];
  goals: string[];
}

export interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  learning_reminders: boolean;
  work_reminders: boolean;
  family_updates: boolean;
  quiet_hours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export interface PrivacySettings {
  profile_visibility: 'private' | 'family' | 'public';
  learning_progress_sharing: boolean;
  work_activity_sharing: boolean;
  memory_sharing: 'private' | 'family' | 'shared';
  analytics_consent: boolean;
}

// AI 角色相關型別 - 對應 saas_3d_characters 表
export interface AICharacter {
  id: string;
  name: string;
  type: 'child_companion' | 'adult_assistant' | 'family_coordinator' | 'learning_tutor' | 'work_assistant';
  target_audience: 'children' | 'adults' | 'family' | 'all';
  personality_config: PersonalityConfig;
  appearance_config: AppearanceConfig;
  capabilities: CharacterCapabilities;
  workspace_config: WorkspaceConfig;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PersonalityConfig {
  traits: string[];
  communication_style: 'playful' | 'professional' | 'caring' | 'encouraging' | 'efficient';
  expertise_areas: string[];
}

export interface AppearanceConfig {
  model_path: string;
  animations: string[];
  customization_options: CustomizationOptions;
}

export interface CustomizationOptions {
  colors: string[];
  accessories: string[];
}

export interface CharacterCapabilities {
  learning_support: boolean;
  work_assistance: boolean;
  emotional_support: boolean;
  task_automation: boolean;
  family_coordination: boolean;
}

export interface WorkspaceConfig {
  learning_environment: boolean;
  work_environment: boolean;
  family_environment: boolean;
}

// 用戶 AI 角色關聯 - 對應 saas_user_characters 表
export interface UserAICharacter {
  id: string;
  user_id: string;
  character_id: string;
  is_primary: boolean;
  customization?: Record<string, any>;
  created_at: string;
}

// 學習相關型別 - 對應 saas_learning_paths 表
export interface LearningPath {
  id: string;
  name: string;
  description?: string;
  target_audience: 'children' | 'adults' | 'family';
  category: 'academic' | 'skill' | 'hobby' | 'professional' | 'life_skill';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration?: number;
  learning_objectives?: string[];
  modules: LearningModule[];
  ai_character_support?: string[];
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface LearningModule {
  id: string;
  name: string;
  type: 'interactive' | 'video' | 'game' | 'assessment' | 'project';
  content: ModuleContent;
  estimated_duration: number;
  prerequisites?: string[];
  learning_objectives: string[];
}

export interface ModuleContent {
  materials: ContentMaterial[];
  activities: Activity[];
  assessments: Assessment[];
}

export interface ContentMaterial {
  type: 'text' | 'image' | 'video' | 'audio' | 'document';
  title: string;
  url: string;
  description?: string;
}

export interface Activity {
  id: string;
  name: string;
  type: 'quiz' | 'exercise' | 'game' | 'discussion' | 'project';
  instructions: string;
  expected_duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Assessment {
  id: string;
  name: string;
  type: 'quiz' | 'assignment' | 'project' | 'presentation';
  questions: AssessmentQuestion[];
  passing_score: number;
  time_limit?: number;
}

export interface AssessmentQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  question: string;
  options?: string[];
  correct_answer?: string;
  points: number;
}

// 學習進度 - 對應 saas_user_learning_paths 表
export interface LearningProgress {
  id: string;
  user_id: string;
  learning_path_id: string;
  module_id: string;
  progress_percentage: number;
  completed_at?: string;
  ai_character_guidance?: Record<string, any>;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// 工作助手相關型別 - 對應 saas_work_tasks 表
export interface WorkTask {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: 'productivity' | 'communication' | 'analysis' | 'automation' | 'collaboration';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_ai_character?: string;
  due_date?: string;
  estimated_duration?: number;
  actual_duration?: number;
  dependencies?: string[];
  automation_rules?: AutomationRule[];
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  is_active: boolean;
}

export interface WorkProject {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  progress_percentage: number;
  team_members?: TeamMember[];
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  user_id: string;
  role: string;
  permissions: string[];
}

// 記憶庫相關型別 - 對應 saas_personal_memories 表
export interface Memory {
  id: string;
  user_id: string;
  memory_type: 'personal' | 'family' | 'learning' | 'work' | 'emotional' | 'achievement';
  content: MemoryContent;
  participants?: string[];
  privacy_level: 'private' | 'family' | 'shared';
  ai_character_contributions?: CharacterContribution[];
  tags?: string[];
  importance_level: 'low' | 'medium' | 'high';
  created_at: string;
  last_accessed: string;
}

export interface MemoryContent {
  title: string;
  description: string;
  media_files?: MediaFile[];
  emotional_context?: EmotionalState;
  learning_context?: LearningContext;
  work_context?: WorkContext;
}

export interface MediaFile {
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  thumbnail_url?: string;
  filename: string;
  size: number;
  duration?: number;
}

export interface EmotionalState {
  mood: 'happy' | 'sad' | 'excited' | 'anxious' | 'calm' | 'frustrated';
  intensity: number; // 1-10
  notes?: string;
}

export interface LearningContext {
  subject: string;
  skill_level: 'beginner' | 'intermediate' | 'advanced';
  progress: number;
  challenges?: string[];
  achievements?: string[];
}

export interface WorkContext {
  project: string;
  role: string;
  productivity_score: number;
  challenges?: string[];
  achievements?: string[];
}

export interface CharacterContribution {
  character_id: string;
  contribution_type: 'guidance' | 'encouragement' | 'feedback' | 'celebration';
  content: string;
  timestamp: string;
}

export interface MemoryTag {
  id: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  created_at: string;
}

// 家庭協作相關型別 - 對應 saas_family_groups 表
export interface FamilyGroup {
  id: string;
  name: string;
  description?: string;
  members: FamilyMember[];
  shared_resources?: SharedResource[];
  privacy_settings?: FamilyPrivacySettings;
  communication_preferences?: CommunicationPreferences;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  user_id: string;
  role: 'parent' | 'child' | 'guardian';
  permissions: string[];
  joined_at: string;
}

export interface SharedResource {
  type: 'learning_path' | 'work_project' | 'memory' | 'ai_character';
  resource_id: string;
  shared_by: string;
  shared_at: string;
  permissions: string[];
}

export interface FamilyPrivacySettings {
  member_visibility: 'all' | 'parents_only' | 'custom';
  activity_sharing: boolean;
  progress_sharing: boolean;
  memory_sharing: 'private' | 'family' | 'shared';
}

export interface CommunicationPreferences {
  notifications: boolean;
  daily_summary: boolean;
  weekly_report: boolean;
  achievement_celebrations: boolean;
}

export interface FamilyActivity {
  id: string;
  family_group_id: string;
  name: string;
  description?: string;
  activity_type: 'learning' | 'work' | 'recreation' | 'celebration';
  scheduled_date?: string;
  participants?: ActivityParticipant[];
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityParticipant {
  user_id: string;
  role: string;
  status: 'invited' | 'accepted' | 'declined' | 'completed';
}

// 訂閱相關型別 - 對應 saas_subscription_plans 表
export interface SubscriptionPlan {
  id: string;
  name: string;
  type: 'free' | 'basic' | 'premium' | 'family';
  price_monthly: number;
  price_yearly: number;
  currency: string;
  features: PlanFeatures;
  limits: PlanLimits;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanFeatures {
  ai_characters: number;
  learning_paths: number;
  memory_storage: number; // MB
  family_members: number;
  priority_support: boolean;
  advanced_analytics: boolean;
}

export interface PlanLimits {
  daily_interactions: number;
  storage_quota: number; // bytes
  api_calls: number;
}

// 用戶訂閱 - 對應 saas_user_subscriptions 表
export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  current_period_start?: string;
  current_period_end?: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

// 互動與分析相關型別 - 對應 saas_character_interactions 表
export interface CharacterInteraction {
  id: string;
  character_id: string;
  user_id: string;
  interaction_type: 'conversation' | 'learning' | 'work' | 'emotional_support' | 'task_assistance';
  content: InteractionContent;
  context?: InteractionContext;
  sentiment_score?: number;
  satisfaction_rating?: number;
  timestamp: string;
}

export interface InteractionContent {
  user_input: string;
  character_response: string;
  media_files?: MediaFile[];
}

export interface InteractionContext {
  session_id: string;
  previous_interactions?: string[];
  user_emotion?: EmotionalState;
  learning_context?: LearningContext;
  work_context?: WorkContext;
}

// 用戶分析 - 對應 saas_user_analytics 表
export interface UserAnalytics {
  id: string;
  user_id: string;
  event_type: string;
  event_data?: Record<string, any>;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

// API 響應型別
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: PaginationInfo;
    timestamp: string;
    request_id: string;
  };
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// 表單型別
export interface CreateUserForm {
  email: string;
  password: string;
  full_name: string;
  user_type: 'child' | 'adult';
  age_group?: string;
}

export interface UpdateUserForm {
  full_name?: string;
  preferences?: UserPreferences;
  notification_settings?: NotificationSettings;
  privacy_settings?: PrivacySettings;
  avatar_url?: string;
  timezone?: string;
  language?: string;
}

export interface CreateLearningPathForm {
  name: string;
  description?: string;
  target_audience: 'children' | 'adults' | 'family';
  category: 'academic' | 'skill' | 'hobby' | 'professional' | 'life_skill';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration?: number;
  learning_objectives?: string[];
  modules: Omit<LearningModule, 'id'>[];
}

export interface CreateWorkTaskForm {
  title: string;
  description?: string;
  category: 'productivity' | 'communication' | 'analysis' | 'automation' | 'collaboration';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_ai_character?: string;
  due_date?: string;
  estimated_duration?: number;
  tags?: string[];
}

export interface CreateMemoryForm {
  memory_type: 'personal' | 'family' | 'learning' | 'work' | 'emotional' | 'achievement';
  content: Omit<MemoryContent, 'media_files'>;
  participants?: string[];
  privacy_level: 'private' | 'family' | 'shared';
  tags?: string[];
  importance_level: 'low' | 'medium' | 'high';
}

// 搜索和過濾型別
export interface SearchFilters {
  query?: string;
  type?: string;
  category?: string;
  date_range?: {
    start: string;
    end: string;
  };
  tags?: string[];
  privacy_level?: string;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// 統計和報告型別
export interface UserStats {
  total_learning_time: number;
  completed_learning_paths: number;
  completed_work_tasks: number;
  total_memories: number;
  ai_character_interactions: number;
  productivity_score: number;
  learning_progress: number;
}

export interface FamilyStats {
  total_members: number;
  shared_activities: number;
  family_memories: number;
  collaborative_learning_sessions: number;
  average_engagement: number;
}

export interface SystemStats {
  total_users: number;
  active_users: number;
  total_learning_paths: number;
  total_work_tasks: number;
  total_memories: number;
  ai_character_interactions: number;
  system_uptime: number;
}

// ===== 基於實際 SAAS 表的額外型別定義 =====

// 情感支持系統 - 對應 saas_emotional_support 表
export interface EmotionalSupport {
  id: string;
  user_id: string;
  character_id: string;
  support_type: 'encouragement' | 'motivation' | 'comfort' | 'celebration' | 'guidance';
  content: string;
  emotional_context: EmotionalState;
  response_rating?: number;
  created_at: string;
}

// 故事系統 - 對應 saas_stories 表
export interface Story {
  id: string;
  title: string;
  content: string;
  story_type: 'educational' | 'entertainment' | 'inspirational' | 'interactive';
  target_audience: 'children' | 'adults' | 'family' | 'all';
  age_rating: 'all' | '6+' | '12+' | '16+' | '18+';
  tags: string[];
  media_files?: MediaFile[];
  ai_character_narration?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// 故事進度 - 對應 saas_story_progress 表
export interface StoryProgress {
  id: string;
  user_id: string;
  story_id: string;
  progress_percentage: number;
  current_chapter?: string;
  completed_at?: string;
  user_rating?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// 使用統計 - 對應 saas_usage_statistics 表
export interface UsageStatistics {
  id: string;
  user_id: string;
  date: string;
  learning_time: number; // 分鐘
  work_time: number; // 分鐘
  ai_interactions: number;
  stories_read: number;
  memories_created: number;
  tasks_completed: number;
  productivity_score: number;
  engagement_score: number;
  created_at: string;
}

// 系統配置 - 對應 saas_system_config 表
export interface SystemConfig {
  id: string;
  config_key: string;
  config_value: string;
  config_type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 通知系統 - 對應 saas_notifications 表
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: 'learning_reminder' | 'work_reminder' | 'achievement' | 'family_update' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_read: boolean;
  action_url?: string;
  metadata?: Record<string, any>;
  scheduled_at?: string;
  created_at: string;
}

// 文件管理 - 對應 saas_documents 表
export interface Document {
  id: string;
  user_id: string;
  title: string;
  content: string;
  document_type: 'note' | 'report' | 'template' | 'resource' | 'personal';
  category?: string;
  tags: string[];
  file_path?: string;
  file_size?: number;
  mime_type?: string;
  is_public: boolean;
  shared_with?: string[];
  version: number;
  created_at: string;
  updated_at: string;
}

// 標籤系統 - 對應 saas_tags 表
export interface Tag {
  id: string;
  name: string;
  description?: string;
  color: string;
  category: 'learning' | 'work' | 'personal' | 'family' | 'system';
  usage_count: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// 標籤關聯 - 對應 saas_tag_relations 表
export interface TagRelation {
  id: string;
  tag_id: string;
  resource_type: 'learning_path' | 'work_task' | 'memory' | 'story' | 'document';
  resource_id: string;
  created_at: string;
}

// 用戶偏好 - 對應 saas_user_preferences 表
export interface UserPreference {
  id: string;
  user_id: string;
  preference_key: string;
  preference_value: string;
  preference_type: 'string' | 'number' | 'boolean' | 'json';
  category: 'ui' | 'learning' | 'work' | 'notification' | 'privacy';
  created_at: string;
  updated_at: string;
}

// 會話管理 - 對應 saas_user_sessions 表
export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  device_info?: string;
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
  last_activity: string;
  expires_at: string;
  created_at: string;
}

// 審計日誌 - 對應 saas_audit_logs 表
export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

// API 端點配置 - 對應 saas_api_endpoints 表
export interface APIEndpoint {
  id: string;
  endpoint_path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description?: string;
  rate_limit?: number;
  requires_auth: boolean;
  required_permissions?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 錯誤日誌 - 對應 saas_error_logs 表
export interface ErrorLog {
  id: string;
  user_id?: string;
  error_type: string;
  error_message: string;
  stack_trace?: string;
  request_data?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
}
