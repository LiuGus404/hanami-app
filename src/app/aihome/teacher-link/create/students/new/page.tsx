'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ExclamationTriangleIcon, ArrowUpCircleIcon } from '@heroicons/react/24/outline';

import AddRegularStudentForm from '@/components/AddRegularStudentForm';
import BackButton from '@/components/ui/BackButton';

import { TeacherLinkShell, useTeacherLinkOrganization } from '../../TeacherLinkShell';
import { WithPermissionCheck } from '@/components/teacher-link/withPermissionCheck';
import { useSubscriptionLimit, getSubscriptionWarning } from '@/hooks/useSubscriptionLimit';

function SubscriptionLimitBlock({
  maxStudents,
  currentCount,
  status
}: {
  maxStudents: number;
  currentCount: number;
  status: string;
}) {
  const isSuspended = status === 'suspended';

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-3xl border border-[#EADBC8] bg-white p-8 text-center shadow">
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
          <ExclamationTriangleIcon className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-lg font-semibold text-[#4B4036]">
          {isSuspended ? '訂閱已暫停' : '已達學生上限'}
        </h2>
        <p className="mt-2 text-sm text-[#8A7C70]">
          {isSuspended
            ? '您的訂閱已暫停，學生資料處於只讀模式。請更新付款方式以恢復服務。'
            : `目前已有 ${currentCount}/${maxStudents} 位學生，請升級方案以添加更多學生。`
          }
        </p>
        <Link href="/aihome/teacher-link/create/student-pricing">
          <button className="mt-6 px-6 py-3 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] font-bold rounded-xl shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2">
            <ArrowUpCircleIcon className="w-5 h-5" />
            {isSuspended ? '恢復訂閱' : '升級方案'}
          </button>
        </Link>
      </div>
    </div>
  );
}

function TeacherLinkAddStudentContent() {
  const { orgId, organization, orgDataDisabled } = useTeacherLinkOrganization();
  const { canAdd, maxStudents, currentCount, status, loading } = useSubscriptionLimit(orgId);

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

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-pulse text-[#8A7C70]">檢查訂閱狀態中...</div>
      </div>
    );
  }

  // Block if can't add students
  if (!canAdd) {
    return (
      <SubscriptionLimitBlock
        maxStudents={maxStudents}
        currentCount={currentCount}
        status={status}
      />
    );
  }

  // Get warning message if approaching limit
  const warning = getSubscriptionWarning(status, maxStudents - currentCount, maxStudents);

  return (
    <div className="min-h-screen bg-[#FFF9F2] px-6 py-10 font-['Quicksand',_sans-serif]">
      <div className="mb-6">
        <BackButton href="/aihome/teacher-link/create/students" label="返回學生管理" />
      </div>

      {/* Show warning banner if approaching limit */}
      {warning && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-800">{warning}</p>
            <Link href="/aihome/teacher-link/create/student-pricing" className="text-sm text-amber-700 font-medium hover:underline">
              查看升級選項 →
            </Link>
          </div>
        </div>
      )}

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
