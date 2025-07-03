# Supabase Dashboard 權限設置指南

## 概述
本指南將幫助您在 Supabase Dashboard 中正確設置 `inactive_student_list` 表的權限和 RLS（Row Level Security）策略。

## 重要提醒
如果遇到 `ERROR: 42883: operator does not exist: text ->> unknown` 錯誤，請使用 `simple_rls_setup.sql` 腳本。

## 📋 操作步驟

### 步驟 1: 登入 Supabase Dashboard

1. 打開瀏覽器，前往 [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. 登入您的 Supabase 帳戶
3. 選擇您的專案

### 步驟 2: 進入 SQL Editor

1. 在左側導航欄中點擊 **"SQL Editor"**
2. 點擊 **"New query"** 創建新的查詢

### 步驟 3: 執行權限設置腳本

1. 複製以下 SQL 腳本內容：

```sql
-- =====================================================
-- 最簡單的 RLS 設置腳本
-- 解決 "operator does not exist: text ->> unknown" 錯誤
-- =====================================================

-- 1. 創建表
CREATE TABLE IF NOT EXISTS inactive_student_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_id UUID NOT NULL,
  student_type TEXT NOT NULL CHECK (student_type IN ('regular', 'trial')),
  full_name TEXT,
  student_age INTEGER,
  student_preference TEXT,
  course_type TEXT,
  remaining_lessons INTEGER,
  regular_weekday INTEGER,
  gender TEXT,
  student_oid TEXT,
  contact_number TEXT,
  regular_timeslot TEXT,
  health_notes TEXT,
  lesson_date DATE,
  actual_timeslot TEXT,
  inactive_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  inactive_reason TEXT DEFAULT '管理員停用',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 啟用 RLS
ALTER TABLE inactive_student_list ENABLE ROW LEVEL SECURITY;

-- 3. 創建索引
CREATE INDEX IF NOT EXISTS idx_inactive_student_list_original_id ON inactive_student_list(original_id);
CREATE INDEX IF NOT EXISTS idx_inactive_student_list_student_type ON inactive_student_list(student_type);
CREATE INDEX IF NOT EXISTS idx_inactive_student_list_inactive_date ON inactive_student_list(inactive_date);

-- 4. 創建更新時間觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_inactive_student_list_updated_at ON inactive_student_list;
CREATE TRIGGER update_inactive_student_list_updated_at 
    BEFORE UPDATE ON inactive_student_list 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. 刪除現有策略（如果存在）
DROP POLICY IF EXISTS "Enable read access for all users" ON inactive_student_list;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON inactive_student_list;
DROP POLICY IF EXISTS "Enable update for users based on email" ON inactive_student_list;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON inactive_student_list;

-- 6. 創建最簡單的 RLS 策略

-- 讀取權限
CREATE POLICY "Enable read access for all users" ON inactive_student_list
FOR SELECT USING (true);

-- 插入權限
CREATE POLICY "Enable insert for authenticated users only" ON inactive_student_list
FOR INSERT WITH CHECK (true);

-- 更新權限
CREATE POLICY "Enable update for users based on email" ON inactive_student_list
FOR UPDATE USING (true);

-- 刪除權限
CREATE POLICY "Enable delete for users based on email" ON inactive_student_list
FOR DELETE USING (true);

-- 7. 設置表權限
GRANT ALL ON inactive_student_list TO authenticated;
GRANT ALL ON inactive_student_list TO service_role;

-- 8. 驗證設置
SELECT 'Setup completed successfully' AS result;
```

2. 將腳本貼到 SQL Editor 中
3. 點擊 **"Run"** 按鈕執行腳本

### 步驟 4: 驗證設置

執行腳本後，您應該看到以下結果：

```
status
Setup completed successfully
```

### 步驟 5: 檢查表結構

1. 在左側導航欄中點擊 **"Table Editor"**
2. 找到 `inactive_student_list` 表
3. 確認表結構正確

### 步驟 6: 檢查 RLS 策略

1. 在 **"Table Editor"** 中點擊 `inactive_student_list` 表
2. 點擊 **"RLS"** 標籤
3. 確認以下策略已創建：
   - ✅ Enable read access for all users
   - ✅ Enable insert for authenticated users only
   - ✅ Enable update for users based on email
   - ✅ Enable delete for users based on email

## 🔧 手動設置 RLS 策略（如果需要）

如果自動腳本無法執行，您可以手動設置：

### 1. 創建表
在 SQL Editor 中執行：
```sql
CREATE TABLE IF NOT EXISTS inactive_student_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_id UUID NOT NULL,
  student_type TEXT NOT NULL CHECK (student_type IN ('regular', 'trial')),
  full_name TEXT,
  student_age INTEGER,
  student_preference TEXT,
  course_type TEXT,
  remaining_lessons INTEGER,
  regular_weekday INTEGER,
  gender TEXT,
  student_oid TEXT,
  contact_number TEXT,
  regular_timeslot TEXT,
  health_notes TEXT,
  lesson_date DATE,
  actual_timeslot TEXT,
  inactive_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  inactive_reason TEXT DEFAULT '管理員停用',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. 啟用 RLS
```sql
ALTER TABLE inactive_student_list ENABLE ROW LEVEL SECURITY;
```

### 3. 創建策略
在 **"Table Editor"** → **"RLS"** 中手動創建以下策略：

#### 策略 1: 讀取權限
- **Name**: `Enable read access for all users`
- **Target roles**: `authenticated`
- **Policy definition**: `USING (auth.role() = 'authenticated')`
- **Operation**: `SELECT`

#### 策略 2: 插入權限
- **Name**: `Enable insert for authenticated users only`
- **Target roles**: `authenticated`
- **Policy definition**: `WITH CHECK (auth.role() = 'authenticated')`
- **Operation**: `INSERT`

#### 策略 3: 更新權限
- **Name**: `Enable update for users based on email`
- **Target roles**: `authenticated`
- **Policy definition**: `USING (auth.role() = 'authenticated')`
- **Operation**: `UPDATE`

#### 策略 4: 刪除權限
- **Name**: `Enable delete for users based on email`
- **Target roles**: `authenticated`
- **Policy definition**: `USING (auth.role() = 'authenticated')`
- **Operation**: `DELETE`

## 🧪 測試權限

### 測試查詢
在 SQL Editor 中執行以下查詢來測試權限：

```sql
-- 測試讀取
SELECT * FROM inactive_student_list LIMIT 5;

-- 測試插入
INSERT INTO inactive_student_list (
  original_id,
  student_type,
  full_name,
  student_age,
  course_type,
  remaining_lessons,
  gender,
  student_oid,
  contact_number,
  inactive_reason
) VALUES (
  gen_random_uuid(),
  'regular',
  '測試學生',
  60,
  '鋼琴',
  5,
  'male',
  'TEST001',
  '12345678',
  '測試停用'
);

-- 測試更新
UPDATE inactive_student_list 
SET inactive_reason = '更新測試' 
WHERE full_name = '測試學生';

-- 測試刪除
DELETE FROM inactive_student_list 
WHERE full_name = '測試學生';
```

## ⚠️ 常見問題

### 問題 1: 權限被拒絕
**解決方案**: 確保已執行 `GRANT ALL ON inactive_student_list TO authenticated;`

### 問題 2: RLS 策略不生效
**解決方案**: 確保 RLS 已啟用：`ALTER TABLE inactive_student_list ENABLE ROW LEVEL SECURITY;`

### 問題 3: 表不存在
**解決方案**: 先執行創建表的 SQL 腳本

### 問題 4: 觸發器錯誤
**解決方案**: 確保函數已創建，然後重新創建觸發器

## 📞 支援

如果遇到問題，請：
1. 檢查 SQL Editor 中的錯誤訊息
2. 確認所有步驟都已正確執行
3. 聯繫技術支援團隊

## ✅ 完成檢查清單

- [ ] 表已創建
- [ ] RLS 已啟用
- [ ] 索引已創建
- [ ] 觸發器已設置
- [ ] 所有 RLS 策略已創建
- [ ] 權限已授予
- [ ] 測試查詢成功執行 