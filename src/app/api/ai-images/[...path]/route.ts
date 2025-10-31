import { NextRequest, NextResponse } from 'next/server';
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

/**
 * API Route: 處理簡潔的圖片 URL
 * 格式: /api/ai-images/pico-artist/filename.png
 * 或: /api/ai-images/user_id/role_name/filename.png
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // 組合完整路徑
    const storagePath = params.path.join('/');
    
    console.log('🖼️ [簡潔 URL] 收到請求，路徑:', storagePath);

    // 從 Supabase Storage 下載圖片
    const { data, error } = await supabaseAdmin.storage
      .from('ai-images')
      .download(storagePath);

    if (error) {
      console.error('❌ [簡潔 URL] Supabase 下載錯誤:', error);
      return new Response(JSON.stringify({ success: false, error: error.message || 'Download failed' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!data) {
      console.error('❌ [簡潔 URL] 下載數據為空');
      return new Response(JSON.stringify({ success: false, error: 'File not found or empty' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const contentType = data.type || guessContentType(storagePath);
    console.log('✅ [簡潔 URL] 下載成功，Content-Type:', contentType, 'Size:', data.size, 'bytes');
    
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable'); // 長期快取
    
    const arrayBuffer = await data.arrayBuffer();
    console.log('✅ [簡潔 URL] 返回圖片數據');
    return new Response(arrayBuffer, { status: 200, headers });
  } catch (err) {
    console.error('❌ [簡潔 URL] 異常錯誤:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

