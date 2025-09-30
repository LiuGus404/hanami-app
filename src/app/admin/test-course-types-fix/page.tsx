'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestCourseTypesFixPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results: any[] = [];

    try {
      // 測試 1: 檢查 Hanami_CourseTypes 表
      console.log('測試 1: 檢查 Hanami_CourseTypes 表...');
      const { data: courseTypesData, error: courseTypesError } = await supabase
        .from('Hanami_CourseTypes')
        .select('id, name')
        .eq('status', true);

      if (courseTypesError) {
        results.push({
          test: 'Hanami_CourseTypes 表查詢',
          status: '❌ 失敗',
          error: courseTypesError.message,
          data: null
        });
      } else {
        results.push({
          test: 'Hanami_CourseTypes 表查詢',
          status: '✅ 成功',
          error: null,
          data: courseTypesData?.length || 0,
          details: courseTypesData
        });
      }

      // 測試 2: 檢查 hanami_course_codes 表
      console.log('測試 2: 檢查 hanami_course_codes 表...');
      const { data: courseCodesData, error: courseCodesError } = await supabase
        .from('hanami_course_codes')
        .select(`
          id,
          course_code,
          course_name,
          max_students,
          teacher_id,
          room_location,
          is_active,
          course_type_id
        `)
        .eq('is_active', true);

      if (courseCodesError) {
        results.push({
          test: 'hanami_course_codes 表查詢',
          status: '❌ 失敗',
          error: courseCodesError.message,
          data: null
        });
      } else {
        results.push({
          test: 'hanami_course_codes 表查詢',
          status: '✅ 成功',
          error: null,
          data: courseCodesData?.length || 0,
          details: courseCodesData?.slice(0, 3)
        });
      }

      // 測試 3: 檢查 hanami_employee 表
      console.log('測試 3: 檢查 hanami_employee 表...');
      const { data: teachersData, error: teachersError } = await supabase
        .from('hanami_employee')
        .select('id, teacher_nickname, teacher_fullname');

      if (teachersError) {
        results.push({
          test: 'hanami_employee 表查詢',
          status: '❌ 失敗',
          error: teachersError.message,
          data: null
        });
      } else {
        results.push({
          test: 'hanami_employee 表查詢',
          status: '✅ 成功',
          error: null,
          data: teachersData?.length || 0,
          details: teachersData?.slice(0, 3)
        });
      }

      // 測試 4: 測試資料關聯
      console.log('測試 4: 測試資料關聯...');
      if (courseCodesData && courseTypesData && teachersData) {
        const courseCodesWithRelations = courseCodesData.map(course => {
          const courseType = courseTypesData.find(ct => ct.id === course.course_type_id);
          const teacher = teachersData.find(t => t.id === course.teacher_id);
          
          return {
            course_code: course.course_code,
            course_name: course.course_name,
            course_type_name: courseType?.name || '未知課程',
            teacher_name: teacher?.teacher_nickname || teacher?.teacher_fullname || '未分配',
            max_students: course.max_students,
            room_location: course.room_location
          };
        });

        results.push({
          test: '資料關聯測試',
          status: '✅ 成功',
          error: null,
          data: courseCodesWithRelations.length,
          details: courseCodesWithRelations.slice(0, 3)
        });
      }

    } catch (error) {
      results.push({
        test: '測試執行',
        status: '❌ 失敗',
        error: error instanceof Error ? error.message : '未知錯誤',
        data: null
      });
    }

    setTestResults(results);
    setLoading(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="min-h-screen bg-[#FFF9F2] px-4 py-6 font-['Quicksand',_sans-serif]">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-6 mb-6">
          <h1 className="text-2xl font-bold text-[#4B4036] mb-4">課程類型修復測試</h1>
          <p className="text-[#87704e] mb-4">
            測試多課程管理面板中課程類型資料載入是否正常
          </p>
          
          <button
            className="bg-[#A68A64] hover:bg-[#8f7350] text-white px-4 py-2 rounded-full text-sm transition-colors"
            onClick={runTests}
            disabled={loading}
          >
            {loading ? '測試中...' : '重新測試'}
          </button>
        </div>

        <div className="space-y-4">
          {testResults.map((result, index) => (
            <div key={index} className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-[#4B4036]">{result.test}</h3>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  result.status.includes('✅') 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {result.status}
                </span>
              </div>
              
              {result.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
                  <div className="text-sm text-red-800">
                    <strong>錯誤：</strong> {result.error}
                  </div>
                </div>
              )}
              
              {result.data !== null && (
                <div className="text-sm text-[#87704e] mb-2">
                  記錄數：{result.data}
                </div>
              )}
              
              {result.details && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="text-sm text-gray-700">
                    <strong>詳細資料：</strong>
                    <pre className="mt-2 text-xs overflow-auto max-h-40">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-4">
          <h3 className="text-lg font-bold text-[#4B4036] mb-2">修復說明</h3>
          <div className="text-sm text-[#87704e] space-y-2">
            <p>✅ 添加了 <code>courseTypes</code> 狀態變數</p>
            <p>✅ 在 <code>fetchData</code> 中載入並保存課程類型資料</p>
            <p>✅ 為新增課程代碼模態框添加課程類型選擇器</p>
            <p>✅ 為編輯課程代碼模態框添加課程類型選擇器</p>
            <p>✅ 添加教師選擇器和課程描述欄位</p>
          </div>
        </div>
      </div>
    </div>
  );
}
