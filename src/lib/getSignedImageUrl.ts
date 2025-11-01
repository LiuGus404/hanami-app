/**
 * 處理 Supabase Storage 的公開 URL
 * ⭐ ai-images bucket 已改為 public，直接使用公開 URL
 */

import { createSaasClient } from './supabase-saas';

/**
 * 從完整的 URL 中提取 Storage 路徑
 * @param url - 完整的 Supabase Storage URL 或相對路徑
 * @returns Storage 路徑（例如：user_id/role_name/filename.png）
 */
export function extractStoragePath(url: string): string | null {
  try {
    // 如果是完整 URL，提取路徑部分
    if (url.startsWith('http')) {
      // 支援多種格式：
      // - /storage/v1/object/public/ai-images/[PATH]
      // - /storage/v1/object/sign/ai-images/[PATH]?token=...
      // - /storage/v1/object/authenticated/ai-images/[PATH]
      const match = url.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/ai-images\/([^?]+)/);
      if (match && match[1]) {
        let path = match[1];
        // 嘗試解碼，如果失敗則使用原始路徑
        try {
          path = decodeURIComponent(path);
        } catch {
          // 如果解碼失敗，可能已經是解碼過的，直接使用
        }
        return path;
      }
      
      // 嘗試更寬鬆的匹配（包含完整域名）
      const fallbackMatch = url.match(/ai-images\/(.+?)(?:\?|$)/);
      if (fallbackMatch && fallbackMatch[1]) {
        let path = fallbackMatch[1];
        try {
          path = decodeURIComponent(path);
        } catch {
          // 如果解碼失敗，可能已經是解碼過的，直接使用
        }
        return path;
      }
      
      return null;
    }
    
    // 如果已經是相對路徑，直接返回
    if (!url.startsWith('http') && !url.startsWith('/')) {
      return url;
    }
    
    // 如果是以 /api/ai-images/ 開頭的路徑
    if (url.startsWith('/api/ai-images/')) {
      const path = url.replace('/api/ai-images/', '');
      try {
        const decoded = decodeURIComponent(path);
        return decoded;
      } catch {
        return path;
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ [Storage] 提取路徑失敗:', error);
    return null;
  }
}

/**
 * 將 URL 轉換為公開 URL（bucket 已改為 public）
 * @param url - 原始 URL（可能是 sign、authenticated 或 public 格式）
 * @returns 公開 URL
 */
export function convertToPublicUrl(url: string): string {
  // ⭐ 如果已經是公開 URL，直接返回
  if (url.includes('/storage/v1/object/public/ai-images')) {
    return url;
  }
  
  const supabase = createSaasClient();
  const storagePath = extractStoragePath(url);
  
  if (!storagePath) {
    console.warn('⚠️ [Storage] 無法提取存儲路徑:', url);
    return url;
  }
  
  // 使用 getPublicUrl 生成公開 URL
  const { data } = supabase.storage
    .from('ai-images')
    .getPublicUrl(storagePath);
  
  if (data?.publicUrl) {
    const publicUrl = data.publicUrl;
    // 驗證返回的 URL 是公開格式
    if (publicUrl.includes('/storage/v1/object/public/ai-images')) {
      return publicUrl;
    } else {
      console.warn('⚠️ [Storage] getPublicUrl 返回的 URL 格式不正確:', publicUrl);
      return url;
    }
  }
  
  console.warn('⚠️ [Storage] getPublicUrl 返回空數據，使用原始 URL');
  return url;
}

/**
 * 將 Supabase Storage URL 轉換為簡潔的 hanamiecho.com URL
 * @param url - Supabase Storage URL
 * @returns 簡潔的 URL（例如：https://hanamiecho.com/pico-artist/filename.png）
 * ⭐ 注意：實際 API 路由會使用完整路徑（包含 user_id），但顯示時只顯示簡潔部分
 */
export function convertToShortUrl(url: string): string {
  const storagePath = extractStoragePath(url);
  
  if (!storagePath) {
    return url;
  }
  
  // ⭐ 移除 user_id 部分，只保留 role_name/filename.png（用於顯示）
  const pathParts = storagePath.split('/');
  let shortPath = storagePath;
  
  // 如果路徑包含 UUID（通常是 user_id），跳過它
  if (pathParts.length >= 2) {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(pathParts[0])) {
      shortPath = pathParts.slice(1).join('/');
    }
  }
  
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_BASE_URL || 'https://hanamiecho.com';
  
  // ⭐ 使用 /api/ai-images/ 路由，並將完整路徑編碼在 URL 中
  // 這樣 API 路由可以直接使用完整路徑，不需要查詢資料庫
  const encodedPath = encodeURIComponent(storagePath);
  const apiUrl = `${baseUrl}/api/ai-images/${encodedPath}`;
  
  return apiUrl;
}

/**
 * 獲取簡潔的顯示 URL（僅用於顯示，不包含完整路徑）
 * @param url - Supabase Storage URL
 * @returns 簡潔的顯示 URL（例如：hanamiecho.com/pico-artist/filename.png）
 */
export function getShortDisplayUrl(url: string): string {
  const storagePath = extractStoragePath(url);
  
  if (!storagePath) {
    return url;
  }
  
  const pathParts = storagePath.split('/');
  let shortPath = storagePath;
  
  if (pathParts.length >= 2) {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(pathParts[0])) {
      shortPath = pathParts.slice(1).join('/');
    }
  }
  
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_BASE_URL || 'https://hanamiecho.com';
  
  return `${baseUrl}/${shortPath}`;
}

/**
 * 獲取圖片 URL（bucket 已改為 public，直接轉換為公開 URL）
 * @param imageUrl - 圖片 URL（完整 URL 或相對路徑）
 * @param expiresIn - 已棄用（保留為兼容性參數）
 * @returns 公開 URL
 */
export async function getSignedImageUrl(
  imageUrl: string,
  expiresIn: number = 3600 // 已棄用，保留為兼容性
): Promise<string> {
  try {
    // ⭐ bucket 已改為 public，直接轉換為公開 URL
    const publicUrl = convertToPublicUrl(imageUrl);
    return publicUrl;
  } catch (error) {
    console.error('❌ [Storage] getSignedImageUrl 錯誤');
    // 發生錯誤時返回原始 URL，讓 SecureImageDisplay 處理錯誤顯示
    return imageUrl;
  }
}

/**
 * 批量生成 Signed URLs
 * @param imageUrls - 圖片 URL 陣列
 * @param expiresIn - 有效期（秒），預設 1 小時
 * @returns Signed URLs 陣列
 */
export async function getSignedImageUrls(
  imageUrls: string[],
  expiresIn: number = 3600
): Promise<string[]> {
  const promises = imageUrls.map(url => getSignedImageUrl(url, expiresIn));
  return Promise.all(promises);
}

/**
 * 檢查 URL 是否需要轉換為公開 URL
 * ⭐ bucket 已改為 public，只需要將 sign/authenticated URL 轉換為 public URL
 * @param url - 圖片 URL
 * @returns true 如果需要轉換（例如是 sign 或 authenticated URL）
 */
export function needsSignedUrl(url: string): boolean {
  // ⭐ 如果 URL 已經是公開 URL，不需要轉換
  if (url.includes('/storage/v1/object/public/ai-images')) {
    return false;
  }
  
  // ⭐ 如果 URL 是 sign 或 authenticated 格式，需要轉換為 public
  if (url.includes('/storage/v1/object/sign/ai-images') || 
      url.includes('/storage/v1/object/authenticated/ai-images') ||
      (url.includes('ai-images') && !url.includes('/public/'))) {
    return true;
  }
  
  return false;
}

