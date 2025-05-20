import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()
  const url = req.nextUrl.clone()
  const path = url.pathname

  const isLoginPage = path === '/admin/login'
  const isAdminRoute = path.startsWith('/admin') && !isLoginPage

  // 如果訪問管理員路由但未登入，重定向到登入頁面
  if (isAdminRoute && !session) {
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  // 如果已登入且訪問登入頁面，重定向到儀表板
  if (isLoginPage && session) {
    url.pathname = '/admin/dashboard'
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*'],
}