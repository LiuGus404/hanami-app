// Hanami 任務管理系統類型定義
// 創建日期: 2024-12-19
// 版本: 1.0.0

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'blocked';
export type TaskPriority = 'urgent_important' | 'important_not_urgent' | 'urgent_not_important' | 'not_urgent_not_important';
export type TaskCategory = 'progress' | 'progress_tracking' | 'video' | 'video_production' | 'photo' | 'photo_processing' | 'learning' | 'learning_related' | 'enroll' | 'registration_processing' | 'course_query' | 'course_inquiry' | 'leave' | 'leave_processing' | 'payment' | 'payment_processing' | 'technical' | 'technical_support' | 'time' | 'schedule_arrangement' | 'life' | 'life_related' | 'complaint' | 'complaint_handling' | 'other';
export type ProjectRole = 'owner' | 'admin' | 'member' | 'observer';

// 任務介面
export interface Task {
  id: string;
  title: string;
  description?: string;
  follow_up_content?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category?: TaskCategory[];
  phone?: string;
  assigned_to?: string[];
  due_date?: string;
  time_block_start?: string;
  time_block_end?: string;
  estimated_duration?: number; // 分鐘
  actual_duration?: number; // 分鐘
  difficulty_level: number; // 1-5
  progress_percentage: number; // 0-100
  is_public: boolean;
  points?: number;
  is_approved?: boolean;
  checklist?: { id: string; text: string; is_checked: boolean }[];
  approved_by?: string;
  approved_at?: string;
  project_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  visible_to_roles?: string[];
}

// 任務模板介面
export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  task_data: Partial<Task>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// 項目介面
export interface Project {
  id: string;
  name: string;
  description?: string;
  is_public: boolean;
  invite_code: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

// 項目成員介面
export interface ProjectMember {
  id: string;
  project_id: string;
  user_id?: string;
  user_phone?: string;
  role: ProjectRole;
  joined_at: string;
}

// 任務評論介面
export interface TaskComment {
  id: string;
  task_id: string;
  user_id?: string;
  user_phone?: string;
  comment: string;
  is_system_message: boolean;
  created_at: string;
}

// 任務附件介面
export interface TaskAttachment {
  id: string;
  task_id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  file_type?: string;
  mime_type?: string;
  uploaded_by?: string;
  uploaded_at: string;
}

// 任務統計介面
export interface TaskStats {
  total_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  completed_tasks: number;
  cancelled_tasks: number;
  blocked_tasks: number;
  urgent_important_tasks: number;
  important_not_urgent_tasks: number;
  urgent_not_important_tasks: number;
  not_urgent_not_important_tasks: number;
  avg_progress: number;
  avg_actual_duration: number;
  leaderboard?: {
    user_name: string;
    points: number;
    rank: number;
    avatar?: string;
  }[];
}

// 用戶任務統計介面
export interface UserTaskStats {
  phone?: string;
  assigned_to?: string[];
  total_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  completed_tasks: number;
  avg_progress: number;
  total_time_spent: number;
}

// 任務完成統計介面
export interface TaskCompletionStats {
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
  avg_progress: number;
  total_time_spent: number;
}

// 創建任務表單介面
export interface CreateTaskForm {
  title: string;
  description?: string;
  follow_up_content?: string;
  priority: TaskPriority;
  category?: TaskCategory[];
  phone?: string;
  assigned_to?: string[];
  due_date?: string;
  time_block_start?: string;
  time_block_end?: string;
  estimated_duration?: number;
  difficulty_level?: number;
  points?: number;
  is_public?: boolean;
  project_id?: string;
  checklist?: { id: string; text: string; is_checked: boolean }[];
  visible_to_roles?: string[];
}

// 更新任務表單介面
export interface UpdateTaskForm {
  title?: string;
  description?: string;
  follow_up_content?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: TaskCategory[];
  phone?: string;
  assigned_to?: string[];
  due_date?: string;
  time_block_start?: string;
  time_block_end?: string;
  estimated_duration?: number;
  actual_duration?: number;
  difficulty_level?: number;
  progress_percentage?: number;
  points?: number;
  is_approved?: boolean;
  approved_by?: string;
  approved_at?: string;
  is_public?: boolean;
  project_id?: string;
  checklist?: { id: string; text: string; is_checked: boolean }[];
  visible_to_roles?: string[];
}

// 創建項目表單介面
export interface CreateProjectForm {
  name: string;
  description?: string;
  is_public?: boolean;
}

// 更新項目表單介面
export interface UpdateProjectForm {
  name?: string;
  description?: string;
  is_public?: boolean;
}

// 項目邀請表單介面
export interface ProjectInviteForm {
  invite_code: string;
  role?: ProjectRole;
}

// 任務篩選介面
export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  category?: TaskCategory[];
  assigned_to?: string[];
  project_id?: string;
  due_date_from?: string;
  due_date_to?: string;
  is_public?: boolean;
  search?: string;
}

// 任務排序選項
export type TaskSortOption = 'priority' | 'due_date' | 'created_at' | 'updated_at' | 'progress' | 'title';

// 任務排序方向
export type TaskSortDirection = 'asc' | 'desc';

// 任務排序介面
export interface TaskSort {
  field: TaskSortOption;
  direction: TaskSortDirection;
}

// 分頁介面
export interface Pagination {
  page: number;
  limit: number;
  total?: number;
  total_pages?: number;
}

// 任務列表響應介面
export interface TaskListResponse {
  tasks: Task[];
  pagination: Pagination;
  stats: TaskStats;
}

// 項目列表響應介面
export interface ProjectListResponse {
  projects: Project[];
  pagination: Pagination;
}

// 優先級配置介面
export interface PriorityConfig {
  value: TaskPriority;
  label: string;
  color: string;
  icon: string;
  description: string;
}

// 狀態配置介面
export interface StatusConfig {
  value: TaskStatus;
  label: string;
  color: string;
  icon: string;
  description: string;
}

// 類別配置介面
export interface CategoryConfig {
  value: TaskCategory;
  label: string;
  color: string;
  icon: string;
  description: string;
}

// 時間塊介面
export interface TimeBlock {
  start: string;
  end: string;
  duration: number; // 分鐘
  is_conflict?: boolean;
  conflict_tasks?: string[];
}

// 日曆事件介面
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  color?: string;
  task?: Task;
  type: 'task' | 'time_block' | 'deadline';
}

// 任務進度更新介面
export interface TaskProgressUpdate {
  task_id: string;
  progress_percentage: number;
  actual_duration?: number;
  status?: TaskStatus;
  comment?: string;
}

// 任務批量操作介面
export interface TaskBatchOperation {
  task_ids: string[];
  operation: 'update_status' | 'update_priority' | 'assign' | 'delete';
  data: any;
}

// 通知介面
export interface TaskNotification {
  id: string;
  type: 'task_assigned' | 'task_due' | 'task_completed' | 'task_comment' | 'project_invite';
  title: string;
  message: string;
  task_id?: string;
  project_id?: string;
  user_phone: string;
  is_read: boolean;
  created_at: string;
}

// 任務活動日誌介面
export interface TaskActivity {
  id: string;
  task_id: string;
  user_phone: string;
  action: 'created' | 'updated' | 'status_changed' | 'assigned' | 'commented' | 'completed';
  description: string;
  metadata?: any;
  created_at: string;
}

// 任務模板介面
export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  category: TaskCategory[];
  priority: TaskPriority;
  estimated_duration?: number;
  difficulty_level: number;
  is_public: boolean;
  created_by?: string;
  created_at: string;
}

// 任務重複設定介面
export interface TaskRecurrence {
  id: string;
  task_id: string;
  pattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  days_of_week?: number[]; // 0-6 (Sunday-Saturday)
  day_of_month?: number;
  end_date?: string;
  max_occurrences?: number;
  is_active: boolean;
}

// 任務依賴關係介面
export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
  created_at: string;
}

// 任務標籤介面
export interface TaskTag {
  id: string;
  name: string;
  color: string;
  description?: string;
  created_at: string;
}

// 任務標籤關聯介面
export interface TaskTagRelation {
  id: string;
  task_id: string;
  tag_id: string;
  created_at: string;
}

// 任務提醒設定介面
export interface TaskReminder {
  id: string;
  task_id: string;
  reminder_time: string;
  reminder_type: 'before_due' | 'at_due' | 'custom';
  is_sent: boolean;
  created_at: string;
}

// 任務搜尋結果介面
export interface TaskSearchResult {
  tasks: Task[];
  total: number;
  query: string;
  filters: TaskFilter;
  sort: TaskSort;
}

// 任務匯出格式
export type TaskExportFormat = 'csv' | 'excel' | 'pdf' | 'json';

// 任務匯出選項
export interface TaskExportOptions {
  format: TaskExportFormat;
  include_comments?: boolean;
  include_attachments?: boolean;
  date_range?: {
    from: string;
    to: string;
  };
  filters?: TaskFilter;
}

// 任務匯入結果
export interface TaskImportResult {
  success_count: number;
  error_count: number;
  errors: Array<{
    row: number;
    message: string;
    data: any;
  }>;
}

// 任務分析報告
export interface TaskAnalytics {
  period: {
    from: string;
    to: string;
  };
  stats: TaskStats;
  completion_trend: Array<{
    date: string;
    completed: number;
    created: number;
  }>;
  priority_distribution: Array<{
    priority: TaskPriority;
    count: number;
    percentage: number;
  }>;
  category_distribution: Array<{
    category: TaskCategory;
    count: number;
    percentage: number;
  }>;
  user_performance: Array<{
    user_phone: string;
    total_tasks: number;
    completed_tasks: number;
    completion_rate: number;
    avg_duration: number;
  }>;
}

// 任務管理系統配置
export interface TaskManagementConfig {
  priorities: PriorityConfig[];
  statuses: StatusConfig[];
  categories: CategoryConfig[];
  default_time_block_duration: number; // 分鐘
  max_file_size: number; // bytes
  allowed_file_types: string[];
  notification_settings: {
    email_enabled: boolean;
    push_enabled: boolean;
    reminder_intervals: number[]; // 分鐘
  };
  features: {
    time_tracking: boolean;
    file_attachments: boolean;
    comments: boolean;
    projects: boolean;
    recurring_tasks: boolean;
    dependencies: boolean;
    tags: boolean;
    analytics: boolean;
  };
}

// 預設配置
export const DEFAULT_PRIORITY_CONFIG: PriorityConfig[] = [
  {
    value: 'urgent_important',
    label: '緊急重要',
    color: '#EF4444',
    icon: '🔥',
    description: '需要立即處理的重要任務'
  },
  {
    value: 'important_not_urgent',
    label: '重要不緊急',
    color: '#F59E0B',
    icon: '⭐',
    description: '重要但可以稍後處理的任務'
  },
  {
    value: 'urgent_not_important',
    label: '緊急不重要',
    color: '#EAB308',
    icon: '⏰',
    description: '緊急但重要性較低的任務'
  },
  {
    value: 'not_urgent_not_important',
    label: '不緊急不重要',
    color: '#6B7280',
    icon: '⚪',
    description: '可以延後處理的任務'
  }
];

export const DEFAULT_STATUS_CONFIG: StatusConfig[] = [
  {
    value: 'pending',
    label: '等待中',
    color: '#E5E7EB',
    icon: 'pending',
    description: '任務已創建，等待開始'
  },
  {
    value: 'in_progress',
    label: '進行中',
    color: '#FEF3C7',
    icon: 'in_progress',
    description: '任務正在進行中'
  },
  {
    value: 'completed',
    label: '已完成',
    color: '#D1FAE5',
    icon: 'completed',
    description: '任務已完成'
  },
  {
    value: 'cancelled',
    label: '已取消',
    color: '#FEE2E2',
    icon: 'cancelled',
    description: '任務已取消'
  },
  {
    value: 'blocked',
    label: '被阻擋',
    color: '#DBEAFE',
    icon: 'blocked',
    description: '任務被阻擋，無法繼續'
  }
];

export const DEFAULT_CATEGORY_CONFIG: CategoryConfig[] = [
  {
    value: 'progress_tracking',
    label: '進度追蹤',
    color: '#3B82F6',
    icon: 'progress',
    description: '學生學習進度相關任務'
  },
  {
    value: 'video_production',
    label: '影片製作',
    color: '#8B5CF6',
    icon: 'video',
    description: '影片錄製和編輯任務'
  },
  {
    value: 'photo_processing',
    label: '照片處理',
    color: '#EC4899',
    icon: 'photo',
    description: '照片拍攝和處理任務'
  },
  {
    value: 'learning_related',
    label: '學習相關',
    color: '#10B981',
    icon: 'learning',
    description: '學習材料和課程相關任務'
  },
  {
    value: 'registration_processing',
    label: '報名處理',
    color: '#F59E0B',
    icon: 'registration',
    description: '學生報名和註冊任務'
  },
  {
    value: 'course_inquiry',
    label: '課程查詢',
    color: '#06B6D4',
    icon: 'inquiry',
    description: '課程相關查詢和回覆'
  },
  {
    value: 'leave_processing',
    label: '請假處理',
    color: '#84CC16',
    icon: 'leave',
    description: '學生請假和調課任務'
  },
  {
    value: 'payment_processing',
    label: '付款處理',
    color: '#EF4444',
    icon: 'payment',
    description: '學費和付款相關任務'
  },
  {
    value: 'technical_support',
    label: '技術支援',
    color: '#6B7280',
    icon: 'support',
    description: '技術問題和系統維護'
  },
  {
    value: 'schedule_arrangement',
    label: '時間安排',
    color: '#F97316',
    icon: 'schedule',
    description: '課程時間和排程任務'
  },
  {
    value: 'life_related',
    label: '生活相關',
    color: '#14B8A6',
    icon: 'life',
    description: '日常生活和個人事務'
  },
  {
    value: 'complaint_handling',
    label: '投訴處理',
    color: '#DC2626',
    icon: 'complaint',
    description: '客戶投訴和問題解決'
  },
  {
    value: 'other',
    label: '其他',
    color: '#9CA3AF',
    icon: 'other',
    description: '其他未分類任務'
  }
];

export const DEFAULT_TASK_MANAGEMENT_CONFIG: TaskManagementConfig = {
  priorities: DEFAULT_PRIORITY_CONFIG,
  statuses: DEFAULT_STATUS_CONFIG,
  categories: DEFAULT_CATEGORY_CONFIG,
  default_time_block_duration: 60, // 60 分鐘
  max_file_size: 10 * 1024 * 1024, // 10MB
  allowed_file_types: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'mp4', 'mov', 'avi'],
  notification_settings: {
    email_enabled: true,
    push_enabled: true,
    reminder_intervals: [15, 30, 60, 120, 1440] // 15分鐘, 30分鐘, 1小時, 2小時, 1天
  },
  features: {
    time_tracking: true,
    file_attachments: true,
    comments: true,
    projects: true,
    recurring_tasks: true,
    dependencies: true,
    tags: true,
    analytics: true
  }
};
