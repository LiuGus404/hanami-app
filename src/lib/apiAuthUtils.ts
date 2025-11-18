import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { createSaasRouteHandlerClient } from './supabase-saas-route-handler';
import { NextRequest } from 'next/server';

/**
 * 從請求頭中獲取 access token
 */
function getAccessTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

/**
 * 從新 Supabase（SaaS）獲取用戶會話
 * 用於 API 路由中的認證
 * 支持多種認證方式：
 * 1. Supabase session cookies（優先）
 * 2. Authorization header 中的 access token
 * 3. X-User-Email header（備選，用於沒有有效會話的情況）
 */
export async function getSaasUserSession(request?: Request) {
  try {
    const saasUrl = process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL;
    const saasAnonKey = process.env.NEXT_PUBLIC_SUPABASE_SAAS_ANON_KEY;
    
    if (!saasUrl || !saasAnonKey) {
      console.warn('[getSaasUserSession] 缺少 SaaS Supabase 環境變數');
      return null;
    }

    console.log('[getSaasUserSession] 開始獲取會話...');

    // 方法 0: 優先從 Authorization header 中獲取 token（如果提供了 request）
    if (request) {
      const accessToken = getAccessTokenFromRequest(request);
      if (accessToken) {
        console.log('[getSaasUserSession] 從 Authorization header 獲取 token');
        const supabase = createClient(saasUrl, saasAnonKey, {
          auth: {
            storageKey: 'hanamiecho-auth',
            autoRefreshToken: false,
            persistSession: false,
          },
        });
        
        const { data: { user }, error } = await supabase.auth.getUser(accessToken);
        
        if (!error && user) {
          console.log('[getSaasUserSession] ✅ 成功從 Authorization header 獲取用戶');
          return {
            user: {
              email: user.email || null,
              id: user.id,
            },
          };
        } else {
          console.warn('[getSaasUserSession] Authorization header token 驗證失敗:', error?.message);
        }
      }
    }

    // 方法 1: 使用專門的 route handler 客戶端
    try {
      const { supabase, session: sessionData } = await createSaasRouteHandlerClient();
      
      console.log('[getSaasUserSession] createSaasRouteHandlerClient 返回:', {
        hasSession: !!sessionData,
        hasAccessToken: !!sessionData?.access_token,
      });
      
      if (sessionData?.access_token) {
        // 使用 access_token 驗證用戶
        const { data: { user }, error: userError } = await supabase.auth.getUser(sessionData.access_token);
        
        console.log('[getSaasUserSession] getUser 結果:', {
          hasUser: !!user,
          userEmail: user?.email,
          error: userError?.message,
        });
        
        if (!userError && user) {
          console.log('[getSaasUserSession] ✅ 成功通過 createSaasRouteHandlerClient() 獲取用戶');
          return {
            user: {
              email: user.email || null,
              id: user.id,
            },
          };
        }
      }
    } catch (e) {
      // 忽略錯誤，繼續嘗試其他方法
      console.log('[getSaasUserSession] createSaasRouteHandlerClient() 失敗，嘗試從 cookies 讀取:', e);
    }

    // 方法 2: 直接從 cookies 中讀取會話數據
    const cookieStore = await cookies();
    const projectRef = saasUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    
    // Supabase 的 cookie 名稱格式：
    // - 標準格式: sb-{project-ref}-auth-token
    // - 使用 storageKey: sb-{storageKey}-auth-token (不包含 project-ref，根據 middleware.ts)
    // - 或者: sb-{project-ref}-auth-token.0 (帶索引)
    // 注意：根據 middleware.ts，實際使用的名稱是 'sb-hanamiecho-auth-token'
    const possibleCookieNames = [
      'sb-hanamiecho-auth-token', // 優先嘗試這個（根據 middleware.ts）
      projectRef ? `sb-${projectRef}-hanamiecho-auth-token` : null,
      projectRef ? `sb-${projectRef}-auth-token` : null,
      'sb-hanamiecho-auth-token.0',
      projectRef ? `sb-${projectRef}-hanamiecho-auth-token.0` : null,
      projectRef ? `sb-${projectRef}-auth-token.0` : null,
    ].filter(Boolean) as string[];
    
    let accessToken: string | null = null;
    let sessionData: any = null;
    
    // 嘗試從可能的 cookie 名稱中讀取
    for (const cookieName of possibleCookieNames) {
      const authCookie = cookieStore.get(cookieName);
      if (authCookie?.value) {
        try {
          // Supabase 的 cookie 值通常是 JSON 格式的會話對象
          sessionData = JSON.parse(authCookie.value);
          accessToken = sessionData?.access_token || sessionData?.token || null;
          if (accessToken) {
            console.log(`成功從 cookie ${cookieName} 讀取會話`);
            break;
          }
        } catch (e) {
          // 如果解析失敗，嘗試直接使用 cookie 值作為 token
          // 但這通常不會發生，因為 Supabase 總是使用 JSON 格式
          if (authCookie.value.length > 50 && authCookie.value.startsWith('eyJ')) {
            // 看起來像 JWT token
            accessToken = authCookie.value;
            console.log(`從 cookie ${cookieName} 讀取 JWT token`);
            break;
          }
        }
      }
    }

    // 方法 3: 如果沒有找到，嘗試查找所有包含 'supabase' 和 'auth' 的 cookies
    if (!accessToken) {
      const allCookies = cookieStore.getAll();
      const authCookies = allCookies.filter(c => 
        (c.name.includes('supabase') || c.name.includes('sb-')) && 
        (c.name.includes('auth') || c.name.includes('token'))
      );
      
      console.log(`找到 ${authCookies.length} 個可能的認證 cookies:`, authCookies.map(c => c.name));
      
      for (const authCookie of authCookies) {
        if (authCookie.value) {
          try {
            const cookieData = JSON.parse(authCookie.value);
            accessToken = cookieData?.access_token || cookieData?.token || null;
            if (accessToken) {
              sessionData = cookieData;
              console.log(`成功從 cookie ${authCookie.name} 讀取會話`);
              break;
            }
          } catch (e) {
            // 如果解析失敗，嘗試直接使用 cookie 值作為 token
            if (authCookie.value.length > 50 && authCookie.value.startsWith('eyJ')) {
              accessToken = authCookie.value;
              console.log(`從 cookie ${authCookie.name} 讀取 JWT token`);
              break;
            }
          }
        }
      }
    }

    // 方法 4: 如果仍然沒有找到，嘗試從 X-User-Email header 獲取（備選認證）
    if (!accessToken && request) {
      const userEmailHeader = request.headers.get('X-User-Email');
      if (userEmailHeader) {
        console.log('[getSaasUserSession] 從 X-User-Email header 獲取 email:', userEmailHeader);
        // 返回一個臨時會話對象，僅包含 email
        // 注意：這種方式應該僅用於內部 API 調用，不應該用於公開 API
        return {
          user: {
            email: userEmailHeader,
            id: '', // 暫時為空，可以後續從資料庫查詢
          },
        };
      }
    }

    if (!accessToken) {
      // 調試：列出所有 cookies 以便診斷
      const allCookies = cookieStore.getAll();
      console.log('[getSaasUserSession] ❌ 無法從 cookies 中獲取 access token');
      console.log('[getSaasUserSession] 所有 cookies:', allCookies.map(c => ({
        name: c.name,
        hasValue: !!c.value,
        valueLength: c.value?.length || 0,
        valuePreview: c.value?.substring(0, 50) || ''
      })));
      console.log('[getSaasUserSession] 嘗試的 cookie 名稱:', possibleCookieNames);
      return null;
    }
    
    console.log('[getSaasUserSession] ✅ 從 cookies 中找到 access token');

    // 創建 Supabase 客戶端用於驗證 token
    const supabase = createClient(saasUrl, saasAnonKey, {
      auth: {
        storageKey: 'hanamiecho-auth',
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 驗證 token 並獲取用戶信息
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      console.error('[getSaasUserSession] ❌ 獲取用戶信息失敗:', error);
      return null;
    }

    console.log('[getSaasUserSession] ✅ 成功獲取用戶:', user.email);
    return {
      user: {
        email: user.email || null,
        id: user.id,
      },
    };
  } catch (error) {
    console.error('[getSaasUserSession] ❌ 獲取 SaaS 用戶會話錯誤:', error);
    return null;
  }
}

/**
 * 統一的認證輔助函數
 * 支持多種認證方式，包括備選的 X-User-Email header
 */
export async function getAuthenticatedUserEmail(request: NextRequest): Promise<string | null> {
  const session = await getSaasUserSession(request);
  
  if (session?.user?.email) {
    return session.user.email;
  }
  
  // 備選：從 X-User-Email header 獲取
  const userEmailHeader = request.headers.get('X-User-Email');
  if (userEmailHeader) {
    console.log('[getAuthenticatedUserEmail] 從 X-User-Email header 獲取 email:', userEmailHeader);
    return userEmailHeader;
  }
  
  return null;
}
