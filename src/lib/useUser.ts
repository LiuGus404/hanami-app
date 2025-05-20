'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/database.types'
import { getUserRole } from '@/utils/getUserRole'

export function useUser() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    let mounted = true

    const fetchUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) throw sessionError

        if (!session) {
          if (mounted) {
            setUser(null)
            setRole(null)
            setLoading(false)
          }
          return
        }

        const userRole = await getUserRole(supabase)
        
        if (mounted) {
          setUser(session.user)
          setRole(userRole)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        if (mounted) {
          setUser(null)
          setRole(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        if (mounted) {
          setUser(null)
          setRole(null)
        }
      } else if (session) {
        const userRole = await getUserRole(supabase)
        if (mounted) {
          setUser(session.user)
          setRole(userRole)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  return {
    user,
    role,
    loading,
    isAdmin: role === 'admin',
    isTeacher: role === 'teacher',
    isParent: role === 'parent',
    isStudent: role === 'student'
  }
} 