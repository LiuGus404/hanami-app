'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import HanamiLoginForm from '@/components/ui/HanamiLoginForm';
import { validateUserCredentials, setUserSession } from '@/lib/authUtils';

const loginSchema = z.object({
  email: z.string().email('請輸入有效的電子郵件'),
  password: z.string().min(1, '請輸入密碼'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

  const handleLogin = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      // 檢查是否在註冊申請中
      const { data: registrationRequest } = await supabase
        .from('registration_requests')
        .select('*')
        .eq('email', email)
        .single();

      if (registrationRequest) {
        if (registrationRequest.status === 'pending') {
          setError('您的註冊申請正在審核中，請等待管理員審核');
          return;
        } else if (registrationRequest.status === 'rejected') {
          setError(`您的註冊申請已被拒絕。原因：${registrationRequest.rejection_reason || '未提供'}`);
          return;
        }
      }

      // 使用舊的認證系統驗證用戶
      const result = await validateUserCredentials(email, password);

      if (result.success && result.user) {
        // 設置用戶會話
        setUserSession(result.user);

        // 根據角色重定向到相應的儀表板
        switch (result.user.role) {
          case 'admin':
            router.push('/admin');
            break;
          case 'teacher':
            router.push('/teacher/dashboard');
            break;
          case 'parent':
            router.push('/parent/dashboard');
            break;
          default:
            setError('未知的用戶角色');
        }
      } else {
        setError(result.error || '登入失敗');
      }

    } catch (err) {
      console.error('登入錯誤:', err);
      setError('登入過程中發生錯誤，請重試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] font-['Quicksand',_sans-serif] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* 顯示訊息 */}
        {searchParams.get('message') && (
          <div className="mb-4 bg-[#E3F2FD] border border-[#2196F3] text-[#1976D2] px-4 py-3 rounded-xl text-sm">
            {searchParams.get('message')}
          </div>
        )}

        <HanamiLoginForm
          error={error || undefined}
          loading={loading}
          subtitle="請登入"
          title="Hanami登入"
          userType="admin"
          onBackToHome={() => router.push('/')}
          onSubmit={handleLogin}
        />
      </div>
    </div>
  );
} 