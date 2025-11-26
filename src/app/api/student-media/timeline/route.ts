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
    const typedLessonsData = (lessonsData || []) as Array<{ id: string; lesson_date: string; [key: string]: any }>;
    const typedMediaData = (mediaData || []) as Array<{ lesson_id?: string; created_at: string; [key: string]: any }>;
    
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
          // 檢查是否在同一天
          return lessonDate.toDateString() === mediaDate.toDateString();
        });
      }

      // 根據課程日期匹配評估
      const lessonDate = new Date(lesson.lesson_date);
      const typedAssessmentData = (assessmentData || []) as Array<{ assessment_date: string; [key: string]: any }>;
      const lessonAssessment = typedAssessmentData.find(assessment => {
        const assessmentDate = new Date(assessment.assessment_date);
        return lessonDate.toDateString() === assessmentDate.toDateString();
      });

      // 使用實際評估資料或返回空資料
      const assessment = lessonAssessment ? {
        total_progress: lessonAssessment.overall_performance_rating * 20 || 0, // 轉換評分為百分比
        current_level: Math.floor(lessonAssessment.overall_performance_rating) || 1,
        abilities: lessonAssessment.ability_assessments ? 
          Object.entries(lessonAssessment.ability_assessments).map(([abilityId, abilityData]: [string, any]) => ({
            id: abilityId,
            name: abilityData.name || '未知能力',
            level: abilityData.level || 1,
            progress: abilityData.progress || 0,
            status: abilityData.status || 'locked'
          })) : []
      } : {
        total_progress: 0,
        current_level: 1,
        abilities: []
      };

      return {
        ...lesson,
        media: lessonMedia,
        assessment
      };
    });

    const typedAssessmentDataFinal = (assessmentData || []) as Array<{ [key: string]: any }>;
    console.log('🎉 資料處理完成:', {
      totalLessons: lessonsWithMedia.length,
      totalMedia: typedMediaData.length,
      hasAssessment: typedAssessmentDataFinal.length > 0
    });

    return NextResponse.json({
      success: true,
      data: {
        lessons: lessonsWithMedia,
        totalLessons: lessonsWithMedia.length,
        totalMedia: typedMediaData.length,
        hasAssessment: typedAssessmentDataFinal.length > 0
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
