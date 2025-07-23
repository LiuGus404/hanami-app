import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 獲取學生的媒體列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const mediaType = searchParams.get('media_type');

    if (!studentId) {
      return NextResponse.json(
        { error: '缺少學生 ID' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('hanami_student_media')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (mediaType) {
      query = query.eq('media_type', mediaType);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('獲取媒體列表失敗:', error);
    return NextResponse.json(
      { error: '獲取媒體列表失敗' },
      { status: 500 }
    );
  }
}

// 上傳媒體檔案
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const studentId = formData.get('student_id') as string;
    const mediaType = formData.get('media_type') as string;
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    if (!studentId || !mediaType || !file) {
      return NextResponse.json(
        { error: '缺少必要參數' },
        { status: 400 }
      );
    }

    // 檢查配額
    const { data: quota, error: quotaError } = await supabase
      .from('hanami_student_media_quota')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (quotaError) throw quotaError;

    // 檢查數量限制
    const { data: currentMedia, error: countError } = await supabase
      .from('hanami_student_media')
      .select('id')
      .eq('student_id', studentId)
      .eq('media_type', mediaType);

    if (countError) throw countError;

    const currentCount = currentMedia?.length || 0;
    const limit = mediaType === 'video' ? quota.video_limit : quota.photo_limit;

    if (currentCount >= limit) {
      return NextResponse.json(
        { error: `已達到${mediaType === 'video' ? '影片' : '相片'}數量上限` },
        { status: 400 }
      );
    }

    // 檢查檔案大小
    const maxSize = mediaType === 'video' ? 20 * 1024 * 1024 : 1 * 1024 * 1024; // 20MB for video, 1MB for photo
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `檔案大小不能超過 ${maxSize / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // 生成檔案路徑
    const fileExt = file.name.split('.').pop();
    const fileName = `${studentId}/${mediaType}s/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

    // 上傳到 Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('hanami-media')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // 儲存到資料庫
    const mediaData = {
      student_id: studentId,
      media_type: mediaType,
      file_name: file.name,
      file_path: fileName,
      file_size: file.size,
      title: title || file.name.replace(/\.[^/.]+$/, ''),
      description: description || null,
      uploaded_by: 'current_user_id', // 需要從 context 獲取
    };

    const { data: dbData, error: dbError } = await supabase
      .from('hanami_student_media')
      .insert(mediaData)
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json(dbData);
  } catch (error) {
    console.error('上傳媒體失敗:', error);
    return NextResponse.json(
      { error: '上傳媒體失敗' },
      { status: 500 }
    );
  }
}

// 刪除媒體檔案
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('id');

    if (!mediaId) {
      return NextResponse.json(
        { error: '缺少媒體 ID' },
        { status: 400 }
      );
    }

    // 獲取媒體資訊
    const { data: media, error: fetchError } = await supabase
      .from('hanami_student_media')
      .select('*')
      .eq('id', mediaId)
      .single();

    if (fetchError) throw fetchError;

    // 從 Storage 刪除檔案
    const { error: storageError } = await supabase.storage
      .from('hanami-media')
      .remove([media.file_path]);

    if (storageError) throw storageError;

    // 從資料庫刪除記錄
    const { error: dbError } = await supabase
      .from('hanami_student_media')
      .delete()
      .eq('id', mediaId);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('刪除媒體失敗:', error);
    return NextResponse.json(
      { error: '刪除媒體失敗' },
      { status: 500 }
    );
  }
} 