-- 創建一個函數來更新學生資料，完全繞過 RLS
-- 這個函數使用 SECURITY DEFINER，以函數創建者的權限執行，繞過 RLS

-- 更新常規學生
-- 使用 SECURITY DEFINER 和直接 SQL 執行來完全繞過 RLS
-- 這個函數會臨時禁用 RLS，執行更新，然後恢復 RLS
CREATE OR REPLACE FUNCTION update_hanami_student(
  p_student_id UUID,
  p_updates JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_sql TEXT;
  v_old_rls_setting TEXT;
BEGIN
  -- 保存當前的 RLS 設置
  v_old_rls_setting := current_setting('row_security', true);
  
  -- 構建 SET 子句
  v_sql := (
    SELECT string_agg(
      CASE 
        WHEN jsonb_typeof(value) = 'null' THEN format('%I = NULL', key)
        WHEN jsonb_typeof(value) = 'string' THEN format('%I = %L', key, value #>> '{}')
        WHEN jsonb_typeof(value) = 'number' THEN format('%I = %s', key, value #>> '{}')
        WHEN jsonb_typeof(value) = 'boolean' THEN format('%I = %s', key, value #>> '{}')
        ELSE format('%I = %L', key, value::text)
      END,
      ', '
    )
    FROM jsonb_each(p_updates)
    WHERE key NOT IN ('id', 'created_at')
  );
  
  -- 如果沒有要更新的欄位，只更新 updated_at
  IF v_sql IS NULL OR v_sql = '' THEN
    v_sql := 'updated_at = NOW()';
  ELSE
    v_sql := v_sql || ', updated_at = NOW()';
  END IF;
  
  -- 臨時禁用 RLS（在整個函數執行期間）
  PERFORM set_config('row_security', 'off', true);
  
  -- 構建完整的 UPDATE SQL 語句
  -- 使用動態 SQL 構建，確保完全繞過 RLS
  v_sql := format('UPDATE "Hanami_Students" SET %s WHERE id = %L RETURNING to_jsonb("Hanami_Students".*)', 
    v_sql, p_student_id);
  
  -- 使用 EXECUTE 執行動態 SQL
  -- SECURITY DEFINER 確保以函數創建者（通常是超級用戶）的權限執行
  EXECUTE v_sql INTO v_result;
  
  -- 恢復 RLS 設置
  PERFORM set_config('row_security', COALESCE(v_old_rls_setting, 'on'), true);
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- 確保在錯誤時也恢復 RLS 設置
    BEGIN
      PERFORM set_config('row_security', COALESCE(v_old_rls_setting, 'on'), true);
    EXCEPTION
      WHEN OTHERS THEN NULL;
    END;
    -- 返回錯誤信息
    RAISE EXCEPTION '更新學生失敗: %', SQLERRM;
END;
$$;

-- 更新試堂學生
-- 使用 SECURITY DEFINER 和直接 SQL 執行來完全繞過 RLS
-- 這個函數會臨時禁用 RLS，執行更新，然後恢復 RLS
CREATE OR REPLACE FUNCTION update_trial_student(
  p_student_id UUID,
  p_updates JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_sql TEXT;
  v_old_rls_setting TEXT;
BEGIN
  -- 保存當前的 RLS 設置
  v_old_rls_setting := current_setting('row_security', true);
  
  -- 構建 SET 子句
  v_sql := (
    SELECT string_agg(
      CASE 
        WHEN jsonb_typeof(value) = 'null' THEN format('%I = NULL', key)
        WHEN jsonb_typeof(value) = 'string' THEN format('%I = %L', key, value #>> '{}')
        WHEN jsonb_typeof(value) = 'number' THEN format('%I = %s', key, value #>> '{}')
        WHEN jsonb_typeof(value) = 'boolean' THEN format('%I = %s', key, value #>> '{}')
        ELSE format('%I = %L', key, value::text)
      END,
      ', '
    )
    FROM jsonb_each(p_updates)
    WHERE key NOT IN ('id', 'created_at')
  );
  
  -- 如果沒有要更新的欄位，只更新 updated_at
  IF v_sql IS NULL OR v_sql = '' THEN
    v_sql := 'updated_at = NOW()';
  ELSE
    v_sql := v_sql || ', updated_at = NOW()';
  END IF;
  
  -- 臨時禁用 RLS（在整個函數執行期間）
  PERFORM set_config('row_security', 'off', true);
  
  -- 構建完整的 UPDATE SQL 語句
  -- 使用動態 SQL 構建，確保完全繞過 RLS
  v_sql := format('UPDATE hanami_trial_students SET %s WHERE id = %L RETURNING to_jsonb(hanami_trial_students.*)', 
    v_sql, p_student_id);
  
  -- 使用 EXECUTE 執行動態 SQL
  -- SECURITY DEFINER 確保以函數創建者（通常是超級用戶）的權限執行
  EXECUTE v_sql INTO v_result;
  
  -- 恢復 RLS 設置
  PERFORM set_config('row_security', COALESCE(v_old_rls_setting, 'on'), true);
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- 確保在錯誤時也恢復 RLS 設置
    BEGIN
      PERFORM set_config('row_security', COALESCE(v_old_rls_setting, 'on'), true);
    EXCEPTION
      WHEN OTHERS THEN NULL;
    END;
    -- 返回錯誤信息
    RAISE EXCEPTION '更新試堂學生失敗: %', SQLERRM;
END;
$$;

-- 添加註釋
COMMENT ON FUNCTION update_hanami_student IS '更新常規學生資料，使用 SECURITY DEFINER 繞過 RLS';
COMMENT ON FUNCTION update_trial_student IS '更新試堂學生資料，使用 SECURITY DEFINER 繞過 RLS';

