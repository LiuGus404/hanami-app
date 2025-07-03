import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const path = url.pathname

  // 登入頁面路徑
  const loginPages = ['/admin/login', '/teacher/login', '/parent/login']
  const isLoginPage = loginPages.includes(path)

  // 受保護的路由
  const adminRoutes = path.startsWith('/admin') && !isLoginPage
  const teacherRoutes = path.startsWith('/teacher') && !isLoginPage
  const parentRoutes = path.startsWith('/parent') && !isLoginPage

  // 檢查自定義會話（通過 cookie）
  const customSession = req.cookies.get('hanami_user_session')?.value
  let userSession = null
  
  if (customSession) {
    try {
      const sessionData = JSON.parse(customSession)
      // 檢查會話是否過期 (24小時)
      if (Date.now() - sessionData.timestamp < 24 * 60 * 60 * 1000) {
        userSession = sessionData.user
      }
    } catch (error) {
      console.error('Error parsing custom session:', error)
    }
  }

  // 如果訪問受保護路由但未登入，重定向到對應的登入頁面
  if ((adminRoutes || teacherRoutes || parentRoutes) && !userSession) {
    if (adminRoutes) {
      url.pathname = '/admin/login'
    } else if (teacherRoutes) {
      url.pathname = '/teacher/login'
    } else if (parentRoutes) {
      url.pathname = '/parent/login'
    }
    return NextResponse.redirect(url)
  }

  // 如果已登入且訪問登入頁面，重定向到對應的儀表板
  if (isLoginPage && userSession) {
    if (path === '/admin/login' && userSession.role === 'admin') {
              url.pathname = '/admin'
    } else if (path === '/teacher/login' && userSession.role === 'teacher') {
      url.pathname = '/teacher/dashboard'
    } else if (path === '/parent/login' && userSession.role === 'parent') {
      url.pathname = '/parent/dashboard'
    } else {
      // 角色不匹配，不重定向
      return NextResponse.next()
    }
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/teacher/:path*',
    '/parent/:path*'
  ],
}