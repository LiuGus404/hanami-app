'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';

export default function StudentSelectorPage() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('Hanami_Students')
        .select('id, full_name, student_oid, created_at')
        .limit(20);

      if (error) {
        console.error('查詢錯誤:', error);
        setError(`查詢錯誤: ${error.message}`);
        return;
      }

      setStudents(data || []);
    } catch (err) {
      console.error('載入錯誤:', err);
      setError(`載入錯誤: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = (student: any) => {
    setSelectedStudent(student);
  };

  const generateQRCode = () => {
    if (!selectedStudent) return;
    
    const qrData = {
      studentId: selectedStudent.id,
      institution: 'Hanami Music',
      timestamp: new Date().toISOString()
    };
    
    // 跳轉到 QR 生成頁面
    router.push(`/aihome/parent/qr-generator?data=${encodeURIComponent(JSON.stringify(qrData))}`);
  };

  const testConnection = () => {
    if (!selectedStudent) return;
    
    // 跳轉到連接頁面並自動填入學生 ID
    router.push(`/aihome/parent/connect?studentId=${selectedStudent.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-[#4B4036] mb-8">學生選擇器</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 學生列表 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-[#4B4036]">學生列表</h2>
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
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {students.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => handleStudentSelect(student)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedStudent?.id === student.id
                        ? 'border-[#FFD59A] bg-[#FFD59A]/10'
                        : 'border-gray-200 hover:border-[#FFD59A]/50 hover:bg-[#FFD59A]/5'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-[#4B4036]">{student.full_name}</h3>
                        <p className="text-sm text-[#2B3A3B]">編號: {student.student_oid}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(student.created_at).toLocaleDateString('zh-TW')}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400 font-mono">
                        {student.id.substring(0, 8)}...
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 選中的學生信息 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-[#4B4036] mb-6">選中的學生</h2>
            
            {selectedStudent ? (
              <div className="space-y-6">
                <div className="p-4 bg-[#FFD59A]/10 rounded-lg">
                  <h3 className="font-semibold text-[#4B4036] mb-2">基本信息</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">姓名:</span> {selectedStudent.full_name}</div>
                    <div><span className="font-medium">編號:</span> {selectedStudent.student_oid}</div>
                    <div><span className="font-medium">ID:</span> 
                      <span className="font-mono text-xs ml-2">{selectedStudent.id}</span>
                    </div>
                    <div><span className="font-medium">創建時間:</span> 
                      {new Date(selectedStudent.created_at).toLocaleString('zh-TW')}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={generateQRCode}
                    className="w-full px-4 py-3 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors font-medium"
                  >
                    生成 QR 碼
                  </button>
                  
                  <button
                    onClick={testConnection}
                    className="w-full px-4 py-3 bg-[#EBC9A4] text-[#4B4036] rounded-lg hover:bg-[#FFD59A] transition-colors font-medium"
                  >
                    測試連接
                  </button>
                  
                  <button
                    onClick={() => router.push(`/aihome/parent/student/${selectedStudent.id}?institution=Hanami Music`)}
                    className="w-full px-4 py-3 bg-[#FFB6C1] text-[#4B4036] rounded-lg hover:bg-[#FFB6C1]/80 transition-colors font-medium"
                  >
                    查看學生詳情
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-[#2B3A3B]">請選擇一個學生</p>
                <p className="text-sm text-[#2B3A3B]/70 mt-2">點擊左側列表中的學生</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-[#4B4036] mb-2">使用說明：</h3>
          <ul className="text-sm text-[#2B3A3B] space-y-1">
            <li>• <strong>生成 QR 碼</strong>：為選中的學生生成 QR 碼，用於掃描測試</li>
            <li>• <strong>測試連接</strong>：直接跳轉到連接頁面，自動填入學生 ID</li>
            <li>• <strong>查看學生詳情</strong>：跳轉到學生詳情頁面</li>
            <li>• 使用這些功能來測試家長連接系統</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
