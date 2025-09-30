'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface CourseCode {
  id: string;
  course_code: string;
  course_name: string;
  course_description: string | null;
  max_students: number | null;
  teacher_id: string | null;
  room_location: string | null;
  is_active: boolean;
  course_type_id: string;
}

export default function TestCourseCodesLoadingPage() {
  const [courseCodes, setCourseCodes] = useState<CourseCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const loadCourseCodes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('開始載入課程代碼數據...');
      
      // 1. 測試基本查詢
      const { data: courseCodesData, error: courseCodesError } = await supabase
        .from('hanami_course_codes')
        .select(`
          id,
          course_code,
          course_name,
          course_description,
          max_students,
          teacher_id,
          room_location,
          is_active,
          course_type_id
        `)
        .order('course_code', { ascending: true });

      console.log('課程代碼查詢結果：', { courseCodesData, courseCodesError });

      if (courseCodesError) {
        console.error('載入課程代碼失敗：', courseCodesError);
        setError('載入課程代碼失敗：' + courseCodesError.message);
        return;
      }

      // 2. 載入課程類型數據
      const { data: courseTypesData, error: courseTypesError } = await supabase
        .from('Hanami_CourseTypes')
        .select('id, name');

      console.log('課程類型查詢結果：', { courseTypesData, courseTypesError });

      // 3. 載入教師數據
      const { data: teachersData, error: teachersError } = await supabase
        .from('hanami_employee')
        .select('id, teacher_nickname, teacher_fullname');

      console.log('教師查詢結果：', { teachersData, teachersError });

      // 4. 處理數據
      const courseTypesMap: {[id: string]: string} = {};
      courseTypesData?.forEach(courseType => {
        courseTypesMap[courseType.id] = courseType.name || '未知課程';
      });

      const courseCodesWithType = courseCodesData?.map(course => ({
        ...course,
        max_students: course.max_students || 8,
        course_type_name: courseTypesMap[course.course_type_id] || '未知課程'
      })) || [];

      console.log('處理後的課程代碼數據：', courseCodesWithType);
      console.log('課程代碼數量：', courseCodesWithType.length);

      setCourseCodes(courseCodesWithType);
      setDebugInfo({
        courseCodesCount: courseCodesData?.length || 0,
        courseTypesCount: courseTypesData?.length || 0,
        teachersCount: teachersData?.length || 0,
        courseCodesData: courseCodesData,
        courseTypesData: courseTypesData,
        teachersData: teachersData
      });

    } catch (error) {
      console.error('載入數據時發生錯誤：', error);
      setError('載入數據時發生錯誤：' + (error instanceof Error ? error.message : '未知錯誤'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourseCodes();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#F3EFE3] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-[#A68A64] to-[#8f7350] rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#4B4036] to-[#A68A64] bg-clip-text text-transparent">
                課程代碼載入測試
              </h1>
              <p className="text-[#2B3A3B] mt-2">測試課程代碼數據是否能正確載入</p>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={loadCourseCodes}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-[#A68A64] to-[#8f7350] text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  載入中...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  重新載入數據
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h3 className="text-red-800 font-medium">錯誤</h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {debugInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-blue-800 font-medium mb-2">調試資訊</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">課程代碼數量：</span>
                  <span className="text-blue-700">{debugInfo.courseCodesCount}</span>
                </div>
                <div>
                  <span className="font-medium">課程類型數量：</span>
                  <span className="text-blue-700">{debugInfo.courseTypesCount}</span>
                </div>
                <div>
                  <span className="font-medium">教師數量：</span>
                  <span className="text-blue-700">{debugInfo.teachersCount}</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-2">課程代碼列表</h3>
            {courseCodes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>沒有找到課程代碼數據</p>
                <p className="text-sm mt-2">請檢查數據庫連接或添加新的課程代碼</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courseCodes.map((courseCode) => (
                  <div key={courseCode.id} className="bg-white border border-[#EADBC8] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-[#4B4036]">{courseCode.course_code}</div>
                      <div className={`px-2 py-1 rounded-full text-xs ${
                        courseCode.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {courseCode.is_active ? '活躍' : '停用'}
                      </div>
                    </div>
                    <div className="text-sm text-[#87704e] mb-1">{courseCode.course_name}</div>
                    <div className="text-sm text-[#87704e] mb-2">
                      {debugInfo?.courseTypesData?.find((ct: any) => ct.id === courseCode.course_type_id)?.name || '未知課程'}
                    </div>
                    <div className="text-sm text-[#87704e]">
                      容量: {courseCode.max_students}人 | 
                      教室: {courseCode.room_location || '未設定'}
                    </div>
                    {courseCode.course_description && (
                      <div className="text-xs text-gray-500 mt-2">
                        {courseCode.course_description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">原始數據 (前3筆)</h3>
            <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-96">
              {JSON.stringify(debugInfo?.courseCodesData?.slice(0, 3), null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

