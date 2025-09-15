'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

export default function TestDatabasePage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      // 查詢所有學生（不包含 institution 欄位，因為可能不存在）
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('Hanami_Students')
        .select('id, full_name, student_oid, created_at')
        .limit(10);

      if (error) {
        console.error('查詢錯誤:', error);
        setError(`查詢錯誤: ${error.message}`);
        return;
      }

      console.log('查詢結果:', data);
      setStudents(data || []);
    } catch (err) {
      console.error('載入錯誤:', err);
      setError(`載入錯誤: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#4B4036] mb-8">資料庫測試頁面</h1>
        
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-[#4B4036]">學生資料</h2>
            <button
              onClick={loadStudents}
              className="px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors"
            >
              重新載入
            </button>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD59A] mx-auto mb-4"></div>
              <p className="text-[#2B3A3B]">載入中...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-4">
              {students.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[#2B3A3B]">沒有找到學生資料</p>
                  <p className="text-sm text-[#2B3A3B]/70 mt-2">
                    請檢查資料庫連接或添加測試數據
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#FFD59A]/20">
                        <th className="border border-[#EADBC8] px-4 py-2 text-left text-[#4B4036]">ID</th>
                        <th className="border border-[#EADBC8] px-4 py-2 text-left text-[#4B4036]">姓名</th>
                        <th className="border border-[#EADBC8] px-4 py-2 text-left text-[#4B4036]">學生編號</th>
                        <th className="border border-[#EADBC8] px-4 py-2 text-left text-[#4B4036]">創建時間</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-[#FFD59A]/10">
                          <td className="border border-[#EADBC8] px-4 py-2 text-sm text-[#2B3A3B]">
                            {student.id}
                          </td>
                          <td className="border border-[#EADBC8] px-4 py-2 text-sm text-[#2B3A3B]">
                            {student.full_name || '未設定'}
                          </td>
                          <td className="border border-[#EADBC8] px-4 py-2 text-sm text-[#2B3A3B]">
                            {student.student_oid || '未設定'}
                          </td>
                          <td className="border border-[#EADBC8] px-4 py-2 text-sm text-[#2B3A3B]">
                            {student.created_at ? new Date(student.created_at).toLocaleString('zh-TW') : '未設定'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-[#4B4036] mb-2">測試說明：</h3>
            <ul className="text-sm text-[#2B3A3B] space-y-1">
              <li>• 此頁面用於測試資料庫連接和查看學生資料</li>
              <li>• 如果沒有學生資料，請先添加測試數據</li>
              <li>• 確保學生資料中有正確的 institution 欄位</li>
              <li>• 使用學生 ID 進行 QR 碼掃描測試</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
