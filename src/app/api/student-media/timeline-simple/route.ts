import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    console.log('🎯 簡化版媒體時間軸API請求:', { studentId });

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: '缺少學生ID參數' },
        { status: 400 }
      );
    }

    // 載入課程記錄
    const { data: lessonsData, error: lessonsError } = await supabase
      .from('hanami_student_lesson')
      .select('*')
      .eq('student_id', studentId)
      .order('lesson_date', { ascending: false })
      .limit(20); // 增加數量以獲取更多課程

    if (lessonsError) {
      console.error('❌ 載入課程記錄失敗:', lessonsError);
      return NextResponse.json(
        { success: false, error: '載入課程記錄失敗: ' + lessonsError.message },
        { status: 500 }
      );
    }

    console.log('✅ 課程記錄載入成功:', lessonsData?.length || 0, '個記錄');

    // 載入媒體資料
    const { data: mediaData, error: mediaError } = await supabase
      .from('hanami_student_media')
      .select('*')
      .eq('student_id', studentId)
      .eq('is_approved', true) // Only show approved media to parents
      .order('created_at', { ascending: false });

    if (mediaError) {
      console.error('❌ 載入媒體資料失敗:', mediaError);
      // 不返回錯誤，繼續處理但媒體為空
    } else {
      console.log('✅ 媒體資料載入成功:', mediaData?.length || 0, '個檔案');
    }

    // 為每個課程添加真實的媒體資料
    const typedLessonsData = (lessonsData || []) as Array<{ id: string; lesson_date: string;[key: string]: any }>;
    const typedMediaData = (mediaData || []) as Array<{ lesson_id?: string; created_at: string;[key: string]: any }>;

    const lessonsWithMedia = typedLessonsData.map(lesson => {
      // 根據 lesson_id 關聯媒體檔案（優先使用課程關聯）
      let lessonMedia = typedMediaData.filter(media => media.lesson_id === lesson.id);

      // 如果沒有通過 lesson_id 關聯的媒體，則使用日期匹配作為備用方案
      // 但需要確保該媒體沒有被其他課程的 lesson_id 關聯
      if (lessonMedia.length === 0) {
        const lessonDate = new Date(lesson.lesson_date);
        lessonMedia = typedMediaData.filter(media => {
          // 檢查該媒體是否已經被其他課程的 lesson_id 關聯
          const isAlreadyLinked = typedLessonsData.some(otherLesson =>
            otherLesson.id !== lesson.id && media.lesson_id === otherLesson.id
          );

          if (isAlreadyLinked) {
            return false; // 如果已經被其他課程關聯，則不進行日期匹配
          }

          const mediaDate = new Date(media.created_at);
          // 檢查媒體是否在課程日期的前後幾天內
          const timeDiff = Math.abs(mediaDate.getTime() - lessonDate.getTime());
          const daysDiff = timeDiff / (1000 * 3600 * 24);
          return daysDiff <= 7; // 7天內的媒體檔案
        });
      }

      return {
        ...lesson,
        media: lessonMedia,
        isToday: false // 稍後會根據實際日期計算
      };
    });

    console.log('🎉 資料處理完成:', {
      totalLessons: lessonsWithMedia.length,
      totalMedia: typedMediaData.length || 0
    });

    // 詳細的媒體關聯分析
    console.log('🔍 服務器端媒體關聯分析:');
    lessonsWithMedia.forEach(lesson => {
      if (lesson.media.length > 0) {
        console.log(`📅 ${lesson.lesson_date} (課程ID: ${lesson.id}):`, {
          mediaCount: lesson.media.length
        });

        lesson.media.forEach((media: any, index: number) => {
          const isDirectlyLinked = media.lesson_id === lesson.id;
          console.log(`  📁 媒體 ${index + 1}:`, {
            fileName: media.file_name,
            type: media.media_type,
            mediaLessonId: media.lesson_id,
            uploadedAt: media.created_at,
            associationType: isDirectlyLinked ? '✅ 直接關聯 (lesson_id)' : '❌ 日期匹配 (fallback)'
          });
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        lessons: lessonsWithMedia,
        totalLessons: lessonsWithMedia.length,
        totalMedia: typedMediaData.length || 0,
        hasAssessment: false
      }
    });

  } catch (error) {
    console.error('💥 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '伺服器內部錯誤: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
