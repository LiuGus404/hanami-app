'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestSimpleCourseUpdatePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testSimpleUpdate = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('=== 開始簡單更新測試 ===');

      // 1. 獲取當前記錄
      console.log('步驟 1: 獲取當前記錄');
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

      // 2. 生成新的課程名稱
      const timestamp = Date.now();
      const newCourseName = `測試課程名稱_${timestamp}`;
      
      console.log('步驟 2: 準備更新');
      console.log('原始課程名稱:', currentData.course_name);
      console.log('新課程名稱:', newCourseName);

      // 3. 執行更新
      console.log('步驟 3: 執行更新');
      const { data: updateData, error: updateError } = await supabase
        .from('hanami_course_codes')
        .update({
          course_name: newCourseName,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentData.id)
        .select();

      console.log('更新結果:', { updateData, updateError });

      if (updateError) {
        setResult({ error: updateError.message, step: 'update', data: { original: currentData.course_name, requested: newCourseName } });
        return;
      }

      if (!updateData || updateData.length === 0) {
        // 嘗試驗證更新
        console.log('步驟 4: 驗證更新（沒有返回資料）');
        const { data: verifyData, error: verifyError } = await supabase
          .from('hanami_course_codes')
          .select('*')
          .eq('id', currentData.id)
          .single();

        console.log('驗證結果:', { verifyData, verifyError });

        if (verifyError) {
          setResult({ error: verifyError.message, step: 'verify', data: { original: currentData.course_name, requested: newCourseName } });
          return;
        }

        const hasChanged = currentData.course_name !== verifyData.course_name;
        setResult({ 
          success: true, 
          step: 'verify_no_return',
          data: {
            original: currentData.course_name,
            requested: newCourseName,
            actual: verifyData.course_name,
            hasChanged,
            updateData: verifyData
          }
        });
      } else {
        // 有返回資料
        const hasChanged = currentData.course_name !== updateData[0].course_name;
        setResult({ 
          success: true, 
          step: 'update_with_return',
          data: {
            original: currentData.course_name,
            requested: newCourseName,
            actual: updateData[0].course_name,
            hasChanged,
            updateData: updateData[0]
          }
        });
      }

      // 4. 恢復原始名稱
      console.log('步驟 5: 恢復原始名稱');
      const { error: restoreError } = await supabase
        .from('hanami_course_codes')
        .update({
          course_name: currentData.course_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentData.id);

      if (restoreError) {
        console.error('恢復原始名稱失敗:', restoreError);
      } else {
        console.log('已恢復原始名稱');
      }

    } catch (error) {
      console.error('測試過程中發生錯誤:', error);
      setResult({ error: error instanceof Error ? error.message : '未知錯誤', step: 'exception' });
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
            簡單課程更新測試
          </h1>

          <div className="bg-gradient-to-r from-[#FFE0E0] to-[#FFD1D1] p-4 rounded-lg border border-[#FFB3B3] mb-6">
            <h3 className="font-semibold text-[#4B4036] mb-2">🎯 測試目標</h3>
            <p className="text-[#87704e] text-sm">
              這個測試會嘗試更新 MUSIC_FOCUS_001 的課程名稱，然後立即恢復原始名稱。
              目的是診斷為什麼課程名稱沒有實際改變。
            </p>
          </div>

          <button
            onClick={testSimpleUpdate}
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
                開始簡單更新測試
              </>
            )}
          </button>
        </div>

        {result && (
          <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-6">
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
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {result.success && result.data && (
              <div className="bg-gradient-to-r from-[#E8F5E8] to-[#D4F4D4] p-4 rounded-lg border border-[#90EE90]">
                <h4 className="font-semibold text-[#4B4036] mb-2">📊 更新分析</h4>
                <div className="space-y-2 text-[#87704e]">
                  <p><strong>原始名稱:</strong> {result.data.original}</p>
                  <p><strong>請求更新的名稱:</strong> {result.data.requested}</p>
                  <p><strong>實際結果名稱:</strong> {result.data.actual}</p>
                  <p><strong>名稱是否改變:</strong> {result.data.hasChanged ? '✅ 是' : '❌ 否'}</p>
                </div>
                
                {!result.data.hasChanged && (
                  <div className="mt-3 p-3 bg-yellow-100 border border-yellow-400 rounded-lg">
                    <p className="text-yellow-800 text-sm font-semibold">
                      ⚠️ 發現問題：課程名稱沒有改變！
                    </p>
                    <p className="text-yellow-800 text-sm mt-1">
                      這表示資料庫層面阻止了課程名稱的更新。請執行以下 SQL 腳本來進一步診斷：
                    </p>
                    <code className="text-xs bg-yellow-200 p-1 rounded mt-1 block">
                      sql/check_course_codes_constraints.sql
                    </code>
                  </div>
                )}

                {result.data.hasChanged && (
                  <div className="mt-3 p-3 bg-green-100 border border-green-400 rounded-lg">
                    <p className="text-green-800 text-sm font-semibold">
                      ✅ 更新成功！
                    </p>
                    <p className="text-green-800 text-sm mt-1">
                      課程名稱更新功能正常。問題可能在前端表單的狀態管理。
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-6">
          <h3 className="text-xl font-bold text-[#4B4036] mb-4">下一步行動</h3>
          <div className="space-y-3 text-[#87704e]">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#A68A64] text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <p>如果測試顯示名稱沒有改變，執行 <code className="bg-gray-100 px-1 rounded">sql/check_course_codes_constraints.sql</code></p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#A68A64] text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <p>如果測試顯示名稱成功改變，問題在前端表單狀態管理</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#A68A64] text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <p>檢查瀏覽器控制台的完整日誌信息</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



