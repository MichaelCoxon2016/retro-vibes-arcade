export type SnakeGameMode = 'solo' | 'pvp' | 'tournament'
export type Direction = 'up' | 'down' | 'left' | 'right'
export type PowerUpType = 'speed' | 'slow_others' | 'ghost' | 'score' | 'shield' | 'growth' | 'freeze_others' | 'teleport' | 'shrink_others'

export interface Position {
  x: number
  y: number
}

export interface SnakePlayer {
  id: string
  name: string
  snake: Position[]
  direction: Direction
  nextDirection?: Direction
  score: number
  speed: number
  color: string
  alive: boolean
  activePowerUps: ActivePowerUp[]
}

export interface Food {
  position: Position
  value: number
  id: string
}

export interface PowerUp {
  id: string
  position: Position
  type: PowerUpType
  name: string
  icon: string
  color: string
  duration?: number
  tournamentOnly: boolean
}

export interface ActivePowerUp {
  type: PowerUpType
  remainingTime: number
  effect: Record<string, unknown>
}

export interface SnakeGameState {
  mode: SnakeGameMode
  players: Map<string, SnakePlayer>
  food: Food[]
  powerUps: PowerUp[]
  board: {
    width: number
    height: number
    cellSize: number
  }
  status: 'menu' | 'waiting' | 'countdown' | 'playing' | 'paused' | 'gameOver'
  timeRemaining?: number // For PvP and tournament modes
  tournamentId?: string
  winner?: string
}

export interface GameSettings {
  boardSize: 'small' | 'medium' | 'large' | 'massive'
  gameSpeed: 'slow' | 'normal' | 'fast'
  powerUpsEnabled: boolean
  maxPlayers: number
  timeLimit?: number // in seconds
}

export interface Tournament {
  id: string
  name: string
  code: string
  createdBy: string
  maxPlayers: number
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled'
  rules: GameSettings
  createdAt: Date
  startsAt: Date
}

export interface TournamentParticipant {
  id: string
  tournamentId: string
  userId: string
  username: string
  joinedAt: Date
  placement?: number
  totalScore: number
  status: 'waiting' | 'ready' | 'playing' | 'eliminated' | 'winner'
}

// Board size configurations
export const BOARD_SIZES = {
  small: { width: 20, height: 20, cellSize: 20 },
  medium: { width: 30, height: 25, cellSize: 18 },
  large: { width: 40, height: 30, cellSize: 16 },
  massive: { width: 60, height: 40, cellSize: 14 }, // For tournaments
}

// Game speed configurations (milliseconds per frame)
export const GAME_SPEEDS = {
  slow: 150,
  normal: 100,
  fast: 60,
}

// Colors for different players
export const PLAYER_COLORS = [
  '#39FF14', // Neon green
  '#FF10F0', // Neon pink
  '#00D9FF', // Neon blue
  '#FFFF00', // Neon yellow
  '#FF6600', // Neon orange
  '#9D00FF', // Neon purple
]

// Power-up effects
export const POWERUP_EFFECTS = {
  speed: { multiplier: 2 },
  slow_others: { multiplier: 0.5 },
  ghost: { passThrough: true },
  score: { multiplier: 2 },
  shield: { protection: 1 },
  growth: { segments: 5 },
  freeze_others: { frozen: true },
  teleport: { random: true },
  shrink_others: { segments: -3 },
}