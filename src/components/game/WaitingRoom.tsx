'use client'

import { useState } from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

const Container = styled(motion.div)`
  background: var(--bg-secondary);
  border: 3px solid var(--neon-pink);
  padding: 2rem;
  border-radius: 0;
  box-shadow: 0 0 30px var(--neon-pink);
  min-width: 400px;
  text-align: center;
`

const Title = styled.h2`
  font-family: 'Press Start 2P', monospace;
  font-size: 1.5rem;
  color: var(--neon-pink);
  margin-bottom: 2rem;
`

const RoomCode = styled.div`
  font-family: 'Press Start 2P', monospace;
  font-size: 2rem;
  color: var(--neon-yellow);
  padding: 1.5rem;
  margin: 2rem 0;
  background: var(--bg-primary);
  border: 2px solid var(--neon-yellow);
  letter-spacing: 0.5em;
  user-select: all;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 0 20px var(--neon-yellow);
    transform: scale(1.05);
  }
`

const PlayerList = styled.div`
  margin: 2rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const PlayerSlot = styled.div<{ $filled?: boolean }>`
  background: ${props => props.$filled ? 'var(--bg-primary)' : 'transparent'};
  border: 2px ${props => props.$filled ? 'solid' : 'dashed'} var(--neon-blue);
  padding: 1rem;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.9rem;
  color: ${props => props.$filled ? 'var(--neon-green)' : 'var(--text-secondary)'};
  opacity: ${props => props.$filled ? 1 : 0.5};
  transition: all 0.3s;
`

const Instructions = styled.p`
  color: var(--text-secondary);
  font-size: 0.8rem;
  margin: 1rem 0;
  line-height: 1.5;
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
`

interface Player {
  id: string
  name: string
  ready: boolean
}

interface WaitingRoomProps {
  roomCode: string
  isHost: boolean
  players: Player[]
  onStartGame: () => void
  onLeave: () => void
}

export default function WaitingRoom({ 
  roomCode, 
  isHost, 
  players, 
  onStartGame, 
  onLeave 
}: WaitingRoomProps) {
  const [copied, setCopied] = useState(false)

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    toast.success('Room code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const canStart = players.length === 2 && players.every(p => p.ready)

  return (
    <Container
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
    >
      <Title>GAME ROOM</Title>
      
      <Instructions>
        {isHost 
          ? 'Share this code with your friend to play together!'
          : 'Waiting for host to start the game...'
        }
      </Instructions>
      
      <RoomCode onClick={copyRoomCode} title="Click to copy">
        {roomCode}
      </RoomCode>
      
      {copied && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ color: 'var(--neon-green)', fontSize: '0.8rem' }}
        >
          Copied!
        </motion.div>
      )}
      
      <PlayerList>
        <PlayerSlot $filled={players.length >= 1}>
          {players[0] ? `P1: ${players[0].name} ${players[0].ready ? '✓' : ''}` : 'Waiting for Player 1...'}
        </PlayerSlot>
        <PlayerSlot $filled={players.length >= 2}>
          {players[1] ? `P2: ${players[1].name} ${players[1].ready ? '✓' : ''}` : 'Waiting for Player 2...'}
        </PlayerSlot>
      </PlayerList>
      
      <ButtonGroup>
        {isHost && (
          <Button
            onClick={onStartGame}
            variant="primary"
            fullWidth
            disabled={!canStart}
          >
            {canStart ? 'Start Game' : `Waiting for ${2 - players.length} player(s)`}
          </Button>
        )}
        
        <Button
          onClick={onLeave}
          variant="danger"
          fullWidth={!isHost}
        >
          Leave Room
        </Button>
      </ButtonGroup>
    </Container>
  )
}