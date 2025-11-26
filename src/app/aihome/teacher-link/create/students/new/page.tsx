'use client';

import Image from 'next/image';

import AddRegularStudentForm from '@/components/AddRegularStudentForm';
import BackButton from '@/components/ui/BackButton';

import { TeacherLinkShell, useTeacherLinkOrganization } from '../../TeacherLinkShell';
import { WithPermissionCheck } from '@/components/teacher-link/withPermissionCheck';

function TeacherLinkAddStudentContent() {
  const { orgId, organization, orgDataDisabled } = useTeacherLinkOrganization();

  if (orgDataDisabled || !orgId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-3xl border border-[#EADBC8] bg-white p-8 text-center shadow">
          <Image alt="建立機構" src="/rabbit.png" width={72} height={72} className="mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-[#4B4036]">尚未設定機構資料</h2>
          <p className="mt-2 text-sm text-[#8A7C70]">請先創建屬於您的機構，再新增學生。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F2] px-6 py-10 font-['Quicksand',_sans-serif]">
      <div className="mb-6">
        <BackButton href="/aihome/teacher-link/create/students" label="返回學生管理" />
      </div>

      <AddRegularStudentForm
        redirectPath="/aihome/teacher-link/create/students"
        orgId={orgId}
        orgName={organization?.name ?? null}
      />
    </div>
  );
}

export default function TeacherLinkStudentNewPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/students/new">
      <WithPermissionCheck pageKey="students">
        <TeacherLinkAddStudentContent />
      </WithPermissionCheck>
    </TeacherLinkShell>
  );
}
