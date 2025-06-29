'use client'

import { useState } from 'react'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

const MenuContainer = styled(motion.div)`
  background: var(--bg-secondary);
  border: 3px solid var(--neon-pink);
  padding: 2rem;
  border-radius: 0;
  box-shadow: 0 0 30px var(--neon-pink);
  min-width: 400px;
`

const MenuTitle = styled.h2`
  font-family: 'Press Start 2P', monospace;
  font-size: 1.5rem;
  color: var(--neon-pink);
  text-align: center;
  margin-bottom: 2rem;
`

const SubTitle = styled.h3`
  font-family: 'Press Start 2P', monospace;
  font-size: 0.9rem;
  color: var(--neon-blue);
  text-align: center;
  margin-bottom: 1.5rem;
`

const MenuButton = styled(Button)`
  margin-bottom: 1rem;
  text-transform: uppercase;
`

const BackButton = styled(Button)`
  margin-top: 1rem;
`

const Input = styled.input`
  width: 100%;
  padding: 1rem;
  margin-bottom: 1rem;
  background: var(--bg-primary);
  border: 2px solid var(--neon-blue);
  color: var(--text-primary);
  font-family: 'Press Start 2P', monospace;
  font-size: 0.9rem;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: var(--neon-pink);
    box-shadow: 0 0 10px var(--neon-pink);
  }

  &::placeholder {
    color: var(--text-secondary);
    opacity: 0.6;
  }
`

const RoomCode = styled.div`
  font-family: 'Press Start 2P', monospace;
  font-size: 1.5rem;
  color: var(--neon-yellow);
  text-align: center;
  padding: 1.5rem;
  margin: 1.5rem 0;
  background: var(--bg-primary);
  border: 2px solid var(--neon-yellow);
  letter-spacing: 0.3em;
  user-select: all;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 0 20px var(--neon-yellow);
  }
`

const WaitingText = styled.p`
  font-family: 'Press Start 2P', monospace;
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-align: center;
  margin: 1rem 0;
`

const DifficultyGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 1rem;
`

const DifficultyButton = styled(Button)<{ $selected?: boolean }>`
  font-size: 0.8rem;
  padding: 0.8rem;
  ${props => props.$selected && `
    background: var(--neon-blue);
    color: var(--bg-primary);
    box-shadow: 0 0 15px var(--neon-blue);
  `}
`

export type PvPMenuState = 'main' | 'ai' | 'create' | 'join' | 'waiting'
export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'insane'

interface PvPMenuProps {
  onStartAI: (difficulty: AIDifficulty) => void
  onCreateRoom: () => Promise<{ roomId: string; roomCode: string }>
  onJoinRoom: (roomCode: string) => Promise<boolean>
  onBack: () => void
}

export default function PvPMenu({ onStartAI, onCreateRoom, onJoinRoom, onBack }: PvPMenuProps) {
  const [menuState, setMenuState] = useState<PvPMenuState>('main')
  const [selectedDifficulty, setSelectedDifficulty] = useState<AIDifficulty>('medium')
  const [roomCode, setRoomCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateRoom = async () => {
    setIsLoading(true)
    try {
      const result = await onCreateRoom()
      setRoomCode(result.roomCode)
      setMenuState('waiting')
    } catch (error) {
      toast.error('Failed to create room')
      console.error('Create room error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinRoom = async () => {
    if (joinCode.length !== 6) {
      toast.error('Room code must be 6 characters')
      return
    }

    setIsLoading(true)
    try {
      const success = await onJoinRoom(joinCode.toUpperCase())
      if (success) {
        setMenuState('waiting')
      } else {
        toast.error('Failed to join room')
      }
    } catch (error) {
      toast.error('Failed to join room')
      console.error('Join room error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode)
    toast.success('Room code copied!')
  }

  return (
    <AnimatePresence mode="wait">
      {menuState === 'main' && (
        <MenuContainer
          key="main"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <MenuTitle>PvP MODE</MenuTitle>
          
          <MenuButton 
            onClick={() => setMenuState('ai')} 
            variant="primary" 
            fullWidth
          >
            Play vs AI
          </MenuButton>
          
          <MenuButton 
            onClick={() => setMenuState('create')} 
            variant="secondary" 
            fullWidth
          >
            Create Room
          </MenuButton>
          
          <MenuButton 
            onClick={() => setMenuState('join')} 
            variant="secondary" 
            fullWidth
          >
            Join Room
          </MenuButton>
          
          <MenuButton 
            variant="secondary" 
            fullWidth 
            disabled
          >
            Quick Match
          </MenuButton>
          
          <BackButton onClick={onBack} variant="danger" fullWidth>
            Back
          </BackButton>
        </MenuContainer>
      )}

      {menuState === 'ai' && (
        <MenuContainer
          key="ai"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <MenuTitle>SELECT DIFFICULTY</MenuTitle>
          
          <DifficultyGrid>
            <DifficultyButton
              onClick={() => setSelectedDifficulty('easy')}
              $selected={selectedDifficulty === 'easy'}
              variant="secondary"
            >
              Easy
            </DifficultyButton>
            <DifficultyButton
              onClick={() => setSelectedDifficulty('medium')}
              $selected={selectedDifficulty === 'medium'}
              variant="secondary"
            >
              Medium
            </DifficultyButton>
            <DifficultyButton
              onClick={() => setSelectedDifficulty('hard')}
              $selected={selectedDifficulty === 'hard'}
              variant="secondary"
            >
              Hard
            </DifficultyButton>
            <DifficultyButton
              onClick={() => setSelectedDifficulty('insane')}
              $selected={selectedDifficulty === 'insane'}
              variant="secondary"
            >
              Insane
            </DifficultyButton>
          </DifficultyGrid>
          
          <MenuButton 
            onClick={() => onStartAI(selectedDifficulty)} 
            variant="primary" 
            fullWidth
          >
            Start Game
          </MenuButton>
          
          <BackButton 
            onClick={() => setMenuState('main')} 
            variant="danger" 
            fullWidth
          >
            Back
          </BackButton>
        </MenuContainer>
      )}

      {menuState === 'create' && (
        <MenuContainer
          key="create"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <MenuTitle>CREATE ROOM</MenuTitle>
          <SubTitle>Share the code with a friend</SubTitle>
          
          <MenuButton 
            onClick={handleCreateRoom} 
            variant="primary" 
            fullWidth
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Room'}
          </MenuButton>
          
          <BackButton 
            onClick={() => setMenuState('main')} 
            variant="danger" 
            fullWidth
          >
            Back
          </BackButton>
        </MenuContainer>
      )}

      {menuState === 'join' && (
        <MenuContainer
          key="join"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <MenuTitle>JOIN ROOM</MenuTitle>
          
          <Input
            type="text"
            placeholder="ENTER CODE"
            maxLength={6}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
          />
          
          <MenuButton 
            onClick={handleJoinRoom} 
            variant="primary" 
            fullWidth
            disabled={isLoading || joinCode.length !== 6}
          >
            {isLoading ? 'Joining...' : 'Join Room'}
          </MenuButton>
          
          <BackButton 
            onClick={() => setMenuState('main')} 
            variant="danger" 
            fullWidth
          >
            Back
          </BackButton>
        </MenuContainer>
      )}

      {menuState === 'waiting' && (
        <MenuContainer
          key="waiting"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <MenuTitle>WAITING FOR PLAYER</MenuTitle>
          
          {roomCode && (
            <>
              <SubTitle>Room Code:</SubTitle>
              <RoomCode onClick={copyRoomCode}>{roomCode}</RoomCode>
              <WaitingText>Click to copy</WaitingText>
            </>
          )}
          
          <WaitingText>
            Waiting for opponent to join...
          </WaitingText>
          
          <BackButton 
            onClick={() => {
              setMenuState('main')
              setRoomCode('')
              setJoinCode('')
            }} 
            variant="danger" 
            fullWidth
          >
            Cancel
          </BackButton>
        </MenuContainer>
      )}
    </AnimatePresence>
  )
}