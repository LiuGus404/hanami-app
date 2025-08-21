-- 插入測試學生活動資料
-- 用於演示三種不同類型的活動

-- 1. 首先確保有一些測試學生
INSERT INTO "Hanami_Students" (id, full_name, nick_name, student_age, contact_number, student_email, student_type, course_type, student_oid, access_role)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', '張小明', '小明', 48, '0912345678', 'xiaoming@test.com', 'regular', 'piano', 'STU0001', 'student')
ON CONFLICT (student_oid) DO NOTHING;

-- 2. 確保有一些成長樹活動
INSERT INTO hanami_tree_activities (
  id, 
  tree_id, 
  activity_source, 
  custom_activity_name, 
  custom_activity_description, 
  activity_type, 
  difficulty_level, 
  estimated_duration, 
  materials_needed, 
  instructions, 
  learning_objectives, 
  is_active
)
VALUES 
  -- 本次課堂活動
  ('550e8400-e29b-41d4-a716-446655440101', NULL, 'custom', '節奏練習', '透過拍手和跺腳練習基本節奏', 'practice', 2, 15, ARRAY['節拍器', '鼓棒'], '1. 先聽節拍器 2. 跟著拍手 3. 加入跺腳', ARRAY['培養節奏感', '提升協調性'], true),
  
  -- 上次課堂活動
  ('550e8400-e29b-41d4-a716-446655440102', NULL, 'custom', '音階練習', '練習 C 大調音階', 'practice', 3, 20, ARRAY['鋼琴', '樂譜'], '1. 右手彈奏 2. 左手伴奏 3. 雙手合奏', ARRAY['熟悉音階', '提升技巧'], true),
  
  -- 正在學習的活動（跨多堂課）
  ('550e8400-e29b-41d4-a716-446655440103', NULL, 'custom', '小星星變奏曲', '學習演奏小星星變奏曲', 'teaching', 4, 30, ARRAY['鋼琴', '樂譜', '錄音設備'], '1. 分段練習 2. 慢速練習 3. 逐漸加速', ARRAY['提升演奏技巧', '培養音樂表現力'], true),
  
  ('550e8400-e29b-41d4-a716-446655440104', NULL, 'custom', '聽音訓練', '訓練音高辨識能力', 'assessment', 2, 10, ARRAY['鋼琴', '音叉'], '1. 聽單音 2. 聽音程 3. 聽和弦', ARRAY['提升聽力', '培養音感'], true),
  
  ('550e8400-e29b-41d4-a716-446655440105', NULL, 'custom', '即興創作', '根據給定主題進行即興創作', 'custom', 5, 25, ARRAY['鋼琴', '錄音設備'], '1. 聽主題 2. 思考變奏 3. 即興演奏', ARRAY['培養創造力', '提升表現力'], true)
ON CONFLICT (id) DO NOTHING;

-- 3. 創建一些測試課程記錄
INSERT INTO hanami_student_lesson (
  id, 
  student_id, 
  lesson_date, 
  actual_timeslot, 
  course_type, 
  lesson_status, 
  full_name
)
VALUES 
  -- 本次課堂
  ('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440001', '2024-12-19', '09:30:00', 'piano', 'scheduled', '張小明'),
  
  -- 上次課堂
  ('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440001', '2024-12-12', '09:30:00', 'piano', 'completed', '張小明'),
  
  -- 更早的課堂
  ('550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440001', '2024-12-05', '09:30:00', 'piano', 'completed', '張小明')
ON CONFLICT (id) DO NOTHING;

-- 4. 插入本次課堂活動分配
INSERT INTO hanami_student_lesson_activities (
  lesson_id,
  student_id,
  tree_activity_id,
  assigned_by,
  completion_status,
  performance_rating,
  teacher_notes
)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440101', 'teacher1', 'not_started', NULL, '本次課堂重點練習節奏感');

-- 5. 插入上次課堂活動分配
INSERT INTO hanami_student_lesson_activities (
  lesson_id,
  student_id,
  tree_activity_id,
  assigned_by,
  completion_status,
  performance_rating,
  teacher_notes
)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440102', 'teacher1', 'completed', 4, '音階練習完成得很好，可以進入下一階段');

-- 6. 插入正在學習的活動（跨多堂課）
INSERT INTO hanami_student_tree_activity_progress (
  student_id,
  tree_activity_id,
  completion_status,
  performance_rating,
  teacher_notes,
  time_spent,
  attempts_count
)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440103', 'in_progress', 3, '小星星變奏曲正在學習中，需要更多練習', 120, 5),
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440104', 'in_progress', 4, '聽音訓練進步明顯', 60, 3),
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440105', 'not_started', NULL, '即興創作待開始', 0, 0);

-- 7. 為其他學生也創建一些資料
INSERT INTO "Hanami_Students" (id, full_name, nick_name, student_age, contact_number, student_email, student_type, course_type, student_oid, access_role)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440002', '李小華', '小華', 60, '0923456789', 'xiaohua@test.com', 'regular', 'violin', 'STU0002', 'student')
ON CONFLICT (student_oid) DO NOTHING;

INSERT INTO hanami_student_lesson (
  id, 
  student_id, 
  lesson_date, 
  actual_timeslot, 
  course_type, 
  lesson_status, 
  full_name
)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440204', '550e8400-e29b-41d4-a716-446655440002', '2024-12-19', '09:30:00', 'violin', 'scheduled', '李小華')
ON CONFLICT (id) DO NOTHING;

-- 顯示插入結果
SELECT '測試資料插入完成' as status; 
-- 用於演示三種不同類型的活動

-- 1. 首先確保有一些測試學生
INSERT INTO "Hanami_Students" (id, full_name, nick_name, student_age, contact_number, student_email, student_type, course_type, student_oid, access_role)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', '張小明', '小明', 48, '0912345678', 'xiaoming@test.com', 'regular', 'piano', 'STU0001', 'student')
ON CONFLICT (student_oid) DO NOTHING;

-- 2. 確保有一些成長樹活動
INSERT INTO hanami_tree_activities (
  id, 
  tree_id, 
  activity_source, 
  custom_activity_name, 
  custom_activity_description, 
  activity_type, 
  difficulty_level, 
  estimated_duration, 
  materials_needed, 
  instructions, 
  learning_objectives, 
  is_active
)
VALUES 
  -- 本次課堂活動
  ('550e8400-e29b-41d4-a716-446655440101', NULL, 'custom', '節奏練習', '透過拍手和跺腳練習基本節奏', 'practice', 2, 15, ARRAY['節拍器', '鼓棒'], '1. 先聽節拍器 2. 跟著拍手 3. 加入跺腳', ARRAY['培養節奏感', '提升協調性'], true),
  
  -- 上次課堂活動
  ('550e8400-e29b-41d4-a716-446655440102', NULL, 'custom', '音階練習', '練習 C 大調音階', 'practice', 3, 20, ARRAY['鋼琴', '樂譜'], '1. 右手彈奏 2. 左手伴奏 3. 雙手合奏', ARRAY['熟悉音階', '提升技巧'], true),
  
  -- 正在學習的活動（跨多堂課）
  ('550e8400-e29b-41d4-a716-446655440103', NULL, 'custom', '小星星變奏曲', '學習演奏小星星變奏曲', 'teaching', 4, 30, ARRAY['鋼琴', '樂譜', '錄音設備'], '1. 分段練習 2. 慢速練習 3. 逐漸加速', ARRAY['提升演奏技巧', '培養音樂表現力'], true),
  
  ('550e8400-e29b-41d4-a716-446655440104', NULL, 'custom', '聽音訓練', '訓練音高辨識能力', 'assessment', 2, 10, ARRAY['鋼琴', '音叉'], '1. 聽單音 2. 聽音程 3. 聽和弦', ARRAY['提升聽力', '培養音感'], true),
  
  ('550e8400-e29b-41d4-a716-446655440105', NULL, 'custom', '即興創作', '根據給定主題進行即興創作', 'custom', 5, 25, ARRAY['鋼琴', '錄音設備'], '1. 聽主題 2. 思考變奏 3. 即興演奏', ARRAY['培養創造力', '提升表現力'], true)
ON CONFLICT (id) DO NOTHING;

-- 3. 創建一些測試課程記錄
INSERT INTO hanami_student_lesson (
  id, 
  student_id, 
  lesson_date, 
  actual_timeslot, 
  course_type, 
  lesson_status, 
  full_name
)
VALUES 
  -- 本次課堂
  ('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440001', '2024-12-19', '09:30:00', 'piano', 'scheduled', '張小明'),
  
  -- 上次課堂
  ('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440001', '2024-12-12', '09:30:00', 'piano', 'completed', '張小明'),
  
  -- 更早的課堂
  ('550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440001', '2024-12-05', '09:30:00', 'piano', 'completed', '張小明')
ON CONFLICT (id) DO NOTHING;

-- 4. 插入本次課堂活動分配
INSERT INTO hanami_student_lesson_activities (
  lesson_id,
  student_id,
  tree_activity_id,
  assigned_by,
  completion_status,
  performance_rating,
  teacher_notes
)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440101', 'teacher1', 'not_started', NULL, '本次課堂重點練習節奏感');

-- 5. 插入上次課堂活動分配
INSERT INTO hanami_student_lesson_activities (
  lesson_id,
  student_id,
  tree_activity_id,
  assigned_by,
  completion_status,
  performance_rating,
  teacher_notes
)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440102', 'teacher1', 'completed', 4, '音階練習完成得很好，可以進入下一階段');

-- 6. 插入正在學習的活動（跨多堂課）
INSERT INTO hanami_student_tree_activity_progress (
  student_id,
  tree_activity_id,
  completion_status,
  performance_rating,
  teacher_notes,
  time_spent,
  attempts_count
)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440103', 'in_progress', 3, '小星星變奏曲正在學習中，需要更多練習', 120, 5),
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440104', 'in_progress', 4, '聽音訓練進步明顯', 60, 3),
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440105', 'not_started', NULL, '即興創作待開始', 0, 0);

-- 7. 為其他學生也創建一些資料
INSERT INTO "Hanami_Students" (id, full_name, nick_name, student_age, contact_number, student_email, student_type, course_type, student_oid, access_role)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440002', '李小華', '小華', 60, '0923456789', 'xiaohua@test.com', 'regular', 'violin', 'STU0002', 'student')
ON CONFLICT (student_oid) DO NOTHING;

INSERT INTO hanami_student_lesson (
  id, 
  student_id, 
  lesson_date, 
  actual_timeslot, 
  course_type, 
  lesson_status, 
  full_name
)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440204', '550e8400-e29b-41d4-a716-446655440002', '2024-12-19', '09:30:00', 'violin', 'scheduled', '李小華')
ON CONFLICT (id) DO NOTHING;

-- 顯示插入結果
SELECT '測試資料插入完成' as status; 
 