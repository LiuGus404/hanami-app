'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestCourseNameUpdateDebugPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [originalName, setOriginalName] = useState('音樂專注力初級班A');
  const [newName, setNewName] = useState('音樂專注力班');

  const testCourseNameUpdate = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      console.log('開始測試課程名稱更新...');
      console.log('原始名稱:', originalName);
      console.log('新名稱:', newName);

      // 1. 找到記錄
      console.log('步驟 1: 查找記錄');
      const { data: findData, error: findError } = await supabase
        .from('hanami_course_codes')
        .select('*')
        .eq('course_code', 'MUSIC_FOCUS_001')
        .single();

      console.log('查找結果:', { findData, findError });

      if (findError || !findData) {
        setTestResult({ step: 'find', error: findError?.message || '找不到記錄', success: false });
        return;
      }

      // 2. 記錄更新前的狀態
      const beforeUpdate = {
        id: findData.id,
        course_code: findData.course_code,
        course_name: findData.course_name,
        updated_at: findData.updated_at
      };

      console.log('更新前狀態:', beforeUpdate);

      // 3. 執行更新
      console.log('步驟 2: 執行更新');
      const updateData = {
        course_name: newName,
        updated_at: new Date().toISOString()
      };

      console.log('準備更新的資料:', updateData);

      const { data: updateResult, error: updateError } = await supabase
        .from('hanami_course_codes')
        .update(updateData)
        .eq('id', findData.id)
        .select();

      console.log('更新結果:', { updateResult, updateError });

      if (updateError) {
        setTestResult({ step: 'update', error: updateError.message, success: false });
        return;
      }

      if (!updateResult || updateResult.length === 0) {
        // 如果沒有返回資料，嘗試驗證更新
        console.log('步驟 3: 更新沒有返回資料，嘗試驗證');
        const { data: verifyData, error: verifyError } = await supabase
          .from('hanami_course_codes')
          .select('*')
          .eq('id', findData.id)
          .single();

        console.log('驗證結果:', { verifyData, verifyError });

        if (verifyError) {
          setTestResult({ 
            step: 'verify', 
            error: verifyError.message, 
            success: false,
            note: '更新操作可能成功但無法驗證'
          });
          return;
        }

        const afterUpdate = {
          id: verifyData.id,
          course_code: verifyData.course_code,
          course_name: verifyData.course_name,
          updated_at: verifyData.updated_at
        };

        console.log('更新後狀態:', afterUpdate);

        // 檢查是否有變化
        const hasChanged = beforeUpdate.course_name !== afterUpdate.course_name;
        const timeChanged = beforeUpdate.updated_at !== afterUpdate.updated_at;

        setTestResult({
          step: 'verify_no_return',
          success: true,
          data: {
            beforeUpdate,
            afterUpdate,
            hasChanged,
            timeChanged,
            updateRequested: newName,
            actualResult: afterUpdate.course_name
          }
        });

      } else {
        // 有返回資料
        const afterUpdate = updateResult[0];
        console.log('更新後狀態（從返回資料）:', afterUpdate);

        const hasChanged = beforeUpdate.course_name !== afterUpdate.course_name;
        const timeChanged = beforeUpdate.updated_at !== afterUpdate.updated_at;

        setTestResult({
          step: 'update_with_return',
          success: true,
          data: {
            beforeUpdate,
            afterUpdate,
            hasChanged,
            timeChanged,
            updateRequested: newName,
            actualResult: afterUpdate.course_name
          }
        });
      }

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

  const resetToOriginal = async () => {
    try {
      const { data: findData } = await supabase
        .from('hanami_course_codes')
        .select('*')
        .eq('course_code', 'MUSIC_FOCUS_001')
        .single();

      if (findData) {
        setOriginalName(findData.course_name);
        setNewName('音樂專注力班');
      }
    } catch (error) {
      console.error('重置失敗:', error);
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
            課程名稱更新調試
          </h1>

          <div className="bg-gradient-to-r from-[#FFE0E0] to-[#FFD1D1] p-4 rounded-lg border border-[#FFB3B3] mb-6">
            <h3 className="font-semibold text-[#4B4036] mb-2">🔍 問題分析</h3>
            <p className="text-[#87704e] text-sm mb-2">
              從您的日誌可以看出，更新操作成功但課程名稱沒有實際改變：
            </p>
            <ul className="text-[#87704e] text-sm space-y-1 ml-4">
              <li>• 更新前：音樂專注力初級班A</li>
              <li>• 更新後：音樂專注力初級班A（沒有變化）</li>
              <li>• 但 updated_at 時間戳確實更新了</li>
            </ul>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">原始課程名稱</label>
              <input
                type="text"
                value={originalName}
                onChange={(e) => setOriginalName(e.target.value)}
                className="w-full border-2 border-[#E4D5BC] bg-gradient-to-r from-[#FFFCF5] to-[#FFF9F2] rounded-xl px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">新課程名稱</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full border-2 border-[#E4D5BC] bg-gradient-to-r from-[#FFFCF5] to-[#FFF9F2] rounded-xl px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all duration-300"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={testCourseNameUpdate}
                disabled={loading || !originalName || !newName}
                className="flex-1 bg-gradient-to-r from-[#A68A64] to-[#8f7350] hover:from-[#8f7350] hover:to-[#6b5a47] text-white py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
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
                    測試更新
                  </>
                )}
              </button>

              <button
                onClick={resetToOriginal}
                className="bg-gradient-to-r from-[#87CEEB] to-[#4682B4] hover:from-[#4682B4] hover:to-[#2F4F4F] text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                重置
              </button>
            </div>
          </div>
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
                  <strong>詳細資料:</strong>
                  <pre className="mt-2 p-2 bg-white rounded text-sm overflow-auto max-h-64">
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {testResult.success && testResult.data && (
              <div className="bg-gradient-to-r from-[#E8F5E8] to-[#D4F4D4] p-4 rounded-lg border border-[#90EE90]">
                <h4 className="font-semibold text-[#4B4036] mb-2">📊 更新分析</h4>
                <div className="space-y-2 text-[#87704e]">
                  <p><strong>請求更新的名稱:</strong> {testResult.data.updateRequested}</p>
                  <p><strong>實際結果名稱:</strong> {testResult.data.actualResult}</p>
                  <p><strong>名稱是否改變:</strong> {testResult.data.hasChanged ? '✅ 是' : '❌ 否'}</p>
                  <p><strong>時間戳是否改變:</strong> {testResult.data.timeChanged ? '✅ 是' : '❌ 否'}</p>
                </div>
                
                {!testResult.data.hasChanged && (
                  <div className="mt-3 p-3 bg-yellow-100 border border-yellow-400 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ 課程名稱沒有改變！這可能是因為：
                    </p>
                    <ul className="text-yellow-800 text-sm mt-1 ml-4">
                      <li>• 資料庫觸發器阻止了更新</li>
                      <li>• RLS 政策限制了特定欄位的更新</li>
                      <li>• 資料庫約束條件阻止了變更</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-6">
          <h3 className="text-xl font-bold text-[#4B4036] mb-4">可能的解決方案</h3>
          <div className="space-y-3 text-[#87704e]">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#A68A64] text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <p>檢查資料庫是否有觸發器阻止課程名稱更新</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#A68A64] text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <p>檢查 RLS 政策是否允許更新 course_name 欄位</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#A68A64] text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <p>檢查資料庫約束條件和外鍵約束</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#A68A64] text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
              <p>嘗試更新其他欄位（如 course_description）來測試</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

