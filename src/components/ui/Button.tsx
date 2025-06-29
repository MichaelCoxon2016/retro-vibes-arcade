'use client'

import styled from 'styled-components'
import { motion } from 'framer-motion'

interface ButtonProps {
  $variant?: 'primary' | 'secondary' | 'danger'
  $size?: 'small' | 'medium' | 'large'
  $fullWidth?: boolean
}

const StyledButton = styled(motion.button)<ButtonProps>`
  font-family: 'Press Start 2P', monospace;
  text-transform: uppercase;
  border: none;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  
  ${props => {
    const sizes = {
      small: { padding: '0.5rem 1rem', fontSize: '0.7rem' },
      medium: { padding: '0.75rem 1.5rem', fontSize: '0.9rem' },
      large: { padding: '1rem 2rem', fontSize: '1.1rem' }
    }
    const size = sizes[props.$size || 'medium']
    return `
      padding: ${size.padding};
      font-size: ${size.fontSize};
    `
  }}

  ${props => props.$fullWidth && 'width: 100%;'}

  ${props => {
    const variants = {
      primary: {
        bg: 'var(--neon-pink)',
        color: 'var(--bg-primary)',
        shadow: 'var(--neon-pink)'
      },
      secondary: {
        bg: 'var(--neon-blue)',
        color: 'var(--bg-primary)',
        shadow: 'var(--neon-blue)'
      },
      danger: {
        bg: 'var(--neon-orange)',
        color: 'var(--bg-primary)',
        shadow: 'var(--neon-orange)'
      }
    }
    const variant = variants[props.$variant || 'primary']
    return `
      background: ${variant.bg};
      color: ${variant.color};
      box-shadow: 
        4px 4px 0 rgba(0, 0, 0, 0.8),
        inset 0 0 0 2px rgba(255, 255, 255, 0.1);
      
      &:hover {
        transform: translate(-2px, -2px);
        box-shadow: 
          6px 6px 0 rgba(0, 0, 0, 0.8),
          0 0 20px ${variant.shadow},
          inset 0 0 0 2px rgba(255, 255, 255, 0.2);
      }

      &:active {
        transform: translate(2px, 2px);
        box-shadow: 
          2px 2px 0 rgba(0, 0, 0, 0.8),
          inset 0 0 0 2px rgba(0, 0, 0, 0.2);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
        box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);
      }
    `
  }}
`

interface Props {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'small' | 'medium' | 'large'
  fullWidth?: boolean
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

export default function Button({ 
  variant = 'primary', 
  size = 'medium', 
  fullWidth = false,
  children,
  onClick,
  type = 'button',
  disabled = false
}: Props) {
  return (
    <StyledButton
      $variant={variant}
      $size={size}
      $fullWidth={fullWidth}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      type={type}
      disabled={disabled}
    >
      {children}
    </StyledButton>
  )
}