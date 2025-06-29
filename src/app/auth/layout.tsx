'use client'

import styled from 'styled-components'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Header from '@/components/ui/Header'

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6rem 2rem 2rem;
`

const AuthBox = styled(motion.div)`
  background: var(--bg-secondary);
  border: 3px solid var(--neon-pink);
  padding: 3rem 2rem;
  max-width: 400px;
  width: 100%;
  box-shadow: 
    0 0 30px rgba(255, 16, 240, 0.5),
    4px 4px 0 rgba(0, 0, 0, 0.8);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: -5px;
    left: -5px;
    right: -5px;
    bottom: -5px;
    background: linear-gradient(45deg, var(--neon-pink), var(--neon-blue), var(--neon-pink));
    opacity: 0.3;
    filter: blur(10px);
    z-index: -1;
  }
`

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.8rem;
  color: var(--neon-blue);
  text-decoration: none;
  margin-bottom: 2rem;
  transition: all 0.2s;

  &:hover {
    color: var(--neon-pink);
    transform: translateX(-4px);
  }
`

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <Container>
        <AuthBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <BackLink href="/">← Back to Arcade</BackLink>
          {children}
        </AuthBox>
      </Container>
    </>
  )
}