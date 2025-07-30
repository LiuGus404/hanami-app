'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('處理 Auth 回調...');
        
        // 獲取 URL 參數
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (error) {
          console.error('Auth 錯誤:', error, errorDescription);
          setStatus('error');
          setMessage(`認證失敗: ${errorDescription || error}`);
          return;
        }

        // 處理認證回調
        const { data, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          console.error('獲取 session 失敗:', authError);
          setStatus('error');
          setMessage('認證處理失敗，請重試');
          return;
        }

        if (!data.session) {
          console.error('沒有 session');
          setStatus('error');
          setMessage('認證失敗，請重新嘗試');
          return;
        }

        console.log('認證成功:', data.session.user.email);
        
        // 檢查用戶是否已確認 email
        if (!data.session.user.email_confirmed_at) {
          setStatus('error');
          setMessage('請先確認您的 email 地址');
          return;
        }

        // 更新註冊申請狀態
        try {
          const response = await fetch('/api/auth/update-registration-after-confirm', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: data.session.user.email,
              supabase_user_id: data.session.user.id
            })
          });

          const result = await response.json();
          
          if (result.success) {
            setStatus('success');
            setMessage('Email 確認成功！您的註冊申請已提交給管理員審核。');
            
            // 3秒後重定向到登入頁面
            setTimeout(() => {
              router.push('/login');
            }, 3000);
          } else {
            setStatus('error');
            setMessage(result.error || '更新註冊狀態失敗');
          }
        } catch (updateError) {
          console.error('更新註冊狀態失敗:', updateError);
          setStatus('error');
          setMessage('更新註冊狀態失敗，但 email 已確認');
        }

      } catch (error) {
        console.error('Auth 回調處理錯誤:', error);
        setStatus('error');
        setMessage('處理認證時發生錯誤');
      }
    };

    handleAuthCallback();
  }, [searchParams, router, supabase.auth]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFFDF8] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#EADBC8] p-8 shadow-lg max-w-md w-full">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD59A] mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-[#4B4036] mb-2">處理認證中...</h2>
              <p className="text-[#2B3A3B]">請稍候，正在確認您的 email</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-[#4B4036] mb-2">認證成功！</h2>
              <p className="text-[#2B3A3B] mb-4">{message}</p>
              <p className="text-sm text-[#999]">即將跳轉到登入頁面...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-[#4B4036] mb-2">認證失敗</h2>
              <p className="text-[#2B3A3B] mb-4">{message}</p>
              <button
                onClick={() => router.push('/login')}
                className="px-6 py-2 bg-gradient-to-br from-[#FDE6B8] to-[#FCE2C8] text-[#A64B2A] border border-[#EAC29D] rounded-full font-semibold shadow-lg transition-all duration-300 hover:scale-105"
              >
                返回登入頁面
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 