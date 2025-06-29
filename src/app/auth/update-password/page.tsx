'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styled from 'styled-components'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
`

const Card = styled.div`
  background: var(--bg-secondary);
  border: 2px solid var(--neon-blue);
  padding: 3rem 2rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 0 20px rgba(0, 217, 255, 0.3);
`

const Title = styled.h1`
  font-family: 'Press Start 2P', monospace;
  font-size: 1.5rem;
  color: var(--neon-blue);
  text-align: center;
  margin-bottom: 2rem;
  text-shadow: 0 0 10px var(--neon-blue);
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const Footer = styled.div`
  text-align: center;
  margin-top: 2rem;
  font-size: 0.875rem;
  color: var(--text-secondary);

  a {
    color: var(--neon-pink);
    text-decoration: none;
    transition: all 0.2s;

    &:hover {
      text-shadow: 0 0 5px var(--neon-pink);
    }
  }
`

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Invalid or expired reset link')
        router.push('/auth/reset-password')
      }
    }
    checkSession()
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Password updated successfully!')
        router.push('/auth/login')
      }
    } catch {
      toast.error('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container>
      <Card>
        <Title>NEW PASSWORD</Title>
        <Form onSubmit={handleSubmit}>
          <Input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <Input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
          <Button type="submit" disabled={loading} fullWidth>
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </Form>
        <Footer>
          <Link href="/auth/login">Back to Login</Link>
        </Footer>
      </Card>
    </Container>
  )
}