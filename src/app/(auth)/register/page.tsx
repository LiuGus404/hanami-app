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
  parentStudentAge: z.union([
    z.string().transform((val) => val === '' ? undefined : parseInt(val, 10)),
    z.number(),
    z.undefined()
  ]).optional(),
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const supabase = createClientComponentClient();

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
      parentStudentAge: undefined,
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
      setValue('parentStudentAge', undefined);
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
      setValue('parentStudentAge', undefined);
    }
    
    setDebugInfo(`角色已變更為: ${newRole === 'admin' ? '管理員' : newRole === 'teacher' ? '教師' : '家長'}`);
  };

  const handleFormSubmit = (data: RegisterFormData) => {
    console.log('=== 表單提交開始 ===');
    console.log('表單數據:', data);
    console.log('表單是否有效:', isValid);
    console.log('表單是否已修改:', isDirty);
    console.log('表單錯誤:', errors);
    
    setDebugInfo(`表單提交: ${JSON.stringify(data, null, 2)}\n表單有效: ${isValid}\n表單已修改: ${isDirty}\n錯誤: ${JSON.stringify(errors, null, 2)}`);
    
    try {
      setFormData(data);
      setShowConfirmation(true);
      console.log('確認對話框已顯示');
    } catch (err) {
      console.error('設置表單數據時出錯:', err);
      setError('設置表單數據時出錯');
    }
  };

  const handleSubmitClick = async () => {
    console.log('=== 手動提交開始 ===');
    console.log('當前表單值:', watchedValues);
    
    // 清理數據，處理 NaN 值
    const cleanedValues = { ...watchedValues };
    if (cleanedValues.parentStudentAge === '' || (typeof cleanedValues.parentStudentAge === 'number' && isNaN(cleanedValues.parentStudentAge))) {
      cleanedValues.parentStudentAge = undefined;
      setValue('parentStudentAge', undefined);
    }
    
    console.log('清理後的表單值:', cleanedValues);
    
    // 手動觸發驗證
    const isValid = await trigger();
    console.log('手動驗證結果:', isValid);
    console.log('驗證錯誤:', errors);
    
    if (isValid) {
      console.log('驗證通過，調用 handleFormSubmit');
      handleFormSubmit(cleanedValues as RegisterFormData);
    } else {
      console.log('驗證失敗，顯示錯誤');
      setDebugInfo(`驗證失敗: ${JSON.stringify(errors, null, 2)}\n清理後的數據: ${JSON.stringify(cleanedValues, null, 2)}`);
    }
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
      setDebugInfo('開始處理註冊申請...');

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
        additionalInfo.parentStudentAge = formData.parentStudentAge;
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
      setDebugInfo(`準備插入數據: ${JSON.stringify(insertData, null, 2)}`);

      // 創建註冊申請
      const { data: insertResult, error: insertError } = await supabase
        .from('registration_requests')
        .insert([insertData])
        .select();

      if (insertError) {
        console.error('插入錯誤:', insertError);
        throw new Error(`資料庫插入失敗: ${insertError.message}`);
      }

      console.log('註冊成功:', insertResult);
      setDebugInfo(`註冊成功: ${JSON.stringify(insertResult, null, 2)}`);

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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToForm = () => {
    setShowConfirmation(false);
    setFormData(null);
  };

  // 測試按鈕
  const handleTestClick = () => {
    console.log('測試按鈕被點擊');
    setDebugInfo('測試按鈕被點擊');
  };

  // 插入測試數據按鈕
  const handleInsertTestData = async (role: 'admin' | 'teacher' | 'parent') => {
    console.log(`=== 插入測試數據開始 (${role}) ===`);
    setDebugInfo(`開始插入測試數據: ${role}`);
    
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      // 生成唯一的郵箱地址
      const timestamp = Date.now();
      const uniqueEmail = `test.${role}.${timestamp}@example.com`;

      // 準備測試數據
      const testData = {
        email: uniqueEmail,
        full_name: `測試${role === 'admin' ? '管理員' : role === 'teacher' ? '教師' : '家長'}`,
        phone: '55147485',
        role: role,
        status: 'pending',
        additional_info: role === 'teacher' ? {
          teacherBackground: '測試教學背景',
          teacherBankId: '1234567890',
          teacherAddress: '測試地址',
          teacherDob: '1990-01-01'
        } : role === 'parent' ? {
          parentStudentName: '測試學生',
          parentStudentAge: 8
        } : {}
      };

      console.log('準備插入測試數據:', testData);
      setDebugInfo(`準備插入測試數據: ${JSON.stringify(testData, null, 2)}`);

      // 檢查是否已存在相同的email申請
      const { data: existingRequests, error: checkError } = await supabase
        .from('registration_requests')
        .select('*')
        .eq('email', testData.email)
        .eq('role', role);

      if (checkError) {
        console.error('檢查重複郵箱錯誤:', checkError);
        throw new Error(`檢查重複郵箱失敗: ${checkError.message}`);
      }

      if (existingRequests && existingRequests.length > 0) {
        setError(`此電子郵件已經有 ${role} 角色的註冊申請`);
        return;
      }

      // 插入測試數據
      const { data: insertResult, error: insertError } = await supabase
        .from('registration_requests')
        .insert([testData])
        .select();

      if (insertError) {
        console.error('插入錯誤:', insertError);
        throw new Error(`資料庫插入失敗: ${insertError.message}`);
      }

      console.log('測試數據插入成功:', insertResult);
      setDebugInfo(`測試數據插入成功: ${JSON.stringify(insertResult, null, 2)}`);

      setSuccess(`${role === 'admin' ? '管理員' : role === 'teacher' ? '教師' : '家長'} 測試數據已成功插入！\n郵箱: ${uniqueEmail}`);

    } catch (err) {
      console.error('插入測試數據錯誤:', err);
      setError(err instanceof Error ? err.message : '插入測試數據時發生錯誤');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 批量插入所有角色測試數據
  const handleInsertAllTestData = async () => {
    console.log('=== 批量插入所有測試數據開始 ===');
    setDebugInfo('開始批量插入所有測試數據');
    
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      const roles: ('admin' | 'teacher' | 'parent')[] = ['admin', 'teacher', 'parent'];
      const results = [];

      for (const role of roles) {
        console.log(`插入 ${role} 測試數據...`);
        
        // 生成唯一的郵箱地址
        const timestamp = Date.now() + Math.random();
        const uniqueEmail = `test.${role}.${timestamp}@example.com`;
        
        // 準備測試數據
        const testData = {
          email: uniqueEmail,
          full_name: `測試${role === 'admin' ? '管理員' : role === 'teacher' ? '教師' : '家長'}`,
          phone: '55147485',
          role: role,
          status: 'pending',
          additional_info: role === 'teacher' ? {
            teacherBackground: '測試教學背景',
            teacherBankId: '1234567890',
            teacherAddress: '測試地址',
            teacherDob: '1990-01-01'
          } : role === 'parent' ? {
            parentStudentName: '測試學生',
            parentStudentAge: 8
          } : {}
        };

        // 檢查是否已存在
        const { data: existingRequests } = await supabase
          .from('registration_requests')
          .select('*')
          .eq('email', testData.email)
          .eq('role', role);

        if (existingRequests && existingRequests.length > 0) {
          results.push(`${role}: 已存在`);
          continue;
        }

        // 插入數據
        const { data: insertResult, error: insertError } = await supabase
          .from('registration_requests')
          .insert([testData])
          .select();

        if (insertError) {
          results.push(`${role}: 失敗 - ${insertError.message}`);
        } else {
          results.push(`${role}: 成功 (${uniqueEmail})`);
        }
      }

      console.log('批量插入結果:', results);
      setDebugInfo(`批量插入結果:\n${results.join('\n')}`);

      setSuccess(`批量插入完成！\n${results.join('\n')}`);

    } catch (err) {
      console.error('批量插入錯誤:', err);
      setError(err instanceof Error ? err.message : '批量插入時發生錯誤');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 清理測試數據
  const handleCleanupTestData = async () => {
    console.log('=== 清理測試數據開始 ===');
    setDebugInfo('開始清理測試數據');
    
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      // 刪除所有測試郵箱的數據
      const { data: deleteResult, error: deleteError } = await supabase
        .from('registration_requests')
        .delete()
        .like('email', 'test.%');

      if (deleteError) {
        console.error('清理錯誤:', deleteError);
        throw new Error(`清理失敗: ${deleteError.message}`);
      }

      console.log('清理結果:', deleteResult);
      setDebugInfo(`清理完成，已刪除所有測試數據`);

      setSuccess(`清理完成！已刪除所有測試數據`);

    } catch (err) {
      console.error('清理錯誤:', err);
      setError(err instanceof Error ? err.message : '清理時發生錯誤');
    } finally {
      setIsSubmitting(false);
    }
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

          {/* 調試信息 */}
          {debugInfo && (
            <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl text-xs">
              <strong>調試信息:</strong><br />
              <pre className="whitespace-pre-wrap">{debugInfo}</pre>
            </div>
          )}
        
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

          {/* 測試按鈕 */}
          <button
            onClick={handleTestClick}
            className="mb-4 w-full py-2 px-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            測試按鈕 (檢查點擊是否正常)
          </button>

          {/* 插入測試數據按鈕 */}
          <button
            onClick={() => handleInsertTestData('admin')}
            className="mb-4 w-full py-2 px-4 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
          >
            插入管理員測試數據
          </button>
          <button
            onClick={() => handleInsertTestData('teacher')}
            className="mb-4 w-full py-2 px-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
          >
            插入教師測試數據
          </button>
          <button
            onClick={() => handleInsertTestData('parent')}
            className="mb-4 w-full py-2 px-4 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors"
          >
            插入家長測試數據
          </button>
          <button
            onClick={handleInsertAllTestData}
            className="mb-4 w-full py-2 px-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
          >
            批量插入所有角色測試數據
          </button>
          <button
            onClick={handleCleanupTestData}
            className="mb-4 w-full py-2 px-4 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors"
          >
            清理測試數據
          </button>

          {/* 手動提交按鈕 */}
          <button
            onClick={handleSubmitClick}
            className="mb-4 w-full py-2 px-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
          >
            手動提交 (繞過表單驗證)
          </button>

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

              {/* 角色選擇 - 改進的設計 */}
              <div>
                <label className="block text-sm font-medium text-brown-700 mb-3">
                  註冊角色 *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('parent')}
                    className={`py-3 px-4 rounded-xl border-2 transition-all ${
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
                    className={`py-3 px-4 rounded-xl border-2 transition-all ${
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
                    className={`py-3 px-4 rounded-xl border-2 transition-all ${
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
                <p className="mt-1 text-sm text-[#A64B2A]">{errors.role.message}</p>
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
                    className="mt-1 appearance-none relative block w-full px-4 py-3 border border-[#E0E0E0] placeholder-brown-400 text-brown-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBC9A4] bg-white text-sm"
                    placeholder="請輸入學生姓名"
                    type="text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brown-700" htmlFor="parentStudentAge">
                    學生年齡
                  </label>
                  <input
                    {...register('parentStudentAge')}
                    className="mt-1 appearance-none relative block w-full px-4 py-3 border border-[#E0E0E0] placeholder-brown-400 text-brown-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBC9A4] bg-white text-sm"
                    max="18"
                    min="1"
                    placeholder="請輸入學生年齡（選填）"
                    type="number"
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

            <div>
              <button
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-[#A64B2A] hover:bg-[#8B3A1F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A64B2A] disabled:opacity-50 transition-colors"
                disabled={isSubmitting}
                type="submit"
                onClick={() => console.log('提交按鈕被點擊')}
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
                  disabled={isSubmitting}
                >
                  返回修改
                </button>
                <button
                  className="flex-1 py-2 px-4 bg-[#A64B2A] text-white rounded-xl hover:bg-[#8B3A1F] transition-colors disabled:opacity-50"
                  onClick={handleConfirmSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '提交中...' : '確認提交'}
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