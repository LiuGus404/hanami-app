import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  try {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })
    
    // 嘗試獲取會話
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Auth error:', error)
      // 如果是認證錯誤，重定向到登入頁面
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }

    const url = req.nextUrl.clone()
    const path = url.pathname

    const isLoginPage = path === '/admin/login'
    const isAdminRoute = path.startsWith('/admin') && !isLoginPage

    // 如果訪問管理員路由但未登入，重定向到登入頁面
    if (isAdminRoute && !session) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }

    // 如果已登入且訪問登入頁面，重定向到儀表板
    if (isLoginPage && session) {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url))
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    // 發生未預期的錯誤時，重定向到錯誤頁面或登入頁面
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }
}

export const config = {
  matcher: ['/admin/:path*'],
}