-- 創建檢查表結構的函數
CREATE OR REPLACE FUNCTION get_table_schema(table_name TEXT)
RETURNS TABLE (
  column_name TEXT,
  data_type TEXT,
  is_nullable TEXT,
  column_default TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::TEXT,
    c.data_type::TEXT,
    c.is_nullable::TEXT,
    c.column_default::TEXT
  FROM information_schema.columns c
  WHERE c.table_name = $1
  AND c.table_schema = 'public'
  ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql;

-- 創建檢查試堂學生狀態的函數
CREATE OR REPLACE FUNCTION check_trial_students_status()
RETURNS TABLE (
  check_item TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- 檢查表是否存在
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'hanami_trial_students'
  ) THEN
    RETURN QUERY SELECT '表存在性'::TEXT, '存在'::TEXT, '試堂學生表已存在'::TEXT;
  ELSE
    RETURN QUERY SELECT '表存在性'::TEXT, '不存在'::TEXT, '試堂學生表不存在'::TEXT;
  END IF;
  
  -- 檢查資料數量
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'hanami_trial_students'
  ) THEN
    RETURN QUERY 
    SELECT 
      '資料數量'::TEXT, 
      COUNT(*)::TEXT, 
      '試堂學生記錄數'::TEXT
    FROM hanami_trial_students;
  ELSE
    RETURN QUERY SELECT '資料數量'::TEXT, 'N/A'::TEXT, '表不存在'::TEXT;
  END IF;
  
  -- 檢查RLS狀態
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'hanami_trial_students'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE tablename = 'hanami_trial_students' 
      AND rowsecurity = true
    ) THEN
      RETURN QUERY SELECT 'RLS狀態'::TEXT, '已啟用'::TEXT, '行級安全已啟用'::TEXT;
    ELSE
      RETURN QUERY SELECT 'RLS狀態'::TEXT, '未啟用'::TEXT, '行級安全未啟用'::TEXT;
    END IF;
  ELSE
    RETURN QUERY SELECT 'RLS狀態'::TEXT, 'N/A'::TEXT, '表不存在'::TEXT;
  END IF;
  
  -- 檢查RLS策略
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'hanami_trial_students'
  ) THEN
    RETURN QUERY 
    SELECT 
      'RLS策略'::TEXT, 
      COUNT(*)::TEXT, 
      '策略數量'::TEXT
    FROM pg_policies 
    WHERE tablename = 'hanami_trial_students';
  ELSE
    RETURN QUERY SELECT 'RLS策略'::TEXT, 'N/A'::TEXT, '表不存在'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql; 