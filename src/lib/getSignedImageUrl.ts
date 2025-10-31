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
        const path = decodeURIComponent(match[1]);
        console.log('🔍 [Storage] 提取路徑成功:', path);
        return path;
      }
      
      // 嘗試更寬鬆的匹配
      const fallbackMatch = url.match(/ai-images\/(.+?)(?:\?|$)/);
      if (fallbackMatch && fallbackMatch[1]) {
        const path = decodeURIComponent(fallbackMatch[1]);
        console.log('🔍 [Storage] 使用 fallback 提取路徑:', path);
        return path;
      }
      
      console.warn('⚠️ [Storage] 無法從 URL 提取路徑:', url);
      return null;
    }
    
    // 如果已經是相對路徑，直接返回
    if (!url.startsWith('http') && !url.startsWith('/')) {
      console.log('🔍 [Storage] 使用相對路徑:', url);
      return url;
    }
    
    console.warn('⚠️ [Storage] 不支持的 URL 格式:', url);
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
  const supabase = createSaasClient();
  const storagePath = extractStoragePath(url);
  
  if (!storagePath) {
    console.warn('⚠️ [Storage] 無法提取路徑，返回原始 URL:', url);
    return url;
  }
  
  // 使用 getPublicUrl 生成公開 URL
  const { data } = supabase.storage
    .from('ai-images')
    .getPublicUrl(storagePath);
  
  if (data?.publicUrl) {
    console.log('✅ [Storage] 轉換為公開 URL:', data.publicUrl);
    return data.publicUrl;
  }
  
  console.warn('⚠️ [Storage] getPublicUrl 失敗，返回原始 URL');
  return url;
}

/**
 * 將 Supabase Storage URL 轉換為簡潔的 hanamiecho.com URL
 * @param url - Supabase Storage URL
 * @returns 簡潔的 URL（例如：https://hanamiecho.com/api/ai-images/pico-artist/filename.png）
 */
export function convertToShortUrl(url: string): string {
  const storagePath = extractStoragePath(url);
  
  if (!storagePath) {
    console.warn('⚠️ [Storage] 無法提取路徑，返回原始 URL:', url);
    return url;
  }
  
  // 構建簡潔 URL：https://hanamiecho.com/api/ai-images/[path]
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_BASE_URL || 'https://hanamiecho.com';
  
  const shortUrl = `${baseUrl}/api/ai-images/${storagePath}`;
  console.log('✅ [Storage] 轉換為簡潔 URL:', shortUrl);
  return shortUrl;
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
  console.log('🚀 [Storage] getSignedImageUrl 被調用（已改為 public bucket）:', imageUrl);
  
  // ⭐ bucket 已改為 public，直接轉換為公開 URL
  return convertToPublicUrl(imageUrl);
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
  console.log('🔍 [Storage] needsSignedUrl 檢查（public bucket）:', url);
  
  // ⭐ 如果 URL 已經是公開 URL，不需要轉換
  if (url.includes('/storage/v1/object/public/ai-images')) {
    console.log('ℹ️ [Storage] 已經是公開 URL，不需要轉換');
    return false;
  }
  
  // ⭐ 如果 URL 是 sign 或 authenticated 格式，需要轉換為 public
  if (url.includes('/storage/v1/object/sign/ai-images') || 
      url.includes('/storage/v1/object/authenticated/ai-images') ||
      (url.includes('ai-images') && !url.includes('/public/'))) {
    console.log('✅ [Storage] 需要轉換為公開 URL');
    return true;
  }
  
  console.log('❌ [Storage] 不需要轉換');
  return false;
}

