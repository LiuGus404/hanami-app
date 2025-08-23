'use client';

import { useState, useEffect } from 'react';
import { HanamiButton } from '@/components/ui';
import StudentActivitiesPanel from '@/components/ui/StudentActivitiesPanel';

interface TestStudent {
  id: string;
  name: string;
}

interface TestResult {
  success: boolean;
  data?: any;
  error?: string;
  details?: string;
}

const testStudents: TestStudent[] = [
  { id: 'test-student-1', name: '測試學生 1' },
  { id: 'test-student-2', name: '測試學生 2' },
  { id: 'test-student-3', name: '測試學生 3' },
];

export default function TestStudentActivitiesPage() {
  const [studentId, setStudentId] = useState<string>('');
  const [lessonDate, setLessonDate] = useState<string>('');
  const [timeslot, setTimeslot] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [showPanel, setShowPanel] = useState<boolean>(false);

  // 設置默認值
  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    setLessonDate(formattedDate);
    setTimeslot('10:00:00');
  }, []);

  const testAPI = async () => {
    if (!studentId) {
      setResult({
        success: false,
        error: '請選擇學生',
        details: '學生 ID 不能為空'
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/student-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          lessonDate,
          timeslot
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          data
        });
      } else {
        setResult({
          success: false,
          error: data.error || 'API 請求失敗',
          details: data.details || '未知錯誤'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        error: '網路錯誤',
        details: error instanceof Error ? error.message : '未知錯誤'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFFDF8] p-6">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-[#4B4036]">
          測試學生活動 API
        </h1>

        <div className="bg-[#FFFDF8] border border-[#EADBC8] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">
            測試參數
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1 text-[#4B4036]">學生 ID</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full p-2 border border-[#EADBC8] rounded bg-[#FFFDF8] text-[#4B4036]"
                placeholder="輸入學生 ID"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-[#4B4036]">課程日期</label>
              <input
                type="date"
                value={lessonDate}
                onChange={(e) => setLessonDate(e.target.value)}
                className="w-full p-2 border border-[#EADBC8] rounded bg-[#FFFDF8] text-[#4B4036]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-[#4B4036]">時段</label>
              <input
                type="text"
                value={timeslot}
                onChange={(e) => setTimeslot(e.target.value)}
                className="w-full p-2 border border-[#EADBC8] rounded bg-[#FFFDF8] text-[#4B4036]"
                placeholder="例如: 10:00:00"
              />
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <HanamiButton
              onClick={testAPI}
              disabled={loading || !studentId}
              className="bg-[#EBC9A4] hover:bg-[#DDBA90] text-[#4B4036]"
            >
              {loading ? '測試中...' : '測試 API'}
            </HanamiButton>
            
            <HanamiButton
              onClick={() => setShowPanel(!showPanel)}
              className="bg-[#FFD59A] hover:bg-[#F0C78A] text-[#4B4036]"
            >
              {showPanel ? '隱藏' : '顯示'} 活動面板
            </HanamiButton>
          </div>

          {result && (
            <div className="bg-[#FFFDF8] border border-[#EADBC8] rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-[#4B4036]">
                測試結果
              </h3>
              
              <div className="space-y-4">
                <div>
                  <strong>狀態:</strong> {result.success ? '✅ 成功' : '❌ 失敗'}
                </div>
                
                {result.success && result.data && (
                  <div>
                    <strong>API 回應:</strong>
                    <pre className="mt-2 bg-[#F3F0E5] p-4 rounded-lg text-sm overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
                
                {!result.success && (
                  <div className="text-red-600">
                    <strong>錯誤:</strong> {result.error}
                    {result.details && (
                      <div className="text-sm mt-1">
                        <strong>詳細:</strong> {result.details}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#FFFDF8] border border-[#EADBC8] rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-[#4B4036]">測試學生列表</h3>
          <div className="space-y-2">
            {testStudents.map(student => (
              <div key={student.id} className="p-3 border border-[#EADBC8] rounded bg-[#FFF9F2]">
                <div className="font-medium text-[#4B4036]">{student.name}</div>
                <div className="text-sm text-[#2B3A3B]">{student.id}</div>
              </div>
            ))}
          </div>
        </div>

        {showPanel && (
          <div className="bg-[#FFFDF8] border border-[#EADBC8] rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-[#4B4036]">學生活動面板</h2>
            <StudentActivitiesPanel
              studentId={studentId}
              lessonDate={lessonDate}
              timeslot={timeslot}
            />
          </div>
        )}
      </div>
    </div>
  );
} 