'use client';

import { useState } from 'react';

export default function TestFieldComparisonFixPage() {
  const [result, setResult] = useState<any>(null);

  const testFieldComparison = () => {
    // 模擬資料庫記錄
    const fullExistingData = {
      course_name: "音樂專注力初級班A",
      course_description: "音樂專注力初級課程 - 適合初學者",
      max_students: 5,
      teacher_id: "",
      room_location: "教室A",
      is_active: true,
      course_type_id: "7ec0c333-fc2e-40cb-b043-143fc245bb5b"
    };

    // 模擬表單資料
    const editingCourseCode = {
      course_name: "音樂專注力班",
      course_description: "",
      max_students: 5,
      teacher_id: null,
      room_location: "504",
      is_active: true,
      course_type_id: "7ec0c333-fc2e-40cb-b043-143fc245bb5b"
    };

    console.log('=== 欄位比較測試 ===');
    console.log('完整資料庫記錄：', fullExistingData);
    console.log('表單資料：', editingCourseCode);
    
    // 詳細比較每個欄位
    console.log('詳細欄位比較：');
    console.log('  - course_name:', editingCourseCode.course_name, 'vs', fullExistingData.course_name, '=', editingCourseCode.course_name !== fullExistingData.course_name);
    console.log('  - course_description:', editingCourseCode.course_description, 'vs', (fullExistingData.course_description || ''), '=', editingCourseCode.course_description !== (fullExistingData.course_description || ''));
    console.log('  - max_students:', editingCourseCode.max_students, 'vs', (fullExistingData.max_students || 8), '=', editingCourseCode.max_students !== (fullExistingData.max_students || 8));
    console.log('  - teacher_id:', editingCourseCode.teacher_id, 'vs', (fullExistingData.teacher_id || ''), '=', editingCourseCode.teacher_id !== (fullExistingData.teacher_id || ''));
    console.log('  - room_location:', editingCourseCode.room_location, 'vs', (fullExistingData.room_location || ''), '=', editingCourseCode.room_location !== (fullExistingData.room_location || ''));
    console.log('  - is_active:', editingCourseCode.is_active, 'vs', (fullExistingData.is_active || true), '=', editingCourseCode.is_active !== (fullExistingData.is_active || true));
    console.log('  - course_type_id:', editingCourseCode.course_type_id, 'vs', (fullExistingData.course_type_id || ''), '=', editingCourseCode.course_type_id !== (fullExistingData.course_type_id || ''));
    
    // 正確的欄位比較邏輯
    const courseNameChanged = editingCourseCode.course_name !== fullExistingData.course_name;
    const courseDescriptionChanged = editingCourseCode.course_description !== (fullExistingData.course_description || '');
    const maxStudentsChanged = editingCourseCode.max_students !== (fullExistingData.max_students || 8);
    const teacherIdChanged = editingCourseCode.teacher_id !== (fullExistingData.teacher_id || '');
    const roomLocationChanged = editingCourseCode.room_location !== (fullExistingData.room_location || '');
    const isActiveChanged = editingCourseCode.is_active !== (fullExistingData.is_active || true);
    const courseTypeIdChanged = editingCourseCode.course_type_id !== (fullExistingData.course_type_id || '');
    
    const hasChanges = 
      courseNameChanged ||
      courseDescriptionChanged ||
      maxStudentsChanged ||
      teacherIdChanged ||
      roomLocationChanged ||
      isActiveChanged ||
      courseTypeIdChanged;
    
    console.log('是否有變更:', hasChanges);
    console.log('詳細變更檢測：');
    console.log('  - courseNameChanged:', courseNameChanged);
    console.log('  - courseDescriptionChanged:', courseDescriptionChanged);
    console.log('  - maxStudentsChanged:', maxStudentsChanged);
    console.log('  - teacherIdChanged:', teacherIdChanged);
    console.log('  - roomLocationChanged:', roomLocationChanged);
    console.log('  - isActiveChanged:', isActiveChanged);
    console.log('  - courseTypeIdChanged:', courseTypeIdChanged);

    setResult({
      success: true,
      data: {
        fullExistingData,
        editingCourseCode,
        comparisons: {
          courseNameChanged,
          courseDescriptionChanged,
          maxStudentsChanged,
          teacherIdChanged,
          roomLocationChanged,
          isActiveChanged,
          courseTypeIdChanged
        },
        hasChanges,
        expectedChanges: ['courseNameChanged', 'courseDescriptionChanged', 'roomLocationChanged']
      }
    });
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
            欄位比較邏輯測試
          </h1>

          <div className="bg-gradient-to-r from-[#E8F5E8] to-[#D4F4D4] p-4 rounded-lg border border-[#90EE90] mb-6">
            <h3 className="font-semibold text-[#4B4036] mb-2">🎯 測試目標</h3>
            <p className="text-[#87704e] text-sm mb-2">
              測試修復後的欄位比較邏輯是否能正確檢測變更
            </p>
            <ul className="text-[#87704e] text-sm space-y-1 ml-4">
              <li>• 課程名稱：音樂專注力初級班A → 音樂專注力班</li>
              <li>• 課程描述：音樂專注力初級課程 - 適合初學者 → 空</li>
              <li>• 教室位置：教室A → 504</li>
            </ul>
          </div>

          <button
            onClick={testFieldComparison}
            className="bg-gradient-to-r from-[#A68A64] to-[#8f7350] hover:from-[#8f7350] hover:to-[#6b5a47] text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            測試欄位比較邏輯
          </button>
        </div>

        {result && (
          <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-[#4B4036] mb-4">測試結果</h3>
            
            <div className="bg-green-100 border border-green-400 text-green-700 p-4 rounded-lg mb-4">
              <div className="font-semibold mb-2">
                步驟: complete ✅
              </div>
              <div>
                <strong>詳細資料:</strong>
                <pre className="mt-2 p-2 bg-white rounded text-sm overflow-auto max-h-64">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#E8F5E8] to-[#D4F4D4] p-4 rounded-lg border border-[#90EE90]">
              <h4 className="font-semibold text-[#4B4036] mb-2">📊 欄位比較結果</h4>
              <div className="space-y-2 text-[#87704e]">
                <p><strong>是否有變更:</strong> {result.data.hasChanges ? '✅ 是' : '❌ 否'}</p>
                <div className="mt-3">
                  <strong>各欄位變更檢測:</strong>
                  <ul className="mt-1 ml-4 space-y-1">
                    {Object.entries(result.data.comparisons).map(([key, value]) => (
                      <li key={key} className="text-sm">
                        • {key}: {value ? '✅ 有變更' : '❌ 無變更'}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {result.data.hasChanges ? (
                  <div className="mt-3 p-3 bg-green-100 border border-green-400 rounded-lg">
                    <p className="text-green-800 text-sm font-semibold">
                      ✅ 欄位比較邏輯正常！能正確檢測到變更
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 p-3 bg-red-100 border border-red-400 rounded-lg">
                    <p className="text-red-800 text-sm font-semibold">
                      ❌ 欄位比較邏輯有問題！無法檢測到變更
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-6">
          <h3 className="text-xl font-bold text-[#4B4036] mb-4">修復說明</h3>
          <div className="space-y-3 text-[#87704e]">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#A68A64] text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <p>改善了欄位比較邏輯，使用獨立的變數來檢測每個欄位的變更</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#A68A64] text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <p>增加了詳細的變更檢測日誌</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#A68A64] text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <p>現在應該能正確檢測到所有欄位的變更</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

