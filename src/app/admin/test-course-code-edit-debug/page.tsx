'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface CourseCode {
  id: string;
  course_code: string;
  course_name: string;
  course_description?: string;
  max_students: number | null;
  teacher_id?: string;
  room_location?: string;
  is_active: boolean;
  course_type_id?: string;
  created_at: string;
  updated_at: string;
}

export default function TestCourseCodeEditDebugPage() {
  const [courseCodes, setCourseCodes] = useState<CourseCode[]>([]);
  const [editingCourseCode, setEditingCourseCode] = useState<CourseCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const fetchCourseCodes = async () => {
    setLoading(true);
    setError(null);
    addDebugInfo('開始載入課程代碼...');
    
    try {
      const { data, error } = await supabase
        .from('hanami_course_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        addDebugInfo(`載入失敗: ${error.message}`);
        setError(error.message);
        return;
      }

      addDebugInfo(`成功載入 ${data?.length || 0} 個課程代碼`);
      setCourseCodes(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知錯誤';
      addDebugInfo(`載入時發生錯誤: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCourseCode = async () => {
    if (!editingCourseCode) return;

    setLoading(true);
    setError(null);
    addDebugInfo(`開始更新課程代碼: ${editingCourseCode.course_code}`);
    addDebugInfo(`更新資料: ${JSON.stringify(editingCourseCode, null, 2)}`);

    try {
      // 檢查資料完整性
      if (!editingCourseCode.course_name) {
        throw new Error('課程名稱不能為空');
      }
      if (!editingCourseCode.max_students || editingCourseCode.max_students <= 0) {
        throw new Error('最大學生數必須大於 0');
      }

      const updateData = {
        course_name: editingCourseCode.course_name,
        course_description: editingCourseCode.course_description || null,
        max_students: editingCourseCode.max_students,
        teacher_id: editingCourseCode.teacher_id || null,
        room_location: editingCourseCode.room_location || null,
        is_active: editingCourseCode.is_active,
        course_type_id: editingCourseCode.course_type_id || null,
        updated_at: new Date().toISOString()
      };

      addDebugInfo(`準備更新的資料: ${JSON.stringify(updateData, null, 2)}`);

      const { data, error } = await supabase
        .from('hanami_course_codes')
        .update(updateData)
        .eq('id', editingCourseCode.id)
        .select();

      if (error) {
        addDebugInfo(`更新失敗: ${error.message}`);
        addDebugInfo(`錯誤詳情: ${JSON.stringify(error, null, 2)}`);
        setError(error.message);
        return;
      }

      addDebugInfo(`更新成功: ${JSON.stringify(data, null, 2)}`);
      setEditingCourseCode(null);
      await fetchCourseCodes();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知錯誤';
      addDebugInfo(`更新時發生錯誤: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseCodes();
  }, []);

  return (
    <div className="min-h-screen bg-[#FFF9F2] px-4 py-6 font-['Quicksand',_sans-serif]">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-6 mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#4B4036] to-[#A68A64] bg-clip-text text-transparent flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-[#A68A64] to-[#8f7350] rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            課程代碼編輯調試頁面
          </h1>

          <div className="flex gap-3 mb-6">
            <button
              className="bg-gradient-to-r from-[#A68A64] to-[#8f7350] hover:from-[#8f7350] hover:to-[#6b5a47] text-white px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center gap-2"
              onClick={fetchCourseCodes}
              disabled={loading}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              重新載入
            </button>

            <button
              className="bg-gradient-to-r from-[#FF6B6B] to-[#FF5252] hover:from-[#FF5252] hover:to-[#FF1744] text-white px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center gap-2"
              onClick={() => setDebugInfo([])}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              清除日誌
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>錯誤:</strong> {error}
            </div>
          )}

          {loading && (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
              載入中...
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 課程代碼列表 */}
          <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-6">
            <h2 className="text-xl font-bold text-[#4B4036] mb-4">課程代碼列表</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {courseCodes.map((course) => (
                <div key={course.id} className="bg-white border border-[#EADBC8] rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-[#4B4036]">{course.course_name}</h3>
                      <p className="text-sm text-[#87704e]">代碼: {course.course_code}</p>
                      <p className="text-sm text-[#87704e]">最大學生數: {course.max_students}</p>
                    </div>
                    <button
                      className="bg-gradient-to-r from-[#A68A64] to-[#8f7350] hover:from-[#8f7350] hover:to-[#6b5a47] text-white px-3 py-1 rounded text-sm transition-all duration-300 transform hover:scale-105"
                      onClick={() => setEditingCourseCode(course)}
                    >
                      編輯
                    </button>
                  </div>
                  <p className="text-xs text-[#87704e]">狀態: {course.is_active ? '啟用' : '停用'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 編輯表單 */}
          <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-6">
            <h2 className="text-xl font-bold text-[#4B4036] mb-4">編輯課程代碼</h2>
            
            {editingCourseCode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-1">課程代碼</label>
                  <input
                    type="text"
                    value={editingCourseCode.course_code}
                    disabled
                    className="w-full border-2 border-[#E4D5BC] bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl px-4 py-3 shadow-sm text-gray-600 font-mono text-lg transition-all duration-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-1">課程名稱 *</label>
                  <input
                    type="text"
                    value={editingCourseCode.course_name}
                    onChange={(e) => setEditingCourseCode({...editingCourseCode, course_name: e.target.value})}
                    className="w-full border-2 border-[#E4D5BC] bg-gradient-to-r from-[#FFFCF5] to-[#FFF9F2] rounded-xl px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all duration-300 hover:shadow-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-1">課程描述</label>
                  <textarea
                    value={editingCourseCode.course_description || ''}
                    onChange={(e) => setEditingCourseCode({...editingCourseCode, course_description: e.target.value})}
                    className="w-full border-2 border-[#E4D5BC] bg-gradient-to-r from-[#FFFCF5] to-[#FFF9F2] rounded-xl px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all duration-300 hover:shadow-md"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-1">最大學生數 *</label>
                  <input
                    type="number"
                    value={editingCourseCode.max_students || ''}
                    onChange={(e) => setEditingCourseCode({...editingCourseCode, max_students: parseInt(e.target.value) || 0})}
                    className="w-full border-2 border-[#E4D5BC] bg-gradient-to-r from-[#FFFCF5] to-[#FFF9F2] rounded-xl px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all duration-300 hover:shadow-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-1">教室位置</label>
                  <input
                    type="text"
                    value={editingCourseCode.room_location || ''}
                    onChange={(e) => setEditingCourseCode({...editingCourseCode, room_location: e.target.value})}
                    className="w-full border-2 border-[#E4D5BC] bg-gradient-to-r from-[#FFFCF5] to-[#FFF9F2] rounded-xl px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all duration-300 hover:shadow-md"
                  />
                </div>

                <div className="bg-gradient-to-r from-[#F3EFE3] to-[#E8DCC6] p-4 rounded-xl border border-[#EADBC8]">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={editingCourseCode.is_active}
                      onChange={(e) => setEditingCourseCode({...editingCourseCode, is_active: e.target.checked})}
                      className="w-5 h-5 rounded border-2 border-[#E4D5BC] bg-white text-[#A68A64] focus:ring-[#A68A64] focus:ring-2 transition-all duration-300"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-[#4B4036]">
                      啟用此課程代碼
                    </label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    className="flex-1 bg-gradient-to-r from-[#A68A64] to-[#8f7350] hover:from-[#8f7350] hover:to-[#6b5a47] text-white py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
                    onClick={handleEditCourseCode}
                    disabled={loading}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {loading ? '更新中...' : '更新'}
                  </button>
                  <button
                    className="flex-1 bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 text-gray-700 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
                    onClick={() => setEditingCourseCode(null)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[#87704e]">請選擇一個課程代碼進行編輯</p>
            )}
          </div>
        </div>

        {/* 調試日誌 */}
        <div className="mt-6 bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-6">
          <h3 className="text-xl font-bold text-[#4B4036] mb-4">調試日誌</h3>
          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
            {debugInfo.length === 0 ? (
              <p className="text-gray-500">暫無日誌信息</p>
            ) : (
              debugInfo.map((info, index) => (
                <div key={index} className="mb-1">{info}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

