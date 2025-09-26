'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { RegisterFormData, UserRole } from '@/types/auth';

const registerSchema = z.object({
  email: z.string().email('請輸入有效的電子郵件'),
  password: z.string()
    .min(8, '密碼至少需要8個字符')
    .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/, '密碼必須包含至少一個英文字母和一個數字'),
  confirmPassword: z.string(),
  role: z.enum(['admin', 'teacher', 'parent', 'student'] as const),
  fullName: z.string().min(2, '請輸入姓名'),
  phone: z.string().min(1, '請輸入電話號碼'),
  // 根據角色添加額外欄位
  teacherBackground: z.string().optional(),
  teacherBankId: z.string().optional(),
  teacherAddress: z.string().optional(),
  teacherDob: z.string().optional(),
  parentStudentName: z.string().optional(),
  parentStudentDob: z.string().optional(),
  captchaAnswer: z.string().min(1, '請完成人機驗證'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '密碼不匹配',
  path: ['confirmPassword'],
});

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('parent');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isButtonAnimating, setIsButtonAnimating] = useState(false);
  const [captchaText, setCaptchaText] = useState('');
  const [captchaImage, setCaptchaImage] = useState<string>('');
  const supabase = createClientComponentClient();

  // 生成驗證碼圖片
  const generateCaptcha = useCallback(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 200;
    canvas.height = 60;

    // 背景漸層
    const gradient = ctx.createLinearGradient(0, 0, 200, 60);
    gradient.addColorStop(0, '#FFF9F2');
    gradient.addColorStop(1, '#FFE0E0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 200, 60);

    // 添加裝飾性圖案
    const patterns = ['🌸', '🎵', '🎨', '⭐', '🎪', '🎭'];
    const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    // 繪製圖案背景
    ctx.font = '12px Arial';
    ctx.fillStyle = 'rgba(235, 201, 164, 0.3)';
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * 200;
      const y = Math.random() * 60;
      ctx.fillText(selectedPattern, x, y);
    }

    // 生成隨機驗證碼
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let captchaText = '';
    for (let i = 0; i < 4; i++) {
      captchaText += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(captchaText);

    // 繪製驗證碼文字
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#4B4036';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 為每個字符添加不同的效果
    for (let i = 0; i < captchaText.length; i++) {
      const x = 50 + i * 30;
      const y = 30;
      
      // 隨機旋轉
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.3);
      
      // 隨機顏色變化
      const hue = 30 + Math.random() * 20; // 棕色系
      ctx.fillStyle = `hsl(${hue}, 40%, 30%)`;
      
      ctx.fillText(captchaText[i], 0, 0);
      ctx.restore();
    }

    // 添加干擾線
    ctx.strokeStyle = 'rgba(235, 201, 164, 0.6)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * 200, Math.random() * 60);
      ctx.lineTo(Math.random() * 200, Math.random() * 60);
      ctx.stroke();
    }

    // 添加噪點
    ctx.fillStyle = 'rgba(235, 201, 164, 0.4)';
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 200;
      const y = Math.random() * 60;
      ctx.fillRect(x, y, 1, 1);
    }

    setCaptchaImage(canvas.toDataURL());
  }, []);

  // 生成驗證題目
  useEffect(() => {
    // 確保在客戶端環境才生成驗證碼
    if (typeof window !== 'undefined') {
      generateCaptcha();
    }
  }, [generateCaptcha]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid, isDirty },
    trigger,
    setValue,
    reset,
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'parent',
      parentStudentDob: undefined,
    },
    mode: 'onChange',
  });

  const watchedRole = watch('role');
  const watchedValues = watch();

  // 當角色改變時重置相關欄位
  const handleRoleChange = (newRole: UserRole) => {
    console.log('角色變更:', newRole);
    setSelectedRole(newRole);
    setValue('role', newRole);
    
    // 重置角色相關的欄位
    if (newRole === 'teacher') {
      setValue('parentStudentName', '');
      setValue('parentStudentDob', undefined);
    } else if (newRole === 'parent') {
      setValue('teacherBackground', '');
      setValue('teacherBankId', '');
      setValue('teacherAddress', '');
      setValue('teacherDob', '');
    } else if (newRole === 'admin') {
      setValue('teacherBackground', '');
      setValue('teacherBankId', '');
      setValue('teacherAddress', '');
      setValue('teacherDob', '');
      setValue('parentStudentName', '');
      setValue('parentStudentDob', undefined);
    }
  };

  const handleFormSubmit = (data: RegisterFormData) => {
    console.log('表單提交:', data);
    
    // 驗證人機驗證
    if (!data.captchaAnswer?.trim()) {
      setError('請完成人機驗證');
      return;
    }
    
    if (data.captchaAnswer.toUpperCase() !== captchaText) {
      setError('驗證碼錯誤，請重新輸入');
      setValue('captchaAnswer', '');
      generateCaptcha();
      return;
    }
    
    setFormData(data);
    setShowConfirmation(true);
    setError(null);
    setSuccess(null);
  };

  const handleConfirmSubmit = async () => {
    console.log('=== 確認提交開始 ===');
    
    if (!formData) {
      console.error('沒有表單數據');
      setError('沒有表單數據');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      console.log('開始處理註冊申請...');

      // 檢查是否已經有相同的email申請
      console.log('檢查重複郵箱...');
      const { data: existingRequests, error: checkError } = await supabase
        .from('registration_requests')
        .select('*')
        .eq('email', formData.email);

      if (checkError) {
        console.error('檢查重複郵箱錯誤:', checkError);
        throw new Error(`檢查重複郵箱失敗: ${checkError.message}`);
      }

      if (existingRequests && existingRequests.length > 0) {
        setError('此電子郵件已經有註冊申請，請等待審核或使用其他郵箱');
        setShowConfirmation(false);
        return;
      }

      // 準備額外資訊
      const additionalInfo: Record<string, any> = {};
      
      if (formData.role === 'teacher') {
        additionalInfo.teacherBackground = formData.teacherBackground;
        additionalInfo.teacherBankId = formData.teacherBankId;
        additionalInfo.teacherAddress = formData.teacherAddress;
        additionalInfo.teacherDob = formData.teacherDob;
      } else if (formData.role === 'parent') {
        additionalInfo.parentStudentName = formData.parentStudentName;
        additionalInfo.parentStudentDob = formData.parentStudentDob;
      }

      const insertData = {
        email: formData.email,
        full_name: formData.fullName,
        phone: formData.phone || null,
        role: formData.role,
        status: 'pending',
        additional_info: additionalInfo,
      };

      console.log('準備插入數據:', insertData);

      // 使用簡化版本的註冊API
      const response = await fetch('/api/auth/register-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
          phone: formData.phone,
          role: formData.role,
          additional_info: additionalInfo
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '註冊失敗');
      }

      console.log('註冊成功:', result);

      setSuccess('註冊成功！請檢查您的郵箱並點擊驗證連結。驗證後，管理員將審核您的申請。');
      setShowConfirmation(false);
      
      // 重置表單
      reset();
      
      // 5秒後跳轉到登入頁面
      setTimeout(() => {
        router.push('/login');
      }, 5000);

    } catch (err) {
      console.error('註冊錯誤詳情:', err);
      setError(err instanceof Error ? err.message : '註冊過程中發生錯誤');
      setShowConfirmation(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToForm = () => {
    setShowConfirmation(false);
    setFormData(null);
  };

  const handleSubmitClick = () => {
    setIsButtonAnimating(true);
    setTimeout(() => {
      setIsButtonAnimating(false);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] font-['Quicksand',_sans-serif] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* 返回主頁按鈕 */}
        <div className="text-center mb-4">
          <Link
            className="inline-flex items-center text-sm text-brown-600 hover:text-brown-700 transition-colors"
            href="/"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
            </svg>
            返回主頁
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-[#EADBC8] p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-brown-700 mb-2">
              註冊新帳號
            </h2>
            <p className="text-sm text-brown-500">
              請填寫以下資訊，管理員將審核您的申請
            </p>
          </div>
        
          {error && (
          <div className="mb-4 bg-[#FFE0E0] border border-[#FF6B6B] text-[#A64B2A] px-4 py-3 rounded-xl text-sm animate-pulse">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
          )}
        
          {success && (
          <div className="mb-6 bg-gradient-to-r from-[#E8F5E8] to-[#C8E6C9] border-2 border-[#4CAF50] text-[#2E7D32] px-6 py-4 rounded-2xl text-center shadow-lg animate-pulse">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-[#4CAF50] rounded-full flex items-center justify-center mb-3 animate-bounce">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">🎉 註冊成功！</h3>
              <p className="text-sm leading-relaxed">{success}</p>
              <div className="mt-3 text-xs text-[#1B5E20] opacity-80 mb-4">
                5秒後自動跳轉到登入頁面...
              </div>
              <button
                onClick={() => router.push('/login')}
                className="px-6 py-2 bg-[#4CAF50] text-white rounded-lg hover:bg-[#45A049] transition-colors text-sm font-medium"
              >
                立即前往登入
              </button>
            </div>
          </div>
          )}

          {!success && (
          <form className="space-y-6" onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="space-y-4">
              {/* 基本資訊 */}
              <div>
                <label className="block text-sm font-medium text-brown-700" htmlFor="email">
                  電子郵件 *
                </label>
                <input
                  {...register('email')}
                  className="mt-1 appearance-none relative block w-full px-4 py-3 border border-[#E0E0E0] placeholder-brown-400 text-brown-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD59A] bg-white text-sm transition-all duration-200"
                  placeholder="請輸入電子郵件"
                  type="email"
                />
                {errors.email && (
                <p className="mt-1 text-sm text-[#A64B2A] animate-pulse">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-brown-700" htmlFor="password">
                  密碼 *
                </label>
                <input
                  {...register('password')}
                  className="mt-1 appearance-none relative block w-full px-4 py-3 border border-[#E0E0E0] placeholder-brown-400 text-brown-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD59A] bg-white text-sm transition-all duration-200"
                  placeholder="請輸入密碼（至少8個字符，包含英文和數字）"
                  type="password"
                />
                <p className="mt-1 text-xs text-brown-500">
                  密碼必須包含至少8個字符，其中至少包含一個英文字母和一個數字
                </p>
                {errors.password && (
                <p className="mt-1 text-sm text-[#A64B2A] animate-pulse">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-brown-700" htmlFor="confirmPassword">
                  確認密碼 *
                </label>
                <input
                  {...register('confirmPassword')}
                  className="mt-1 appearance-none relative block w-full px-4 py-3 border border-[#E0E0E0] placeholder-brown-400 text-brown-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD59A] bg-white text-sm transition-all duration-200"
                  placeholder="請再次輸入密碼"
                  type="password"
                />
                {errors.confirmPassword && (
                <p className="mt-1 text-sm text-[#A64B2A] animate-pulse">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-brown-700" htmlFor="fullName">
                  姓名 *
                </label>
                <input
                  {...register('fullName')}
                  className="mt-1 appearance-none relative block w-full px-4 py-3 border border-[#E0E0E0] placeholder-brown-400 text-brown-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD59A] bg-white text-sm transition-all duration-200"
                  placeholder="請輸入姓名"
                  type="text"
                />
                {errors.fullName && (
                <p className="mt-1 text-sm text-[#A64B2A] animate-pulse">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-brown-700" htmlFor="phone">
                  電話 *
                </label>
                <input
                  {...register('phone')}
                  className="mt-1 appearance-none relative block w-full px-4 py-3 border border-[#E0E0E0] placeholder-brown-400 text-brown-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD59A] bg-white text-sm transition-all duration-200"
                  placeholder="請輸入電話號碼"
                  type="tel"
                />
                {errors.phone && (
                <p className="mt-1 text-sm text-[#A64B2A] animate-pulse">{errors.phone.message}</p>
                )}
              </div>

              {/* 角色選擇 - 改進的設計 */}
              <div>
                <label className="block text-sm font-medium text-brown-700 mb-3">
                  註冊角色 *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('parent')}
                    className={`py-3 px-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                      watchedRole === 'parent'
                        ? 'border-[#EBC9A4] bg-[#EBC9A4] text-brown-700 shadow-md'
                        : 'border-[#EADBC8] bg-white text-brown-600 hover:border-[#EBC9A4] hover:bg-[#FFF9F2]'
                    }`}
                  >
                    <div className="text-center">
                      <div className="mb-2">
                        <svg className="w-6 h-6 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9ZM19 9H14V4H5V21H19V9Z"/>
                        </svg>
                      </div>
                      <div className="text-sm font-medium">家長</div>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleRoleChange('teacher')}
                    className={`py-3 px-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                      watchedRole === 'teacher'
                        ? 'border-[#FFD59A] bg-[#FFD59A] text-brown-700 shadow-md'
                        : 'border-[#EADBC8] bg-white text-brown-600 hover:border-[#FFD59A] hover:bg-[#FFF9F2]'
                    }`}
                  >
                    <div className="text-center">
                      <div className="mb-2">
                        <svg className="w-6 h-6 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 3V13.55C11.41 13.21 10.73 13 10 13C7.79 13 6 14.79 6 17S7.79 21 10 21 14 19.21 14 17V7H18V3H12ZM10 19C8.9 19 8 18.1 8 17S8.9 15 10 15 12 15.9 12 17 11.1 19 10 19Z"/>
                        </svg>
                      </div>
                      <div className="text-sm font-medium">教師</div>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleRoleChange('admin')}
                    className={`py-3 px-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                      watchedRole === 'admin'
                        ? 'border-[#FFB6C1] bg-[#FFB6C1] text-brown-700 shadow-md'
                        : 'border-[#EADBC8] bg-white text-brown-600 hover:border-[#FFB6C1] hover:bg-[#FFF9F2]'
                    }`}
                  >
                    <div className="text-center">
                      <div className="mb-2">
                        <svg className="w-6 h-6 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20ZM12 6C9.79 6 8 7.79 8 10S9.79 14 12 14 16 12.21 16 10 14.21 6 12 6ZM12 12C10.9 12 10 11.1 10 10S10.9 8 12 8 14 8.9 14 10 13.1 12 12 12Z"/>
                        </svg>
                      </div>
                      <div className="text-sm font-medium">管理員</div>
                    </div>
                  </button>
                </div>
                {errors.role && (
                <p className="mt-1 text-sm text-[#A64B2A] animate-pulse">{errors.role.message}</p>
                )}
              </div>

              {/* 教師專用欄位 */}
              {watchedRole === 'teacher' && (
              <div className="space-y-4 border-t border-[#EADBC8] pt-4">
                <h3 className="text-lg font-medium text-brown-700 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-[#FFD59A]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3V13.55C11.41 13.21 10.73 13 10 13C7.79 13 6 14.79 6 17S7.79 21 10 21 14 19.21 14 17V7H18V3H12ZM10 19C8.9 19 8 18.1 8 17S8.9 15 10 15 12 15.9 12 17 11.1 19 10 19Z"/>
                  </svg>
                  教師資訊
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-brown-700" htmlFor="teacherBackground">
                    教學背景
                  </label>
                  <textarea
                    {...register('teacherBackground')}
                    className="mt-1 appearance-none relative block w-full px-4 py-3 border border-[#E0E0E0] placeholder-brown-400 text-brown-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD59A] bg-white text-sm transition-all duration-200"
                    placeholder="請描述您的教學經驗和背景（選填）"
                    rows={3}
                  />
                  {errors.teacherBackground && (
                    <p className="mt-1 text-sm text-[#A64B2A] animate-pulse">{errors.teacherBackground.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-brown-700" htmlFor="teacherBankId">
                    銀行帳號
                  </label>
                  <input
                    {...register('teacherBankId')}
                    className="mt-1 appearance-none relative block w-full px-4 py-3 border border-[#E0E0E0] placeholder-brown-400 text-brown-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD59A] bg-white text-sm transition-all duration-200"
                    placeholder="請輸入銀行帳號（選填）"
                    type="text"
                  />
                  {errors.teacherBankId && (
                    <p className="mt-1 text-sm text-[#A64B2A] animate-pulse">{errors.teacherBankId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-brown-700" htmlFor="teacherAddress">
                    地址
                  </label>
                  <input
                    {...register('teacherAddress')}
                    className="mt-1 appearance-none relative block w-full px-4 py-3 border border-[#E0E0E0] placeholder-brown-400 text-brown-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD59A] bg-white text-sm transition-all duration-200"
                    placeholder="請輸入地址"
                    type="text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brown-700" htmlFor="teacherDob">
                    出生日期
                  </label>
                  <input
                    {...register('teacherDob')}
                    className="mt-1 appearance-none relative block w-full px-4 py-3 border border-[#E0E0E0] placeholder-brown-400 text-brown-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD59A] bg-white text-sm transition-all duration-200"
                    type="date"
                  />
                </div>
              </div>
              )}

              {/* 家長專用欄位 */}
              {watchedRole === 'parent' && (
              <div className="space-y-4 border-t border-[#EADBC8] pt-4">
                <h3 className="text-lg font-medium text-brown-700 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-[#EBC9A4]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9ZM19 9H14V4H5V21H19V9Z"/>
                  </svg>
                  學生資訊
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-brown-700" htmlFor="parentStudentName">
                    學生姓名
                  </label>
                  <input
                    {...register('parentStudentName')}
                    className="mt-1 appearance-none relative block w-full px-4 py-3 border border-[#E0E0E0] placeholder-brown-400 text-brown-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBC9A4] bg-white text-sm transition-all duration-200"
                    placeholder="請輸入學生姓名"
                    type="text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brown-700" htmlFor="parentStudentDob">
                    學生出生日期
                  </label>
                  <input
                    {...register('parentStudentDob')}
                    className="mt-1 appearance-none relative block w-full px-4 py-3 border border-[#E0E0E0] placeholder-brown-400 text-brown-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBC9A4] bg-white text-sm transition-all duration-200"
                    type="date"
                  />
                </div>
              </div>
              )}

              {/* 管理員專用說明 */}
              {watchedRole === 'admin' && (
              <div className="space-y-4 border-t border-[#EADBC8] pt-4">
                <h3 className="text-lg font-medium text-brown-700 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-[#FFB6C1]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20ZM12 6C9.79 6 8 7.79 8 10S9.79 14 12 14 16 12.21 16 10 14.21 6 12 6ZM12 12C10.9 12 10 11.1 10 10S10.9 8 12 8 14 8.9 14 10 13.1 12 12 12Z"/>
                  </svg>
                  管理員權限
                </h3>
                <div className="bg-[#FFF9F2] border border-[#EADBC8] rounded-xl p-4">
                  <p className="text-sm text-brown-600">
                    管理員角色擁有系統的最高權限，包括用戶管理、數據查看和系統設置等功能。
                    您的申請將由現有管理員進行審核。
                  </p>
                </div>
              </div>
              )}
            </div>

            {/* 人機驗證 */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-brown-700">
                🔒 人機驗證（防止機器人提交）
              </label>
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <div className="relative overflow-hidden rounded-lg border-2 border-[#EADBC8] bg-gradient-to-br from-[#FFF9F2] to-[#FFE0E0] shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#EBC9A4]">
                    {captchaImage ? (
                      <img 
                        alt="驗證碼" 
                        className="block w-[200px] h-[60px] object-cover transition-transform duration-300 group-hover:scale-105" 
                        src={captchaImage}
                      />
                    ) : (
                      <div 
                        className="flex items-center justify-center w-[200px] h-[60px] bg-gradient-to-br from-[#FFF9F2] to-[#FFE0E0]"
                      >
                        <div className="flex items-center gap-2 text-brown-500">
                          <div className="w-4 h-4 border-2 border-[#EBC9A4] border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm">載入中...</span>
                        </div>
                      </div>
                    )}
                    {/* 動畫裝飾元素 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
                  </div>
                  <button
                    className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-[#FFB84C] to-[#FFA726] text-white rounded-full text-sm flex items-center justify-center hover:from-[#FFA726] hover:to-[#FF9800] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95"
                    title="重新生成驗證碼"
                    type="button"
                    onClick={generateCaptcha}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 relative">
                  <input
                    {...register('captchaAnswer')}
                    className="w-full border-2 border-[#EADBC8] rounded-lg px-4 py-3 bg-white text-brown-700 uppercase font-medium tracking-wider transition-all duration-300 focus:border-[#EBC9A4] focus:ring-2 focus:ring-[#EBC9A4]/20 focus:outline-none placeholder-brown-400"
                    maxLength={4}
                    placeholder="請輸入驗證碼"
                    type="text"
                  />
                  {/* 輸入框裝飾 */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"></div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-brown-500">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-[#EBC9A4] rounded-full animate-pulse"></div>
                  <span>請輸入上方圖片中的驗證碼（不區分大小寫）</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-[#FFB6C1] rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                  <span>以證明您是真人</span>
                </div>
              </div>
            </div>

            <div>
              <button
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-[#A64B2A] hover:bg-[#8B3A1F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A64B2A] disabled:opacity-50 transition-all duration-200 transform ${
                  isButtonAnimating ? 'scale-95' : 'hover:scale-105'
                }`}
                disabled={isSubmitting}
                type="submit"
                onClick={handleSubmitClick}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    處理中...
                  </div>
                ) : (
                  '確認註冊資訊'
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-brown-600">
                已有帳號？{' '}
                <Link className="font-medium text-brown-700 hover:text-brown-800 underline" href="/login">
                  立即登入
                </Link>
              </p>
            </div>
          </form>
          )}

          {/* 確認對話框 */}
          {showConfirmation && formData && !success && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl transform transition-all duration-300 animate-slideIn">
              <h3 className="text-lg font-bold text-brown-700 mb-4">確認註冊資訊</h3>
              
              <div className="space-y-3 mb-6">
                <div>
                  <span className="text-sm font-medium text-brown-600">電子郵件：</span>
                  <span className="text-sm text-brown-700 ml-2">{formData.email}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-brown-600">姓名：</span>
                  <span className="text-sm text-brown-700 ml-2">{formData.fullName}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-brown-600">角色：</span>
                  <span className="text-sm text-brown-700 ml-2">
                    {formData.role === 'admin' ? '管理員' : 
                      formData.role === 'teacher' ? '教師' : '家長'}
                  </span>
                </div>
                  <div>
                    <span className="text-sm font-medium text-brown-600">電話：</span>
                    <span className="text-sm text-brown-700 ml-2">{formData.phone}</span>
                  </div>
                {formData.role === 'teacher' && formData.teacherBackground && (
                  <div>
                    <span className="text-sm font-medium text-brown-600">教學背景：</span>
                    <span className="text-sm text-brown-700 ml-2">{formData.teacherBackground}</span>
                  </div>
                )}
                {formData.role === 'parent' && formData.parentStudentName && (
                  <div>
                    <span className="text-sm font-medium text-brown-600">學生姓名：</span>
                    <span className="text-sm text-brown-700 ml-2">{formData.parentStudentName}</span>
                  </div>
                )}
                {formData.role === 'parent' && formData.parentStudentDob && (
                  <div>
                    <span className="text-sm font-medium text-brown-600">學生出生日期：</span>
                    <span className="text-sm text-brown-700 ml-2">{formData.parentStudentDob}</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  className="flex-1 py-2 px-4 border border-[#E0E0E0] text-brown-700 rounded-xl hover:bg-gray-50 transition-all duration-200 transform hover:scale-105"
                  onClick={handleBackToForm}
                  disabled={isSubmitting}
                >
                  返回修改
                </button>
                <button
                  className="flex-1 py-2 px-4 bg-[#A64B2A] text-white rounded-xl hover:bg-[#8B3A1F] transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
                  onClick={handleConfirmSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      提交中...
                    </div>
                  ) : (
                    '確認提交'
                  )}
                </button>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { 
            opacity: 0; 
            transform: translateY(-20px) scale(0.95);
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
} 