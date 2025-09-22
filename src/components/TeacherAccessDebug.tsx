'use client';

import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { useTeacherAccess } from '@/hooks/saas/useTeacherAccess';

export default function TeacherAccessDebug() {
  const { user, loading } = useSaasAuth();
  const { hasTeacherAccess, teacherAccess, loading: teacherLoading } = useTeacherAccess();

  // 只在開發環境顯示
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-xs z-50">
      <h3 className="font-bold mb-2">調試信息</h3>
      <div className="space-y-1">
        <p>用戶登入: {user ? '✅' : '❌'}</p>
        <p>用戶 Email: {user?.email || 'N/A'}</p>
        <p>教師權限: {hasTeacherAccess ? '✅' : '❌'}</p>
        <p>權限檢查: {teacherLoading ? '⏳' : '✅'}</p>
        <p>權限資料: {teacherAccess ? '✅' : '❌'}</p>
      </div>
    </div>
  );
}
