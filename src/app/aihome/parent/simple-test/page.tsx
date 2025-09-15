'use client';

import { useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

export default function SimpleTestPage() {
  const [studentId, setStudentId] = useState('0031c7ab-8e92-499d-9287-7873af1df812');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testQuery = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('開始查詢學生 ID:', studentId);
      
      // 查詢學生
      const supabase = getSupabaseClient();
      const { data: student, error } = await supabase
        .from('Hanami_Students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (error) {
        console.error('查詢錯誤:', error);
        setError(`查詢錯誤: ${error.message}`);
        return;
      }

      console.log('查詢結果:', student);
      setResult(student);
    } catch (err) {
      console.error('測試錯誤:', err);
      setError(`測試錯誤: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const testAllStudents = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('開始查詢所有學生');
      
      // 查詢所有學生
      const supabase = getSupabaseClient();
      const { data: students, error } = await supabase
        .from('Hanami_Students')
        .select('id, full_name, student_oid')
        .limit(5);

      if (error) {
        console.error('查詢錯誤:', error);
        setError(`查詢錯誤: ${error.message}`);
        return;
      }

      console.log('查詢結果:', students);
      setResult(students);
    } catch (err) {
      console.error('測試錯誤:', err);
      setError(`測試錯誤: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#4B4036] mb-8">簡單資料庫測試</h1>
        
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">測試單個學生查詢</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">
                學生 ID
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-4 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                placeholder="輸入學生 ID"
              />
            </div>
            
            <button
              onClick={testQuery}
              disabled={loading}
              className="px-6 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors disabled:opacity-50"
            >
              {loading ? '查詢中...' : '查詢學生'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">測試所有學生查詢</h2>
          
          <button
            onClick={testAllStudents}
            disabled={loading}
            className="px-6 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors disabled:opacity-50"
          >
            {loading ? '查詢中...' : '查詢所有學生'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-800 mb-2">錯誤</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">查詢結果</h3>
            <pre className="text-green-700 text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-[#4B4036] mb-2">測試說明：</h3>
          <ul className="text-sm text-[#2B3A3B] space-y-1">
            <li>• 使用預設的學生 ID 進行測試</li>
            <li>• 查看控制台獲取詳細的調試信息</li>
            <li>• 如果查詢成功，結果會顯示在下方</li>
            <li>• 如果查詢失敗，錯誤信息會顯示在錯誤區域</li>
          </ul>
        </div>
      </div>
    </div>
  );
}










