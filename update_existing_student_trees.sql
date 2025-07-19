-- 更新現有的 hanami_student_trees 表結構
-- 這個腳本會檢查現有表並進行必要的更新

-- 1. 檢查並添加缺失的欄位
DO $$
BEGIN
    -- 添加 start_date 欄位（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hanami_student_trees' 
          AND column_name = 'start_date'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE hanami_student_trees ADD COLUMN start_date DATE DEFAULT CURRENT_DATE;
        RAISE NOTICE 'Added start_date column';
    END IF;

    -- 添加 status 欄位（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hanami_student_trees' 
          AND column_name = 'status'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE hanami_student_trees ADD COLUMN status TEXT DEFAULT 'active';
        RAISE NOTICE 'Added status column';
    END IF;

    -- 添加 completed_goals 欄位（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hanami_student_trees' 
          AND column_name = 'completed_goals'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE hanami_student_trees ADD COLUMN completed_goals TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added completed_goals column';
    END IF;

    -- 添加 progress_notes 欄位（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hanami_student_trees' 
          AND column_name = 'progress_notes'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE hanami_student_trees ADD COLUMN progress_notes TEXT;
        RAISE NOTICE 'Added progress_notes column';
    END IF;

    -- 重命名 enrollment_date 為 start_date（如果存在 enrollment_date）
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hanami_student_trees' 
          AND column_name = 'enrollment_date'
          AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hanami_student_trees' 
          AND column_name = 'start_date'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE hanami_student_trees RENAME COLUMN enrollment_date TO start_date;
        RAISE NOTICE 'Renamed enrollment_date to start_date';
    END IF;

    -- 重命名 tree_status 為 status（如果存在 tree_status）
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hanami_student_trees' 
          AND column_name = 'tree_status'
          AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hanami_student_trees' 
          AND column_name = 'status'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE hanami_student_trees RENAME COLUMN tree_status TO status;
        RAISE NOTICE 'Renamed tree_status to status';
    END IF;

    -- 重命名 teacher_notes 為 progress_notes（如果存在 teacher_notes）
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hanami_student_trees' 
          AND column_name = 'teacher_notes'
          AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hanami_student_trees' 
          AND column_name = 'progress_notes'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE hanami_student_trees RENAME COLUMN teacher_notes TO progress_notes;
        RAISE NOTICE 'Renamed teacher_notes to progress_notes';
    END IF;
END $$;

-- 2. 添加約束（如果不存在）
DO $$
BEGIN
    -- 添加唯一約束（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'hanami_student_trees' 
          AND constraint_name = 'hanami_student_trees_student_tree_unique'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE hanami_student_trees ADD CONSTRAINT hanami_student_trees_student_tree_unique 
        UNIQUE (student_id, tree_id);
        RAISE NOTICE 'Added unique constraint on (student_id, tree_id)';
    END IF;

    -- 添加狀態檢查約束（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'hanami_student_trees_status_check'
    ) THEN
        ALTER TABLE hanami_student_trees ADD CONSTRAINT hanami_student_trees_status_check 
        CHECK (status IN ('active', 'completed', 'paused'));
        RAISE NOTICE 'Added status check constraint';
    END IF;
END $$;

-- 3. 創建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_student_trees_student_id ON hanami_student_trees(student_id);
CREATE INDEX IF NOT EXISTS idx_student_trees_tree_id ON hanami_student_trees(tree_id);
CREATE INDEX IF NOT EXISTS idx_student_trees_status ON hanami_student_trees(status);

-- 4. 創建或更新觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_student_trees_updated_at ON hanami_student_trees;
CREATE TRIGGER update_student_trees_updated_at
    BEFORE UPDATE ON hanami_student_trees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. 遷移現有資料（如果表是空的）
DO $$
DECLARE
    record_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO record_count FROM hanami_student_trees;
    
    IF record_count = 0 THEN
        -- 遷移基於課程類型的關聯資料
        INSERT INTO hanami_student_trees (student_id, tree_id, start_date, status)
        SELECT DISTINCT
          s.id as student_id,
          gt.id as tree_id,
          COALESCE(s.started_date, CURRENT_DATE) as start_date,
          'active' as status
        FROM "Hanami_Students" s
        JOIN hanami_growth_trees gt ON s.course_type = gt.course_type
        WHERE s.course_type IS NOT NULL 
          AND s.course_type != ''
          AND gt.course_type IS NOT NULL
          AND gt.course_type != ''
          AND gt.is_active = true
        ON CONFLICT (student_id, tree_id) DO NOTHING;
        
        RAISE NOTICE 'Migrated % records from course_type based relationships', record_count;
    ELSE
        RAISE NOTICE 'Table already has % records, skipping migration', record_count;
    END IF;
END $$;

-- 6. 創建或更新實用函數
CREATE OR REPLACE FUNCTION get_students_in_tree(p_tree_id UUID)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  student_nickname TEXT,
  student_age INTEGER,
  course_type TEXT,
  start_date DATE,
  status TEXT,
  completed_goals_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as student_id,
    s.full_name as student_name,
    s.nick_name as student_nickname,
    s.student_age,
    s.course_type,
    st.start_date,
    st.status,
    COALESCE(array_length(st.completed_goals, 1), 0) as completed_goals_count
  FROM hanami_student_trees st
  JOIN "Hanami_Students" s ON st.student_id = s.id
  WHERE st.tree_id = p_tree_id AND st.status = 'active'
  ORDER BY s.full_name;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_student_trees(p_student_id UUID)
RETURNS TABLE (
  tree_id UUID,
  tree_name TEXT,
  tree_description TEXT,
  course_type TEXT,
  start_date DATE,
  status TEXT,
  completed_goals_count INTEGER,
  total_goals_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gt.id as tree_id,
    gt.tree_name,
    gt.tree_description,
    gt.course_type,
    st.start_date,
    st.status,
    COALESCE(array_length(st.completed_goals, 1), 0) as completed_goals_count,
    (SELECT COUNT(*) FROM hanami_growth_goals WHERE tree_id = gt.id) as total_goals_count
  FROM hanami_student_trees st
  JOIN hanami_growth_trees gt ON st.tree_id = gt.id
  WHERE st.student_id = p_student_id
  ORDER BY st.start_date DESC;
END;
$$ LANGUAGE plpgsql;

-- 7. 顯示最終結果
SELECT 
  'Table updated successfully' as status,
  COUNT(*) as total_student_tree_relationships,
  COUNT(DISTINCT student_id) as unique_students,
  COUNT(DISTINCT tree_id) as unique_trees
FROM hanami_student_trees;

-- 8. 顯示每個成長樹的學生數量
SELECT 
  gt.tree_name,
  gt.course_type,
  COUNT(st.student_id) as student_count
FROM hanami_growth_trees gt
LEFT JOIN hanami_student_trees st ON gt.id = st.tree_id AND st.status = 'active'
GROUP BY gt.id, gt.tree_name, gt.course_type
ORDER BY gt.tree_name; 