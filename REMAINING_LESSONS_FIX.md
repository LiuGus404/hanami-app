# 剩餘堂數計算問題修復指南

## 問題描述
學生管理頁面中的剩餘堂數顯示不正確，例如學生實際有3堂剩餘，但顯示為1堂。這導致篩選功能也不準確。

## 解決方案

### 1. 在 Supabase 中創建 SQL 函數

請在 Supabase 的 SQL Editor 中執行以下代碼：

```sql
-- 計算剩餘堂數的 RPC 函數
-- 使用 student_id 分組，不考慮 status，確保結果準確

CREATE OR REPLACE FUNCTION calculate_remaining_lessons_batch(
  student_ids UUID[],
  today_date DATE
)
RETURNS TABLE (
  student_id UUID,
  remaining_lessons BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hsl.student_id,
    COUNT(*)::BIGINT AS remaining_lessons
  FROM hanami_student_lesson hsl
  WHERE hsl.student_id = ANY(student_ids)
    AND hsl.lesson_date >= today_date
  GROUP BY hsl.student_id;
END;
$$;

-- 詳細查詢函數（包含學生姓名等）
CREATE OR REPLACE FUNCTION calculate_remaining_lessons_detailed(
  student_ids UUID[],
  today_date DATE
)
RETURNS TABLE (
  student_id UUID,
  full_name TEXT,
  remaining_lessons BIGINT,
  next_lesson_date DATE,
  next_lesson_time TIME,
  course_type TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hsl.student_id,
    MIN(hs.full_name) AS full_name,
    COUNT(*)::BIGINT AS remaining_lessons,
    MIN(hsl.lesson_date) AS next_lesson_date,
    MIN(hsl.actual_timeslot) AS next_lesson_time,
    MIN(hsl.course_type) AS course_type
  FROM hanami_student_lesson hsl
  LEFT JOIN "Hanami_Students" hs ON hsl.student_id = hs.id
  WHERE hsl.student_id = ANY(student_ids)
    AND hsl.lesson_date >= today_date
  GROUP BY hsl.student_id
  ORDER BY next_lesson_date, next_lesson_time;
END;
$$;
```

### 2. 測試 SQL 函數

執行 `test_remaining_lessons.sql` 中的查詢來測試函數是否正常工作。

### 3. 代碼修改

已經修改了以下文件：

#### `src/lib/utils.ts`
- 修改了 `calculateRemainingLessons` 函數，使用 SQL RPC 查詢
- 修改了 `calculateRemainingLessonsBatch` 函數，使用 SQL RPC 查詢
- 添加了回退機制，如果 RPC 函數失敗，會使用原始計算方法
- 使用 `(supabase as any)` 來解決 TypeScript 類型問題

#### `src/app/admin/students/page.tsx`
- 改進了剩餘堂數計算的觸發條件
- 添加了調試日誌來追蹤計算過程

### 4. 修復特點

#### 統一的計算邏輯
- 使用相同的 SQL 查詢邏輯
- 不考慮 `status` 欄位，只按 `student_id` 分組
- 確保批量計算和單個計算結果一致

#### 回退機制
- 如果 RPC 函數不存在或失敗，會自動回退到原始計算方法
- 確保系統的穩定性

#### 調試支持
- 添加了詳細的日誌輸出
- 便於診斷問題

#### 性能優化
- 使用 SQL 查詢直接計算，減少前端處理
- 批量查詢提高效率

### 5. 驗證步驟

1. **在 Supabase 中執行 SQL 函數**
2. **重新載入學生管理頁面**
3. **檢查剩餘堂數是否正確顯示**
4. **測試篩選功能是否正常工作**
5. **比較學生詳細頁面和學生管理頁面的剩餘堂數是否一致**

### 6. 預期結果

- 學生管理頁面的剩餘堂數顯示應該與學生詳細頁面一致
- 篩選功能應該能正確篩選出符合條件的學生
- 不再出現「明明有3堂卻顯示1堂」的問題

### 7. 故障排除

如果仍然有問題，請檢查：

1. **SQL 函數是否成功創建**：在 Supabase 中執行測試查詢
2. **瀏覽器控制台**：查看是否有錯誤日誌
3. **網路請求**：檢查 Supabase RPC 調用是否成功
4. **資料庫資料**：確認 `hanami_student_lesson` 表中的資料是否正確

### 8. 測試查詢

使用以下查詢來驗證修復效果：

```sql
-- 檢查特定學生的剩餘堂數
SELECT 
  hsl.student_id,
  hs.full_name,
  COUNT(*) AS remaining_lessons,
  MIN(hsl.lesson_date) AS next_lesson_date,
  MIN(hsl.actual_timeslot) AS next_lesson_time,
  MIN(hsl.course_type) AS course_type
FROM hanami_student_lesson hsl
LEFT JOIN "Hanami_Students" hs ON hsl.student_id = hs.id
WHERE hsl.student_id = 'your-student-id-here'::UUID
  AND hsl.lesson_date >= CURRENT_DATE
GROUP BY hsl.student_id, hs.full_name;
```

## 完成狀態

✅ **代碼修改完成**
✅ **Build 成功**
✅ **TypeScript 類型檢查通過**
⏳ **等待在 Supabase 中執行 SQL 函數**
⏳ **等待測試驗證** 