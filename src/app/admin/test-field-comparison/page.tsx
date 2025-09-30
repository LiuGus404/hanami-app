'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestFieldComparisonPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testFieldComparison = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('=== 測試欄位比較邏輯 ===');

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

      console.log('當前資料庫記錄:', currentData);

      // 2. 模擬表單數據（修改 max_students）
      const formData = {
        id: currentData.id,
        course_code: currentData.course_code,
        course_name: currentData.course_name, // 相同
        course_description: currentData.course_description,
        max_students: 5, // 修改為 5
        teacher_id: currentData.teacher_id,
        room_location: currentData.room_location,
        is_active: currentData.is_active,
        course_type_id: currentData.course_type_id
      };

      console.log('模擬表單數據:', formData);

      // 3. 執行詳細比較
      const comparisons = {
        course_name: {
          form: formData.course_name,
          db: currentData.course_name,
          changed: formData.course_name !== currentData.course_name
        },
        course_description: {
          form: formData.course_description,
          db: currentData.course_description || '',
          changed: formData.course_description !== (currentData.course_description || '')
        },
        max_students: {
          form: formData.max_students,
          db: currentData.max_students || 8,
          changed: formData.max_students !== (currentData.max_students || 8)
        },
        teacher_id: {
          form: formData.teacher_id,
          db: currentData.teacher_id || '',
          changed: formData.teacher_id !== (currentData.teacher_id || '')
        },
        room_location: {
          form: formData.room_location,
          db: currentData.room_location || '',
          changed: formData.room_location !== (currentData.room_location || '')
        },
        is_active: {
          form: formData.is_active,
          db: currentData.is_active || true,
          changed: formData.is_active !== (currentData.is_active || true)
        },
        course_type_id: {
          form: formData.course_type_id,
          db: currentData.course_type_id || '',
          changed: formData.course_type_id !== (currentData.course_type_id || '')
        }
      };

      console.log('詳細比較結果:', comparisons);

      const hasChanges = Object.values(comparisons).some(comp => comp.changed);
      console.log('是否有變更:', hasChanges);

      // 4. 如果有變更，執行更新測試
      if (hasChanges) {
        console.log('執行更新測試...');
        
        const { error: updateError } = await supabase
          .from('hanami_course_codes')
          .update({
            max_students: formData.max_students,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentData.id);

        if (updateError) {
          setResult({ 
            error: updateError.message, 
            step: 'update', 
            success: false 
          });
          return;
        }

        // 驗證更新
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

        // 檢查是否真的更新了
        const actuallyChanged = verifyData.max_students === formData.max_students;
        console.log('是否真的更新了:', actuallyChanged);

        // 恢復原始值
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
            comparisons,
            hasChanges,
            actuallyChanged,
            originalData: currentData,
            formData,
            verifyData
          }
        });
      } else {
        setResult({
          success: true,
          step: 'no_changes',
          data: {
            comparisons,
            hasChanges,
            message: '沒有檢測到變更'
          }
        });
      }

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
            欄位比較邏輯測試
          </h1>

          <div className="bg-gradient-to-r from-[#FFE0E0] to-[#FFD1D1] p-4 rounded-lg border border-[#FFB3B3] mb-6">
            <h3 className="font-semibold text-[#4B4036] mb-2">🔍 問題診斷</h3>
            <p className="text-[#87704e] text-sm mb-2">
              從您的日誌可以看出，max_students 從表單的 5 變回資料庫的 8，這表示：
            </p>
            <ul className="text-[#87704e] text-sm space-y-1 ml-4">
              <li>• 變更檢測邏輯認為有變更</li>
              <li>• 更新操作執行成功</li>
              <li>• 但更新後的值被重置了</li>
            </ul>
          </div>

          <button
            onClick={testFieldComparison}
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
                測試欄位比較邏輯
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

            {result.success && result.data && result.data.comparisons && (
              <div className="bg-gradient-to-r from-[#E8F5E8] to-[#D4F4D4] p-4 rounded-lg border border-[#90EE90]">
                <h4 className="font-semibold text-[#4B4036] mb-2">📊 欄位比較分析</h4>
                <div className="space-y-2 text-[#87704e]">
                  {Object.entries(result.data.comparisons).map(([field, comparison]: [string, any]) => (
                    <div key={field} className="flex items-center gap-2">
                      <span className="font-medium w-32">{field}:</span>
                      <span className={comparison.changed ? 'text-red-600 font-bold' : 'text-green-600'}>
                        {comparison.changed ? '🔄 有變更' : '✅ 無變更'}
                      </span>
                      <span className="text-sm">
                        ({comparison.form} → {comparison.db})
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 p-3 bg-blue-100 border border-blue-400 rounded-lg">
                  <p className="text-blue-800 text-sm font-semibold">
                    💡 分析結果
                  </p>
                  <p className="text-blue-800 text-sm mt-1">
                    是否有變更: {result.data.hasChanges ? '✅ 是' : '❌ 否'}
                  </p>
                  {result.data.actuallyChanged !== undefined && (
                    <p className="text-blue-800 text-sm">
                      是否真的更新了: {result.data.actuallyChanged ? '✅ 是' : '❌ 否'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
