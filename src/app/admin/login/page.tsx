'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/database.types'
import { Spinner } from '@/components/ui/spinner'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()
  const mounted = useRef(false)
  const redirecting = useRef(false)

  useEffect(() => {
    mounted.current = true

    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError

        if (session?.user) {
          const { data: { user }, error: userError } = await supabase.auth.getUser()
          if (userError) throw userError

          if (user?.user_metadata?.role === 'admin' && mounted.current && !redirecting.current) {
            redirecting.current = true
            router.replace('/admin/dashboard')
            return
          }
        }
      } catch (error) {
        console.error('Session check error:', error)
      }

      if (mounted.current) {
        setIsLoading(false)
      }
    }

    checkSession()

    return () => {
      mounted.current = false
    }
  }, [supabase, router])

  const handleLogin = async () => {
    if (!email || !password) {
      setError('請輸入帳號和密碼')
      return
    }

    try {
      setError('')
      setIsLoading(true)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      const user = data.user
      if (user?.user_metadata?.role !== 'admin') {
        throw new Error('無權限：僅限管理員登入')
      }

      if (mounted.current && !redirecting.current) {
        redirecting.current = true
        router.replace('/admin/dashboard')
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
      <div className="flex h-screen items-center justify-center bg-[#FFFCEB]">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFCEB] font-['Quicksand',_sans-serif] px-4">
      <div className="bg-white shadow-xl rounded-[30px] p-8 w-full max-w-sm border border-[#FDE6B8]">
        <h1 className="text-xl font-bold text-center text-[#2B3A3B] mb-4">Hanami 管理登入</h1>
        <input
          type="email"
          placeholder="管理員帳號"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 px-4 py-2 border border-[#EADBC8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FCD58B]"
        />
        <input
          type="password"
          placeholder="密碼"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 px-4 py-2 border border-[#EADBC8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FCD58B]"
        />
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full bg-[#FCD58B] text-[#2B3A3B] font-bold py-2 rounded-full hover:bg-[#fbc161] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '登入中...' : '登入'}
        </button>
        {error && <p className="text-red-500 text-sm text-center mt-3">{error}</p>}
      </div>
    </div>
  )
}