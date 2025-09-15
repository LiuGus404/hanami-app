import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 需要認證保護的路由
  const protectedRoutes = [
    '/aihome/dashboard',
    '/aihome/profile',
    '/aihome/settings',
    '/aihome/ai-tools',
    '/aihome/learning-paths',
    '/aihome/memory-bank',
    '/aihome/family-collaboration'
  ];
  
  // 檢查是否為受保護的路由
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // 如果是受保護的路由，檢查認證狀態
  if (isProtectedRoute) {
    // 檢查是否有認證 token (使用 Supabase 的 cookie 名稱)
    const accessToken = request.cookies.get('sb-hanamiecho-auth-token')?.value;
    const refreshToken = request.cookies.get('sb-hanamiecho-auth-refresh-token')?.value;
    
    // 暫時禁用中間件重定向，讓前端處理認證
    console.log('中間件檢查 - 路徑:', pathname, 'accessToken:', !!accessToken, 'refreshToken:', !!refreshToken);
    
    // if (!accessToken && !refreshToken) {
    //   // 重定向到登入頁面
    //   const loginUrl = new URL('/aihome/auth/login', request.url);
    //   loginUrl.searchParams.set('redirect', pathname);
    //   return NextResponse.redirect(loginUrl);
    // }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 暫時禁用中間件來避免重定向循環
     * 只匹配特定的受保護路由
     */
    '/aihome/profile',
    '/aihome/settings',
    '/aihome/ai-tools',
    '/aihome/learning-paths',
    '/aihome/memory-bank',
    '/aihome/family-collaboration'
  ],
};
