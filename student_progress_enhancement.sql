-- 學生進度表增強 SQL
-- 為 hanami_student_progress 表新增審核、發送狀態、AI處理等欄位

-- 新增欄位到現有的 hanami_student_progress 表
ALTER TABLE public.hanami_student_progress 
ADD COLUMN IF NOT EXISTS review_status text DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS review_notes text NULL,
ADD COLUMN IF NOT EXISTS reviewed_by uuid NULL,
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone NULL,
ADD COLUMN IF NOT EXISTS is_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sent_at timestamp with time zone NULL,
ADD COLUMN IF NOT EXISTS ai_processed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_processed_at timestamp with time zone NULL,
ADD COLUMN IF NOT EXISTS ai_feedback text NULL,
ADD COLUMN IF NOT EXISTS ai_suggestions text NULL;

-- 創建索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_student_progress_review_status ON public.hanami_student_progress(review_status);
CREATE INDEX IF NOT EXISTS idx_student_progress_is_sent ON public.hanami_student_progress(is_sent);
CREATE INDEX IF NOT EXISTS idx_student_progress_ai_processed ON public.hanami_student_progress(ai_processed);
CREATE INDEX IF NOT EXISTS idx_student_progress_reviewed_by ON public.hanami_student_progress(reviewed_by);

-- 添加 RLS 策略
ALTER TABLE public.hanami_student_progress ENABLE ROW LEVEL SECURITY;

-- 允許管理員查看所有進度記錄
CREATE POLICY "Allow admins to view all student progress" ON public.hanami_student_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.hanami_admin 
      WHERE admin_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- 允許管理員更新進度記錄
CREATE POLICY "Allow admins to update student progress" ON public.hanami_student_progress
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.hanami_admin 
      WHERE admin_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- 允許管理員插入進度記錄
CREATE POLICY "Allow admins to insert student progress" ON public.hanami_student_progress
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hanami_admin 
      WHERE admin_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- 允許教師查看和更新自己相關的進度記錄
CREATE POLICY "Allow teachers to view their student progress" ON public.hanami_student_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.hanami_employee 
      WHERE teacher_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- 允許教師更新自己相關的進度記錄
CREATE POLICY "Allow teachers to update their student progress" ON public.hanami_student_progress
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.hanami_employee 
      WHERE teacher_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- 創建觸發器來自動更新 reviewed_at 時間戳
CREATE OR REPLACE FUNCTION update_reviewed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.review_status != OLD.review_status THEN
    NEW.reviewed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reviewed_at_trigger
  BEFORE UPDATE ON public.hanami_student_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_reviewed_at();

-- 創建觸發器來自動更新 sent_at 時間戳
CREATE OR REPLACE FUNCTION update_sent_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_sent = true AND OLD.is_sent = false THEN
    NEW.sent_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sent_at_trigger
  BEFORE UPDATE ON public.hanami_student_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_sent_at();

-- 創建觸發器來自動更新 ai_processed_at 時間戳
CREATE OR REPLACE FUNCTION update_ai_processed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ai_processed = true AND OLD.ai_processed = false THEN
    NEW.ai_processed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_processed_at_trigger
  BEFORE UPDATE ON public.hanami_student_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_processed_at(); 