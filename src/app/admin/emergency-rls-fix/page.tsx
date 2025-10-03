'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function EmergencyRLSFixPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const executeRLSFix = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('=== 開始執行 RLS 修復 ===');

      // 1. 測試更新操作
      console.log('步驟 1: 測試當前更新操作');
      const { data: testData, error: testError } = await supabase
        .from('hanami_course_codes')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('course_code', 'MUSIC_FOCUS_001')
        .select();

      console.log('測試更新結果:', { testData, testError });

      if (testError) {
        setResult({ 
          error: testError.message, 
          step: 'test_update', 
          success: false,
          note: '更新操作失敗，需要檢查 RLS 政策'
        });
        return;
      }

      if (!testData || testData.length === 0) {
        setResult({ 
          error: '更新成功但沒有返回資料', 
          step: 'test_update', 
          success: false,
          note: '確認是 RLS 政策問題，需要執行修復腳本'
        });
        return;
      }

      setResult({ 
        success: true, 
        step: 'test_update', 
        data: testData[0],
        note: '更新操作正常，不需要修復'
      });

    } catch (error) {
      console.error('修復過程中發生錯誤:', error);
      setResult({ 
        error: error instanceof Error ? error.message : '未知錯誤', 
        step: 'exception', 
        success: false 
      });
    } finally {
      setLoading(false);
    }
  };

  const showSQLInstructions = () => {
    const sqlScript = `-- 在 Supabase SQL 編輯器中執行以下腳本

-- 1. 刪除所有現有政策
DROP POLICY IF EXISTS "hanami_course_codes_select_policy" ON hanami_course_codes;
DROP POLICY IF EXISTS "hanami_course_codes_insert_policy" ON hanami_course_codes;
DROP POLICY IF EXISTS "hanami_course_codes_update_policy" ON hanami_course_codes;
DROP POLICY IF EXISTS "hanami_course_codes_delete_policy" ON hanami_course_codes;
DROP POLICY IF EXISTS "permissive_course_codes_policy" ON hanami_course_codes;
DROP POLICY IF EXISTS "allow_all_authenticated_users" ON hanami_course_codes;
DROP POLICY IF EXISTS "course_codes_full_access" ON hanami_course_codes;

-- 2. 創建新的寬鬆政策
CREATE POLICY "course_codes_full_access" ON hanami_course_codes
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 3. 測試更新操作
UPDATE hanami_course_codes 
SET updated_at = NOW() 
WHERE course_code = 'MUSIC_FOCUS_001'
RETURNING id, course_code, course_name, updated_at;`;

    navigator.clipboard.writeText(sqlScript).then(() => {
      alert('SQL 腳本已複製到剪貼板！請在 Supabase SQL 編輯器中執行。');
    }).catch(() => {
      // 如果複製失敗，顯示在頁面上
      setResult({ 
        success: true, 
        step: 'sql_instructions', 
        data: { sql: sqlScript },
        note: '請複製以下 SQL 腳本到 Supabase SQL 編輯器中執行'
      });
    });
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] px-4 py-6 font-['Quicksand',_sans-serif]">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-6 mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#4B4036] to-[#A68A64] bg-clip-text text-transparent flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-[#A68A64] to-[#8f7350] rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            RLS 政策緊急修復
          </h1>

          <div className="bg-gradient-to-r from-[#FFE0E0] to-[#FFD1D1] p-4 rounded-lg border border-[#FFB3B3] mb-6">
            <h3 className="font-semibold text-[#4B4036] mb-2">🚨 緊急修復</h3>
            <p className="text-[#87704e] text-sm mb-2">
              您的日誌顯示更新操作成功但無法返回資料，這是典型的 RLS 政策問題。
            </p>
            <ul className="text-[#87704e] text-sm space-y-1 ml-4">
              <li>• 更新操作成功（沒有錯誤）</li>
              <li>• 驗證查詢成功（可以讀取資料）</li>
              <li>• 但 .select() 無法返回資料（RLS 政策阻止）</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={executeRLSFix}
              disabled={loading}
              className="bg-gradient-to-r from-[#A68A64] to-[#8f7350] hover:from-[#8f7350] hover:to-[#6b5a47] text-white py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
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
                  測試當前狀態
                </>
              )}
            </button>

            <button
              onClick={showSQLInstructions}
              className="bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#B91C1C] hover:to-[#991B1B] text-white py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              獲取修復 SQL
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-[#4B4036] mb-4">修復結果</h3>
            
            <div className={`p-4 rounded-lg mb-4 ${
              result.success 
                ? 'bg-green-100 border border-green-400 text-green-700'
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}>
              <div className="font-semibold mb-2">
                步驟: {result.step} {result.success ? '✅' : '❌'}
              </div>
              {result.error && (
                <div className="mb-2">
                  <strong>錯誤:</strong> {result.error}
                </div>
              )}
              {result.note && (
                <div className="mb-2">
                  <strong>說明:</strong> {result.note}
                </div>
              )}
              {result.data && (
                <div>
                  <strong>資料:</strong>
                  <pre className="mt-2 p-2 bg-white rounded text-sm overflow-auto max-h-64">
                    {typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {!result.success && result.step === 'test_update' && (
              <div className="bg-gradient-to-r from-[#FFF0E6] to-[#FFE6CC] p-4 rounded-lg border border-[#FFCC99]">
                <h4 className="font-semibold text-[#4B4036] mb-2">🔧 需要執行 SQL 修復</h4>
                <p className="text-[#87704e] mb-3">
                  確認是 RLS 政策問題。請點擊「獲取修復 SQL」按鈕，然後在 Supabase SQL 編輯器中執行。
                </p>
              </div>
            )}

            {result.success && result.step === 'test_update' && (
              <div className="bg-gradient-to-r from-[#E8F5E8] to-[#D4F4D4] p-4 rounded-lg border border-[#90EE90]">
                <h4 className="font-semibold text-[#4B4036] mb-2">✅ 不需要修復</h4>
                <p className="text-[#87704e]">
                  更新操作正常，不需要修復 RLS 政策。
                </p>
              </div>
            )}

            {result.step === 'sql_instructions' && (
              <div className="bg-gradient-to-r from-[#E6F3FF] to-[#CCE7FF] p-4 rounded-lg border border-[#99CCFF]">
                <h4 className="font-semibold text-[#4B4036] mb-2">📋 SQL 修復腳本</h4>
                <p className="text-[#87704e] mb-3">
                  請將以下 SQL 腳本複製到 Supabase SQL 編輯器中執行：
                </p>
                <div className="bg-black text-green-400 p-3 rounded-lg font-mono text-sm overflow-auto">
                  <pre>{result.data.sql}</pre>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-6">
          <h3 className="text-xl font-bold text-[#4B4036] mb-4">修復步驟</h3>
          <div className="space-y-3 text-[#87704e]">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#A68A64] text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <p>點擊「測試當前狀態」確認問題</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#A68A64] text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <p>如果確認是 RLS 問題，點擊「獲取修復 SQL」</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#A68A64] text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <p>複製 SQL 腳本到 Supabase SQL 編輯器執行</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#A68A64] text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
              <p>執行完成後，返回課程代碼管理頁面測試</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



