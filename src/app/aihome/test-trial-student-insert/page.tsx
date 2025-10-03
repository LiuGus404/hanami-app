'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestTrialStudentInsertPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testInsert = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 生成 student_oid (B840FAF 格式)
      const generateStudentOid = () => {
        const chars = '0123456789ABCDEF';
        let result = '';
        for (let i = 0; i < 7; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      // 測試資料
      const testData = {
        student_oid: generateStudentOid(),
        full_name: '測試學生',
        student_dob: '2020-01-01',
        lesson_date: null,
        lesson_duration: null,
        course_type: '鋼琴',
        contact_number: '12345678',
        parent_email: null,
        trial_status: 'pending',
        trial_remarks: '測試插入',
        student_age: 48, // 4歲，以月為單位
        health_notes: null,
        student_preference: null,
        weekday: 'Monday',
        address: null,
        school: null,
        student_email: null,
        student_password: null,
        gender: null,
        student_type: '試堂',
        student_teacher: null,
        regular_weekday: 'Monday',
        regular_timeslot: '10:00',
        access_role: 'trial_student',
        duration_months: null,
        nick_name: null,
        remaining_lessons: 1,
        ongoing_lessons: 0,
        upcoming_lessons: 1,
        actual_timeslot: null
      };

      console.log('🔍 準備插入的測試資料:', testData);

      const { data, error: insertError } = await supabase
        .from('hanami_trial_students')
        .insert([testData])
        .select();

      if (insertError) {
        console.error('❌ 插入錯誤:', insertError);
        setError(`插入錯誤: ${insertError.message}`);
        return;
      }

      console.log('✅ 插入成功:', data);
      setResult(data);

      // 驗證插入的資料
      const { data: verifyData, error: verifyError } = await supabase
        .from('hanami_trial_students')
        .select('*')
        .eq('student_oid', testData.student_oid)
        .single();

      if (verifyError) {
        console.error('❌ 驗證錯誤:', verifyError);
        setError(`驗證錯誤: ${verifyError.message}`);
        return;
      }

      console.log('✅ 驗證成功:', verifyData);
      setResult(verifyData);

    } catch (err) {
      console.error('❌ 測試異常:', err);
      setError(`測試異常: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const testQuery = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: queryError } = await supabase
        .from('hanami_trial_students')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (queryError) {
        console.error('❌ 查詢錯誤:', queryError);
        setError(`查詢錯誤: ${queryError.message}`);
        return;
      }

      console.log('✅ 查詢成功:', data);
      setResult(data);

    } catch (err) {
      console.error('❌ 查詢異常:', err);
      setError(`查詢異常: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#4B4036] mb-8 text-center">
          測試試堂學生插入功能
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={testInsert}
              disabled={loading}
              className="bg-[#FFD59A] hover:bg-[#EBC9A4] text-[#4B4036] font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? '測試中...' : '測試插入功能'}
            </button>
            
            <button
              onClick={testQuery}
              disabled={loading}
              className="bg-[#FFB6C1] hover:bg-[#EBC9A4] text-[#4B4036] font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? '查詢中...' : '查詢最新資料'}
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>錯誤：</strong> {error}
            </div>
          )}

          {result && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              <strong>成功！</strong> 操作完成
            </div>
          )}

          {result && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-[#4B4036] mb-4">結果：</h3>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">功能說明</h2>
          <ul className="space-y-2 text-[#2B3A3B]">
            <li>• <strong>測試插入功能</strong>：模擬課程報名成功後的資料插入</li>
            <li>• <strong>查詢最新資料</strong>：查看 hanami_trial_students 表中的最新資料</li>
            <li>• <strong>student_oid</strong>：自動生成 7 位十六進制代碼（如 B840FAF）</li>
            <li>• <strong>資料映射</strong>：只填入有的資料，沒有的欄位填 null</li>
            <li>• <strong>試堂狀態</strong>：預設為 'pending'，remaining_lessons 設為 1</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
