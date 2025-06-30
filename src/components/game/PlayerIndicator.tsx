'use client'

import styled from 'styled-components'

const Container = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
`

const PlayerBox = styled.div<{ $color: string; $isActive: boolean }>`
  background: ${props => props.$isActive ? 'var(--bg-primary)' : 'transparent'};
  border: 2px ${props => props.$isActive ? 'solid' : 'dashed'} ${props => props.$color};
  padding: 0.5rem 1rem;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.7rem;
  color: ${props => props.$isActive ? props.$color : 'var(--text-secondary)'};
  opacity: ${props => props.$isActive ? 1 : 0.5};
  box-shadow: ${props => props.$isActive ? `0 0 10px ${props.$color}` : 'none'};
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const StatusDot = styled.div<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$color};
  box-shadow: 0 0 5px ${props => props.$color};
  animation: pulse 2s infinite;

  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      opacity: 1;
    }
  }
`

interface Player {
  id: string
  name: string
  color: string
  isConnected: boolean
  score?: number
}

interface PlayerIndicatorProps {
  players: Player[]
  currentPlayerId?: string
}

export default function PlayerIndicator({ players, currentPlayerId }: PlayerIndicatorProps) {
  return (
    <Container>
      {players.map((player) => (
        <PlayerBox 
          key={player.id} 
          $color={player.color} 
          $isActive={player.isConnected}
        >
          <StatusDot $color={player.isConnected ? player.color : '#666'} />
          {player.name}
          {player.id === currentPlayerId && ' (You)'}
          {player.score !== undefined && ` - ${player.score}`}
        </PlayerBox>
      ))}
    </Container>
  )
}