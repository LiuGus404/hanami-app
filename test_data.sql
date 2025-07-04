-- 測試資料插入腳本
-- 用於測試註冊系統和登入功能

-- 1. 插入測試管理員資料
INSERT INTO public.hanami_admin (
  id,
  admin_name,
  admin_email,
  admin_password,
  admin_phone,
  admin_status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '測試管理員',
  'admin@test.com',
  'admin123',
  '0912345678',
  'active',
  now(),
  now()
);

-- 2. 插入測試教師資料
INSERT INTO public.hanami_employee (
  id,
  teacher_fullname,
  teacher_nickname,
  teacher_role,
  teacher_status,
  teacher_email,
  teacher_phone,
  teacher_address,
  teacher_dob,
  teacher_hsalary,
  teacher_msalary,
  teacher_background,
  teacher_bankid,
  teacher_password,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '測試教師',
  '王老師',
  '音樂教師',
  'active',
  'teacher@test.com',
  '0923456789',
  '台北市信義區測試路123號',
  '1990-01-15',
  500,
  15000,
  '音樂教育學士，有5年教學經驗',
  '1234567890123456',
  'teacher123',
  now(),
  now()
);

-- 3. 插入測試學生/家長資料
INSERT INTO public."Hanami_Students" (
  id,
  full_name,
  student_email,
  student_password,
  parent_email,
  parent_phone,
  student_age,
  student_grade,
  student_status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '測試學生',
  'student@test.com',
  'student123',
  'parent@test.com',
  '0934567890',
  8,
  '小學二年級',
  'active',
  now(),
  now()
);

-- 4. 插入測試註冊申請資料
INSERT INTO public.registration_requests (
  id,
  email,
  full_name,
  phone,
  role,
  status,
  additional_info,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'test.register@example.com',
  '測試註冊用戶',
  '0945678901',
  'parent',
  'pending',
  '{"parentStudentName": "小明", "parentStudentAge": 6}',
  now(),
  now()
);

-- 5. 插入已批准的註冊申請
INSERT INTO public.registration_requests (
  id,
  email,
  full_name,
  phone,
  role,
  status,
  additional_info,
  created_at,
  updated_at,
  reviewed_by,
  reviewed_at
) VALUES (
  gen_random_uuid(),
  'approved@test.com',
  '已批准用戶',
  '0956789012',
  'teacher',
  'approved',
  '{"teacherBackground": "音樂教育碩士", "teacherBankId": "9876543210987654", "teacherAddress": "台北市大安區測試路456號", "teacherDob": "1985-06-20"}',
  now() - interval '2 days',
  now() - interval '1 day',
  (SELECT id FROM public.hanami_admin LIMIT 1),
  now() - interval '1 day'
);

-- 6. 插入被拒絕的註冊申請
INSERT INTO public.registration_requests (
  id,
  email,
  full_name,
  phone,
  role,
  status,
  additional_info,
  created_at,
  updated_at,
  reviewed_by,
  reviewed_at,
  rejection_reason
) VALUES (
  gen_random_uuid(),
  'rejected@test.com',
  '被拒絕用戶',
  '0967890123',
  'admin',
  'rejected',
  '{"teacherBackground": "無相關背景"}',
  now() - interval '3 days',
  now() - interval '2 days',
  (SELECT id FROM public.hanami_admin LIMIT 1),
  now() - interval '2 days',
  '申請資料不完整，請重新填寫'
);

-- 顯示插入的測試資料
SELECT '管理員資料' as type, admin_email as email, admin_name as name FROM public.hanami_admin WHERE admin_email LIKE '%test%'
UNION ALL
SELECT '教師資料' as type, teacher_email as email, teacher_fullname as name FROM public.hanami_employee WHERE teacher_email LIKE '%test%'
UNION ALL
SELECT '學生資料' as type, student_email as email, full_name as name FROM public."Hanami_Students" WHERE student_email LIKE '%test%'
UNION ALL
SELECT '家長資料' as type, parent_email as email, full_name as name FROM public."Hanami_Students" WHERE parent_email LIKE '%test%'
UNION ALL
SELECT '註冊申請' as type, email, full_name as name FROM public.registration_requests WHERE email LIKE '%test%' OR email LIKE '%example%'; 