'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

import HanamiLoginForm from '@/components/ui/HanamiLoginForm';
import { Spinner } from '@/components/ui/spinner';
import { validateUserCredentials, setUserSession, getUserSession, clearUserSession } from '@/lib/authUtils';
import { Database } from '@/lib/database.types';

export default function AdminLoginPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaText, setCaptchaText] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const mounted = useRef(false);
  const redirecting = useRef(false);
  const sessionChecked = useRef(false);

  // 生成圖片驗證碼
  const generateCaptcha = () => {
    // 確保在客戶端環境
    if (typeof window === 'undefined') return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 120;
    canvas.height = 40;

    // 生成隨機驗證碼文字（4位數字和字母組合）
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let text = '';
    for (let i = 0; i < 4; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(text);

    // 設置背景
    ctx.fillStyle = '#FFF9F2';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 添加干擾線
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = `hsl(${Math.random() * 360}, 70%, 80%)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // 添加干擾點
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 80%)`;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
    }

    // 繪製文字
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#4B4036';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 為每個字符添加輕微旋轉和位置偏移
    for (let i = 0; i < text.length; i++) {
      const x = 30 + i * 20;
      const y = 20 + (Math.random() - 0.5) * 10;
      const rotation = (Math.random() - 0.5) * 0.3;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }

    // 轉換為base64圖片
    const imageData = canvas.toDataURL('image/png');
    setCaptchaImage(imageData);
  };

  useEffect(() => {
    mounted.current = true;

    const checkSession = async () => {
      // 防止重複檢查
      if (sessionChecked.current || redirecting.current) return;
      sessionChecked.current = true;

      try {
        // 檢查本地會話
        const userSession = getUserSession();
        if (userSession && userSession.role === 'admin' && mounted.current && !redirecting.current) {
          redirecting.current = true;
          router.replace('/admin');
          return;
        }

        // 清除無效會話
        if (userSession && userSession.role !== 'admin') {
          clearUserSession();
        }
      } catch (error) {
        console.error('Session check error:', error);
        clearUserSession();
      }

      if (mounted.current) {
        setIsLoading(false);
      }
    };

    checkSession();

    // 生成驗證碼
    if (typeof window !== 'undefined') {
      generateCaptcha();
    }

    return () => {
      mounted.current = false;
    };
  }, []); // 移除 router 依賴

  const handleLogin = async (email: string, password: string) => {
    if (!email || !password) {
      setError('請輸入帳號和密碼');
      return;
    }

    // 驗證人機驗證
    if (!captchaAnswer.trim()) {
      setError('請完成人機驗證');
      return;
    }
    
    if (captchaAnswer.toUpperCase() !== captchaText) {
      setError('驗證碼錯誤，請重新輸入');
      setCaptchaAnswer('');
      generateCaptcha();
      return;
    }

    try {
      setError('');
      setIsLoading(true);

      // 使用新的認證系統
      const result = await validateUserCredentials(email, password);

      if (result.success && result.user) {
        // 檢查用戶角色
        if (result.user.role !== 'admin') {
          setError('無權限：僅限管理員登入');
          setIsLoading(false);
          return;
        }

        // 設置用戶會話
        setUserSession(result.user);

        if (mounted.current && !redirecting.current) {
          redirecting.current = true;
          router.replace('/admin');
        }
      } else {
        setError(result.error || '登入失敗');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      if (mounted.current) {
        setError(error instanceof Error ? error.message : '登入失敗');
        setIsLoading(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFF9F2] font-['Quicksand',_sans-serif] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD59A] mx-auto" />
          <p className="mt-4 text-brown-700">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <HanamiLoginForm
      error={error}
      loading={isLoading}
      onSubmit={handleLogin}
      captchaImage={captchaImage}
      captchaAnswer={captchaAnswer}
      onCaptchaAnswerChange={setCaptchaAnswer}
      onRegenerateCaptcha={generateCaptcha}
    />
  );
}