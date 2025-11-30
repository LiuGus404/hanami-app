'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function TeacherLinkIndexPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 移除機構相關參數，只保留其他查詢參數
    const params = new URLSearchParams(searchParams.toString());
    params.delete('orgId');
    params.delete('orgName');
    params.delete('orgSlug');
    
    const queryString = params.toString();
    const targetPath = queryString
      ? `/aihome/teacher-link/create?${queryString}`
      : '/aihome/teacher-link/create';

    router.replace(targetPath);
  }, [router, searchParams]);

  return null;
}

