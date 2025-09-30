'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestRLSFixImmediatePage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testRLSFix = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      console.log('開始測試 RLS 修復...');

      // 1. 測試查詢
      console.log('步驟 1: 測試查詢權限');
      const { data: queryData, error: queryError } = await supabase
        .from('hanami_course_codes')
        .select('id, course_code, course_name')
        .eq('course_code', 'MUSIC_FOCUS_001')
        .single();

      console.log('查詢結果:', { queryData, queryError });

      if (queryError) {
        setTestResult({ step: 'query', error: queryError.message, success: false });
        return;
      }

      if (!queryData) {
        setTestResult({ step: 'query', error: '找不到 MUSIC_FOCUS_001 記錄', success: false });
        return;
      }

      // 2. 測試更新（不帶 select）
      console.log('步驟 2: 測試更新（不帶 select）');
      const { error: updateError } = await supabase
        .from('hanami_course_codes')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', queryData.id);

      console.log('更新結果:', { updateError });

      if (updateError) {
        setTestResult({ step: 'update', error: updateError.message, success: false });
        return;
      }

      // 3. 測試更新（帶 select）
      console.log('步驟 3: 測試更新（帶 select）');
      const { data: updateWithSelectData, error: updateWithSelectError } = await supabase
        .from('hanami_course_codes')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', queryData.id)
        .select();

      console.log('更新（帶 select）結果:', { updateWithSelectData, updateWithSelectError });

      if (updateWithSelectError) {
        setTestResult({ 
          step: 'update_with_select', 
          error: updateWithSelectError.message, 
          success: false,
          note: '更新成功但無法返回資料 - 這是 RLS 政策問題'
        });
        return;
      }

      if (!updateWithSelectData || updateWithSelectData.length === 0) {
        setTestResult({ 
          step: 'update_with_select', 
          error: '更新成功但沒有返回資料', 
          success: false,
          note: '這是 RLS 政策問題，需要執行修復腳本'
        });
        return;
      }

      // 4. 測試驗證查詢
      console.log('步驟 4: 測試驗證查詢');
      const { data: verifyData, error: verifyError } = await supabase
        .from('hanami_course_codes')
        .select('id, course_code, course_name, updated_at')
        .eq('id', queryData.id)
        .single();

      console.log('驗證查詢結果:', { verifyData, verifyError });

      if (verifyError) {
        setTestResult({ 
          step: 'verify', 
          error: verifyError.message, 
          success: false 
        });
        return;
      }

      setTestResult({ 
        step: 'success', 
        error: null, 
        success: true,
        data: {
          originalRecord: queryData,
          updatedRecord: updateWithSelectData[0],
          verifiedRecord: verifyData
        }
      });

    } catch (error) {
      console.error('測試過程中發生錯誤:', error);
      setTestResult({ 
        step: 'exception', 
        error: error instanceof Error ? error.message : '未知錯誤', 
        success: false 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] px-4 py-6 font-['Quicksand',_sans-serif]">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-6 mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#4B4036] to-[#A68A64] bg-clip-text text-transparent flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-[#A68A64] to-[#8f7350] rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            RLS 政策修復測試
          </h1>

          <div className="bg-gradient-to-r from-[#FFE0E0] to-[#FFD1D1] p-4 rounded-lg border border-[#FFB3B3] mb-6">
            <h3 className="font-semibold text-[#4B4036] mb-2">🔧 問題診斷</h3>
            <p className="text-[#87704e] text-sm">
              從您的日誌可以看出：更新操作成功，但無法返回資料。這是典型的 RLS 政策問題。
            </p>
          </div>

          <button
            onClick={testRLSFix}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#A68A64] to-[#8f7350] hover:from-[#8f7350] hover:to-[#6b5a47] text-white py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                測試中...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                測試 RLS 修復
              </>
            )}
          </button>
        </div>

        {testResult && (
          <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-[#4B4036] mb-4">測試結果</h3>
            
            <div className={`p-4 rounded-lg mb-4 ${
              testResult.success 
                ? 'bg-green-100 border border-green-400 text-green-700'
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}>
              <div className="font-semibold mb-2">
                步驟: {testResult.step} {testResult.success ? '✅' : '❌'}
              </div>
              {testResult.error && (
                <div className="mb-2">
                  <strong>錯誤:</strong> {testResult.error}
                </div>
              )}
              {testResult.note && (
                <div className="mb-2">
                  <strong>說明:</strong> {testResult.note}
                </div>
              )}
              {testResult.data && (
                <div>
                  <strong>資料:</strong>
                  <pre className="mt-2 p-2 bg-white rounded text-sm overflow-auto max-h-64">
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {!testResult.success && testResult.step === 'update_with_select' && (
              <div className="bg-gradient-to-r from-[#FFF0E6] to-[#FFE6CC] p-4 rounded-lg border border-[#FFCC99]">
                <h4 className="font-semibold text-[#4B4036] mb-2">🔧 需要執行修復腳本</h4>
                <p className="text-[#87704e] mb-3">
                  檢測到 RLS 政策問題。請在 Supabase SQL 編輯器中執行以下腳本：
                </p>
                <div className="bg-black text-green-400 p-3 rounded-lg font-mono text-sm">
                  <div className="mb-2">-- 執行這個腳本來修復 RLS 政策</div>
                  <div>-- sql/fix_rls_course_codes_immediate.sql</div>
                </div>
                <p className="text-sm text-[#87704e] mt-2">
                  執行完成後，再次點擊「測試 RLS 修復」按鈕驗證修復效果。
                </p>
              </div>
            )}

            {testResult.success && (
              <div className="bg-gradient-to-r from-[#E8F5E8] to-[#D4F4D4] p-4 rounded-lg border border-[#90EE90]">
                <h4 className="font-semibold text-[#4B4036] mb-2">✅ 修復成功！</h4>
                <p className="text-[#87704e]">
                  RLS 政策已正確配置，課程代碼的更新功能現在應該可以正常工作了。
                </p>
              </div>
            )}
          </div>
        )}

        <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-6">
          <h3 className="text-xl font-bold text-[#4B4036] mb-4">修復步驟</h3>
          <div className="space-y-3 text-[#87704e]">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#A68A64] text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <p>點擊「測試 RLS 修復」按鈕診斷當前狀態</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#A68A64] text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <p>如果測試失敗，在 Supabase SQL 編輯器中執行 <code className="bg-gray-100 px-1 rounded">sql/fix_rls_course_codes_immediate.sql</code></p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#A68A64] text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <p>執行完成後，再次測試確認修復效果</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#A68A64] text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
              <p>返回課程代碼管理頁面正常使用</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

