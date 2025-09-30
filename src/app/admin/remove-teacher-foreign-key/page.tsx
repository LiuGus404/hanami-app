'use client';

import { useState } from 'react';
import { getServerSupabaseClient } from '@/lib/supabase';

export default function RemoveTeacherForeignKeyPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const executeSQL = async () => {
    setLoading(true);
    setResult('');

    try {
      const supabase = getServerSupabaseClient();

      // 執行 SQL 腳本
      const sqlScript = `
        -- 移除 hanami_course_codes 表的 teacher_id 外鍵約束
        ALTER TABLE hanami_course_codes 
        DROP CONSTRAINT IF EXISTS hanami_course_codes_teacher_id_fkey;

        -- 添加註釋說明 teacher_id 的新用途
        COMMENT ON COLUMN hanami_course_codes.teacher_id IS '教師或管理員ID，可以是 hanami_employee.id 或 hanami_admin.id';

        -- 創建一個函數來獲取教師/管理員名稱
        CREATE OR REPLACE FUNCTION get_teacher_or_admin_name(teacher_id UUID)
        RETURNS TEXT AS $$
        DECLARE
          teacher_name TEXT;
          admin_name TEXT;
        BEGIN
          -- 嘗試從 hanami_employee 表獲取
          SELECT COALESCE(teacher_nickname, teacher_fullname) INTO teacher_name
          FROM hanami_employee 
          WHERE id = teacher_id;
          
          IF teacher_name IS NOT NULL THEN
            RETURN teacher_name;
          END IF;
          
          -- 嘗試從 hanami_admin 表獲取
          SELECT admin_name INTO admin_name
          FROM hanami_admin 
          WHERE id = teacher_id;
          
          IF admin_name IS NOT NULL THEN
            RETURN admin_name;
          END IF;
          
          -- 如果都沒找到，返回未知
          RETURN '未知教師';
        END;
        $$ LANGUAGE plpgsql;

        -- 創建一個視圖來顯示課程代碼及其教師信息
        CREATE OR REPLACE VIEW hanami_course_codes_with_teacher AS
        SELECT 
          c.*,
          get_teacher_or_admin_name(c.teacher_id) as teacher_display_name,
          CASE 
            WHEN EXISTS(SELECT 1 FROM hanami_employee WHERE id = c.teacher_id) THEN 'teacher'
            WHEN EXISTS(SELECT 1 FROM hanami_admin WHERE id = c.teacher_id) THEN 'admin'
            ELSE 'unknown'
          END as teacher_type
        FROM hanami_course_codes c;
      `;

      // 分割 SQL 腳本為多個語句
      const statements = sqlScript
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      let successCount = 0;
      let errorCount = 0;
      const results: string[] = [];

      for (const statement of statements) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement } as any);
          if (error) {
            console.error('SQL 執行錯誤:', error);
            results.push(`❌ 錯誤: ${error.message}`);
            errorCount++;
          } else {
            results.push(`✅ 成功執行 SQL 語句`);
            successCount++;
          }
        } catch (err) {
          console.error('SQL 執行異常:', err);
          results.push(`❌ 異常: ${err}`);
          errorCount++;
        }
      }

      setResult(`
        🎯 數據庫結構優化完成！
        
        ✅ 成功執行: ${successCount} 個語句
        ❌ 失敗: ${errorCount} 個語句
        
        📋 執行結果:
        ${results.join('\n')}
        
        🔧 主要變更:
        • 移除了 teacher_id 的外鍵約束
        • 創建了 get_teacher_or_admin_name() 函數
        • 創建了 hanami_course_codes_with_teacher 視圖
        
        🚀 現在可以直接記錄任何 ID 到 teacher_id 欄位！
      `);

    } catch (error) {
      console.error('執行 SQL 腳本時發生錯誤:', error);
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
            <div className="w-12 h-12 bg-gradient-to-r from-[#A68A64] to-[#8f7350] rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#4B4036] to-[#A68A64] bg-clip-text text-transparent">
                移除教師外鍵約束
              </h1>
              <p className="text-[#87704e] mt-2">允許直接記錄教師或管理員 ID</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#FFFCF5] to-[#FFF9F2] rounded-xl p-6 mb-6 border border-[#E4D5BC]">
            <h2 className="text-xl font-semibold text-[#4B4036] mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#A68A64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              修復說明
            </h2>
            <div className="space-y-3 text-[#4B4036]">
              <p>• <strong>問題</strong>：當前 teacher_id 外鍵約束只允許引用 hanami_employee 表</p>
              <p>• <strong>解決方案</strong>：移除外鍵約束，允許記錄任何 ID</p>
              <p>• <strong>功能</strong>：創建函數和視圖來正確顯示教師/管理員名稱</p>
              <p>• <strong>結果</strong>：課程代碼可以正常選擇和記錄教師或管理員</p>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={executeSQL}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-[#A68A64] to-[#8f7350] text-white py-3 px-6 rounded-xl hover:from-[#8f7350] hover:to-[#7a6348] transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '執行中...' : '執行數據庫優化'}
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
              <h3 className="text-lg font-semibold text-[#4B4036] mb-4">執行結果</h3>
              <pre className="whitespace-pre-wrap text-sm text-[#4B4036] bg-[#FFF9F2] p-4 rounded-lg border border-[#E4D5BC] overflow-auto max-h-96">
                {result}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
