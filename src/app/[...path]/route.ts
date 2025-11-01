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
 * API Route: 處理簡潔的圖片 URL（根路徑格式）
 * 格式: /pico-artist/filename.png
 * 注意：此路由需要檢查路徑格式，避免與其他路由衝突
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  try {
    // ⭐ Next.js 15+ 中 params 可能是 Promise，需要 await
    const resolvedParams = await Promise.resolve(params);
    
    // 組合完整路徑
    const requestPath = resolvedParams.path.join('/');
    
    console.log('🖼️ [根路徑] 收到請求，路徑:', requestPath);
    
    // ⭐ 檢查是否為圖片路徑（避免與其他路由衝突）
    // 只處理包含常見圖片副檔名的路徑
    const imageExtensionPattern = /\.(png|jpg|jpeg|webp|gif)$/i;
    if (!imageExtensionPattern.test(requestPath)) {
      console.log('⚠️ [根路徑] 不是圖片路徑，返回 404');
      return NextResponse.json({ 
        success: false, 
        error: 'Not an image path' 
      }, { 
        status: 404 
      });
    }
    
    // ⭐ 根據路徑格式推斷完整 Storage 路徑
    // 格式可能是：role_name/filename.png
    // 需要找到對應的 user_id，或者嘗試直接查找
    // 簡化方案：嘗試多種可能的路徑格式
    
    // 方案 1：直接嘗試 role_name/filename.png（如果 Supabase 中有唯一檔案）
    // 方案 2：從資料庫查詢對應的 user_id
    // 方案 3：使用通配符搜尋（不支援，改用方案 1）
    
    // ⭐ 先嘗試直接下載（如果檔案在 Storage 中可以直接通過 role_name/filename 訪問）
    // 如果失敗，可能需要查詢資料庫找到對應的 user_id
    
    let storagePath = requestPath; // 預設使用請求路徑
    
    // 嘗試從 Supabase Storage 下載
    let data = null;
    let error = null;
    
    // 嘗試 1：直接使用請求路徑
    let result = await supabaseAdmin.storage
      .from('ai-images')
      .download(storagePath);
    
    data = result.data;
    error = result.error;
    
    // 如果失敗，嘗試在子目錄中搜尋（如果需要 user_id）
    if (error) {
      console.log('⚠️ [根路徑] 直接路徑失敗，嘗試查詢資料庫找到完整路徑...');
      
      // 從檔案名提取可能的資訊
      const fileName = requestPath.split('/').pop() || '';
      const roleName = requestPath.split('/')[0];
      
      console.log('🔍 [根路徑] 搜尋檔案名:', fileName, '角色:', roleName);
      
      // ⭐ 改進查詢：精確匹配檔案名
      // 檔案名格式通常是：gemini_timestamp_uuid.png
      // 我們需要匹配完整的檔案名或至少匹配 timestamp 部分
      const fileNameParts = fileName.split('_');
      const fileNamePrefix = fileNameParts.length > 0 ? fileNameParts[0] : '';
      const timestampPart = fileNameParts.length > 1 ? fileNameParts[1] : null;
      
      // 構建查詢條件：精確匹配檔案名
      let query = supabaseAdmin
        .from('chat_messages')
        .select('content, content_json')
        .ilike('content', `%${fileName}%`);
      
      // 如果有 timestamp，也加入查詢條件
      if (timestampPart) {
        query = query.or(`content.ilike.%${fileName}%,content.ilike.%${timestampPart}%`);
      }
      
      const { data: messages, error: queryError } = await query
        .order('created_at', { ascending: false })
        .limit(50); // 增加查詢數量
      
      if (queryError) {
        console.error('❌ [根路徑] 資料庫查詢錯誤:', queryError);
      }
      
      console.log('🔍 [根路徑] 找到', messages?.length || 0, '條相關訊息');
      
      if (messages && messages.length > 0) {
        // 遍歷訊息，嘗試提取完整 URL
        for (const message of messages) {
          const content = message.content || '';
          const contentJson = message.content_json || {};
          
          // 嘗試從 content 中提取 URL
          const urlMatch = content.match(/https?:\/\/[^\s]+\.(?:png|jpg|jpeg|webp|gif)(?:\?[^\s]*)?/i);
          
          // 或從 content_json 中提取
          const jsonImageUrl = contentJson?.image_url || contentJson?.url || '';
          
          // 檢查 URL 是否包含目標檔案名
          const testUrl = urlMatch ? urlMatch[0] : jsonImageUrl;
          
          if (testUrl && (testUrl.includes(fileName) || testUrl.includes(fileNamePrefix))) {
            console.log('✅ [根路徑] 找到匹配的 URL:', testUrl);
            
            // 提取 Storage 路徑（支援多種 URL 格式）
            let extractedPath = null;
            
            // 格式 1: /storage/v1/object/public/ai-images/[path]
            let pathMatch = testUrl.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/ai-images\/([^?]+)/);
            if (pathMatch && pathMatch[1]) {
              extractedPath = decodeURIComponent(pathMatch[1]);
            }
            
            // 格式 2: ai-images/[path]
            if (!extractedPath) {
              pathMatch = testUrl.match(/ai-images\/([^?]+)/);
              if (pathMatch && pathMatch[1]) {
                extractedPath = decodeURIComponent(pathMatch[1]);
              }
            }
            
            if (extractedPath) {
              storagePath = extractedPath;
              console.log('✅ [根路徑] 從資料庫找到完整路徑:', storagePath);
              
              // 再次嘗試下載
              result = await supabaseAdmin.storage
                .from('ai-images')
                .download(storagePath);
              
              data = result.data;
              error = result.error;
              
              if (!error && data) {
                console.log('✅ [根路徑] 使用完整路徑下載成功');
                break; // 成功後跳出循環
              } else {
                console.warn('⚠️ [根路徑] 完整路徑下載失敗，繼續搜尋...');
              }
            }
          }
        }
      }
      
      // 如果還是失敗，嘗試列出 Storage 目錄來查找（需要遍歷所有 user_id 目錄）
      if (error) {
        console.log('⚠️ [根路徑] 資料庫查詢未找到，嘗試列出 Storage 目錄...');
        
        // ⭐ 先列出根目錄，找到所有 user_id 目錄
        const { data: rootFiles, error: rootListError } = await supabaseAdmin.storage
          .from('ai-images')
          .list('', {
            limit: 1000
          });
        
        if (!rootListError && rootFiles) {
          console.log('📂 [根路徑] 根目錄找到', rootFiles.length, '個項目');
          
          // 過濾出目錄（通常是 UUID 格式的 user_id）
          const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const userDirs = rootFiles.filter(f => !f.name.includes('.') && uuidPattern.test(f.name));
          
          console.log('📂 [根路徑] 找到', userDirs.length, '個用戶目錄');
          
          // 遍歷每個用戶目錄，查找 role_name 子目錄
          for (const userDir of userDirs.slice(0, 10)) { // 限制搜尋前 10 個用戶
            const { data: roleFiles, error: roleListError } = await supabaseAdmin.storage
              .from('ai-images')
              .list(`${userDir.name}/${roleName}`, {
                limit: 100
              });
            
            if (!roleListError && roleFiles) {
              // 查找匹配的檔案名
              const matchingFile = roleFiles.find(f => 
                f.name === fileName || 
                f.name.includes(fileName.split('_')[0]) ||
                (timestampPart && f.name.includes(timestampPart))
              );
              
              if (matchingFile) {
                storagePath = `${userDir.name}/${roleName}/${matchingFile.name}`;
                console.log('✅ [根路徑] 從目錄列表找到路徑:', storagePath);
                
                // 再次嘗試下載
                result = await supabaseAdmin.storage
                  .from('ai-images')
                  .download(storagePath);
                
                data = result.data;
                error = result.error;
                
                if (!error && data) {
                  break; // 成功後跳出循環
                }
              }
            }
          }
        }
      }
    }
    
    if (error) {
      console.error('❌ [根路徑] Supabase 下載錯誤:', error);
      console.error('❌ [根路徑] 錯誤訊息:', error.message);
      
      const errorMessage = error.message || 
                          (error as any)?.error_description || 
                          (error as any)?.statusText ||
                          'Download failed';
      
      return NextResponse.json({ 
        success: false, 
        error: errorMessage,
        details: { 
          requestPath,
          storagePath,
          errorType: error.name || 'Unknown',
          statusCode: (error as any)?.statusCode || 'N/A'
        }
      }, { 
        status: 404
      });
    }
    
    if (!data) {
      console.error('❌ [根路徑] 下載數據為空，路徑:', storagePath);
      return NextResponse.json({ 
        success: false, 
        error: 'File not found or empty',
        details: { requestPath, storagePath }
      }, { 
        status: 404
      });
    }
    
    const contentType = data.type || guessContentType(storagePath);
    console.log('✅ [根路徑] 下載成功，Content-Type:', contentType, 'Size:', data.size, 'bytes');
    
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    
    const arrayBuffer = await data.arrayBuffer();
    console.log('✅ [根路徑] 返回圖片數據');
    return new Response(arrayBuffer, { status: 200, headers });
  } catch (err) {
    console.error('❌ [根路徑] 異常錯誤:', err);
    console.error('❌ [根路徑] 錯誤堆疊:', err instanceof Error ? err.stack : 'N/A');
    return NextResponse.json({ 
      success: false, 
      error: err instanceof Error ? err.message : String(err) || 'Unknown error'
    }, { 
      status: 500
    });
  }
}

