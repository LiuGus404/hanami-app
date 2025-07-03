-- =====================================================
-- Hanami Web 完整 RLS 策略設置
-- 支援三種用戶角色：管理員、老師、家長
-- =====================================================

-- 1. 用戶權限管理表
CREATE TABLE IF NOT EXISTS hanami_user_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('admin', 'teacher', 'parent')),
  user_email TEXT NOT NULL,
  permissions JSONB DEFAULT '{}',
  accessible_pages JSONB DEFAULT '[]',
  can_view_all_students BOOLEAN DEFAULT FALSE,
  can_view_all_lessons BOOLEAN DEFAULT FALSE,
  can_manage_teachers BOOLEAN DEFAULT FALSE,
  can_manage_students BOOLEAN DEFAULT FALSE,
  can_manage_lessons BOOLEAN DEFAULT FALSE,
  can_view_financial_data BOOLEAN DEFAULT FALSE,
  can_export_data BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 啟用 RLS
ALTER TABLE hanami_user_permissions ENABLE ROW LEVEL SECURITY;

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON hanami_user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_type ON hanami_user_permissions(user_type);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_email ON hanami_user_permissions(user_email);

-- 2. 老師-學生關聯表（用於權限控制）
CREATE TABLE IF NOT EXISTS hanami_teacher_student_relations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  student_id UUID NOT NULL,
  can_view_student_data BOOLEAN DEFAULT TRUE,
  can_edit_student_data BOOLEAN DEFAULT FALSE,
  can_view_lessons BOOLEAN DEFAULT TRUE,
  can_edit_lessons BOOLEAN DEFAULT TRUE,
  can_view_progress BOOLEAN DEFAULT TRUE,
  can_edit_progress BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(teacher_id, student_id)
);

-- 啟用 RLS
ALTER TABLE hanami_teacher_student_relations ENABLE ROW LEVEL SECURITY;

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_teacher_student_teacher_id ON hanami_teacher_student_relations(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_student_student_id ON hanami_teacher_student_relations(student_id);

-- 3. 家長-學生關聯表（用於權限控制）
CREATE TABLE IF NOT EXISTS hanami_parent_student_relations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL,
  student_id UUID NOT NULL,
  can_view_student_data BOOLEAN DEFAULT TRUE,
  can_view_lessons BOOLEAN DEFAULT TRUE,
  can_view_progress BOOLEAN DEFAULT TRUE,
  can_view_financial_data BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(parent_id, student_id)
);

-- 啟用 RLS
ALTER TABLE hanami_parent_student_relations ENABLE ROW LEVEL SECURITY;

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_parent_student_parent_id ON hanami_parent_student_relations(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_student_id ON hanami_parent_student_relations(student_id);

-- 4. 創建更新時間觸發器函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 為所有表創建觸發器
CREATE TRIGGER update_user_permissions_updated_at 
    BEFORE UPDATE ON hanami_user_permissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_student_relations_updated_at 
    BEFORE UPDATE ON hanami_teacher_student_relations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parent_student_relations_updated_at 
    BEFORE UPDATE ON hanami_parent_student_relations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. 權限檢查函數
CREATE OR REPLACE FUNCTION get_user_permissions(user_email_param TEXT)
RETURNS JSONB AS $$
DECLARE
  user_perms JSONB;
BEGIN
  SELECT permissions INTO user_perms
  FROM hanami_user_permissions
  WHERE user_email = user_email_param AND is_active = TRUE;
  
  RETURN COALESCE(user_perms, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 檢查用戶是否可以查看特定學生
CREATE OR REPLACE FUNCTION can_view_student(student_id_param UUID, user_email_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_type TEXT;
  user_id UUID;
  has_permission BOOLEAN;
BEGIN
  -- 獲取用戶類型
  SELECT up.user_type, up.user_id, up.can_view_all_students
  INTO user_type, user_id, has_permission
  FROM hanami_user_permissions up
  WHERE up.user_email = user_email_param AND up.is_active = TRUE;
  
  -- 如果沒有找到用戶權限記錄，返回 FALSE
  IF user_type IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- 管理員可以查看所有學生
  IF user_type = 'admin' OR has_permission = TRUE THEN
    RETURN TRUE;
  END IF;
  
  -- 老師檢查是否有權限查看該學生
  IF user_type = 'teacher' THEN
    RETURN EXISTS (
      SELECT 1 FROM hanami_teacher_student_relations tsr
      WHERE tsr.teacher_id = user_id 
      AND tsr.student_id = student_id_param
      AND tsr.can_view_student_data = TRUE
    );
  END IF;
  
  -- 家長檢查是否有權限查看該學生
  IF user_type = 'parent' THEN
    RETURN EXISTS (
      SELECT 1 FROM hanami_parent_student_relations psr
      WHERE psr.parent_id = user_id 
      AND psr.student_id = student_id_param
      AND psr.can_view_student_data = TRUE
    );
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 檢查用戶是否可以編輯特定學生
CREATE OR REPLACE FUNCTION can_edit_student(student_id_param UUID, user_email_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_type TEXT;
  user_id UUID;
  has_permission BOOLEAN;
BEGIN
  -- 獲取用戶類型
  SELECT up.user_type, up.user_id, up.can_manage_students
  INTO user_type, user_id, has_permission
  FROM hanami_user_permissions up
  WHERE up.user_email = user_email_param AND up.is_active = TRUE;
  
  -- 如果沒有找到用戶權限記錄，返回 FALSE
  IF user_type IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- 管理員可以編輯所有學生
  IF user_type = 'admin' OR has_permission = TRUE THEN
    RETURN TRUE;
  END IF;
  
  -- 老師檢查是否有權限編輯該學生
  IF user_type = 'teacher' THEN
    RETURN EXISTS (
      SELECT 1 FROM hanami_teacher_student_relations tsr
      WHERE tsr.teacher_id = user_id 
      AND tsr.student_id = student_id_param
      AND tsr.can_edit_student_data = TRUE
    );
  END IF;
  
  -- 家長不能編輯學生資料
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 檢查用戶是否可以查看特定課程
CREATE OR REPLACE FUNCTION can_view_lesson(lesson_id_param UUID, user_email_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_type TEXT;
  user_id UUID;
  has_permission BOOLEAN;
  student_id UUID;
BEGIN
  -- 獲取用戶類型
  SELECT up.user_type, up.user_id, up.can_view_all_lessons
  INTO user_type, user_id, has_permission
  FROM hanami_user_permissions up
  WHERE up.user_email = user_email_param AND up.is_active = TRUE;
  
  -- 如果沒有找到用戶權限記錄，返回 FALSE
  IF user_type IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- 管理員可以查看所有課程
  IF user_type = 'admin' OR has_permission = TRUE THEN
    RETURN TRUE;
  END IF;
  
  -- 獲取課程的學生ID
  SELECT student_id INTO student_id
  FROM hanami_student_lesson
  WHERE id = lesson_id_param;
  
  -- 老師檢查是否有權限查看該課程
  IF user_type = 'teacher' THEN
    RETURN EXISTS (
      SELECT 1 FROM hanami_teacher_student_relations tsr
      WHERE tsr.teacher_id = user_id 
      AND tsr.student_id = student_id
      AND tsr.can_view_lessons = TRUE
    );
  END IF;
  
  -- 家長檢查是否有權限查看該課程
  IF user_type = 'parent' THEN
    RETURN EXISTS (
      SELECT 1 FROM hanami_parent_student_relations psr
      WHERE psr.parent_id = user_id 
      AND psr.student_id = student_id
      AND psr.can_view_lessons = TRUE
    );
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 設置 RLS 策略

-- 用戶權限表 RLS 策略
CREATE POLICY "Admins can manage all user permissions" ON hanami_user_permissions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM hanami_user_permissions up
    WHERE up.user_email = auth.jwt() ->> 'email'
    AND up.user_type = 'admin'
    AND up.is_active = TRUE
  )
);

CREATE POLICY "Users can view own permissions" ON hanami_user_permissions
FOR SELECT USING (
  user_email = auth.jwt() ->> 'email'
);

-- 老師-學生關聯表 RLS 策略
CREATE POLICY "Admins can manage all teacher-student relations" ON hanami_teacher_student_relations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM hanami_user_permissions up
    WHERE up.user_email = auth.jwt() ->> 'email'
    AND up.user_type = 'admin'
    AND up.is_active = TRUE
  )
);

CREATE POLICY "Teachers can view own student relations" ON hanami_teacher_student_relations
FOR SELECT USING (
  teacher_id IN (
    SELECT he.id FROM hanami_employee he
    WHERE he.teacher_email = auth.jwt() ->> 'email'
  )
);

-- 家長-學生關聯表 RLS 策略
CREATE POLICY "Admins can manage all parent-student relations" ON hanami_parent_student_relations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM hanami_user_permissions up
    WHERE up.user_email = auth.jwt() ->> 'email'
    AND up.user_type = 'admin'
    AND up.is_active = TRUE
  )
);

CREATE POLICY "Parents can view own student relations" ON hanami_parent_student_relations
FOR SELECT USING (
  parent_id IN (
    SELECT hs.id FROM "Hanami_Students" hs
    WHERE hs.parent_email = auth.jwt() ->> 'email'
  )
);

-- 7. 主要資料表的 RLS 策略

-- 學生表 RLS 策略
ALTER TABLE "Hanami_Students" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all students" ON "Hanami_Students"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM hanami_user_permissions up
    WHERE up.user_email = auth.jwt() ->> 'email'
    AND up.user_type = 'admin'
    AND up.is_active = TRUE
  )
);

CREATE POLICY "Teachers can view assigned students" ON "Hanami_Students"
FOR SELECT USING (
  can_view_student(id, auth.jwt() ->> 'email')
);

CREATE POLICY "Teachers can edit assigned students" ON "Hanami_Students"
FOR UPDATE USING (
  can_edit_student(id, auth.jwt() ->> 'email')
);

CREATE POLICY "Parents can view own children" ON "Hanami_Students"
FOR SELECT USING (
  can_view_student(id, auth.jwt() ->> 'email')
);

-- 課程表 RLS 策略
ALTER TABLE hanami_student_lesson ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all lessons" ON hanami_student_lesson
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM hanami_user_permissions up
    WHERE up.user_email = auth.jwt() ->> 'email'
    AND up.user_type = 'admin'
    AND up.is_active = TRUE
  )
);

CREATE POLICY "Users can view authorized lessons" ON hanami_student_lesson
FOR SELECT USING (
  can_view_lesson(id, auth.jwt() ->> 'email')
);

CREATE POLICY "Teachers can edit authorized lessons" ON hanami_student_lesson
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM hanami_user_permissions up
    WHERE up.user_email = auth.jwt() ->> 'email'
    AND up.user_type = 'teacher'
    AND up.is_active = TRUE
  ) AND can_view_lesson(id, auth.jwt() ->> 'email')
);

-- 老師表 RLS 策略
ALTER TABLE hanami_employee ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all teachers" ON hanami_employee
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM hanami_user_permissions up
    WHERE up.user_email = auth.jwt() ->> 'email'
    AND up.user_type = 'admin'
    AND up.is_active = TRUE
  )
);

CREATE POLICY "Teachers can view own profile" ON hanami_employee
FOR SELECT USING (
  teacher_email = auth.jwt() ->> 'email'
);

CREATE POLICY "Teachers can update own profile" ON hanami_employee
FOR UPDATE USING (
  teacher_email = auth.jwt() ->> 'email'
);

-- 8. 設置表權限
GRANT ALL ON hanami_user_permissions TO authenticated;
GRANT ALL ON hanami_teacher_student_relations TO authenticated;
GRANT ALL ON hanami_parent_student_relations TO authenticated;
GRANT ALL ON "Hanami_Students" TO authenticated;
GRANT ALL ON hanami_student_lesson TO authenticated;
GRANT ALL ON hanami_employee TO authenticated;

GRANT ALL ON hanami_user_permissions TO service_role;
GRANT ALL ON hanami_teacher_student_relations TO service_role;
GRANT ALL ON hanami_parent_student_relations TO service_role;
GRANT ALL ON "Hanami_Students" TO service_role;
GRANT ALL ON hanami_student_lesson TO service_role;
GRANT ALL ON hanami_employee TO service_role;

-- 9. 創建預設管理員權限
INSERT INTO hanami_user_permissions (
  user_id,
  user_type,
  user_email,
  permissions,
  accessible_pages,
  can_view_all_students,
  can_view_all_lessons,
  can_manage_teachers,
  can_manage_students,
  can_manage_lessons,
  can_view_financial_data,
  can_export_data
) 
SELECT 
  ha.id,
  'admin',
  ha.admin_email,
  '{"all": true}'::JSONB,
  '["dashboard", "students", "teachers", "lessons", "reports", "settings", "permissions"]'::JSONB,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE
FROM hanami_admin ha
WHERE NOT EXISTS (
  SELECT 1 FROM hanami_user_permissions up 
  WHERE up.user_email = ha.admin_email
);

-- 10. 驗證設置
SELECT '=== RLS 策略設置完成 ===' AS status;

SELECT 
  t.tablename,
  t.rowsecurity as rls_enabled,
  COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.schemaname = 'public' 
  AND t.tablename IN (
    'hanami_user_permissions',
    'hanami_teacher_student_relations', 
    'hanami_parent_student_relations',
    'Hanami_Students',
    'hanami_student_lesson',
    'hanami_employee'
  )
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename; 