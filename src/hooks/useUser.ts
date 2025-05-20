// src/hooks/useUser.ts
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useUser() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.auth.getSession()
      const currentUser = data?.session?.user || null
      setUser(currentUser)
      setRole(currentUser?.user_metadata?.role || null)
      setLoading(false)
    }
    fetch()
  }, [])

  return { user, role, loading }
}