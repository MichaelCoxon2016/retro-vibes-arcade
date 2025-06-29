'use client'

import { useState } from 'react'
import styled from 'styled-components'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'

const Title = styled.h1`
  font-family: 'Press Start 2P', monospace;
  font-size: 1.5rem;
  color: var(--neon-pink);
  text-align: center;
  margin-bottom: 2rem;
  text-shadow: 0 0 10px var(--neon-pink);
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const LinksContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
  font-size: 0.9rem;
`

const StyledLink = styled(Link)`
  color: var(--neon-blue);
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    color: var(--neon-pink);
    text-shadow: 0 0 5px currentColor;
  }
`

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {}
    
    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid'
    }
    
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      if (data.user) {
        toast.success('Welcome back to the arcade!')
        router.push('/')
        router.refresh()
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Title>Player Login</Title>
      <Form onSubmit={handleSubmit}>
        <Input
          type="email"
          label="Email"
          placeholder="player@arcade.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          disabled={loading}
        />
        <Input
          type="password"
          label="Password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          disabled={loading}
        />
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? 'Loading...' : 'Start Playing'}
        </Button>
      </Form>
      <LinksContainer>
        <StyledLink href="/auth/signup">New Player? Sign Up</StyledLink>
        <StyledLink href="/auth/reset-password">Forgot Password?</StyledLink>
      </LinksContainer>
    </>
  )
}