-- 報名連結功能 Migration
-- 用於生成試堂或常規課堂的課堂報名連結，24小時後自動過期

-- 1. 創建報名連結表
CREATE TABLE IF NOT EXISTS public.hanami_registration_links (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  -- 隨機生成的唯一 token（用於 URL）
  token text NOT NULL UNIQUE,
  -- 連結類型：trial（試堂）或 regular（常規）
  link_type text NOT NULL CHECK (link_type IN ('trial', 'regular')),
  -- 關聯的機構 ID
  org_id uuid,
  -- 已填寫的表單資料（JSONB）
  form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- 連結狀態：active（有效）、expired（已過期）、completed（已完成）、cancelled（已取消）
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'completed', 'cancelled')),
  -- 創建者（管理員或教師的 user_id）
  created_by uuid,
  -- 創建時間
  created_at timestamp with time zone DEFAULT now(),
  -- 過期時間（創建後24小時）
  expires_at timestamp with time zone NOT NULL,
  -- 完成時間（當客戶完成報名時）
  completed_at timestamp with time zone,
  -- 關聯的待審核學生 ID（如果已創建）
  pending_student_id uuid,
  -- 關聯的試堂學生 ID（如果已創建）
  trial_student_id uuid,
  -- 備註
  notes text,
  CONSTRAINT hanami_registration_links_pkey PRIMARY KEY (id)
);

-- 2. 創建索引優化查詢
CREATE INDEX IF NOT EXISTS idx_hanami_registration_links_token ON public.hanami_registration_links(token);
CREATE INDEX IF NOT EXISTS idx_hanami_registration_links_org_id ON public.hanami_registration_links(org_id);
CREATE INDEX IF NOT EXISTS idx_hanami_registration_links_status ON public.hanami_registration_links(status);
CREATE INDEX IF NOT EXISTS idx_hanami_registration_links_expires_at ON public.hanami_registration_links(expires_at);
CREATE INDEX IF NOT EXISTS idx_hanami_registration_links_created_by ON public.hanami_registration_links(created_by);
CREATE INDEX IF NOT EXISTS idx_hanami_registration_links_created_at ON public.hanami_registration_links(created_at DESC);

-- 3. 創建自動更新過期狀態的函數
CREATE OR REPLACE FUNCTION public.update_expired_registration_links()
RETURNS void AS $$
BEGIN
  UPDATE public.hanami_registration_links
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- 4. 創建觸發器自動設置過期時間（創建時自動設置為24小時後）
CREATE OR REPLACE FUNCTION public.set_registration_link_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果沒有設置過期時間，自動設置為24小時後
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := now() + INTERVAL '24 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_registration_link_expiry
  BEFORE INSERT ON public.hanami_registration_links
  FOR EACH ROW
  EXECUTE FUNCTION public.set_registration_link_expiry();

-- 5. 創建自動清理過期連結的函數（可選，用於定期清理）
CREATE OR REPLACE FUNCTION public.cleanup_expired_registration_links()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- 刪除過期超過7天的連結（保留一段時間用於審計）
  WITH deleted AS (
    DELETE FROM public.hanami_registration_links
    WHERE status = 'expired'
      AND expires_at < now() - INTERVAL '7 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 6. 添加註釋
COMMENT ON TABLE public.hanami_registration_links IS '報名連結表，用於生成試堂或常規課堂的報名連結，24小時後自動過期';
COMMENT ON COLUMN public.hanami_registration_links.token IS '隨機生成的唯一 token，用於 URL 參數';
COMMENT ON COLUMN public.hanami_registration_links.link_type IS '連結類型：trial（試堂）或 regular（常規）';
COMMENT ON COLUMN public.hanami_registration_links.form_data IS '已填寫的表單資料（JSONB格式）';
COMMENT ON COLUMN public.hanami_registration_links.status IS '連結狀態：active（有效）、expired（已過期）、completed（已完成）、cancelled（已取消）';
COMMENT ON COLUMN public.hanami_registration_links.expires_at IS '過期時間（創建後24小時）';

-- 注意：RLS 策略請執行 2025-01-24_add_rls_registration_links.sql
