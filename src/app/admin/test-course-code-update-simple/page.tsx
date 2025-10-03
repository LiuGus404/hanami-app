'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestCourseCodeUpdateSimplePage() {
  const [courseCodeId, setCourseCodeId] = useState('');
  const [newName, setNewName] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testUpdate = async () => {
    if (!courseCodeId || !newName) {
      alert('請輸入課程代碼 ID 和新名稱');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log('開始測試更新，ID:', courseCodeId, '新名稱:', newName);

      // 1. 先檢查記錄是否存在
      console.log('步驟 1: 檢查記錄是否存在');
      const { data: checkData, error: checkError } = await supabase
        .from('hanami_course_codes')
        .select('id, course_code, course_name')
        .eq('id', courseCodeId)
        .single();

      console.log('檢查結果:', { checkData, checkError });

      if (checkError) {
        setResult({ step: 'check', error: checkError.message, data: null });
        return;
      }

      if (!checkData) {
        setResult({ step: 'check', error: '記錄不存在', data: null });
        return;
      }

      // 2. 嘗試更新（不帶 select）
      console.log('步驟 2: 嘗試更新（不帶 select）');
      const { error: updateError } = await supabase
        .from('hanami_course_codes')
        .update({
          course_name: newName,
          updated_at: new Date().toISOString()
        })
        .eq('id', courseCodeId);

      console.log('更新結果:', { updateError });

      if (updateError) {
        setResult({ 
          step: 'update', 
          error: updateError.message, 
          data: { originalName: checkData.course_name, newName }
        });
        return;
      }

      // 3. 驗證更新是否成功
      console.log('步驟 3: 驗證更新是否成功');
      const { data: verifyData, error: verifyError } = await supabase
        .from('hanami_course_codes')
        .select('id, course_code, course_name, updated_at')
        .eq('id', courseCodeId)
        .single();

      console.log('驗證結果:', { verifyData, verifyError });

      if (verifyError) {
        setResult({ 
          step: 'verify', 
          error: verifyError.message, 
          data: { originalName: checkData.course_name, newName }
        });
        return;
      }

      setResult({ 
        step: 'success', 
        error: null, 
        data: { 
          originalName: checkData.course_name, 
          newName: verifyData.course_name,
          updatedAt: verifyData.updated_at
        }
      });

    } catch (error) {
      console.error('測試過程中發生錯誤:', error);
      setResult({ 
        step: 'exception', 
        error: error instanceof Error ? error.message : '未知錯誤', 
        data: null 
      });
    } finally {
      setLoading(false);
    }
  };

  const getRandomCourseCode = async () => {
    try {
      const { data, error } = await supabase
        .from('hanami_course_codes')
        .select('id, course_code, course_name')
        .limit(5);

      if (error) {
        alert('獲取課程代碼失敗：' + error.message);
        return;
      }

      if (data && data.length > 0) {
        const random = data[Math.floor(Math.random() * data.length)];
        setCourseCodeId(random.id);
        setNewName(random.course_name + ' (測試更新)');
      } else {
        alert('沒有找到課程代碼');
      }
    } catch (error) {
      alert('獲取課程代碼時發生錯誤');
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
            課程代碼更新測試（簡化版）
          </h1>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">課程代碼 ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={courseCodeId}
                  onChange={(e) => setCourseCodeId(e.target.value)}
                  placeholder="輸入課程代碼的 UUID"
                  className="flex-1 border-2 border-[#E4D5BC] bg-gradient-to-r from-[#FFFCF5] to-[#FFF9F2] rounded-xl px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all duration-300"
                />
                <button
                  onClick={getRandomCourseCode}
                  className="bg-gradient-to-r from-[#87CEEB] to-[#4682B4] hover:from-[#4682B4] hover:to-[#2F4F4F] text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                >
                  隨機選擇
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">新課程名稱</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="輸入新的課程名稱"
                className="w-full border-2 border-[#E4D5BC] bg-gradient-to-r from-[#FFFCF5] to-[#FFF9F2] rounded-xl px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all duration-300"
              />
            </div>

            <button
              onClick={testUpdate}
              disabled={loading || !courseCodeId || !newName}
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
                  測試更新
                </>
              )}
            </button>
          </div>

          {result && (
            <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-6">
              <h3 className="text-xl font-bold text-[#4B4036] mb-4">測試結果</h3>
              
              <div className={`p-4 rounded-lg mb-4 ${
                result.step === 'success' 
                  ? 'bg-green-100 border border-green-400 text-green-700'
                  : result.error 
                    ? 'bg-red-100 border border-red-400 text-red-700'
                    : 'bg-blue-100 border border-blue-400 text-blue-700'
              }`}>
                <div className="font-semibold mb-2">
                  步驟: {result.step}
                </div>
                {result.error && (
                  <div className="mb-2">
                    <strong>錯誤:</strong> {result.error}
                  </div>
                )}
                {result.data && (
                  <div>
                    <strong>資料:</strong>
                    <pre className="mt-2 p-2 bg-white rounded text-sm overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {result.step === 'success' && (
                <div className="bg-gradient-to-r from-[#E8F5E8] to-[#D4F4D4] p-4 rounded-lg border border-[#90EE90]">
                  <h4 className="font-semibold text-[#4B4036] mb-2">✅ 更新成功！</h4>
                  <p className="text-[#87704e]">
                    課程名稱已從 "{result.data.originalName}" 更新為 "{result.data.newName}"
                  </p>
                  <p className="text-sm text-[#87704e] mt-1">
                    更新時間: {new Date(result.data.updatedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-6">
            <h3 className="text-xl font-bold text-[#4B4036] mb-4">使用說明</h3>
            <div className="space-y-2 text-[#87704e]">
              <p>1. 點擊「隨機選擇」按鈕自動填入一個現有的課程代碼 ID</p>
              <p>2. 輸入新的課程名稱</p>
              <p>3. 點擊「測試更新」按鈕執行更新測試</p>
              <p>4. 查看測試結果和詳細信息</p>
              <p>5. 如果成功，表示更新功能正常；如果失敗，請查看錯誤信息</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



