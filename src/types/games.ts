export type GameType = 'snake' | 'parkour' | 'pacman' | 'space-invaders' | 'tetris' | 'pong' | 'breakout'

export interface Game {
  id: GameType
  name: string
  description: string
  icon: string
  bgColor: string
  accentColor: string
  difficulty: 'easy' | 'medium' | 'hard'
  multiplayer: boolean
  comingSoon?: boolean
}

export interface GameScore {
  id: string
  userId: string
  gameType: GameType
  score: number
  timestamp: Date
}

export interface GameState {
  gameType: GameType
  score: number
  level: number
  lives: number
  isPaused: boolean
  isGameOver: boolean
  data: unknown // Game-specific data
}

export interface SnakeGameState extends GameState {
  data: {
    snake: { x: number; y: number }[]
    food: { x: number; y: number }
    direction: 'up' | 'down' | 'left' | 'right'
    gridSize: number
    speed: number
  }
}

export interface ParkourGameState extends GameState {
  data: {
    playerX: number
    playerY: number
    velocityX: number
    velocityY: number
    isJumping: boolean
    canDoubleJump: boolean
    obstacles: Obstacle[]
    powerUps: PowerUp[]
    boss?: Boss
  }
}

export interface Obstacle {
  x: number
  y: number
  width: number
  height: number
  type: 'spike' | 'platform' | 'moving' | 'rotating'
  damage?: number
}

export interface PowerUp {
  x: number
  y: number
  type: 'speed' | 'jump' | 'shield' | 'health'
  collected: boolean
}

export interface Boss {
  x: number
  y: number
  health: number
  maxHealth: number
  pattern: 'chase' | 'shoot' | 'stomp'
  phase: number
}