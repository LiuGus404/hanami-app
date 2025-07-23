# Hanami Storage 問題解決流程圖

## 🔍 問題診斷流程

```
開始
  ↓
檔案上傳失敗？
  ↓
檢查控制台錯誤訊息
  ↓
┌─────────────────────────────────────┐
│ 錯誤類型判斷                        │
├─────────────────────────────────────┤
│ 1. UUID 格式錯誤 (22P02)            │
│ 2. RLS 權限錯誤 (42501)             │
│ 3. Storage 上傳失敗                 │
│ 4. 環境變數缺失                     │
│ 5. 其他錯誤                         │
└─────────────────────────────────────┘
  ↓
根據錯誤類型選擇解決方案
```

## 🛠️ 解決方案分支

### 分支 1: UUID 格式錯誤 (22P02)
```
錯誤: invalid input syntax for type uuid: "admin"
  ↓
檢查 uploaded_by 欄位類型
  ↓
是 UUID 類型？
  ↓
┌─────────┐    ┌─────────┐
│   是    │    │   否    │
└─────────┘    └─────────┘
  ↓              ↓
執行修復腳本    檢查其他欄位
  ↓              ↓
ALTER TABLE     檢查 student_id
hanami_student_media 
DROP COLUMN uploaded_by;
ALTER TABLE 
hanami_student_media 
ADD COLUMN uploaded_by TEXT;
  ↓
重新測試上傳
```

### 分支 2: RLS 權限錯誤 (42501)
```
錯誤: new row violates row-level security policy
  ↓
檢查是否使用服務端 API
  ↓
使用客戶端上傳？
  ↓
┌─────────┐    ┌─────────┐
│   是    │    │   否    │
└─────────┘    └─────────┘
  ↓              ↓
修改為服務端 API  檢查 RLS 政策
  ↓              ↓
使用 /api/student- 檢查 storage.objects
media/upload     政策設定
  ↓              ↓
重新測試上傳    執行 RLS 修復腳本
```

### 分支 3: Storage 上傳失敗
```
錯誤: DatabaseError: insert into "objects"
  ↓
檢查 Storage bucket 設定
  ↓
bucket 存在？
  ↓
┌─────────┐    ┌─────────┐
│   是    │    │   否    │
└─────────┘    └─────────┘
  ↓              ↓
檢查 RLS 政策    創建 bucket
  ↓              ↓
執行寬鬆政策    設定權限
  ↓              ↓
重新測試上傳    重新測試上傳
```

### 分支 4: 環境變數缺失
```
錯誤: 伺服器配置錯誤
  ↓
檢查 .env.local 檔案
  ↓
缺少 SUPABASE_SERVICE_ROLE_KEY？
  ↓
┌─────────┐    ┌─────────┐
│   是    │    │   否    │
└─────────┘    └─────────┘
  ↓              ↓
從 Supabase Dashboard  檢查其他環境變數
獲取 service_role_key  檢查檔案格式
  ↓              ↓
添加到 .env.local      重新啟動開發伺服器
  ↓              ↓
重新啟動開發伺服器    重新測試上傳
  ↓              ↓
重新測試上傳
```

## 🧪 測試驗證流程

```
修復完成
  ↓
執行快速測試腳本
  ↓
所有測試通過？
  ↓
┌─────────┐    ┌─────────┐
│   是    │    │   否    │
└─────────┘    └─────────┘
  ↓              ↓
進行實際檔案上傳  返回診斷流程
  ↓              ↓
上傳成功？       重新檢查錯誤
  ↓              ↓
┌─────────┐    ┌─────────┐
│   是    │    │   否    │
└─────────┘    └─────────┘
  ↓              ↓
問題解決！       記錄新錯誤
  ↓              ↓
更新文檔        繼續診斷
```

## 📋 檢查清單

### 環境檢查
- [ ] `.env.local` 檔案存在
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 已設定
- [ ] 開發伺服器已重新啟動
- [ ] Supabase 專案可訪問

### 資料庫檢查
- [ ] `hanami_student_media` 表存在
- [ ] `hanami_student_media_quota` 表存在
- [ ] `uploaded_by` 欄位為 TEXT 類型
- [ ] 索引已建立

### Storage 檢查
- [ ] `hanami-media` bucket 存在
- [ ] RLS 政策已設定
- [ ] 檔案大小限制適當
- [ ] 允許的 MIME 類型正確

### API 檢查
- [ ] `/api/student-media/upload` 路由存在
- [ ] API 路由可訪問
- [ ] 錯誤處理完整
- [ ] 響應格式正確

### 前端檢查
- [ ] Supabase 客戶端可用
- [ ] 檔案選擇功能正常
- [ ] 上傳進度顯示正常
- [ ] 錯誤訊息清晰

## 🚨 緊急修復命令

### 重置所有設定
```sql
-- 1. 重置 RLS 政策
DROP POLICY IF EXISTS "Allow all operations on hanami-media" ON storage.objects;
CREATE POLICY "Allow all operations on hanami-media" ON storage.objects
FOR ALL USING (bucket_id = 'hanami-media');

-- 2. 修復 uploaded_by 欄位
ALTER TABLE hanami_student_media DROP COLUMN IF EXISTS uploaded_by;
ALTER TABLE hanami_student_media ADD COLUMN uploaded_by TEXT;

-- 3. 創建配額記錄
INSERT INTO hanami_student_media_quota (student_id, plan_type, video_limit, photo_limit)
SELECT id, 'free', 5, 10 FROM "Hanami_Students"
ON CONFLICT (student_id) DO NOTHING;
```

### 快速測試
```javascript
// 在瀏覽器控制台執行
fetch('/api/student-media/upload', { method: 'OPTIONS' })
  .then(response => console.log('API 狀態:', response.status))
  .catch(error => console.error('API 錯誤:', error));
```

---

**注意**: 此流程圖適用於 Hanami Storage 系統的常見問題。對於特殊情況，請參考完整的 `HANAMI_STORAGE_GUIDE.md` 文檔。 