'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AddCourseCodesDataPage() {
  const [isAdding, setIsAdding] = useState(false);
  const [result, setResult] = useState<string>('');
  const [courseCodes, setCourseCodes] = useState<any[]>([]);

  const addCourseCodesData = async () => {
    setIsAdding(true);
    setResult('');
    
    try {
      console.log('開始添加課程代碼數據...');

      // 1. 獲取課程類型
      const { data: courseTypes, error: courseTypesError } = await supabase
        .from('Hanami_CourseTypes')
        .select('id, name')
        .eq('status', true);

      if (courseTypesError) {
        throw new Error('獲取課程類型失敗：' + courseTypesError.message);
      }

      console.log('獲取到的課程類型：', courseTypes);

      // 2. 獲取教師列表
      const { data: teachers, error: teachersError } = await supabase
        .from('hanami_employee')
        .select('id, teacher_nickname, teacher_fullname')
        .limit(5);

      if (teachersError) {
        console.warn('獲取教師列表失敗，將使用 NULL：', teachersError.message);
      }

      console.log('獲取到的教師：', teachers);

      // 3. 準備課程代碼數據
      const courseCodesData = [
        // 鋼琴課程
        {
          course_type_id: courseTypes?.find(ct => ct.name === '鋼琴')?.id,
          course_code: 'PIANO_001',
          course_name: '鋼琴初級班A',
          course_description: '適合初學者的鋼琴基礎課程，學習基本指法和簡單樂曲',
          max_students: 8,
          teacher_id: null,
          room_location: '音樂教室A',
          is_active: true
        },
        {
          course_type_id: courseTypes?.find(ct => ct.name === '鋼琴')?.id,
          course_code: 'PIANO_002',
          course_name: '鋼琴初級班B',
          course_description: '適合初學者的鋼琴基礎課程，學習基本指法和簡單樂曲',
          max_students: 8,
          teacher_id: null,
          room_location: '音樂教室B',
          is_active: true
        },
        {
          course_type_id: courseTypes?.find(ct => ct.name === '鋼琴')?.id,
          course_code: 'PIANO_003',
          course_name: '鋼琴中級班A',
          course_description: '適合有基礎的學生，學習更複雜的樂曲和技巧',
          max_students: 6,
          teacher_id: null,
          room_location: '音樂教室A',
          is_active: true
        },
        // 音樂專注力課程
        {
          course_type_id: courseTypes?.find(ct => ct.name === '音樂專注力')?.id,
          course_code: 'MUSIC_FOCUS_001',
          course_name: '音樂專注力初級班A',
          course_description: '音樂專注力初級課程 - 適合初學者',
          max_students: 8,
          teacher_id: null,
          room_location: '教室A',
          is_active: true
        },
        {
          course_type_id: courseTypes?.find(ct => ct.name === '音樂專注力')?.id,
          course_code: 'MUSIC_FOCUS_002',
          course_name: '音樂專注力初級班B',
          course_description: '音樂專注力初級課程 - 適合初學者',
          max_students: 8,
          teacher_id: null,
          room_location: '教室B',
          is_active: true
        },
        {
          course_type_id: courseTypes?.find(ct => ct.name === '音樂專注力')?.id,
          course_code: 'MUSIC_FOCUS_003',
          course_name: '音樂專注力中級班A',
          course_description: '音樂專注力中級課程 - 適合有基礎的學生',
          max_students: 6,
          teacher_id: null,
          room_location: '教室A',
          is_active: true
        },
        // 試聽課程
        {
          course_type_id: courseTypes?.find(ct => ct.name === '鋼琴')?.id,
          course_code: 'PIANO_TRIAL_001',
          course_name: '鋼琴試聽課',
          course_description: '鋼琴試聽課程，讓學生體驗鋼琴學習',
          max_students: 10,
          teacher_id: null,
          room_location: '試聽教室',
          is_active: true
        },
        {
          course_type_id: courseTypes?.find(ct => ct.name === '音樂專注力')?.id,
          course_code: 'MUSIC_FOCUS_TRIAL_001',
          course_name: '音樂專注力試聽課',
          course_description: '音樂專注力試聽課程，讓學生體驗音樂專注力訓練',
          max_students: 10,
          teacher_id: null,
          room_location: '試聽教室',
          is_active: true
        }
      ].filter(item => item.course_type_id); // 過濾掉沒有對應課程類型的項目

      console.log('準備插入的課程代碼數據：', courseCodesData);

      // 4. 插入課程代碼數據
      const { data: insertedData, error: insertError } = await supabase
        .from('hanami_course_codes')
        .insert(courseCodesData)
        .select();

      if (insertError) {
        throw new Error('插入課程代碼失敗：' + insertError.message);
      }

      console.log('成功插入的課程代碼：', insertedData);

      // 5. 驗證插入結果
      const { data: allCourseCodes, error: verifyError } = await supabase
        .from('hanami_course_codes')
        .select(`
          id,
          course_code,
          course_name,
          course_description,
          max_students,
          room_location,
          is_active,
          course_type_id
        `)
        .order('course_code');

      if (verifyError) {
        console.warn('驗證查詢失敗：', verifyError.message);
      } else {
        console.log('所有課程代碼：', allCourseCodes);
        setCourseCodes(allCourseCodes || []);
      }

      setResult(`✅ 成功添加 ${insertedData?.length || 0} 個課程代碼！`);

    } catch (error) {
      console.error('添加課程代碼數據時發生錯誤：', error);
      setResult('❌ 添加失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
    } finally {
      setIsAdding(false);
    }
  };

  const loadCourseCodes = async () => {
    try {
      const { data: courseCodes, error } = await supabase
        .from('hanami_course_codes')
        .select(`
          id,
          course_code,
          course_name,
          course_description,
          max_students,
          room_location,
          is_active,
          course_type_id
        `)
        .order('course_code');

      if (error) {
        console.error('載入課程代碼失敗：', error);
        return;
      }

      setCourseCodes(courseCodes || []);
      console.log('載入的課程代碼：', courseCodes);
    } catch (error) {
      console.error('載入課程代碼時發生錯誤：', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#F3EFE3] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-[#A68A64] to-[#8f7350] rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#4B4036] to-[#A68A64] bg-clip-text text-transparent">
                添加課程代碼數據
              </h1>
              <p className="text-[#2B3A3B] mt-2">為空的課程代碼表添加初始數據</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 className="text-yellow-800 font-medium">說明</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  此工具會為現有的課程類型（鋼琴、音樂專注力）創建對應的課程代碼，包括初級班、中級班和試聽課。
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={addCourseCodesData}
              disabled={isAdding}
              className="flex-1 px-8 py-4 bg-gradient-to-r from-[#A68A64] to-[#8f7350] text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isAdding ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  添加中...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  添加課程代碼數據
                </>
              )}
            </button>

            <button
              onClick={loadCourseCodes}
              className="px-6 py-4 bg-blue-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              載入現有數據
            </button>
          </div>

          {result && (
            <div className={`p-4 rounded-lg mb-6 ${
              result.includes('✅') 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`font-medium ${
                result.includes('✅') 
                  ? 'text-green-800' 
                  : 'text-red-800'
              }`}>
                {result}
              </p>
            </div>
          )}

          {courseCodes.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-4">現有課程代碼 ({courseCodes.length} 個)</h3>
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
                    <div className="text-sm text-[#87704e]">
                      容量: {courseCode.max_students}人 | 教室: {courseCode.room_location || '未設定'}
                    </div>
                    {courseCode.course_description && (
                      <div className="text-xs text-gray-500 mt-2">
                        {courseCode.course_description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

