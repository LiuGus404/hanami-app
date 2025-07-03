-- =====================================================
-- Hanami Web 新表格 RLS 策略設置
-- 支援三種用戶角色：合作老師、管理員、家長
-- =====================================================

-- 1. 家長資料表 RLS 策略
ALTER TABLE hanami_parents ENABLE ROW LEVEL SECURITY;

-- 家長只能查看和修改自己的資料
CREATE POLICY "Parents can view own data" ON hanami_parents
FOR SELECT USING (id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Parents can update own data" ON hanami_parents
FOR UPDATE USING (id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Parents can insert own data" ON hanami_parents
FOR INSERT WITH CHECK (id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- 管理員可以管理所有家長資料
CREATE POLICY "Admins can manage all parents" ON hanami_parents
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 2. 家長-學生關聯表 RLS 策略
ALTER TABLE hanami_parent_student_relations ENABLE ROW LEVEL SECURITY;

-- 家長只能查看自己與學生的關聯
CREATE POLICY "Parents can view own student relations" ON hanami_parent_student_relations
FOR SELECT USING (
  parent_id = auth.uid() OR 
  auth.jwt() ->> 'role' = 'admin' OR
  auth.jwt() ->> 'role' = 'teacher'
);

CREATE POLICY "Parents can manage own student relations" ON hanami_parent_student_relations
FOR ALL USING (
  parent_id = auth.uid() OR 
  auth.jwt() ->> 'role' = 'admin'
);

-- 3. 學生證書表 RLS 策略
ALTER TABLE hanami_student_certificates ENABLE ROW LEVEL SECURITY;

-- 家長只能查看自己孩子的證書
CREATE POLICY "Parents can view own children certificates" ON hanami_student_certificates
FOR SELECT USING (
  student_id IN (
    SELECT student_id FROM hanami_parent_student_relations 
    WHERE parent_id = auth.uid()
  ) OR 
  auth.jwt() ->> 'role' = 'admin' OR
  auth.jwt() ->> 'role' = 'teacher'
);

-- 教師可以查看自己學生的證書
CREATE POLICY "Teachers can view assigned students certificates" ON hanami_student_certificates
FOR SELECT USING (
  student_id IN (
    SELECT id FROM "Hanami_Students" 
    WHERE student_teacher = (
      SELECT teacher_nickname FROM hanami_employee WHERE id = auth.uid()
    )
  ) OR 
  auth.jwt() ->> 'role' = 'admin'
);

-- 管理員和教師可以管理證書
CREATE POLICY "Admins and teachers can manage certificates" ON hanami_student_certificates
FOR ALL USING (
  auth.jwt() ->> 'role' = 'admin' OR
  auth.jwt() ->> 'role' = 'teacher'
);

-- 4. 學生評語表 RLS 策略
ALTER TABLE hanami_student_comments ENABLE ROW LEVEL SECURITY;

-- 家長只能查看自己孩子的公開評語
CREATE POLICY "Parents can view own children comments" ON hanami_student_comments
FOR SELECT USING (
  (student_id IN (
    SELECT student_id FROM hanami_parent_student_relations 
    WHERE parent_id = auth.uid()
  ) AND is_visible_to_parent = true) OR 
  auth.jwt() ->> 'role' = 'admin' OR
  auth.jwt() ->> 'role' = 'teacher'
);

-- 教師可以查看和管理自己學生的評語
CREATE POLICY "Teachers can view assigned students comments" ON hanami_student_comments
FOR SELECT USING (
  student_id IN (
    SELECT id FROM "Hanami_Students" 
    WHERE student_teacher = (
      SELECT teacher_nickname FROM hanami_employee WHERE id = auth.uid()
    )
  ) OR 
  auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Teachers can manage assigned students comments" ON hanami_student_comments
FOR ALL USING (
  teacher_id = auth.uid() OR 
  auth.jwt() ->> 'role' = 'admin'
);

-- 5. 優惠券表 RLS 策略
ALTER TABLE hanami_coupons ENABLE ROW LEVEL SECURITY;

-- 所有用戶可以查看公開的優惠券
CREATE POLICY "Users can view public coupons" ON hanami_coupons
FOR SELECT USING (
  is_public = true OR 
  auth.jwt() ->> 'role' = 'admin'
);

-- 管理員可以管理所有優惠券
CREATE POLICY "Admins can manage all coupons" ON hanami_coupons
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 6. 學生優惠券使用記錄 RLS 策略
ALTER TABLE hanami_student_coupon_usage ENABLE ROW LEVEL SECURITY;

-- 家長只能查看自己孩子的優惠券使用記錄
CREATE POLICY "Parents can view own children coupon usage" ON hanami_student_coupon_usage
FOR SELECT USING (
  student_id IN (
    SELECT student_id FROM hanami_parent_student_relations 
    WHERE parent_id = auth.uid()
  ) OR 
  auth.jwt() ->> 'role' = 'admin'
);

-- 管理員可以管理所有優惠券使用記錄
CREATE POLICY "Admins can manage all coupon usage" ON hanami_student_coupon_usage
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 7. 教師工作任務表 RLS 策略
ALTER TABLE hanami_teacher_tasks ENABLE ROW LEVEL SECURITY;

-- 教師只能查看和管理自己的任務
CREATE POLICY "Teachers can view own tasks" ON hanami_teacher_tasks
FOR SELECT USING (
  teacher_id = auth.uid() OR 
  auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Teachers can update own tasks" ON hanami_teacher_tasks
FOR UPDATE USING (
  teacher_id = auth.uid() OR 
  auth.jwt() ->> 'role' = 'admin'
);

-- 管理員可以管理所有任務
CREATE POLICY "Admins can manage all tasks" ON hanami_teacher_tasks
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 8. 學生學習進度表 RLS 策略
ALTER TABLE hanami_student_progress ENABLE ROW LEVEL SECURITY;

-- 家長只能查看自己孩子的學習進度
CREATE POLICY "Parents can view own children progress" ON hanami_student_progress
FOR SELECT USING (
  student_id IN (
    SELECT student_id FROM hanami_parent_student_relations 
    WHERE parent_id = auth.uid()
  ) OR 
  auth.jwt() ->> 'role' = 'admin' OR
  auth.jwt() ->> 'role' = 'teacher'
);

-- 教師可以查看和管理自己學生的學習進度
CREATE POLICY "Teachers can view assigned students progress" ON hanami_student_progress
FOR SELECT USING (
  student_id IN (
    SELECT id FROM "Hanami_Students" 
    WHERE student_teacher = (
      SELECT teacher_nickname FROM hanami_employee WHERE id = auth.uid()
    )
  ) OR 
  auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Teachers can manage assigned students progress" ON hanami_student_progress
FOR ALL USING (
  auth.jwt() ->> 'role' = 'admin' OR
  auth.jwt() ->> 'role' = 'teacher'
);

-- 9. 課程活動記錄表 RLS 策略
ALTER TABLE hanami_lesson_activity_log ENABLE ROW LEVEL SECURITY;

-- 教師可以查看和管理課程活動記錄
CREATE POLICY "Teachers can view lesson activity logs" ON hanami_lesson_activity_log
FOR SELECT USING (
  lesson_id IN (
    SELECT id FROM hanami_student_lesson 
    WHERE lesson_teacher = (
      SELECT teacher_nickname FROM hanami_employee WHERE id = auth.uid()
    )
  ) OR 
  auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Teachers can manage lesson activity logs" ON hanami_lesson_activity_log
FOR ALL USING (
  auth.jwt() ->> 'role' = 'admin' OR
  auth.jwt() ->> 'role' = 'teacher'
);

-- 10. 課程類型表 RLS 策略
ALTER TABLE "Hanami_CourseTypes" ENABLE ROW LEVEL SECURITY;

-- 所有用戶可以查看課程類型
CREATE POLICY "Users can view course types" ON "Hanami_CourseTypes"
FOR SELECT USING (true);

-- 管理員可以管理課程類型
CREATE POLICY "Admins can manage course types" ON "Hanami_CourseTypes"
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 11. 學生課程包歷史記錄表 RLS 策略
ALTER TABLE hanami_student_package_history ENABLE ROW LEVEL SECURITY;

-- 家長只能查看自己孩子的課程包歷史
CREATE POLICY "Parents can view own children package history" ON hanami_student_package_history
FOR SELECT USING (
  student_id IN (
    SELECT student_id FROM hanami_parent_student_relations 
    WHERE parent_id = auth.uid()
  ) OR 
  auth.jwt() ->> 'role' = 'admin'
);

-- 管理員可以管理所有課程包歷史
CREATE POLICY "Admins can manage all package history" ON hanami_student_package_history
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 12. 系統通知表 RLS 策略
ALTER TABLE hanami_notifications ENABLE ROW LEVEL SECURITY;

-- 用戶只能查看自己的通知
CREATE POLICY "Users can view own notifications" ON hanami_notifications
FOR SELECT USING (
  recipient_id = auth.uid() OR 
  auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Users can update own notifications" ON hanami_notifications
FOR UPDATE USING (
  recipient_id = auth.uid() OR 
  auth.jwt() ->> 'role' = 'admin'
);

-- 管理員可以管理所有通知
CREATE POLICY "Admins can manage all notifications" ON hanami_notifications
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================
-- 特殊權限函數
-- =====================================================

-- 檢查用戶是否為管理員
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.jwt() ->> 'role' = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 檢查用戶是否為教師
CREATE OR REPLACE FUNCTION is_teacher()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.jwt() ->> 'role' = 'teacher';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 檢查用戶是否為家長
CREATE OR REPLACE FUNCTION is_parent()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.jwt() ->> 'role' = 'parent';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 檢查用戶是否為指定學生的家長
CREATE OR REPLACE FUNCTION is_student_parent(student_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM hanami_parent_student_relations 
    WHERE parent_id = auth.uid() AND student_id = student_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 檢查用戶是否為指定學生的教師
CREATE OR REPLACE FUNCTION is_student_teacher(student_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM "Hanami_Students" 
    WHERE id = student_id_param 
    AND student_teacher = (
      SELECT teacher_nickname FROM hanami_employee WHERE id = auth.uid()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 權限驗證
-- =====================================================

-- 檢查 RLS 是否正確啟用
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'hanami_%'
ORDER BY tablename;

-- 檢查策略是否正確建立
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename LIKE 'hanami_%'
ORDER BY tablename, policyname;

-- =====================================================
-- 測試查詢
-- =====================================================

-- 測試家長權限 (需要實際的家長用戶)
-- SELECT * FROM hanami_parents WHERE id = auth.uid();

-- 測試教師權限 (需要實際的教師用戶)
-- SELECT * FROM hanami_teacher_tasks WHERE teacher_id = auth.uid();

-- 測試管理員權限 (需要實際的管理員用戶)
-- SELECT * FROM hanami_coupons; 