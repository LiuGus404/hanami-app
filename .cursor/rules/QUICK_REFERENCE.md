# Hanami Storage 快速參考卡片

## 🚀 快速設定檢查清單

### 環境變數
```bash
# .env.local - 必須設定
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # 重要！
```

### 資料庫檢查
```sql
-- 檢查資料表是否存在
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('hanami_student_media', 'hanami_student_media_quota');

-- 檢查 uploaded_by 欄位類型
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'hanami_student_media' AND column_name = 'uploaded_by';
```

### Storage 檢查
```sql
-- 檢查 bucket 是否存在
SELECT * FROM storage.buckets WHERE id = 'hanami-media';

-- 檢查 RLS 政策
SELECT * FROM pg_policies WHERE tablename = 'objects';
```

---

## 🔧 常見修復命令

### 1. 修復 uploaded_by 欄位
```sql
ALTER TABLE hanami_student_media DROP COLUMN IF EXISTS uploaded_by;
ALTER TABLE hanami_student_media ADD COLUMN uploaded_by TEXT;
```

### 2. 重置 RLS 政策
```sql
-- 刪除所有 storage.objects 政策
DROP POLICY IF EXISTS "Allow authenticated uploads to hanami-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads from hanami-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from hanami-media" ON storage.objects;

-- 創建寬鬆政策（僅用於測試）
CREATE POLICY "Allow all operations on hanami-media" ON storage.objects
FOR ALL USING (bucket_id = 'hanami-media');
```

### 3. 創建測試資料
```sql
-- 為現有學生創建配額記錄
INSERT INTO hanami_student_media_quota (student_id, plan_type, video_limit, photo_limit)
SELECT id, 'free', 5, 10 FROM "Hanami_Students"
ON CONFLICT (student_id) DO NOTHING;
```

---

## 🧪 測試腳本

### 快速測試
```javascript
// 在瀏覽器控制台執行
console.log('🧪 快速測試開始...');

// 1. 檢查 Supabase 客戶端
if (typeof supabase !== 'undefined') {
  console.log('✅ Supabase 客戶端可用');
} else {
  console.log('❌ Supabase 客戶端不可用');
}

// 2. 測試 API 路由
fetch('/api/student-media/upload', { method: 'OPTIONS' })
  .then(response => console.log('API 狀態:', response.status))
  .catch(error => console.error('API 錯誤:', error));

// 3. 測試資料庫連接
supabase.from('hanami_student_media').select('count', { count: 'exact', head: true })
  .then(({ count, error }) => {
    if (error) console.error('❌ 資料庫錯誤:', error);
    else console.log('✅ 資料庫連接正常，記錄數:', count);
  });
```

### 完整測試
```javascript
// 執行完整測試腳本
const testUpload = async () => {
  const testFile = new Blob(['Test content'], { type: 'text/plain' });
  testFile.name = 'test.txt';
  
  const formData = new FormData();
  formData.append('file', testFile);
  formData.append('studentId', 'test-id');
  formData.append('mediaType', 'photo');
  
  try {
    const response = await fetch('/api/student-media/upload', {
      method: 'POST',
      body: formData
    });
    
    console.log('響應狀態:', response.status);
    const result = await response.json();
    console.log('結果:', result);
  } catch (error) {
    console.error('測試失敗:', error);
  }
};

testUpload();
```

---

## ❗ 錯誤代碼對照表

| 錯誤代碼 | 問題 | 解決方案 |
|---------|------|----------|
| `22P02` | UUID 格式錯誤 | 檢查欄位類型，使用 `null` 或正確的 UUID |
| `42501` | 權限不足 | 檢查 RLS 政策，使用服務端 API |
| `23514` | 檢查約束失敗 | 檢查資料完整性約束 |
| `23505` | 唯一約束違反 | 檢查重複資料 |
| `42P01` | 資料表不存在 | 執行資料庫遷移腳本 |

---

## 📞 緊急聯絡資訊

### 關鍵檔案位置
- **主要組件**: `src/components/ui/StudentMediaModal.tsx`
- **上傳 API**: `src/app/api/student-media/upload/route.ts`
- **資料庫結構**: `create_student_media_tables.sql`
- **測試腳本**: `test-uploaded-by-fix.js`

### 調試步驟
1. **檢查環境變數** - 確認 `.env.local` 設定
2. **檢查資料庫** - 執行快速測試腳本
3. **檢查 Storage** - 確認 bucket 和 RLS 政策
4. **檢查 API** - 測試上傳端點
5. **檢查前端** - 查看控制台錯誤

---

## 🎯 最佳實踐提醒

### 安全性
- ✅ 永遠使用服務端 API 進行檔案上傳
- ✅ 實施完整的輸入驗證
- ✅ 定期檢查 RLS 政策

### 效能
- ✅ 設定適當的檔案大小限制
- ✅ 使用索引優化查詢
- ✅ 定期清理過期檔案

### 用戶體驗
- ✅ 提供上傳進度顯示
- ✅ 實施檔案類型驗證
- ✅ 提供清晰的錯誤訊息

---

**最後更新**: 2024-12-19  
**版本**: 1.0.0 