'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const EmergencyDiagnosisPage = () => {
  const [diagnosisResults, setDiagnosisResults] = useState<any>({});
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnosis = async () => {
    setIsRunning(true);
    const results: any = {};

    try {
      // 1. 檢查 hanami_course_codes 表是否存在
      console.log('=== 步驟 1: 檢查表是否存在 ===');
      const { data: tableCheck, error: tableError } = await supabase
        .from('hanami_course_codes')
        .select('id')
        .limit(1);
      
      results.tableExists = !tableError;
      results.tableError = tableError?.message || null;
      results.tableData = tableCheck;

      // 2. 檢查 RLS 狀態
      console.log('=== 步驟 2: 檢查 RLS 狀態 ===');
      const { data: rlsCheck, error: rlsError } = await supabase
        .rpc('check_table_rls_status', { table_name: 'hanami_course_codes' } as any);
      
      results.rlsStatus = rlsCheck;
      results.rlsError = rlsError?.message || null;

      // 3. 嘗試直接查詢所有資料
      console.log('=== 步驟 3: 直接查詢所有資料 ===');
      const { data: allData, error: allError } = await supabase
        .from('hanami_course_codes')
        .select('*');
      
      results.allData = allData;
      results.allDataError = allError?.message || null;
      results.allDataCount = allData?.length || 0;

      // 4. 嘗試查詢特定欄位
      console.log('=== 步驟 4: 查詢特定欄位 ===');
      const { data: specificData, error: specificError } = await supabase
        .from('hanami_course_codes')
        .select('id, course_code, course_name, max_students, is_active');
      
      results.specificData = specificData;
      results.specificDataError = specificError?.message || null;
      results.specificDataCount = specificData?.length || 0;

      // 5. 檢查 Hanami_CourseTypes 表
      console.log('=== 步驟 5: 檢查 Hanami_CourseTypes ===');
      const { data: courseTypes, error: courseTypesError } = await supabase
        .from('Hanami_CourseTypes')
        .select('id, name');
      
      results.courseTypes = courseTypes;
      results.courseTypesError = courseTypesError?.message || null;
      results.courseTypesCount = courseTypes?.length || 0;

      // 6. 檢查 hanami_employee 表
      console.log('=== 步驟 6: 檢查 hanami_employee ===');
      const { data: employees, error: employeesError } = await supabase
        .from('hanami_employee')
        .select('id, teacher_nickname, teacher_fullname');
      
      results.employees = employees;
      results.employeesError = employeesError?.message || null;
      results.employeesCount = employees?.length || 0;

      // 7. 檢查用戶認證狀態
      console.log('=== 步驟 7: 檢查用戶認證狀態 ===');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      results.user = user;
      results.userError = userError?.message || null;
      results.isAuthenticated = !!user;

      // 8. 嘗試插入測試資料
      console.log('=== 步驟 8: 嘗試插入測試資料 ===');
      const testCourseCode = {
        course_code: `TEST_${Date.now()}`,
        course_name: '測試課程',
        course_description: '診斷測試用',
        max_students: 5,
        is_active: true
      };

      const { data: insertData, error: insertError } = await (supabase
        .from('hanami_course_codes')
        .insert([testCourseCode] as any)
        .select() as any);
      
      results.insertData = insertData;
      results.insertError = insertError?.message || null;
      results.insertSuccess = !insertError;

      // 9. 如果插入成功，立即刪除測試資料
      if (insertData && insertData.length > 0) {
        console.log('=== 步驟 9: 清理測試資料 ===');
        const { error: deleteError } = await supabase
          .from('hanami_course_codes')
          .delete()
          .eq('course_code', testCourseCode.course_code);
        
        results.deleteError = deleteError?.message || null;
        results.deleteSuccess = !deleteError;
      }

      // 10. 最終查詢確認
      console.log('=== 步驟 10: 最終查詢確認 ===');
      const { data: finalData, error: finalError } = await supabase
        .from('hanami_course_codes')
        .select('id, course_code, course_name, max_students, is_active, created_at')
        .order('created_at', { ascending: false });
      
      results.finalData = finalData;
      results.finalError = finalError?.message || null;
      results.finalDataCount = finalData?.length || 0;

    } catch (error) {
      console.error('診斷過程中發生錯誤:', error);
      results.generalError = error instanceof Error ? error.message : '未知錯誤';
    }

    setDiagnosisResults(results);
    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#F3EFE3] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-[#A68A64] to-[#8f7350] rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#4B4036] to-[#A68A64] bg-clip-text text-transparent">
                緊急診斷工具
              </h1>
              <p className="text-[#2B3A3B] mt-2">診斷課程代碼管理顯示問題</p>
            </div>
          </div>

          <button
            onClick={runDiagnosis}
            disabled={isRunning}
            className="px-8 py-4 bg-gradient-to-r from-[#A68A64] to-[#8f7350] text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
          >
            {isRunning ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                診斷中...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                開始診斷
              </>
            )}
          </button>
        </div>

        {Object.keys(diagnosisResults).length > 0 && (
          <div className="space-y-6">
            {/* 表存在檢查 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-[#4B4036] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                表存在檢查
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-gray-50">
                  <p className="font-medium">表是否存在:</p>
                  <p className={`text-lg ${diagnosisResults.tableExists ? 'text-green-600' : 'text-red-600'}`}>
                    {diagnosisResults.tableExists ? '✅ 是' : '❌ 否'}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <p className="font-medium">錯誤訊息:</p>
                  <p className="text-sm text-gray-600">
                    {diagnosisResults.tableError || '無錯誤'}
                  </p>
                </div>
              </div>
            </div>

            {/* 資料查詢結果 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-[#4B4036] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
                資料查詢結果
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-4 rounded-lg bg-gray-50">
                  <p className="font-medium">所有資料查詢:</p>
                  <p className={`text-lg ${diagnosisResults.allDataCount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {diagnosisResults.allDataCount > 0 ? `✅ ${diagnosisResults.allDataCount} 筆` : '❌ 0 筆'}
                  </p>
                  {diagnosisResults.allDataError && (
                    <p className="text-xs text-red-500 mt-1">{diagnosisResults.allDataError}</p>
                  )}
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <p className="font-medium">特定欄位查詢:</p>
                  <p className={`text-lg ${diagnosisResults.specificDataCount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {diagnosisResults.specificDataCount > 0 ? `✅ ${diagnosisResults.specificDataCount} 筆` : '❌ 0 筆'}
                  </p>
                  {diagnosisResults.specificDataError && (
                    <p className="text-xs text-red-500 mt-1">{diagnosisResults.specificDataError}</p>
                  )}
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <p className="font-medium">最終查詢:</p>
                  <p className={`text-lg ${diagnosisResults.finalDataCount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {diagnosisResults.finalDataCount > 0 ? `✅ ${diagnosisResults.finalDataCount} 筆` : '❌ 0 筆'}
                  </p>
                  {diagnosisResults.finalError && (
                    <p className="text-xs text-red-500 mt-1">{diagnosisResults.finalError}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 相關表檢查 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-[#4B4036] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                相關表檢查
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-gray-50">
                  <p className="font-medium">Hanami_CourseTypes:</p>
                  <p className={`text-lg ${diagnosisResults.courseTypesCount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {diagnosisResults.courseTypesCount > 0 ? `✅ ${diagnosisResults.courseTypesCount} 筆` : '❌ 0 筆'}
                  </p>
                  {diagnosisResults.courseTypesError && (
                    <p className="text-xs text-red-500 mt-1">{diagnosisResults.courseTypesError}</p>
                  )}
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <p className="font-medium">hanami_employee:</p>
                  <p className={`text-lg ${diagnosisResults.employeesCount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {diagnosisResults.employeesCount > 0 ? `✅ ${diagnosisResults.employeesCount} 筆` : '❌ 0 筆'}
                  </p>
                  {diagnosisResults.employeesError && (
                    <p className="text-xs text-red-500 mt-1">{diagnosisResults.employeesError}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 認證狀態 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-[#4B4036] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                認證狀態
              </h2>
              <div className="p-4 rounded-lg bg-gray-50">
                <p className="font-medium">用戶認證:</p>
                <p className={`text-lg ${diagnosisResults.isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
                  {diagnosisResults.isAuthenticated ? '✅ 已認證' : '❌ 未認證'}
                </p>
                {diagnosisResults.userError && (
                  <p className="text-xs text-red-500 mt-1">{diagnosisResults.userError}</p>
                )}
              </div>
            </div>

            {/* 測試操作 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-[#4B4036] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                測試操作
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-gray-50">
                  <p className="font-medium">插入測試:</p>
                  <p className={`text-lg ${diagnosisResults.insertSuccess ? 'text-green-600' : 'text-red-600'}`}>
                    {diagnosisResults.insertSuccess ? '✅ 成功' : '❌ 失敗'}
                  </p>
                  {diagnosisResults.insertError && (
                    <p className="text-xs text-red-500 mt-1">{diagnosisResults.insertError}</p>
                  )}
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <p className="font-medium">刪除測試:</p>
                  <p className={`text-lg ${diagnosisResults.deleteSuccess ? 'text-green-600' : 'text-red-600'}`}>
                    {diagnosisResults.deleteSuccess ? '✅ 成功' : '❌ 失敗'}
                  </p>
                  {diagnosisResults.deleteError && (
                    <p className="text-xs text-red-500 mt-1">{diagnosisResults.deleteError}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 詳細資料顯示 */}
            {diagnosisResults.finalData && diagnosisResults.finalData.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-[#4B4036] mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  課程代碼資料
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-left">課程代碼</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">課程名稱</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">最大學生數</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">狀態</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">創建時間</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diagnosisResults.finalData.map((course: any) => (
                        <tr key={course.id}>
                          <td className="border border-gray-300 px-4 py-2">{course.course_code}</td>
                          <td className="border border-gray-300 px-4 py-2">{course.course_name}</td>
                          <td className="border border-gray-300 px-4 py-2">{course.max_students}</td>
                          <td className="border border-gray-300 px-4 py-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              course.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {course.is_active ? '啟用' : '停用'}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            {new Date(course.created_at).toLocaleString('zh-TW')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 原始診斷結果 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-[#4B4036] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                原始診斷結果
              </h2>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                {JSON.stringify(diagnosisResults, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyDiagnosisPage;



