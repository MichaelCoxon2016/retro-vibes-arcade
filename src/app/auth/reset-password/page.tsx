'use client'

import { useState } from 'react'
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

const Message = styled.p`
  text-align: center;
  color: var(--neon-green);
  font-size: 0.875rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: rgba(0, 255, 0, 0.1);
  border: 1px solid var(--neon-green);
`

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })

      if (error) {
        toast.error(error.message)
      } else {
        setEmailSent(true)
        toast.success('Password reset link sent to your email!')
      }
    } catch {
      toast.error('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <Container>
        <Card>
          <Title>CHECK YOUR EMAIL</Title>
          <Message>
            We&apos;ve sent a password reset link to {email}.
            Please check your inbox and follow the instructions.
          </Message>
          <Footer>
            <Link href="/auth/login">Back to Login</Link>
          </Footer>
        </Card>
      </Container>
    )
  }

  return (
    <Container>
      <Card>
        <Title>RESET PASSWORD</Title>
        <Form onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading} fullWidth>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </Form>
        <Footer>
          Remember your password? <Link href="/auth/login">Login</Link>
        </Footer>
      </Card>
    </Container>
  )
}