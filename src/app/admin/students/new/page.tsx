'use client';

// /app/admin/students/add/page.tsx
import AddRegularStudentForm from '@/components/AddRegularStudentForm';
import BackButton from '@/components/ui/BackButton';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useUser } from '@/hooks/useUser';
import { useMemo } from 'react';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const PLACEHOLDER_ORG_IDS = new Set([
  'default-org',
  'unassigned-org-placeholder',
]);

export default function AddStudentPage() {
  const { currentOrganization } = useOrganization();
  const { user } = useUser();

  const effectiveOrgId = useMemo(() => {
    const orgId = currentOrganization?.id || user?.organization?.id || null;
    if (!orgId) return null;
    return UUID_REGEX.test(orgId) && !PLACEHOLDER_ORG_IDS.has(orgId)
      ? orgId
      : null;
  }, [currentOrganization?.id, user?.organization?.id]);

  const orgName = currentOrganization?.name || user?.organization?.name || null;

  return (
    <div className="min-h-screen bg-[#FFF9F2] px-6 py-10 font-['Quicksand',_sans-serif]">
      {/* 返回按鈕 */}
      <div className="mb-6">
        <BackButton href="/admin/students" label="返回學生管理" />
      </div>
      
      <AddRegularStudentForm 
        orgId={effectiveOrgId}
        orgName={orgName}
      />
    </div>
  );
}