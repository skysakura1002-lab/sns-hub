import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'

export const useSession = () => {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    session,
    isLoading,
    isAuthenticated: !!session,
  }
}
