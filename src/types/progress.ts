// 學生進度系統型別定義

export interface GrowthTree {
  id: string;
  tree_name: string;
  tree_description?: string;
  tree_icon?: string;
  course_type_id?: string; // 修正：使用 course_type_id 與資料庫一致
  course_type?: string; // 保留用於顯示
  tree_level?: number;
  difficulty_level?: number;
  is_active: boolean;
  created_at: string;
}

export interface GrowthGoal {
  id: string;
  tree_id: string;
  goal_name: string;
  goal_description?: string;
  goal_icon?: string;
  goal_order: number;
  is_completed: boolean;
  created_at: string;
  progress_contents?: string[];
  required_abilities?: string[];
  related_activities?: string[]; // 關聯的活動ID列表
}

// 新增：成長樹活動關聯型別（基於現有表結構）
export interface TreeActivity {
  id: string;
  tree_id: string;
  activity_id?: string; // 關聯到 hanami_teaching_activities
  goal_id?: string; // 關聯到 hanami_growth_goals
  activity_source: 'teaching' | 'custom' | 'template'; // 活動來源
  custom_activity_name?: string; // 自訂活動名稱
  custom_activity_description?: string; // 自訂活動描述
  activity_type: 'custom' | 'teaching' | 'assessment' | 'practice';
  difficulty_level: number; // 1-5
  estimated_duration?: number; // 分鐘
  materials_needed: string[];
  instructions?: string;
  learning_objectives: string[];
  target_abilities: string[];
  prerequisites: string[];
  priority_order: number; // 現有欄位
  activity_order: number; // 新增欄位
  is_required: boolean;
  is_active: boolean;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at?: string;
  // 關聯查詢結果
  hanami_teaching_activities?: {
    id: string;
    activity_name: string;
    activity_description?: string;
    activity_type: string;
    difficulty_level?: number;
    duration_minutes?: number;
    materials_needed?: string[];
    instructions?: string;
  };
}

// 新增：活動模板型別
export interface TreeActivityTemplate {
  id: string;
  template_name: string;
  template_description?: string;
  activity_type: 'custom' | 'teaching' | 'assessment' | 'practice';
  difficulty_level: number; // 1-5
  estimated_duration?: number; // 分鐘
  materials_needed: string[];
  instructions?: string;
  learning_objectives: string[];
  target_abilities: string[];
  prerequisites: string[];
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// 新增：學生活動進度型別
export interface StudentTreeActivityProgress {
  id: string;
  student_id: string;
  tree_activity_id: string;
  completion_status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  completion_date?: string;
  performance_rating?: number; // 1-5分
  student_notes?: string;
  teacher_notes?: string;
  evidence_files: string[];
  time_spent?: number; // 分鐘
  attempts_count: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

// 新增：學生活動進度詳細型別（包含活動資訊）
export interface StudentTreeActivityProgressDetail extends StudentTreeActivityProgress {
  activity: TreeActivity;
}

export interface DevelopmentAbility {
  id: string;
  ability_name: string;
  ability_description?: string;
  ability_icon?: string;
  ability_color?: string;
  category?: string;
  max_level?: number;
  is_active: boolean;
  created_at: string;
}

export interface AbilityCategory {
  id: string;
  category_name: string;
  category_description?: string;
  category_color?: string;
  sort_order: number;
  created_at: string;
}

export interface AbilityLevel {
  id: string;
  ability_id: string;
  level: number;
  level_title: string;
  level_description: string;
  created_at: string;
}

export interface StudentAbility {
  id: string;
  student_id: string;
  ability_id: string;
  current_level: number;
  progress_percentage: number;
  last_updated: string;
  notes?: string;
  created_at: string;
}

export interface TeachingActivity {
  id: string;
  activity_name: string;
  activity_description?: string;
  activity_type: string;
  difficulty_level?: number;
  target_abilities?: string[];
  materials_needed?: string[];
  duration_minutes?: number;
  age_range_min?: number;
  age_range_max?: number;
  notion_id?: string;
  is_active: boolean;
  template_id?: string;
  custom_fields?: any;
  tags?: string[];
  category?: string;
  status?: string;
  version?: number;
  created_by?: string;
  updated_by?: string;
  estimated_duration?: number;
  instructions?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

// 原有的 TreeActivity 型別（保持向後相容）
export interface TreeActivityLegacy {
  id: string;
  tree_id: string;
  activity_id: string;
  goal_id?: string;
  created_at: string;
}

export interface StudentProgress {
  id: string;
  student_id: string;
  lesson_date: string;
  activity_id?: string;
  goal_id?: string;
  performance_rating: number;
  notes?: string;
  next_target?: string;
  created_at: string;
  student?: {
    full_name: string;
    nick_name?: string;
  };
}

export interface StudentTree {
  id: string;
  student_id: string;
  tree_id: string;
  current_goal_id?: string;
  completed_goals: string[];
  start_date: string;
  completion_date?: string;
  created_at: string;
}

// 能力評估等級
export type AbilityLevelType = 1 | 2 | 3 | 4 | 5;

// 進度狀態
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'exceeded';

// 活動類型
export type ActivityType = 'game' | 'training' | 'exercise';

// 樹狀態
export type TreeStatus = 'active' | 'completed' | 'paused';

// 發展能力名稱
export const DEVELOPMENT_ABILITIES = [
  '小肌發展',
  '專注力',
  '情緒管理',
  '分離能力',
  '語言表達',
  '社交能力',
  '追視能力',
  '大肌肉發展',
] as const;

export type DevelopmentAbilityName = typeof DEVELOPMENT_ABILITIES[number];

// 學生媒體類型
export interface StudentMedia {
  id: string;
  student_id: string;
  media_type: 'video' | 'photo';
  file_name: string;
  file_path: string;
  file_size: number;
  file_duration?: number;
  thumbnail_path?: string;
  title?: string;
  description?: string;
  uploaded_by?: string;
  lesson_id?: string; // 新增：關聯的課程ID
  created_at: string;
  updated_at: string;
  is_favorite?: boolean;
}

// 學生媒體配額類型
export interface StudentMediaQuota {
  student_id: string;
  plan_type: 'free' | 'basic' | 'standard' | 'premium' | 'professional';
  video_limit: number;
  photo_limit: number;
  video_count: number;
  photo_count: number;
  total_used_space: number;
  last_updated: string;
}

// 媒體上傳限制
export interface MediaUploadLimits {
  video: {
    maxSize: number; // 20MB in bytes
    maxCount: number; // 5 videos
    allowedTypes: string[];
  };
  photo: {
    maxSize: number; // 1MB in bytes
    maxCount: number; // 10 photos
    allowedTypes: string[];
  };
}

// 預設上傳限制
export const DEFAULT_MEDIA_LIMITS: MediaUploadLimits = {
  video: {
    maxSize: 20 * 1024 * 1024, // 20MB
    maxCount: 5,
    allowedTypes: [
      'video/mp4', 
      'video/mov', 
      'video/avi', 
      'video/quicktime',  // QuickTime 格式
      'video/x-msvideo',  // AVI 格式
      'video/x-ms-wmv',   // WMV 格式
      'video/webm',       // WebM 格式
      'video/ogg',        // OGG 格式
      'video/m4v',        // M4V 格式
      'video/3gpp',       // 3GPP 格式
      'video/3gpp2'       // 3GPP2 格式
    ],
  },
  photo: {
    maxSize: 1 * 1024 * 1024, // 1MB
    maxCount: 10,
    allowedTypes: [
      'image/jpeg', 
      'image/png', 
      'image/webp',
      'image/gif',        // GIF 格式
      'image/bmp',        // BMP 格式
      'image/tiff',       // TIFF 格式
      'image/svg+xml'     // SVG 格式
    ],
  },
};

// 方案配置
export interface PlanConfig {
  basic: {
    video_limit: number;
    photo_limit: number;
    price: number;
  };
  premium: {
    video_limit: number;
    photo_limit: number;
    price: number;
  };
  professional: {
    video_limit: number;
    photo_limit: number;
    price: number;
  };
}

export const PLAN_CONFIG: PlanConfig = {
  basic: {
    video_limit: 5,
    photo_limit: 10,
    price: 0,
  },
  premium: {
    video_limit: 10,
    photo_limit: 20,
    price: 99,
  },
  professional: {
    video_limit: 20,
    photo_limit: 50,
    price: 199,
  },
};

// 評估模式常數
export const ASSESSMENT_MODES = {
  PROGRESS: 'progress',
  MULTI_SELECT: 'multi_select'
} as const;

// 預設多選等級
export const DEFAULT_MULTI_SELECT_LEVELS = [
  '基礎掌握',
  '熟練應用',
  '創新發揮',
  '教學指導',
  '等級5'
];

// 預設多選等級描述
export const DEFAULT_MULTI_SELECT_DESCRIPTIONS = [
  '能夠基本完成相關任務',
  '能夠熟練地應用所學知識',
  '能夠創新性地發揮所學技能',
  '能夠指導他人學習相關內容',
  '請輸入等級描述'
];

// 新增：活動相關的常數
export const ACTIVITY_TYPES = ['custom', 'teaching', 'assessment', 'practice', 'game'] as const;

export const ACTIVITY_TYPE_LABELS = {
  custom: '自訂活動',
  teaching: '教學活動',
  assessment: '評估活動',
  practice: '練習活動',
  game: '遊戲活動'
} as const;

export const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5] as const;

export const DIFFICULTY_LEVEL_LABELS = {
  1: '初級',
  2: '中級',
  3: '高級',
  4: '進階',
  5: '專家'
} as const;

export const COMPLETION_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SKIPPED: 'skipped'
} as const;

export const COMPLETION_STATUS_LABELS = {
  [COMPLETION_STATUS.NOT_STARTED]: '未開始',
  [COMPLETION_STATUS.IN_PROGRESS]: '進行中',
  [COMPLETION_STATUS.COMPLETED]: '已完成',
  [COMPLETION_STATUS.SKIPPED]: '已跳過'
} as const;

// 新增：活動創建/更新請求型別
export interface CreateTreeActivityRequest {
  tree_id: string;
  activity_source: 'teaching' | 'custom' | 'template';
  activity_name?: string; // 用於自訂活動
  activity_description?: string; // 用於自訂活動
  activity_id?: string; // 用於關聯教學活動
  goal_id?: string; // 用於關聯成長目標
  activity_type: 'custom' | 'teaching' | 'assessment' | 'practice';
  difficulty_level: number;
  estimated_duration?: number;
  materials_needed?: string[];
  instructions?: string;
  learning_objectives?: string[];
  target_abilities?: string[];
  prerequisites?: string[];
  priority_order?: number;
  activity_order?: number;
  is_required?: boolean;
  created_by?: string;
}

export interface UpdateTreeActivityRequest {
  activity_name?: string;
  activity_description?: string;
  activity_type?: 'custom' | 'teaching' | 'assessment' | 'practice';
  difficulty_level?: number;
  estimated_duration?: number;
  materials_needed?: string[];
  instructions?: string;
  learning_objectives?: string[];
  target_abilities?: string[];
  prerequisites?: string[];
  activity_order?: number;
  is_required?: boolean;
  is_active?: boolean;
  updated_by?: string;
}

// 新增：活動進度更新請求型別
export interface UpdateActivityProgressRequest {
  student_id: string;
  tree_activity_id: string;
  completion_status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  performance_rating?: number;
  student_notes?: string;
  teacher_notes?: string;
  time_spent?: number;
  evidence_files?: string[];
  is_favorite?: boolean;
}