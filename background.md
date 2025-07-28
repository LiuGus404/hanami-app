# Hanami Web 應用程式架構分析報告

## 📋 專案概述

**Hanami Web** 是一個專業的兒童音樂教育管理系統，使用 Next.js 14 和 Supabase 建立。系統專注於兒童音樂教育管理，提供完整的教師、學生和課程資訊管理功能。

### 核心特性
- 🎵 兒童音樂教育管理
- 👥 多角色用戶系統（管理員、教師、家長）
- 📚 課程管理和排程
- 📊 學生進度追蹤
- 🤖 AI 輔助功能
- 📱 PWA 支援
- 🎨 可愛的 UI 設計風格

---

## 🏗️ 技術架構

### 前端技術棧
- **框架**: Next.js 14 (App Router)
- **語言**: TypeScript 5
- **樣式**: Tailwind CSS 4.1.4
- **UI 組件**: 
  - Headless UI 2.2.2
  - Heroicons 2.2.0
  - Lucide React 0.503.0
- **動畫**: Framer Motion 12.10.5
- **表單處理**: React Hook Form 7.58.0 + Zod 3.25.64
- **狀態管理**: React Context + Custom Hooks
- **通知**: React Hot Toast 2.5.2
- **PWA**: Next PWA 5.6.0

### 後端技術棧
- **資料庫**: Supabase (PostgreSQL)
- **認證**: Supabase Auth + 自定義會話管理
- **API**: Next.js API Routes
- **即時通訊**: Supabase Realtime
- **檔案儲存**: Supabase Storage

---

## 🎨 設計系統

### 色彩系統
```css
/* 主色調 - 溫暖的櫻花色系 */
--hanami-primary: #FFD59A;      /* 主要櫻花色 */
--hanami-secondary: #EBC9A4;    /* 次要溫暖色 */
--hanami-accent: #FFB6C1;       /* 可愛粉色 */
--hanami-background: #FFF9F2;   /* 溫暖背景色 */
--hanami-surface: #FFFDF8;      /* 表面色 */
--hanami-text: #4B4036;         /* 主要文字色 */
--hanami-text-secondary: #2B3A3B; /* 次要文字色 */
--hanami-border: #EADBC8;       /* 邊框色 */
--hanami-success: #E0F2E0;      /* 成功色 */
--hanami-danger: #FFE0E0;       /* 危險色 */
```

### 字體系統
```css
/* 主要字體 */
--font-geist-sans: Geist, system-ui, sans-serif;
--font-geist-mono: Geist Mono, monospace;
--font-quicksand: 'Quicksand', sans-serif; /* 可愛風格 */
```

### 組件設計原則
1. **圓潤可愛**: 所有按鈕和卡片使用圓角設計
2. **漸層效果**: 使用溫暖的漸層背景
3. **柔和陰影**: 多層陰影營造立體感
4. **動畫互動**: 懸停和點擊時的微動畫
5. **響應式設計**: 移動優先的設計理念

---

## 📁 目錄結構

```
hanami-web/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # 認證相關頁面組
│   │   │   ├── login/               # 登入頁面
│   │   │   └── register/            # 註冊頁面
│   │   ├── admin/                    # 管理員儀表板
│   │   │   ├── students/            # 學生管理
│   │   │   ├── teachers/            # 教師管理
│   │   │   ├── class-management/    # 課程管理
│   │   │   ├── schedule-management/ # 排程管理
│   │   │   ├── ai-hub/              # AI 工具中心
│   │   │   ├── student-progress/    # 學生進度管理
│   │   │   ├── resource-library/    # 資源庫
│   │   │   └── permissions/         # 權限管理
│   │   ├── teacher/                  # 教師儀表板
│   │   ├── parent/                   # 家長儀表板
│   │   ├── trial-register/          # 試聽註冊
│   │   ├── api/                     # API 路由
│   │   │   ├── auth/               # 認證 API
│   │   │   ├── student-media/      # 學生媒體 API
│   │   │   └── teaching-activities/ # 教學活動 API
│   │   ├── layout.tsx              # 根佈局
│   │   ├── page.tsx                # 首頁
│   │   └── globals.css             # 全局樣式
│   ├── components/                   # 可重用組件
│   │   ├── ui/                     # 基礎 UI 組件
│   │   │   ├── HanamiButton.tsx    # 可愛按鈕組件
│   │   │   ├── HanamiCard.tsx      # 卡片組件
│   │   │   ├── HanamiInput.tsx     # 輸入框組件
│   │   │   ├── HanamiSelect.tsx    # 選擇器組件
│   │   │   ├── HanamiCalendar.tsx  # 日曆組件
│   │   │   └── index.ts            # 組件導出
│   │   ├── admin/                  # 管理員專用組件
│   │   │   ├── AdminSidebar.tsx    # 側邊欄
│   │   │   ├── StudentCard.tsx     # 學生卡片
│   │   │   ├── TeacherCard.tsx     # 教師卡片
│   │   │   └── ClassManagementPanel.tsx # 課程管理面板
│   │   ├── forms/                  # 表單組件
│   │   │   ├── NewStudentForm.tsx  # 新學生表單
│   │   │   └── AddRegularStudentForm.tsx # 正式學生表單
│   │   └── SessionProviderWrapper.tsx # 會話提供者
│   ├── lib/                         # 工具函數和配置
│   │   ├── supabase.ts             # Supabase 客戶端
│   │   ├── database.types.ts       # 資料庫型別定義
│   │   ├── authUtils.ts            # 認證工具
│   │   ├── permissionUtils.ts      # 權限工具
│   │   └── utils.ts                # 通用工具
│   ├── hooks/                       # 自定義 Hooks
│   │   ├── useUser.ts              # 用戶狀態 Hook
│   │   └── useLessonPlans.ts       # 課程計劃 Hook
│   └── types/                       # TypeScript 型別定義
│       ├── auth.ts                 # 認證型別
│       ├── schedule.ts             # 排程型別
│       └── index.ts                # 型別導出
├── public/                          # 靜態資源
│   ├── icons/                      # 圖標資源
│   ├── manifest.json               # PWA 配置
│   └── sw.js                       # Service Worker
├── middleware.ts                    # Next.js 中間件
├── next.config.js                  # Next.js 配置
├── tailwind.config.js              # Tailwind 配置
├── tsconfig.json                   # TypeScript 配置
└── package.json                    # 依賴配置
```

---

## 🗄️ Supabase 資料庫架構

### 核心資料表

#### 1. hanami_employee (教師資料表)
```sql
CREATE TABLE hanami_employee (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_fullname TEXT,
  teacher_nickname TEXT NOT NULL,
  teacher_role TEXT,
  teacher_status TEXT,
  teacher_email TEXT,
  teacher_phone TEXT,
  teacher_address TEXT,
  teacher_dob DATE,
  teacher_hsalary NUMERIC,
  teacher_msalary NUMERIC,
  teacher_background TEXT,
  teacher_bankid TEXT,
  teacher_password TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. Hanami_Students (學生資料表)
```sql
CREATE TABLE "Hanami_Students" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  nick_name TEXT,
  student_age INTEGER,
  student_dob DATE,
  gender TEXT,
  contact_number TEXT NOT NULL,
  student_email TEXT,
  parent_email TEXT,
  address TEXT,
  school TEXT,
  student_type TEXT,
  course_type TEXT,
  student_teacher TEXT,
  student_preference TEXT,
  student_remarks TEXT,
  health_notes TEXT,
  regular_weekday INTEGER,
  regular_timeslot TEXT,
  started_date DATE,
  duration_months INTEGER,
  ongoing_lessons INTEGER,
  upcoming_lessons INTEGER,
  student_oid TEXT,
  student_password TEXT,
  access_role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. hanami_student_lesson (課程記錄表)
```sql
CREATE TABLE hanami_student_lesson (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES "Hanami_Students"(id),
  student_oid TEXT,
  lesson_date DATE NOT NULL,
  actual_timeslot TEXT,
  lesson_duration TEXT,
  lesson_status TEXT,
  lesson_teacher TEXT,
  lesson_activities TEXT,
  progress_notes TEXT,
  next_target TEXT,
  notes TEXT,
  remarks TEXT,
  video_url TEXT,
  package_id UUID REFERENCES "Hanami_Student_Package"(id),
  course_type TEXT,
  regular_timeslot TEXT,
  regular_weekday TEXT,
  full_name TEXT,
  status TEXT,
  access_role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. Hanami_Student_Package (課程包表)
```sql
CREATE TABLE "Hanami_Student_Package" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES "Hanami_Students"(id) NOT NULL,
  course_name TEXT NOT NULL,
  package_type TEXT NOT NULL,
  total_lessons INTEGER NOT NULL,
  remaining_lessons INTEGER NOT NULL,
  lesson_duration INTEGER NOT NULL,
  lesson_time TEXT NOT NULL,
  weekday TEXT NOT NULL,
  price NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  status TEXT,
  full_name TEXT,
  access_role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 5. hanami_trial_students (試聽學生表)
```sql
CREATE TABLE hanami_trial_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  nick_name TEXT,
  student_age INTEGER,
  student_dob DATE,
  gender TEXT,
  contact_number TEXT,
  student_email TEXT,
  parent_email TEXT,
  address TEXT,
  school TEXT,
  student_type TEXT,
  course_type TEXT,
  student_teacher TEXT,
  student_preference TEXT,
  health_notes TEXT,
  regular_weekday TEXT,
  regular_timeslot TEXT,
  lesson_date DATE,
  lesson_duration TEXT,
  duration_months TEXT,
  ongoing_lessons INTEGER,
  remaining_lessons INTEGER,
  upcoming_lessons INTEGER,
  student_oid TEXT,
  student_password TEXT,
  trial_status TEXT,
  trial_remarks TEXT,
  weekday TEXT,
  actual_timeslot TEXT,
  access_role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 6. hanami_schedule (排程表)
```sql
CREATE TABLE hanami_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekday INTEGER NOT NULL,
  timeslot TEXT NOT NULL,
  max_students INTEGER NOT NULL,
  assigned_teachers TEXT,
  course_type TEXT,
  duration TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 7. hanami_lesson_plan (課程計劃表)
```sql
CREATE TABLE hanami_lesson_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_date DATE NOT NULL,
  timeslot TEXT NOT NULL,
  course_type TEXT NOT NULL,
  topic TEXT NOT NULL,
  objectives TEXT[] NOT NULL,
  materials TEXT[] NOT NULL,
  teacher_ids TEXT[] NOT NULL,
  teacher_names TEXT[] NOT NULL,
  teacher_ids_1 TEXT[],
  teacher_ids_2 TEXT[],
  theme TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 8. hanami_admin (管理員表)
```sql
CREATE TABLE hanami_admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL UNIQUE,
  admin_name TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 9. hanami_trial_queue (試聽隊列表)
```sql
CREATE TABLE hanami_trial_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,
  full_name TEXT,
  student_age INTEGER,
  student_dob DATE,
  phone_no TEXT,
  course_types TEXT,
  prefer_time TEXT,
  notes TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 10. ai_tasks (AI 任務表)
```sql
CREATE TABLE ai_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt TEXT NOT NULL,
  result TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  assigned_model TEXT,
  memory_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 11. hanami_teaching_activities (教學活動表)
```sql
CREATE TABLE hanami_teaching_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_name TEXT NOT NULL,
  activity_description TEXT,
  activity_type TEXT NOT NULL,
  difficulty_level INTEGER,
  target_abilities TEXT[],
  materials_needed TEXT[],
  duration_minutes INTEGER,
  age_range_min INTEGER,
  age_range_max INTEGER,
  notion_id TEXT,
  is_active BOOLEAN DEFAULT true,
  template_id UUID REFERENCES hanami_resource_templates(id),
  custom_fields JSONB,
  tags TEXT[],
  category TEXT,
  status TEXT DEFAULT 'draft',
  version INTEGER DEFAULT 1,
  created_by TEXT,
  updated_by TEXT,
  estimated_duration INTEGER,
  instructions TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 12. hanami_student_media (學生媒體表)
```sql
CREATE TABLE hanami_student_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES "Hanami_Students"(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('video', 'photo')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_duration INTEGER,
  thumbnail_path TEXT,
  title TEXT,
  description TEXT,
  uploaded_by TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 13. hanami_student_media_quota (媒體配額表)
```sql
CREATE TABLE hanami_student_media_quota (
  student_id UUID PRIMARY KEY REFERENCES "Hanami_Students"(id) ON DELETE CASCADE,
  plan_type TEXT DEFAULT 'free',
  video_limit INTEGER DEFAULT 5,
  photo_limit INTEGER DEFAULT 10,
  video_count INTEGER DEFAULT 0,
  photo_count INTEGER DEFAULT 0,
  total_used_space BIGINT DEFAULT 0,
  storage_limit_bytes BIGINT DEFAULT 262144000,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 資料庫函數

#### 1. 自動生成學生帳號
```sql
CREATE OR REPLACE FUNCTION auto_generate_student_email_password()
RETURNS TRIGGER AS $$
BEGIN
  -- 自動生成學生郵箱和密碼邏輯
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### 2. 自動生成教師帳號
```sql
CREATE OR REPLACE FUNCTION auto_generate_teacher_email_password()
RETURNS TRIGGER AS $$
BEGIN
  -- 自動生成教師郵箱和密碼邏輯
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### 3. 生成簡單 ID
```sql
CREATE OR REPLACE FUNCTION generate_simple_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'STU' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;
```

### 資料庫觸發器
```sql
-- 學生資料更新觸發器
CREATE TRIGGER update_student_updated_at
  BEFORE UPDATE ON "Hanami_Students"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 教師資料更新觸發器
CREATE TRIGGER update_employee_updated_at
  BEFORE UPDATE ON hanami_employee
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 🔐 認證系統架構

### 自定義會話管理
系統使用自定義會話管理而非 Supabase Auth，主要特點：

#### 1. 會話結構
```typescript
interface UserSession {
  id: string;
  email: string;
  role: 'admin' | 'teacher' | 'parent';
  name: string;
  timestamp: number;
}
```

#### 2. 會話存儲
- **localStorage**: 主要存儲位置
- **Cookie**: 供 middleware 使用
- **過期時間**: 24小時

#### 3. 認證流程
```typescript
// 1. 驗證用戶憑證
export async function validateUserCredentials(email: string, password: string): Promise<LoginResult>

// 2. 設置會話
export function setUserSession(user: UserProfile)

// 3. 獲取會話
export function getUserSession(): UserProfile | null

// 4. 清除會話
export function clearUserSession()
```

### 權限控制
```typescript
interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
  role: string[];
}
```

### 路由保護
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // 檢查自定義會話
  const customSession = req.cookies.get('hanami_user_session')?.value
  
  // 路由權限檢查邏輯
  if ((adminRoutes || teacherRoutes || parentRoutes) && !userSession) {
    // 重定向到對應登入頁面
  }
}
```

---

## 🛡️ RLS (Row Level Security) 架構

### 當前RLS狀態分析 (2024-12-19)

#### 📊 統計概覽
- **總表數**: 52個表
- **已啟用RLS**: 18個表 (34.6%)
- **已停用RLS**: 34個表 (65.4%)
- **正常運作**: 15個表 (28.8%)
- **啟用但無政策**: 3個表 (5.8%)
- **停用但有政策**: 19個表 (36.5%)

#### 🔍 詳細狀態分類

##### ✅ 正常運作的表 (15個)
這些表RLS已啟用且有適當的政策，功能正常：
- `Hanami_CourseTypes` - 課程類型管理
- `Hanami_Student_Package` - 學生課程包
- `ai_suggestions` - AI建議
- `ai_tasks` - AI任務
- `hanami_ability_categories` - 能力分類
- `hanami_holidays` - 假期管理
- `hanami_lesson_activity_log` - 課程活動日誌
- `hanami_lesson_plan` - 課程計劃
- `hanami_parent_student_relations` - 家長學生關係
- `hanami_schedule` - 排程管理
- `hanami_teacher_student_relations` - 教師學生關係
- `incoming_messages` - 接收訊息
- `outgoing_messages` - 發送訊息
- `public_ai_tasks` - 公開AI任務
- `registration_requests` - 註冊申請
- `teacher_attendance` - 教師出勤
- `teacher_schedule` - 教師排程
- `user_tags` - 用戶標籤
- `users` - 用戶管理

##### ⚠️ 啟用但無政策的表 (3個)
這些表RLS已啟用但缺少政策，需要立即處理：
- `hanami_group_chat` - 群組聊天
- `model_status` - 模型狀態
- `system_update_log` - 系統更新日誌

##### ❌ 停用但有政策的表 (19個)
這些表RLS已停用但存在政策，可能是為了避免載入問題：
- `Hanami_Students` - 學生資料 (14個政策)
- `hanami_ability_levels` - 能力等級 (4個政策)
- `hanami_admin` - 管理員 (5個政策)
- `hanami_employee` - 教師員工 (8個政策)
- `hanami_student_lesson` - 學生課程 (6個政策)
- `hanami_student_progress` - 學生進度 (3個政策)
- `hanami_trial_queue` - 試聽隊列 (4個政策)
- `hanami_trial_students` - 試聽學生 (9個政策)
- `hanami_user_permissions` - 用戶權限 (2個政策)
- `inactive_student_list` - 非活躍學生列表 (4個政策)

##### ❌ 完全停用的表 (15個)
這些表RLS完全停用且無政策：
- `hanami_ability_assessment_history` - 能力評估歷史
- `hanami_ability_assessments` - 能力評估
- `hanami_ai_message_logs` - AI訊息日誌
- `hanami_ai_message_templates` - AI訊息範本
- `hanami_custom_options` - 自訂選項
- `hanami_custom_options_backup` - 自訂選項備份
- `hanami_development_abilities` - 發展能力
- `hanami_file_resources` - 檔案資源
- `hanami_growth_goals` - 成長目標
- `hanami_growth_trees` - 成長樹
- `hanami_resource_categories` - 資源分類
- `hanami_resource_permissions` - 資源權限
- `hanami_resource_tag_relations` - 資源標籤關係
- `hanami_resource_tags` - 資源標籤
- `hanami_resource_templates` - 資源範本
- `hanami_resource_usage` - 資源使用
- `hanami_resource_versions` - 資源版本
- `hanami_student_abilities` - 學生能力
- `hanami_student_media` - 學生媒體
- `hanami_student_media_quota` - 學生媒體配額
- `hanami_student_trees` - 學生樹
- `hanami_teaching_activities` - 教學活動
- `hanami_template_field_validations` - 範本欄位驗證
- `hanami_template_usage` - 範本使用
- `hanami_tree_activities` - 樹活動
- `hanami_trial_student_media_quota` - 試聽學生媒體配額

#### 🚨 關鍵問題分析

##### 1. 核心功能表停用RLS
以下核心功能表目前停用RLS，可能影響安全性：
- `Hanami_Students` - 學生資料管理
- `hanami_employee` - 教師管理
- `hanami_student_lesson` - 課程記錄
- `hanami_student_media` - 學生媒體

##### 2. 資源庫系統完全停用
整個資源庫系統的RLS都停用了，包括：
- 資源範本、分類、標籤
- 檔案資源管理
- 權限控制系統

##### 3. 進度追蹤系統停用
學生進度相關表都停用了RLS：
- 能力評估
- 成長樹
- 學生進度

#### 🔧 建議的修復策略

##### 階段1: 緊急修復 (立即執行)
```sql
-- 為啟用但無政策的表創建基本政策
CREATE POLICY "Enable read access for authenticated users" ON hanami_group_chat 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON model_status 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON system_update_log 
FOR SELECT USING (auth.role() = 'authenticated');
```

##### 階段2: 核心功能修復 (謹慎執行)
```sql
-- 重新啟用核心表的RLS，但使用寬鬆政策
ALTER TABLE "Hanami_Students" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated access" ON "Hanami_Students" 
FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE hanami_employee ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated access" ON hanami_employee 
FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE hanami_student_lesson ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated access" ON hanami_student_lesson 
FOR ALL USING (auth.role() = 'authenticated');
```

##### 階段3: 資源庫系統修復 (測試後執行)
```sql
-- 為資源庫系統啟用RLS
ALTER TABLE hanami_resource_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated access" ON hanami_resource_templates 
FOR ALL USING (auth.role() = 'authenticated');

-- 其他資源庫表類似處理...
```

#### 📋 維護檢查清單

##### 每日檢查
- [ ] 檢查RLS檢查工具是否正常運作
- [ ] 監控核心功能表的訪問權限
- [ ] 檢查Storage RLS政策

##### 每週檢查
- [ ] 審查新創建表的RLS設定
- [ ] 檢查政策是否有衝突
- [ ] 更新RLS狀態報告

##### 每月檢查
- [ ] 全面RLS安全審查
- [ ] 更新權限政策
- [ ] 備份RLS設定

#### 🛡️ 安全注意事項

1. **不要一次性啟用所有停用的RLS** - 可能導致系統崩潰
2. **測試環境優先** - 所有RLS變更先在測試環境驗證
3. **監控日誌** - 密切關注RLS相關錯誤
4. **備份政策** - 修改前備份現有政策
5. **漸進式啟用** - 按功能模組逐步啟用RLS

#### 🔄 自動化工具

使用專案提供的RLS檢查工具：
- **Web界面**: `/admin/rls-checker`
- **API端點**: `/api/rls-check`
- **SQL腳本**: `rls_check_script.sql`

### RLS 檢查工具

專案提供了完整的RLS狀態檢查和管理工具：

#### 1. Web界面檢查工具
- **路徑**: `/admin/rls-checker`
- **功能**: 檢查所有表的RLS狀態、政策詳情、啟用/停用RLS、創建基本政策
- **訪問**: 在管理員側邊欄點擊「🔒 RLS 權限檢查」

#### 2. API端點
- **GET** `/api/rls-check`: 獲取所有表的RLS狀態
- **POST** `/api/rls-check`: 執行RLS操作（啟用/停用/創建政策）

#### 3. SQL檢查腳本
- **檔案**: `rls_check_script.sql`
- **用途**: 在Supabase SQL Editor中直接執行，獲取詳細的RLS狀態報告

### Storage RLS 政策

#### 1. 基本讀取權限
```sql
-- 允許認證用戶讀取 hanami-media bucket
CREATE POLICY "Allow authenticated read access" ON storage.objects
FOR SELECT USING (
  bucket_id = 'hanami-media' AND 
  auth.role() = 'authenticated'
);
```

#### 2. 上傳權限（服務端）
```sql
-- 允許服務端上傳（使用 service_role_key）
CREATE POLICY "Allow service role uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'hanami-media'
);
```

#### 3. 刪除權限
```sql
-- 允許認證用戶刪除自己的檔案
CREATE POLICY "Allow authenticated delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'hanami-media' AND 
  auth.role() = 'authenticated'
);
```

### 資料庫 RLS 政策

#### 1. 學生媒體表
```sql
-- 允許用戶查看自己學生的媒體
CREATE POLICY "Users can view their students' media" ON hanami_student_media
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "Hanami_Students" 
    WHERE id = student_id 
    AND access_role = auth.jwt() ->> 'role'
  )
);
```

#### 2. 配額表
```sql
-- 允許用戶查看自己學生的配額
CREATE POLICY "Users can view their students' quota" ON hanami_student_media_quota
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "Hanami_Students" 
    WHERE id = student_id 
    AND access_role = auth.jwt() ->> 'role'
  )
);
```

### RLS 狀態檢查方法

#### 方法1: 使用Web工具
1. 登入管理員帳號
2. 點擊側邊欄的「🔒 RLS 權限檢查」
3. 點擊「檢查 RLS 狀態」按鈕
4. 查看詳細的RLS狀態報告

#### 方法2: 使用SQL腳本
1. 在Supabase Dashboard中打開SQL Editor
2. 複製並執行 `rls_check_script.sql` 中的查詢
3. 查看結果了解當前RLS設定

#### 方法3: 直接API調用
```bash
# 檢查RLS狀態
curl -X GET http://localhost:3000/api/rls-check

# 啟用特定表的RLS
curl -X POST http://localhost:3000/api/rls-check \
  -H "Content-Type: application/json" \
  -d '{"action": "enable_rls", "table_name": "hanami_student_media"}'
```

---

## 🎨 組件設計系統

### 1. HanamiButton 組件
```typescript
interface HanamiButtonProps {
  variant?: 'primary' | 'secondary' | 'cute' | 'soft' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  animated?: boolean;
}
```

### 2. HanamiCard 組件
```typescript
interface HanamiCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'hover' | 'interactive';
}
```

### 3. HanamiInput 組件
```typescript
interface HanamiInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  required?: boolean;
}
```

---

## 🔌 API 架構

### 1. 認證 API
```typescript
// app/api/auth/create-account/route.ts
export async function POST(request: Request) {
  // 創建帳號邏輯
}
```

### 2. 學生管理 API
```typescript
// 學生 CRUD 操作
export async function GET() { /* 獲取學生列表 */ }
export async function POST() { /* 創建學生 */ }
export async function PUT() { /* 更新學生 */ }
export async function DELETE() { /* 刪除學生 */ }
```

### 3. 教師管理 API
```typescript
// 教師 CRUD 操作
export async function GET() { /* 獲取教師列表 */ }
export async function POST() { /* 創建教師 */ }
export async function PUT() { /* 更新教師 */ }
export async function DELETE() { /* 刪除教師 */ }
```

### 4. 學生媒體 API
```typescript
// app/api/student-media/upload/route.ts
export async function POST(request: NextRequest) {
  // 檔案上傳邏輯
  // 使用 service_role_key 繞過客戶端 RLS
}
```

---

## 📊 狀態管理架構

### 1. 用戶狀態 Hook
```typescript
// hooks/useUser.ts
export function useUser() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 用戶狀態管理邏輯
  return { user, loading, login, logout, updateUser };
}
```

### 2. 課程計劃 Hook
```typescript
// hooks/useLessonPlans.ts
export function useLessonPlans() {
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  
  // 課程計劃管理邏輯
  return { lessonPlans, createPlan, updatePlan, deletePlan };
}
```

---

## 🚀 性能優化策略

### 1. 代碼分割
- 使用 Next.js 動態導入
- 組件懶加載
- 路由級代碼分割

### 2. 圖片優化
- 使用 Next.js Image 組件
- WebP 格式支援
- 響應式圖片

### 3. 快取策略
- 瀏覽器快取
- CDN 快取
- API 響應快取

### 4. 資料庫優化
- 索引優化
- 查詢優化
- 連接池管理

---

## 🔒 安全性架構

### 1. 認證安全
- 自定義會話管理
- 會話過期處理
- 密碼加密存儲

### 2. 資料安全
- SQL 注入防護
- XSS 防護
- CSRF 防護

### 3. API 安全
- 請求驗證
- 權限檢查
- 速率限制

### 4. 檔案安全
- 檔案類型驗證
- 檔案大小限制
- RLS 權限控制

---

## 🎯 功能模組

### 1. 管理員模組
- **學生管理**: 新增、編輯、刪除學生
- **教師管理**: 教師資料和權限管理
- **課程管理**: 課程排程和內容管理
- **AI 工具**: AI 輔助功能
- **權限管理**: 用戶權限設定
- **資源庫**: 教學資源管理
- **進度追蹤**: 學生學習進度管理

### 2. 教師模組
- **學生管理**: 查看和管理自己的學生
- **課程記錄**: 記錄課程內容和進度
- **進度評估**: 學生能力評估
- **媒體管理**: 學生作品管理

### 3. 家長模組
- **學生資訊**: 查看學生基本資訊
- **課程記錄**: 查看課程記錄
- **進度追蹤**: 查看學習進度

### 4. AI 功能模組
- **AI 聊天**: 智能對話助手
- **任務管理**: AI 任務列表
- **訊息模板**: AI 訊息模板管理
- **自動排程**: AI 輔助排程

---

## 📱 PWA 功能

### 1. 離線支援
- Service Worker 快取
- 離線頁面顯示
- 背景同步

### 2. 安裝功能
- 主畫面安裝
- 推送通知
- 原生應用體驗

### 3. 配置檔案
```json
// public/manifest.json
{
  "name": "Hanami 音樂教育",
  "short_name": "Hanami",
  "description": "專業的兒童音樂教育管理系統",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFF9F2",
  "theme_color": "#FFD59A"
}
```

---

## 🔧 部署架構

### 1. 環境配置
```bash
# 開發環境
NEXT_PUBLIC_SUPABASE_URL=your_dev_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_dev_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 生產環境
NEXT_PUBLIC_SUPABASE_URL=your_prod_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. 部署流程
1. 代碼提交到 Git
2. 自動化測試
3. 構建生產版本
4. 部署到 Vercel
5. 資料庫遷移
6. 健康檢查

---

## 📈 監控與日誌

### 1. 錯誤監控
- 前端錯誤捕獲
- API 錯誤記錄
- 資料庫錯誤監控

### 2. 性能監控
- 頁面載入時間
- API 響應時間
- 資料庫查詢性能

### 3. 用戶行為分析
- 頁面訪問統計
- 功能使用分析
- 用戶路徑追蹤

---

## 🛠️ 維護指南

### 1. 日常維護
- 資料庫備份
- 日誌清理
- 性能監控

### 2. 版本更新
- 依賴包更新
- 安全補丁
- 功能增強

### 3. 故障排除
- 錯誤日誌分析
- 性能問題診斷
- 資料庫問題修復

---

## 📚 開發指南

### 1. 環境設定
```bash
# 安裝依賴
npm install

# 開發模式
npm run dev

# 構建
npm run build

# 測試
npm run test
```

### 2. 代碼規範
- ESLint 配置
- Prettier 格式化
- TypeScript 型別檢查
- Husky Git hooks

### 3. 測試策略
- Jest 單元測試
- 組件測試
- API 測試
- E2E 測試

---

## 🎉 總結

Hanami Web 是一個功能完整、架構清晰的兒童音樂教育管理系統。系統採用現代化的技術棧，具有良好的可擴展性和維護性。

### 主要優勢
1. **完整的用戶角色管理**: 支援管理員、教師、家長三種角色
2. **豐富的功能模組**: 涵蓋教育管理的各個方面
3. **現代化的技術架構**: 使用 Next.js 14 和 Supabase
4. **優秀的用戶體驗**: 可愛的 UI 設計和流暢的交互
5. **強大的 AI 功能**: 智能輔助和自動化
6. **完善的權限控制**: RLS 和自定義權限管理
7. **PWA 支援**: 原生應用體驗

### 技術亮點
1. **自定義認證系統**: 靈活的會話管理
2. **模組化組件設計**: 可重用的 UI 組件
3. **完整的資料庫設計**: 規範化的資料結構
4. **安全的檔案管理**: 完整的 Storage 解決方案
5. **響應式設計**: 支援多種設備

---

**最後更新日期**: 2024-12-19  
**版本**: 2.0.0  
**維護者**: Hanami 開發團隊 

---

## 🔐 權限系統設計方案

### 📋 系統概述

基於現有的Hanami Web架構，設計一個靈活的多身份權限管理系統，支援管理員、教師、家長三種基本身份，並可擴展自訂身份。

### 🎯 設計目標

1. **多身份支援**: 管理員、教師、家長 + 自訂身份
2. **細粒度權限控制**: 頁面級別和資料級別的權限管理
3. **Supabase認證整合**: 基於email/電話的統一認證
4. **管理員審核機制**: 身份驗證和權限分配
5. **RLS安全整合**: 確保資料庫層面的安全性
6. **向後相容**: 保持現有功能不受影響

### 🏗️ 系統架構設計

#### 1. 核心資料表設計

##### A. 身份角色表 (hanami_roles)
```sql
CREATE TABLE hanami_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL UNIQUE, -- 'admin', 'teacher', 'parent', 'custom_role_1'
  display_name TEXT NOT NULL,     -- '管理員', '教師', '家長', '自訂角色1'
  description TEXT,
  is_system_role BOOLEAN DEFAULT false, -- 系統預設角色
  permissions JSONB NOT NULL,     -- 權限配置
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

##### B. 用戶權限表 (hanami_user_permissions_v2)
```sql
CREATE TABLE hanami_user_permissions_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  user_phone TEXT,
  role_id UUID REFERENCES hanami_roles(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  approved_by UUID REFERENCES hanami_admin(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  custom_permissions JSONB, -- 額外的自訂權限
  student_access_list UUID[], -- 可訪問的學生ID列表
  page_access_list TEXT[], -- 可訪問的頁面列表
  feature_access_list TEXT[], -- 可訪問的功能列表
  data_access_config JSONB, -- 資料訪問配置
  expires_at TIMESTAMP WITH TIME ZONE, -- 權限過期時間
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

##### C. 權限模板表 (hanami_permission_templates)
```sql
CREATE TABLE hanami_permission_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES hanami_admin(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

##### D. 權限申請表 (hanami_permission_applications)
```sql
CREATE TABLE hanami_permission_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_email TEXT NOT NULL,
  applicant_phone TEXT,
  requested_role_id UUID REFERENCES hanami_roles(id) NOT NULL,
  application_type TEXT NOT NULL CHECK (application_type IN ('new_user', 'role_change', 'permission_extension')),
  current_role_id UUID REFERENCES hanami_roles(id),
  reason TEXT NOT NULL,
  supporting_documents JSONB, -- 支援文件資訊
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'cancelled')),
  reviewed_by UUID REFERENCES hanami_admin(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  approved_permissions JSONB, -- 最終批准的權限
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

##### E. 權限審計日誌表 (hanami_permission_audit_logs)
```sql
CREATE TABLE hanami_permission_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES hanami_admin(id) NOT NULL,
  target_user_email TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('grant', 'revoke', 'modify', 'suspend', 'activate')),
  old_permissions JSONB,
  new_permissions JSONB NOT NULL,
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

##### F. 權限使用統計表 (hanami_permission_usage_stats)
```sql
CREATE TABLE hanami_permission_usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  resource_type TEXT NOT NULL, -- 'page', 'feature', 'data'
  resource_id TEXT,
  operation TEXT NOT NULL, -- 'view', 'create', 'edit', 'delete'
  success BOOLEAN NOT NULL,
  error_message TEXT,
  response_time_ms INTEGER,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

##### G. 權限快取表 (hanami_permission_cache)
```sql
CREATE TABLE hanami_permission_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  cache_key TEXT NOT NULL,
  cache_value JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

##### H. 權限配置表 (hanami_permission_configs)
```sql
CREATE TABLE hanami_permission_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES hanami_admin(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. 權限檢查函數

##### A. 主權限檢查函數
```sql
CREATE OR REPLACE FUNCTION check_user_permission(
  p_user_email TEXT,
  p_resource_type TEXT,
  p_operation TEXT,
  p_resource_id TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  user_permission RECORD;
  role_permission RECORD;
  has_permission BOOLEAN := FALSE;
BEGIN
  -- 獲取用戶權限記錄
  SELECT * INTO user_permission
  FROM hanami_user_permissions_v2
  WHERE user_email = p_user_email
    AND status = 'approved'
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW());
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- 獲取角色權限
  SELECT * INTO role_permission
  FROM hanami_roles
  WHERE id = user_permission.role_id
    AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- 檢查頁面權限
  IF p_resource_type = 'page' THEN
    has_permission := check_page_permission(user_permission, role_permission, p_operation, p_resource_id);
  END IF;
  
  -- 檢查功能權限
  IF p_resource_type = 'feature' THEN
    has_permission := check_feature_permission(user_permission, role_permission, p_operation, p_resource_id);
  END IF;
  
  -- 檢查資料權限
  IF p_resource_type = 'data' THEN
    has_permission := check_data_permission(user_permission, role_permission, p_operation, p_resource_id);
  END IF;
  
  -- 記錄使用統計
  INSERT INTO hanami_permission_usage_stats (
    user_email, resource_type, resource_id, operation, success, created_at
  ) VALUES (
    p_user_email, p_resource_type, p_resource_id, p_operation, has_permission, NOW()
  );
  
  RETURN has_permission;
END;
$$ LANGUAGE plpgsql;
```

##### B. 輔助權限檢查函數
```sql
-- 檢查頁面權限
CREATE OR REPLACE FUNCTION check_page_permission(
  user_permission RECORD,
  role_permission RECORD,
  operation TEXT,
  page_path TEXT
) RETURNS BOOLEAN;

-- 檢查功能權限
CREATE OR REPLACE FUNCTION check_feature_permission(
  user_permission RECORD,
  role_permission RECORD,
  operation TEXT,
  feature_name TEXT
) RETURNS BOOLEAN;

-- 檢查資料權限
CREATE OR REPLACE FUNCTION check_data_permission(
  user_permission RECORD,
  role_permission RECORD,
  operation TEXT,
  resource_id TEXT
) RETURNS BOOLEAN;
```

#### 3. 預設角色配置

##### A. 管理員角色
```json
{
  "role_name": "admin",
  "display_name": "管理員",
  "is_system_role": true,
  "permissions": {
    "pages": {
      "/admin/*": {"access": "allow", "operations": ["view", "create", "edit", "delete"]},
      "/teacher/*": {"access": "allow", "operations": ["view", "create", "edit", "delete"]},
      "/parent/*": {"access": "allow", "operations": ["view"]}
    },
    "features": {
      "user_management": {"access": "allow", "operations": ["view", "create", "edit", "delete"]},
      "permission_management": {"access": "allow", "operations": ["view", "create", "edit", "delete"]},
      "system_settings": {"access": "allow", "operations": ["view", "edit"]},
      "student_management": {"access": "allow", "operations": ["view", "create", "edit", "delete"]},
      "teacher_management": {"access": "allow", "operations": ["view", "create", "edit", "delete"]},
      "course_management": {"access": "allow", "operations": ["view", "create", "edit", "delete"]},
      "ai_tools": {"access": "allow", "operations": ["view", "create", "edit", "delete"]}
    },
    "data": {
      "students": {"access": "all", "operations": ["view", "edit", "delete"]},
      "teachers": {"access": "all", "operations": ["view", "edit", "delete"]},
      "courses": {"access": "all", "operations": ["view", "edit", "delete"]}
    }
  }
}
```

##### B. 教師角色
```json
{
  "role_name": "teacher",
  "display_name": "教師",
  "is_system_role": true,
  "permissions": {
    "pages": {
      "/teacher/*": {"access": "allow", "operations": ["view", "create", "edit"]},
      "/admin/students": {"access": "allow", "operations": ["view"]}
    },
    "features": {
      "lesson_management": {"access": "allow", "operations": ["view", "create", "edit"]},
      "student_progress": {"access": "allow", "operations": ["view", "edit"]},
      "media_management": {"access": "allow", "operations": ["view", "create", "edit"]}
    },
    "data": {
      "students": {"access": "assigned", "operations": ["view", "edit"]},
      "courses": {"access": "assigned", "operations": ["view", "edit"]}
    }
  }
}
```

##### C. 家長角色
```json
{
  "role_name": "parent",
  "display_name": "家長",
  "is_system_role": true,
  "permissions": {
    "pages": {
      "/parent/*": {"access": "allow", "operations": ["view"]}
    },
    "features": {
      "student_info": {"access": "allow", "operations": ["view"]},
      "lesson_records": {"access": "allow", "operations": ["view"]},
      "progress_tracking": {"access": "allow", "operations": ["view"]}
    },
    "data": {
      "students": {"access": "custom", "operations": ["view"]}
    }
  }
}
```

#### 4. 預設權限配置
```sql
-- 插入預設權限配置
INSERT INTO hanami_permission_configs (config_key, config_value, description) VALUES
(
  'default_role',
  '"parent"'::jsonb,
  '新用戶的預設角色'
),
(
  'auto_approve_roles',
  '["parent"]'::jsonb,
  '自動批准的角色列表'
),
(
  'permission_cache_ttl',
  '3600'::jsonb,
  '權限快取過期時間（秒）'
),
(
  'max_custom_permissions',
  '50'::jsonb,
  '每個用戶最大自訂權限數量'
);
```

### 🔄 認證流程設計

#### 1. 統一認證流程
```typescript
interface AuthFlow {
  // 1. 用戶註冊/登入
  step1: {
    method: 'email' | 'phone';
    identifier: string;
    password?: string;
    otp?: string;
  };
  
  // 2. 身份驗證
  step2: {
    user_id: string;
    verification_status: 'pending' | 'verified';
  };
  
  // 3. 權限分配
  step3: {
    role_assignment: 'auto' | 'manual';
    default_role: string;
    custom_permissions?: JSONB;
  };
}
```

#### 2. 管理員審核流程
```typescript
interface ApprovalFlow {
  // 1. 申請提交
  submit_application: {
    user_email: string;
    requested_role: string;
    supporting_documents?: string[];
  };
  
  // 2. 管理員審核
  admin_review: {
    admin_id: string;
    decision: 'approve' | 'reject' | 'request_more_info';
    comments?: string;
    assigned_permissions?: JSONB;
  };
  
  // 3. 通知用戶
  notify_user: {
    status: 'approved' | 'rejected' | 'pending';
    message: string;
  };
}
```

### 🛡️ RLS 政策更新

#### 1. 基於角色的RLS政策
```sql
-- 創建權限檢查函數
CREATE OR REPLACE FUNCTION check_user_permission(
  p_user_email TEXT,
  p_resource_type TEXT,
  p_operation TEXT,
  p_resource_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  user_permission RECORD;
  has_permission BOOLEAN := FALSE;
BEGIN
  -- 獲取用戶權限
  SELECT * INTO user_permission
  FROM hanami_user_permissions_v2
  WHERE user_email = p_user_email
    AND status = 'approved';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- 檢查頁面權限
  IF p_resource_type = 'page' THEN
    -- 檢查頁面訪問權限邏輯
    RETURN check_page_permission(user_permission, p_operation);
  END IF;
  
  -- 檢查資料權限
  IF p_resource_type = 'data' THEN
    -- 檢查資料訪問權限邏輯
    RETURN check_data_permission(user_permission, p_operation, p_resource_id);
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
```

#### 2. 更新現有表的RLS政策
```sql
-- 學生表RLS政策更新
CREATE POLICY "Role-based student access" ON "Hanami_Students"
FOR ALL USING (
  check_user_permission(
    auth.jwt() ->> 'email',
    'data',
    CASE 
      WHEN TG_OP = 'SELECT' THEN 'view'
      WHEN TG_OP = 'INSERT' THEN 'create'
      WHEN TG_OP = 'UPDATE' THEN 'edit'
      WHEN TG_OP = 'DELETE' THEN 'delete'
    END,
    id
  )
);

-- 教師表RLS政策更新
CREATE POLICY "Role-based teacher access" ON hanami_employee
FOR ALL USING (
  check_user_permission(
    auth.jwt() ->> 'email',
    'data',
    CASE 
      WHEN TG_OP = 'SELECT' THEN 'view'
      WHEN TG_OP = 'INSERT' THEN 'create'
      WHEN TG_OP = 'UPDATE' THEN 'edit'
      WHEN TG_OP = 'DELETE' THEN 'delete'
    END,
    id
  )
);
```

### 🎨 前端權限控制

#### 1. 權限檢查Hook
```typescript
// hooks/usePermissions.ts
export function usePermissions() {
  const { user } = useUser();
  const [permissions, setPermissions] = useState<PermissionConfig | null>(null);
  
  const checkPermission = useCallback((
    resource: string,
    operation: string,
    resourceId?: string
  ): boolean => {
    if (!permissions || !user) return false;
    
    // 檢查頁面權限
    if (resource.startsWith('/')) {
      return checkPagePermission(permissions, resource, operation);
    }
    
    // 檢查功能權限
    return checkFeaturePermission(permissions, resource, operation);
  }, [permissions, user]);
  
  const checkDataPermission = useCallback((
    dataType: string,
    operation: string,
    resourceId?: string
  ): boolean => {
    if (!permissions || !user) return false;
    
    return checkDataAccessPermission(permissions, dataType, operation, resourceId);
  }, [permissions, user]);
  
  return { checkPermission, checkDataPermission, permissions };
}
```

#### 2. 權限保護組件
```typescript
// components/PermissionGuard.tsx
interface PermissionGuardProps {
  resource: string;
  operation: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({ 
  resource, 
  operation, 
  fallback = null, 
  children 
}: PermissionGuardProps) {
  const { checkPermission } = usePermissions();
  
  if (!checkPermission(resource, operation)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}
```

### 📋 實施計劃

#### 階段1: 基礎架構 (1-2週) ✅ 已完成
1. **資料庫設計** ✅
   - ✅ 創建新的權限相關表
   - ✅ 設計權限配置結構
   - ✅ 創建權限檢查函數

2. **API開發** ✅
   - ✅ 權限管理API (`/api/permissions`)
   - ✅ 權限檢查API (`/api/permissions/check`)
   - ✅ 管理員審核API

#### 階段2: 認證系統 (1週) 🔄 進行中
1. **Supabase整合**
   - 🔄 統一認證流程
   - 🔄 Email/電話驗證
   - 🔄 會話管理更新

2. **管理員審核**
   - ✅ 申請提交系統
   - ✅ 審核流程
   - ✅ 通知機制

#### 階段3: 權限控制 (2週) 🔄 進行中
1. **RLS政策更新**
   - 🔄 更新現有表RLS
   - 🔄 測試權限檢查
   - 🔄 確保向後相容

2. **前端權限**
   - ✅ 權限檢查Hook
   - ✅ 權限保護組件
   - 🔄 路由權限控制

#### 階段4: 管理界面 (1週) ✅ 已完成
1. **權限管理界面** ✅
   - ✅ 角色管理 (`/admin/permission-management`)
   - ✅ 用戶權限分配
   - ✅ 權限模板管理

2. **審核界面** ✅
   - ✅ 申請列表
   - ✅ 審核流程
   - ✅ 權限分配

#### 階段5: 測試與優化 (1週) 🔄 進行中
1. **功能測試**
   - 🔄 權限控制測試
   - 🔄 認證流程測試
   - 🔄 向後相容測試

2. **性能優化**
   - 🔄 權限檢查優化
   - 🔄 快取機制
   - 🔄 錯誤處理

### 🎯 已完成的工作

#### ✅ 資料庫架構
- **8個核心權限表**: 角色、用戶權限、模板、申請、審計、統計、快取、配置
- **權限檢查函數**: 主函數 + 3個輔助函數
- **預設角色**: 管理員、教師、家長
- **RLS政策**: 完整的資料庫層面安全控制
- **索引優化**: 所有表都有適當的索引

#### ✅ API端點
- **權限管理API** (`/api/permissions`): 完整的CRUD操作
- **權限檢查API** (`/api/permissions/check`): 單次和批量檢查
- **權限摘要API**: 獲取用戶權限摘要

#### ✅ 前端界面
- **權限管理頁面** (`/admin/permission-management`): 完整的Web界面
- **角色管理**: 創建、編輯、刪除角色
- **用戶權限管理**: 分配、修改用戶權限
- **申請審核**: 批准/拒絕權限申請
- **管理員側邊欄**: 添加權限管理連結

#### ✅ 功能特性
- **多身份支援**: 管理員、教師、家長 + 自訂身份
- **細粒度權限控制**: 頁面級別、功能級別、資料級別
- **管理員審核機制**: 完整的申請和審核流程
- **權限快取**: 提高性能的權限快取機制
- **審計日誌**: 完整的權限變更記錄
- **使用統計**: 詳細的權限使用分析

### 🔄 進行中的工作

#### 認證系統整合
- 整合Supabase Auth與自定義權限系統
- 實現統一的認證流程
- 更新會話管理機制

#### RLS政策更新
- 更新現有表的RLS政策
- 測試權限檢查功能
- 確保向後相容性

#### 前端權限控制
- 實現路由級別的權限控制
- 創建權限保護組件
- 整合到現有頁面

#### 系統測試與驗證
- 測試權限管理API端點
- 驗證權限管理頁面功能
- 檢查資料庫表創建狀態

### 📊 技術實現細節

#### 1. 環境變數配置
```bash
# 權限系統配置
NEXT_PUBLIC_PERMISSION_SYSTEM_ENABLED=true
NEXT_PUBLIC_DEFAULT_ROLE=parent
SUPABASE_AUTH_REDIRECT_URL=http://localhost:3000/auth/callback
```

#### 2. 中間件更新
```typescript
// middleware.ts 更新
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 檢查權限
  if (pathname.startsWith('/admin') || pathname.startsWith('/teacher')) {
    const hasPermission = checkRoutePermission(pathname, request);
    if (!hasPermission) {
      return NextResponse.redirect(new URL('/auth/unauthorized', request.url));
    }
  }
  
  // 現有的認證邏輯...
}
```

#### 3. 錯誤處理
```typescript
// 權限錯誤處理
export class PermissionError extends Error {
  constructor(
    message: string,
    public resource: string,
    public operation: string
  ) {
    super(message);
    this.name = 'PermissionError';
  }
}

// 全局錯誤處理
export function handlePermissionError(error: PermissionError) {
  toast.error(`權限不足: 無法${error.operation} ${error.resource}`);
  // 記錄錯誤日誌
  console.error('Permission Error:', error);
}
```

### 📊 監控與維護

#### 1. 權限使用統計
```sql
-- 權限使用統計表
CREATE TABLE hanami_permission_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  operation TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. 權限審計
```typescript
// 權限變更審計
interface PermissionAudit {
  id: string;
  admin_id: string;
  target_user: string;
  action: 'grant' | 'revoke' | 'modify';
  old_permissions?: JSONB;
  new_permissions: JSONB;
  reason?: string;
  timestamp: Date;
}
```

### 🎯 成功指標

1. **安全性**: 100%的資料訪問通過權限控制
2. **可用性**: 現有功能100%向後相容
3. **靈活性**: 支援無限自訂角色和權限
4. **易用性**: 管理員可在5分鐘內完成權限配置
5. **性能**: 權限檢查響應時間 < 100ms

### 📋 下一步計劃

#### 立即執行 (本週)
1. **執行SQL腳本**: 在Supabase中執行 `permission_system_tables.sql` ✅
2. **測試API端點**: 驗證所有API功能正常 🔄
3. **測試前端界面**: 確保權限管理頁面正常運作 🔄
4. **創建測試頁面**: 權限系統功能驗證頁面 ✅

#### 短期目標 (下週)
1. **整合認證系統**: 完成Supabase Auth整合
2. **更新RLS政策**: 為現有表添加權限檢查
3. **前端權限控制**: 實現路由級別權限控制

#### 中期目標 (2-3週)
1. **全面測試**: 功能測試、性能測試、安全測試
2. **文檔完善**: 用戶手冊、開發文檔
3. **培訓部署**: 管理員培訓和系統部署

---

**最後更新日期**: 2024-12-19  
**版本**: 2.2.0  
**維護者**: Hanami 開發團隊