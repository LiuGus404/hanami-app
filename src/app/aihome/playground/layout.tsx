'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';

export default function PlaygroundLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { user, loading } = useSaasAuth();

    // 認證保護：未登入時跳轉到登入頁面
    useEffect(() => {
        if (!loading && !user) {
            router.push('/aihome/auth/login?redirect=/aihome/playground');
        }
    }, [user, loading, router]);

    // 載入中狀態
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FFD59A] mx-auto mb-4"></div>
                    <p className="text-[#4B4036]">載入中...</p>
                </div>
            </div>
        );
    }

    // 未登入狀態（等待跳轉）
    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FFD59A] mx-auto mb-4"></div>
                    <p className="text-[#4B4036]">請先登入以使用實驗功能...</p>
                </div>
            </div>
        );
    }

    // 已登入，顯示內容
    return <>{children}</>;
}
