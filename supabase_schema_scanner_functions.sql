-- =====================================================
-- Supabase 資料庫結構掃描器 RPC 函數
-- =====================================================

-- 1. 獲取表格外鍵關聯的函數
CREATE OR REPLACE FUNCTION get_foreign_keys(table_name_param TEXT)
RETURNS TABLE (
  constraint_name TEXT,
  table_name TEXT,
  column_name TEXT,
  foreign_table_name TEXT,
  foreign_column_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kcu.constraint_name::TEXT,
    kcu.table_name::TEXT,
    kcu.column_name::TEXT,
    ccu.table_name::TEXT as foreign_table_name,
    ccu.column_name::TEXT as foreign_column_name
  FROM information_schema.key_column_usage kcu
  JOIN information_schema.constraint_column_usage ccu 
    ON kcu.constraint_name = ccu.constraint_name
  WHERE kcu.table_schema = 'public'
    AND kcu.table_name = table_name_param
    AND kcu.constraint_name IN (
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE constraint_type = 'FOREIGN KEY'
        AND table_schema = 'public'
        AND table_name = table_name_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 獲取表格索引的函數
CREATE OR REPLACE FUNCTION get_table_indexes(table_name_param TEXT)
RETURNS TABLE (
  index_name TEXT,
  table_name TEXT,
  column_name TEXT,
  is_unique BOOLEAN,
  index_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.indexname::TEXT,
    i.tablename::TEXT,
    array_to_string(array_agg(a.attname), ', ')::TEXT as column_name,
    i.indisunique as is_unique,
    am.amname::TEXT as index_type
  FROM pg_index i
  JOIN pg_class t ON i.indrelid = t.oid
  JOIN pg_class idx ON i.indexrelid = idx.oid
  JOIN pg_am am ON idx.relam = am.oid
  JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(i.indkey)
  WHERE t.relname = table_name_param
    AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND NOT i.indisprimary
  GROUP BY i.indexname, i.tablename, i.indisunique, am.amname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 獲取所有枚舉類型的函數
CREATE OR REPLACE FUNCTION get_enums()
RETURNS TABLE (
  enum_name TEXT,
  enum_values TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.typname::TEXT as enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder)::TEXT[] as enum_values
  FROM pg_type t
  JOIN pg_enum e ON t.oid = e.enumtypid
  JOIN pg_namespace n ON t.typnamespace = n.oid
  WHERE n.nspname = 'public'
  GROUP BY t.typname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 獲取表格詳細資訊的函數
CREATE OR REPLACE FUNCTION get_table_details(table_name_param TEXT)
RETURNS TABLE (
  column_name TEXT,
  data_type TEXT,
  is_nullable TEXT,
  column_default TEXT,
  is_primary_key BOOLEAN,
  is_foreign_key BOOLEAN,
  foreign_table_name TEXT,
  foreign_column_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::TEXT,
    c.data_type::TEXT,
    c.is_nullable::TEXT,
    c.column_default::TEXT,
    CASE WHEN pk.column_name IS NOT NULL THEN TRUE ELSE FALSE END as is_primary_key,
    CASE WHEN fk.column_name IS NOT NULL THEN TRUE ELSE FALSE END as is_foreign_key,
    fk_ref.table_name::TEXT as foreign_table_name,
    fk_ref.column_name::TEXT as foreign_column_name
  FROM information_schema.columns c
  LEFT JOIN (
    SELECT kcu.column_name
    FROM information_schema.key_column_usage kcu
    JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND kcu.table_schema = 'public'
      AND kcu.table_name = table_name_param
  ) pk ON c.column_name = pk.column_name
  LEFT JOIN (
    SELECT kcu.column_name
    FROM information_schema.key_column_usage kcu
    JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND kcu.table_schema = 'public'
      AND kcu.table_name = table_name_param
  ) fk ON c.column_name = fk.column_name
  LEFT JOIN (
    SELECT 
      kcu.column_name,
      ccu.table_name,
      ccu.column_name as ref_column_name
    FROM information_schema.key_column_usage kcu
    JOIN information_schema.constraint_column_usage ccu ON kcu.constraint_name = ccu.constraint_name
    JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND kcu.table_schema = 'public'
      AND kcu.table_name = table_name_param
  ) fk_ref ON c.column_name = fk_ref.column_name
  WHERE c.table_schema = 'public'
    AND c.table_name = table_name_param
  ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 獲取所有表格的完整掃描結果
CREATE OR REPLACE FUNCTION scan_all_tables()
RETURNS TABLE (
  table_name TEXT,
  column_count INTEGER,
  has_rls BOOLEAN,
  policy_count INTEGER,
  index_count INTEGER,
  foreign_key_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::TEXT,
    COALESCE(col_counts.column_count, 0)::INTEGER,
    COALESCE(rls_status.has_rls, FALSE)::BOOLEAN,
    COALESCE(policy_counts.policy_count, 0)::INTEGER,
    COALESCE(index_counts.index_count, 0)::INTEGER,
    COALESCE(fk_counts.foreign_key_count, 0)::INTEGER
  FROM information_schema.tables t
  LEFT JOIN (
    SELECT 
      table_name,
      COUNT(*) as column_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
    GROUP BY table_name
  ) col_counts ON t.table_name = col_counts.table_name
  LEFT JOIN (
    SELECT 
      tablename as table_name,
      COUNT(*) > 0 as has_rls
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename
  ) rls_status ON t.table_name = rls_status.table_name
  LEFT JOIN (
    SELECT 
      tablename as table_name,
      COUNT(*) as policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename
  ) policy_counts ON t.table_name = policy_counts.table_name
  LEFT JOIN (
    SELECT 
      tablename as table_name,
      COUNT(*) as index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname NOT LIKE '%_pkey'
    GROUP BY tablename
  ) index_counts ON t.table_name = index_counts.table_name
  LEFT JOIN (
    SELECT 
      kcu.table_name,
      COUNT(*) as foreign_key_count
    FROM information_schema.key_column_usage kcu
    JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND kcu.table_schema = 'public'
    GROUP BY kcu.table_name
  ) fk_counts ON t.table_name = fk_counts.table_name
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE 'pg_%'
    AND t.table_name NOT LIKE 'information_schema%'
    AND t.table_name NOT LIKE 'sql_%'
  ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 設置函數權限
GRANT EXECUTE ON FUNCTION get_foreign_keys(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_indexes(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_enums() TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_details(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION scan_all_tables() TO authenticated;

-- 7. 建立視圖來簡化查詢
CREATE OR REPLACE VIEW table_overview AS
SELECT 
  t.table_name,
  COALESCE(col_counts.column_count, 0) as column_count,
  COALESCE(rls_status.has_rls, FALSE) as has_rls,
  COALESCE(policy_counts.policy_count, 0) as policy_count,
  COALESCE(index_counts.index_count, 0) as index_count,
  COALESCE(fk_counts.foreign_key_count, 0) as foreign_key_count
FROM information_schema.tables t
LEFT JOIN (
  SELECT 
    table_name,
    COUNT(*) as column_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
  GROUP BY table_name
) col_counts ON t.table_name = col_counts.table_name
LEFT JOIN (
  SELECT 
    tablename as table_name,
    COUNT(*) > 0 as has_rls
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
) rls_status ON t.table_name = rls_status.table_name
LEFT JOIN (
  SELECT 
    tablename as table_name,
    COUNT(*) as policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
) policy_counts ON t.table_name = policy_counts.table_name
LEFT JOIN (
  SELECT 
    tablename as table_name,
    COUNT(*) as index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname NOT LIKE '%_pkey'
  GROUP BY tablename
) index_counts ON t.table_name = index_counts.table_name
LEFT JOIN (
  SELECT 
    kcu.table_name,
    COUNT(*) as foreign_key_count
  FROM information_schema.key_column_usage kcu
  JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND kcu.table_schema = 'public'
  GROUP BY kcu.table_name
) fk_counts ON t.table_name = fk_counts.table_name
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name NOT LIKE 'pg_%'
  AND t.table_name NOT LIKE 'information_schema%'
  AND t.table_name NOT LIKE 'sql_%';

-- 設置視圖權限
GRANT SELECT ON table_overview TO authenticated;

-- 8. 測試函數
-- 測試獲取所有表格概覽
-- SELECT * FROM scan_all_tables();

-- 測試獲取特定表格的外鍵
-- SELECT * FROM get_foreign_keys('hanami_employee');

-- 測試獲取特定表格的索引
-- SELECT * FROM get_table_indexes('hanami_employee');

-- 測試獲取所有枚舉
-- SELECT * FROM get_enums();

-- 測試獲取表格詳細資訊
-- SELECT * FROM get_table_details('hanami_employee');

-- 測試視圖
-- SELECT * FROM table_overview ORDER BY table_name; 