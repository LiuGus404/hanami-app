import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // 檢查環境變數
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('缺少環境變數:', {
        supabaseUrl: !!supabaseUrl,
        supabaseServiceKey: !!supabaseServiceKey
      });
      return NextResponse.json(
        { error: '伺服器配置錯誤' },
        { status: 500 }
      );
    }

    // 創建服務端 Supabase 客戶端
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const studentId = formData.get('studentId') as string;
    const mediaType = formData.get('mediaType') as string;

    if (!file || !studentId || !mediaType) {
      return NextResponse.json(
        { error: '缺少必要參數' },
        { status: 400 }
      );
    }

    console.log('開始上傳檔案:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      studentId,
      mediaType
    });

    // 生成檔案路徑
    const fileExt = file.name.split('.').pop();
    const fileName = `${studentId}/${mediaType}s/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

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

    // 獲取公開 URL
    const { data: urlData } = supabase.storage
      .from('hanami-media')
      .getPublicUrl(fileName);

    // 準備資料庫資料
    const mediaData = {
      student_id: studentId,
      media_type: mediaType,
      file_name: file.name,
      file_path: fileName,
      file_size: file.size,
      title: file.name.replace(/\.[^/.]+$/, ''),
      uploaded_by: null // 設為 null 而不是字串
    };

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
    console.error('上傳處理錯誤:', error);
    return NextResponse.json(
      { error: '上傳處理失敗' },
      { status: 500 }
    );
  }
} 