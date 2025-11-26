'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

export default function AddLessonIdToMediaPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const executeMigration = async () => {
    setLoading(true);
    setResult('');

    try {
      // 檢查欄位是否已存在
      const { data: columns, error: columnError } = await supabase
        .rpc('get_table_columns', { table_name: 'hanami_student_media' } as any);

      if (columnError) {
        console.log('無法檢查欄位，嘗試直接執行遷移...');
      } else {
        const hasLessonId = (columns as any[])?.some((col: any) => col.column_name === 'lesson_id');
        if (hasLessonId) {
          setResult('✅ lesson_id 欄位已存在，無需執行遷移');
          setLoading(false);
          return;
        }
      }

      // 執行 SQL 遷移
      const migrationSQL = `
        -- 添加 lesson_id 欄位
        ALTER TABLE hanami_student_media 
        ADD COLUMN IF NOT EXISTS lesson_id UUID REFERENCES hanami_student_lesson(id) ON DELETE SET NULL;

        -- 添加索引以提升查詢效能
        CREATE INDEX IF NOT EXISTS idx_student_media_lesson_id ON hanami_student_media(lesson_id);
      `;

      const { error: migrationError } = await supabase.rpc('exec_sql', {
        sql: migrationSQL
      } as any);

      if (migrationError) {
        // 如果 rpc 不存在，嘗試使用 SQL 編輯器
        console.log('RPC 方法不存在，請手動執行以下 SQL:');
        console.log(migrationSQL);
        setResult(`❌ 無法自動執行遷移。請手動在 Supabase SQL 編輯器中執行以下 SQL：

${migrationSQL}

或者聯繫管理員執行此遷移。`);
      } else {
        setResult('✅ 資料庫遷移執行成功！lesson_id 欄位已添加到 hanami_student_media 表。');
        toast.success('資料庫遷移完成！');
      }

    } catch (error) {
      console.error('遷移失敗:', error);
      setResult(`❌ 遷移失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      toast.error('遷移失敗');
    } finally {
      setLoading(false);
    }
  };

  const checkTableStructure = async () => {
    setLoading(true);
    setResult('');

    try {
      // 檢查表結構
      const { data, error } = await supabase
        .from('hanami_student_media')
        .select('*')
        .limit(1);

      if (error) {
        setResult(`❌ 無法查詢表結構: ${error.message}`);
      } else {
        setResult('✅ 表結構檢查完成，hanami_student_media 表存在且可訪問。');
      }
    } catch (error) {
      setResult(`❌ 檢查失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          添加 lesson_id 欄位到 hanami_student_media 表
        </h1>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">問題說明</h3>
            <p className="text-blue-700">
              媒體庫中的「設定課程關聯」功能失敗，因為 hanami_student_media 表缺少 lesson_id 欄位。
              此遷移將添加該欄位以支援媒體檔案與課程記錄的關聯。
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={checkTableStructure}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '檢查中...' : '檢查表結構'}
            </button>

            <button
              onClick={executeMigration}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? '執行中...' : '執行遷移'}
            </button>
          </div>

          {result && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">執行結果:</h3>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">{result}</pre>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">手動執行步驟</h3>
            <p className="text-yellow-700 mb-2">
              如果自動遷移失敗，請在 Supabase SQL 編輯器中手動執行以下 SQL：
            </p>
            <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`-- 添加 lesson_id 欄位
ALTER TABLE hanami_student_media 
ADD COLUMN IF NOT EXISTS lesson_id UUID REFERENCES hanami_student_lesson(id) ON DELETE SET NULL;

-- 添加索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_student_media_lesson_id ON hanami_student_media(lesson_id);`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
