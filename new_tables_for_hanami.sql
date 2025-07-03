-- =====================================================
-- Hanami Web 新表格建立腳本
-- 支援三種用戶角色：合作老師、管理員、家長
-- =====================================================

-- 1. 家長資料表
CREATE TABLE IF NOT EXISTS hanami_parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_email TEXT UNIQUE NOT NULL,
  parent_password TEXT,
  parent_name TEXT NOT NULL,
  parent_phone TEXT,
  parent_address TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 家長-學生關聯表
CREATE TABLE IF NOT EXISTS hanami_parent_student_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES hanami_parents(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES "Hanami_Students"(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL CHECK (relationship IN ('father', 'mother', 'guardian', 'other')),
  is_primary_contact BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(parent_id, student_id)
);

-- 3. 學生證書表
CREATE TABLE IF NOT EXISTS hanami_student_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES "Hanami_Students"(id) ON DELETE CASCADE,
  certificate_name TEXT NOT NULL,
  certificate_type TEXT NOT NULL CHECK (certificate_type IN ('achievement', 'completion', 'participation', 'excellence')),
  certificate_url TEXT,
  certificate_file_path TEXT,
  issued_date DATE NOT NULL,
  issued_by TEXT,
  issued_by_teacher_id UUID REFERENCES hanami_employee(id),
  certificate_description TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 學生評語表
CREATE TABLE IF NOT EXISTS hanami_student_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES "Hanami_Students"(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES hanami_employee(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES hanami_student_lesson(id) ON DELETE SET NULL,
  comment_text TEXT NOT NULL,
  comment_type TEXT NOT NULL CHECK (comment_type IN ('progress', 'behavior', 'achievement', 'suggestion', 'concern')),
  comment_category TEXT CHECK (comment_category IN ('academic', 'social', 'emotional', 'physical', 'general')),
  is_visible_to_parent BOOLEAN DEFAULT true,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 優惠券表
CREATE TABLE IF NOT EXISTS hanami_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_code TEXT UNIQUE NOT NULL,
  coupon_name TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_lesson')),
  discount_value NUMERIC NOT NULL,
  minimum_purchase NUMERIC DEFAULT 0,
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  usage_limit INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES hanami_admin(id),
  coupon_description TEXT,
  terms_and_conditions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 學生優惠券使用記錄
CREATE TABLE IF NOT EXISTS hanami_student_coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES "Hanami_Students"(id) ON DELETE CASCADE,
  coupon_id UUID NOT NULL REFERENCES hanami_coupons(id) ON DELETE CASCADE,
  package_id UUID REFERENCES "Hanami_Student_Package"(id) ON DELETE SET NULL,
  discount_applied NUMERIC NOT NULL,
  original_amount NUMERIC,
  final_amount NUMERIC,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_by UUID REFERENCES hanami_admin(id),
  notes TEXT
);

-- 7. 教師工作任務表
CREATE TABLE IF NOT EXISTS hanami_teacher_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES hanami_employee(id) ON DELETE CASCADE,
  task_title TEXT NOT NULL,
  task_description TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN ('lesson_prep', 'student_assessment', 'admin_task', 'training', 'meeting', 'other')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'on_hold')),
  due_date DATE,
  due_time TIME,
  estimated_hours NUMERIC,
  actual_hours NUMERIC,
  assigned_by UUID NOT NULL REFERENCES hanami_admin(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 學生學習進度表
CREATE TABLE IF NOT EXISTS hanami_student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES "Hanami_Students"(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES hanami_student_lesson(id) ON DELETE SET NULL,
  lesson_date DATE,
  lesson_type lesson_type_enum,
  duration_minutes INTEGER,
  progress_notes TEXT,
  next_goal TEXT,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. 課程活動記錄表
CREATE TABLE IF NOT EXISTS hanami_lesson_activity_log (
  lesson_id UUID PRIMARY KEY REFERENCES hanami_student_lesson(id) ON DELETE CASCADE,
  activity_name TEXT,
  learning_focus TEXT,
  materials_used TEXT,
  teacher_reflection TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. 課程類型表
CREATE TABLE IF NOT EXISTS "Hanami_CourseTypes" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. 學生課程包歷史記錄表
CREATE TABLE IF NOT EXISTS hanami_student_package_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES "Hanami_Students"(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES "Hanami_Student_Package"(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('created', 'activated', 'paused', 'resumed', 'completed', 'cancelled', 'refunded')),
  action_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  action_by UUID REFERENCES hanami_admin(id),
  action_notes TEXT,
  previous_status package_status_type,
  new_status package_status_type,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. 系統通知表
CREATE TABLE IF NOT EXISTS hanami_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('student', 'parent', 'teacher', 'admin')),
  recipient_id UUID NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('lesson_reminder', 'payment_due', 'achievement', 'system_update', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  is_urgent BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 索引建立
-- =====================================================

-- 家長相關索引
CREATE INDEX IF NOT EXISTS idx_hanami_parents_email ON hanami_parents(parent_email);
CREATE INDEX IF NOT EXISTS idx_parent_student_relations_parent_id ON hanami_parent_student_relations(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_relations_student_id ON hanami_parent_student_relations(student_id);

-- 證書相關索引
CREATE INDEX IF NOT EXISTS idx_student_certificates_student_id ON hanami_student_certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_student_certificates_issued_date ON hanami_student_certificates(issued_date);
CREATE INDEX IF NOT EXISTS idx_student_certificates_type ON hanami_student_certificates(certificate_type);

-- 評語相關索引
CREATE INDEX IF NOT EXISTS idx_student_comments_student_id ON hanami_student_comments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_comments_teacher_id ON hanami_student_comments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_student_comments_lesson_id ON hanami_student_comments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_student_comments_type ON hanami_student_comments(comment_type);

-- 優惠券相關索引
CREATE INDEX IF NOT EXISTS idx_coupons_code ON hanami_coupons(coupon_code);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_dates ON hanami_coupons(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON hanami_coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_student_coupon_usage_student_id ON hanami_student_coupon_usage(student_id);
CREATE INDEX IF NOT EXISTS idx_student_coupon_usage_coupon_id ON hanami_student_coupon_usage(coupon_id);

-- 教師任務相關索引
CREATE INDEX IF NOT EXISTS idx_teacher_tasks_teacher_id ON hanami_teacher_tasks(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_tasks_status ON hanami_teacher_tasks(status);
CREATE INDEX IF NOT EXISTS idx_teacher_tasks_priority ON hanami_teacher_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_teacher_tasks_due_date ON hanami_teacher_tasks(due_date);

-- 通知相關索引
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON hanami_notifications(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON hanami_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_urgent ON hanami_notifications(is_urgent);

-- =====================================================
-- 觸發器函數
-- =====================================================

-- 更新時間戳觸發器函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 為所有新表格建立更新時間戳觸發器
CREATE TRIGGER update_hanami_parents_updated_at BEFORE UPDATE ON hanami_parents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hanami_student_certificates_updated_at BEFORE UPDATE ON hanami_student_certificates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hanami_student_comments_updated_at BEFORE UPDATE ON hanami_student_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hanami_coupons_updated_at BEFORE UPDATE ON hanami_coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hanami_teacher_tasks_updated_at BEFORE UPDATE ON hanami_teacher_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hanami_student_progress_updated_at BEFORE UPDATE ON hanami_student_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hanami_lesson_activity_log_updated_at BEFORE UPDATE ON hanami_lesson_activity_log FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hanami_notifications_updated_at BEFORE UPDATE ON hanami_notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 權限設置
-- =====================================================

-- 授予所有權限給 authenticated 角色
GRANT ALL ON hanami_parents TO authenticated;
GRANT ALL ON hanami_parent_student_relations TO authenticated;
GRANT ALL ON hanami_student_certificates TO authenticated;
GRANT ALL ON hanami_student_comments TO authenticated;
GRANT ALL ON hanami_coupons TO authenticated;
GRANT ALL ON hanami_student_coupon_usage TO authenticated;
GRANT ALL ON hanami_teacher_tasks TO authenticated;
GRANT ALL ON hanami_student_progress TO authenticated;
GRANT ALL ON hanami_lesson_activity_log TO authenticated;
GRANT ALL ON "Hanami_CourseTypes" TO authenticated;
GRANT ALL ON hanami_student_package_history TO authenticated;
GRANT ALL ON hanami_notifications TO authenticated;

-- 授予所有權限給 service_role 角色
GRANT ALL ON hanami_parents TO service_role;
GRANT ALL ON hanami_parent_student_relations TO service_role;
GRANT ALL ON hanami_student_certificates TO service_role;
GRANT ALL ON hanami_student_comments TO service_role;
GRANT ALL ON hanami_coupons TO service_role;
GRANT ALL ON hanami_student_coupon_usage TO service_role;
GRANT ALL ON hanami_teacher_tasks TO service_role;
GRANT ALL ON hanami_student_progress TO service_role;
GRANT ALL ON hanami_lesson_activity_log TO service_role;
GRANT ALL ON "Hanami_CourseTypes" TO service_role;
GRANT ALL ON hanami_student_package_history TO service_role;
GRANT ALL ON hanami_notifications TO service_role;

-- =====================================================
-- 初始資料插入
-- =====================================================

-- 插入預設課程類型
INSERT INTO "Hanami_CourseTypes" (name, status) VALUES 
  ('音樂課程', true),
  ('語言課程', true),
  ('藝術課程', true),
  ('運動課程', true),
  ('數學課程', true),
  ('科學課程', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 驗證查詢
-- =====================================================

-- 檢查表格是否成功建立
SELECT 
  table_name,
  column_count,
  has_rls
FROM (
  SELECT 
    t.table_name,
    COUNT(c.column_name) as column_count,
    CASE WHEN p.policyname IS NOT NULL THEN true ELSE false END as has_rls
  FROM information_schema.tables t
  LEFT JOIN information_schema.columns c ON t.table_name = c.table_name AND c.table_schema = 'public'
  LEFT JOIN pg_policies p ON t.table_name = p.tablename
  WHERE t.table_schema = 'public' 
    AND t.table_name LIKE 'hanami_%'
    AND t.table_type = 'BASE TABLE'
  GROUP BY t.table_name, p.policyname
) subquery
ORDER BY table_name; 