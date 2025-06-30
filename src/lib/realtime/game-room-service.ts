import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js'

export interface GameRoom {
  id: string
  room_code: string
  host_id: string
  guest_id: string | null
  game_type: string
  game_mode: string
  status: 'waiting' | 'ready' | 'playing' | 'finished' | 'cancelled'
  settings: Record<string, unknown>
  host_ready: boolean
  guest_ready: boolean
  created_at: string
  started_at: string | null
  ended_at: string | null
}

export interface GameState {
  id: string
  room_id: string
  player_id: string
  state: Record<string, unknown>
  sequence_number: number
  created_at: string
}

export interface GameEvent {
  id: string
  room_id: string
  event_type: string
  event_data: Record<string, unknown>
  created_by: string
  created_at: string
}

export interface PlayerPresence {
  id: string
  name: string
  online_at: string
  is_ready: boolean
}

export class GameRoomService {
  private supabase = createClient()
  private channel: RealtimeChannel | null = null
  private roomId: string | null = null
  private onStateUpdate: ((state: GameState) => void) | null = null
  private onEventReceived: ((event: GameEvent) => void) | null = null
  private onPresenceUpdate: ((presence: RealtimePresenceState<PlayerPresence>) => void) | null = null
  private onRoomUpdate: ((room: GameRoom) => void) | null = null

  async createRoom(gameType: string = 'snake', settings: Record<string, unknown> = {}): Promise<{ roomId: string; roomCode: string }> {
    const { data, error } = await this.supabase
      .rpc('create_game_room', {
        p_game_type: gameType,
        p_game_mode: 'pvp',
        p_settings: settings
      })

    if (error) throw error
    if (!data || data.length === 0) throw new Error('Failed to create room')

    const room = data[0]
    await this.joinRoomChannel(room.room_id)
    
    return {
      roomId: room.room_id,
      roomCode: room.room_code
    }
  }

  async joinRoom(roomCode: string): Promise<string> {
    const { data, error } = await this.supabase
      .rpc('join_game_room', {
        p_room_code: roomCode
      })

    if (error) throw error
    if (!data || data.length === 0) throw new Error('Failed to join room')

    const result = data[0]
    if (!result.success) {
      throw new Error(result.message)
    }

    await this.joinRoomChannel(result.room_id)
    return result.room_id
  }

  async getRoom(roomId: string): Promise<GameRoom | null> {
    const { data, error } = await this.supabase
      .from('game_rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (error) {
      console.error('Error fetching room:', error)
      return null
    }

    return data
  }

  async updateRoomStatus(roomId: string, status: GameRoom['status']): Promise<void> {
    const updates: Partial<GameRoom> = { status } as Partial<GameRoom>
    
    if (status === 'playing') {
      updates.started_at = new Date().toISOString()
    } else if (status === 'finished' || status === 'cancelled') {
      updates.ended_at = new Date().toISOString()
    }

    const { error } = await this.supabase
      .from('game_rooms')
      .update(updates)
      .eq('id', roomId)

    if (error) throw error
  }

  async setPlayerReady(roomId: string, playerId: string, ready: boolean): Promise<void> {
    const room = await this.getRoom(roomId)
    if (!room) throw new Error('Room not found')

    const updateField = room.host_id === playerId ? 'host_ready' : 'guest_ready'
    
    const { error } = await this.supabase
      .from('game_rooms')
      .update({ [updateField]: ready })
      .eq('id', roomId)

    if (error) throw error

    // Check if both players are ready
    const updatedRoom = await this.getRoom(roomId)
    if (updatedRoom && updatedRoom.host_ready && updatedRoom.guest_ready) {
      await this.updateRoomStatus(roomId, 'ready')
    }
  }

  async joinRoomChannel(roomId: string) {
    this.roomId = roomId
    
    // Leave existing channel if any
    if (this.channel) {
      await this.supabase.removeChannel(this.channel)
    }

    // Create new channel for this room
    this.channel = this.supabase.channel(`game_room:${roomId}`)

    // Subscribe to room updates
    this.channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_rooms',
        filter: `id=eq.${roomId}`
      }, (payload) => {
        if (this.onRoomUpdate && payload.new) {
          this.onRoomUpdate(payload.new as GameRoom)
        }
      })
      // Subscribe to game state updates
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'game_states',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        if (this.onStateUpdate && payload.new) {
          const state = payload.new as GameState
          // Only process states from other players
          this.onStateUpdate(state)
        }
      })
      // Subscribe to game events
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'game_events',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        if (this.onEventReceived && payload.new) {
          this.onEventReceived(payload.new as GameEvent)
        }
      })
      // Subscribe to presence
      .on('presence', { event: 'sync' }, () => {
        if (this.onPresenceUpdate) {
          const state = this.channel!.presenceState()
          this.onPresenceUpdate(state as RealtimePresenceState<PlayerPresence>)
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && this.channel) {
          // Track user presence
          const user = await this.getCurrentUser()
          if (user) {
            const presenceData: PlayerPresence = {
              id: user.id,
              name: user.user_metadata?.username || 'Player',
              online_at: new Date().toISOString(),
              is_ready: false
            }
            console.log('Tracking presence:', presenceData)
            await this.channel.track(presenceData)
          }
        }
      })
  }

  async sendGameState(state: Record<string, unknown>, sequenceNumber: number): Promise<void> {
    if (!this.roomId) throw new Error('Not connected to a room')

    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await this.supabase
      .from('game_states')
      .insert({
        room_id: this.roomId,
        player_id: user.id,
        state,
        sequence_number: sequenceNumber
      })

    if (error) throw error
  }

  async sendGameEvent(eventType: string, eventData: Record<string, unknown>): Promise<void> {
    if (!this.roomId) throw new Error('Not connected to a room')

    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await this.supabase
      .from('game_events')
      .insert({
        room_id: this.roomId,
        event_type: eventType,
        event_data: eventData,
        created_by: user.id
      })

    if (error) throw error
  }

  async updatePresence(data: Partial<PlayerPresence>): Promise<void> {
    if (!this.channel) return

    const user = await this.getCurrentUser()
    if (!user) return

    await this.channel.track({
      id: user.id,
      name: user.user_metadata?.username || 'Player',
      online_at: new Date().toISOString(),
      is_ready: false,
      ...data
    })
  }

  onStateUpdated(callback: (state: GameState) => void) {
    this.onStateUpdate = callback
  }

  onEventOccurred(callback: (event: GameEvent) => void) {
    this.onEventReceived = callback
  }

  onPresenceChanged(callback: (presence: RealtimePresenceState<PlayerPresence>) => void) {
    this.onPresenceUpdate = callback
  }

  onRoomUpdated(callback: (room: GameRoom) => void) {
    this.onRoomUpdate = callback
  }

  async leaveRoom(): Promise<void> {
    if (this.channel) {
      await this.supabase.removeChannel(this.channel)
      this.channel = null
    }
    this.roomId = null
    this.onStateUpdate = null
    this.onEventReceived = null
    this.onPresenceUpdate = null
    this.onRoomUpdate = null
  }

  private async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser()
    return user
  }
}