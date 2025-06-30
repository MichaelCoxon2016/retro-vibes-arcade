import { 
  SnakeGameState, 
  SnakePlayer, 
  Direction, 
  Position, 
  PowerUp,
  BOARD_SIZES,
  GAME_SPEEDS,
  PLAYER_COLORS,
  PowerUpType
} from '@/types/snake'
import { SnakeAI, AIDifficulty } from './snake-ai'

export class SnakeGameEngine {
  private state: SnakeGameState
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private lastUpdateTime: number = 0
  private baseSpeed: number = GAME_SPEEDS.normal
  private foodIdCounter: number = 0
  private powerUpIdCounter: number = 0
  private aiPlayers: Map<string, SnakeAI> = new Map()
  private aiMoveCounter: number = 0

  constructor(canvas: HTMLCanvasElement, mode: SnakeGameState['mode'] = 'solo') {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas')
    }
    this.ctx = ctx
    
    const boardSize = mode === 'tournament' ? 'massive' : 'medium'
    const board = BOARD_SIZES[boardSize]
    
    this.state = {
      mode,
      players: new Map(),
      food: [],
      powerUps: [],
      board,
      status: 'menu',
    }

    this.setupCanvas()
    // Do an initial render to show the canvas is working
    this.render()
  }

  private setupCanvas() {
    const { width, height, cellSize } = this.state.board
    this.canvas.width = width * cellSize
    this.canvas.height = height * cellSize
    this.ctx.imageSmoothingEnabled = false
    
    // Set canvas style to ensure it's visible
    this.canvas.style.width = `${this.canvas.width}px`
    this.canvas.style.height = `${this.canvas.height}px`
    
    console.log('Canvas setup:', { 
      width: this.canvas.width, 
      height: this.canvas.height,
      boardWidth: width,
      boardHeight: height,
      cellSize,
      context: this.ctx ? 'valid' : 'invalid'
    })
  }

  public initSoloGame(playerId: string, playerName: string) {
    console.log('Initializing solo game for:', playerId, playerName)
    
    // Start in the middle of the board
    const centerX = Math.floor(this.state.board.width / 2)
    const centerY = Math.floor(this.state.board.height / 2)
    
    const player: SnakePlayer = {
      id: playerId,
      name: playerName,
      snake: [
        { x: centerX, y: centerY },
        { x: centerX - 1, y: centerY },
        { x: centerX - 2, y: centerY },
        { x: centerX - 3, y: centerY }
      ],
      direction: 'right',
      score: 0,
      speed: 1,
      color: PLAYER_COLORS[0], // Neon green
      alive: true,
      activePowerUps: []
    }
    
    console.log('Player created:', player)
    
    this.state.players.set(playerId, player)
    
    // Spawn multiple food items
    for (let i = 0; i < 3; i++) {
      this.spawnFood()
    }
    
    console.log('Food spawned:', this.state.food)
    
    this.state.status = 'playing'
    
    // Do an initial render
    this.render()
  }

  public initPvPGame(players: { id: string; name: string; aiDifficulty?: AIDifficulty }[]) {
    const positions = this.getStartPositions(players.length)
    
    players.forEach((p, index) => {
      const player: SnakePlayer = {
        id: p.id,
        name: p.name,
        snake: [
          { x: positions[index].x, y: positions[index].y },
          { x: positions[index].x - 1, y: positions[index].y },
          { x: positions[index].x - 2, y: positions[index].y }
        ],
        direction: 'right',
        score: 0,
        speed: 1,
        color: PLAYER_COLORS[index],
        alive: true,
        activePowerUps: []
      }
      this.state.players.set(p.id, player)
      
      // Create AI instance for bot players
      if (p.id.startsWith('bot-') && p.aiDifficulty) {
        this.aiPlayers.set(p.id, new SnakeAI(p.aiDifficulty))
      }
    })

    // Spawn multiple food items for PvP
    for (let i = 0; i < 5; i++) {
      this.spawnFood()
    }
    
    this.state.timeRemaining = 120 // 2 minutes
    this.state.status = 'playing' // Start immediately
  }

  public update(deltaTime: number) {
    if (this.state.status !== 'playing') return

    this.lastUpdateTime += deltaTime
    this.aiMoveCounter += deltaTime

    // Update power-up timers
    this.updatePowerUps(deltaTime)

    // Update time remaining for PvP/Tournament
    if (this.state.timeRemaining !== undefined) {
      this.state.timeRemaining -= deltaTime / 1000
      if (this.state.timeRemaining <= 0) {
        this.endGame()
        return
      }
    }

    // Update AI direction for bot players
    if (this.aiMoveCounter >= this.baseSpeed * 0.8) { // AI thinks slightly ahead
      this.state.players.forEach(player => {
        if (player.id.startsWith('bot-') && player.alive) {
          const ai = this.aiPlayers.get(player.id)
          if (ai) {
            const foodPositions = this.state.food.map(f => f.position)
            const otherPlayers = Array.from(this.state.players.values()).filter(p => p.id !== player.id)
            const nextDirection = ai.getNextDirection(
              player,
              foodPositions,
              this.state.board.width,
              this.state.board.height,
              otherPlayers,
              Date.now()
            )
            player.nextDirection = nextDirection
          }
        }
      })
      this.aiMoveCounter = 0
    }

    // Move snakes based on their individual speeds
    this.state.players.forEach(player => {
      if (!player.alive) return

      const speedMultiplier = this.getSpeedMultiplier(player)
      const moveInterval = this.baseSpeed / speedMultiplier

      if (this.lastUpdateTime >= moveInterval) {
        this.moveSnake(player)
      }
    })

    if (this.lastUpdateTime >= this.baseSpeed) {
      this.lastUpdateTime = 0
      
      // Spawn power-ups occasionally
      if (Math.random() < 0.02 && this.state.powerUps.length < 3) {
        this.spawnPowerUp()
      }
    }

    // Check win conditions
    this.checkWinConditions()
  }

  private moveSnake(player: SnakePlayer) {
    if (player.nextDirection) {
      if (this.isValidDirectionChange(player.direction, player.nextDirection)) {
        player.direction = player.nextDirection
      }
      player.nextDirection = undefined
    }

    const head = { ...player.snake[0] }

    // Move head based on direction
    switch (player.direction) {
      case 'up': head.y--; break
      case 'down': head.y++; break
      case 'left': head.x--; break
      case 'right': head.x++; break
    }

    // Check collisions
    if (this.checkCollisions(player, head)) {
      if (!this.hasShield(player)) {
        player.alive = false
        return
      } else {
        this.removeShield(player)
      }
    }

    // Add new head
    player.snake.unshift(head)

    // Check food collision
    let ateFood = false
    this.state.food.forEach((food, index) => {
      if (food.position.x === head.x && food.position.y === head.y) {
        const scoreMultiplier = this.getScoreMultiplier(player)
        player.score += food.value * scoreMultiplier
        this.state.food.splice(index, 1)
        ateFood = true
        this.spawnFood()

        // Speed increases with score in solo mode (slower progression)
        if (this.state.mode === 'solo') {
          // Speed increases every 100 points instead of 50, and by 0.05 instead of 0.1
          player.speed = 1 + Math.floor(player.score / 100) * 0.05
          // Cap max speed at 1.5x
          player.speed = Math.min(player.speed, 1.5)
        }
      }
    })

    // Check power-up collision
    this.state.powerUps.forEach((powerUp, index) => {
      if (powerUp.position.x === head.x && powerUp.position.y === head.y) {
        this.collectPowerUp(player, powerUp)
        this.state.powerUps.splice(index, 1)
      }
    })

    // Remove tail if didn't eat food
    if (!ateFood) {
      player.snake.pop()
    }
  }

  private checkCollisions(player: SnakePlayer, head: Position): boolean {
    const { width, height } = this.state.board
    const hasGhost = this.hasGhostMode(player)

    // Wall collision
    if (!hasGhost && (head.x < 0 || head.x >= width || head.y < 0 || head.y >= height)) {
      return true
    }

    // Self collision
    if (!hasGhost) {
      for (let i = 1; i < player.snake.length; i++) {
        if (player.snake[i].x === head.x && player.snake[i].y === head.y) {
          return true
        }
      }
    }

    // Other player collision (in PvP/Tournament)
    if (!hasGhost && this.state.mode !== 'solo') {
      for (const [id, otherPlayer] of this.state.players) {
        if (id !== player.id && otherPlayer.alive) {
          for (const segment of otherPlayer.snake) {
            if (segment.x === head.x && segment.y === head.y) {
              return true
            }
          }
        }
      }
    }

    return false
  }

  private spawnFood() {
    const position = this.getRandomEmptyPosition()
    if (position) {
      this.state.food.push({
        position,
        value: 10,
        id: `food-${this.foodIdCounter++}`
      })
    }
  }

  private spawnPowerUp() {
    const position = this.getRandomEmptyPosition()
    if (!position) return

    // In tournament mode, include tournament-only power-ups
    const availablePowerUps = this.state.mode === 'tournament' 
      ? ['speed', 'slow_others', 'ghost', 'score', 'shield', 'growth', 'freeze_others', 'teleport', 'shrink_others']
      : ['speed', 'slow_others', 'ghost', 'score', 'shield']

    const type = availablePowerUps[Math.floor(Math.random() * availablePowerUps.length)] as PowerUpType
    
    const powerUpData = this.getPowerUpData(type)
    
    this.state.powerUps.push({
      id: `powerup-${this.powerUpIdCounter++}`,
      position,
      type,
      ...powerUpData
    })
  }


  private collectPowerUp(player: SnakePlayer, powerUp: PowerUp) {
    switch (powerUp.type) {
      case 'growth':
        // Instant growth
        for (let i = 0; i < 5; i++) {
          const tail = player.snake[player.snake.length - 1]
          player.snake.push({ ...tail })
        }
        break
        
      case 'teleport':
        // Random teleport
        const newPos = this.getRandomEmptyPosition()
        if (newPos) {
          const headDirection = this.getHeadDirection(player)
          player.snake = [
            newPos,
            { x: newPos.x - headDirection.x, y: newPos.y - headDirection.y },
            { x: newPos.x - headDirection.x * 2, y: newPos.y - headDirection.y * 2 }
          ]
        }
        break
        
      case 'shrink_others':
        // Shrink all other players
        this.state.players.forEach((otherPlayer, id) => {
          if (id !== player.id && otherPlayer.alive && otherPlayer.snake.length > 3) {
            otherPlayer.snake = otherPlayer.snake.slice(0, otherPlayer.snake.length - 3)
          }
        })
        break
        
      default:
        // Add timed power-up
        if (powerUp.duration) {
          player.activePowerUps.push({
            type: powerUp.type,
            remainingTime: powerUp.duration,
            effect: {}
          })
        }
    }
  }

  private updatePowerUps(deltaTime: number) {
    this.state.players.forEach(player => {
      player.activePowerUps = player.activePowerUps.filter(powerUp => {
        powerUp.remainingTime -= deltaTime / 1000
        return powerUp.remainingTime > 0
      })
    })
  }

  private getSpeedMultiplier(player: SnakePlayer): number {
    let multiplier = player.speed

    // Check for speed boost
    if (player.activePowerUps.some(p => p.type === 'speed')) {
      multiplier *= 2
    }

    // Check if slowed by others
    const otherPlayers = Array.from(this.state.players.values()).filter(p => p.id !== player.id)
    if (otherPlayers.some(p => p.activePowerUps.some(pu => pu.type === 'slow_others'))) {
      multiplier *= 0.5
    }

    // Check if frozen
    if (otherPlayers.some(p => p.activePowerUps.some(pu => pu.type === 'freeze_others'))) {
      multiplier = 0
    }

    return multiplier
  }

  private getScoreMultiplier(player: SnakePlayer): number {
    return player.activePowerUps.some(p => p.type === 'score') ? 2 : 1
  }

  private hasGhostMode(player: SnakePlayer): boolean {
    return player.activePowerUps.some(p => p.type === 'ghost')
  }

  private hasShield(player: SnakePlayer): boolean {
    return player.activePowerUps.some(p => p.type === 'shield')
  }

  private removeShield(player: SnakePlayer) {
    player.activePowerUps = player.activePowerUps.filter(p => p.type !== 'shield')
  }

  private getRandomPosition(): Position {
    return {
      x: Math.floor(Math.random() * this.state.board.width),
      y: Math.floor(Math.random() * this.state.board.height)
    }
  }

  private getRandomEmptyPosition(): Position | null {
    const maxAttempts = 100
    
    for (let i = 0; i < maxAttempts; i++) {
      const pos = this.getRandomPosition()
      
      // Check if position is occupied
      let occupied = false
      
      // Check snake positions
      for (const player of this.state.players.values()) {
        if (player.snake.some(s => s.x === pos.x && s.y === pos.y)) {
          occupied = true
          break
        }
      }
      
      // Check food positions
      if (!occupied && this.state.food.some(f => f.position.x === pos.x && f.position.y === pos.y)) {
        occupied = true
      }
      
      // Check power-up positions
      if (!occupied && this.state.powerUps.some(p => p.position.x === pos.x && p.position.y === pos.y)) {
        occupied = true
      }
      
      if (!occupied) return pos
    }
    
    return null
  }

  private getStartPositions(playerCount: number): Position[] {
    const { width, height } = this.state.board
    const positions: Position[] = []
    
    // Distribute players evenly around the board
    const margin = 5
    
    if (playerCount === 1) {
      positions.push({ x: Math.floor(width / 2), y: Math.floor(height / 2) })
    } else if (playerCount === 2) {
      positions.push({ x: margin, y: Math.floor(height / 2) })
      positions.push({ x: width - margin, y: Math.floor(height / 2) })
    } else {
      // For 3-6 players, distribute in a circle
      const centerX = Math.floor(width / 2)
      const centerY = Math.floor(height / 2)
      const radius = Math.min(width, height) / 3
      
      for (let i = 0; i < playerCount; i++) {
        const angle = (i * 2 * Math.PI) / playerCount
        positions.push({
          x: Math.floor(centerX + radius * Math.cos(angle)),
          y: Math.floor(centerY + radius * Math.sin(angle))
        })
      }
    }
    
    return positions
  }

  private getHeadDirection(player: SnakePlayer): Position {
    switch (player.direction) {
      case 'up': return { x: 0, y: -1 }
      case 'down': return { x: 0, y: 1 }
      case 'left': return { x: -1, y: 0 }
      case 'right': return { x: 1, y: 0 }
    }
  }

  private checkWinConditions() {
    const alivePlayers = Array.from(this.state.players.values()).filter(p => p.alive)
    
    if (this.state.mode === 'solo' && alivePlayers.length === 0) {
      this.endGame()
    } else if (this.state.mode !== 'solo' && alivePlayers.length <= 1) {
      this.endGame()
    }
  }

  private endGame() {
    this.state.status = 'gameOver'
    
    // Determine winner
    const players = Array.from(this.state.players.values())
    const winner = players.reduce((prev, current) => 
      (current.score > prev.score) ? current : prev
    )
    
    this.state.winner = winner.id
  }

  public changeDirection(playerId: string, direction: Direction) {
    const player = this.state.players.get(playerId)
    if (player && player.alive) {
      player.nextDirection = direction
    }
  }

  public pauseGame() {
    if (this.state.status === 'playing') {
      this.state.status = 'paused'
    }
  }

  public resumeGame() {
    if (this.state.status === 'paused') {
      this.state.status = 'playing'
    }
  }

  public resetGame() {
    // Clear all game state
    this.state.players.clear()
    this.state.food = []
    this.state.powerUps = []
    this.state.status = 'menu'
    this.state.timeRemaining = undefined
    this.state.winner = undefined
    this.lastUpdateTime = 0
    this.foodIdCounter = 0
    this.powerUpIdCounter = 0
    this.aiMoveCounter = 0
    this.aiPlayers.clear()
    
    // Clear canvas
    this.render()
  }

  public render() {
    if (!this.ctx) {
      console.error('No canvas context available')
      return
    }
    
    const { cellSize } = this.state.board
    
    // Clear canvas with dark background
    this.ctx.fillStyle = '#0A0A0A'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    // Always draw the game board outline
    this.ctx.strokeStyle = '#00FF00'
    this.ctx.lineWidth = 3
    this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height)
    
    // If no game is active, show waiting message
    if (this.state.status === 'menu' || this.state.players.size === 0) {
      this.ctx.fillStyle = '#00FF00'
      this.ctx.font = '16px monospace'
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillText('Ready to play!', this.canvas.width / 2, this.canvas.height / 2)
      this.ctx.fillText('Select a game mode to start', this.canvas.width / 2, this.canvas.height / 2 + 25)
      return
    }
    
    // Draw grid with more visible lines
    this.ctx.strokeStyle = '#2A2A2A'
    this.ctx.lineWidth = 1
    for (let x = 0; x < this.canvas.width; x += cellSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(x, 0)
      this.ctx.lineTo(x, this.canvas.height)
      this.ctx.stroke()
    }
    for (let y = 0; y < this.canvas.height; y += cellSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, y)
      this.ctx.lineTo(this.canvas.width, y)
      this.ctx.stroke()
    }
    
    // Draw food
    this.state.food.forEach(food => {
      // Draw a bright red square for food
      this.ctx.fillStyle = '#FF0000'
      this.ctx.shadowColor = '#FF0000'
      this.ctx.shadowBlur = 15
      
      // Make food slightly larger and centered
      const foodSize = cellSize - 6
      const offset = 3
      this.ctx.fillRect(
        food.position.x * cellSize + offset,
        food.position.y * cellSize + offset,
        foodSize,
        foodSize
      )
      
      // Add a bright center
      this.ctx.fillStyle = '#FF6666'
      this.ctx.fillRect(
        food.position.x * cellSize + cellSize / 3,
        food.position.y * cellSize + cellSize / 3,
        cellSize / 3,
        cellSize / 3
      )
      
      this.ctx.shadowBlur = 0
    })
    
    // Draw power-ups
    this.state.powerUps.forEach(powerUp => {
      this.ctx.fillStyle = powerUp.color
      this.ctx.shadowColor = powerUp.color
      this.ctx.shadowBlur = 15
      
      // Draw power-up as a circle
      this.ctx.beginPath()
      this.ctx.arc(
        powerUp.position.x * cellSize + cellSize / 2,
        powerUp.position.y * cellSize + cellSize / 2,
        cellSize / 2 - 2,
        0,
        Math.PI * 2
      )
      this.ctx.fill()
      
      // Draw icon
      this.ctx.fillStyle = '#000000'
      this.ctx.font = `${cellSize * 0.6}px Arial`
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillText(
        powerUp.icon,
        powerUp.position.x * cellSize + cellSize / 2,
        powerUp.position.y * cellSize + cellSize / 2
      )
      
      this.ctx.shadowBlur = 0
    })
    
    // Draw snakes
    this.state.players.forEach(player => {
      if (!player.alive) return
      
      const hasGhost = this.hasGhostMode(player)
      const opacity = hasGhost ? 0.5 : 1
      
      this.ctx.globalAlpha = opacity
      
      player.snake.forEach((segment, index) => {
        // Use bright colors for the snake
        this.ctx.fillStyle = player.color
        this.ctx.shadowColor = player.color
        this.ctx.shadowBlur = 20
        
        // Head is much brighter
        if (index === 0) {
          this.ctx.fillStyle = this.brightenColor(player.color)
          this.ctx.shadowBlur = 30
          
          // Draw eyes on the head
          const headX = segment.x * cellSize
          const headY = segment.y * cellSize
          
          // Main head square
          this.ctx.fillRect(
            headX + 2,
            headY + 2,
            cellSize - 4,
            cellSize - 4
          )
          
          // Eyes based on direction
          this.ctx.fillStyle = '#000000'
          const eyeSize = 3
          const eyeOffset = cellSize / 4
          
          switch (player.direction) {
            case 'up':
              this.ctx.fillRect(headX + eyeOffset, headY + eyeOffset, eyeSize, eyeSize)
              this.ctx.fillRect(headX + cellSize - eyeOffset - eyeSize, headY + eyeOffset, eyeSize, eyeSize)
              break
            case 'down':
              this.ctx.fillRect(headX + eyeOffset, headY + cellSize - eyeOffset - eyeSize, eyeSize, eyeSize)
              this.ctx.fillRect(headX + cellSize - eyeOffset - eyeSize, headY + cellSize - eyeOffset - eyeSize, eyeSize, eyeSize)
              break
            case 'left':
              this.ctx.fillRect(headX + eyeOffset, headY + eyeOffset, eyeSize, eyeSize)
              this.ctx.fillRect(headX + eyeOffset, headY + cellSize - eyeOffset - eyeSize, eyeSize, eyeSize)
              break
            case 'right':
              this.ctx.fillRect(headX + cellSize - eyeOffset - eyeSize, headY + eyeOffset, eyeSize, eyeSize)
              this.ctx.fillRect(headX + cellSize - eyeOffset - eyeSize, headY + cellSize - eyeOffset - eyeSize, eyeSize, eyeSize)
              break
          }
        } else {
          // Body segments
          this.ctx.fillRect(
            segment.x * cellSize + 3,
            segment.y * cellSize + 3,
            cellSize - 6,
            cellSize - 6
          )
        }
      })
      
      // Draw active power-up indicators
      player.activePowerUps.forEach((powerUp, index) => {
        const powerUpData = this.getPowerUpData(powerUp.type)
        this.ctx.fillStyle = powerUpData.color
        this.ctx.fillRect(
          player.snake[0].x * cellSize + cellSize - 6,
          player.snake[0].y * cellSize + index * 6,
          4,
          4
        )
      })
      
      this.ctx.globalAlpha = 1
      this.ctx.shadowBlur = 0
    })
  }

  private brightenColor(color: string): string {
    // Simple color brightening
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    return `rgb(${Math.min(255, r + 50)}, ${Math.min(255, g + 50)}, ${Math.min(255, b + 50)})`
  }

  public getState(): SnakeGameState {
    return this.state
  }

  public isValidDirectionChange(current: Direction, next: Direction): boolean {
    const opposites = {
      up: 'down',
      down: 'up',
      left: 'right',
      right: 'left'
    }
    return opposites[current] !== next
  }

  // Multiplayer support methods
  public initMultiplayerGame(players: { id: string; name: string; isLocal: boolean }[]) {
    console.log('SnakeEngine: Initializing multiplayer game with players:', players)
    
    const positions = this.getStartPositions(players.length)
    
    players.forEach((p, index) => {
      const player: SnakePlayer = {
        id: p.id,
        name: p.name,
        snake: [
          { x: positions[index].x, y: positions[index].y },
          { x: positions[index].x - 1, y: positions[index].y },
          { x: positions[index].x - 2, y: positions[index].y }
        ],
        direction: 'right',
        score: 0,
        speed: 1,
        color: PLAYER_COLORS[index],
        alive: true,
        activePowerUps: []
      }
      this.state.players.set(p.id, player)
      console.log(`SnakeEngine: Added player ${p.name} (${p.id}) at position ${index} with color ${PLAYER_COLORS[index]}`)
    })
    
    console.log('SnakeEngine: Total players in game:', this.state.players.size)

    // Spawn food items
    for (let i = 0; i < 5; i++) {
      this.spawnFood()
    }
    
    this.state.timeRemaining = 120 // 2 minute matches
    this.state.status = 'playing'
  }

  public addPlayer(id: string, name: string, color: string, snake: Position[]) {
    const player: SnakePlayer = {
      id,
      name,
      snake,
      direction: 'right',
      nextDirection: undefined,
      score: 0,
      speed: 1,
      color,
      alive: true,
      activePowerUps: []
    }
    this.state.players.set(id, player)
  }

  public removePlayer(id: string) {
    this.state.players.delete(id)
  }

  public updatePlayerPosition(id: string, snake: Position[], direction: Direction) {
    const player = this.state.players.get(id)
    if (player) {
      player.snake = snake
      player.direction = direction
    }
  }

  public getFoodById(id: string) {
    return this.state.food.find(f => f.id === id)
  }

  public removeFoodById(id: string) {
    const index = this.state.food.findIndex(f => f.id === id)
    if (index !== -1) {
      this.state.food.splice(index, 1)
    }
  }

  public getPowerUpById(id: string) {
    return this.state.powerUps.find(p => p.id === id)
  }

  public removePowerUpById(id: string) {
    const index = this.state.powerUps.findIndex(p => p.id === id)
    if (index !== -1) {
      this.state.powerUps.splice(index, 1)
    }
  }

  public setFood(food: typeof this.state.food) {
    this.state.food = food
  }

  public setPowerUps(powerUps: typeof this.state.powerUps) {
    this.state.powerUps = powerUps
  }

  // Make getPowerUpData public for multiplayer sync
  public getPowerUpData(type: PowerUpType) {
    const data = {
      speed: { name: 'Speed Boost', icon: '⚡', color: '#FFFF00', duration: 5, tournamentOnly: false },
      slow_others: { name: 'Slow Motion', icon: '🐌', color: '#00FFFF', duration: 5, tournamentOnly: false },
      ghost: { name: 'Ghost Mode', icon: '👻', color: '#9D00FF', duration: 5, tournamentOnly: false },
      score: { name: 'Double Points', icon: '💎', color: '#FF00FF', duration: 10, tournamentOnly: false },
      shield: { name: 'Shield', icon: '🛡️', color: '#00FF00', tournamentOnly: false },
      growth: { name: 'Mega Growth', icon: '🔥', color: '#FF6600', tournamentOnly: true },
      freeze_others: { name: 'Freeze', icon: '❄️', color: '#00D9FF', duration: 2, tournamentOnly: true },
      teleport: { name: 'Teleport', icon: '🌀', color: '#FF10F0', tournamentOnly: true },
      shrink_others: { name: 'Shrink Ray', icon: '🔫', color: '#FF0000', duration: 5, tournamentOnly: true }
    }
    return data[type]
  }
}