import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 創建 Supabase 客戶端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL!;
const supabaseServiceKey = process.env.SUPABASE_SAAS_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('imageUrl');
    const userId = searchParams.get('userId');

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: '缺少圖片 URL 參數' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少用戶 ID 參數' },
        { status: 400 }
      );
    }

    // 從 URL 中提取檔案路徑
    // 例如: https://xxx.supabase.co/storage/v1/object/public/hanami-saas-system/payment-screenshots/2024-01-01/file.jpg
    const urlParts = imageUrl.split('/storage/v1/object/public/hanami-saas-system/');
    if (urlParts.length !== 2) {
      return NextResponse.json(
        { success: false, error: '無效的圖片 URL 格式' },
        { status: 400 }
      );
    }

    const filePath = urlParts[1];

    // 驗證用戶是否有權限刪除這張圖片
    // 查詢 payment_records 表確認圖片屬於該用戶
    console.log('查詢付款記錄，URL:', imageUrl);
    console.log('查詢付款記錄，用戶 ID:', userId);
    
    const { data: paymentRecord, error: fetchError } = await supabase
      .from('payment_records')
      .select('id, user_id, screenshot_url, file_name')
      .eq('screenshot_url', imageUrl)
      .single();
    
    console.log('查詢結果:', paymentRecord);
    console.log('查詢錯誤:', fetchError);
    
    // 檢查用戶權限
    if (paymentRecord && paymentRecord.user_id !== userId) {
      console.log('用戶權限檢查失敗:', paymentRecord.user_id, 'vs', userId);
      return NextResponse.json(
        { success: false, error: '無權限刪除此圖片' },
        { status: 403 }
      );
    }

    if (fetchError || !paymentRecord) {
      return NextResponse.json(
        { success: false, error: '找不到對應的付款記錄或無權限刪除' },
        { status: 403 }
      );
    }

    // 從 Supabase Storage 刪除檔案
    const { error: deleteError } = await supabase.storage
      .from('hanami-saas-system')
      .remove([filePath]);

    if (deleteError) {
      console.error('刪除 Storage 檔案失敗:', deleteError);
      return NextResponse.json(
        { success: false, error: '刪除檔案失敗' },
        { status: 500 }
      );
    }

    // 更新資料庫記錄，清除截圖相關欄位
    const { error: updateError } = await supabase
      .from('payment_records')
      .update({
        screenshot_url: null,
        file_name: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentRecord.id);

    if (updateError) {
      console.error('更新資料庫記錄失敗:', updateError);
      return NextResponse.json(
        { success: false, error: '更新記錄失敗' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '圖片刪除成功',
      deletedFile: filePath
    });

  } catch (error) {
    console.error('刪除圖片 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '伺服器內部錯誤' },
      { status: 500 }
    );
  }
}
