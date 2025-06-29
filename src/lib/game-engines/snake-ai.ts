import { Direction, Position, SnakePlayer } from '@/types/snake'

export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'insane'

export class SnakeAI {
  private targetFood: Position | null = null
  private difficulty: AIDifficulty = 'medium'
  private reactionDelay: number = 0
  private lastMoveTime: number = 0

  constructor(difficulty: AIDifficulty = 'medium') {
    this.difficulty = difficulty
    this.setReactionDelay()
  }

  private setReactionDelay() {
    switch (this.difficulty) {
      case 'easy':
        this.reactionDelay = 300 // 300ms delay
        break
      case 'medium':
        this.reactionDelay = 150 // 150ms delay
        break
      case 'hard':
        this.reactionDelay = 50 // 50ms delay
        break
      case 'insane':
        this.reactionDelay = 0 // No delay, perfect play
        break
    }
  }

  public getNextDirection(
    player: SnakePlayer,
    food: Position[],
    boardWidth: number,
    boardHeight: number,
    otherPlayers: SnakePlayer[],
    currentTime: number = Date.now()
  ): Direction {
    // Apply reaction delay based on difficulty
    if (currentTime - this.lastMoveTime < this.reactionDelay) {
      return player.direction
    }
    this.lastMoveTime = currentTime

    // Easy mode: Sometimes make mistakes
    if (this.difficulty === 'easy' && Math.random() < 0.2) {
      const randomDirections = this.getValidDirections(player, boardWidth, boardHeight, otherPlayers)
      if (randomDirections.length > 0) {
        return randomDirections[Math.floor(Math.random() * randomDirections.length)]
      }
    }

    const head = player.snake[0]
    
    // Find nearest food
    if (!this.targetFood || !food.some(f => f.x === this.targetFood!.x && f.y === this.targetFood!.y)) {
      this.targetFood = this.findNearestFood(head, food)
    }

    if (!this.targetFood) return player.direction

    // Calculate best direction to reach food
    const validDirections = this.getValidDirections(player, boardWidth, boardHeight, otherPlayers)

    if (validDirections.length === 0) {
      // No safe moves, try to survive
      return this.getSurvivalDirection(player, boardWidth, boardHeight, otherPlayers)
    }

    // Choose direction that gets closer to food
    let bestDirection = player.direction
    let minDistance = Infinity

    for (const dir of validDirections) {
      const newPos = this.getNewPosition(head, dir)
      const distance = this.getDistance(newPos, this.targetFood)
      
      if (distance < minDistance) {
        minDistance = distance
        bestDirection = dir
      }
    }

    // Medium mode: Good pathfinding but not perfect
    if (this.difficulty === 'medium' && Math.random() < 0.1) {
      // Occasionally pick a suboptimal but safe move
      const alternativeDirections = validDirections.filter(dir => dir !== bestDirection)
      if (alternativeDirections.length > 0) {
        return alternativeDirections[Math.floor(Math.random() * alternativeDirections.length)]
      }
    }

    return bestDirection
  }

  private getValidDirections(
    player: SnakePlayer,
    boardWidth: number,
    boardHeight: number,
    otherPlayers: SnakePlayer[]
  ): Direction[] {
    const head = player.snake[0]
    const possibleDirections: Direction[] = ['up', 'down', 'left', 'right']
    return possibleDirections.filter(dir => 
      this.isValidDirection(player.direction, dir) && 
      this.isSafeMove(head, dir, player, boardWidth, boardHeight, otherPlayers)
    )
  }

  private findNearestFood(head: Position, food: Position[]): Position | null {
    if (food.length === 0) return null

    // For insane difficulty, also consider future positions of other snakes
    if (this.difficulty === 'insane') {
      // Advanced prediction logic could go here
    }

    let nearest = food[0]
    let minDistance = this.getDistance(head, nearest)

    for (const f of food) {
      const distance = this.getDistance(head, f)
      if (distance < minDistance) {
        minDistance = distance
        nearest = f
      }
    }

    return nearest
  }

  private getDistance(a: Position, b: Position): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
  }

  private isValidDirection(current: Direction, next: Direction): boolean {
    const opposites = {
      up: 'down',
      down: 'up',
      left: 'right',
      right: 'left'
    }
    return opposites[current] !== next
  }

  private getNewPosition(pos: Position, direction: Direction): Position {
    const newPos = { ...pos }
    switch (direction) {
      case 'up': newPos.y--; break
      case 'down': newPos.y++; break
      case 'left': newPos.x--; break
      case 'right': newPos.x++; break
    }
    return newPos
  }

  private isSafeMove(
    head: Position,
    direction: Direction,
    player: SnakePlayer,
    boardWidth: number,
    boardHeight: number,
    otherPlayers: SnakePlayer[]
  ): boolean {
    const newPos = this.getNewPosition(head, direction)

    // Check walls
    if (newPos.x < 0 || newPos.x >= boardWidth || newPos.y < 0 || newPos.y >= boardHeight) {
      return false
    }

    // Check self collision
    for (let i = 1; i < player.snake.length - 1; i++) {
      if (player.snake[i].x === newPos.x && player.snake[i].y === newPos.y) {
        return false
      }
    }

    // Check other player collision
    for (const other of otherPlayers) {
      if (other.id === player.id || !other.alive) continue
      for (const segment of other.snake) {
        if (segment.x === newPos.x && segment.y === newPos.y) {
          return false
        }
      }
    }

    return true
  }

  private getSurvivalDirection(
    player: SnakePlayer,
    boardWidth: number,
    boardHeight: number,
    otherPlayers: SnakePlayer[]
  ): Direction {
    const possibleDirections: Direction[] = ['up', 'down', 'left', 'right']
    
    // Try each direction and pick the one with most open space
    let bestDirection = player.direction
    let maxOpenSpace = 0

    for (const dir of possibleDirections) {
      if (!this.isValidDirection(player.direction, dir)) continue
      
      const head = player.snake[0]
      if (this.isSafeMove(head, dir, player, boardWidth, boardHeight, otherPlayers)) {
        const openSpace = this.countOpenSpace(
          this.getNewPosition(head, dir),
          player,
          boardWidth,
          boardHeight,
          otherPlayers
        )
        
        if (openSpace > maxOpenSpace) {
          maxOpenSpace = openSpace
          bestDirection = dir
        }
      }
    }

    return bestDirection
  }

  private countOpenSpace(
    start: Position,
    player: SnakePlayer,
    boardWidth: number,
    boardHeight: number,
    otherPlayers: SnakePlayer[],
    maxDepth: number = 10
  ): number {
    const visited = new Set<string>()
    const queue: Position[] = [start]
    let count = 0

    while (queue.length > 0 && count < maxDepth) {
      const pos = queue.shift()!
      const key = `${pos.x},${pos.y}`
      
      if (visited.has(key)) continue
      visited.add(key)
      count++

      // Check adjacent cells
      const directions: Direction[] = ['up', 'down', 'left', 'right']
      for (const dir of directions) {
        const newPos = this.getNewPosition(pos, dir)
        const newKey = `${newPos.x},${newPos.y}`
        
        if (!visited.has(newKey) && 
            this.isPositionEmpty(newPos, player, boardWidth, boardHeight, otherPlayers)) {
          queue.push(newPos)
        }
      }
    }

    return count
  }

  private isPositionEmpty(
    pos: Position,
    player: SnakePlayer,
    boardWidth: number,
    boardHeight: number,
    otherPlayers: SnakePlayer[]
  ): boolean {
    // Check walls
    if (pos.x < 0 || pos.x >= boardWidth || pos.y < 0 || pos.y >= boardHeight) {
      return false
    }

    // Check self
    for (const segment of player.snake) {
      if (segment.x === pos.x && segment.y === pos.y) {
        return false
      }
    }

    // Check others
    for (const other of otherPlayers) {
      if (other.id === player.id || !other.alive) continue
      for (const segment of other.snake) {
        if (segment.x === pos.x && segment.y === pos.y) {
          return false
        }
      }
    }

    return true
  }
}