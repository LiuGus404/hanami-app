-- ============================================
-- Fix RLS policies for hanami_student_media to allow org members to manage media
-- Executed on: 2025-12-10
-- ============================================

-- hanami_student_media

DROP POLICY IF EXISTS "Admins can manage student media" ON hanami_student_media;
DROP POLICY IF EXISTS "Members can manage student media in their orgs" ON hanami_student_media;

-- Allow organization members (e.g. teachers) to manage (INSERT, UPDATE, DELETE, SELECT) media
-- IF the media belongs to their organization.
CREATE POLICY "Members can manage student media in their orgs" ON hanami_student_media
FOR ALL
USING (
  org_id IS NULL OR is_org_member(org_id, COALESCE(auth.jwt() ->> 'email', ''))
)
WITH CHECK (
  org_id IS NULL OR is_org_member(org_id, COALESCE(auth.jwt() ->> 'email', ''))
);


-- hanami_student_media_quota

DROP POLICY IF EXISTS "Admins can manage student media quota" ON hanami_student_media_quota;
DROP POLICY IF EXISTS "Members can manage student media quota in their orgs" ON hanami_student_media_quota;

-- Allow organization members to view and update quotas (e.g. increment usage count)
CREATE POLICY "Members can manage student media quota in their orgs" ON hanami_student_media_quota
FOR ALL
USING (
  org_id IS NULL OR is_org_member(org_id, COALESCE(auth.jwt() ->> 'email', ''))
)
WITH CHECK (
  org_id IS NULL OR is_org_member(org_id, COALESCE(auth.jwt() ->> 'email', ''))
);
