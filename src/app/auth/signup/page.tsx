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
  text-align: center;
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

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ 
    email?: string; 
    password?: string; 
    confirmPassword?: string;
    username?: string;
  }>({})

  const validateForm = () => {
    const newErrors: { 
      email?: string; 
      password?: string; 
      confirmPassword?: string;
      username?: string;
    } = {}
    
    if (!username) {
      newErrors.username = 'Username is required'
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores'
    }
    
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
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      })

      if (error) {
        toast.error(error.message)
        return
      }

      if (data.user) {
        toast.success('Account created! Check your email to verify your account.')
        router.push('/auth/login')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Title>New Player</Title>
      <Form onSubmit={handleSubmit}>
        <Input
          type="text"
          label="Username"
          placeholder="CoolGamer123"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={errors.username}
          disabled={loading}
        />
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
        <Input
          type="password"
          label="Confirm Password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          disabled={loading}
        />
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? 'Creating Account...' : 'Join Arcade'}
        </Button>
      </Form>
      <LinksContainer>
        Already have an account? <StyledLink href="/auth/login">Login</StyledLink>
      </LinksContainer>
    </>
  )
}