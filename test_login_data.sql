-- 測試登入資料插入腳本
-- 這個腳本會為每個用戶類型創建測試帳戶

-- 插入管理員測試資料
INSERT INTO hanami_admin (admin_email, admin_name, admin_password, role) 
VALUES 
  ('admin@hanami.com', '系統管理員', 'admin123', 'admin'),
  ('test@hanami.com', '測試管理員', 'test123', 'admin')
ON CONFLICT (admin_email) DO UPDATE SET
  admin_name = EXCLUDED.admin_name,
  admin_password = EXCLUDED.admin_password,
  role = EXCLUDED.role;

-- 插入老師測試資料
INSERT INTO hanami_employee (teacher_email, teacher_fullname, teacher_nickname, teacher_password, teacher_role, teacher_status) 
VALUES 
  ('teacher@hanami.com', '張老師', '張老師', 'teacher123', '音樂老師', 'active'),
  ('music@hanami.com', '李老師', '李老師', 'music123', '音樂老師', 'active'),
  ('piano@hanami.com', '王老師', '王老師', 'piano123', '鋼琴老師', 'active')
ON CONFLICT (teacher_email) DO UPDATE SET
  teacher_fullname = EXCLUDED.teacher_fullname,
  teacher_nickname = EXCLUDED.teacher_nickname,
  teacher_password = EXCLUDED.teacher_password,
  teacher_role = EXCLUDED.teacher_role,
  teacher_status = EXCLUDED.teacher_status;

-- 插入學生/家長測試資料
INSERT INTO Hanami_Students (full_name, student_email, student_password, parent_email, contact_number, student_type, student_teacher) 
VALUES 
  ('小明', 'student1@hanami.com', 'student123', 'parent1@hanami.com', '0912345678', 'regular', (SELECT id FROM hanami_employee WHERE teacher_email = 'teacher@hanami.com' LIMIT 1)),
  ('小華', 'student2@hanami.com', 'student456', 'parent2@hanami.com', '0923456789', 'regular', (SELECT id FROM hanami_employee WHERE teacher_email = 'music@hanami.com' LIMIT 1)),
  ('小美', 'student3@hanami.com', 'student789', 'parent3@hanami.com', '0934567890', 'regular', (SELECT id FROM hanami_employee WHERE teacher_email = 'piano@hanami.com' LIMIT 1))
ON CONFLICT (student_email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  student_password = EXCLUDED.student_password,
  parent_email = EXCLUDED.parent_email,
  contact_number = EXCLUDED.contact_number,
  student_type = EXCLUDED.student_type,
  student_teacher = EXCLUDED.student_teacher;

-- 顯示插入的測試資料
SELECT '管理員測試帳戶:' as account_type, admin_email as email, admin_password as password FROM hanami_admin WHERE admin_email IN ('admin@hanami.com', 'test@hanami.com')
UNION ALL
SELECT '老師測試帳戶:' as account_type, teacher_email as email, teacher_password as password FROM hanami_employee WHERE teacher_email IN ('teacher@hanami.com', 'music@hanami.com', 'piano@hanami.com')
UNION ALL
SELECT '學生/家長測試帳戶:' as account_type, student_email as email, student_password as password FROM Hanami_Students WHERE student_email IN ('student1@hanami.com', 'student2@hanami.com', 'student3@hanami.com'); 