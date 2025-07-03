'use client'

import { useEffect, useState } from 'react'
import { getUserSession } from '@/lib/authUtils'

export function useUser() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const fetchUser = async () => {
      try {
        const userSession = getUserSession()
        
        if (!userSession) {
          if (mounted) {
            setUser(null)
            setRole(null)
            setLoading(false)
          }
          return
        }

        if (mounted) {
          setUser(userSession)
          setRole(userSession.role)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        if (mounted) {
          setUser(null)
          setRole(null)
          setLoading(false)
        }
      }
    }

    fetchUser()

    return () => {
      mounted = false
    }
  }, [])

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