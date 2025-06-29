'use client'

import styled from 'styled-components'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import Button from './Button'
import toast from 'react-hot-toast'

const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 1rem 2rem;
  background: rgba(10, 10, 10, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 2px solid var(--neon-pink);
  box-shadow: 0 0 20px rgba(255, 16, 240, 0.3);
`

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
`

const Logo = styled(Link)`
  font-family: 'Press Start 2P', monospace;
  font-size: 1.5rem;
  color: var(--neon-pink);
  text-decoration: none;
  text-shadow: 0 0 10px var(--neon-pink);
  transition: all 0.2s;

  &:hover {
    text-shadow: 0 0 20px var(--neon-pink), 0 0 30px var(--neon-pink);
  }
`

const AuthSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-family: 'Courier New', monospace;
  color: var(--neon-blue);
`

const Username = styled.span`
  font-family: 'Press Start 2P', monospace;
  font-size: 0.8rem;
`

export default function Header() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('Signed out successfully')
      router.push('/')
      router.refresh()
    } catch {
      toast.error('Error signing out')
    }
  }

  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo href="/">VIBE ARCADE</Logo>
        <AuthSection>
          {!loading && (
            <>
              {user ? (
                <UserInfo>
                  <Username>{user.user_metadata?.username || 'Player'}</Username>
                  <Button variant="secondary" size="small" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </UserInfo>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => router.push('/auth/login')}
                  >
                    Login
                  </Button>
                  <Button
                    variant="primary"
                    size="small"
                    onClick={() => router.push('/auth/signup')}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </>
          )}
        </AuthSection>
      </HeaderContent>
    </HeaderContainer>
  )
}