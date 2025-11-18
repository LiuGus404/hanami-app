'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function TeacherLinkIndexPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const queryString = searchParams.toString();
    const targetPath = queryString
      ? `/aihome/teacher-link/create?${queryString}`
      : '/aihome/teacher-link/create';

    router.replace(targetPath);
  }, [router, searchParams]);

  return null;
}

