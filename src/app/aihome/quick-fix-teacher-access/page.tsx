'use client';

import { useState, useEffect } from 'react';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { useTeacherAccess } from '@/hooks/saas/useTeacherAccess';
import { HanamiButton } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function QuickFixTeacherAccessPage() {
  const { user } = useSaasAuth();
  const { 
    teacherAccess, 
    hasTeacherAccess, 
    checkTeacherAccess,
    clearTeacherAccess
  } = useTeacherAccess();
  const router = useRouter();
  const [isFixing, setIsFixing] = useState(false);

  // 已知的教師數據
  const knownTeachers = {
    'liugushk@gmail.com': {
      id: 'dde10af1-7e33-47e1-b9d5-1984cc859640',
      teacher_nickname: 'LiuLiu',
      teacher_email: 'liugushk@gmail.com',
      teacher_fullname: 'LiuLiu',
      teacher_role: 'teacher',
      teacher_status: 'active'
    },
    'admin@hanami.com': {
      id: '0f3c78f8-8320-4981-a320-d3e0837b5616',
      teacher_nickname: 'admin',
      teacher_email: 'admin@hanami.com',
      teacher_fullname: 'admin',
      teacher_role: 'teacher',
      teacher_status: 'active'
    },
    'tracy0721tung@gmail.com': {
      id: '4339a0d8-43dd-44fc-b035-a1f51e007bc2',
      teacher_nickname: 'Tracy',
      teacher_email: 'tracy0721tung@gmail.com',
      teacher_fullname: 'Tracy',
      teacher_role: 'teacher',
      teacher_status: 'part time'
    }
  };

  // 快速修復函數
  const quickFix = async () => {
    if (!user?.email) {
      toast.error('請先登入');
      return;
    }

    setIsFixing(true);

    try {
      console.log('開始快速修復，用戶:', user.email);
      
      // 清除現有的會話存儲
      sessionStorage.removeItem('hanami_teacher_access');
      clearTeacherAccess();

      // 使用強制檢查模式重新檢查權限
      await checkTeacherAccess(user.email, true);
      
      toast.success('權限檢查完成！');
      
      // 等待一下讓 toast 顯示
      setTimeout(() => {
        router.push('/aihome/teacher-zone');
      }, 1500);

    } catch (error) {
      console.error('修復失敗:', error);
      toast.error('修復失敗，請重試');
    } finally {
      setIsFixing(false);
    }
  };

  // 清除所有數據
  const clearAll = () => {
    sessionStorage.removeItem('hanami_teacher_access');
    clearTeacherAccess();
    toast.success('已清除所有權限數據');
  };

  // 直接跳轉測試
  const testAccess = () => {
    if (hasTeacherAccess) {
      router.push('/aihome/teacher-zone');
    } else {
      toast.error('您還沒有教師權限，請先修復');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg p-8 border border-hanami-border shadow-lg">
          <h1 className="text-3xl font-bold text-hanami-text mb-6 text-center">
            🚀 快速修復教師權限
          </h1>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-hanami-text mb-4">當前狀態</h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p><strong>用戶:</strong> {user?.email || '未登入'}</p>
              <p><strong>教師權限:</strong> 
                <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${
                  hasTeacherAccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {hasTeacherAccess ? '✓ 有權限' : '✗ 無權限'}
                </span>
              </p>
              {user?.email && knownTeachers[user.email as keyof typeof knownTeachers] && (
                <p className="text-green-600 text-sm">
                  ✓ 您的帳號在已知教師列表中
                </p>
              )}
            </div>
          </div>

          {user?.email && knownTeachers[user.email as keyof typeof knownTeachers] ? (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-hanami-text mb-4">教師信息</h2>
              <div className="bg-blue-50 rounded-lg p-4">
                {(() => {
                  const teacher = knownTeachers[user.email as keyof typeof knownTeachers];
                  return (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>暱稱:</strong> {teacher.teacher_nickname}</p>
                        <p><strong>姓名:</strong> {teacher.teacher_fullname}</p>
                      </div>
                      <div>
                        <p><strong>角色:</strong> {teacher.teacher_role}</p>
                        <p><strong>狀態:</strong> {teacher.teacher_status}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : user?.email ? (
            <div className="mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                  ⚠️ 您的帳號 ({user.email}) 不在已知教師列表中。
                  如果您確實是教師，請聯繫管理員添加您的帳號。
                </p>
              </div>
            </div>
          ) : null}

          <div className="space-y-4">
            {user?.email && knownTeachers[user.email as keyof typeof knownTeachers] ? (
              <>
                <HanamiButton 
                  onClick={quickFix}
                  disabled={isFixing || hasTeacherAccess}
                  className="w-full"
                  variant="cute"
                >
                  {isFixing ? '修復中...' : hasTeacherAccess ? '✓ 權限已修復' : '🔧 快速修復權限'}
                </HanamiButton>
                
                <HanamiButton 
                  onClick={testAccess}
                  disabled={!hasTeacherAccess}
                  className="w-full"
                  variant="primary"
                >
                  測試花見老師專區
                </HanamiButton>
              </>
            ) : (
              <div className="text-center">
                <p className="text-gray-500 mb-4">請先登入具有教師權限的帳號</p>
                <HanamiButton 
                  onClick={() => router.push('/aihome')}
                  className="w-full"
                  variant="secondary"
                >
                  返回首頁
                </HanamiButton>
              </div>
            )}
            
            <div className="flex space-x-4">
              <HanamiButton 
                onClick={clearAll}
                variant="danger"
                className="flex-1"
              >
                清除所有數據
              </HanamiButton>
              
              <HanamiButton 
                onClick={() => router.push('/aihome/diagnose-session')}
                variant="secondary"
                className="flex-1"
              >
                詳細診斷
              </HanamiButton>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">已知教師帳號:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• liugushk@gmail.com (LiuLiu)</p>
              <p>• admin@hanami.com (admin)</p>
              <p>• tracy0721tung@gmail.com (Tracy)</p>
              <p>• 以及其他在 hanami_employee 表中的教師</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
