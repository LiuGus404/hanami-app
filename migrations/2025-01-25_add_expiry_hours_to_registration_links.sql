-- 添加 expiry_hours 欄位到報名連結表
-- 用於存儲連結的有效時限（小時數）

-- 1. 添加 expiry_hours 欄位
ALTER TABLE public.hanami_registration_links
ADD COLUMN IF NOT EXISTS expiry_hours integer DEFAULT 24;

-- 2. 添加註釋
COMMENT ON COLUMN public.hanami_registration_links.expiry_hours IS '連結有效時限（小時數），預設為24小時';

-- 3. 更新現有記錄的 expiry_hours（根據 expires_at 和 created_at 計算）
UPDATE public.hanami_registration_links
SET expiry_hours = EXTRACT(EPOCH FROM (expires_at - created_at)) / 3600
WHERE expiry_hours IS NULL OR expiry_hours = 24;

-- 4. 更新觸發器函數，如果提供了 expiry_hours，使用它來計算 expires_at
CREATE OR REPLACE FUNCTION public.set_registration_link_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果沒有設置過期時間，根據 expiry_hours 計算（預設24小時）
  IF NEW.expires_at IS NULL THEN
    IF NEW.expiry_hours IS NOT NULL AND NEW.expiry_hours > 0 THEN
      NEW.expires_at := now() + (NEW.expiry_hours || ' hours')::INTERVAL;
    ELSE
      NEW.expiry_hours := COALESCE(NEW.expiry_hours, 24);
      NEW.expires_at := now() + INTERVAL '24 hours';
    END IF;
  -- 如果設置了 expires_at 但沒有設置 expiry_hours，根據時間差計算
  ELSIF NEW.expiry_hours IS NULL OR NEW.expiry_hours = 24 THEN
    NEW.expiry_hours := EXTRACT(EPOCH FROM (NEW.expires_at - now())) / 3600;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. 添加約束確保 expiry_hours 為正數
ALTER TABLE public.hanami_registration_links
ADD CONSTRAINT check_expiry_hours_positive 
CHECK (expiry_hours IS NULL OR expiry_hours > 0);

