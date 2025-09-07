'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

export default function DebugMediaLessonAssociationPage() {
  const [studentId, setStudentId] = useState('adfc1c2a-124e-4f8e-8b1d-e049b6bd9684');
  const [lessons, setLessons] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // 載入課程資料
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('hanami_student_lesson')
        .select('*')
        .eq('student_id', studentId)
        .order('lesson_date', { ascending: false })
        .limit(10);

      if (lessonsError) throw lessonsError;

      // 載入媒體資料
      const { data: mediaData, error: mediaError } = await supabase
        .from('hanami_student_media')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (mediaError) throw mediaError;

      setLessons(lessonsData || []);
      setMedia(mediaData || []);

      console.log('📚 課程資料:', lessonsData);
      console.log('📹 媒體資料:', mediaData);

    } catch (error) {
      console.error('載入資料失敗:', error);
      toast.error('載入資料失敗');
    } finally {
      setLoading(false);
    }
  };

  const analyzeAssociation = () => {
    console.log('🔍 開始分析媒體與課程的關聯...');
    
    lessons.forEach(lesson => {
      console.log(`\n📅 課程: ${lesson.lesson_date} (ID: ${lesson.id})`);
      
      // 方法1: 通過 lesson_id 關聯
      const associatedByLessonId = media.filter(m => m.lesson_id === lesson.id);
      console.log(`  📌 通過 lesson_id 關聯的媒體: ${associatedByLessonId.length} 個`);
      associatedByLessonId.forEach(m => {
        console.log(`    - ${m.file_name} (上傳: ${m.created_at})`);
      });
      
      // 方法2: 通過日期匹配
      const lessonDate = new Date(lesson.lesson_date);
      const associatedByDate = media.filter(m => {
        const mediaDate = new Date(m.created_at);
        const timeDiff = Math.abs(mediaDate.getTime() - lessonDate.getTime());
        const daysDiff = timeDiff / (1000 * 3600 * 24);
        return daysDiff <= 7;
      });
      console.log(`  📅 通過日期匹配的媒體: ${associatedByDate.length} 個`);
      associatedByDate.forEach(m => {
        console.log(`    - ${m.file_name} (上傳: ${m.created_at}, lesson_id: ${m.lesson_id || 'null'})`);
      });
    });
  };

  useEffect(() => {
    if (lessons.length > 0 && media.length > 0) {
      analyzeAssociation();
    }
  }, [lessons, media]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          調試媒體與課程關聯
        </h1>

        <div className="space-y-4">
          <div className="flex space-x-4">
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="學生ID"
              className="px-3 py-2 border border-gray-300 rounded-lg flex-1"
            />
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '載入中...' : '載入資料'}
            </button>
          </div>

          {lessons.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 課程資料 */}
              <div>
                <h3 className="text-lg font-semibold mb-3">課程資料 ({lessons.length} 個)</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {lessons.map((lesson, index) => (
                    <div key={lesson.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium">課程 {index + 1}</div>
                      <div className="text-sm text-gray-600">
                        <div>日期: {lesson.lesson_date}</div>
                        <div>時間: {lesson.actual_timeslot}</div>
                        <div>ID: {lesson.id}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 媒體資料 */}
              <div>
                <h3 className="text-lg font-semibold mb-3">媒體資料 ({media.length} 個)</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {media.map((m, index) => (
                    <div key={m.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium">媒體 {index + 1}</div>
                      <div className="text-sm text-gray-600">
                        <div>檔案: {m.file_name}</div>
                        <div>類型: {m.media_type}</div>
                        <div>上傳: {new Date(m.created_at).toLocaleString('zh-TW')}</div>
                        <div>課程ID: {m.lesson_id || '未關聯'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">調試說明</h3>
            <p className="text-yellow-700 text-sm">
              請打開瀏覽器控制台查看詳細的關聯分析結果。這個頁面會顯示：
            </p>
            <ul className="text-yellow-700 text-sm mt-2 list-disc list-inside">
              <li>每個課程通過 lesson_id 關聯的媒體數量</li>
              <li>每個課程通過日期匹配的媒體數量</li>
              <li>媒體檔案的詳細資訊，包括 lesson_id 是否設置</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
