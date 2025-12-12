import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { QuotaChecker } from '@/lib/quota-checker';

// 獲取今天的課堂信息
async function getTodayLesson(supabase: any, studentId: string) {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD 格式

    const { data: lessons, error } = await supabase
      .from('hanami_student_lesson')
      .select('*')
      .eq('student_id', studentId)
      .eq('lesson_date', todayStr)
      .order('actual_timeslot', { ascending: true })
      .limit(1);

    if (error) {
      console.error('獲取今天課堂信息失敗:', error);
      return null;
    }

    return lessons && lessons.length > 0 ? lessons[0] : null;
  } catch (error) {
    console.error('獲取今天課堂信息錯誤:', error);
    return null;
  }
}

// 生成新的文件名格式：student_id_日期_時間.副檔名（避免中文造成的 Storage key 問題）
function generateFileName(originalName: string, studentId: string, lesson?: any) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
  const timeStr = today.toTimeString().split(' ')[0].replace(/:/g, ''); // HHMMSS

  // 獲取文件擴展名
  const fileExt = originalName.split('.').pop();

  // 如果有課堂信息，使用課堂時間
  let timeIdentifier = timeStr;
  if (lesson && lesson.actual_timeslot) {
    timeIdentifier = lesson.actual_timeslot.replace(/:/g, '').replace(/-/g, '');
  }

  // 生成新文件名：student_id_日期_時間.擴展名
  const safeStudentId = (studentId || 'student').toString().replace(/[^\w-]/g, '_');
  const newFileName = `${safeStudentId}_${dateStr}_${timeIdentifier}.${fileExt}`;

  return newFileName;
}

export async function POST(request: NextRequest) {
  // 定定義一個變數來追蹤進度，方便除錯
  let step = 'init';

  try {
    step = 'check_env';
    // 檢查環境變數
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('缺少環境變數:', {
        supabaseUrl: !!supabaseUrl,
        supabaseServiceKey: !!supabaseServiceKey
      });
      return NextResponse.json(
        { error: '伺服器配置錯誤: 缺少必要的 Supabase 環境變數' },
        { status: 500 }
      );
    }

    step = 'create_client';
    // 創建服務端 Supabase 客戶端
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    step = 'parse_form';
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const studentId = formData.get('studentId') as string;
    const mediaType = formData.get('mediaType') as string;
    const orgId = formData.get('orgId') as string | null;

    if (!file || !studentId || !mediaType) {
      return NextResponse.json(
        { error: '缺少必要參數 (file, studentId, mediaType)' },
        { status: 400 }
      );
    }

    step = 'get_student_info';
    // 獲取學生信息和今天的課堂信息
    const { data: studentData, error: studentError } = await supabase
      .from('Hanami_Students')
      .select('full_name')
      .eq('id', studentId)
      .single();

    if (studentError || !studentData) {
      console.error('獲取學生信息失敗:', studentError);
      return NextResponse.json(
        { error: '無法獲取學生信息' },
        { status: 400 }
      );
    }

    step = 'get_lesson_info';
    const todayLesson = await getTodayLesson(supabase, studentId);
    console.log('今天的課堂信息:', todayLesson);

    console.log('開始上傳檔案:', {
      fileName: file.name,
      fileSize: file.size,
      fileSizeMB: (file.size / (1024 * 1024)).toFixed(2) + 'MB',
      fileType: file.type,
      studentId,
      mediaType
    });

    // 檢查配額限制
    step = 'check_quota';
    try {
      const quotaChecker = new QuotaChecker();
      const quotaCheck = await quotaChecker.checkUploadQuota(
        studentId,
        mediaType as 'video' | 'photo',
        file.size
      );

      if (!quotaCheck.allowed) {
        console.log('配額檢查失敗:', quotaCheck.reason);
        return NextResponse.json({
          error: quotaCheck.reason || '配額檢查失敗',
          quotaInfo: {
            currentUsage: quotaCheck.currentUsage,
            limits: quotaCheck.limits
          }
        }, { status: 403 });
      }

      console.log('配額檢查通過:', {
        currentUsage: quotaCheck.currentUsage,
        limits: quotaCheck.limits
      });
    } catch (quotaError) {
      console.error('配額檢查錯誤:', quotaError);
      return NextResponse.json({
        error: '配額檢查失敗',
        details: quotaError instanceof Error ? quotaError.message : '未知錯誤'
      }, { status: 500 });
    }

    step = 'upload_storage';
    // 生成新的文件名格式：使用 student_id 作為前綴
    const newFileName = generateFileName(file.name, studentId, todayLesson);

    // 生成檔案路徑
    const fileExt = newFileName.split('.').pop();
    const fileName = `${studentId}/${mediaType}s/${newFileName}`;

    // 使用服務端金鑰上傳到 Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('hanami-media')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage 上傳錯誤:', uploadError);
      return NextResponse.json(
        { error: `Storage 上傳失敗: ${uploadError.message}` },
        { status: 500 }
      );
    }

    console.log('Storage 上傳成功:', uploadData);

    step = 'get_public_url';
    // 獲取公開 URL
    const { data: urlData } = supabase.storage
      .from('hanami-media')
      .getPublicUrl(fileName);

    step = 'insert_db';
    // 準備資料庫資料
    const mediaData: any = {
      student_id: studentId,
      media_type: mediaType,
      file_name: newFileName, // 使用新的文件名
      file_path: fileName,
      file_size: file.size,
      title: newFileName.replace(/\.[^/.]+$/, ''), // 使用新文件名作為標題
      uploaded_by: null, // 設為 null 而不是字串
      lesson_id: todayLesson?.id || null // 關聯到今天的課堂
    };

    // 如果有 org_id，添加到資料中
    if (orgId) {
      mediaData.org_id = orgId;
    }

    // 儲存到資料庫
    const { data: dbData, error: dbError } = await supabase
      .from('hanami_student_media')
      .insert(mediaData)
      .select()
      .single();

    if (dbError) {
      console.error('資料庫插入錯誤:', dbError);
      // 如果資料庫插入失敗，刪除已上傳的檔案
      await supabase.storage
        .from('hanami-media')
        .remove([fileName]);

      return NextResponse.json(
        { error: `資料庫插入失敗: ${dbError.message}` },
        { status: 500 }
      );
    }

    console.log('資料庫插入成功:', dbData);

    step = 'update_quota';
    // 更新學生配額使用情況
    try {
      const { data: currentQuota, error: quotaError } = await supabase
        .from('hanami_student_media_quota')
        .select('*')
        .eq('student_id', studentId)
        .single();

      if (!quotaError && currentQuota) {
        const updates: any = {};

        if (mediaType === 'video') {
          updates.video_count = (currentQuota.video_count || 0) + 1;
        } else {
          updates.photo_count = (currentQuota.photo_count || 0) + 1;
        }

        updates.total_used_space = (currentQuota.total_used_space || 0) + file.size;
        updates.last_updated = new Date().toISOString();

        const { error: updateError } = await supabase
          .from('hanami_student_media_quota')
          .update(updates)
          .eq('student_id', studentId);

        if (updateError) {
          console.error('更新配額失敗:', updateError);
        } else {
          console.log('配額更新成功:', updates);
        }
      }
    } catch (quotaUpdateError) {
      console.error('配額更新錯誤:', quotaUpdateError);
    }

    step = 'success';
    // 確保返回的資料是有效的 JSON
    const responseData = {
      success: true,
      data: {
        id: dbData.id,
        student_id: dbData.student_id,
        media_type: dbData.media_type,
        file_name: dbData.file_name,
        file_path: dbData.file_path,
        file_size: dbData.file_size,
        title: dbData.title,
        publicUrl: urlData.publicUrl
      }
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error(`上傳處理核心錯誤 (步驟: ${step}):`, error);
    // 確保即使發生預期外的錯誤，也返回 JSON
    return NextResponse.json(
      {
        error: '上傳處理失敗 (Internal Server Error)',
        step: step,
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 