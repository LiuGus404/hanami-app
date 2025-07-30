'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('正在驗證您的郵箱...');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type');

        if (!token_hash || type !== 'signup') {
          setStatus('error');
          setMessage('無效的驗證連結');
          return;
        }

        // 驗證郵箱
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'signup'
        });

        if (error) {
          console.error('郵箱驗證錯誤:', error);
          setStatus('error');
          setMessage(`驗證失敗: ${error.message}`);
          return;
        }

        if (data.user) {
          // 更新註冊申請狀態
          const { error: updateError } = await supabase
            .from('registration_requests')
            .update({ 
              status: 'pending_approval',
              verified_at: new Date().toISOString()
            })
            .eq('email', data.user.email);

          if (updateError) {
            console.error('更新註冊申請狀態錯誤:', updateError);
          }

          setStatus('success');
          setMessage('郵箱驗證成功！您的註冊申請已提交給管理員審核，請等待批准。');
        }

      } catch (error) {
        console.error('驗證處理錯誤:', error);
        setStatus('error');
        setMessage('驗證過程中發生錯誤');
      }
    };

    verifyEmail();
  }, [searchParams]);

  const handleLogin = () => {
    window.location.href = '/login';
  };

  const handleHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] flex items-center justify-center p-4">
      <HanamiCard className="max-w-md w-full p-8">
        <div className="text-center">
          {status === 'loading' && (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB6C1] mx-auto mb-4"></div>
          )}
          
          {status === 'success' && (
            <div className="text-green-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          
          {status === 'error' && (
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}

          <h1 className="text-2xl font-bold text-[#4B4036] mb-4">
            {status === 'loading' && '郵箱驗證中'}
            {status === 'success' && '驗證成功'}
            {status === 'error' && '驗證失敗'}
          </h1>

          <p className="text-[#2B3A3B] mb-6">
            {message}
          </p>

          {status === 'success' && (
            <div className="space-y-3">
              <HanamiButton
                onClick={handleLogin}
                variant="primary"
                className="w-full"
              >
                前往登入
              </HanamiButton>
              <HanamiButton
                onClick={handleHome}
                variant="secondary"
                className="w-full"
              >
                返回首頁
              </HanamiButton>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <HanamiButton
                onClick={handleHome}
                variant="primary"
                className="w-full"
              >
                返回首頁
              </HanamiButton>
            </div>
          )}
        </div>
      </HanamiCard>
    </div>
  );
} 