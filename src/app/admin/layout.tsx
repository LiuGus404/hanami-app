'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/database.types'
import { getUserRole } from '@/utils/getUserRole'
import { Spinner } from '@/components/ui/spinner'
import AdminSidebar from '@/components/admin/AdminSidebar'
import '../globals.css'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const mounted = useRef(false)
  const supabase = createClientComponentClient<Database>()
  const isLoginPage = pathname === '/admin/login'
  const authChecked = useRef(false)
  const redirecting = useRef(false)

  const redirectToLogin = useCallback(() => {
    if (!isLoginPage && !redirecting.current) {
      redirecting.current = true
      router.replace('/admin/login')
    }
  }, [isLoginPage, router])

  const checkAuth = useCallback(async () => {
    if (!mounted.current || authChecked.current) return

    try {
      authChecked.current = true
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('User error:', userError)
        if (!isLoginPage) {
          redirectToLogin()
        }
        return
      }

      // 直接從 user metadata 獲取角色
      const role = user.user_metadata?.role || null
      if (!mounted.current) return
      
      setUserRole(role)
      console.log('Current role:', role)

      if (role !== 'admin') {
        if (!isLoginPage) {
          redirectToLogin()
        }
      } else if (isLoginPage) {
        router.replace('/admin/dashboard')
      }
    } catch (error) {
      console.error('Auth check error:', error)
      if (!isLoginPage) {
        redirectToLogin()
      }
    } finally {
      if (mounted.current) {
        setIsLoading(false)
      }
    }
  }, [supabase, redirectToLogin, isLoginPage, router])

  useEffect(() => {
    mounted.current = true
    
    const initAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        
        if (!session) {
          if (!isLoginPage) {
            redirectToLogin()
          }
          setIsLoading(false)
          return
        }
        
        await checkAuth()
      } catch (error) {
        console.error('Init auth error:', error)
        if (!isLoginPage) {
          redirectToLogin()
        }
        setIsLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event)
      if (event === 'SIGNED_OUT') {
        setUserRole(null)
        if (!isLoginPage) {
          redirectToLogin()
        }
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        authChecked.current = false
        await checkAuth()
      }
    })

    return () => {
      mounted.current = false
      subscription.unsubscribe()
    }
  }, [supabase, checkAuth, redirectToLogin, isLoginPage])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  // 如果是登入頁面，或者已經確認有權限，就顯示內容
  if (isLoginPage || userRole === 'admin') {
    return (
        <div className="min-h-screen bg-gray-50">
          {children}
          {!isLoginPage && <AdminSidebar isLoggedIn={!!userRole} />}
        </div>
    )
  }

  // 其他情況返回 null
  return null
}