# Hanami Web 權限系統架構文檔

## 📋 系統概述

Hanami Web 採用了一套完整的多層次權限管理系統，結合了 Supabase RLS (Row Level Security) 和自定義權限管理，提供細粒度的訪問控制。

### 🎯 設計目標

1. **多身份支援**: 管理員、教師、家長 + 自訂身份
2. **細粒度權限控制**: 頁面級別、功能級別、資料級別
3. **Supabase整合**: 基於email/電話的統一認證
4. **管理員審核機制**: 身份驗證和權限分配
5. **RLS安全整合**: 確保資料庫層面的安全性
6. **向後相容**: 保持現有功能不受影響

---

## 🗄️ Supabase 資料庫架構

### 核心權限表

#### 1. hanami_roles (身份角色表)
```sql
CREATE TABLE hanami_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL UNIQUE,           -- 'admin', 'teacher', 'parent', 'custom_role_1'
  display_name TEXT NOT NULL,               -- '管理員', '教師', '家長', '自訂角色1'
  description TEXT,
  is_system_role BOOLEAN DEFAULT false,     -- 系統預設角色
  permissions JSONB NOT NULL,               -- 權限配置
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. hanami_user_permissions_v2 (用戶權限表)
```sql
CREATE TABLE hanami_user_permissions_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  user_phone TEXT,
  role_id UUID REFERENCES hanami_roles(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  approved_by UUID REFERENCES hanami_admin(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  custom_permissions JSONB,                 -- 額外的自訂權限
  student_access_list UUID[],               -- 可訪問的學生ID列表
  page_access_list TEXT[],                  -- 可訪問的頁面列表
  feature_access_list TEXT[],               -- 可訪問的功能列表
  data_access_config JSONB,                 -- 資料訪問配置
  expires_at TIMESTAMP WITH TIME ZONE,      -- 權限過期時間
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. hanami_permission_templates (權限模板表)
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

#### 4. hanami_permission_applications (權限申請表)
```sql
CREATE TABLE hanami_permission_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_email TEXT NOT NULL,
  applicant_phone TEXT,
  requested_role_id UUID REFERENCES hanami_roles(id) NOT NULL,
  application_type TEXT NOT NULL CHECK (application_type IN ('new_user', 'role_change', 'permission_extension')),
  current_role_id UUID REFERENCES hanami_roles(id),
  reason TEXT NOT NULL,
  supporting_documents JSONB,               -- 支援文件資訊
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'cancelled')),
  reviewed_by UUID REFERENCES hanami_admin(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  approved_permissions JSONB,               -- 最終批准的權限
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 5. hanami_permission_audit_logs (權限審計日誌表)
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

#### 6. hanami_permission_usage_stats (權限使用統計表)
```sql
CREATE TABLE hanami_permission_usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  resource_type TEXT NOT NULL,              -- 'page', 'feature', 'data'
  resource_id TEXT,
  operation TEXT NOT NULL,                  -- 'view', 'create', 'edit', 'delete'
  success BOOLEAN NOT NULL,
  error_message TEXT,
  response_time_ms INTEGER,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 7. registration_requests (註冊申請表)
```sql
CREATE TABLE registration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  additional_info JSONB,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES hanami_admin(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 權限檢查函數

#### 主權限檢查函數
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
  
  -- 檢查權限邏輯
  has_permission := check_permission_logic(user_permission, role_permission, p_resource_type, p_operation, p_resource_id);
  
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

---

## 🔌 API 架構

### 權限管理 API (`/api/permissions`)

#### GET 端點
```typescript
// 獲取角色列表
GET /api/permissions?type=roles

// 獲取用戶權限
GET /api/permissions?type=user_permissions&user_email=user@example.com

// 獲取權限模板
GET /api/permissions?type=templates

// 獲取權限申請
GET /api/permissions?type=applications

// 獲取審計日誌
GET /api/permissions?type=audit_logs

// 獲取使用統計
GET /api/permissions?type=usage_stats
```

#### POST 端點
```typescript
// 創建角色
POST /api/permissions
{
  "action": "create_role",
  "data": {
    "role_name": "custom_role",
    "display_name": "自訂角色",
    "description": "自訂角色描述",
    "permissions": { ... }
  }
}

// 創建用戶權限
POST /api/permissions
{
  "action": "create_user_permission",
  "data": {
    "user_email": "user@example.com",
    "role_id": "role-uuid",
    "custom_permissions": { ... }
  }
}

// 提交權限申請
POST /api/permissions
{
  "action": "submit_application",
  "data": {
    "applicant_email": "user@example.com",
    "requested_role_id": "role-uuid",
    "reason": "申請原因"
  }
}

// 批准申請
POST /api/permissions
{
  "action": "approve_application",
  "data": {
    "id": "application-uuid",
    "approved_by": "admin-uuid",
    "review_notes": "批准原因",
    "approved_permissions": { ... }
  }
}
```

#### DELETE 端點
```typescript
// 刪除角色
DELETE /api/permissions?type=role&id=role-uuid

// 刪除用戶權限
DELETE /api/permissions?type=user_permission&id=permission-uuid

// 刪除權限模板
DELETE /api/permissions?type=template&id=template-uuid

// 刪除權限申請
DELETE /api/permissions?type=application&id=application-uuid
```

### 權限檢查 API (`/api/permissions/check`)

#### POST 端點 - 單次權限檢查
```typescript
POST /api/permissions/check
{
  "user_email": "user@example.com",
  "resource_type": "page",
  "operation": "view",
  "resource_id": "/admin/students"
}

// 回應
{
  "success": true,
  "has_permission": true,
  "user_email": "user@example.com",
  "resource_type": "page",
  "operation": "view",
  "resource_id": "/admin/students"
}
```

#### PUT 端點 - 批量權限檢查
```typescript
PUT /api/permissions/check
{
  "user_email": "user@example.com",
  "permissions": [
    {
      "resource_type": "page",
      "operation": "view",
      "resource_id": "/admin/students"
    },
    {
      "resource_type": "feature",
      "operation": "create",
      "resource_id": "student_management"
    }
  ]
}

// 回應
{
  "success": true,
  "user_email": "user@example.com",
  "results": [
    {
      "resource_type": "page",
      "operation": "view",
      "resource_id": "/admin/students",
      "has_permission": true,
      "error": null
    },
    {
      "resource_type": "feature",
      "operation": "create",
      "resource_id": "student_management",
      "has_permission": false,
      "error": null
    }
  ]
}
```

#### GET 端點 - 權限摘要
```typescript
GET /api/permissions/check?user_email=user@example.com

// 回應
{
  "success": true,
  "data": {
    "user_email": "user@example.com",
    "role": {
      "name": "teacher",
      "display_name": "教師",
      "permissions": { ... }
    },
    "custom_permissions": { ... },
    "student_access_list": ["student-uuid-1", "student-uuid-2"],
    "page_access_list": ["/teacher/*", "/admin/students"],
    "feature_access_list": ["lesson_management", "student_progress"],
    "data_access_config": { ... },
    "expires_at": "2024-12-31T23:59:59Z",
    "recent_usage": [ ... ],
    "total_permissions": {
      "pages": 5,
      "features": 8,
      "data_types": 3
    }
  }
}
```

### 註冊申請 API (`/api/registration-requests`)

#### GET 端點
```typescript
GET /api/registration-requests

// 回應
{
  "data": [
    {
      "id": "request-uuid",
      "email": "user@example.com",
      "full_name": "用戶姓名",
      "phone": "123456789",
      "role": "teacher",
      "status": "pending",
      "additional_info": { ... },
      "created_at": "2024-12-19T10:00:00Z"
    }
  ],
  "count": 1,
  "timestamp": "2024-12-19T10:00:00Z"
}
```

#### POST 端點
```typescript
POST /api/registration-requests
{
  "email": "user@example.com",
  "full_name": "用戶姓名",
  "phone": "123456789",
  "role": "teacher",
  "additional_info": {
    "experience": "5年教學經驗",
    "specialization": "鋼琴教學"
  }
}
```

#### PUT 端點
```typescript
PUT /api/registration-requests
{
  "id": "request-uuid",
  "status": "approved",
  "reviewed_at": "2024-12-19T10:00:00Z",
  "reviewed_by": "admin-uuid",
  "rejection_reason": null
}
```

#### DELETE 端點
```typescript
DELETE /api/registration-requests?id=request-uuid
```

---

## 🎨 前端組件架構

### PermissionGuard 組件

#### 核心權限保護組件
```typescript
interface PermissionGuardProps {
  user_email?: string;
  resource_type: 'page' | 'feature' | 'data';
  operation: 'view' | 'create' | 'edit' | 'delete';
  resource_id?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  onPermissionDenied?: () => void;
}

export function PermissionGuard({
  user_email,
  resource_type,
  operation,
  resource_id,
  fallback = <div className="text-center p-4 text-gray-500">您沒有權限訪問此內容</div>,
  children,
  loadingComponent = <div className="text-center p-4">載入中...</div>,
  onPermissionDenied,
}: PermissionGuardProps)
```

#### 頁面權限保護組件
```typescript
interface PagePermissionGuardProps {
  user_email?: string;
  page_path: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

export function PagePermissionGuard({
  user_email,
  page_path,
  fallback,
  children,
  loadingComponent,
}: PagePermissionGuardProps)
```

#### 功能權限保護組件
```typescript
interface FeaturePermissionGuardProps {
  user_email?: string;
  feature_name: string;
  operation?: 'view' | 'create' | 'edit' | 'delete';
  fallback?: React.ReactNode;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

export function FeaturePermissionGuard({
  user_email,
  feature_name,
  operation = 'view',
  fallback,
  children,
  loadingComponent,
}: FeaturePermissionGuardProps)
```

#### 資料權限保護組件
```typescript
interface DataPermissionGuardProps {
  user_email?: string;
  data_type: string;
  operation?: 'view' | 'create' | 'edit' | 'delete';
  resource_id?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

export function DataPermissionGuard({
  user_email,
  data_type,
  operation = 'view',
  resource_id,
  fallback,
  children,
  loadingComponent,
}: DataPermissionGuardProps)
```

### 使用範例

#### 頁面級別權限控制
```typescript
import { PagePermissionGuard } from '@/components/PermissionGuard';

function AdminStudentsPage() {
  const { user } = useUser();
  
  return (
    <PagePermissionGuard
      user_email={user?.email}
      page_path="/admin/students"
      fallback={<div>您沒有權限訪問學生管理頁面</div>}
    >
      <StudentManagementPanel />
    </PagePermissionGuard>
  );
}
```

#### 功能級別權限控制
```typescript
import { FeaturePermissionGuard } from '@/components/PermissionGuard';

function StudentActions() {
  const { user } = useUser();
  
  return (
    <div>
      <FeaturePermissionGuard
        user_email={user?.email}
        feature_name="student_management"
        operation="create"
        fallback={<button disabled>新增學生</button>}
      >
        <button onClick={handleAddStudent}>新增學生</button>
      </FeaturePermissionGuard>
      
      <FeaturePermissionGuard
        user_email={user?.email}
        feature_name="student_management"
        operation="edit"
        fallback={<button disabled>編輯學生</button>}
      >
        <button onClick={handleEditStudent}>編輯學生</button>
      </FeaturePermissionGuard>
    </div>
  );
}
```

#### 資料級別權限控制
```typescript
import { DataPermissionGuard } from '@/components/PermissionGuard';

function StudentData({ studentId }: { studentId: string }) {
  const { user } = useUser();
  
  return (
    <DataPermissionGuard
      user_email={user?.email}
      data_type="students"
      operation="view"
      resource_id={studentId}
      fallback={<div>您沒有權限查看此學生資料</div>}
    >
      <StudentProfile studentId={studentId} />
    </DataPermissionGuard>
  );
}
```

---

## 🛡️ RLS (Row Level Security) 架構

### 當前 RLS 狀態

根據 `background.md` 的分析，當前系統的 RLS 狀態如下：

#### 📊 統計概覽
- **總表數**: 52個表
- **已啟用RLS**: 18個表 (34.6%)
- **已停用RLS**: 34個表 (65.4%)
- **正常運作**: 15個表 (28.8%)
- **啟用但無政策**: 3個表 (5.8%)
- **停用但有政策**: 19個表 (36.5%)

#### 🔍 詳細狀態分類

##### ✅ 正常運作的表 (15個)
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
- `hanami_group_chat` - 群組聊天
- `model_status` - 模型狀態
- `system_update_log` - 系統更新日誌

##### ❌ 停用但有政策的表 (19個)
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

### 建議的 RLS 政策

#### 基於權限系統的 RLS 政策
```sql
-- 學生表 RLS 政策
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
    id::TEXT
  )
);

-- 教師表 RLS 政策
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
    id::TEXT
  )
);

-- 課程記錄表 RLS 政策
CREATE POLICY "Role-based lesson access" ON hanami_student_lesson
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
    id::TEXT
  )
);
```

---

## 🔧 權限工具函數

### permissionUtils.ts

#### 核心權限檢查函數
```typescript
export interface PermissionCheck {
  user_email: string;
  resource_type: 'page' | 'feature' | 'data';
  operation: 'view' | 'create' | 'edit' | 'delete';
  resource_id?: string;
}

export interface PermissionResult {
  has_permission: boolean;
  role_name?: string;
  status?: string;
  message?: string;
}

// 權限檢查函數
export async function checkPermission(check: PermissionCheck): Promise<PermissionResult>

// 批量權限檢查
export async function checkMultiplePermissions(checks: PermissionCheck[]): Promise<PermissionResult[]>

// 獲取用戶權限摘要
export async function getUserPermissionSummary(user_email: string)

// 檢查頁面訪問權限
export async function checkPagePermission(user_email: string, page_path: string): Promise<boolean>

// 檢查功能訪問權限
export async function checkFeaturePermission(user_email: string, feature_name: string, operation?: 'view' | 'create' | 'edit' | 'delete'): Promise<boolean>

// 檢查資料訪問權限
export async function checkDataPermission(user_email: string, data_type: string, operation?: 'view' | 'create' | 'edit' | 'delete', resource_id?: string): Promise<boolean>
```

#### 權限常量
```typescript
export const PERMISSIONS = {
  // 頁面權限
  PAGES: {
    ADMIN_DASHBOARD: '/admin',
    STUDENT_MANAGEMENT: '/admin/students',
    TEACHER_MANAGEMENT: '/admin/teachers',
    PERMISSION_MANAGEMENT: '/admin/permission-management',
    AI_HUB: '/admin/ai-hub',
    STUDENT_PROGRESS: '/admin/student-progress',
    RESOURCE_LIBRARY: '/admin/resource-library',
    TEACHER_DASHBOARD: '/teacher/dashboard',
    PARENT_DASHBOARD: '/parent/dashboard',
  },
  
  // 功能權限
  FEATURES: {
    USER_MANAGEMENT: 'user_management',
    PERMISSION_MANAGEMENT: 'permission_management',
    STUDENT_MANAGEMENT: 'student_management',
    TEACHER_MANAGEMENT: 'teacher_management',
    COURSE_MANAGEMENT: 'course_management',
    AI_TOOLS: 'ai_tools',
    LESSON_MANAGEMENT: 'lesson_management',
    STUDENT_PROGRESS: 'student_progress',
    MEDIA_MANAGEMENT: 'media_management',
    DATA_EXPORT: 'data_export',
    FINANCIAL_DATA: 'financial_data',
  },
  
  // 資料權限
  DATA: {
    STUDENTS: 'students',
    TEACHERS: 'teachers',
    COURSES: 'courses',
    LESSONS: 'lessons',
    MEDIA: 'media',
    PROGRESS: 'progress',
  },
} as const;
```

#### 權限檢查工具函數
```typescript
export const PermissionUtils = {
  // 檢查是否為管理員
  isAdmin: (role_name?: string): boolean => {
    return role_name === '管理員' || role_name === 'admin';
  },

  // 檢查是否為教師
  isTeacher: (role_name?: string): boolean => {
    return role_name === '教師' || role_name === 'teacher';
  },

  // 檢查是否為家長
  isParent: (role_name?: string): boolean => {
    return role_name === '家長' || role_name === 'parent';
  },

  // 檢查權限狀態
  isApproved: (status?: string): boolean => {
    return status === 'approved';
  },

  // 檢查是否為系統角色
  isSystemRole: (role_name?: string): boolean => {
    return ['管理員', '教師', '家長', 'admin', 'teacher', 'parent'].includes(role_name || '');
  },
};
```

---

## 📋 預設角色配置

### 管理員角色
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

### 教師角色
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

### 家長角色
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

---

## 🔄 認證流程

### 統一認證流程
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

### 管理員審核流程
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

---

## 📊 監控與維護

### 權限使用統計
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

### 權限審計
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

---

## 🎯 成功指標

1. **安全性**: 100%的資料訪問通過權限控制
2. **可用性**: 現有功能100%向後相容
3. **靈活性**: 支援無限自訂角色和權限
4. **易用性**: 管理員可在5分鐘內完成權限配置
5. **性能**: 權限檢查響應時間 < 100ms

---

## 📋 下一步計劃

### 立即執行 (本週)
1. **執行SQL腳本**: 在Supabase中執行權限系統表創建腳本 ✅
2. **測試API端點**: 驗證所有API功能正常 🔄
3. **測試前端界面**: 確保權限管理頁面正常運作 🔄
4. **創建測試頁面**: 權限系統功能驗證頁面 ✅

### 短期目標 (下週)
1. **整合認證系統**: 完成Supabase Auth整合
2. **更新RLS政策**: 為現有表添加權限檢查
3. **前端權限控制**: 實現路由級別權限控制

### 中期目標 (2-3週)
1. **全面測試**: 功能測試、性能測試、安全測試
2. **文檔完善**: 用戶手冊、開發文檔
3. **培訓部署**: 管理員培訓和系統部署

---

**最後更新日期**: 2024-12-19  
**版本**: 2.2.0  
**維護者**: Hanami 開發團隊 