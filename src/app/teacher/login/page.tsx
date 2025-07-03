'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/database.types'
import { Spinner } from '@/components/ui/spinner'
import HanamiLoginForm from '@/components/ui/HanamiLoginForm'
import { validateUserCredentials, setUserSession, getUserSession, clearUserSession } from '@/lib/authUtils'

export default function TeacherLoginPage() {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()
  const mounted = useRef(false)
  const redirecting = useRef(false)
  const sessionChecked = useRef(false)

  useEffect(() => {
    mounted.current = true

    const checkSession = async () => {
      // 防止重複檢查
      if (sessionChecked.current || redirecting.current) return
      sessionChecked.current = true

      try {
        // 檢查本地會話
        const userSession = getUserSession()
        if (userSession && userSession.role === 'teacher' && mounted.current && !redirecting.current) {
          redirecting.current = true
          router.replace('/teacher/dashboard')
          return
        }

        // 清除無效會話
        if (userSession && userSession.role !== 'teacher') {
          clearUserSession()
        }
      } catch (error) {
        console.error('Session check error:', error)
        clearUserSession()
      }

      if (mounted.current) {
        setIsLoading(false)
      }
    }

    checkSession()

    return () => {
      mounted.current = false
    }
  }, []) // 移除 router 依賴

  const handleLogin = async (email: string, password: string) => {
    if (!email || !password) {
      setError('請輸入帳號和密碼')
      return
    }

    try {
      setError('')
      setIsLoading(true)

      // 使用新的認證系統
      const result = await validateUserCredentials(email, password)

      if (result.success && result.user) {
        // 檢查用戶角色
        if (result.user.role !== 'teacher') {
          setError('無權限：僅限老師登入')
          setIsLoading(false)
          return
        }

        // 設置用戶會話
        setUserSession(result.user)

        if (mounted.current && !redirecting.current) {
          redirecting.current = true
          router.replace('/teacher/dashboard')
        }
      } else {
        setError(result.error || '登入失敗')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Login error:', error)
      if (mounted.current) {
        setError(error instanceof Error ? error.message : '登入失敗')
        setIsLoading(false)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFF9F2] font-['Quicksand',_sans-serif] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD59A] mx-auto"></div>
          <p className="mt-4 text-brown-700">載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <HanamiLoginForm
      userType="teacher"
      onSubmit={handleLogin}
      loading={isLoading}
      error={error}
    />
  )
}