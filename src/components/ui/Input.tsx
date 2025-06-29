'use client'

import styled from 'styled-components'

const InputWrapper = styled.div`
  position: relative;
  width: 100%;
`

const StyledInput = styled.input`
  width: 100%;
  padding: 1rem;
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 2px solid var(--neon-blue);
  outline: none;
  transition: all 0.3s ease;

  &:focus {
    border-color: var(--neon-pink);
    box-shadow: 
      0 0 10px var(--neon-pink),
      inset 0 0 10px rgba(255, 16, 240, 0.1);
  }

  &::placeholder {
    color: var(--text-secondary);
    opacity: 0.7;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.8rem;
  color: var(--neon-blue);
  text-transform: uppercase;
`

const ErrorMessage = styled.span`
  display: block;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--neon-orange);
  font-family: 'Courier New', monospace;
`

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({ label, error, id, ...props }: Props) {
  return (
    <InputWrapper>
      {label && <Label htmlFor={id}>{label}</Label>}
      <StyledInput id={id} {...props} />
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </InputWrapper>
  )
}