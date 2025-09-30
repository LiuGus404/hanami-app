'use client';

import { useState } from 'react';
import { getServerSupabaseClient } from '@/lib/supabase';

export default function FixTeacherForeignKeyPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const fixForeignKey = async () => {
    setLoading(true);
    setResult('');

    try {
      const supabase = getServerSupabaseClient();

      // 方法1：嘗試使用 Supabase 的 SQL 查詢功能
      try {
        // 先檢查外鍵約束是否存在
        const { data: constraintData, error: constraintError } = await supabase
          .rpc('get_table_constraints', { table_name: 'hanami_course_codes' } as any);
        
        if (!constraintError && constraintData) {
          console.log('找到約束:', constraintData);
          setResult(prev => prev + `找到約束: ${JSON.stringify(constraintData)}\n`);
        }
      } catch (error) {
        console.log('檢查約束時發生錯誤:', error);
      }

      // 方法2：直接嘗試更新一個記錄來測試
      try {
        // 先獲取一個現有的課程代碼記錄
        const { data: existingData, error: fetchError } = await supabase
          .from('hanami_course_codes')
          .select('id, teacher_id')
          .limit(1)
          .single();

        if (existingData && !fetchError) {
          console.log('找到現有記錄:', existingData);
          setResult(prev => prev + `找到現有記錄: ${JSON.stringify(existingData)}\n`);

          // 嘗試更新這個記錄的 teacher_id 為 null
          const { error: updateError } = await (supabase
            .from('hanami_course_codes') as any)
            .update({ teacher_id: null })
            .eq('id', (existingData as any).id);

          if (updateError) {
            setResult(prev => prev + `更新失敗: ${updateError.message}\n`);
            console.error('更新失敗:', updateError);
          } else {
            setResult(prev => prev + `✅ 成功更新記錄，teacher_id 設為 null\n`);
          }
        }
      } catch (error) {
        setResult(prev => prev + `測試更新時發生錯誤: ${error}\n`);
      }

      setResult(`
🎯 外鍵約束修復嘗試完成！

📋 執行結果:
${result}

🔧 建議解決方案:
1. 如果更新失敗，說明外鍵約束仍然存在
2. 需要在 Supabase Dashboard 中手動執行 SQL:
   ALTER TABLE hanami_course_codes DROP CONSTRAINT hanami_course_codes_teacher_id_fkey;

3. 或者使用服務角色 key 來執行 DDL 操作

🚀 執行完成後，課程代碼就可以正常選擇管理員了！
      `);

    } catch (error) {
      console.error('修復外鍵約束時發生錯誤:', error);
      setResult(`❌ 執行失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFFDF8] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8 border border-[#EADBC8]">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                修復教師外鍵約束錯誤
              </h1>
              <p className="text-[#87704e] mt-2">解決課程代碼更新時的外鍵約束問題</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 mb-6 border border-red-200">
            <h2 className="text-xl font-semibold text-red-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              錯誤信息
            </h2>
            <div className="space-y-3 text-red-700">
              <p><strong>錯誤</strong>：insert or update on table "hanami_course_codes" violates foreign key constraint "hanami_course_codes_teacher_id_fkey"</p>
              <p><strong>原因</strong>：teacher_id 外鍵約束只允許引用 hanami_employee 表，但選擇器包含 hanami_admin 數據</p>
              <p><strong>解決</strong>：移除外鍵約束，允許記錄任何 ID</p>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={fixForeignKey}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-6 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '修復中...' : '修復外鍵約束'}
            </button>
            <button
              onClick={() => window.location.href = '/admin/schedule-management'}
              className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-xl transition-colors"
            >
              返回管理頁面
            </button>
          </div>

          {result && (
            <div className="bg-white border border-[#EADBC8] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[#4B4036] mb-4">修復結果</h3>
              <pre className="whitespace-pre-wrap text-sm text-[#4B4036] bg-[#FFF9F2] p-4 rounded-lg border border-[#E4D5BC] overflow-auto max-h-96">
                {result}
              </pre>
            </div>
          )}

          <div className="mt-6 bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">手動修復步驟</h3>
            <div className="space-y-3 text-blue-700">
              <p>如果自動修復失敗，請在 Supabase Dashboard 中執行以下 SQL：</p>
              <div className="bg-gray-800 text-green-400 p-4 rounded-lg font-mono text-sm">
                ALTER TABLE hanami_course_codes DROP CONSTRAINT hanami_course_codes_teacher_id_fkey;
              </div>
              <p>執行完成後，課程代碼就可以正常選擇管理員了！</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
