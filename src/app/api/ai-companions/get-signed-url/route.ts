import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 使用 Service Role Key 的 Supabase Client（繞過 RLS）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * API Route: 生成 Supabase Storage Signed URL
 * 使用 Service Role Key 繞過 RLS 限制
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [API] 開始生成 Signed URL...');
    
    const body = await request.json();
    const { imageUrl, expiresIn = 3600, action, pathPrefix } = body as {
      imageUrl?: string;
      expiresIn?: number;
      action?: 'list' | 'sign';
      pathPrefix?: string;
    };

    console.log('📦 [API] 請求參數:', { imageUrl, expiresIn, action, pathPrefix });

    // 新增：目錄列出模式，便於診斷實際檔案結構
    if (action === 'list') {
      const prefix = (pathPrefix || '').replace(/^\/+|\/+$/g, '');
      console.log('📂 [API] 目錄列出模式，prefix =', prefix);
      const { data, error } = await supabaseAdmin.storage
        .from('ai-images')
        .list(prefix || undefined, { limit: 1000 });
      console.log('📂 [API] list 響應:', { count: data?.length, error });
      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true, files: data, prefix });
    }

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing imageUrl parameter' },
        { status: 400 }
      );
    }

    // 提取 Storage 路徑
    let storagePath: string;
    
    try {
      // 支援多種 URL 格式
      if (imageUrl.includes('/authenticated/')) {
        storagePath = imageUrl.split('/authenticated/ai-images/')[1];
      } else if (imageUrl.includes('/sign/')) {
        storagePath = imageUrl.split('/sign/ai-images/')[1].split('?')[0]; // 移除可能存在的 query params
      } else if (imageUrl.includes('/public/')) {
        storagePath = imageUrl.split('/public/ai-images/')[1];
      } else {
        // 假設已經是相對路徑
        storagePath = imageUrl;
      }

      // 安全解碼一次
      try {
        const decoded = decodeURIComponent(storagePath);
        storagePath = decoded;
      } catch {
        // 忽略解碼錯誤，使用原始路徑
      }

      // 去掉可能的前導斜線
      storagePath = storagePath.replace(/^\/+/, '');

      console.log('🔍 [API] 提取的 Storage 路徑:', storagePath);

      if (!storagePath) {
        throw new Error('無法提取 Storage 路徑');
      }
    } catch (error) {
      console.error('❌ [API] 路徑提取失敗:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid image URL format' },
        { status: 400 }
      );
    }

    // 使用 Service Role Key 生成 Signed URL
    console.log('📡 [API] 調用 Supabase createSignedUrl (Service Role)...', { storagePath, expiresIn });
    const { data, error } = await supabaseAdmin.storage
      .from('ai-images')
      .createSignedUrl(storagePath, expiresIn);

    console.log('📊 [API] createSignedUrl 響應:', { data, error });

    if (error) {
      console.error('❌ [API] 生成 Signed URL 失敗:', error);

      // 進一步診斷：列出同資料夾內檔案，確認目標檔案是否存在/路徑是否正確
      try {
        const lastSlashIdx = storagePath.lastIndexOf('/')
        const dir = lastSlashIdx > -1 ? storagePath.slice(0, lastSlashIdx) : '';
        const filename = lastSlashIdx > -1 ? storagePath.slice(lastSlashIdx + 1) : storagePath;
        console.log('🔎 [API] 準備列出資料夾內容以診斷: ', { dir, filename });

        const listRes = await supabaseAdmin.storage
          .from('ai-images')
          .list(dir || undefined, { limit: 100, search: filename });
        console.log('📂 [API] 資料夾列出結果:', listRes);
      } catch (listErr) {
        console.error('❌ [API] 列出資料夾內容失敗:', listErr);
      }

      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to generate signed URL: ${error.message}`,
          details: {
            message: error.message,
            statusCode: (error as any).statusCode,
            status: (error as any).status
          }
        },
        { status: 500 }
      );
    }

    if (!data || !data.signedUrl) {
      console.error('❌ [API] 沒有返回 signedUrl');
      return NextResponse.json(
        { success: false, error: 'No signed URL returned' },
        { status: 500 }
      );
    }

    console.log('✅ [API] Signed URL 生成成功!');
    console.log('🔗 [API] 新 URL:', data.signedUrl);

    return NextResponse.json({
      success: true,
      signedUrl: data.signedUrl
    });

  } catch (error) {
    console.error('❌ [API] 意外錯誤:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

