import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    console.log('🎯 媒體時間軸API請求:', { studentId });

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
      .order('lesson_date', { ascending: false });

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
      .order('created_at', { ascending: false });

    if (mediaError) {
      console.error('❌ 載入媒體資料失敗:', mediaError);
      return NextResponse.json(
        { success: false, error: '載入媒體資料失敗: ' + mediaError.message },
        { status: 500 }
      );
    }

    console.log('✅ 媒體資料載入成功:', mediaData?.length || 0, '個檔案');

    // 載入評估資料（如果有的話）
    let assessmentData = null;
    try {
      const { data: assessmentDataResult, error: assessmentError } = await supabase
        .from('hanami_ability_assessments')
        .select('*')
        .eq('student_id', studentId)
        .order('assessment_date', { ascending: false });
      
      if (!assessmentError) {
        assessmentData = assessmentDataResult;
      }
    } catch (error) {
      console.log('評估資料載入失敗，將使用模擬資料:', error);
    }

    // 合併資料
    const lessonsWithMedia = lessonsData.map(lesson => {
      // 根據 lesson_id 關聯媒體檔案（優先使用課程關聯）
      let lessonMedia = mediaData.filter(media => media.lesson_id === lesson.id);
      
      // 如果沒有通過 lesson_id 關聯的媒體，則使用日期匹配作為備用方案
      // 但需要確保該媒體沒有被其他課程的 lesson_id 關聯
      if (lessonMedia.length === 0) {
        const lessonDate = new Date(lesson.lesson_date);
        lessonMedia = mediaData.filter(media => {
          // 檢查該媒體是否已經被其他課程的 lesson_id 關聯
          const isAlreadyLinked = lessonsData.some(otherLesson => 
            otherLesson.id !== lesson.id && media.lesson_id === otherLesson.id
          );
          
          if (isAlreadyLinked) {
            return false; // 如果已經被其他課程關聯，則不進行日期匹配
          }
          
          const mediaDate = new Date(media.created_at);
          // 檢查是否在同一天
          return lessonDate.toDateString() === mediaDate.toDateString();
        });
      }

      // 根據課程日期匹配評估
      const lessonDate = new Date(lesson.lesson_date);
      const lessonAssessment = assessmentData?.find(assessment => {
        const assessmentDate = new Date(assessment.assessment_date);
        return lessonDate.toDateString() === assessmentDate.toDateString();
      });

      // 如果沒有實際評估資料，生成模擬資料
      const assessment = lessonAssessment ? {
        total_progress: lessonAssessment.overall_performance_rating * 20 || 60, // 轉換評分為百分比
        current_level: Math.floor(lessonAssessment.overall_performance_rating) || 2,
        abilities: [
          { name: '專注力時長', level: 2, progress: 75, status: 'completed' },
          { name: '眼球追視能力', level: 1, progress: 40, status: 'in_progress' },
          { name: '樂理認知', level: 4, progress: 100, status: 'completed' },
          { name: '興趣和自主性', level: 2, progress: 50, status: 'in_progress' },
          { name: '讀譜能力', level: 2, progress: 100, status: 'completed' },
          { name: '樂曲彈奏進度', level: 3, progress: 75, status: 'in_progress' },
          { name: '小肌演奏能力', level: 4, progress: 100, status: 'completed' }
        ]
      } : {
        total_progress: Math.floor(Math.random() * 40) + 60, // 60-100%
        current_level: Math.floor(Math.random() * 2) + 2, // 2-3級
        abilities: [
          { name: '專注力時長', level: 2, progress: 75, status: 'completed' },
          { name: '眼球追視能力', level: 1, progress: 40, status: 'in_progress' },
          { name: '樂理認知', level: 4, progress: 100, status: 'completed' },
          { name: '興趣和自主性', level: 2, progress: 50, status: 'in_progress' },
          { name: '讀譜能力', level: 2, progress: 100, status: 'completed' },
          { name: '樂曲彈奏進度', level: 3, progress: 75, status: 'in_progress' },
          { name: '小肌演奏能力', level: 4, progress: 100, status: 'completed' }
        ]
      };

      return {
        ...lesson,
        media: lessonMedia,
        assessment
      };
    });

    console.log('🎉 資料處理完成:', {
      totalLessons: lessonsWithMedia.length,
      totalMedia: mediaData.length,
      hasAssessment: assessmentData && assessmentData.length > 0
    });

    return NextResponse.json({
      success: true,
      data: {
        lessons: lessonsWithMedia,
        totalLessons: lessonsWithMedia.length,
        totalMedia: mediaData.length,
        hasAssessment: assessmentData && assessmentData.length > 0
      }
    });

  } catch (error) {
    console.error('API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '伺服器內部錯誤' },
      { status: 500 }
    );
  }
}
