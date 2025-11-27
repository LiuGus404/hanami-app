'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import HanamiEchoLogo from '@/components/ui/HanamiEchoLogo';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
    const { resetPassword } = useSaasAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast.error('請輸入電子郵件');
            return;
        }

        setIsLoading(true);

        try {
            const result = await resetPassword(email);

            if (result.success) {
                setIsSent(true);
                toast.success('重設密碼郵件已發送');
            } else {
                toast.error(result.error || '發送失敗');
            }
        } catch (error) {
            toast.error('發生錯誤，請稍後再試');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md"
            >
                {/* 返回登入按鈕 */}
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    onClick={() => router.push('/aihome/auth/login')}
                    className="group flex items-center gap-2 mb-6 px-4 py-2 rounded-xl bg-white/50 hover:bg-white/80 border border-[#EADBC8] hover:border-[#FFD59A] transition-all duration-200 text-[#4B4036] hover:text-[#FFD59A]"
                >
                    <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
                    <span className="font-medium">返回登入</span>
                </motion.button>

                <HanamiCard className="p-8">
                    <div className="text-center mb-8">
                        <HanamiEchoLogo size="lg" className="mx-auto mb-6" />
                        <h1 className="text-3xl font-bold text-[#4B4036] mb-2">
                            重設密碼
                        </h1>
                        <p className="text-[#2B3A3B]">
                            輸入您的電子郵件以重設密碼
                        </p>
                    </div>

                    {!isSent ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-[#4B4036] mb-2">
                                    電子郵箱
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="請輸入您的郵箱"
                                    className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent transition-all duration-200 bg-white/50"
                                />
                            </div>

                            <HanamiButton
                                type="submit"
                                className="w-full"
                                size="lg"
                                disabled={isLoading}
                            >
                                {isLoading ? '發送中...' : '發送重設連結'}
                            </HanamiButton>
                        </form>
                    ) : (
                        <div className="text-center space-y-6">
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                <p className="text-green-800">
                                    重設密碼連結已發送至您的信箱：<br />
                                    <span className="font-bold">{email}</span>
                                </p>
                            </div>
                            <p className="text-sm text-[#4B4036]">
                                請檢查您的收件匣（包含垃圾郵件），點擊連結以設定新密碼。
                            </p>
                            <HanamiButton
                                onClick={() => setIsSent(false)}
                                variant="secondary"
                                className="w-full"
                            >
                                重新發送
                            </HanamiButton>
                        </div>
                    )}
                </HanamiCard>
            </motion.div>
        </div>
    );
}
