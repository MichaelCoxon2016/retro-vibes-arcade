'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { SnakeGameEngine } from '@/lib/game-engines/snake-engine'
import { Direction, SnakeGameMode } from '@/types/snake'
import { useAuth } from '@/hooks/useAuth'
import { useGameStore } from '@/store/useGameStore'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'
import Link from 'next/link'
import PvPMenu, { AIDifficulty } from '@/components/game/PvPMenu'
import { GameRoomService } from '@/lib/realtime/game-room-service'

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--bg-primary);
`

const GameContainer = styled.div`
  display: flex;
  gap: 2rem;
  align-items: flex-start;
  max-width: 1200px;
  width: 100%;
`

const GameArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`

const Canvas = styled.canvas`
  border: 3px solid var(--neon-green);
  box-shadow: 0 0 30px var(--neon-green);
  image-rendering: pixelated;
  background: #0A0A0A;
  width: 540px;
  height: 450px;
  display: block;
`

const Sidebar = styled.div`
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const InfoPanel = styled.div`
  background: var(--bg-secondary);
  border: 2px solid var(--neon-blue);
  padding: 1.5rem;
  box-shadow: 0 0 20px rgba(0, 217, 255, 0.3);
`

const Title = styled.h1`
  font-family: 'Press Start 2P', monospace;
  font-size: 2rem;
  color: var(--neon-green);
  text-align: center;
  margin-bottom: 2rem;
  text-shadow: 0 0 20px var(--neon-green);
`

const MenuTitle = styled.h2`
  font-family: 'Press Start 2P', monospace;
  font-size: 1.5rem;
  color: var(--neon-pink);
  text-align: center;
  margin-bottom: 2rem;
`

const Score = styled.div`
  font-family: 'Press Start 2P', monospace;
  font-size: 1.2rem;
  color: var(--neon-yellow);
  margin-bottom: 1rem;
`

const PlayerScores = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
`

const PlayerScore = styled.div<{ $color: string }>`
  font-family: 'Press Start 2P', monospace;
  font-size: 0.9rem;
  color: ${props => props.$color};
`

const Timer = styled.div`
  font-family: 'Press Start 2P', monospace;
  font-size: 1rem;
  color: var(--neon-orange);
  margin-bottom: 1rem;
`

const Controls = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 60px);
  grid-template-rows: repeat(3, 60px);
  gap: 0.5rem;
  margin-top: 1rem;
  justify-content: center;
`

const ControlButton = styled.button`
  font-family: 'Press Start 2P', monospace;
  font-size: 1.5rem;
  width: 60px;
  height: 60px;
  background: var(--bg-secondary);
  color: var(--neon-blue);
  border: 2px solid var(--neon-blue);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: var(--neon-blue);
    color: var(--bg-primary);
    box-shadow: 0 0 10px var(--neon-blue);
  }

  &:active {
    transform: scale(0.95);
  }

  &:nth-child(1) { 
    grid-column: 2; 
    grid-row: 1;
  }
  &:nth-child(2) { 
    grid-column: 1; 
    grid-row: 2;
  }
  &:nth-child(3) { 
    grid-column: 3; 
    grid-row: 2;
  }
  &:nth-child(4) { 
    grid-column: 2; 
    grid-row: 3;
  }
`

const Menu = styled(motion.div)`
  background: var(--bg-secondary);
  border: 3px solid var(--neon-pink);
  padding: 2rem;
  border-radius: 0;
  box-shadow: 0 0 30px var(--neon-pink);
  min-width: 400px;
`

const MenuButton = styled(Button)`
  margin-bottom: 1rem;
  text-transform: uppercase;
`

const BackButton = styled(Link)`
  position: absolute;
  top: 6rem;
  left: 2rem;
  font-family: 'Press Start 2P', monospace;
  color: var(--neon-blue);
  text-decoration: none;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover {
    color: var(--neon-pink);
    transform: translateX(-4px);
  }
`

const PowerUpList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
`

const PowerUpItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
`

const PowerUpIcon = styled.span`
  font-size: 1.2rem;
`

export default function SnakePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<SnakeGameEngine | null>(null)
  const animationFrameRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  
  const { user } = useAuth(false) // Don't require auth for snake game
  const { updateHighScore } = useGameStore()
  
  const [gameMode, setGameMode] = useState<SnakeGameMode | null>(null)
  const [showMenu, setShowMenu] = useState(true)
  const [showPvPMenu, setShowPvPMenu] = useState(false)
  const [score, setScore] = useState(0)
  const [playerScores, setPlayerScores] = useState<Map<string, { name: string; score: number; color: string }>>(new Map())
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isGameOver, setIsGameOver] = useState(false)
  const [roomService] = useState(() => new GameRoomService())
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_currentRoomId, setCurrentRoomId] = useState<string | null>(null) // Will be used for real-time sync
  const [waitingForPlayer, setWaitingForPlayer] = useState(false)

  // Initialize engine when canvas is available
  const initializeEngine = useCallback(() => {
    if (engineRef.current) {
      console.log('Engine already initialized')
      return true
    }
    
    if (!canvasRef.current) {
      console.log('Canvas not available')
      return false
    }
    
    try {
      console.log('Canvas element:', canvasRef.current)
      console.log('Canvas dimensions:', {
        width: canvasRef.current.width,
        height: canvasRef.current.height,
        offsetWidth: canvasRef.current.offsetWidth,
        offsetHeight: canvasRef.current.offsetHeight
      })
      
      console.log('Creating new SnakeGameEngine...')
      const engine = new SnakeGameEngine(canvasRef.current)
      engineRef.current = engine
      
      console.log('Engine created, rendering...')
      engine.render()
      
      console.log('Engine initialized successfully!', engine)
      return true
    } catch (error) {
      console.error('Failed to initialize engine:', error)
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
      return false
    }
  }, [])

  // Try to initialize engine when showMenu changes
  useEffect(() => {
    if (!showMenu) {
      // Use RAF to ensure DOM is updated
      requestAnimationFrame(() => {
        initializeEngine()
      })
    }
  }, [showMenu, initializeEngine])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      // Clean up room service listeners
      roomService.leaveRoom()
    }
  }, [roomService])

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!engineRef.current) return

      const playerId = user?.id || 'guest'
      const directionMap: { [key: string]: Direction } = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        s: 'down',
        a: 'left',
        d: 'right',
      }

      const direction = directionMap[e.key]
      if (direction) {
        e.preventDefault()
        engineRef.current.changeDirection(playerId, direction)
      }

      // Pause/Resume
      if (e.key === ' ' || e.key === 'p') {
        e.preventDefault()
        const state = engineRef.current.getState()
        if (state.status === 'playing') {
          engineRef.current.pauseGame()
        } else if (state.status === 'paused') {
          engineRef.current.resumeGame()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [user])

  // Define handleGameOver before gameLoop
  const handleGameOver = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    const state = engineRef.current?.getState()
    
    if (gameMode === 'solo' && score > 0) {
      updateHighScore('snake', score)
      toast.success(`Game Over! Score: ${score}`)
    } else if (gameMode === 'pvp' && state) {
      // Find winner
      const players = Array.from(state.players.values())
      const winner = players.reduce((prev, current) => 
        (current.score > prev.score) ? current : prev
      )
      toast.success(`${winner.name} wins with ${winner.score} points!`)
    }

    setIsGameOver(true)
  }, [gameMode, score, updateHighScore])

  // Game loop
  const gameLoop = useCallback((timestamp: number) => {
    if (!engineRef.current) return

    const deltaTime = timestamp - lastTimeRef.current
    lastTimeRef.current = timestamp

    engineRef.current.update(deltaTime)
    engineRef.current.render()

    const state = engineRef.current.getState()
    
    // Update UI state
    if (state.mode === 'solo') {
      const playerId = user?.id || 'guest'
      const player = state.players.get(playerId)
      if (player) {
        setScore(player.score)
      }
    } else {
      // Update all player scores for PvP/Tournament
      const scores = new Map<string, { name: string; score: number; color: string }>()
      state.players.forEach((player, id) => {
        scores.set(id, { name: player.name, score: player.score, color: player.color })
      })
      setPlayerScores(scores)
    }
    
    if (state.timeRemaining !== undefined) {
      setTimeRemaining(Math.ceil(state.timeRemaining))
    }
    

    // Check game over
    if (state.status === 'gameOver') {
      handleGameOver()
      return
    }

    // Continue loop
    animationFrameRef.current = requestAnimationFrame(gameLoop)
  }, [user, handleGameOver])

  const startSoloGame = async () => {
    console.log('Starting solo game...')
    
    // Set game mode and hide menu
    setGameMode('solo')
    setShowMenu(false)
    setScore(0)
    setTimeRemaining(null)
    
    // Wait for next frame to ensure DOM updates
    await new Promise(resolve => requestAnimationFrame(resolve))
    
    // Try to initialize engine if not already done
    let attempts = 0
    while (!engineRef.current && attempts < 10) {
      console.log(`Initialization attempt ${attempts + 1}`)
      const success = initializeEngine()
      if (!success) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      attempts++
    }
    
    if (!engineRef.current) {
      console.error('Failed to initialize engine after multiple attempts')
      setShowMenu(true)
      toast.error('Failed to start game. Please refresh and try again.')
      return
    }

    const playerId = user?.id || 'guest'
    const playerName = user?.user_metadata?.username || 'Player'
    
    console.log('Starting game for player:', playerId, playerName)
    
    try {
      engineRef.current.initSoloGame(playerId, playerName)
      lastTimeRef.current = performance.now()
      animationFrameRef.current = requestAnimationFrame(gameLoop)
      setIsGameOver(false)
      console.log('Game started successfully!')
    } catch (error) {
      console.error('Failed to start solo game:', error)
      setShowMenu(true)
      toast.error('Failed to start game')
    }
  }

  const startPvPWithAI = async (difficulty: AIDifficulty) => {
    console.log('Starting PvP game with AI difficulty:', difficulty)
    setShowPvPMenu(false)
    
    // Set game mode and hide menu
    setGameMode('pvp')
    setShowMenu(false)
    setScore(0)
    setTimeRemaining(120)
    
    // Wait for next frame to ensure DOM updates
    await new Promise(resolve => requestAnimationFrame(resolve))
    
    // Try to initialize engine if not already done
    let attempts = 0
    while (!engineRef.current && attempts < 10) {
      console.log(`PvP initialization attempt ${attempts + 1}`)
      const success = initializeEngine()
      if (!success) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      attempts++
    }
    
    if (!engineRef.current) {
      console.error('Failed to initialize engine for PvP')
      setShowMenu(true)
      toast.error('Failed to start game. Please refresh and try again.')
      return
    }

    const playerId = user?.id || 'guest'
    const playerName = user?.user_metadata?.username || 'Player 1'
    
    try {
      engineRef.current.initPvPGame([
        { id: playerId, name: playerName },
        { id: 'bot-1', name: `CPU (${difficulty})`, aiDifficulty: difficulty }
      ])
      lastTimeRef.current = performance.now()
      animationFrameRef.current = requestAnimationFrame(gameLoop)
      setIsGameOver(false)
      console.log('PvP game started successfully!')
    } catch (error) {
      console.error('Failed to start PvP game:', error)
      setShowMenu(true)
      toast.error('Failed to start game')
    }
  }

  const handleCreateRoom = async () => {
    try {
      const result = await roomService.createRoom('snake', {})
      console.log('Room created:', result)
      setCurrentRoomId(result.roomId)
      
      // Set up room update listener for host
      roomService.onRoomUpdated((room) => {
        console.log('Room updated:', room)
        if (room.guest_id && waitingForPlayer) {
          // Guest has joined!
          toast.success('Player 2 has joined!')
          setWaitingForPlayer(false)
        }
      })
      
      toast.success(`Room created! Code: ${result.roomCode}`)
      return result
    } catch (error) {
      console.error('Failed to create room:', error)
      throw error
    }
  }

  const handleJoinRoom = async (roomCode: string) => {
    try {
      const roomId = await roomService.joinRoom(roomCode)
      console.log('Joined room:', roomId)
      setCurrentRoomId(roomId)
      
      // Set up listeners for when host starts the game
      roomService.onRoomUpdated((room) => {
        console.log('Guest received room update:', room)
        if (room.status === 'playing' && showPvPMenu) {
          // Host has started the game, guest should start too
          console.log('Host started game, guest joining...')
          handleStartMultiplayer(room.id, room.room_code, false)
        }
      })
      
      return { success: true, roomId }
    } catch (error) {
      console.error('Failed to join room:', error)
      return { success: false }
    }
  }

  const handleCheckRoomReady = async (roomId: string): Promise<boolean> => {
    try {
      const room = await roomService.getRoom(roomId)
      console.log('Checking room ready:', room)
      
      if (!room) {
        console.error('Room not found')
        return false
      }
      
      // Check if both host and guest are present
      const hasHost = !!room.host_id
      const hasGuest = !!room.guest_id
      
      console.log('Room status:', { hasHost, hasGuest, hostId: room.host_id, guestId: room.guest_id })
      
      if (!hasGuest) {
        setWaitingForPlayer(true)
      }
      
      return hasHost && hasGuest
    } catch (error) {
      console.error('Failed to check room status:', error)
      return false
    }
  }

  const handleStartMultiplayer = async (roomId: string, roomCode: string, isHost: boolean) => {
    console.log('Starting multiplayer game:', { roomId, roomCode, isHost })
    
    // If host, update room status to 'playing'
    if (isHost && roomId) {
      try {
        await roomService.updateRoomStatus(roomId, 'playing')
      } catch (error) {
        console.error('Failed to update room status:', error)
      }
    }
    
    // Hide menus and prepare for game
    setShowPvPMenu(false)
    setShowMenu(false)
    setGameMode('pvp')
    setScore(0)
    setTimeRemaining(120) // 2 minute matches
    
    // Wait for canvas to be ready
    await new Promise(resolve => requestAnimationFrame(resolve))
    
    // Initialize engine if needed
    let attempts = 0
    while (!engineRef.current && attempts < 10) {
      console.log(`Multiplayer initialization attempt ${attempts + 1}`)
      const success = initializeEngine()
      if (!success) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      attempts++
    }
    
    if (!engineRef.current) {
      console.error('Failed to initialize engine for multiplayer')
      setShowMenu(true)
      toast.error('Failed to start game. Please refresh and try again.')
      return
    }

    const playerId = user?.id || 'guest'
    const playerName = user?.user_metadata?.username || 'Player'
    
    try {
      // For now, we'll use the same PvP logic but with placeholder for real multiplayer
      // Initialize game for both players
      if (isHost) {
        // Host is player 1
        engineRef.current.initPvPGame([
          { id: playerId, name: `${playerName} (P1)` },
          { id: 'guest', name: 'Player 2' }
        ])
        toast.success('Game started!')
      } else {
        // Guest is player 2
        engineRef.current.initPvPGame([
          { id: 'host', name: 'Player 1' },
          { id: playerId, name: `${playerName} (P2)` }
        ])
        toast.success('Game started!')
      }
      
      lastTimeRef.current = performance.now()
      animationFrameRef.current = requestAnimationFrame(gameLoop)
      setIsGameOver(false)
      
      // TODO: Set up real-time listeners for game state synchronization
      // roomService.onStateUpdated((state) => { ... })
      // roomService.onEventOccurred((event) => { ... })
      
    } catch (error) {
      console.error('Failed to start multiplayer game:', error)
      setShowMenu(true)
      toast.error('Failed to start game')
    }
  }

  const startPvPGame = async () => {
    console.log('Starting PvP game...')
    
    // Set game mode and hide menu
    setGameMode('pvp')
    setShowMenu(false)
    setScore(0)
    setTimeRemaining(120)
    
    // Wait for next frame to ensure DOM updates
    await new Promise(resolve => requestAnimationFrame(resolve))
    
    // Try to initialize engine if not already done
    let attempts = 0
    while (!engineRef.current && attempts < 10) {
      console.log(`PvP initialization attempt ${attempts + 1}`)
      const success = initializeEngine()
      if (!success) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      attempts++
    }
    
    if (!engineRef.current) {
      console.error('Failed to initialize engine for PvP')
      setShowMenu(true)
      toast.error('Failed to start game. Please refresh and try again.')
      return
    }

    const playerId = user?.id || 'guest'
    const playerName = user?.user_metadata?.username || 'Player 1'
    
    try {
      engineRef.current.initPvPGame([
        { id: playerId, name: playerName },
        { id: 'bot-1', name: 'CPU' }
      ])
      lastTimeRef.current = performance.now()
      animationFrameRef.current = requestAnimationFrame(gameLoop)
      setIsGameOver(false)
      console.log('PvP game started successfully!')
    } catch (error) {
      console.error('Failed to start PvP game:', error)
      setShowMenu(true)
      toast.error('Failed to start game')
    }
  }

  const handleDirectionClick = (direction: Direction) => {
    if (!engineRef.current) return
    const playerId = user?.id || 'guest'
    engineRef.current.changeDirection(playerId, direction)
  }

  return (
    <Container>
      <BackButton href="/">← Back to Arcade</BackButton>
      <Title>SNAKE GAME</Title>

      <AnimatePresence mode="wait">
        {showPvPMenu ? (
          <PvPMenu
            onStartAI={startPvPWithAI}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onStartMultiplayer={handleStartMultiplayer}
            onCheckRoomReady={handleCheckRoomReady}
            onBack={() => setShowPvPMenu(false)}
          />
        ) : showMenu ? (
          <Menu
            key="menu"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <MenuTitle>SELECT MODE</MenuTitle>
            
            <MenuButton 
              onClick={() => {
                console.log('Solo button clicked!')
                startSoloGame()
              }} 
              fullWidth
            >
              Solo Mode
            </MenuButton>
            
            <MenuButton onClick={() => setShowPvPMenu(true)} variant="secondary" fullWidth>
              PvP Mode
            </MenuButton>
            
            <MenuButton variant="danger" fullWidth disabled>
              Tournament Mode
            </MenuButton>
          </Menu>
        ) : (
          <GameContainer key="game">
            <GameArea>
              <Canvas ref={canvasRef} />
              
              {/* Mobile controls */}
              <Controls>
                <ControlButton onClick={() => handleDirectionClick('up')}>↑</ControlButton>
                <ControlButton onClick={() => handleDirectionClick('left')}>←</ControlButton>
                <ControlButton onClick={() => handleDirectionClick('right')}>→</ControlButton>
                <ControlButton onClick={() => handleDirectionClick('down')}>↓</ControlButton>
              </Controls>
            </GameArea>

            <Sidebar>
              <InfoPanel>
                {gameMode === 'solo' ? (
                  <Score>Score: {score}</Score>
                ) : (
                  <PlayerScores>
                    {Array.from(playerScores.entries()).map(([id, data]) => (
                      <PlayerScore key={id} $color={data.color}>
                        {data.name}: {data.score}
                      </PlayerScore>
                    ))}
                  </PlayerScores>
                )}
                {timeRemaining !== null && (
                  <Timer>Time: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</Timer>
                )}
                
                <PowerUpList>
                  <h3 style={{ 
                    fontFamily: "'Press Start 2P', monospace", 
                    fontSize: '0.8rem',
                    color: 'var(--neon-pink)',
                    marginBottom: '0.5rem'
                  }}>Power-Ups:</h3>
                  <PowerUpItem>
                    <PowerUpIcon>⚡</PowerUpIcon> Speed Boost
                  </PowerUpItem>
                  <PowerUpItem>
                    <PowerUpIcon>🐌</PowerUpIcon> Slow Others
                  </PowerUpItem>
                  <PowerUpItem>
                    <PowerUpIcon>👻</PowerUpIcon> Ghost Mode
                  </PowerUpItem>
                  <PowerUpItem>
                    <PowerUpIcon>💎</PowerUpIcon> Double Points
                  </PowerUpItem>
                  <PowerUpItem>
                    <PowerUpIcon>🛡️</PowerUpIcon> Shield
                  </PowerUpItem>
                </PowerUpList>
              </InfoPanel>

              <InfoPanel>
                <h3 style={{ 
                  fontFamily: "'Press Start 2P', monospace", 
                  fontSize: '0.8rem',
                  color: 'var(--neon-blue)',
                  marginBottom: '1rem'
                }}>Controls:</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <p>Arrow Keys or WASD - Move</p>
                  <p>Space or P - Pause</p>
                </div>
              </InfoPanel>

              {isGameOver && (
                <>
                  <Button 
                    onClick={() => {
                      // Reset the engine
                      if (engineRef.current) {
                        engineRef.current.resetGame()
                      }
                      // Restart the appropriate game mode
                      if (gameMode === 'solo') {
                        startSoloGame()
                      } else if (gameMode === 'pvp') {
                        startPvPGame()
                      }
                    }}
                    variant="primary"
                    fullWidth
                  >
                    Restart Game
                  </Button>
                  <div style={{ marginBottom: '1rem' }} />
                </>
              )}

              <Button 
                onClick={() => {
                  if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current)
                  }
                  if (engineRef.current) {
                    // Reset the game state
                    engineRef.current = null
                  }
                  setShowMenu(true)
                  setGameMode(null)
                  setScore(0)
                  setPlayerScores(new Map())
                  setTimeRemaining(null)
                  setIsGameOver(false)
                }}
                variant="danger"
                fullWidth
              >
                Exit Game
              </Button>
            </Sidebar>
          </GameContainer>
        )}
      </AnimatePresence>
    </Container>
  )
}