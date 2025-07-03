// src/hooks/useUser.ts
import { useState, useEffect } from 'react'
import { getUserSession } from '@/lib/authUtils'

export function useUser() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const userSession = getUserSession()
        if (userSession) {
          setUser(userSession)
          setRole(userSession.role)
        } else {
          setUser(null)
          setRole(null)
        }
      } catch (error) {
        console.error('Error fetching user session:', error)
        setUser(null)
        setRole(null)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return { user, role, loading }
}