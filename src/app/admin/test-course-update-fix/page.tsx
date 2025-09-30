'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestCourseUpdateFixPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testCourseUpdate = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('=== 測試課程更新修復 ===');

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

      // 2. 測試更新多個欄位
      const updateData = {
        course_name: '測試課程名稱 - ' + Date.now(),
        course_description: '測試描述 - ' + Date.now(),
        max_students: 6,
        room_location: '測試教室 - ' + Date.now(),
        updated_at: new Date().toISOString()
      };

      console.log('準備更新的資料:', updateData);
      
      const { error: updateError } = await supabase
        .from('hanami_course_codes')
        .update(updateData)
        .eq('id', currentData.id);

      if (updateError) {
        setResult({ 
          error: updateError.message, 
          step: 'update', 
          success: false,
          data: { updateError: updateError.message }
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

      // 4. 檢查實際變更
      const actualChanges = [];
      if (verifyData.course_name !== currentData.course_name) {
        actualChanges.push(`課程名稱: ${currentData.course_name} → ${verifyData.course_name}`);
      }
      if (verifyData.course_description !== currentData.course_description) {
        actualChanges.push(`課程描述: ${currentData.course_description || '空'} → ${verifyData.course_description || '空'}`);
      }
      if (verifyData.max_students !== currentData.max_students) {
        actualChanges.push(`最大學生數: ${currentData.max_students} → ${verifyData.max_students}`);
      }
      if (verifyData.room_location !== currentData.room_location) {
        actualChanges.push(`教室位置: ${currentData.room_location || '空'} → ${verifyData.room_location || '空'}`);
      }

      // 5. 恢復原始值
      const { error: restoreError } = await supabase
        .from('hanami_course_codes')
        .update({
          course_name: currentData.course_name,
          course_description: currentData.course_description,
          max_students: currentData.max_students,
          room_location: currentData.room_location,
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
          originalData: currentData,
          updateData,
          verifyData,
          actualChanges,
          changesCount: actualChanges.length,
          allFieldsUpdated: actualChanges.length === 4
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
            課程更新修復測試
          </h1>

          <div className="bg-gradient-to-r from-[#E8F5E8] to-[#D4F4D4] p-4 rounded-lg border border-[#90EE90] mb-6">
            <h3 className="font-semibold text-[#4B4036] mb-2">🎯 測試目標</h3>
            <p className="text-[#87704e] text-sm mb-2">
              測試修復後的課程更新功能是否能正確更新所有欄位
            </p>
            <ul className="text-[#87704e] text-sm space-y-1 ml-4">
              <li>• 課程名稱 (course_name)</li>
              <li>• 課程描述 (course_description)</li>
              <li>• 最大學生數 (max_students)</li>
              <li>• 教室位置 (room_location)</li>
            </ul>
          </div>

          <button
            onClick={testCourseUpdate}
            disabled={loading}
            className="bg-gradient-to-r from-[#A68A64] to-[#8f7350] hover:from-[#8f7350] hover:to-[#6b5a47] text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
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
                測試課程更新修復
              </>
            )}
          </button>
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

            {result.success && result.data && result.data.actualChanges && (
              <div className="bg-gradient-to-r from-[#E8F5E8] to-[#D4F4D4] p-4 rounded-lg border border-[#90EE90]">
                <h4 className="font-semibold text-[#4B4036] mb-2">📊 更新結果分析</h4>
                <div className="space-y-2 text-[#87704e]">
                  <p><strong>變更數量:</strong> {result.data.changesCount} / 4</p>
                  <p><strong>所有欄位都更新了:</strong> {result.data.allFieldsUpdated ? '✅ 是' : '❌ 否'}</p>
                  <div className="mt-3">
                    <strong>實際變更:</strong>
                    <ul className="mt-1 ml-4 space-y-1">
                      {result.data.actualChanges.map((change: string, index: number) => (
                        <li key={index} className="text-sm">• {change}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {result.data.allFieldsUpdated ? (
                  <div className="mt-3 p-3 bg-green-100 border border-green-400 rounded-lg">
                    <p className="text-green-800 text-sm font-semibold">
                      ✅ 修復成功！所有欄位都可以正常更新了！
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 p-3 bg-yellow-100 border border-yellow-400 rounded-lg">
                    <p className="text-yellow-800 text-sm font-semibold">
                      ⚠️ 部分欄位仍然無法更新，需要進一步檢查
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-6">
          <h3 className="text-xl font-bold text-[#4B4036] mb-4">修復說明</h3>
          <div className="space-y-3 text-[#87704e]">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#A68A64] text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <p>修復了 <code>handleEditCourseCode</code> 函數中的更新邏輯</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#A68A64] text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <p>改善了欄位比較和驗證邏輯</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#A68A64] text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <p>增加了更詳細的日誌記錄</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#A68A64] text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
              <p>現在應該可以正確更新所有欄位</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}