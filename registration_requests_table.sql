-- 創建註冊申請資料表
CREATE TABLE public.registration_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  full_name text NOT NULL,
  phone text NULL,
  role text NOT NULL CHECK (role IN ('admin', 'teacher', 'parent')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  additional_info jsonb NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  reviewed_by uuid NULL,
  reviewed_at timestamp with time zone NULL,
  rejection_reason text NULL,
  CONSTRAINT registration_requests_pkey PRIMARY KEY (id),
  CONSTRAINT registration_requests_email_unique UNIQUE (email)
) TABLESPACE pg_default;

-- 創建索引
CREATE INDEX idx_registration_requests_status ON public.registration_requests(status);
CREATE INDEX idx_registration_requests_role ON public.registration_requests(role);
CREATE INDEX idx_registration_requests_created_at ON public.registration_requests(created_at);

-- 創建觸發器來更新 updated_at
CREATE TRIGGER set_updated_at_on_registration_requests 
  BEFORE UPDATE ON public.registration_requests 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 添加 RLS 策略（如果需要）
ALTER TABLE public.registration_requests ENABLE ROW LEVEL SECURITY;

-- 允許管理員查看所有申請
CREATE POLICY "Allow admins to view all registration requests" ON public.registration_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.hanami_admin 
      WHERE admin_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- 允許管理員更新申請狀態
CREATE POLICY "Allow admins to update registration requests" ON public.registration_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.hanami_admin 
      WHERE admin_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- 允許任何人插入新的申請
CREATE POLICY "Allow anyone to insert registration requests" ON public.registration_requests
  FOR INSERT WITH CHECK (true);

-- 允許申請者查看自己的申請
CREATE POLICY "Allow users to view their own registration requests" ON public.registration_requests
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  ); 