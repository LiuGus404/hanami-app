'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HomeIcon } from '@heroicons/react/24/outline';

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useSaasAuth();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('正在驗證您的登入資訊...');

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const checkSession = async () => {
            // 檢查 URL 是否有錯誤參數
            const error = searchParams.get('error');
            const errorDescription = searchParams.get('error_description');

            if (error) {
                console.error('Auth callback error:', error, errorDescription);
                setStatus('error');
                setMessage(errorDescription || '登入過程中發生錯誤');
                return;
            }

            // 如果已經有用戶資料，表示登入成功
            if (user) {
                setStatus('success');
                setMessage('登入成功！正在跳轉...');

                // 獲取重定向目標
                const next = searchParams.get('next') || '/aihome/dashboard';

                // 短暫延遲後跳轉，讓用戶看到成功訊息
                timeoutId = setTimeout(() => {
                    router.push(next);
                }, 1000);
                return;
            }

            // 如果還沒有用戶資料，但也沒有錯誤，可能是正在處理中
            // 設置一個超時，如果太久沒有結果就顯示錯誤
            timeoutId = setTimeout(() => {
                if (!user) {
                    setStatus('error');
                    setMessage('驗證超時，請重試');
                }
            }, 10000); // 10秒超時
        };

        checkSession();

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [user, searchParams, router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <HanamiCard className="p-8 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 relative">
                        <img
                            src="/@hanami.png"
                            alt="HanamiEcho Logo"
                            className="w-full h-full object-contain"
                        />
                    </div>

                    {status === 'loading' && (
                        <>
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4B4036] mx-auto mb-6"></div>
                            <h2 className="text-xl font-semibold text-[#4B4036] mb-2">處理中</h2>
                            <p className="text-[#2B3A3B]">{message}</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-[#4B4036] mb-2">登入成功</h2>
                            <p className="text-[#2B3A3B]">{message}</p>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-[#4B4036] mb-2">登入失敗</h2>
                            <p className="text-[#2B3A3B] mb-6">{message}</p>

                            <div className="space-y-3">
                                <button
                                    onClick={() => router.push('/aihome/auth/login')}
                                    className="w-full px-4 py-2 bg-[#4B4036] text-white rounded-xl hover:bg-[#2B3A3B] transition-colors"
                                >
                                    返回登入頁面
                                </button>
                                <button
                                    onClick={() => router.push('/')}
                                    className="flex items-center justify-center space-x-2 w-full px-4 py-2 text-sm text-[#2B3A3B] hover:text-[#4B4036] hover:bg-[#FFD59A]/20 rounded-lg transition-all duration-200"
                                >
                                    <HomeIcon className="w-4 h-4" />
                                    <span>返回主頁</span>
                                </button>
                            </div>
                        </>
                    )}
                </HanamiCard>
            </div>
        </div>
    );
}
