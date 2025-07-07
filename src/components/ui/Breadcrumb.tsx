'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline'

interface BreadcrumbItem {
  label: string
  href: string
  isCurrent?: boolean
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  showHome?: boolean
}

export default function Breadcrumb({ items, showHome = true }: BreadcrumbProps) {
  const pathname = usePathname()
  
  // 如果沒有提供items，則根據pathname自動生成
  const breadcrumbItems = items || generateBreadcrumbItems(pathname, showHome)
  
  if (breadcrumbItems.length <= 1) {
    return null
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-600 mb-4 px-4" aria-label="麵包屑導航">
      {breadcrumbItems.map((item, index) => (
        <div key={item.href} className="flex items-center">
          {index > 0 && (
            <ChevronRightIcon className="w-4 h-4 mx-2 text-gray-400" />
          )}
          
          {item.isCurrent ? (
            <span 
              className="text-[#A64B2A] font-medium"
              aria-current="page"
            >
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              className="text-[#2B3A3B] hover:text-[#A64B2A] transition-colors duration-200 flex items-center"
            >
              {item.href === '/' && showHome ? (
                <HomeIcon className="w-4 h-4 mr-1" />
              ) : null}
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}

function generateBreadcrumbItems(pathname: string, showHome: boolean): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const items: BreadcrumbItem[] = []
  
  // 添加首頁
  if (showHome) {
    items.push({
      label: '首頁',
      href: '/?skipRedirect=true',
      isCurrent: pathname === '/'
    })
  }
  
  // 特殊處理 trial-queue 路徑
  if (pathname === '/admin/trial-queue') {
    items.push({
      label: '管理面板',
      href: '/admin',
      isCurrent: false
    })
    items.push({
      label: '課堂空缺情況',
      href: '/admin/lesson-availability',
      isCurrent: false
    })
    items.push({
      label: '輪候學生列表',
      href: '/admin/trial-queue',
      isCurrent: true
    })
    return items
  }

  // 特殊處理 add-trial-students 路徑
  if (pathname === '/admin/add-trial-students') {
    items.push({
      label: '管理面板',
      href: '/admin',
      isCurrent: false
    })
    items.push({
      label: '課堂空缺情況',
      href: '/admin/lesson-availability',
      isCurrent: false
    })
    items.push({
      label: '新增/編輯輪候學生',
      href: '/admin/add-trial-students',
      isCurrent: true
    })
    return items
  }
  
  // 生成路徑項目
  let currentPath = ''
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    
    // 將路徑轉換為中文標籤
    const label = getBreadcrumbLabel(segment, segments, index)
    
    items.push({
      label,
      href: currentPath,
      isCurrent: index === segments.length - 1
    })
  })
  
  return items
}

function getBreadcrumbLabel(segment: string, allSegments: string[], index: number): string {
  // 路徑到中文標籤的映射
  const labelMap: Record<string, string> = {
    'admin': '管理面板',
    'teacher': '老師',
    'parent': '家長',
    'dashboard': '儀表板',
    'login': '登入',
    'register': '註冊',
    'students': '學生管理',
    'teachers': '老師管理',
    'new': '新增',
    'trial-queue': '輪候學生列表',
    'add-trial-students': '新增試堂學生',
    'lesson-availability': '課堂空缺情況',
    'control': '控制面板',
    'ai-hub': 'AI 中心',
    'ai-select': 'AI 選擇',
    'hanami-tc': 'Hanami TC',
    'permissions': '權限管理',
    'schema-scanner': '資料庫掃描',
    'tools': '工具',
    'removebg': '背景移除',
    'teacher-schedule': '老師課表'
  }
  
  // 如果是動態路由（如 [id]），嘗試從上下文推斷
  if (segment.startsWith('[') && segment.endsWith(']')) {
    const context = allSegments[index - 1]
    if (context === 'students') return '學生詳情'
    if (context === 'teachers') return '老師詳情'
    return '詳情'
  }
  
  return labelMap[segment] || segment
} 