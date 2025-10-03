'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugTrialStudentInsertPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkTableExists = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 檢查表是否存在
      const { data, error: checkError } = await supabase
        .from('hanami_trial_students')
        .select('*')
        .limit(1);

      if (checkError) {
        console.error('❌ 表檢查錯誤:', checkError);
        setError(`表檢查錯誤: ${checkError.message}`);
        return;
      }

      console.log('✅ 表存在，可以查詢');
      setResult({ message: '表存在，可以查詢', data });

    } catch (err) {
      console.error('❌ 檢查異常:', err);
      setError(`檢查異常: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const testSimpleInsert = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 生成 student_oid
      const generateStudentOid = () => {
        const chars = '0123456789ABCDEF';
        let result = '';
        for (let i = 0; i < 7; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      // 最簡單的測試資料
      const simpleData = {
        student_oid: generateStudentOid(),
        full_name: '測試學生',
        trial_status: 'pending',
        student_type: '試堂',
        access_role: 'trial_student'
      };

      console.log('🔍 準備插入的簡單資料:', simpleData);

      const { data, error: insertError } = await supabase
        .from('hanami_trial_students')
        .insert([simpleData])
        .select();

      if (insertError) {
        console.error('❌ 插入錯誤:', insertError);
        setError(`插入錯誤: ${insertError.message}`);
        return;
      }

      console.log('✅ 插入成功:', data);
      setResult({ message: '插入成功', data });

    } catch (err) {
      console.error('❌ 插入異常:', err);
      setError(`插入異常: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const testFullInsert = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 生成 student_oid
      const generateStudentOid = () => {
        const chars = '0123456789ABCDEF';
        let result = '';
        for (let i = 0; i < 7; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      // 完整的測試資料
      const fullData = {
        student_oid: generateStudentOid(),
        full_name: '完整測試學生',
        student_dob: '2020-01-01',
        lesson_date: null,
        lesson_duration: null,
        course_type: '鋼琴',
        contact_number: '12345678',
        parent_email: null,
        trial_status: 'pending',
        trial_remarks: '完整測試插入',
        student_age: 48,
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

      console.log('🔍 準備插入的完整資料:', fullData);

      const { data, error: insertError } = await supabase
        .from('hanami_trial_students')
        .insert([fullData])
        .select();

      if (insertError) {
        console.error('❌ 插入錯誤:', insertError);
        setError(`插入錯誤: ${insertError.message}`);
        return;
      }

      console.log('✅ 插入成功:', data);
      setResult({ message: '插入成功', data });

    } catch (err) {
      console.error('❌ 插入異常:', err);
      setError(`插入異常: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const queryLatest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: queryError } = await supabase
        .from('hanami_trial_students')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      if (queryError) {
        console.error('❌ 查詢錯誤:', queryError);
        setError(`查詢錯誤: ${queryError.message}`);
        return;
      }

      console.log('✅ 查詢成功:', data);
      setResult({ message: '查詢成功', data });

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
          診斷試堂學生插入功能
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={checkTableExists}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? '檢查中...' : '檢查表是否存在'}
            </button>
            
            <button
              onClick={testSimpleInsert}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? '測試中...' : '簡單插入測試'}
            </button>
            
            <button
              onClick={testFullInsert}
              disabled={loading}
              className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? '測試中...' : '完整插入測試'}
            </button>
            
            <button
              onClick={queryLatest}
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
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
              <strong>成功！</strong> {result.message}
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
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">診斷步驟</h2>
          <ol className="space-y-2 text-[#2B3A3B]">
            <li>1. <strong>檢查表是否存在</strong>：確認 hanami_trial_students 表可以正常訪問</li>
            <li>2. <strong>簡單插入測試</strong>：只插入必要欄位，測試基本功能</li>
            <li>3. <strong>完整插入測試</strong>：插入所有欄位，測試完整功能</li>
            <li>4. <strong>查詢最新資料</strong>：確認資料是否成功插入</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
