// 範本欄位類型定義
export type FieldType = 
  | 'title'           // 標題
  | 'short_answer'    // Short answer
  | 'paragraph'       // Paragraph (長文本)
  | 'multiple_choice' // Multiple choice (單選項目)
  | 'checkboxes'      // Checkboxes (多選項目)
  | 'dropdown'        // Drop-down (下拉選單)
  | 'file_upload'     // File upload (上載檔案)
  | 'linear_scale'    // Linear scale (評分)
  | 'rating'          // Rating (星級評分)
  | 'multiple_choice_grid' // Multiple-choice grid (單選網格)
  | 'tick_box_grid'   // Tick box grid (多選網格)
  | 'date'            // Date (日期)
  | 'time'            // Time (時間)
  | 'url'             // 連結
  | 'email'           // 電子郵件
  | 'phone'           // 電話號碼
  | 'array'           // 陣列
  | 'number';         // 數字

export interface TemplateFieldOption {
  name: string;
  color?: string;
}

export interface TemplateFieldValidation {
  min?: number;
  max?: number;
  min_length?: number;
  max_length?: number;
  min_items?: number;
  max_items?: number;
  pattern?: string;
}

export interface TemplateField {
  id: string;
  type: FieldType;
  title: string;        // 欄位標題
  required?: boolean;
  placeholder?: string;
  description?: string;
  
  // 選項類欄位的設定
  options?: string[];
  allow_other?: boolean;
  
  // 評分類欄位的設定
  min_scale?: number;
  max_scale?: number;
  scale_labels?: { min: string; max: string };
  
  // 網格類欄位的設定
  grid_columns?: string[];
  grid_rows?: string[];
  
  // 檔案上傳設定
  allowed_types?: string[];
  max_size?: number;
  multiple_files?: boolean;
  
  // 驗證規則
  validation?: TemplateFieldValidation;
  
  // 預設值
  defaultValue?: any;
}

export interface TemplateSection {
  name: string;
  fields: string[]; // field keys
}

export interface HanamiTemplateSchema {
  version: string;
  metadata: {
    author: string;
    created_at: string;
    last_updated: string;
    template_version: string;
  };
  properties: Record<string, TemplateField>;
  layout: {
    sections: TemplateSection[];
  };
}

export interface ActivityTemplate {
  id: string;
  name: string;
  description: string;
  fields: TemplateField[];
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  // 資料庫相容欄位
  template_name: string;
  template_description: string;
  template_schema?: any;
  template_category: string;
  is_active: boolean;
}

// 欄位類型選項
export interface FieldTypeOption {
  type: FieldType;
  name: string;
  icon: string;
  description: string;
  category: 'basic' | 'choice' | 'advanced' | 'media';
}

// 預設欄位類型選項
export const FIELD_TYPES: FieldTypeOption[] = [
  // 基本欄位
  { type: 'title', name: '標題', icon: 'Type', description: '大標題文字', category: 'basic' },
  { type: 'short_answer', name: 'Short answer', icon: 'Hash', description: '簡短回答', category: 'basic' },
  { type: 'paragraph', name: 'Paragraph', icon: 'FileText', description: '長文本段落', category: 'basic' },
  
  // 選擇類欄位
  { type: 'multiple_choice', name: 'Multiple choice', icon: 'CircleDot', description: '單選項目', category: 'choice' },
  { type: 'checkboxes', name: 'Checkboxes', icon: 'CheckSquare', description: '多選項目', category: 'choice' },
  { type: 'dropdown', name: 'Drop-down', icon: 'ChevronDown', description: '下拉選單', category: 'choice' },
  
  // 進階欄位
  { type: 'linear_scale', name: 'Linear scale', icon: 'BarChart3', description: '線性評分', category: 'advanced' },
  { type: 'rating', name: 'Rating', icon: 'Star', description: '星級評分', category: 'advanced' },
  { type: 'multiple_choice_grid', name: 'Multiple-choice grid', icon: 'Grid3X3', description: '單選網格', category: 'advanced' },
  { type: 'tick_box_grid', name: 'Tick box grid', icon: 'CheckSquare', description: '多選網格', category: 'advanced' },
  
  // 媒體與連結
  { type: 'file_upload', name: 'File upload', icon: 'Upload', description: '上載檔案', category: 'media' },
  { type: 'url', name: '連結', icon: 'Link', description: '網址連結', category: 'media' },
  { type: 'email', name: '電子郵件', icon: 'Mail', description: '電子郵件地址', category: 'media' },
  { type: 'phone', name: '電話號碼', icon: 'Phone', description: '電話號碼', category: 'media' },
  
  // 時間類
  { type: 'date', name: 'Date', icon: 'Calendar', description: '日期選擇', category: 'basic' },
  { type: 'time', name: 'Time', icon: 'Clock', description: '時間選擇', category: 'basic' },
  
  // 數字類
  { type: 'number', name: 'Number', icon: 'Hash', description: '數字輸入', category: 'basic' },
];

export const CATEGORIES = [
  { key: 'basic', name: '基本欄位', icon: 'Type' },
  { key: 'choice', name: '選擇欄位', icon: 'CheckSquare' },
  { key: 'advanced', name: '進階欄位', icon: 'Database' },
  { key: 'media', name: '媒體連結', icon: 'Upload' },
] as const; 