'use client'

import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { GameRoomService } from '@/lib/realtime/game-room-service'
import toast from 'react-hot-toast'

const Canvas = styled.canvas`
  border: 3px solid var(--neon-green);
  box-shadow: 0 0 30px var(--neon-green);
  image-rendering: pixelated;
  background: #0A0A0A;
  width: 540px;
  height: 450px;
  display: block;
`

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`

const Info = styled.div`
  font-family: 'Press Start 2P', monospace;
  color: var(--neon-green);
  font-size: 0.9rem;
`

interface MultiplayerSnakeProps {
  roomId: string
  roomCode: string
  isHost: boolean
  playerId: string
  playerName: string
  onGameEnd?: () => void
}

export default function MultiplayerSnake({
  roomId,
  roomCode,
  isHost,
  playerId,
  playerName
}: MultiplayerSnakeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [players, setPlayers] = useState<Map<string, { id: string; name: string; online_at: string }>>(new Map())
  const [roomService] = useState(() => new GameRoomService())

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = 540
    canvas.height = 450

    // Simple render function for testing
    const render = () => {
      // Clear canvas
      ctx.fillStyle = '#0A0A0A'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw grid
      ctx.strokeStyle = '#2A2A2A'
      ctx.lineWidth = 1
      const cellSize = 18
      
      for (let x = 0; x < canvas.width; x += cellSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      
      for (let y = 0; y < canvas.height; y += cellSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Draw room info
      ctx.fillStyle = '#00FF00'
      ctx.font = '14px monospace'
      ctx.fillText(`Room: ${roomCode}`, 10, 20)
      ctx.fillText(`Player: ${playerName} (${isHost ? 'Host' : 'Guest'})`, 10, 40)
      
      // Draw players
      let playerY = 60
      players.forEach((player, id) => {
        ctx.fillStyle = id === playerId ? '#00FF00' : '#00FFFF'
        ctx.fillText(`${player.name}: Connected`, 10, playerY)
        playerY += 20
      })

      // Draw waiting message if only one player
      if (players.size < 2) {
        ctx.fillStyle = '#FFFF00'
        ctx.font = '16px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('Waiting for another player...', canvas.width / 2, canvas.height / 2)
        ctx.textAlign = 'left'
      } else {
        ctx.fillStyle = '#00FF00'
        ctx.font = '16px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('Both players connected!', canvas.width / 2, canvas.height / 2)
        ctx.fillText('Game will start soon...', canvas.width / 2, canvas.height / 2 + 30)
        ctx.textAlign = 'left'
      }
    }

    // Initial render
    render()

    // Set up presence tracking
    const handlePresenceChange = (presence: Record<string, unknown>) => {
      console.log('Presence update:', presence)
      const newPlayers = new Map()
      
      Object.values(presence).forEach((presenceData) => {
        if (Array.isArray(presenceData) && presenceData.length > 0) {
          const playerData = presenceData[0] as { id: string; name: string; online_at: string }
          newPlayers.set(playerData.id, playerData)
        }
      })
      
      setPlayers(newPlayers)
      render()
    }
    
    roomService.onPresenceChanged(handlePresenceChange)

    // Join the room channel
    roomService.joinRoomChannel(roomId).then(() => {
      console.log('Joined room channel successfully')
      toast.success('Connected to game room!')
    }).catch(error => {
      console.error('Failed to join room channel:', error)
      toast.error('Failed to connect to game room')
    })

    // Cleanup
    return () => {
      roomService.leaveRoom()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, roomCode, isHost, playerId, playerName, roomService])

  return (
    <Container>
      <Info>Multiplayer Snake - Room: {roomCode}</Info>
      <Canvas ref={canvasRef} />
      <Info>Press ESC to leave game</Info>
    </Container>
  )
}