import { NextRequest, NextResponse } from 'next/server';
import { getSaasSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const amount = parseFloat(formData.get('amount') as string);
    const description = formData.get('description') as string;
    const metadataStr = formData.get('metadata') as string;
    const userId = formData.get('userId') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: '請選擇要上傳的檔案' },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: '請輸入有效的付款金額' },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        { success: false, error: '請輸入付款說明' },
        { status: 400 }
      );
    }

    // 驗證檔案類型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: '請選擇圖片檔案 (JPG, PNG, GIF, WebP)' },
        { status: 400 }
      );
    }

    // 驗證檔案大小 (最大 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: '檔案大小不能超過 10MB' },
        { status: 400 }
      );
    }

    const supabase = getSaasSupabaseClient();

    // 生成按日期組織的檔案路徑
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateFolder = `${year}-${month}-${day}`;
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const fileExt = file.name.split('.').pop();
    const fileName = `payment-screenshots/${dateFolder}/${timestamp}-${randomId}.${fileExt}`;

    // 上傳檔案到 Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('hanami-saas-system')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('檔案上傳錯誤:', uploadError);
      return NextResponse.json(
        { success: false, error: '檔案上傳失敗，請稍後再試' },
        { status: 500 }
      );
    }

    // 獲取公開 URL
    const { data: urlData } = supabase.storage
      .from('hanami-saas-system')
      .getPublicUrl(fileName);

    // 同時獲取簽名 URL 作為備用
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('hanami-saas-system')
      .createSignedUrl(fileName, 3600); // 1小時有效期

    console.log('公開 URL:', urlData.publicUrl);
    console.log('簽名 URL:', signedUrlData?.signedUrl);
    console.log('簽名 URL 錯誤:', signedUrlError);

    // 解析元數據
    let metadata = {};
    if (metadataStr) {
      try {
        metadata = JSON.parse(metadataStr);
      } catch (error) {
        console.warn('元數據解析失敗:', error);
      }
    }

    // 記錄付款資訊到資料庫
    const { data: recordData, error: dbError } = await (supabase as any)
      .from('payment_records')
      .insert({
        payment_method: 'screenshot',
        amount: amount,
        currency: 'HKD',
        description: description,
        screenshot_url: urlData.publicUrl,
        file_name: fileName,
        status: 'pending',
        user_id: userId, // 添加用戶 ID
        created_at: new Date().toISOString(),
        metadata: {
          ...metadata,
          date_folder: dateFolder,
          upload_date: dateFolder,
          original_filename: file.name,
          file_size: file.size,
          file_type: file.type
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error('資料庫記錄錯誤:', dbError);
      return NextResponse.json(
        { success: false, error: '付款記錄創建失敗，請稍後再試' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '付款截圖上傳成功！我們將盡快確認您的付款。',
      data: {
        record_id: recordData.id,
        screenshot_url: signedUrlData?.signedUrl || urlData.publicUrl,
        public_url: urlData.publicUrl,
        signed_url: signedUrlData?.signedUrl,
        file_name: fileName,
        amount: amount,
        description: description
      }
    });

  } catch (error) {
    console.error('截圖上傳 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '伺服器錯誤，請稍後再試' },
      { status: 500 }
    );
  }
}
