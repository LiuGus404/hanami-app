'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { RegisterFormData, UserRole } from '@/types/auth';


const registerSchema = z.object({
  email: z.string().email('請輸入有效的電子郵件'),
  password: z.string().min(6, '密碼至少需要6個字符'),
  confirmPassword: z.string(),
  role: z.enum(['admin', 'teacher', 'parent'] as const),
  fullName: z.string().min(2, '請輸入姓名'),
  phone: z.string().optional(),
  // 根據角色添加額外欄位
  teacherBackground: z.string().optional(),
  teacherBankId: z.string().optional(),
  teacherAddress: z.string().optional(),
  teacherDob: z.string().optional(),
  parentStudentName: z.string().optional(),
  parentStudentAge: z.preprocess((val) => {
    if (typeof val === 'string' && val !== '') return parseInt(val, 10);
    if (typeof val === 'number') return val;
    return undefined;
  }, z.number().optional().transform(val => (typeof val === 'number' ? val : undefined))),
}).refine((data) => data.password === data.confirmPassword, {
  message: '密碼不匹配',
  path: ['confirmPassword'],
}).refine((data) => {
  if (data.role === 'teacher') {
    return data.teacherBackground && data.teacherBankId;
  }
  return true;
}, {
  message: '教師需要填寫背景和銀行帳號',
  path: ['teacherBackground'],
});

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('parent');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData | null>(null);
  const supabase = createClientComponentClient();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'parent',
    },
  });

  const watchedRole = watch('role');

  const handleFormSubmit = (data: RegisterFormData) => {
    setFormData(data);
    setShowConfirmation(true);
  };

  const handleConfirmSubmit = async () => {
    if (!formData) return;

    try {
      setError(null);
      setSuccess(null);

      // 檢查是否已經有相同的email申請
      const { data: existingRequests, error: checkError } = await supabase
        .from('registration_requests')
        .select('*')
        .eq('email', formData.email);

      if (checkError) throw checkError;

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
        additionalInfo.parentStudentAge = formData.parentStudentAge;
      }

      // 創建註冊申請
      const { data: insertData, error: insertError } = await supabase
        .from('registration_requests')
        .insert([
          {
            email: formData.email,
            full_name: formData.fullName,
            phone: formData.phone || null,
            role: formData.role,
            status: 'pending',
            additional_info: additionalInfo,
          },
        ])
        .select();

      if (insertError) {
        console.error('插入錯誤:', insertError);
        throw new Error(`資料庫插入失敗: ${insertError.message}`);
      }

      console.log('註冊成功:', insertData);

      setSuccess('註冊申請已提交！管理員將審核您的申請，審核結果將通過電子郵件通知您。');
      setShowConfirmation(false);
      
      // 3秒後跳轉到登入頁面
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (err) {
      console.error('註冊錯誤詳情:', err);
      setError(err instanceof Error ? err.message : '註冊過程中發生錯誤');
      setShowConfirmation(false);
    }
  };

  const handleBackToForm = () => {
    setShowConfirmation(false);
    setFormData(null);
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
          <div className="mb-4 bg-[#FFE0E0] border border-[#FF6B6B] text-[#A64B2A] px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
          )}
        
          {success && (
          <div className="mb-4 bg-[#E8F5E8] border border-[#4CAF50] text-[#2E7D32] px-4 py-3 rounded-xl text-sm">
            {success}
          </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="space-y-4">
              {/* 基本資訊 */}
              <div>
                <label className="block text-sm font-medium text-brown-700" htmlFor="email">
                  電子郵件 *
                </label>
                <input
                  {...register('email')}
                  className="mt-1 appearance-none relative block w-full px-4 py-3 border border-[#E0E0E0] placeholder-brown-400 text-brown-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD59A] bg-white text-sm"
                  placeholder="請輸入電子郵件"
                  type="email"
                />
                {errors.email && (
                <p className="mt-1 text-sm text-[#A64B2A]">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-brown-700" htmlFor="password">
                  密碼 *
                </label>
                <input
                  {...register('password')}
                  className="mt-1 appearance-none relative block w-full px-4 py-3 border border-[#E0E0E0] placeholder-brown-400 text-brown-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD59A] bg-white text-sm"
                  placeholder="請輸入密碼（至少6個字符）"
                  type="password"
                />
                {errors.password && (
                <p className="mt-1 text-sm text-[#A64B2A]">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-brown-700" htmlFor="confirmPassword">
                  確認密碼 *
                </label>
                <input
                  {...register('confirmPassword')}
                  className="mt-1 appearance-none relative block w-full px-4 py-3 border border-[#E0E0E0] placeholder-brown-400 text-brown-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD59A] bg-white text-sm"
                  placeholder="請再次輸入密碼"
                  type="password"
                />
                {errors.confirmPassword && (
                <p className="mt-1 text-sm text-[#A64B2A]">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-brown-700" htmlFor="fullName">
                  姓名 *
                </label>
                <input
                  {...register('fullName')}
                  className="mt-1 appearance-none relative block w-full px-4 py-3 border border-[#E0E0E0] placeholder-brown-400 text-brown-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD59A] bg-white text-sm"
                  placeholder="請輸入姓名"
                  type="text"
                />
                {errors.fullName && (
                <p className="mt-1 text-sm text-[#A64B2A]">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-brown-700" htmlFor="phone">
                  電話
                </label>
                <input
                  {...register('phone')}
                  className="mt-1 appearance-none relative block w-full px-4 py-3 border border-[#E0E0E0] placeholder-brown-400 text-brown-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD59A] bg-white text-sm"
                  placeholder="請輸入電話號碼（選填）"
                  type="tel"
                />
                {errors.phone && (
                <p className="mt-1 text-sm text-[#A64B2A]">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-brown-700" htmlFor="role">
                  註冊角色 *
                </label>
                <select
                  {...register('role')}
                  className="mt-1 appearance-none relative block w-full px-4 py-3 border border-[#E0E0E0] placeholder-brown-400 text-brown-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD59A] bg-white text-sm"
                  defaultValue="parent"
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                >
                  <option value="parent">家長</option>
                  <option value="teacher">教師</option>
                  <option value="admin">管理員</option>
                </select>
                {errors.role && (
                <p className="mt-1 text-sm text-[#A64B2A]">{errors.role.message}</p>
                )}
              </div>

              {/* 教師專用欄位 */}
              {watchedRole === 'teacher' && (
              <div className="space-y-4 border-t border-[#EADBC8] pt-4">
                <h3 className="text-lg font-medium text-brown-700">教師資訊</h3>
                
                <div>
                  <label className="block text-sm font-medium text-brown-700" htmlFor="teacherBackground">
                    教學背景 *
                  </label>
                  <textarea
                    {...register('teacherBackground')}
                    className="mt-1 appearance-none relative block w-full px-4 py-3 border border-[#E0E0E0] placeholder-brown-400 text-brown-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD59A] bg-white text-sm"
                    placeholder="請描述您的教學經驗和背景"
                    rows={3}
                  />
                  {errors.teacherBackground && (
                    <p className="mt-1 text-sm text-[#A64B2A]">{errors.teacherBackground.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-brown-700" htmlFor="teacherBankId">
                    銀行帳號 *
                  </label>
                  <input
                    {...register('teacherBankId')}
                    className="mt-1 appearance-none relative block w-full px-4 py-3 border border-[#E0E0E0] placeholder-brown-400 text-brown-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD59A] bg-white text-sm"
                    placeholder="請輸入銀行帳號"
                    type="text"
                  />
                  {errors.teacherBankId && (
                    <p className="mt-1 text-sm text-[#A64B2A]">{errors.teacherBankId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-brown-700" htmlFor="teacherAddress">
                    地址
                  </label>
                  <input
                    {...register('teacherAddress')}
                    className="mt-1 appearance-none relative block w-full px-4 py-3 border border-[#E0E0E0] placeholder-brown-400 text-brown-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD59A] bg-white text-sm"
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
                    className="mt-1 appearance-none relative block w-full px-4 py-3 border border-[#E0E0E0] placeholder-brown-400 text-brown-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD59A] bg-white text-sm"
                    type="date"
                  />
                </div>
              </div>
              )}

              {/* 家長專用欄位 */}
              {watchedRole === 'parent' && (
              <div className="space-y-4 border-t border-[#EADBC8] pt-4">
                <h3 className="text-lg font-medium text-brown-700">學生資訊</h3>
                
                <div>
                  <label className="block text-sm font-medium text-brown-700" htmlFor="parentStudentName">
                    學生姓名
                  </label>
                  <input
                    {...register('parentStudentName')}
                    className="mt-1 appearance-none relative block w-full px-4 py-3 border border-[#E0E0E0] placeholder-brown-400 text-brown-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD59A] bg-white text-sm"
                    placeholder="請輸入學生姓名"
                    type="text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brown-700" htmlFor="parentStudentAge">
                    學生年齡
                  </label>
                  <input
                    {...register('parentStudentAge', { valueAsNumber: true })}
                    className="mt-1 appearance-none relative block w-full px-4 py-3 border border-[#E0E0E0] placeholder-brown-400 text-brown-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD59A] bg-white text-sm"
                    max="18"
                    min="1"
                    placeholder="請輸入學生年齡"
                    type="number"
                  />
                </div>
              </div>
              )}
            </div>

            <div>
              <button
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-[#A64B2A] hover:bg-[#8B3A1F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A64B2A] disabled:opacity-50 transition-colors"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? '處理中...' : '確認註冊資訊'}
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

          {/* 確認對話框 */}
          {showConfirmation && formData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
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
                {formData.phone && (
                  <div>
                    <span className="text-sm font-medium text-brown-600">電話：</span>
                    <span className="text-sm text-brown-700 ml-2">{formData.phone}</span>
                  </div>
                )}
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
              </div>

              <div className="flex space-x-3">
                <button
                  className="flex-1 py-2 px-4 border border-[#E0E0E0] text-brown-700 rounded-xl hover:bg-gray-50 transition-colors"
                  onClick={handleBackToForm}
                >
                  返回修改
                </button>
                <button
                  className="flex-1 py-2 px-4 bg-[#A64B2A] text-white rounded-xl hover:bg-[#8B3A1F] transition-colors"
                  onClick={handleConfirmSubmit}
                >
                  確認提交
                </button>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
} 