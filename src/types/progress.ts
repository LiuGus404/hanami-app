// 學生進度系統型別定義

export interface GrowthTree {
  id: string;
  tree_name: string;
  tree_description?: string;
  tree_icon?: string;
  course_type: string;
  tree_level?: number;
  difficulty_level: number;
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
  related_activities?: string[];
}

export interface DevelopmentAbility {
  id: string;
  ability_name: string;
  ability_description?: string;
  ability_icon?: string;
  ability_color?: string;
  max_level: number;
  category?: string;
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
  difficulty_level: number;
  estimated_duration: number;
  materials_needed?: string[];
  instructions?: string;
  template_id?: string;
  custom_fields?: any;
  tags?: string[];
  category?: string;
  status?: string;
  created_at: string;
  updated_at?: string;
}

export interface TreeActivity {
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
    maxDuration: number; // 30 seconds
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
    maxDuration: 30, // 30 seconds
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