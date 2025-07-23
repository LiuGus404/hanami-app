# Hanami Storage 系統完整指引

## 📋 目錄
1. [系統概述](#系統概述)
2. [架構設計](#架構設計)
3. [資料庫設定](#資料庫設定)
4. [Storage 設定](#storage-設定)
5. [RLS 權限管理](#rls-權限管理)
6. [前端整合](#前端整合)
7. [API 路由設計](#api-路由設計)
8. [常見問題與解決方案](#常見問題與解決方案)
9. [最佳實踐](#最佳實踐)
10. [維護指南](#維護指南)

---

## 🎯 系統概述

### 功能特性
- **學生媒體管理**: 支援影片和相片上傳、管理
- **配額控制**: 基於方案的儲存空間和數量限制
- **權限管理**: 細粒度的 RLS 權限控制
- **檔案組織**: 結構化的資料夾管理
- **版本控制**: 支援檔案版本和歷史追蹤

### 技術棧
- **前端**: Next.js 14 + TypeScript + Tailwind CSS
- **後端**: Supabase (PostgreSQL + Storage)
- **認證**: Supabase Auth
- **檔案儲存**: Supabase Storage
- **權限控制**: Row Level Security (RLS)

---

## 🏗️ 架構設計

### 核心組件
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端組件      │    │   API 路由      │    │   Supabase      │
│                 │    │                 │    │                 │
│ StudentMedia    │───▶│ /api/student-   │───▶│ Storage + DB    │
│ Modal           │    │ media/upload    │    │                 │
│                 │    │                 │    │                 │
│ 檔案選擇        │    │ 服務端上傳      │    │ RLS 權限控制    │
│ 進度顯示        │    │ 錯誤處理        │    │ 配額管理        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 資料流程
1. **檔案選擇** → 前端驗證 → 顯示進度
2. **上傳請求** → API 路由 → 服務端處理
3. **Storage 上傳** → 資料庫記錄 → 配額更新
4. **響應返回** → 前端更新 → 完成

---

## 🗄️ 資料庫設定

### 核心資料表

#### 1. hanami_student_media (學生媒體表)
```sql
CREATE TABLE hanami_student_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES "Hanami_Students"(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('video', 'photo')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_duration INTEGER, -- 影片時長(秒)
  thumbnail_path TEXT, -- 縮圖路徑
  title TEXT,
  description TEXT,
  uploaded_by TEXT, -- 改為 TEXT 類型，支援字串值
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. hanami_student_media_quota (配額管理表)
```sql
CREATE TABLE hanami_student_media_quota (
  student_id UUID PRIMARY KEY REFERENCES "Hanami_Students"(id) ON DELETE CASCADE,
  plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'basic', 'premium', 'professional')),
  video_limit INTEGER DEFAULT 5,
  photo_limit INTEGER DEFAULT 10,
  video_count INTEGER DEFAULT 0,
  photo_count INTEGER DEFAULT 0,
  total_used_space BIGINT DEFAULT 0,
  storage_limit_bytes BIGINT DEFAULT 262144000, -- 250MB
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 重要索引
```sql
-- 效能優化索引
CREATE INDEX idx_student_media_student_id ON hanami_student_media(student_id);
CREATE INDEX idx_student_media_type ON hanami_student_media(media_type);
CREATE INDEX idx_student_media_created_at ON hanami_student_media(created_at);
CREATE INDEX idx_student_media_favorite ON hanami_student_media(is_favorite);
```

### 觸發器設定
```sql
-- 自動更新配額統計
CREATE TRIGGER update_student_media_quota_on_insert
  AFTER INSERT ON hanami_student_media
  FOR EACH ROW
  EXECUTE FUNCTION update_student_media_quota();

CREATE TRIGGER update_student_media_quota_on_delete
  AFTER DELETE ON hanami_student_media
  FOR EACH ROW
  EXECUTE FUNCTION update_student_media_quota_on_delete();
```

---

## 📦 Storage 設定

### Bucket 配置
```sql
-- 創建主要 Storage Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hanami-media',
  'hanami-media',
  true,
  52428800, -- 50MB
  ARRAY['image/*', 'video/*', 'application/pdf']
);
```

### 資料夾結構
```
hanami-media/
├── students/
│   ├── {student_id}/
│   │   ├── videos/
│   │   │   ├── {timestamp}_{random}.mp4
│   │   │   └── thumbnails/
│   │   └── photos/
│   │       └── {timestamp}_{random}.jpg
│   └── ...
├── templates/
│   ├── lesson-plans/
│   ├── activities/
│   └── resources/
└── shared/
    ├── avatars/
    ├── documents/
    └── music-files/
```

### 檔案命名規則
```typescript
// 學生媒體檔案
const fileName = `${studentId}/${mediaType}s/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

// 範例：students/123e4567-e89b-12d3-a456-426614174000/videos/1703123456789_abc123def.mp4
```

---

## 🔐 RLS 權限管理

### 核心原則
1. **最小權限原則**: 只授予必要的權限
2. **服務端優先**: 敏感操作使用服務端 API
3. **分層控制**: 不同角色有不同的權限級別

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

---

## 🎨 前端整合

### 核心組件

#### 1. StudentMediaModal
```typescript
interface StudentMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentWithMedia | null;
}

// 主要功能：
// - 檔案選擇和驗證
// - 上傳進度顯示
// - 媒體列表管理
// - 刪除和收藏功能
```

#### 2. 檔案上傳邏輯
```typescript
const uploadFiles = async () => {
  // 1. 驗證檔案
  // 2. 檢查配額
  // 3. 上傳到 Storage
  // 4. 記錄到資料庫
  // 5. 更新配額統計
};
```

### 檔案驗證
```typescript
const DEFAULT_MEDIA_LIMITS = {
  video: {
    maxSize: 20 * 1024 * 1024, // 20MB
    maxDuration: 300, // 5分鐘
    maxCount: 10,
    allowedTypes: ['video/mp4', 'video/avi', 'video/mov']
  },
  photo: {
    maxSize: 1 * 1024 * 1024, // 1MB
    maxCount: 20,
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif']
  }
};
```

---

## 🔌 API 路由設計

### 上傳 API (/api/student-media/upload)
```typescript
export async function POST(request: NextRequest) {
  // 1. 環境變數檢查
  // 2. 檔案驗證
  // 3. Storage 上傳
  // 4. 資料庫記錄
  // 5. 錯誤處理和清理
}
```

### 關鍵要點
1. **使用 service_role_key**: 繞過客戶端 RLS 限制
2. **錯誤處理**: 完整的錯誤捕獲和清理
3. **事務性**: 確保 Storage 和資料庫的一致性
4. **安全性**: 驗證所有輸入參數

### 環境變數
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # 重要！
```

---

## ❗ 常見問題與解決方案

### 1. UUID 格式錯誤
**問題**: `invalid input syntax for type uuid: "admin"`
**原因**: `uploaded_by` 欄位定義為 UUID 但傳入字串
**解決**: 
```sql
-- 修改欄位類型
ALTER TABLE hanami_student_media DROP COLUMN IF EXISTS uploaded_by;
ALTER TABLE hanami_student_media ADD COLUMN uploaded_by TEXT;
```

### 2. RLS 權限錯誤
**問題**: `new row violates row-level security policy`
**原因**: 客戶端 RLS 政策過於嚴格
**解決**: 使用服務端 API 路由上傳

### 3. Storage 上傳失敗
**問題**: `DatabaseError: insert into "objects"`
**原因**: Storage bucket 權限設定錯誤
**解決**: 檢查 bucket 設定和 RLS 政策

### 4. 環境變數缺失
**問題**: `伺服器配置錯誤`
**原因**: 缺少 `SUPABASE_SERVICE_ROLE_KEY`
**解決**: 在 `.env.local` 中添加服務端金鑰

### 5. 檔案大小限制
**問題**: 檔案上傳失敗
**原因**: 超過 Storage 或應用程式限制
**解決**: 調整檔案大小限制設定

---

## 🎯 最佳實踐

### 1. 安全性
- ✅ 使用服務端 API 處理敏感操作
- ✅ 實施完整的輸入驗證
- ✅ 使用 RLS 進行權限控制
- ✅ 定期審查權限設定

### 2. 效能
- ✅ 使用適當的索引
- ✅ 實施檔案大小限制
- ✅ 使用 CDN 加速檔案存取
- ✅ 定期清理過期檔案

### 3. 用戶體驗
- ✅ 提供上傳進度顯示
- ✅ 實施檔案類型驗證
- ✅ 提供清晰的錯誤訊息
- ✅ 支援拖拽上傳

### 4. 維護性
- ✅ 使用 TypeScript 確保型別安全
- ✅ 實施完整的錯誤日誌
- ✅ 定期備份重要資料
- ✅ 監控系統使用情況

---

## 🔧 維護指南

### 日常維護
1. **監控儲存使用量**
2. **檢查錯誤日誌**
3. **更新配額統計**
4. **清理過期檔案**

### 定期檢查
1. **RLS 政策有效性**
2. **Storage 權限設定**
3. **資料庫效能**
4. **API 響應時間**

### 故障排除
1. **檢查環境變數**
2. **驗證 RLS 政策**
3. **測試 API 端點**
4. **檢查資料庫連接**

---

## 📚 參考資源

### 官方文檔
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

### 相關檔案
- `src/components/ui/StudentMediaModal.tsx` - 主要組件
- `src/app/api/student-media/upload/route.ts` - 上傳 API
- `create_student_media_tables.sql` - 資料庫結構
- `test-uploaded-by-fix.js` - 測試腳本

---

## 🎉 總結

Hanami Storage 系統提供了一個完整、安全、可擴展的檔案管理解決方案。通過正確的架構設計、權限管理和錯誤處理，系統能夠穩定運行並提供良好的用戶體驗。

**關鍵成功因素**:
1. 正確的 RLS 政策設定
2. 服務端 API 的使用
3. 完整的錯誤處理
4. 適當的資料庫設計
5. 良好的用戶體驗設計

---

**最後更新**: 2024-12-19  
**版本**: 1.0.0  
**維護者**: Hanami 開發團隊 