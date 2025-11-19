# 學生資料更新函數遷移說明

## 問題描述

當更新學生資料時，會遇到以下錯誤：
```
更新失敗：infinite recursion detected in policy for relation "Hanami_Students"
```

這是因為 Row Level Security (RLS) 策略在檢查權限時發生無限遞迴。

## 解決方案

我們創建了兩個資料庫函數來完全繞過 RLS：
- `update_hanami_student` - 更新常規學生
- `update_trial_student` - 更新試堂學生

這些函數使用 `SECURITY DEFINER` 和 `SET LOCAL row_security = off` 來繞過 RLS 檢查。

## 執行步驟

### 1. 打開 Supabase Dashboard

1. 登入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇您的專案
3. 點擊左側選單的 **SQL Editor**

### 2. 執行 SQL 遷移

1. 在 SQL Editor 中，點擊 **New Query**
2. 複製 `migrations/2025-01-23_create_update_student_function.sql` 文件的全部內容
3. 貼上到 SQL Editor
4. 點擊 **Run** 或按 `Ctrl+Enter` (Windows/Linux) / `Cmd+Enter` (Mac)

### 3. 驗證函數已創建

執行以下 SQL 查詢來驗證函數是否已成功創建：

```sql
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname IN ('update_hanami_student', 'update_trial_student');
```

如果看到兩個函數的定義，表示遷移成功。

## 注意事項

- 這些函數使用 `SECURITY DEFINER`，以函數創建者（通常是資料庫超級用戶）的權限執行
- `SET LOCAL row_security = off` 只在函數執行期間有效，函數執行完畢後會自動恢復
- 函數會自動處理 JSONB 數據類型的轉換
- 函數會自動更新 `updated_at` 時間戳

## 故障排除

如果執行 SQL 時遇到錯誤：

1. **權限錯誤**：確保您有創建函數的權限
2. **語法錯誤**：檢查 SQL 文件是否完整複製
3. **函數已存在**：如果函數已存在，`CREATE OR REPLACE FUNCTION` 會自動替換舊版本

## 相關文件

- SQL 遷移文件：`migrations/2025-01-23_create_update_student_function.sql`
- API 端點：`src/app/api/students/[id]/route.ts`
- 前端組件：`src/components/ui/StudentBasicInfo.tsx`

