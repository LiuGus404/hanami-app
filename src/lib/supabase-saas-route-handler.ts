import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const saasUrl = process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL || '';
const saasAnonKey = process.env.NEXT_PUBLIC_SUPABASE_SAAS_ANON_KEY || '';

/**
 * 創建用於 API 路由的 SaaS Supabase 客戶端
 * 這個客戶端能夠從 Next.js cookies 中讀取會話
 */
export async function createSaasRouteHandlerClient() {
  const cookieStore = await cookies();

  // 創建 Supabase 客戶端
  const supabase = createClient(saasUrl, saasAnonKey, {
    auth: {
      storageKey: 'hanamiecho-auth',
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // 手動從 cookies 中讀取會話並設置到客戶端
  const projectRef = saasUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

  // 嘗試多種可能的 cookie 名稱
  // 注意：根據 middleware.ts，實際使用的名稱是 'sb-hanamiecho-auth-token'（不包含 project-ref）
  const possibleCookieNames = [
    'sb-hanamiecho-auth-token', // 優先嘗試這個（根據 middleware.ts）
    projectRef ? `sb-${projectRef}-hanamiecho-auth-token` : null,
    projectRef ? `sb-${projectRef}-auth-token` : null,
    'sb-hanamiecho-auth-token.0',
    projectRef ? `sb-${projectRef}-hanamiecho-auth-token.0` : null,
    projectRef ? `sb-${projectRef}-auth-token.0` : null,
  ].filter(Boolean) as string[];

  let sessionData: any = null;

  console.log('[createSaasRouteHandlerClient] 嘗試的 cookie 名稱:', possibleCookieNames);

  for (const cookieName of possibleCookieNames) {
    const authCookie = cookieStore.get(cookieName);
    if (authCookie?.value) {
      console.log(`[createSaasRouteHandlerClient] 找到 cookie: ${cookieName}`);
      try {
        sessionData = JSON.parse(authCookie.value);
        console.log(`[createSaasRouteHandlerClient] ✅ 成功解析 cookie ${cookieName}`);
        break;
      } catch (e) {
        console.log(`[createSaasRouteHandlerClient] ❌ 解析 cookie ${cookieName} 失敗:`, e);
      }
    }
  }

  // 如果沒有找到，嘗試查找所有包含 'supabase' 和 'auth' 的 cookies
  if (!sessionData) {
    const allCookies = cookieStore.getAll();
    const authCookies = allCookies.filter(c =>
      (c.name.includes('supabase') || c.name.includes('sb-')) &&
      (c.name.includes('auth') || c.name.includes('token'))
    );

    console.log(`[createSaasRouteHandlerClient] 找到 ${authCookies.length} 個可能的認證 cookies:`, authCookies.map(c => c.name));

    for (const authCookie of authCookies) {
      if (authCookie.value) {
        try {
          sessionData = JSON.parse(authCookie.value);
          console.log(`[createSaasRouteHandlerClient] ✅ 成功從 cookie ${authCookie.name} 解析會話`);
          break;
        } catch (e) {
          console.log(`[createSaasRouteHandlerClient] ❌ 解析 cookie ${authCookie.name} 失敗:`, e);
        }
      }
    }
  }

  if (!sessionData) {
    console.log('[createSaasRouteHandlerClient] ❌ 未找到會話數據');
    const allCookies = cookieStore.getAll();
    console.log('[createSaasRouteHandlerClient] 所有 cookies:', allCookies.map(c => ({
      name: c.name,
      hasValue: !!c.value,
      valueLength: c.value?.length || 0,
    })));
  }

  return {
    supabase,
    session: sessionData,
  };
}

