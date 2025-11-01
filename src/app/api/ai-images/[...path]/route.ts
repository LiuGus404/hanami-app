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
  { params }: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  try {
    // ⭐ Next.js 15+ 中 params 可能是 Promise，需要 await
    const resolvedParams = await Promise.resolve(params);
    
    // 組合完整路徑（可能是編碼的完整路徑）
    let storagePath = resolvedParams.path.join('/');
    
    // ⭐ 如果路徑是 URL 編碼的，解碼它
    try {
      storagePath = decodeURIComponent(storagePath);
    } catch (e) {
      // 如果解碼失敗，使用原始路徑
      console.warn('⚠️ [API] URL 解碼失敗，使用原始路徑');
    }
    
    console.log('🖼️ [API] 收到請求，路徑:', storagePath);
    console.log('🖼️ [API] 原始 params:', resolvedParams);
    console.log('🖼️ [API] path 陣列:', resolvedParams.path);

    // 從 Supabase Storage 下載圖片
    const { data, error } = await supabaseAdmin.storage
      .from('ai-images')
      .download(storagePath);

    if (error) {
      console.error('❌ [簡潔 URL] Supabase 下載錯誤:', error);
      console.error('❌ [簡潔 URL] 錯誤訊息:', error.message);
      console.error('❌ [簡潔 URL] 錯誤狀態:', (error as any)?.statusCode);
      console.error('❌ [簡潔 URL] 錯誤名稱:', error.name);
      console.error('❌ [簡潔 URL] 完整錯誤對象:', JSON.stringify(error, null, 2));
      
      // 安全地提取錯誤訊息
      let errorMessage = 'Download failed';
      let errorType = 'StorageUnknownError';
      let statusCode = 'N/A';
      
      try {
        // 嘗試從錯誤對象中提取訊息
        if (error.message) {
          errorMessage = error.message;
        } else if ((error as any)?.error_description) {
          errorMessage = (error as any).error_description;
        } else if ((error as any)?.statusText) {
          errorMessage = (error as any).statusText;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else {
          // 嘗試序列化錯誤對象
          const errorStr = JSON.stringify(error);
          if (errorStr && errorStr !== '{}') {
            errorMessage = errorStr;
          }
        }
        
        // 提取錯誤類型
        if (error.name) {
          errorType = error.name;
        } else if ((error as any)?.error) {
          errorType = (error as any).error;
        }
        
        // 提取狀態碼
        if ((error as any)?.statusCode) {
          statusCode = String((error as any).statusCode);
        } else if ((error as any)?.status) {
          statusCode = String((error as any).status);
        }
      } catch (parseError) {
        console.error('❌ [簡潔 URL] 錯誤解析失敗:', parseError);
        errorMessage = 'Unknown storage error';
      }
      
      console.error('❌ [簡潔 URL] 最終錯誤資訊:', {
        errorMessage,
        errorType,
        statusCode,
        storagePath
      });
      
      return NextResponse.json({ 
        success: false, 
        error: errorMessage,
        details: { 
          storagePath, 
          errorType,
          statusCode
        }
      }, { 
        status: 404
      });
    }

    if (!data) {
      console.error('❌ [簡潔 URL] 下載數據為空，路徑:', storagePath);
      return NextResponse.json({ 
        success: false, 
        error: 'File not found or empty',
        details: { 
          storagePath,
          errorType: 'FileNotFound',
          statusCode: '404'
        }
      }, { 
        status: 404
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
    console.error('❌ [簡潔 URL] 錯誤堆疊:', err instanceof Error ? err.stack : 'N/A');
    return NextResponse.json({ 
      success: false, 
      error: err instanceof Error ? err.message : String(err) || 'Unknown error',
      details: { 
        errorType: err instanceof Error ? err.name : typeof err,
        params: params instanceof Promise ? 'Promise' : params
      }
    }, { 
      status: 500
    });
  }
}

