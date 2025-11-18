'use client';

import ClassActivitiesPage from '@/app/admin/class-activities/page';
import { TeacherLinkShell, useTeacherLinkOrganization } from '../TeacherLinkShell';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function TeacherLinkClassActivitiesContent() {
  const { orgId, organization } = useTeacherLinkOrganization();

  const resolvedOrgId =
    orgId ??
    (organization?.id && UUID_REGEX.test(organization.id)
      ? organization.id
      : null);

  return (
    <ClassActivitiesPage
      hideCalendarButton
      forcedOrgId={resolvedOrgId}
      forcedOrgName={organization?.name ?? null}
      disableOrgFallback
    />
  );
}

export default function TeacherLinkCreateClassActivitiesPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/class-activities">
      <TeacherLinkClassActivitiesContent />
    </TeacherLinkShell>
  );
}
