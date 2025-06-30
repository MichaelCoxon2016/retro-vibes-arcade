import { SnakeGameEngine } from './snake-engine'
import { GameRoomService, GameState, GameEvent } from '@/lib/realtime/game-room-service'
import { Direction, Position, PowerUpType } from '@/types/snake'

interface SyncedGameState {
  players: Array<{
    id: string
    name: string
    snake: Position[]
    direction: Direction
    score: number
    color: string
    alive: boolean
  }>
  food: Array<{
    id: string
    position: Position
    value: number
  }>
  powerUps: Array<{
    id: string
    position: Position
    type: string
  }>
  timeRemaining?: number
}

export class MultiplayerSnakeSync {
  private engine: SnakeGameEngine
  private roomService: GameRoomService
  private roomId: string
  private playerId: string
  private isHost: boolean
  private lastSyncTime: number = 0
  private syncInterval: number = 50 // Sync every 50ms
  private sequenceNumber: number = 0
  private lastProcessedSequence: Map<string, number> = new Map()
  private stateBuffer: Map<string, GameState[]> = new Map()
  private eventQueue: GameEvent[] = []

  constructor(
    engine: SnakeGameEngine,
    roomService: GameRoomService,
    roomId: string,
    playerId: string,
    isHost: boolean
  ) {
    this.engine = engine
    this.roomService = roomService
    this.roomId = roomId
    this.playerId = playerId
    this.isHost = isHost

    this.setupListeners()
    
    // If we're the host, immediately send the initial game state
    if (this.isHost) {
      setTimeout(() => {
        this.syncState(performance.now())
      }, 100)
    }
  }

  private setupListeners() {
    // Listen for state updates from other players
    this.roomService.onStateUpdated((state: GameState) => {
      if (state.player_id !== this.playerId) {
        this.handleRemoteState(state)
      }
    })

    // Listen for game events
    this.roomService.onEventOccurred((event: GameEvent) => {
      if (event.created_by !== this.playerId) {
        this.handleRemoteEvent(event)
      }
    })
  }

  private handleRemoteState(state: GameState) {
    const remotePlayerId = state.player_id
    
    // Check sequence number to avoid processing old states
    const lastSequence = this.lastProcessedSequence.get(remotePlayerId) || -1
    if (state.sequence_number <= lastSequence) {
      return // Ignore old state
    }

    // Buffer states for interpolation
    if (!this.stateBuffer.has(remotePlayerId)) {
      this.stateBuffer.set(remotePlayerId, [])
    }
    const buffer = this.stateBuffer.get(remotePlayerId)!
    buffer.push(state)
    
    // Keep only recent states
    if (buffer.length > 10) {
      buffer.shift()
    }

    // Apply the state
    this.applyRemoteState(state)
    this.lastProcessedSequence.set(remotePlayerId, state.sequence_number)
  }

  private applyRemoteState(state: GameState) {
    const syncedState = state.state as unknown as SyncedGameState
    const engineState = this.engine.getState()
    
    console.log('Applying remote state from player:', state.player_id)
    console.log('Synced players:', syncedState.players)

    // Update remote player positions and states
    syncedState.players.forEach(remotePlayer => {
      if (remotePlayer.id !== this.playerId) {
        console.log('Updating remote player:', remotePlayer.id, remotePlayer.name)
        const localPlayer = engineState.players.get(remotePlayer.id)
        if (localPlayer) {
          // Update position with interpolation
          localPlayer.snake = remotePlayer.snake
          localPlayer.direction = remotePlayer.direction
          localPlayer.score = remotePlayer.score
          localPlayer.alive = remotePlayer.alive
        } else {
          console.log('Adding new remote player:', remotePlayer.id)
          // Add new player if they don't exist
          engineState.players.set(remotePlayer.id, {
            id: remotePlayer.id,
            name: remotePlayer.name,
            snake: remotePlayer.snake,
            direction: remotePlayer.direction,
            nextDirection: undefined,
            score: remotePlayer.score,
            speed: 1,
            color: remotePlayer.color,
            alive: remotePlayer.alive,
            activePowerUps: []
          })
        }
      }
    })

    // Host is authoritative for food and power-ups
    if (!this.isHost) {
      engineState.food = syncedState.food
      engineState.powerUps = syncedState.powerUps.map(pu => ({
        ...pu,
        type: pu.type as PowerUpType,
        ...this.engine.getPowerUpData(pu.type as PowerUpType)
      }))
      
      if (syncedState.timeRemaining !== undefined) {
        engineState.timeRemaining = syncedState.timeRemaining
      }
    }
  }

  private handleRemoteEvent(event: GameEvent) {
    this.eventQueue.push(event)
    this.processEventQueue()
  }

  private processEventQueue() {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!
      
      switch (event.event_type) {
        case 'direction_change':
          this.handleDirectionChange(event)
          break
        case 'food_collected':
          this.handleFoodCollected(event)
          break
        case 'powerup_collected':
          this.handlePowerUpCollected(event)
          break
        case 'player_died':
          this.handlePlayerDied(event)
          break
        case 'game_over':
          this.handleGameOver(event)
          break
      }
    }
  }

  private handleDirectionChange(event: GameEvent) {
    const { playerId, direction } = event.event_data as { playerId: string; direction: Direction }
    this.engine.changeDirection(playerId, direction)
  }

  private handleFoodCollected(event: GameEvent) {
    if (!this.isHost) return // Only host handles food spawning
    
    const { foodId } = event.event_data as { foodId: string; playerId: string }
    const state = this.engine.getState()
    
    // Remove the food
    state.food = state.food.filter(f => f.id !== foodId)
    
    // Host will spawn new food in the next update
  }

  private handlePowerUpCollected(event: GameEvent) {
    if (!this.isHost) return // Only host handles power-ups
    
    const { powerUpId } = event.event_data as { powerUpId: string; playerId: string }
    const state = this.engine.getState()
    
    // Remove the power-up
    state.powerUps = state.powerUps.filter(p => p.id !== powerUpId)
  }

  private handlePlayerDied(event: GameEvent) {
    const { playerId } = event.event_data as { playerId: string }
    const state = this.engine.getState()
    const player = state.players.get(playerId)
    if (player) {
      player.alive = false
    }
  }

  private handleGameOver(event: GameEvent) {
    const { winner } = event.event_data as { winner: string }
    const state = this.engine.getState()
    state.status = 'gameOver'
    state.winner = winner
  }

  public async syncState(timestamp: number) {
    // Only sync at specified interval
    if (timestamp - this.lastSyncTime < this.syncInterval) {
      return
    }

    this.lastSyncTime = timestamp
    const state = this.engine.getState()

    // Prepare synced state
    const syncedState: SyncedGameState = {
      players: Array.from(state.players.values()).map(p => ({
        id: p.id,
        name: p.name,
        snake: p.snake,
        direction: p.direction,
        score: p.score,
        color: p.color,
        alive: p.alive
      })),
      food: state.food,
      powerUps: state.powerUps.map(pu => ({
        id: pu.id,
        position: pu.position,
        type: pu.type
      })),
      timeRemaining: state.timeRemaining
    }

    // Send state update
    try {
      await this.roomService.sendGameState(syncedState as unknown as Record<string, unknown>, this.sequenceNumber++)
    } catch (error) {
      console.error('Failed to sync state:', error)
    }
  }

  public async sendEvent(eventType: string, eventData: Record<string, unknown>) {
    try {
      await this.roomService.sendGameEvent(eventType, eventData)
    } catch (error) {
      console.error('Failed to send event:', error)
    }
  }

  public async sendDirectionChange(direction: Direction) {
    await this.sendEvent('direction_change', {
      playerId: this.playerId,
      direction
    })
  }

  public async sendFoodCollected(foodId: string) {
    await this.sendEvent('food_collected', {
      playerId: this.playerId,
      foodId
    })
  }

  public async sendPowerUpCollected(powerUpId: string) {
    await this.sendEvent('powerup_collected', {
      playerId: this.playerId,
      powerUpId
    })
  }

  public async sendPlayerDied() {
    await this.sendEvent('player_died', {
      playerId: this.playerId
    })
  }

  public async sendGameOver(winner: string) {
    await this.sendEvent('game_over', {
      winner
    })
  }

  public cleanup() {
    this.stateBuffer.clear()
    this.eventQueue = []
    this.lastProcessedSequence.clear()
  }
}