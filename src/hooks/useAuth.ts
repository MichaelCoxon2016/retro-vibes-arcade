import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { createClient } from '@/lib/supabase/client'

export function useAuth(requireAuth: boolean = true) {
  const router = useRouter()
  const { user, setUser, setLoading, isLoading } = useAuthStore()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (requireAuth && !user) {
          router.push('/auth/login')
        }
      } catch (error) {
        console.error('Auth error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (_event: any, session: any) => {
        setUser(session?.user ?? null)
        
        if (requireAuth && !session?.user) {
          router.push('/auth/login')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requireAuth, router, setUser, setLoading])

  return { user, isLoading }
}