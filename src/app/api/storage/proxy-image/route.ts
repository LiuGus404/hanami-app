import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function guessContentType(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'application/octet-stream';
}

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 [Proxy] 收到圖片代理請求');
    const { searchParams } = new URL(request.url);
    let path = searchParams.get('path') || '';
    const download = searchParams.get('download') === '1' || searchParams.get('download') === 'true';

    console.log('📦 [Proxy] 請求參數:', { path, download });

    if (!path) {
      console.error('❌ [Proxy] 缺少 path 參數');
      return new Response(JSON.stringify({ success: false, error: 'Missing path' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      path = decodeURIComponent(path);
    } catch (e) {
      console.warn('⚠️ [Proxy] URL 解碼失敗，使用原始路徑');
    }
    path = path.replace(/^\/+/, '');
    
    console.log('🔍 [Proxy] 處理後的路徑:', path);
    console.log('🔍 [Proxy] 路徑長度:', path.length);
    console.log('🔍 [Proxy] 路徑編碼:', encodeURIComponent(path));

    // 先嘗試列出路徑所在的目錄，確認檔案是否存在
    const pathParts = path.split('/');
    const directory = pathParts.slice(0, -1).join('/');
    const fileName = pathParts[pathParts.length - 1];
    
    console.log('🔍 [Proxy] 目錄:', directory || '(根目錄)');
    console.log('🔍 [Proxy] 檔案名:', fileName);
    
    // 如果不在根目錄，先列出目錄內容（用於調試）
    if (directory) {
      try {
        const { data: listData, error: listError } = await supabaseAdmin.storage
          .from('ai-images')
          .list(directory, { limit: 100 });
        
        if (!listError && listData) {
          console.log('📂 [Proxy] 目錄內容:', listData.map(f => f.name));
          const fileExists = listData.some(f => f.name === fileName);
          console.log('📂 [Proxy] 檔案存在:', fileExists);
        } else {
          console.warn('⚠️ [Proxy] 無法列出目錄:', listError);
        }
      } catch (listErr) {
        console.warn('⚠️ [Proxy] 列出目錄異常:', listErr);
      }
    }

    console.log('📡 [Proxy] 開始從 Supabase Storage 下載...');
    const { data, error } = await supabaseAdmin.storage
      .from('ai-images')
      .download(path);

    console.log('📊 [Proxy] Supabase 下載結果:', { 
      hasData: !!data, 
      dataType: data?.constructor?.name,
      error: error ? { message: error.message, name: error.name } : null
    });

    if (error) {
      console.error('❌ [Proxy] Supabase 下載錯誤:', error);
      return new Response(JSON.stringify({ success: false, error: error.message || 'Download failed' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!data) {
      console.error('❌ [Proxy] 下載數據為空');
      return new Response(JSON.stringify({ success: false, error: 'File not found or empty' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const contentType = data.type || guessContentType(path);
    console.log('✅ [Proxy] 下載成功，Content-Type:', contentType, 'Size:', data.size, 'bytes');
    
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    // Cache briefly to reduce load but keep freshness
    headers.set('Cache-Control', 'private, max-age=60');
    if (download) {
      headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(path.split('/').pop() || 'file')}"`);
    }

    // Supabase download() 返回 Blob，需要轉換為 ArrayBuffer
    const arrayBuffer = await data.arrayBuffer();
    console.log('✅ [Proxy] 轉換完成，返回圖片數據');
    return new Response(arrayBuffer, { status: 200, headers });
  } catch (err) {
    console.error('❌ [Proxy] 異常錯誤:', err);
    console.error('❌ [Proxy] 錯誤詳情:', {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      name: err instanceof Error ? err.name : undefined
    });
    return new Response(JSON.stringify({ 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}


