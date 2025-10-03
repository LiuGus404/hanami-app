'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function FixMaxStudentsUpdatePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testMaxStudentsUpdate = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('=== 測試 max_students 欄位更新 ===');

      // 1. 獲取當前記錄
      const { data: currentData, error: getError } = await supabase
        .from('hanami_course_codes')
        .select('*')
        .eq('course_code', 'MUSIC_FOCUS_001')
        .single();

      if (getError || !currentData) {
        setResult({ error: getError?.message || '找不到記錄', step: 'get' });
        return;
      }

      console.log('當前記錄:', currentData);

      // 2. 測試只更新 max_students
      console.log('測試只更新 max_students 從', currentData.max_students, '改為 5');
      
      const { error: updateError } = await supabase
        .from('hanami_course_codes')
        .update({
          max_students: 5,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentData.id);

      console.log('更新結果:', { updateError });

      if (updateError) {
        setResult({ 
          error: updateError.message, 
          step: 'update', 
          success: false,
          data: { 
            originalMaxStudents: currentData.max_students,
            requestedMaxStudents: 5,
            error: updateError.message
          }
        });
        return;
      }

      // 3. 驗證更新結果
      const { data: verifyData, error: verifyError } = await supabase
        .from('hanami_course_codes')
        .select('*')
        .eq('id', currentData.id)
        .single();

      if (verifyError) {
        setResult({ 
          error: verifyError.message, 
          step: 'verify', 
          success: false 
        });
        return;
      }

      console.log('更新後記錄:', verifyData);

      const actuallyUpdated = verifyData.max_students === 5;
      console.log('是否真的更新了:', actuallyUpdated);

      // 4. 恢復原始值
      const { error: restoreError } = await supabase
        .from('hanami_course_codes')
        .update({
          max_students: currentData.max_students,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentData.id);

      if (restoreError) {
        console.error('恢復失敗:', restoreError);
      }

      setResult({
        success: true,
        step: 'complete',
        data: {
          originalMaxStudents: currentData.max_students,
          requestedMaxStudents: 5,
          actualMaxStudents: verifyData.max_students,
          actuallyUpdated,
          updateTimeChanged: currentData.updated_at !== verifyData.updated_at,
          originalData: currentData,
          verifyData
        }
      });

    } catch (error) {
      console.error('測試過程中發生錯誤:', error);
      setResult({ 
        error: error instanceof Error ? error.message : '未知錯誤', 
        step: 'exception', 
        success: false 
      });
    } finally {
      setLoading(false);
    }
  };

  const showSQLDiagnosis = () => {
    const sqlScript = `-- 在 Supabase SQL 編輯器中執行以下診斷腳本

-- 1. 檢查約束條件
SELECT '=== 檢查約束條件 ===' as info;
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    cc.check_clause
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.check_constraints AS cc
    ON cc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'hanami_course_codes'
    AND tc.table_schema = 'public'
    AND kcu.column_name = 'max_students';

-- 2. 檢查觸發器
SELECT '=== 檢查觸發器 ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'hanami_course_codes'
    AND event_object_schema = 'public';

-- 3. 測試直接更新
UPDATE hanami_course_codes 
SET max_students = 5
WHERE course_code = 'MUSIC_FOCUS_001';

-- 4. 檢查結果
SELECT max_students FROM hanami_course_codes WHERE course_code = 'MUSIC_FOCUS_001';`;

    navigator.clipboard.writeText(sqlScript).then(() => {
      alert('診斷 SQL 腳本已複製到剪貼板！請在 Supabase SQL 編輯器中執行。');
    }).catch(() => {
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
            max_students 更新問題修復
          </h1>

          <div className="bg-gradient-to-r from-[#FFE0E0] to-[#FFD1D1] p-4 rounded-lg border border-[#FFB3B3] mb-6">
            <h3 className="font-semibold text-[#4B4036] mb-2">🚨 問題確認</h3>
            <p className="text-[#87704e] text-sm mb-2">
              測試結果顯示：max_students 欄位無法更新！
            </p>
            <ul className="text-[#87704e] text-sm space-y-1 ml-4">
              <li>• 變更檢測：✅ 正確（5 → 8）</li>
              <li>• 更新操作：✅ 成功（沒有錯誤）</li>
              <li>• 實際結果：❌ 失敗（仍然是 8）</li>
            </ul>
            <p className="text-[#87704e] text-sm mt-2">
              這表示資料庫層面阻止了 max_students 的更新。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={testMaxStudentsUpdate}
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
                  測試 max_students 更新
                </>
              )}
            </button>

            <button
              onClick={showSQLDiagnosis}
              className="bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#B91C1C] hover:to-[#991B1B] text-white py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              獲取診斷 SQL
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-[#4B4036] mb-4">測試結果</h3>
            
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
              {result.data && (
                <div>
                  <strong>詳細資料:</strong>
                  <pre className="mt-2 p-2 bg-white rounded text-sm overflow-auto max-h-64">
                    {typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {result.success && result.data && result.data.originalMaxStudents !== undefined && (
              <div className="bg-gradient-to-r from-[#E8F5E8] to-[#D4F4D4] p-4 rounded-lg border border-[#90EE90]">
                <h4 className="font-semibold text-[#4B4036] mb-2">📊 max_students 更新分析</h4>
                <div className="space-y-2 text-[#87704e]">
                  <p><strong>原始值:</strong> {result.data.originalMaxStudents}</p>
                  <p><strong>請求更新為:</strong> {result.data.requestedMaxStudents}</p>
                  <p><strong>實際結果:</strong> {result.data.actualMaxStudents}</p>
                  <p><strong>是否真的更新了:</strong> {result.data.actuallyUpdated ? '✅ 是' : '❌ 否'}</p>
                  <p><strong>時間戳是否改變:</strong> {result.data.updateTimeChanged ? '✅ 是' : '❌ 否'}</p>
                </div>
                
                {!result.data.actuallyUpdated && (
                  <div className="mt-3 p-3 bg-red-100 border border-red-400 rounded-lg">
                    <p className="text-red-800 text-sm font-semibold">
                      ❌ 確認問題：max_students 無法更新！
                    </p>
                    <p className="text-red-800 text-sm mt-1">
                      這可能是由於：
                    </p>
                    <ul className="text-red-800 text-sm mt-1 ml-4">
                      <li>• 資料庫觸發器阻止更新</li>
                      <li>• 約束條件限制更新</li>
                      <li>• RLS 政策限制特定欄位</li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            {result.step === 'sql_instructions' && (
              <div className="bg-gradient-to-r from-[#E6F3FF] to-[#CCE7FF] p-4 rounded-lg border border-[#99CCFF]">
                <h4 className="font-semibold text-[#4B4036] mb-2">📋 SQL 診斷腳本</h4>
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
              <p>點擊「測試 max_students 更新」確認問題</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#A68A64] text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <p>如果確認無法更新，點擊「獲取診斷 SQL」</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#A68A64] text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <p>在 Supabase SQL 編輯器中執行診斷腳本</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#A68A64] text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
              <p>根據診斷結果修復資料庫問題</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



