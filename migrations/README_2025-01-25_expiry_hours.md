# 添加 expiry_hours 欄位到報名連結表

## 概述
此遷移文件為 `hanami_registration_links` 表添加 `expiry_hours` 欄位，用於存儲連結的有效時限（小時數）。

## 執行步驟

### 1. 執行遷移文件
在 Supabase SQL Editor 中執行：
```sql
-- 執行 migrations/2025-01-25_add_expiry_hours_to_registration_links.sql
```

### 2. 驗證遷移
執行以下查詢確認欄位已添加：
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'hanami_registration_links'
  AND column_name = 'expiry_hours';
```

### 3. 檢查現有數據
確認現有記錄的 `expiry_hours` 已正確計算：
```sql
SELECT 
  id,
  created_at,
  expires_at,
  expiry_hours,
  EXTRACT(EPOCH FROM (expires_at - created_at)) / 3600 as calculated_hours
FROM hanami_registration_links
LIMIT 10;
```

## 變更內容

### 數據庫變更
1. **新增欄位**：`expiry_hours` (integer, 預設 24)
2. **更新觸發器**：`set_registration_link_expiry()` 函數現在會：
   - 如果提供了 `expiry_hours`，使用它來計算 `expires_at`
   - 如果提供了 `expires_at`，根據時間差計算 `expiry_hours`
3. **添加約束**：確保 `expiry_hours` 為正數

### API 變更
- `POST /api/registrations/links` 現在會在創建連結時保存 `expiry_hours`

### 前端變更
- 連結列表現在會顯示時限信息（小時數和天數）

## 回滾（如果需要）
如果需要回滾此遷移：
```sql
ALTER TABLE public.hanami_registration_links
DROP COLUMN IF EXISTS expiry_hours;

-- 恢復原來的觸發器函數
CREATE OR REPLACE FUNCTION public.set_registration_link_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := now() + INTERVAL '24 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 注意事項
- 現有記錄的 `expiry_hours` 會根據 `expires_at` 和 `created_at` 自動計算
- 新創建的連結會同時保存 `expires_at` 和 `expiry_hours`
- 如果只提供其中一個，系統會自動計算另一個

