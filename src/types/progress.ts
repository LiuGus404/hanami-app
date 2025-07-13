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
}

export interface DevelopmentAbility {
  id: string;
  ability_name: string;
  ability_description?: string;
  ability_icon?: string;
  ability_color?: string;
  max_level: number;
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
export type AbilityLevel = 1 | 2 | 3 | 4 | 5;

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