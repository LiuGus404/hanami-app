import { createSaasClient } from './supabase-saas';

/**
 * 從前端獲取 Supabase access token
 * 用於在 API 請求中發送認證信息
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    console.log('[getAccessToken] 開始獲取 access token...');
    const supabase = createSaasClient();
    
    // 添加超時處理
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise<{ data: { session: null }, error: Error }>((resolve) => {
      setTimeout(() => {
        resolve({
          data: { session: null },
          error: new Error('獲取 session 超時（5秒）')
        });
      }, 5000);
    });
    
    const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);
    
    if (error) {
      console.warn('[getAccessToken] 無法獲取 access token:', error?.message);
      return null;
    }
    
    if (!session?.access_token) {
      console.warn('[getAccessToken] session 中沒有 access_token');
      return null;
    }
    
    console.log('[getAccessToken] 成功獲取 access token');
    return session.access_token;
  } catch (error) {
    console.error('[getAccessToken] 獲取 access token 錯誤:', error);
    return null;
  }
}

