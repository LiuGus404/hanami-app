import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 權限檢查函數
async function checkUserPermission(user_email: string, page_path: string): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/permissions/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_email,
        resource_type: 'page',
        operation: 'view',
        resource_id: page_path,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return result.has_permission;
    }
    
    // 如果權限檢查失敗，記錄錯誤但允許訪問（向後相容）
    console.warn('權限檢查失敗，允許訪問:', page_path, response.status);
    return true;
  } catch (error) {
    // 權限檢查出錯，記錄錯誤但允許訪問（向後相容）
    console.warn('權限檢查錯誤，允許訪問:', page_path, error);
    return true;
  }
}

// 路由權限配置
const ROUTE_PERMISSIONS = {
  // 管理員路由
  '/admin': {
    required_role: 'admin',
    fallback: '/admin/login',
  },
  '/admin/students': {
    required_role: 'admin',
    fallback: '/admin/login',
  },
  '/admin/teachers': {
    required_role: 'admin',
    fallback: '/admin/login',
  },
  '/admin/permission-management': {
    required_role: 'admin',
    fallback: '/admin/login',
  },
  '/admin/ai-hub': {
    required_role: 'admin',
    fallback: '/admin/login',
  },
  '/admin/student-progress': {
    required_role: 'admin',
    fallback: '/admin/login',
  },
  '/admin/resource-library': {
    required_role: 'admin',
    fallback: '/admin/login',
  },
  
  // 教師路由
  '/teacher': {
    required_role: 'teacher',
    fallback: '/teacher/login',
  },
  '/teacher/dashboard': {
    required_role: 'teacher',
    fallback: '/teacher/login',
  },
  
  // 家長路由
  '/parent': {
    required_role: 'parent',
    fallback: '/parent/login',
  },
  '/parent/dashboard': {
    required_role: 'parent',
    fallback: '/parent/login',
  },
} as const;

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const path = url.pathname

  // 登入頁面路徑
  const loginPages = ['/admin/login', '/teacher/login', '/parent/login', '/login']
  const isLoginPage = loginPages.includes(path)
  
  // 音樂教育系統路徑 (保持原有邏輯)
  const isMusicPath = path.startsWith('/music')

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

  // 如果訪問登入頁面且已登入，重定向到對應的儀表板
  if (isLoginPage && userSession) {
    if (path === '/admin/login' && userSession.role === 'admin') {
      url.pathname = '/admin'
    } else if (path === '/teacher/login' && userSession.role === 'teacher') {
      url.pathname = '/teacher/dashboard'
    } else if (path === '/parent/login' && userSession.role === 'parent') {
      url.pathname = '/parent/dashboard'
    } else if (path === '/login') {
      // 通用登入頁面，根據用戶角色重定向
      switch (userSession.role) {
        case 'admin':
          url.pathname = '/admin'
          break
        case 'teacher':
          url.pathname = '/teacher/dashboard'
          break
        case 'parent':
          url.pathname = '/parent/dashboard'
          break
        case 'student':
          url.pathname = '/parent/dashboard' // 學生使用家長儀表板
          break
        default:
          // 未知角色，不重定向
          return NextResponse.next()
      }
    } else {
      // 角色不匹配，不重定向
      return NextResponse.next()
    }
    return NextResponse.redirect(url)
  }

  // 檢查路由權限
  const routeConfig = ROUTE_PERMISSIONS[path as keyof typeof ROUTE_PERMISSIONS]
  
  if (routeConfig) {
    // 如果未登入，重定向到登入頁面
    if (!userSession) {
      url.pathname = routeConfig.fallback
      return NextResponse.redirect(url)
    }

    // 檢查角色權限
    if (userSession.role !== routeConfig.required_role) {
      // 角色不匹配，重定向到無權限頁面
      url.pathname = '/auth/unauthorized'
      return NextResponse.redirect(url)
    }

    // 如果已登入且角色匹配，進行詳細權限檢查
    if (userSession.email) {
      const hasPermission = await checkUserPermission(userSession.email, path)
      
      if (!hasPermission) {
        // 沒有權限，重定向到無權限頁面
        url.pathname = '/auth/unauthorized'
        return NextResponse.redirect(url)
      }
    }
  }

  // 處理其他受保護的路由（使用路徑前綴檢查）
  if (!isLoginPage && !userSession) {
    if (path.startsWith('/admin')) {
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    } else if (path.startsWith('/teacher')) {
      url.pathname = '/teacher/login'
      return NextResponse.redirect(url)
    } else if (path.startsWith('/parent')) {
      url.pathname = '/parent/login'
      return NextResponse.redirect(url)
    }
  }

  // 處理角色不匹配的情況
  if (userSession && !isLoginPage) {
    if (path.startsWith('/admin') && userSession.role !== 'admin') {
      url.pathname = '/auth/unauthorized'
      return NextResponse.redirect(url)
    } else if (path.startsWith('/teacher') && userSession.role !== 'teacher') {
      url.pathname = '/auth/unauthorized'
      return NextResponse.redirect(url)
    } else if (path.startsWith('/parent') && userSession.role !== 'parent') {
      url.pathname = '/auth/unauthorized'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/teacher/:path*',
    '/parent/:path*',
    '/music/:path*',
    '/login'
  ],
}