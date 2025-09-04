'use client';
import React, { useState, useEffect } from 'react';
import { HanamiCard, HanamiButton } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';

export default function TestHanamiTeachingActivitiesPage() {
  const { user, loading: userLoading } = useUser();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !userLoading) {
      testTableAccess();
    }
  }, [user, userLoading]);

  const testTableAccess = async () => {
    setLoading(true);
    setError(null);
    setTestResults([]);

    try {
      // 測試1: 檢查表是否存在
      console.log('測試1: 檢查 hanami_teaching_activities 表是否存在...');
      const { data: tableCheck, error: tableError } = await supabase
        .from('hanami_teaching_activities')
        .select('count')
        .limit(1);

      setTestResults(prev => [...prev, {
        test: '表存在性檢查',
        success: !tableError,
        data: tableCheck,
        error: tableError
      }]);

      if (tableError) {
        console.error('表存在性檢查失敗:', tableError);
        setTestResults(prev => [...prev, {
          test: '錯誤詳情',
          success: false,
          data: null,
          error: {
            message: tableError.message,
            code: tableError.code,
            details: tableError.details,
            hint: tableError.hint
          }
        }]);
      }

      // 測試2: 嘗試查詢數據
      if (!tableError) {
        console.log('測試2: 嘗試查詢 hanami_teaching_activities 數據...');
        const { data: queryData, error: queryError } = await supabase
          .from('hanami_teaching_activities')
          .select('*')
          .limit(5);

        setTestResults(prev => [...prev, {
          test: '數據查詢測試',
          success: !queryError,
          data: queryData ? `${queryData.length} 條記錄` : null,
          error: queryError
        }]);

        if (queryError) {
          console.error('數據查詢失敗:', queryError);
        }
      }

      // 測試3: 檢查用戶權限
      console.log('測試3: 檢查用戶權限...');
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      setTestResults(prev => [...prev, {
        test: '用戶認證檢查',
        success: !userError && !!userData.user,
        data: userData.user ? {
          id: userData.user.id,
          email: userData.user.email,
          role: userData.user.user_metadata?.role || '未知'
        } : null,
        error: userError
      }]);

      // 測試4: 檢查 RLS 策略
      console.log('測試4: 檢查 RLS 策略...');
      try {
        const { data: rlsData, error: rlsError } = await supabase
          .rpc('get_rls_policies', { table_name: 'hanami_teaching_activities' });

        setTestResults(prev => [...prev, {
          test: 'RLS 策略檢查',
          success: !rlsError,
          data: rlsData,
          error: rlsError
        }]);
      } catch (rlsError) {
        setTestResults(prev => [...prev, {
          test: 'RLS 策略檢查',
          success: false,
          data: null,
          error: { message: '無法檢查 RLS 策略', details: rlsError }
        }]);
      }

    } catch (err) {
      console.error('測試過程中發生錯誤:', err);
      setError(err instanceof Error ? err.message : '未知錯誤');
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setError(null);
  };

  if (userLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">載入中...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-600">請先登入</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">測試 hanami_teaching_activities 表訪問權限</h1>
      
      <div className="mb-6">
        <HanamiButton onClick={testTableAccess} disabled={loading}>
          {loading ? '測試中...' : '重新測試'}
        </HanamiButton>
        <HanamiButton onClick={clearResults} variant="secondary" className="ml-3">
          清除結果
        </HanamiButton>
      </div>

      {error && (
        <HanamiCard className="mb-6">
          <div className="text-red-600">
            <h3 className="font-bold">錯誤:</h3>
            <p>{error}</p>
          </div>
        </HanamiCard>
      )}

      {testResults.length > 0 && (
        <div className="space-y-4">
          {testResults.map((result, index) => (
            <HanamiCard key={index}>
              <div className={`p-4 ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
                <h3 className={`font-bold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.test}
                </h3>
                
                <div className="mt-2">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    result.success ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                  }`}>
                    {result.success ? '成功' : '失敗'}
                  </span>
                </div>

                {result.data && (
                  <div className="mt-2">
                    <h4 className="font-medium text-gray-700">數據:</h4>
                    <pre className="text-sm bg-gray-100 p-2 rounded mt-1 overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}

                {result.error && (
                  <div className="mt-2">
                    <h4 className="font-medium text-red-700">錯誤:</h4>
                    <pre className="text-sm bg-red-100 p-2 rounded mt-1 overflow-auto">
                      {JSON.stringify(result.error, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </HanamiCard>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-bold text-blue-800 mb-2">說明:</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• 此頁面用於測試 hanami_teaching_activities 表的訪問權限</li>
          <li>• 如果表不存在或權限不足，會顯示相應的錯誤信息</li>
          <li>• 406 錯誤通常表示權限問題或 RLS 策略限制</li>
          <li>• 請檢查用戶角色和數據庫權限設置</li>
        </ul>
      </div>
    </div>
  );
}
