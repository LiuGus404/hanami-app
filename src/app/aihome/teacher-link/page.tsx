'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CuteLoadingSpinner from '@/components/ui/CuteLoadingSpinner';

export default function TeacherLinkIndexPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasRedirected = useRef(false);

  // 使用 useMemo 优化参数处理，避免每次渲染都重新计算
  const targetPath = useMemo(() => {
    // 移除機構相關參數，只保留其他查詢參數
    const params = new URLSearchParams(searchParams.toString());
    params.delete('orgId');
    params.delete('orgName');
    params.delete('orgSlug');
    
    const queryString = params.toString();
    return queryString
      ? `/aihome/teacher-link/create?${queryString}`
      : '/aihome/teacher-link/create';
  }, [searchParams]);

  useEffect(() => {
    // 防止重复重定向
    if (hasRedirected.current) return;
    
    hasRedirected.current = true;
    router.replace(targetPath);
  }, [router, targetPath]);

  // 显示加载状态，提供更好的用户体验
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A]">
      <CuteLoadingSpinner message="正在跳轉..." className="h-full min-h-[200px] p-8" />
    </div>
  );
}

