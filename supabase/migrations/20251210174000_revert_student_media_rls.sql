-- ============================================
-- REVERT: Drop RLS policies for hanami_student_media
-- Reason: Applied to incorrect database instance
-- Executed on: 2025-12-10
-- ============================================

-- hanami_student_media
DROP POLICY IF EXISTS "Members can manage student media in their orgs" ON hanami_student_media;

-- Restore previous restrictive policy if needed, or leave it to previous migrations
-- For safety, we just remove the new policy causing potential conflict/confusion if this DB wasn't meant to have it.
-- If the "Admins can manage" policy was dropped, we might want to restore it if this is the "Old" DB.

CREATE POLICY "Admins can manage student media" ON hanami_student_media
FOR ALL
USING (
  org_id IS NULL OR is_org_admin(org_id, COALESCE(auth.jwt() ->> 'email', ''))
)
WITH CHECK (
  org_id IS NULL OR is_org_admin(org_id, COALESCE(auth.jwt() ->> 'email', ''))
);


-- hanami_student_media_quota
DROP POLICY IF EXISTS "Members can manage student media quota in their orgs" ON hanami_student_media_quota;

CREATE POLICY "Admins can manage student media quota" ON hanami_student_media_quota
FOR ALL
USING (
  org_id IS NULL OR is_org_admin(org_id, COALESCE(auth.jwt() ->> 'email', ''))
)
WITH CHECK (
  org_id IS NULL OR is_org_admin(org_id, COALESCE(auth.jwt() ->> 'email', ''))
);
