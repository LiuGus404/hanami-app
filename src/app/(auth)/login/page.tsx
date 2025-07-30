'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import HanamiLoginForm from '@/components/ui/HanamiLoginForm';
import { validateUserCredentials, setUserSession } from '@/lib/authUtils';

const loginSchema = z.object({
  email: z.string().email('請輸入有效的電子郵件'),
  password: z.string().min(1, '請輸入密碼'),
  captchaAnswer: z.string().min(1, '請完成人機驗證'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaText, setCaptchaText] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const supabase = createClientComponentClient();

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

  // 生成驗證題目
  useEffect(() => {
    // 確保在客戶端環境才生成驗證碼
    if (typeof window !== 'undefined') {
      generateCaptcha();
    }
  }, []);

  const handleLogin = async (email: string, password: string, captchaAnswer?: string) => {
    if (!captchaAnswer) {
      setError('請完成人機驗證');
      return;
    }

    setLoading(true);
    setError(null);

    try {
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

      // 使用新的表格認證API
      const response = await fetch('/api/auth/login-table-based', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

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
          onBackToHome={() => router.push('/')}
          onSubmit={handleLogin}
          captchaImage={captchaImage}
          captchaAnswer={captchaAnswer}
          onCaptchaAnswerChange={setCaptchaAnswer}
          onRegenerateCaptcha={generateCaptcha}
        />
      </div>
    </div>
  );
} 