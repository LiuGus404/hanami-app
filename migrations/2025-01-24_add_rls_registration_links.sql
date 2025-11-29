-- ============================================
-- 為 hanami_registration_links 表添加 RLS 保護
-- 執行日期: 2025-01-24
-- 說明: 為報名連結表添加基於機構和創建者的訪問控制
-- ============================================

-- 注意：此腳本需要在執行 2025-01-24_create_registration_links.sql 之後執行
-- 並且需要先執行 2025-01-20_add_rls_policies.sql 以確保 RLS 輔助函數存在

-- ============================================
-- 啟用 RLS
-- ============================================

ALTER TABLE public.hanami_registration_links ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 刪除現有策略（如果存在）
-- ============================================

DROP POLICY IF EXISTS "Users can view registration links in their orgs" ON public.hanami_registration_links;
DROP POLICY IF EXISTS "Users can view their own created links" ON public.hanami_registration_links;
DROP POLICY IF EXISTS "Admins can manage registration links in their orgs" ON public.hanami_registration_links;
DROP POLICY IF EXISTS "Creators can manage their own links" ON public.hanami_registration_links;

-- ============================================
-- SELECT 策略：查看報名連結
-- ============================================

-- 策略 1: 組織成員可以查看自己組織的連結
CREATE POLICY "Users can view registration links in their orgs" 
ON public.hanami_registration_links
FOR SELECT
USING (
  -- 如果沒有 org_id，允許所有已認證用戶查看（用於系統級連結）
  org_id IS NULL 
  OR is_org_member(org_id, COALESCE(auth.jwt() ->> 'email', ''))
);

-- 策略 2: 創建者可以查看自己創建的連結（即使不在同一組織）
-- 注意：此策略通過檢查 created_by 是否對應當前用戶的 ID 來驗證
CREATE POLICY "Users can view their own created links" 
ON public.hanami_registration_links
FOR SELECT
USING (
  -- 檢查是否為創建者（通過 user_id 或 email 匹配）
  created_by IS NOT NULL
  AND (
    -- 檢查 hanami_admin 表
    EXISTS (
      SELECT 1 FROM hanami_admin ha
      WHERE ha.id = hanami_registration_links.created_by
      AND ha.admin_email = COALESCE(auth.jwt() ->> 'email', '')
    )
    -- 檢查 hanami_employee 表
    OR EXISTS (
      SELECT 1 FROM hanami_employee he
      WHERE he.id = hanami_registration_links.created_by
      AND he.teacher_email = COALESCE(auth.jwt() ->> 'email', '')
    )
    -- 檢查 hanami_org_identities 表（如果存在）
    OR EXISTS (
      SELECT 1 FROM hanami_org_identities hoi
      WHERE hoi.user_id = hanami_registration_links.created_by
      AND hoi.user_email = COALESCE(auth.jwt() ->> 'email', '')
      AND hoi.status = 'active'
    )
  )
);

-- ============================================
-- INSERT 策略：創建報名連結
-- ============================================

CREATE POLICY "Admins can create registration links in their orgs" 
ON public.hanami_registration_links
FOR INSERT
WITH CHECK (
  -- 必須是組織管理員才能創建連結
  org_id IS NULL 
  OR is_org_admin(org_id, COALESCE(auth.jwt() ->> 'email', ''))
);

-- ============================================
-- UPDATE 策略：更新報名連結
-- ============================================

-- 策略 1: 組織管理員可以更新自己組織的連結
CREATE POLICY "Admins can update registration links in their orgs" 
ON public.hanami_registration_links
FOR UPDATE
USING (
  org_id IS NULL 
  OR is_org_admin(org_id, COALESCE(auth.jwt() ->> 'email', ''))
)
WITH CHECK (
  org_id IS NULL 
  OR is_org_admin(org_id, COALESCE(auth.jwt() ->> 'email', ''))
);

-- 策略 2: 創建者可以更新自己創建的連結
CREATE POLICY "Creators can update their own links" 
ON public.hanami_registration_links
FOR UPDATE
USING (
  created_by IS NOT NULL
  AND (
    EXISTS (
      SELECT 1 FROM hanami_admin ha
      WHERE ha.id = hanami_registration_links.created_by
      AND ha.admin_email = COALESCE(auth.jwt() ->> 'email', '')
    )
    OR EXISTS (
      SELECT 1 FROM hanami_employee he
      WHERE he.id = hanami_registration_links.created_by
      AND he.teacher_email = COALESCE(auth.jwt() ->> 'email', '')
    )
    OR EXISTS (
      SELECT 1 FROM hanami_org_identities hoi
      WHERE hoi.user_id = hanami_registration_links.created_by
      AND hoi.user_email = COALESCE(auth.jwt() ->> 'email', '')
      AND hoi.status = 'active'
    )
  )
)
WITH CHECK (
  -- 更新時保持相同的創建者驗證
  created_by IS NOT NULL
  AND (
    EXISTS (
      SELECT 1 FROM hanami_admin ha
      WHERE ha.id = hanami_registration_links.created_by
      AND ha.admin_email = COALESCE(auth.jwt() ->> 'email', '')
    )
    OR EXISTS (
      SELECT 1 FROM hanami_employee he
      WHERE he.id = hanami_registration_links.created_by
      AND he.teacher_email = COALESCE(auth.jwt() ->> 'email', '')
    )
    OR EXISTS (
      SELECT 1 FROM hanami_org_identities hoi
      WHERE hoi.user_id = hanami_registration_links.created_by
      AND hoi.user_email = COALESCE(auth.jwt() ->> 'email', '')
      AND hoi.status = 'active'
    )
  )
);

-- ============================================
-- DELETE 策略：刪除報名連結
-- ============================================

-- 策略 1: 組織管理員可以刪除自己組織的連結
CREATE POLICY "Admins can delete registration links in their orgs" 
ON public.hanami_registration_links
FOR DELETE
USING (
  org_id IS NULL 
  OR is_org_admin(org_id, COALESCE(auth.jwt() ->> 'email', ''))
);

-- 策略 2: 創建者可以刪除自己創建的連結
CREATE POLICY "Creators can delete their own links" 
ON public.hanami_registration_links
FOR DELETE
USING (
  created_by IS NOT NULL
  AND (
    EXISTS (
      SELECT 1 FROM hanami_admin ha
      WHERE ha.id = hanami_registration_links.created_by
      AND ha.admin_email = COALESCE(auth.jwt() ->> 'email', '')
    )
    OR EXISTS (
      SELECT 1 FROM hanami_employee he
      WHERE he.id = hanami_registration_links.created_by
      AND he.teacher_email = COALESCE(auth.jwt() ->> 'email', '')
    )
    OR EXISTS (
      SELECT 1 FROM hanami_org_identities hoi
      WHERE hoi.user_id = hanami_registration_links.created_by
      AND hoi.user_email = COALESCE(auth.jwt() ->> 'email', '')
      AND hoi.status = 'active'
    )
  )
);

-- ============================================
-- 添加註釋
-- ============================================

COMMENT ON POLICY "Users can view registration links in their orgs" ON public.hanami_registration_links IS 
'允許組織成員查看自己組織的報名連結';

COMMENT ON POLICY "Users can view their own created links" ON public.hanami_registration_links IS 
'允許創建者查看自己創建的報名連結（即使不在同一組織）';

COMMENT ON POLICY "Admins can create registration links in their orgs" ON public.hanami_registration_links IS 
'允許組織管理員創建報名連結';

COMMENT ON POLICY "Admins can update registration links in their orgs" ON public.hanami_registration_links IS 
'允許組織管理員更新自己組織的報名連結';

COMMENT ON POLICY "Creators can update their own links" ON public.hanami_registration_links IS 
'允許創建者更新自己創建的報名連結';

COMMENT ON POLICY "Admins can delete registration links in their orgs" ON public.hanami_registration_links IS 
'允許組織管理員刪除自己組織的報名連結';

COMMENT ON POLICY "Creators can delete their own links" ON public.hanami_registration_links IS 
'允許創建者刪除自己創建的報名連結';

